const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleMyBusinessService {
  constructor() {
    this.oauth2Client = null;
    this.mybusiness = null;
    this.isAuthenticated = false;
  }

  // Initialize OAuth2 client with stored credentials
  async initialize(credentials) {
    try {
      this.oauth2Client = new OAuth2Client(
        credentials.googleClientId,
        credentials.googleClientSecret,
        'http://localhost:5173/auth/callback' // Redirect URI
      );

      // Note: Google My Business API is deprecated
      // For now, we'll set up authentication and implement API calls separately
      this.apiReady = true;

      console.log('✅ Google My Business service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Google My Business service:', error);
      throw error;
    }
  }

  // Generate OAuth2 authorization URL
  getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/plus.business.manage'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    return authUrl;
  }

  // Exchange authorization code for tokens
  async getAccessToken(code) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.isAuthenticated = true;
      
      console.log('✅ Google OAuth tokens obtained');
      return tokens;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      throw error;
    }
  }

  // Set existing tokens
  setTokens(tokens) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }
    
    this.oauth2Client.setCredentials(tokens);
    this.isAuthenticated = true;
  }

  // Get user's business accounts (mock implementation for now)
  async getAccounts() {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      // Mock accounts for testing - replace with actual API call
      console.log('📋 Fetching Google My Business accounts...');
      return [
        {
          name: 'accounts/123456789',
          accountName: 'Test Business Account',
          type: 'PERSONAL'
        }
      ];
    } catch (error) {
      console.error('❌ Error fetching accounts:', error);
      throw error;
    }
  }

  // Get locations for an account (mock implementation for now)
  async getLocations(accountId) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      // Mock locations for testing - replace with actual API call
      console.log(`📍 Fetching locations for account: ${accountId}`);
      return [
        {
          name: 'accounts/123456789/locations/987654321',
          locationName: 'Test Business Location',
          primaryCategory: 'Restaurant',
          address: 'Test Address'
        }
      ];
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      throw error;
    }
  }

  // Get reviews for a location (mock implementation for now)
  async getReviews(locationName, pageSize = 20) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      // Mock reviews for testing - replace with actual API call
      console.log(`⭐ Fetching reviews for location: ${locationName}`);
      return [
        {
          name: `${locationName}/reviews/review1`,
          starRating: 5,
          comment: 'Great service and food!',
          createTime: new Date().toISOString(),
          reviewer: {
            displayName: 'Happy Customer'
          }
        }
      ];
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      throw error;
    }
  }

  // Reply to a review (mock implementation for now)
  async replyToReview(reviewName, replyText) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      // Mock reply posting - replace with actual API call
      console.log(`💬 Posting reply to review: ${reviewName}`);
      console.log(`📝 Reply text: "${replyText.substring(0, 100)}..."`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Successfully replied to review (mock)');
      return {
        comment: replyText,
        createTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error replying to review:', error);
      throw error;
    }
  }

  // Update an existing reply
  async updateReply(reviewName, replyText) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      const response = await this.mybusiness.accounts.locations.reviews.updateReply({
        name: reviewName,
        requestBody: {
          comment: replyText
        }
      });

      console.log('✅ Successfully updated review reply');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating review reply:', error);
      throw error;
    }
  }

  // Delete a reply
  async deleteReply(reviewName) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      await this.mybusiness.accounts.locations.reviews.deleteReply({
        name: reviewName
      });

      console.log('✅ Successfully deleted review reply');
      return true;
    } catch (error) {
      console.error('❌ Error deleting review reply:', error);
      throw error;
    }
  }

  // Check if service is authenticated
  isAuth() {
    return this.isAuthenticated;
  }

  // Get current authentication status
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasTokens: this.oauth2Client && this.oauth2Client.credentials ? true : false
    };
  }
}

module.exports = new GoogleMyBusinessService();
