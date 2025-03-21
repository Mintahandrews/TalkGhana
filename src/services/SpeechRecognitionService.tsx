import { useState, useEffect, useCallback } from "react";
import { GhanaianLanguage } from "../context/LanguageContext";
import ApiService from "./ApiService";

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation?: any;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

// Map Ghanaian languages to the closest available languages in Web Speech API
const languageMap: Record<GhanaianLanguage, string> = {
  english: "en-US",
  twi: "en-GH", // Fallback as Twi isn't directly supported
  ga: "en-GH", // Fallback
  ewe: "en-GH", // Fallback
  hausa: "ha", // Hausa is sometimes supported
};

// Interface for the service
export interface UseSpeechRecognitionReturn {
  text: string;
  isListening: boolean;
  error: string | null;
  confidence: number;
  startListening: () => void;
  stopListening: () => void;
  resetText: () => void;
  browserSupportsSpeechRecognition: boolean;
  isOnline: boolean; // Add online status to the interface
  reconnect: () => void; // Add method to manually reconnect
}

// Cached commands for offline use
let cachedCommands = [
  "I need help",
  "Emergency",
  "I need water",
  "I am hungry",
  "I need the bathroom",
  "I am in pain",
  "I need medicine",
  "Yes",
  "No",
  "Thank you",
  "I am cold",
  "I am hot",
];

// A function to get the similarity between two strings (for offline matching)
const getSimilarity = (str1: string, str2: string): number => {
  const longer =
    str1.length > str2.length ? str1.toLowerCase() : str2.toLowerCase();
  const shorter =
    str1.length > str2.length ? str2.toLowerCase() : str1.toLowerCase();

  if (shorter.length === 0) return longer.length === 0 ? 1.0 : 0.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance for string similarity
const levenshteinDistance = (str1: string, str2: string): number => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) track[0][i] = i;
  for (let j = 0; j <= str2.length; j++) track[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return track[str2.length][str1.length];
};

// Find best match in cached commands
const findBestMatch = (
  input: string
): { match: string; confidence: number } => {
  let bestMatch = "";
  let highestSimilarity = 0;

  cachedCommands.forEach((command) => {
    const similarity = getSimilarity(input, command);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = command;
    }
  });

  // If confidence is too low, fallback to a basic command
  if (highestSimilarity < 0.4) {
    bestMatch = "I need help";
    highestSimilarity = 0.4;
  }

  return { match: bestMatch, confidence: highestSimilarity };
};

