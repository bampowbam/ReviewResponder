const OpenAI = require('openai');
const googleMyBusinessService = require('./googleMyBusinessService');
const credentialsRoutes = require('../routes/credentials');
const webhookService = require('./webhookService');

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.openai = null;
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.processedReviews = new Set(); // Track processed reviews
    this.settings = {
      autoRespond: false,
      tone: 'professional',
      language: 'english',
      responseTemplate: 'personalized',
      businessInfo: {
        name: 'Your Business',
        type: 'Business',
        values: 'Customer satisfaction and quality service'
      }
    };
  }

  // Initialize OpenAI client
  initializeOpenAI() {
    try {
      const credentials = credentialsRoutes.getCredentials();
      if (credentials.openaiApiKey) {
        this.openai = new OpenAI({
          apiKey: credentials.openaiApiKey
        });
        console.log('✅ OpenAI client initialized for automation');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error initializing OpenAI:', error);
      return false;
    }
  }

  // Start the automation service
  async start(settings = {}) {
    try {
      if (this.isRunning) {
        console.log('🤖 Automation service is already running');
        return;
      }

      // Update settings
      this.settings = { ...this.settings, ...settings };

      // Initialize OpenAI
      if (!this.initializeOpenAI()) {
        throw new Error('Failed to initialize OpenAI client');
      }

      // Check if Google service is authenticated
      if (!googleMyBusinessService.isAuth()) {
        console.log('⚠️ Google My Business not authenticated. Auto-responses will be queued.');
      }

      this.isRunning = true;
      
      // Start periodic review checking
      this.intervalId = setInterval(() => {
        this.checkForNewReviews();
      }, this.checkInterval);

      console.log(`🚀 Automation service started - checking every ${this.checkInterval / 1000}s`);
      console.log(`📋 Settings:`, {
        autoRespond: this.settings.autoRespond,
        tone: this.settings.tone,
        template: this.settings.responseTemplate
      });

      // Do initial check
      this.checkForNewReviews();

    } catch (error) {
      console.error('❌ Error starting automation service:', error);
      this.isRunning = false;
    }
  }

  // Stop the automation service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Automation service stopped');
  }

  // Process review received via webhook (real-time)
  async processWebhookReview(reviewData) {
    try {
      console.log('🚨 WEBHOOK REVIEW PROCESSING STARTED');
      console.log(`⭐ Rating: ${reviewData.starRating}/5`);
      console.log(`👤 Reviewer: ${reviewData.reviewer?.displayName || 'Anonymous'}`);
      console.log(`📝 Comment: ${reviewData.comment?.substring(0, 100)}...`);
      
      // Check if already processed
      if (this.processedReviews.has(reviewData.name)) {
        console.log('⚠️ Review already processed, skipping...');
        return;
      }

      // Mark as processing
      this.processedReviews.add(reviewData.name);

      // Check if we should auto-respond
      if (this.settings.autoRespond && this.shouldAutoRespond(reviewData)) {
        await this.generateAndPostResponse(reviewData);
      }

    } catch (error) {
      console.error('❌ Error processing webhook review:', error);
    }
  }

  // Check for new reviews across all locations
  async checkForNewReviews() {
    if (!this.settings.autoRespond) {
      return;
    }

    try {
      console.log('🔍 Checking for new reviews...');

      if (!googleMyBusinessService.isAuth()) {
        console.log('⚠️ Google service not authenticated, skipping review check');
        return;
      }

      // Get all business accounts
      const accounts = await googleMyBusinessService.getAccounts();
      
      for (const account of accounts) {
        // Get locations for each account
        const locations = await googleMyBusinessService.getLocations(account.name);
        
        for (const location of locations) {
          await this.processLocationReviews(location);
        }
      }

    } catch (error) {
      console.error('❌ Error checking for new reviews:', error);
    }
  }

  // Process reviews for a specific location
  async processLocationReviews(location) {
    try {
      const reviews = await googleMyBusinessService.getReviews(location.name);
      
      for (const review of reviews) {
        // Skip if already processed
        if (this.processedReviews.has(review.name)) {
          continue;
        }

        // Skip if review already has a reply
        if (review.reply) {
          this.processedReviews.add(review.name);
          continue;
        }

        // Check if we should auto-respond to this review
        if (this.shouldAutoRespond(review)) {
          await this.generateAndPostResponse(review, location);
        }

        // Mark as processed
        this.processedReviews.add(review.name);
      }

    } catch (error) {
      console.error(`❌ Error processing reviews for location ${location.name}:`, error);
    }
  }

  // Determine if we should auto-respond to a review
  shouldAutoRespond(review) {
    // Auto-respond to 4-5 star reviews, or all if configured
    const rating = review.starRating;
    
    // Always respond to 5-star reviews
    if (rating === 5) return true;
    
    // Respond to 4-star reviews if configured
    if (rating === 4 && this.settings.respondToFourStar) return true;
    
    // Respond to lower ratings if configured (for damage control)
    if (rating <= 3 && this.settings.respondToLowRatings) return true;
    
    return false;
  }

  // Generate AI response and post it
  async generateAndPostResponse(reviewData, location = null) {
    try {
      console.log(`🤖 Generating response for review: ${reviewData.name}`);

      // Generate AI response
      const responseText = await this.generateAIResponse(reviewData, location);
      
      if (!responseText) {
        console.log('❌ Failed to generate response');
        return;
      }

      // Post response to Google
      await googleMyBusinessService.replyToReview(reviewData.name, responseText);
      
      console.log(`✅ Successfully posted auto-response to review: ${reviewData.name}`);

      // Notify frontend of successful automation
      await webhookService.notifyFrontend('automation_success', {
        reviewId: reviewData.name,
        reviewRating: reviewData.starRating,
        reviewerName: reviewData.reviewer?.displayName,
        aiResponse: responseText,
        processingTime: Date.now() - new Date(reviewData.createTime || new Date()).getTime()
      });

      // Log the activity
      this.logActivity({
        type: 'auto_response',
        reviewId: reviewData.name,
        rating: reviewData.starRating,
        response: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Error generating/posting response for review ${reviewData.name}:`, error);
      
      // Notify frontend of automation failure
      await webhookService.notifyFrontend('automation_error', {
        reviewId: reviewData.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Generate AI response using OpenAI
  async generateAIResponse(review, location) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const prompt = this.buildPrompt(review, location);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping to respond to Google My Business reviews. Generate professional, personalized responses that reflect the business's values and maintain customer relationships.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response;

    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      // Return fallback response
      return this.getFallbackResponse(review.starRating || 5);
    }
  }

  // Build prompt for AI response generation
  buildPrompt(review, location) {
    const { businessInfo, tone, responseTemplate } = this.settings;
    
    return `
Generate a ${tone} response to this Google My Business review:

Business Information:
- Name: ${businessInfo.name || location?.locationName || 'Our Business'}
- Type: ${businessInfo.type || 'Business'}
- Values: ${businessInfo.values || 'Customer satisfaction and quality service'}

Review Details:
- Rating: ${review.starRating}/5 stars
- Comment: "${review.comment || 'No comment provided'}"
- Reviewer: ${review.reviewer?.displayName || 'Anonymous'}

Response Requirements:
- Tone: ${tone}
- Template: ${responseTemplate}
- Length: 50-150 words
- Professional and authentic
- Address specific points mentioned in the review
- Include gratitude for the feedback
- Encourage future visits if appropriate

Generate only the response text, no additional formatting or quotes.
    `.trim();
  }

  // Get fallback response when AI fails
  getFallbackResponse(rating) {
    const responses = {
      5: "Thank you so much for the wonderful 5-star review! We're thrilled that you had such a positive experience. Your feedback means the world to our team, and we look forward to serving you again soon!",
      4: "Thank you for the great 4-star review! We're so glad you had a positive experience. We appreciate your feedback and look forward to welcoming you back soon!",
      3: "Thank you for taking the time to leave us a review. We appreciate your feedback and are always looking for ways to improve our service. We'd love the opportunity to exceed your expectations on your next visit!",
      2: "Thank you for your feedback. We're sorry to hear that your experience didn't meet your expectations. We take all feedback seriously and would love the opportunity to make things right. Please contact us directly so we can address your concerns.",
      1: "We sincerely apologize for the poor experience you had. This is not the level of service we strive to provide. Please contact us directly so we can address your concerns and make this right. Your feedback is valuable in helping us improve."
    };
    
    return responses[rating] || responses[3];
  }

  // Log automation activity
  logActivity(activity) {
    console.log('📝 Automation Activity:', activity);
    
    // In production, save to database
    // For now, just log to console
  }

  // Update automation settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ Automation settings updated:', this.settings);
    
    // Restart if auto-respond was toggled on
    if (newSettings.autoRespond && !this.isRunning) {
      this.start(this.settings);
    } else if (!newSettings.autoRespond && this.isRunning) {
      this.stop();
    }
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      settings: this.settings,
      checkInterval: this.checkInterval,
      processedReviewsCount: this.processedReviews.size,
      googleAuthenticated: googleMyBusinessService.isAuth(),
      openaiInitialized: !!this.openai
    };
  }

  // Manual review processing (for testing)
  async processReviewManually(reviewData) {
    try {
      if (!this.openai) {
        this.initializeOpenAI();
      }

      const response = await this.generateAIResponse(reviewData, { locationName: 'Test Location' });
      return response;

    } catch (error) {
      console.error('❌ Error processing review manually:', error);
      throw error;
    }
  }
}

module.exports = new AutomationService();
