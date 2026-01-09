class DataDashboard {
constructor() {
    this.dataService = new DataService((dataPacket) => this.handleIncomingData(dataPacket));
    this.notificationService = new NotificationService((notification) => {
        // When first notification arrives, dismiss error notifications and show loading
        const hasErrorNotifications = document.querySelectorAll('.notification-toast.notification-error').length > 0;
        
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
        
        // Check if message indicates completion (handles backend sending analysis_started with completion messages)
        const message = (notification.message || '').toLowerCase();
        const isCompletionMessage = message.includes('finished') || 
                                    message.includes('complete') || 
                                    message.includes('done');
        
        // Handle completion notifications - hide loading when analysis is done
        if (notification.type === 'all_complete' || 
            (notification.type === 'analysis_started' && isCompletionMessage && message.includes('all'))) {
            // Hide loading animation immediately when all analysis is complete
            this.stateManager.hideWorkflowLoading(true);
            
            // Get current data count and set it as the baseline
            requestAnimationFrame(() => {
                const currentDataCount = this.dataDisplay && this.dataDisplay.dataDisplay
                    ? (this.dataDisplay.dataDisplay.querySelectorAll('.card').length || 0)
                    : 0;
                this._lastDataCount = currentDataCount;
                this._dataStableSince = Date.now();
                // Schedule enable after short delay
                this._scheduleFormEnable();
            });
        } else if (notification.type === 'video_analysis_complete' ||
                   notification.type === 'image_analysis_complete' ||
                   notification.type === 'carousel_analysis_complete' ||
                   (notification.type === 'analysis_started' && isCompletionMessage &&
                    (message.includes('video') || message.includes('visual') || message.includes('image') || message.includes('carousel')))) {
            // Hide loading when video/image/carousel analysis completes (typically the last phase)
            // This handles cases where all_complete might not be sent
            // If a new analysis starts, showWorkflowLoading() will cancel this hide
            // Use force=true to hide immediately since video/image/carousel is typically the last phase
            this.stateManager.hideWorkflowLoading(true);

            // Schedule form enable check
            requestAnimationFrame(() => {
                const currentDataCount = this.dataDisplay && this.dataDisplay.dataDisplay
                    ? (this.dataDisplay.dataDisplay.querySelectorAll('.card').length || 0)
                    : 0;
                this._lastDataCount = currentDataCount;
                this._dataStableSince = Date.now();
                // Schedule enable after delay to check if more analysis is coming
                this._scheduleFormEnable();
            });
        } else if (notification.type === 'text_analysis_complete' || 
                   (notification.type === 'analysis_started' && isCompletionMessage && 
                    (message.includes('text') || message.includes('textual')))) {
            // Text analysis complete - don't hide loading yet (video/image may still be processing)
            // Don't show loading again either - just keep current state
            // Cancel any pending enable (analysis still in progress)
            if (this._enableFormTimeout) {
                clearTimeout(this._enableFormTimeout);
                this._enableFormTimeout = null;
            }
            // Reset tracking when analysis phase completes
            this._lastDataCount = 0;
            this._dataStableSince = null;
        } else if (notification.type === 'text_analysis_starting' ||
                   notification.type === 'video_analysis_starting' ||
                   notification.type === 'image_analysis_starting' ||
                   (notification.type === 'analysis_started' && !isCompletionMessage)) {
            // For all starting notifications - clear suppression and show loading animation
            // Clear suppression BEFORE showing loading to ensure it displays
            if (this.stateManager) {
                this.stateManager.allowWorkflowLoading();
            }

            // Show loading animation
            // Keep it visible during all analysis phases
            this.stateManager.showWorkflowLoading();

            // Cancel any pending enable (analysis still in progress)
            if (this._enableFormTimeout) {
                clearTimeout(this._enableFormTimeout);
                this._enableFormTimeout = null;
            }
            // Reset tracking when new analysis starts
            this._lastDataCount = 0;
            this._dataStableSince = null;
        }
        // For any other notification types, don't change loading state
    });
    
    this._updateUITimeout = null;
    this._formDisabledForAnalysis = false;
    this._enableFormTimeout = null;
    this._lastDataCount = 0;
    this._dataStableSince = null;
    
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
            }

            this._enableForm();
        } catch (callbackError) {
            // Silently handle callback errors
        }
    });

    this.stateManager = new StateManager();
    this.uiManager = new UIManager();

    this.statsCards = null;
    this.dataDisplay = null;
    this.modal = null;
    this.formBuilder = null;

    this.componentLoader = new ComponentLoader();

    this.init();
}

   async init() {
       try {
           await this.loadComponents();
           this.initializeComponents();
           this.uiManager.init();
           this.stateManager.setUIManager(this.uiManager);
           this.dataService.connect();
           this.notificationService.start();
           this.errorService.start();
           this.initializeClearButton();
       } catch (error) {
           console.error('Failed to initialize dashboard:', error);
       }
   }

    async loadComponents() {
        this.componentLoader.register('StatsCards', window.StatsCards);
        this.componentLoader.register('DataDisplay', window.DataDisplay);
        this.componentLoader.register('Modal', window.Modal);
    }

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

        const headerActions = this.createHeaderActions();
        container.appendChild(headerActions);

        this.dataDisplay = this.componentLoader.initComponent('DataDisplay', mainContent,
            (competitorName, fullAnalysis) => this.showFullAnalysis(competitorName, fullAnalysis)
        );

        this.modal = this.componentLoader.createComponent('Modal');
    }

    createHeaderActions() {
        const headerActions = document.createElement('div');
        headerActions.className = 'header-actions';
        headerActions.style.display = 'none';

        const competitorBadge = document.createElement('div');
        competitorBadge.className = 'counter-badge';
        competitorBadge.id = 'competitorCounter';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'counter-content';
        const label = document.createElement('span');
        label.className = 'counter-label';
        label.textContent = 'ADVERTISERS';
        const numberBadge = document.createElement('span');
        numberBadge.className = 'counter-number-badge';
        const number = document.createElement('span');
        number.className = 'counter-number';
        number.id = 'competitorBadgeCount';
        number.textContent = '0';
        numberBadge.appendChild(number);
        contentDiv.appendChild(label);
        contentDiv.appendChild(numberBadge);
        
        competitorBadge.appendChild(contentDiv);

        const adsBadge = document.createElement('div');
        adsBadge.className = 'counter-badge';
        adsBadge.id = 'adsCounter';
        
        const contentDiv2 = document.createElement('div');
        contentDiv2.className = 'counter-content';
        const label2 = document.createElement('span');
        label2.className = 'counter-label';
        label2.textContent = 'ADS';
        const numberBadge2 = document.createElement('span');
        numberBadge2.className = 'counter-number-badge';
        const number2 = document.createElement('span');
        number2.className = 'counter-number';
        number2.id = 'adsBadgeCount';
        number2.textContent = '0';
        numberBadge2.appendChild(number2);
        contentDiv2.appendChild(label2);
        contentDiv2.appendChild(numberBadge2);
        
        adsBadge.appendChild(contentDiv2);

        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'clear-data-btn';
        clearButton.id = 'clearDataBtn';
        const clearSvg = SvgHelper.create({
            width: 14,
            height: 14,
            strokeWidth: '2.5',
            children: [
                SvgHelper.line('18', '6', '6', '18'),
                SvgHelper.line('6', '6', '18', '18')
            ]
        });
        clearButton.appendChild(clearSvg);

        const counterWrapper = document.createElement('div');
        counterWrapper.className = 'counter-badges-wrapper';
        counterWrapper.appendChild(competitorBadge);
        counterWrapper.appendChild(adsBadge);

        headerActions.appendChild(counterWrapper);
        headerActions.appendChild(clearButton);

        return headerActions;
    }

    // Initialize the form

    initializeForm(formSection) {
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

     // Handle successful form submission

    handleFormSuccess(data) {
        const formContainerById = document.getElementById('formContainer');
        if (formContainerById) {
            formContainerById.style.display = 'none';
        }

        // Clear suppression flag to allow loading state
        if (this.stateManager) {
            this.stateManager.allowWorkflowLoading();
        }

        // Reset NotificationService isInitialFetch flag so new notifications will be processed
        if (this.notificationService) {
            this.notificationService.isInitialFetch = false;
        }

        // Show loading overlay immediately with initial message
        if (this.uiManager) {
            this.uiManager.showLoading('Starting analysis...');
        }

        // Disable form while analysis is running
        const formContainer = document.querySelector('.competitor-form');
        if (formContainer && this.formBuilder) {
            this.formBuilder.disableForm(formContainer.closest('.form-section') || formContainer);
            this._formDisabledForAnalysis = true;
        }

        // Show notification
        this.uiManager.showToast('Analysis started!', 'success');
    }

    handleFormError(error) {
        this.uiManager.showToast('Failed to start analysis. Please try again.', 'error');
    }

    handleIncomingData(dataPacket) {
        // Data received via SSE - process immediately
        if (this.stateManager.isFirstDataFetch()) {
            if (this.dataDisplay) {
                this.dataDisplay.clear();
            }
            this.stateManager.completeFirstFetch();
        }

        this.addDataItem(dataPacket);
    }

    async fetchData() {
        if (this.stateManager.isFetchingData()) {
            if (this._pendingFetchPromise) {
                return this._pendingFetchPromise;
            }
            return;
        }
        this.stateManager.setFetching(true);
        
        this._pendingFetchPromise = this._doFetchData().finally(() => {
            this._pendingFetchPromise = null;
        });
        
        return this._pendingFetchPromise;
    }
    
    async _doFetchData() {

        try {
            const result = await this.dataService.fetchData();

            if (result.success) {
                const dataArray = result.data || [];
                const counts = this.stateManager.getCounts();

                if (this.stateManager.isFirstDataFetch()) {
                    if (dataArray.length > 0 && this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    this._batchProcessItems(dataArray, () => {
                        this.stateManager.updateCounts(dataArray.length);
                        this.stateManager.completeFirstFetch();
                        this.updateUI();
                        this._lastDataCount = 0;
                        this._dataStableSince = null;
                        this._scheduleFormEnable();
                    });
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

                    if (this._enableFormTimeout) {
                        clearTimeout(this._enableFormTimeout);
                        this._enableFormTimeout = null;
                    }

                    this._batchProcessItems(newItems, () => {
                        this.stateManager.updateCounts(dataArray.length);
                        this.updateUI();
                        this._scheduleFormEnable();
                    });
                }
                else if (dataArray.length < counts.lastDataCount) {
                    if (this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    this._batchProcessItems(dataArray, () => {
                        this.stateManager.updateCounts(dataArray.length);
                        this.updateUI();
                        this._scheduleFormEnable();
                    });
                }
            }
        } catch (error) {
            if (!window.isNetworkError(error)) {
            }

            if (this.stateManager) {
                this.stateManager.suppressWorkflowLoading('data fetch error');
            }

            if (this.stateManager && this.stateManager.isFirstDataFetch()) {
                this.stateManager.completeFirstFetch();
                if (this.dataDisplay) {
                    const hasData = this.dataDisplay.hasData();
                    const emptyState = this.dataDisplay.dataDisplay?.querySelector('.empty-state');
                    if (emptyState && !hasData) {
                        emptyState.style.display = '';
                    }
                }
            } else if (this.stateManager && !this.stateManager.isFirstDataFetch()) {
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

    _batchProcessItems(items, onComplete) {
        if (!items || items.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        // Process items in chunks to avoid blocking main thread
        const CHUNK_SIZE = 10;
        let index = 0;

        const processChunk = () => {
            const chunk = items.slice(index, index + CHUNK_SIZE);
            
            // Process chunk synchronously
            chunk.forEach((item) => {
                this.addDataItem(item);
            });

            index += CHUNK_SIZE;

            // Continue processing if more items remain
            if (index < items.length) {
                // Use requestIdleCallback if available, otherwise requestAnimationFrame
                if (window.requestIdleCallback) {
                    requestIdleCallback(processChunk, { timeout: 100 });
                } else {
                    requestAnimationFrame(processChunk);
                }
            } else {
                // All items processed, call onComplete after DOM updates
                // Use double requestAnimationFrame to ensure DOM is updated
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (onComplete) onComplete();
                    });
                });
            }
        };

        // Start processing
        if (window.requestIdleCallback) {
            requestIdleCallback(processChunk, { timeout: 100 });
        } else {
            requestAnimationFrame(processChunk);
        }
    }

    // Add data item to display

    addDataItem(incoming) {
        // Allow workflow loading (in case it was suppressed)
        if (this.stateManager) {
            this.stateManager.allowWorkflowLoading();
        }
        // Don't hide loading here - keep it visible until all_complete notification
        // Loading will be hidden when all analysis phases are done

        if (this.dataDisplay) {
            const stats = this.dataDisplay.addDataItem(incoming);

            this.stateManager.incrementDataCount();

            if (this.statsCards && stats) {
                this.statsCards.updateStats(stats.competitorCards, stats.adsCount);
            }
            
            // Update counter badges immediately when data is added
            if (stats) {
                this.uiManager.updateCounterBadges(stats.competitorCards, stats.adsCount);
                // Show header actions if we have data
                this.uiManager.updateClearButtonVisibility(true);
            }
        }
    }

    // Update UI (badges, visibility) - throttled to prevent rapid updates

    updateUI() {
        // Clear existing timeout if any
        if (this._updateUITimeout) {
            clearTimeout(this._updateUITimeout);
        }

        // Throttle UI updates to max once per 100ms
        this._updateUITimeout = setTimeout(() => {
            // Check for data using the DataDisplay's hasData method if available, otherwise fallback to DOM query
            let hasData = false;
            if (this.dataDisplay && typeof this.dataDisplay.hasData === 'function') {
                hasData = this.dataDisplay.hasData();
            } else if (this.dataDisplay && this.dataDisplay.dataDisplay) {
                hasData = this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;
            }

            this.uiManager.updateClearButtonVisibility(hasData);

            if (hasData && this.dataDisplay) {
                const stats = this.dataDisplay.getStats();
                this.uiManager.updateCounterBadges(stats.competitorCards, stats.adsCount);
            }
            
            this._updateUITimeout = null;
        }, 100);
    }

     // Initialize clear data button

    initializeClearButton() {
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }


    async clearAllData() {
        const hasData = this.dataDisplay && this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;

        if (!hasData) return;

        const confirmed = await this.uiManager.showClearConfirmation();
        if (!confirmed) return;

        const resumeServices = [];

        // Temporarily disconnect SSE to prevent data repopulation mid-clear
        if (this.dataService && this.dataService.eventSource) {
            this.dataService.disconnect();
            resumeServices.push(() => this.dataService.connect());
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
            
            // Enable form after clearing data
            this._enableForm();
        } catch (error) {
            this.uiManager.showToast('Failed to clear data from server', 'error');

            // Enable form even if clearing failed
            this._enableForm();
        } finally {
            resumeServices.forEach((resume) => {
                try {
                    resume();
                } catch (resumeError) {
                    // Silently handle resume errors
                }
            });

            this.uiManager.setClearButtonState(false);
        }
    }

     // Check if analysis is still in progress

    _isAnalysisInProgress() {
        // Check if loading overlay is active
        const loadingOverlay = document.querySelector('#loadingOverlay');
        if (loadingOverlay && loadingOverlay.classList.contains('active')) {
            return true;
        }

        // Check if there are any "analysis starting" notifications visible
        const analysisNotifications = document.querySelectorAll('.notification-toast');
        for (const notification of analysisNotifications) {
            const title = notification.querySelector('.notification-title')?.textContent || '';
            if (title.includes('Analysis Starting') || 
                title.includes('Text Analysis Starting') ||
                title.includes('Video Analysis Starting') ||
                title.includes('Image Analysis Starting')) {
                return true;
            }
        }

        return false;
    }

     // Schedule form enable with delay to check if more data is coming

    _scheduleFormEnable() {
        // Only enable if form was disabled for analysis
        if (!this._formDisabledForAnalysis) {
            return;
        }

        // Check if analysis is still in progress - if so, don't enable
        if (this._isAnalysisInProgress()) {
            // Clear any existing timeout and reschedule check
            if (this._enableFormTimeout) {
                clearTimeout(this._enableFormTimeout);
            }
            // Check again in 2 seconds
            this._enableFormTimeout = setTimeout(() => {
                this._scheduleFormEnable();
            }, 2000);
            return;
        }

        // Use requestAnimationFrame to ensure DOM is updated before checking
        requestAnimationFrame(() => {
            // Get current data count after DOM update
            const currentDataCount = this.dataDisplay && this.dataDisplay.dataDisplay
                ? (this.dataDisplay.dataDisplay.querySelectorAll('.card').length || 0)
                : 0;

            // Check if data count has changed
            if (currentDataCount !== this._lastDataCount) {
                // Data count changed - reset stability timer
                this._lastDataCount = currentDataCount;
                this._dataStableSince = Date.now();
                
                // Clear any existing timeout
                if (this._enableFormTimeout) {
                    clearTimeout(this._enableFormTimeout);
                    this._enableFormTimeout = null;
                }
                
                // Don't schedule enable yet - wait for data to stabilize
                return;
            }

            // Data count hasn't changed - check how long it's been stable
            const now = Date.now();
            if (this._dataStableSince === null) {
                this._dataStableSince = now;
            }

            const timeStable = now - this._dataStableSince;
            const requiredStableTime = 3000; // 3 seconds of no new data and no analysis

            // Clear any existing timeout
            if (this._enableFormTimeout) {
                clearTimeout(this._enableFormTimeout);
            }

            if (timeStable >= requiredStableTime) {
                // Data has been stable long enough and no analysis in progress - enable form
                this._enableForm();
            } else {
                // Schedule enable after remaining time
                const remainingTime = requiredStableTime - timeStable;
                this._enableFormTimeout = setTimeout(() => {
                    this._scheduleFormEnable(); // Re-check before enabling
                }, remainingTime);
            }
        });
    }

     // Enable form if it was disabled for analysis

    _enableForm() {
        if (!this._formDisabledForAnalysis) {
            return;
        }

        // Clear any pending timeout
        if (this._enableFormTimeout) {
            clearTimeout(this._enableFormTimeout);
            this._enableFormTimeout = null;
        }

        // Reset data stability tracking
        this._lastDataCount = 0;
        this._dataStableSince = null;

        const formContainer = document.querySelector('.competitor-form');
        if (formContainer && this.formBuilder) {
            this.formBuilder.enableForm(formContainer.closest('.form-section') || formContainer);
            this._formDisabledForAnalysis = false;
        }
    }

    showFullAnalysis(competitorName, fullAnalysis) {
        if (this.modal) {
            this.modal.showFullAnalysis(competitorName, fullAnalysis);
        }
    }

 destroy() {
     this.dataService.disconnect();
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