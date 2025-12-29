class StateManager {
    constructor(uiManager = null) {
        this.dataCount = 0;
        this.lastDataCount = 0;
        this.isFirstFetch = true;
        this.isFetching = false;
        this.uiManager = uiManager;
        this.isWorkflowSuppressed = false;
        this.hideTimeout = null; // Store timeout reference to allow cancellation
    }

     // Set UI Manager reference
    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    // Set fetching state
    setFetching(value) {
        this.isFetching = value;
        // Note: Loading animation is now controlled manually via showWorkflowLoading()
        // NOT automatically during polling
    }

     // Check if currently fetching
    isFetchingData() {
        return this.isFetching;
    }

    // Mark first fetch as complete
    completeFirstFetch() {
        this.isFirstFetch = false;
    }

   // Check if this is the first fetch
    isFirstDataFetch() {
        return this.isFirstFetch;
    }

     // Update data counts
    updateCounts(newCount) {
        this.lastDataCount = newCount;
    }

     // Increment data count
    incrementDataCount() {
        this.dataCount++;
    }

     // Show loading for workflow (manual trigger)
    showWorkflowLoading() {
        if (this.isWorkflowSuppressed) {
            return;
        }

        // Cancel any pending hide operation - we want to show loading now
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Hide/remove empty state first when loading shows
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        if (this.uiManager) {
            this.uiManager.showLoading();
        }
    }

     // Prevent workflow loading from showing
    suppressWorkflowLoading(reason = '') {
        if (!this.isWorkflowSuppressed) {
            this.isWorkflowSuppressed = true;
        }

        this.hideWorkflowLoading(true);
        this.showEmptyState();
    }

     // Allow workflow loading to show again
    allowWorkflowLoading() {
        if (this.isWorkflowSuppressed) {
            this.isWorkflowSuppressed = false;
        }
    }

     // Hide workflow loading
    hideWorkflowLoading(force = false) {
        if (!this.uiManager) {
            return;
        }

        // Cancel any existing hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        const hide = () => {
            this.uiManager.hideLoading();
            this.hideTimeout = null; // Clear reference after hiding
        };

        if (force) {
            hide();
            return;
        }

        // Store timeout reference so it can be cancelled if needed
        this.hideTimeout = setTimeout(hide, 1000);
    }

     // Show empty state if no cards are present
    showEmptyState() {
        const emptyState = document.querySelector('.empty-state');
        if (!emptyState) {
            return;
        }

        const hasCards = document.querySelector('.data-display-content .card');
        if (hasCards) {
            return;
        }

        emptyState.style.display = '';
    }

     // Reset all state
    reset() {
        // Cancel any pending hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        this.dataCount = 0;
        this.lastDataCount = 0;
        this.isFirstFetch = true;
        this.isFetching = false;
        this.isWorkflowSuppressed = false;
    }

     // Get current counts
    getCounts() {
        return {
            dataCount: this.dataCount,
            lastDataCount: this.lastDataCount
        };
    }
}

window.StateManager = StateManager;