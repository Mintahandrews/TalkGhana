import { useState, useCallback, useEffect, useRef } from "react";
import { GhanaianLanguage } from "../context/LanguageContext";
import ApiService from "./ApiService";
import GhanaianTTS from "./GhanaianTTS"; // Import our custom TTS service

// Map Ghanaian languages to the closest available voices
const languageMap: Record<GhanaianLanguage, string> = {
  english: "en-US",
  twi: "en-GH", // Fallback
  ga: "en-GH", // Fallback
  ewe: "en-GH", // Fallback
  hausa: "fr", // Closest tonal language available as fallback
};

// Phonetic replacements for better pronunciation of Ghanaian languages
const phoneticReplacements: Record<GhanaianLanguage, Record<string, string>> = {
  twi: {
    ɛ: "eh", // Open e sound
    ɔ: "aw", // Open o sound
    kw: "qu", // Labial-velar
    ny: "n y", // Palatal nasal
    tw: "t w", // Labial-velar
    hw: "h w", // Labial-velar
    // Common words
    akwaaba: "ah kwaa ba", // Welcome
    medaase: "meh daa seh", // Thank you
    yɛ: "yeh", // We/Us
  },
  ga: {
    ɛ: "eh", // Open e sound
    ɔ: "aw", // Open o sound
    dz: "j", // Voiced alveolar affricate
    kp: "k p", // Labial-velar
    gb: "g b", // Labial-velar
    ny: "n y", // Palatal nasal
    // Common words
    ogekoo: "oh geh koo", // Welcome
    migale: "mee gah leh", // Greetings
  },
  ewe: {
    ɛ: "eh", // Open e sound
    ɔ: "aw", // Open o sound
    ɖ: "d", // Retroflex d
    ƒ: "f", // Bilabial f
    ny: "n y", // Palatal nasal
    dz: "j", // Voiced alveolar affricate
    // Common words
    akpe: "ah kpeh", // Thank you
    woezɔ: "woh eh zaw", // Welcome
  },
  hausa: {
    ɓ: "b", // Implosive b
    ɗ: "d", // Implosive d
    ƙ: "k", // Ejective k
    ts: "ch", // Ejective ts
    // Common words
    sannu: "sah noo", // Hello
    nagode: "nah goh deh", // Thank you
  },
  english: {}, // No replacements needed
};

// Tone/pitch adjustments for tonal languages
const tonalAdjustments: Partial<Record<GhanaianLanguage, number>> = {
  twi: 1.1, // Slightly higher pitch for Twi
  ga: 1.05, // Slightly higher pitch for Ga
  ewe: 1.1, // Slightly higher pitch for Ewe
  hausa: 1.15, // Higher pitch for Hausa
};

// Interface for TTS service
export interface UseTextToSpeechReturn {
  speak: (text: string, rate?: number, pitch?: number) => void;
  stop: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  browserSupportsTTS: boolean;
  isOnline: boolean; // Add online status to the interface
  preloadPhrase: (text: string) => Promise<boolean>; // Preload a phrase for faster playback
  getAvailableVoices: (language: GhanaianLanguage) => SpeechSynthesisVoice[];
}

// Cache for frequently used phrases
interface CachedUtterance {
  text: string;
  language: GhanaianLanguage;
  audio: ArrayBuffer;
  timestamp: number;
}

// Initialize cache
let cachedUtterances: CachedUtterance[] = [];

// For native audio playback
let audioContext: AudioContext | null = null;
try {
  if (typeof window !== "undefined" && "AudioContext" in window) {
    audioContext = new AudioContext();
  }
} catch (e) {
  console.error("AudioContext not supported:", e);
}

