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
  const browserSupportsTTS =
    typeof window !== "undefined" && "speechSynthesis" in window;

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

        // Create a copy of the ArrayBuffer to prevent detachment issues
        const audioBufferCopy = new ArrayBuffer(audioBuffer.byteLength);
        new Uint8Array(audioBufferCopy).set(new Uint8Array(audioBuffer));

        // Convert ArrayBuffer to AudioBuffer with error handling
        try {
          const audioData = await audioContext.decodeAudioData(audioBufferCopy);
          const source = audioContext.createBufferSource();
          source.buffer = audioData;

          // Add rate and pitch control if needed
          if (rate !== 1.0 || pitch !== 1.0) {
            // Web Audio API doesn't directly support pitch control,
            // but playbackRate can somewhat simulate it
            source.playbackRate.value = rate * Math.pow(2, (pitch - 1) / 12);
          } else {
            source.playbackRate.value = rate;
          }

          source.connect(audioContext.destination);
          source.start(0);
          setAudioSource(source);

          // Handle speech completion
          source.onended = () => {
            setIsSpeaking(false);
            setAudioSource(null);
          };
        } catch (decodeError) {
          console.error("Failed to decode audio data:", decodeError);
          setError("Failed to decode audio data");
          setIsSpeaking(false);

          // Try to use the Web Speech API as fallback
          if (browserSupportsTTS && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (err) {
        console.error("Speech generation failed:", err);
        setError("Failed to generate speech");
        setIsSpeaking(false);

        // Try to use the Web Speech API as fallback
        if (browserSupportsTTS && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;
          utterance.pitch = pitch;
          window.speechSynthesis.speak(utterance);
        }
      }
    },
    [language, selectedVoice, audioContext, audioSource, browserSupportsTTS]
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
