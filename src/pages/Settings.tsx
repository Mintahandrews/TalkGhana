import { useState, useEffect } from "react";
import {
  Check,
  Download,
  Globe,
  HardDrive,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Server,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { GhanaianLanguage } from "../services/LanguageService";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useTextToSpeech } from "../services/TextToSpeechService";
import ServiceWorkerStatus from "../components/ServiceWorkerStatus";

const Settings = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { preferences, updatePreference } = useUserPreferences();
  const [isTesting, setIsTesting] = useState(false);
  const [offlineData, setOfflineData] = useState<{
    downloaded: boolean;
    size: string;
  }>({
    downloaded: false,
    size: "0 MB",
  });

  // Initialize voices
  const {
    speak,
    stop: stopSpeaking,
    selectedVoice,
    setSelectedVoice,
    isOnline,
    browserSupportsTTS,
  } = useTextToSpeech(currentLanguage);

  const languages: { id: GhanaianLanguage; name: string }[] = [
    { id: "english", name: "English" },
    { id: "twi", name: "Twi" },
    { id: "ga", name: "Ga" },
    { id: "ewe", name: "Ewe" },
    { id: "hausa", name: "Hausa" },
  ];

  // Simulate downloading language model
  const downloadLanguageModel = (language: GhanaianLanguage) => {
    // In a real app, this would download actual model data
    const sizes: Record<GhanaianLanguage, string> = {
      english: "45 MB",
      twi: "32 MB",
      ga: "28 MB",
      ewe: "30 MB",
      hausa: "35 MB",
    };

    // Simulate progress
    const downloadButton = document.getElementById(`download-${language}`);
    if (downloadButton) {
      downloadButton.innerHTML =
        '<span class="animate-pulse">Downloading...</span>';
    }

    setTimeout(() => {
      setOfflineData({
        downloaded: true,
        size: sizes[language] || "30 MB",
      });

      // Update button text
      if (downloadButton) {
        downloadButton.innerHTML = "Downloaded";
        downloadButton.className = downloadButton.className.replace(
          "bg-blue-500",
          "bg-green-500"
        );
      }

      // Store in localStorage
      localStorage.setItem(`offline-${language}`, "true");
    }, 3000);
  };

  // Check if we have offline data
  useEffect(() => {
    const storedOffline = localStorage.getItem(`offline-${currentLanguage}`);
    if (storedOffline === "true") {
      setOfflineData({
        downloaded: true,
        size: "30 MB", // Would be actual size in a real app
      });
    } else {
      setOfflineData({
        downloaded: false,
        size: "0 MB",
      });
    }
  }, [currentLanguage]);

  const testSpeech = () => {
    setIsTesting(true);
    speak(
      "This is a test of the speech settings with the current rate and pitch."
    );

    // Reset state after speech ends
    setTimeout(() => {
      setIsTesting(false);
    }, 5000);
  };

  return (
    <div className="container mx-auto py-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t("settings")}</h1>

      <div
        className={`rounded-lg shadow-md mb-6 overflow-hidden ${
          preferences.highContrast ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="px-4 py-3 bg-blue-500 text-white">
          <h2 className="text-lg font-medium flex items-center">
            <Globe size={20} className="mr-2" />
            {t("languageSettings")}
          </h2>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {t("currentLanguage")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    // Apply the language change
                    setLanguage(lang.id);

                    // Provide user feedback via speech
                    setTimeout(() => {
                      // Announce the language change in the new language
                      speak(`${lang.name} selected`);
                    }, 300);
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center justify-between ${
                    currentLanguage === lang.id
                      ? preferences.highContrast
                        ? "bg-blue-700 text-white"
                        : "bg-blue-100 text-blue-800"
                      : preferences.highContrast
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <span>{lang.name}</span>
                  {currentLanguage === lang.id && (
                    <Check size={16} className="text-green-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Offline Capabilities Section */}
      <div
        className={`rounded-lg shadow-md mb-6 overflow-hidden ${
          preferences.highContrast ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="px-4 py-3 bg-blue-500 text-white">
          <h2 className="text-lg font-medium flex items-center">
            <Server size={20} className="mr-2" />
            {t("offlineCapabilities") || "Offline Capabilities"}
          </h2>
        </div>
        <div className="p-4">
          <ServiceWorkerStatus />

          <div className="mb-4 mt-4">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <HardDrive size={16} className="mr-2" />
              Offline Language Data
            </h3>
            <div
              className={`p-3 rounded-lg ${
                preferences.highContrast ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p
                    className={`${
                      preferences.highContrast ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {currentLanguage.charAt(0).toUpperCase() +
                      currentLanguage.slice(1)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {offlineData.downloaded
                      ? `Downloaded (${offlineData.size})`
                      : "Not downloaded"}
                  </p>
                </div>
                <button
                  id={`download-${currentLanguage}`}
                  onClick={() => downloadLanguageModel(currentLanguage)}
                  disabled={offlineData.downloaded}
                  className={`px-3 py-1 rounded text-white text-sm flex items-center ${
                    offlineData.downloaded
                      ? "bg-green-500"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {offlineData.downloaded ? (
                    "Downloaded"
                  ) : (
                    <>
                      <Download size={14} className="mr-1" />
                      Download
                    </>
                  )}
                </button>
              </div>
              <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: offlineData.downloaded ? "100%" : "0%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`rounded-lg shadow-md mb-6 overflow-hidden ${
          preferences.highContrast ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="px-4 py-3 bg-blue-500 text-white">
          <h2 className="text-lg font-medium">{t("accessibilitySettings")}</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <span className="mr-2">{t("highContrast")}</span>
            </label>
            <div
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                preferences.highContrast ? "bg-green-500" : "bg-gray-300"
              }`}
              onClick={() =>
                updatePreference("highContrast", !preferences.highContrast)
              }
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  preferences.highContrast ? "translate-x-6" : ""
                }`}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <span className="mr-2">{t("largerText")}</span>
            </label>
            <div
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                preferences.largeText ? "bg-green-500" : "bg-gray-300"
              }`}
              onClick={() =>
                updatePreference("largeText", !preferences.largeText)
              }
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  preferences.largeText ? "translate-x-6" : ""
                }`}
              ></div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2 flex items-center">
              <Volume2 size={16} className="mr-2" />
              {t("speechRate")}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={preferences.speechRate}
              onChange={(e) =>
                updatePreference("speechRate", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>{t("slower")}</span>
              <span>{preferences.speechRate.toFixed(1)}x</span>
              <span>{t("faster")}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              {t("speechPitch")}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={preferences.speechPitch}
              onChange={(e) =>
                updatePreference("speechPitch", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>{t("lower")}</span>
              <span>{preferences.speechPitch.toFixed(1)}</span>
              <span>{t("higher")}</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={testSpeech}
              disabled={isTesting}
              className={`px-4 py-2 rounded-lg text-white ${
                isTesting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isTesting ? t("testing") : t("testSpeech")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
