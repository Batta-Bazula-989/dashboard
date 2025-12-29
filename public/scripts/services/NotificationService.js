class NotificationService extends BasePollingService {
    constructor(onNotificationReceived) {
        super('/api/notifications', 2000, onNotificationReceived);
    }

    // Fetch new notifications from server

    async fetchData() {
        if (this.isFetching) {
            return;
        }

        // Check circuit breaker state
        if (this.circuitState === 'OPEN') {
            // Circuit is open - attempt recovery check
            if (this._shouldAttemptRecovery()) {
                // Transitioning to half-open for test
            } else {
                // Still in open state, just schedule next recovery check
                if (this.isPolling) {
                    this.scheduleNextFetch();
                }
                return;
            }
        }

        try {
            this.isFetching = true;

            const url = this.buildUrl();
            const headers = await this.getHeaders();
            const response = await fetch(url, {
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Session may have expired, try to reinitialize
                    window.sessionManager.clear();
                    await window.sessionManager.initialize();
                    const retryHeaders = await this.getHeaders();
                    const retryResponse = await fetch(url, {
                        headers: retryHeaders
                    });
                    
                    if (!retryResponse.ok) {
                        const errorData = await retryResponse.json().catch((error) => {
                            console.error('Failed to parse error response JSON:', error);
                            return {};
                        });
                        throw new Error(errorData.error || ERROR_MESSAGES.AUTH_FAILED);
                    }
                    // Use retry response
                    const result = await retryResponse.json();
                    this._processNotifications(result);
                    this.onFetchSuccess();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this._processNotifications(result);
            this.onFetchSuccess();
        } catch (error) {
            // Only log non-network errors to console (suppress expected network errors)
            if (!isNetworkError(error)) {
                console.error(ERROR_MESSAGES.NOTIFICATIONS_FETCH_ERROR, error);
            }
            
            // Update circuit breaker state
            this.onFetchError(error);
        } finally {
            this.isFetching = false;

            if (this.isPolling) {
                this.scheduleNextFetch();
            }
        }
    }

    _processNotifications(result) {
        if (result.success && result.notifications && result.notifications.length > 0) {
                // On initial fetch, just record the latest ID without triggering callbacks
                if (this.isInitialFetch) {
                    if (result.latestId !== undefined) {
                        this.lastId = result.latestId;
                    }
                    this.isInitialFetch = false;
                } else {
                    // Filter out error notifications - they are handled by ErrorService
                    const errorTypes = [ERROR_TYPES.ERROR, ERROR_TYPES.API_ERROR, ERROR_TYPES.AI_CREDITS, ERROR_TYPES.RATE_LIMIT, ERROR_TYPES.TIMEOUT];
                    const nonErrorNotifications = result.notifications.filter(n => !errorTypes.includes(n.type));

                    if (nonErrorNotifications.length > 0) {
                        nonErrorNotifications.forEach(notification => {
                            if (this.onDataReceived) {
                                this.onDataReceived(notification);
                            }
                        });
                    }

                    if (result.latestId !== undefined) {
                        this.lastId = result.latestId;
                    }
                }
        } else if (this.isInitialFetch) {
            // No notifications on initial fetch - still mark as initialized
            this.isInitialFetch = false;
        }
    }
}

window.NotificationService = NotificationService;