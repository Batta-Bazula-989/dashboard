/**
 * Modal Component
 * Handles modal dialogs for displaying full analysis
 */
class Modal {
    constructor() {
        this.currentModal = null;
    }

    /**
     * Show full analysis in a modal
     * @param {string} competitorName - Name of the competitor
     * @param {string} fullAnalysis - Full analysis text
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

        const formattedContent = this.formatAnalysisText(fullAnalysis);
        content.appendChild(formattedContent);

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
     * Format analysis text with tabs and sections
     * @param {string} text - Analysis text to format
     * @returns {HTMLElement} Formatted content element
     */
    formatAnalysisText(text) {
        const container = document.createElement('div');

        const sections = this.parseAnalysisSections(text);

        // Single scrollable view - no tabs, no section headers
        const content = document.createElement('div');
        content.className = 'analysis-content';

            sections.forEach((section, index) => {
            const sectionContent = document.createElement('div');
            sectionContent.className = 'analysis-main-content';
            sectionContent.innerHTML = section.content;
            content.appendChild(sectionContent);
        });
        
            container.appendChild(content);

        return container;
    }

    /**
     * Switch between analysis tabs
     * @param {number} activeIndex - Index of the tab to activate
     */
    switchAnalysisTab(activeIndex) {
        const tabs = document.querySelectorAll('.analysis-tab');
        tabs.forEach((tab, index) => {
            if (index === activeIndex) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        const contents = document.querySelectorAll('.analysis-tab-content');
        contents.forEach((content, index) => {
            if (index === activeIndex) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    /**
     * Parse analysis text into sections
     * @param {string} text - Analysis text to parse
     * @returns {Array} Array of section objects
     */
    parseAnalysisSections(text) {
        const sections = [];

        // Split by numbered sections - improved regex to catch the specific analysis structure
        const mainSections = text.split(/(?=\d+[\.\)]\s*(?:Копирайтинг|Маркетинг|Психология|Продажи|Метрики|Рекомендации|Итоговый|Копірайтинг|Психологія|Продажі|Рекомендації|Висновки|Аналіз|Анализ|SWOT|Конкуренти|Цільова|Позиціонування|Брендинг))/i);

        if (mainSections.length > 1) {
            const sectionIcons = {
                'копирайтинг': { icon: '✍️', name: 'Копірайтинг' },
                'копірайтинг': { icon: '✍️', name: 'Копірайтинг' },
                'маркетинг': { icon: '📈', name: 'Маркетинг' },
                'психология': { icon: '🧠', name: 'Психологія' },
                'психологія': { icon: '🧠', name: 'Психологія' },
                'продажи': { icon: '💰', name: 'Продажі' },
                'продажі': { icon: '💰', name: 'Продажі' },
                'метрики': { icon: '📊', name: 'Метрики' },
                'рекомендации': { icon: '💡', name: 'Рекомендації' },
                'рекомендації': { icon: '💡', name: 'Рекомендації' },
                'итоговый': { icon: '🎯', name: 'Висновки' },
                'итоговый вывод': { icon: '🎯', name: 'Висновки' },
                'висновки': { icon: '🎯', name: 'Висновки' },
                'висновок': { icon: '🎯', name: 'Висновки' },
                'аналіз': { icon: '📋', name: 'Аналіз' },
                'анализ': { icon: '📋', name: 'Аналіз' },
                'swot': { icon: '🔍', name: 'SWOT Аналіз' },
                'конкуренти': { icon: '🏢', name: 'Конкуренти' },
                'цільова': { icon: '🎯', name: 'Цільова аудиторія' },
                'цільової': { icon: '🎯', name: 'Цільова аудиторія' },
                'аудиторія': { icon: '👥', name: 'Цільова аудиторія' },
                'позиціонування': { icon: '📍', name: 'Позиціонування' },
                'брендинг': { icon: '🏷️', name: 'Брендинг' },
                'конкуренти': { icon: '🏢', name: 'Конкуренти' },
                'цільова': { icon: '🎯', name: 'Цільова аудиторія' },
                'позиціонування': { icon: '📍', name: 'Позиціонування' },
                'брендинг': { icon: '🏷️', name: 'Брендинг' }
            };

            mainSections.forEach(section => {
                const trimmed = section.trim();
                if (trimmed.length === 0) return;

                const titleMatch = trimmed.match(/^(\d+[\.\)]\s*)([^\n]+)/);
                if (titleMatch) {
                    const sectionTitle = titleMatch[2].trim();
                    const key = Object.keys(sectionIcons).find(key =>
                        sectionTitle.toLowerCase().includes(key)
                    );

                    const formattedContent = this.formatSectionContent(trimmed);

                    if (key) {
                        sections.push({
                            title: sectionIcons[key].name,
                            icon: sectionIcons[key].icon,
                            content: formattedContent
                        });
                    } else {
                        sections.push({
                            title: sectionTitle,
                            icon: '📝',
                            content: formattedContent
                        });
                    }
                } else {
                    sections.push({
                        title: 'Аналіз',
                        icon: '📝',
                        content: this.formatSectionContent(trimmed)
                    });
                }
            });
        }

        if (sections.length === 0) {
            sections.push({
                title: 'Аналіз',
                icon: '📝',
                content: this.formatSectionContent(text)
            });
        }

        return sections;
    }

    /**
     * Format section content with clean sections and inline notes
     * @param {string} content - Content to format
     * @returns {string} Formatted HTML content
     */
    formatSectionContent(content) {
        // Remove numbered prefix like "1) Копирайтинг"
        content = content.replace(/^\d+[\.\)]\s*[^\n]+\n?/, '');

        // Split into lines and clean them
        const lines = content.split('\n')
            .map(line => {
                // Remove all types of dashes (-–—•*) from the beginning of lines
                return line
                    .replace(/^\s*[-–—•*]\s*/, '')
                    .trim();
            })
            .filter(line => line.length > 0);

        // Use the new clean formatting approach
        return this.formatAsCleanSections(lines);
    }

    /**
     * Detect if content has structured format suitable for table display
     * @param {Array} lines - Array of content lines
     * @returns {boolean} True if structured format detected
     */
    detectStructuredFormat(lines) {
        // First check if this is recommendations content
        if (this.isRecommendationsContent(lines)) {
            return 'recommendations';
        }

        // Check if this is metrics content
        if (this.isMetricsContent(lines)) {
            return 'metrics';
        }

        // Look for patterns like "Category: Description" or bullet points with categories
        const structuredPatterns = [
            /^[^:]+:\s*.+$/, // Category: Description pattern
            /^[А-Яа-я\w\s]+:\s*$/, // Category: (with colon at end)
            /^[А-Яа-я\w\s]+\s*-\s*.+$/, // Category - Description pattern
        ];

        // Also look for common analysis keywords that suggest structured content
        const analysisKeywords = [
            'тип оффера', 'стадія воронки', 'согласованность', 'оригінальність', 'сезонність',
            'value proposition', 'ризик-реверс', 'сила ста', 'цінова психологія',
            'swot', 's:', 'w:', 'о:', 'т:', 'mini-swot'
        ];

        let structuredCount = 0;
        let keywordCount = 0;
        
        lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            
            // Check for structured patterns
            if (structuredPatterns.some(pattern => pattern.test(line))) {
                structuredCount++;
            }
            
            // Check for analysis keywords
            if (analysisKeywords.some(keyword => lowerLine.includes(keyword))) {
                keywordCount++;
            }
        });

        // Use structured format if:
        // 1. More than 30% of lines match structured patterns, OR
        // 2. Contains analysis keywords and has some structured patterns
        return (structuredCount > 0 && (structuredCount / lines.length) > 0.3) ||
               (keywordCount > 0 && structuredCount > 0);
    }

