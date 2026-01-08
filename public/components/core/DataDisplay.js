class DataDisplay {
    constructor() {
        this.dataDisplay = null;
        this.onShowFullAnalysis = null;
        this.cardBuilder = null;
        this._statsCache = null;
        this._statsCacheValid = false;
        this._emptyState = null;
        this._contentArea = null;
        this._grid = null;
        this._cardCount = 0;
        this._competitorNames = new Set();
        this._competitorColumns = new Map(); // Cache competitor columns for faster lookups
        this._pendingVideoAnalysis = []; // Store video analysis that couldn't be attached yet
        this._pendingImageAnalysis = []; // Store image analysis that couldn't be attached yet
        this._pendingCarouselAnalysis = []; // Store carousel analysis that couldn't be attached yet
        this._processedItemIds = new Set(); // Track processed items to prevent duplicates
    }

    init(container, onShowFullAnalysis = null) {
        this.onShowFullAnalysis = onShowFullAnalysis;
        this.cardBuilder = new CardBuilder(onShowFullAnalysis);
        this.render(container);
        this.bindElements();
    }

     // Render the data display HTML

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
                <p class="empty-state-description">Enter brand names and click <span class="highlight">GO</span> to discover their advertising strategies and performance metrics</p>
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

     // Refresh cached DOM element references

    _refreshCachedElements() {
        if (this.dataDisplay) {
            this._emptyState = this.dataDisplay.querySelector('.empty-state');
            this._contentArea = this.dataDisplay.querySelector('.data-display-content');
            this._grid = this._contentArea?.querySelector('.card-grid') || null;
        }
    }

     // Get empty state element (cached)

    _getEmptyState() {
        if (!this._emptyState || !this.dataDisplay.contains(this._emptyState)) {
            this._emptyState = this.dataDisplay?.querySelector('.empty-state') || null;
        }
        return this._emptyState;
    }

     // Get content area element (cached)

    _getContentArea() {
        if (!this._contentArea || !this.dataDisplay?.contains(this._contentArea)) {
            this._contentArea = this.dataDisplay?.querySelector('.data-display-content') || null;
        }
        return this._contentArea;
    }

     // Show loading state - replaces empty state with loading animation

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
        
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'loader-container';
        
        for (let i = 0; i < 8; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            loaderContainer.appendChild(dot);
        }
        
        const loadingText = document.createElement('div');
        loadingText.className = 'loading-text';
        loadingText.textContent = 'Fetching ads';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);
        
        loadingState.appendChild(loaderContainer);
        loadingState.appendChild(loadingText);
        loadingState.appendChild(progressBar);
        
        // Insert loading state at the beginning of data display
        this.dataDisplay.insertBefore(loadingState, this.dataDisplay.firstChild);
    }

     // Hide loading state

    hideLoading() {
        const loadingState = this.dataDisplay.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }

    // Generate unique ID for an item to prevent duplicates
    _generateItemId(processed) {
        // ✅ PRIORITY 1: Use matching_key if available (most reliable)
        if (processed.matching_key) {
            return processed.matching_key;
        }

        // For video content, use video_id if available
        if (processed.content_type === 'video' && processed.video_data?.video_id) {
            return `video_${processed.video_data.video_id}`;
        }

        // For carousel content, use competitor name + first image URL
        if (processed.content_type === 'carousel' && processed.ad_data?.images?.[0]) {
            const firstImageUrl = processed.ad_data.images[0].original_image_url ||
                                 processed.ad_data.images[0].resized_image_url || '';
            return `carousel_${processed.competitor_name}_${this._simpleHash(firstImageUrl)}`;
        }

        // For image content, use competitor name + first image URL + analysis suffix
        if (processed.content_type === 'image' && processed.ad_data?.images?.[0]) {
            const firstImageUrl = processed.ad_data.images[0].original_image_url ||
                                 processed.ad_data.images[0].resized_image_url || '';
            return `image_${processed.competitor_name}_${this._simpleHash(firstImageUrl)}_analysis`;
        }

        // For text or other content, use competitor name + body hash
        return `${processed.content_type}_${processed.competitor_name}_${this._simpleHash(processed.body)}`;
    }

    // Simple hash function for generating IDs
    _simpleHash(str) {
        if (!str) return '0';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

addDataItem(incoming) {
    const payload = incoming?.data || incoming;
    const items = Array.isArray(payload) ? payload : [payload];

    let renderedCount = 0;
    let hasProcessedItems = false;

    const cardsToAdd = new Map();

    items.forEach(item => {
        try {
            const processed = DataProcessor.process(item);
            if (!processed) return;

            const itemId = this._generateItemId(processed);

            // ✅ Special handling for video content
            if (processed.content_type === 'video') {
                // Always call addVideoAnalysis, regardless of whether it's a duplicate
                // The video analysis will attach to the existing card
                this.addVideoAnalysis(processed);
                this._processedItemIds.add(itemId); // Mark as processed to avoid duplicates later
                hasProcessedItems = true;
                return; // Exit early after handling video
            }

            // For non-video content, skip if already processed
            if (this._processedItemIds.has(itemId)) {
                return;
            }

            this._processedItemIds.add(itemId);
            hasProcessedItems = true;

            if (processed.content_type === 'carousel') {
                this.addCarouselAnalysis(processed);
            } else if (processed.content_type === 'image') {
                this.addImageAnalysis(processed);
            } else if (this.hasCarouselData(processed)) {
                this.addCarouselAnalysis(processed);
            } else if (this.hasImageAnalysisData(processed)) {
                this.addImageAnalysis(processed);
            } else {
                const competitorName = processed.competitor_name;
                if (!cardsToAdd.has(competitorName)) {
                    cardsToAdd.set(competitorName, []);
                }
                cardsToAdd.get(competitorName).push(processed);
                renderedCount++;
            }
        } catch (error) {
            console.error('Error processing item:', error, item);
            return; // Skip this item and continue with next
        }
    });

    if (cardsToAdd.size > 0) {
        let newCardCount = 0;
        cardsToAdd.forEach(cards => {
            newCardCount += cards.length;
        });

        this._cardCount += newCardCount;
        cardsToAdd.forEach((cards, competitorName) => {
            this._competitorNames.add(competitorName);
        });

        requestAnimationFrame(() => {
            this._batchAddCards(cardsToAdd);
        });
    }

    if (hasProcessedItems) {
        this.hideLoading();

        const emptyState = this._getEmptyState();
        if (emptyState) {
            emptyState.remove();
            this._emptyState = null;
        }

        this._statsCacheValid = false;
    }

    return this.getStats();
}

    // Batch add multiple cards efficiently using DocumentFragment

    _batchAddCards(cardsToAdd) {
        const grid = this.getOrCreateGrid();
        if (!grid) return;

        // Process each competitor's cards
        cardsToAdd.forEach((cards, competitorName) => {
            // Find or create column using cache
            let column = this._competitorColumns.get(competitorName);

            // Verify cached column is still in DOM
            if (column && !grid.contains(column)) {
                column = null;
                this._competitorColumns.delete(competitorName);
            }

            if (!column) {
                column = document.createElement('div');
                column.className = 'competitor-column';
                column.setAttribute('data-competitor', competitorName);
                grid.appendChild(column);
                this._competitorColumns.set(competitorName, column);
            }

            // Use DocumentFragment to batch append cards
            const fragment = document.createDocumentFragment();

            cards.forEach(data => {
                const card = this.cardBuilder.build(data);
                // Add lazy loading to images
                this._addLazyLoading(card);
                fragment.appendChild(card);
            });

            // Single append operation for all cards
            column.appendChild(fragment);
        });

        // Invalidate CardMatcher cache after DOM updates
        // Note: Stats counts are already updated synchronously in addDataItem
        CardMatcher.invalidateCache();

        // Retry attaching pending video analysis after cards are added
        if (this._pendingVideoAnalysis.length > 0) {
            requestAnimationFrame(() => {
                this._retryPendingVideoAnalysis();
            });
        }

        // Retry attaching pending image analysis after cards are added
        if (this._pendingImageAnalysis.length > 0) {
            requestAnimationFrame(() => {
                this._retryPendingImageAnalysis();
            });
        }

        // Retry attaching pending carousel analysis after cards are added
        if (this._pendingCarouselAnalysis.length > 0) {
            requestAnimationFrame(() => {
                this._retryPendingCarouselAnalysis();
            });
        }
    }

    // Add lazy loading to images in a card

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

    hasImageAnalysisData(processed) {
        // ONLY treat as image analysis if:
        // 1. Has AI analysis
        // 2. Has body for matching
        // 3. A matching card ALREADY EXISTS in the DOM
        // This prevents treating original data as image analysis

        const hasAnalysis = processed.ai_analysis && Object.keys(processed.ai_analysis).length > 0;
        const hasBody = processed.body || processed.text_for_analysis;
        const hasNoVideos = !processed.video_data && (!processed.ad_data?.videos || processed.ad_data.videos.length === 0);
        const hasExactlyOneImage = processed.ad_data?.images &&
                                   Array.isArray(processed.ad_data.images) &&
                                   processed.ad_data.images.length === 1;

        // Don't even check if basic conditions aren't met
        if (!hasAnalysis || !hasBody || !hasNoVideos || !hasExactlyOneImage) {
            return false;
        }

        // CRITICAL: Check if a matching card already exists
        // If no card exists, this is original data - should create a card
        if (!this.dataDisplay) {
            return false;
        }

        // Use same text priority as CardBuilder for matching
        const matchText = processed.text_for_analysis || processed.ad_data?.ad_text || processed.body || '';
        const existingCards = CardMatcher.findAll(
            this.dataDisplay,
            processed.competitor_name,
            matchText
        );

        // Only treat as image analysis if a matching card EXISTS
        return existingCards.length > 0;
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
     try {
         // Validate required fields
         if (!videoData || !videoData.competitor_name) {
             console.warn('Invalid video data - missing competitor_name:', videoData);
             return;
         }

         let existingCards = [];
         let matchedByKey = false; // Track if we matched by matching_key

         // ✅ Strategy 0: Match by matching_key (MOST RELIABLE)
         if (videoData.matching_key) {
             existingCards = CardMatcher.findAll(
                 this.dataDisplay,
                 videoData.competitor_name,
                 null,
                 videoData.matching_key
             );
             if (existingCards.length > 0) {
                 matchedByKey = true; // Mark that we matched by key
             }
         }

         // Strategy 1-3: Fallback text matching (same as before)
         if (existingCards.length === 0 && videoData.body) {
             existingCards = CardMatcher.findAll(
                 this.dataDisplay,
                 videoData.competitor_name,
                 videoData.body
             );
         }

         if (existingCards.length === 0 && videoData.text_for_analysis) {
             existingCards = CardMatcher.findAll(
                 this.dataDisplay,
                 videoData.competitor_name,
                 videoData.text_for_analysis
             );
         }

         if (existingCards.length === 0 && videoData.ad_data?.ad_text) {
             existingCards = CardMatcher.findAll(
                 this.dataDisplay,
                 videoData.competitor_name,
                 videoData.ad_data.ad_text
             );
         }

         // Strategy 4: Last resort - name only + video filter
         if (existingCards.length === 0) {
             const nameOnlyCards = CardMatcher.findAll(
                 this.dataDisplay,
                 videoData.competitor_name,
                 null
             );
             existingCards = nameOnlyCards.filter(card => {
                 return card.querySelector('video.video-thumb') !== null;
             });
         }

         // ✅ ONLY filter for video elements if we DIDN'T match by matching_key
         if (!matchedByKey) {
             existingCards = existingCards.filter(card => {
                 return card.querySelector('video.video-thumb') !== null;
             });
         }

         existingCards.forEach((card) => {
             try {
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
             } catch (error) {
                 console.error('Error attaching video analysis to card:', error, videoData);
             }
         });

         this._statsCacheValid = false;

         if (existingCards.length === 0) {
             this._storePendingVideoAnalysis(videoData);
         }
     } catch (error) {
         console.error('Error in addVideoAnalysis:', error, videoData);
     }
 }

    // Store video analysis that couldn't be attached yet (cards not rendered)
    _storePendingVideoAnalysis(videoData) {
        this._pendingVideoAnalysis.push(videoData);
        
        // Retry attaching after a short delay to allow cards to be rendered
        setTimeout(() => {
            this._retryPendingVideoAnalysis();
        }, 500);
    }

    // Retry attaching pending video analysis to newly rendered cards
    _retryPendingVideoAnalysis() {
        if (this._pendingVideoAnalysis.length === 0) {
            return;
        }
        
        const stillPending = [];
        
        this._pendingVideoAnalysis.forEach(videoData => {
            // Try to attach again - use matching_key for reliable matching
            let existingCards = CardMatcher.findAll(
                this.dataDisplay,
                videoData.competitor_name,
                videoData.body || videoData.text_for_analysis || videoData.ad_data?.ad_text,
                videoData.matching_key
            );
            let matchedByKey = existingCards.length > 0 && videoData.matching_key;
            
            // If still no match, try by name only with video element
            let matchedCards = existingCards;
            if (matchedCards.length === 0) {
                const nameOnlyCards = CardMatcher.findAll(
                    this.dataDisplay,
                    videoData.competitor_name,
                    null
                );
                matchedCards = nameOnlyCards.filter(card => {
                    return card.querySelector('video.video-thumb') !== null;
                });
            }

            // ✅ ONLY filter for video elements if we DIDN'T match by matching_key
            if (!matchedByKey) {
                matchedCards = matchedCards.filter(card => {
                    return card.querySelector('video.video-thumb') !== null;
                });
            }

            if (matchedCards.length > 0) {
                // Found cards, attach video analysis
                matchedCards.forEach((card) => {
                    const hasVideoAnalysis = card.querySelector('.video-analysis-section');
                    if (!hasVideoAnalysis) {
                        const section = AnalysisSections.createVideoAnalysis(
                            videoData,
                            this.onShowFullAnalysis
                        );
                        const divider = document.createElement('div');
                        divider.className = 'section-divider';
                        card.appendChild(divider);
                        card.appendChild(section);
                    }
                });
            } else {
                // Still no match, keep it pending (but limit retries)
                stillPending.push(videoData);
            }
        });
        
        this._pendingVideoAnalysis = stillPending;
        
        // If there are still pending items and we have cards, try one more time after a delay
        if (stillPending.length > 0 && this.hasData()) {
            setTimeout(() => {
                this._retryPendingVideoAnalysis();
            }, 1000);
        }
    }

addCarouselAnalysis(carouselData) {
    // Only add analysis if ai_analysis is available
    if (!carouselData.ai_analysis || Object.keys(carouselData.ai_analysis).length === 0) {
        return;
    }

    // Match by text_for_analysis first (same priority as CardBuilder)
    const matchText = carouselData.text_for_analysis || carouselData.ad_data?.ad_text || carouselData.body || '';

    if (!matchText) {
        return;
    }

    // Match by competitor name + body text
    let existingCards = CardMatcher.findAll(
        this.dataDisplay,
        carouselData.competitor_name,
        matchText
    );

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
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            card.appendChild(divider);
            card.appendChild(section);
        }
    });

    // Invalidate stats cache when analysis is added
    this._statsCacheValid = false;

    // If no cards found, store for retry after cards are rendered
    if (existingCards.length === 0) {
        this._storePendingCarouselAnalysis(carouselData);
    }
}

