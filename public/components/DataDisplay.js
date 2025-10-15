/**
 * DataDisplay Component
 * Handles the display of competitor data and cards
 */
class DataDisplay {
    constructor() {
        this.dataDisplay = null;
        this.onShowFullAnalysis = null;
    }

    /**
     * Initialize the data display component
     * @param {HTMLElement} container - The container element to render into
     * @param {Function} onShowFullAnalysis - Callback for showing full analysis
     */
    init(container, onShowFullAnalysis = null) {
        this.onShowFullAnalysis = onShowFullAnalysis;
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
                        <img src="/Screenshot_2025-10-04_155150_whitebg_v2.svg" alt="No ads illustration" style="max-width: 500px; height: auto;" />
                    </div>
                    <h3>No ads yet</h3>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', dataDisplayHTML);
    }

    /**
     * Bind DOM elements to component properties
     */
    bindElements() {
        this.dataDisplay = document.getElementById('dataDisplay');
    }

    /**
     * Add data items to the display
     * @param {Object|Array} incoming - Incoming data
     */
    addDataItem(incoming) {
        const timestamp = new Date().toLocaleString();
        const payload = (incoming && typeof incoming === 'object' && 'data' in incoming) ? incoming.data : incoming;

        console.log('=== NEW DATA RECEIVED ===');
        console.log('Timestamp:', timestamp);
        console.log('Raw incoming:', incoming);
        console.log('Payload:', payload);
        console.log('Payload type:', Array.isArray(payload) ? 'array' : typeof payload);
        console.log('Payload length:', Array.isArray(payload) ? payload.length : 1);
        console.log('Request ID:', incoming?.requestId || 'No ID');

        const emptyState = this.dataDisplay.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        // Simplified processing - always use the most robust method
        let renderedCount = 0;
        
        if (Array.isArray(payload)) {
            console.log(`Processing array with ${payload.length} items`);
            renderedCount = this.renderOpenAIResponse(payload);
        } else {
            console.log('Processing single item');
            renderedCount = this.renderOpenAIResponse(payload);
        }

        // Update status - count competitors and ads
        const allCards = this.dataDisplay.querySelectorAll('.card');
        const totalCards = allCards.length;
        
        // Count unique competitor names (business names)
        const competitorNames = new Set();
        allCards.forEach(card => {
            const link = card.querySelector('.title-row a');
            if (link && link.textContent) {
                competitorNames.add(link.textContent.trim());
            }
        });
        const uniqueCompetitors = competitorNames.size;

        console.log(`=== PROCESSING COMPLETE ===`);
        console.log(`Rendered: ${renderedCount} items`);
        console.log(`Total cards (ads): ${totalCards}`);
        console.log(`Unique competitors: ${uniqueCompetitors}`);
        console.log('All competitor names:', Array.from(competitorNames));
        console.log('All cards in DOM:', this.dataDisplay.querySelectorAll('.card').length);
        console.log('Card grid exists:', !!this.dataDisplay.querySelector('.card-grid'));
        console.log('================================');

        // Return stats for parent component to update
        return { competitorCards: uniqueCompetitors, adsCount: totalCards };
    }

    /**
     * Render an array of competitors
     * @param {Array} payload - Array of competitor data
     * @returns {number} Number of items rendered
     */
    renderCompetitorArray(payload) {
        let grid = this.dataDisplay.querySelector('.card-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'card-grid';
            this.dataDisplay.appendChild(grid);
        }
        
        payload.forEach((item, index) => {
            console.log(`Processing item ${index + 1}:`, item.competitor_name);
            grid.appendChild(this.createCompetitorCard(item));
        });
        
        return payload.length;
    }

    /**
     * Render a single competitor
     * @param {Object} payload - Single competitor data
     * @returns {number} Number of items rendered
     */
    renderSingleCompetitor(payload) {
        let grid = this.dataDisplay.querySelector('.card-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'card-grid';
            this.dataDisplay.appendChild(grid);
        }
        grid.appendChild(this.createCompetitorCard(payload));
        return 1;
    }

