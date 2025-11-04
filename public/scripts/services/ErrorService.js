/**
 * ErrorService
 * Polls for errors from the server and displays them in the UI
 */
class ErrorService {
    constructor(onErrorReceived) {
        this.baseUrl = '/api/errors';
        this.pollingInterval = null;
        this.pollingRate = 3000; // Poll every 3 seconds
        this.lastErrorId = -1;
        this.onErrorReceived = onErrorReceived;
        this.isInitialFetch = true; // Track initial fetch to avoid triggering on old errors
    }

    /**
     * Start polling for errors
     */
    start() {
        this.fetchErrors();

        this.pollingInterval = setInterval(() => {
            this.fetchErrors();
        }, this.pollingRate);

        console.log('Started error polling');
    }

    /**
     * Stop polling for errors
     */
    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('Stopped error polling');
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
                // On initial fetch, just record the latest ID without triggering callbacks
                if (this.isInitialFetch) {
                    console.log(`Initial fetch: Found ${result.errors.length} existing errors (skipping callbacks)`);
                    if (result.latestId !== undefined) {
                        this.lastErrorId = result.latestId;
                    }
                    this.isInitialFetch = false;
                } else {
                    // Only trigger callbacks for truly new errors after initial fetch
                    console.log(`Received ${result.errors.length} new errors`);

                    result.errors.forEach(error => {
                        if (this.onErrorReceived) {
                            this.onErrorReceived(error);
                        }
                    });

                    if (result.latestId !== undefined) {
                        this.lastErrorId = result.latestId;
                    }
                }
            } else if (this.isInitialFetch) {
                // No errors on initial fetch - still mark as initialized
                console.log('Initial fetch: No existing errors');
                this.isInitialFetch = false;
            }
        } catch (error) {
            console.error('Error fetching errors:', error);
        }
    }

    /**
     * Reset error state
     */
    reset() {
        this.lastErrorId = -1;
        this.isInitialFetch = true;
    }
}

window.ErrorService = ErrorService;

