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

            // Initialize clear data button
            this.initializeClearButton();

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

        // Initialize StatusBar first (full width at top)
        this.statusBar = this.componentLoader.initComponent('StatusBar', container);

        // Create dashboard layout structure
        const dashboardContent = document.createElement('div');
        dashboardContent.className = 'dashboard-content';
        
        const dashboardLeft = document.createElement('div');
        dashboardLeft.className = 'dashboard-left';
        
        const dashboardRight = document.createElement('div');
        dashboardRight.className = 'dashboard-right';
        
        dashboardContent.appendChild(dashboardLeft);
        dashboardContent.appendChild(dashboardRight);
        container.appendChild(dashboardContent);

        // Initialize StatsCards in left panel (above main data)
        this.statsCards = this.componentLoader.initComponent('StatsCards', dashboardLeft);

        // Initialize DataDisplay in right panel with modal callback
        this.dataDisplay = this.componentLoader.initComponent('DataDisplay', dashboardRight,
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
            } else {
                console.log(`API response not successful or no data:`, result);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            this.updateConnectionStatus('disconnected', 'Connection Error');
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
     * Initialize clear data button
     */
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

    /**
     * Clear all data from server and UI
     */
    async clearAllData() {
        // Show confirmation dialog
        const confirmed = await this.showClearConfirmation();
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

            // Clear data on server
            const response = await fetch('/api/data', {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('Data cleared from server');
                
                // Clear UI
                if (this.dataDisplay) {
                    this.dataDisplay.clear();
                }
                
                // Reset counters
                this.dataCount = 0;
                this.lastDataCount = 0;
                
                // Update stats
                if (this.statsCards) {
                    this.statsCards.updateStats(0, 0);
                }
                
                console.log('All data cleared successfully');
                
                // Show success message
                this.showSuccessMessage('All data cleared successfully');
            } else {
                console.error('Failed to clear data from server');
                this.showErrorMessage('Failed to clear data from server');
            }

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

    /**
     * Show confirmation dialog for clearing data
     * @returns {Promise<boolean>} True if user confirms
     */
    showClearConfirmation() {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = '100000';
            
            // Create modal content
            const modal = document.createElement('div');
            modal.className = 'modal-content';
            modal.style.maxWidth = '400px';
            modal.style.width = '90%';
            
            modal.innerHTML = `
                <div class="modal-header">
                    <div class="modal-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Confirm Clear Data
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        ×
                    </button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; color: #374151; line-height: 1.5;">
                        Are you sure you want to clear all data? This action cannot be undone.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancelClear" style="
                            background: #f8fafc;
                            border: 1px solid #d1d5db;
                            border-radius: 6px;
                            padding: 8px 16px;
                            font-size: 14px;
                            font-weight: 600;
                            color: #374151;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                            Cancel
                        </button>
                        <button id="confirmClear" style="
                            background: #ef4444;
                            border: 1px solid #dc2626;
                            border-radius: 6px;
                            padding: 8px 16px;
                            font-size: 14px;
                            font-weight: 600;
                            color: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                            Clear All Data
                        </button>
                    </div>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Handle button clicks
            document.getElementById('cancelClear').onclick = () => {
                overlay.remove();
                resolve(false);
            };
            
            document.getElementById('confirmClear').onclick = () => {
                overlay.remove();
                resolve(true);
            };
            
            // Handle overlay click to close
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve(false);
                }
            };
            
            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    overlay.remove();
                    document.removeEventListener('keydown', handleEscape);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Type of message (success, error)
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 100001;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${type === 'success' 
                        ? '<path d="m9,12 2,2 4,-4"></path><circle cx="12" cy="12" r="10"></circle>'
                        : '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
                    }
                </svg>
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
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