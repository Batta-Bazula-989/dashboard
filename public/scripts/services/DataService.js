class DataService {
    constructor() {
        this.baseUrl = '/api/data';
    }

    async getHeaders() {
        // Use global session manager
        await window.sessionManager.initialize();

        const headers = {
            'Content-Type': 'application/json'
        };

        // Use getValidToken() to atomically check validity and get token
        // This prevents race condition where token expires between check and use
        const token = window.sessionManager.getValidToken();
        if (token) {
            headers['X-Session-Token'] = token;
        }

        return headers;
    }

    async fetchData() {
        try {
            const headers = await this.getHeaders();
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Session may have expired, try to reinitialize
                    window.sessionManager.clear();
                    const retryHeaders = await this.getHeaders();
                    const retryResponse = await fetch(this.baseUrl, {
                        method: 'GET',
                        headers: retryHeaders
                    });

                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch((error) => {
                            console.error('Failed to parse error response JSON:', error);
                            return {};
                        });
                        throw new Error(errorData.error || ERROR_MESSAGES.AUTH_FAILED);
                    }
                    return await retryResponse.json();
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Only log non-network errors to console (suppress expected network errors)
            if (!isNetworkError(error)) {
                console.error(ERROR_MESSAGES.DATA_FETCH_ERROR, error);
            }
            throw error;
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