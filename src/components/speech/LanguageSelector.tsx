import React, { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useOffline } from "../../contexts/OfflineContext";

interface LanguageSelectorProps {
  showLabels?: boolean;
  showOfflineIndicator?: boolean;
  compact?: boolean;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  showLabels = true,
  showOfflineIndicator = true,
  compact = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentLanguage,
    setCurrentLanguage,
    availableLanguages,
    getLanguageResource,
  } = useLanguage();
  const { isOffline } = useOffline();

  const currentLanguageResource = getLanguageResource(currentLanguage);

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode as any);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Current language button */}
      <button
        onClick={toggleDropdown}
        className={`flex items-center border border-gray-300 rounded-lg ${
          compact ? "p-2" : "px-4 py-2"
        } ${
          isOpen ? "bg-blue-50 border-blue-300" : "bg-white hover:bg-gray-50"
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-800">
          {compact
            ? currentLanguage.substring(0, 2).toUpperCase()
            : currentLanguageResource?.name}
        </span>

        {!compact && showLabels && (
          <span className="ml-1 text-sm text-gray-500">
            ({currentLanguageResource?.localName})
          </span>
        )}

        {showOfflineIndicator &&
          !isOffline &&
          currentLanguageResource?.offlineSupport && (
            <span
              className="ml-1.5 w-2 h-2 bg-green-500 rounded-full"
              title="Available offline"
            ></span>
          )}

        <svg
          className={`ml-2 w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Language dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <ul className="py-1" role="menu" aria-orientation="vertical">
            {availableLanguages.map((language) => (
              <li key={language.code}>
                <button
                  onClick={() => handleLanguageChange(language.code)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-left text-sm ${
                    currentLanguage === language.code
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  role="menuitem"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{language.name}</span>
                    {showLabels && (
                      <span className="text-xs text-gray-500">
                        {language.localName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {language.voiceAvailable && (
                      <span
                        className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded"
                        title="Voice available"
                      >
                        TTS
                      </span>
                    )}

                    {language.offlineSupport && (
                      <span
                        className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded"
                        title="Available offline"
                      >
                        Offline
                      </span>
                    )}

                    {currentLanguage === language.code && (
                      <svg
                        className="w-4 h-4 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Backdrop for closing dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default LanguageSelector;
