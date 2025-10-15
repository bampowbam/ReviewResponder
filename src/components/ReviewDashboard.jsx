import React, { useState, useEffect } from 'react';
import ReviewCard from './ReviewCard';
import googleMyBusinessService from '../services/googleMyBusinessService';

const ReviewDashboard = ({ reviews, setReviews, aiSettings }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

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
