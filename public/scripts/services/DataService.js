class DataService {
    constructor(onDataReceived) {
        this.baseUrl = '/api/data';
        this.streamUrl = '/api/data/stream';
        this.onDataReceived = onDataReceived;
        this.eventSource = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // 2 seconds
    }

    async getHeaders() {
        // Use global session manager
        await window.sessionManager.initialize();

        const headers = {
            'Content-Type': 'application/json'
        };

        // Use getValidToken() to atomically check validity and get token
        const token = window.sessionManager.getValidToken();
        if (token) {
            headers['X-Session-Token'] = token;
        }

        return headers;
    }

    async connect() {
        if (this.eventSource) {
            return; // Already connected
        }

        try {
            // Get session token
            await window.sessionManager.initialize();
            const token = window.sessionManager.getValidToken();

            // Build URL with token as query parameter (EventSource doesn't support custom headers)
            const url = token
                ? `${this.streamUrl}?token=${encodeURIComponent(token)}`
                : this.streamUrl;

            this.eventSource = new EventSource(url);

            this.eventSource.onopen = () => {
                console.log('SSE connection opened');
                this.reconnectAttempts = 0;
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Skip connection messages
                    if (data.type === 'connected') {
                        return;
                    }

                    // Trigger callback with received data
                    if (this.onDataReceived) {
                        this.onDataReceived(data);
                    }
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);

                // Close and attempt reconnection
                this.disconnect();
                this.attemptReconnect();
            };

        } catch (error) {
            console.error('Failed to establish SSE connection:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    async clearData() {
        try {
            const headers = await this.getHeaders();
            const response = await fetch(this.baseUrl, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Session may have expired, try to reinitialize
                    window.sessionManager.clear();
                    const retryHeaders = await this.getHeaders();
                    const retryResponse = await fetch(this.baseUrl, {
                        method: 'DELETE',
                        headers: retryHeaders
                    });

                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch((error) => {
                            console.error('Failed to parse error response JSON:', error);
                            return {};
                        });
                        throw new Error(errorData.error || ERROR_MESSAGES.AUTH_FAILED);
                    }
                    return true;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error(ERROR_MESSAGES.DATA_CLEAR_ERROR, error);
            throw error;
        }
    }
}

window.DataService = DataService;
