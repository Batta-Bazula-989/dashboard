class DataDashboard {
constructor() {
    // Services
    this.dataService = new DataService();
    this.pollingService = new PollingService(() => this.fetchData());
    this.notificationService = new NotificationService((notification) => {
        this.uiManager.showNotification(notification);
        // Show loading animation when notification arrives
        this.stateManager.showWorkflowLoading();
    });
    
    // Error Service
    this.errorService = new ErrorService((error) => {
        console.log('🚨 ERROR received:', error);

        try {
            if (this.stateManager) {
                this.stateManager.setFetching(false);
                this.stateManager.suppressWorkflowLoading('error received');
            }

            if (this.dataDisplay && typeof this.dataDisplay.hasData === 'function' && !this.dataDisplay.hasData()) {
                this.dataDisplay.clear(true);
            } else if (this.stateManager) {
                this.stateManager.showEmptyState();
            }

            if (this.uiManager) {
                console.log('📢 Calling uiManager.showErrorNotification with:', error);
                this.uiManager.showErrorNotification(error);
                console.log('✅ uiManager.showErrorNotification called');
            } else {
                console.error('❌ uiManager is not available when error callback is triggered!');
            }
        } catch (callbackError) {
            console.error('❌ Error in errorService callback:', callbackError);
        }
    });

    // Managers
    this.stateManager = new StateManager();
    this.uiManager = new UIManager();

    // Component instances
    this.statsCards = null;
    this.dataDisplay = null;
    this.modal = null;
    this.formBuilder = null;

    // Component loader
    this.componentLoader = new ComponentLoader();

    this.init();
}

    /**
     * Initialize the dashboard
     */
   async init() {
       try {
           await this.loadComponents();
           this.initializeComponents();
           this.uiManager.init();
           // Connect StateManager to UIManager for loading states
           this.stateManager.setUIManager(this.uiManager);
           this.pollingService.start();
           this.notificationService.start();
           this.errorService.start();
           this.initializeClearButton();
       } catch (error) {
           console.error('Failed to initialize dashboard:', error);
       }
   }

    /**
     * Load all required components
     */
    async loadComponents() {
        this.componentLoader.register('StatsCards', window.StatsCards);
        this.componentLoader.register('DataDisplay', window.DataDisplay);
        this.componentLoader.register('Modal', window.Modal);
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        const container = document.querySelector('.container');

        const formSection = document.createElement('div');
        formSection.className = 'form-section';

        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';

        container.appendChild(formSection);
        container.appendChild(mainContent);

        this.formBuilder = new FormBuilder();
        this.initializeForm(formSection);

        // Create header actions (counter badges + clear button)
        const headerActions = this.createHeaderActions();
        container.appendChild(headerActions);

        this.dataDisplay = this.componentLoader.initComponent('DataDisplay', mainContent,
            (competitorName, fullAnalysis) => this.showFullAnalysis(competitorName, fullAnalysis)
        );

        this.modal = this.componentLoader.createComponent('Modal');
    }

    /**
     * Create header actions (counter badges + clear button)
     */
    createHeaderActions() {
        const headerActions = document.createElement('div');
        headerActions.className = 'header-actions';
        headerActions.style.display = 'none';

        const competitorBadge = document.createElement('div');
        competitorBadge.className = 'counter-badge';
        competitorBadge.id = 'competitorCounter';
        competitorBadge.innerHTML = `
            <div class="counter-icon" style="background: #fce7f3;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </div>
            <div class="counter-content">
                <div class="counter-label">ADVERTISERS</div>
                <div class="counter-number" id="competitorBadgeCount">0</div>
            </div>
        `;

        const adsBadge = document.createElement('div');
        adsBadge.className = 'counter-badge';
        adsBadge.id = 'adsCounter';
        adsBadge.innerHTML = `
            <div class="counter-icon" style="background: #fae8ff;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
                </svg>
            </div>
            <div class="counter-content">
                <div class="counter-label">ADS</div>
                <div class="counter-number" id="adsBadgeCount">0</div>
            </div>
        `;

        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'clear-data-btn';
        clearButton.id = 'clearDataBtn';
        clearButton.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Clear All
        `;

        const counterWrapper = document.createElement('div');
        counterWrapper.className = 'counter-badges-wrapper';
        counterWrapper.appendChild(competitorBadge);
        counterWrapper.appendChild(adsBadge);

        headerActions.appendChild(counterWrapper);
        headerActions.appendChild(clearButton);

        return headerActions;
    }

    /**
     * Initialize the form
     */
    initializeForm(formSection) {
        formSection.innerHTML = this.formBuilder.build();

        this.formBuilder.initEventListeners(
            formSection,
            (data) => this.handleFormSuccess(data),
            (error) => this.handleFormError(error)
        );
    }

    /**
     * Handle successful form submission
     */
    handleFormSuccess(data) {
        console.log('Form submitted successfully:', data);
        const formContainer = document.getElementById('formContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
        }

        // Dismiss all error notifications when starting new analysis
        if (this.uiManager) {
            this.uiManager.dismissAllErrorNotifications();
        }

        if (this.stateManager) {
            // Clear suppression flag to allow loading state
            this.stateManager.allowWorkflowLoading();
            // Show loading state immediately
            this.stateManager.showWorkflowLoading();
        }
        
        this.uiManager.showToast('Analysis started! Results will appear shortly.', 'success');
    }

    /**
     * Handle form submission error
     */
    handleFormError(error) {
        console.error('Form submission error:', error);
        this.uiManager.showToast('Failed to start analysis. Please try again.', 'error');
    }

    /**
     * Fetch data from API
     */
    async fetchData() {
        if (this.stateManager.isFetchingData()) return;
        this.stateManager.setFetching(true);

        try {
            const result = await this.dataService.fetchData();

            if (result.success) {
                const dataArray = result.data || [];
                const counts = this.stateManager.getCounts();

                console.log(`API returned ${dataArray.length} items`);
                console.log(`Last data count: ${counts.lastDataCount}`);
                console.log(`Is first fetch: ${this.stateManager.isFirstDataFetch()}`);

                if (this.stateManager.isFirstDataFetch()) {
                    console.log(`First fetch - processing all ${dataArray.length} items`);

                    if (dataArray.length > 0 && this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    dataArray.forEach((item) => {
                        this.addDataItem(item);
                    });

                    this.stateManager.updateCounts(dataArray.length);
                    this.stateManager.completeFirstFetch();
                    this.updateUI();

                    console.log(`=== FIRST FETCH COMPLETE ===`);
                }
                else if (dataArray.length > counts.lastDataCount) {
                    const newItems = dataArray.slice(counts.lastDataCount);
                    console.log(`Found ${newItems.length} new items`);

                    if (counts.lastDataCount === 0 && this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    newItems.forEach((item) => {
                        this.addDataItem(item);
                    });

                    this.stateManager.updateCounts(dataArray.length);
                    this.updateUI();
                }
                else if (dataArray.length < counts.lastDataCount) {
                    console.log(`Data count decreased, reprocessing`);

                    if (this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    dataArray.forEach((item) => {
                        this.addDataItem(item);
                    });

                    this.stateManager.updateCounts(dataArray.length);
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);

            if (this.stateManager) {
                this.stateManager.suppressWorkflowLoading('data fetch error');
            }

            if (this.dataDisplay && typeof this.dataDisplay.hasData === 'function') {
                if (!this.dataDisplay.hasData()) {
                    this.dataDisplay.clear(true);
                }
            } else if (this.stateManager) {
                this.stateManager.showEmptyState();
            }
        } finally {
            if (this.stateManager) {
                this.stateManager.setFetching(false);
            }
        }
    }

    /**
     * Add data item to display
     */
    addDataItem(incoming) {
        const dataType = incoming.dataType || 'unknown';
        console.log(`Adding ${dataType} data item:`, incoming);

        // Hide loading animation when first data arrives
        if (this.stateManager) {
            this.stateManager.allowWorkflowLoading();
        }
        this.stateManager.hideWorkflowLoading();

        if (this.dataDisplay) {
            const stats = this.dataDisplay.addDataItem(incoming);
            console.log(`Analysis stats:`, stats);

            this.stateManager.incrementDataCount();

            if (this.statsCards && stats) {
                this.statsCards.updateStats(stats.competitorCards, stats.adsCount);
            }
        }
    }

    /**
     * Update UI (badges, visibility)
     */
    updateUI() {
        const hasData = this.dataDisplay && this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;

        this.uiManager.updateClearButtonVisibility(hasData);

        if (hasData && this.dataDisplay) {
            const stats = this.dataDisplay.getStats();
            this.uiManager.updateCounterBadges(stats.competitorCards, stats.adsCount);
        }
    }

    /**
     * Initialize clear data button
     */
    initializeClearButton() {
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });
            console.log('✅ Clear data button initialized');
        }
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        const hasData = this.dataDisplay && this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;

        if (!hasData) return;

        const confirmed = await this.uiManager.showClearConfirmation();
        if (!confirmed) return;

        const resumeServices = [];

        // Temporarily stop polling services to prevent data repopulation mid-clear
        if (this.pollingService && this.pollingService.pollingInterval) {
            this.pollingService.stop();
            resumeServices.push(() => this.pollingService.start());
        }

        if (this.notificationService && this.notificationService.pollingInterval) {
            this.notificationService.stop();
            resumeServices.push(() => this.notificationService.start());
        }

        if (this.errorService && this.errorService.isPolling) {
            this.errorService.stop();
            resumeServices.push(() => this.errorService.start());
        }

        try {
            this.uiManager.setClearButtonState(true);

            await this.dataService.clearData();

            if (this.dataDisplay) {
                this.dataDisplay.clear(true);
            }

            this.stateManager.reset();

            if (this.statsCards) {
                this.statsCards.updateStats(0, 0);
            }

            this.updateUI();

            this.uiManager.showToast('All data cleared successfully', 'success');
        } catch (error) {
            console.error('Error clearing data:', error);
            this.uiManager.showToast('Failed to clear data from server', 'error');
        } finally {
            resumeServices.forEach((resume) => {
                try {
                    resume();
                } catch (resumeError) {
                    console.error('Failed to resume service after clearing:', resumeError);
                }
            });

            this.uiManager.setClearButtonState(false);
        }
    }

    /**
     * Show full analysis modal
     */
    showFullAnalysis(competitorName, fullAnalysis) {
        if (this.modal) {
            this.modal.showFullAnalysis(competitorName, fullAnalysis);
        }
    }

    /**
     * Destroy and clean up
     */
 destroy() {
     this.pollingService.stop();
     this.notificationService.stop();
     this.errorService.stop();

     if (this.modal && this.modal.isOpen()) {
         this.modal.closeModal();
     }

     this.statsCards = null;
     this.dataDisplay = null;
     this.modal = null;
 }
}

// Initialize dashboard
let dashboardInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (dashboardInstance) {
            dashboardInstance.destroy();
        }
        dashboardInstance = new DataDashboard();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
});

window.addEventListener('beforeunload', () => {
    if (dashboardInstance) {
        dashboardInstance.destroy();
    }
});