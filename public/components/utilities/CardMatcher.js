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
    // Optimized: normalize strings once
    static namesMatch(name1, name2) {
        if (!name1 || !name2) return false;
        // Normalize both strings once
        const n1 = name1.toLowerCase();
        const n2 = name2.toLowerCase();
        return n1 === n2;
    }

    // ✅ FIX: More reliable text matching
    // Optimized: normalize strings once at the start
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