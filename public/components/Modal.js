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

        // Split by numbered sections - improved regex to catch more patterns
        const mainSections = text.split(/(?=\d+[\.\)]\s*[А-ЯЁA-ZІЇЄҐіЄЇ])/);

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

                const titleMatch = trimmed.match(/^(\d+[\.\)]\s*)([^\n:]+)/);
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
     * Format section content with professional structure for all tabs
     * @param {string} content - Content to format
     * @returns {string} Formatted HTML content
     */
    formatSectionContent(content) {
        // Remove numbered prefix like "1) Копирайтинг"
        content = content.replace(/^\d+[\.\)]\s*[^\n]+\n?/, '');

        // Split into lines and clean them
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        let formatted = '';
        let currentCategory = '';
        let currentContent = '';

        lines.forEach((line, index) => {
            // Remove leading dashes/bullets
            let cleanLine = line.replace(/^[-–—•*]+\s*/, '').trim();
            
            if (!cleanLine) return;

            // Check if this is a category header (ends with colon)
            const isCategoryHeader = cleanLine.match(/^([^:]+):\s*(.*)$/);

            if (isCategoryHeader) {
                // Flush previous category
                if (currentCategory && currentContent) {
                    formatted += this.formatCategoryBlock(currentCategory, currentContent);
                }

                // Start new category
                currentCategory = isCategoryHeader[1].trim();
                currentContent = isCategoryHeader[2].trim();
            } else {
                // Check if this is a SWOT-style single letter header (S:, W:, O:, T:)
                const isSWOTHeader = cleanLine.match(/^([A-Z]):\s*(.*)$/);
                
                if (isSWOTHeader) {
                    // Flush previous category
                    if (currentCategory && currentContent) {
                        formatted += this.formatCategoryBlock(currentCategory, currentContent);
                    }

                    // Start new SWOT category
                    currentCategory = isSWOTHeader[1].trim();
                    currentContent = isSWOTHeader[2].trim();
                } else {
                    // Regular content line - add to current content
                    if (currentContent) {
                        currentContent += ' ' + cleanLine;
                    } else {
                        currentContent = cleanLine;
                    }
                }
            }
        });

        // Flush remaining category
        if (currentCategory && currentContent) {
            formatted += this.formatCategoryBlock(currentCategory, currentContent);
        }

        // If no categories were found, format as simple content
        if (!formatted) {
            const simpleContent = lines
                .map(line => line.replace(/^[-–—•*]+\s*/, '').trim())
                .filter(line => line.length > 0)
                .join(' ');
            
            if (simpleContent) {
                formatted = `<div class="analysis-simple-content">${simpleContent}</div>`;
            }
        }

        return formatted || '<div class="analysis-content-block">Немає даних</div>';
    }

    /**
     * Format a category block with header and content
     * @param {string} category - Category name
     * @param {string} content - Category content
     * @returns {string} Formatted HTML
     */
    formatCategoryBlock(category, content) {
        return `
            <div class="analysis-category">
                <div class="category-header">${category}:</div>
                <div class="category-content">${content}</div>
            </div>
        `;
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