    /**
     * Render OpenAI response format
     * @param {Object|Array} payload - OpenAI response data
     * @returns {number} Number of items rendered
     */
    renderOpenAIResponse(payload) {
        let renderedCount = 0;
        
        if (Array.isArray(payload)) {
            let grid = this.dataDisplay.querySelector('.card-grid');
            if (!grid) {
                grid = document.createElement('div');
                grid.className = 'card-grid';
                this.dataDisplay.appendChild(grid);
            }
            
            payload.forEach((item, index) => {
                console.log(`=== PROCESSING ITEM ${index + 1}/${payload.length} ===`);
                console.log(`Raw item:`, item);
                
                const processed = this.processOpenAIResponse(item);
                if (processed) {
                    console.log(`Successfully processed item ${index + 1}:`, processed.competitor_name);
                    console.log(`Item content_type:`, processed.content_type);
                    
                    // ALWAYS create new cards - text analysis creates the card, video analysis adds to existing cards
                    console.log(`Processing item for: ${processed.competitor_name}, content_type: ${processed.content_type}`);
                    
                    // Simple: if content_type is 'video', it's video analysis
                    const hasVideoAnalysis = processed.content_type === 'video';
                    
                    console.log('=== VIDEO ANALYSIS DETECTION ===');
                    console.log('content_type:', processed.content_type);
                    console.log('has ai_analysis.full_analysis:', processed.ai_analysis?.full_analysis ? 'YES' : 'NO');
                    console.log('hasVideoAnalysis:', hasVideoAnalysis ? 'YES' : 'NO');
                    
                    if (hasVideoAnalysis) {
                        // Video analysis - ONLY add to existing cards, NEVER create new
                        console.log(`Video analysis for: ${processed.competitor_name} - finding existing card`);
                        const videoAdText = processed.body || processed.ad_data?.ad_text || '';
                        console.log(`Video analysis ad text: "${videoAdText.substring(0, 100)}..."`);
                        const existingCards = this.findAllExistingCards(processed.competitor_name, videoAdText);
                        if (existingCards.length > 0) {
                            console.log(`Found ${existingCards.length} existing cards, adding video analysis`);
                            existingCards.forEach(card => {
                                this.addVideoAnalysisToExistingCard(card, processed);
                            });
                        } else {
                            console.log(`⚠️ No existing card found for "${processed.competitor_name}" with matching ad text - video analysis SKIPPED`);
                        }
                        // Don't increment renderedCount - no new card created
                    } else {
                        // Text analysis - create new card
                        console.log(`Creating new card for text analysis: ${processed.competitor_name}`);
                        grid.appendChild(this.createCompetitorCard(processed));
                        renderedCount++;
                    }
                } else {
                    console.log(`Failed to process item ${index + 1}, creating fallback entry`);
                    console.log(`Raw item data:`, item);
                    // Create a fallback entry for any item that fails to process
                    const fallbackEntry = {
                        competitor_name: `Item ${index + 1}`,
                        ai_analysis: {
                            full_analysis: JSON.stringify(item, null, 2)
                        },
                        ad_data: {
                            platforms: ['Raw Data'],
                            ad_started: new Date().toLocaleDateString(),
                            page_profile_uri: '#'
                        }
                    };
                    console.log(`Created fallback entry for item ${index + 1}:`, fallbackEntry);
                    grid.appendChild(this.createCompetitorCard(fallbackEntry));
                    renderedCount++;
                }
                console.log(`Item ${index + 1} processed, renderedCount: ${renderedCount}`);
            });
        } else {
            console.log('Processing single OpenAI item');
            const processed = this.processOpenAIResponse(payload);
            if (processed) {
                console.log('Successfully processed single item:', processed.competitor_name);
                console.log('Item content_type:', processed.content_type);
                
                // ALWAYS create new cards - text analysis creates the card, video analysis adds to existing cards
                console.log(`Processing single item for: ${processed.competitor_name}, content_type: ${processed.content_type}`);
                
                // Simple: if content_type is 'video', it's video analysis
                const hasVideoAnalysis = processed.content_type === 'video';
                
                console.log('=== SINGLE ITEM VIDEO ANALYSIS DETECTION ===');
                console.log('content_type:', processed.content_type);
                console.log('has ai_analysis.full_analysis:', processed.ai_analysis?.full_analysis ? 'YES' : 'NO');
                console.log('hasVideoAnalysis:', hasVideoAnalysis ? 'YES' : 'NO');
                
                if (hasVideoAnalysis) {
                    // Video analysis - ONLY add to existing cards, NEVER create new
                    console.log(`Single video analysis for: ${processed.competitor_name} - finding existing card`);
                    const videoAdText = processed.body || processed.ad_data?.ad_text || '';
                    console.log(`Video analysis ad text: "${videoAdText.substring(0, 100)}..."`);
                    const existingCards = this.findAllExistingCards(processed.competitor_name, videoAdText);
                    if (existingCards.length > 0) {
                        console.log(`Found ${existingCards.length} existing cards, adding video analysis`);
                        existingCards.forEach(card => {
                            this.addVideoAnalysisToExistingCard(card, processed);
                        });
                    } else {
                        console.log(`⚠️ No existing card found for "${processed.competitor_name}" with matching ad text - video analysis SKIPPED`);
                    }
                    renderedCount = 0; // No new card created
                } else {
                    // Text analysis - create new card
                    console.log(`Creating new card for single text analysis: ${processed.competitor_name}`);
                    let grid = this.dataDisplay.querySelector('.card-grid');
                    if (!grid) {
                        grid = document.createElement('div');
                        grid.className = 'card-grid';
                        this.dataDisplay.appendChild(grid);
                    }
                    grid.appendChild(this.createCompetitorCard(processed));
                    renderedCount = 1;
                }
            } else {
                console.log('Failed to process single item, creating fallback entry');
                console.log('Raw payload data:', payload);
                // Create a fallback entry for single item that fails to process
                const fallbackEntry = {
                    competitor_name: 'Single Item',
                    ai_analysis: {
                        full_analysis: JSON.stringify(payload, null, 2)
                    },
                    ad_data: {
                        platforms: ['Raw Data'],
                        ad_started: new Date().toLocaleDateString(),
                        page_profile_uri: '#'
                    }
                };
                let grid = this.dataDisplay.querySelector('.card-grid');
                if (!grid) {
                    grid = document.createElement('div');
                    grid.className = 'card-grid';
                    this.dataDisplay.appendChild(grid);
                }
                grid.appendChild(this.createCompetitorCard(fallbackEntry));
                renderedCount = 1;
            }
        }
        
        return renderedCount;
    }