addImageAnalysis(imageData) {
    // Only add analysis if ai_analysis is available
    if (!imageData.ai_analysis || Object.keys(imageData.ai_analysis).length === 0) {
        return;
    }

    // Match by text_for_analysis first (same priority as CardBuilder uses for display)
    // This ensures we match against the same text that's shown in the card
    const matchText = imageData.text_for_analysis || imageData.ad_data?.ad_text || imageData.body || '';

    if (!matchText) {
        return;
    }

    // Match by competitor name + body text
    let existingCards = CardMatcher.findAll(
        this.dataDisplay,
        imageData.competitor_name,
        matchText
    );

    existingCards.forEach((card) => {
        // Check if this card already has image analysis (check for IMAGE badge)
        const allPreviews = card.querySelectorAll('.ai-preview');
        let hasImageAnalysis = false;
        allPreviews.forEach(preview => {
            const badge = preview.querySelector('.analysis-badge');
            if (badge && badge.textContent === 'IMAGE') {
                hasImageAnalysis = true;
            }
        });

        if (hasImageAnalysis) {
            return;
        }

        const section = AnalysisSections.createImageAnalysis(
            imageData,
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
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            card.appendChild(divider);
            card.appendChild(section);
        }
    });

    // Invalidate stats cache when analysis is added
    this._statsCacheValid = false;

    // If no cards found, store for retry after cards are rendered
    if (existingCards.length === 0) {
        this._storePendingImageAnalysis(imageData);
    }
}

