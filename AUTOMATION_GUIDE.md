# ReviewResponder - Automated Review Response System

## 🤖 Automation Operation Guide

This guide explains the complete operation for listening to reviews and automatically responding via AI to Google My Business reviews.

## 📋 System Overview

The ReviewResponder system provides **automated AI-powered responses** to Google My Business reviews through multiple detection methods:

### 🔄 How Automation Works

1. **Review Detection**
   - **Webhook Listening**: Real-time notifications from Google My Business API
   - **Periodic Polling**: Scheduled checks for new reviews every 30 seconds
   - **Manual Triggers**: On-demand review fetching

2. **AI Response Generation**
   - **OpenAI GPT-4 Integration**: Generates contextual responses based on review content
   - **Tone Customization**: Professional, friendly, or custom response tones
   - **Rating-Based Logic**: Different response strategies for different star ratings

3. **Automatic Posting**
   - **Google My Business API**: Posts AI-generated responses automatically
   - **Review Validation**: Ensures responses are appropriate before posting
   - **Error Handling**: Retry mechanisms and failure notifications

## 🚀 Setting Up Automation

### Step 1: Configure Credentials
```bash
1. Open the ReviewResponder app at http://localhost:5174
2. Click "Configure Credentials" 
3. Enter your Google OAuth credentials:
   - Client ID
   - Client Secret
   - Redirect URI (http://localhost:3001/api/google/callback)
4. Save credentials
```

### Step 2: Connect Google My Business
```bash
1. Select your Google Business Account from dropdown
2. Choose the specific business location
3. Verify connection status shows "Connected"
```

### Step 3: Start Automation
```bash
1. Navigate to Settings Panel
2. Enable "Auto-Respond to Reviews"
3. Configure response settings:
   - Response tone (Professional/Friendly/Custom)
   - Rating filters (respond to 1-5 star reviews)
   - Response delay (immediate or scheduled)
4. Click "Start Automation"
```

## 📡 Real-Time Webhook Operations

### Google My Business Webhook Setup

The system listens for real-time review notifications through Google's webhook system:

```javascript
// Webhook endpoint: http://localhost:3001/api/webhooks/google
// Supported events:
- review.create (new review posted)
- review.updated (existing review modified)
- location.updated (business info changed)
```

### Webhook Processing Flow

1. **Incoming Webhook** → Google sends notification to our endpoint
2. **Event Parsing** → Extract review data and metadata
3. **Validation** → Verify webhook signature and content
4. **Automation Trigger** → Start AI response generation
5. **Real-time Notification** → Update frontend dashboard immediately

### Testing Webhooks

You can test the webhook functionality:

```bash
# Test webhook endpoint
POST http://localhost:3001/api/webhooks/test

# This simulates a new 5-star review and triggers the automation
```

## 🔄 Automation Process Details

### When a New Review is Detected:

1. **Review Analysis**
   ```javascript
   {
     "reviewId": "unique_review_identifier",
     "starRating": 1-5,
     "reviewer": { "displayName": "Customer Name" },
     "comment": "Customer's review text",
     "createTime": "2025-01-20T12:00:00Z",
     "locationName": "business_location_id"
   }
   ```

2. **AI Response Generation**
   - Send review to OpenAI GPT-4
   - Include business context and tone preferences
   - Generate appropriate response (50-200 characters)

3. **Response Validation**
   - Check for inappropriate content
   - Ensure response is relevant to review
   - Verify character limits

4. **Automatic Posting**
   - Post response to Google My Business
   - Update review record with response
   - Send success/failure notification

### Example AI Response Flow:

```javascript
// 5-Star Review Input:
"Amazing service! The staff was so helpful and friendly."

// AI Generated Response:
"Thank you so much for your wonderful feedback! We're thrilled you had such a positive experience with our team. We look forward to serving you again soon!"

// 1-Star Review Input:
"Terrible experience. Waited 30 minutes and staff was rude."

// AI Generated Response:
"We sincerely apologize for your poor experience. This doesn't reflect our usual standards. Please contact us directly at [contact] so we can make this right and improve our service."
```

## 📊 Monitoring & Notifications

### Real-Time Dashboard Features

- **Live Review Feed**: New reviews appear instantly
- **Automation Status**: Shows when automation is active
- **Response Analytics**: Track response rates and patterns
- **Error Notifications**: Alerts for failed responses

### Browser Notifications

The system sends browser notifications for:
- 🆕 **New Reviews**: Immediate alert when customer leaves review
- ✅ **Automation Success**: Confirmation when AI response is posted
- ❌ **Automation Errors**: Alerts when response fails

### Notification Examples:

```
🆕 New 5-star review!
From: John Smith

🤖 AI Response Posted
Responded to 3⭐ review automatically

⚠️ Automation Failed
Failed to respond to review: API rate limit exceeded
```

## ⚙️ Automation Settings

### Response Configuration

