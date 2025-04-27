import React, { useState, useEffect } from "react";
import { useLanguage, GhanaianLanguage } from "../context/LanguageContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { ttsService } from "../services/speech/TTSService";
import { Volume2, ChevronDown, Star, Loader, Mic } from "lucide-react";

// Sample phrases for each language
const DEMO_PHRASES: Record<GhanaianLanguage, string[]> = {
  twi: [
    "Akwaaba (Welcome)",
    "Me din de... (My name is...)",
    "Wo ho te sɛn? (How are you?)",
    "Medaase (Thank you)",
    "Yɛbɛhyia bio (See you again)",
  ],
  ga: [
    "Ogekoo (Welcome)",
    "Mibii ji... (My name is...)",
    "Te ofe? (How are you?)",
    "Oyiwaladon (Thank you)",
    "Wo miimɔ̃ ekoŋŋ (See you again)",
  ],
  ewe: [
    "Woezɔ (Welcome)",
    "Ŋkɔnye enye... (My name is...)",
    "Efɔ̃ a? (How are you?)",
    "Akpe (Thank you)",
    "Míakpɔ mía nɔewo (See you again)",
  ],
  hausa: [
    "Sannu (Welcome)",
    "Sunana... (My name is...)",
    "Yaya lafiya? (How are you?)",
    "Na gode (Thank you)",
    "Sai mun sadu (See you again)",
  ],
  english: [
    "Welcome to TalkGhana",
    "My name is...",
    "How are you?",
    "Thank you",
    "See you again",
  ],
  dagbani: [
    "Desiba! This is TalkGhana",
    "I can help you communicate in Dagbani",
    "Try saying some basic phrases",
    "You can also type if you prefer"
  ],
};

/**
 * Component to demonstrate enhanced Ghanaian language speech capabilities
 */
