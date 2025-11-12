// Railway Deployment Server
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory data storage (persists within Railway instance)
let recentData = [];
let notifications = [];
let notificationIdCounter = 0;
const maxDataSize = 100;
const maxNotifications = 50;

// Helper functions
function isErrorNotification(notification) {
  return (
    notification.type.includes('error') ||
    notification.type === 'ai_credits' ||
    notification.type === 'rate_limit' ||
    notification.type === 'timeout'
  );
}

function filterBySince(items, sinceId) {
  if (sinceId === undefined || sinceId === null) {
    return items;
  }
  const id = parseInt(sinceId);
  return items.filter(item => item.id > id);
}

// API Routes
app.get('/api/data', (req, res) => {
  console.log(`GET /api/data - returning ${recentData.length} items`);
  res.json({
    success: true,
    data: recentData,
    count: recentData.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('=== N8N DATA RECEIVED ===');
    console.log('FULL DATA:', JSON.stringify(data, null, 2));

    // NO FILTERING - all data goes to ad_analysis
    let dataType = 'ad_analysis';

    const newItem = {
      data,
      dataType,
      timestamp: new Date().toISOString(),
      requestId,
      source: 'api'
    };

    recentData.push(newItem);

    if (recentData.length > maxDataSize) recentData.shift();

    console.log(`POST /api/data - added ${dataType} item, total items: ${recentData.length}`);

    res.json({
      success: true,
      message: `${dataType} data received and stored`,
      dataType,
      requestId,
      totalItems: recentData.length
    });
  } catch (error) {
    console.error('POST /api/data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/data', (req, res) => {
  try {
    const previousCount = recentData.length;
    recentData = [];

    console.log(`DELETE /api/data - cleared ${previousCount} items`);

    res.json({
      success: true,
      message: 'All data cleared successfully',
      previousCount,
      currentCount: 0
    });
  } catch (error) {
    console.error('DELETE /api/data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Notification endpoints
app.post('/api/notification', (req, res) => {
  try {
    const { type, message, competitor_name, metadata } = req.body;

    const notification = {
      id: notificationIdCounter++,
      type,
      message,
      competitor_name,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    notifications.push(notification);

    // Keep only last 50 notifications
    if (notifications.length > maxNotifications) {
      notifications.shift();
    }

    console.log(`NOTIFICATION: [${type}] ${message}`);

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('POST /api/notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/notifications', (req, res) => {
  try {
    const { since } = req.query;
    const filteredNotifications = filterBySince(notifications, since);

    res.json({
      success: true,
      notifications: filteredNotifications,
      count: filteredNotifications.length,
      latestId: notifications.length > 0 ? notifications[notifications.length - 1].id : -1
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/notifications', (req, res) => {
  try {
    const previousCount = notifications.length;
    notifications = [];
    notificationIdCounter = 0;

    console.log(`DELETE /api/notifications - cleared ${previousCount} notifications`);

    res.json({
      success: true,
      message: 'All notifications cleared',
      previousCount
    });
  } catch (error) {
    console.error('DELETE /api/notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ NEW: Dedicated error endpoint
app.get('/api/errors', (req, res) => {
  try {
    const { since } = req.query;

    // Filter only error notifications
    const errorNotifications = notifications.filter(isErrorNotification);
    const filteredErrors = filterBySince(errorNotifications, since);

    res.json({
      success: true,
      errors: filteredErrors,
      count: filteredErrors.length,
      latestId: notifications.length > 0 ? notifications[notifications.length - 1].id : -1
    });
  } catch (error) {
    console.error('GET /api/errors error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dataCount: recentData.length,
    notificationCount: notifications.length,
    errorCount: notifications.filter(isErrorNotification).length,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dashboard server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access your dashboard at: http://localhost:${PORT}`);
});

module.exports = app;