/**
 * PollingService
 * Handles data polling
 */
class PollingService {
    constructor(onPoll) {
        this.pollingInterval = null;
        this.pollingRate = 5000; // Poll every 5 seconds
        this.onPoll = onPoll;
    }

    /**
     * Start polling
     */
    start() {
        // Initial fetch
        if (this.onPoll) {
            this.onPoll();
        }

        // Set up polling interval
        this.pollingInterval = setInterval(() => {
            if (this.onPoll) {
                this.onPoll();
            }
        }, this.pollingRate);

        console.log(`Started data polling at ${this.pollingRate}ms interval`);
    }

    /**
     * Stop polling
     */
    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('Stopped data polling');
        }
    }

    /**
     * Change polling rate
     * @param {number} rate - New polling rate in milliseconds
     */
    setRate(rate) {
        this.pollingRate = rate;
        if (this.pollingInterval) {
            this.stop();
            this.start();
        }
    }
}

window.PollingService = PollingService;