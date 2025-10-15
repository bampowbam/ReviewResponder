import aiService from './aiService';
import googleMyBusinessService from './googleMyBusinessService';

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.lastCheckTime = null;
    this.checkInterval = 2 * 60 * 1000; // Check every 2 minutes for faster detection
    this.responseDelay = 1 * 60 * 1000; // Wait 1 minute before responding (more natural)
    this.maxResponseTime = 10 * 60 * 1000; // MUST respond within 10 minutes
    this.processedReviews = new Set(); // Track already processed reviews
    this.webhookListeners = new Map(); // For real-time webhook support
  }

  // Start the automation service
  start(aiSettings) {
    if (this.isRunning) {
      console.log('Automation service already running');
      return;
    }

    console.log('🤖 Starting AI Review Automation Service...');
    this.isRunning = true;
    this.lastCheckTime = new Date();
    
    // Start monitoring for new reviews
    this.intervalId = setInterval(() => {
      this.checkForNewReviews(aiSettings);
    }, this.checkInterval);

    // Also check immediately
    this.checkForNewReviews(aiSettings);
  }

  // Stop the automation service
  stop() {
    if (!this.isRunning) {
      console.log('Automation service not running');
      return;
    }

    console.log('🛑 Stopping AI Review Automation Service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Real-time webhook listener for instant review notifications
  setupWebhookListener(webhookUrl) {
    console.log('🔔 Setting up webhook listener for instant review notifications...');
    
    // This would typically be a server-side webhook endpoint
    // For browser-based apps, we can simulate with polling + push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      this.setupPushNotifications();
    }
    
    // Store webhook config for server deployment
    localStorage.setItem('webhookConfig', JSON.stringify({
      url: webhookUrl,
      enabled: true,
      setupTime: new Date().toISOString()
    }));
  }

  // Setup push notifications for instant alerts
  async setupPushNotifications() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Push notifications enabled for instant review alerts');
      }
    } catch (error) {
      console.log('⚠️ Push notifications not available');
    }
  }

  // Process urgent review (less than 10 minutes old)
  async processUrgentReview(review, aiSettings) {
    const reviewTime = new Date(review.createTime);
    const now = new Date();
    const timeSinceReview = now - reviewTime;
    const minutesSince = Math.round(timeSinceReview / 60000);

    // Send urgent notification
    if (Notification.permission === 'granted') {
      new Notification(`🚨 Urgent: New ${review.starRating}⭐ review needs response!`, {
        body: `Review from ${review.reviewer?.displayName || 'Customer'} posted ${minutesSince}m ago. Auto-responding soon...`,
        icon: '/favicon.ico',
        tag: 'urgent-review'
      });
    }

    console.log(`🚨 URGENT: Review needs response within ${10 - minutesSince} minutes!`);
    
    // Prioritize immediate response for urgent reviews
    if (timeSinceReview > 8 * 60 * 1000) { // If older than 8 minutes, respond immediately
      console.log('⚡ Responding immediately - less than 2 minutes left!');
      await this.generateAndSendResponse(review, aiSettings);
    } else {
      // Quick response with minimal delay
      const quickDelay = Math.min(30000, this.responseDelay); // Max 30 seconds delay
      setTimeout(() => {
        this.generateAndSendResponse(review, aiSettings);
      }, quickDelay);
    }
  }
  async checkForNewReviews(aiSettings) {
    try {
      console.log('🔍 Checking for new reviews...');
      
      // Fetch latest reviews from Google My Business
      const reviewsData = await googleMyBusinessService.getReviews();
      const reviews = reviewsData.reviews || [];

      // Filter for new reviews since last check
      const newReviews = reviews.filter(review => {
        const reviewTime = new Date(review.createTime);
        const isNew = reviewTime > this.lastCheckTime;
        const notProcessed = !this.processedReviews.has(review.name);
        const noExistingReply = !review.reply;
        
        return isNew && notProcessed && noExistingReply;
      });

      console.log(`📊 Found ${newReviews.length} new unresponded reviews`);

      // Process each new review with urgency detection
      for (const review of newReviews) {
        const reviewTime = new Date(review.createTime);
        const timeSinceReview = Date.now() - reviewTime.getTime();
        
        if (timeSinceReview > 8 * 60 * 1000) {
          // Urgent: less than 2 minutes left to respond
          await this.processUrgentReview(review, aiSettings);
        } else {
          // Normal processing
          await this.processNewReview(review, aiSettings);
        }
      }

      // Update last check time
      this.lastCheckTime = new Date();

    } catch (error) {
      console.error('❌ Error checking for new reviews:', error);
    }
  }

  // Process a single new review
  async processNewReview(review, aiSettings) {
    try {
      const reviewTime = new Date(review.createTime);
      const now = new Date();
      const timeSinceReview = now - reviewTime;

      console.log(`🔄 Processing new review from ${review.reviewer?.displayName || 'Anonymous'}`);
      console.log(`⏰ Review posted ${Math.round(timeSinceReview / 60000)} minutes ago`);

      // Mark as being processed
      this.processedReviews.add(review.name);

      // Check if we're still within the response window
      if (timeSinceReview > this.maxResponseTime) {
        console.log('⚠️ Review is older than 10 minutes, skipping auto-response');
        return;
      }

      // Calculate when to respond (between 2-10 minutes after review)
      const timeToWait = Math.max(0, this.responseDelay - timeSinceReview);
      const remainingTime = this.maxResponseTime - timeSinceReview;

      if (timeToWait > remainingTime) {
        console.log('⚠️ Not enough time left to wait and respond, responding immediately');
        await this.generateAndSendResponse(review, aiSettings);
      } else {
        console.log(`⏳ Waiting ${Math.round(timeToWait / 60000)} minutes before responding...`);
        setTimeout(() => {
          this.generateAndSendResponse(review, aiSettings);
        }, timeToWait);
      }

    } catch (error) {
      console.error('❌ Error processing review:', error);
    }
  }

  // Generate and send AI response
  async generateAndSendResponse(review, aiSettings) {
    try {
      console.log(`🤖 Generating AI response for review: "${review.comment?.substring(0, 50)}..."`);

      // Transform review to our format
      const transformedReview = {
        id: review.name,
        rating: review.starRating || 0,
        text: review.comment || '',
        reviewerName: review.reviewer?.displayName || 'Valued Customer'
      };

      // Generate AI response
      const aiResult = await aiService.generateResponse(transformedReview, {
        tone: aiSettings.tone,
        businessType: aiSettings.businessInfo?.type || 'business',
        customInstructions: aiSettings.customInstructions || ''
      });

      let responseText;
      if (aiResult.success) {
        responseText = aiResult.response;
        console.log(`✅ AI response generated (confidence: ${aiResult.confidence})`);
      } else {
        responseText = aiResult.fallbackResponse;
        console.log(`⚠️ Using fallback response: ${aiResult.error}`);
      }

      // Send response to Google My Business
      await googleMyBusinessService.replyToReview(review.name, responseText);
      
      const reviewRating = review.starRating || 0;
      const ratingText = reviewRating >= 4 ? 'positive' : reviewRating <= 2 ? 'negative' : 'neutral';
      
      console.log(`🎉 Successfully posted AI response to ${ratingText} ${reviewRating}-star review!`);
      console.log(`💬 Response: "${responseText.substring(0, 100)}..."`);

      // Log the automation success
      this.logAutomationEvent('SUCCESS', review, responseText, aiResult.confidence);

    } catch (error) {
      console.error('❌ Error generating/sending response:', error);
      this.logAutomationEvent('ERROR', review, null, 0, error.message);
    }
  }

  // Log automation events for monitoring
  logAutomationEvent(status, review, response, confidence, errorMessage = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status,
      reviewId: review.name,
      reviewerName: review.reviewer?.displayName || 'Anonymous',
      reviewRating: review.starRating,
      reviewText: review.comment?.substring(0, 100),
      response: response?.substring(0, 100),
      confidence,
      error: errorMessage
    };

    // Store in localStorage for now (in production, send to analytics service)
    const logs = JSON.parse(localStorage.getItem('automationLogs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('automationLogs', JSON.stringify(logs));
    
    console.log('📝 Automation event logged:', status);
  }

  // Get automation statistics
  getStats() {
    const logs = JSON.parse(localStorage.getItem('automationLogs') || '[]');
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => new Date(log.timestamp) > last24Hours);
    const successful = recentLogs.filter(log => log.status === 'SUCCESS').length;
    const failed = recentLogs.filter(log => log.status === 'ERROR').length;
    
    return {
      isRunning: this.isRunning,
      totalProcessed: recentLogs.length,
      successful,
      failed,
      successRate: recentLogs.length > 0 ? (successful / recentLogs.length * 100).toFixed(1) : 0,
      lastCheck: this.lastCheckTime?.toISOString(),
      checkInterval: this.checkInterval / 60000 // in minutes
    };
  }

  // Get recent automation logs
  getLogs(limit = 20) {
    const logs = JSON.parse(localStorage.getItem('automationLogs') || '[]');
    return logs.slice(-limit).reverse(); // Most recent first
  }
}

export default new AutomationService();
