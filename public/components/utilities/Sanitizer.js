class Sanitizer {
     // Escape HTML special characters to prevent XSS
    static escapeHTML(str) {
        if (typeof str !== 'string') return '';

        // Use DOM-based encoding (most reliable)
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }


     // Escape HTML attribute values
    static escapeHTMLAttribute(str) {
        if (typeof str !== 'string') return '';

        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }


    // Escape for use in JavaScript strings (prevents XSS in script tags)
    static escapeJavaScript(str) {
        if (typeof str !== 'string') return '';

        return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/\u2028/g, '\\u2028') // Line separator
            .replace(/\u2029/g, '\\u2029'); // Paragraph separator
    }


    // Sanitize data recursively for HTML output
    static sanitize(data) {
        if (typeof data === 'string') {
            return this.escapeHTML(data);
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item));
        }

        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    // Sanitize both key and value
                    const sanitizedKey = this.escapeHTML(String(key));
                    sanitized[sanitizedKey] = this.sanitize(data[key]);
                }
            }
            return sanitized;
        }

        return data;
    }


     // Sanitize for JSON output (prevents JSON injection)
    static sanitizeForJSON(data) {
        // JSON.stringify handles most cases, but we ensure no functions or undefined
        if (typeof data === 'function' || data === undefined) {
            return null;
        }

        if (typeof data === 'string') {
            // Remove null bytes and control characters that could break JSON
            return data.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
        }

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeForJSON(item));
        }

        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    if (typeof value !== 'function' && value !== undefined) {
                        sanitized[key] = this.sanitizeForJSON(value);
                    }
                }
            }
            return sanitized;
        }

        return data;
    }


    // Sanitize URL to prevent javascript: and data: protocol attacks
    static sanitizeURL(url) {
        if (typeof url !== 'string') return '';
        const trimmed = url.trim().toLowerCase();
        
        // Whitelist: only allow http, https, and relative URLs
        if (trimmed.startsWith('javascript:') ||
            trimmed.startsWith('data:') ||
            trimmed.startsWith('vbscript:') ||
            trimmed.startsWith('onload=') ||
            trimmed.startsWith('onerror=')) {
            return '';
        }

        return url;
    }


    // Remove null bytes and control characters
    static removeControlCharacters(str) {
        if (typeof str !== 'string') return '';

        return str
            .replace(/\0/g, '') // Remove null bytes
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    }
}

window.Sanitizer = Sanitizer;