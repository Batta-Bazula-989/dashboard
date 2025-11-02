/**
 * DataService
 * Handles all API calls related to data
 */
class DataService {
    constructor() {
        this.baseUrl = '/api/data';
    }

    /**
     * Fetch data from API
     * @returns {Promise<Object>} API response
     */
    async fetchData() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    /**
     * Clear all data on server
     * @returns {Promise<boolean>} Success status
     */
    async clearData() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Data cleared from server');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }
}

window.DataService = DataService;