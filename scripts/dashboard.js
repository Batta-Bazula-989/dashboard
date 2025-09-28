/**
 * Main Dashboard Application
 * Uses component-based architecture for better organization
 */
class DataDashboard {
    constructor() {
        this.ws = null;
        this.dataCount = 0;
        this.maxItems = 50; // Keep only last 50 items
        
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
            
            // Start WebSocket connection
            this.connectWebSocket();
            this.updateConnectionStatus('connecting', 'Connecting...');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
        }
    }

    /**
     * Load all required components
     */
    async loadComponents() {
        const componentNames = ['StatusBar', 'StatsCards', 'DataDisplay', 'Modal'];
        
        // Load component scripts
        await this.componentLoader.loadComponents(componentNames);
        
        // Register components
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
     * Connect to WebSocket
     */
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.updateConnectionStatus('connected', 'Connected');
            this.updateWsStatus('Connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.addDataItem(data);
            } catch (error) {
                console.error('Error parsing data:', error);
                this.addDataItem({ error: 'Invalid JSON received', raw: event.data });
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus('disconnected', 'Disconnected');
            this.updateWsStatus('Disconnected');

            // Attempt to reconnect after 3 seconds
            setTimeout(() => {
                this.connectWebSocket();
            }, 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('disconnected', 'Connection Error');
            this.updateWsStatus('Error');
        };
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
     * Update WebSocket status
     * @param {string} status - WebSocket status
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
        if (this.ws) {
            this.ws.close();
            this.ws = null;
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

// Load ComponentLoader first
const loadComponentLoader = () => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'components/ComponentLoader.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load ComponentLoader'));
        document.head.appendChild(script);
    });
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load ComponentLoader first
        await loadComponentLoader();
        
        // Initialize dashboard
        new DataDashboard();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
});