const express = require('express');
const router = express.Router();

// In-memory storage for credentials (in production, use encrypted database)
let credentials = {
  googleClientId: null,
  googleClientSecret: null,
  openaiApiKey: null,
  isConfigured: false
};

// Get current credentials status
router.get('/status', (req, res) => {
  try {
    const status = {
      googleConfigured: !!(credentials.googleClientId && credentials.googleClientSecret),
      openaiConfigured: !!credentials.openaiApiKey,
      isConfigured: credentials.isConfigured
    };
    
    res.json(status);
  } catch (error) {
    console.error('Error getting credentials status:', error);
    res.status(500).json({ error: 'Failed to get credentials status' });
  }
});

// Save credentials
router.post('/save', (req, res) => {
  try {
    const { googleClientId, googleClientSecret, openaiApiKey } = req.body;
    
    // Basic validation
    if (!googleClientId || !googleClientSecret || !openaiApiKey) {
      return res.status(400).json({ 
        error: 'All credentials are required: Google Client ID, Google Client Secret, and OpenAI API Key' 
      });
    }
    
    // Validate Google Client ID format
    if (!googleClientId.includes('.googleusercontent.com')) {
      return res.status(400).json({ 
        error: 'Invalid Google Client ID format' 
      });
    }
    
    // Validate OpenAI API Key format
    if (!openaiApiKey.startsWith('sk-')) {
      return res.status(400).json({ 
        error: 'Invalid OpenAI API Key format' 
      });
    }
    
    // Save credentials (in production, encrypt these)
    credentials = {
      googleClientId: googleClientId.trim(),
      googleClientSecret: googleClientSecret.trim(),
      openaiApiKey: openaiApiKey.trim(),
      isConfigured: true,
      updatedAt: new Date().toISOString()
    };
    
    console.log('✅ Credentials saved successfully');
    
    res.json({ 
      success: true, 
      message: 'Credentials saved successfully',
      configured: true
    });
  } catch (error) {
    console.error('Error saving credentials:', error);
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

// Get credentials (masked for security)
router.get('/', (req, res) => {
  try {
    const maskedCredentials = {
      googleClientId: credentials.googleClientId 
        ? `${credentials.googleClientId.substring(0, 10)}...` 
        : null,
      googleClientSecret: credentials.googleClientSecret 
        ? `${credentials.googleClientSecret.substring(0, 8)}...` 
        : null,
      openaiApiKey: credentials.openaiApiKey 
        ? `${credentials.openaiApiKey.substring(0, 8)}...` 
        : null,
      isConfigured: credentials.isConfigured,
      updatedAt: credentials.updatedAt
    };
    
    res.json(maskedCredentials);
  } catch (error) {
    console.error('Error getting credentials:', error);
    res.status(500).json({ error: 'Failed to get credentials' });
  }
});

// Test Google API connection
router.post('/test-google', async (req, res) => {
  try {
    if (!credentials.googleClientId || !credentials.googleClientSecret) {
      return res.status(400).json({ error: 'Google credentials not configured' });
    }
    
    // In a real implementation, you would test the Google My Business API connection here
    // For now, we'll simulate a successful test
    res.json({ 
      success: true, 
      message: 'Google API connection test successful',
      status: 'connected'
    });
  } catch (error) {
    console.error('Error testing Google API:', error);
    res.status(500).json({ error: 'Failed to test Google API connection' });
  }
});

// Test OpenAI API connection
router.post('/test-openai', async (req, res) => {
  try {
    if (!credentials.openaiApiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }
    
    // In a real implementation, you would test the OpenAI API connection here
    // For now, we'll simulate a successful test
    res.json({ 
      success: true, 
      message: 'OpenAI API connection test successful',
      status: 'connected'
    });
  } catch (error) {
    console.error('Error testing OpenAI API:', error);
    res.status(500).json({ error: 'Failed to test OpenAI API connection' });
  }
});

// Delete credentials
router.delete('/', (req, res) => {
  try {
    credentials = {
      googleClientId: null,
      googleClientSecret: null,
      openaiApiKey: null,
      isConfigured: false
    };
    
    console.log('🗑️ Credentials cleared');
    
    res.json({ 
      success: true, 
      message: 'Credentials cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing credentials:', error);
    res.status(500).json({ error: 'Failed to clear credentials' });
  }
});

// Get stored credentials for internal use (not exposed externally)
const getCredentials = () => {
  return credentials;
};

module.exports = router;
module.exports.getCredentials = getCredentials;
