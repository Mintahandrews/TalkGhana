import "regenerator-runtime/runtime";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useOffline } from "../contexts/OfflineContext";
import { ttsService } from "../services/speech/TTSService";
import { GhanaianLanguage } from "../types";

interface UseTTSOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  useRemoteTTS?: boolean;
  remoteTTSEndpoint?: string;
  cacheAudio?: boolean;
}

interface TTSRequest {
  text: string;
  language: string;
  voice?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

interface TTSResponse {
  audioUrl: string;
  audioDuration: number;
  audioBlob?: Blob;
}

interface CachedAudio {
  text: string;
  language: string;
  blob: Blob;
  timestamp: number;
}

const MAX_CACHE_SIZE = 50; // Maximum number of cached audio items
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const useTTS = ({
  pitch = 1,
  rate = 1,
  volume = 1,
  onStart,
  onEnd,
  onError,
  useRemoteTTS = true,
  remoteTTSEndpoint = "http://localhost:5002/api/tts",
  cacheAudio = true,
}: UseTTSOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioCache, setAudioCache] = useState<CachedAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { currentLanguage, getLanguageResource } = useLanguage();
  const { isOffline } = useOffline();

  // Load audio cache from localStorage on mount
  useEffect(() => {
    if (cacheAudio) {
      try {
        const cachedData = localStorage.getItem("ttsAudioCache");
        if (cachedData) {
          setAudioCache(JSON.parse(cachedData));
        }
      } catch (error) {
        console.error("Failed to load audio cache:", error);
      }
    }
  }, [cacheAudio]);

  // Save audio cache to localStorage when it changes
  useEffect(() => {
    if (cacheAudio && audioCache.length > 0) {
      try {
        const serializedCache = JSON.stringify(
          audioCache.map(({ text, language, timestamp }) => ({
            text,
            language,
            timestamp,
            // Blobs cannot be serialized, so we exclude them here
            // When deserializing, we'll need to handle missing blobs
          }))
        );
        localStorage.setItem("ttsAudioCache", serializedCache);
      } catch (error) {
        console.error("Failed to save audio cache:", error);
      }
    }
  }, [audioCache, cacheAudio]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      audioRef.current.onended = () => {
        setIsSpeaking(false);
        if (onEnd) {
          onEnd();
        }
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        if (onError) {
          onError("Audio playback error");
        }
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (speechSynthesis && speechSynthRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [onEnd, onError]);

  // Check for cached audio
  const getCachedAudio = useCallback(
    (text: string, language: string): Blob | null => {
      if (!cacheAudio) return null;

      const cachedItem = audioCache.find(
        (item) => item.text === text && item.language === language
      );

      if (cachedItem && cachedItem.blob) {
        // Update timestamp to mark as recently used
        setAudioCache((prevCache) =>
          prevCache.map((item) =>
            item.text === text && item.language === language
              ? { ...item, timestamp: Date.now() }
              : item
          )
        );

        return cachedItem.blob;
      }

      return null;
    },
    [audioCache, cacheAudio]
  );

  // Add audio to cache
  const cacheAudioFile = useCallback(
    (text: string, language: string, blob: Blob) => {
      if (!cacheAudio) return;

      setAudioCache((prevCache) => {
        // Remove expired items
        const now = Date.now();
        const filtered = prevCache.filter(
          (item) => now - item.timestamp < CACHE_EXPIRY
        );

        // Add new item
        const newCache = [
          { text, language, blob, timestamp: now },
          ...filtered.filter(
            (item) => !(item.text === text && item.language === language)
          ),
        ];

        // Limit cache size
        return newCache.slice(0, MAX_CACHE_SIZE);
      });
    },
    [cacheAudio]
  );

  // Initialize service options
  useEffect(() => {
    // Configure TTSService based on hook options
    const config = {
      enableOfflineMode: true,
      cacheAudio,
      remoteTTSEndpoint,
    };

    // This would update the singleton if we had a way to do so
    // For now, the singleton uses defaults
  }, [cacheAudio, remoteTTSEndpoint]);

  // Speech handler
  const speak = useCallback(
    async (text: string) => {
      if (!text) return false;

      // Stop any current speech
      stop();

      setIsLoading(true);
      setLastSpokenText(text);

      try {
        // Trigger onStart callback
        if (onStart) {
          onStart();
        }

        setIsSpeaking(true);

        // Use TTSService to speak text
        await ttsService.speak({
          text,
          language: currentLanguage as GhanaianLanguage,
          pitch,
          rate,
          volume,
        });

        // The TTSService handles playback, but we need to set up our own
        // event for when speech is complete

        // For remote TTS, the audio element's onended handler will fire
        // For Web Speech API, we need to listen for the end event
        if ("speechSynthesis" in window) {
          speechSynthesis.addEventListener("end", handleSpeechEnd);
        }

        return true;
      } catch (error) {
        setIsSpeaking(false);
        if (onError) {
          onError(`Speech synthesis error: ${(error as Error).message}`);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentLanguage, onError, onStart, pitch, rate, volume]
  );

  // Handle speech end
  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);

    // Remove the listener to avoid memory leaks
    if ("speechSynthesis" in window) {
      speechSynthesis.removeEventListener("end", handleSpeechEnd);
    }

    if (onEnd) {
      onEnd();
    }
  }, [onEnd]);

  // Stop speaking
  const stop = useCallback(() => {
    ttsService.stop();
    setIsSpeaking(false);

    // Remove any event listeners
    if ("speechSynthesis" in window) {
      speechSynthesis.removeEventListener("end", handleSpeechEnd);
    }
  }, [handleSpeechEnd]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    lastSpokenText,
  };
};

export default useTTS;
