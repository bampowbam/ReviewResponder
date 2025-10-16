const axios = require('axios');
const webhookService = require('./webhookService');

class BackendAutomationService {
  constructor() {
    this.processedReviews = new Set();
    this.isProcessing = false;
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
      this.isProcessing = true;

      // Calculate urgency
      const reviewTime = new Date(reviewData.createTime);
      const now = new Date();
      const timeSinceReview = now - reviewTime;
      const minutesSince = Math.round(timeSinceReview / 60000);
      
      console.log(`⏰ Review posted ${minutesSince} minutes ago`);

      // Send urgent notification if needed
      if (minutesSince > 8) {
        console.log('🚨 URGENT: Less than 2 minutes to respond!');
        await webhookService.sendUrgentNotification(reviewData);
      }

      // Generate AI response immediately for webhook reviews
      await this.generateAndSendResponse(reviewData);

    } catch (error) {
      console.error('❌ Error processing webhook review:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Generate AI response and post to Google
  async generateAndSendResponse(reviewData) {
    try {
      console.log('🤖 Generating AI response...');
      
      // Transform review for AI service
      const transformedReview = {
        id: reviewData.name,
        rating: reviewData.starRating || 0,
        text: reviewData.comment || '',
        reviewerName: reviewData.reviewer?.displayName || 'Valued Customer'
      };

      // Call frontend AI service via API
      const aiResponse = await this.callAIService(transformedReview);
      
      if (aiResponse.success) {
        console.log('✅ AI response generated successfully');
        console.log(`💬 Response: "${aiResponse.response.substring(0, 100)}..."`);
        
        // Post response to Google My Business
        await this.postResponseToGoogle(reviewData.name, aiResponse.response);
        
        // Notify frontend of successful automation
        await webhookService.notifyFrontend('automation_success', {
          reviewId: reviewData.name,
          reviewRating: reviewData.starRating,
          reviewerName: reviewData.reviewer?.displayName,
          aiResponse: aiResponse.response,
          processingTime: Date.now() - new Date(reviewData.createTime).getTime(),
          confidence: aiResponse.confidence
        });
        
      } else {
        throw new Error(aiResponse.error || 'AI response generation failed');
      }

    } catch (error) {
      console.error('❌ Error generating/sending response:', error);
      
      // Notify frontend of automation failure
      await webhookService.notifyFrontend('automation_error', {
        reviewId: reviewData.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Call AI service to generate response
  async callAIService(reviewData) {
    try {
      // In production, this would call your AI service API
      // For now, simulate the AI response generation
      
      const prompt = this.createAIPrompt(reviewData);
      
      // Call OpenAI API directly
      const openaiResponse = await this.callOpenAI(prompt);
      
      return {
        success: true,
        response: openaiResponse,
        confidence: 0.85
      };
      
    } catch (error) {
      console.error('❌ AI service call failed:', error);
      
      // Return fallback response
      return {
        success: false,
        error: error.message,
        fallbackResponse: this.getFallbackResponse(reviewData.rating)
      };
    }
  }

  // Create AI prompt for review response
  createAIPrompt(reviewData) {
    const rating = reviewData.rating;
    const text = reviewData.text;
    const reviewerName = reviewData.reviewerName;
    const businessName = process.env.BUSINESS_NAME || 'Our Business';
    
    const ratingContext = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
    
    return `Write a professional response to this ${ratingContext} Google review for ${businessName}:

Review Rating: ${rating}/5 stars
Reviewer: ${reviewerName}
Review Text: "${text}"

Response Guidelines:
- Thank the reviewer by name if provided
- ${this.getResponseStrategy(rating)}
- Be authentic and avoid generic corporate language
- Keep under 150 words
- End with an appropriate closing

Response:`;
  }

  // Get response strategy based on rating
  getResponseStrategy(rating) {
    const strategies = {
      5: 'Express genuine gratitude and enthusiasm for their positive experience',
      4: 'Thank them warmly and show appreciation for their positive feedback',
      3: 'Acknowledge their feedback professionally and show commitment to improvement',
      2: 'Apologize for their disappointing experience and offer to make improvements',
      1: 'Sincerely apologize and actively offer to resolve their concerns directly'
    };
    
    return strategies[rating] || strategies[3];
  }

  // Call OpenAI API
  async callOpenAI(prompt) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional customer service representative responding to Google reviews. Be genuine, helpful, and maintain a positive brand image.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('❌ OpenAI API error:', error.response?.data || error.message);
      throw new Error('Failed to generate AI response');
    }
  }

  // Post response to Google My Business API
  async postResponseToGoogle(reviewName, responseText) {
    try {
      console.log('📤 Posting response to Google My Business...');
      
      // In production, this would make actual API call to Google
      const googleResponse = await axios.put(
        `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
        {
          comment: responseText
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Response posted to Google successfully');
      return googleResponse.data;
      
    } catch (error) {
      console.error('❌ Error posting to Google:', error.response?.data || error.message);
      throw new Error('Failed to post response to Google My Business');
    }
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

  // Get processing status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedReviews.size,
      webhookStats: webhookService.getStats()
    };
  }
}

module.exports = new BackendAutomationService();
