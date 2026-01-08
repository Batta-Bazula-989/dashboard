class DataProcessor {
    static process(item) {
        if (!item || typeof item !== 'object') return null;

        let images = item.ad_data?.images || [];
        let platforms = item.ad_data?.platforms || [];
        let ad_started = item.ad_data?.ad_started || new Date().toLocaleDateString();

        // Handle carousel_data - convert to ad_data.images if present
        if (item.carousel_data) {
            if (item.carousel_data.images && Array.isArray(item.carousel_data.images)) {
                images = item.carousel_data.images.map(img => ({
                    original_image_url: img.original_url || img.secure_url || '',
                    resized_image_url: img.secure_url || img.original_url || '',
                    ...img
                }));
            }
            if (item.carousel_data.platforms && Array.isArray(item.carousel_data.platforms)) {
                platforms = item.carousel_data.platforms;
            }
            if (item.carousel_data.ad_started) {
                ad_started = item.carousel_data.ad_started;
            }
        }

        // ✅ Preserve content_type from n8n (critical for routing)
        const contentType = item.content_type || 'text';

        return {
            competitor_name: item.competitor_name || item.advertiser_name || 'Unknown Advertiser',
            content_type: contentType, // ✅ Preserve original content_type
            body: item.body || '',
            text_for_analysis: item.advertiser?.text_for_analysis || item.text_for_analysis || item.body || '',
            matching_key: item.ad_uuid || item.matching_key || null,  // ✅ Use ad_uuid first
            ai_analysis: item.ai_analysis || {},
            video_data: item.video_data || null,
            ad_data: {
                platforms: platforms,
                ad_started: ad_started,
                page_profile_uri: item.ad_data?.page_profile_uri || '#',
                page_profile_picture_url: item.ad_data?.page_profile_picture_url || '',
                ad_text: item.advertiser?.text_for_analysis || item.ad_data?.ad_text || item.body || '',
                videos: item.ad_data?.videos || [],
                images: images,
                cards: item.ad_data?.cards || []
            }
        };
    }
}

window.DataProcessor = DataProcessor;