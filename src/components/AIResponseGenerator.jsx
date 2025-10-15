import React, { useState } from 'react';
import aiService from '../services/aiService';

const AIResponseGenerator = ({ reviews, addAIResponse, aiSettings }) => {
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponses, setGeneratedResponses] = useState({});
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewMode, setPreviewMode] = useState(true);

  const pendingReviews = reviews.filter(review => !review.responded);

  const handleSelectReview = (reviewId) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === pendingReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(pendingReviews.map(review => review.id));
    }
  };

  const handleGenerateSelected = async () => {
    setIsGenerating(true);
    const responses = {};
    
    try {
      for (const reviewId of selectedReviews) {
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          const result = await aiService.generateResponse(review, {
            tone: aiSettings.tone,
            businessType: aiSettings.businessType,
            customInstructions: customPrompt
          });
          responses[reviewId] = result.success ? result.response : result.fallbackResponse;
        }
      }
      setGeneratedResponses(responses);
    } catch (error) {
      console.error('Error generating responses:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyResponses = () => {
    Object.entries(generatedResponses).forEach(([reviewId, response]) => {
      addAIResponse(parseInt(reviewId), response);
    });
    setGeneratedResponses({});
    setSelectedReviews([]);
  };

  const handleRegenerateResponse = async (reviewId) => {
    setIsGenerating(true);
    try {
      const review = reviews.find(r => r.id === reviewId);
      const result = await aiService.generateResponse(review, {
        tone: aiSettings.tone,
        businessType: aiSettings.businessType,
        customInstructions: customPrompt
      });
      setGeneratedResponses(prev => ({
        ...prev,
        [reviewId]: result.success ? result.response : result.fallbackResponse
      }));
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setIsGenerating(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Response Generator</h2>
            <p className="text-sm text-gray-600">Generate intelligent responses to customer reviews using AI</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🤖 AI Model: GPT-4
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Tone: {aiSettings.tone}
            </span>
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Instructions (Optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Add specific instructions for AI responses (e.g., mention current promotions, address specific concerns, etc.)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedReviews.length === pendingReviews.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-500">
              {selectedReviews.length} of {pendingReviews.length} reviews selected
            </span>
          </div>
          <div className="flex space-x-3">
            {Object.keys(generatedResponses).length > 0 && (
              <button
                onClick={handleApplyResponses}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Apply All Responses
              </button>
            )}
            <button
              onClick={handleGenerateSelected}
              disabled={selectedReviews.length === 0 || isGenerating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                `🤖 Generate Responses (${selectedReviews.length})`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {pendingReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
            <div className="text-green-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">All reviews have been responded to. Great job!</p>
          </div>
        ) : (
          pendingReviews.map(review => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                {/* Review Header with Selection */}
                <div className="flex items-start space-x-4 mb-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(review.id)}
                    onChange={() => handleSelectReview(review.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
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
                            <span className="text-sm text-gray-500">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{review.text}</p>
                    
                    {/* Generated Response */}
                    {generatedResponses[review.id] && (
                      <div className="bg-blue-50 rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">🤖 AI Generated Response</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRegenerateResponse(review.id)}
                              disabled={isGenerating}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                            >
                              🔄 Regenerate
                            </button>
                            <button
                              onClick={() => {
                                const newResponses = { ...generatedResponses };
                                delete newResponses[review.id];
                                setGeneratedResponses(newResponses);
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-blue-900 leading-relaxed">{generatedResponses[review.id]}</p>
                        <div className="mt-3">
                          <button
                            onClick={() => addAIResponse(review.id, generatedResponses[review.id])}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            Apply This Response
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-3">💡 AI Response Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span>✨</span>
            <div>
              <strong>Personalized:</strong> AI considers the specific review content and rating
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span>🎯</span>
            <div>
              <strong>Tone Matching:</strong> Responses match your configured business tone
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span>🔧</span>
            <div>
              <strong>Customizable:</strong> Add custom instructions for specific situations
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span>⚡</span>
            <div>
              <strong>Fast:</strong> Generate multiple responses in seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResponseGenerator;
