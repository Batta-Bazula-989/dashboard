class CardMatcher {
    static findAll(container, competitorName, adText = null) {
        const cards = container.querySelectorAll('.card');
        const matches = [];

        for (let card of cards) {
            const link = card.querySelector('.name-row a');
            const adTextEl = card.querySelector('.ad-text');

            if (!link?.textContent) continue;

            const existingName = link.textContent.trim();
            // Get text from .ad-text element (which now contains body or ad_text)
            const existingAdText = adTextEl?.textContent.trim() || '';

            const nameMatches = this.namesMatch(existingName, competitorName);

            if (nameMatches) {
                if (adText && existingAdText) {
                    // Only match if BOTH name AND text match
                    if (this.textsMatch(existingAdText, adText)) {
                        matches.push(card);
                    }
                } else {
                    // If no adText provided, match by name only
                    matches.push(card);
                }
            }
        }

        return matches;
    }

    // ✅ FIX: Exact match only (case-insensitive)
    static namesMatch(name1, name2) {
        return name1.toLowerCase() === name2.toLowerCase();
    }

    // ✅ FIX: More reliable text matching
    static textsMatch(text1, text2) {
        const t1 = text1.toLowerCase().trim();
        const t2 = text2.toLowerCase().trim();

        // Exact match
        if (t1 === t2) return true;

        // Match first 100 chars (more reliable than 50)
        const preview1 = t1.substring(0, 100);
        const preview2 = t2.substring(0, 100);

        return preview1 === preview2;
    }
}

window.CardMatcher = CardMatcher;