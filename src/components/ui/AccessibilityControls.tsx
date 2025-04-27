import React from "react";
import { SunMoon, Type, Volume2 } from "lucide-react";
import { useUserPreferences } from "../../context/UserPreferencesContext";

interface AccessibilityControlsProps {
  className?: string;
  compact?: boolean;
}

/**
 * A component that provides accessibility controls for the application
 * Includes high contrast mode, large text, and text-to-speech settings
 */
export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  className = "",
  compact = false,
}) => {
  const { preferences, updatePreferences } = useUserPreferences();

  const toggleHighContrast = () => {
    updatePreferences({
      ...preferences,
      highContrast: !preferences?.highContrast,
    });
  };

  const toggleLargeText = () => {
    updatePreferences({
      ...preferences,
      largeText: !preferences?.largeText,
    });
  };

  const toggleTTSEnabled = () => {
    updatePreferences({
      ...preferences,
      ttsEnabled: !preferences?.ttsEnabled,
    });
  };

  if (compact) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={toggleHighContrast}
          className={`p-2 rounded-md ${
            preferences?.highContrast
              ? "bg-yellow-200 text-gray-900"
              : "bg-gray-200 text-gray-700"
          }`}
          aria-pressed={preferences?.highContrast}
          aria-label="Toggle high contrast mode"
          title="Toggle high contrast mode"
        >
          <SunMoon size={16} aria-hidden="true" />
        </button>
        <button
          onClick={toggleLargeText}
          className={`p-2 rounded-md ${
            preferences?.largeText
              ? "bg-blue-200 text-gray-900"
              : "bg-gray-200 text-gray-700"
          }`}
          aria-pressed={preferences?.largeText}
          aria-label="Toggle large text"
          title="Toggle large text"
        >
          <Type size={16} aria-hidden="true" />
        </button>
        <button
          onClick={toggleTTSEnabled}
          className={`p-2 rounded-md ${
            preferences?.ttsEnabled
              ? "bg-green-200 text-gray-900"
              : "bg-gray-200 text-gray-700"
          }`}
          aria-pressed={preferences?.ttsEnabled}
          aria-label="Toggle text to speech"
          title="Toggle text to speech"
        >
          <Volume2 size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3
        className={`font-medium ${
          preferences?.highContrast ? "text-white" : "text-gray-800"
        }`}
      >
        Accessibility Settings
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="high-contrast"
            className={`${
              preferences?.highContrast ? "text-gray-300" : "text-gray-700"
            }`}
          >
            High Contrast Mode
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences?.highContrast}
              onChange={toggleHighContrast}
              className="sr-only"
            />
            <div
              className={`block h-6 rounded-full w-10 ${
                preferences?.highContrast ? "bg-yellow-400" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`absolute left-0.5 top-0.5 bg-white border-2 border-gray-300 w-5 h-5 rounded-full transition-transform transform ${
                preferences?.highContrast
                  ? "translate-x-4 border-yellow-400"
                  : ""
              }`}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label
            htmlFor="large-text"
            className={`${
              preferences?.highContrast ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Large Text
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              id="large-text"
              type="checkbox"
              checked={preferences?.largeText}
              onChange={toggleLargeText}
              className="sr-only"
            />
            <div
              className={`block h-6 rounded-full w-10 ${
                preferences?.largeText ? "bg-blue-400" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`absolute left-0.5 top-0.5 bg-white border-2 border-gray-300 w-5 h-5 rounded-full transition-transform transform ${
                preferences?.largeText ? "translate-x-4 border-blue-400" : ""
              }`}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label
            htmlFor="tts-enabled"
            className={`${
              preferences?.highContrast ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Text-to-Speech
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              id="tts-enabled"
              type="checkbox"
              checked={preferences?.ttsEnabled}
              onChange={toggleTTSEnabled}
              className="sr-only"
            />
            <div
              className={`block h-6 rounded-full w-10 ${
                preferences?.ttsEnabled ? "bg-green-400" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`absolute left-0.5 top-0.5 bg-white border-2 border-gray-300 w-5 h-5 rounded-full transition-transform transform ${
                preferences?.ttsEnabled ? "translate-x-4 border-green-400" : ""
              }`}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityControls;
