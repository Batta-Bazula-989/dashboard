/**
 * Main Dashboard Application - HTTP Polling Version
 * Uses HTTP polling instead of WebSocket for Vercel compatibility
 */
class DataDashboard {
    constructor() {
        this.pollingInterval = null;
        this.pollingRate = 2000; // Poll every 2 seconds
        this.dataCount = 0;
        this.maxItems = 50;
        this.lastDataCount = 0;

        // Component instances
        this.statusBar = null;
        this.statsCards = null;
        this.dataDisplay = null;
        this.modal = null;

        // Component loader
        this.componentLoader = new ComponentLoader();

        this.init();
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        try {
            // Load all components
            await this.loadComponents();

            // Initialize components
            this.initializeComponents();

            // Start polling
            this.startPolling();
            this.updateConnectionStatus('connected', 'Connected (HTTP Polling)');

        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
        }
    }

    /**
     * Load all required components
     */
    async loadComponents() {
        // Register components (they're already loaded via script tags)
        this.componentLoader.register('StatusBar', window.StatusBar);
        this.componentLoader.register('StatsCards', window.StatsCards);
        this.componentLoader.register('DataDisplay', window.DataDisplay);
        this.componentLoader.register('Modal', window.Modal);
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        const container = document.querySelector('.container');

        // Initialize StatusBar
        this.statusBar = this.componentLoader.initComponent('StatusBar', container);

        // Initialize StatsCards
        this.statsCards = this.componentLoader.initComponent('StatsCards', container);

        // Initialize DataDisplay with modal callback
        this.dataDisplay = this.componentLoader.initComponent('DataDisplay', container,
            (competitorName, fullAnalysis) => this.showFullAnalysis(competitorName, fullAnalysis)
        );

        // Initialize Modal
        this.modal = this.componentLoader.createComponent('Modal');
    }

    /**
     * Start HTTP polling
     */
    startPolling() {
        // Initial fetch
        this.fetchData();

        // Set up polling interval
        this.pollingInterval = setInterval(() => {
            this.fetchData();
        }, this.pollingRate);

        console.log(`Started polling at ${this.pollingRate}ms interval`);
    }

    /**
     * Fetch data from API
     */
    async fetchData() {
        try {
            const response = await fetch('/api/data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                console.log(`=== API RESPONSE ===`);
                console.log(`API returned ${result.data.length} items`);
                console.log(`Last data count: ${this.lastDataCount}`);
                console.log(`Full API response:`, result);
                
                // Always clear and reprocess all data to handle serverless function resets
                if (result.data.length !== this.lastDataCount) {
                    console.log(`Data count changed from ${this.lastDataCount} to ${result.data.length}, reprocessing all data`);
                    
                    // Clear the display
                    if (this.dataDisplay) {
                        this.dataDisplay.clear();
                    }
                    
                    // Process all items
                    result.data.forEach((item, index) => {
                        console.log(`=== PROCESSING ITEM ${index + 1}/${result.data.length} ===`);
                        console.log(`Item data:`, item);
                        this.addDataItem(item);
                    });
                    
                    this.lastDataCount = result.data.length;
                    console.log(`=== PROCESSING COMPLETE ===`);
                    console.log(`Processed all ${result.data.length} items`);
                } else {
                    console.log(`Data count unchanged (${result.data.length}), no reprocessing needed`);
                }

                this.updateConnectionStatus('connected', 'Connected (HTTP Polling)');
                this.updateWsStatus('Active');
            } else {
                console.log(`API response not successful or no data:`, result);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            this.updateConnectionStatus('disconnected', 'Connection Error');
            this.updateWsStatus('Error');
        }
    }

    /**
     * Update connection status
     * @param {string} status - Connection status
     * @param {string} text - Status text
     */
    updateConnectionStatus(status, text) {
        if (this.statusBar) {
            this.statusBar.updateConnectionStatus(status, text);
        }
    }

    /**
     * Update WebSocket status (now polling status)
     * @param {string} status - Status
     */
    updateWsStatus(status) {
        if (this.statusBar) {
            this.statusBar.updateWsStatus(status);
        }
    }

    /**
     * Add data item to display
     * @param {Object} incoming - Incoming data
     */
    addDataItem(incoming) {
        if (this.dataDisplay) {
            const stats = this.dataDisplay.addDataItem(incoming);

            // Update stats cards
            if (this.statsCards && stats) {
                this.statsCards.updateStats(stats.competitorCards, stats.adsCount);
            }
        }
    }

    /**
     * Clear all data and reprocess from API
     */
    async clearAndReprocess() {
        if (this.dataDisplay) {
            this.dataDisplay.clear();
        }
        this.lastDataCount = 0;
        await this.fetchData();
    }

    /**
     * Show full analysis modal
     * @param {string} competitorName - Competitor name
     * @param {string} fullAnalysis - Full analysis text
     */
    showFullAnalysis(competitorName, fullAnalysis) {
        if (this.modal) {
            this.modal.showFullAnalysis(competitorName, fullAnalysis);
        }
    }

    /**
     * Get component instance
     * @param {string} componentName - Name of the component
     * @returns {Object|null} Component instance or null
     */
    getComponent(componentName) {
        switch (componentName) {
            case 'statusBar':
                return this.statusBar;
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

    /**
     * Destroy the dashboard and clean up resources
     */
    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.modal && this.modal.isOpen()) {
            this.modal.closeModal();
        }

        // Clear component references
        this.statusBar = null;
        this.statsCards = null;
        this.dataDisplay = null;
        this.modal = null;
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize dashboard (components are already loaded via script tags)
        new DataDashboard();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
});