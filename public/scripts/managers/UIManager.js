/**
 * UIManager
 * Handles all UI operations (toasts, modals, badges, etc.)
 */
class UIManager {
    constructor() {
        // UI element references
        this.headerActions = null;
        this.competitorBadgeCount = null;
        this.adsBadgeCount = null;
        this.loadingOverlay = null;
    }

    /**
     * Initialize UI element references
     */
    init() {
        this.headerActions = document.querySelector('.header-actions');
        this.competitorBadgeCount = document.getElementById('competitorBadgeCount');
        this.adsBadgeCount = document.getElementById('adsBadgeCount');
        this.createLoadingOverlay();
    }

    /**
     * Create loading overlay element
     */
    createLoadingOverlay() {
        // Find the main-content container
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            console.error('❌ .main-content container not found!');
            return;
        }

        // Check if loading overlay already exists in main-content
        let existingOverlay = mainContent.querySelector('#loadingOverlay');
        
        if (existingOverlay) {
            // Use the existing overlay
            this.loadingOverlay = existingOverlay;
            console.log('✅ Using existing loading overlay from main-content');
            
            // Make sure it has content
            if (!existingOverlay.querySelector('.loader-container')) {
                existingOverlay.innerHTML = `
                    <div class="loader-container">
                        <div class="neural-network">
                            <div class="node"></div>
                            <div class="node"></div>
                            <div class="node"></div>
                            <div class="node"></div>
                            <div class="node"></div>
                        </div>
                        <div class="dots"></div>
                        <div class="subtitle">Analyzing data</div>
                    </div>
                `;
                console.log('✅ Populated empty loading overlay with content');
            }
            
            // Remove the active class so it starts hidden
            this.loadingOverlay.classList.remove('active');
            return;
        }

        // Create new overlay if none exists
        if (this.loadingOverlay) return;

        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.id = 'loadingOverlay';
        this.loadingOverlay.innerHTML = `
            <div class="loader-container">
                <div class="neural-network">
                    <div class="node"></div>
                    <div class="node"></div>
                    <div class="node"></div>
                    <div class="node"></div>
                    <div class="node"></div>
                </div>
                <div class="dots"></div>
                <div class="subtitle">Analyzing data</div>
            </div>
        `;
        mainContent.appendChild(this.loadingOverlay);
        console.log('✅ Loading overlay created and appended to main-content');
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('active');
            console.log('🔄 Loading animation shown');
        } else {
            console.error('❌ Loading overlay not found!');
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('active');
            console.log('✅ Loading animation hidden');
        }
    }

showNotification(notification) {
    const { type, message } = notification;

    let notificationType = 'info';
    let title = '';
    let iconSvg = '';

    switch(type) {
        case 'analysis_started':
            notificationType = 'info';
            title = 'Analysis Started';
            iconSvg = this.getClockIcon();
            break;
        case 'text_analysis_starting':
            notificationType = 'info';
            title = 'Text Analysis Starting';
            iconSvg = this.getClockIcon();
            break;
        case 'text_analysis_complete':
            notificationType = 'success';
            title = 'Text Analysis Complete';
            iconSvg = this.getCheckIcon();
            break;
        case 'video_analysis_starting':
            notificationType = 'warning';
            title = 'Video Analysis Starting';
            iconSvg = this.getClockIcon();
            break;
        case 'video_analysis_complete':
            notificationType = 'success';
            title = 'Video Analysis Complete';
            iconSvg = this.getCheckIcon();
            break;
        case 'all_complete':
            notificationType = 'success';
            title = 'All Analysis Complete';
            iconSvg = this.getCheckIcon();
            break;
        case 'error':
        case 'n8n_error':
        case 'api_error':
        case 'ai_credits':
        case 'rate_limit':
        case 'timeout':
            notificationType = 'error';
            title = 'Error Occurred';
            iconSvg = this.getAlertIcon();
            break;
        default:
            notificationType = 'info';
            title = 'Notification';
            iconSvg = this.getInfoIcon();
    }

    this.showModernToast(title, message, notificationType, iconSvg);
}

    /**
     * Show modern toast notification
     */
    showModernToast(title, message, type = 'info', iconSvg = '') {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        
        toast.innerHTML = `
            <div class="notification-accent ${type}"></div>
            <div class="notification-icon ${type}">
                ${iconSvg}
            </div>
            <div class="notification-content">
                <p class="notification-title">${title}</p>
                <p class="notification-message">${message}</p>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        document.body.appendChild(toast);

        // Add close button functionality
        const closeBtn = toast.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideToast(toast);
        });

        // Show animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-hide after 15 seconds - but NOT for error notifications
        if (type !== 'error') {
            setTimeout(() => {
                this.hideToast(toast);
            }, 15000);
        }
    }

    /**
     * Hide and remove toast
     */
    hideToast(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Show error notification (separate method for ErrorService)
     */
    showErrorNotification(error) {
        console.log('🎯 UIManager.showErrorNotification called with:', error);
        
        if (!error) {
            console.error('❌ showErrorNotification called with null/undefined error');
            return;
        }
        
        const type = error.type || 'api_error';
        const message = error.message || 'An unknown error occurred';
        const title = 'Error Occurred';
        const iconSvg = this.getAlertIcon();
        
        console.log(`📨 Showing error toast: "${message}"`);
        this.showModernToast(title, message, 'error', iconSvg);
        console.log('✅ Error toast should now be visible');
    }

    /**
     * Show simple toast notification
     */
    showToast(message, type = 'success') {
        const notificationType = type === 'success' ? 'success' : 'error';
        const title = type === 'success' ? 'Success' : 'Error';
        const iconSvg = type === 'success' ? this.getCheckIcon() : this.getAlertIcon();
        
        this.showModernToast(title, message, notificationType, iconSvg);
    }

    /**
     * Get clock icon SVG
     */
    getClockIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
        `;
    }

    /**
     * Get check icon SVG
     */
    getCheckIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    }

    /**
     * Get alert/error icon SVG
     */
    getAlertIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
    }

    /**
     * Get info icon SVG
     */
    getInfoIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;
    }

    /**
     * Show confirmation dialog
     */
    showClearConfirmation() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = '100000';

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

            const cleanup = () => {
                overlay.remove();
                document.removeEventListener('keydown', handleEscape);
            };

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);

            document.getElementById('cancelClear').onclick = () => {
                cleanup();
                resolve(false);
            };

            document.getElementById('confirmClear').onclick = () => {
                cleanup();
                resolve(true);
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            };
        });
    }

    /**
     * Update clear button visibility
     */
    updateClearButtonVisibility(hasData) {
        if (!this.headerActions) return;

        if (hasData) {
            this.headerActions.style.display = 'flex';
        } else {
            this.headerActions.style.display = 'none';
        }
    }

    /**
     * Update counter badges
     */
    updateCounterBadges(competitorCount, adsCount) {
        if (this.competitorBadgeCount) {
            this.competitorBadgeCount.textContent = competitorCount || 0;
        }

        if (this.adsBadgeCount) {
            this.adsBadgeCount.textContent = adsCount || 0;
        }
    }

    /**
     * Set clear button state
     */
    setClearButtonState(isClearing) {
        const clearBtn = document.getElementById('clearDataBtn');
        if (!clearBtn) return;

        if (isClearing) {
            clearBtn.disabled = true;
            clearBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m9,12 2,2 4,-4"></path>
                </svg>
                Clearing...
            `;
        } else {
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

window.UIManager = UIManager;