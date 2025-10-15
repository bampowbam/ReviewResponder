// Google My Business Service - Browser-compatible version
class GoogleMyBusinessService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
    this.businessAccountId = import.meta.env.VITE_BUSINESS_ACCOUNT_ID;
    this.locationId = import.meta.env.VITE_LOCATION_ID;
    this.baseUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1';
    this.reviewsUrl = 'https://mybusiness.googleapis.com/v4';
  }

  // Initialize OAuth2 authentication
  async initializeAuth() {
    try {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.apiKey}&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/business.manage')}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      return authUrl;
    } catch (error) {
      console.error('Error initializing auth:', error);
      throw error;
    }
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.apiKey,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      const tokenData = await response.json();
      
      if (tokenData.access_token) {
        localStorage.setItem('google_access_token', tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem('google_refresh_token', tokenData.refresh_token);
        }
        return tokenData;
      } else {
        throw new Error('Failed to obtain access token');
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  // Get stored access token
  getAccessToken() {
    return localStorage.getItem('google_access_token');
  }

  // Refresh access token
  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('google_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.apiKey,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await response.json();
      
      if (tokenData.access_token) {
        localStorage.setItem('google_access_token', tokenData.access_token);
        return tokenData.access_token;
      } else {
        throw new Error('Failed to refresh access token');
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url, options = {}) {
    let accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      let response = await fetch(url, requestOptions);
      
      // If unauthorized, try to refresh token
      if (response.status === 401) {
        accessToken = await this.refreshAccessToken();
        requestOptions.headers['Authorization'] = `Bearer ${accessToken}`;
        response = await fetch(url, requestOptions);
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error making authenticated request:', error);
      throw error;
    }
  }

  // Get business locations
  async getBusinessLocations() {
    try {
      const url = `${this.baseUrl}/accounts/${this.businessAccountId}/locations`;
      return await this.makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching business locations:', error);
      throw error;
    }
  }

  // Get reviews for a location
  async getReviews(locationId = this.locationId) {
    try {
      const url = `${this.reviewsUrl}/accounts/${this.businessAccountId}/locations/${locationId}/reviews`;
      return await this.makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  // Reply to a review
  async replyToReview(reviewName, replyText) {
    try {
      const url = `${this.reviewsUrl}/${reviewName}/reply`;
      const body = {
        comment: replyText
      };

      return await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Error replying to review:', error);
      throw error;
    }
  }

  // Update existing reply
  async updateReply(reviewName, replyText) {
    try {
      const url = `${this.reviewsUrl}/${reviewName}/reply`;
      const body = {
        comment: replyText
      };

      return await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Error updating reply:', error);
      throw error;
    }
  }

  // Delete a reply
  async deleteReply(reviewName) {
    try {
      const url = `${this.reviewsUrl}/${reviewName}/reply`;
      return await this.makeAuthenticatedRequest(url, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw error;
    }
  }

  // Get review insights and metrics
  async getReviewInsights(locationId = this.locationId) {
    try {
      const url = `${this.baseUrl}/accounts/${this.businessAccountId}/locations/${locationId}/reviews:batchGet`;
      return await this.makeAuthenticatedRequest(url);
    } catch (error) {
      console.error('Error fetching review insights:', error);
      throw error;
    }
  }
}

export default new GoogleMyBusinessService();
