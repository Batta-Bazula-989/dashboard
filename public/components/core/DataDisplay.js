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

    render(container) {
        const dataDisplayHTML = `
            <div class="data-display" id="dataDisplay">
                <div class="data-display-header">
                    <button id="clearDataBtn" class="clear-data-btn">
                        <svg>...</svg>
                        Clear All
                    </button>
                    <div class="content-divider-full"></div>
                </div>
                <div class="data-display-content">
                    <div class="empty-state">
                        <div class="billboard-illustration">...</div>
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