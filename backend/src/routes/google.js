const express = require('express');
const router = express.Router();
const googleMyBusinessService = require('../services/googleMyBusinessService');
const credentialsRoutes = require('./credentials');

// In-memory storage for OAuth tokens (in production, use encrypted database)
let oauthTokens = null;

// Initialize Google service and get auth URL
router.post('/auth/init', async (req, res) => {
  try {
    // Get stored credentials
    const credentials = credentialsRoutes.getCredentials();
    
    if (!credentials.googleClientId || !credentials.googleClientSecret) {
      return res.status(400).json({ error: 'Google credentials not configured' });
    }

    // Initialize Google service
    await googleMyBusinessService.initialize(credentials);
    
    // Generate auth URL
    const authUrl = googleMyBusinessService.getAuthUrl();
    
    res.json({ 
      success: true, 
      authUrl: authUrl,
      message: 'Click the URL to authorize access to your Google My Business account'
    });
  } catch (error) {
    console.error('Error initializing Google auth:', error);
    res.status(500).json({ error: 'Failed to initialize Google authentication' });
  }
});

// Handle OAuth callback (exchange code for tokens)
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`http://localhost:5173/?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      console.error('No authorization code provided');
      return res.redirect('http://localhost:5173/?error=no_code');
    }

    console.log('📝 Received OAuth callback with code:', code.substring(0, 20) + '...');

    // Get stored credentials and ensure Google service is initialized
    const credentials = credentialsRoutes.getCredentials();
    
    if (!credentials.googleClientId || !credentials.googleClientSecret) {
      console.error('Google credentials not configured');
      return res.redirect('http://localhost:5173/?error=no_credentials');
    }

    // Initialize Google service if not already done
    await googleMyBusinessService.initialize(credentials);

    // Exchange code for tokens
    const tokens = await googleMyBusinessService.exchangeCodeForTokens(code);
    
    // Store tokens securely (in production, encrypt and store in database)
    oauthTokens = tokens;
    
    console.log('✅ Google OAuth completed successfully');
    
    // Redirect back to frontend with success
    res.redirect('http://localhost:5173/?auth=success');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`http://localhost:5173/?error=${encodeURIComponent('Authentication failed')}`);
  }
});

// Get authentication status
// Get authentication status
router.get('/auth/status', (req, res) => {
  try {
    const authStatus = googleMyBusinessService.getAuthStatus();
    
    res.json({
      ...authStatus,
      hasStoredTokens: !!oauthTokens
    });
  } catch (error) {
    console.error('Error getting auth status:', error);
    res.status(500).json({ error: 'Failed to get authentication status' });
  }
});

// Get user's business accounts
router.get('/accounts', async (req, res) => {
  try {
    if (!googleMyBusinessService.isAuth()) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const accounts = await googleMyBusinessService.getAccounts();
    
    res.json({ 
      success: true, 
      accounts: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch business accounts' });
  }
});

// Get locations for an account
router.get('/accounts/:accountId/locations', async (req, res) => {
  try {
    if (!googleMyBusinessService.isAuth()) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { accountId } = req.params;
    const locations = await googleMyBusinessService.getLocations(accountId);
    
    res.json({ 
      success: true, 
      locations: locations,
      count: locations.length
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Get reviews for a location
router.get('/locations/:locationName/reviews', async (req, res) => {
  try {
    if (!googleMyBusinessService.isAuth()) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { locationName } = req.params;
    const { pageSize = 20 } = req.query;
    
    const reviews = await googleMyBusinessService.getReviews(locationName, parseInt(pageSize));
    
    res.json({ 
      success: true, 
      reviews: reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Reply to a review
router.post('/reviews/:reviewName/reply', async (req, res) => {
  try {
    if (!googleMyBusinessService.isAuth()) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { reviewName } = req.params;
    const { replyText } = req.body;
    
    if (!replyText) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const result = await googleMyBusinessService.replyToReview(reviewName, replyText);
    
    res.json({ 
      success: true, 
      message: 'Successfully replied to review',
      reply: result
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ error: 'Failed to reply to review' });
  }
});

// Update a review reply
router.put('/reviews/:reviewName/reply', async (req, res) => {
  try {
    if (!googleMyBusinessService.isAuth()) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { reviewName } = req.params;
    const { replyText } = req.body;
    
    if (!replyText) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const result = await googleMyBusinessService.updateReply(reviewName, replyText);
    
    res.json({ 
      success: true, 
      message: 'Successfully updated review reply',
      reply: result
    });
  } catch (error) {
    console.error('Error updating review reply:', error);
    res.status(500).json({ error: 'Failed to update review reply' });
  }
});

// Delete a review reply
router.delete('/reviews/:reviewName/reply', async (req, res) => {
  try {
    if (!googleMyBusinessService.isAuth()) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    const { reviewName } = req.params;
    
    await googleMyBusinessService.deleteReply(reviewName);
    
    res.json({ 
      success: true, 
      message: 'Successfully deleted review reply'
    });
  } catch (error) {
    console.error('Error deleting review reply:', error);
    res.status(500).json({ error: 'Failed to delete review reply' });
  }
});

// Restore tokens on server restart (if available)
if (oauthTokens && Object.keys(oauthTokens).length > 0) {
  setTimeout(async () => {
    try {
      const credentials = credentialsRoutes.getCredentials();
      if (credentials.googleClientId && credentials.googleClientSecret) {
        await googleMyBusinessService.initialize(credentials);
        googleMyBusinessService.setTokens(oauthTokens);
        console.log('✅ Google My Business service restored from stored tokens');
      }
    } catch (error) {
      console.error('❌ Error restoring Google service:', error);
    }
  }, 1000);
}

module.exports = router;