    /**
     * Process OpenAI response format - SIMPLIFIED VERSION
     * @param {Object} item - OpenAI response item
     * @returns {Object|null} Processed competitor data or null
     */
    processOpenAIResponse(item) {
        console.log('=== PROCESSING ITEM - NO FILTERING ===');
        console.log('Raw item:', item);
        
        // NO FILTERING - process everything that comes in
        if (item && typeof item === 'object') {
            console.log('Processing item - NO FILTERING:', item);
            
            // Extract competitor name from various possible fields
            const competitorName = item.competitor_name || 
                                 item.name || 
                                 item.competitor || 
                                 'Unknown Competitor';
            
            // Use ai_analysis directly if it exists as an object with the correct structure
            let aiAnalysis = item.ai_analysis || {};
            
            // Extract video data from various possible fields - NO FILTERING
            let videos = [];
            if (item.ad_data?.videos && Array.isArray(item.ad_data.videos)) {
                videos = item.ad_data.videos;
            } else if (item.video_data) {
                videos = [{
                    video_preview_image_url: item.video_data.video_preview_image_url || item.video_data.video_thumbnail_url || '',
                    video_sd_url: item.video_data.video_url || item.video_data.video_sd_url || '',
                    video_id: item.video_data.video_id || ''
                }];
            }
            
            // Determine content type - NO FILTERING
            const contentType = item.content_type || (item.video_data ? 'video' : 'text');
            
            console.log('Processed item:', {
                competitor_name: competitorName,
                content_type: contentType,
                has_ai_analysis: !!aiAnalysis,
                videos_count: videos.length
            });
            
            return {
                competitor_name: competitorName,
                content_type: contentType,
                body: item.body || '', // Preserve original ad text for matching
                ai_analysis: aiAnalysis, // Keep the original structure!
                video_analysis: undefined, // Disabled
                video_data: item.video_data ? {
                    video_id: item.video_data.video_id || 'Unknown Video',
                    ad_started: item.video_data.ad_started || new Date().toLocaleDateString(),
                    platforms: item.video_data.platforms || [],
                    page_profile_uri: item.video_data.page_profile_uri || '',
                    page_profile_picture_url: item.video_data.page_profile_picture_url || ''
                } : undefined,
                ad_data: {
                    platforms: item.ad_data?.platforms || item.video_data?.platforms || ['Analysis'],
                    ad_started: item.ad_data?.ad_started || item.video_data?.ad_started || new Date().toLocaleDateString(),
                    page_profile_uri: item.ad_data?.page_profile_uri || item.video_data?.page_profile_uri || '#',
                    page_profile_picture_url: item.ad_data?.page_profile_picture_url || item.video_data?.page_profile_picture_url || '',
                    ad_text: item.ad_data?.ad_text || item.ad_text || item.text || item.original_text || '',
                    videos: videos
                }
            };
        }
        
        console.log('Item is null or not an object, returning null');
        return null;
    }

