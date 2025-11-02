/**
 * NotificationService - Handles notification fetching
 */
class NotificationService {
    /**
     * Fetch notifications from API
     */
    async fetchNotifications(lastNotificationId) {
        const url = lastNotificationId >= 0
            ? `/api/notifications?since=${lastNotificationId}`
            : '/api/notifications';

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }
}

window.NotificationService = NotificationService;