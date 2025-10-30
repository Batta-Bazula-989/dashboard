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

    static buildMetrics(analysis) {
        if (!analysis || typeof analysis !== 'object') {
            return 'Аналіз доступний';
        }

        let html = '';

        if (analysis.copywriting?.offer_clarity) {
            html += `
                <div class="metric-row">
                    <span class="metric-label">Ясність оффера:</span>
                    <span class="metric-value">${analysis.copywriting.offer_clarity.score}/10</span>
                </div>
            `;
        }

        if (analysis.marketing?.offer_type) {
            html += `
                <div class="metric-row">
                    <span class="metric-label">Тип оффера:</span>
                    <span class="metric-value">${analysis.marketing.offer_type}</span>
                </div>
            `;
        }

        if (analysis.sales?.value_proposition) {
            html += `
                <div class="metric-row">
                    <span class="metric-label">Value proposition:</span>
                    <span class="metric-value">${analysis.sales.value_proposition.score}/10</span>
                </div>
            `;
        }

        return html || 'Аналіз доступний';
    }
}

window.AnalysisSections = AnalysisSections;