const GhanaianSpeechDemo: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  const { preferences } = useUserPreferences();
  const [selectedPhrase, setSelectedPhrase] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [isESPnetEnabled, setIsESPnetEnabled] = useState<boolean>(true);
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Get TTS instance
  const tts = ttsService;

  // Set default selected phrase when language changes
  useEffect(() => {
    if (DEMO_PHRASES[currentLanguage]?.length > 0) {
      setSelectedPhrase(DEMO_PHRASES[currentLanguage][0]);
    } else {
      setSelectedPhrase("");
    }
    // Reset feedback and ratings when language changes
    setFeedback(null);
    setQualityRating(null);
  }, [currentLanguage]);

  const playPhrase = async () => {
    if (!selectedPhrase || isPlaying) return;

    setIsPlaying(true);
    setIsProcessing(true);
    setFeedback({ text: "Processing speech...", type: "info" });

    try {
      // Use the TTSService to speak
      await tts.speak({
        text: selectedPhrase,
        language: currentLanguage,
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0,
      });

      setFeedback({
        text: "Speech synthesis complete",
        type: "success",
      });
    } catch (error) {
      console.error("Speech error:", error);
      setFeedback({
        text: "Failed to synthesize speech. Please try again.",
        type: "error",
      });
    } finally {
      setIsPlaying(false);
      setIsProcessing(false);
    }
  };

  const compareWith = async (useESPnet: boolean) => {
    setIsComparing(true);
    setIsProcessing(true);

    try {
      if (useESPnet) {
        setFeedback({ text: "Using advanced synthesis...", type: "info" });
        await tts.speak({
          text: selectedPhrase,
          language: currentLanguage,
          pitch: 1.2, // Slightly different pitch for comparison
          rate: 1.0,
          volume: 1.0,
        });
      } else {
        setFeedback({ text: "Using standard TTS...", type: "info" });
        await tts.speak({
          text: selectedPhrase,
          language: currentLanguage,
          pitch: 1.0,
          rate: 1.0,
          volume: 1.0,
        });
      }
    } catch (error) {
      console.error("Speech comparison error:", error);
    } finally {
      setIsComparing(false);
      setIsProcessing(false);
      setFeedback(null);
    }
  };

  const handleRateQuality = async (rating: number) => {
    setQualityRating(rating);
    setIsProcessing(true);

    try {
      // In a real app, we would submit feedback to a server
      // For now, we'll just simulate success
      setFeedback({
        text: "Thank you for your feedback! This helps improve our models.",
        type: "success",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedback({
        text: "Error submitting feedback.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
      // Clear feedback message after 3 seconds
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`w-full flex justify-between items-center px-4 py-2 rounded-lg border ${
                preferences.highContrast
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300"
              }`}
              aria-haspopup="listbox"
              aria-expanded={showDropdown}
            >
              <span className="truncate">
                {selectedPhrase || "Select a phrase"}
              </span>
              <ChevronDown size={16} />
            </button>

            {showDropdown && (
              <ul
                className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg ${
                  preferences.highContrast
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                role="listbox"
              >
                {DEMO_PHRASES[currentLanguage].map((phrase, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setSelectedPhrase(phrase);
                      setShowDropdown(false);
                    }}
                    className={`px-4 py-2 cursor-pointer ${
                      preferences.highContrast
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-100"
                    } ${
                      phrase === selectedPhrase
                        ? preferences.highContrast
                          ? "bg-blue-800"
                          : "bg-blue-100"
                        : ""
                    }`}
                    role="option"
                    aria-selected={phrase === selectedPhrase}
                  >
                    {phrase}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={playPhrase}
            disabled={isPlaying || !selectedPhrase || isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isPlaying || !selectedPhrase || isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : preferences.highContrast
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
            aria-label="Play selected phrase"
          >
            {isProcessing ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Volume2 size={16} />
            )}
            <span>{isPlaying ? "Playing..." : "Play"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {Object.keys(DEMO_PHRASES).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang as GhanaianLanguage)}
            className={`px-3 py-1 text-sm rounded-full ${
              currentLanguage === lang
                ? preferences.highContrast
                  ? "bg-green-800 text-white"
                  : "bg-green-100 text-green-800"
                : preferences.highContrast
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>

      {/* ESPnet vs Standard Comparison */}
      <div
        className={`p-3 rounded-lg ${
          preferences.highContrast ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <h3 className="font-medium mb-2">Compare Speech Quality</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => compareWith(true)}
            disabled={isComparing || isProcessing}
            className={`px-3 py-1 text-sm rounded-md ${
              isComparing || isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : preferences.highContrast
                ? "bg-indigo-700 hover:bg-indigo-800"
                : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
            }`}
          >
            ESPnet + G2P
          </button>
          <button
            onClick={() => compareWith(false)}
            disabled={isComparing || isProcessing}
            className={`px-3 py-1 text-sm rounded-md ${
              isComparing || isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : preferences.highContrast
                ? "bg-purple-700 hover:bg-purple-800"
                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
            }`}
          >
            Standard TTS
          </button>
        </div>
      </div>

      {/* Quality Rating */}
      {selectedPhrase && !isProcessing && !isComparing && (
        <div
          className={`p-3 rounded-lg ${
            preferences.highContrast ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <h3 className="font-medium mb-2">Rate Speech Quality</h3>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRateQuality(rating)}
                className={`p-1 rounded ${
                  qualityRating === rating
                    ? preferences.highContrast
                      ? "text-yellow-400"
                      : "text-yellow-500"
                    : preferences.highContrast
                    ? "text-gray-600 hover:text-gray-400"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label={`Rate ${rating} star${rating !== 1 ? "s" : ""}`}
              >
                <Star
                  size={20}
                  fill={
                    qualityRating !== null && rating <= qualityRating
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback message */}
      {feedback && (
        <div
          className={`p-3 rounded-lg ${
            feedback.type === "success"
              ? preferences.highContrast
                ? "bg-green-900 text-green-100"
                : "bg-green-100 text-green-800"
              : feedback.type === "error"
              ? preferences.highContrast
                ? "bg-red-900 text-red-100"
                : "bg-red-100 text-red-800"
              : preferences.highContrast
              ? "bg-blue-900 text-blue-100"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
};

export default GhanaianSpeechDemo;
