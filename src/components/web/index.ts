/**
 * Web Components Registration
 *
 * This file exports custom web components that can be used outside of the React application.
 * Both components are automatically registered when imported.
 */

export { LocalizedElement } from "./LocalizedElement";
export { ThemeToggle } from "./ThemeToggle";

// Default export for convenience
export default {
  LocalizedElement,
  ThemeToggle,
};
