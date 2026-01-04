class SessionManager {
    constructor() {
        this.sessionToken = null;
        this.tokenExpiry = null;
        this.initializing = false;
        this.initPromise = null;
        this.EXPIRY_BUFFER_MS = 5 * 60 * 1000; // Refresh token 5 minutes before actual expiry
    }

    async initialize() {
        if (this.initializing && this.initPromise) {
            return this.initPromise;
        }

        if (this.sessionToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - this.EXPIRY_BUFFER_MS)) {
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
                throw new Error(ERROR_MESSAGES.SESSION_INIT_FAILED);
            }

            const data = await response.json();
            if (data.success && data.token) {
                this.sessionToken = data.token;
                this.tokenExpiry = Date.now() + (data.expiresIn || 24 * 60 * 60 * 1000);
            }
        } catch (error) {
            // Only log non-network errors (suppress expected network errors when server is sleeping)
            if (!isNetworkError(error)) {
                console.error(ERROR_MESSAGES.SESSION_INIT_FAILED, error);
            }
        }
    }

    getToken() {
        return this.sessionToken;
    }

    getValidToken() {
        // Atomically check validity and return token to prevent race condition
        if (this.isExpired()) {
            return null;
        }
        return this.sessionToken;
    }

    isExpired() {
        return !this.sessionToken || !this.tokenExpiry || Date.now() >= (this.tokenExpiry - this.EXPIRY_BUFFER_MS);
    }

    clear() {
        this.sessionToken = null;
        this.tokenExpiry = null;
    }
}

