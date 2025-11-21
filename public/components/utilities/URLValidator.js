class URLValidator {
    /**
     * Check if a URL is safe (http/https only, no javascript:, data:, etc.)
     * @param {string} url - URL to validate
     * @returns {boolean} - True if URL is safe
     */
    static isValidURL(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        // Trim whitespace
        const trimmed = url.trim();
        
        // Empty string or '#' is allowed (for placeholder links)
        if (trimmed === '' || trimmed === '#') {
            return true;
        }

        try {
            const urlObj = new URL(trimmed);
            const protocol = urlObj.protocol.toLowerCase();

            // Only allow http and https protocols
            if (protocol !== 'http:' && protocol !== 'https:') {
                return false;
            }

            // Block javascript:, data:, vbscript:, file:, etc.
            const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
            if (dangerousProtocols.some(dangerous => trimmed.toLowerCase().startsWith(dangerous))) {
                return false;
            }

            // Additional check: ensure no script tags or event handlers in URL
            const lowerUrl = trimmed.toLowerCase();
            if (lowerUrl.includes('<script') || 
                lowerUrl.includes('javascript:') || 
                lowerUrl.includes('onerror=') ||
                lowerUrl.includes('onload=')) {
                return false;
            }

            return true;
        } catch (e) {
            // If URL parsing fails, it's not a valid URL
            return false;
        }
    }

    /**
     * Sanitize a URL - returns safe URL or empty string
     * @param {string} url - URL to sanitize
     * @param {string} fallback - Fallback value if URL is invalid (default: '')
     * @returns {string} - Sanitized URL or fallback
     */
    static sanitizeURL(url, fallback = '') {
        if (!url || typeof url !== 'string') {
            return fallback;
        }

        const trimmed = url.trim();
        
        // Allow empty string or '#' as placeholder
        if (trimmed === '' || trimmed === '#') {
            return trimmed;
        }

        if (this.isValidURL(trimmed)) {
            return trimmed;
        }

        return fallback;
    }

    /**
     * Validate and sanitize an image URL
     * @param {string} url - Image URL to validate
     * @returns {string} - Validated URL or empty string
     */
    static sanitizeImageURL(url) {
        return this.sanitizeURL(url, '');
    }

    /**
     * Validate and sanitize a link URL
     * @param {string} url - Link URL to validate
     * @returns {string} - Validated URL or '#' if invalid
     */
    static sanitizeLinkURL(url) {
        return this.sanitizeURL(url, '#');
    }
}

window.URLValidator = URLValidator;


