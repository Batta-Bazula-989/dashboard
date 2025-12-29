class PollingService {
    constructor(onPoll) {
        this.pollingInterval = null;
        this.pollingRate = 5000; // Poll every 5 seconds
        this.onPoll = onPoll;
    }

     // Start polling

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
    }

  // Stop polling

    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // * Change polling rate

    setRate(rate) {
        this.pollingRate = rate;
        if (this.pollingInterval) {
            this.stop();
            this.start();
        }
    }
}

window.PollingService = PollingService;