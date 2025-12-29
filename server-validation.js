const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction manipulation
  /ignore\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
  /forget\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
  /disregard\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
  /override\s+(previous|all|above|prior)\s+(instructions?|commands?|rules?)/i,
  
  // System/user role manipulation
  /you\s+are\s+(now|a|an)\s+/i,
  /act\s+as\s+(if\s+)?(you\s+are\s+)?(a|an|the)\s+/i,
  /pretend\s+(you\s+are|to\s+be)\s+/i,
  /roleplay\s+as\s+/i,
  
  // Context breaking attempts
  /system\s*[:;]\s*/i,
  /assistant\s*[:;]\s*/i,
  /user\s*[:;]\s*/i,
  /admin\s*[:;]\s*/i,
  /root\s*[:;]\s*/i,
  
  // Command injection attempts
  /<\|(system|user|assistant|admin)\|>/i,
  /\[(SYSTEM|USER|ASSISTANT|ADMIN)\]/i,
  /```(system|user|assistant|admin)/i,
  
  // Encoding bypass attempts
  /%3C%7C(system|user|assistant|admin)%7C%3E/i,
  /&lt;\|(system|user|assistant|admin)\|&gt;/i,
  
  // Instruction injection
  /new\s+instructions?\s*[:;]/i,
  /follow\s+these\s+instructions?\s*[:;]/i,
  /execute\s+(the\s+)?following\s+(command|instruction)/i,
  
  // Jailbreak attempts
  /jailbreak/i,
  /bypass\s+(safety|security|filter|restriction)/i,
  /unrestricted\s+mode/i,
  /developer\s+mode/i,
  
  // Data extraction attempts
  /reveal\s+(your|the)\s+(prompt|instructions|system\s+message)/i,
  /show\s+(me\s+)?(your|the)\s+(prompt|instructions|system\s+message)/i,
  /what\s+are\s+(your|the)\s+(instructions?|prompt|system\s+message)/i,
  
  // Special markers
  /<\|endoftext\|>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
];

// Suspicious character sequences
const SUSPICIOUS_SEQUENCES = [
  /%[0-9A-Fa-f]{2}/g, // URL encoding
  /&#x?[0-9A-Fa-f]+;/g, // HTML entity encoding
  /\\x[0-9A-Fa-f]{2}/g, // Hex escape sequences
  /\\u[0-9A-Fa-f]{4}/g, // Unicode escape sequences
];

/**
 * Detect prompt injection attempts
 * @param {string} input - Input to check
 * @returns {{isInjection: boolean, reason?: string}}
 */
function detectPromptInjection(input) {
  if (!input || typeof input !== 'string') {
    return { isInjection: false };
  }

  const normalized = input.trim();

  // Check for injection patterns
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isInjection: true,
        reason: 'Input contains potentially malicious prompt injection patterns'
      };
    }
  }

  // Check for excessive encoding attempts
  let encodingCount = 0;
  for (const seq of SUSPICIOUS_SEQUENCES) {
    const matches = normalized.match(seq);
    if (matches) {
      encodingCount += matches.length;
    }
  }

  if (encodingCount > 5) {
    return {
      isInjection: true,
      reason: 'Input contains excessive encoding that may indicate obfuscation attempts'
    };
  }

  // Check for suspicious character patterns
  // Use Unicode-aware pattern to properly handle non-ASCII characters (Cyrillic, etc.)
  const specialCharRatio = (normalized.match(/[^\p{L}\p{N}\s]/gu) || []).length / normalized.length;
  if (normalized.length > 50 && specialCharRatio > 0.3) {
    return {
      isInjection: true,
      reason: 'Input contains suspicious character patterns'
    };
  }

  return { isInjection: false };
}

// Validation schemas - explicit contract for all inputs
const VALIDATION_SCHEMAS = {
  brandName: {
    type: 'string',
    minLength: 3,
    maxLength: 55,
    // Whitelist: Unicode letters, numbers, spaces, hyphens, apostrophes, and common brand characters
    allowedPattern: /^[\p{L}\p{N}\s\-'.,&()]+$/u,
    description: 'Brand name must be 3-55 characters. Only letters, numbers, spaces, hyphens, apostrophes, periods, commas, ampersands, and parentheses allowed.',
    trim: true
  },
  country: {
    type: 'string',
    exactLength: 2,
    // Whitelist: only uppercase ISO country codes
    allowedValues: ['UA', 'PL'],
    description: 'Country must be a valid 2-letter ISO code (UA or PL)',
    caseSensitive: true
  },
  status: {
    type: 'string',
    // Whitelist: only allowed status values
    allowedValues: ['active', 'inactive'],
    description: 'Status must be either "active" or "inactive"',
    caseSensitive: false
  },
  submittedAt: {
    type: 'string',
    maxLength: 50,
    // ISO 8601 date format validation
    allowedPattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    description: 'submittedAt must be a valid ISO 8601 date string',
    optional: true
  },
  formMode: {
    type: 'string',
    maxLength: 50,
    // Whitelist: only allow alphanumeric, hyphens, underscores
    allowedPattern: /^[a-zA-Z0-9\-_]+$/,
    description: 'formMode must be alphanumeric with hyphens and underscores only',
    optional: true
  }
};


 // Validate brand name according to schema
function validateBrandName(value) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Brand name must be a string' };
  }

  // Trim whitespace
  const trimmed = value.trim();

  // Check length constraints
  if (trimmed.length === 0) {
    return { valid: false, error: 'Brand name cannot be empty' };
  }

  if (trimmed.length < VALIDATION_SCHEMAS.brandName.minLength) {
    return {
      valid: false,
      error: `Brand name must be at least ${VALIDATION_SCHEMAS.brandName.minLength} characters`
    };
  }

  if (trimmed.length > VALIDATION_SCHEMAS.brandName.maxLength) {
    return {
      valid: false,
      error: `Brand name must be ${VALIDATION_SCHEMAS.brandName.maxLength} characters or less`
    };
  }

  // Whitelist validation - only allow specific characters
  if (!VALIDATION_SCHEMAS.brandName.allowedPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid characters. Only letters, numbers, spaces, and common punctuation allowed.'
    };
  }

  // Check for potentially dangerous patterns
  // Reject strings that are only special characters
  if (/^[\s\-'.,&()]+$/u.test(trimmed)) {
    return { valid: false, error: 'Brand name must contain at least one letter or number' };
  }

  // Check for null bytes or control characters
  if (/\0/.test(trimmed) || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) {
    return { valid: false, error: 'Brand name contains invalid characters' };
  }

  // Check for prompt injection attacks
  const injectionCheck = detectPromptInjection(trimmed);
  if (injectionCheck.isInjection) {
    return {
      valid: false,
      error: 'Invalid input detected. Please use only standard brand name characters.'
    };
  }

  return { valid: true, sanitized: trimmed };
}


 // Validate country code according to schema
function validateCountry(value) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Country must be a string' };
  }

  const trimmed = value.trim().toUpperCase();

  // Check exact length
  if (trimmed.length !== VALIDATION_SCHEMAS.country.exactLength) {
    return {
      valid: false,
      error: `Country must be exactly ${VALIDATION_SCHEMAS.country.exactLength} characters`
    };
  }

  // Whitelist validation - only allow specific values
  if (!VALIDATION_SCHEMAS.country.allowedValues.includes(trimmed)) {
    return {
      valid: false,
      error: VALIDATION_SCHEMAS.country.description
    };
  }

  return { valid: true, sanitized: trimmed };
}


 // Validate status according to schema
function validateStatus(value) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Status must be a string' };
  }

  const trimmed = value.trim().toLowerCase();

  // Whitelist validation - only allow specific values
  if (!VALIDATION_SCHEMAS.status.allowedValues.includes(trimmed)) {
    return {
      valid: false,
      error: VALIDATION_SCHEMAS.status.description
    };
  }

  return { valid: true, sanitized: trimmed };
}


 // Validate submittedAt timestamp
function validateSubmittedAt(value) {
  if (value === undefined || value === null) {
    return { valid: true, sanitized: new Date().toISOString() };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: 'submittedAt must be a string' };
  }

  const trimmed = value.trim();

  if (trimmed.length > VALIDATION_SCHEMAS.submittedAt.maxLength) {
    return {
      valid: false,
      error: `submittedAt must be ${VALIDATION_SCHEMAS.submittedAt.maxLength} characters or less`
    };
  }

  // Validate ISO 8601 format
  if (!VALIDATION_SCHEMAS.submittedAt.allowedPattern.test(trimmed)) {
    return {
      valid: false,
      error: VALIDATION_SCHEMAS.submittedAt.description
    };
  }

  // Validate that it's a valid date
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'submittedAt must be a valid date' };
  }

  return { valid: true, sanitized: trimmed };
}


 // Validate formMode
function validateFormMode(value) {
  if (value === undefined || value === null) {
    return { valid: true, sanitized: 'production' };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: 'formMode must be a string' };
  }

  const trimmed = value.trim();

  if (trimmed.length > VALIDATION_SCHEMAS.formMode.maxLength) {
    return {
      valid: false,
      error: `formMode must be ${VALIDATION_SCHEMAS.formMode.maxLength} characters or less`
    };
  }

  // Whitelist validation
  if (!VALIDATION_SCHEMAS.formMode.allowedPattern.test(trimmed)) {
    return {
      valid: false,
      error: VALIDATION_SCHEMAS.formMode.description
    };
  }

  return { valid: true, sanitized: trimmed };
}


 // Validate complete form submission payload
function validateFormSubmission(data) {
  // Check that data is an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Form data must be an object' };
  }

  // Check payload size (defense against resource exhaustion)
  const payloadSize = JSON.stringify(data).length;
  const maxPayloadSize = 10 * 1024; // 10KB limit for form submissions
  if (payloadSize > maxPayloadSize) {
    return { valid: false, error: 'Form payload too large (max 10KB)' };
  }

  const errors = [];
  const sanitized = {};

  // Validate required Brands array
  if (!data.Brands) {
    errors.push('Brands is required');
  } else if (!Array.isArray(data.Brands)) {
    errors.push('Brands must be an array');
  } else if (data.Brands.length === 0) {
    errors.push('At least one brand name is required');
  } else if (data.Brands.length > 3) {
    errors.push('Maximum 3 brand names allowed');
  } else {
    const sanitizedBrands = [];
    for (let i = 0; i < data.Brands.length; i++) {
      const brandValidation = validateBrandName(data.Brands[i]);
      if (!brandValidation.valid) {
        errors.push(`Brands[${i}]: ${brandValidation.error}`);
      } else {
        sanitizedBrands.push(brandValidation.sanitized);
      }
    }
    if (sanitizedBrands.length > 0) {
      sanitized.Brands = sanitizedBrands;
    } else {
      errors.push('At least one valid brand name is required');
    }
  }

  if (!data.Country) {
    errors.push('Country is required');
  } else {
    const countryValidation = validateCountry(data.Country);
    if (!countryValidation.valid) {
      errors.push(`Country: ${countryValidation.error}`);
    } else {
      sanitized.Country = countryValidation.sanitized;
    }
  }

  if (!data.Status) {
    errors.push('Status is required');
  } else {
    const statusValidation = validateStatus(data.Status);
    if (!statusValidation.valid) {
      errors.push(`Status: ${statusValidation.error}`);
    } else {
      sanitized.Status = statusValidation.sanitized;
    }
  }

  // Validate optional fields
  const submittedAtValidation = validateSubmittedAt(data.submittedAt);
  if (!submittedAtValidation.valid) {
    errors.push(`submittedAt: ${submittedAtValidation.error}`);
  } else {
    sanitized.submittedAt = submittedAtValidation.sanitized;
  }

  const formModeValidation = validateFormMode(data.formMode);
  if (!formModeValidation.valid) {
    errors.push(`formMode: ${formModeValidation.error}`);
  } else {
    sanitized.formMode = formModeValidation.sanitized;
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return { valid: true, sanitized };
}

module.exports = {
  validateFormSubmission,
  validateBrandName,
  validateCountry,
  validateStatus,
  VALIDATION_SCHEMAS
};
