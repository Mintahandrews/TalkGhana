import { LocalizedElement } from "./LocalizedElement";

/**
 * Registers all custom web components used in the application.
 * This should be called once during application initialization.
 *
 * @returns A promise that resolves when all components are registered
 */
export const registerWebComponents = async (): Promise<void> => {
  // Only register components in browser environment
  if (typeof window === "undefined") {
    return;
  }

  // Register the localized-text element if not already registered
  if (!customElements.get("localized-text")) {
    customElements.define("localized-text", LocalizedElement);
  }

  // You can add more custom element registrations here

  // Dispatch an event to notify that all components are registered
  const event = new CustomEvent("web-components-registered");
  document.dispatchEvent(event);

  return Promise.resolve();
};

/**
 * Helper function to dispatch a language change event when the application
 * language changes. This will trigger all LocalizedElement instances to update.
 *
 * @param language The new language code
 */
export const notifyLanguageChange = (language: string): void => {
  // Update the lang attribute on the HTML element
  document.documentElement.lang = language;
  document.documentElement.setAttribute("data-lang", language);

  // Dispatch a custom event that LocalizedElement instances listen for
  const event = new CustomEvent("language-changed", {
    detail: { language },
  });
  document.dispatchEvent(event);
};

export default registerWebComponents;
