class UIManager {
    constructor() {
        this.headerActions = null;
        this.competitorBadgeCount = null;
        this.adsBadgeCount = null;
        this.loadingOverlay = null;
        this.lastNotificationMessage = null;
    }

    init() {
        this.headerActions = document.querySelector('.header-actions');
        this.competitorBadgeCount = document.getElementById('competitorBadgeCount');
        this.adsBadgeCount = document.getElementById('adsBadgeCount');
        
        // Log if elements are not found for debugging
        if (!this.headerActions) {
            console.warn('Header actions element not found');
        }
        if (!this.competitorBadgeCount) {
            console.warn('Competitor badge count element not found');
        }
        if (!this.adsBadgeCount) {
            console.warn('Ads badge count element not found');
        }
        
        this.createLoadingOverlay();
    }

     // Create loading overlay element

    createLoadingOverlay() {
        // Find the main-content container
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            console.error('.main-content container not found');
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
                
                for (let i = 0; i < 8; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    loaderContainer.appendChild(dot);
                }
                
                const loadingText = document.createElement('div');
                loadingText.className = 'loading-text';
                loadingText.textContent = 'Fetching ads';
                
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-fill';
                progressBar.appendChild(progressFill);
                
                existingOverlay.appendChild(loaderContainer);
                existingOverlay.appendChild(loadingText);
                existingOverlay.appendChild(progressBar);
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
        
        for (let i = 0; i < 8; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            loaderContainer.appendChild(dot);
        }
        
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Fetching ads';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);
        
        this.loadingOverlay.appendChild(loaderContainer);
        this.loadingOverlay.appendChild(loadingText);
        this.loadingOverlay.appendChild(progressBar);
        mainContent.appendChild(this.loadingOverlay);
    }

     // Show loading state

