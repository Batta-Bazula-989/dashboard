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
        const headers = {};
        const apiKey = this.getApiKey();
        if (apiKey) {
            headers['X-API-Key'] = apiKey;
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
