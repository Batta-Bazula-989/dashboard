class DataDisplay {
    constructor() {
        this.dataDisplay = null;
        this.onShowFullAnalysis = null;
        this.cardBuilder = null;
        this._statsCache = null;
        this._statsCacheValid = false;
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
                ${this.getEmptyStateTemplate()}
                <div class="data-display-content"></div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', dataDisplayHTML);
        
        // Initially hide empty state to prevent flash on reload
        // It will be shown after first data fetch if no data exists
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    getEmptyStateTemplate() {
        return `
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
        `;
    }

    hasData() {
        if (!this.dataDisplay) {
            return false;
        }

        const contentArea = this.dataDisplay.querySelector('.data-display-content');
        if (!contentArea) {
            return false;
        }

        return !!contentArea.querySelector('.card');
    }

    bindElements() {
        this.dataDisplay = document.getElementById('dataDisplay');
    }

    /**
     * Show loading state - replaces empty state with loading animation
     */
    showLoading() {
        // Remove empty state if it exists
        const emptyState = this.dataDisplay.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Remove any existing loading state
        const existingLoading = this.dataDisplay.querySelector('.loading-state');
        if (existingLoading) {
            existingLoading.remove();
        }

        // Create loading state
        const loadingStateHTML = `
            <div class="loading-state">
                <div class="loading-state-illustration">
                    <div class="neural-network">
                        <div class="node"></div>
                        <div class="node"></div>
                        <div class="node"></div>
                        <div class="node"></div>
                        <div class="node"></div>
                    </div>
                </div>
                <div class="loading-dots"></div>
                <div class="loading-subtitle">Analyzing data</div>
            </div>
        `;

        // Insert loading state at the beginning of data display
        this.dataDisplay.insertAdjacentHTML('afterbegin', loadingStateHTML);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingState = this.dataDisplay.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
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

            if (processed.content_type === 'video') {
                this.addVideoAnalysis(processed);
            } else if (processed.content_type === 'carousel') {
                // For carousel content, ONLY add analysis to existing cards - NEVER create new cards
                this.addCarouselAnalysis(processed);
            } else if (this.hasCarouselData(processed)) {
                this.addCarouselAnalysis(processed);
            } else {
                this.addTextCard(processed);
                renderedCount++;
            }
        });

        if (hasProcessedItems) {
            // Remove loading state when data arrives
            this.hideLoading();

            // Remove empty state when any data is added (text cards or video analysis)
            const emptyState = this.dataDisplay.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            
            // Invalidate stats cache when data changes
            this._statsCacheValid = false;
        }

        return this.getStats();
    }

  addTextCard(data) {
      const grid = this.getOrCreateGrid();
      const competitorName = data.competitor_name;

      let column = grid.querySelector(`[data-competitor="${CSS.escape(competitorName)}"]`);

      if (!column) {
          column = document.createElement('div');
          column.className = 'competitor-column';
          column.setAttribute('data-competitor', competitorName);
          grid.appendChild(column);
      }

      // Add card to the competitor's column
      const card = this.cardBuilder.build(data);
      column.appendChild(card);

      // Remove loading state when adding cards
      this.hideLoading();

      // ALWAYS remove empty state when adding a card
      const emptyState = this.dataDisplay.querySelector('.empty-state');
      if (emptyState) {
          emptyState.remove();
      }
      
      // Invalidate stats cache when card is added
      this._statsCacheValid = false;
  }

    hasCarouselData(processed) {
        // This function should ONLY return true for FOLLOW-UP analysis (not original data)
        // Original data with cards/images should go through addTextCard() to create the card first
        
        // If content_type is explicitly 'carousel', this is follow-up carousel analysis
        if (processed.content_type === 'carousel') {
            return true;
        }
        
        const hasAnalysis = processed.ai_analysis && Object.keys(processed.ai_analysis).length > 0;
        const hasNoVideos = !processed.ad_data?.videos || processed.ad_data.videos.length === 0;
        
        if (!hasAnalysis || !hasNoVideos) return false;
        
        // Check if it has images or cards arrays in ad_data
        const hasImages = processed.ad_data?.images && Array.isArray(processed.ad_data.images) && processed.ad_data.images.length > 0;
        const hasCards = processed.ad_data?.cards && Array.isArray(processed.ad_data.cards) && processed.ad_data.cards.length > 0;
        
        // If it has images/cards arrays, this is ORIGINAL data - should create card via addTextCard()
        // Return FALSE so it goes through addTextCard() instead
        if (hasImages || hasCards) return false;
        
        // If it only has ai_analysis (follow-up analysis), check if we can match it to existing card with carousel
        // Try matching by competitor name and checking if existing cards have carousels
        if (hasAnalysis && processed.competitor_name && this.dataDisplay) {
            // First try with text matching
            const matchText = processed.body || processed.ad_data?.ad_text || '';
            let existingCards = CardMatcher.findAll(
                this.dataDisplay,
                processed.competitor_name,
                matchText
            );
            
            // If no match with text, try matching by name only to find cards with carousels
            if (existingCards.length === 0 && matchText) {
                existingCards = CardMatcher.findAll(
                    this.dataDisplay,
                    processed.competitor_name,
                    null // Match by name only
                );
            }
            
            // Check if any matched card has carousel (images or cards)
            for (let card of existingCards) {
                const hasImageCarousel = card.querySelector('.image-carousel-container');
                const hasCardCarousel = card.querySelector('.carousel-card-item');
                if (hasImageCarousel || hasCardCarousel) {
                    return true; // This is follow-up analysis for an existing carousel card
                }
            }
        }
        
        return false;
    }

