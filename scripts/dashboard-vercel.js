/**
 * Main Dashboard Application for Vercel (Polling-based)
 * Uses component-based architecture with API polling instead of WebSocket
 */
class DataDashboard {
    constructor() {
        this.dataCount = 0;
        this.maxItems = 50; // Keep only last 50 items
        this.pollingInterval = null;
        this.lastDataTimestamp = null;
        
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
            
            // Start API polling
            this.startPolling();
            this.updateConnectionStatus('connecting', 'Connecting...');
            
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
     * Start API polling for new data
     */
    startPolling() {
        console.log('🔄 Starting API polling...');
        
        // Initial data fetch
        this.fetchData();
        
        // Set up polling interval (every 2 seconds)
        this.pollingInterval = setInterval(() => {
            this.fetchData();
        }, 2000);
        
        this.updateConnectionStatus('connected', 'Connected (Polling)');
        this.updateWsStatus('Polling');
    }

    /**
     * Fetch data from API
     */
    async fetchData() {
        try {
            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data && result.data.length > 0) {
                // Check if we have new data
                const latestData = result.data[result.data.length - 1];
                if (!this.lastDataTimestamp || latestData.timestamp > this.lastDataTimestamp) {
                    this.lastDataTimestamp = latestData.timestamp;
                    this.addDataItem(latestData);
                }
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
     * Update WebSocket status (shows polling status)
     * @param {string} status - Status text
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
