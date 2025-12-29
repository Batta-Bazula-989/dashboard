class CardMatcher {
    static _cardCache = new Map();
    static _cacheVersion = 0;
    static _indexedCards = null;
    static _indexedCardsVersion = 0;

    // Build or refresh card index for fast lookups
    static _buildIndex(container) {
        const cards = container.querySelectorAll('.card');
        const index = {
            byName: new Map(), // competitorName -> [cards]
            byNameAndText: new Map(), // "name|text" -> [cards]
            allCards: Array.from(cards)
        };

        // Cache DOM queries per card to avoid repeated queries
        cards.forEach(card => {
            const link = card.querySelector('.name-row a');
            const adTextEl = card.querySelector('.ad-text');

            if (!link?.textContent) return;

            const existingName = link.textContent.trim().toLowerCase();
            const existingAdText = (adTextEl?.textContent.trim() || '').toLowerCase();

            // Index by name only
            if (!index.byName.has(existingName)) {
                index.byName.set(existingName, []);
            }
            index.byName.get(existingName).push(card);

            // Index by name + text for exact matches
            if (existingAdText) {
                const key = `${existingName}|${existingAdText.substring(0, 100)}`;
                if (!index.byNameAndText.has(key)) {
                    index.byNameAndText.set(key, []);
                }
                index.byNameAndText.get(key).push(card);
            }
        });

        return index;
    }

    // Get cached index or build new one
    static _getIndex(container) {
        const cacheKey = container.id || container.className || 'default';
        
        // Check if we need to rebuild index
        const currentCards = container.querySelectorAll('.card');
        const currentCount = currentCards.length;
        
        if (!this._indexedCards || 
            this._indexedCardsVersion !== this._cacheVersion ||
            this._indexedCards.allCards.length !== currentCount) {
            this._indexedCards = this._buildIndex(container);
            this._indexedCardsVersion = this._cacheVersion;
        }

        return this._indexedCards;
    }

    // Invalidate cache when cards are added/removed
    static invalidateCache() {
        this._cacheVersion++;
        this._indexedCards = null;
    }

    static findAll(container, competitorName, adText = null) {
        if (!container) return [];

        const normalizedName = competitorName ? competitorName.toLowerCase().trim() : null;
        const normalizedText = adText ? adText.toLowerCase().trim() : null;

        // Get indexed cards
        const index = this._getIndex(container);
        const matches = [];

        if (!normalizedName) {
            return matches;
        }

        // Fast lookup: try exact match first (name + text)
        if (normalizedText && index.byNameAndText) {
            const exactKey = `${normalizedName}|${normalizedText.substring(0, 100)}`;
            const exactMatches = index.byNameAndText.get(exactKey);
            if (exactMatches) {
                matches.push(...exactMatches);
            }
        }

        // If no exact matches or no text provided, match by name only
        if (matches.length === 0 || !normalizedText) {
            const nameMatches = index.byName.get(normalizedName);
            if (nameMatches) {
                if (normalizedText) {
                    // Filter by text match if text provided
                    nameMatches.forEach(card => {
                        const adTextEl = card.querySelector('.ad-text');
                        const existingAdText = (adTextEl?.textContent.trim() || '').toLowerCase();
                        if (this.textsMatch(existingAdText, normalizedText)) {
                            matches.push(card);
                        }
                    });
                } else {
                    matches.push(...nameMatches);
                }
            }
        }

        return matches;
    }

    static namesMatch(name1, name2) {
        if (!name1 || !name2) return false;
        const n1 = name1.toLowerCase();
        const n2 = name2.toLowerCase();
        return n1 === n2;
    }

    static textsMatch(text1, text2) {
        if (!text1 || !text2) return false;
        // Normalize both strings once at the start
        const t1 = text1.toLowerCase().trim();
        const t2 = text2.toLowerCase().trim();
        // Exact match (early return)
        if (t1 === t2) return true;
        // Match first 100 chars (more reliable than 50)
        const preview1 = t1.substring(0, 100);
        const preview2 = t2.substring(0, 100);

        return preview1 === preview2;
    }
}

window.CardMatcher = CardMatcher;