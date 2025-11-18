class AnalysisSections {
    static createTextAnalysis(aiAnalysis, onShowFullAnalysis, competitorName) {
        const preview = document.createElement('div');
        preview.className = 'ai-preview';

        // Header with TEXT badge and ⋯ button
        const header = document.createElement('div');
        header.className = 'analysis-header';

        const badge = document.createElement('div');
        badge.className = 'analysis-badge';
        badge.textContent = 'TEXT';
        header.appendChild(badge);

        const btn = document.createElement('button');
        btn.className = 'full-analysis-btn';
        btn.innerHTML = '⋯';
        btn.onclick = () => onShowFullAnalysis(competitorName, { ai_analysis: aiAnalysis });
        header.appendChild(btn);

        preview.appendChild(header);

        // Content with metrics
        const content = document.createElement('div');
        content.className = 'ai-preview-content';
        content.innerHTML = this.buildMetrics(aiAnalysis);
        preview.appendChild(content);

        return preview;
    }

    static createVideoAnalysis(videoData, onShowFullAnalysis) {
        const section = document.createElement('div');
        section.className = 'video-analysis-section';

        // Header with VIDEO badge
        const header = document.createElement('div');
        header.className = 'analysis-header';

        const badge = document.createElement('div');
        badge.className = 'analysis-badge';
        badge.textContent = 'VIDEO';
        header.appendChild(badge);

        const btn = document.createElement('button');
        btn.className = 'full-analysis-btn';
        btn.innerHTML = '⋯';
        btn.onclick = () => onShowFullAnalysis(
            `${videoData.competitor_name} - Video Analysis`,
            videoData
        );
        header.appendChild(btn);

        section.appendChild(header);

        // Content with metrics
        const content = document.createElement('div');
        content.className = 'ai-preview-content';
        content.innerHTML = this.buildMetrics(videoData.ai_analysis);
        section.appendChild(content);

        return section;
    }

    static createCarouselAnalysis(carouselData, onShowFullAnalysis) {
        const section = document.createElement('div');
        section.className = 'carousel-analysis-section';

        // Header with CAROUSEL badge
        const header = document.createElement('div');
        header.className = 'analysis-header';

        const badge = document.createElement('div');
        badge.className = 'analysis-badge';
        badge.textContent = 'CAROUSEL';
        header.appendChild(badge);

        const btn = document.createElement('button');
        btn.className = 'full-analysis-btn';
        btn.innerHTML = '⋯';
        btn.onclick = () => onShowFullAnalysis(
            `${carouselData.competitor_name} - Carousel Analysis`,
            carouselData
        );
        header.appendChild(btn);

        section.appendChild(header);

        // Content with metrics
        const content = document.createElement('div');
        content.className = 'ai-preview-content';
        content.innerHTML = this.buildMetrics(carouselData.ai_analysis);
        section.appendChild(content);

        return section;
    }

    static buildMetrics(analysis) {
        if (!analysis || typeof analysis !== 'object') {
            return 'Аналіз доступний';
        }

        let html = '';

        if (analysis.copywriting?.offer_clarity) {
            const score = Sanitizer.escapeHTML(String(analysis.copywriting.offer_clarity.score));
            html += `
                <div class="metric-row">
                    <span class="metric-label">Ясність оффера:</span>
                    <span class="metric-value">${score}/10</span>
                </div>
            `;
        }

        if (analysis.marketing?.offer_type) {
            const offerType = Sanitizer.escapeHTML(String(analysis.marketing.offer_type));
            html += `
                <div class="metric-row">
                    <span class="metric-label">Тип оффера:</span>
                    <span class="metric-value">${offerType}</span>
                </div>
            `;
        }

        if (analysis.sales?.value_proposition) {
            const score = Sanitizer.escapeHTML(String(analysis.sales.value_proposition.score));
            html += `
                <div class="metric-row">
                    <span class="metric-label">Value proposition:</span>
                    <span class="metric-value">${score}/10</span>
                </div>
            `;
        }

        return html || 'Аналіз доступний';
    }
}

window.AnalysisSections = AnalysisSections;