// Store image analysis that couldn't be attached yet (cards not rendered)
_storePendingImageAnalysis(imageData) {
    this._pendingImageAnalysis.push(imageData);

    // Retry attaching after a short delay to allow cards to be rendered
    setTimeout(() => {
        this._retryPendingImageAnalysis();
    }, 500);
}

// Retry attaching pending image analysis to newly rendered cards
_retryPendingImageAnalysis() {
    if (this._pendingImageAnalysis.length === 0) {
        return;
    }

    const stillPending = [];

    this._pendingImageAnalysis.forEach(imageData => {
        // Try to attach again - use same text priority as CardBuilder
        const matchText = imageData.text_for_analysis || imageData.ad_data?.ad_text || imageData.body || '';
        const existingCards = CardMatcher.findAll(
            this.dataDisplay,
            imageData.competitor_name,
            matchText
        );

        if (existingCards.length > 0) {
            // Found cards, attach image analysis
            existingCards.forEach((card) => {
                // Check if this card already has image analysis (check for IMAGE badge)
                const allPreviews = card.querySelectorAll('.ai-preview');
                let hasImageAnalysis = false;
                allPreviews.forEach(preview => {
                    const badge = preview.querySelector('.analysis-badge');
                    if (badge && badge.textContent === 'IMAGE') {
                        hasImageAnalysis = true;
                    }
                });

                if (!hasImageAnalysis) {
                    const section = AnalysisSections.createImageAnalysis(
                        imageData,
                        this.onShowFullAnalysis
                    );
                    const textAnalysisSection = card.querySelector('.ai-preview');

                    if (textAnalysisSection) {
                        const divider = document.createElement('div');
                        divider.className = 'section-divider';
                        textAnalysisSection.insertAdjacentElement('afterend', divider);
                        divider.insertAdjacentElement('afterend', section);
                    } else {
                        const divider = document.createElement('div');
                        divider.className = 'section-divider';
                        card.appendChild(divider);
                        card.appendChild(section);
                    }
                }
            });
        } else {
            // Still no match, keep pending
            stillPending.push(imageData);
        }
    });

    // Update pending list and retry again if needed
    this._pendingImageAnalysis = stillPending;
    if (stillPending.length > 0) {
        setTimeout(() => {
            this._retryPendingImageAnalysis();
        }, 1000);
    }
}

