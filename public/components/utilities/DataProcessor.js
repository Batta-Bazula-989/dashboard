class DataProcessor {
    static process(item) {
        if (!item || typeof item !== 'object') return null;

        // Handle carousel_data - convert to ad_data.images if present
        let images = item.ad_data?.images || [];
        let platforms = item.ad_data?.platforms || [];
        let ad_started = item.ad_data?.ad_started || new Date().toLocaleDateString();
        
        // If carousel_data exists, extract images and other data
        if (item.carousel_data) {
            if (item.carousel_data.images && Array.isArray(item.carousel_data.images)) {
                // Convert carousel_data.images to ad_data.images format
                images = item.carousel_data.images.map(img => ({
                    original_image_url: img.original_url || img.secure_url || '',
                    resized_image_url: img.secure_url || img.original_url || '',
                    ...img
                }));
            }
            // Extract platforms from carousel_data if available
            if (item.carousel_data.platforms && Array.isArray(item.carousel_data.platforms)) {
                platforms = item.carousel_data.platforms;
            }
            // Extract ad_started from carousel_data if available
            if (item.carousel_data.ad_started) {
                ad_started = item.carousel_data.ad_started;
            }
        }

        return {
            competitor_name: item.competitor_name || item.advertiser_name || 'Unknown Advertiser',
            content_type: item.content_type || 'text', // Preserve original content_type from N8N
            body: item.body || '',
            text_for_analysis: item.advertiser?.text_for_analysis || item.text_for_analysis || item.body || '',
            ai_analysis: item.ai_analysis || {},
            video_data: item.video_data || null, // Pass through video_data for video analysis
            ad_data: {
                platforms: platforms,
                ad_started: ad_started,
                page_profile_uri: item.ad_data?.page_profile_uri || '#',
                page_profile_picture_url: item.ad_data?.page_profile_picture_url || '',
                ad_text: item.advertiser?.text_for_analysis || item.ad_data?.ad_text || item.body || '', // Prefer text_for_analysis from advertiser, then ad_text, fallback to body
                videos: item.ad_data?.videos || [],
                images: images,
                cards: item.ad_data?.cards || []
            }
        };
    }
}

window.DataProcessor = DataProcessor;