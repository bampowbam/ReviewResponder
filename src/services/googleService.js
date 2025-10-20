const API_BASE_URL = 'http://localhost:3001/api';

class GoogleService {
  constructor() {
    this.isAuthenticated = false;
    this.accounts = [];
    this.locations = [];
  }

  // Initialize Google authentication
  async initializeAuth() {
    try {
      const response = await fetch(`${API_BASE_URL}/google/auth/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize Google authentication');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error initializing Google auth:', error);
      throw error;
    }
  }

  // Handle OAuth callback
  async handleAuthCallback(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/google/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete authentication');
      }

      const data = await response.json();
      this.isAuthenticated = data.authenticated;
      return data;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw error;
    }
  }

  // Get authentication status
  async getAuthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/google/auth/status`);
      
      if (!response.ok) {
        throw new Error('Failed to get authentication status');
      }

      const data = await response.json();
      this.isAuthenticated = data.isAuthenticated;
      return data;
    } catch (error) {
      console.error('Error getting auth status:', error);
      throw error;
    }
  }

  // Get business accounts
  async getAccounts() {
    try {
      const response = await fetch(`${API_BASE_URL}/google/accounts`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch accounts');
      }

      const data = await response.json();
      this.accounts = data.accounts;
      return data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  // Get locations for an account
  async getLocations(accountId) {
    try {
      const response = await fetch(`${API_BASE_URL}/google/accounts/${accountId}/locations`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch locations');
      }

      const data = await response.json();
      this.locations = data.locations;
      return data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  // Get reviews for a location
  async getReviews(locationName, pageSize = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/google/locations/${encodeURIComponent(locationName)}/reviews?pageSize=${pageSize}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reviews');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  // Reply to a review
  async replyToReview(reviewName, replyText) {
    try {
      const response = await fetch(`${API_BASE_URL}/google/reviews/${encodeURIComponent(reviewName)}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reply to review');
      }

      return await response.json();
    } catch (error) {
      console.error('Error replying to review:', error);
      throw error;
    }
  }

  // Update a review reply
  async updateReply(reviewName, replyText) {
    try {
      const response = await fetch(`${API_BASE_URL}/google/reviews/${encodeURIComponent(reviewName)}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replyText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reply');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating reply:', error);
      throw error;
    }
  }

  // Delete a review reply
  async deleteReply(reviewName) {
    try {
      const response = await fetch(`${API_BASE_URL}/google/reviews/${encodeURIComponent(reviewName)}/reply`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reply');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  }

  // Check if authenticated
  isAuth() {
    return this.isAuthenticated;
  }
}

export default new GoogleService();
