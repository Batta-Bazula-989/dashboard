/**
 * Modal component for displaying full analysis
 * Handles structured JSON analysis data
 */
class Modal {
    constructor() {
        this.currentModal = null;
    }

    /**
     * Show full analysis in a modal
     * @param {string} competitorName - Name of the competitor
     * @param {Object|string} fullAnalysis - Full analysis data (JSON object or text)
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

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Format section content with clean sections and inline notes
     * @param {Object|string} content - Content to format (JSON object or text)
     * @returns {string} Formatted HTML content
     */
    formatSectionContent(content) {
        console.log('Modal formatSectionContent received:', typeof content, content);
        
        // If content is already the ai_analysis object (has copywriting, marketing, etc.)
        if (typeof content === 'object' && content.copywriting) {
            console.log('Detected ai_analysis object directly (old format)');
            return this.formatJsonAnalysis(content);
        }
        
        // If content has ai_analysis property, extract it
        if (typeof content === 'object' && content.ai_analysis) {
            console.log('Detected object with ai_analysis property');
            console.log('ai_analysis content:', content.ai_analysis);
            return this.formatJsonAnalysis(content.ai_analysis);
        }
        
        // If content is a string that looks like JSON, try to parse it
        if (typeof content === 'string' && content.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(content);
                console.log('Parsed JSON string:', parsed);
                if (parsed.copywriting) {
                    return this.formatJsonAnalysis(parsed);
                }
                if (parsed.ai_analysis) {
                    return this.formatJsonAnalysis(parsed.ai_analysis);
                }
            } catch (e) {
                console.log('Failed to parse JSON:', e);
            }
        }
        
