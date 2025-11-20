// Railway Deployment Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();

// Authentication Configuration
const API_KEY = process.env.API_KEY || process.env.DASHBOARD_API_KEY;
if (!API_KEY) {
  console.warn('⚠️  WARNING: No API_KEY environment variable set. Authentication is disabled.');
  console.warn('⚠️  Set API_KEY or DASHBOARD_API_KEY environment variable for production use.');
}

// Session token storage (in-memory, expires after 24 hours)
const sessionTokens = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Generate a secure session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of sessionTokens.entries()) {
    if (now > expiry) {
      sessionTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Check if request is from same origin (for web dashboard)
function isSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return false;
  
  try {
    const originUrl = new URL(origin);
    const hostUrl = new URL(`http://${host}`);
    return originUrl.hostname === hostUrl.hostname && 
           originUrl.protocol === hostUrl.protocol;
  } catch {
    return false;
  }
}

// Authentication Middleware
function authenticate(req, res, next) {
  // Skip authentication if no API key is configured (development mode)
  if (!API_KEY) {
    return next();
  }

  // Check for session token (for same-origin web requests)
  const sessionToken = req.headers['x-session-token'];
  if (sessionToken && sessionTokens.has(sessionToken)) {
    const expiry = sessionTokens.get(sessionToken);
    if (Date.now() < expiry) {
      // Valid session token - refresh expiry
      sessionTokens.set(sessionToken, Date.now() + SESSION_DURATION);
      return next();
    } else {
      // Expired token
      sessionTokens.delete(sessionToken);
    }
  }

  // Check for API key in headers only (NO query parameters for security)
  const providedKey = req.headers['x-api-key'] || 
                     req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide an API key via X-API-Key header or Authorization Bearer token.'
    });
  }

  // Use constant-time comparison to prevent timing attacks
  const providedKeyBuffer = Buffer.from(providedKey, 'utf8');
  const apiKeyBuffer = Buffer.from(API_KEY, 'utf8');
  
  if (providedKeyBuffer.length !== apiKeyBuffer.length) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key. Access denied.'
    });
  }

  // Constant-time comparison
  const isValid = crypto.timingSafeEqual(providedKeyBuffer, apiKeyBuffer);
  
  if (!isValid) {
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

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for POST requests (data submission)
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 POST requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration - only allow same-origin for web requests
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // In production, you should restrict this further
    if (!origin) {
      return callback(null, true);
    }
    
    // For same-origin requests, allow them
    // For external API calls, they should use API key authentication
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'X-Session-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Session-Token']
};

// Middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(apiLimiter); // Apply rate limiting to all routes

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

// Input validation helper
function validateDataInput(data) {
  if (data === null || data === undefined) {
    return { valid: false, error: 'Data cannot be null or undefined' };
  }

  // Check if data is an object or array
  if (typeof data !== 'object') {
    return { valid: false, error: 'Data must be an object or array' };
  }

  // Limit depth to prevent deep nesting attacks
  function checkDepth(obj, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) {
      return false;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          if (!checkDepth(item, depth + 1, maxDepth)) {
            return false;
          }
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (!checkDepth(obj[key], depth + 1, maxDepth)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  if (!checkDepth(data)) {
    return { valid: false, error: 'Data structure too deeply nested' };
  }

  // Check size (rough estimate)
  const dataSize = JSON.stringify(data).length;
  const maxSize = 9 * 1024 * 1024; // 9MB (slightly less than 10MB limit)
  if (dataSize > maxSize) {
    return { valid: false, error: 'Data payload too large' };
  }

  return { valid: true };
}

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

// Session token endpoint for same-origin requests
app.post('/api/session', (req, res) => {
  // Only allow same-origin requests for session creation
  if (!isSameOrigin(req)) {
    return res.status(403).json({
      success: false,
      error: 'Session tokens can only be created from same-origin requests'
    });
  }

  // Generate and store session token
  const token = generateSessionToken();
  sessionTokens.set(token, Date.now() + SESSION_DURATION);

  res.json({
    success: true,
    token: token,
    expiresIn: SESSION_DURATION
  });
});

// API Routes (all protected with authentication)
app.get('/api/data', authenticate, (req, res) => {
  // Log only metadata, not sensitive data
  console.log(`GET /api/data - returning ${recentData.length} items`);
  res.json({
    success: true,
    data: recentData,
    count: recentData.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/data', postLimiter, authenticate, (req, res) => {
  try {
    const data = req.body;
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate input
    const validation = validateDataInput(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Log only metadata, not full data
    console.log(`POST /api/data - received data, size: ${JSON.stringify(data).length} bytes, requestId: ${requestId}`);

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
    console.error('POST /api/data error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
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
    console.error('DELETE /api/data error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Notification endpoints
app.post('/api/notification', postLimiter, authenticate, (req, res) => {
  try {
    const { type, message, competitor_name, metadata } = req.body;

    // Basic validation
    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification type'
      });
    }

    const notification = {
      id: notificationIdCounter++,
      type,
      message: typeof message === 'string' ? message : String(message || ''),
      competitor_name: typeof competitor_name === 'string' ? competitor_name : undefined,
      metadata: (typeof metadata === 'object' && metadata !== null) ? metadata : {},
      timestamp: new Date().toISOString()
    };

    notifications.push(notification);

    // Keep only last 50 notifications
    if (notifications.length > maxNotifications) {
      notifications.shift();
    }

    // Log only type and message, not full metadata
    console.log(`NOTIFICATION: [${type}] ${message || 'No message'}`);

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('POST /api/notification error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
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
    console.error('GET /api/notifications error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
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
    console.error('DELETE /api/notifications error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
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
      console.error('Error filtering notifications:', filterError.message);
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
    console.error('GET /api/errors error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Main route - serve HTML without API key injection
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  
  // Read and serve HTML file directly - NO API KEY INJECTION
  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) {
      console.error('Error reading index.html:', err.message);
      return res.status(500).send('Internal server error');
    }
    
    res.send(html);
  });
});

// Serve static files
app.use(express.static('public'));

// Health check endpoint (no authentication, but limited info)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
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
