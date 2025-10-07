/**
 * VideoAnalysisDisplay Component
 * Handles the display of video AI analysis data
 */
class VideoAnalysisDisplay {
    constructor() {
        this.videoDisplay = null;
        this.onShowFullAnalysis = null;
    }

    /**
     * Initialize the video analysis display component
     * @param {HTMLElement} container - The container element to render into
     * @param {Function} onShowFullAnalysis - Callback for showing full analysis
     */
    init(container, onShowFullAnalysis = null) {
        this.onShowFullAnalysis = onShowFullAnalysis;
        this.render(container);
        this.bindElements();
    }

    /**
     * Render the video analysis display HTML
     * @param {HTMLElement} container - The container element
     */
    render(container) {
        const videoDisplayHTML = `
            <div class="video-analysis-display" id="videoAnalysisDisplay">
                <div class="empty-state">
                    <div class="video-illustration">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </div>
                    <h3>No video analysis yet</h3>
                    <p>Video AI analysis will appear here</p>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', videoDisplayHTML);
    }

    /**
     * Bind DOM elements to component properties
     */
    bindElements() {
        this.videoDisplay = document.getElementById('videoAnalysisDisplay');
    }

    /**
     * Add video analysis data to the display
     * @param {Object|Array} incoming - Incoming video analysis data
     */
    addVideoAnalysis(incoming) {
        const timestamp = new Date().toLocaleString();
        const payload = (incoming && typeof incoming === 'object' && 'data' in incoming) ? incoming.data : incoming;

        console.log('=== NEW VIDEO ANALYSIS RECEIVED ===');
        console.log('Timestamp:', timestamp);
        console.log('Raw incoming:', incoming);
        console.log('Payload:', payload);

        const emptyState = this.videoDisplay.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        let renderedCount = 0;
        
        if (Array.isArray(payload)) {
            console.log(`Processing video analysis array with ${payload.length} items`);
            renderedCount = this.renderVideoAnalysisArray(payload);
        } else {
            console.log('Processing single video analysis item');
            renderedCount = this.renderSingleVideoAnalysis(payload);
        }

        console.log(`=== VIDEO ANALYSIS PROCESSING COMPLETE ===`);
        console.log(`Rendered: ${renderedCount} video analysis items`);

        return { videoAnalysisCount: renderedCount };
    }

    /**
     * Render an array of video analysis data
     * @param {Array} payload - Array of video analysis data
     * @returns {number} Number of items rendered
     */
    renderVideoAnalysisArray(payload) {
        let grid = this.videoDisplay.querySelector('.video-analysis-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'video-analysis-grid';
            this.videoDisplay.appendChild(grid);
        }
        
        payload.forEach((item, index) => {
            console.log(`Processing video analysis item ${index + 1}:`, item);
            grid.appendChild(this.createVideoAnalysisCard(item));
        });
        
        return payload.length;
    }

    /**
     * Render a single video analysis
     * @param {Object} payload - Single video analysis data
     * @returns {number} Number of items rendered
     */
    renderSingleVideoAnalysis(payload) {
        let grid = this.videoDisplay.querySelector('.video-analysis-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'video-analysis-grid';
            this.videoDisplay.appendChild(grid);
        }
        grid.appendChild(this.createVideoAnalysisCard(payload));
        return 1;
    }

    /**
     * Process video analysis data from OpenAI response format
     * @param {Object} item - Video analysis item
     * @returns {Object|null} Processed video analysis data or null
     */
    processVideoAnalysis(item) {
        // Check if this is an OpenAI response format
        if (item && item.body && item.body.output && Array.isArray(item.body.output)) {
            const messageOutput = item.body.output.find(output => output.type === 'message');
            if (messageOutput && messageOutput.content && messageOutput.content[0] && messageOutput.content[0].text) {
                const analysisText = messageOutput.content[0].text;

                // Extract video ID and competitor name from the analysis text
                let videoId = 'Unknown Video';
                let competitorName = 'Unknown Competitor';
                
                const videoIdMatch = analysisText.match(/ID ВИДЕО:\s*([^\n]+)/i);
                if (videoIdMatch) {
                    videoId = videoIdMatch[1].trim();
                }

                const nameMatch = analysisText.match(/РЕКЛАМОДАТЕЛЬ:\s*([^\n]+)/i);
                if (nameMatch) {
                    competitorName = nameMatch[1].trim();
                }

                return {
                    video_id: videoId,
                    competitor_name: competitorName,
                    video_analysis: {
                        full_analysis: analysisText
                    },
                    video_data: {
                        ad_started: new Date().toLocaleDateString(),
                        format: 'vertical',
                        duration: '30s'
                    }
                };
            }
        }

        // Check if it's already in video analysis format
        if (item && (item.video_id || (item.video_analysis && item.competitor_name))) {
            return item;
        }

        // If it's any other object, try to create a basic video analysis entry
        if (item && typeof item === 'object') {
            console.log('Creating fallback video analysis entry for:', item);
            return {
                video_id: item.video_id || item.id || 'Unknown Video',
                competitor_name: item.competitor_name || item.name || 'Unknown Competitor',
                video_analysis: {
                    full_analysis: item.video_analysis?.full_analysis || item.analysis || JSON.stringify(item, null, 2)
                },
                video_data: {
                    ad_started: item.video_data?.ad_started || new Date().toLocaleDateString(),
                    format: item.video_data?.format || 'vertical',
                    duration: item.video_data?.duration || '30s'
                }
            };
        }

        return null;
    }

    /**
     * Create a video analysis card element
     * @param {Object} entry - Video analysis data
     * @returns {HTMLElement} Card element
     */
    createVideoAnalysisCard(entry) {
        const card = document.createElement('div');
        card.className = 'video-analysis-card';

        // Video thumbnail/preview section
        const videoSection = document.createElement('div');
        videoSection.className = 'video-section';

        // Create video thumbnail placeholder (you can replace this with actual video thumbnail)
        const videoThumbnail = document.createElement('div');
        videoThumbnail.className = 'video-thumbnail';
        videoThumbnail.innerHTML = `
            <div class="video-play-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5,3 19,12 5,21"></polygon>
                </svg>
            </div>
            <div class="video-duration">${entry?.video_data?.duration || '30s'}</div>
        `;
        videoSection.appendChild(videoThumbnail);

        // Video info
        const videoInfo = document.createElement('div');
        videoInfo.className = 'video-info';
        
        const videoTitle = document.createElement('div');
        videoTitle.className = 'video-title';
        videoTitle.textContent = `Video Analysis: ${entry?.competitor_name || 'Unknown Competitor'}`;
        videoInfo.appendChild(videoTitle);

        const videoMeta = document.createElement('div');
        videoMeta.className = 'video-meta';
        videoMeta.textContent = `ID: ${entry?.video_id || 'Unknown'} • ${entry?.video_data?.ad_started || 'N/A'}`;
        videoInfo.appendChild(videoMeta);

        videoSection.appendChild(videoInfo);
        card.appendChild(videoSection);

        // AI Analysis section
        const full = entry?.video_analysis?.full_analysis || '';
        if (full) {
            const analysisSection = document.createElement('div');
            analysisSection.className = 'video-analysis-section';

            // Analysis header
            const analysisHeader = document.createElement('div');
            analysisHeader.className = 'analysis-header';
            analysisHeader.innerHTML = `
                <h4>AI Video Analysis</h4>
                <div class="analysis-badge">Video Creative</div>
            `;
            analysisSection.appendChild(analysisHeader);

            // Analysis content preview
            const analysisContent = document.createElement('div');
            analysisContent.className = 'analysis-content';
            const shortText = full.length > 200 ? `${full.slice(0, 200)}…` : full;
            // Clean the preview text by removing dashes and formatting it properly
            const cleanPreview = shortText
                .replace(/^\s*[-–—•*]\s*/gm, '') // Remove dashes from start of lines
                .replace(/\s+/g, ' ') // Clean up multiple spaces
                .trim();
            analysisContent.textContent = cleanPreview;
            analysisSection.appendChild(analysisContent);

            // Analysis actions
            const analysisActions = document.createElement('div');
            analysisActions.className = 'analysis-actions';

            const viewFullBtn = document.createElement('button');
            viewFullBtn.className = 'view-full-analysis-btn';
            viewFullBtn.innerHTML = 'View Full Analysis <span>↗</span>';
            viewFullBtn.onclick = () => {
                if (this.onShowFullAnalysis) {
                    this.onShowFullAnalysis(
                        `${entry?.competitor_name || 'Unknown Competitor'} - Video Analysis`, 
                        full
                    );
                }
            };
            analysisActions.appendChild(viewFullBtn);

            const optionsBtn = document.createElement('button');
            optionsBtn.className = 'analysis-options-btn';
            optionsBtn.innerHTML = '⋯';
            optionsBtn.onclick = () => {
                if (this.onShowFullAnalysis) {
                    this.onShowFullAnalysis(
                        `${entry?.competitor_name || 'Unknown Competitor'} - Video Analysis`, 
                        full
                    );
                }
            };
            analysisActions.appendChild(optionsBtn);

            analysisSection.appendChild(analysisActions);
            card.appendChild(analysisSection);
        }

        return card;
    }

    /**
     * Clear all video analysis data from the display
     */
    clear() {
        if (this.videoDisplay) {
            this.videoDisplay.innerHTML = `
                <div class="empty-state">
                    <div class="video-illustration">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </div>
                    <h3>No video analysis yet</h3>
                    <p>Video AI analysis will appear here</p>
                </div>
            `;
        }
    }

    /**
     * Get the video analysis display element
     * @returns {HTMLElement|null}
     */
    getElement() {
        return this.videoDisplay;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoAnalysisDisplay;
} else {
    window.VideoAnalysisDisplay = VideoAnalysisDisplay;
}
