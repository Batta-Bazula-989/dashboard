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
            console.log('Detected ai_analysis object directly');
            return this.formatJsonAnalysis(content);
        }
        
        // If content has ai_analysis property, extract it
        if (typeof content === 'object' && content.ai_analysis) {
            console.log('Detected object with ai_analysis property');
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
        return `<div class="analysis-section">
            <div class="section-header">
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
        let formatted = '';

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
     * Format a JSON section with score-based items
     * @param {string} title - Section title
     * @param {Object} data - Section data
     * @param {Array} fields - Fields to display
     * @returns {string} Formatted HTML
     */
    formatJsonSection(title, data, fields) {
        let formatted = `
            <div class="analysis-section">
                <div class="section-header">
                    <h3 class="section-title">${title}</h3>
                </div>
                <div class="section-content">
        `;

        fields.forEach(field => {
            const value = data[field.key];
            if (value !== undefined && value !== null) {
                if (typeof value === 'object' && value.score !== undefined) {
                    // Score-based field with container
                    formatted += `
                        <div class="analysis-item">
                            <div class="item-header">
                                <span class="item-label">${field.label}</span>
                                <span class="item-score">${value.score}/10</span>
                            </div>
                            <div class="item-description">${value.description || ''}</div>
                        </div>
                    `;
                } else if (typeof value === 'object' && field.key === 'mini_swot') {
                    // Mini-SWOT special handling with container
                    formatted += `
                        <div class="analysis-item swot-item">
                            <div class="item-header">
                                <span class="item-label">${field.label}</span>
                            </div>
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
                    `;
                } else {
                    // Simple text field with container
                    formatted += `
                        <div class="analysis-item">
                            <div class="item-header">
                                <span class="item-label">${field.label}</span>
                            </div>
                            <div class="item-description">${value}</div>
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
            <div class="analysis-section">
                <div class="section-header">
                    <h3 class="section-title">РЕКОМЕНДАЦІЇ</h3>
                </div>
                <div class="section-content">
        `;

        // Inline notes
        if (recommendations.inline_notes && recommendations.inline_notes.length > 0) {
            formatted += `
                <div class="analysis-item">
                    <div class="item-header">
                        <span class="item-label">ІНЛАЙН-ПОМЕТКИ</span>
                    </div>
                    <div class="item-description">
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
            `;
        }

        // Quick wins
        if (recommendations.quick_wins && recommendations.quick_wins.length > 0) {
            formatted += `
                <div class="analysis-item">
                    <div class="item-header">
                        <span class="item-label">QUICK WINS (1 день)</span>
                    </div>
                    <div class="item-description">
            `;
            recommendations.quick_wins.forEach((win, index) => {
                formatted += `<div class="recommendation-item">${index + 1}. ${win}</div>`;
            });
            formatted += `
                    </div>
                </div>
            `;
        }

        // Tactical
        if (recommendations.tactical && recommendations.tactical.length > 0) {
            formatted += `
                <div class="analysis-item">
                    <div class="item-header">
                        <span class="item-label">TACTICAL ПОКРАЩЕННЯ (тиждень)</span>
                    </div>
                    <div class="item-description">
            `;
            recommendations.tactical.forEach((item, index) => {
                formatted += `<div class="recommendation-item">${index + 1}. ${item}</div>`;
            });
            formatted += `
                    </div>
                </div>
            `;
        }

        // Strategic
        if (recommendations.strategic && recommendations.strategic.length > 0) {
            formatted += `
                <div class="analysis-item">
                    <div class="item-header">
                        <span class="item-label">STRATEGIC ІДЕЯ (квартал)</span>
                    </div>
                    <div class="item-description">
            `;
            recommendations.strategic.forEach((item, index) => {
                formatted += `<div class="recommendation-item">${index + 1}. ${item}</div>`;
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
}

// Make Modal available globally
window.Modal = Modal;