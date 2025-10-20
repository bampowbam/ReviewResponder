const API_BASE_URL = 'http://localhost:3001/api';

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.status = {
      isRunning: false,
      settings: {},
      googleAuthenticated: false,
      openaiInitialized: false
    };
  }

  // Start the automation service via backend API
  async start(aiSettings) {
    try {
      console.log('🤖 Starting AI Review Automation Service...');
      
      const response = await fetch(`${API_BASE_URL}/automation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: aiSettings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start automation service');
      }

      const data = await response.json();
      this.isRunning = data.status?.isRunning || false;
      this.status = data.status || {};
      
      console.log('✅ Automation service started successfully');
      return data;
    } catch (error) {
      console.error('❌ Error starting automation service:', error);
      throw error;
    }
  }

  // Stop the automation service via backend API
  async stop() {
    try {
      console.log('🛑 Stopping AI Review Automation Service...');
      
      const response = await fetch(`${API_BASE_URL}/automation/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop automation service');
      }

      const data = await response.json();
      this.isRunning = data.status?.isRunning || false;
      this.status = data.status || {};
      
      console.log('✅ Automation service stopped successfully');
      return data;
    } catch (error) {
      console.error('❌ Error stopping automation service:', error);
      // Don't throw error for stop operation
      this.isRunning = false;
    }
  }

  // Get automation status from backend
  async getStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/automation/status`);
      
      if (!response.ok) {
        throw new Error('Failed to get automation status');
      }

      const data = await response.json();
      this.isRunning = data.isRunning || false;
      this.status = data;
      
      return data;
    } catch (error) {
      console.error('❌ Error getting automation status:', error);
      return {
        isRunning: false,
        error: error.message
      };
    }
  }

  // Update automation settings
  async updateSettings(settings) {
    try {
      const response = await fetch(`${API_BASE_URL}/automation/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const data = await response.json();
      this.status = data.status || {};
      
      console.log('✅ Automation settings updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error updating automation settings:', error);
      throw error;
    }
  }

  // Test automation with sample data
  async testAutomation(reviewData) {
    try {
      const response = await fetch(`${API_BASE_URL}/automation/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test automation');
      }

      const data = await response.json();
      console.log('✅ Automation test completed:', data.response);
      return data;
    } catch (error) {
      console.error('❌ Error testing automation:', error);
      throw error;
    }
  }

  // Check if automation is running (cached value)
  isAutomationRunning() {
    return this.isRunning;
  }

  // Get current settings (cached value)
  getCurrentSettings() {
    return this.status.settings || {};
  }
}

export default new AutomationService();
