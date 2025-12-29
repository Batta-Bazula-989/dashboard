class URLValidator {

    // Check if a URL is safe (http/https only, no javascript:, data:, etc.)
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


    // Sanitize a URL - returns safe URL or empty string
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


    // Validate and sanitize an image URL
    static sanitizeImageURL(url) {
        return this.sanitizeURL(url, '');
    }

    static sanitizeLinkURL(url) {
        return this.sanitizeURL(url, '#');
    }
}

window.URLValidator = URLValidator;


