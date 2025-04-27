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
  id: string;
  type: "initialize" | "generate" | "loadVoice" | "cloneVoice" | "stop";
  data: any;
  config?: {
    language?: GhanaianLanguage;
    accentStrength?: number;
    speakingRate?: number;
    pitch?: number;
  };
}

interface WorkerResponse {
  id: string;
  type: string;
  data?: any;
  error?: string;
}

let tts: TortoiseTTS | null = null;
let isInitialized = false;
let currentLanguage: GhanaianLanguage | null = null;
let isBusy = false;

// Mock voices for initial development (will be replaced with real models)
const mockVoices: Record<string, any> = {
  "english-default": { loaded: true },
  "twi-default": { loaded: false },
  "ga-default": { loaded: false },
  "ewe-default": { loaded: false },
  "hausa-default": { loaded: false },
};

// Store loaded models
const loadedModels: Map<string, any> = new Map();

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
async function generateSpeech(text: string, config: WorkerMessage["config"] = {}) {
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
async function loadVoice(language: string, voiceId: string) {
  const voiceKey = `${language}-${voiceId}`;

  // Check if already loaded
  if (mockVoices[voiceKey]?.loaded) {
    return;
  }

  // In a real implementation, this would:
  // 1. Download or load the voice model from IndexedDB
  // 2. Initialize the model

  // For development, we'll simulate loading with a delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mark as loaded
  if (!mockVoices[voiceKey]) {
    mockVoices[voiceKey] = { loaded: true };
  } else {
    mockVoices[voiceKey].loaded = true;
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

// Setup message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, data } = event.data;

  try {
    // Process the message based on its type
    switch (type) {
      case "initialize":
        await handleInitialize(id);
        break;

      case "generate":
        await handleGenerate(id, data);
        break;

      case "loadVoice":
        await handleLoadVoice(id, data);
        break;

      case "cloneVoice":
        await handleCloneVoice(id, data);
        break;

      case "stop":
        await handleStop(id);
        break;

      default:
        sendError(id, `Unknown message type: ${type}`);
    }
  } catch (error: any) {
    sendError(id, error.message || "Unknown error");
  }
};

/**
 * Initialize the worker and load core models
 */
async function handleInitialize(id: string): Promise<void> {
  if (isInitialized) {
    sendResponse(id, "initialize", { success: true });
    return;
  }

  try {
    console.log("TortoiseTTS worker: Initializing...");

    // In a real implementation, this would:
    // 1. Load the core TortoiseTTS model
    // 2. Initialize the vocoder
    // 3. Set up any required preprocessing

    // For development, we'll simulate a delay for initialization
    await new Promise((resolve) => setTimeout(resolve, 500));

    isInitialized = true;
    sendResponse(id, "initialize", { success: true });
  } catch (error: any) {
    console.error("TortoiseTTS worker: Failed to initialize", error);
    sendError(id, `Failed to initialize: ${error.message}`);
  }
}

/**
 * Generate speech from text
 */
async function handleGenerate(id: string, data: any): Promise<void> {
  if (!isInitialized) {
    sendError(id, "Worker not initialized");
    return;
  }

  if (isBusy) {
    sendError(id, "Worker is busy");
    return;
  }

  try {
    isBusy = true;
    const { text, voiceKey, config } = data;

    console.log(
      `TortoiseTTS worker: Generating speech for "${text}" using ${voiceKey}`
    );

    // Check if voice is loaded
    if (!mockVoices[voiceKey] || !mockVoices[voiceKey].loaded) {
      // Try to load the voice
      await loadVoice(voiceKey.split("-")[0], voiceKey.split("-")[1]);
    }

    // In a real implementation, this would:
    // 1. Preprocess the text (phonemization, etc.)
    // 2. Generate mel spectrograms using the TortoiseTTS model
    // 3. Convert spectrograms to audio using the vocoder
    // 4. Post-process the audio

    // For development, we'll generate a simple tone based on text length
    const audioData = generateMockAudio(text, config);

    sendResponse(id, "generate", audioData);
  } catch (error: any) {
    console.error("TortoiseTTS worker: Failed to generate speech", error);
    sendError(id, `Failed to generate speech: ${error.message}`);
  } finally {
    isBusy = false;
  }
}

/**
 * Load a voice model
 */
async function handleLoadVoice(id: string, data: any): Promise<void> {
  const { language, voiceId } = data;
  const voiceKey = `${language}-${voiceId}`;

  try {
    console.log(`TortoiseTTS worker: Loading voice ${voiceKey}`);

    await loadVoice(language, voiceId);

    sendResponse(id, "loadVoice", {
      success: true,
      voiceKey,
    });
  } catch (error: any) {
    console.error(
      `TortoiseTTS worker: Failed to load voice ${voiceKey}`,
      error
    );
    sendError(id, `Failed to load voice ${voiceKey}: ${error.message}`);
  }
}

/**
 * Clone a new voice from audio samples
 */
async function handleCloneVoice(id: string, data: any): Promise<void> {
  if (!isInitialized) {
    sendError(id, "Worker not initialized");
    return;
  }

  try {
    const { audioClips, language } = data;

    console.log(
      `TortoiseTTS worker: Cloning voice for ${language} from ${audioClips.length} clips`
    );

    // In a real implementation, this would:
    // 1. Extract speaker embeddings from the audio clips
    // 2. Save the embeddings for later use

    // For development, we'll generate a random voice ID
    const voiceId = `cloned-${language}-${Date.now()}`;
    mockVoices[`${language}-${voiceId}`] = { loaded: true };

    sendResponse(id, "cloneVoice", {
      success: true,
      voiceId,
      language,
    });
  } catch (error: any) {
    console.error("TortoiseTTS worker: Failed to clone voice", error);
    sendError(id, `Failed to clone voice: ${error.message}`);
  }
}

/**
 * Stop current processing
 */
async function handleStop(id: string): Promise<void> {
  console.log("TortoiseTTS worker: Stopping...");

  // In a real implementation, this would interrupt any ongoing processing

  sendResponse(id, "stop", { success: true });
}

/**
 * Generate mock audio for development
 */
function generateMockAudio(text: string, config: any): ArrayBuffer {
  const sampleRate = 22050;
  const duration = Math.min(10, Math.max(1, text.length * 0.1)); // 0.1 seconds per character
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(numSamples * 2); // 16-bit samples
  const view = new Int16Array(buffer);

  // Generate a simple sine wave whose frequency depends on text content
  // This is just for testing - real implementation would use TortoiseTTS
  const frequency = 220 + (text.length % 10) * 50; // Base frequency varies with text length

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Basic sine wave
    let value = Math.sin(2 * Math.PI * frequency * t);

    // Add harmonics for a richer sound
    value += 0.5 * Math.sin(2 * Math.PI * frequency * 2 * t); // First harmonic
    value += 0.25 * Math.sin(2 * Math.PI * frequency * 3 * t); // Second harmonic

    // Apply amplitude envelope
    const envelope = Math.min(1, 10 * t) * Math.min(1, 10 * (duration - t));
    value *= envelope;

    // Convert to 16-bit audio
    view[i] = Math.floor(value * 10000);
  }

  return buffer;
}

/**
 * Send a success response
 */
function sendResponse(id: string, type: string, data: any): void {
  const response: WorkerResponse = {
    id,
    type,
    data,
  };

  self.postMessage(response);
}

/**
 * Send an error response
 */
function sendError(id: string, error: string): void {
  const response: WorkerResponse = {
    id,
    type: "error",
    error,
  };

  self.postMessage(response);
}

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

// Notify that the worker is ready
console.log("TortoiseTTS worker initialized");
