class Modal {
    constructor() {
        this.currentModal = null;
        this.escapeHandler = null; // Store reference for cleanup
    }

    /**
     * Show full analysis in a modal
     * @param {string} competitorName - Name of the competitor
     * @param {Object|string} fullAnalysis - Full analysis data
     */
    showFullAnalysis(competitorName, fullAnalysis) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        };

        const modal = document.createElement('div');
        modal.className = 'modal-content';

        const body = document.createElement('div');
        body.className = 'modal-body';

        const content = document.createElement('div');
        content.className = 'modal-analysis-content';

        const formattedContent = this.formatSectionContent(fullAnalysis);
        content.innerHTML = formattedContent;

        body.appendChild(content);
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        this.currentModal = overlay;

        // Store ESC handler reference for cleanup
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    /**
     * Format section content
     * @param {Object|string} content - Content to format
     * @returns {string} Formatted HTML content
     */
    formatSectionContent(content) {
        // Extract ai_analysis
        if (typeof content === 'object' && content.copywriting) {
            return this.formatJsonAnalysis(content);
        }

        if (typeof content === 'object' && content.ai_analysis) {
            return this.formatJsonAnalysis(content.ai_analysis);
        }

        if (typeof content === 'string' && content.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(content);
                if (parsed.copywriting || parsed.ai_analysis) {
                    return this.formatJsonAnalysis(parsed.ai_analysis || parsed);
                }
            } catch (e) {
                console.error('Failed to parse JSON:', e);
            }
        }

        // Fallback
        const safe = Sanitizer.escapeHTML(
            typeof content === 'object' ? JSON.stringify(content, null, 2) : content
        );

        return `<div class="clean-section">
            <div class="section-pill">АНАЛІЗ</div>
            <div class="clean-cards">
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-description">${safe}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    /**
     * Format JSON analysis structure
     * @param {Object} analysis - AI analysis object
     * @returns {string} Formatted HTML content
     */
    formatJsonAnalysis(analysis) {
        // Check if video analysis format
        if (analysis.technical || analysis.visual_and_editing || analysis.people_and_product) {
            return this.formatVideoAnalysis(analysis);
        }

        let formatted = '';

        if (analysis.copywriting) {
            formatted += this.formatJsonSection('КОПІРАЙТИНГ', analysis.copywriting, [
                { key: 'offer_clarity', label: 'Ясність оффера' },
                { key: 'specificity', label: 'Конкретика' },
                { key: 'language_simplicity', label: 'Простота мови' },
                { key: 'tone_of_voice', label: 'Тон голосу' },
                { key: 'structure', label: 'Структура' },
                { key: 'offer_usp_separation', label: 'Розділення оффера та УТП' }
            ]);
        }

        if (analysis.marketing) {
            formatted += this.formatJsonSection('МАРКЕТИНГ', analysis.marketing, [
                { key: 'offer_type', label: 'Тип оффера' },
                { key: 'funnel_stage', label: 'Стадія воронки' },
                { key: 'funnel_reasoning', label: 'Обґрунтування стадії' },
                { key: 'consistency', label: 'Узгодженість' },
                { key: 'originality', label: 'Оригінальність' },
                { key: 'seasonality', label: 'Сезонність' },
                { key: 'mini_swot', label: 'Mini-SWOT' }
            ]);
        }

        if (analysis.psychology) {
            formatted += this.formatJsonSection('ПСИХОЛОГІЯ', analysis.psychology, [
                { key: 'main_drivers', label: 'Основні драйвери' },
                { key: 'structure_used', label: 'Використана структура' },
                { key: 'hook_phrase', label: 'Хук-фраза' },
                { key: 'storytelling', label: 'Сторітелінг' },
                { key: 'influence_techniques', label: 'Прийоми впливу' },
                { key: 'tonality', label: 'Тональність' }
            ]);
        }

        if (analysis.sales) {
            formatted += this.formatJsonSection('ПРОДАЖІ', analysis.sales, [
                { key: 'value_proposition', label: 'Value proposition' },
                { key: 'cta_strength', label: 'Сила CTA' },
                { key: 'risk_reversal', label: 'Ризик-реверс' },
                { key: 'price_psychology', label: 'Цінова психологія' }
            ]);
        }

        if (analysis.metrics) {
            formatted += this.formatJsonSection('МЕТРИКИ ТА ПРОГНОЗ', analysis.metrics, [
                { key: 'rotation_insight', label: 'Rotation insight' },
                { key: 'novelty', label: 'Novelty' }
            ]);
        }

        if (analysis.recommendations) {
            formatted += this.formatRecommendationsSection(analysis.recommendations);
        }

        return formatted;
    }

    /**
     * Format video analysis
     * @param {Object} analysis - Video analysis object
     * @returns {string} Formatted HTML
     */
    formatVideoAnalysis(analysis) {
        let formatted = '';

        if (analysis.technical) {
            formatted += this.formatVideoSection('ТЕХНІЧНІ ХАРАКТЕРИСТИКИ', analysis.technical, [
                { key: 'format', label: 'Формат' },
                { key: 'quality', label: 'Якість' },
                { key: 'subtitles', label: 'Субтитри' }
            ]);
        }

        if (analysis.visual_and_editing) {
            formatted += this.formatVideoSection('ВІЗУАЛ ТА МОНТАЖ', analysis.visual_and_editing, [
                { key: 'hook_first_seconds', label: 'Хук перші секунди' },
                { key: 'tempo', label: 'Темп' },
                { key: 'scene_variety', label: 'Різноманітність сцен' },
                { key: 'overall_style', label: 'Загальний стиль' }
            ]);
        }

        if (analysis.people_and_product) {
            formatted += this.formatVideoSection('ЛЮДИ ТА ПРОДУКТ', analysis.people_and_product, [
                { key: 'people_description', label: 'Опис людей' },
                { key: 'influencers', label: 'Інфлюенсери' },
                { key: 'product_presentation', label: 'Презентація продукту' },
                { key: 'branding_visibility', label: 'Видимість брендингу' }
            ]);
        }

        if (analysis.marketing) {
            formatted += this.formatVideoSection('МАРКЕТИНГ', analysis.marketing, [
                { key: 'offer_type', label: 'Тип оффера' },
                { key: 'funnel_stage', label: 'Стадія воронки' },
                { key: 'placement_fit', label: 'Підходящість розміщення' }
            ]);
        }

        if (analysis.psychology) {
            formatted += this.formatVideoSection('ПСИХОЛОГІЯ', analysis.psychology, [
                { key: 'drivers', label: 'Драйвери' },
                { key: 'techniques', label: 'Техніки' }
            ]);
        }

        if (analysis.sales) {
            formatted += this.formatVideoSection('ПРОДАЖІ', analysis.sales, [
                { key: 'cta', label: 'CTA' },
                { key: 'price_signals', label: 'Цінові сигнали' },
                { key: 'risk_reversal', label: 'Ризик-реверс' }
            ]);
        }

        if (analysis.metrics) {
            formatted += this.formatVideoSection('МЕТРИКИ', analysis.metrics, [
                { key: 'rotation_insight', label: 'Rotation insight' },
                { key: 'novelty', label: 'Novelty' }
            ]);
        }

        if (analysis.recommendations) {
            formatted += this.formatRecommendationsSection(analysis.recommendations);
        }

        if (analysis.summary) {
            formatted += this.formatVideoSection('ПІДСУМОК', analysis.summary, [
                { key: 'what_advertised', label: 'Що рекламується' },
                { key: 'creative_quality', label: 'Якість креативу' },
                { key: 'strengths', label: 'Сильні сторони' },
                { key: 'weaknesses', label: 'Слабкі сторони' }
            ]);
        }

        return formatted;
    }

    /**
     * Format video section (text-based)
     * @param {string} title - Section title
     * @param {Object} data - Section data
     * @param {Array} fields - Fields to display
     * @returns {string} Formatted HTML
     */
    formatVideoSection(title, data, fields) {
        let formatted = `
            <div class="clean-section">
                <div class="section-pill">${Sanitizer.escapeHTML(title)}</div>
                <div class="clean-cards">
        `;

        fields.forEach(field => {
            const value = data[field.key];
            if (value !== undefined && value !== null) {
                const icon = ModalIcons.get(field.key);
                const safeValue = Sanitizer.escapeHTML(String(value));
                const safeLabel = Sanitizer.escapeHTML(field.label);

                formatted += `
                    <div class="clean-card">
                        <div class="clean-icon">${icon}</div>
                        <div class="clean-content">
                            <div class="clean-title">${safeLabel}</div>
                            <div class="clean-description">${safeValue}</div>
                        </div>
                    </div>
                `;
            }
        });

        formatted += `
                </div>
            </div>
        `;

        return formatted;
    }

    /**
     * Format JSON section (score-based)
     * @param {string} title - Section title
     * @param {Object} data - Section data
     * @param {Array} fields - Fields to display
     * @returns {string} Formatted HTML
     */
    formatJsonSection(title, data, fields) {
        let formatted = `
            <div class="clean-section">
                <div class="section-pill">${Sanitizer.escapeHTML(title)}</div>
                <div class="clean-cards">
        `;

        fields.forEach(field => {
            const value = data[field.key];
            if (value !== undefined && value !== null) {
                const safeLabel = Sanitizer.escapeHTML(field.label);

                if (typeof value === 'object' && value.score !== undefined) {
                    const icon = ModalIcons.get(field.key);
                    const safeDesc = Sanitizer.escapeHTML(value.description || '');

                    formatted += `
                        <div class="clean-card">
                            <div class="clean-icon">${icon}</div>
                            <div class="clean-content">
                                <div class="clean-title">${safeLabel}</div>
                                <div class="clean-description">${safeDesc}</div>
                            </div>
                        </div>
                    `;
                } else if (typeof value === 'object' && field.key === 'mini_swot') {
                    formatted += `
                        <div class="clean-card swot-card">
                            <div class="clean-content">
                                <div class="clean-title">${safeLabel}</div>
                                <div class="swot-content">
                                    <div class="swot-row">
                                        <span class="swot-label">S:</span>
                                        <span class="swot-text">${Sanitizer.escapeHTML(value.strengths || '')}</span>
                                    </div>
                                    <div class="swot-row">
                                        <span class="swot-label">W:</span>
                                        <span class="swot-text">${Sanitizer.escapeHTML(value.weaknesses || '')}</span>
                                    </div>
                                    <div class="swot-row">
                                        <span class="swot-label">O:</span>
                                        <span class="swot-text">${Sanitizer.escapeHTML(value.opportunities || '')}</span>
                                    </div>
                                    <div class="swot-row">
                                        <span class="swot-label">T:</span>
                                        <span class="swot-text">${Sanitizer.escapeHTML(value.threats || '')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    const icon = ModalIcons.get(field.key);
                    const safeValue = Sanitizer.escapeHTML(String(value));

                    formatted += `
                        <div class="clean-card">
                            <div class="clean-icon">${icon}</div>
                            <div class="clean-content">
                                <div class="clean-title">${safeLabel}</div>
                                <div class="clean-description">${safeValue}</div>
                            </div>
                        </div>
                    `;
                }
            }
        });

        formatted += `
                </div>
            </div>
        `;

        return formatted;
    }

    /**
     * Format recommendations section
     * @param {Object} recommendations - Recommendations data
     * @returns {string} Formatted HTML
     */
