/**
 * Web Components Registration
 *
 * This file exports custom web components that can be used outside of the React application.
 * Both components are automatically registered when imported.
 */

import { LocalizedElement } from "./LocalizedElement";
import { ThemeToggle } from "./ThemeToggle";

export { LocalizedElement } from "./LocalizedElement";
export { ThemeToggle } from "./ThemeToggle";

/**
 * Register all web components for use in the application
 */
export const registerWebComponents = (): void => {
  // Register custom elements if not already defined
  if (!customElements.get("localized-text")) {
    customElements.define("localized-text", LocalizedElement);
  }

  if (!customElements.get("theme-toggle")) {
    customElements.define("theme-toggle", ThemeToggle);
  }
};

// Default export for convenience
export default {
  LocalizedElement,
  ThemeToggle,
  registerWebComponents,
};
