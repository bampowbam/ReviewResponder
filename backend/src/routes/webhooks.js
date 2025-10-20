const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const webhookService = require('../services/webhookService');
const automationService = require('../services/automationService');

// Server-Sent Events endpoint for real-time notifications
router.get('/stream', (req, res) => {
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Generate unique client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`📡 SSE client connected: ${clientId}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection_established',
    payload: {
      clientId,
      message: 'Real-time notifications active',
      timestamp: new Date().toISOString()
    }
  })}\n\n`);

  // Register client with webhook service (pass the response object directly)
  webhookService.registerClient(clientId, res);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`📡 SSE client disconnected: ${clientId}`);
    webhookService.connectedClients.delete(clientId);
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        payload: { timestamp: new Date().toISOString() }
      })}\n\n`);
    } catch (error) {
      clearInterval(heartbeat);
      console.log(`💔 Heartbeat failed for client ${clientId}`);
    }
  }, 30000); // Every 30 seconds

  // Clean up interval on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Middleware for webhook signature verification
const verifyGoogleWebhook = (req, res, next) => {
  const signature = req.headers['x-goog-signature'];
  const webhookSecret = process.env.GOOGLE_WEBHOOK_SECRET;
  
  if (!signature || !webhookSecret) {
    console.log('⚠️ Missing webhook signature or secret');
    return res.status(401).json({ error: 'Unauthorized - Missing signature' });
  }

  try {
    // Google uses HMAC SHA-256 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )) {
      console.log('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Unauthorized - Invalid signature' });
    }
    
    console.log('✅ Webhook signature verified');
    next();
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return res.status(401).json({ error: 'Unauthorized - Signature verification failed' });
  }
};

// Google My Business webhook endpoint
router.post('/google', verifyGoogleWebhook, async (req, res) => {
  try {
    console.log('📡 Received Google My Business webhook');
    console.log('Headers:', req.headers);
    
    // Parse the webhook payload
    const payload = JSON.parse(req.body);
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    
    // Handle different types of notifications
    const notificationType = payload.eventType || payload.message?.attributes?.eventType;
    
    switch (notificationType) {
      case 'review.create':
      case 'review.updated':
        await handleReviewNotification(payload);
        break;
      
      case 'location.updated':
        await handleLocationNotification(payload);
        break;
      
      case 'account.updated':
        await handleAccountNotification(payload);
        break;
      
      default:
        console.log(`🔍 Unknown notification type: ${notificationType}`);
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ 
      status: 'received',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error processing Google webhook:', error);
    
    // Still return 200 to prevent Google from retrying
    res.status(200).json({ 
      status: 'error',
      message: 'Error processed but acknowledged'
    });
  }
});

// Handle review creation/update notifications
async function handleReviewNotification(payload) {
  try {
    console.log('📝 Processing review notification...');
    
    // Extract review data from the payload
    const reviewData = payload.message?.data || payload.data;
    const locationName = payload.message?.attributes?.locationName;
    const reviewName = payload.message?.attributes?.reviewName;
    
    if (!reviewData) {
      console.log('⚠️ No review data found in payload');
      return;
    }
    
    // Decode base64 data if needed
    let decodedData = reviewData;
    if (typeof reviewData === 'string') {
      try {
        decodedData = JSON.parse(Buffer.from(reviewData, 'base64').toString());
      } catch (e) {
        decodedData = reviewData;
      }
    }
    
    console.log('📊 Review data:', decodedData);
    
    // Check if this is a new review that needs a response
    if (decodedData.starRating && !decodedData.reply) {
      console.log('🚨 NEW REVIEW DETECTED - Triggering automation!');
      console.log(`⭐ Rating: ${decodedData.starRating}/5`);
      console.log(`👤 Reviewer: ${decodedData.reviewer?.displayName || 'Anonymous'}`);
      
      // Trigger immediate automation for this review
      await automationService.processWebhookReview({
        name: reviewName,
        locationName: locationName,
        ...decodedData,
        createTime: decodedData.createTime || new Date().toISOString()
      });
      
      // Send real-time notification to frontend if connected
      await webhookService.notifyFrontend('new_review', {
        reviewData: decodedData,
        locationName,
        reviewName,
        urgent: true
      });
    }
    
  } catch (error) {
    console.error('❌ Error handling review notification:', error);
  }
}

// Handle location update notifications
async function handleLocationNotification(payload) {
  console.log('📍 Processing location notification...');
  
  // Handle location updates (business info changes, etc.)
  const locationData = payload.message?.data || payload.data;
  
  // Notify frontend about location changes
  await webhookService.notifyFrontend('location_updated', {
    locationData,
    timestamp: new Date().toISOString()
  });
}

// Handle account update notifications
async function handleAccountNotification(payload) {
  console.log('👤 Processing account notification...');
  
  // Handle account-level changes
  const accountData = payload.message?.data || payload.data;
  
  // Notify frontend about account changes
  await webhookService.notifyFrontend('account_updated', {
    accountData,
    timestamp: new Date().toISOString()
  });
}

// Webhook subscription verification endpoint
router.get('/google/verify', (req, res) => {
  const challenge = req.query.challenge;
  
  if (challenge) {
    console.log('✅ Webhook verification successful');
    res.status(200).send(challenge);
  } else {
    res.status(400).json({ error: 'Missing challenge parameter' });
  }
});

// Test endpoint for webhook functionality
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Testing webhook functionality...');
    
    // Simulate a new review webhook
    const testReview = {
      eventType: 'review.create',
      message: {
        data: {
          starRating: 5,
          comment: 'Test review for webhook automation!',
          reviewer: {
            displayName: 'Test User'
          },
          createTime: new Date().toISOString()
        },
        attributes: {
          locationName: 'locations/test-location',
          reviewName: 'accounts/test-account/locations/test-location/reviews/test-review'
        }
      }
    };
    
    await handleReviewNotification(testReview);
    
    res.status(200).json({
      status: 'success',
      message: 'Test webhook processed successfully',
      testData: testReview
    });
    
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
