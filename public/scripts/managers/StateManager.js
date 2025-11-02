/**
 * StateManager
 * Manages application state
 */
class StateManager {
    constructor(uiManager = null) {
        this.dataCount = 0;
        this.lastDataCount = 0;
        this.isFirstFetch = true;
        this.isFetching = false;
        this.uiManager = uiManager;
    }

    /**
     * Set UI Manager reference
     */
    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    /**
     * Set fetching state
     */
    setFetching(value) {
        this.isFetching = value;
        
        // Update loading UI
        if (this.uiManager) {
            if (value) {
                this.uiManager.showLoading();
            } else {
                this.uiManager.hideLoading();
            }
        }
    }

    /**
     * Check if currently fetching
     */
    isFetchingData() {
        return this.isFetching;
    }

    /**
     * Mark first fetch as complete
     */
    completeFirstFetch() {
        this.isFirstFetch = false;
    }

    /**
     * Check if this is the first fetch
     */
    isFirstDataFetch() {
        return this.isFirstFetch;
    }

    /**
     * Update data counts
     */
    updateCounts(newCount) {
        this.lastDataCount = newCount;
    }

    /**
     * Increment data count
     */
    incrementDataCount() {
        this.dataCount++;
    }

    /**
     * Reset all state
     */
    reset() {
        this.dataCount = 0;
        this.lastDataCount = 0;
        this.isFirstFetch = true;
        this.isFetching = false;
    }

    /**
     * Get current counts
     */
    getCounts() {
        return {
            dataCount: this.dataCount,
            lastDataCount: this.lastDataCount
        };
    }
}

window.StateManager = StateManager;