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
                    <div class="stats-content">
                        <h3>ADVERTISER</h3>
                        <div class="stats-number" id="competitorCount">0</div>
                    </div>
                </div>
                <div class="stats-card">
                    <div class="stats-content">
                        <h3>ADS</h3>
                        <div class="stats-number" id="adsCount">0</div>
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
