/**
 * StatsCards Component
 * Handles the display of competitor and campaign statistics
 */
class StatsCards {
    constructor() {
        this.competitorCount = null;
        this.adsCount = null;
    }

    /**
     * Initialize the stats cards component
     * @param {HTMLElement} container - The container element to render into
     */
    init(container) {
        this.render(container);
        this.bindElements();
    }

    /**
     * Render the stats cards HTML
     * @param {HTMLElement} container - The container element
     */
    render(container) {
        const statsCardsHTML = `
            <div class="stats-container">
                <div class="stats-card">
                    <div class="stats-header">
                        <div class="stats-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="2" width="18" height="20" rx="9" fill="none"></rect>
                                <rect x="6" y="5" width="12" height="14" rx="2" fill="none"></rect>
                                <rect x="8" y="7" width="8" height="10" rx="1" fill="none"></rect>
                            </svg>
                        </div>
                        <div class="stats-content">
                            <h3>ADVERTISER</h3>
                            <div class="stats-number" id="competitorCount">0</div>
                        </div>
                    </div>
                </div>
                <div class="stats-card">
                    <div class="stats-header">
                        <div class="stats-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="9"></circle>
                                <circle cx="12" cy="12" r="6"></circle>
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 3v3"></path>
                                <path d="M12 18v3"></path>
                                <path d="M3 12h3"></path>
                                <path d="M18 12h3"></path>
                            </svg>
                        </div>
                        <div class="stats-content">
                                <h3>ADS</h3>
                            <div class="stats-number" id="adsCount">0</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', statsCardsHTML);
    }

    /**
     * Bind DOM elements to component properties
     */
    bindElements() {
        this.competitorCount = document.getElementById('competitorCount');
        this.adsCount = document.getElementById('adsCount');
    }

    /**
     * Update competitor count
     * @param {number} count - Number of competitors
     */
    updateCompetitorCount(count) {
        if (this.competitorCount) {
            this.competitorCount.textContent = count;
        }
    }

    /**
     * Update ads count
     * @param {number} count - Number of active campaigns
     */
    updateAdsCount(count) {
        if (this.adsCount) {
            this.adsCount.textContent = count;
        }
    }

    /**
     * Update both stats at once
     * @param {number} competitorCount - Number of competitors
     * @param {number} adsCount - Number of active campaigns
     */
    updateStats(competitorCount, adsCount) {
        this.updateCompetitorCount(competitorCount);
        this.updateAdsCount(adsCount);
    }

    /**
     * Get the stats container element
     * @returns {HTMLElement|null}
     */
    getElement() {
        return document.querySelector('.stats-container');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsCards;
} else {
    window.StatsCards = StatsCards;
}
