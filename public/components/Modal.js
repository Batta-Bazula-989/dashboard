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
        const hasStructuredFormat = this.detectStructuredFormat(lines);
        
        if (hasStructuredFormat) {
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