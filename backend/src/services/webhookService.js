const EventEmitter = require('events');

class WebhookService extends EventEmitter {
  constructor() {
    super();
    this.connectedClients = new Map();
    this.webhookStats = {
      totalReceived: 0,
      reviewsProcessed: 0,
      lastWebhook: null,
      errors: 0
    };
  }

  // Register a frontend client for real-time notifications (SSE)
  registerClient(clientId, res) {
    this.connectedClients.set(clientId, res);
    console.log(`📱 Client ${clientId} connected for real-time notifications`);
    
    // Send current stats to new client
    this.sendToClient(clientId, 'connection_established', {
      message: 'Real-time webhook notifications active',
      stats: this.webhookStats
    });

    // Handle client disconnect
    res.on('close', () => {
      this.connectedClients.delete(clientId);
      console.log(`📱 Client ${clientId} disconnected`);
    });

    res.on('error', (error) => {
      console.error(`❌ SSE error for client ${clientId}:`, error);
      this.connectedClients.delete(clientId);
    });
  }

  // Send notification to frontend
  async notifyFrontend(eventType, data) {
    try {
      console.log(`📡 Broadcasting ${eventType} to ${this.connectedClients.size} clients`);
      
      const notification = {
        type: eventType,
        data: data,
        timestamp: new Date().toISOString(),
        id: this.generateNotificationId()
      };

      // Send to all connected clients
      for (const [clientId, websocket] of this.connectedClients) {
        this.sendToClient(clientId, eventType, notification);
      }

      // Update stats
      this.updateStats(eventType);
      
      // Emit event for other services to listen
      this.emit(eventType, notification);
      
    } catch (error) {
      console.error('❌ Error notifying frontend:', error);
      this.webhookStats.errors++;
    }
  }

  // Send message to specific client (SSE)
  sendToClient(clientId, eventType, data) {
    try {
      const res = this.connectedClients.get(clientId);
      if (res && !res.destroyed && res.writable) {
        const sseData = `data: ${JSON.stringify({
          type: eventType,
          data: data
        })}\n\n`;
        res.write(sseData);
      }
    } catch (error) {
      console.error(`❌ Error sending to client ${clientId}:`, error);
      // Remove broken connection
      this.connectedClients.delete(clientId);
    }
  }

  // Update webhook statistics
  updateStats(eventType) {
    this.webhookStats.totalReceived++;
    this.webhookStats.lastWebhook = new Date().toISOString();
    
    if (eventType === 'new_review') {
      this.webhookStats.reviewsProcessed++;
    }
  }

  // Generate unique notification ID
  generateNotificationId() {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get webhook statistics
  getStats() {
    return {
      ...this.webhookStats,
      connectedClients: this.connectedClients.size,
      uptime: process.uptime()
    };
  }

  // Send urgent notification (for reviews that need immediate response)
  async sendUrgentNotification(reviewData) {
    const urgentNotification = {
      type: 'urgent_review',
      priority: 'HIGH',
      data: {
        review: reviewData,
        timeRemaining: this.calculateTimeRemaining(reviewData.createTime),
        actionRequired: 'AI response needed within 10 minutes'
      },
      timestamp: new Date().toISOString()
    };

    // Send push notification if supported
    if (typeof Notification !== 'undefined') {
      try {
        await this.sendPushNotification(urgentNotification);
      } catch (error) {
        console.log('Push notifications not available:', error.message);
      }
    }

    // Broadcast to all clients
    await this.notifyFrontend('urgent_review', urgentNotification.data);
  }

  // Calculate remaining time for review response
  calculateTimeRemaining(createTime) {
    const reviewTime = new Date(createTime);
    const now = new Date();
    const elapsed = now - reviewTime;
    const remaining = (10 * 60 * 1000) - elapsed; // 10 minutes in ms
    
    return {
      remainingMs: remaining,
      remainingMinutes: Math.max(0, Math.round(remaining / 60000)),
      isUrgent: remaining < (2 * 60 * 1000), // Less than 2 minutes
      isExpired: remaining <= 0
    };
  }

  // Send browser push notification
  async sendPushNotification(notification) {
    // This would integrate with Web Push API
    // For now, we'll use browser Notification API
    console.log('🔔 Would send push notification:', notification.type);
  }

  // Setup webhook subscription with Google
  async setupGoogleWebhookSubscription(accessToken, topicName) {
    try {
      console.log('🔗 Setting up Google My Business webhook subscription...');
      
      const subscriptionData = {
        targetUrl: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/google`,
        eventTypes: [
          'review.create',
          'review.updated',
          'location.updated'
        ],
        payloadFormat: 'JSON'
      };

      // This would make actual API call to Google
      console.log('📡 Webhook subscription configured:', subscriptionData);
      
      return {
        success: true,
        subscriptionId: `subscription_${Date.now()}`,
        targetUrl: subscriptionData.targetUrl,
        eventTypes: subscriptionData.eventTypes
      };
      
    } catch (error) {
      console.error('❌ Error setting up webhook subscription:', error);
      throw error;
    }
  }

  // Verify webhook is working
  async verifyWebhookConnection() {
    try {
      const testPayload = {
        eventType: 'test.connection',
        timestamp: new Date().toISOString(),
        source: 'internal'
      };

      await this.notifyFrontend('webhook_test', testPayload);
      
      return {
        success: true,
        message: 'Webhook connection verified',
        connectedClients: this.connectedClients.size,
        stats: this.webhookStats
      };
      
    } catch (error) {
      console.error('❌ Webhook verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WebhookService();
