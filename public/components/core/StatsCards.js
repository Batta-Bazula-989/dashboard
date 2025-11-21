class StatsCards {
    constructor() {
        this.competitorCount = null;
        this.adsCount = null;
    }


    init(container) {
        this.render(container);
        this.bindElements();
    }


    render(container) {
        const statsCardsHTML = `
            <div class="stats-container">
                <div class="stats-card">
                    <div class="stats-icon-top-right">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 11a9 9 0 0 1 9-9 9 9 0 0 1 9 9"></path>
                            <path d="M12 2a9 9 0 0 1 9 9"></path>
                            <path d="M21 2l-1 1"></path>
                            <path d="M3 2l1 1"></path>
                        </svg>
                    </div>
                    <div class="stats-content">
                        <div class="stats-label">ADVERTISER</div>
                        <div class="stats-number" id="competitorCount">0</div>
                    </div>
                </div>

                <div class="stats-card">
                    <div class="stats-icon-top-right">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <div class="stats-content">
                        <div class="stats-label">ADS</div>
                        <div class="stats-number" id="adsCount">0</div>
                    </div>
                </div>

                <!-- Clear Button in Stats Row -->
                <button id="clearDataBtn" class="clear-data-btn-stats">
                    Clear
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(statsCardsHTML, 'text/html');
        const fragment = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node => {
            fragment.appendChild(node.cloneNode(true));
        });
        container.appendChild(fragment);
    }

    bindElements() {
        this.competitorCount = document.getElementById('competitorCount');
        this.adsCount = document.getElementById('adsCount');
    }

    updateCompetitorCount(count) {
        if (this.competitorCount) {
            this.competitorCount.textContent = count;
        }
    }

    updateAdsCount(count) {
        if (this.adsCount) {
            this.adsCount.textContent = count;
        }
    }

    updateStats(competitorCount, adsCount) {
        this.updateCompetitorCount(competitorCount);
        this.updateAdsCount(adsCount);
    }

    getElement() {
        return document.querySelector('.stats-container');
    }
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsCards;
} else {
    window.StatsCards = StatsCards;
}
