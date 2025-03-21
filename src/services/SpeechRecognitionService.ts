import { useState, useCallback, useEffect } from "react";
import { languageService, GhanaianLanguage } from "./LanguageService";

export const useSpeechRecognition = (language: GhanaianLanguage) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const browserSupportsSpeechRecognition = !!SpeechRecognition;

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError("Browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    const config = languageService.getLanguageConfig();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config.speechRecognition.code;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event) => {
      if (event.error === "language-not-supported") {
        recognition.lang = config.speechRecognition.fallback;
      } else {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          setConfidence(confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      setText(finalTranscript || interimTranscript);
    };

    return () => {
      if (isListening) {
        recognition.stop();
      }
    };
  }, [language, browserSupportsSpeechRecognition]);

  const startListening = useCallback(() => {
    setText("");
    setError(null);
    if (browserSupportsSpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.start();
    }
  }, [browserSupportsSpeechRecognition]);

  const stopListening = useCallback(() => {
    if (browserSupportsSpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.stop();
    }
    setIsListening(false);
  }, [browserSupportsSpeechRecognition]);

  const resetText = useCallback(() => {
    setText("");
    setConfidence(0);
  }, []);

  return {
    text,
    isListening,
    error,
    confidence,
    startListening,
    stopListening,
    resetText,
    browserSupportsSpeechRecognition,
  };
};
