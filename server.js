// Railway Deployment Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Authentication Configuration
const API_KEY = process.env.API_KEY || process.env.DASHBOARD_API_KEY;
if (!API_KEY) {
  console.warn('⚠️  WARNING: No API_KEY environment variable set. Authentication is disabled.');
  console.warn('⚠️  Set API_KEY or DASHBOARD_API_KEY environment variable for production use.');
}

// Authentication Middleware
function authenticate(req, res, next) {
  // Skip authentication if no API key is configured (development mode)
  if (!API_KEY) {
    return next();
  }

  // Get API key from header (preferred) or query parameter
  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '') || req.query.api_key;

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide an API key via X-API-Key header or Authorization Bearer token.'
    });
  }

  if (providedKey !== API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key. Access denied.'
    });
  }

  next();
}

// Security Headers Middleware
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Prevent DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  // Disable powered-by header
  res.removeHeader('X-Powered-By');
  // Content Security Policy (basic - can be customized)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';");
  // Permissions Policy (restrict certain browser features)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

// Middleware
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add size limit

// Request timeout middleware (30 seconds)
const REQUEST_TIMEOUT = 30000; // 30 seconds
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout'
      });
    }
  });
  next();
});

// Note: static files are served AFTER the root route to allow API key injection

// In-memory data storage (persists within Railway instance)
let recentData = [];
let notifications = [];
let notificationIdCounter = 0;
const maxDataSize = 100;
const maxNotifications = 50;

// Helper functions
function isErrorNotification(notification) {
  if (!notification || !notification.type) {
    return false;
  }
  return (
    (typeof notification.type === 'string' && notification.type.includes('error')) ||
    notification.type === 'ai_credits' ||
    notification.type === 'rate_limit' ||
    notification.type === 'timeout'
  );
}

function filterBySince(items, sinceId) {
  if (sinceId === undefined || sinceId === null) {
    return items;
  }
  
  // Validate and parse integer with proper error handling
  const id = parseInt(sinceId, 10);
  if (isNaN(id) || !isFinite(id) || id < 0) {
    // Invalid input - return all items (or could return empty array)
    // Returning all items is safer for backward compatibility
    return items;
  }
  
  return items.filter(item => item.id > id);
}

// API Routes (all protected with authentication)
app.get('/api/data', authenticate, (req, res) => {
  console.log(`GET /api/data - returning ${recentData.length} items`);
  res.json({
    success: true,
    data: recentData,
    count: recentData.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/data', authenticate, (req, res) => {
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

app.delete('/api/data', authenticate, (req, res) => {
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
app.post('/api/notification', authenticate, (req, res) => {
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

app.get('/api/notifications', authenticate, (req, res) => {
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

app.delete('/api/notifications', authenticate, (req, res) => {
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
app.get('/api/errors', authenticate, (req, res) => {
  try {
    const { since } = req.query;

    // Ensure notifications array exists and is an array
    if (!Array.isArray(notifications)) {
      console.error('⚠️ notifications is not an array, resetting...');
      notifications = [];
    }

    // Filter only error notifications with safe error handling
    let errorNotifications = [];
    try {
      errorNotifications = notifications.filter(isErrorNotification);
    } catch (filterError) {
      console.error('Error filtering notifications:', filterError);
      // If filtering fails, return empty array instead of crashing
      errorNotifications = [];
    }

    const filteredErrors = filterBySince(errorNotifications, since);

    res.json({
      success: true,
      errors: filteredErrors,
      count: filteredErrors.length,
      latestId: notifications.length > 0 ? notifications[notifications.length - 1].id : -1
    });
  } catch (error) {
    console.error('GET /api/errors error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main route - inject API key into HTML for frontend
// This MUST be before static middleware to allow API key injection
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  
  // Read the HTML file
  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Internal server error');
    }
    
    // Inject API key as a script tag before closing body tag
    // Use JSON.stringify to safely escape the API key for JavaScript
    const apiKeyScript = API_KEY 
      ? `<script>window.DASHBOARD_API_KEY = ${JSON.stringify(API_KEY)};</script>`
      : '<script>window.DASHBOARD_API_KEY = null;</script>';
    
    const modifiedHtml = html.replace('</body>', `${apiKeyScript}\n</body>`);
    res.send(modifiedHtml);
  });
});

// Serve static files AFTER the root route (so index.html injection works)
app.use(express.static('public'));

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
  console.log(`🔐 Authentication: ${API_KEY ? 'ENABLED' : 'DISABLED (no API_KEY set)'}`);
  if (API_KEY) {
    console.log(`🔑 API Key configured: ${API_KEY.substring(0, 8)}...`);
  }
  console.log(`🌐 Access your dashboard at: http://localhost:${PORT}`);
});

module.exports = app;