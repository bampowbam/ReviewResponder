import React, { useState, useEffect } from 'react';
import credentialsService from '../services/credentialsService';
import googleService from '../services/googleService';

const CredentialsModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('setup'); // 'setup', 'credentials', 'google-auth', 'testing', 'success'
  const [credentials, setCredentials] = useState({
    googleClientId: '',
    googleClientSecret: '',
    openaiApiKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testResults, setTestResults] = useState({
    google: null,
    openai: null
  });
  const [googleAuthData, setGoogleAuthData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkExistingCredentials();
    }
  }, [isOpen]);

  const checkExistingCredentials = async () => {
    try {
      const status = await credentialsService.getStatus();
      if (status.isConfigured) {
        setStep('success');
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSaveCredentials = async () => {
    setLoading(true);
    setError('');

    try {
      await credentialsService.saveCredentials(credentials);
      setStep('google-auth');
      await initializeGoogleAuth();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleAuth = async () => {
    try {
      const authData = await googleService.initializeAuth();
      setGoogleAuthData(authData);
    } catch (error) {
      setError('Failed to initialize Google authentication: ' + error.message);
    }
  };

  const handleGoogleAuth = () => {
    if (googleAuthData?.authUrl) {
      // Open Google auth URL in new window
      const authWindow = window.open(
        googleAuthData.authUrl,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for auth completion
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          // Check auth status after window closes
          setTimeout(checkGoogleAuthStatus, 1000);
        }
      }, 1000);
    }
  };

  const checkGoogleAuthStatus = async () => {
    try {
      const status = await googleService.getAuthStatus();
      if (status.isAuthenticated) {
        setStep('testing');
        await testConnections();
      } else {
        setError('Google authentication was not completed. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify Google authentication: ' + error.message);
    }
  };

  const testConnections = async () => {
    try {
      const [googleResult, openaiResult] = await Promise.all([
        credentialsService.testGoogleConnection(),
        credentialsService.testOpenAIConnection()
      ]);

      setTestResults({
        google: googleResult,
        openai: openaiResult
      });

      if (googleResult.success && openaiResult.success) {
        setTimeout(() => {
          setStep('success');
        }, 2000);
      }
    } catch (error) {
      setError('Connection tests failed: ' + error.message);
    }
  };

  const handleComplete = () => {
    onSuccess && onSuccess();
    onClose();
    setStep('setup');
    setCredentials({
      googleClientId: '',
      googleClientSecret: '',
      openaiApiKey: ''
    });
    setTestResults({ google: null, openai: null });
    setGoogleAuthData(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Connect Google My Business</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Setup Instructions Step */}
        {step === 'setup' && (
          <div className="space-y-6">
            <p className="text-gray-600">
              To connect your Google My Business account and start managing reviews with AI, follow these steps:
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">📋 Setup Instructions:</h3>
              <ol className="text-sm text-blue-800 space-y-3 list-decimal list-inside">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the <strong>Google My Business API</strong></li>
                <li>Go to <strong>APIs & Services → Credentials</strong></li>
                <li>Create <strong>OAuth 2.0 Client IDs</strong> credentials</li>
                <li>Set the application type to <strong>Web application</strong></li>
                <li>Add <code>http://localhost:5173</code> to authorized origins</li>
                <li>Copy your Client ID and Client Secret</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-4">🔑 OpenAI API Key:</h3>
              <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">OpenAI API Keys</a></li>
                <li>Create a new secret key</li>
                <li>Copy the API key (starts with 'sk-')</li>
              </ol>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep('credentials')}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                I Have My Credentials
              </button>
              <button
                onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Open Google Console
              </button>
            </div>
          </div>
        )}

        {/* Credentials Input Step */}
        {step === 'credentials' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h2m-6 4h6"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Enter Your API Credentials</h3>
              <p className="text-gray-600">Securely store your credentials to enable automatic review management</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Client ID *
                </label>
                <input
                  type="text"
                  value={credentials.googleClientId}
                  onChange={(e) => handleInputChange('googleClientId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456789-abc123.apps.googleusercontent.com"
                />
                <p className="text-xs text-gray-500 mt-1">From Google Cloud Console → APIs & Services → Credentials</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Client Secret *
                </label>
                <input
                  type="password"
                  value={credentials.googleClientSecret}
                  onChange={(e) => handleInputChange('googleClientSecret', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Google Client Secret"
                />
                <p className="text-xs text-gray-500 mt-1">Keep this secret and secure</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key *
                </label>
                <input
                  type="password"
                  value={credentials.openaiApiKey}
                  onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-..."
                />
                <p className="text-xs text-gray-500 mt-1">From OpenAI Platform → API Keys</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSaveCredentials}
                disabled={loading || !credentials.googleClientId || !credentials.googleClientSecret || !credentials.openaiApiKey}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Saving...' : 'Save & Test Connection'}
              </button>
            </div>
          </div>
        )}

        {/* Google Authentication Step */}
        {step === 'google-auth' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Authorize Google Access</h3>
              <p className="text-gray-600">Connect to your Google My Business account to enable automatic review management</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">🔐 What happens next:</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• You'll be redirected to Google's secure login page</li>
                <li>• Grant permission to access your Google My Business account</li>
                <li>• Return here to complete the setup process</li>
                <li>• Your credentials will be securely stored</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => setStep('credentials')}
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={handleGoogleAuth}
                disabled={loading || !googleAuthData?.authUrl}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Initializing...' : 'Authorize Google Access'}
              </button>
            </div>
          </div>
        )}

        {/* Testing Step */}
        {step === 'testing' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Testing API Connections</h3>
              <p className="text-gray-600">Verifying your credentials...</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  testResults.google === null ? 'bg-yellow-100' :
                  testResults.google?.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {testResults.google === null ? (
                    <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : testResults.google?.success ? (
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
                  <p className="font-medium text-gray-900">Google My Business API</p>
                  <p className="text-sm text-gray-500">
                    {testResults.google === null ? 'Testing connection...' :
                     testResults.google?.success ? 'Connection successful' : 'Connection failed'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  testResults.openai === null ? 'bg-yellow-100' :
                  testResults.openai?.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {testResults.openai === null ? (
                    <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : testResults.openai?.success ? (
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
                  <p className="text-sm text-gray-500">
                    {testResults.openai === null ? 'Testing connection...' :
                     testResults.openai?.success ? 'Connection successful' : 'Connection failed'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🎉 Setup Complete!</h3>
              <p className="text-gray-600 mb-6">
                Your Google My Business account is now connected and ready to manage reviews with AI.
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">✅ What's Working Now:</h4>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• Automatic review fetching from Google My Business</li>
                <li>• AI-powered response generation using OpenAI</li>
                <li>• Secure credential storage</li>
                <li>• Real-time review monitoring</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">🚀 Next Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Configure your AI response settings in the Settings panel</li>
                <li>• Set up automation rules for different review types</li>
                <li>• Import existing reviews to get started</li>
                <li>• Enable auto-response for 5-star reviews</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleComplete}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Start Managing Reviews
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialsModal;
