class CardMatcher {
    static findAll(container, competitorName, adText = null) {
        const cards = container.querySelectorAll('.card');
        const matches = [];

        for (let card of cards) {
            const link = card.querySelector('.name-row a');
            const adTextEl = card.querySelector('.ad-text');

            if (!link?.textContent) continue;

            const existingName = link.textContent.trim();
            const existingAdText = adTextEl?.textContent.trim() || '';

            const nameMatches = this.namesMatch(existingName, competitorName);

            if (nameMatches) {
                if (adText && existingAdText) {
                    if (this.textsMatch(existingAdText, adText)) {
                        matches.push(card);
                    }
                } else {
                    matches.push(card);
                }
            }
        }

        return matches;
    }

    static namesMatch(name1, name2) {
        return name1 === name2 ||
            name1.toLowerCase().includes(name2.toLowerCase()) ||
            name2.toLowerCase().includes(name1.toLowerCase());
    }

    static textsMatch(text1, text2) {
        return text1 === text2 ||
            text1.includes(text2.substring(0, 50)) ||
            text2.includes(text1.substring(0, 50));
    }
}

window.CardMatcher = CardMatcher;