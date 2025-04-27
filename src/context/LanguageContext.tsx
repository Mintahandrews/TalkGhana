import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import i18n, {
  changeLanguage,
  languageContextMap,
  getI18nCode,
  getGhanaianLanguage,
  applyTranslationsToElement,
  translateText,
} from "../i18n";

export type GhanaianLanguage =
  | "twi"
  | "ga"
  | "ewe"
  | "hausa"
  | "english"
  | "dagbani";

interface LanguageContextType {
  currentLanguage: GhanaianLanguage;
  setLanguage: (language: GhanaianLanguage) => void;
  translations: Record<string, string>;
  t: (key: string, options?: any) => string;
  isLanguageLoaded: boolean;
  applyTranslations: (element: HTMLElement) => void;
  formatText: (text: string, options?: object) => string;
  availableLanguages: {
    code: string;
    name: string;
    localName: string;
    voiceAvailable: boolean;
    offlineSupport: boolean;
  }[];
  getLanguageResource: (code: string) =>
    | {
        code: string;
        name: string;
        localName: string;
        voiceAvailable: boolean;
        offlineSupport: boolean;
      }
    | undefined;
}

// Default translations are now managed by i18n files
const defaultTranslations: Record<GhanaianLanguage, Record<string, string>> = {
  twi: {},
  ga: {},
  ewe: {},
  hausa: {},
  english: {},
  dagbani: {},
};

