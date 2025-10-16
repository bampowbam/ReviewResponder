const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhookService');
const automationService = require('../services/automationService');

// Get webhook statistics
router.get('/webhook-stats', (req, res) => {
  try {
    const stats = webhookService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get automation status
router.get('/automation-status', (req, res) => {
  try {
    const status = automationService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test automation with sample review
router.post('/test-automation', async (req, res) => {
  try {
    const testReview = {
      name: 'accounts/test/locations/test/reviews/test-' + Date.now(),
      starRating: req.body.rating || 5,
      comment: req.body.comment || 'This is a test review for automation testing.',
      reviewer: {
        displayName: req.body.reviewerName || 'Test User'
      },
      createTime: new Date().toISOString()
    };

    console.log('🧪 Testing automation with sample review...');
    
    // Process test review
    await automationService.processWebhookReview(testReview);
    
    res.json({
      success: true,
      message: 'Test automation completed',
      testReview: testReview
    });
    
  } catch (error) {
    console.error('❌ Test automation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Setup Google webhook subscription
router.post('/setup-webhook', async (req, res) => {
  try {
    const { accessToken, topicName } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const subscription = await webhookService.setupGoogleWebhookSubscription(
      accessToken, 
      topicName
    );
    
    res.json({
      success: true,
      data: subscription
    });
    
  } catch (error) {
    console.error('❌ Webhook setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify webhook connection
router.get('/verify-webhook', async (req, res) => {
  try {
    const result = await webhookService.verifyWebhookConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