    /**
     * Find existing card for a competitor
     * @param {string} competitorName - Competitor name to search for
     * @param {string} adText - Optional ad text for precise matching
     * @returns {HTMLElement|null} Existing card element or null
     */
    findExistingCard(competitorName, adText = null) {
        const cards = this.findAllExistingCards(competitorName, adText);
        return cards.length > 0 ? cards[0] : null;
    }

    /**
     * Find ALL existing cards for a competitor
     * @param {string} competitorName - Competitor name to search for
     * @param {string} adText - Optional ad text for precise matching
     * @returns {HTMLElement[]} Array of existing card elements
     */
    findAllExistingCards(competitorName, adText = null) {
        const cards = this.dataDisplay.querySelectorAll('.card');
        const matchingCards = [];
        
        console.log(`Looking for existing cards for: "${competitorName}"`);
        if (adText) {
            console.log(`With ad text: "${adText.substring(0, 100)}..."`);
        }
        console.log(`Available cards:`, Array.from(cards).map(card => {
            const link = card.querySelector('.title-row a');
            const adTextEl = card.querySelector('.ad-text');
            return {
                name: link ? link.textContent.trim() : 'NO LINK',
                adText: adTextEl ? adTextEl.textContent.trim().substring(0, 50) + '...' : 'NO AD TEXT'
            };
        }));
        
        for (let card of cards) {
            const link = card.querySelector('.title-row a');
            const adTextEl = card.querySelector('.ad-text');
            
            if (link && link.textContent) {
                const existingName = link.textContent.trim();
                const existingAdText = adTextEl ? adTextEl.textContent.trim() : '';
                
                console.log(`Comparing "${competitorName}" with "${existingName}"`);
                
                // First check competitor name match
                const nameMatches = existingName === competitorName || 
                    existingName.toLowerCase().includes(competitorName.toLowerCase()) ||
                    competitorName.toLowerCase().includes(existingName.toLowerCase());
                
                if (nameMatches) {
                    // If ad text is provided, do precise matching
                    if (adText && existingAdText) {
                        console.log(`Checking ad text match:`);
                        console.log(`Video ad text: "${adText.substring(0, 100)}..."`);
                        console.log(`Card ad text: "${existingAdText.substring(0, 100)}..."`);
                        
                        // Exact text match or high similarity
                        if (existingAdText === adText || 
                            existingAdText.includes(adText.substring(0, 50)) ||
                            adText.includes(existingAdText.substring(0, 50))) {
                            console.log(`✅ Found exact match by competitor name + ad text!`);
                            matchingCards.push(card);
                        } else {
                            console.log(`❌ Competitor matches but ad text doesn't match`);
                        }
                    } else {
                        // No ad text provided, use old behavior (match all with same competitor)
                        console.log(`✅ Found match by competitor name (no ad text provided)`);
                        matchingCards.push(card);
                    }
                }
            }
        }
        console.log(`Found ${matchingCards.length} matching cards for "${competitorName}"`);
        return matchingCards;
    }

    /**
     * Update existing card with new data (text or video analysis)
     * @param {HTMLElement} existingCard - The existing card element
     * @param {Object} data - Analysis data (text or video)
     */
    updateExistingCard(existingCard, data) {
        console.log('Updating existing card with data - NO FILTERING:', data);
        
        // Add video analysis if we have video analysis data - NO FILTERING
        if (data.video_analysis && data.video_analysis.full_analysis) {
            console.log('Video analysis data found, adding to existing card');
            this.addVideoAnalysisToExistingCard(existingCard, data);
        }
        
        // Update any other fields if needed
        // (text analysis, profile info, etc.)
    }

