class DataDashboard {
constructor() {
    this.pollingInterval = null;
    this.pollingRate = 5000; // Poll every 5 seconds
    this.dataCount = 0;
    this.maxItems = 50;
    this.lastDataCount = 0;
    this.isFirstFetch = true; // Track first fetch to avoid duplicates on refresh
    this.isFetching = false; // Guard against race conditions

    // ✅ ADD THESE 2 LINES:
    this.notificationInterval = null;
    this.lastNotificationId = -1;

    // Component instances
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

           // Initialize clear data button
           this.initializeClearButton();

           // ✅ ADD THIS LINE:
           this.startNotificationPolling();

       } catch (error) {
           console.error('Failed to initialize dashboard:', error);
       }
   }

    /**
     * Load all required components
     */
    async loadComponents() {
        // Register components (they're already loaded via script tags)
        this.componentLoader.register('StatsCards', window.StatsCards);
        this.componentLoader.register('DataDisplay', window.DataDisplay);
        this.componentLoader.register('Modal', window.Modal);
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        const container = document.querySelector('.container');

        // Create form section
        const formSection = document.createElement('div');
        formSection.className = 'form-section';
        
        // Create main content area
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        
        container.appendChild(formSection);
        container.appendChild(mainContent);

        // Initialize FormBuilder in form section
        this.formBuilder = new FormBuilder();
        this.initializeForm(formSection);
        
        // Add counter badges and clear button container
        const headerActions = document.createElement('div');
        headerActions.className = 'header-actions';
        headerActions.style.display = 'none';
        
        // Counter badges
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
        
        // Clear button
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
        
        // Create wrapper for counter badges
        const counterWrapper = document.createElement('div');
        counterWrapper.className = 'counter-badges-wrapper';
        counterWrapper.appendChild(competitorBadge);
        counterWrapper.appendChild(adsBadge);
        
        headerActions.appendChild(counterWrapper);
        headerActions.appendChild(clearButton);
        container.appendChild(headerActions);

        // Initialize DataDisplay in main content area with modal callback
        this.dataDisplay = this.componentLoader.initComponent('DataDisplay', mainContent,
            (competitorName, fullAnalysis) => this.showFullAnalysis(competitorName, fullAnalysis)
        );

        // Initialize Modal
        this.modal = this.componentLoader.createComponent('Modal');
    }

    /**
     * Initialize the form in the form section
     * @param {HTMLElement} formSection - The form section container
     */
    initializeForm(formSection) {
        formSection.innerHTML = this.formBuilder.build();
        
        // Initialize form event listeners
        this.formBuilder.initEventListeners(
            formSection,
            (data) => this.handleFormSuccess(data),
            (error) => this.handleFormError(error)
        );
    }

    /**
     * Handle successful form submission
     * @param {Object} data - Form data
     */
    handleFormSuccess(data) {
        console.log('Form submitted successfully:', data);
        // Hide the form and show loading state
        const formContainer = document.getElementById('formContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
        
        // Show success message
        this.showSuccessMessage('Analysis started! Results will appear shortly.');
    }

    /**
     * Handle form submission error
     * @param {Error} error - Error object
     */
    handleFormError(error) {
        console.error('Form submission error:', error);
        this.showErrorMessage('Failed to start analysis. Please try again.');
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
   /**
    * Fetch data from API
    */
   async fetchData() {
       if (this.isFetching) return; // Guard against race conditions
       this.isFetching = true;

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

           if (result.success) {
               const dataArray = result.data || []; // Handle null/undefined

               console.log(`API returned ${dataArray.length} items`);
               console.log(`Last data count: ${this.lastDataCount}`);
               console.log(`Is first fetch: ${this.isFirstFetch}`);
               console.log(`Full API response:`, result);

               // On first fetch after page load/refresh, process ALL existing data
               if (this.isFirstFetch) {
                   console.log(`First fetch - processing all ${dataArray.length} items`);

                   // ✅ FIX: Only clear if there's data to add (preserves empty state)
                   if (dataArray.length > 0 && this.dataDisplay) {
                       this.dataDisplay.clear();
                   }

                   // Process all items
                   dataArray.forEach((item, index) => {
                       this.addDataItem(item);
                   });

                   this.lastDataCount = dataArray.length;
                   this.isFirstFetch = false; // Mark first fetch as complete
                   
                   // Update clear button visibility after first fetch
                   this.updateClearButtonVisibility();
                   
                   console.log(`=== FIRST FETCH COMPLETE ===`);
                   console.log(`Processed all ${dataArray.length} items`);
               }
               else if (dataArray.length > this.lastDataCount) {
                   // Process only NEW items to preserve existing cards
                   const newItems = dataArray.slice(this.lastDataCount);
                   console.log(`Found ${newItems.length} new items, processing only new items`);

                   // If we're going from 0 to having data, clear the empty state
                   if (this.lastDataCount === 0 && this.dataDisplay) {
                       console.log('🚨 FIXING EMPTY STATE: Clearing because lastDataCount is 0');
                       this.dataDisplay.clear();
                   }

                   newItems.forEach((item, index) => {
                       this.addDataItem(item);
                   });

                   this.lastDataCount = dataArray.length;
                   
                   // Update clear button visibility after adding new items
                   this.updateClearButtonVisibility();
                   
                   console.log(`=== NEW ITEMS PROCESSING COMPLETE ===`);
                   console.log(`Processed ${newItems.length} new items, total items: ${dataArray.length}`);
               }
               else if (dataArray.length < this.lastDataCount) {
                   // Data was cleared, reprocess everything
                   console.log(`Data count decreased from ${this.lastDataCount} to ${dataArray.length}, reprocessing all data`);

                   // Clear the display
                   if (this.dataDisplay) {
                       this.dataDisplay.clear();
                   }

                   // Process all items (if any)
                   dataArray.forEach((item, index) => {
                       this.addDataItem(item);
                   });

                   this.lastDataCount = dataArray.length;
                   
                   // Update clear button visibility
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
           this.isFetching = false; // Always release lock
       }
   }

    /**
     * Add data item to display
     * @param {Object} incoming - Incoming data
     */
    addDataItem(incoming) {
        const dataType = incoming.dataType || 'unknown';
        console.log(`Adding ${dataType} data item:`, incoming);

        // All competitor data (both text and video analysis) goes to main DataDisplay
        if (this.dataDisplay) {
            const stats = this.dataDisplay.addDataItem(incoming);
            console.log(`Analysis stats:`, stats);

            // Update data count
            this.dataCount++;

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
        // Check if there's any data to clear by looking at actual DOM cards
        const hasData = this.dataDisplay && this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;
        
        // If no data, don't do anything
        if (!hasData) {
            return;
        }
        
        // Show confirmation dialog only if there's data
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
                
                // Clear UI and show empty state
                if (this.dataDisplay) {
                    this.dataDisplay.clear(true);
                }
                
                // Reset counters
                this.dataCount = 0;
                this.lastDataCount = 0;
                this.isFirstFetch = true; // Reset first fetch flag
                
                // Update stats
                if (this.statsCards) {
                    this.statsCards.updateStats(0, 0);
                }
                
                // Hide clear button after clearing
                this.updateClearButtonVisibility();
                
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
         * Start polling for notifications
         */
        startNotificationPolling() {
            this.fetchNotifications();

            this.notificationInterval = setInterval(() => {
                this.fetchNotifications();
            }, 2000);

            console.log('Started notification polling');
        }

        /**
         * Fetch new notifications from server
         */
        async fetchNotifications() {
            try {
                const url = this.lastNotificationId >= 0
                    ? `/api/notifications?since=${this.lastNotificationId}`
                    : '/api/notifications';

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

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

        /**
         * Show notification based on type
         */
        showNotification(notification) {
            const { type, message } = notification;

            let icon = '';
            let color = '';
            let bgColor = '';

            switch(type) {
                case 'analysis_started':
                    icon = '🚀';
                    color = '#3b82f6';
                    bgColor = '#eff6ff';
                    break;
                case 'text_analysis_starting':
                    icon = '📝';
                    color = '#8b5cf6';
                    bgColor = '#f5f3ff';
                    break;
                case 'text_analysis_complete':
                    icon = '✅';
                    color = '#10b981';
                    bgColor = '#f0fdf4';
                    break;
                case 'video_analysis_starting':
                    icon = '🎥';
                    color = '#f59e0b';
                    bgColor = '#fffbeb';
                    break;
                case 'video_analysis_complete':
                    icon = '✅';
                    color = '#10b981';
                    bgColor = '#f0fdf4';
                    break;
                case 'all_complete':
                    icon = '🎉';
                    color = '#10b981';
                    bgColor = '#f0fdf4';
                    break;
                case 'error':
                    icon = '❌';
                    color = '#ef4444';
                    bgColor = '#fef2f2';
                    break;
                default:
                    icon = 'ℹ️';
                    color = '#6b7280';
                    bgColor = '#f9fafb';
            }

            this.showProgressToast(message, icon, color, bgColor);
        }

        /**
         * Show progress toast notification
         */
showProgressToast(message, icon, color, bgColor) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 100001;
        background: ${bgColor};
        color: #374151;
        padding: 14px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid ${color};
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 350px;
        min-width: 280px;
        display: flex;
        align-items: center;
        gap: 12px;
    `;

    toast.innerHTML = `
        <span style="font-size: 22px; line-height: 1;">${icon}</span>
        <span style="flex: 1; line-height: 1.4;">${message}</span>
        <button style="
            background: none;
            border: none;
            color: #9ca3af;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            margin: 0;
            line-height: 1;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s ease;
        "
        onmouseover="this.style.color='#374151'"
        onmouseout="this.style.color='#9ca3af'"
        onclick="this.closest('div').style.transform='translateX(400px)'; setTimeout(() => this.closest('div').remove(), 300);">
            ✕
        </button>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 15 seconds (changed from 4 to 15)
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 15000); // ✅ Changed from 4000 to 15000 (15 seconds)
}
    
    /**
     * Update clear button visibility based on data presence
     */
    updateClearButtonVisibility() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;
        
        // Check if there are any cards displayed
        const hasData = this.dataDisplay && this.dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;
        
        if (hasData) {
            headerActions.style.display = 'flex';
            
            // Update counter values
            this.updateCounterBadges();
        } else {
            headerActions.style.display = 'none';
        }
    }
    
    /**
     * Update counter badge values
     */
    updateCounterBadges() {
        if (!this.dataDisplay) return;
        
        const stats = this.dataDisplay.getStats();
        
        const competitorBadgeCount = document.getElementById('competitorBadgeCount');
        const adsBadgeCount = document.getElementById('adsBadgeCount');
        
        if (competitorBadgeCount) {
            competitorBadgeCount.textContent = stats.competitorCards || 0;
        }
        
        if (adsBadgeCount) {
            adsBadgeCount.textContent = stats.adsCount || 0;
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
            
            // Cleanup function
            const cleanup = () => {
                overlay.remove();
                document.removeEventListener('keydown', handleEscape);
            };
            
            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            // Handle button clicks
            document.getElementById('cancelClear').onclick = () => {
                cleanup();
                resolve(false);
            };
            
            document.getElementById('confirmClear').onclick = () => {
                cleanup();
                resolve(true);
            };
            
            // Handle overlay click to close
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            };
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

           // ✅ ADD THESE 4 LINES:
           if (this.notificationInterval) {
               clearInterval(this.notificationInterval);
               this.notificationInterval = null;
           }

           if (this.modal && this.modal.isOpen()) {
               this.modal.closeModal();
           }

           // Clear component references
           this.statsCards = null;
           this.dataDisplay = null;
           this.modal = null;
       }
}

// At top of file, outside DOMContentLoaded
let dashboardInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Destroy old instance first
        if (dashboardInstance) {
            dashboardInstance.destroy();
        }
        dashboardInstance = new DataDashboard();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
});

// Clean up when page closes
window.addEventListener('beforeunload', () => {
    if (dashboardInstance) {
        dashboardInstance.destroy();
    }
});