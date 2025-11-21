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

     // Initialize the dashboard

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

     // Load all required components

    async loadComponents() {
        this.componentLoader.register('StatsCards', window.StatsCards);
        this.componentLoader.register('DataDisplay', window.DataDisplay);
        this.componentLoader.register('Modal', window.Modal);
    }

     // Initialize all components

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

    // Create header actions (counter badges + clear button)

    createHeaderActions() {
        const headerActions = document.createElement('div');
        headerActions.className = 'header-actions';
        headerActions.style.display = 'none';

        // Advertisers Button - EXACT match to React code
        const competitorBadge = document.createElement('button');
        competitorBadge.className = 'counter-badge';
        competitorBadge.id = 'competitorCounter';
        competitorBadge.type = 'button';
        // Inline styles - EXACT match to React: bg-pink-200 rounded p-4 transition-all flex items-start gap-4 border-2 border-gray-300
        competitorBadge.style.background = '#fbcfe8'; // bg-pink-200
        competitorBadge.style.borderRadius = '6px'; // rounded
        competitorBadge.style.padding = '16px'; // p-4
        competitorBadge.style.transition = 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'; // transition-all
        competitorBadge.style.display = 'flex';
        competitorBadge.style.alignItems = 'flex-start'; // items-start
        competitorBadge.style.gap = '16px'; // gap-4
        competitorBadge.style.border = '2px solid #d1d5db'; // border-2 border-gray-300
        competitorBadge.style.boxShadow = '3px 3px 0px 0px rgba(200,200,200,1)';
        competitorBadge.style.width = '201px'; // EXACT from React
        competitorBadge.style.cursor = 'pointer';
        competitorBadge.style.margin = '0';
        competitorBadge.style.outline = 'none';
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'counter-icon';
        // Inline styles - EXACT match to React: bg-pink-100 rounded p-3 flex-shrink-0
        iconDiv.style.background = '#fce7f3'; // bg-pink-100
        iconDiv.style.borderRadius = '6px'; // rounded
        iconDiv.style.padding = '12px'; // p-3
        iconDiv.style.flexShrink = '0';
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';
        iconDiv.style.justifyContent = 'center';
        iconDiv.style.color = '#581c87'; // text-purple-900
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'currentColor');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M4 4h4v4H4V4zm0 4h4v4H4V8zm4 0h4v4H8V8zm0-4h4v4H8V4zm4 4h4v4h-4V8zm0 4h4v4h-4v-4zm-4 0h4v4H8v-4z');
        svg.appendChild(path);
        iconDiv.appendChild(svg);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'counter-content';
        // Inline styles - EXACT match to React: flex flex-col items-start justify-start gap-1
        contentDiv.style.display = 'flex';
        contentDiv.style.flexDirection = 'column'; // flex-col
        contentDiv.style.alignItems = 'flex-start'; // items-start
        contentDiv.style.justifyContent = 'flex-start'; // justify-start
        contentDiv.style.gap = '4px'; // gap-1
        
        const label = document.createElement('span');
        label.className = 'pixel-text';
        label.textContent = 'ADVERTISERS';
        // Inline styles - EXACT match to React: pixel-text text-purple-900 fontSize: '8px'
        label.style.fontFamily = "'Press Start 2P', cursive";
        label.style.fontSize = '8px';
        label.style.color = '#581c87'; // text-purple-900
        label.style.webkitFontSmoothing = 'none';
        label.style.mozOsxFontSmoothing = 'unset';
        label.style.fontSmooth = 'never';
        label.style.textRendering = 'optimizeSpeed';
        label.style.imageRendering = 'pixelated';
        
        const number = document.createElement('span');
        number.className = 'pixel-text';
        number.id = 'competitorBadgeCount';
        number.textContent = '0';
        // Inline styles - EXACT match to React: pixel-text text-purple-900 fontSize: '40px', lineHeight: '1'
        number.style.fontFamily = "'Press Start 2P', cursive";
        number.style.fontSize = '40px';
        number.style.lineHeight = '1';
        number.style.color = '#581c87'; // text-purple-900
        number.style.webkitFontSmoothing = 'none';
        number.style.mozOsxFontSmoothing = 'unset';
        number.style.fontSmooth = 'never';
        number.style.textRendering = 'optimizeSpeed';
        number.style.imageRendering = 'pixelated';
        contentDiv.appendChild(label);
        contentDiv.appendChild(number);
        
        competitorBadge.appendChild(iconDiv);
        competitorBadge.appendChild(contentDiv);

        // Add hover effects for advertisers badge
        competitorBadge.addEventListener('mouseenter', () => {
            competitorBadge.style.boxShadow = '6px 6px 0px 0px rgba(200,200,200,1)';
        });
        competitorBadge.addEventListener('mouseleave', () => {
            competitorBadge.style.boxShadow = '3px 3px 0px 0px rgba(200,200,200,1)';
        });

        // Ads Button - EXACT match to React code
        const adsBadge = document.createElement('button');
        adsBadge.className = 'counter-badge';
        adsBadge.id = 'adsCounter';
        adsBadge.type = 'button';
        // Inline styles - EXACT match to React: bg-purple-200 rounded p-5 transition-all flex items-start gap-4 border-2 border-gray-300
        adsBadge.style.background = '#e9d5ff'; // bg-purple-200
        adsBadge.style.borderRadius = '6px'; // rounded
        adsBadge.style.padding = '20px'; // p-5
        adsBadge.style.transition = 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'; // transition-all
        adsBadge.style.display = 'flex';
        adsBadge.style.alignItems = 'flex-start'; // items-start
        adsBadge.style.gap = '16px'; // gap-4
        adsBadge.style.border = '2px solid #d1d5db'; // border-2 border-gray-300
        adsBadge.style.boxShadow = '3px 3px 0px 0px rgba(200,200,200,1)';
        adsBadge.style.width = '171px'; // EXACT from React
        adsBadge.style.cursor = 'pointer';
        adsBadge.style.margin = '0';
        adsBadge.style.outline = 'none';
        
        const iconDiv2 = document.createElement('div');
        iconDiv2.className = 'counter-icon';
        // Inline styles - EXACT match to React: bg-purple-100 rounded p-3 flex-shrink-0
        iconDiv2.style.background = '#f3e8ff'; // bg-purple-100
        iconDiv2.style.borderRadius = '6px'; // rounded
        iconDiv2.style.padding = '12px'; // p-3
        iconDiv2.style.flexShrink = '0';
        iconDiv2.style.display = 'flex';
        iconDiv2.style.alignItems = 'center';
        iconDiv2.style.justifyContent = 'center';
        iconDiv2.style.color = '#581c87'; // text-purple-900
        const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg2.setAttribute('width', '24');
        svg2.setAttribute('height', '24');
        svg2.setAttribute('viewBox', '0 0 24 24');
        svg2.setAttribute('fill', 'currentColor');
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('d', 'M8 4h8v4H8V4zm-4 4h4v4H4V8zm16 0h4v4h-4V8zm-8 4h8v4h-8v-4zm-4 4h4v4H4v-4zm16 0h4v4h-4v-4z');
        svg2.appendChild(path2);
        iconDiv2.appendChild(svg2);
        
        const contentDiv2 = document.createElement('div');
        contentDiv2.className = 'counter-content';
        // Inline styles - EXACT match to React: flex flex-col items-start justify-start gap-1
        contentDiv2.style.display = 'flex';
        contentDiv2.style.flexDirection = 'column'; // flex-col
        contentDiv2.style.alignItems = 'flex-start'; // items-start
        contentDiv2.style.justifyContent = 'flex-start'; // justify-start
        contentDiv2.style.gap = '4px'; // gap-1
        
        const label2 = document.createElement('span');
        label2.className = 'pixel-text';
        label2.textContent = 'ADS';
        // Inline styles - EXACT match to React: pixel-text text-purple-900 fontSize: '8px'
        label2.style.fontFamily = "'Press Start 2P', cursive";
        label2.style.fontSize = '8px';
        label2.style.color = '#581c87'; // text-purple-900
        label2.style.webkitFontSmoothing = 'none';
        label2.style.mozOsxFontSmoothing = 'unset';
        label2.style.fontSmooth = 'never';
        label2.style.textRendering = 'optimizeSpeed';
        label2.style.imageRendering = 'pixelated';
        
        const number2 = document.createElement('span');
        number2.className = 'pixel-text';
        number2.id = 'adsBadgeCount';
        number2.textContent = '0';
        // Inline styles - EXACT match to React: pixel-text text-purple-900 fontSize: '40px', lineHeight: '1'
        number2.style.fontFamily = "'Press Start 2P', cursive";
        number2.style.fontSize = '40px';
        number2.style.lineHeight = '1';
        number2.style.color = '#581c87'; // text-purple-900
        number2.style.webkitFontSmoothing = 'none';
        number2.style.mozOsxFontSmoothing = 'unset';
        number2.style.fontSmooth = 'never';
        number2.style.textRendering = 'optimizeSpeed';
        number2.style.imageRendering = 'pixelated';
        contentDiv2.appendChild(label2);
        contentDiv2.appendChild(number2);
        
        adsBadge.appendChild(iconDiv2);
        adsBadge.appendChild(contentDiv2);

        // Add hover effects for ads badge
        adsBadge.addEventListener('mouseenter', () => {
            adsBadge.style.boxShadow = '6px 6px 0px 0px rgba(200,200,200,1)';
        });
        adsBadge.addEventListener('mouseleave', () => {
            adsBadge.style.boxShadow = '3px 3px 0px 0px rgba(200,200,200,1)';
        });

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
        // EXACT match to React: flex gap-6
        counterWrapper.style.display = 'flex';
        counterWrapper.style.gap = '24px'; // gap-6
        counterWrapper.appendChild(competitorBadge);
        counterWrapper.appendChild(adsBadge);

        headerActions.appendChild(counterWrapper);
        headerActions.appendChild(clearButton);

        return headerActions;
    }

    // Initialize the form

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

     // Handle successful form submission

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

    // Handle form submission error

    handleFormError(error) {
        console.error('Form submission error:', error);
        this.uiManager.showToast('Failed to start analysis. Please try again.', 'error');
    }

    // Fetch data from API

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
     * Processes all items asynchronously with requestAnimationFrame batching
     */
    _batchProcessItems(items) {
        if (!items || items.length === 0) return;

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

    // Update UI (badges, visibility) - throttled to prevent rapid updates

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

     // Initialize clear data button

    initializeClearButton() {
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

     // Clear all data

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

     // Show full analysis modal

    showFullAnalysis(competitorName, fullAnalysis) {
        if (this.modal) {
            this.modal.showFullAnalysis(competitorName, fullAnalysis);
        }
    }

    // Destroy and clean up

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