    /**
     * Add video analysis to an existing card
     * @param {HTMLElement} existingCard - The existing card element
     * @param {Object} videoData - Video analysis data
     */
    addVideoAnalysisToExistingCard(existingCard, videoData) {
        console.log('Adding video analysis to existing card:', videoData);
        console.log('Video data structure:', JSON.stringify(videoData, null, 2));
        
        // Check if ad text exists before adding video analysis
        const existingAdText = existingCard.querySelector('.ad-text');
        console.log('Existing ad text before video analysis:', existingAdText ? existingAdText.textContent : 'NO AD TEXT FOUND');
        
        // DO NOT TOUCH VIDEO PREVIEW URL - just pass everything through
        
        // Check if video analysis section already exists
        const existingVideoSection = existingCard.querySelector('.video-analysis-section');
        if (existingVideoSection) {
            console.log('Video analysis section already exists, updating it');
            existingVideoSection.remove();
        }

        // Create video analysis section
        const videoAnalysisSection = document.createElement('div');
        videoAnalysisSection.className = 'video-analysis-section';

        // Video analysis header
        const videoHeader = document.createElement('div');
        videoHeader.className = 'analysis-header';
        videoHeader.innerHTML = `
            <div class="analysis-badge">Video Creative</div>
        `;
        videoAnalysisSection.appendChild(videoHeader);

        // Video info - REMOVED to hide Video ID and date line

        // Video analysis content preview - NO FILTERING, just pass through whatever data we have
        const videoContent = document.createElement('div');
        videoContent.className = 'analysis-content';
        
        // Handle JSON structure for video analysis
        let videoAnalysisText = 'No analysis available';
        
        if (videoData.ai_analysis) {
            if (typeof videoData.ai_analysis === 'object') {
                // Create a preview from JSON structure
                const analysis = videoData.ai_analysis;
                let previewParts = [];
                
                if (analysis.copywriting?.offer_clarity) {
                    previewParts.push(`Ясність оффера: ${analysis.copywriting.offer_clarity.score}/10`);
                }
                if (analysis.marketing?.offer_type) {
                    previewParts.push(`Тип оффера: ${analysis.marketing.offer_type}`);
                }
                if (analysis.sales?.value_proposition) {
                    previewParts.push(`Value proposition: ${analysis.sales.value_proposition.score}/10`);
                }
                
                videoAnalysisText = previewParts.join(' • ') || 'Аналіз доступний';
            } else {
                videoAnalysisText = videoData.ai_analysis;
            }
        }
        
        const shortVideoText = videoAnalysisText.length > 200 ? `${videoAnalysisText.slice(0, 200)}…` : videoAnalysisText;
        const cleanVideoPreview = shortVideoText.trim();
        videoContent.textContent = cleanVideoPreview;
        videoAnalysisSection.appendChild(videoContent);

        // Video analysis actions - match text analysis structure
        const videoActions = document.createElement('div');
        videoActions.className = 'ai-preview-actions';

        // Add empty div to push button to the right (like text analysis has View Profile on left)
        const spacer = document.createElement('div');
        videoActions.appendChild(spacer);

        // Add options button (dots) like in text analysis
        const videoOptionsBtn = document.createElement('button');
        videoOptionsBtn.className = 'full-analysis-btn';
        videoOptionsBtn.innerHTML = '⋯';
        videoOptionsBtn.onclick = () => {
            if (this.onShowFullAnalysis) {
                this.onShowFullAnalysis(
                    `${videoData?.competitor_name || 'Unknown Competitor'} - Video Analysis`, 
                    videoAnalysisText
                );
            }
        };
        videoActions.appendChild(videoOptionsBtn);

        videoAnalysisSection.appendChild(videoActions);
        existingCard.appendChild(videoAnalysisSection);

        // Check if ad text still exists after adding video analysis
        const adTextAfter = existingCard.querySelector('.ad-text');
        console.log('Ad text after adding video analysis:', adTextAfter ? adTextAfter.textContent : 'NO AD TEXT FOUND');
        console.log('Video analysis section added to existing card');
    }

