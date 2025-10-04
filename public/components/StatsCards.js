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
                <div class="stats-card stats-card-lavender">
                    <div class="stats-icon-top-right">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 11a9 9 0 0 1 9-9 9 9 0 0 1 9 9"></path>
                            <path d="M12 2a9 9 0 0 1 9 9"></path>
                            <path d="M21 2l-1 1"></path>
                            <path d="M3 2l1 1"></path>
                        </svg>
                    </div>
                    <div class="stats-content">
                        <h3>ADVERTISER</h3>
                        <div class="stats-number" id="competitorCount">0</div>
                    </div>
                </div>
                <div class="stats-card stats-card-pink">
                    <div class="stats-icon-top-right">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
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
