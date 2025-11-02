class DataDashboard {
    constructor() {
        this.pollingInterval = null;
        this.pollingRate = 5000;
        this.dataCount = 0;
        this.maxItems = 50;
        this.lastDataCount = 0;
        this.isFirstFetch = true;
        this.isFetching = false;

        this.notificationInterval = null;
        this.lastNotificationId = -1;

        // Component instances
        this.statsCards = null;
        this.dataDisplay = null;
        this.modal = null;

        // Component loader
        this.componentLoader = new ComponentLoader();

        // Initialize services
        this.dataService = new DataService();
        this.notificationService = new NotificationService();
        this.uiManager = new UIManager();

        this.init();
    }

    async init() {
        try {
            await this.loadComponents();
            this.initializeComponents();
            this.startPolling();
            this.initializeClearButton();
            this.startNotificationPolling();
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
        container.appendChild(headerActions);

        this.dataDisplay = this.componentLoader.initComponent('DataDisplay', mainContent,
            (competitorName, fullAnalysis) => this.showFullAnalysis(competitorName, fullAnalysis)
        );

        this.modal = this.componentLoader.createComponent('Modal');
    }

    initializeForm(formSection) {
        formSection.innerHTML = this.formBuilder.build();

        this.formBuilder.initEventListeners(
            formSection,
            (data) => this.handleFormSuccess(data),
            (error) => this.handleFormError(error)
        );
    }

    handleFormSuccess(data) {
        console.log('Form submitted successfully:', data);
        const formContainer = document.getElementById('formContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
        }

        this.showSuccessMessage('Analysis started! Results will appear shortly.');
    }

    handleFormError(error) {
        console.error('Form submission error:', error);
        this.showErrorMessage('Failed to start analysis. Please try again.');
    }

    startPolling() {
        this.fetchData();

        this.pollingInterval = setInterval(() => {
            this.fetchData();
        }, this.pollingRate);

        console.log(`Started polling at ${this.pollingRate}ms interval`);
    }

    async fetchData() {
        if (this.isFetching) return;
        this.isFetching = true;

        try {
            const result = await this.dataService.fetchData();

            if (result.success) {
                const dataArray = result.data || [];

                console.log(`API returned ${dataArray.length} items`);
                console.log(`Last data count: ${this.lastDataCount}`);
                console.log(`Is first fetch: ${this.isFirstFetch}`);
                console.log(`Full API response:`, result);

                if (this.isFirstFetch) {
                    console.log(`First fetch - processing all ${dataArray.length} items`);

                    if (dataArray.length > 0 && this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    dataArray.forEach((item, index) => {
                        this.addDataItem(item);
                    });

                    this.lastDataCount = dataArray.length;
                    this.isFirstFetch = false;

                    this.updateClearButtonVisibility();

                    console.log(`=== FIRST FETCH COMPLETE ===`);
                    console.log(`Processed all ${dataArray.length} items`);
                }
                else if (dataArray.length > this.lastDataCount) {
                    const newItems = dataArray.slice(this.lastDataCount);
                    console.log(`Found ${newItems.length} new items, processing only new items`);

                    if (this.lastDataCount === 0 && this.dataDisplay) {
                        console.log('🚨 FIXING EMPTY STATE: Clearing because lastDataCount is 0');
                        this.dataDisplay.clear();
                    }

                    newItems.forEach((item, index) => {
                        this.addDataItem(item);
                    });

                    this.lastDataCount = dataArray.length;

                    this.updateClearButtonVisibility();

                    console.log(`=== NEW ITEMS PROCESSING COMPLETE ===`);
                    console.log(`Processed ${newItems.length} new items, total items: ${dataArray.length}`);
                }
                else if (dataArray.length < this.lastDataCount) {
                    console.log(`Data count decreased from ${this.lastDataCount} to ${dataArray.length}, reprocessing all data`);

                    if (this.dataDisplay) {
                        this.dataDisplay.clear();
                    }

                    dataArray.forEach((item, index) => {
                        this.addDataItem(item);
                    });

                    this.lastDataCount = dataArray.length;

                    this.updateClearButtonVisibility();

                    console.log(`=== REPROCESSING COMPLETE ===`);
                    console.log(`Reprocessed all ${dataArray.length} items`);
                }
                else {
                    console.log(`Data count unchanged (${dataArray.length}), no processing needed`);
                }
            } else {
                console.log(`API response not successful or no data:`, result);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            this.isFetching = false;
        }
    }

    addDataItem(incoming) {
        const dataType = incoming.dataType || 'unknown';
        console.log(`Adding ${dataType} data item:`, incoming);

        if (this.dataDisplay) {
            const stats = this.dataDisplay.addDataItem(incoming);
            console.log(`Analysis stats:`, stats);

            this.dataCount++;

            if (this.statsCards && stats) {
                this.statsCards.updateStats(stats.competitorCards, stats.adsCount);
            }
        }
    }

    async clearAndReprocess() {
        if (this.dataDisplay) {
            this.dataDisplay.clear();
        }
        this.lastDataCount = 0;
        await this.fetchData();
    }

    showFullAnalysis(competitorName, fullAnalysis) {
        if (this.modal) {
            this.modal.showFullAnalysis(competitorName, fullAnalysis);
        }
    }

    getComponent(componentName) {
        switch (componentName) {
            case 'statsCards':
                return this.statsCards;
            case 'dataDisplay':
                return this.dataDisplay;
            case 'modal':
                return this.modal;
            default:
                return null;
        }
    }

    initializeClearButton() {
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });

            console.log('✅ Clear data button initialized and found!');
            console.log('Button element:', clearBtn);
            console.log('Button position:', clearBtn.getBoundingClientRect());
        } else {
            console.error('❌ Clear data button not found!');
            console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
    }

    async clearAllData() {
        const hasData = this.dataDisplay && this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;

        if (!hasData) {
            return;
        }

        const confirmed = await this.uiManager.showClearConfirmation();
        if (!confirmed) {
            return;
        }

        try {
            const clearBtn = document.getElementById('clearDataBtn');
            if (clearBtn) {
                clearBtn.disabled = true;
                clearBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9,12 2,2 4,-4"></path>
                    </svg>
                    Clearing...
                `;
            }

            await this.dataService.clearData();

            console.log('Data cleared from server');

            if (this.dataDisplay) {
                this.dataDisplay.clear(true);
            }

            this.dataCount = 0;
            this.lastDataCount = 0;
            this.isFirstFetch = true;

            if (this.statsCards) {
                this.statsCards.updateStats(0, 0);
            }

            this.updateClearButtonVisibility();

            console.log('All data cleared successfully');

            this.showSuccessMessage('All data cleared successfully');
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showErrorMessage('Error clearing data');
        } finally {
            const clearBtn = document.getElementById('clearDataBtn');
            if (clearBtn) {
                clearBtn.disabled = false;
                clearBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Clear All
                `;
            }
        }
    }

    startNotificationPolling() {
        this.fetchNotifications();

        this.notificationInterval = setInterval(() => {
            this.fetchNotifications();
        }, 2000);

        console.log('Started notification polling');
    }

    async fetchNotifications() {
        try {
            const result = await this.notificationService.fetchNotifications(this.lastNotificationId);

            if (result.success && result.notifications && result.notifications.length > 0) {
                console.log(`Received ${result.notifications.length} new notifications`);

                result.notifications.forEach(notification => {
                    this.showNotification(notification);
                });

                if (result.latestId !== undefined) {
                    this.lastNotificationId = result.latestId;
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    showNotification(notification) {
        this.uiManager.showNotification(notification);
    }

    updateClearButtonVisibility() {
        this.uiManager.updateClearButtonVisibility(this.dataDisplay);
    }

    updateCounterBadges() {
        this.uiManager.updateCounterBadges(this.dataDisplay);
    }

    showSuccessMessage(message) {
        this.uiManager.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.uiManager.showToast(message, 'error');
    }

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }

        if (this.modal && this.modal.isOpen()) {
            this.modal.closeModal();
        }

        this.statsCards = null;
        this.dataDisplay = null;
        this.modal = null;
    }
}

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