import React from 'react';

const ReviewAnalytics = ({ reviews }) => {
  // Calculate analytics data
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : 0;
  const responseRate = totalReviews > 0 ? ((reviews.filter(r => r.responded).length / totalReviews) * 100).toFixed(1) : 0;
  
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const sentimentData = {
    positive: reviews.filter(r => r.rating >= 4).length,
    neutral: reviews.filter(r => r.rating === 3).length,
    negative: reviews.filter(r => r.rating <= 2).length,
  };

  const monthlyData = reviews.reduce((acc, review) => {
    const month = new Date(review.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const recentTrends = Object.entries(monthlyData).slice(-6);

  const getPercentage = (value, total) => total > 0 ? ((value / total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-xs text-green-600">↑ 0.2 vs last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{responseRate}%</p>
              <p className="text-sm text-gray-500">Response Rate</p>
              <p className="text-xs text-green-600">↑ 15% vs last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-xs text-green-600">↑ 8 this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{getPercentage(sentimentData.positive, totalReviews)}%</p>
              <p className="text-sm text-gray-500">Positive Sentiment</p>
              <p className="text-xs text-green-600">↑ 5% vs last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratingDistribution[rating];
              const percentage = getPercentage(count, totalReviews);
              return (
                <div key={rating} className="flex items-center">
                  <div className="flex items-center w-16">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <svg className="w-4 h-4 ml-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center w-20 justify-end">
                    <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Positive (4-5 stars)</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{sentimentData.positive}</span>
                <span className="text-sm text-gray-500 ml-2">({getPercentage(sentimentData.positive, totalReviews)}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Neutral (3 stars)</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{sentimentData.neutral}</span>
                <span className="text-sm text-gray-500 ml-2">({getPercentage(sentimentData.neutral, totalReviews)}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Negative (1-2 stars)</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{sentimentData.negative}</span>
                <span className="text-sm text-gray-500 ml-2">({getPercentage(sentimentData.negative, totalReviews)}%)</span>
              </div>
            </div>
          </div>
          
          {/* Sentiment Chart */}
          <div className="mt-6">
            <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{ width: `${getPercentage(sentimentData.positive, totalReviews)}%` }}
              ></div>
              <div
                className="bg-yellow-500"
                style={{ width: `${getPercentage(sentimentData.neutral, totalReviews)}%` }}
              ></div>
              <div
                className="bg-red-500"
                style={{ width: `${getPercentage(sentimentData.negative, totalReviews)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Trends (Last 6 Months)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recentTrends.map(([month, count]) => (
            <div key={month} className="text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-xs text-gray-500 mt-1">{month}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Performance */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🤖 AI Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">98.5%</div>
            <div className="text-sm text-blue-800">Response Accuracy</div>
            <div className="text-xs text-blue-600 mt-1">Based on user feedback</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">2.3s</div>
            <div className="text-sm text-blue-800">Avg Response Time</div>
            <div className="text-xs text-blue-600 mt-1">Per review generation</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">87%</div>
            <div className="text-sm text-blue-800">Auto-Approval Rate</div>
            <div className="text-xs text-blue-600 mt-1">Responses used as-is</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Analytics</h3>
            <p className="text-sm text-gray-600">Download your review data and analytics reports</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              📊 Export CSV
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              📈 Export PDF Report
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              📧 Email Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAnalytics;
