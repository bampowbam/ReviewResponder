import React, { useState, useEffect } from 'react';
import credentialsService from '../services/credentialsService';

const SettingsPanel = ({ aiSettings, setAiSettings }) => {
  const [credentialsStatus, setCredentialsStatus] = useState({
    googleConfigured: false,
    openaiConfigured: false,
    isConfigured: false
  });
  const [showCredentials, setShowCredentials] = useState(false);

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
  const handleSettingChange = (key, value) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setAiSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setAiSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Credentials Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔐 API Credentials Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${
            credentialsStatus.googleConfigured 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  credentialsStatus.googleConfigured 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {credentialsStatus.googleConfigured ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Google API</p>
                  <p className={`text-sm ${
                    credentialsStatus.googleConfigured 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {credentialsStatus.googleConfigured ? 'Connected' : 'Not configured'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            credentialsStatus.openaiConfigured 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  credentialsStatus.openaiConfigured 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {credentialsStatus.openaiConfigured ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">OpenAI API</p>
                  <p className={`text-sm ${
                    credentialsStatus.openaiConfigured 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {credentialsStatus.openaiConfigured ? 'Connected' : 'Not configured'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!credentialsStatus.isConfigured && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  API Setup Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You need to configure your API credentials to enable automatic review management. Click "Connect Google Business" in the header to get started.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* AI Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Response Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Tone</label>
            <select
              value={aiSettings.tone}
              onChange={(e) => handleSettingChange('tone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="empathetic">Empathetic</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Choose the tone for AI-generated responses</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Language</label>
            <select
              value={aiSettings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
              <option value="italian">Italian</option>
              <option value="portuguese">Portuguese</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Language for AI responses</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Template</label>
            <select
              value={aiSettings.responseTemplate}
              onChange={(e) => handleSettingChange('responseTemplate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="personalized">Personalized</option>
              <option value="standard">Standard</option>
              <option value="brief">Brief</option>
              <option value="detailed">Detailed</option>
              <option value="custom">Custom Template</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Response structure and length</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRespond"
              checked={aiSettings.autoRespond}
              onChange={(e) => handleSettingChange('autoRespond', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRespond" className="ml-2 block text-sm text-gray-700">
              Enable Auto-Response
            </label>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Business Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
            <input
              type="text"
              value={aiSettings.businessInfo.name}
              onChange={(e) => handleSettingChange('businessInfo.name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
            <select
              value={aiSettings.businessInfo.type}
              onChange={(e) => handleSettingChange('businessInfo.type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Restaurant">Restaurant</option>
              <option value="Retail Store">Retail Store</option>
              <option value="Electronics Retailer">Electronics Retailer</option>
              <option value="Service Provider">Service Provider</option>
              <option value="Hotel">Hotel</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Automotive">Automotive</option>
              <option value="Beauty & Wellness">Beauty & Wellness</option>
              <option value="Education">Education</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Values & Key Messages</label>
            <textarea
              value={aiSettings.businessInfo.values}
              onChange={(e) => handleSettingChange('businessInfo.values', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Customer satisfaction, Quality products, Fast delivery, Eco-friendly practices"
            />
            <p className="text-xs text-gray-500 mt-1">These values will be incorporated into AI responses</p>
          </div>
        </div>
      </div>

      {/* Google Business Integration */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Google Business Integration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Google Business Profile</p>
                <p className="text-sm text-gray-500">Connect to automatically fetch and respond to reviews</p>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Connect Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Auto-fetch reviews</span>
              </div>
              <p className="text-xs text-gray-500">Automatically import new reviews every hour</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Direct posting</span>
              </div>
              <p className="text-xs text-gray-500">Post responses directly to Google Business</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Automation Rules</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Auto-respond to 5-star reviews</p>
              <p className="text-sm text-gray-500">Automatically generate and post responses to positive reviews</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Priority alerts for negative reviews</p>
              <p className="text-sm text-gray-500">Get instant notifications for 1-2 star reviews</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Weekly analytics email</p>
              <p className="text-sm text-gray-500">Receive weekly performance reports via email</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 API & Advanced Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Required for AI response generation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Delay (seconds)</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="0">Immediate</option>
              <option value="300">5 minutes</option>
              <option value="900">15 minutes</option>
              <option value="1800">30 minutes</option>
              <option value="3600">1 hour</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Delay before auto-posting responses</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div>
              <p className="font-medium text-yellow-800">Manual Review Mode</p>
              <p className="text-sm text-yellow-700">All AI responses require manual approval before posting</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-yellow-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Save Settings */}
      <div className="flex justify-end space-x-3">
        <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          Reset to Defaults
        </button>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
