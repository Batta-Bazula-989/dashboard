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
            <div class="data-container">
                <div class="data-display" id="dataDisplay">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <h3>No data received yet</h3>
                    </div>
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

        // If competitor array/object -> render cards; otherwise show raw JSON
        const looksLikeCompetitor = (obj) => obj && typeof obj === 'object' && ('competitor_name' in obj || ('ad_data' in obj && 'ai_analysis' in obj));
        const isProcessableObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);

        let renderedCount = 0;
        if (Array.isArray(payload) && payload.every(looksLikeCompetitor)) {
            console.log('Processing as competitor array');
            renderedCount = this.renderCompetitorArray(payload);
        } else if (looksLikeCompetitor(payload)) {
            console.log('Processing as single competitor');
            renderedCount = this.renderSingleCompetitor(payload);
        } else if (Array.isArray(payload) && payload.every(isProcessableObject)) {
            console.log('Processing as array of processable objects');
            renderedCount = this.renderOpenAIResponse(payload);
        } else if (isProcessableObject(payload)) {
            console.log('Processing as single processable object');
            renderedCount = this.renderOpenAIResponse(payload);
        } else {
            console.log('Processing as OpenAI response format (fallback)');
            renderedCount = this.renderOpenAIResponse(payload);
        }

        // Update status - count competitors and ads
        const competitorCards = this.dataDisplay.querySelectorAll('.card').length;
        const adsCount = competitorCards; // For now, assume each competitor = 1 ad

        console.log(`=== PROCESSING COMPLETE ===`);
        console.log(`Rendered: ${renderedCount} items`);
        console.log(`Total cards in DOM: ${competitorCards}`);
        console.log('All competitor names:', Array.from(this.dataDisplay.querySelectorAll('.card')).map(card => {
            const link = card.querySelector('.title-row a');
            return link ? link.textContent : 'Unknown';
        }));
        console.log('================================');

        // Return stats for parent component to update
        return { competitorCards, adsCount };
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
                console.log(`Processing OpenAI item ${index + 1}`);
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
                    grid.appendChild(this.createCompetitorCard(fallbackEntry));
                    renderedCount++;
                }
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
            b.className = 'badge';
            b.textContent = String(p).toLowerCase();
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
            content.textContent = shortText;
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
                    <div class="empty-state-icon">📭</div>
                    <h3>No data received yet</h3>
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