// Main hook for text-to-speech
export const useTextToSpeech = (
  language: GhanaianLanguage = "english"
): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Ref for audio sources to stop properly
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Check if browser supports TTS
  const browserSupportsTTS = "speechSynthesis" in window;

  // Set the language in our GhanaianTTS service
  useEffect(() => {
    GhanaianTTS.setLanguage(language);
  }, [language]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online. Reconnecting speech services...");
      setIsOnline(true);
      // Reinitialize voices when coming back online
      if (browserSupportsTTS) {
        window.speechSynthesis.cancel(); // Reset any stuck processes
        initVoices();
      }
    };

    const handleOffline = () => {
      console.log("App is offline. Switching to cached responses...");
      setIsOnline(false);
      // Stop any ongoing speech when going offline
      if (browserSupportsTTS) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [browserSupportsTTS]);

  // Get available voices for a specific language
  const getAvailableVoices = useCallback(
    (lang: GhanaianLanguage): SpeechSynthesisVoice[] => {
      const langCode = languageMap[lang];
      return voices.filter(
        (voice) =>
          voice.lang.startsWith(langCode) ||
          (lang !== "english" && voice.lang.startsWith("en"))
      );
    },
    [voices]
  );

  // Initialize voices when available
  const initVoices = useCallback(() => {
    if (!browserSupportsTTS) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);

        // Try to find a voice for the current language
        const langCode = languageMap[language];
        const matchingVoice = availableVoices.find(
          (voice) =>
            voice.lang.startsWith(langCode) ||
            (language === "twi" && voice.lang.startsWith("en"))
        );

        if (matchingVoice) {
          setSelectedVoice(matchingVoice);
        } else {
          // Default to first voice
          setSelectedVoice(availableVoices[0]);
        }
      }
    };

    // Chrome requires waiting for voiceschanged event
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices();
  }, [browserSupportsTTS, language]);

  // Initialize on first render
  useEffect(() => {
    initVoices();

    // Load cached utterances from localStorage
    try {
      const savedCache = localStorage.getItem("cachedUtterances");
      if (savedCache) {
        const parsed = JSON.parse(savedCache);

        // Convert to our new format if needed
        cachedUtterances = parsed.map((item: any) => {
          if (typeof item === "string") {
            // Legacy format - just text
            return {
              text: item,
              language: "english",
              audio: new ArrayBuffer(0),
              timestamp: Date.now(),
            };
          } else if (!item.language) {
            // Old format - missing language
            return {
              ...item,
              language: "english",
              timestamp: Date.now(),
            };
          }
          return item;
        });
      }
    } catch (error) {
      console.error("Failed to load cached utterances:", error);
    }
  }, [initVoices]);

  // Re-initialize when language changes
  useEffect(() => {
    // If we have voices already, try to find a new matching voice for the changed language
    if (voices.length > 0) {
      const langCode = languageMap[language];
      const matchingVoice = voices.find(
        (voice) =>
          voice.lang.startsWith(langCode) ||
          (language === "twi" && voice.lang.startsWith("en"))
      );

      if (matchingVoice) {
        setSelectedVoice(matchingVoice);
      }
    } else {
      // If no voices loaded yet, initialize them
      initVoices();
    }
  }, [language, voices, initVoices]);

  // Apply phonetic replacements for better pronunciation
  const applyPhoneticReplacements = useCallback(
    (text: string, lang: GhanaianLanguage): string => {
      const replacements = phoneticReplacements[lang];
      if (!replacements || Object.keys(replacements).length === 0) {
        return text;
      }

      let processedText = text;

      // Process whole words first
      const words = text.split(/\s+/);
      const processedWords = words.map((word) => {
        return replacements[word.toLowerCase()] || word;
      });
      processedText = processedWords.join(" ");

      // Then do character replacements
      Object.entries(replacements).forEach(([pattern, replacement]) => {
        // Skip full word replacements (already handled)
        if (pattern.includes(" ") || pattern.length > 3) return;

        processedText = processedText.replace(
          new RegExp(pattern, "gi"),
          replacement
        );
      });

      return processedText;
    },
    []
  );

  // Play audio from ArrayBuffer
  const playAudioBuffer = useCallback(
    async (audioData: ArrayBuffer): Promise<void> => {
      if (!audioContext) {
        try {
          audioContext = new AudioContext();
        } catch (error) {
          console.error("Failed to create AudioContext:", error);
          return;
        }
      }

      try {
        // Stop any currently playing audio
        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
        }

        setIsSpeaking(true);

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(audioData);

        // Create and connect source node
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        // Set up event handlers
        source.onended = () => {
          setIsSpeaking(false);
          audioSourceRef.current = null;
        };

        // Store for later stopping if needed
        audioSourceRef.current = source;

        // Start playback
        source.start();
      } catch (error) {
        console.error("Failed to play audio buffer:", error);
        setIsSpeaking(false);
      }
    },
    []
  );

  // Preload a phrase into the cache
  const preloadPhrase = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text || !isOnline || text.length > 200) return false;

      try {
        // For non-English languages, use our specialized GhanaianTTS service
        if (language !== "english") {
          await GhanaianTTS.preloadPhrases([text], language);
          return true;
        }

        // Check if already cached with audio
        const existingUtterance = cachedUtterances.find(
          (item) =>
            item.text === text &&
            item.language === language &&
            item.audio.byteLength > 0
        );

        if (existingUtterance) return true;

        // Try to get custom synthesized audio for this language
        const response = await fetch(
          `/api/synthesize?text=${encodeURIComponent(
            text
          )}&language=${language}`
        );

        if (response.ok) {
          const audioData = await response.arrayBuffer();

          // Add to cache
          const newCachedItem: CachedUtterance = {
            text,
            language,
            audio: audioData,
            timestamp: Date.now(),
          };

          // Update cache
          const existingIndex = cachedUtterances.findIndex(
            (item) => item.text === text && item.language === language
          );

          if (existingIndex >= 0) {
            cachedUtterances[existingIndex] = newCachedItem;
          } else {
            if (cachedUtterances.length > 30) {
              // Remove oldest items
              cachedUtterances.sort((a, b) => a.timestamp - b.timestamp);
              cachedUtterances = cachedUtterances.slice(5);
            }
            cachedUtterances.push(newCachedItem);
          }

          // Update storage (exclude audio data)
          try {
            localStorage.setItem(
              "cachedUtterances",
              JSON.stringify(
                cachedUtterances.map((item) => ({
                  text: item.text,
                  language: item.language,
                  timestamp: item.timestamp,
                }))
              )
            );
          } catch (error) {
            console.error("Failed to save cache:", error);
          }

          return true;
        }

        return false;
      } catch (error) {
        console.error("Failed to preload phrase:", error);
        return false;
      }
    },
    [language, isOnline]
  );

  // Speak function with enhanced connection handling
  const speak = useCallback(
    async (text: string, rate = 1.0, pitch = 1.0) => {
      if (!text) return;

      // For Ghanaian languages, use our specialized TTS service
      if (language !== "english") {
        try {
          setIsSpeaking(true);

          await GhanaianTTS.speak(text, {
            language: language,
            rate: rate,
            pitch: pitch,
          });

          setIsSpeaking(false);
          return;
        } catch (error) {
          console.error(
            "GhanaianTTS failed, falling back to browser TTS:",
            error
          );
          // Continue with browser TTS as fallback
        }
      }

      // Try cached audio first
      const cachedUtterance = cachedUtterances.find(
        (item) =>
          item.text === text &&
          item.language === language &&
          item.audio.byteLength > 0
      );

      // If we have cached audio, use it
      if (
        cachedUtterance &&
        cachedUtterance.audio &&
        cachedUtterance.audio.byteLength > 0
      ) {
        try {
          await playAudioBuffer(cachedUtterance.audio);
          // Update timestamp to keep this utterance fresh
          cachedUtterance.timestamp = Date.now();
          return;
        } catch (error) {
          console.error("Failed to play cached audio:", error);
          // Fall back to synthesized speech
        }
      }

      // Handle offline mode
      if (!isOnline) {
        if (cachedUtterance) {
          console.log("Using cached utterance in offline mode:", text);
          try {
            await playAudioBuffer(cachedUtterance.audio);
            return;
          } catch (error) {
            console.error(
              "Failed to play cached audio in offline mode:",
              error
            );
          }
        } else {
          console.log(
            "Cannot speak in offline mode - utterance not cached:",
            text
          );
          // Notify user
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Offline Speech", {
              body: `Using cached speech for: ${text.substring(0, 30)}...`,
            });
          }
          return;
        }
      }

      // Try to get custom synthesized audio for Ghanaian languages
      if (language !== "english") {
        try {
          const response = await fetch(
            `/api/synthesize?text=${encodeURIComponent(
              text
            )}&language=${language}`
          );

          if (response.ok) {
            const audioData = await response.arrayBuffer();

            // Play the audio
            await playAudioBuffer(audioData);

            // Cache the audio
            if (text.length < 100) {
              const newCachedItem: CachedUtterance = {
                text,
                language,
                audio: audioData,
                timestamp: Date.now(),
              };

              const existingIndex = cachedUtterances.findIndex(
                (item) => item.text === text && item.language === language
              );

              if (existingIndex >= 0) {
                cachedUtterances[existingIndex] = newCachedItem;
              } else {
                if (cachedUtterances.length > 30) {
                  // Sort by timestamp and remove oldest
                  cachedUtterances.sort((a, b) => a.timestamp - b.timestamp);
                  cachedUtterances = cachedUtterances.slice(10);
                }
                cachedUtterances.push(newCachedItem);
              }

              try {
                localStorage.setItem(
                  "cachedUtterances",
                  JSON.stringify(
                    cachedUtterances.map((item) => ({
                      text: item.text,
                      language: item.language,
                      timestamp: item.timestamp,
                    }))
                  )
                );
              } catch (error) {
                console.error("Failed to cache utterance:", error);
              }
            }

            return;
          }
        } catch (error) {
          console.warn(
            "Custom synthesis failed, falling back to browser TTS:",
            error
          );
          // Continue with browser TTS
        }
      }

      // Use browser's Web Speech API as fallback
      if (!browserSupportsTTS) return;

      // Apply phonetic replacements for better pronunciation
      const processedText = applyPhoneticReplacements(text, language);

      const utterance = new SpeechSynthesisUtterance(processedText);
      utterance.rate = rate;

      // Adjust pitch for tonal languages
      const tonalAdjustment = tonalAdjustments[language] || 1.0;
      utterance.pitch = pitch * tonalAdjustment;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        utterance.lang = languageMap[language];
      }

      // Add retries for failed speech attempts
      let retryCount = 0;
      const maxRetries = 3;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("TTS Error:", event);

        // Retry logic for network-related errors
        if (retryCount < maxRetries && isOnline) {
          console.log(
            `Retrying speech synthesis (attempt ${
              retryCount + 1
            }/${maxRetries})...`
          );
          retryCount++;
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 500); // Short delay before retry
        } else {
          setIsSpeaking(false);
        }
      };

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Speak the new utterance
      window.speechSynthesis.speak(utterance);

      // Cache the text version for future reference
      if (!cachedUtterance && text.length < 100) {
        const newCachedItem: CachedUtterance = {
          text,
          language,
          audio: new ArrayBuffer(0),
          timestamp: Date.now(),
        };

        if (cachedUtterances.length > 30) {
          // Sort by timestamp and remove oldest
          cachedUtterances.sort((a, b) => a.timestamp - b.timestamp);
          cachedUtterances = cachedUtterances.slice(10);
        }

        cachedUtterances.push(newCachedItem);

        try {
          localStorage.setItem(
            "cachedUtterances",
            JSON.stringify(
              cachedUtterances.map((item) => ({
                text: item.text,
                language: item.language,
                timestamp: item.timestamp,
              }))
            )
          );
        } catch (error) {
          console.error("Failed to cache utterance:", error);
        }

        // Try to preload the audio in the background for next time
        if (isOnline && language !== "english") {
          fetch(
            `/api/synthesize?text=${encodeURIComponent(
              text
            )}&language=${language}`
          )
            .then((response) => {
              if (response.ok) return response.arrayBuffer();
              throw new Error("Failed to synthesize speech");
            })
            .then((audioData) => {
              // Find the item we just cached and update its audio
              const item = cachedUtterances.find(
                (item) => item.text === text && item.language === language
              );

              if (item) {
                item.audio = audioData;
              }
            })
            .catch((error) => {
              console.error("Background audio preload failed:", error);
            });
        }
      }
    },
    [
      browserSupportsTTS,
      selectedVoice,
      language,
      isOnline,
      applyPhoneticReplacements,
      playAudioBuffer,
    ]
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (browserSupportsTTS) {
      window.speechSynthesis.cancel();
    }

    // Also stop any audio buffer playback
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (error) {
        console.error("Error stopping audio source:", error);
      }
      audioSourceRef.current = null;
    }

    setIsSpeaking(false);
  }, [browserSupportsTTS]);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    browserSupportsTTS,
    isOnline,
    preloadPhrase,
    getAvailableVoices,
  };
};