// Language resources with additional metadata
const languageResources = [
  {
    code: "english",
    name: "English",
    localName: "English",
    voiceAvailable: true,
    offlineSupport: true,
  },
  {
    code: "twi",
    name: "Twi",
    localName: "Twi",
    voiceAvailable: true,
    offlineSupport: true,
  },
  {
    code: "ga",
    name: "Ga",
    localName: "Gã",
    voiceAvailable: true,
    offlineSupport: true,
  },
  {
    code: "ewe",
    name: "Ewe",
    localName: "Eʋegbe",
    voiceAvailable: true,
    offlineSupport: true,
  },
  {
    code: "hausa",
    name: "Hausa",
    localName: "Harshen Hausa",
    voiceAvailable: true,
    offlineSupport: true,
  },
  {
    code: "dagbani",
    name: "Dagbani",
    localName: "Dagbanli",
    voiceAvailable: true,
    offlineSupport: true,
  },
];

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: "english",
  setLanguage: () => {},
  translations: defaultTranslations.english,
  t: (key) => key,
  isLanguageLoaded: false,
  applyTranslations: () => {},
  formatText: (text) => text,
  availableLanguages: languageResources,
  getLanguageResource: () => undefined,
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const savedLanguage = localStorage.getItem("language") as GhanaianLanguage;
  const [currentLanguage, setCurrentLanguage] = useState<GhanaianLanguage>(
    savedLanguage || "english"
  );
  const [translations, setTranslations] = useState(
    defaultTranslations[currentLanguage] || defaultTranslations.english
  );
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  // Use the i18next translation hook
  const { t: i18nextT, ready } = useTranslation();

  // When component mounts, set the i18n language
  useEffect(() => {
    // Convert GhanaianLanguage to i18n language code
    const i18nLang = getI18nCode(currentLanguage);
    i18n.changeLanguage(i18nLang);

    // Set language loaded when i18next is ready
    if (ready) {
      setIsLanguageLoaded(true);
    }
  }, [ready, currentLanguage]);

  // Load language and check if we have offline data for it
  useEffect(() => {
    // Set current translations
    setTranslations(defaultTranslations[currentLanguage]);

    // Check if we have offline data for this language
    const checkOfflineData = async () => {
      try {
        // First, check local storage for a simple flag
        const offlineDataAvailable = localStorage.getItem(
          `offline-${currentLanguage}`
        );

        if (offlineDataAvailable === "true") {
          // In a full implementation, we would load the offline data from IndexedDB here
          console.log(`Offline data available for ${currentLanguage}`);
        }

        // Set HTML lang attribute for screen readers and better accessibility
        document.documentElement.lang =
          currentLanguage === "english" ? "en" : currentLanguage;

        // Set a data attribute to allow CSS targeting based on language
        document.documentElement.setAttribute("data-language", currentLanguage);

        // Add language class to body for CSS styling
        document.body.classList.remove(
          "lang-english",
          "lang-twi",
          "lang-ga",
          "lang-ewe",
          "lang-hausa",
          "lang-dagbani"
        );
        document.body.classList.add(`lang-${currentLanguage}`);

        // Broadcast language change event for components listening
        const event = new CustomEvent("app-language-change", {
          detail: {
            language: currentLanguage,
            i18nCode: getI18nCode(currentLanguage),
          },
        });
        window.dispatchEvent(event);

        // Also dispatch standard event for native HTML elements
        window.dispatchEvent(new Event("languagechange"));

        setIsLanguageLoaded(true);
      } catch (error) {
        console.error("Error checking offline language data:", error);
        setIsLanguageLoaded(true); // Still mark as loaded even on error to prevent blocking UI
      }
    };

    checkOfflineData();
  }, [currentLanguage]);

  const setLanguage = useCallback((language: GhanaianLanguage) => {
    // Update state
    setCurrentLanguage(language);

    // Save to localStorage
    localStorage.setItem("language", language);

    // Set i18n language using the proper code
    const i18nLang = getI18nCode(language);
    changeLanguage(i18nLang);

    // Set HTML lang attribute for accessibility
    document.documentElement.lang = i18nLang;

    // Set data attribute for CSS
    document.documentElement.setAttribute("data-language", language);

    // Update body class for CSS styling
    document.body.classList.remove(
      "lang-english",
      "lang-twi",
      "lang-ga",
      "lang-ewe",
      "lang-hausa",
      "lang-dagbani"
    );
    document.body.classList.add(`lang-${language}`);

    // Create a custom event with language details
    const event = new CustomEvent("app-language-change", {
      detail: {
        language,
        i18nCode: i18nLang,
      },
    });

    // Broadcast to all components
    window.dispatchEvent(event);

    // Also dispatch standard event
    window.dispatchEvent(new Event("languagechange"));

    // Force any elements with the 'lang' attribute to update
    document.querySelectorAll("[lang]").forEach((el) => {
      if (el instanceof HTMLElement) {
        el.lang = i18nLang;
      }
    });

    // Update elements with data-i18n attributes
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el instanceof HTMLElement) {
        const key = el.getAttribute("data-i18n");
        if (key) {
          el.textContent = i18n.t(key);
        }
      }
    });

    // Update placeholders and other attributes
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

    // Update title to reflect language change
    if (document.title) {
      const title = document.title;
      // This forces a re-render of the title
      document.title = "";
      document.title = title;
    }
  }, []);

  // Enhanced translation function that uses i18next but falls back to our legacy system
  const t = useCallback(
    (key: string, options?: any): string => {
      // First try using i18next
      const i18nTranslation = i18nextT(key, options);

      // If i18next returns the key itself (meaning no translation), fall back to our legacy system
      if (i18nTranslation === key || typeof i18nTranslation !== "string") {
        return translations[key] || defaultTranslations.english[key] || key;
      }

      return i18nTranslation;
    },
    [i18nextT, translations]
  );

  // Utility function to apply translations to a dynamically created element
  const applyTranslations = useCallback((element: HTMLElement): void => {
    applyTranslationsToElement(element);
  }, []);

  // Format dynamic text with any special language-specific rules
  const formatText = useCallback((text: string, options?: object): string => {
    // Additional language-specific formatting could be applied here
    // For now, we just pass through to translateText which will handle known keys
    return translateText(text, options) || text;
  }, []);

  // Get a language resource by code
  const getLanguageResource = useCallback((code: string) => {
    return languageResources.find((resource) => resource.code === code);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        translations,
        t,
        isLanguageLoaded,
        applyTranslations,
        formatText,
        availableLanguages: languageResources,
        getLanguageResource,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
