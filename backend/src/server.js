const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');
const reviewRoutes = require('./routes/reviews');
const credentialsRoutes = require('./routes/credentials');
const googleRoutes = require('./routes/google');
const automationRoutes = require('./routes/automation');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Raw body parser for webhook signature verification (must come before JSON parser)
app.use('/api/webhooks', bodyParser.raw({ type: 'application/json' }));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'review-response-backend'
  });
});

// API Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/automation', automationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Review Response Backend running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhooks/google`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
