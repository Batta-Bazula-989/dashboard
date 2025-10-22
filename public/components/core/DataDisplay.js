/**
 * DataDisplay Component
 * Orchestrates data display - delegates to specialized classes
 */
class DataDisplay {
    constructor() {
        this.dataDisplay = null;
        this.onShowFullAnalysis = null;
        this.cardBuilder = null;
    }

    init(container, onShowFullAnalysis = null) {
        this.onShowFullAnalysis = onShowFullAnalysis;
        this.cardBuilder = new CardBuilder(onShowFullAnalysis);
        this.render(container);
        this.bindElements();
    }

    /**
     * Render the data display HTML
     * @param {HTMLElement} container - The container element
     */
    render(container) {
        const dataDisplayHTML = `
            <div class="data-display" id="dataDisplay">
                <!-- Fixed Header with Clear All Button -->
                <div class="data-display-header">
                    <button id="clearDataBtn" class="clear-data-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Clear All
                    </button>
                </div>
                <!-- Scrollable Content Area -->
                <div class="data-display-content">
                    <div class="empty-state">
                        <div class="billboard-illustration">
                            <div class="search-container">
                                <div class="circle-outer">
                                    <div class="dot dot1"></div>
                                    <div class="dot dot2"></div>
                                </div>
                                <div class="circle-inner">
                                    <div class="search-icon">
                                        <div class="search-circle"></div>
                                        <div class="search-handle"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3>No ads yet</h3>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', dataDisplayHTML);
    }

    bindElements() {
        this.dataDisplay = document.getElementById('dataDisplay');
    }

    addDataItem(incoming) {
        const payload = incoming?.data || incoming;
        const items = Array.isArray(payload) ? payload : [payload];

        let renderedCount = 0;

        items.forEach(item => {
            const processed = DataProcessor.process(item);
            if (!processed) return;

            if (processed.content_type === 'video') {
                this.addVideoAnalysis(processed);
            } else {
                this.addTextCard(processed);
                renderedCount++;
            }
        });

        if (renderedCount > 0) {
            const emptyState = this.dataDisplay.querySelector('.empty-state');
            if (emptyState) emptyState.remove();
        }

        return this.getStats();
    }

    addTextCard(data) {
        const grid = this.getOrCreateGrid();
        const card = this.cardBuilder.build(data);
        grid.appendChild(card);
    }

    addVideoAnalysis(videoData) {
        const existingCards = CardMatcher.findAll(
            this.dataDisplay,
            videoData.competitor_name,
            videoData.body
        );

        existingCards.forEach(card => {
            const section = AnalysisSections.createVideoAnalysis(
                videoData,
                this.onShowFullAnalysis
            );
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            card.appendChild(divider);
            card.appendChild(section);
        });
    }

    getOrCreateGrid() {
        const contentArea = this.dataDisplay.querySelector('.data-display-content');
        let grid = contentArea.querySelector('.card-grid');

        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'card-grid';
            contentArea.appendChild(grid);
        }

        return grid;
    }

    getStats() {
        const cards = this.dataDisplay.querySelectorAll('.card');
        const names = new Set();

        cards.forEach(card => {
            const link = card.querySelector('.title-row a');
            if (link?.textContent) {
                names.add(link.textContent.trim());
            }
        });

        return {
            competitorCards: names.size,
            adsCount: cards.length
        };
    }

    clear() {
        if (this.dataDisplay) {
            this.dataDisplay.innerHTML = `...`; // Same as before
        }
    }

    getElement() {
        return this.dataDisplay;
    }
}

window.DataDisplay = DataDisplay;