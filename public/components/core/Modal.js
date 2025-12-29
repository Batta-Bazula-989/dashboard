class Modal {
    constructor() {
        this.currentModal = null;
        this.escapeHandler = null; // Store reference for cleanup
    }

    showFullAnalysis(competitorName, fullAnalysis) {
        // Close any existing modal first to prevent handler accumulation
        this.closeModal();

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
        // Use DOMParser for safe HTML parsing (content is already sanitized)
        const parser = new DOMParser();
        const doc = parser.parseFromString(formattedContent, 'text/html');
        const fragment = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node => {
            fragment.appendChild(node.cloneNode(true));
        });
        content.appendChild(fragment);

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

    formatSectionContent(content) {
        if (typeof content === 'object' && content.copywriting) {
            return this.formatJsonAnalysis(content);
        }

        if (typeof content === 'object' && content.ai_analysis) {
            // Check if ai_analysis is OpenAI response format (image analysis)
            if (content.ai_analysis.choices &&
                Array.isArray(content.ai_analysis.choices) &&
                content.ai_analysis.choices[0]?.message?.content) {
                // Extract text content from OpenAI response
                const textContent = content.ai_analysis.choices[0].message.content;
                return this.formatTextContent(textContent);
            }
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

    formatTextContent(text) {
        // Parse and format image analysis text into structured cards
        const safe = Sanitizer.escapeHTML(text);

        // Split text into lines
        const lines = safe.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let formatted = '';
        let currentSection = null;
        let currentSubsection = null;
        let currentContent = [];
        let sectionOpen = false;
        let inRecommendations = false;

        // Icon mapping for common image analysis fields
        const getIcon = (label) => {
            const labelLower = label.toLowerCase();
            if (labelLower.includes('формат') || labelLower.includes('format')) return ModalIcons.get('format');
            if (labelLower.includes('якість') || labelLower.includes('quality')) return ModalIcons.get('quality');
            if (labelLower.includes('текст') || labelLower.includes('text')) return ModalIcons.get('language_simplicity');
            if (labelLower.includes('читабельність') || labelLower.includes('readability')) return ModalIcons.get('language_simplicity');
            if (labelLower.includes('розміщення') || labelLower.includes('placement')) return ModalIcons.get('structure');
            if (labelLower.includes('люди') || labelLower.includes('people') || labelLower.includes('персонажі') || labelLower.includes('characters')) return ModalIcons.get('people_description');
            if (labelLower.includes('емоції') || labelLower.includes('emotions')) return ModalIcons.get('tone_of_voice');
            if (labelLower.includes('одяг') || labelLower.includes('clothing')) return ModalIcons.get('people_description');
            if (labelLower.includes('продукт') || labelLower.includes('product')) return ModalIcons.get('product_presentation');
            if (labelLower.includes('ризики') || labelLower.includes('risks')) return ModalIcons.get('risk_reversal');
            if (labelLower.includes('баланс') || labelLower.includes('balance')) return ModalIcons.get('consistency');
            if (labelLower.includes('оригінальність') || labelLower.includes('originality')) return ModalIcons.get('originality');
            if (labelLower.includes('фокус') || labelLower.includes('focus')) return ModalIcons.get('creative_quality');
            if (labelLower.includes('інлайн') || labelLower.includes('inline')) return ModalIcons.get('language_simplicity');
            if (labelLower.includes('quick') || labelLower.includes('швидк')) return ModalIcons.get('creative_quality');
            if (labelLower.includes('tactical') || labelLower.includes('тактичн')) return ModalIcons.get('structure');
            if (labelLower.includes('strategic') || labelLower.includes('стратег')) return ModalIcons.get('originality');
            return ModalIcons.getDefaultIcon();
        };

        const flushCurrentSubsection = () => {
            if (currentSubsection && currentContent.length > 0) {
                const subsectionLower = currentSubsection.toLowerCase();

                // Check if this is a recommendations subsection that needs special styling
                const isQuickWins = subsectionLower.includes('quick') || subsectionLower.includes('швидк');
                const isTactical = subsectionLower.includes('tactical') || subsectionLower.includes('тактичн');
                const isStrategic = subsectionLower.includes('strategic') || subsectionLower.includes('стратег');
                const isInlineNotes = subsectionLower.includes('інлайн') || subsectionLower.includes('inline');

                if (inRecommendations && (isQuickWins || isTactical || isStrategic || isInlineNotes)) {
                    // Use special recommendations styling
                    let cssClass = '';
                    let title = currentSubsection;

                    if (isQuickWins) {
                        cssClass = 'quick-wins';
                        if (!title.match(/\d/)) title = title + ' (швидко)';
                    } else if (isTactical) {
                        cssClass = 'tactical';
                        if (!title.match(/\d/)) title = title + ' (тиждень)';
                    } else if (isStrategic) {
                        cssClass = 'strategic';
                        if (!title.match(/\d/)) title = title + ' (квартал)';
                    } else if (isInlineNotes) {
                        cssClass = 'inline-notes';
                    }

                    formatted += `
                        <div class="recommendation-subsection ${cssClass}">
                            <div class="subsection-title ${cssClass}">${title.toUpperCase()}</div>
                    `;

                    if (isInlineNotes) {
                        // Special formatting for inline notes
                        formatted += `<div class="inline-notes-container">`;
                        currentContent.forEach((line, index) => {
                            // Try to extract label and comment from bullet points
                            const match = line.match(/^[•\-\*]\s+([^:—]+)[:\s—]+(.+)$/);
                            if (match) {
                                const label = match[1].trim();
                                const comment = match[2].trim();
                                formatted += `
                                    <div class="inline-note-item">
                                        <div class="note-number">${index + 1}</div>
                                        <div class="note-content">
                                            <div class="quoted-text">${label}</div>
                                            <div class="comment">— ${comment}</div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                // Fallback for non-standard format
                                const cleaned = line.replace(/^[•\-\*\d\)]\s*/, '');
                                formatted += `
                                    <div class="inline-note-item">
                                        <div class="note-number">${index + 1}</div>
                                        <div class="note-content">
                                            <div class="comment">${cleaned}</div>
                                        </div>
                                    </div>
                                `;
                            }
                        });
                        formatted += `</div>`;
                    } else {
                        // Regular list formatting for Quick wins, Tactical, Strategic
                        formatted += `<div class="recommendation-list">`;
                        currentContent.forEach((line, index) => {
                            // Remove bullet/number prefix and clean up
                            const cleaned = line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\)\s*/, '');
                            if (cleaned.trim()) {
                                formatted += `
                                    <div class="recommendation-item">
                                        <span class="item-number">${index + 1}</span>
                                        <span class="item-text">${cleaned}</span>
                                    </div>
                                `;
                            }
                        });
                        formatted += `</div>`;
                    }

                    formatted += `</div>`;
                } else {
                    // Regular card formatting for non-recommendation subsections
                    const formattedContent = currentContent.map(line => {
                        // Check if line is a bullet point with a label: "- Label: content" or "• Label: content"
                        const bulletLabelMatch = line.match(/^([•\-\*])\s+([^:]+):\s*(.+)$/);
                        if (bulletLabelMatch) {
                            const label = bulletLabelMatch[2].trim();
                            const content = bulletLabelMatch[3].trim();
                            return `<div style="margin-bottom: 12px;"><strong>${label}:</strong> ${content}</div>`;
                        }

                        // Check if line is a numbered item: "1) content"
                        const numberedMatch = line.match(/^(\d+)\)\s+(.+)$/);
                        if (numberedMatch) {
                            const num = numberedMatch[1];
                            const content = numberedMatch[2].trim();
                            return `<div style="margin-bottom: 12px;"><strong>${num})</strong> ${content}</div>`;
                        }

                        // Regular bullet point without label
                        if (line.match(/^[•\-\*]\s+/)) {
                            return `<div style="margin-bottom: 8px;">${line}</div>`;
                        }

                        // Regular line
                        return line;
                    }).join('');

                    if (formattedContent.trim()) {
                        const icon = getIcon(currentSubsection);
                        const safeLabel = currentSubsection;

                        formatted += `
                            <div class="clean-card">
                                <div class="clean-icon">${icon}</div>
                                <div class="clean-content">
                                    <div class="clean-title">${safeLabel}</div>
                                    <div class="clean-description">${formattedContent}</div>
                                </div>
                            </div>
                        `;
                    }
                }
            }
            currentSubsection = null;
            currentContent = [];
        };

        const flushCurrentSection = () => {
            if (sectionOpen) {
                flushCurrentSubsection();
                formatted += `
                        </div>
                    </div>
                `;
                sectionOpen = false;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this is a main section with number and period: "1. ТЕХНИЧНИЙ БЛОК"
            const numberedSectionMatch = line.match(/^(\d+)\.\s*(.+)$/);
            if (numberedSectionMatch) {
                flushCurrentSection();
                currentSection = numberedSectionMatch[2].trim();
                inRecommendations = currentSection.toLowerCase().includes('рекоменд') ||
                                   currentSection.toLowerCase().includes('recommend');

                // Use special recommendations styling if it's a recommendations section
                if (inRecommendations) {
                    formatted += `
                        <div class="clean-section recommendations-section">
                            <div class="section-pill recommendations-header">${currentSection}</div>
                            <div class="recommendations-container">
                    `;
                } else {
                    formatted += `
                        <div class="clean-section">
                            <div class="section-pill">${currentSection}</div>
                            <div class="clean-cards">
                    `;
                }
                sectionOpen = true;
                continue;
            }

            // Check for standalone section headers without numbers: "Опис", "Quick wins (3)", etc.
            // These are typically short lines (< 60 chars) and might contain special keywords
            const standaloneMatch = line.match(/^([A-ZА-ЯЇІЄҐ][A-Za-zА-ЯЇІЄҐа-яїієґ\s]+(?:\([0-9]+\))?)\s*$/);
            if (standaloneMatch && line.length < 60 &&
                (line.match(/^(Опис|Quick wins|Tactical|Strategic|Інлайн|Inline|Рекоменд|Recommend)/i) ||
                 line.match(/\([0-9]+\)$/))) {

                const sectionTitle = standaloneMatch[1].trim();

                // Check if this is a recommendations section header
                const isRecommendationsSection = sectionTitle.toLowerCase().includes('рекоменд') ||
                                                 sectionTitle.toLowerCase().includes('recommend');

                // Check if this looks like a recommendations subsection
                const isRecommendationSubsection = sectionTitle.toLowerCase().match(/^(quick|tactical|strategic|інлайн|inline)/i);

                // If it looks like a subsection within recommendations
                if (inRecommendations || (currentSection && !isRecommendationsSection)) {
                    flushCurrentSubsection();
                    currentSubsection = sectionTitle;
                } else if (isRecommendationSubsection) {
                    // Auto-create a recommendations section if we encounter these subsections
                    flushCurrentSection();
                    currentSection = 'РЕКОМЕНДАЦІЇ';
                    inRecommendations = true;
                    formatted += `
                        <div class="clean-section recommendations-section">
                            <div class="section-pill recommendations-header">РЕКОМЕНДАЦІЇ</div>
                            <div class="recommendations-container">
                    `;
                    sectionOpen = true;
                    currentSubsection = sectionTitle;
                } else {
                    // It's a main section
                    flushCurrentSection();
                    currentSection = sectionTitle;
                    inRecommendations = isRecommendationsSection;

                    // Use special recommendations styling if it's a recommendations section
                    if (inRecommendations) {
                        formatted += `
                            <div class="clean-section recommendations-section">
                                <div class="section-pill recommendations-header">${sectionTitle}</div>
                                <div class="recommendations-container">
                        `;
                    } else {
                        formatted += `
                            <div class="clean-section">
                                <div class="section-pill">${sectionTitle}</div>
                                <div class="clean-cards">
                        `;
                    }
                    sectionOpen = true;
                }
                continue;
            }

            // Check if this is a subsection ending with colon: "Format:"
            if (line.endsWith(':') && line.length < 50) {
                flushCurrentSubsection();
                currentSubsection = line.slice(0, -1).trim();
                continue;
            }

            // Check for numbered items with parenthesis: "1)", "2)", etc.
            if (line.match(/^(\d+)\)\s+/)) {
                if (currentSubsection || currentSection) {
                    currentContent.push(line);
                } else {
                    // Create a default subsection
                    if (!sectionOpen) {
                        formatted += `
                            <div class="clean-section">
                                <div class="section-pill">РЕКОМЕНДАЦІЇ</div>
                                <div class="clean-cards">
                        `;
                        sectionOpen = true;
                        currentSection = 'РЕКОМЕНДАЦІЇ';
                    }
                    if (!currentSubsection) {
                        currentSubsection = 'Пункти';
                    }
                    currentContent.push(line);
                }
                continue;
            }

            // Check if this is a bullet point or list item: "•", "-", "*"
            if (line.match(/^[•\-\*]\s+/)) {
                if (currentSubsection) {
                    currentContent.push(line);
                } else if (currentSection) {
                    if (!currentSubsection) {
                        currentSubsection = 'Деталі';
                    }
                    currentContent.push(line);
                }
                continue;
            }

            // Regular content line
            if (currentSubsection) {
                currentContent.push(line);
            } else if (currentSection) {
                // If we have a section but no subsection yet, start a default one
                if (line.length > 0) {
                    currentSubsection = 'Опис';
                    currentContent.push(line);
                }
            } else {
                // No section yet, might be intro text - create a default section
                if (line.length > 0 && !formatted) {
                    formatted += `
                        <div class="clean-section">
                            <div class="section-pill">АНАЛІЗ ЗОБРАЖЕННЯ</div>
                            <div class="clean-cards">
                    `;
                    currentSection = 'АНАЛІЗ ЗОБРАЖЕННЯ';
                    sectionOpen = true;
                    currentSubsection = 'Вступ';
                    currentContent.push(line);
                }
            }
        }

        // Flush any remaining content
        flushCurrentSection();

        // If no sections were found, fall back to simple formatting
        if (!formatted) {
            const simpleFormatted = safe
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\n\n/g, '</p><p>') // Paragraphs
                .replace(/\n/g, '<br>'); // Line breaks

            return `<div class="clean-section">
                <div class="section-pill">АНАЛІЗ ЗОБРАЖЕННЯ</div>
                <div class="clean-cards">
                    <div class="clean-card">
                        <div class="clean-content">
                            <div class="clean-description"><p>${simpleFormatted}</p></div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        return formatted;
    }

    formatJsonAnalysis(analysis) {
        // Check if carousel analysis format (has technical, text_and_visual, characters, sequence, visual_analysis)
        if (analysis.technical && (analysis.text_and_visual || analysis.characters || analysis.sequence || analysis.visual_analysis)) {
            return this.formatCarouselAnalysis(analysis);
        }
        
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

    formatCarouselAnalysis(analysis) {
        let formatted = '';

        if (analysis.technical) {
            formatted += this.formatVideoSection('ТЕХНІЧНІ ХАРАКТЕРИСТИКИ', analysis.technical, [
                { key: 'card_count', label: 'Кількість карток' },
                { key: 'aspect_ratio', label: 'Співвідношення сторін' },
                { key: 'quality', label: 'Якість' },
                { key: 'focus', label: 'Фокус' },
                { key: 'originality', label: 'Оригінальність' }
            ]);
        }

        if (analysis.text_and_visual) {
            formatted += this.formatVideoSection('ТЕКСТ ТА ВІЗУАЛ', analysis.text_and_visual, [
                { key: 'text_presence', label: 'Наявність тексту' },
                { key: 'layout', label: 'Макет' },
                { key: 'consistency', label: 'Консистентність' }
            ]);
        }

        if (analysis.characters) {
            formatted += this.formatVideoSection('ПЕРСОНАЖІ', analysis.characters, [
                { key: 'people', label: 'Люди' },
                { key: 'product', label: 'Продукт' },
                { key: 'balance', label: 'Баланс' }
            ]);
        }

        if (analysis.sequence) {
            formatted += this.formatVideoSection('ПОСЛІДОВНІСТЬ', analysis.sequence, [
                { key: 'logic', label: 'Логіка' },
                { key: 'first_slide', label: 'Перший слайд' },
                { key: 'progression', label: 'Прогресія' }
            ]);
        }

        if (analysis.visual_analysis) {
            formatted += this.formatVideoSection('ВІЗУАЛЬНИЙ АНАЛІЗ', analysis.visual_analysis, [
                { key: 'colors', label: 'Кольори' },
                { key: 'symbols', label: 'Символи' },
                { key: 'composition', label: 'Композиція' },
                { key: 'branding', label: 'Брендинг' }
            ]);
        }

        if (analysis.marketing) {
            formatted += this.formatVideoSection('МАРКЕТИНГ', analysis.marketing, [
                { key: 'offer_type', label: 'Тип оффера' },
                { key: 'funnel_stage', label: 'Стадія воронки' },
                { key: 'hooks', label: 'Хуки' },
                { key: 'usp', label: 'УТП' },
                { key: 'archetype', label: 'Архетип' }
            ]);
        }

        if (analysis.sales) {
            formatted += this.formatVideoSection('ПРОДАЖІ', analysis.sales, [
                { key: 'value_proposition', label: 'Value proposition' },
                { key: 'cta', label: 'CTA' },
                { key: 'pricing', label: 'Ціноутворення' }
            ]);
        }

        if (analysis.metrics) {
            formatted += this.formatVideoSection('МЕТРИКИ', analysis.metrics, [
                { key: 'rotation', label: 'Ротація' },
                { key: 'novelty', label: 'Новизна' },
                { key: 'fatigue_risk', label: 'Ризик втоми' }
            ]);
        }

        if (analysis.recommendations) {
            formatted += this.formatCarouselRecommendations(analysis.recommendations);
        }

        return formatted;
    }

    formatCarouselRecommendations(recommendations) {
        let formatted = `
            <div class="clean-section">
                <div class="section-pill">РЕКОМЕНДАЦІЇ</div>
                <div class="clean-cards">
        `;

        if (recommendations.must_have && Array.isArray(recommendations.must_have)) {
            formatted += `
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-title">Must have</div>
                        <div class="clean-description">${recommendations.must_have.map(item => Sanitizer.escapeHTML(String(item))).join(', ')}</div>
                    </div>
                </div>
            `;
        }

        if (recommendations.nice_to_have && Array.isArray(recommendations.nice_to_have)) {
            formatted += `
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-title">Nice to have</div>
                        <div class="clean-description">${recommendations.nice_to_have.map(item => Sanitizer.escapeHTML(String(item))).join(', ')}</div>
                    </div>
                </div>
            `;
        }

        if (recommendations.fatigue_lever && Array.isArray(recommendations.fatigue_lever)) {
            formatted += `
                <div class="clean-card">
                    <div class="clean-content">
                        <div class="clean-title">Fatigue lever</div>
                        <div class="clean-description">${recommendations.fatigue_lever.map(item => Sanitizer.escapeHTML(String(item))).join(', ')}</div>
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


formatRecommendationsSection(recommendations) {
    let formatted = `
        <div class="clean-section recommendations-section">
            <div class="section-pill recommendations-header">РЕКОМЕНДАЦІЇ</div>
            <div class="recommendations-container">
    `;

    // Inline Notes Section
    if (recommendations.inline_notes && recommendations.inline_notes.length > 0) {
        formatted += `
            <div class="recommendation-subsection inline-notes">
                <div class="subsection-title inline-notes">ІНЛАЙН-ПОМЕТКИ</div>
                <div class="inline-notes-container">
        `;
        
        recommendations.inline_notes.forEach((note, index) => {
            const safeQuoted = Sanitizer.escapeHTML(note.quoted_text);
            const safeComment = Sanitizer.escapeHTML(note.comment);
            formatted += `
                <div class="inline-note-item">
                    <div class="note-number">${index + 1}</div>
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
            <div class="recommendation-subsection quick-wins">
                <div class="subsection-title quick-wins">QUICK WINS (1 ДЕНЬ)</div>
                <div class="recommendation-list">
        `;
        
        recommendations.quick_wins.forEach((win, index) => {
            const safeWin = Sanitizer.escapeHTML(win);
            formatted += `
                <div class="recommendation-item">
                    <span class="item-number">${index + 1}</span>
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
            <div class="recommendation-subsection tactical">
                <div class="subsection-title tactical">TACTICAL ПОКРАЩЕННЯ (ТИЖДЕНЬ)</div>
                <div class="recommendation-list">
        `;
        
        recommendations.tactical.forEach((item, index) => {
            const safeItem = Sanitizer.escapeHTML(item);
            formatted += `
                <div class="recommendation-item">
                    <span class="item-number">${index + 1}</span>
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
            <div class="recommendation-subsection strategic">
                <div class="subsection-title strategic">STRATEGIC ІДЕЯ (КВАРТАЛ)</div>
                <div class="recommendation-list">
        `;
        
        recommendations.strategic.forEach((item, index) => {
            const safeItem = Sanitizer.escapeHTML(item);
            formatted += `
                <div class="recommendation-item">
                    <span class="item-number">${index + 1}</span>
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

    // Close the current modal (with cleanup) hello

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

     // Check if modal is currently open

    isOpen() {
        return this.currentModal !== null;
    }
}

window.Modal = Modal;