    /**
     * Get social media platform icon
     * @param {string} platform - Platform name
     * @returns {string} Icon HTML or platform name if no icon found
     */
    getPlatformIcon(platform) {
        const platformIcons = {
            'facebook': '<svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
            'instagram': '<svg width="16" height="16" viewBox="0 0 24 24" fill="url(#instagram-gradient)"><defs><linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#833AB4;stop-opacity:1" /><stop offset="50%" style="stop-color:#E1306C;stop-opacity:1" /><stop offset="100%" style="stop-color:#F77737;stop-opacity:1" /></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
            'audiencenetwork': '<svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#6B46C1"/><path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-0.9-2-2s0.9-2 2-2 2 0.9 2 2-0.9 2-2 2z" fill="white"/><path d="M15 13l2 2-1.4 1.4-2-2z" fill="white"/></svg>',
            'messenger': '<svg width="16" height="16" viewBox="0 0 24 24" fill="#00B2FF"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.64 6.12c-.15-.1-.33-.15-.52-.15-.15 0-.29.05-.41.13l-2.54 1.64-2.54-1.64c-.13-.08-.27-.13-.42-.13-.19 0-.37.05-.52.15-.19.12-.3.31-.3.52v6.72c0 .21.11.4.3.52.15.1.33.15.52.15.15 0 .29-.05.41-.13l2.54-1.64 2.54 1.64c.13.08.27.13.42.13.19 0 .37-.05.52-.15.19-.12.3-.31.3-.52V8.64c0-.21-.11-.4-.3-.52z"/></svg>',
            'threads': '<svg width="16" height="16" viewBox="0 0 24 24" fill="#000000"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068c0-3.518.85-6.372 2.495-8.423C5.845 1.205 8.598.024 12.186 0h.007c3.581.024 6.334 1.205 8.184 3.509C22.65 5.56 23.5 8.414 23.5 11.932c0 3.518-.85 6.372-2.495 8.423C19.155 20.795 16.402 21.976 12.814 24h-.628zm-.007-22.5c-3.096.02-5.474 1.04-6.982 2.974C3.69 7.408 2.93 9.698 2.93 12.068s.76 4.66 2.267 6.594c1.508 1.934 3.886 2.954 6.982 2.974 3.096-.02 5.474-1.04 6.982-2.974 1.507-1.934 2.267-4.224 2.267-6.594s-.76-4.66-2.267-6.594C17.653 2.54 15.275 1.52 12.179 1.5zm5.524 4.94c.406 0 .735.329.735.735 0 .406-.329.735-.735.735-.406 0-.735-.329-.735-.735 0-.406.329-.735.735-.735zm-3.726.882c1.442 0 2.608 1.166 2.608 2.608s-1.166 2.608-2.608 2.608-2.608-1.166-2.608-2.608 1.166-2.608 2.608-2.608zm0 1.47c-.627 0-1.137.51-1.137 1.137s.51 1.137 1.137 1.137 1.137-.51 1.137-1.137-.51-1.137-1.137-1.137zm-4.83 1.47c.406 0 .735.329.735.735 0 .406-.329.735-.735.735-.406 0-.735-.329-.735-.735 0-.406.329-.735.735-.735zm-2.941.882c.406 0 .735.329.735.735 0 .406-.329.735-.735.735-.406 0-.735-.329-.735-.735 0-.406.329-.735.735-.735zm8.712 1.47c.406 0 .735.329.735.735 0 .406-.329.735-.735.735-.406 0-.735-.329-.735-.735 0-.406.329-.735.735-.735zm-5.882 0c.406 0 .735.329.735.735 0 .406-.329.735-.735.735-.406 0-.735-.329-.735-.735 0-.406.329-.735.735-.735zm-2.941 0c.406 0 .735.329.735.735 0 .406-.329.735-.735.735-.406 0-.735-.329-.735-.735 0-.406.329-.735.735-.735z"/></svg>'
        };
        
        // Debug logging
        console.log('Platform icon lookup:', { original: platform, normalized: String(platform).toLowerCase().replace(/[^a-z]/g, '') });
        
        const normalizedPlatform = String(platform).toLowerCase().replace(/[^a-z]/g, '');
        const icon = platformIcons[normalizedPlatform] || String(platform).toLowerCase();
        
        console.log('Icon result:', { platform: normalizedPlatform, found: !!platformIcons[normalizedPlatform], result: icon.substring(0, 50) + '...' });
        
        return icon;
    }