```javascript
{
  "autoRespond": true,
  "responseDelay": 0, // Minutes to wait before responding
  "enabledRatings": [1, 2, 3, 4, 5], // Which star ratings to respond to
  "tone": "professional", // professional, friendly, custom
  "customPrompt": "Respond as a caring business owner...",
  "maxResponseLength": 200,
  "businessContext": "Family-owned restaurant since 1995"
}
```

### Filtering Options

- **Rating Filters**: Only respond to specific star ratings
- **Keyword Filters**: Skip reviews containing certain words
- **Time Filters**: Only respond during business hours
- **Volume Limits**: Maximum responses per day/hour

## 🛠️ Technical Architecture

### Backend Services

1. **Google My Business Service** (`googleMyBusinessService.js`)
   - Handles OAuth authentication
   - Fetches reviews and business data
   - Posts AI-generated responses

2. **Automation Service** (`automationService.js`)
   - Monitors for new reviews
   - Orchestrates AI response generation
   - Manages automation lifecycle

3. **Webhook Service** (`webhookService.js`)
   - Receives Google webhook notifications
   - Handles real-time event processing
   - Manages SSE connections for frontend

4. **AI Service** (`aiService.js`)
   - Integrates with OpenAI GPT-4
   - Generates contextual responses
   - Handles response validation

### Frontend Components

1. **Review Dashboard** (`ReviewDashboard.jsx`)
   - Displays live review feed
   - Shows automation status
   - Handles business switching

2. **Settings Panel** (`SettingsPanel.jsx`)
   - Automation configuration
   - Response tone settings
   - Webhook testing

3. **Webhook Service** (`webhookService.js`)
   - Listens for real-time notifications
   - Manages browser notifications
   - Handles SSE connections

## 🚨 Error Handling & Recovery

### Common Issues & Solutions

1. **Google API Rate Limits**
   - Automatic retry with exponential backoff
   - Queue responses during high volume
   - Notification to administrator

2. **Network Connectivity Issues**
   - Offline mode with local queuing
   - Automatic reconnection attempts
   - Fallback to polling mode

3. **AI Service Failures**
   - Fallback to template responses
   - Manual approval queue
   - Error logging and reporting

### Monitoring & Alerts

- **Health Checks**: Regular API connectivity tests
- **Performance Metrics**: Response times and success rates  
- **Error Logging**: Detailed logs for troubleshooting
- **Notification System**: Real-time alerts for system issues

## 📱 Usage Examples

### Starting Automation
```bash
1. Ensure credentials are configured
2. Select business location
3. Enable automation in settings
4. Monitor dashboard for incoming reviews
5. Watch AI responses being posted automatically
```

### Testing the System
```bash
1. Click "Test Webhook" button in dashboard
2. Simulates a new 5-star review
3. Watch real-time notification appear
4. Verify automation processes the test review
```

### Monitoring Performance
```bash
1. Check dashboard analytics:
   - Total reviews processed
   - Response rate percentage
   - Average response time
   - Recent activity (24h)
```

## 🔧 Configuration Files

### Environment Variables
```env
# Backend (.env)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
PORT=3001

# Optional
WEBHOOK_SECRET=your_webhook_verification_secret
```

### Frontend Configuration
```javascript
// src/config.js
export const API_BASE_URL = 'http://localhost:3001/api';
export const WEBHOOK_RECONNECT_INTERVAL = 5000;
export const NOTIFICATION_TIMEOUT = 10000;
```

## 🎯 Key Benefits

1. **24/7 Automation**: Responds to reviews instantly, even outside business hours
2. **Consistent Quality**: AI ensures professional, appropriate responses every time
3. **Improved Ratings**: Quick responses improve customer satisfaction and SEO
4. **Time Savings**: Eliminates manual review monitoring and response writing
5. **Scalability**: Handles high review volumes automatically
6. **Real-time Monitoring**: Live dashboard shows all activity and metrics

## 📞 Support & Troubleshooting

### Debug Mode
Enable debug logging by setting `DEBUG=true` in environment variables.

### API Testing
Test individual components:
- `/api/health` - System health check
- `/api/webhooks/test` - Webhook functionality
- `/api/automation/status` - Automation status
- `/api/google/reviews` - Review fetching

### Common Commands
```bash
# Restart backend
npm run start

# Check logs
tail -f logs/automation.log

# Test Google API connection
curl http://localhost:3001/api/google/status
```

---

## 🏁 Quick Start Summary

1. **Setup**: Configure Google OAuth credentials
2. **Connect**: Link your Google My Business account
3. **Configure**: Set response tone and automation preferences  
4. **Activate**: Start automation service
5. **Monitor**: Watch real-time dashboard for review activity
6. **Optimize**: Adjust settings based on performance metrics

The system will now automatically detect new reviews and respond with AI-generated, contextually appropriate responses, maintaining your business's online reputation 24/7! 🚀
