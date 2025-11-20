/**
 * ErrorService
 * Handles error polling, logging, and management
 */
class ErrorService extends BasePollingService {
    constructor(onErrorReceived) {
        super('/api/errors', 3000, onErrorReceived);
        this.errorHistory = [];
        this.maxHistory = 100;
        this.lastFetchErrorNotification = 0;
        this.fetchErrorNotificationThrottle = 30000; // 30 seconds
    }

    /**
     * Fetch new errors from server
     */
    async fetchData() {
        if (this.isFetching) {
            return;
        }

        try {
            this.isFetching = true;

            const url = this.buildUrl();
            const response = await fetch(url);

            if (!response.ok) {
                // Try to get error details from response if available
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.clone().json();
                    if (errorData.error) {
                        errorMessage += ` - ${errorData.error}`;
                    }
                } catch (e) {
                    // Response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

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
        } catch (error) {
            console.error('❌ Error fetching errors:', error);
            
            // Mark initial fetch as complete even if it failed, so subsequent errors can be shown
            const wasInitialFetch = this.isInitialFetch;
            if (this.isInitialFetch) {
                this.isInitialFetch = false;
            }
            
            // Show notification when fetch fails (but not on initial fetch and with throttling)
            if (!wasInitialFetch && this.onDataReceived) {
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

    /**
     * Trim error history to max size
     */
    trimHistory() {
        if (this.errorHistory.length > this.maxHistory) {
            this.errorHistory = this.errorHistory.slice(-this.maxHistory);
        }
    }

    /**
     * Get error history
     */
    getHistory() {
        return [...this.errorHistory];
    }

    /**
     * Get recent errors (last N)
     */
    getRecent(count = 10) {
        return this.errorHistory.slice(-count);
    }

    /**
     * Clear error history
     */
    clearHistory() {
        this.errorHistory = [];
    }

    /**
     * Get error count by type
     */
    getErrorStats() {
        const stats = {};
        this.errorHistory.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
        });
        return stats;
    }

    /**
     * Get total error count
     */
    getErrorCount() {
        return this.errorHistory.length;
    }

    /**
     * Export errors as JSON
     */
    exportErrors() {
        const data = {
            exported_at: new Date().toISOString(),
            total_errors: this.errorHistory.length,
            errors: this.errorHistory,
            stats: this.getErrorStats()
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Reset error state
     */
    reset() {
        super.reset();
        this.errorHistory = [];
        this.lastFetchErrorNotification = 0;
    }
}

window.ErrorService = ErrorService;

