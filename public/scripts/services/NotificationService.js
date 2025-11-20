/**
 * NotificationService
 * Handles notification polling and fetching
 */
class NotificationService extends BasePollingService {
    constructor(onNotificationReceived) {
        super('/api/notifications', 2000, onNotificationReceived);
    }

    /**
     * Fetch new notifications from server
     */
    async fetchData() {
        if (this.isFetching) {
            return;
        }

        try {
            this.isFetching = true;

            const url = this.buildUrl();
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.notifications && result.notifications.length > 0) {
                // On initial fetch, just record the latest ID without triggering callbacks
                if (this.isInitialFetch) {
                    if (result.latestId !== undefined) {
                        this.lastId = result.latestId;
                    }
                    this.isInitialFetch = false;
                } else {
                    // Filter out error notifications - they are handled by ErrorService
                    const errorTypes = ['error', 'n8n_error', 'api_error', 'ai_credits', 'rate_limit', 'timeout'];
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
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            this.isFetching = false;

            if (this.isPolling) {
                this.scheduleNextFetch();
            }
        }
    }
}

window.NotificationService = NotificationService;