import "regenerator-runtime/runtime";
import React, { useState, useCallback, useEffect } from "react";
import useASR from "../../hooks/useASR";
import { useLanguage } from "../../contexts/LanguageContext";
import { useOffline } from "../../contexts/OfflineContext";

interface ASRComponentProps {
  onTranscriptChange?: (transcript: string) => void;
  onSpeechEnd?: () => void;
  onError?: (errorMessage: string) => void;
  continuous?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const ASRComponent: React.FC<ASRComponentProps> = ({
  onTranscriptChange,
  onSpeechEnd,
  onError,
  continuous = false,
  placeholder = "Speak now...",
  maxLength = 500,
  className = "",
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const { isOffline } = useOffline();
  const { currentLanguage } = useLanguage();

  const handleTranscriptChange = useCallback(
    (text: string) => {
      if (onTranscriptChange) {
        // Limit text to maxLength if needed
        const limitedText =
          maxLength && text.length > maxLength
            ? text.substring(0, maxLength)
            : text;
        onTranscriptChange(limitedText);
      }
    },
    [maxLength, onTranscriptChange]
  );

  const handleError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);
      console.error("ASR Error:", errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    },
    [onError]
  );

  const handleEnd = useCallback(() => {
    if (onSpeechEnd) {
      onSpeechEnd();
    }
  }, [onSpeechEnd]);

  const {
    startListening,
    stopListening,
    reset,
    transcript,
    isListening,
    isProcessing,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    usingFallback,
  } = useASR({
    continuous,
    onResult: handleTranscriptChange,
    onError: handleError,
    onEnd: handleEnd,
    useWhisperFallback: true,
  });

  // Reset first time flag when language changes
  useEffect(() => {
    setIsFirstTime(true);
  }, [currentLanguage]);

  // Show browser support message
  if (!browserSupportsSpeechRecognition && !usingFallback) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
        <p className="font-medium">
          Your browser doesn't support speech recognition.
        </p>
        <p className="text-sm mt-1">
          Try using Google Chrome for the best experience.
        </p>
      </div>
    );
  }

  // Show microphone access message
  if (!isMicrophoneAvailable) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
        <p className="font-medium">Microphone access denied.</p>
        <p className="text-sm mt-1">
          Please allow microphone access in your browser settings to use speech
          recognition.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full">
        {/* Transcript display area */}
        <div className="min-h-[100px] p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
          {transcript ? (
            <p className="text-gray-800">{transcript}</p>
          ) : (
            <p className="text-gray-400 italic">{placeholder}</p>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center mt-2 text-sm">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isListening
                ? "bg-green-500 animate-pulse"
                : isProcessing
                ? "bg-yellow-500 animate-pulse"
                : "bg-gray-300"
            }`}
          />
          <span className="text-gray-600">
            {isListening
              ? "Listening..."
              : isProcessing
              ? "Processing speech..."
              : "Ready"}
          </span>

          {usingFallback && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Using Whisper
            </span>
          )}

          {isOffline && (
            <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Offline Mode
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 text-red-800 text-sm rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={
            isListening
              ? stopListening
              : async () => {
                  setError(null);
                  if (isFirstTime) {
                    setIsFirstTime(false);
                  }
                  await startListening();
                }
          }
          className={`px-4 py-2 rounded-lg font-medium ${
            isListening
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          disabled={isProcessing}
        >
          {isListening
            ? "Stop Listening"
            : isFirstTime
            ? "Start Listening"
            : "Listen Again"}
        </button>

        <button
          onClick={() => {
            reset();
            handleTranscriptChange("");
          }}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
          disabled={isListening || (!transcript && !error)}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ASRComponent;
