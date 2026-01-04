class ErrorService extends BasePollingService {
    constructor(onErrorReceived) {
        super('/api/errors', 3000, onErrorReceived);
        this.errorHistory = [];
        this.maxHistory = 100;
        this.lastFetchErrorNotification = 0;
        this.fetchErrorNotificationThrottle = 30000; // 30 seconds
    }

    // Fetch new errors from server

    async fetchData() {
        if (this.isFetching) {
            return;
        }

        // Check circuit breaker state
        if (this.circuitState === 'OPEN') {
            // Circuit is open - attempt recovery check
            if (this._shouldAttemptRecovery()) {
                // Transitioning to half-open for test
            } else {
                // Still in open state, just schedule next recovery check
                if (this.isPolling) {
                    this.scheduleNextFetch();
                }
                return;
            }
        }

        try {
            this.isFetching = true;

            const url = this.buildUrl();
            const headers = await this.getHeaders();
            const response = await fetch(url, {
                headers: headers,
                credentials: 'include' // Send cookies with request
            });

            if (!response.ok) {
                // Try to get error details from response if available
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.clone().json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                    // Handle authentication errors specifically
                    if (response.status === 401 || response.status === 403) {
                        // Session may have expired, try to reinitialize
                        window.sessionManager.clear();
                        await window.sessionManager.initialize();
                        const retryHeaders = await this.getHeaders();
                        const retryResponse = await fetch(url, {
                            headers: retryHeaders,
                            credentials: 'include' // Send cookies with request
                        });
                        
                        if (!retryResponse.ok) {
                            errorMessage = errorData.error || ERROR_MESSAGES.AUTH_FAILED;
                            throw new Error(errorMessage);
                        }
                        // Use retry response
                        const result = await retryResponse.json();
                        this._processErrors(result);
                        this.onFetchSuccess();
                        return;
                    }
                } catch (e) {
                    // Response is not JSON, use default message
                    if (response.status === 401 || response.status === 403) {
                        errorMessage = ERROR_MESSAGES.AUTH_FAILED;
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            this._processErrors(result);
            this.onFetchSuccess();
        } catch (error) {
            // Only log non-network errors to console (suppress expected network errors)
            if (!isNetworkError(error)) {
                console.error(ERROR_MESSAGES.ERRORS_FETCH_ERROR, error);
            }

            // Update circuit breaker state
            this.onFetchError(error);

            // Mark initial fetch as complete even if it failed, so subsequent errors can be shown
            const wasInitialFetch = this.isInitialFetch;
            if (this.isInitialFetch) {
                this.isInitialFetch = false;
            }

            // Show notification when fetch fails (but not on initial fetch and with throttling)
            // Only show for non-network errors (network errors are expected when server sleeps)
            if (!wasInitialFetch && !isNetworkError(error) && this.onDataReceived) {
                const now = Date.now();
                const timeSinceLastNotification = now - this.lastFetchErrorNotification;
                
                // Only show notification if enough time has passed since last one
                if (timeSinceLastNotification >= this.fetchErrorNotificationThrottle) {
                    const statusCode = error.message.includes('status:') 
                        ? error.message.match(/status: (\d+)/)?.[1] || '500'
                        : '500';
                    
                    const syntheticError = {
                        type: 'api_error',
                        message: `Failed to fetch errors from server (HTTP ${statusCode}). The error monitoring service may be unavailable.`,
                        timestamp: new Date().toISOString(),
                        metadata: {
                            source: 'ErrorService',
                            originalError: error.message
                        }
                    };
                    
                    this.onDataReceived(syntheticError);
                    this.lastFetchErrorNotification = now;
                }
            }
        } finally {
            this.isFetching = false;

            if (this.isPolling) {
                this.scheduleNextFetch();
            }
        }
    }

    _processErrors(result) {
        if (result.success && result.errors && result.errors.length > 0) {
                if (this.isInitialFetch) {
                    if (result.latestId !== undefined) {
                        this.lastId = result.latestId;
                    }
                    // Store in history but don't trigger UI
                    this.errorHistory.push(...result.errors);
                    this.trimHistory();
                    this.isInitialFetch = false;
                } else {
                    result.errors.forEach(error => {
                        // Add to history
                        this.errorHistory.push(error);

                        // Trigger callback
                        if (this.onDataReceived) {
                            this.onDataReceived(error);
                        }
                    });

                    this.trimHistory();

                    if (result.latestId !== undefined) {
                        this.lastId = result.latestId;
                    }
                }
        } else if (this.isInitialFetch) {
            this.isInitialFetch = false;
        }
    }

     // Trim error history to max size

    trimHistory() {
        if (this.errorHistory.length > this.maxHistory) {
            this.errorHistory = this.errorHistory.slice(-this.maxHistory);
        }
    }

     // Get error history

    getHistory() {
        return [...this.errorHistory];
    }

     // Get recent errors (last N)

    getRecent(count = 10) {
        return this.errorHistory.slice(-count);
    }

    // Clear error history

    clearHistory() {
        this.errorHistory = [];
    }

    // Get error count by type

    getErrorStats() {
        const stats = {};
        this.errorHistory.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
        });
        return stats;
    }

   // Get total error count

    getErrorCount() {
        return this.errorHistory.length;
    }

   // Export errors as JSON

    exportErrors() {
        const data = {
            exported_at: new Date().toISOString(),
            total_errors: this.errorHistory.length,
            errors: this.errorHistory,
            stats: this.getErrorStats()
        };
        return JSON.stringify(data, null, 2);
    }

   // Reset error state

    reset() {
        super.reset();
        this.errorHistory = [];
        this.lastFetchErrorNotification = 0;
    }
}

window.ErrorService = ErrorService;
