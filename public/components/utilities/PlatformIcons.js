/**
 * Platform Icons
 * Social media platform icon definitions
 */
class PlatformIcons {
    static getIcon(platform) {
        const icons = {
            'facebook': '<svg>...</svg>',
            'instagram': '<svg>...</svg>',
            // ... all your icons
        };

        const normalized = String(platform).toLowerCase().replace(/[^a-z]/g, '');
        return icons[normalized] || normalized;
    }
}

window.PlatformIcons = PlatformIcons;