    showLoading(message = null) {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('active');
            
            // Use provided message, or fall back to last notification message, or default
            const displayMessage = message || this.lastNotificationMessage || 'Fetching ads';
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = displayMessage;
            }
        } else {
            console.error('Loading overlay not found');
        }
    }

     // Hide loading state

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

    // Check if message indicates completion (handles backend sending wrong types)
    const messageLower = (message || '').toLowerCase();
    const isCompletionMessage = messageLower.includes('finished') || 
                                messageLower.includes('complete') || 
                                messageLower.includes('done');

    switch(type) {
        case 'analysis_started':
            // If message says "finished/complete", treat as completion notification
            if (isCompletionMessage) {
                if (messageLower.includes('text') || messageLower.includes('textual')) {
                    notificationType = 'success';
                    title = 'Text Analysis Complete';
                    iconSvg = this.getCheckIcon();
                } else if (messageLower.includes('video') || messageLower.includes('visual')) {
                    notificationType = 'success';
                    title = 'Video Analysis Complete';
                    iconSvg = this.getCheckIcon();
                } else if (messageLower.includes('carousel')) {
                    notificationType = 'success';
                    title = 'Carousel Analysis Complete';
                    iconSvg = this.getCheckIcon();
                } else if (messageLower.includes('all')) {
                    notificationType = 'success';
                    title = 'All Analysis Complete';
                    iconSvg = this.getCheckIcon();
                } else {
                    // Generic completion
                    notificationType = 'success';
                    title = 'Analysis Complete';
                    iconSvg = this.getCheckIcon();
                }
            } else {
                // Actual analysis starting
                notificationType = 'info';
                title = 'Analysis Started';
                iconSvg = this.getClockIcon();
            }
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

    // Use message as title if available, otherwise use the inferred title
    // This ensures toast matches the loading overlay message
    const toastTitle = message && message.trim() ? message : title;
    
    this.showModernToast(toastTitle, null, notificationType, iconSvg);
    
    // Store the notification message for use in loading overlay
    if (message) {
        this.lastNotificationMessage = message;
        
        // Update loading overlay message if it's already visible
        if (this.loadingOverlay && this.loadingOverlay.classList.contains('active')) {
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
        }
    }
}

     // Show modern toast notification

    showModernToast(title, message, type = 'info', iconSvg = '') {
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${type}`;
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        const titleP = document.createElement('p');
        titleP.className = 'notification-title';
        titleP.textContent = Sanitizer.escapeHTML(title);
        content.appendChild(titleP);
        
        // Don't show message - we're using message as title to match loading overlay
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.setAttribute('aria-label', 'Close notification');
        const closeSvg = SvgHelper.create({
            width: 14,
            height: 14,
            children: [
                SvgHelper.line('18', '6', '6', '18'),
                SvgHelper.line('6', '6', '18', '18')
            ]
        });
        closeBtn.appendChild(closeSvg);
        
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

     // Hide and remove toast

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

     // Dismiss all error notifications

    dismissAllErrorNotifications() {
        const errorToasts = document.querySelectorAll('.notification-toast.notification-error');
        
        errorToasts.forEach(toast => {
            this.hideToast(toast);
        });
    }

     // Show error notification (separate method for ErrorService)

    showErrorNotification(error) {
        if (!error) {
            console.error('showErrorNotification called with null/undefined error');
            return;
        }
        
        const type = error.type || 'api_error';
        const message = error.message || 'An unknown error occurred';
        const title = 'Error Occurred';
        const iconSvg = this.getAlertIcon();
        
        this.showModernToast(title, message, 'error', iconSvg);
    }

     // Show simple toast notification

    showToast(message, type = 'success') {
        const notificationType = type === 'success' ? 'success' : 'error';
        const title = type === 'success' ? 'Success' : 'Error';
        const iconSvg = type === 'success' ? this.getCheckIcon() : this.getAlertIcon();
        
        this.showModernToast(title, message, notificationType, iconSvg);
    }

     // Get clock icon SVG

    getClockIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
        `;
    }

     // Get check icon SVG

    getCheckIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    }

     // Get alert/error icon SVG

    getAlertIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
    }

     // Get info icon SVG

    getInfoIcon() {
        return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;
    }

     // Show confirmation dialog

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

            let isCleanedUp = false;
            const cleanup = () => {
                if (isCleanedUp) return;
                isCleanedUp = true;

                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
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

     // Update clear button visibility

    updateClearButtonVisibility(hasData) {
        // Try to find headerActions if not already set
        if (!this.headerActions) {
            this.headerActions = document.querySelector('.header-actions');
        }
        
        if (!this.headerActions) {
            console.warn('Cannot update header actions visibility: element not found');
            return;
        }

        if (hasData) {
            this.headerActions.style.display = 'flex';
        } else {
            this.headerActions.style.display = 'none';
        }
    }

     // Update counter badges

    updateCounterBadges(competitorCount, adsCount) {
        // Try to find badge elements if not already set
        if (!this.competitorBadgeCount) {
            this.competitorBadgeCount = document.getElementById('competitorBadgeCount');
        }
        if (!this.adsBadgeCount) {
            this.adsBadgeCount = document.getElementById('adsBadgeCount');
        }
        
        if (this.competitorBadgeCount) {
            this.competitorBadgeCount.textContent = competitorCount || 0;
        } else {
            console.warn('Cannot update competitor badge: element not found');
        }

        if (this.adsBadgeCount) {
            this.adsBadgeCount.textContent = adsCount || 0;
        } else {
            console.warn('Cannot update ads badge: element not found');
        }
    }

     // Set clear button state

    setClearButtonState(isClearing) {
        const clearBtn = document.getElementById('clearDataBtn');
        if (!clearBtn) return;

        // Clear button content
        while (clearBtn.firstChild) {
            clearBtn.removeChild(clearBtn.firstChild);
        }
        
        if (isClearing) {
            clearBtn.disabled = true;
            const clearingSvg = SvgHelper.create({
                width: 16,
                height: 16,
                children: [
                    SvgHelper.circle('12', '12', '10'),
                    SvgHelper.path('m9,12 2,2 4,-4')
                ]
            });
            clearBtn.appendChild(clearingSvg);
            clearBtn.appendChild(document.createTextNode(' Clearing...'));
        } else {
            clearBtn.disabled = false;
            // Restore original cross icon (X) - no text, just icon
            const clearSvg = SvgHelper.create({
                width: 14,
                height: 14,
                strokeWidth: '2.5',
                children: [
                    SvgHelper.line('18', '6', '6', '18'),
                    SvgHelper.line('6', '6', '18', '18')
                ]
            });
            clearBtn.appendChild(clearSvg);
        }
    }
}

window.UIManager = UIManager;