    /**
     * Check if content is recommendations format
     * @param {Array} lines - Array of content lines
     * @returns {boolean} True if recommendations content detected
     */
    isRecommendationsContent(lines) {
        const recommendationsKeywords = [
            'quick wins', 'tactical improvements', 'strategic idea',
            'рекомендації', 'рекомендации', 'швидкі перемоги', 'тактичні покращення',
            'стратегічна ідея', 'за 1 день', 'за тиждень', 'на квартал'
        ];

        const text = lines.join(' ').toLowerCase();
        return recommendationsKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Check if content is metrics format
     * @param {Array} lines - Array of content lines
     * @returns {boolean} True if metrics content detected
     */
    isMetricsContent(lines) {
        const metricsKeywords = [
            'rotation insight', 'novelty', 'метрики', 'metrics',
            '0-100', 'score', 'оцінка', 'індекс', 'index',
            'progress', 'прогрес', 'рейтинг', 'rating',
            'рекомендация по метрикам', 'рекомендации по метрикам'
        ];

        const text = lines.join(' ').toLowerCase();
        return metricsKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Format content as a structured table-like layout
     * @param {Array} lines - Array of content lines
     * @returns {string} Formatted HTML content
     */
    formatAsStructuredTable(lines) {
        let formatted = '';
        
        lines.forEach((line, index) => {
            // Check for category: description pattern
            const categoryMatch = line.match(/^([^:]+):\s*(.*)$/);
            
            if (categoryMatch) {
                const category = categoryMatch[1].trim();
                const description = categoryMatch[2].trim();
                
                formatted += `
                    <div class="analysis-table-row">
                        <span class="analysis-category">${category}</span>
                        <span class="analysis-description">${description || '—'}</span>
                    </div>
                `;
            } else {
                // Check for category - description pattern
                const dashMatch = line.match(/^([^-]+)\s*-\s*(.+)$/);
                if (dashMatch) {
                    const category = dashMatch[1].trim();
                    const description = dashMatch[2].trim();
                    
                    formatted += `
                        <div class="analysis-table-row">
                            <span class="analysis-category">${category}</span>
                            <span class="analysis-description">${description}</span>
                        </div>
                    `;
                } else if (line.trim()) {
                    // Regular content line - treat as description only
                    formatted += `<p class="analysis-paragraph">${line}</p>`;
                }
            }
        });
        
        return formatted;
    }

    /**
     * Format content as regular paragraphs
     * @param {Array} lines - Array of content lines
     * @returns {string} Formatted HTML content
     */
    formatAsRegularContent(lines) {
        let formatted = '';
        let currentParagraph = '';

        lines.forEach((line, index) => {
            // Check if this line ends with a colon (likely a category header)
            const isCategoryHeader = line.match(/^([^:]+):\s*(.*)$/);
            
            if (isCategoryHeader) {
                // Flush previous paragraph
                if (currentParagraph) {
                    formatted += `<p class="analysis-paragraph">${currentParagraph}</p>`;
                    currentParagraph = '';
                }
                
                // Add category header as a separate paragraph
                const headerText = isCategoryHeader[1].trim();
                const contentAfterColon = isCategoryHeader[2].trim();
                const fullText = contentAfterColon ? `${headerText}: ${contentAfterColon}` : `${headerText}:`;
                formatted += `<p class="analysis-category">${fullText}</p>`;
            } else {
                // Regular content line
                if (currentParagraph) {
                    currentParagraph += ' ' + line;
                } else {
                    currentParagraph = line;
                }
            }
        });

        // Flush remaining paragraph
        if (currentParagraph) {
            formatted += `<p class="analysis-paragraph">${currentParagraph}</p>`;
        }

        return formatted || '<p class="analysis-paragraph">Немає даних</p>';
    }

    /**
     * Format content as recommendations with priority sections
     * @param {Array} lines - Array of content lines
     * @returns {string} Formatted HTML content
     */
    formatAsRecommendations(lines) {
        let formatted = '<div class="recommendations-container">';
        
        let currentSection = null;
        let currentItems = [];
        
        lines.forEach((line, index) => {
            // Check for section headers (Quick Wins, Tactical improvements, etc.)
            // More flexible regex to catch different formats
            const sectionMatch = line.match(/^(\d+)\s+(.+?)(?:\s*\((.+?)\))?\s*$/);
            
            if (sectionMatch) {
                // Process previous section if exists
                if (currentSection) {
                    formatted += this.formatRecommendationSection(currentSection, currentItems);
                }
                
                // Start new section
                const count = sectionMatch[1];
                const title = sectionMatch[2].trim();
                const timeframe = sectionMatch[3] ? sectionMatch[3].trim() : '';
                
                currentSection = {
                    count: count,
                    title: title,
                    timeframe: timeframe,
                    type: this.getRecommendationType(title)
                };
                currentItems = [];
            } else if (line.match(/^\d+[\.\)]\s+/)) {
                // This is a numbered recommendation item
                const itemText = line.replace(/^\d+[\.\)]\s+/, '').trim();
                if (itemText) {
                    currentItems.push(itemText);
                }
            } else if (line.trim() && currentSection) {
                // This might be a continuation of the previous item or a new item
                currentItems.push(line.trim());
            } else if (line.trim() && !currentSection) {
                // If we don't have a section yet, try to detect if this line is a section header
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('quick wins') || lowerLine.includes('tactical') || 
                    lowerLine.includes('strategic') || lowerLine.includes('рекомендації') ||
                    lowerLine.includes('швидкі') || lowerLine.includes('тактичні') ||
                    lowerLine.includes('стратегічна')) {
                    
                    // Create a section without count/timeframe
                    currentSection = {
                        count: '',
                        title: line.trim(),
                        timeframe: '',
                        type: this.getRecommendationType(line.trim())
                    };
                    currentItems = [];
                }
            }
        });
        
