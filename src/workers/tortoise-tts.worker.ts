/// <reference lib="webworker" />

import { GhanaianLanguage } from "../services/LanguageService";

// Define worker context type
declare const self: DedicatedWorkerGlobalScope;

interface TortoiseTTS {
  initialize(): Promise<void>;
  generate(
    text: string,
    options: any
  ): Promise<{
    buffer: ArrayBuffer;
    duration: number;
    sampleRate: number;
  }>;
  loadVoice(voiceId: string, language: GhanaianLanguage): Promise<void>;
  cloneVoice(audioClips: ArrayBuffer[]): Promise<string>;
  cleanup(): Promise<void>;
  adaptLanguage(language: GhanaianLanguage): Promise<void>;
}

interface WorkerMessage {
  type:
    | "initialize"
    | "generate"
    | "load_voice"
    | "clone_voice"
    | "stop"
    | "adapt_language";
  text?: string;
  config?: {
    voice?: string;
    preset?: string;
    numSamples?: number;
    numAutoregressiveSamples?: number;
    temperature?: number;
    lengthPenalty?: number;
    repetitionPenalty?: number;
    topK?: number;
    topP?: number;
    language?: GhanaianLanguage;
    accentStrength?: number;
    speakingRate?: number;
    pitch?: number;
  };
  language?: GhanaianLanguage;
  voiceId?: string;
  audioClips?: ArrayBuffer[];
}

let tts: TortoiseTTS | null = null;
let isInitialized = false;
let currentLanguage: GhanaianLanguage | null = null;

// Initialize Tortoise-TTS with enhanced error handling
async function initialize() {
  try {
    await loadTortoiseScript();

    if (!("Tortoise" in self)) {
      throw new Error("Tortoise not loaded");
    }

    tts = new (self as any).Tortoise({
      modelPath: "/models/tortoise-tts",
      cacheDir: "/cache/tortoise-tts",
      enableNoiseReduction: true,
    });

    if (!tts) {
      throw new Error("Failed to create Tortoise instance");
    }

    await tts.initialize();
    isInitialized = true;
    self.postMessage({ type: "initialized" });
  } catch (error) {
    handleError("Initialization failed", error);
  }
}

// Enhanced error handling utility
function handleError(context: string, error: any) {
  console.error(`${context}:`, error);
  self.postMessage({
    type: "error",
    data: {
      message: `${context}: ${error.message || error}`,
      context,
      timestamp: new Date().toISOString(),
    },
  });
}

// Generate speech with improved language handling
async function generateSpeech(text: string, config: WorkerMessage["config"]) {
  if (!tts || !isInitialized) {
    handleError("Generation failed", new Error("Tortoise-TTS not initialized"));
    return;
  }

  try {
    if (config?.language && config.language !== currentLanguage) {
      await adaptLanguage(config.language);
    }

    const audio = await tts.generate(text, {
      ...config,
      enableNoiseReduction: true,
      accentStrength: config?.accentStrength || 0.8,
      speakingRate: config?.speakingRate || 1.0,
      pitch: config?.pitch || 1.0,
      languageModel: config?.language
        ? `${config.language.toLowerCase()}_base`
        : undefined,
      useCustomPronunciation: true,
    });

    self.postMessage({
      type: "speech",
      data: {
        audio: audio.buffer,
        language: config?.language,
        duration: audio.duration,
        sampleRate: audio.sampleRate,
      },
    });
  } catch (error) {
    handleError("Speech generation failed", error);
  }
}

// New function to adapt to a specific language
async function adaptLanguage(language: GhanaianLanguage) {
  if (!tts || !isInitialized) {
    handleError(
      "Language adaptation failed",
      new Error("Tortoise-TTS not initialized")
    );
    return;
  }

  try {
    await tts.adaptLanguage(language);
    currentLanguage = language;
    self.postMessage({
      type: "language_adapted",
      data: { language },
    });
  } catch (error) {
    handleError("Language adaptation failed", error);
  }
}

// Load a voice
async function loadVoice(language: GhanaianLanguage, voiceId: string) {
  if (!tts || !isInitialized) {
    self.postMessage({
      type: "error",
      data: { message: "Tortoise-TTS not initialized" },
    });
    return;
  }

  try {
    await tts.loadVoice(voiceId, language); // Pass language for proper voice loading
    self.postMessage({ type: "voice_loaded" });
  } catch (error) {
    self.postMessage({
      type: "error",
      data: { message: "Failed to load voice" },
    });
  }
}

// Clone a voice
async function cloneVoice(
  audioClips: ArrayBuffer[],
  language: GhanaianLanguage
) {
  if (!tts || !isInitialized) {
    self.postMessage({
      type: "error",
      data: { message: "Tortoise-TTS not initialized" },
    });
    return;
  }

  try {
    // Use language-specific voice cloning settings
    const voiceId = await tts.cloneVoice(audioClips);
    self.postMessage({
      type: "voice_cloned",
      data: { voiceId },
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      data: { message: "Failed to clone voice" },
    });
  }
}

// Enhanced message handler with new language adaptation support
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, ...data } = event.data;

  try {
    switch (type) {
      case "initialize":
        await initialize();
        break;
      case "generate":
        if (data.text && data.config) {
          await generateSpeech(data.text, data.config);
        } else {
          throw new Error("Missing text or config for speech generation");
        }
        break;
      case "load_voice":
        if (data.language && data.voiceId) {
          await loadVoice(data.language, data.voiceId);
        } else {
          throw new Error("Missing language or voiceId for voice loading");
        }
        break;
      case "clone_voice":
        if (data.audioClips && data.language) {
          await cloneVoice(data.audioClips, data.language);
        } else {
          throw new Error("Missing audioClips or language for voice cloning");
        }
        break;
      case "adapt_language":
        if (data.language) {
          await adaptLanguage(data.language);
        } else {
          throw new Error("Missing language for adaptation");
        }
        break;
      case "stop":
        if (tts) {
          await tts.cleanup();
          tts = null;
          isInitialized = false;
          currentLanguage = null;
          self.postMessage({ type: "stopped" });
        }
        break;
      default:
        throw new Error(`Unsupported message type: ${type}`);
    }
  } catch (error) {
    handleError(`Failed to process ${type} message`, error);
  }
};

async function loadTortoiseScript() {
  try {
    // First check if the script is already loaded
    if ("Tortoise" in self) {
      return;
    }

    // Try to load from public directory first
    const scriptUrl = new URL(
      "/models/tortoise-tts/tortoise.js",
      self.location.origin
    );
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to load Tortoise script: ${response.statusText}`);
    }
    const scriptText = await response.text();

    // Execute the script in the worker context
    const blob = new Blob([scriptText], { type: "text/javascript" });
    const scriptObjectUrl = URL.createObjectURL(blob);
    // @vite-ignore
    await import(scriptObjectUrl);
    URL.revokeObjectURL(scriptObjectUrl);
  } catch (error) {
    throw new Error(`Failed to load Tortoise script: ${error}`);
  }
}
