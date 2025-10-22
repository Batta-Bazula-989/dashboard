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

        // Title and meta
        const titleWrap = document.createElement('div');
        titleWrap.className = 'title-wrap';

        titleWrap.appendChild(this.buildTitleRow(entry));
        titleWrap.appendChild(this.buildMeta(entry.ad_data?.ad_started));

        header.appendChild(titleWrap);
        return header;
    }

    buildTitleRow(entry) {
        const row = document.createElement('div');
        row.className = 'title-row';

        // Left: Name + badges
        const leftGroup = document.createElement('div');
        leftGroup.className = 'title-left-group';

        leftGroup.appendChild(this.buildNameLink(entry));
        leftGroup.appendChild(this.buildPlatformBadges(entry.ad_data?.platforms));

        row.appendChild(leftGroup);

        // Right: View Profile link
        row.appendChild(this.buildViewProfileLink(entry.ad_data?.page_profile_uri));

        return row;
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

            const icon = PlatformIcons.getIcon(platform);
            if (icon.startsWith('<svg')) {
                badge.innerHTML = icon;
                badge.title = platform;
            } else {
                badge.textContent = icon;
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
        const img = document.createElement('img');
        img.className = 'video-thumb';
        img.src = video.video_preview_image_url;
        img.alt = 'Video preview';
        img.onclick = () => {
            const url = video.video_sd_url || video.video_preview_image_url;
            window.open(url, '_blank');
        };
        return img;
    }
}

window.CardBuilder = CardBuilder;