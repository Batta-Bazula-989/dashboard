/**
 * Card Builder
 * Builds competitor card DOM elements
 */
class CardBuilder {
    constructor(onShowFullAnalysis) {
        this.onShowFullAnalysis = onShowFullAnalysis;
    }

    build(entry) {
        const card = document.createElement('div');
        card.className = 'card';

        card.appendChild(this.buildHeader(entry));
        card.appendChild(this.buildDivider());

        if (entry.ad_data?.ad_text) {
            card.appendChild(this.buildAdText(entry.ad_data.ad_text));
        }

        if (entry.ad_data?.videos?.[0]?.video_preview_image_url) {
            card.appendChild(this.buildVideoThumbnail(entry.ad_data.videos[0]));
        }

        if (entry.ai_analysis) {
            card.appendChild(
                AnalysisSections.createTextAnalysis(
                    entry.ai_analysis,
                    this.onShowFullAnalysis,
                    entry.competitor_name
                )
            );
        }

        return card;
    }

    buildHeader(entry) {
        const header = document.createElement('div');
        header.className = 'card-header';

        // Avatar
        const img = document.createElement('img');
        img.className = 'avatar';
        img.src = entry.ad_data?.page_profile_picture_url || '';
        img.alt = 'Profile';
        header.appendChild(img);

        // Content wrapper (name + social icons + date)
        const contentWrap = document.createElement('div');
        contentWrap.className = 'header-content';

        // Name row
        const nameRow = document.createElement('div');
        nameRow.className = 'name-row';
        
        const nameLink = this.buildNameLink(entry);
        nameRow.appendChild(nameLink);
        
        contentWrap.appendChild(nameRow);
        
        // Social icons row (where red line is drawn)
        const platforms = entry.ad_data?.platforms || [];
        if (platforms.length > 0) {
            const socialIconsRow = this.buildSocialIconsRow(platforms);
            contentWrap.appendChild(socialIconsRow);
        }
        
        // Date below social icons
        const meta = this.buildMeta(entry.ad_data?.ad_started);
        contentWrap.appendChild(meta);

        header.appendChild(contentWrap);
        
        // View Profile link on the right
        const viewProfileLink = this.buildViewProfileLink(entry.ad_data?.page_profile_uri);
        header.appendChild(viewProfileLink);
        
        return header;
    }

    buildSocialIconsRow(platforms) {
        const row = document.createElement('div');
        row.className = 'social-icons-row';

        platforms.forEach(platform => {
            const icon = this.buildSingleSocialIcon(platform);
            row.appendChild(icon);
        });

        return row;
    }

    buildSocialIconsGrid(platforms) {
        const grid = document.createElement('div');
        grid.className = 'social-icons-grid';

        platforms.forEach(platform => {
            const icon = this.buildSingleSocialIcon(platform);
            grid.appendChild(icon);
        });

        return grid;
    }

    buildSingleSocialIcon(platform) {
        const icon = document.createElement('span');
        icon.className = 'social-icon';

        // Normalize to lowercase before getting icon
        const platformLower = String(platform).toLowerCase();
        const iconSvg = PlatformIcons.getIcon(platformLower);

        if (iconSvg && iconSvg.startsWith('<svg')) {
            icon.innerHTML = iconSvg;
            icon.title = platform; // Original case for tooltip
        } else {
            // Fallback: Show first letter
            icon.textContent = platform.substring(0, 1).toUpperCase();
        }

        return icon;
    }

    buildNameLink(entry) {
        const link = document.createElement('a');
        link.href = entry.ad_data?.page_profile_uri || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = entry.competitor_name || 'Unknown competitor';
        return link;
    }

buildPlatformBadges(platforms) {
    const badges = document.createElement('div');
    badges.className = 'badges';

    (platforms || []).forEach(platform => {
        const badge = document.createElement('span');
        badge.className = 'badge platform-badge';

        // ✅ Normalize to lowercase before getting icon
        const platformLower = String(platform).toLowerCase();
        const icon = PlatformIcons.getIcon(platformLower); // ✅ Correct method name

        if (icon && icon.startsWith('<svg')) {
            badge.innerHTML = icon;
            badge.title = platform; // Original case for tooltip
        } else {
            // Fallback: Show first 2 letters (FB, IG, etc.)
            badge.textContent = platform.substring(0, 2).toUpperCase();
        }

        badges.appendChild(badge);
    });

    return badges;
}

    buildViewProfileLink(uri) {
        const link = document.createElement('a');
        link.className = 'view-profile-link';
        link.href = uri || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.innerHTML = 'View Profile <span>↗</span>';
        return link;
    }

    buildMeta(date) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = date || 'N/A';
        return meta;
    }

    buildDivider() {
        const divider = document.createElement('div');
        divider.className = 'content-divider';
        return divider;
    }

    buildAdText(text) {
        const ad = document.createElement('div');
        ad.className = 'ad-text';
        ad.textContent = text;
        return ad;
    }

    buildVideoThumbnail(video) {
        const videoElement = document.createElement('video');
        videoElement.className = 'video-thumb';
        videoElement.controls = true;
        videoElement.preload = 'metadata';
        
        // Set poster image (thumbnail)
        if (video.video_preview_image_url) {
            videoElement.poster = video.video_preview_image_url;
        }
        
        // Add video source
        const source = document.createElement('source');
        source.src = video.video_sd_url || video.video_hd_url || video.video_preview_image_url;
        source.type = 'video/mp4';
        
        videoElement.appendChild(source);
        
        // Fallback text
        const fallback = document.createTextNode('Your browser doesn\'t support video playback.');
        videoElement.appendChild(fallback);
        
        return videoElement;
    }
}

window.CardBuilder = CardBuilder;