/**
 * DataService
 * Handles all API calls related to data
 */
class DataService {
    constructor() {
        this.baseUrl = '/api/data';
    }

    /**
     * Get API key from window object (injected by server)
     * @returns {string|null} API key or null if not set
     */
    getApiKey() {
        return window.DASHBOARD_API_KEY || null;
    }

    /**
     * Get headers with authentication
     * @returns {Object} Headers object with API key if available
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const apiKey = this.getApiKey();
        if (apiKey) {
            headers['X-API-Key'] = apiKey;
        }
        
        return headers;
    }

    /**
     * Fetch data from API
     * @returns {Promise<Object>} API response
     */
    async fetchData() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Authentication failed. Please check your API key.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    /**
     * Clear all data on server
     * @returns {Promise<boolean>} Success status
     */
    async clearData() {
        try {
            const headers = {};
            const apiKey = this.getApiKey();
            if (apiKey) {
                headers['X-API-Key'] = apiKey;
            }

            const response = await fetch(this.baseUrl, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Authentication failed. Please check your API key.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }
}

window.DataService = DataService;