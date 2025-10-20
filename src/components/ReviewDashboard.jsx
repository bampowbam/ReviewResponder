import React, { useState, useEffect } from 'react';
import ReviewCard from './ReviewCard';
import googleService from '../services/googleService';
import credentialsService from '../services/credentialsService';
import webhookService from '../services/webhookService';

const ReviewDashboard = ({ reviews, setReviews, aiSettings }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [showBusinessManager, setShowBusinessManager] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState({});
  
  // Real-time notifications
  const [notifications, setNotifications] = useState([]);
  const [isWebhookConnected, setIsWebhookConnected] = useState(false);

  useEffect(() => {
    checkSetupAndLoadData();
    setupWebhookConnection();
    
    return () => {
      // Cleanup webhook connection
      webhookService.stopListening();
    };
  }, []);

  useEffect(() => {
    if (autoRefreshEnabled && selectedLocation) {
      const interval = setInterval(() => {
        fetchReviews();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, selectedLocation]);

  const checkSetupAndLoadData = async () => {
    try {
      setIsLoading(true);
      
      // Check credentials status
      const status = await credentialsService.getStatus();
      setCredentialsStatus(status);

      if (status.isConfigured) {
        // Check Google auth status and load accounts
        const authStatus = await googleService.getAuthStatus();
        
        if (authStatus.isAuthenticated) {
          await loadConnectedAccounts();
        }
      }
    } catch (error) {
      console.error('Error checking setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time webhook connection
  const setupWebhookConnection = async () => {
    try {
      // Request notification permission
      await webhookService.requestNotificationPermission();
      
      // Setup event listeners
      webhookService.addEventListener('new_review', handleNewReview);
      webhookService.addEventListener('automation_success', handleAutomationSuccess);
      webhookService.addEventListener('automation_error', handleAutomationError);
      
      // Start listening for real-time events
      webhookService.startListening();
      setIsWebhookConnected(true);
      
      console.log('🔔 Real-time notifications enabled');
    } catch (error) {
      console.error('Error setting up webhook connection:', error);
    }
  };

  // Handle real-time new review notification
  const handleNewReview = (reviewData) => {
    console.log('🆕 New review received in real-time:', reviewData);
    
    // Add notification
    addNotification({
      type: 'new_review',
      title: `⭐ New ${reviewData.starRating}-star review!`,
      message: `From: ${reviewData.reviewer?.displayName || 'Anonymous customer'}`,
      timestamp: new Date().toISOString(),
      data: reviewData
    });
    
    // Refresh reviews if same location
    if (selectedLocation && reviewData.locationName?.includes(selectedLocation)) {
      fetchReviews();
    }
  };

  // Handle automation success notification
  const handleAutomationSuccess = (data) => {
    console.log('✅ Automation success:', data);
    
    addNotification({
      type: 'automation_success',
      title: '🤖 AI Response Posted',
      message: `Responded to ${data.reviewRating}⭐ review automatically`,
      timestamp: new Date().toISOString(),
      data
    });
  };

  // Handle automation error notification
  const handleAutomationError = (data) => {
    console.error('❌ Automation error:', data);
    
    addNotification({
      type: 'automation_error',
      title: '⚠️ Automation Failed',
      message: `Failed to respond to review: ${data.error}`,
      timestamp: new Date().toISOString(),
      data
    });
  };

  // Add notification to state
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    
    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.timestamp !== notification.timestamp));
    }, 10000);
  };

  // Test webhook functionality
  const testWebhook = () => {
    webhookService.simulateWebhook('new_review', {
      reviewId: 'test_123',
      starRating: 5,
      reviewer: { displayName: 'Test Customer' },
      comment: 'This is a test notification!',
      createTime: new Date().toISOString(),
      business: { name: selectedLocation || 'Test Business' }
    });
  };

  const loadConnectedAccounts = async () => {
    try {
      const accountsData = await googleService.getAccounts();
      setConnectedAccounts(accountsData.accounts || []);
      
      if (accountsData.accounts?.length > 0 && !selectedAccount) {
        const firstAccount = accountsData.accounts[0];
        setSelectedAccount(firstAccount);
        await loadLocationsForAccount(firstAccount.name);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadLocationsForAccount = async (accountId) => {
    try {
      const locationsData = await googleService.getLocations(accountId);
      setLocations(locationsData.locations || []);
      
      if (locationsData.locations?.length > 0 && !selectedLocation) {
        const firstLocation = locationsData.locations[0];
        setSelectedLocation(firstLocation);
        await fetchReviews();
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const fetchReviews = async () => {
    if (!selectedLocation) return;
    
    try {
      setIsLoading(true);
      const reviewsData = await googleService.getReviews(selectedLocation.name);
      
      // Transform Google reviews to our format
      const transformedReviews = reviewsData.reviews?.map(review => ({
        id: review.name,
        rating: review.starRating || 0,
        reviewer: review.reviewer?.displayName || 'Anonymous',
        date: review.createTime || new Date().toISOString(),
        text: review.comment || '',
        responded: !!review.reply,
        aiResponse: review.reply?.comment || null
      })) || [];
      
      setReviews(transformedReviews);
      setLastRefresh(new Date());
      
      console.log(`📊 Fetched ${transformedReviews.length} reviews from ${selectedLocation.locationName}`);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountChange = async (account) => {
    setSelectedAccount(account);
    setSelectedLocation(null);
    setLocations([]);
    setReviews([]);
    await loadLocationsForAccount(account.name);
  };

  const handleLocationChange = async (location) => {
    setSelectedLocation(location);
    setReviews([]);
    await fetchReviews();
  };

  const handleDisconnect = async () => {
    try {
      // Reset all state
      setConnectedAccounts([]);
      setSelectedAccount(null);
      setSelectedLocation(null);
      setLocations([]);
      setReviews([]);
      setShowBusinessManager(false);
      
      // Note: In a real implementation, you'd revoke tokens here
      console.log('🔓 Disconnected from Google My Business');
      
      // Refresh credentials status
      await checkSetupAndLoadData();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const getFilteredReviews = () => {
    let filtered = reviews;

    // Filter by response status
    if (filter === 'responded') {
      filtered = filtered.filter(review => review.responded);
    } else if (filter === 'pending') {
      filtered = filtered.filter(review => !review.responded);
    } else if (filter === 'positive') {
      filtered = filtered.filter(review => review.rating >= 4);
    } else if (filter === 'negative') {
      filtered = filtered.filter(review => review.rating <= 2);
    }

    // Sort reviews
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'rating-high') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-low') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    return filtered;
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.responded).length,
    responded: reviews.filter(r => r.responded).length,
    avgRating: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  };

  return (
    <div className="space-y-6">
      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.slice(0, 3).map((notification, index) => (
            <div
              key={notification.timestamp}
              className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 ${
                notification.type === 'new_review' 
                  ? 'bg-blue-50 border-blue-400'
                  : notification.type === 'automation_success'
                  ? 'bg-green-50 border-green-400'
                  : 'bg-red-50 border-red-400'
              }`}
            >
              <div className="font-medium text-gray-900">{notification.title}</div>
              <div className="text-sm text-gray-600">{notification.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Business Management Header */}
      {credentialsStatus.isConfigured && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  {selectedAccount ? (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        {selectedAccount.accountName || 'Connected Business'}
                      </h3>
                      {selectedLocation && (
                        <p className="text-sm text-gray-500">
                          📍 {selectedLocation.locationName || selectedLocation.name}
                        </p>
                      )}
                    </>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-gray-900">No Business Connected</h3>
                      <p className="text-sm text-gray-500">Connect your Google My Business account</p>
                    </div>
                  )}
                </div>
              </div>
              
              {lastRefresh && (
                <div className="text-xs text-gray-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {selectedLocation && (
                <>
                  <button
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      autoRefreshEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {autoRefreshEnabled ? '🔄 Auto-refresh ON' : '🔄 Auto-refresh OFF'}
                  </button>
                  
                  <button
                    onClick={fetchReviews}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    {isLoading ? '↻ Refreshing...' : '↻ Refresh Reviews'}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      isWebhookConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isWebhookConnected ? '🔔 Live' : '⏸️ Offline'}
                    </div>
                    
                    <button
                      onClick={testWebhook}
                      className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
                    >
                      🧪 Test
                    </button>
                  </div>
                </>
              )}
              
              <button
                onClick={() => setShowBusinessManager(!showBusinessManager)}
                className="border border-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
              >
                ⚙️ Manage Businesses
              </button>
            </div>
          </div>
          
          {/* Business Manager Panel */}
          {showBusinessManager && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Business Management</h4>
              
              {connectedAccounts.length > 0 ? (
                <div className="space-y-3">
                  {/* Account Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Business Account
                    </label>
                    <select
                      value={selectedAccount?.name || ''}
                      onChange={(e) => {
                        const account = connectedAccounts.find(acc => acc.name === e.target.value);
                        if (account) handleAccountChange(account);
                      }}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
                    >
                      {connectedAccounts.map(account => (
                        <option key={account.name} value={account.name}>
                          {account.accountName || account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Location Selection */}
                  {locations.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Location
                      </label>
                      <select
                        value={selectedLocation?.name || ''}
                        onChange={(e) => {
                          const location = locations.find(loc => loc.name === e.target.value);
                          if (location) handleLocationChange(location);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
                      >
                        {locations.map(location => (
                          <option key={location.name} value={location.name}>
                            {location.locationName || location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleDisconnect}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                    >
                      🔓 Disconnect
                    </button>
                    <button
                      onClick={() => setShowBusinessManager(false)}
                      className="border border-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-3">No businesses connected</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    🔗 Connect Google My Business
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending Response</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.responded}</p>
              <p className="text-sm text-gray-500">Responded</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-sm text-gray-500">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending Response</option>
                <option value="responded">Responded</option>
                <option value="positive">Positive (4-5 stars)</option>
                <option value="negative">Negative (1-2 stars)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              🤖 Auto-Generate Responses
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              📥 Import Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {getFilteredReviews().length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500">Try adjusting your filters or import some reviews to get started.</p>
          </div>
        ) : (
          getFilteredReviews().map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              setReviews={setReviews}
              aiSettings={aiSettings}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewDashboard;
