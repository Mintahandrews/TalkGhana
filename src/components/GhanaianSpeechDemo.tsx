import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTextToSpeech } from "../services/TextToSpeechService";
import type { GhanaianLanguage } from "../context/LanguageContext";

/**
 * Component to demonstrate enhanced Ghanaian language speech capabilities
 */
const GhanaianSpeechDemo: React.FC = () => {
  const { currentLanguage, t } = useLanguage();
  const { speak, stop, isSpeaking, isOnline } =
    useTextToSpeech(currentLanguage);

  // Demo phrases in different languages
  const [demoText, setDemoText] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<GhanaianLanguage>(currentLanguage);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);

  // Example phrases for each language
  const examplePhrases: Record<GhanaianLanguage, string[]> = {
    twi: [
      "Akwaaba, wo ho te sɛn?",
      "Yɛfrɛ me TalkGhana. Mɛboa wo aka Twi.",
      "Me da wo ase paa. Wo yɛ adwuma papa.",
    ],
    ga: [
      "Ogekoo, te oyaa?",
      "Atsɛ mi TalkGhana. Ma ye bo kɛ oona wiemo Ga.",
      "Oyiwala don. Otsu nii jogbaŋŋ.",
    ],
    ewe: [
      "Woezor, aleke nèfɔ?",
      "Woyɔam be TalkGhana. Makpe de ŋuwò àƒo nu le Eʋegbe me.",
      "Akpe. Èwɔ dɔ nyuie ŋutɔ.",
    ],
    hausa: [
      "Sannu, yaya kake?",
      "Sunana TalkGhana. Zan taimaka ka yi magana da Hausa.",
      "Na gode. Kun yi aiki mai kyau sosai.",
    ],
    english: [
      "Welcome, how are you?",
      "My name is TalkGhana. I will help you speak in English.",
      "Thank you. You are doing a great job.",
    ],
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
      return;
    }

    if (demoText) {
      speak(demoText, speechRate, speechPitch);
    }
  };

  const handleSelectPhrase = (phrase: string) => {
    setDemoText(phrase);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {t("Enhanced Ghanaian Speech")}
      </h2>

      {/* Language selector */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          {t("Select Language")}
        </label>
        <div className="flex flex-wrap gap-2">
          {(["twi", "ga", "ewe", "hausa", "english"] as GhanaianLanguage[]).map(
            (lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedLanguage === lang
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Example phrases */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          {t("Example Phrases")}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examplePhrases[selectedLanguage].map((phrase, index) => (
            <button
              key={index}
              onClick={() => handleSelectPhrase(phrase)}
              className="text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Text input */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">{t("Custom Text")}</label>
        <textarea
          value={demoText}
          onChange={(e) => setDemoText(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder={t("Type or select text to speak")}
        />
      </div>

      {/* Speech parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 mb-2">
            {t("Speech Rate")}: {speechRate.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">
            {t("Speech Pitch")}: {speechPitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechPitch}
            onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handleSpeak}
          disabled={!demoText || (!isOnline && !navigator.onLine)}
          className={`px-4 py-2 rounded-md ${
            isSpeaking
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } ${
            (!demoText || (!isOnline && !navigator.onLine)) &&
            "opacity-50 cursor-not-allowed"
          }`}
        >
          {isSpeaking ? t("Stop") : t("Speak")}
        </button>

        <button
          onClick={() => setDemoText("")}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          {t("Clear")}
        </button>
      </div>

      {/* Connection status */}
      <div
        className={`mt-4 text-sm ${
          isOnline ? "text-green-600" : "text-red-600"
        }`}
      >
        {isOnline ? t("Online Mode") : t("Offline Mode - Using cached voices")}
      </div>
    </div>
  );
};

export default GhanaianSpeechDemo;