        // Fallback to simple text display for backward compatibility
        console.log('Using fallback text display');
        return `<div class="analysis-section copywriting">
            <div class="section-header copywriting">
                <h3 class="section-title">АНАЛІЗ</h3>
            </div>
            <div class="section-content">
                <div class="analysis-item">
                    <div class="item-description">${typeof content === 'object' ? JSON.stringify(content, null, 2) : content}</div>
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
        console.log('formatJsonAnalysis called with:', analysis);
        console.log('Analysis keys:', Object.keys(analysis));
        console.log('Has technical:', !!analysis.technical);
        console.log('Has visual_and_editing:', !!analysis.visual_and_editing);
        console.log('Has people_and_product:', !!analysis.people_and_product);
        console.log('Has copywriting:', !!analysis.copywriting);
        
        let formatted = '';

        // Check if this is the new video analysis format (has technical, visual_and_editing, etc.)
        if (analysis.technical || analysis.visual_and_editing || analysis.people_and_product) {
            console.log('Detected new video analysis format');
            return this.formatVideoAnalysis(analysis);
        }

        // Skip advertiser and analyzed_text fields - they're already shown in the ad card
        // Only process the actual analysis sections

        // Copywriting section
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

        // Marketing section
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

        // Psychology section
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

        // Sales section
        if (analysis.sales) {
            formatted += this.formatJsonSection('ПРОДАЖІ', analysis.sales, [
                { key: 'value_proposition', label: 'Value proposition' },
                { key: 'cta_strength', label: 'Сила CTA' },
                { key: 'risk_reversal', label: 'Ризик-реверс' },
                { key: 'price_psychology', label: 'Цінова психологія' }
            ]);
        }

        // Metrics section
        if (analysis.metrics) {
            formatted += this.formatJsonSection('МЕТРИКИ ТА ПРОГНОЗ', analysis.metrics, [
                { key: 'rotation_insight', label: 'Rotation insight' },
                { key: 'novelty', label: 'Novelty' }
            ]);
        }

        // Recommendations section
        if (analysis.recommendations) {
            formatted += this.formatRecommendationsSection(analysis.recommendations);
        }
        
        return formatted;
    }

    /**
     * Format video analysis with new structure
     * @param {Object} analysis - Video analysis object
     * @returns {string} Formatted HTML content
     */
    formatVideoAnalysis(analysis) {
        console.log('formatVideoAnalysis called with:', analysis);
        let formatted = '';

        // Technical section
        if (analysis.technical) {
            formatted += this.formatVideoSection('ТЕХНІЧНІ ХАРАКТЕРИСТИКИ', analysis.technical, [
                { key: 'format', label: 'Формат' },
                { key: 'quality', label: 'Якість' },
                { key: 'subtitles', label: 'Субтитри' }
            ]);
        }

        // Visual and editing section
        if (analysis.visual_and_editing) {
            formatted += this.formatVideoSection('ВІЗУАЛ ТА МОНТАЖ', analysis.visual_and_editing, [
                { key: 'hook_first_seconds', label: 'Хук перші секунди' },
                { key: 'tempo', label: 'Темп' },
                { key: 'scene_variety', label: 'Різноманітність сцен' },
                { key: 'overall_style', label: 'Загальний стиль' }
            ]);
        }

        // People and product section
        if (analysis.people_and_product) {
            formatted += this.formatVideoSection('ЛЮДИ ТА ПРОДУКТ', analysis.people_and_product, [
                { key: 'people_description', label: 'Опис людей' },
                { key: 'influencers', label: 'Інфлюенсери' },
                { key: 'product_presentation', label: 'Презентація продукту' },
                { key: 'branding_visibility', label: 'Видимість брендингу' }
            ]);
        }

        // Marketing section
        if (analysis.marketing) {
            formatted += this.formatVideoSection('МАРКЕТИНГ', analysis.marketing, [
                { key: 'offer_type', label: 'Тип оффера' },
                { key: 'funnel_stage', label: 'Стадія воронки' },
                { key: 'placement_fit', label: 'Підходящість розміщення' }
            ]);
        }

        // Psychology section
        if (analysis.psychology) {
            formatted += this.formatVideoSection('ПСИХОЛОГІЯ', analysis.psychology, [
                { key: 'drivers', label: 'Драйвери' },
                { key: 'techniques', label: 'Техніки' }
            ]);
        }

        // Sales section
        if (analysis.sales) {
            formatted += this.formatVideoSection('ПРОДАЖІ', analysis.sales, [
                { key: 'cta', label: 'CTA' },
                { key: 'price_signals', label: 'Цінові сигнали' },
                { key: 'risk_reversal', label: 'Ризик-реверс' }
            ]);
        }

        // Metrics section
        if (analysis.metrics) {
            formatted += this.formatVideoSection('МЕТРИКИ', analysis.metrics, [
                { key: 'rotation_insight', label: 'Rotation insight' },
                { key: 'novelty', label: 'Novelty' }
            ]);
        }

        // Recommendations section
        if (analysis.recommendations) {
            formatted += this.formatRecommendationsSection(analysis.recommendations);
        }

        // Summary section
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
     * Format a video analysis section with text-based items
     * @param {string} title - Section title
     * @param {Object} data - Section data
     * @param {Array} fields - Fields to display
     * @returns {string} Formatted HTML
     */
    formatVideoSection(title, data, fields) {
        let formatted = `
            <div class="clean-section">
                <div class="section-pill">${title}</div>
                <div class="clean-cards">
        `;

        fields.forEach(field => {
            const value = data[field.key];
            if (value !== undefined && value !== null) {
                // Get icon for this field
                const icon = this.getFieldIcon(field.key, title);
                formatted += `
                    <div class="clean-card">
                        <div class="clean-icon">${icon}</div>
                        <div class="clean-content">
                            <div class="clean-title">${field.label}</div>
                            <div class="clean-description">${value}</div>
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
     * Format a JSON section with score-based items
     * @param {string} title - Section title
     * @param {Object} data - Section data
     * @param {Array} fields - Fields to display
     * @returns {string} Formatted HTML
     */
    formatJsonSection(title, data, fields) {
        let formatted = `
            <div class="clean-section">
                <div class="section-pill">${title}</div>
                <div class="clean-cards">
        `;

        fields.forEach(field => {
            const value = data[field.key];
            if (value !== undefined && value !== null) {
                if (typeof value === 'object' && value.score !== undefined) {
                    // Score-based field - remove score, just show description
                    const icon = this.getFieldIcon(field.key, title);
                    formatted += `
                        <div class="clean-card">
                            <div class="clean-icon">${icon}</div>
                            <div class="clean-content">
                                <div class="clean-title">${field.label}</div>
                                <div class="clean-description">${value.description || ''}</div>
                            </div>
                        </div>
                    `;
                } else if (typeof value === 'object' && field.key === 'mini_swot') {
                    // Mini-SWOT special handling
                    formatted += `
                        <div class="clean-card swot-card">
                            <div class="clean-content">
                                <div class="clean-title">${field.label}</div>
                                <div class="swot-content">
                                    <div class="swot-row">
                                        <span class="swot-label">S:</span>
                                        <span class="swot-text">${value.strengths || ''}</span>
                                    </div>
                                    <div class="swot-row">
                                        <span class="swot-label">W:</span>
                                        <span class="swot-text">${value.weaknesses || ''}</span>
                                    </div>
                                    <div class="swot-row">
                                        <span class="swot-label">O:</span>
                                        <span class="swot-text">${value.opportunities || ''}</span>
                                    </div>
                                    <div class="swot-row">
                                        <span class="swot-label">T:</span>
                                        <span class="swot-text">${value.threats || ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Simple text field
                    const icon = this.getFieldIcon(field.key, title);
                    formatted += `
                        <div class="clean-card">
                            <div class="clean-icon">${icon}</div>
                            <div class="clean-content">
                                <div class="clean-title">${field.label}</div>
                                <div class="clean-description">${value}</div>
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
            <div class="clean-section">
                <div class="section-pill">РЕКОМЕНДАЦІЇ</div>
                <div class="clean-cards">
        `;

        // Inline notes
        if (recommendations.inline_notes && recommendations.inline_notes.length > 0) {
            formatted += `
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-title">ІНЛАЙН-ПОМЕТКИ</div>
                        <div class="clean-description">
            `;
            recommendations.inline_notes.forEach(note => {
                formatted += `
                    <div class="inline-note">
                        <span class="quoted-text">"${note.quoted_text}"</span>
                        <span class="comment">- ${note.comment}</span>
                    </div>
                `;
            });
            formatted += `
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Quick wins
        if (recommendations.quick_wins && recommendations.quick_wins.length > 0) {
            formatted += `
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-title">QUICK WINS (1 день)</div>
                        <div class="clean-description">
            `;
            recommendations.quick_wins.forEach((win, index) => {
                formatted += `<div class="recommendation-item">${index + 1}. ${win}</div>`;
            });
            formatted += `
                        </div>
                    </div>
                </div>
            `;
        }

        // Tactical
        if (recommendations.tactical && recommendations.tactical.length > 0) {
            formatted += `
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-title">TACTICAL ПОКРАЩЕННЯ (тиждень)</div>
                        <div class="clean-description">
            `;
            recommendations.tactical.forEach((item, index) => {
                formatted += `<div class="recommendation-item">${index + 1}. ${item}</div>`;
            });
            formatted += `
                        </div>
                    </div>
                </div>
            `;
        }

        // Strategic
        if (recommendations.strategic && recommendations.strategic.length > 0) {
            formatted += `
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-title">STRATEGIC ІДЕЯ (квартал)</div>
                        <div class="clean-description">
            `;
            recommendations.strategic.forEach((item, index) => {
                formatted += `<div class="recommendation-item">${index + 1}. ${item}</div>`;
            });
            formatted += `
                        </div>
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
     * Close the current modal
     */
    closeModal() {
        if (this.currentModal) {
            document.body.removeChild(this.currentModal);
            this.currentModal = null;
        }
    }

    /**
     * Check if modal is currently open
     * @returns {boolean} True if modal is open
     */
    isOpen() {
        return this.currentModal !== null;
    }

    /**
     * Get icon for a field based on field key and section title
     * @param {string} fieldKey - The field key
     * @param {string} sectionTitle - The section title
     * @returns {string} Icon HTML
     */
    getFieldIcon(fieldKey, sectionTitle) {
        const iconMap = {
            // Copywriting icons
            'offer_clarity': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'specificity': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
            'language_simplicity': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>',
            'tone_of_voice': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>',
            'structure': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
            'offer_usp_separation': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H4.5C3.67 2 3 2.67 3 3.5v15C3 19.33 3.67 20 4.5 20h15c.83 0 1.5-.67 1.5-1.5v-15C21 2.67 20.33 2 19.5 2zM19 18H5V8h14v10z"/></svg>',
            
            // Marketing icons
            'offer_type': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'funnel_stage': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'funnel_reasoning': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
            'consistency': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'originality': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'seasonality': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>',
            'mini_swot': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
            
            // Psychology icons
            'main_drivers': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
            'structure_used': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
            'hook_phrase': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'storytelling': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'influence_techniques': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
            'tonality': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>',
            'drivers': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
            'techniques': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
            
            // Sales icons
            'value_proposition': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'cta_strength': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'risk_reversal': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,9.2 10.2,10V11.5H13.8V10C13.8,9.2 12.8,8.2 12,8.2Z"/></svg>',
            'price_psychology': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>',
            'cta': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'price_signals': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>',
            
            // Metrics icons
            'rotation_insight': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>',
            'novelty': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            
            // Technical icons
            'format': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
            'quality': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'subtitles': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/></svg>',
            
            // Visual icons
            'hook_first_seconds': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'tempo': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/></svg>',
            'scene_variety': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>',
            'overall_style': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            
            // People icons
            'people_description': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 11.5 8.5c-.47-.62-1.21-.99-2.01-.99H7.46c-.8 0-1.54.37-2.01.99L2.5 16H5v6h2v-6h2.5l2.5-7.5 2.5 7.5H14v6h2v-6h2.5l2.5-7.5 2.5 7.5H20v6h2z"/></svg>',
            'influencers': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'product_presentation': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'branding_visibility': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            
            // Summary icons
            'what_advertised': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'creative_quality': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            'strengths': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            'weaknesses': '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>'
        };
        
        return iconMap[fieldKey] || '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>';
    }
}

// Make Modal available globally
    window.Modal = Modal;