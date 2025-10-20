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
        'http://localhost:3001/api/google/callback' // Redirect URI - backend handles OAuth callback
      );

      // Initialize Google My Business API
      this.mybusiness = google.mybusinessbusinessinformation({
        version: 'v1',
        auth: this.oauth2Client
      });

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
      'https://www.googleapis.com/auth/business.manage'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    return authUrl;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
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

  // Get user's business accounts (real API implementation)
  async getAccounts() {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      console.log('📋 Fetching Google My Business accounts...');
      
      // Use Google My Business Business Information API
      const response = await this.mybusiness.accounts.list();
      
      const accounts = response.data.accounts || [];
      console.log(`✅ Found ${accounts.length} business accounts`);
      
      return accounts.map(account => ({
        name: account.name,
        accountName: account.accountName || 'Unnamed Business',
        type: account.type || 'BUSINESS'
      }));
    } catch (error) {
      console.error('❌ Error fetching accounts:', error);
      
      // If the new API fails, try the legacy approach
      if (error.code === 404 || error.code === 403) {
        console.log('📋 Trying legacy Google My Business API...');
        try {
          // Fallback to legacy mybusiness API
          const legacyMybusiness = google.mybusiness({
            version: 'v4',
            auth: this.oauth2Client
          });
          
          const response = await legacyMybusiness.accounts.list();
          const accounts = response.data.accounts || [];
          
          return accounts.map(account => ({
            name: account.name,
            accountName: account.accountName || 'Unnamed Business',
            type: account.type || 'BUSINESS'
          }));
        } catch (legacyError) {
          console.error('❌ Legacy API also failed:', legacyError);
          throw legacyError;
        }
      }
      
      throw error;
    }
  }

  // Get locations for an account (real API implementation)
  async getLocations(accountId) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      console.log(`📍 Fetching locations for account: ${accountId}`);
      
      // Use Google My Business Business Information API
      const response = await this.mybusiness.accounts.locations.list({
        parent: accountId
      });
      
      const locations = response.data.locations || [];
      console.log(`✅ Found ${locations.length} locations`);
      
      return locations.map(location => ({
        name: location.name,
        locationName: location.title || location.name,
        primaryCategory: location.primaryCategory?.displayName || 'Business',
        address: location.storefrontAddress?.formattedAddress || 'Address not available'
      }));
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
      
      // If the new API fails, try the legacy approach
      if (error.code === 404 || error.code === 403) {
        console.log('📍 Trying legacy Google My Business API...');
        try {
          const legacyMybusiness = google.mybusiness({
            version: 'v4',
            auth: this.oauth2Client
          });
          
          const response = await legacyMybusiness.accounts.locations.list({
            parent: accountId
          });
          
          const locations = response.data.locations || [];
          
          return locations.map(location => ({
            name: location.name,
            locationName: location.locationName || 'Unnamed Location',
            primaryCategory: location.primaryCategory?.displayName || 'Business',
            address: location.address?.formattedAddress || 'Address not available'
          }));
        } catch (legacyError) {
          console.error('❌ Legacy API also failed:', legacyError);
          throw legacyError;
        }
      }
      
      throw error;
    }
  }

  // Get reviews for a location (real API implementation)
  async getReviews(locationName, pageSize = 20) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      console.log(`⭐ Fetching reviews for location: ${locationName}`);
      
      // Try the Business Profile Performance API for reviews
      try {
        const businessProfileAPI = google.businessprofileperformance({
          version: 'v1',
          auth: this.oauth2Client
        });
        
        const response = await businessProfileAPI.locations.searchkeywords.impressions.monthly.list({
          parent: locationName
        });
        
        console.log('📊 Business Profile Performance API response:', response.data);
        
        // This API doesn't directly give reviews, so we need to use a different approach
        // Let's try the legacy API for reviews
        throw new Error('Need to use legacy API for reviews');
        
      } catch (profileError) {
        console.log('⭐ Trying legacy Google My Business API for reviews...');
        
        // Use legacy mybusiness API for reviews
        const legacyMybusiness = google.mybusiness({
          version: 'v4',
          auth: this.oauth2Client
        });
        
        const response = await legacyMybusiness.accounts.locations.reviews.list({
          parent: locationName,
          pageSize: pageSize
        });
        
        const reviews = response.data.reviews || [];
        console.log(`✅ Found ${reviews.length} reviews`);
        
        return reviews.map(review => ({
          name: review.name,
          starRating: review.starRating || 'STAR_RATING_UNSPECIFIED',
          comment: review.comment || '',
          createTime: review.createTime,
          updateTime: review.updateTime,
          reviewer: {
            displayName: review.reviewer?.displayName || 'Anonymous',
            profilePhotoUrl: review.reviewer?.profilePhotoUrl || ''
          },
          reviewReply: review.reviewReply ? {
            comment: review.reviewReply.comment,
            updateTime: review.reviewReply.updateTime
          } : null
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      throw error;
    }
  }

  // Reply to a review (real API implementation)
  async replyToReview(reviewName, replyText) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      console.log(`💬 Posting reply to review: ${reviewName}`);
      console.log(`📝 Reply text: "${replyText.substring(0, 100)}..."`);
      
      // Use legacy mybusiness API for review replies
      const legacyMybusiness = google.mybusiness({
        version: 'v4',
        auth: this.oauth2Client
      });
      
      const response = await legacyMybusiness.accounts.locations.reviews.updateReply({
        name: reviewName,
        requestBody: {
          comment: replyText
        }
      });
      
      console.log('✅ Successfully replied to review');
      return response.data;
    } catch (error) {
      console.error('❌ Error replying to review:', error);
      throw error;
    }
  }

  // Update an existing reply (real API implementation)
  async updateReply(reviewName, replyText) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      const legacyMybusiness = google.mybusiness({
        version: 'v4',
        auth: this.oauth2Client
      });

      const response = await legacyMybusiness.accounts.locations.reviews.updateReply({
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

  // Delete a reply (real API implementation)
  async deleteReply(reviewName) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Google');
      }

      const legacyMybusiness = google.mybusiness({
        version: 'v4',
        auth: this.oauth2Client
      });

      await legacyMybusiness.accounts.locations.reviews.deleteReply({
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
