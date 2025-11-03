/**
 * NotificationService
 * Handles notification polling and fetching
 */
class NotificationService {
    constructor(onNotificationReceived) {
        this.baseUrl = '/api/notifications';
        this.pollingInterval = null;
        this.pollingRate = 2000; // Poll every 2 seconds
        this.lastNotificationId = -1;
        this.onNotificationReceived = onNotificationReceived;
        this.isInitialFetch = true; // Track initial fetch to avoid triggering on old notifications
    }

    /**
     * Start polling for notifications
     */
    start() {
        this.fetchNotifications();

        this.pollingInterval = setInterval(() => {
            this.fetchNotifications();
        }, this.pollingRate);

        console.log('Started notification polling');
    }

    /**
     * Stop polling for notifications
     */
    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('Stopped notification polling');
        }
    }

    /**
     * Fetch new notifications from server
     */
    async fetchNotifications() {
        try {
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
                    // Only trigger callbacks for truly new notifications after initial fetch
                    console.log(`Received ${result.notifications.length} new notifications`);

                    result.notifications.forEach(notification => {
                        if (this.onNotificationReceived) {
                            this.onNotificationReceived(notification);
                        }
                    });

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
        }
    }

    /**
     * Reset notification state
     */
    reset() {
        this.lastNotificationId = -1;
        this.isInitialFetch = true;
    }
}

window.NotificationService = NotificationService;