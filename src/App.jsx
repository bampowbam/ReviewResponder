import React, { useState, useEffect } from 'react';
import ReviewDashboard from './components/ReviewDashboard';
import AIResponseGenerator from './components/AIResponseGenerator';
import ReviewAnalytics from './components/ReviewAnalytics';
import SettingsPanel from './components/SettingsPanel';
import CredentialsModal from './components/CredentialsModal';
import automationService from './services/automationService';
import credentialsService from './services/credentialsService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reviews, setReviews] = useState([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState({
    googleConfigured: false,
    openaiConfigured: false,
    isConfigured: false
  });

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

  // Check credentials status on mount
  useEffect(() => {
    checkCredentialsStatus();
  }, []);

  const checkCredentialsStatus = async () => {
    try {
      const status = await credentialsService.getStatus();
      setCredentialsStatus(status);
    } catch (error) {
      console.error('Error checking credentials status:', error);
    }
  };

  // Handle automation service when autoRespond changes
  useEffect(() => {
    let isCancelled = false;
    
    const handleAutomation = async () => {
      try {
        if (isCancelled) return;
        
        if (aiSettings.autoRespond) {
          console.log('🤖 Starting AI automation service...');
          await automationService.start(aiSettings);
        } else {
          console.log('🛑 Stopping AI automation service...');
          await automationService.stop();
        }
      } catch (error) {
        console.error('Error managing automation service:', error);
      }
    };

    handleAutomation();

    // Cleanup function
    return () => {
      isCancelled = true;
      // Only stop on component unmount, not on setting changes
      if (!aiSettings.autoRespond) {
        automationService.stop().catch(console.error);
      }
    };
  }, [aiSettings.autoRespond]); // Remove aiSettings from dependencies to prevent unnecessary restarts

  const handleSettingsChange = (newSettings) => {
    setAiSettings(newSettings);
  };

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

  const handleCredentialsSuccess = () => {
    checkCredentialsStatus();
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
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                credentialsStatus.isConfigured
                  ? aiSettings.autoRespond 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {credentialsStatus.isConfigured
                  ? aiSettings.autoRespond ? '🤖 Auto-Responding Active' : 'AI Ready'
                  : '⚙️ Setup Required'
                }
              </span>
              <button 
                onClick={handleConnectGoogle}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  credentialsStatus.isConfigured
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {credentialsStatus.isConfigured ? '✓ Connected' : 'Connect Google Business'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Connect Google Business Modal */}
      <CredentialsModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleCredentialsSuccess}
      />

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
          <SettingsPanel aiSettings={aiSettings} setAiSettings={handleSettingsChange} />
        )}
      </main>
    </div>
  );
}

export default App;