        // Process the last section
        if (currentSection) {
            formatted += this.formatRecommendationSection(currentSection, currentItems);
        }
        
        // If no sections were found, fall back to regular formatting
        if (!currentSection) {
            formatted = '';
            lines.forEach((line, index) => {
                if (line.trim()) {
                    formatted += `<p class="analysis-paragraph">${line.trim()}</p>`;
                }
            });
            return formatted || '<p class="analysis-paragraph">Немає даних</p>';
        }
        
        formatted += '</div>';
        return formatted;
    }

    /**
     * Get recommendation type for styling
     * @param {string} title - Section title
     * @returns {string} Type (quick-wins, tactical, strategic)
     */
    getRecommendationType(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('quick wins') || lowerTitle.includes('швидкі перемоги')) {
            return 'quick-wins';
        } else if (lowerTitle.includes('tactical') || lowerTitle.includes('тактичні')) {
            return 'tactical';
        } else if (lowerTitle.includes('strategic') || lowerTitle.includes('стратегічна')) {
            return 'strategic';
        }
        return 'default';
    }

    /**
     * Format a recommendation section
     * @param {Object} section - Section data
     * @param {Array} items - Array of recommendation items
     * @returns {string} Formatted HTML
     */
    formatRecommendationSection(section, items) {
        const icon = this.getRecommendationIcon(section.type);
        
        // Build title with optional count and timeframe
        let title = section.title;
        if (section.count) {
            title = `${section.count} ${title}`;
        }
        if (section.timeframe) {
            title = `${title} (${section.timeframe})`;
        }
        
        let formatted = `
            <div class="recommendation-section recommendation-${section.type}">
                <div class="recommendation-header">
                    <span class="recommendation-icon">${icon}</span>
                    <h3 class="recommendation-title">${title}</h3>
                </div>
                <div class="recommendation-items">
        `;
        
        items.forEach((item, index) => {
            formatted += `
                <div class="recommendation-item">
                    <span class="recommendation-number">${index + 1}.</span>
                    <span class="recommendation-text">${item}</span>
                </div>
            `;
        });
        
        formatted += `
                </div>
            </div>
        `;
        
        return formatted;
    }

    /**
     * Get icon for recommendation type
     * @param {string} type - Recommendation type
     * @returns {string} Icon
     */
    getRecommendationIcon(type) {
        const icons = {
            'quick-wins': '⚡',
            'tactical': '🎯',
            'strategic': '🚀',
            'default': '💡'
        };
        return icons[type] || icons.default;
    }

    /**
     * Format content as metrics with clean sections and progress bars
     * @param {Array} lines - Array of content lines
     * @returns {string} Formatted HTML content
     */
    formatAsMetrics(lines) {
        let formatted = '';
        let currentMetric = null;
        let currentDescription = '';
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            
            // Check for metric title - more flexible patterns
            const titlePatterns = [
                /^([^(]+)(?:\s*\(([^)]+)\))?\s*$/,  // "Title (range)"
                /^(.+?)\s*\(([^)]+)\)\s*$/,         // "Title (range)" 
                /^(.+?)\s*–\s*(.+)$/,               // "Title – description"
                /^(.+?):\s*(.+)$/                   // "Title: description"
            ];
            
            let isTitle = false;
            let title = '';
            let range = '';
            
            for (const pattern of titlePatterns) {
                const match = trimmedLine.match(pattern);
                if (match) {
                    title = match[1].trim();
                    range = match[2] ? match[2].trim() : '';
                    isTitle = true;
                    break;
                }
            }
            
            // Also check if line looks like a title (short, no punctuation at end, or has numbers)
            if (!isTitle && trimmedLine.length < 50 && 
                (trimmedLine.includes('insight') || trimmedLine.includes('novelty') || 
                 trimmedLine.includes('метрики') || trimmedLine.includes('0-100') ||
                 trimmedLine.includes('рекомендация'))) {
                title = trimmedLine;
                isTitle = true;
            }
            
            if (isTitle) {
                // Process previous metric if exists
                if (currentMetric) {
                    formatted += this.formatMetricSection(currentMetric, currentDescription);
                }
                
                // Start new metric
                currentMetric = {
                    title: title,
                    range: range,
                    hasProgressBar: range.includes('0-100') || range.includes('0–100')
                };
                currentDescription = '';
            } else if (currentMetric) {
                // Check if this line contains a score value (e.g., "45/100", "40-60")
                const scoreMatch = trimmedLine.match(/(\d+)\/(\d+)/);
                const rangeMatch = trimmedLine.match(/(\d+)\s*[–-]\s*(\d+)/);
                
                if (scoreMatch && currentMetric.hasProgressBar) {
                    const value = parseInt(scoreMatch[1]);
                    const maxValue = parseInt(scoreMatch[2]);
                    currentMetric.value = value;
                    currentMetric.maxValue = maxValue;
                } else if (rangeMatch && currentMetric.hasProgressBar) {
                    // Handle ranges like "40-60" - take the middle value
                    const min = parseInt(rangeMatch[1]);
                    const max = parseInt(rangeMatch[2]);
                    const avg = Math.round((min + max) / 2);
                    currentMetric.value = avg;
                    currentMetric.maxValue = 100;
                } else {
                    // This is description text
                    if (currentDescription) {
                        currentDescription += ' ' + trimmedLine;
                    } else {
                        currentDescription = trimmedLine;
                    }
                }
            } else {
                // No current metric, treat as regular paragraph
                formatted += `<p class="analysis-paragraph">${trimmedLine}</p>`;
            }
        });
        
        // Process the last metric
        if (currentMetric) {
            formatted += this.formatMetricSection(currentMetric, currentDescription);
        }
        
        return formatted;
    }

    /**
     * Format a single metric section
     * @param {Object} metric - Metric data
     * @param {string} description - Metric description
     * @returns {string} Formatted HTML
     */
    formatMetricSection(metric, description) {
        let formatted = `
            <div class="metric-section">
                <h3 class="metric-title">${metric.title}${metric.range ? ` (${metric.range})` : ''}</h3>
        `;
        
        // Add progress bar if this metric has one
        if (metric.hasProgressBar && metric.value !== undefined && metric.maxValue !== undefined) {
            const percentage = Math.round((metric.value / metric.maxValue) * 100);
            formatted += `
                <div class="metric-progress-container">
                    <div class="metric-progress-bar">
                        <div class="metric-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="metric-progress-value">${metric.value}/${metric.maxValue}</div>
                </div>
            `;
        }
        
        // Add description
        if (description) {
            formatted += `<div class="metric-description">${description}</div>`;
        }
        
        formatted += `</div>`;
        return formatted;
    }

    /**
     * Format content as clean sections with inline notes (like screenshots)
     * @param {Array} lines - Array of content lines
     * @returns {string} Formatted HTML content
     */
    formatAsCleanSections(lines) {
        let formatted = '';
        let currentSection = null;
        let currentDescription = '';
        let currentInlineNote = '';
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            
            // Check if this is a section header (short line, no punctuation at end, or contains keywords)
            const isSectionHeader = this.isSectionHeader(trimmedLine);
            
            if (isSectionHeader) {
                // Process previous section if exists
                if (currentSection) {
                    formatted += this.formatCleanSection(currentSection, currentDescription, currentInlineNote);
                }
                
                // Start new section
                currentSection = trimmedLine;
                currentDescription = '';
                currentInlineNote = '';
            } else if (trimmedLine.toLowerCase().startsWith('inline:')) {
                // This is an inline note
                currentInlineNote = trimmedLine.replace(/^inline:\s*/i, '').trim();
            } else if (currentSection) {
                // This is description text
                if (currentDescription) {
                    currentDescription += ' ' + trimmedLine;
                } else {
                    currentDescription = trimmedLine;
                }
            } else {
                // No current section, treat as regular paragraph
                formatted += `<p class="analysis-paragraph">${trimmedLine}</p>`;
            }
        });
        
        // Process the last section
        if (currentSection) {
            formatted += this.formatCleanSection(currentSection, currentDescription, currentInlineNote);
        }
        
        return formatted;
    }

    /**
     * Check if a line is a section header
     * @param {string} line - Line to check
     * @returns {boolean} True if it's a section header
     */
    isSectionHeader(line) {
        // Short lines (less than 50 chars) that don't end with punctuation
        if (line.length < 50 && !line.match(/[.!?]$/)) {
            return true;
        }
        
        // Lines containing common section keywords
        const sectionKeywords = [
            'тип оффера', 'стадия воронки', 'согласованность', 'оригинальность', 'сезонность',
            'mini-swot', 'swot', 'психология', 'психологія', 'метрики', 'рекомендации',
            'rotation insight', 'novelty', 'quick wins', 'tactical', 'strategic',
            'основні драйвери', 'структура подачі', 'hook phrase', 'value proposition',
            'ризик-реверс', 'сила ста', 'цінова психологія'
        ];
        
        const lowerLine = line.toLowerCase();
        return sectionKeywords.some(keyword => lowerLine.includes(keyword));
    }

    /**
     * Format a clean section with inline note
     * @param {string} title - Section title
     * @param {string} description - Section description
     * @param {string} inlineNote - Inline note
     * @returns {string} Formatted HTML
     */
    formatCleanSection(title, description, inlineNote) {
        let formatted = `
            <div class="clean-section">
                <div class="clean-section-header">
                    <span class="clean-section-bullet">•</span>
                    <h3 class="clean-section-title">${title}</h3>
                </div>
        `;
        
        if (description) {
            formatted += `<div class="clean-section-description">${description}</div>`;
        }
        
        if (inlineNote) {
            formatted += `
                <div class="clean-inline-note">
                    <span class="inline-label">Inline:</span> ${inlineNote}
                </div>
            `;
        }
        
        formatted += `</div>`;
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
} else {
    window.Modal = Modal;
}