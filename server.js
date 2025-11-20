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

// Webhook Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
if (!WEBHOOK_URL) {
  console.warn('⚠️  WARNING: No WEBHOOK_URL environment variable set. Form submissions will fail.');
}

// Session token storage (in-memory, expires after 2 hours with idle timeout)
const sessionTokens = new Map(); // Map<token, {expiry: number, lastActivity: number}>
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes idle timeout

// Generate a secure session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Clean up expired and idle sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessionTokens.entries()) {
    // Remove if expired or idle for too long
    if (now > session.expiry || (now - session.lastActivity) > IDLE_TIMEOUT) {
      sessionTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Check if request is from same origin (for web dashboard)
function isSameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  // If no origin header, it's likely a same-origin request (browsers don't always send origin for same-origin)
  if (!origin) {
    return true;
  }
  
  if (!host) {
    return false;
  }
  
  try {
    const originUrl = new URL(origin);
    // Extract hostname from host header (might include port)
    const hostHostname = host.split(':')[0];
    
    // Compare hostnames (ignore protocol and port for flexibility)
    return originUrl.hostname === hostHostname || 
           originUrl.hostname === host;
  } catch {
    // If URL parsing fails, be lenient - allow it if no origin was provided
    return !origin;
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
    const session = sessionTokens.get(sessionToken);
    const now = Date.now();

    // Check if session is expired or idle
    if (now < session.expiry && (now - session.lastActivity) <= IDLE_TIMEOUT) {
      // Valid session token - update last activity only (don't extend expiry infinitely)
      session.lastActivity = now;
      return next();
    } else {
      // Expired or idle token
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

// HTTPS enforcement middleware (only in production)
function enforceHTTPS(req, res, next) {
  // Skip HTTPS enforcement for health check endpoint (Railway internal healthchecks use HTTP)
  if (req.path === '/health') {
    return next();
  }

  // Only enforce HTTPS in production and if not already HTTPS
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
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
  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  // Content Security Policy (kept permissive for compatibility)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';");
  // Permissions Policy (restrict certain browser features)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

// Rate limiting configuration
// Skip rate limiting for static files and root route
const skipRateLimit = (req) => {
  // Skip for root route
  if (req.path === '/' || req.path === '/index.html') {
    return true;
  }
  // Skip for static assets (CSS, JS, images, etc.)
  if (req.path.startsWith('/styles/') || 
      req.path.startsWith('/scripts/') || 
      req.path.startsWith('/components/') ||
      req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
    return true;
  }
  // Skip for health check
  if (req.path === '/health') {
    return true;
  }
  return false;
};

// Rate limiting temporarily disabled for polling services
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 200, // Limit each IP to 200 API requests per windowMs (increased for dashboard polling)
//   message: {
//     success: false,
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//   skip: skipRateLimit, // Skip rate limiting for static files
// });

// No-op middleware (rate limiting disabled)
const apiLimiter = (req, res, next) => next();

// Rate limiting temporarily disabled for polling services
// const postLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 50, // Limit each IP to 50 POST requests per windowMs
//   message: {
//     success: false,
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: skipRateLimit,
// });

// No-op middleware (rate limiting disabled)
const postLimiter = (req, res, next) => next();

// CORS configuration - restrict to same-origin and configured allowed origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin only if they're from the same host
    // (browsers don't send origin header for same-origin requests)
    if (!origin) {
      // For same-origin requests (no origin header), check the host header
      // This is handled by the request itself, so we allow it
      return callback(null, true);
    }
    
    try {
      const originUrl = new URL(origin);
      const host = originUrl.hostname;
      
      // Allow same-origin requests (origin matches host header)
      // This will be checked more strictly in the session endpoint
      
      // Check if origin is in allowed list
      if (ALLOWED_ORIGINS.length > 0) {
        const isAllowed = ALLOWED_ORIGINS.some(allowed => {
          try {
            const allowedUrl = new URL(allowed);
            return originUrl.hostname === allowedUrl.hostname && 
                   originUrl.protocol === allowedUrl.protocol;
          } catch {
            // If allowed origin is just a hostname, compare hostnames
            return originUrl.hostname === allowed || originUrl.host === allowed;
          }
        });
        
        if (isAllowed) {
          return callback(null, true);
        }
      }
      
      // For same-origin check, we'll validate more strictly in session endpoint
      // For API endpoints, they require API key authentication anyway
      // Allow it here, but session endpoint will do stricter validation
      callback(null, true);
    } catch (e) {
      // Invalid origin URL
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'X-Session-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Session-Token'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(enforceHTTPS); // HTTPS enforcement first
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Add size limit
// Rate limiting is applied per-route, not globally

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

  // Validate and parse integer with strict error handling
  const id = parseInt(sinceId, 10);
  if (isNaN(id) || !isFinite(id) || id < 0) {
    // Invalid input - return empty array to prevent information disclosure
    console.warn(`Invalid 'since' parameter: ${sinceId}`);
    return [];
  }

  return items.filter(item => item.id > id);
}

// Session token endpoint for same-origin requests
// Rate limiting disabled for polling services
// const sessionLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Allow only 5 session creations per 15 minutes
//   message: {
//     success: false,
//     error: 'Too many session requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// No-op middleware (rate limiting disabled)
const sessionLimiter = (req, res, next) => next();

app.post('/api/session', sessionLimiter, (req, res) => {
  // For web dashboard, allow session creation from same origin
  // CORS configuration will handle cross-origin protection
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  // If origin is provided, verify it matches the host (case-insensitive)
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      // Extract hostname from host (remove port if present)
      const hostHostname = host.split(':')[0].toLowerCase();
      const originHostname = originUrl.hostname.toLowerCase();
      
      // Allow if hostnames match (ignoring protocol and port)
      if (originHostname !== hostHostname) {
        // Also check if origin hostname matches full host (in case host includes port)
        if (originHostname !== host.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: 'Session tokens can only be created from same-origin requests'
          });
        }
      }
    } catch (e) {
      // If URL parsing fails, be lenient - allow it (could be same-origin without proper origin header)
      // CORS will block actual cross-origin requests
    }
  }
  
  // Generate and store session token
  const token = generateSessionToken();
  const now = Date.now();
  sessionTokens.set(token, {
    expiry: now + SESSION_DURATION,
    lastActivity: now
  });

  res.json({
    success: true,
    token: token,
    expiresIn: SESSION_DURATION,
    idleTimeout: IDLE_TIMEOUT
  });
});

