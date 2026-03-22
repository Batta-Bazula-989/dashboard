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
        // ✅ PRIORITY 1: Use matching_key (contains ad_uuid) if available (most reliable)
        // For analysis types (carousel/image), prefix the key so they don't collide with
        // the text card's entry in _processedItemIds (which uses the bare matching_key).
        if (processed.matching_key) {
            if (processed.content_type === 'carousel') {
                return `carousel_analysis_${processed.matching_key}`;
            }
            if (processed.content_type === 'image') {
                return `image_analysis_${processed.matching_key}`;
            }
            if (processed.content_type === 'video') {
                return `video_analysis_${processed.matching_key}`;
            }
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

    // Filter cards by display_format compatibility with the analysis type.
    // Falls back to DOM element check if display_format was not stored on the card.
    _filterCardsByFormat(cards, analysisType) {
        const VIDEO_FORMATS = ['VIDEO'];
        const MULTI_FORMATS = ['CAROUSEL', 'MULTI_IMAGES', 'DPA', 'DCO'];

        return cards.filter(card => {
            const fmt = card.dataset.displayFormat;
            if (analysisType === 'video') {
                return fmt ? VIDEO_FORMATS.includes(fmt) : !!card.querySelector('video.video-thumb');
            }
            // image or carousel analysis — must not be a video card
            return fmt ? !VIDEO_FORMATS.includes(fmt) : !card.querySelector('video.video-thumb');
        });
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

            // Skip if already processed (applies to ALL content types including video)
            if (this._processedItemIds.has(itemId)) {
                console.warn('🚫 DUPLICATE DETECTED - Skipping:', {
                    itemId,
                    competitor: processed.competitor_name,
                    ad_uuid: processed.matching_key,
                    content_type: processed.content_type,
                    display_format: processed.display_format
                });
                return;
            }

            this._processedItemIds.add(itemId);
            hasProcessedItems = true;

            // ✅ Route video analysis early (after duplicate check)
            if (processed.content_type === 'video') {
                this.addVideoAnalysis(processed);
                return;
            }

            console.log('✅ NEW ITEM - Creating card:', {
                itemId,
                competitor: processed.competitor_name,
                ad_uuid: processed.matching_key
            });

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
                console.log('📇 Created card:', {
                    competitor: data.competitor_name,
                    ad_uuid: data.matching_key
                });
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
        // If it has images/cards arrays, this is ORIGINAL data — return FALSE
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
         if (!videoData || !videoData.competitor_name) {
             console.warn('Invalid video data - missing competitor_name:', videoData);
             return;
         }

         console.log('🎥 VIDEO ANALYSIS INCOMING:', {
             competitor: videoData.competitor_name,
             matching_key: videoData.matching_key,
             body_preview: (videoData.body || videoData.text_for_analysis || '').substring(0, 60)
         });

         // UUID match: authoritative — skip format filter, UUID already identifies the exact card.
         const uuidCards = videoData.matching_key
             ? CardMatcher.findAll(this.dataDisplay, videoData.competitor_name, null, videoData.matching_key)
             : [];

         console.log('🎥 UUID match result:', uuidCards.length, 'cards found for key:', videoData.matching_key);
         uuidCards.forEach(c => console.log('  → card uuid:', c.dataset.matchingKey, '| name:', c.querySelector('.name-row a')?.textContent?.trim()));

         let videoCards;
         if (uuidCards.length > 0) {
             // UUID found — trust it, no format filter needed.
             videoCards = uuidCards;
         } else if (videoData.matching_key) {
             // UUID provided but card not in DOM yet — store pending, don't text-fallback
             // (text fallback could match a different ad for the same competitor).
             console.warn('⚠️ Video UUID miss, storing as pending:', videoData.competitor_name);
             this._storePendingVideoAnalysis(videoData);
             return;
         } else {
             // No UUID — use text fallback with format filter.
             console.warn('🎥 No UUID — using text fallback for:', videoData.competitor_name);
             const text = videoData.text_for_analysis || videoData.ad_data?.ad_text || videoData.body || '';
             const textCards = text
                 ? CardMatcher.findAll(this.dataDisplay, videoData.competitor_name, text)
                 : [];
             videoCards = this._filterCardsByFormat(textCards, 'video');
             console.log('🎥 Text fallback found:', videoCards.length, 'cards after format filter');
         }

         videoCards.forEach((card) => {
             if (card.querySelector('.video-analysis-section')) return;
             console.log('🎥 Attaching video to card:', card.dataset.matchingKey, '|', card.querySelector('.name-row a')?.textContent?.trim());
             const section = AnalysisSections.createVideoAnalysis(videoData, this.onShowFullAnalysis);
             const divider = document.createElement('div');
             divider.className = 'section-divider';
             card.appendChild(divider);
             card.appendChild(section);
         });

         this._statsCacheValid = false;

         if (videoCards.length === 0) {
             console.warn('⚠️ Video not matched, storing as pending:', videoData.competitor_name);
             this._storePendingVideoAnalysis(videoData);
         } else {
             console.log('✅ Video attached to', videoCards.length, 'card(s)');
         }
     } catch (error) {
         console.error('Error in addVideoAnalysis:', error, videoData);
     }
 }

    // Store video analysis that couldn't be attached yet (cards not rendered)
    _storePendingVideoAnalysis(videoData) {
        videoData._pendingRetries = 0;
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
            // UUID match: authoritative, no format filter.
            const uuidCards = videoData.matching_key
                ? CardMatcher.findAll(this.dataDisplay, videoData.competitor_name, null, videoData.matching_key)
                : [];

            let videoCards;
            if (uuidCards.length > 0) {
                videoCards = uuidCards;
            } else if (videoData.matching_key) {
                // UUID provided but still not in DOM — keep pending.
                videoData._pendingRetries = (videoData._pendingRetries || 0) + 1;
                if (videoData._pendingRetries < 10) stillPending.push(videoData);
                else console.warn('⏱️ Video analysis dropped after max retries:', videoData.competitor_name);
                return;
            } else {
                // No UUID — text fallback with format filter.
                const text = videoData.text_for_analysis || videoData.ad_data?.ad_text || videoData.body || '';
                const textCards = text
                    ? CardMatcher.findAll(this.dataDisplay, videoData.competitor_name, text)
                    : [];
                videoCards = this._filterCardsByFormat(textCards, 'video');
            }

            if (videoCards.length > 0) {
                videoCards.forEach((card) => {
                    if (card.querySelector('.video-analysis-section')) return;
                    const section = AnalysisSections.createVideoAnalysis(videoData, this.onShowFullAnalysis);
                    const divider = document.createElement('div');
                    divider.className = 'section-divider';
                    card.appendChild(divider);
                    card.appendChild(section);
                });
            } else {
                videoData._pendingRetries = (videoData._pendingRetries || 0) + 1;
                if (videoData._pendingRetries < 10) stillPending.push(videoData);
                else console.warn('⏱️ Video analysis dropped after max retries:', videoData.competitor_name);
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
    if (!carouselData.ai_analysis || Object.keys(carouselData.ai_analysis).length === 0) return;

    // UUID match: authoritative, no format filter.
    const uuidCards = carouselData.matching_key
        ? CardMatcher.findAll(this.dataDisplay, carouselData.competitor_name, null, carouselData.matching_key)
        : [];

    let carouselCards;
    if (uuidCards.length > 0) {
        carouselCards = uuidCards;
    } else if (carouselData.matching_key) {
        // UUID provided but card not in DOM yet — store pending, don't text-fallback.
        this._storePendingCarouselAnalysis(carouselData);
        return;
    } else {
        // No UUID — text fallback with format filter.
        const text = carouselData.text_for_analysis || carouselData.ad_data?.ad_text || carouselData.body || '';
        const textCards = text
            ? CardMatcher.findAll(this.dataDisplay, carouselData.competitor_name, text)
            : [];
        carouselCards = this._filterCardsByFormat(textCards, 'carousel');
    }

    carouselCards.forEach((card) => {
        if (card.querySelector('.carousel-analysis-section')) return;
        const section = AnalysisSections.createCarouselAnalysis(carouselData, this.onShowFullAnalysis);
        const textSection = card.querySelector('.ai-preview');
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        if (textSection) {
            textSection.insertAdjacentElement('afterend', divider);
            divider.insertAdjacentElement('afterend', section);
        } else {
            card.appendChild(divider);
            card.appendChild(section);
        }
    });

    this._statsCacheValid = false;

    if (carouselCards.length === 0) {
        this._storePendingCarouselAnalysis(carouselData);
    }
}

addImageAnalysis(imageData) {
    if (!imageData.ai_analysis || Object.keys(imageData.ai_analysis).length === 0) return;

    // UUID match: authoritative, no format filter.
    const uuidCards = imageData.matching_key
        ? CardMatcher.findAll(this.dataDisplay, imageData.competitor_name, null, imageData.matching_key)
        : [];

    let imageCards;
    if (uuidCards.length > 0) {
        imageCards = uuidCards;
    } else if (imageData.matching_key) {
        // UUID provided but card not in DOM yet — store pending, don't text-fallback.
        this._storePendingImageAnalysis(imageData);
        return;
    } else {
        // No UUID — text fallback with format filter.
        const text = imageData.text_for_analysis || imageData.ad_data?.ad_text || imageData.body || '';
        const textCards = text
            ? CardMatcher.findAll(this.dataDisplay, imageData.competitor_name, text)
            : [];
        imageCards = this._filterCardsByFormat(textCards, 'image');
    }

    imageCards.forEach((card) => {
        if (card.querySelector('.image-analysis-section')) return;
        const section = AnalysisSections.createImageAnalysis(imageData, this.onShowFullAnalysis);
        const textSection = card.querySelector('.ai-preview');
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        if (textSection) {
            textSection.insertAdjacentElement('afterend', divider);
            divider.insertAdjacentElement('afterend', section);
        } else {
            card.appendChild(divider);
            card.appendChild(section);
        }
    });

    this._statsCacheValid = false;

    if (imageCards.length === 0) {
        this._storePendingImageAnalysis(imageData);
    }
}

// Store image analysis that couldn't be attached yet (cards not rendered)
_storePendingImageAnalysis(imageData) {
    imageData._pendingRetries = 0;
    this._pendingImageAnalysis.push(imageData);

    // Retry attaching after a short delay to allow cards to be rendered
    setTimeout(() => {
        this._retryPendingImageAnalysis();
    }, 500);
}

// Retry attaching pending image analysis to newly rendered cards
_retryPendingImageAnalysis() {
    if (this._pendingImageAnalysis.length === 0) return;

    const stillPending = [];

    this._pendingImageAnalysis.forEach(imageData => {
        // UUID match: authoritative, no format filter.
        const uuidCards = imageData.matching_key
            ? CardMatcher.findAll(this.dataDisplay, imageData.competitor_name, null, imageData.matching_key)
            : [];

        let imageCards;
        if (uuidCards.length > 0) {
            imageCards = uuidCards;
        } else if (imageData.matching_key) {
            // UUID provided but still not in DOM — keep pending.
            imageData._pendingRetries = (imageData._pendingRetries || 0) + 1;
            if (imageData._pendingRetries < 10) stillPending.push(imageData);
            else console.warn('⏱️ Image analysis dropped after max retries:', imageData.competitor_name);
            return;
        } else {
            // No UUID — text fallback with format filter.
            const text = imageData.text_for_analysis || imageData.ad_data?.ad_text || imageData.body || '';
            const textCards = text
                ? CardMatcher.findAll(this.dataDisplay, imageData.competitor_name, text)
                : [];
            imageCards = this._filterCardsByFormat(textCards, 'image');
        }

        if (imageCards.length > 0) {
            imageCards.forEach((card) => {
                if (card.querySelector('.image-analysis-section')) return;
                const section = AnalysisSections.createImageAnalysis(imageData, this.onShowFullAnalysis);
                const textSection = card.querySelector('.ai-preview');
                const divider = document.createElement('div');
                divider.className = 'section-divider';
                if (textSection) {
                    textSection.insertAdjacentElement('afterend', divider);
                    divider.insertAdjacentElement('afterend', section);
                } else {
                    card.appendChild(divider);
                    card.appendChild(section);
                }
            });
        } else {
            imageData._pendingRetries = (imageData._pendingRetries || 0) + 1;
            if (imageData._pendingRetries < 10) stillPending.push(imageData);
            else console.warn('⏱️ Image analysis dropped after max retries:', imageData.competitor_name);
        }
    });

    this._pendingImageAnalysis = stillPending;
    if (stillPending.length > 0) {
        setTimeout(() => this._retryPendingImageAnalysis(), 1000);
    }
}

// Store carousel analysis that couldn't be attached yet (cards not rendered)
_storePendingCarouselAnalysis(carouselData) {
    carouselData._pendingRetries = 0;
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
        // UUID match: authoritative, no format filter.
        const uuidCards = carouselData.matching_key
            ? CardMatcher.findAll(this.dataDisplay, carouselData.competitor_name, null, carouselData.matching_key)
            : [];

        let carouselCards;
        if (uuidCards.length > 0) {
            carouselCards = uuidCards;
        } else if (carouselData.matching_key) {
            // UUID provided but still not in DOM — keep pending.
            carouselData._pendingRetries = (carouselData._pendingRetries || 0) + 1;
            if (carouselData._pendingRetries < 10) stillPending.push(carouselData);
            else console.warn('⏱️ Carousel analysis dropped after max retries:', carouselData.competitor_name);
            return;
        } else {
            // No UUID — text fallback with format filter.
            const text = carouselData.text_for_analysis || carouselData.ad_data?.ad_text || carouselData.body || '';
            const textCards = text
                ? CardMatcher.findAll(this.dataDisplay, carouselData.competitor_name, text)
                : [];
            carouselCards = this._filterCardsByFormat(textCards, 'carousel');
        }

        if (carouselCards.length > 0) {
            carouselCards.forEach((card) => {
                if (card.querySelector('.carousel-analysis-section')) return;
                const section = AnalysisSections.createCarouselAnalysis(carouselData, this.onShowFullAnalysis);
                const textSection = card.querySelector('.ai-preview');
                const divider = document.createElement('div');
                divider.className = 'section-divider';
                if (textSection) {
                    textSection.insertAdjacentElement('afterend', divider);
                    divider.insertAdjacentElement('afterend', section);
                } else {
                    card.appendChild(divider);
                    card.appendChild(section);
                }
            });
        } else {
            carouselData._pendingRetries = (carouselData._pendingRetries || 0) + 1;
            if (carouselData._pendingRetries < 10) stillPending.push(carouselData);
            else console.warn('⏱️ Carousel analysis dropped after max retries:', carouselData.competitor_name);
        }
    });

    this._pendingCarouselAnalysis = stillPending;
    if (stillPending.length > 0) {
        setTimeout(() => this._retryPendingCarouselAnalysis(), 1000);
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