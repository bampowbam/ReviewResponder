const API_BASE_URL = 'http://localhost:3001/api';

class CredentialsService {
  // Get credentials status
  async getStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/credentials/status`);
      if (!response.ok) {
        throw new Error('Failed to get credentials status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting credentials status:', error);
      throw error;
    }
  }

  // Save credentials
  async saveCredentials(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/credentials/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save credentials';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving credentials:', error);
      // Ensure we throw a proper error message
      if (error.message === '[object Object]' || typeof error.message !== 'string') {
        throw new Error('Failed to save credentials. Please check your network connection and try again.');
      }
      throw error;
    }
  }

  // Get masked credentials
  async getCredentials() {
    try {
      const response = await fetch(`${API_BASE_URL}/credentials`);
      if (!response.ok) {
        throw new Error('Failed to get credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  }

  // Test Google API connection
  async testGoogleConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/credentials/test-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to test Google connection';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing Google connection:', error);
      if (error.message === '[object Object]' || typeof error.message !== 'string') {
        throw new Error('Failed to test Google API connection. Please check your credentials.');
      }
      throw error;
    }
  }

  // Test OpenAI API connection
  async testOpenAIConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/credentials/test-openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to test OpenAI connection';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing OpenAI connection:', error);
      if (error.message === '[object Object]' || typeof error.message !== 'string') {
        throw new Error('Failed to test OpenAI API connection. Please check your API key.');
      }
      throw error;
    }
  }

  // Clear credentials
  async clearCredentials() {
    try {
      const response = await fetch(`${API_BASE_URL}/credentials`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear credentials');
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing credentials:', error);
      throw error;
    }
  }
}

export default new CredentialsService();
