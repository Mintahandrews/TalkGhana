/**
 * Language Utilities for TalkGhana
 *
 * This file provides helpers for applying language settings
 * across the application, especially for dynamic content
 * and third-party components.
 */

import { GhanaianLanguage } from "../context/LanguageContext";
import i18n, { getI18nCode, applyTranslationsToElement } from "../i18n";

/**
 * Apply translations to dynamically created content
 * @param element The DOM element to apply translations to
 */
export const translateElement = (element: HTMLElement): void => {
  applyTranslationsToElement(element);
};

/**
 * Apply language-specific attributes to an HTML element
 * @param element The element to update
 * @param language The current language
 */
export const applyLanguageAttributes = (
  element: HTMLElement,
  language: GhanaianLanguage
): void => {
  const i18nCode = getI18nCode(language);

  // Set language attribute
  element.lang = i18nCode;

  // Set custom data attribute
  element.setAttribute("data-lang", i18nCode);

  // Add language-specific class
  element.classList.remove(
    "lang-english",
    "lang-twi",
    "lang-ga",
    "lang-ewe",
    "lang-hausa",
    "lang-dagbani"
  );
  element.classList.add(`lang-${language}`);
};

/**
 * Apply language settings to third-party components
 * @param componentId ID of the component to update
 * @param language Current language
 * @param options Additional options for the component
 */
export const configureExternalComponentLanguage = (
  componentId: string,
  language: GhanaianLanguage,
  options?: Record<string, any>
): void => {
  const element = document.getElementById(componentId);
  if (!element) return;

  const i18nCode = getI18nCode(language);

  // Apply language attributes
  applyLanguageAttributes(element, language);

  // For custom web components that support language property
  if ("language" in element) {
    (element as any).language = i18nCode;
  }

  // For components that need language via data attribute
  element.setAttribute("data-language", i18nCode);

  // For common third-party libraries
  if (options?.thirdPartyType === "datepicker") {
    // Apply to datepicker libraries
    if (window.flatpickr && element.classList.contains("flatpickr-input")) {
      // Re-init flatpickr with new locale
      if (window.flatpickr.l10ns && window.flatpickr.l10ns[i18nCode]) {
        (window.flatpickr as any)(element, {
          locale: i18nCode,
          ...options?.config,
        });
      }
    }
  }

  // Update ARIA attributes
  element.setAttribute("aria-lang", i18nCode);
};

/**
 * Translates all static text within the application
 * Useful for updating the UI after a language change
 */
export const updateAllStaticText = (): void => {
  // Update all elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (el instanceof HTMLElement) {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.textContent = i18n.t(key);
      }
    }
  });

  // Update elements with translated attributes
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    if (el instanceof HTMLElement) {
      const attrs = el.getAttribute("data-i18n-attr")?.split(",") || [];
      attrs.forEach((attrPair) => {
        const [attr, key] = attrPair.split(":");
        if (attr && key) {
          el.setAttribute(attr, i18n.t(key));
        }
      });
    }
  });

  // Update placeholders
  document
    .querySelectorAll("input[placeholder], textarea[placeholder]")
    .forEach((el) => {
      if (el instanceof HTMLElement) {
        const placeholderKey = el.getAttribute("data-i18n-placeholder");
        if (placeholderKey) {
          el.setAttribute("placeholder", i18n.t(placeholderKey));
        }
      }
    });

  // Update button text
  document.querySelectorAll("button[data-i18n-text]").forEach((el) => {
    if (el instanceof HTMLElement) {
      const textKey = el.getAttribute("data-i18n-text");
      if (textKey) {
        el.textContent = i18n.t(textKey);
      }
    }
  });
};

/**
 * Returns the appropriate text direction for a given language
 * @param language The language to get direction for
 * @returns 'ltr' or 'rtl' direction
 */
export const getTextDirection = (language: GhanaianLanguage): "ltr" | "rtl" => {
  // All Ghanaian languages currently supported are LTR
  return "ltr";
};

/**
 * Get localized date format for the current language
 * @param language The language to get date format for
 * @returns Date format string
 */
export const getDateFormat = (language: GhanaianLanguage): string => {
  switch (language) {
    case "english":
      return "MM/DD/YYYY";
    default:
      // Most Ghanaian languages use the same format
      return "DD/MM/YYYY";
  }
};

/**
 * Get number format for the current language
 */
export const getNumberFormat = (
  language: GhanaianLanguage
): Intl.NumberFormatOptions => {
  // Currently all supported languages use the same number format
  return {
    style: "decimal",
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };
};

// Add typings for third-party libraries we might interact with
declare global {
  interface Window {
    flatpickr?: any;
  }
}

export default {
  translateElement,
  applyLanguageAttributes,
  configureExternalComponentLanguage,
  updateAllStaticText,
  getTextDirection,
  getDateFormat,
  getNumberFormat,
};