// Main hook for speech recognition
export const useSpeechRecognition = (
  language: GhanaianLanguage = "english"
): UseSpeechRecognitionReturn => {
  const [text, setText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [connectionRetries, setConnectionRetries] = useState<number>(0);
  const [shouldReconnect, setShouldReconnect] = useState<boolean>(false);

  // Maximum number of automatic reconnection attempts
  const MAX_RETRIES = 3;

  // Check if browser supports speech recognition
  const browserSupportsSpeechRecognition =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!browserSupportsSpeechRecognition) return null;

    // @ts-ignore - Web Speech API is not yet in TypeScript's lib
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const instance = new SpeechRecognition();

    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = languageMap[language];

    // Enhanced error handling
    instance.onerror = (event: any) => {
      console.error(`Speech recognition error: ${event.error}`);

      // Handle network errors differently
      if (event.error === "network") {
        setError("Network error: Check your connection");
        setIsOnline(false);

        // Attempt to reconnect if we haven't exceeded max retries
        if (connectionRetries < MAX_RETRIES) {
          setConnectionRetries((prev) => prev + 1);
          setShouldReconnect(true);
          console.log(
            `Attempting to reconnect (try ${
              connectionRetries + 1
            }/${MAX_RETRIES})...`
          );
        } else {
          console.log(
            "Max reconnection attempts reached. Switching to offline mode."
          );
        }
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }

      setIsListening(false);
    };

    instance.onend = () => {
      setIsListening(false);

      // If we should reconnect, try again after a delay
      if (shouldReconnect && connectionRetries < MAX_RETRIES) {
        console.log("Reconnecting speech recognition service...");
        setTimeout(() => {
          if (instance) {
            try {
              instance.start();
              setIsListening(true);
            } catch (e) {
              console.error("Failed to restart speech recognition:", e);
            }
          }
        }, 1000 * connectionRetries); // Increasing delay with each retry
      }
    };

    instance.onresult = (event: SpeechRecognitionEvent) => {
      // If we get results, we're online
      if (!isOnline) {
        setIsOnline(true);
        setConnectionRetries(0);
        setShouldReconnect(false);
      }

      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const currentConfidence = event.results[current][0].confidence;

      // If this is a final result
      if (event.results[current].isFinal) {
        setText(transcript);
        setConfidence(currentConfidence);

        // Cache this command if it's not already cached
        if (!cachedCommands.includes(transcript) && transcript.length > 3) {
          // Only cache if it's a meaningful phrase
          if (cachedCommands.length > 20) {
            cachedCommands.shift(); // Remove oldest if we have too many
          }
          cachedCommands.push(transcript);
          // Store in localStorage
          try {
            localStorage.setItem(
              "cachedCommands",
              JSON.stringify(cachedCommands)
            );
          } catch (error) {
            console.error("Failed to save commands to localStorage:", error);
          }
        }
      }
    };

    return instance;
  }, [
    browserSupportsSpeechRecognition,
    language,
    connectionRetries,
    shouldReconnect,
    isOnline,
  ]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored");
      setIsOnline(true);
      setConnectionRetries(0);
      setShouldReconnect(false);

      // If we were listening when we went offline, restart
      if (isListening) {
        stopListening();
        setTimeout(() => startListening(), 500);
      }
    };

    const handleOffline = () => {
      console.log("Network connection lost");
      setIsOnline(false);

      // If we're actively listening, switch to offline mode
      if (isListening) {
        // We'll continue with offline functionality
        console.log("Switching to offline speech recognition");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to the ApiService connection events too (more reliable than browser events)
    const unsubscribe = ApiService.onConnectionChange((online) => {
      if (online !== isOnline) {
        setIsOnline(online);
        if (online) {
          setConnectionRetries(0);
          setShouldReconnect(false);
        }
      }
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, [isListening, isOnline]);

  // Effect to reinitialize when language changes
  useEffect(() => {
    console.log(`Speech recognition language set to: ${languageMap[language]}`);

    // If we're currently listening, we need to restart with the new language
    if (isListening) {
      stopListening();
      // Small delay to ensure clean restart
      setTimeout(() => startListening(), 300);
    } else {
      // Just initialize the instance with the new language
      const instance = initRecognition();
      setRecognitionInstance(instance);
    }
  }, [language, initRecognition, isListening]);

  // Reset text state
  const resetText = useCallback(() => {
    setText("");
    setConfidence(0);
  }, []);

  // Manually reconnect (for user-initiated retry)
  const reconnect = useCallback(() => {
    console.log("Manual reconnection attempt...");
    setConnectionRetries(0);
    setShouldReconnect(true);

    // Try to fetch language-specific commands
    if (navigator.onLine) {
      ApiService.getModelInfo(language, "stt")
        .then((data) => {
          console.log("Successfully reconnected to API");
          setIsOnline(true);

          // Update cached commands if available
          if (data?.commonPhrases && Array.isArray(data.commonPhrases)) {
            cachedCommands = [
              ...new Set([...cachedCommands, ...data.commonPhrases]),
            ];
          }
        })
        .catch((err) => {
          console.error("API reconnection failed:", err);
        });
    }

    // Try to reinitialize speech recognition
    const instance = initRecognition();
    setRecognitionInstance(instance);
  }, [language, initRecognition]);

  // Start listening
  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      setError("Your browser does not support speech recognition.");
      return;
    }

    // Initialize if we don't have an instance yet
    let instance = recognitionInstance;
    if (!instance) {
      instance = initRecognition();
      setRecognitionInstance(instance);
    }

    if (!instance) return;

    setIsListening(true);
    setError(null);

    // If we're in offline mode, simulate speech recognition
    if (!isOnline) {
      console.log("Using offline speech recognition");

      // Show notification to user
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Offline Mode", {
          body: "Using offline speech recognition with limited capabilities",
        });
      }

      // Simulate processing time
      setTimeout(() => {
        const { match, confidence } = findBestMatch(text || "help");
        setText(match);
        setConfidence(confidence);
        setIsListening(false);
      }, 2000);
      return;
    }

    try {
      instance.start();
      setShouldReconnect(false);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setError("Failed to start speech recognition. Please try again.");
      setIsListening(false);
    }

    // Automatically stop after 10 seconds to prevent resource drain
    setTimeout(() => {
      if (isListening) {
        stopListening();
      }
    }, 10000);
  }, [
    browserSupportsSpeechRecognition,
    initRecognition,
    text,
    isOnline,
    isListening,
    recognitionInstance,
  ]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionInstance && isListening) {
      try {
        recognitionInstance.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
    setIsListening(false);
    setShouldReconnect(false);
  }, [recognitionInstance, isListening]);

  // Load cached commands from localStorage on mount
  useEffect(() => {
    const storedCommands = localStorage.getItem("cachedCommands");
    if (storedCommands) {
      try {
        const parsedCommands = JSON.parse(storedCommands);
        // Extend our cached commands with stored ones
        parsedCommands.forEach((cmd: string) => {
          if (!cachedCommands.includes(cmd)) {
            cachedCommands.push(cmd);
          }
        });
      } catch (error) {
        console.error("Error parsing cached commands:", error);
      }
    }

    // If online, fetch additional language-specific commands
    if (navigator.onLine) {
      ApiService.getModelInfo(language, "stt")
        .then((data) => {
          if (data?.commonPhrases && Array.isArray(data.commonPhrases)) {
            // Add these to our cached commands
            data.commonPhrases.forEach((phrase: string) => {
              if (!cachedCommands.includes(phrase)) {
                cachedCommands.push(phrase);
              }
            });
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch language-specific commands:", err);
        });
    }
  }, [language]);

  return {
    text,
    isListening,
    error,
    confidence,
    startListening,
    stopListening,
    resetText,
    browserSupportsSpeechRecognition,
    isOnline,
    reconnect,
  };
};
