import { useState, useCallback, useEffect, useRef } from "react";
import { GhanaianLanguage } from "../context/LanguageContext";
import ApiService from "./ApiService";
import GhanaianTTS from "./GhanaianTTS"; // Import our custom TTS service
import ESPnetIntegration from "../utils/ESPnetIntegration";

// Map Ghanaian languages to the closest available voices
const languageMap: Record<GhanaianLanguage, string> = {
  english: "en-US",
  twi: "en-GH", // Fallback
  ga: "en-GH", // Fallback
  ewe: "en-GH", // Fallback
  hausa: "fr", // Closest tonal language available as fallback
  dagbani: "en-GH", // Fallback for Dagbani
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
  dagbani: {
    ɛ: "eh", // Open e sound
    ɔ: "aw", // Open o sound
    ŋ: "ng", // Velar nasal
    ɣ: "gh", // Voiced velar fricative
    // Common words
    desiba: "deh-see-bah", // Welcome
    npuhimiya: "n-poo-hee-mee-yah", // Thank you
  },
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
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  // Store current language in a ref to avoid stale closure issues
  const currentLanguageRef = useRef<GhanaianLanguage>(language);

  // Ref for audio sources to stop properly
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Update the current language ref when the language prop changes
  useEffect(() => {
    currentLanguageRef.current = language;
    // Set the language in our GhanaianTTS service
    GhanaianTTS.setLanguage(language);

    // Try to find an appropriate voice for new language
    if (voices.length > 0) {
      const langCode = languageMap[language];
      const matchingVoice = voices.find(
        (voice) =>
          voice.lang.startsWith(langCode) ||
          (language !== "english" && voice.lang.startsWith("en"))
      );

      if (matchingVoice) {
        setSelectedVoice(matchingVoice);
      }
    }
  }, [language, voices]);

  // Check if browser supports TTS
  const browserSupportsTTS = "speechSynthesis" in window;

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

    // Listen for custom language change events from our LanguageContext
    const handleLanguageChange = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.language) {
        const newLanguage = event.detail.language as GhanaianLanguage;
        if (newLanguage !== currentLanguageRef.current) {
          // Update our reference
          currentLanguageRef.current = newLanguage;
          // Update GhanaianTTS service
          GhanaianTTS.setLanguage(newLanguage);

          // Try to find a matching voice
          if (voices.length > 0) {
            const langCode = languageMap[newLanguage];
            const matchingVoice = voices.find(
              (voice) =>
                voice.lang.startsWith(langCode) ||
                (newLanguage !== "english" && voice.lang.startsWith("en"))
            );

            if (matchingVoice) {
              setSelectedVoice(matchingVoice);
            }
          }

          // Cancel any current speech
          if (browserSupportsTTS) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }
        }
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("app-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("app-language-change", handleLanguageChange);
    };
  }, [browserSupportsTTS, voices]);

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

    // Initialize audio element
    const audio = new Audio();
    audio.addEventListener("ended", () => setIsSpeaking(false));
    audio.addEventListener("error", (e) => {
      console.error("Audio playback error:", e);
      setIsSpeaking(false);
    });
    setAudioElement(audio);

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

    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.removeEventListener("ended", () => setIsSpeaking(false));
        audioElement.removeEventListener("error", () => setIsSpeaking(false));
      }
    };
  }, [initVoices]);

  // Use ESPnet API for TTS
  const useESPnetTTS = async (
    text: string,
    language: GhanaianLanguage,
    rate: number = 1.0,
    pitch: number = 1.0
  ): Promise<string> => {
    if (!text) return "";

    try {
      // Apply phonetic replacements for better pronunciation
      let processedText = text;
      const replacements = phoneticReplacements[language];
      if (replacements) {
        Object.entries(replacements).forEach(([key, value]) => {
          const regex = new RegExp(key, "gi");
          processedText = processedText.replace(regex, value);
        });
      }

      // Use ESPnet integration utility
      return await ESPnetIntegration.synthesizeSpeech({
        text: processedText,
        language,
        speed: rate,
        pitch,
        volume: 1.0,
        format: "mp3",
      });
    } catch (error) {
      console.error("Error using ESPnet TTS:", error);
      throw error;
    }
  };

  // Speak function
  const speak = useCallback(
    async (text: string, rate: number = 1.0, pitch: number = 1.0) => {
      if (!text || isSpeaking) return;

      // Stop any previous speech
      stop();

      try {
        setIsSpeaking(true);

        // Try to use ESPnet TTS if online and available
        if (isOnline && ESPnetIntegration.isESPnetAvailable()) {
          try {
            const audioUrl = await useESPnetTTS(text, language, rate, pitch);

            if (audioElement) {
              audioElement.src = audioUrl;
              await audioElement.play();
            }
            return;
          } catch (error) {
            console.warn(
              "Failed to use ESPnet TTS, falling back to browser TTS:",
              error
            );
            // Fall back to browser TTS on error
          }
        }

        // If offline or ESPnet failed, try cached audio
        const cached = cachedUtterances.find(
          (item) => item.text === text && item.language === language
        );

        if (cached && cached.audio.byteLength > 0 && audioContext) {
          try {
            // Play from cache
            const audioBuffer = await audioContext.decodeAudioData(
              cached.audio.slice(0)
            );
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            // Store reference for stopping later
            audioSourceRef.current = source;

            source.start(0);
            source.onended = () => setIsSpeaking(false);
            return;
          } catch (error) {
            console.error("Error playing cached audio:", error);
          }
        }

        // As last resort, use browser TTS
        if (browserSupportsTTS) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;
          utterance.pitch = pitch || tonalAdjustments[language] || 1.0;

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }

          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);

          window.speechSynthesis.speak(utterance);
        } else {
          // If everything fails
          console.error("No TTS method available");
          setIsSpeaking(false);
        }
      } catch (error) {
        console.error("Error in speak function:", error);
        setIsSpeaking(false);
      }
    },
    [
      language,
      isSpeaking,
      isOnline,
      audioElement,
      browserSupportsTTS,
      selectedVoice,
    ]
  );

  // Stop function
  const stop = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      } catch (e) {
        console.error("Error stopping audio source:", e);
      }
    }

    if (browserSupportsTTS) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  }, [audioElement, browserSupportsTTS]);

  // Preload function to cache frequently used phrases
  const preloadPhrase = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text || !isOnline) return false;

      try {
        // Check if already cached
        const existing = cachedUtterances.find(
          (item) => item.text === text && item.language === language
        );

        if (existing && existing.audio.byteLength > 0) {
          // Update timestamp to keep it in cache longer
          existing.timestamp = Date.now();
          return true;
        }

        // Generate speech and cache it
        const audioUrl = await useESPnetTTS(text, language);
        const response = await fetch(audioUrl);
        const audioData = await response.arrayBuffer();

        // Add to cache
        cachedUtterances.push({
          text,
          language,
          audio: audioData,
          timestamp: Date.now(),
        });

        // Limit cache size (keep most recent 50 items)
        if (cachedUtterances.length > 50) {
          cachedUtterances.sort((a, b) => b.timestamp - a.timestamp);
          cachedUtterances = cachedUtterances.slice(0, 50);
        }

        // Save to localStorage
        try {
          localStorage.setItem(
            "cachedUtterances",
            JSON.stringify(cachedUtterances)
          );
        } catch (e) {
          console.warn("Failed to save cache to localStorage:", e);
        }

        return true;
      } catch (error) {
        console.error("Error preloading phrase:", error);
        return false;
      }
    },
    [language, isOnline]
  );

  // Return the API
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

export default useTextToSpeech;
