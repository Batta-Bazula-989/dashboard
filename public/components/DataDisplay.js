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
                        <img src="/Screenshot 2025-10-04 155150.svg" alt="No ads illustration" style="max-width: 250px; height: auto; background-color: white;" />
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
                    grid.appendChild(this.createCompetitorCard(processed));
                    renderedCount++;
                } else {
                    console.log(`Failed to process item ${index + 1}, creating fallback entry`);
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
                let grid = this.dataDisplay.querySelector('.card-grid');
                if (!grid) {
                    grid = document.createElement('div');
                    grid.className = 'card-grid';
                    this.dataDisplay.appendChild(grid);
                }
                grid.appendChild(this.createCompetitorCard(processed));
                renderedCount = 1;
            } else {
                console.log('Failed to process single item, creating fallback entry');
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
     * Process OpenAI response format
     * @param {Object} item - OpenAI response item
     * @returns {Object|null} Processed competitor data or null
     */
    processOpenAIResponse(item) {
        // Check if this is an OpenAI response format
        if (item && item.body && item.body.output && Array.isArray(item.body.output)) {
            const messageOutput = item.body.output.find(output => output.type === 'message');
            if (messageOutput && messageOutput.content && messageOutput.content[0] && messageOutput.content[0].text) {
                const analysisText = messageOutput.content[0].text;

                // Extract competitor name from the analysis text
                let competitorName = 'Unknown Competitor';
                const nameMatch = analysisText.match(/(?:Конкурент:|конкурент[а-я]*:?)\s*([^\n]+)/i);
                if (nameMatch) {
                    competitorName = nameMatch[1].trim();
                }

                return {
                    competitor_name: competitorName,
                    ai_analysis: {
                        full_analysis: analysisText
                    },
                    ad_data: {
                        platforms: ['Analysis'],
                        ad_started: new Date().toLocaleDateString(),
                        page_profile_uri: '#'
                    }
                };
            }
        }

        // Check if it's already in competitor format
        if (item && (item.competitor_name || (item.ad_data && item.ai_analysis))) {
            return item;
        }

        // If it's any other object, try to create a basic competitor entry
        if (item && typeof item === 'object') {
            console.log('Creating fallback competitor entry for:', item);
            return {
                competitor_name: item.competitor_name || item.name || 'Unknown Competitor',
                ai_analysis: {
                    full_analysis: item.ai_analysis?.full_analysis || item.analysis || JSON.stringify(item, null, 2)
                },
                ad_data: {
                    platforms: item.ad_data?.platforms || ['Data'],
                    ad_started: item.ad_data?.ad_started || new Date().toLocaleDateString(),
                    page_profile_uri: item.ad_data?.page_profile_uri || '#',
                    ad_text: item.ad_data?.ad_text || item.text || ''
                }
            };
        }

        return null;
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
        const titleRow = document.createElement('div');
        titleRow.className = 'title-row';

        const link = document.createElement('a');
        link.href = entry?.ad_data?.page_profile_uri || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = entry?.competitor_name || 'Unknown competitor';
        titleRow.appendChild(link);

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
        titleRow.appendChild(badges);
        titleWrap.appendChild(titleRow);

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `${entry?.ad_data?.ad_started || 'N/A'}`;
        titleWrap.appendChild(meta);

        header.appendChild(titleWrap);
        card.appendChild(header);

        if (entry?.ad_data?.ad_text) {
            const ad = document.createElement('div');
            ad.className = 'ad-text';
            ad.textContent = entry.ad_data.ad_text;
            card.appendChild(ad);
        }

        const firstVideo = Array.isArray(entry?.ad_data?.videos) ? entry.ad_data.videos[0] : null;
        if (firstVideo?.video_preview_image_url) {
            const imgVid = document.createElement('img');
            imgVid.className = 'video-thumb';
            imgVid.src = firstVideo.video_preview_image_url;
            imgVid.alt = 'Video preview';
            imgVid.onclick = () => {
                const url = firstVideo.video_sd_url || firstVideo.video_preview_image_url;
                window.open(url, '_blank');
            };
            card.appendChild(imgVid);
        }

        const full = entry?.ai_analysis?.full_analysis || '';
        if (full) {
            const preview = document.createElement('div');
            preview.className = 'ai-preview';

            // Content - show small preview
            const content = document.createElement('div');
            content.className = 'ai-preview-content';
            const shortText = full.length > 150 ? `${full.slice(0, 150)}…` : full;
            // Clean the preview text by removing dashes and formatting it properly
            const cleanPreview = shortText
                .replace(/^\s*[-–—•*]\s*/gm, '') // Remove dashes from start of lines
                .replace(/\s+/g, ' ') // Clean up multiple spaces
                .trim();
            content.textContent = cleanPreview;
            preview.appendChild(content);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'ai-preview-actions';

            const viewProfileLink = document.createElement('a');
            viewProfileLink.className = 'view-profile-link';
            viewProfileLink.href = entry?.ad_data?.page_profile_uri || '#';
            viewProfileLink.target = '_blank';
            viewProfileLink.rel = 'noopener noreferrer';
            viewProfileLink.innerHTML = 'View Profile <span>↗</span>';
            actions.appendChild(viewProfileLink);

            const fullAnalysisBtn = document.createElement('button');
            fullAnalysisBtn.className = 'full-analysis-btn';
            fullAnalysisBtn.innerHTML = '⋯';
            fullAnalysisBtn.onclick = () => {
                if (this.onShowFullAnalysis) {
                    this.onShowFullAnalysis(entry?.competitor_name || 'Unknown competitor', full);
                }
            };
            actions.appendChild(fullAnalysisBtn);

            preview.appendChild(actions);
            card.appendChild(preview);
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
                        <img src="/Screenshot 2025-10-04 155150.svg" alt="No ads illustration" style="max-width: 250px; height: auto; background-color: white;" />
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
