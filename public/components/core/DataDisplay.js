class DataDisplay {
    constructor() {
        this.dataDisplay = null;
        this.onShowFullAnalysis = null;
        this.cardBuilder = null;
        this._statsCache = null;
        this._statsCacheValid = false;
        // Cached DOM elements
        this._emptyState = null;
        this._contentArea = null;
        this._grid = null;
        // Card index for fast lookups
        this._cardCount = 0;
        this._competitorNames = new Set();
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
        const dataDisplay = document.createElement('div');
        dataDisplay.className = 'data-display';
        dataDisplay.id = 'dataDisplay';
        
        // Parse empty state template safely
        const parser = new DOMParser();
        const emptyStateDoc = parser.parseFromString(this.getEmptyStateTemplate(), 'text/html');
        const emptyStateElement = emptyStateDoc.body.firstChild;
        if (emptyStateElement) {
            dataDisplay.appendChild(emptyStateElement.cloneNode(true));
        }
        
        const contentArea = document.createElement('div');
        contentArea.className = 'data-display-content';
        dataDisplay.appendChild(contentArea);
        
        container.appendChild(dataDisplay);
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
        const contentArea = this._getContentArea();
        if (!contentArea) {
            return false;
        }

        return !!contentArea.querySelector('.card');
    }

    bindElements() {
        this.dataDisplay = document.getElementById('dataDisplay');
        this._refreshCachedElements();
        
        // Initially hide empty state to prevent flash on reload
        // It will be shown after first data fetch if no data exists
        if (this._emptyState) {
            this._emptyState.style.display = 'none';
        }
    }

    /**
     * Refresh cached DOM element references
     */
    _refreshCachedElements() {
        if (this.dataDisplay) {
            this._emptyState = this.dataDisplay.querySelector('.empty-state');
            this._contentArea = this.dataDisplay.querySelector('.data-display-content');
            this._grid = this._contentArea?.querySelector('.card-grid') || null;
        }
    }

    /**
     * Get empty state element (cached)
     */
    _getEmptyState() {
        if (!this._emptyState || !this.dataDisplay.contains(this._emptyState)) {
            this._emptyState = this.dataDisplay?.querySelector('.empty-state') || null;
        }
        return this._emptyState;
    }

    /**
     * Get content area element (cached)
     */
    _getContentArea() {
        if (!this._contentArea || !this.dataDisplay?.contains(this._contentArea)) {
            this._contentArea = this.dataDisplay?.querySelector('.data-display-content') || null;
        }
        return this._contentArea;
    }

    /**
     * Show loading state - replaces empty state with loading animation
     */
    showLoading() {
        // Remove empty state if it exists
        const emptyState = this._getEmptyState();
        if (emptyState) {
            emptyState.remove();
            this._emptyState = null;
        }

        // Remove any existing loading state
        const existingLoading = this.dataDisplay.querySelector('.loading-state');
        if (existingLoading) {
            existingLoading.remove();
        }

        // Create loading state using DOM methods
        const loadingState = document.createElement('div');
        loadingState.className = 'loading-state';
        
        const illustration = document.createElement('div');
        illustration.className = 'loading-state-illustration';
        
        const neuralNetwork = document.createElement('div');
        neuralNetwork.className = 'neural-network';
        for (let i = 0; i < 5; i++) {
            const node = document.createElement('div');
            node.className = 'node';
            neuralNetwork.appendChild(node);
        }
        illustration.appendChild(neuralNetwork);
        
        const dots = document.createElement('div');
        dots.className = 'loading-dots';
        
        const subtitle = document.createElement('div');
        subtitle.className = 'loading-subtitle';
        subtitle.textContent = 'Analyzing data';
        
        loadingState.appendChild(illustration);
        loadingState.appendChild(dots);
        loadingState.appendChild(subtitle);
        
        // Insert loading state at the beginning of data display
        this.dataDisplay.insertBefore(loadingState, this.dataDisplay.firstChild);
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
        
        // Batch cards for efficient DOM updates
        const cardsToAdd = new Map(); // Map of competitorName -> array of cards

        // Process items and collect for batch rendering
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
                // Collect cards for batch processing
                const competitorName = processed.competitor_name;
                if (!cardsToAdd.has(competitorName)) {
                    cardsToAdd.set(competitorName, []);
                }
                cardsToAdd.get(competitorName).push(processed);
                renderedCount++;
            }
        });

        // Batch append all cards at once using requestAnimationFrame
        if (cardsToAdd.size > 0) {
            requestAnimationFrame(() => {
                this._batchAddCards(cardsToAdd);
            });
        }

        if (hasProcessedItems) {
            // Remove loading state when data arrives (only once)
            this.hideLoading();

            // Remove empty state when any data is added (text cards or video analysis)
            const emptyState = this._getEmptyState();
            if (emptyState) {
                emptyState.remove();
                this._emptyState = null;
            }
            
            // Invalidate stats cache when data changes
            this._statsCacheValid = false;
        }

        return this.getStats();
    }

    /**
     * Batch add multiple cards efficiently using DocumentFragment
     */
    _batchAddCards(cardsToAdd) {
        const grid = this.getOrCreateGrid();
        if (!grid) return;

        // Track new cards and competitors for stats
        let newCardCount = 0;
        const newCompetitors = new Set();

        // Process each competitor's cards
        cardsToAdd.forEach((cards, competitorName) => {
            // Find or create column
            let column = grid.querySelector(`[data-competitor="${CSS.escape(competitorName)}"]`);

            if (!column) {
                column = document.createElement('div');
                column.className = 'competitor-column';
                column.setAttribute('data-competitor', competitorName);
                grid.appendChild(column);
                newCompetitors.add(competitorName);
            }

            // Use DocumentFragment to batch append cards
            const fragment = document.createDocumentFragment();
            
            cards.forEach(data => {
                const card = this.cardBuilder.build(data);
                // Add lazy loading to images
                this._addLazyLoading(card);
                fragment.appendChild(card);
                newCardCount++;
            });

            // Single append operation for all cards
            column.appendChild(fragment);
        });

        // Update cached counts incrementally
        this._cardCount += newCardCount;
        newCompetitors.forEach(name => this._competitorNames.add(name));

        // Invalidate CardMatcher cache
        CardMatcher.invalidateCache();

        // Invalidate stats cache after batch
        this._statsCacheValid = false;
    }

    /**
     * Add lazy loading to images in a card
     */
    _addLazyLoading(card) {
        // Initialize Intersection Observer if not exists
        if ('IntersectionObserver' in window && !this._imageObserver) {
            this._imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        this._imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }

        // Ensure all images have lazy loading attribute
        const images = card.querySelectorAll('img');
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
        });
    }

  addTextCard(data) {
      // This method is kept for backward compatibility
      // But now uses batching internally for better performance
      const cardsToAdd = new Map();
      cardsToAdd.set(data.competitor_name, [data]);
      
      requestAnimationFrame(() => {
          this._batchAddCards(cardsToAdd);
      });
      
      // Remove loading state when adding cards (only once)
      this.hideLoading();

      // ALWAYS remove empty state when adding a card
      const emptyState = this._getEmptyState();
      if (emptyState) {
          emptyState.remove();
          this._emptyState = null;
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
        const contentArea = this._getContentArea();
        if (!contentArea) {
            return null;
        }

        // Use cached grid if it exists and is still in DOM
        if (this._grid && contentArea.contains(this._grid)) {
            return this._grid;
        }

        // Try to find existing grid
        let grid = contentArea.querySelector('.card-grid');

        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'card-grid';
            contentArea.appendChild(grid);
        }

        // Cache the grid
        this._grid = grid;
        return grid;
    }

    getStats() {
        // Return cached stats if valid
        if (this._statsCacheValid && this._statsCache !== null) {
            return this._statsCache;
        }

        // Use cached counts if available and valid
        if (this._cardCount > 0 && this._competitorNames.size > 0) {
            const stats = {
                competitorCards: this._competitorNames.size,
                adsCount: this._cardCount
            };
            this._statsCache = stats;
            this._statsCacheValid = true;
            return stats;
        }

        // Fallback: calculate stats (only if cache is empty)
        const cards = this.dataDisplay.querySelectorAll('.card');
        const names = new Set();

        cards.forEach(card => {
            const link = card.querySelector('.name-row a');
            if (link?.textContent) {
                names.add(link.textContent.trim());
            }
        });

        // Update cached counts
        this._cardCount = cards.length;
        this._competitorNames = names;

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
           const contentArea = this._getContentArea();
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

               // Clear content safely
               while (contentArea.firstChild) {
                   contentArea.removeChild(contentArea.firstChild);
               }
               contentArea.classList.remove('has-data');
               // Invalidate grid cache since content was cleared
               this._grid = null;
           }

           // Remove loading state if it exists
           this.hideLoading();

           // Handle empty state based on parameter
           const emptyState = this._getEmptyState();
           if (showEmptyState) {
               // Show empty state if it doesn't exist
               if (!emptyState) {
                   // Parse empty state template safely
                   const parser = new DOMParser();
                   const emptyStateDoc = parser.parseFromString(this.getEmptyStateTemplate(), 'text/html');
                   const emptyStateElement = emptyStateDoc.body.firstChild;
                   if (emptyStateElement) {
                       this.dataDisplay.insertBefore(emptyStateElement.cloneNode(true), this.dataDisplay.firstChild);
                   }
                   // Refresh cache after adding empty state
                   this._refreshCachedElements();
               } else {
                   emptyState.style.display = '';
               }
           } else {
               // Remove the empty state if it exists
               if (emptyState) {
                   emptyState.remove();
                   this._emptyState = null;
               }
           }
           
           // Reset cached counts
           this._cardCount = 0;
           this._competitorNames.clear();
           
           // Invalidate CardMatcher cache
           CardMatcher.invalidateCache();
           
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