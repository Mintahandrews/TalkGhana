import React, { useState, useEffect, useCallback } from "react";
import useTTS from "../../hooks/useTTS";
import { useLanguage } from "../../contexts/LanguageContext";
import { useOffline } from "../../contexts/OfflineContext";

interface TTSComponentProps {
  text?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  showSettings?: boolean;
  className?: string;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (errorMessage: string) => void;
}

const TTSComponent: React.FC<TTSComponentProps> = ({
  text = "",
  autoPlay = false,
  showControls = true,
  showSettings = false,
  className = "",
  onPlayStart,
  onPlayEnd,
  onError,
}) => {
  const [localText, setLocalText] = useState(text);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const { currentLanguage } = useLanguage();
  const { isOffline } = useOffline();

  const handleError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
      console.error("TTS Error:", errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    },
    [onError]
  );

  const handleStart = useCallback(() => {
    if (onPlayStart) {
      onPlayStart();
    }
  }, [onPlayStart]);

  const handleEnd = useCallback(() => {
    if (onPlayEnd) {
      onPlayEnd();
    }
  }, [onPlayEnd]);

  const { speak, stop, isSpeaking, isLoading } = useTTS({
    pitch,
    rate,
    volume,
    onStart: handleStart,
    onEnd: handleEnd,
    onError: handleError,
    useRemoteTTS: true,
    cacheAudio: true,
  });

  // Update local text when text prop changes
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Autoplay when text changes if autoPlay is enabled
  useEffect(() => {
    if (autoPlay && text && !isSpeaking) {
      speak(text);
    }
  }, [autoPlay, text, speak, isSpeaking]);

  // Reset error when language changes
  useEffect(() => {
    setError(null);
  }, [currentLanguage]);

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettingsPanel(!showSettingsPanel);
  };

  // Handle play button click
  const handlePlay = () => {
    setError(null);
    if (localText) {
      speak(localText);
    } else {
      handleError("No text to speak");
    }
  };

  // Handle stop button click
  const handleStop = () => {
    stop();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Text input area */}
      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        placeholder="Enter text to speak..."
        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        rows={3}
        disabled={isSpeaking || isLoading}
        aria-label="Text to speak"
      />

      {/* Controls */}
      {showControls && (
        <div className="flex flex-wrap gap-2 mt-3">
          {!isSpeaking ? (
            <button
              onClick={handlePlay}
              disabled={isLoading || !localText}
              className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                !localText || isLoading
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              aria-label="Play speech"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Speak
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center"
              aria-label="Stop speech"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              Stop
            </button>
          )}

          {showSettings && (
            <button
              onClick={toggleSettings}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium flex items-center"
              aria-label="Voice settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Settings
            </button>
          )}

          {isOffline && (
            <span className="ml-2 self-center text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Offline Mode
            </span>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && showSettingsPanel && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Voice Settings
          </h3>

          <div className="space-y-3">
            {/* Pitch control */}
            <div>
              <label
                htmlFor="pitch-control"
                className="block text-xs text-gray-600 mb-1"
              >
                Pitch: {pitch.toFixed(1)}
              </label>
              <input
                id="pitch-control"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isSpeaking}
              />
            </div>

            {/* Rate control */}
            <div>
              <label
                htmlFor="rate-control"
                className="block text-xs text-gray-600 mb-1"
              >
                Speed: {rate.toFixed(1)}
              </label>
              <input
                id="rate-control"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isSpeaking}
              />
            </div>

            {/* Volume control */}
            <div>
              <label
                htmlFor="volume-control"
                className="block text-xs text-gray-600 mb-1"
              >
                Volume: {(volume * 100).toFixed(0)}%
              </label>
              <input
                id="volume-control"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={isSpeaking}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 text-red-800 text-sm rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default TTSComponent;
