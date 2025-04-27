import "regenerator-runtime/runtime";
import { useState, useEffect, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useLanguage } from "../contexts/LanguageContext";
import { useOffline } from "../contexts/OfflineContext";

type WhisperModelType = "tiny" | "base" | "small" | "medium";

interface UseASROptions {
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  useWhisperFallback?: boolean;
  whisperEndpoint?: string;
}

interface WhisperRequest {
  audio: Blob;
  language: string;
  model: WhisperModelType;
  prompt?: string;
}

interface WhisperResponse {
  text: string;
  confidence: number;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  language: string;
}

// This hook extends the browser's SpeechRecognition API with Whisper ASR fallback capabilities
export const useASR = ({
  continuous = false,
  onResult,
  onError,
  onEnd,
  useWhisperFallback = true,
  whisperEndpoint = "http://localhost:5002/api/asr",
}: UseASROptions = {}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isWhisperProcessing, setIsWhisperProcessing] = useState(false);
  const [whisperResult, setWhisperResult] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const { isOffline, addToSyncQueue } = useOffline();
  const { currentLanguage, getLanguageResource } = useLanguage();

  // Get speech recognition from react-speech-recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // Effect to handle transcript changes
  useEffect(() => {
    if (transcript && onResult && !fallbackActive) {
      onResult(transcript);
    }
  }, [transcript, onResult, fallbackActive]);

  // Effect to handle whisperResult changes
  useEffect(() => {
    if (whisperResult && onResult && fallbackActive) {
      onResult(whisperResult);
    }
  }, [whisperResult, onResult, fallbackActive]);

  // Initialize MediaRecorder for Whisper fallback
  const initMediaRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        if (fallbackActive && audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          await processAudioWithWhisper(audioBlob);
          setAudioChunks([]);
        }

        if (onEnd) {
          onEnd();
        }
      };

      setMediaRecorder(recorder);
    } catch (error) {
      if (onError) {
        onError(
          "Failed to initialize media recorder: " + (error as Error).message
        );
      }
    }
  }, [audioChunks, fallbackActive, onEnd, onError]);

  // Process audio with Whisper ASR API
  const processAudioWithWhisper = async (audioBlob: Blob) => {
    setIsWhisperProcessing(true);

    try {
      const languageResource = getLanguageResource(currentLanguage);
      const model =
        (languageResource?.whisperModel as WhisperModelType) || "base";

      if (isOffline) {
        // Store for later processing when online
        addToSyncQueue("/asr/offline-queue", {
          audio: audioBlob,
          language: currentLanguage,
          timestamp: Date.now(),
        });

        if (onError) {
          onError("Device is offline. Audio saved for later processing.");
        }
        return;
      }

      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("language", currentLanguage);
      formData.append("model", model);

      const response = await fetch(whisperEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const data: WhisperResponse = await response.json();
      setWhisperResult(data.text);
    } catch (error) {
      if (onError) {
        onError("Whisper ASR error: " + (error as Error).message);
      }
    } finally {
      setIsWhisperProcessing(false);
    }
  };

  // Start listening function
  const startListening = useCallback(async () => {
    resetTranscript();
    setWhisperResult("");

    try {
      // Check if browser supports speech recognition
      if (browserSupportsSpeechRecognition) {
        // Use browser's speech recognition
        SpeechRecognition.startListening({
          continuous,
          language: currentLanguage === "english" ? "en-US" : "en-GH", // Default to English variants
        });
        setFallbackActive(false);
      } else if (useWhisperFallback) {
        // Use Whisper fallback
        setFallbackActive(true);

        if (!mediaRecorder) {
          await initMediaRecorder();
        }

        if (mediaRecorder && mediaRecorder.state !== "recording") {
          mediaRecorder.start(1000); // Collect data every second
        }
      } else {
        if (onError) {
          onError("Speech recognition not supported and fallback disabled");
        }
        return;
      }

      setIsRecording(true);
    } catch (error) {
      if (onError) {
        onError("Failed to start listening: " + (error as Error).message);
      }
    }
  }, [
    browserSupportsSpeechRecognition,
    continuous,
    currentLanguage,
    initMediaRecorder,
    mediaRecorder,
    onError,
    resetTranscript,
    useWhisperFallback,
  ]);

  // Stop listening function
  const stopListening = useCallback(() => {
    try {
      if (browserSupportsSpeechRecognition && !fallbackActive) {
        SpeechRecognition.stopListening();
      } else if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }

      setIsRecording(false);
    } catch (error) {
      if (onError) {
        onError("Failed to stop listening: " + (error as Error).message);
      }
    }
  }, [
    browserSupportsSpeechRecognition,
    fallbackActive,
    mediaRecorder,
    onError,
  ]);

  // Reset function
  const reset = useCallback(() => {
    resetTranscript();
    setWhisperResult("");
    setAudioChunks([]);
  }, [resetTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }

      if (browserSupportsSpeechRecognition && listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [browserSupportsSpeechRecognition, listening, mediaRecorder]);

  return {
    startListening,
    stopListening,
    reset,
    transcript: fallbackActive ? whisperResult : transcript,
    isListening: fallbackActive ? isRecording : listening,
    isProcessing: isWhisperProcessing,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    usingFallback: fallbackActive,
  };
};

export default useASR;
