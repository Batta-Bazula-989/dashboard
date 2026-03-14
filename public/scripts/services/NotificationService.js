class NotificationService extends BasePollingService {
    constructor(onNotificationReceived) {
        super('/api/notifications', 2000, onNotificationReceived);
        this._fetchErrorMessage = ERROR_MESSAGES.NOTIFICATIONS_FETCH_ERROR;
    }

    _processData(result) {
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