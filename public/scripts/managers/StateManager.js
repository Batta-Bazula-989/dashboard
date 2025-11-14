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
        this.isWorkflowSuppressed = false;
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
        if (this.isWorkflowSuppressed) {
            console.log('⚠️ Workflow loading suppressed - ignoring show request');
            return;
        }

        // Hide/remove empty state first when loading shows
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
            console.log('🚫 Empty state hidden');
        }

        if (this.uiManager) {
            this.uiManager.showLoading();
            console.log('🔄 Workflow loading shown');
        }
    }

    /**
     * Prevent workflow loading from showing
     */
    suppressWorkflowLoading(reason = '') {
        if (!this.isWorkflowSuppressed) {
            this.isWorkflowSuppressed = true;
            console.log(`🚫 Workflow loading suppressed${reason ? `: ${reason}` : ''}`);
        }

        this.hideWorkflowLoading(true);
        this.showEmptyState();
    }

    /**
     * Allow workflow loading to show again
     */
    allowWorkflowLoading() {
        if (this.isWorkflowSuppressed) {
            this.isWorkflowSuppressed = false;
            console.log('✅ Workflow loading suppression cleared');
        }
    }

    /**
     * Hide workflow loading
     */
    hideWorkflowLoading(force = false) {
        if (!this.uiManager) {
            return;
        }

        const hide = () => {
            this.uiManager.hideLoading();
            console.log('✅ Workflow loading hidden');
        };

        if (force) {
            hide();
            return;
        }

        // Add minimum display time to prevent flash
        setTimeout(hide, 1000); // Show for at least 1 second
    }

    /**
     * Show empty state if no cards are present
     */
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
        console.log('✨ Empty state shown');
    }

    /**
     * Reset all state
     */
    reset() {
        this.dataCount = 0;
        this.lastDataCount = 0;
        this.isFirstFetch = true;
        this.isFetching = false;
        this.isWorkflowSuppressed = false;
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