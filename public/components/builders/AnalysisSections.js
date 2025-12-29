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
        btn.textContent = '⋯';
        btn.onclick = () => onShowFullAnalysis(competitorName, { ai_analysis: aiAnalysis });
        header.appendChild(btn);

        preview.appendChild(header);

        // Content with metrics - use DOMParser for safe HTML parsing
        const content = document.createElement('div');
        content.className = 'ai-preview-content';
        const metricsHTML = this.buildMetrics(aiAnalysis);
        if (metricsHTML) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(metricsHTML, 'text/html');
            const fragment = document.createDocumentFragment();
            Array.from(doc.body.childNodes).forEach(node => {
                fragment.appendChild(node.cloneNode(true));
            });
            content.appendChild(fragment);
        } else {
            content.textContent = 'Аналіз доступний';
        }
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
        btn.textContent = '⋯';
        btn.onclick = () => onShowFullAnalysis(
            `${Sanitizer.escapeHTML(videoData.competitor_name || '')} - Video Analysis`,
            videoData
        );
        header.appendChild(btn);

        section.appendChild(header);

        // Content with metrics - use DOMParser for safe HTML parsing
        const content = document.createElement('div');
        content.className = 'ai-preview-content';
        const metricsHTML = this.buildMetrics(videoData.ai_analysis);
        if (metricsHTML) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(metricsHTML, 'text/html');
            const fragment = document.createDocumentFragment();
            Array.from(doc.body.childNodes).forEach(node => {
                fragment.appendChild(node.cloneNode(true));
            });
            content.appendChild(fragment);
        } else {
            content.textContent = 'Аналіз доступний';
        }
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
        btn.textContent = '⋯';
        btn.onclick = () => onShowFullAnalysis(
            `${Sanitizer.escapeHTML(carouselData.competitor_name || '')} - Carousel Analysis`,
            carouselData
        );
        header.appendChild(btn);

        section.appendChild(header);

        // Content with metrics - use DOMParser for safe HTML parsing
        const content = document.createElement('div');
        content.className = 'ai-preview-content';
        const metricsHTML = this.buildCarouselMetrics(carouselData.ai_analysis);
        if (metricsHTML) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(metricsHTML, 'text/html');
            const fragment = document.createDocumentFragment();
            Array.from(doc.body.childNodes).forEach(node => {
                fragment.appendChild(node.cloneNode(true));
            });
            content.appendChild(fragment);
        } else {
            content.textContent = 'Аналіз доступний';
        }
        section.appendChild(content);

        return section;
    }

    static createImageAnalysis(imageData, onShowFullAnalysis) {
        // Use EXACT same structure as TEXT analysis (ai-preview class)
        const preview = document.createElement('div');
        preview.className = 'ai-preview';

        // Header with IMAGE badge and ⋯ button
        const header = document.createElement('div');
        header.className = 'analysis-header';

        const badge = document.createElement('div');
        badge.className = 'analysis-badge';
        badge.textContent = 'IMAGE';
        header.appendChild(badge);

        const btn = document.createElement('button');
        btn.className = 'full-analysis-btn';
        btn.textContent = '⋯';
        btn.onclick = () => onShowFullAnalysis(
            `${Sanitizer.escapeHTML(imageData.competitor_name || '')} - Image Analysis`,
            imageData
        );
        header.appendChild(btn);

        preview.appendChild(header);

        // Content - extract preview from OpenAI response
        const content = document.createElement('div');
        content.className = 'ai-preview-content';

        // Extract text from OpenAI response for preview
        let previewText = 'Аналіз доступний';
        if (imageData.ai_analysis?.choices?.[0]?.message?.content) {
            const fullText = imageData.ai_analysis.choices[0].message.content;
            // Show first 150 characters as preview
            previewText = fullText.substring(0, 150) + (fullText.length > 150 ? '...' : '');
        }

        content.textContent = previewText;
        preview.appendChild(content);

        return preview;
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

    static buildCarouselMetrics(analysis) {
        if (!analysis || typeof analysis !== 'object') {
            return 'Аналіз доступний';
        }

        let html = '';

        // Marketing section - offer_type
        if (analysis.marketing?.offer_type) {
            const offerType = Sanitizer.escapeHTML(String(analysis.marketing.offer_type));
            html += `
                <div class="metric-row">
                    <span class="metric-label">Тип оффера:</span>
                    <span class="metric-value">${offerType}</span>
                </div>
            `;
        }

        // Sales section - value_proposition (can be string or object with score)
        if (analysis.sales?.value_proposition) {
            let valueProp = analysis.sales.value_proposition;
            if (typeof valueProp === 'object' && valueProp.score !== undefined) {
                valueProp = `${valueProp.score}/10`;
            } else if (typeof valueProp === 'string') {
                valueProp = valueProp;
            } else {
                valueProp = String(valueProp);
            }
            const escapedValueProp = Sanitizer.escapeHTML(valueProp);
            html += `
                <div class="metric-row">
                    <span class="metric-label">Value proposition:</span>
                    <span class="metric-value">${escapedValueProp}</span>
                </div>
            `;
        }

        // Technical section - quality
        if (analysis.technical?.quality) {
            const quality = Sanitizer.escapeHTML(String(analysis.technical.quality));
            html += `
                <div class="metric-row">
                    <span class="metric-label">Якість:</span>
                    <span class="metric-value">${quality}</span>
                </div>
            `;
        }

        // Marketing section - funnel_stage
        if (analysis.marketing?.funnel_stage) {
            const funnelStage = Sanitizer.escapeHTML(String(analysis.marketing.funnel_stage));
            html += `
                <div class="metric-row">
                    <span class="metric-label">Стадія воронки:</span>
                    <span class="metric-value">${funnelStage}</span>
                </div>
            `;
        }

        // Sales section - cta
        if (analysis.sales?.cta) {
            const cta = Sanitizer.escapeHTML(String(analysis.sales.cta));
            html += `
                <div class="metric-row">
                    <span class="metric-label">CTA:</span>
                    <span class="metric-value">${cta}</span>
                </div>
            `;
        }

        // Metrics section - novelty
        if (analysis.metrics?.novelty) {
            const novelty = Sanitizer.escapeHTML(String(analysis.metrics.novelty));
            html += `
                <div class="metric-row">
                    <span class="metric-label">Novelty:</span>
                    <span class="metric-value">${novelty}</span>
                </div>
            `;
        }

        return html || 'Аналіз доступний';
    }
}

window.AnalysisSections = AnalysisSections;