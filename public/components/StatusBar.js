/**
 * StatusBar Component
 * Handles connection status display and WebSocket status
 */
class StatusBar {
    constructor() {
        this.connectionStatus = null;
        this.connectionText = null;
        this.wsStatus = null;
    }

    /**
     * Initialize the status bar component
     * @param {HTMLElement} container - The container element to render into
     */
    init(container) {
        this.render(container);
        this.bindElements();
    }

    /**
     * Render the status bar HTML
     * @param {HTMLElement} container - The container element
     */
    render(container) {
        const statusBarHTML = `
            <div class="status-bar">
                <div class="status-item">
                    <div class="status-indicator" id="connectionStatus"></div>
                    <span id="connectionText">Connecting...</span>
                </div>
                <div class="status-item">
                    <span>📡 WebSocket: <span id="wsStatus">Disconnected</span></span>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', statusBarHTML);
    }

    /**
     * Bind DOM elements to component properties
     */
    bindElements() {
        this.connectionStatus = document.getElementById('connectionStatus');
        this.connectionText = document.getElementById('connectionText');
        this.wsStatus = document.getElementById('wsStatus');
    }

    /**
     * Update connection status
     * @param {string} status - Connection status ('connected', 'disconnected', 'connecting')
     * @param {string} text - Status text to display
     */
    updateConnectionStatus(status, text) {
        if (this.connectionStatus && this.connectionText) {
            this.connectionStatus.className = `status-indicator ${status === 'connected' ? '' : 'disconnected'}`;
            this.connectionText.textContent = text;
        }
    }

    /**
     * Update WebSocket status
     * @param {string} status - WebSocket status text
     */
    updateWsStatus(status) {
        if (this.wsStatus) {
            this.wsStatus.textContent = status;
        }
    }

    /**
     * Get the status bar element
     * @returns {HTMLElement|null}
     */
    getElement() {
        return document.querySelector('.status-bar');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatusBar;
} else {
    window.StatusBar = StatusBar;
}
