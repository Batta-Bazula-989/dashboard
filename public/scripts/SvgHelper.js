class SvgHelper {
    static create(config) {
        const {
            width = 16,
            height = 16,
            viewBox = '0 0 24 24',
            stroke = 'currentColor',
            fill = 'none',
            strokeWidth = '2',
            strokeLinecap = 'round',
            strokeLinejoin = 'round',
            children = []
        } = config;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(height));
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('fill', fill);
        svg.setAttribute('stroke', stroke);
        svg.setAttribute('stroke-width', strokeWidth);
        svg.setAttribute('stroke-linecap', strokeLinecap);
        svg.setAttribute('stroke-linejoin', strokeLinejoin);

        children.forEach(childConfig => {
            const child = this.createElement(childConfig);
            svg.appendChild(child);
        });

        return svg;
    }


    static createElement(config) {
        const { type, attrs = {} } = config;
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);

        Object.entries(attrs).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        return element;
    }


    static path(d) {
        return { type: 'path', attrs: { d } };
    }


    static line(x1, y1, x2, y2) {
        return { type: 'line', attrs: { x1, y1, x2, y2 } };
    }


    static circle(cx, cy, r) {
        return { type: 'circle', attrs: { cx, cy, r } };
    }


    static polygon(points) {
        return { type: 'polygon', attrs: { points } };
    }


    static polyline(points) {
        return { type: 'polyline', attrs: { points } };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SvgHelper;
}
