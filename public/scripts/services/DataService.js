/**
 * DataService - Handles data fetching and clearing
 */
class DataService {
    /**
     * Fetch data from API
     */
    async fetchData() {
        const response = await fetch('/api/data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Clear data on server
     */
    async clearData() {
        const response = await fetch('/api/data', {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.ok;
    }
}

window.DataService = DataService;