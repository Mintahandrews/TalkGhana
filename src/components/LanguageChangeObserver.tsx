import React, { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useUserPreferences } from "../context/UserPreferencesContext";

/**
 * This component observes language changes and applies them to the document
 * and handles interactions with other site settings like large text.
 * It renders nothing but performs important side effects.
 */
const LanguageChangeObserver: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();

  useEffect(() => {
    // Apply language classes to HTML element
    const html = document.documentElement;

    // Set language attribute for screen readers
    html.lang = currentLanguage === "english" ? "en" : currentLanguage;

    // Set data attribute for CSS selectors
    html.setAttribute("data-language", currentLanguage);

    // Clear any existing language classes
    const languageClasses = [
      "lang-en",
      "lang-twi",
      "lang-ga",
      "lang-ewe",
      "lang-hausa",
      "lang-dagbani",
    ];

    languageClasses.forEach((cls) => html.classList.remove(cls));

    // Add current language class
    html.classList.add(
      `lang-${currentLanguage === "english" ? "en" : currentLanguage}`
    );

    // Update document title with current language
    const baseTitleParts = document.title.split(" | ");
    const baseTitle =
      baseTitleParts.length > 1 ? baseTitleParts[0] : document.title;

    // Update title with language indicator for screen readers
    // Only modify if not in English
    if (currentLanguage !== "english") {
      document.title = `${baseTitle} | ${
        currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)
      }`;
    } else {
      document.title = baseTitle;
    }

    // Force update of all elements with lang attribute
    document.querySelectorAll("[lang]").forEach((el) => {
      if (el instanceof HTMLElement) {
        el.lang = currentLanguage === "english" ? "en" : currentLanguage;
      }
    });

    // Create custom event to notify other components of language change
    const event = new CustomEvent("app-language-change", {
      detail: { language: currentLanguage },
    });
    window.dispatchEvent(event);
  }, [currentLanguage]);

  // Handle accessibility preference interactions with language
  useEffect(() => {
    const html = document.documentElement;

    if (preferences.largeText) {
      html.classList.add("large-text");
    } else {
      html.classList.remove("large-text");
    }

    if (preferences.highContrast) {
      html.classList.add("high-contrast");
    } else {
      html.classList.remove("high-contrast");
    }
  }, [preferences.largeText, preferences.highContrast]);

  // This component doesn't render anything
  return null;
};

export default LanguageChangeObserver;
