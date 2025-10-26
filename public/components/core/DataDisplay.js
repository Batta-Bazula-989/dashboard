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
                    <h3>Enter competitor names and click "Run Analysis" to discover their advertising strategies and performance metrics</h3>
                </div>
                <div class="data-display-content"></div>
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

            console.log('=== PROCESSING ITEM ===');
            console.log('Processed item:', processed);
            console.log('Content type:', processed.content_type);

            if (processed.content_type === 'video') {
                console.log('Adding video analysis to existing cards');
                this.addVideoAnalysis(processed);
            } else {
                console.log('Adding text card');
                this.addTextCard(processed);
                renderedCount++;
            }
        });

        if (renderedCount > 0) {
            // Hide empty state when data is added
            const emptyState = this.dataDisplay.querySelector('.empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }

        return this.getStats();
    }

    addTextCard(data) {
        const grid = this.getOrCreateGrid();
        const card = this.cardBuilder.build(data);
        grid.appendChild(card);

        // Add 'has-data' class to data-display-content for styling
        const contentArea = this.dataDisplay.querySelector('.data-display-content');
        if (contentArea) {
            contentArea.classList.add('has-data');
        }
    }

    addVideoAnalysis(videoData) {
        console.log('=== ADDING VIDEO ANALYSIS ===');
        console.log('Video data:', videoData);
        console.log('Looking for competitor:', videoData.competitor_name);
        console.log('Looking for body:', videoData.body);

        const existingCards = CardMatcher.findAll(
            this.dataDisplay,
            videoData.competitor_name,
            videoData.body
        );

        console.log('Found existing cards:', existingCards.length);

        existingCards.forEach((card, index) => {
            console.log(`Adding video analysis to card ${index + 1}`);
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
            const link = card.querySelector('.name-row a');
            if (link?.textContent) {
                names.add(link.textContent.trim());
            }
        });

        return {
            competitorCards: names.size,
            adsCount: cards.length
        };
    }

   /**
    * Clear all data from the display
    */
   clear() {
       if (this.dataDisplay) {
           this.dataDisplay.innerHTML = `
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
                   <h3>Enter competitor names and click "Run Analysis" to discover their advertising strategies and performance metrics</h3>
               </div>
               <div class="data-display-content"></div>
           `;
       }
   }

    getElement() {
        return this.dataDisplay;
    }
}

window.DataDisplay = DataDisplay;