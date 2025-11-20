class DataDashboard {
constructor() {
    // Services
    this.dataService = new DataService();
    this.pollingService = new PollingService(() => this.fetchData());
    this.notificationService = new NotificationService((notification) => {
        // When first notification arrives, dismiss error notifications and show loading
        const hasErrorNotifications = document.querySelectorAll('.notification-toast .notification-accent.error').length > 0;
        
        if (hasErrorNotifications) {
            // Dismiss all error notifications
            if (this.uiManager) {
                this.uiManager.dismissAllErrorNotifications();
            }
            // Clear suppression flag to allow loading state
            if (this.stateManager) {
                this.stateManager.allowWorkflowLoading();
            }
        }
        
        this.uiManager.showNotification(notification);
        // Show loading animation when notification arrives
        this.stateManager.showWorkflowLoading();
    });
    
    // Throttle updateUI to prevent rapid-fire updates
    this._updateUITimeout = null;
    
    // Error Service
    this.errorService = new ErrorService((error) => {
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
                this.uiManager.showErrorNotification(error);
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
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'counter-icon';
        iconDiv.style.background = '#fce7f3';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#7c3aed');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z');
        svg.appendChild(path);
        iconDiv.appendChild(svg);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'counter-content';
        const label = document.createElement('div');
        label.className = 'counter-label';
        label.textContent = 'ADVERTISERS';
        const number = document.createElement('div');
        number.className = 'counter-number';
        number.id = 'competitorBadgeCount';
        number.textContent = '0';
        contentDiv.appendChild(label);
        contentDiv.appendChild(number);
        
        competitorBadge.appendChild(iconDiv);
        competitorBadge.appendChild(contentDiv);

        const adsBadge = document.createElement('div');
        adsBadge.className = 'counter-badge';
        adsBadge.id = 'adsCounter';
        
        const iconDiv2 = document.createElement('div');
        iconDiv2.className = 'counter-icon';
        iconDiv2.style.background = '#e9d5ff';
        const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg2.setAttribute('width', '18');
        svg2.setAttribute('height', '18');
        svg2.setAttribute('viewBox', '0 0 24 24');
        svg2.setAttribute('fill', 'none');
        svg2.setAttribute('stroke', '#7c3aed');
        svg2.setAttribute('stroke-width', '2');
        svg2.setAttribute('stroke-linecap', 'round');
        svg2.setAttribute('stroke-linejoin', 'round');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '22,3 2,3 10,12.46 10,19 14,21 14,12.46');
        svg2.appendChild(polygon);
        iconDiv2.appendChild(svg2);
        
        const contentDiv2 = document.createElement('div');
        contentDiv2.className = 'counter-content';
        const label2 = document.createElement('div');
        label2.className = 'counter-label';
        label2.textContent = 'ADS';
        const number2 = document.createElement('div');
        number2.className = 'counter-number';
        number2.id = 'adsBadgeCount';
        number2.textContent = '0';
        contentDiv2.appendChild(label2);
        contentDiv2.appendChild(number2);
        
        adsBadge.appendChild(iconDiv2);
        adsBadge.appendChild(contentDiv2);

        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'clear-data-btn';
        clearButton.id = 'clearDataBtn';
        const clearSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        clearSvg.setAttribute('width', '14');
        clearSvg.setAttribute('height', '14');
        clearSvg.setAttribute('viewBox', '0 0 24 24');
        clearSvg.setAttribute('fill', 'none');
        clearSvg.setAttribute('stroke', 'currentColor');
        clearSvg.setAttribute('stroke-width', '2.5');
        clearSvg.setAttribute('stroke-linecap', 'round');
        clearSvg.setAttribute('stroke-linejoin', 'round');
        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', '18');
        line1.setAttribute('y1', '6');
        line1.setAttribute('x2', '6');
        line1.setAttribute('y2', '18');
        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', '6');
        line2.setAttribute('y1', '6');
        line2.setAttribute('x2', '18');
        line2.setAttribute('y2', '18');
        clearSvg.appendChild(line1);
        clearSvg.appendChild(line2);
        clearButton.appendChild(clearSvg);
        clearButton.appendChild(document.createTextNode(' CLEAR ALL'));

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
        // Use DOMParser to safely parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.formBuilder.build(), 'text/html');
        const formHTML = doc.body.firstChild;
        if (formHTML) {
            formSection.appendChild(formHTML);
        }

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
        const formContainer = document.getElementById('formContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
        }

        // Clear suppression flag to allow loading state when first notification arrives
        if (this.stateManager) {
            this.stateManager.allowWorkflowLoading();
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

                if (this.stateManager.isFirstDataFetch()) {
                    if (dataArray.length > 0 && this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    // Batch process items for smoother rendering
                    this._batchProcessItems(dataArray);

                    this.stateManager.updateCounts(dataArray.length);
                    this.stateManager.completeFirstFetch();
                    this.updateUI();

                    // After first fetch, show empty state ONLY if no data exists
                    if (this.dataDisplay) {
                        const hasData = this.dataDisplay.hasData();
                        const emptyState = this.dataDisplay.dataDisplay?.querySelector('.empty-state');
                        if (emptyState) {
                            if (hasData) {
                                // Hide/remove empty state if data exists
                                emptyState.style.display = 'none';
                            } else {
                                // Show empty state if no data
                                emptyState.style.display = '';
                            }
                        }
                    }
                }
                else if (dataArray.length > counts.lastDataCount) {
                    const newItems = dataArray.slice(counts.lastDataCount);

                    if (counts.lastDataCount === 0 && this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    // Batch process new items for smoother rendering
                    this._batchProcessItems(newItems);

                    this.stateManager.updateCounts(dataArray.length);
                    this.updateUI();
                }
                else if (dataArray.length < counts.lastDataCount) {
                    if (this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    // Batch process items for smoother rendering
                    this._batchProcessItems(dataArray);

                    this.stateManager.updateCounts(dataArray.length);
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);

            if (this.stateManager) {
                this.stateManager.suppressWorkflowLoading('data fetch error');
            }

            // Handle empty state based on first fetch status
            if (this.stateManager && this.stateManager.isFirstDataFetch()) {
                // On first fetch error, mark as complete and show empty state if no data
                this.stateManager.completeFirstFetch();
                if (this.dataDisplay) {
                    const hasData = this.dataDisplay.hasData();
                    const emptyState = this.dataDisplay.dataDisplay?.querySelector('.empty-state');
                    if (emptyState && !hasData) {
                        emptyState.style.display = '';
                    }
                }
            } else if (this.stateManager && !this.stateManager.isFirstDataFetch()) {
                // After first fetch, show empty state only if no data exists
                if (this.dataDisplay && typeof this.dataDisplay.hasData === 'function') {
                    if (!this.dataDisplay.hasData()) {
                        this.dataDisplay.clear(true);
                    }
                } else if (this.stateManager) {
                    this.stateManager.showEmptyState();
                }
            }
        } finally {
            if (this.stateManager) {
                this.stateManager.setFetching(false);
            }
        }
    }

    /**
     * Batch process multiple items efficiently
     * Processes all items and batches DOM updates for smooth rendering
     */
    _batchProcessItems(items) {
        if (!items || items.length === 0) return;

        // Process all items, but batch the DOM updates
        // This allows data processing to happen quickly while DOM updates are batched
        items.forEach((item) => {
            this.addDataItem(item);
        });
    }

    /**
     * Add data item to display
     */
    addDataItem(incoming) {
        // Hide loading animation when first data arrives
        if (this.stateManager) {
            this.stateManager.allowWorkflowLoading();
        }
        this.stateManager.hideWorkflowLoading();

        if (this.dataDisplay) {
            const stats = this.dataDisplay.addDataItem(incoming);

            this.stateManager.incrementDataCount();

            if (this.statsCards && stats) {
                this.statsCards.updateStats(stats.competitorCards, stats.adsCount);
            }
        }
    }

    /**
     * Update UI (badges, visibility) - throttled to prevent rapid updates
     */
    updateUI() {
        // Clear existing timeout if any
        if (this._updateUITimeout) {
            clearTimeout(this._updateUITimeout);
        }

        // Throttle UI updates to max once per 100ms
        this._updateUITimeout = setTimeout(() => {
            const hasData = this.dataDisplay && this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;

            this.uiManager.updateClearButtonVisibility(hasData);

            if (hasData && this.dataDisplay) {
                const stats = this.dataDisplay.getStats();
                this.uiManager.updateCounterBadges(stats.competitorCards, stats.adsCount);
            }
            
            this._updateUITimeout = null;
        }, 100);
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