// Store carousel analysis that couldn't be attached yet (cards not rendered)
_storePendingCarouselAnalysis(carouselData) {
    this._pendingCarouselAnalysis.push(carouselData);

    // Retry attaching after a short delay to allow cards to be rendered
    setTimeout(() => {
        this._retryPendingCarouselAnalysis();
    }, 500);
}

// Retry attaching pending carousel analysis to newly rendered cards
_retryPendingCarouselAnalysis() {
    if (this._pendingCarouselAnalysis.length === 0) {
        return;
    }

    const stillPending = [];

    this._pendingCarouselAnalysis.forEach(carouselData => {
        // Try to attach again - use same text priority as CardBuilder
        const matchText = carouselData.text_for_analysis || carouselData.ad_data?.ad_text || carouselData.body || '';
        const existingCards = CardMatcher.findAll(
            this.dataDisplay,
            carouselData.competitor_name,
            matchText
        );

        if (existingCards.length > 0) {
            // Found cards, attach carousel analysis
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
                const textAnalysisSection = card.querySelector('.ai-preview');

                if (textAnalysisSection) {
                    const divider = document.createElement('div');
                    divider.className = 'section-divider';
                    textAnalysisSection.insertAdjacentElement('afterend', divider);
                    divider.insertAdjacentElement('afterend', section);
                } else {
                    const divider = document.createElement('div');
                    divider.className = 'section-divider';
                    card.appendChild(divider);
                    card.appendChild(section);
                }
            });
        } else {
            // Still no match, keep pending
            stillPending.push(carouselData);
        }
    });

    // Update pending list and retry again if needed
    this._pendingCarouselAnalysis = stillPending;
    if (stillPending.length > 0) {
        setTimeout(() => {
            this._retryPendingCarouselAnalysis();
        }, 1000);
    }
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

    // Clear all data from the display

   clear(showEmptyState = false) {
       if (this.dataDisplay) {
           // Clear only the content area
           const contentArea = this._getContentArea();
           if (contentArea) {
               // Clean up carousel event listeners before removing DOM
               const carousels = contentArea.querySelectorAll('.image-carousel');
               carousels.forEach(carousel => {
                   if (carousel._carouselCleanup && typeof carousel._carouselCleanup === 'function') {
                       try {
                           carousel._carouselCleanup();
                       } catch (cleanupError) {
                           // Silently handle cleanup errors
                       }
                   }
               });
               
               // Ensure any playing videos are fully released
               const videos = contentArea.querySelectorAll('video');
               videos.forEach(video => {
                   try {
                       video.pause();
                       video.src = '';  // Set to empty string to release buffers
                       video.load();    // Now this properly releases video buffers

                       // Remove source elements
                       while (video.firstChild) {
                           video.removeChild(video.firstChild);
                       }
                   } catch (releaseError) {
                       // Silently handle video release errors
                   }
               });

               // Clear content safely
               while (contentArea.firstChild) {
                   contentArea.removeChild(contentArea.firstChild);
               }
               contentArea.classList.remove('has-data');
               // Invalidate grid cache since content was cleared
               this._grid = null;
               // Clear column cache since grid was cleared
               this._competitorColumns.clear();
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

           // Clear pending video analysis
           this._pendingVideoAnalysis = [];

           // Clear pending image analysis
           this._pendingImageAnalysis = [];

           // Clear pending carousel analysis
           this._pendingCarouselAnalysis = [];

           // Clear processed item IDs for deduplication
           this._processedItemIds.clear();

           // Disconnect IntersectionObserver to prevent memory leaks
           if (this._imageObserver) {
               this._imageObserver.disconnect();
               this._imageObserver = null;
           }

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