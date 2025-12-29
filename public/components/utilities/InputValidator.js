class InputValidator {
    // Validation schemas with explicit constraints
    static SCHEMAS = {
        brandName: {
            type: 'string',
            minLength: 3,
            maxLength: 55,
            // Whitelist: Unicode letters, numbers, spaces, hyphens, apostrophes, and common brand characters
            allowedPattern: /^[\p{L}\p{N}\s\-'.,&()]+$/u,
            description: 'Brand name must be 3-55 characters.\nOnly letters, numbers, spaces, hyphens, apostrophes, periods, commas, ampersands, and parentheses allowed.',
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
        }
    };

    // Validate brand name according to schema
    static validateBrandName(value) {
        if (typeof value !== 'string') {
            return { valid: false, error: 'Brand name must be a string' };
        }

        // Trim whitespace
        const trimmed = value.trim();

        // Check length constraints
        if (trimmed.length === 0) {
            return { valid: false, error: 'Brand name cannot be empty' };
        }

        if (trimmed.length < this.SCHEMAS.brandName.minLength) {
            return {
                valid: false,
                error: `Brand name must be at least ${this.SCHEMAS.brandName.minLength} characters`
            };
        }

        if (trimmed.length > this.SCHEMAS.brandName.maxLength) {
            return {
                valid: false,
                error: `Brand name must be ${this.SCHEMAS.brandName.maxLength} characters or less`
            };
        }

        // Whitelist validation - only allow specific characters
        if (!this.SCHEMAS.brandName.allowedPattern.test(trimmed)) {
            return {
                valid: false,
                error: 'Invalid characters.\nOnly letters, numbers, spaces, and common punctuation allowed.'
            };
        }

        // Check for potentially dangerous patterns (even if characters are allowed)
        // Reject strings that are only special characters
        if (/^[\s\-'.,&()]+$/u.test(trimmed)) {
            return { valid: false, error: 'Brand name must contain at least one letter or number' };
        }

        // Check for prompt injection attacks
        if (window.PromptInjectionDetector) {
            const injectionCheck = PromptInjectionDetector.detect(trimmed);
            if (injectionCheck.isInjection) {
                return {
                    valid: false,
                    error: 'Invalid input detected. Please use only standard brand name characters.'
                };
            }
        }

        return { valid: true, sanitized: trimmed };
    }


   // Validate country code according to schema
    static validateCountry(value) {
        if (typeof value !== 'string') {
            return { valid: false, error: 'Country must be a string' };
        }

        const trimmed = value.trim().toUpperCase();

        // Check exact length
        if (trimmed.length !== this.SCHEMAS.country.exactLength) {
            return {
                valid: false,
                error: `Country must be exactly ${this.SCHEMAS.country.exactLength} characters`
            };
        }

        // Whitelist validation - only allow specific values
        if (!this.SCHEMAS.country.allowedValues.includes(trimmed)) {
            return {
                valid: false,
                error: this.SCHEMAS.country.description
            };
        }

        return { valid: true, sanitized: trimmed };
    }


    // Validate status according to schema
    static validateStatus(value) {
        if (typeof value !== 'string') {
            return { valid: false, error: 'Status must be a string' };
        }

        const trimmed = value.trim().toLowerCase();

        // Whitelist validation - only allow specific values
        if (!this.SCHEMAS.status.allowedValues.includes(trimmed)) {
            return {
                valid: false,
                error: this.SCHEMAS.status.description
            };
        }

        return { valid: true, sanitized: trimmed };
    }


   // Validate an array of brand names
    static validateBrandNames(brandNames) {
        if (!Array.isArray(brandNames)) {
            return { valid: false, error: 'Brand names must be an array' };
        }

        // Check array length constraints
        if (brandNames.length === 0) {
            return { valid: false, error: 'At least one brand name is required' };
        }

        if (brandNames.length > 3) {
            return { valid: false, error: 'Maximum 3 brand names allowed' };
        }

        const sanitized = [];
        const errors = [];

        for (let i = 0; i < brandNames.length; i++) {
            const validation = this.validateBrandName(brandNames[i]);
            if (!validation.valid) {
                errors.push(`Brand name ${i + 1}: ${validation.error}`);
            } else {
                sanitized.push(validation.sanitized);
            }
        }

        if (errors.length > 0) {
            return { valid: false, error: errors.join('; ') };
        }

        // Check for duplicates
        const unique = new Set(sanitized);
        if (unique.size !== sanitized.length) {
            return { valid: false, error: 'Duplicate brand names are not allowed' };
        }

        return { valid: true, sanitized };
    }


    // Validate complete form submission
    static validateFormSubmission(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Form data must be an object' };
        }

        const errors = [];
        const sanitized = {};

        // Validate brands array
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
                const brandValidation = this.validateBrandName(data.Brands[i]);
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

        // Validate country
        if (data.Country) {
            const countryValidation = this.validateCountry(data.Country);
            if (!countryValidation.valid) {
                errors.push(`Country: ${countryValidation.error}`);
            } else {
                sanitized.Country = countryValidation.sanitized;
            }
        } else {
            errors.push('Country is required');
        }

        // Validate status
        if (data.Status) {
            const statusValidation = this.validateStatus(data.Status);
            if (!statusValidation.valid) {
                errors.push(`Status: ${statusValidation.error}`);
            } else {
                sanitized.Status = statusValidation.sanitized;
            }
        } else {
            errors.push('Status is required');
        }

        // Validate optional fields
        if (data.submittedAt) {
            if (typeof data.submittedAt === 'string') {
                // Validate ISO date format
                const date = new Date(data.submittedAt);
                if (isNaN(date.getTime())) {
                    errors.push('submittedAt must be a valid ISO date string');
                } else {
                    sanitized.submittedAt = data.submittedAt;
                }
            } else {
                errors.push('submittedAt must be a string');
            }
        }

        if (data.formMode) {
            if (typeof data.formMode === 'string' && data.formMode.length <= 50) {
                sanitized.formMode = data.formMode;
            } else {
                errors.push('formMode must be a string with max 50 characters');
            }
        }

        if (errors.length > 0) {
            return { valid: false, error: errors.join('; ') };
        }

        return { valid: true, sanitized };
    }


   // Sanitize input by removing potentially dangerous characters
    static sanitizeInput(value) {
        if (typeof value !== 'string') {
            return String(value);
        }

        // Remove null bytes and control characters (except newlines, tabs, carriage returns)
        return value
            .replace(/\0/g, '') // Remove null bytes
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    }
}

window.InputValidator = InputValidator;


