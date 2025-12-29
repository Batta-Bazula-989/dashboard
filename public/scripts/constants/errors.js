/**
 * Centralized Error Messages and Constants
 * All error messages across the application should reference these constants
 */

// Error Types
const ERROR_TYPES = {
  ERROR: 'error',
  API_ERROR: 'api_error',
  AI_CREDITS: 'ai_credits',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout'
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_FAILED: 'Authentication failed.',
  SESSION_INIT_FAILED: 'Failed to initialize session',
  SESSION_EXPIRED: 'Your session has expired. Please refresh the page.',

  // Network Errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  FETCH_FAILED: 'Failed to fetch data from server.',
  CONNECTION_TIMEOUT: 'Connection timeout. Please try again.',

  // Data Operations
  DATA_FETCH_ERROR: 'Error fetching data',
  DATA_CLEAR_ERROR: 'Error clearing data',
  DATA_SAVE_ERROR: 'Error saving data',

  // Notification Errors
  NOTIFICATIONS_FETCH_ERROR: 'Error fetching notifications',

  // Error Service
  ERRORS_FETCH_ERROR: 'Error fetching errors',

  // Form Errors
  FORM_SUBMISSION_ERROR: 'Form submission error',
  FORM_VALIDATION_ERROR: 'Please fix validation errors before adding another field',

  // SVG/Parsing Errors
  SVG_PARSE_ERROR: 'SVG parsing error for platform',

  // Generic Errors
  UNKNOWN_ERROR: 'An unknown error occurred',
  OPERATION_FAILED: 'Operation failed. Please try again.',

  // Container/DOM Errors
  CONTAINER_NOT_FOUND: 'Required container element not found',
  MAIN_CONTENT_NOT_FOUND: '.main-content container not found',
  HEADER_ACTIONS_NOT_FOUND: 'Header actions element not found'
};

// Error Titles
const ERROR_TITLES = {
  ERROR_OCCURRED: 'Error Occurred',
  AUTHENTICATION_ERROR: 'Authentication Error',
  NETWORK_ERROR: 'Network Error',
  VALIDATION_ERROR: 'Validation Error'
};

// Network Error Detection Keywords
const NETWORK_ERROR_KEYWORDS = [
  'failed to fetch',
  'networkerror',
  'timeout',
  'connection reset',
  'network request failed',
  'name not resolved',
  'connection refused',
  'err_timed_out',
  'err_connection_reset',
  'err_name_not_resolved'
];

/**
 * Utility function to detect network errors
 * @param {Error|string} error - Error object or error message
 * @returns {boolean} - True if error is network-related
 */
function isNetworkError(error) {
  const message = (typeof error === 'string' ? error : error?.message || '').toLowerCase();
  return NETWORK_ERROR_KEYWORDS.some(keyword => message.includes(keyword));
}

/**
 * Get user-friendly error message
 * @param {Error|Object} error - Error object
 * @returns {string} - User-friendly error message
 */
function getUserFriendlyErrorMessage(error) {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;

  if (isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Expose to global scope
window.ERROR_TYPES = ERROR_TYPES;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.ERROR_TITLES = ERROR_TITLES;
window.NETWORK_ERROR_KEYWORDS = NETWORK_ERROR_KEYWORDS;
window.isNetworkError = isNetworkError;
window.getUserFriendlyErrorMessage = getUserFriendlyErrorMessage;