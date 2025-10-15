import React, { useState } from 'react';
import aiService from '../services/aiService';

const ReviewCard = ({ review, setReviews, aiSettings }) => {
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const handleGenerateResponse = async () => {
    setIsGeneratingResponse(true);
    try {
      const result = await aiService.generateResponse(review, {
        tone: aiSettings.tone,
        businessType: aiSettings.businessType
      });
      const response = result.success ? result.response : result.fallbackResponse;
      setReviews(prevReviews =>
        prevReviews.map(r =>
          r.id === review.id
            ? { ...r, aiResponse: response, responded: true }
            : r
        )
      );
      setShowResponse(true);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating === 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Review Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {review.author.charAt(0)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{review.author}</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
                  {review.rating}/5
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{formatDate(review.date)}</p>
            <p className="text-xs text-gray-400">{review.platform}</p>
          </div>
        </div>

        {/* Review Text */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{review.text}</p>
        </div>

        {/* Status and Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {review.responded ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Responded
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⏳ Pending Response
              </span>
            )}
            <span className="text-xs text-gray-500">{review.business}</span>
          </div>

          <div className="flex space-x-2">
            {!review.responded && (
              <button
                onClick={handleGenerateResponse}
                disabled={isGeneratingResponse}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingResponse ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    🤖 Generate AI Response
                  </>
                )}
              </button>
            )}
            
            {review.aiResponse && (
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showResponse ? 'Hide Response' : 'View Response'}
              </button>
            )}
          </div>
        </div>

        {/* AI Generated Response */}
        {review.aiResponse && showResponse && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-blue-800">🤖 AI Generated Response</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {aiSettings.tone}
                </span>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed">{review.aiResponse}</p>
              <div className="mt-3 flex space-x-2">
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  📝 Edit Response
                </button>
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  📋 Copy to Clipboard
                </button>
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  🚀 Post to Google
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
