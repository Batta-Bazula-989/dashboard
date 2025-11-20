/**
 * DataService
 * Handles all API calls related to data
 */
class DataService {
    constructor() {
        this.baseUrl = '/api/data';
        this.sessionToken = null;
        this.tokenExpiry = null;
        this.initializing = false;
    }

    /**
     * Initialize session token for same-origin requests
     * @returns {Promise<void>}
     */
    async initializeSession() {
        if (this.initializing) {
            // Wait for existing initialization
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (!this.initializing) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }

        if (this.sessionToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            // Token still valid
            return;
        }

        this.initializing = true;

        try {
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to initialize session');
            }

            const data = await response.json();
            if (data.success && data.token) {
                this.sessionToken = data.token;
                this.tokenExpiry = Date.now() + (data.expiresIn || 24 * 60 * 60 * 1000);
            }
        } catch (error) {
            console.error('Failed to initialize session:', error);
            // Continue without session token - server may allow unauthenticated requests
        } finally {
            this.initializing = false;
        }
    }

    /**
     * Get headers with authentication
     * @returns {Promise<Object>} Headers object with session token
     */
    async getHeaders() {
        // Ensure session is initialized
        await this.initializeSession();

        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.sessionToken) {
            headers['X-Session-Token'] = this.sessionToken;
        }
        
        return headers;
    }

    /**
     * Fetch data from API
     * @returns {Promise<Object>} API response
     */
    async fetchData() {
        try {
            const headers = await this.getHeaders();
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Session may have expired, try to reinitialize
                    this.sessionToken = null;
                    this.tokenExpiry = null;
                    const retryHeaders = await this.getHeaders();
                    const retryResponse = await fetch(this.baseUrl, {
                        method: 'GET',
                        headers: retryHeaders
                    });
                    
                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Authentication failed.');
                    }
                    return await retryResponse.json();
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
            const headers = await this.getHeaders();
            const response = await fetch(this.baseUrl, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Session may have expired, try to reinitialize
                    this.sessionToken = null;
                    this.tokenExpiry = null;
                    const retryHeaders = await this.getHeaders();
                    const retryResponse = await fetch(this.baseUrl, {
                        method: 'DELETE',
                        headers: retryHeaders
                    });
                    
                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Authentication failed.');
                    }
                    return true;
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