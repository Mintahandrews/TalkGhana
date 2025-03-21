import { useState, useCallback, useEffect } from "react";
import { languageService, GhanaianLanguage } from "./LanguageService";
import { tortoiseTTSService } from "./TortoiseTTSService";

export const useTextToSpeech = (language: GhanaianLanguage) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(
    null
  );
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Initialize audio context
  useEffect(() => {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  // Load voice for current language
  useEffect(() => {
    const loadVoice = async () => {
      try {
        const voiceId = `voice_${language}`;
        await tortoiseTTSService.loadVoice(language, voiceId);
        setSelectedVoice(voiceId);
      } catch (err) {
        console.error("Failed to load voice:", err);
        setError("Failed to load voice");
      }
    };

    loadVoice();
  }, [language]);

  const speak = useCallback(
    async (text: string, rate = 1.0, pitch = 1.0) => {
      if (!audioContext) {
        setError("Audio context not initialized");
        return;
      }

      try {
        setIsSpeaking(true);
        setError(null);

        // Stop any ongoing speech
        if (audioSource) {
          audioSource.stop();
        }

        // Generate speech using Tortoise-TTS
        const audioBuffer = await tortoiseTTSService.generateSpeech(text, {
          language,
          voice: selectedVoice || "default",
          preset: "standard",
        });

        // Convert ArrayBuffer to AudioBuffer
        const audioData = await audioContext.decodeAudioData(audioBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioData;
        source.connect(audioContext.destination);
        source.start(0);
        setAudioSource(source);

        // Handle speech completion
        source.onended = () => {
          setIsSpeaking(false);
          setAudioSource(null);
        };
      } catch (err) {
        console.error("Speech generation failed:", err);
        setError("Failed to generate speech");
        setIsSpeaking(false);
      }
    },
    [language, selectedVoice, audioContext, audioSource]
  );

  const stop = useCallback(() => {
    if (audioSource) {
      audioSource.stop();
      setAudioSource(null);
    }
    setIsSpeaking(false);
  }, [audioSource]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [stop, audioContext]);

  const browserSupportsTTS =
    typeof window !== "undefined" && "speechSynthesis" in window;

  return {
    speak,
    stop,
    isSpeaking,
    error,
    selectedVoice,
    setSelectedVoice,
    browserSupportsTTS,
    isOnline,
  };
};
