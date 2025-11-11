/**
 * NotificationService
 * Handles notification polling and fetching
 */
class NotificationService {
    constructor(onNotificationReceived) {
        this.baseUrl = '/api/notifications';
        this.pollingTimer = null;
        this.pollingRate = 2000; // Poll every 2 seconds
        this.lastNotificationId = -1;
        this.onNotificationReceived = onNotificationReceived;
        this.isInitialFetch = true; // Track initial fetch to avoid triggering on old notifications
        this.isFetching = false;
        this.isPolling = false;
    }

    /**
     * Start polling for notifications
     */
    start() {
        if (this.isPolling) {
            return;
        }

        this.isPolling = true;
        this.fetchNotifications();
        console.log('Started notification polling');
    }

    /**
     * Stop polling for notifications
     */
    stop() {
        if (!this.isPolling) {
            return;
        }

        this.isPolling = false;

        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }

        console.log('Stopped notification polling');
    }

    /**
     * Fetch new notifications from server
     */
    async fetchNotifications() {
        if (this.isFetching) {
            console.log('⏳ Notification fetch skipped - request in progress');
            return;
        }

        try {
            this.isFetching = true;

            const url = this.lastNotificationId >= 0
                ? `${this.baseUrl}?since=${this.lastNotificationId}`
                : this.baseUrl;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.notifications && result.notifications.length > 0) {
                // On initial fetch, just record the latest ID without triggering callbacks
                if (this.isInitialFetch) {
                    console.log(`Initial fetch: Found ${result.notifications.length} existing notifications (skipping callbacks)`);
                    if (result.latestId !== undefined) {
                        this.lastNotificationId = result.latestId;
                    }
                    this.isInitialFetch = false;
                } else {
                    // Filter out error notifications - they are handled by ErrorService
                    const errorTypes = ['error', 'n8n_error', 'api_error', 'ai_credits', 'rate_limit', 'timeout'];
                    const nonErrorNotifications = result.notifications.filter(n => !errorTypes.includes(n.type));

                    if (nonErrorNotifications.length > 0) {
                        console.log(`Received ${nonErrorNotifications.length} new notifications`);

                        nonErrorNotifications.forEach(notification => {
                            if (this.onNotificationReceived) {
                                this.onNotificationReceived(notification);
                            }
                        });
                    }

                    if (result.latestId !== undefined) {
                        this.lastNotificationId = result.latestId;
                    }
                }
            } else if (this.isInitialFetch) {
                // No notifications on initial fetch - still mark as initialized
                console.log('Initial fetch: No existing notifications');
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

    /**
     * Schedule next poll after current fetch completes
     */
    scheduleNextFetch() {
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }

        this.pollingTimer = setTimeout(() => {
            this.pollingTimer = null;

            if (this.isPolling) {
                this.fetchNotifications();
            }
        }, this.pollingRate);
    }

    /**
     * Reset notification state
     */
    reset() {
        this.lastNotificationId = -1;
        this.isInitialFetch = true;
        this.isFetching = false;

        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }

        this.isPolling = false;
    }
}

window.NotificationService = NotificationService;