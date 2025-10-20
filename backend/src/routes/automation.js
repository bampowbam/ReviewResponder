const express = require('express');
const router = express.Router();
const automationService = require('../services/automationService');

// Get automation status
router.get('/status', (req, res) => {
  try {
    const status = automationService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting automation status:', error);
    res.status(500).json({ error: 'Failed to get automation status' });
  }
});

// Start automation service
router.post('/start', async (req, res) => {
  try {
    const { settings = {} } = req.body;
    
    await automationService.start(settings);
    
    res.json({ 
      success: true, 
      message: 'Automation service started',
      status: automationService.getStatus()
    });
  } catch (error) {
    console.error('Error starting automation service:', error);
    res.status(500).json({ error: 'Failed to start automation service' });
  }
});

// Stop automation service
router.post('/stop', (req, res) => {
  try {
    automationService.stop();
    
    res.json({ 
      success: true, 
      message: 'Automation service stopped',
      status: automationService.getStatus()
    });
  } catch (error) {
    console.error('Error stopping automation service:', error);
    res.status(500).json({ error: 'Failed to stop automation service' });
  }
});

// Update automation settings
router.put('/settings', (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ error: 'Settings are required' });
    }
    
    automationService.updateSettings(settings);
    
    res.json({ 
      success: true, 
      message: 'Automation settings updated',
      status: automationService.getStatus()
    });
  } catch (error) {
    console.error('Error updating automation settings:', error);
    res.status(500).json({ error: 'Failed to update automation settings' });
  }
});

// Test automation with sample review
router.post('/test', async (req, res) => {
  try {
    const { reviewData } = req.body;
    
    if (!reviewData) {
      return res.status(400).json({ error: 'Review data is required for testing' });
    }
    
    const response = await automationService.processReviewManually(reviewData);
    
    res.json({ 
      success: true, 
      message: 'Test automation completed',
      response: response
    });
  } catch (error) {
    console.error('Error testing automation:', error);
    res.status(500).json({ error: 'Failed to test automation: ' + error.message });
  }
});

module.exports = router;
