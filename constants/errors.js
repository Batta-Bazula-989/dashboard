/**
 * Server-Side Centralized Error Messages and Constants
 * All server error responses should reference these constants
 */

// Error Types for Notifications
const ERROR_TYPES = {
  ERROR: 'error',
  API_ERROR: 'api_error',
  AI_CREDITS: 'ai_credits',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout'
};

// Server Error Messages
const SERVER_ERROR_MESSAGES = {
  // Generic Server Errors (endpoint-specific)
  DATA_POST_ERROR: 'Failed to save data',
  DATA_DELETE_ERROR: 'Failed to delete data',
  DATA_FETCH_ERROR: 'Failed to fetch data',

  NOTIFICATION_POST_ERROR: 'Failed to create notification',
  NOTIFICATION_FETCH_ERROR: 'Failed to fetch notifications',
  NOTIFICATION_DELETE_ERROR: 'Failed to delete notifications',

  ERRORS_FETCH_ERROR: 'Failed to fetch error logs',

  WEBHOOK_PROXY_ERROR: 'Webhook proxy failed',

  // Authentication Errors
  AUTH_MISSING: 'API key is required',
  AUTH_INVALID: 'Invalid API key',

  // Validation Errors
  VALIDATION_FAILED: 'Validation failed',
  INVALID_REQUEST: 'Invalid request data',

  // Generic Fallback
  INTERNAL_ERROR: 'Internal server error'
};

// Console Log Messages (standardized without emojis)
const LOG_MESSAGES = {
  DATA_POST_ERROR: 'POST /api/data error:',
  DATA_DELETE_ERROR: 'DELETE /api/data error:',
  DATA_FETCH_ERROR: 'GET /api/data error:',

  NOTIFICATION_POST_ERROR: 'POST /api/notification error:',
  NOTIFICATION_FETCH_ERROR: 'GET /api/notifications error:',
  NOTIFICATION_DELETE_ERROR: 'DELETE /api/notifications error:',

  ERRORS_FETCH_ERROR: 'GET /api/errors error:',

  WEBHOOK_PROXY_ERROR: 'Webhook proxy error:',

  SERVER_START: 'Server running on port',
  API_KEY_WARNING: 'WARNING: No API_KEY environment variable set. Authentication is disabled.'
};

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Object} - Error response object
 */
function createErrorResponse(message, statusCode = 500) {
  return {
    statusCode,
    body: { error: message }
  };
}

/**
 * Log error with standardized format
 * @param {string} logMessage - Log prefix message
 * @param {Error} error - Error object
 */
function logError(logMessage, error) {
  console.error(logMessage, error.message);
}

module.exports = {
  ERROR_TYPES,
  SERVER_ERROR_MESSAGES,
  LOG_MESSAGES,
  createErrorResponse,
  logError
};