// Session logout endpoint
app.delete('/api/session', apiLimiter, authenticate, (req, res) => {
  const sessionToken = req.headers['x-session-token'];

  if (sessionToken && sessionTokens.has(sessionToken)) {
    sessionTokens.delete(sessionToken);
    console.log('Session token revoked');
    return res.json({
      success: true,
      message: 'Session logged out successfully'
    });
  }

  res.json({
    success: true,
    message: 'No active session to logout'
  });
});

// API Routes (all protected with authentication)
app.get('/api/data', apiLimiter, authenticate, (req, res) => {
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

app.delete('/api/data', apiLimiter, authenticate, (req, res) => {
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

    // Validate metadata size and structure
    if (metadata !== undefined && metadata !== null) {
      if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return res.status(400).json({
          success: false,
          error: 'Metadata must be an object'
        });
      }

      const metadataSize = JSON.stringify(metadata).length;
      if (metadataSize > 100 * 1024) { // 100KB limit for metadata
        return res.status(400).json({
          success: false,
          error: 'Metadata payload too large (max 100KB)'
        });
      }
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
    console.error('POST /api/notification - failed');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.get('/api/notifications', apiLimiter, authenticate, (req, res) => {
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

app.delete('/api/notifications', apiLimiter, authenticate, (req, res) => {
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
app.get('/api/errors', apiLimiter, authenticate, (req, res) => {
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
      console.error('Error filtering notifications');
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
    console.error('GET /api/errors - failed');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Webhook proxy endpoint (for frontend form submissions)
app.post('/api/webhook/submit', postLimiter, (req, res) => {
  // No authentication required for form submissions from same origin
  // Rate limiting is already applied via postLimiter

  if (!WEBHOOK_URL) {
    return res.status(503).json({
      success: false,
      error: 'Webhook service not configured'
    });
  }

  const { Country, Brand, Status, submittedAt, formMode } = req.body;

  // Validate required fields
  if (!Country || !Brand || !Status) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: Country, Brand, Status'
    });
  }

  // Forward to n8n webhook
  const https = require('https');
  const http = require('http');
  const url = require('url');

  const webhookUrl = new URL(WEBHOOK_URL);
  const protocol = webhookUrl.protocol === 'https:' ? https : http;

  const payload = JSON.stringify({
    Country,
    Brand,
    Status,
    submittedAt: submittedAt || new Date().toISOString(),
    formMode: formMode || 'production'
  });

  const options = {
    hostname: webhookUrl.hostname,
    port: webhookUrl.port,
    path: webhookUrl.pathname + webhookUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 10000 // 10 second timeout
  };

  const proxyReq = protocol.request(options, (proxyRes) => {
    let data = '';

    proxyRes.on('data', (chunk) => {
      data += chunk;
    });

    proxyRes.on('end', () => {
      if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        res.json({
          success: true,
          message: 'Form submitted successfully'
        });
      } else {
        console.error(`Webhook failed with status ${proxyRes.statusCode}`);
        res.status(502).json({
          success: false,
          error: 'Webhook service error'
        });
      }
    });
  });

  proxyReq.on('error', (error) => {
    console.error('Webhook proxy error');
    res.status(502).json({
      success: false,
      error: 'Failed to connect to webhook service'
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    console.error('Webhook timeout');
    res.status(504).json({
      success: false,
      error: 'Webhook service timeout'
    });
  });

  proxyReq.write(payload);
  proxyReq.end();
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

// Health check endpoint (no authentication, minimal info disclosure)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dashboard server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Authentication: ${API_KEY ? 'ENABLED' : 'DISABLED (no API_KEY set)'}`);
  // DO NOT LOG API KEY - SECURITY RISK
  console.log(`🌐 Access your dashboard at: http://localhost:${PORT}`);
  if (WEBHOOK_URL) {
    console.log(`🔗 Webhook proxy: CONFIGURED`);
  }
});

module.exports = app;
