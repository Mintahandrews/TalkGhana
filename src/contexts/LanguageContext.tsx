import React, { createContext, useContext, useState, useEffect } from "react";

// Types
type GhanaianLanguage = "twi" | "ga" | "ewe" | "dagbani" | "hausa" | "english";

interface LanguageResource {
  code: GhanaianLanguage;
  name: string;
  localName: string;
  voiceAvailable: boolean;
  offlineSupport: boolean;
  whisperModel: string;
}

interface LanguageContextType {
  currentLanguage: GhanaianLanguage;
  setCurrentLanguage: (lang: GhanaianLanguage) => void;
  availableLanguages: LanguageResource[];
  getLanguageResource: (code: GhanaianLanguage) => LanguageResource | undefined;
}

// Default language resources
const LANGUAGE_RESOURCES: LanguageResource[] = [
  {
    code: "twi",
    name: "Twi",
    localName: "Twi",
    voiceAvailable: true,
    offlineSupport: true,
    whisperModel: "small",
  },
  {
    code: "ga",
    name: "Ga",
    localName: "Gã",
    voiceAvailable: true,
    offlineSupport: false,
    whisperModel: "base",
  },
  {
    code: "ewe",
    name: "Ewe",
    localName: "Eʋegbe",
    voiceAvailable: true,
    offlineSupport: false,
    whisperModel: "base",
  },
  {
    code: "dagbani",
    name: "Dagbani",
    localName: "Dagbani",
    voiceAvailable: false,
    offlineSupport: false,
    whisperModel: "base",
  },
  {
    code: "hausa",
    name: "Hausa",
    localName: "Hausa",
    voiceAvailable: true,
    offlineSupport: false,
    whisperModel: "base",
  },
  {
    code: "english",
    name: "English",
    localName: "English",
    voiceAvailable: true,
    offlineSupport: true,
    whisperModel: "medium",
  },
];

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: "english",
  setCurrentLanguage: () => {},
  availableLanguages: LANGUAGE_RESOURCES,
  getLanguageResource: () => undefined,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<GhanaianLanguage>(
    () => {
      // Try to get saved language from localStorage, default to English
      const savedLanguage = localStorage.getItem("preferredLanguage");
      return (savedLanguage as GhanaianLanguage) || "english";
    }
  );

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("preferredLanguage", currentLanguage);
  }, [currentLanguage]);

  const getLanguageResource = (code: GhanaianLanguage) => {
    return LANGUAGE_RESOURCES.find((lang) => lang.code === code);
  };

  const value = {
    currentLanguage,
    setCurrentLanguage,
    availableLanguages: LANGUAGE_RESOURCES,
    getLanguageResource,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
