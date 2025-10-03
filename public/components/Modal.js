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

        // Split by numbered sections
        const mainSections = text.split(/(?=\d+[\.\)]\s*[А-ЯЁA-ZІЇЄҐі])/);

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
                'анализ': { icon: '📋', name: 'Аналіз' }
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
     * Format section content
     * @param {string} content - Content to format
     * @returns {string} Formatted HTML content
     */
    formatSectionContent(content) {
        // Clean content by removing all types of dashes from line beginnings
        const cleanContent = content
            .split('\n')
            .map(line => {
                // Remove all types of dashes (-–—•*) from the beginning of lines
                return line
                    .replace(/^\s*[-–—•*]\s*/, '')
                    .trim();
            })
            .filter(line => line.length > 0) // Remove empty lines
            .join('<br>'); // Use <br> for better line spacing

        // Return clean content without pre-wrap to avoid unwanted formatting
        return `<div class="analysis-content-block">${cleanContent}</div>`;
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