/**
 * UIManager - Handles all UI operations
 */
class UIManager {
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
     * Update clear button visibility
     */
    updateClearButtonVisibility(dataDisplay) {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const hasData = dataDisplay && dataDisplay.dataDisplay.querySelectorAll('.card').length > 0;

        if (hasData) {
            headerActions.style.display = 'flex';
            this.updateCounterBadges(dataDisplay);
        } else {
            headerActions.style.display = 'none';
        }
    }

    /**
     * Update counter badges
     */
    updateCounterBadges(dataDisplay) {
        if (!dataDisplay) return;

        const stats = dataDisplay.getStats();

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
     * Show toast notification
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
}

window.UIManager = UIManager;