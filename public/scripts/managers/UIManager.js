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
        // Check if one already exists in the DOM (manually added)
        let existingOverlay = document.getElementById('loadingOverlay');
        
        if (existingOverlay) {
            // Remove any manually added empty overlay
            existingOverlay.remove();
            console.log('Removed existing empty loading overlay');
        }

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
        document.body.appendChild(this.loadingOverlay);
        console.log('✅ Loading overlay created successfully');
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

    /**
     * Show notification toast
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

        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 15000);
    }

    /**
     * Show simple toast notification
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

        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

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