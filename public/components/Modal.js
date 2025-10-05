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

        if (sections.length > 1) {
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'analysis-tabs';

            const contentContainer = document.createElement('div');

            sections.forEach((section, index) => {
                const tab = document.createElement('button');
                tab.className = `analysis-tab ${index === 0 ? 'active' : ''}`;
                tab.innerHTML = `${section.icon} ${section.title}`;
                tab.onclick = () => this.switchAnalysisTab(index);
                tabsContainer.appendChild(tab);

                const tabContent = document.createElement('div');
                tabContent.className = `analysis-tab-content ${index === 0 ? 'active' : ''}`;
                tabContent.innerHTML = section.content;
                tabContent.setAttribute('data-tab-index', index);
                contentContainer.appendChild(tabContent);
            });

            container.appendChild(tabsContainer);
            container.appendChild(contentContainer);
        } else {
            const content = document.createElement('div');
            content.innerHTML = sections[0].content;
            container.appendChild(content);
        }

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
        const mainSections = text.split(/(?=\d+[\.\)]\s*(?:Копирайтинг|Маркетинг|Психология|Продажи|Метрики|Рекомендации|Итоговый|Копірайтинг|Психологія|Продажі|Рекомендації|Висновки))/i);

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
     * Format section content with proper paragraphs and spacing
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

        // Try to detect if this is a structured analysis that should be formatted as a table
        const formatType = this.detectStructuredFormat(lines);
        
        if (formatType === 'recommendations') {
            return this.formatAsRecommendations(lines);
        } else if (formatType === 'metrics') {
            return this.formatAsMetrics(lines);
        } else if (formatType === true) {
            return this.formatAsStructuredTable(lines);
        } else {
            return this.formatAsRegularContent(lines);
        }
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
            'progress', 'прогрес', 'рейтинг', 'rating'
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
        let formatted = '<div class="analysis-structured-content">';
        
        lines.forEach((line, index) => {
            // Check for category: description pattern
            const categoryMatch = line.match(/^([^:]+):\s*(.*)$/);
            
            if (categoryMatch) {
                const category = categoryMatch[1].trim();
                const description = categoryMatch[2].trim();
                
                formatted += `
                    <div class="analysis-item">
                        <div class="analysis-label">${category}</div>
                        <div class="analysis-value">${description || '—'}</div>
                    </div>
                `;
            } else {
                // Check for category - description pattern
                const dashMatch = line.match(/^([^-]+)\s*-\s*(.+)$/);
                if (dashMatch) {
                    const category = dashMatch[1].trim();
                    const description = dashMatch[2].trim();
                    
                    formatted += `
                        <div class="analysis-item">
                            <div class="analysis-label">${category}</div>
                            <div class="analysis-value">${description}</div>
                        </div>
                    `;
                } else if (line.trim()) {
                    // Regular content line - treat as description only
                    formatted += `
                        <div class="analysis-item analysis-item-full">
                            <div class="analysis-value">${line}</div>
                        </div>
                    `;
                }
            }
        });
        
        formatted += '</div>';
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
            const sectionMatch = line.match(/^(\d+)\s+(.+?)\s*\((.+?)\)$/);
            
            if (sectionMatch) {
                // Process previous section if exists
                if (currentSection) {
                    formatted += this.formatRecommendationSection(currentSection, currentItems);
                }
                
                // Start new section
                const count = sectionMatch[1];
                const title = sectionMatch[2].trim();
                const timeframe = sectionMatch[3].trim();
                
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
            }
        });
        
        // Process the last section
        if (currentSection) {
            formatted += this.formatRecommendationSection(currentSection, currentItems);
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
        
        let formatted = `
            <div class="recommendation-section recommendation-${section.type}">
                <div class="recommendation-header">
                    <span class="recommendation-icon">${icon}</span>
                    <h3 class="recommendation-title">${section.count} ${section.title} (${section.timeframe})</h3>
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
     * Format content as metrics with two-column layout and progress bars
     * @param {Array} lines - Array of content lines
     * @returns {string} Formatted HTML content
     */
    formatAsMetrics(lines) {
        let formatted = '<div class="metrics-container">';
        
        // Group lines into metric sections
        const metrics = this.parseMetricsSections(lines);
        
        // Create two-column layout
        formatted += '<div class="metrics-grid">';
        
        metrics.forEach((metric, index) => {
            formatted += `
                <div class="metric-card">
                    <h3 class="metric-title">${metric.title}</h3>
                    ${metric.progressBar ? this.createProgressBar(metric.value, metric.maxValue) : ''}
                    <div class="metric-description">${metric.description}</div>
                </div>
            `;
        });
        
        formatted += '</div></div>';
        return formatted;
    }

    /**
     * Parse metrics sections from lines
     * @param {Array} lines - Array of content lines
     * @returns {Array} Array of metric objects
     */
    parseMetricsSections(lines) {
        const metrics = [];
        let currentMetric = null;
        
        lines.forEach(line => {
            // Check for metric title (e.g., "Rotation insight", "Novelty (0-100)")
            const titleMatch = line.match(/^([^(]+)(?:\s*\(([^)]+)\))?\s*$/);
            
            if (titleMatch) {
                // Save previous metric if exists
                if (currentMetric) {
                    metrics.push(currentMetric);
                }
                
                // Start new metric
                const title = titleMatch[1].trim();
                const range = titleMatch[2] ? titleMatch[2].trim() : null;
                
                currentMetric = {
                    title: title,
                    range: range,
                    description: '',
                    value: null,
                    maxValue: null,
                    progressBar: false
                };
                
                // Check if this metric has a progress bar (contains 0-100 or similar)
                if (range && range.includes('0-100')) {
                    currentMetric.progressBar = true;
                    currentMetric.maxValue = 100;
                }
            } else if (currentMetric && line.trim()) {
                // Check if this line contains a score value (e.g., "45/100")
                const scoreMatch = line.match(/(\d+)\/(\d+)/);
                if (scoreMatch && currentMetric.progressBar) {
                    currentMetric.value = parseInt(scoreMatch[1]);
                    currentMetric.maxValue = parseInt(scoreMatch[2]);
                } else {
                    // This is description text
                    if (currentMetric.description) {
                        currentMetric.description += ' ' + line.trim();
                    } else {
                        currentMetric.description = line.trim();
                    }
                }
            }
        });
        
        // Add the last metric
        if (currentMetric) {
            metrics.push(currentMetric);
        }
        
        return metrics;
    }

    /**
     * Create a progress bar HTML element
     * @param {number} value - Current value
     * @param {number} maxValue - Maximum value
     * @returns {string} Progress bar HTML
     */
    createProgressBar(value, maxValue) {
        if (!value || !maxValue) return '';
        
        const percentage = Math.min((value / maxValue) * 100, 100);
        const colorClass = this.getProgressBarColor(percentage);
        
        return `
            <div class="metric-progress-container">
                <div class="metric-progress-bar">
                    <div class="metric-progress-fill ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="metric-progress-value">${value}/${maxValue}</div>
            </div>
        `;
    }

    /**
     * Get color class for progress bar based on percentage
     * @param {number} percentage - Progress percentage
     * @returns {string} Color class
     */
    getProgressBarColor(percentage) {
        if (percentage >= 80) return 'progress-excellent';
        if (percentage >= 60) return 'progress-good';
        if (percentage >= 40) return 'progress-average';
        if (percentage >= 20) return 'progress-poor';
        return 'progress-very-poor';
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