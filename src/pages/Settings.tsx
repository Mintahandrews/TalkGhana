import { useState, useEffect, useRef } from "react";
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
  Music,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { GhanaianLanguage } from "../services/LanguageService";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useTextToSpeech } from "../services/TextToSpeechService";
import ServiceWorkerStatus from "../components/ServiceWorkerStatus";
import Text, { Heading, Paragraph, Label } from "../components/Text";

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
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

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
    { id: "dagbani", name: "Dagbani" },
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
      dagbani: "33 MB",
    };

    // Simulate progress
    setDownloadProgress((prev) => ({ ...prev, [language]: 0 }));

    // Create a simulation of download progress
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        const currentProgress = prev[language] || 0;
        const newProgress = Math.min(currentProgress + 10, 100);

        // When we reach 100%, clear the interval
        if (newProgress === 100) {
          clearInterval(progressInterval);

          // Update the offline data state
          setOfflineData({
            downloaded: true,
            size: sizes[language] || "30 MB",
          });

          // Store in localStorage
          localStorage.setItem(`offline-${language}`, "true");
        }

        return { ...prev, [language]: newProgress };
      });
    }, 300);
  };

  // Check if we have offline data
  useEffect(() => {
    const storedOffline = localStorage.getItem(`offline-${currentLanguage}`);
    if (storedOffline === "true") {
      setOfflineData({
        downloaded: true,
        size: "30 MB", // Would be actual size in a real app
      });

      // Set progress to 100% for completed downloads
      setDownloadProgress((prev) => ({ ...prev, [currentLanguage]: 100 }));
    } else {
      setOfflineData({
        downloaded: false,
        size: "0 MB",
      });

      // Reset progress
      setDownloadProgress((prev) => ({ ...prev, [currentLanguage]: 0 }));
    }
  }, [currentLanguage]);

  const testSpeech = () => {
    if (isTesting) return;

    setIsTesting(true);
    speak(
      t("speechTestPhrase") ||
        "This is a test of the speech settings with the current rate and pitch."
    );

    // Reset state after speech ends
    setTimeout(() => {
      setIsTesting(false);
    }, 5000);
  };

  return (
    <div className="container mx-auto py-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        <Text id="settings" fallback="Settings" />
      </h1>

      <div
        className={`rounded-lg shadow-md mb-6 overflow-hidden ${
          preferences.highContrast ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="px-4 py-3 bg-blue-500 text-white">
          <h2 className="text-lg font-medium flex items-center">
            <Globe size={20} className="mr-2" />
            <Text id="languageSettings" fallback="Language Settings" />
          </h2>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <Label
              className="block text-sm font-medium mb-2"
              id="currentLanguage"
              fallback="Current Language"
            />
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    // Apply the language change
                    setLanguage(lang.id as GhanaianLanguage);

                    // Provide user feedback via speech
                    setTimeout(() => {
                      // Announce the language change in the new language
                      speak(`${lang.name} selected`);
                    }, 300);
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center justify-between language-transition ${
                    currentLanguage === lang.id
                      ? preferences.highContrast
                        ? "bg-blue-700 text-white"
                        : "bg-blue-100 text-blue-800"
                      : preferences.highContrast
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  aria-pressed={currentLanguage === lang.id}
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
            <Text id="offlineCapabilities" fallback="Offline Capabilities" />
          </h2>
        </div>
        <div className="p-4">
          <ServiceWorkerStatus />

          <div className="mb-4 mt-4">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <HardDrive size={16} className="mr-2" />
              <Text id="offlineLanguageData" fallback="Offline Language Data" />
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
                    {offlineData.downloaded ? (
                      <Text
                        id="downloadedSize"
                        fallback={`Downloaded (${offlineData.size})`}
                        values={{ size: offlineData.size }}
                      />
                    ) : (
                      <Text id="notDownloaded" fallback="Not downloaded" />
                    )}
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
                  aria-label={`${
                    offlineData.downloaded ? "Downloaded" : "Download"
                  } ${currentLanguage} language model`}
                >
                  {offlineData.downloaded ? (
                    <Text id="downloaded" fallback="Downloaded" />
                  ) : downloadProgress[currentLanguage] > 0 &&
                    downloadProgress[currentLanguage] < 100 ? (
                    <span className="animate-pulse">
                      <Text id="downloading" fallback="Downloading..." />
                    </span>
                  ) : (
                    <>
                      <Download size={14} className="mr-1" />
                      <Text id="download" fallback="Download" />
                    </>
                  )}
                </button>
              </div>
              <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{
                    width: `${
                      downloadProgress[currentLanguage] ||
                      (offlineData.downloaded ? 100 : 0)
                    }%`,
                  }}
                  role="progressbar"
                  aria-valuenow={
                    downloadProgress[currentLanguage] ||
                    (offlineData.downloaded ? 100 : 0)
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
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
          <h2 className="text-lg font-medium">
            <Text
              id="accessibilitySettings"
              fallback="Accessibility Settings"
            />
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label
              className="flex items-center"
              htmlFor="high-contrast-toggle"
              id="highContrast"
              fallback="High Contrast"
            />
            <div
              id="high-contrast-toggle"
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                preferences.highContrast ? "bg-green-500" : "bg-gray-300"
              }`}
              onClick={() =>
                updatePreference("highContrast", !preferences.highContrast)
              }
              role="switch"
              aria-checked={preferences.highContrast}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  updatePreference("highContrast", !preferences.highContrast);
                }
              }}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  preferences.highContrast ? "translate-x-6" : ""
                }`}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label
              className="flex items-center"
              htmlFor="larger-text-toggle"
              id="largerText"
              fallback="Larger Text"
            />
            <div
              id="larger-text-toggle"
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                preferences.largeText ? "bg-green-500" : "bg-gray-300"
              }`}
              onClick={() =>
                updatePreference("largeText", !preferences.largeText)
              }
              role="switch"
              aria-checked={preferences.largeText}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  updatePreference("largeText", !preferences.largeText);
                }
              }}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  preferences.largeText ? "translate-x-6" : ""
                }`}
              ></div>
            </div>
          </div>

          <div className="mt-4">
            <Label
              className="flex text-sm font-medium mb-2 items-center"
              htmlFor="speech-rate"
              id="speechRate"
              fallback="Speech Rate"
            >
              <Volume2 size={16} className="mr-2" />
            </Label>
            <input
              id="speech-rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={preferences.speechRate}
              onChange={(e) =>
                updatePreference("speechRate", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-valuenow={preferences.speechRate}
              aria-valuetext={`${preferences.speechRate.toFixed(1)}x`}
            />
            <div className="flex justify-between text-xs mt-1">
              <Text id="slower" fallback="Slower" />
              <span>{preferences.speechRate.toFixed(1)}x</span>
              <Text id="faster" fallback="Faster" />
            </div>
          </div>

          <div className="mt-4">
            <Label
              className="flex text-sm font-medium mb-2 items-center"
              htmlFor="speech-pitch"
              id="speechPitch"
              fallback="Speech Pitch"
            >
              <Music size={16} className="mr-2" />
            </Label>
            <input
              id="speech-pitch"
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={preferences.speechPitch}
              onChange={(e) =>
                updatePreference("speechPitch", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              aria-valuemin={0.5}
              aria-valuemax={1.5}
              aria-valuenow={preferences.speechPitch}
              aria-valuetext={`${preferences.speechPitch.toFixed(1)}`}
            />
            <div className="flex justify-between text-xs mt-1">
              <Text id="lower" fallback="Lower" />
              <span>{preferences.speechPitch.toFixed(1)}</span>
              <Text id="higher" fallback="Higher" />
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
              aria-live="polite"
            >
              <Text
                id={isTesting ? "testing" : "testSpeech"}
                fallback={isTesting ? "Testing..." : "Test Speech"}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
