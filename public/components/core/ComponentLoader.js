class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.loadedComponents = new Set();
    }


    // Register a component
    register(name, componentClass) {
        this.components.set(name, componentClass);
    }


     // Load a component script
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


     // Load multiple components
    async loadComponents(componentNames) {
        const loadPromises = componentNames.map(name => this.loadComponent(name));
        return Promise.all(loadPromises);
    }


     // Create an instance of a component
    createComponent(componentName) {
        const ComponentClass = this.components.get(componentName);
        if (!ComponentClass) {
            throw new Error(`Component not registered: ${componentName}`);
        }
        return new ComponentClass();
    }


     // Initialize a component with a container
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


    // Get all registered component names
    getRegisteredComponents() {
        return Array.from(this.components.keys());
    }


    // Check if a component is loaded
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
