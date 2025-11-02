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
        // Note: Loading animation is now controlled manually via showWorkflowLoading()
        // NOT automatically during polling
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
     * Show loading for workflow (manual trigger)
     */
    showWorkflowLoading() {
        if (this.uiManager) {
            this.uiManager.showLoading();
            console.log('🔄 Workflow loading shown');
        }
        
        // Hide empty state when loading shows
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
            console.log('🚫 Empty state hidden');
        }
    }

    /**
     * Hide workflow loading
     */
    hideWorkflowLoading() {
        if (this.uiManager) {
            // Add minimum display time to prevent flash
            setTimeout(() => {
                this.uiManager.hideLoading();
                console.log('✅ Workflow loading hidden');
            }, 1000); // Show for at least 1 second
        }
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