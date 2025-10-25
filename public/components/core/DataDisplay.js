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

            console.log('=== PROCESSING ITEM ===');
            console.log('Processed item:', processed);
            console.log('Content type:', processed.content_type);
            
            // Always add the main card first
            console.log('Adding text card');
            this.addTextCard(processed);
            renderedCount++;
            
            // Then check if this also has video analysis to add
            const hasVideoAnalysis = this.isVideoAnalysisData(processed);
            console.log('Has video analysis:', hasVideoAnalysis);
            
            if (hasVideoAnalysis) {
                console.log('Adding video analysis to the card');
                this.addVideoAnalysisToCard(processed);
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

    /**
     * Check if the data represents video analysis based on ai_analysis structure
     * @param {Object} data - Processed data item
     * @returns {boolean} True if this is video analysis data
     */
    isVideoAnalysisData(data) {
        const analysis = data.ai_analysis;
        if (!analysis || typeof analysis !== 'object') return false;

        // Check for video-specific analysis fields
        const videoFields = [
            'technical',
            'visual_and_editing', 
            'people_and_product',
            'psychology'
        ];

        const hasVideoFields = videoFields.some(field => analysis[field] && typeof analysis[field] === 'object');
        
        console.log('=== VIDEO ANALYSIS DETECTION ===');
        console.log('Data:', data);
        console.log('Analysis:', analysis);
        console.log('Video fields found:', videoFields.filter(field => analysis[field]));
        console.log('Is video analysis:', hasVideoFields);
        console.log('Content type:', data.content_type);
        
        return hasVideoFields;
    }

    addVideoAnalysisToCard(videoData) {
        console.log('=== ADDING VIDEO ANALYSIS TO CARD ===');
        console.log('Video data:', videoData);
        
        // Find the most recently added card (last card in the grid)
        const grid = this.dataDisplay.querySelector('.card-grid');
        if (!grid) {
            console.log('No card grid found');
            return;
        }
        
        const cards = grid.querySelectorAll('.card');
        if (cards.length === 0) {
            console.log('No cards found');
            return;
        }
        
        const lastCard = cards[cards.length - 1];
        console.log('Adding video analysis to last card:', lastCard);
        
        const section = AnalysisSections.createVideoAnalysis(
            videoData,
            this.onShowFullAnalysis
        );
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        lastCard.appendChild(divider);
        lastCard.appendChild(section);
        
        console.log('Video analysis section added successfully');
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
        console.log('Existing cards:', existingCards);

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
           `;
       }
   }

    getElement() {
        return this.dataDisplay;
    }
}

window.DataDisplay = DataDisplay;