formatRecommendationsSection(recommendations) {
    let formatted = `
        <div class="clean-section recommendations-section">
            <div class="section-pill recommendations-header">РЕКОМЕНДАЦІЇ</div>
            <div class="recommendations-container">
    `;

    // Inline Notes Section
    if (recommendations.inline_notes && recommendations.inline_notes.length > 0) {
        formatted += `
            <div class="recommendation-subsection">
                <div class="subsection-title inline-notes">ІНЛАЙН-ПОМЕТКИ</div>
                <div class="inline-notes-container">
        `;
        
        recommendations.inline_notes.forEach((note, index) => {
            const safeQuoted = Sanitizer.escapeHTML(note.quoted_text);
            const safeComment = Sanitizer.escapeHTML(note.comment);
            formatted += `
                <div class="inline-note-item">
                    <div class="note-number">${index + 1}.</div>
                    <div class="note-content">
                        <div class="quoted-text">"${safeQuoted}"</div>
                        <div class="comment">— ${safeComment}</div>
                    </div>
                </div>
            `;
        });
        
        formatted += `
                </div>
            </div>
        `;
    }

    // Quick Wins Section
    if (recommendations.quick_wins && recommendations.quick_wins.length > 0) {
        formatted += `
            <div class="recommendation-subsection">
                <div class="subsection-title quick-wins">QUICK WINS (1 ДЕНЬ)</div>
                <div class="recommendation-list">
        `;
        
        recommendations.quick_wins.forEach((win, index) => {
            const safeWin = Sanitizer.escapeHTML(win);
            formatted += `
                <div class="recommendation-item">
                    <span class="item-number">${index + 1}.</span>
                    <span class="item-text">${safeWin}</span>
                </div>
            `;
        });
        
        formatted += `
                </div>
            </div>
        `;
    }

    // Tactical Improvements Section
    if (recommendations.tactical && recommendations.tactical.length > 0) {
        formatted += `
            <div class="recommendation-subsection">
                <div class="subsection-title tactical">TACTICAL ПОКРАЩЕННЯ (ТИЖДЕНЬ)</div>
                <div class="recommendation-list">
        `;
        
        recommendations.tactical.forEach((item, index) => {
            const safeItem = Sanitizer.escapeHTML(item);
            formatted += `
                <div class="recommendation-item">
                    <span class="item-number">${index + 1}.</span>
                    <span class="item-text">${safeItem}</span>
                </div>
            `;
        });
        
        formatted += `
                </div>
            </div>
        `;
    }

    // Strategic Ideas Section
    if (recommendations.strategic && recommendations.strategic.length > 0) {
        formatted += `
            <div class="recommendation-subsection">
                <div class="subsection-title strategic">STRATEGIC ІДЕЯ (КВАРТАЛ)</div>
                <div class="recommendation-list">
        `;
        
        recommendations.strategic.forEach((item, index) => {
            const safeItem = Sanitizer.escapeHTML(item);
            formatted += `
                <div class="recommendation-item">
                    <span class="item-number">${index + 1}.</span>
                    <span class="item-text">${safeItem}</span>
                </div>
            `;
        });
        
        formatted += `
                </div>
            </div>
        `;
    }

    formatted += `
            </div>
        </div>
    `;

    return formatted;
}

    /**
     * Close the current modal (with cleanup)
     */
    closeModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }

        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    }

    /**
     * Check if modal is currently open
     * @returns {boolean}
     */
    isOpen() {
        return this.currentModal !== null;
    }
}

window.Modal = Modal;