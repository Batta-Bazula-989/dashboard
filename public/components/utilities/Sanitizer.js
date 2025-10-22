/**
 * HTML Sanitizer
 * Prevents XSS attacks by escaping HTML entities
 */
class Sanitizer {
    /**
     * Escape HTML special characters
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    static escapeHTML(str) {
        if (typeof str !== 'string') return '';

        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Sanitize an object's values recursively
     * @param {any} data - Data to sanitize
     * @returns {any} Sanitized data
     */
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
                sanitized[key] = this.sanitize(data[key]);
            }
            return sanitized;
        }

        return data;
    }
}

window.Sanitizer = Sanitizer;