    /**
     * Create a competitor card element
     * @param {Object} entry - Competitor data
     * @returns {HTMLElement} Card element
     */
    createCompetitorCard(entry) {
        const card = document.createElement('div');
        card.className = 'card';

        const header = document.createElement('div');
        header.className = 'card-header';

        const img = document.createElement('img');
        img.className = 'avatar';
        img.src = entry?.ad_data?.page_profile_picture_url || '';
        img.alt = 'Profile';
        header.appendChild(img);

        const titleWrap = document.createElement('div');
        titleWrap.className = 'title-wrap';
        const titleRow = document.createElement('div');
        titleRow.className = 'title-row';

        // Create left group for competitor name and badges
        const leftGroup = document.createElement('div');
        leftGroup.className = 'title-left-group';

        const link = document.createElement('a');
        link.href = entry?.ad_data?.page_profile_uri || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = entry?.competitor_name || 'Unknown competitor';
        leftGroup.appendChild(link);

        const badges = document.createElement('div');
        badges.className = 'badges';
        (entry?.ad_data?.platforms || []).forEach(p => {
            const b = document.createElement('span');
            b.className = 'badge platform-badge';
            const icon = this.getPlatformIcon(p);
            if (icon.startsWith('<svg')) {
                b.innerHTML = icon;
                b.title = String(p).toLowerCase(); // Add tooltip with platform name
            } else {
                b.textContent = icon;
            }
            badges.appendChild(b);
        });
        leftGroup.appendChild(badges);

        titleRow.appendChild(leftGroup);

        // Add View Profile link to the far right of title row
        const viewProfileLink = document.createElement('a');
        viewProfileLink.className = 'view-profile-link';
        viewProfileLink.href = entry?.ad_data?.page_profile_uri || '#';
        viewProfileLink.target = '_blank';
        viewProfileLink.rel = 'noopener noreferrer';
        viewProfileLink.innerHTML = 'View Profile <span>↗</span>';
        console.log('Creating View Profile link with href:', viewProfileLink.href);
        titleRow.appendChild(viewProfileLink);
        titleWrap.appendChild(titleRow);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `${entry?.ad_data?.ad_started || 'N/A'}`;
        titleWrap.appendChild(meta);

        header.appendChild(titleWrap);
        card.appendChild(header);

        // Show ad text if available, otherwise show a placeholder
        const adText = entry?.ad_data?.ad_text || entry?.ad_text || entry?.text || entry?.original_text;
        if (adText) {
            const ad = document.createElement('div');
            ad.className = 'ad-text';
            ad.textContent = adText;
            card.appendChild(ad);
        }

        const firstVideo = Array.isArray(entry?.ad_data?.videos) ? entry.ad_data.videos[0] : null;
        console.log('Card creation - videos array:', entry?.ad_data?.videos);
        console.log('Card creation - firstVideo:', firstVideo);
        console.log('Card creation - video_preview_image_url:', firstVideo?.video_preview_image_url);
        if (firstVideo?.video_preview_image_url) {
            console.log('Creating video thumbnail with URL:', firstVideo.video_preview_image_url);
            const imgVid = document.createElement('img');
            imgVid.className = 'video-thumb';
            imgVid.src = firstVideo.video_preview_image_url;
            imgVid.alt = 'Video preview';
            imgVid.onclick = () => {
                const url = firstVideo.video_sd_url || firstVideo.video_preview_image_url;
                window.open(url, '_blank');
            };
            card.appendChild(imgVid);
        } else {
            console.log('No video preview URL available, skipping video thumbnail creation');
        }

        // Text Analysis Section - NO FILTERING
        const full = entry?.ai_analysis || '';
        if (full) {
            const preview = document.createElement('div');
            preview.className = 'ai-preview';

            // Analysis header
            const analysisHeader = document.createElement('div');
            analysisHeader.className = 'analysis-header';
            analysisHeader.innerHTML = `
                <div class="analysis-badge">Text Creative</div>
            `;
            preview.appendChild(analysisHeader);

            // Content - show small preview
            const content = document.createElement('div');
            content.className = 'ai-preview-content';
            
            let previewText = 'Аналіз доступний';
            
            // Handle JSON structure for text analysis
            if (typeof full === 'object' && full.copywriting) {
                // full is the ai_analysis object directly
                let previewParts = [];
                
                if (full.copywriting?.offer_clarity) {
                    previewParts.push(`Ясність оффера: ${full.copywriting.offer_clarity.score}/10`);
                }
                if (full.marketing?.offer_type) {
                    previewParts.push(`Тип оффера: ${full.marketing.offer_type}`);
                }
                if (full.sales?.value_proposition) {
                    previewParts.push(`Value proposition: ${full.sales.value_proposition.score}/10`);
                }
                
                previewText = previewParts.join(' • ') || 'Аналіз доступний';
            }
            
            const shortText = previewText.length > 150 ? `${previewText.slice(0, 150)}…` : previewText;
            const cleanPreview = shortText.trim();
            content.textContent = cleanPreview;
            preview.appendChild(content);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'ai-preview-actions';

            // Add empty div to push button to the right (View Profile is now in title row)
            const spacer = document.createElement('div');
            actions.appendChild(spacer);

            const fullAnalysisBtn = document.createElement('button');
            fullAnalysisBtn.className = 'full-analysis-btn';
            fullAnalysisBtn.innerHTML = '⋯';
            fullAnalysisBtn.onclick = () => {
                if (this.onShowFullAnalysis) {
                    this.onShowFullAnalysis(entry?.competitor_name || 'Unknown competitor', entry);
                }
            };
            actions.appendChild(fullAnalysisBtn);

            preview.appendChild(actions);
            card.appendChild(preview);
        }

        // Video Analysis Section - DISABLED
        if (false && (entry?.video_analysis?.full_analysis || entry?.ai_analysis)) {
            const videoAnalysisSection = document.createElement('div');
            videoAnalysisSection.className = 'video-analysis-section';

            // Video analysis header
            const videoHeader = document.createElement('div');
            videoHeader.className = 'analysis-header';
            videoHeader.innerHTML = `
                <div class="analysis-badge">Video Creative</div>
            `;
            videoAnalysisSection.appendChild(videoHeader);

            // Video info - REMOVED to hide Video ID and date line

            // Video analysis content preview - NO FILTERING
            const videoContent = document.createElement('div');
            videoContent.className = 'analysis-content';
            let videoAnalysisText = entry.video_analysis?.full_analysis || entry.ai_analysis;
            
            // Convert to string if it's an object
            if (typeof videoAnalysisText === 'object') {
                videoAnalysisText = JSON.stringify(videoAnalysisText, null, 2);
            }
            
            const shortVideoText = videoAnalysisText.length > 200 ? `${videoAnalysisText.slice(0, 200)}…` : videoAnalysisText;
            // Clean the preview text by formatting markdown syntax
            const cleanVideoPreview = shortVideoText
                .replace(/^#{1,6}\s+/gm, '') // Remove markdown header symbols but keep text
                .replace(/^\s*[-–—•*]\s*/gm, '') // Remove dashes from start of lines
                .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markdown
                .replace(/\s+/g, ' ') // Clean up multiple spaces
                .trim();
            videoContent.textContent = cleanVideoPreview;
            videoAnalysisSection.appendChild(videoContent);

            // Video analysis actions
            const videoActions = document.createElement('div');
            videoActions.className = 'ai-preview-actions';

            // Add empty div to push button to the right (View Profile is now in title row)
            const spacer = document.createElement('div');
            videoActions.appendChild(spacer);

            const viewFullVideoBtn = document.createElement('button');
            viewFullVideoBtn.className = 'full-analysis-btn';
            viewFullVideoBtn.innerHTML = '⋯';
            viewFullVideoBtn.onclick = () => {
                if (this.onShowFullAnalysis) {
                    this.onShowFullAnalysis(
                        `${entry?.competitor_name || 'Unknown Competitor'} - Video Analysis`, 
                        videoAnalysisText
                    );
                }
            };
            videoActions.appendChild(viewFullVideoBtn);

            videoAnalysisSection.appendChild(videoActions);
            card.appendChild(videoAnalysisSection);
        }

        return card;
    }

    /**
     * Clear all data from the display
     */
    clear() {
        if (this.dataDisplay) {
            this.dataDisplay.innerHTML = `
                <div class="empty-state">
                    <div class="billboard-illustration">
                        <img src="/Screenshot_2025-10-04_155150_whitebg_v2.svg" alt="No ads illustration" style="max-width: 500px; height: auto;" />
                    </div>
                    <h3>No ads yet</h3>
                </div>
            `;
        }
    }

    /**
     * Get the data display element
     * @returns {HTMLElement|null}
     */
    getElement() {
        return this.dataDisplay;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataDisplay;
} else {
    window.DataDisplay = DataDisplay;
}
