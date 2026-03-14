class ErrorService extends BasePollingService {
    constructor(onErrorReceived) {
        super('/api/errors', 3000, onErrorReceived);
        this._fetchErrorMessage = ERROR_MESSAGES.ERRORS_FETCH_ERROR;
        this.errorHistory = [];
        this.maxHistory = 100;
        this.lastFetchErrorNotification = 0;
        this.fetchErrorNotificationThrottle = 30000; // 30 seconds
    }

    _onFetchFailure(error, wasInitialFetch) {
        // Mark initial fetch done even on failure so subsequent errors can be shown
        if (wasInitialFetch) {
            this.isInitialFetch = false;
        }

        // Show throttled notification for non-network errors after first fetch
        if (!wasInitialFetch && !isNetworkError(error) && this.onDataReceived) {
            const now = Date.now();
            if (now - this.lastFetchErrorNotification >= this.fetchErrorNotificationThrottle) {
                const statusCode = error.message.match(/status: (\d+)/)?.[1] || '500';
                this.onDataReceived({
                    type: 'api_error',
                    message: `Failed to fetch errors from server (HTTP ${statusCode}). The error monitoring service may be unavailable.`,
                    timestamp: new Date().toISOString(),
                    metadata: { source: 'ErrorService', originalError: error.message }
                });
                this.lastFetchErrorNotification = now;
            }
        }
    }

    _processData(result) {
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
