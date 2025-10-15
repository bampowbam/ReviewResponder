import React, { useState } from 'react';
import ReviewDashboard from './components/ReviewDashboard';
import AIResponseGenerator from './components/AIResponseGenerator';
import ReviewAnalytics from './components/ReviewAnalytics';
import SettingsPanel from './components/SettingsPanel';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reviews, setReviews] = useState([]);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [aiSettings, setAiSettings] = useState({
    tone: 'professional',
    language: 'english',
    autoRespond: false,
    responseTemplate: 'personalized',
    businessInfo: {
      name: 'Your Business',
      type: 'Business',
      values: 'Customer satisfaction and quality service'
    }
  });

  const addAIResponse = (reviewId, response) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === reviewId
          ? { ...review, aiResponse: response, responded: true }
          : review
      )
    );
  };

  const handleConnectGoogle = () => {
    setShowConnectModal(true);
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
                <h1 className="text-xl font-bold text-gray-900">Mainager</h1>
                <p className="text-sm text-gray-500">Automated Google Reviews Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                AI Ready
              </span>
              <button 
                onClick={handleConnectGoogle}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Google Business
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Connect Google Business Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Connect Google My Business</h2>
              <button 
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                To connect your Google My Business account and start managing reviews with AI:
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to Google Cloud Console</li>
                  <li>Create a new project or select existing</li>
                  <li>Enable Google My Business API</li>
                  <li>Create OAuth 2.0 credentials</li>
                  <li>Add your API keys to the .env file</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Environment Variables:</h3>
                <div className="text-xs text-yellow-800 font-mono bg-yellow-100 p-2 rounded">
                  VITE_GOOGLE_CLIENT_ID=your_client_id<br/>
                  VITE_OPENAI_API_KEY=your_openai_key
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Google Cloud Console
                </button>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <ReviewDashboard 
            reviews={reviews} 
            setReviews={setReviews} 
            aiSettings={aiSettings}
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
    </div>
  );
}

export default App;
