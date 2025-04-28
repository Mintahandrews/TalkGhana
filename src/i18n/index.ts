import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { GhanaianLanguage } from "../context/LanguageContext";
import Backend from "i18next-http-backend";

// Import translation resources from the default translations
import enTranslations from "./locales/en.json";
import twiTranslations from "./locales/twi.json";
import gaTranslations from "./locales/ga.json";
import eweTranslations from "./locales/ewe.json";
import hausaTranslations from "./locales/hausa.json";
import dagbaniTranslations from "./locales/dagbani.json";

// Map language codes to their full names
export const languageMap: Record<string, string> = {
  en: "English",
  twi: "Twi",
  ga: "Ga",
  ewe: "Ewe",
  hausa: "Hausa",
  dagbani: "Dagbani",
};

// Map language codes to their respective languageContext codes
export const languageContextMap: Record<string, GhanaianLanguage> = {
  en: "english",
  twi: "twi",
  ga: "ga",
  ewe: "ewe",
  hausa: "hausa",
  dagbani: "dagbani",
};

// Helper to convert from GhanaianLanguage to i18n language code
export const getI18nCode = (lang: GhanaianLanguage): string => {
  return lang === "english" ? "en" : lang;
};

// Helper to convert from i18n language code to GhanaianLanguage
export const getGhanaianLanguage = (i18nCode: string): GhanaianLanguage => {
  return languageContextMap[i18nCode] || "english";
};

// Configure i18next
i18n
  // Load translations from backend if available
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      twi: {
        translation: twiTranslations,
      },
      ga: {
        translation: gaTranslations,
      },
      ewe: {
        translation: eweTranslations,
      },
      hausa: {
        translation: hausaTranslations,
      },
      dagbani: {
        translation: dagbaniTranslations,
      },
    },
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    // Common namespace used around the full app
    ns: ["translation"],
    defaultNS: "translation",

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false, // React already safes from XSS
      formatSeparator: ",",
    },

    // Language detection options
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "language",
      caches: ["localStorage"],
    },

    react: {
      useSuspense: true,
      transSupportBasicHtmlNodes: true, // Allow basic HTML in translations
      transKeepBasicHtmlNodesFor: [
        "br",
        "strong",
        "i",
        "em",
        "p",
        "span",
        "div",
      ], // List of accepted HTML elements
    },
  });

// Apply language attributes to all HTML elements with lang attribute
export const applyLanguageToElements = (lng: string) => {
  // Update all elements with lang attribute
  document.querySelectorAll("[lang]").forEach((el) => {
    if (el instanceof HTMLElement) {
      el.lang = lng;
    }
  });

  // Update all custom elements/web components with data-lang attribute
  document.querySelectorAll("[data-lang]").forEach((el) => {
    if (el instanceof HTMLElement) {
      el.setAttribute("data-lang", lng);
    }
  });

  // Apply to all forms
  document.querySelectorAll("form").forEach((el) => {
    if (el instanceof HTMLFormElement && !el.hasAttribute("lang")) {
      el.lang = lng;
    }
  });

  // Apply to input placeholders using CSS variables
  document.documentElement.style.setProperty("--placeholder-lang", lng);
};

// Apply language-specific CSS classes
export const applyLanguageStyles = (lng: string) => {
  const ghanaianLang = getGhanaianLanguage(lng);

  // Add language-specific class to body for global styling
  document.body.classList.remove(
    "lang-english",
    "lang-twi",
    "lang-ga",
    "lang-ewe",
    "lang-hausa",
    "lang-dagbani"
  );
  document.body.classList.add(`lang-${ghanaianLang}`);

  // Apply font adjustments based on language
  document.documentElement.style.setProperty(
    "--lang-font-family",
    lng === "en"
      ? "system-ui, sans-serif"
      : "var(--font-ghanaian), system-ui, sans-serif"
  );

  // Apply text direction if needed (currently all are LTR)
  document.documentElement.dir = "ltr";
};

// Function to change language
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  // Save to localStorage to maintain language preference
  const ghanaianLang = getGhanaianLanguage(lng);
  localStorage.setItem("language", ghanaianLang);

  // Set HTML lang attribute for accessibility
  document.documentElement.lang = lng;

  // Set data attribute for CSS
  document.documentElement.setAttribute("data-language", lng);

  // Apply to all elements
  applyLanguageToElements(lng);

  // Apply language-specific styles
  applyLanguageStyles(lng);

  // Create a custom event with language details
  const event = new CustomEvent("app-language-change", {
    detail: { language: ghanaianLang, i18nCode: lng },
  });

  // Broadcast to all components
  window.dispatchEvent(event);

  // Also dispatch standard event
  window.dispatchEvent(new Event("languagechange"));
};

// Listen for language changes
i18n.on("languageChanged", (lng) => {
  // Update document attributes
  document.documentElement.lang = lng;
  document.documentElement.setAttribute("data-language", lng);

  // Apply to all elements
  applyLanguageToElements(lng);

  // Apply language-specific styles
  applyLanguageStyles(lng);

  // Add a language-specific class to enable language-specific CSS
  const languageClasses = [
    "lang-en",
    "lang-twi",
    "lang-ga",
    "lang-ewe",
    "lang-hausa",
    "lang-dagbani",
  ];
  languageClasses.forEach((cls) =>
    document.documentElement.classList.remove(cls)
  );
  document.documentElement.classList.add(`lang-${lng === "en" ? "en" : lng}`);
});

// Utility function to translate text for web components and non-React elements
export const translateText = (key: string, options?: any): string => {
  const translated = i18n.t(key, options);
  // Ensure we return a string type
  return typeof translated === "string" ? translated : String(translated);
};

// Register global translation function for Web Components
if (typeof window !== "undefined") {
  (window as any).translateText = translateText;
}

// Expose a method for applying translations to dynamically created content
export const applyTranslationsToElement = (element: HTMLElement): void => {
  // Find all elements with data-i18n attribute
  element.querySelectorAll("[data-i18n]").forEach((el) => {
    if (el instanceof HTMLElement) {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.textContent = i18n.t(key);
      }
    }
  });

  // Apply to attributes like placeholder, title, etc.
  element.querySelectorAll("[data-i18n-attr]").forEach((el) => {
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
};

export default i18n;
