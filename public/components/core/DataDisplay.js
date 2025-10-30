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
                            <div class="circle-outer"></div>
                            <div class="square-inner">
                                <svg class="search-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <h2 class="empty-state-title">Start Your Analysis</h2>
                    <p class="empty-state-description">Enter competitor names and click <span class="highlight">Analyze</span> to discover their advertising strategies and performance metrics</p>
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
        let hasProcessedItems = false;

        items.forEach(item => {
            const processed = DataProcessor.process(item);
            if (!processed) return;

            hasProcessedItems = true;

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

        if (hasProcessedItems) {
            // Remove empty state when any data is added (text cards or video analysis)
            const emptyState = this.dataDisplay.querySelector('.empty-state');
            console.log('Empty state found:', !!emptyState);
            if (emptyState) {
                console.log('Removing empty state element');
                emptyState.remove();
                console.log('Empty state removed');
            }
        }

        return this.getStats();
    }

    addTextCard(data) {
        const grid = this.getOrCreateGrid();
        const card = this.cardBuilder.build(data);
        grid.appendChild(card);
        
        // ALWAYS remove empty state when adding a card
        const emptyState = this.dataDisplay.querySelector('.empty-state');
        if (emptyState) {
            console.log('🚨 REMOVING EMPTY STATE FROM addTextCard');
            emptyState.remove();
        }
    }

addVideoAnalysis(videoData) {
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
        // ✅ Check if this card already has video analysis section
        const hasVideoAnalysis = card.querySelector('.video-analysis-section');
        if (hasVideoAnalysis) {
            console.log(`Card ${index + 1} already has video analysis, skipping`);
            return;
        }

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
    * @param {boolean} showEmptyState - Whether to show the empty state after clearing
    */
   clear(showEmptyState = false) {
       console.log('=== CLEAR() CALLED ===');
       console.log('showEmptyState:', showEmptyState);
       if (this.dataDisplay) {
           // Clear only the content area
           const contentArea = this.dataDisplay.querySelector('.data-display-content');
           if (contentArea) {
               contentArea.innerHTML = '';
               contentArea.classList.remove('has-data');
           }
           
           // Handle empty state based on parameter
           const emptyState = this.dataDisplay.querySelector('.empty-state');
           console.log('Empty state found:', !!emptyState);
           if (showEmptyState) {
               // Show empty state if it doesn't exist
               if (!emptyState) {
                   console.log('Creating empty state');
                   const emptyStateHTML = `
                       <div class="empty-state">
                           <div class="billboard-illustration">
                               <div class="search-container">
                                   <div class="circle-outer"></div>
                                   <div class="square-inner">
                                       <svg class="search-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                           <circle cx="11" cy="11" r="8"></circle>
                                           <path d="m21 21-4.35-4.35"></path>
                                       </svg>
                                   </div>
                               </div>
                           </div>
                           <h2 class="empty-state-title">Start Your Analysis</h2>
                           <p class="empty-state-description">Enter advertiser names and click <span class="highlight">Analyze</span> to discover their advertising strategies and performance metrics</p>
                       </div>
                   `;
                   this.dataDisplay.insertAdjacentHTML('afterbegin', emptyStateHTML);
               }
           } else {
               // Remove the empty state if it exists
               if (emptyState) {
                   console.log('Removing empty state in clear()');
                   emptyState.remove();
               }
           }
       }
   }

    getElement() {
        return this.dataDisplay;
    }
}

window.DataDisplay = DataDisplay;