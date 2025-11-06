/**
 * ErrorService
 * Handles error polling, logging, and management
 */
class ErrorService {
    constructor(onErrorReceived) {
        this.baseUrl = '/api/errors'; // Dedicated error endpoint
        this.pollingInterval = null;
        this.pollingRate = 3000; // Poll every 3 seconds
        this.lastErrorId = -1;
        this.onErrorReceived = onErrorReceived;
        this.isInitialFetch = true;
        this.errorHistory = [];
        this.maxHistory = 100;
    }

    /**
     * Start polling for errors
     */
    start() {
        this.fetchErrors();

        this.pollingInterval = setInterval(() => {
            this.fetchErrors();
        }, this.pollingRate);

        console.log('✅ Started error polling (every 3s)');
    }

    /**
     * Stop polling for errors
     */
    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('⏹️ Stopped error polling');
        }
    }

    /**
     * Fetch new errors from server
     */
    async fetchErrors() {
        try {
            const url = this.lastErrorId >= 0
                ? `${this.baseUrl}?since=${this.lastErrorId}`
                : this.baseUrl;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.errors && result.errors.length > 0) {
                if (this.isInitialFetch) {
                    console.log(`📋 Initial fetch: Found ${result.errors.length} existing errors (skipping callbacks)`);
                    if (result.latestId !== undefined) {
                        this.lastErrorId = result.latestId;
                    }
                    // Store in history but don't trigger UI
                    this.errorHistory.push(...result.errors);
                    this.trimHistory();
                    this.isInitialFetch = false;
                } else {
                    console.log(`🚨 Received ${result.errors.length} new errors`);

                    result.errors.forEach(error => {
                        // Add to history
                        this.errorHistory.push(error);

                        // Trigger callback
                        if (this.onErrorReceived) {
                            this.onErrorReceived(error);
                        }
                    });

                    this.trimHistory();

                    if (result.latestId !== undefined) {
                        this.lastErrorId = result.latestId;
                    }
                }
            } else if (this.isInitialFetch) {
                console.log('✅ Initial fetch: No existing errors');
                this.isInitialFetch = false;
            }
        } catch (error) {
            console.error('❌ Error fetching errors:', error);
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
        console.log('🗑️ Error history cleared');
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
        this.lastErrorId = -1;
        this.isInitialFetch = true;
        this.errorHistory = [];
        console.log('🔄 Error service reset');
    }
}

window.ErrorService = ErrorService;

