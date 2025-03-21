import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

export type GhanaianLanguage = "twi" | "ga" | "ewe" | "hausa" | "english";

interface LanguageContextType {
  currentLanguage: GhanaianLanguage;
  setLanguage: (language: GhanaianLanguage) => void;
  translations: Record<string, string>;
  t: (key: string) => string;
  isLanguageLoaded: boolean;
}

const defaultTranslations: Record<GhanaianLanguage, Record<string, string>> = {
  hausa: {
    welcome: "Sannu",
    speak: "Yi magana",
    listen: "Saurara",
    settings: "Saituna",
    homeTitle: "TalkGhana",
    homeSubtitle: "AI taimako don magana",
    conversationMode: "Yanayin Hira",
    voiceCommands: "Umarnin Murya",
    languageSettings: "Saituna na Harshe",
    accessibilitySettings: "Saituna na Samun Damar Shiga",
    highContrast: "Bambanci Mai Girma",
    largeText: "Rubutu Mai Girma",
    offlineMode: "Yanayin Offline",
    currentLanguage: "Harshen da ake amfani da shi yanzu",
    speechRate: "Gurin Magana",
    speechPitch: "Muryar Magana",
    suggestions: "Shawarwari",
    type: "Rubuta",
    emergency: "Gaggawa",
    yes: "Eh",
    no: "A'a",
    thankyou: "Na gode",
    help: "Taimako",
    offline: "Offline",
    online: "Online",
    downloadComplete: "An gama sauke-sauke",
    downloadFailed: "Sauke-sauke ya gaza",
    downloadInProgress: "Ana sauke-sauke...",
    storageManagement: "Gudanar da Ma'ajiya",
    clearCache: "Share Cache",
    offlineReady: "An shirya don offline",
    syncRequired: "Ana buƙatar sync",
    dataUsage: "Amfani da Data",
    batteryOptimization: "Inganta Batir",
  },
  twi: {
    welcome: "Akwaaba",
    speak: "Kasa",
    listen: "Tie",
    settings: "Nhyehyɛe",
    homeTitle: "TalkGhana",
    homeSubtitle: "Mmɔborɔhunu ahyɛnsofo a wɔde AI ayɛ adwuma",
    conversationMode: "Nkɔmmɔdie Kwan",
    voiceCommands: "Nne Ahyɛdeɛ",
    languageSettings: "Kasa Ho Nhyehyɛe",
    accessibilitySettings: "Mmerɛyɛ Ho Nhyehyɛe",
    highContrast: "Nsonsonoeɛ Kɛseɛ",
    largeText: "Nkyerɛwee Kɛseɛ",
    offlineMode: "Oflain Kwan",
    currentLanguage: "Kasa a wɔredwene ho seisei",
    speechRate: "Kasa ntɛmntɛm",
    speechPitch: "Kasa nnyigyeɛ",
    suggestions: "Nsusueɛ",
    type: "Taep",
    emergency: "Ɔhaw",
    yes: "Aane",
    no: "Daabi",
    thankyou: "Medaase",
    help: "Boa me",
    offline: "Oflain",
    online: "Onlain",
    downloadComplete: "Atwede awie",
    downloadFailed: "Atwede anni yie",
    downloadInProgress: "Retrewee...",
    storageManagement: "Adaka Nhyehyɛe",
    clearCache: "Yi cache",
    offlineReady: "Awie siesie ma oflain dwumadie",
    syncRequired: "Ehia sync",
    dataUsage: "Data Dwumadie",
    batteryOptimization: "Battery Optimization",
  },
  ga: {
    welcome: "Nnɛɛ",
    speak: "Wiemo",
    listen: "Boo",
    settings: "Ntohoo",
    homeTitle: "TalkGhana",
    homeSubtitle: "AI hewale kɛ wi saji asharaloo",
    conversationMode: "Sane Su",
    voiceCommands: "Gbee Kitashii",
    languageSettings: "Wiemɔ Mlihii",
    accessibilitySettings: "Mlijemɔ Mlihii",
    highContrast: "Srɔto Agbo",
    largeText: "Ninemaa Agbo",
    offlineMode: "Oflaini Su",
    currentLanguage: "Wiemɔ ni Ajie Amrɔ Nɛɛ",
    speechRate: "Wiemɔ Oyaayaa",
    speechPitch: "Wiemɔ Wui",
    suggestions: "Tsuii",
    type: "Ŋma",
    emergency: "Amrɔ Shia",
    yes: "Hɛɛ",
    no: "Daabi",
    thankyou: "Oyiwaladon",
    help: "Ye mi boa",
    offline: "Oflaini",
    online: "Onlaini",
    downloadComplete: "Kɛdownload Eba Naagbee",
    downloadFailed: "Kɛdownload Eyako Jogbaŋŋ",
    downloadInProgress: "Kɛkɛɛ Miikɛdownload...",
    storageManagement: "Kɛto Nii Kusum",
    clearCache: "Tuu Cache",
    offlineReady: "Esaa Kɛha Oflaini Nitsumo",
    syncRequired: "Esa Akɛsync",
    dataUsage: "Data Nitsumo",
    batteryOptimization: "Battery Hewalemo",
  },
  ewe: {
    welcome: "Woezor",
    speak: "Ƒo nu",
    listen: "Ɖo to",
    settings: "Ɖoɖowo",
    homeTitle: "TalkGhana",
    homeSubtitle: "AI ƒe kpekpeɖeŋu na nuƒoƒo",
    conversationMode: "Dzeɖoɖo Ƒomevi",
    voiceCommands: "Gbe Sedeɖewo",
    languageSettings: "Gbegbɔgblɔ Ðoɖowo",
    accessibilitySettings: "Mɔxexe Ðoɖowo",
    highContrast: "Vovototo Gã",
    largeText: "Nuŋɔŋlɔ Gã",
    offlineMode: "Oflaine Ƒomevi",
    currentLanguage: "Gbegbɔgblɔ si le zɔzɔm fifia",
    speechRate: "Nuƒoƒo ƒe Ɣeyiɣi",
    speechPitch: "Nuƒoƒo ƒe Gã",
    suggestions: "Adaŋudedowo",
    type: "Ŋlɔ nu",
    emergency: "Dzodzo Xaxa",
    yes: "Ɛ",
    no: "Ao",
    thankyou: "Akpe",
    help: "Kpe ɖe ŋunye",
    offline: "Oflaine",
    online: "Onlaine",
    downloadComplete: "Daun loudin Vɔ",
    downloadFailed: "Daun loudin Mede Edzi O",
    downloadInProgress: "Daun loadim...",
    storageManagement: "Dzraɖoƒe Ðoɖowo",
    clearCache: "Tutu Cache",
    offlineReady: "Sɔgbɔ Na Oflaine Dɔwɔwɔ",
    syncRequired: "Ehiã Be Woawɔ Sync",
    dataUsage: "Data Zazã",
    batteryOptimization: "Battery Nyonyoɖeŋu",
  },
  english: {
    welcome: "Welcome",
    speak: "Speak",
    listen: "Listen",
    settings: "Settings",
    homeTitle: "TalkGhana",
    homeSubtitle: "AI-powered communication assistant",
    conversationMode: "Conversation Mode",
    voiceCommands: "Voice Commands",
    languageSettings: "Language Settings",
    accessibilitySettings: "Accessibility Settings",
    highContrast: "High Contrast",
    largeText: "Large Text",
    offlineMode: "Offline Mode",
    currentLanguage: "Current Language",
    speechRate: "Speech Rate",
    speechPitch: "Speech Pitch",
    suggestions: "Suggestions",
    type: "Type",
    emergency: "Emergency",
    yes: "Yes",
    no: "No",
    thankyou: "Thank you",
    help: "Help me",
    offline: "Offline",
    online: "Online",
    downloadComplete: "Download Complete",
    downloadFailed: "Download Failed",
    downloadInProgress: "Downloading...",
    storageManagement: "Storage Management",
    clearCache: "Clear Cache",
    offlineReady: "Ready for Offline Use",
    syncRequired: "Sync Required",
    dataUsage: "Data Usage",
    batteryOptimization: "Battery Optimization",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: "english",
  setLanguage: () => {},
  translations: defaultTranslations.english,
  t: (key) => key,
  isLanguageLoaded: false,
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
          // Set HTML lang attribute for screen readers
          document.documentElement.lang =
            currentLanguage === "english" ? "en" : currentLanguage;
        }

        // Broadcast language change event for components listening
        window.dispatchEvent(new Event("languagechange"));

        setIsLanguageLoaded(true);
      } catch (error) {
        console.error("Error checking offline language data:", error);
        setIsLanguageLoaded(true); // Still mark as loaded even on error to prevent blocking UI
      }
    };

    checkOfflineData();
  }, [currentLanguage]);

  const setLanguage = (language: GhanaianLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem("language", language);

    // Force update any components that might not be directly connected to the context
    // This ensures that all parts of the app respond to language changes
    document.documentElement.lang = language === "english" ? "en" : language;
  };

  const t = (key: string): string => {
    return translations[key] || defaultTranslations.english[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        translations,
        t,
        isLanguageLoaded,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
