/**
 * ComponentLoader
 * Handles loading and initializing components
 */
class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.loadedComponents = new Set();
    }

    /**
     * Register a component
     * @param {string} name - Component name
     * @param {Function} componentClass - Component class
     */
    register(name, componentClass) {
        this.components.set(name, componentClass);
    }

    /**
     * Load a component script
     * @param {string} componentName - Name of the component to load
     * @returns {Promise} Promise that resolves when component is loaded
     */
    async loadComponent(componentName) {
        if (this.loadedComponents.has(componentName)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `components/${componentName}.js`;
            script.onload = () => {
                this.loadedComponents.add(componentName);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load component: ${componentName}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Load multiple components
     * @param {Array<string>} componentNames - Array of component names to load
     * @returns {Promise} Promise that resolves when all components are loaded
     */
    async loadComponents(componentNames) {
        const loadPromises = componentNames.map(name => this.loadComponent(name));
        return Promise.all(loadPromises);
    }

    /**
     * Create an instance of a component
     * @param {string} componentName - Name of the component
     * @returns {Object} Component instance
     */
    createComponent(componentName) {
        const ComponentClass = this.components.get(componentName);
        if (!ComponentClass) {
            throw new Error(`Component not registered: ${componentName}`);
        }
        return new ComponentClass();
    }

    /**
     * Initialize a component with a container
     * @param {string} componentName - Name of the component
     * @param {HTMLElement} container - Container element
     * @param {...any} args - Additional arguments for component init
     * @returns {Object} Component instance
     */
   initComponent(componentName, container, ...args) {
       const Component = this.components.get(componentName);
       if (!Component) {
           console.error(`Component ${componentName} not found`);
           return null;
       }

       const instance = new Component();
       if (instance.init) {
           instance.init(container, ...args); // This passes all arguments
       }

       return instance;
   }

    /**
     * Get all registered component names
     * @returns {Array<string>} Array of component names
     */
    getRegisteredComponents() {
        return Array.from(this.components.keys());
    }

    /**
     * Check if a component is loaded
     * @param {string} componentName - Name of the component
     * @returns {boolean} True if component is loaded
     */
    isComponentLoaded(componentName) {
        return this.loadedComponents.has(componentName);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
} else {
    window.ComponentLoader = ComponentLoader;
}
