import React, { useState, useEffect } from 'react';
import ReviewDashboard from './components/ReviewDashboard';
import AIResponseGenerator from './components/AIResponseGenerator';
import ReviewAnalytics from './components/ReviewAnalytics';
import SettingsPanel from './components/SettingsPanel';
import googleMyBusinessService from './services/googleMyBusinessService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const [aiSettings, setAiSettings] = useState({
    tone: 'professional',
    language: 'english',
    autoRespond: false,
    responseTemplate: 'personalized',
    businessInfo: {
      name: import.meta.env.VITE_BUSINESS_NAME || 'Your Business',
      type: 'Business',
      values: 'Customer satisfaction and quality service'
    }
  });

  // Check if user is already authenticated
  useEffect(() => {
    const accessToken = googleMyBusinessService.getAccessToken();
    if (accessToken) {
      setAuthenticated(true);
      fetchReviews();
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !authenticated) {
      handleAuthCallback(code);
    }
  }, [authenticated]);

  const handleAuthCallback = async (code) => {
    try {
      setLoading(true);
      await googleMyBusinessService.exchangeCodeForToken(code);
      setAuthenticated(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      await fetchReviews();
    } catch (error) {
      setError('Failed to authenticate with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const authUrl = await googleMyBusinessService.initializeAuth();
      window.location.href = authUrl;
    } catch (error) {
      setError('Failed to initialize Google authentication: ' + error.message);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const reviewsData = await googleMyBusinessService.getReviews();
      
      // Transform the Google API response to our format
      const transformedReviews = reviewsData.reviews?.map((review, index) => ({
        id: review.name || `review-${index}`,
        author: review.reviewer?.displayName || 'Anonymous',
        rating: review.starRating || 0,
        text: review.comment || '',
        date: review.createTime || new Date().toISOString(),
        platform: 'Google Reviews',
        responded: !!review.reply,
        response: review.reply?.comment || '',
        business: aiSettings.businessInfo.name
      })) || [];

      setReviews(transformedReviews);
    } catch (error) {
      setError('Failed to fetch reviews: ' + error.message);
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAIResponse = async (reviewId, response) => {
    try {
      // Find the review
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      // Send response to Google My Business API
      await googleMyBusinessService.replyToReview(review.id, response);

      // Update local state
      setReviews(prevReviews =>
        prevReviews.map(r =>
          r.id === reviewId
            ? { ...r, response: response, responded: true }
            : r
        )
      );
    } catch (error) {
      setError('Failed to send response: ' + error.message);
      console.error('Error sending response:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Review Response</h1>
                <p className="text-sm text-gray-500">Automated Google Reviews Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {authenticated ? (
                <>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Connected
                  </span>
                  <button 
                    onClick={fetchReviews}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : '🔄 Refresh Reviews'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect Google Business'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setError('')}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Required Message */}
      {!authenticated && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="text-blue-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Connect Your Google Business Account</h3>
            <p className="text-blue-700 mb-6">
              To start managing your reviews with AI-powered responses, please connect your Google My Business account.
            </p>
            <button 
              onClick={handleGoogleAuth}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Google Business Account
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {authenticated && (
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: '📊' },
                { id: 'ai-generator', name: 'AI Generator', icon: '🤖' },
                { id: 'analytics', name: 'Analytics', icon: '📈' },
                { id: 'settings', name: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      {authenticated && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <ReviewDashboard 
              reviews={reviews} 
              setReviews={setReviews} 
              aiSettings={aiSettings}
              loading={loading}
              onRefresh={fetchReviews}
            />
          )}
          {activeTab === 'ai-generator' && (
            <AIResponseGenerator 
              reviews={reviews} 
              addAIResponse={addAIResponse}
              aiSettings={aiSettings}
            />
          )}
          {activeTab === 'analytics' && (
            <ReviewAnalytics reviews={reviews} />
          )}
          {activeTab === 'settings' && (
            <SettingsPanel aiSettings={aiSettings} setAiSettings={setAiSettings} />
          )}
        </main>
      )}
    </div>
  );
}

export default App;
