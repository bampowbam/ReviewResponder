const API_BASE_URL = 'http://localhost:3001/api';

class WebhookService {
  constructor() {
    this.isListening = false;
    this.eventSource = null;
    this.listeners = new Map();
  }

  // Start listening for real-time review notifications
  startListening() {
    if (this.isListening) {
      console.log('⚠️ Webhook service already listening');
      return;
    }

    try {
      // Set up Server-Sent Events for real-time notifications
      this.eventSource = new EventSource(`${API_BASE_URL}/webhooks/stream`);
      
      this.eventSource.onopen = () => {
        this.isListening = true;
        console.log('🔔 Started listening for real-time review notifications');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data);
        } catch (error) {
          console.error('Error parsing webhook data:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Webhook connection error:', error);
        this.isListening = false;
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!this.isListening) {
            console.log('🔄 Attempting to reconnect to webhook stream...');
            this.startListening();
          }
        }, 5000);
      };

    } catch (error) {
      console.error('Error starting webhook listener:', error);
    }
  }

  // Stop listening for notifications
  stopListening() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isListening = false;
    console.log('🛑 Stopped listening for review notifications');
  }

  // Handle incoming webhook events
  handleIncomingEvent(data) {
    const { type, payload } = data;
    
    console.log(`🔔 Received webhook event: ${type}`);
    
    switch (type) {
      case 'new_review':
        this.handleNewReview(payload);
        break;
      case 'automation_success':
        this.handleAutomationSuccess(payload);
        break;
      case 'automation_error':
        this.handleAutomationError(payload);
        break;
      default:
        console.log('Unknown webhook event type:', type);
    }
  }

  // Handle new review notification
  handleNewReview(reviewData) {
    console.log('🆕 New review received:', reviewData);
    
    // Show browser notification
    this.showNotification(
      `⭐ New ${reviewData.starRating}-star review!`,
      `From: ${reviewData.reviewer?.displayName || 'Anonymous customer'}`,
      'new-review'
    );

    // Trigger listeners
    this.notifyListeners('new_review', reviewData);
  }

  // Handle automation success notification
  handleAutomationSuccess(data) {
    console.log('✅ Automation success:', data);
    
    this.showNotification(
      '🤖 AI Response Posted',
      `Responded to ${data.reviewRating}⭐ review automatically`,
      'automation-success'
    );

    this.notifyListeners('automation_success', data);
  }

  // Handle automation error notification
  handleAutomationError(data) {
    console.log('❌ Automation error:', data);
    
    this.showNotification(
      '⚠️ Automation Failed',
      `Failed to respond to review: ${data.error}`,
      'automation-error'
    );

    this.notifyListeners('automation_error', data);
  }

  // Show browser notification
  showNotification(title, body, tag) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
        badge: '/favicon.ico',
        requireInteraction: true
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Browser notifications enabled');
        return true;
      } else {
        console.log('❌ Browser notifications denied');
        return false;
      }
    }
    return false;
  }

  // Add event listener
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  // Remove event listener
  removeEventListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify all listeners
  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in webhook listener callback:', error);
        }
      });
    }
  }

  // Get webhook stats
  getStatus() {
    return {
      isListening: this.isListening,
      hasEventSource: !!this.eventSource,
      notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported',
      activeListeners: Array.from(this.listeners.keys()).reduce((acc, key) => {
        acc[key] = this.listeners.get(key).length;
        return acc;
      }, {})
    };
  }

  // Simulate webhook for testing
  simulateWebhook(type, payload) {
    console.log(`🧪 Simulating webhook: ${type}`);
    this.handleIncomingEvent({ type, payload });
  }

  // Manual trigger for automation
  async triggerAutomation() {
    try {
      const response = await fetch(`${API_BASE_URL}/automation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            autoRespond: true,
            tone: 'professional'
          }
        }),
      });

      if (response.ok) {
        console.log('🤖 Automation triggered manually');
        return await response.json();
      } else {
        throw new Error('Failed to trigger automation');
      }
    } catch (error) {
      console.error('Error triggering automation:', error);
      throw error;
    }
  }
}

export default new WebhookService();