addVideoAnalysis(videoData) {
    const existingCards = CardMatcher.findAll(
        this.dataDisplay,
        videoData.competitor_name,
        videoData.body
    );

    existingCards.forEach((card) => {
        // ✅ Check if this card already has video analysis section
        const hasVideoAnalysis = card.querySelector('.video-analysis-section');
        if (hasVideoAnalysis) {
            return;
        }

        const section = AnalysisSections.createVideoAnalysis(
            videoData,
            this.onShowFullAnalysis
        );
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        card.appendChild(divider);
        card.appendChild(section);
    });
    
    // Invalidate stats cache when analysis is added
    this._statsCacheValid = false;
}

addCarouselAnalysis(carouselData) {
    // Only add analysis if ai_analysis is available
    if (!carouselData.ai_analysis || Object.keys(carouselData.ai_analysis).length === 0) {
        return;
    }

    // Match by body field - this is the primary matching criteria
    const matchText = carouselData.body || carouselData.ad_data?.ad_text || '';

    if (!matchText) {
        console.warn('⚠️ No body or ad_text found in carousel data. Cannot match to existing card.');
        return;
    }

    // Match by competitor name + body text
    let existingCards = CardMatcher.findAll(
        this.dataDisplay,
        carouselData.competitor_name,
        matchText
    );

    // If no match found, skip - do NOT create a new card
    if (existingCards.length === 0) {
        return;
    }

    existingCards.forEach((card) => {
        // Check if this card already has carousel analysis section
        const hasCarouselAnalysis = card.querySelector('.carousel-analysis-section');
        if (hasCarouselAnalysis) {
            return;
        }

        const section = AnalysisSections.createCarouselAnalysis(
            carouselData,
            this.onShowFullAnalysis
        );
        
        // Find the text analysis section to insert after it
        const textAnalysisSection = card.querySelector('.ai-preview');
        
        if (textAnalysisSection) {
            // Insert after text analysis section
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            // Insert divider and section right after text analysis
            textAnalysisSection.insertAdjacentElement('afterend', divider);
            divider.insertAdjacentElement('afterend', section);
        } else {
            // If no text analysis section, append at the end (shouldn't happen normally)
            console.warn('No text analysis section found, appending carousel analysis at end');
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            card.appendChild(divider);
            card.appendChild(section);
        }
    });
    
    // Invalidate stats cache when analysis is added
    this._statsCacheValid = false;
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
        // Return cached stats if valid
        if (this._statsCacheValid && this._statsCache !== null) {
            return this._statsCache;
        }

        // Calculate stats
        const cards = this.dataDisplay.querySelectorAll('.card');
        const names = new Set();

        cards.forEach(card => {
            const link = card.querySelector('.name-row a');
            if (link?.textContent) {
                names.add(link.textContent.trim());
            }
        });

        const stats = {
            competitorCards: names.size,
            adsCount: cards.length
        };

        // Cache the result
        this._statsCache = stats;
        this._statsCacheValid = true;

        return stats;
    }

   /**
    * Clear all data from the display
    * @param {boolean} showEmptyState - Whether to show the empty state after clearing
    */
   clear(showEmptyState = false) {
       if (this.dataDisplay) {
           // Clear only the content area
           const contentArea = this.dataDisplay.querySelector('.data-display-content');
           if (contentArea) {
               // Ensure any playing videos are fully released
               const videos = contentArea.querySelectorAll('video');
               videos.forEach(video => {
                   try {
                       video.pause();
                       video.removeAttribute('src');

                       // Remove any sources to release references
                       while (video.firstChild) {
                           video.removeChild(video.firstChild);
                       }

                       // Force the browser to reset the element
                       video.load();
                   } catch (releaseError) {
                       console.warn('Failed to release video resources:', releaseError);
                   }
               });

               contentArea.innerHTML = '';
               contentArea.classList.remove('has-data');
           }

           // Remove loading state if it exists
           this.hideLoading();

           // Handle empty state based on parameter
           const emptyState = this.dataDisplay.querySelector('.empty-state');
           if (showEmptyState) {
               // Show empty state if it doesn't exist
               if (!emptyState) {
                   this.dataDisplay.insertAdjacentHTML('afterbegin', this.getEmptyStateTemplate());
               } else {
                   emptyState.style.display = '';
               }
           } else {
               // Remove the empty state if it exists
               if (emptyState) {
                   emptyState.remove();
               }
           }
           
           // Invalidate stats cache when data is cleared
           this._statsCacheValid = false;
           this._statsCache = null;
       }
   }

    getElement() {
        return this.dataDisplay;
    }
}

window.DataDisplay = DataDisplay;