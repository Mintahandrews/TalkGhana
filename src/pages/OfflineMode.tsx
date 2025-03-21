import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import {
  Download,
  Trash2,
  Wifi,
  WifiOff,
  HardDrive,
  RefreshCw,
} from "lucide-react";

const OfflineMode: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineLanguages, setOfflineLanguages] = useState<string[]>([]);
  const [storageStats, setStorageStats] = useState<{
    totalSize: number;
    languageModels: number;
    phraseCache: number;
    commandCache: number;
  }>({
    totalSize: 0,
    languageModels: 0,
    phraseCache: 0,
    commandCache: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load offline languages and storage stats
  useEffect(() => {
    const loadOfflineData = async () => {
      setIsLoading(true);
      try {
        // Check which languages are available offline
        const languages = ["english", "twi", "ga", "ewe", "hausa"];
        const offlineAvailable = languages.filter(
          (lang) => localStorage.getItem(`offline-${lang}`) === "true"
        );
        setOfflineLanguages(offlineAvailable);

        // Mock storage stats for now
        // In a real implementation, this would come from IndexedDB
        setStorageStats({
          totalSize: 15.2,
          languageModels: 12.5,
          phraseCache: 1.8,
          commandCache: 0.9,
        });
      } catch (error) {
        console.error("Error loading offline data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOfflineData();
  }, []);

  const handleDownloadLanguage = (language: string) => {
    // Mock download functionality
    // In a real implementation, this would download and store language models
    console.log(`Downloading ${language} for offline use`);

    // Simulate download
    setTimeout(() => {
      const updatedOfflineLanguages = [...offlineLanguages];
      if (!updatedOfflineLanguages.includes(language)) {
        updatedOfflineLanguages.push(language);
        setOfflineLanguages(updatedOfflineLanguages);
        localStorage.setItem(`offline-${language}`, "true");
      }
    }, 2000);
  };

  const handleDeleteLanguage = (language: string) => {
    // Mock delete functionality
    // In a real implementation, this would delete language models from storage
    console.log(`Deleting ${language} from offline storage`);

    const updatedOfflineLanguages = offlineLanguages.filter(
      (lang) => lang !== language
    );
    setOfflineLanguages(updatedOfflineLanguages);
    localStorage.removeItem(`offline-${language}`);
  };

  const handleClearCache = () => {
    // Mock clear cache functionality
    // In a real implementation, this would clear the cache in IndexedDB
    console.log("Clearing cache");

    // Update stats
    setStorageStats({
      ...storageStats,
      phraseCache: 0,
      commandCache: 0,
    });
  };

  const formatSize = (size: number): string => {
    return `${size.toFixed(1)} MB`;
  };

  const getLanguageDisplayName = (code: string): string => {
    const names: Record<string, string> = {
      english: "English",
      twi: "Twi",
      ga: "Ga",
      ewe: "Ewe",
      hausa: "Hausa",
    };
    return names[code] || code;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center mb-6">
        <h1
          className={`${
            preferences.largeText ? "text-4xl" : "text-3xl"
          } font-bold text-blue-600`}
        >
          {t("offlineMode")}
        </h1>
        <p className="mt-2 text-gray-600">
          {isOnline ? t("online") : t("offline")}
        </p>
      </div>

      {/* Connection Status */}
      <div
        className={`p-4 rounded-lg ${
          isOnline
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex items-center">
          {isOnline ? (
            <Wifi className="text-green-500 mr-3" size={24} />
          ) : (
            <WifiOff className="text-red-500 mr-3" size={24} />
          )}
          <div>
            <h2
              className={`font-bold ${
                isOnline ? "text-green-800" : "text-red-800"
              }`}
            >
              {isOnline ? "Online Mode" : "Offline Mode"}
            </h2>
            <p
              className={`text-sm ${
                isOnline ? "text-green-600" : "text-red-600"
              }`}
            >
              {isOnline
                ? "You can download languages for offline use"
                : "Using cached content - some features may be limited"}
            </p>
          </div>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <HardDrive className="mr-2" size={20} />
          {t("storageManagement")}
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Total Storage Used:</span>
            <span className="font-medium">
              {formatSize(storageStats.totalSize)}
            </span>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(storageStats.totalSize / 20) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Language Models</div>
              <div className="font-bold">
                {formatSize(storageStats.languageModels)}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Phrase Cache</div>
              <div className="font-bold">
                {formatSize(storageStats.phraseCache)}
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Command Cache</div>
              <div className="font-bold">
                {formatSize(storageStats.commandCache)}
              </div>
            </div>
          </div>

          <button
            onClick={handleClearCache}
            className="mt-4 flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
          >
            <Trash2 size={16} className="mr-2" />
            {t("clearCache")}
          </button>
        </div>
      </div>

      {/* Available Languages */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-3">Available Languages</h2>

        <div className="space-y-3">
          {["english", "twi", "ga", "ewe", "hausa"].map((language) => {
            const isDownloaded = offlineLanguages.includes(language);

            return (
              <div
                key={language}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {getLanguageDisplayName(language)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isDownloaded ? "Available offline" : "Online only"}
                  </div>
                </div>

                <div>
                  {isDownloaded ? (
                    <button
                      onClick={() => handleDeleteLanguage(language)}
                      className="flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md"
                      disabled={!isOnline && offlineLanguages.length === 1}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadLanguage(language)}
                      className="flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md"
                      disabled={!isOnline}
                    >
                      <Download size={16} className="mr-1" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <RefreshCw className="mr-2" size={20} />
          Sync Status
        </h2>

        <div className="flex justify-between items-center">
          <div>
            <div className="font-medium">Last synced</div>
            <div className="text-sm text-gray-600">
              {isOnline ? "Just now" : "2 hours ago"}
            </div>
          </div>

          <button
            className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            disabled={!isOnline}
          >
            <RefreshCw size={16} className="mr-2" />
            Sync Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineMode;
