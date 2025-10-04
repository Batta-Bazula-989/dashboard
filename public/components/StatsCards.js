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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="4" y="3" width="16" height="18" rx="8" fill="none"></rect>
                                <rect x="7" y="6" width="10" height="8" rx="1" fill="none"></rect>
                                <rect x="9" y="8" width="6" height="4" rx="0.5" fill="none"></rect>
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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="6"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                                <path d="M12 2v4"></path>
                                <path d="M12 18v4"></path>
                                <path d="M2 12h4"></path>
                                <path d="M18 12h4"></path>
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