// Global session manager instance
window.sessionManager = window.sessionManager || new SessionManager();


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

        // Circuit Breaker Pattern
        this.circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.consecutiveFailures = 0;
        this.circuitOpenTime = null;
        this.circuitOpenThreshold = 5; // Open circuit after 5 failures
        this.circuitRecoveryInterval = 30000; // Check every 30s when open
        this.circuitHalfOpenTimeout = 5000; // Give 5s for half-open test

        // Exponential Backoff with Jitter
        this.baseBackoffDelay = 1000; // Start with 1 second
        this.maxBackoffDelay = 60000; // Max 60 seconds
        this.currentBackoffDelay = this.baseBackoffDelay;

        // Page Visibility API
        this.isPageVisible = !document.hidden;
        this.visibilityChangeHandler = null;
        this.setupVisibilityListener();
    }

     // Setup Page Visibility API listener

    setupVisibilityListener() {
        if (typeof document.addEventListener === 'function') {
            this.visibilityChangeHandler = () => {
                const wasVisible = this.isPageVisible;
                this.isPageVisible = !document.hidden;

                if (wasVisible && !this.isPageVisible) {
                    // Page became hidden - pause polling
                    this._pausePolling();
                } else if (!wasVisible && this.isPageVisible) {
                    // Page became visible - resume polling
                    this._resumePolling();
                }
            };
            document.addEventListener('visibilitychange', this.visibilityChangeHandler);
        }
    }

     // Pause polling when page is hidden

    _pausePolling() {
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }
    }

     // Resume polling when page becomes visible

    _resumePolling() {
        if (this.isPolling && !this.pollingTimer) {
            // Reset circuit breaker on resume to give it a fresh chance
            if (this.circuitState === 'OPEN') {
                this._transitionToHalfOpen();
            }
            this.fetchData();
        }
    }

     // Get headers with authentication

    async getHeaders() {
        await window.sessionManager.initialize();
        const headers = {};
        // Use getValidToken() to atomically check validity and get token
        // This prevents race condition where token expires between check and use
        const token = window.sessionManager.getValidToken();
        if (token) {
            headers['X-Session-Token'] = token;
        }
        return headers;
    }

     // Start polling

    start() {
        if (this.isPolling) {
            return;
        }

        this.isPolling = true;
        if (this.isPageVisible) {
            this.fetchData();
        }
    }

   // Stop polling

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

     // Fetch data from server - to be implemented by subclasses

    async fetchData() {
        throw new Error('fetchData() must be implemented by subclass');
    }

     // Build URL with since parameter

    buildUrl() {
        return this.lastId >= 0
            ? `${this.baseUrl}?since=${this.lastId}`
            : this.baseUrl;
    }

     // Schedule the next poll with circuit breaker and backoff logic

    scheduleNextFetch() {
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }

        // Don't schedule if page is hidden
        if (!this.isPageVisible) {
            return;
        }

        let delay;

        if (this.circuitState === 'OPEN') {
            // Circuit is open - check periodically if service is back
            delay = this.circuitRecoveryInterval;
        } else if (this.consecutiveFailures > 0) {
            // Use exponential backoff with jitter
            const exponentialDelay = Math.min(
                this.baseBackoffDelay * Math.pow(2, this.consecutiveFailures - 1),
                this.maxBackoffDelay
            );
            // Add jitter (±20%)
            const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
            delay = Math.max(100, exponentialDelay + jitter);
            this.currentBackoffDelay = delay;
        } else {
            // Normal polling rate
            delay = this.pollingRate;
            this.currentBackoffDelay = this.baseBackoffDelay;
        }

        this.pollingTimer = setTimeout(() => {
            this.pollingTimer = null;
            if (this.isPolling && this.isPageVisible) {
                this.fetchData();
            }
        }, delay);
    }

     // Handle successful fetch - reset circuit breaker and error counters

    onFetchSuccess() {
        if (this.circuitState === 'HALF_OPEN') {
            // Success in half-open state - close the circuit
            this._transitionToClosed();
        } else if (this.circuitState === 'CLOSED') {
            // Reset failure counter on success
            this.consecutiveFailures = 0;
            this.currentBackoffDelay = this.baseBackoffDelay;
        }
    }

     // Handle fetch error - update circuit breaker state

    onFetchError(error) {
        if (isNetworkError(error)) {
            this.consecutiveFailures++;
            
            if (this.circuitState === 'HALF_OPEN') {
                // Failed in half-open state - open circuit again
                this._transitionToOpen();
            } else if (this.circuitState === 'CLOSED' && this.consecutiveFailures >= this.circuitOpenThreshold) {
                // Too many failures - open circuit
                this._transitionToOpen();
            }
        } else {
            // Non-network error - might be temporary, don't count as heavily
            this.consecutiveFailures = Math.max(0, this.consecutiveFailures - 1);
        }
    }

     // Transition circuit breaker to OPEN state

    _transitionToOpen() {
        this.circuitState = 'OPEN';
        this.circuitOpenTime = Date.now();
        this.consecutiveFailures = this.circuitOpenThreshold; // Keep at threshold
    }

     // Transition circuit breaker to HALF_OPEN state (testing if service is back)

    _transitionToHalfOpen() {
        this.circuitState = 'HALF_OPEN';
        this.consecutiveFailures = 0; // Reset for test
    }

     // Transition circuit breaker to CLOSED state (service is healthy)

    _transitionToClosed() {
        this.circuitState = 'CLOSED';
        this.consecutiveFailures = 0;
        this.circuitOpenTime = null;
        this.currentBackoffDelay = this.baseBackoffDelay;
    }

     // Check if we should attempt recovery (for OPEN state)

    _shouldAttemptRecovery() {
        if (this.circuitState === 'OPEN') {
            // Try to transition to half-open after recovery interval
            this._transitionToHalfOpen();
            return true;
        }
        return false;
    }

     // Reset state

    reset() {
        this.lastId = -1;
        this.isInitialFetch = true;
        this.isFetching = false;
        this.consecutiveFailures = 0;
        this.circuitState = 'CLOSED';
        this.circuitOpenTime = null;
        this.currentBackoffDelay = this.baseBackoffDelay;

        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }

        this.isPolling = false;
    }

     // Clean up resources (call when service is no longer needed)

    destroy() {
        this.stop();

        if (this.visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
            this.visibilityChangeHandler = null;
        }
    }
}

window.BasePollingService = BasePollingService;
