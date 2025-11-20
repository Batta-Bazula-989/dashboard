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
            
            // Make sure it has content
            if (!existingOverlay.querySelector('.loader-container')) {
                const loaderContainer = document.createElement('div');
                loaderContainer.className = 'loader-container';
                
                const neuralNetwork = document.createElement('div');
                neuralNetwork.className = 'neural-network';
                for (let i = 0; i < 5; i++) {
                    const node = document.createElement('div');
                    node.className = 'node';
                    neuralNetwork.appendChild(node);
                }
                
                const dots = document.createElement('div');
                dots.className = 'dots';
                
                const subtitle = document.createElement('div');
                subtitle.className = 'subtitle';
                subtitle.textContent = 'Analyzing data';
                
                loaderContainer.appendChild(neuralNetwork);
                loaderContainer.appendChild(dots);
                loaderContainer.appendChild(subtitle);
                existingOverlay.appendChild(loaderContainer);
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
        
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'loader-container';
        
        const neuralNetwork = document.createElement('div');
        neuralNetwork.className = 'neural-network';
        for (let i = 0; i < 5; i++) {
            const node = document.createElement('div');
            node.className = 'node';
            neuralNetwork.appendChild(node);
        }
        
        const dots = document.createElement('div');
        dots.className = 'dots';
        
        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';
        subtitle.textContent = 'Analyzing data';
        
        loaderContainer.appendChild(neuralNetwork);
        loaderContainer.appendChild(dots);
        loaderContainer.appendChild(subtitle);
        this.loadingOverlay.appendChild(loaderContainer);
        mainContent.appendChild(this.loadingOverlay);
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('active');
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
        
        const accent = document.createElement('div');
        accent.className = `notification-accent ${type}`;
        
        const iconDiv = document.createElement('div');
        iconDiv.className = `notification-icon ${type}`;
        if (iconSvg) {
            // Parse SVG safely
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(iconSvg, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;
                if (svgElement && svgElement.tagName === 'svg') {
                    iconDiv.appendChild(svgElement);
                }
            } catch (e) {
                // If parsing fails, skip icon
            }
        }
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        const titleP = document.createElement('p');
        titleP.className = 'notification-title';
        titleP.textContent = Sanitizer.escapeHTML(title);
        const messageP = document.createElement('p');
        messageP.className = 'notification-message';
        messageP.textContent = Sanitizer.escapeHTML(message);
        content.appendChild(titleP);
        content.appendChild(messageP);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.setAttribute('aria-label', 'Close notification');
        const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        closeSvg.setAttribute('width', '14');
        closeSvg.setAttribute('height', '14');
        closeSvg.setAttribute('viewBox', '0 0 24 24');
        closeSvg.setAttribute('fill', 'none');
        closeSvg.setAttribute('stroke', 'currentColor');
        closeSvg.setAttribute('stroke-width', '2');
        closeSvg.setAttribute('stroke-linecap', 'round');
        closeSvg.setAttribute('stroke-linejoin', 'round');
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
        closeSvg.appendChild(line1);
        closeSvg.appendChild(line2);
        closeBtn.appendChild(closeSvg);
        
        toast.appendChild(accent);
        toast.appendChild(iconDiv);
        toast.appendChild(content);
        toast.appendChild(closeBtn);

        document.body.appendChild(toast);

        // Add close button functionality (closeBtn already created above)
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
     * Dismiss all error notifications
     */
    dismissAllErrorNotifications() {
        const errorToasts = document.querySelectorAll('.notification-toast .notification-accent.error');
        
        errorToasts.forEach(accent => {
            const toast = accent.closest('.notification-toast');
            if (toast) {
                this.hideToast(toast);
            }
        });
    }

    /**
     * Show error notification (separate method for ErrorService)
     */
    showErrorNotification(error) {
        if (!error) {
            console.error('❌ showErrorNotification called with null/undefined error');
            return;
        }
        
        const type = error.type || 'api_error';
        const message = error.message || 'An unknown error occurred';
        const title = 'Error Occurred';
        const iconSvg = this.getAlertIcon();
        
        this.showModernToast(title, message, 'error', iconSvg);
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

            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            
            const messageP = document.createElement('p');
            messageP.style.marginBottom = '20px';
            messageP.style.color = '#374151';
            messageP.style.lineHeight = '1.5';
            messageP.textContent = 'Are you sure you want to clear all data? This action cannot be undone.';
            
            const buttonDiv = document.createElement('div');
            buttonDiv.style.display = 'flex';
            buttonDiv.style.gap = '12px';
            buttonDiv.style.justifyContent = 'flex-end';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'cancelClear';
            cancelBtn.style.background = '#f8fafc';
            cancelBtn.style.border = '1px solid #d1d5db';
            cancelBtn.style.borderRadius = '6px';
            cancelBtn.style.padding = '8px 16px';
            cancelBtn.style.fontSize = '14px';
            cancelBtn.style.fontWeight = '600';
            cancelBtn.style.color = '#374151';
            cancelBtn.style.cursor = 'pointer';
            cancelBtn.style.transition = 'all 0.2s ease';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('mouseover', () => cancelBtn.style.background = '#f1f5f9');
            cancelBtn.addEventListener('mouseout', () => cancelBtn.style.background = '#f8fafc');
            
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirmClear';
            confirmBtn.style.background = '#ef4444';
            confirmBtn.style.border = '1px solid #dc2626';
            confirmBtn.style.borderRadius = '6px';
            confirmBtn.style.padding = '8px 16px';
            confirmBtn.style.fontSize = '14px';
            confirmBtn.style.fontWeight = '600';
            confirmBtn.style.color = 'white';
            confirmBtn.style.cursor = 'pointer';
            confirmBtn.style.transition = 'all 0.2s ease';
            confirmBtn.textContent = 'Clear All Data';
            confirmBtn.addEventListener('mouseover', () => confirmBtn.style.background = '#dc2626');
            confirmBtn.addEventListener('mouseout', () => confirmBtn.style.background = '#ef4444');
            
            buttonDiv.appendChild(cancelBtn);
            buttonDiv.appendChild(confirmBtn);
            modalBody.appendChild(messageP);
            modalBody.appendChild(buttonDiv);
            modal.appendChild(modalBody);

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

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };

            confirmBtn.onclick = () => {
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

        // Clear button content
        while (clearBtn.firstChild) {
            clearBtn.removeChild(clearBtn.firstChild);
        }
        
        if (isClearing) {
            clearBtn.disabled = true;
            const clearingSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            clearingSvg.setAttribute('width', '16');
            clearingSvg.setAttribute('height', '16');
            clearingSvg.setAttribute('viewBox', '0 0 24 24');
            clearingSvg.setAttribute('fill', 'none');
            clearingSvg.setAttribute('stroke', 'currentColor');
            clearingSvg.setAttribute('stroke-width', '2');
            clearingSvg.setAttribute('stroke-linecap', 'round');
            clearingSvg.setAttribute('stroke-linejoin', 'round');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '10');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'm9,12 2,2 4,-4');
            clearingSvg.appendChild(circle);
            clearingSvg.appendChild(path);
            clearBtn.appendChild(clearingSvg);
            clearBtn.appendChild(document.createTextNode(' Clearing...'));
        } else {
            clearBtn.disabled = false;
            const clearSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            clearSvg.setAttribute('width', '16');
            clearSvg.setAttribute('height', '16');
            clearSvg.setAttribute('viewBox', '0 0 24 24');
            clearSvg.setAttribute('fill', 'none');
            clearSvg.setAttribute('stroke', 'currentColor');
            clearSvg.setAttribute('stroke-width', '2');
            clearSvg.setAttribute('stroke-linecap', 'round');
            clearSvg.setAttribute('stroke-linejoin', 'round');
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', '3,6 5,6 21,6');
            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('d', 'm19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2');
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', '10');
            line1.setAttribute('y1', '11');
            line1.setAttribute('x2', '10');
            line1.setAttribute('y2', '17');
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', '14');
            line2.setAttribute('y1', '11');
            line2.setAttribute('x2', '14');
            line2.setAttribute('y2', '17');
            clearSvg.appendChild(polyline);
            clearSvg.appendChild(path2);
            clearSvg.appendChild(line1);
            clearSvg.appendChild(line2);
            clearBtn.appendChild(clearSvg);
            clearBtn.appendChild(document.createTextNode(' Clear All'));
        }
    }
}

window.UIManager = UIManager;