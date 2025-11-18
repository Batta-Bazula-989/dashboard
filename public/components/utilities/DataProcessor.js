class DataProcessor {
    static process(item) {
        if (!item || typeof item !== 'object') return null;

        return {
            competitor_name: item.competitor_name || 'Unknown Advertiser',
            content_type: item.content_type || 'text', // Preserve original content_type from N8N
            body: item.body || '',
            ai_analysis: item.ai_analysis || {},
            ad_data: {
                platforms: item.ad_data?.platforms || [],
                ad_started: item.ad_data?.ad_started || new Date().toLocaleDateString(),
                page_profile_uri: item.ad_data?.page_profile_uri || '#',
                page_profile_picture_url: item.ad_data?.page_profile_picture_url || '',
                ad_text: item.ad_data?.ad_text || '',
                videos: item.ad_data?.videos || [],
                images: item.ad_data?.images || [],
                cards: item.ad_data?.cards || []
            }
        };
    }
}

window.DataProcessor = DataProcessor;