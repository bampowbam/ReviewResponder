import OpenAI from 'openai';

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend server for security
});

class AIService {
  constructor() {
    this.businessName = import.meta.env.VITE_BUSINESS_NAME || 'Our Business';
    this.isConfigured = !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  // Check if OpenAI is properly configured
  isReady() {
    return this.isConfigured && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
  }

  // Generate AI response to a review
  async generateResponse(review, businessInfo = {}) {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
        fallbackResponse: this.getFallbackResponse(review.rating)
      };
    }

    try {
      const { rating, text, reviewerName } = review;
      const { businessType = 'business', tone = 'professional', customInstructions = '' } = businessInfo;

      const prompt = this.createPrompt(rating, text, reviewerName, businessType, tone, customInstructions);

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional customer service representative responding to Google reviews for ${this.businessName}. Be genuine, helpful, and maintain a positive brand image. Keep responses concise and under 150 words.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      });

      const aiResponse = completion.choices[0].message.content.trim();
      const sanitizedResponse = this.sanitizeResponse(aiResponse);

      return {
        success: true,
        response: sanitizedResponse,
        confidence: this.calculateConfidence(rating, text),
        tokensUsed: completion.usage?.total_tokens || 0
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Handle specific OpenAI errors
      let errorMessage = 'Failed to generate AI response';
      if (error.status === 401) {
        errorMessage = 'Invalid OpenAI API key';
      } else if (error.status === 429) {
        errorMessage = 'OpenAI API rate limit exceeded';
      } else if (error.status === 500) {
        errorMessage = 'OpenAI service temporarily unavailable';
      }

      return {
        success: false,
        error: errorMessage,
        fallbackResponse: this.getFallbackResponse(review.rating)
      };
    }
  }

  // Create a detailed prompt for the AI
  createPrompt(rating, reviewText, reviewerName, businessType, tone, customInstructions) {
    const ratingContext = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
    
    let prompt = `Write a ${tone} response to this ${ratingContext} Google review for our ${businessType}:

Review Rating: ${rating}/5 stars
Reviewer: ${reviewerName}
Review Text: "${reviewText}"

Business: ${this.businessName}

Response Guidelines:
- Thank the reviewer by name if provided
- ${this.getResponseStrategy(rating)}
- Be authentic and avoid generic corporate language
- Keep under 150 words
- End with an appropriate closing`;

    if (customInstructions) {
      prompt += `

Additional Instructions: ${customInstructions}`;
    }

    prompt += `

Response:`;
    
    return prompt;
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

  // Calculate confidence score for the AI response
  calculateConfidence(rating, text) {
    let confidence = 0.75; // Base confidence
    
    // Clear positive/negative reviews are easier to respond to
    if (rating === 5 || rating === 1) confidence += 0.15;
    if (rating === 3) confidence -= 0.10; // Neutral reviews are trickier
    
    // Longer reviews provide more context
    if (text && text.length > 50) confidence += 0.10;
    if (text && text.length < 10) confidence -= 0.15;
    
    // Check for specific keywords that make responses easier
    if (text) {
      const positiveKeywords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
      const negativeKeywords = ['terrible', 'awful', 'horrible', 'worst', 'never'];
      const hasSpecificFeedback = positiveKeywords.some(word => 
        text.toLowerCase().includes(word)) || negativeKeywords.some(word => 
        text.toLowerCase().includes(word));
      
      if (hasSpecificFeedback) confidence += 0.05;
    }
    
    return Math.min(0.95, Math.max(0.30, confidence));
  }

  // Sanitize AI response to ensure appropriateness
  sanitizeResponse(response) {
    return response
      .replace(/\b(contact|call|email)\s+me\b/gi, 'contact us')
      .replace(/\b(my|personal)\s+(phone|email|number)\b/gi, 'our business contact')
      .replace(/\b(I|me)\s+(will|can|would)\b/gi, 'we $2')
      .replace(/\bI\s+/g, 'We ')
      .trim();
  }

  // Get fallback responses for when AI fails
  getFallbackResponse(rating) {
    const responses = {
      5: `Thank you so much for the wonderful 5-star review! We're thrilled that you had such a positive experience with ${this.businessName}. Your feedback means the world to our team, and we look forward to serving you again soon!`,
      
      4: `Thank you for the great 4-star review! We're so glad you had a positive experience with ${this.businessName}. We appreciate your feedback and look forward to welcoming you back soon!`,
      
      3: `Thank you for taking the time to leave us a review. We appreciate your feedback and are always looking for ways to improve our service at ${this.businessName}. We'd love the opportunity to exceed your expectations on your next visit!`,
      
      2: `Thank you for your feedback. We're sorry to hear that your experience with ${this.businessName} didn't meet your expectations. We take all feedback seriously and would love the opportunity to make things right. Please contact us directly so we can address your concerns.`,
      
      1: `We sincerely apologize for the poor experience you had with ${this.businessName}. This is not the level of service we strive to provide. Please contact us directly so we can address your concerns and make this right. Your feedback is valuable in helping us improve.`
    };
    
    return responses[rating] || responses[3];
  }

  // Generate responses for multiple reviews
  async generateBulkResponses(reviews, businessInfo = {}) {
    const responses = [];
    const delay = businessInfo.requestDelay || 1000; // Default 1 second delay
    
    for (const review of reviews) {
      try {
        const response = await this.generateResponse(review, businessInfo);
        responses.push({
          reviewId: review.id,
          reviewRating: review.rating,
          reviewerName: review.reviewerName,
          ...response
        });
        
        // Add delay to respect API rate limits
        if (responses.length < reviews.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        responses.push({
          reviewId: review.id,
          success: false,
          error: error.message,
          fallbackResponse: this.getFallbackResponse(review.rating)
        });
      }
    }
    
    return responses;
  }

  // Analyze sentiment of a review (bonus feature)
  async analyzeReviewSentiment(reviewText) {
    if (!this.isReady()) {
      return { sentiment: 'unknown', confidence: 0 };
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of this review. Respond with only: 'positive', 'negative', or 'neutral', followed by a confidence score from 0-1."
          },
          {
            role: "user",
            content: `Review: "${reviewText}"`
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      });

      const result = completion.choices[0].message.content.trim().toLowerCase();
      const sentiment = result.includes('positive') ? 'positive' : 
                       result.includes('negative') ? 'negative' : 'neutral';
      
      // Extract confidence if provided
      const confidenceMatch = result.match(/(\d+\.?\d*)/);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8;

      return { sentiment, confidence };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { sentiment: 'unknown', confidence: 0 };
    }
  }
}

export default new AIService();
