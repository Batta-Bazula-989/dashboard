/**
 * SessionManager
 * Shared session token manager for all services
 */
class SessionManager {
    constructor() {
        this.sessionToken = null;
        this.tokenExpiry = null;
        this.initializing = false;
        this.initPromise = null;
    }

    async initialize() {
        if (this.initializing && this.initPromise) {
            return this.initPromise;
        }

        if (this.sessionToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return;
        }

        this.initializing = true;
        this.initPromise = this._doInitialize();
        
        try {
            await this.initPromise;
        } finally {
            this.initializing = false;
            this.initPromise = null;
        }
    }

    async _doInitialize() {
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
        }
    }

    getToken() {
        return this.sessionToken;
    }

    isExpired() {
        return !this.sessionToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry;
    }

    clear() {
        this.sessionToken = null;
        this.tokenExpiry = null;
    }
}

// Global session manager instance
window.sessionManager = window.sessionManager || new SessionManager();

/**
 * BasePollingService
 * Base class for polling services with common functionality
 */
class BasePollingService {
    constructor(baseUrl, pollingRate, onDataReceived) {
        this.baseUrl = baseUrl;
        this.pollingTimer = null;
        this.pollingRate = pollingRate;
        this.lastId = -1;
        this.onDataReceived = onDataReceived;
        this.isInitialFetch = true;
        this.isFetching = false;
        this.isPolling = false;
    }

    /**
     * Get headers with authentication
     * @returns {Promise<Object>} Headers object with session token
     */
    async getHeaders() {
        await window.sessionManager.initialize();
        const headers = {};
        const token = window.sessionManager.getToken();
        if (token) {
            headers['X-Session-Token'] = token;
        }
        return headers;
    }

    /**
     * Start polling
     */
    start() {
        if (this.isPolling) {
            return;
        }

        this.isPolling = true;
        this.fetchData();
    }

    /**
     * Stop polling
     */
    stop() {
        if (!this.isPolling) {
            return;
        }

        this.isPolling = false;

        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }
    }

    /**
     * Fetch data from server - to be implemented by subclasses
     */
    async fetchData() {
        throw new Error('fetchData() must be implemented by subclass');
    }

    /**
     * Build URL with since parameter
     */
    buildUrl() {
        return this.lastId >= 0
            ? `${this.baseUrl}?since=${this.lastId}`
            : this.baseUrl;
    }

    /**
     * Schedule the next poll
     */
    scheduleNextFetch() {
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }

        this.pollingTimer = setTimeout(() => {
            this.pollingTimer = null;
            if (this.isPolling) {
                this.fetchData();
            }
        }, this.pollingRate);
    }

    /**
     * Reset state
     */
    reset() {
        this.lastId = -1;
        this.isInitialFetch = true;
        this.isFetching = false;

        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }

        this.isPolling = false;
    }
}

window.BasePollingService = BasePollingService;
