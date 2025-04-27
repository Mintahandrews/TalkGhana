import { GhanaianLanguage } from "../../types";
import { httpClient } from "../../utils/httpClient";

// Import correctly from transformers
import { pipeline } from "@xenova/transformers";

interface WhisperRequest {
  audio: Blob;
  language: GhanaianLanguage;
  model: "tiny" | "base" | "small" | "medium";
  prompt?: string; // Context to improve recognition
  enhanceAudio?: boolean; // Apply preprocessing to enhance audio
}

interface WhisperResponse {
  text: string;
  confidence: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  language: string;
}

interface WhisperConfig {
  apiKey?: string;
  offlineModels?: Partial<Record<GhanaianLanguage, string>>; // Model names for each language
  defaultModel?: "tiny" | "base" | "small" | "medium";
  enableAudioPreprocessing?: boolean;
}

const WHISPER_LANGUAGE_CODES: Record<GhanaianLanguage, string> = {
  twi: "ak", // Akan/Twi
  ga: "gaa",
  ewe: "ee",
  dagbani: "dag",
  hausa: "ha",
  english: "en",
};

// Maps Ghanaian languages to the best available model
const WHISPER_DEFAULT_MODELS: Record<GhanaianLanguage, string> = {
  twi: "Xenova/whisper-small", // Better model for Twi
  ga: "Xenova/whisper-small",
  ewe: "Xenova/whisper-small",
  dagbani: "Xenova/whisper-small",
  hausa: "Xenova/whisper-small",
  english: "Xenova/whisper-medium", // Best model for English
};

export class WhisperService {
  private apiKey?: string;
  private offlineModels: Record<GhanaianLanguage, string>;
  private defaultModel: "tiny" | "base" | "small" | "medium";
  private localModels: Map<string, any> = new Map();
  private isModelLoading: Record<string, boolean> = {};
  private isOfflineAvailable: boolean = false;
  private enableAudioPreprocessing: boolean = false;
  private audioContext: AudioContext | null = null;

  constructor(config?: WhisperConfig) {
    this.apiKey =
      config?.apiKey || (import.meta.env.VITE_OPENAI_API_KEY as string) || "";
    this.offlineModels = {
      ...WHISPER_DEFAULT_MODELS,
      ...(config?.offlineModels || {}),
    };
    this.defaultModel = config?.defaultModel || "small";
    this.enableAudioPreprocessing = config?.enableAudioPreprocessing ?? true;

    // Check if transformers.js is available
    this.isOfflineAvailable = typeof pipeline === "function";

    // Initialize audio context for preprocessing
    try {
      if (typeof window !== "undefined" && window.AudioContext) {
        this.audioContext = new window.AudioContext();
      }
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API (online) or local model (offline)
   */
  async transcribe(request: WhisperRequest): Promise<WhisperResponse> {
    const { audio, language, model, prompt, enhanceAudio } = request;

    // Preprocess audio if requested
    let processedAudio = audio;
    if ((enhanceAudio || this.enableAudioPreprocessing) && this.audioContext) {
      try {
        processedAudio = await this.preprocessAudio(audio);
      } catch (error) {
        console.warn(
          "Audio preprocessing failed, using original audio:",
          error
        );
      }
    }

    // Try to use online API if we have an API key and network connection
    if (this.apiKey && navigator.onLine) {
      try {
        return await this.transcribeWithOpenAI(
          processedAudio,
          language,
          prompt
        );
      } catch (error: any) {
        console.warn(
          "Online transcription failed, falling back to offline model:",
          error
        );
        // Fall back to offline model
      }
    }

    // Use offline model if available, otherwise return a message
    if (this.isOfflineAvailable) {
      return this.transcribeOffline(processedAudio, language, model, prompt);
    } else {
      // Return a placeholder response
      return this.fallbackWebSpeechRecognition(processedAudio, language);
    }
  }

  /**
   * Preprocess audio to improve recognition quality
   * - Denoise: Remove background noise
   * - Enhance: Improve speech clarity
   */
  private async preprocessAudio(audio: Blob): Promise<Blob> {
    if (!this.audioContext) {
      return audio;
    }

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await audio.arrayBuffer();

      // Decode audio data
      const audioData = await this.audioContext.decodeAudioData(arrayBuffer);

      // Get audio samples
      const inputChannel = audioData.getChannelData(0);

      // Create a new buffer for processing
      const outputBuffer = this.audioContext.createBuffer(
        1,
        audioData.length,
        audioData.sampleRate
      );
      const outputChannel = outputBuffer.getChannelData(0);

      // 1. Simple noise reduction: Apply a threshold to reduce background noise
      const threshold = 0.01;
      for (let i = 0; i < inputChannel.length; i++) {
        if (Math.abs(inputChannel[i]) < threshold) {
          outputChannel[i] = 0;
        } else {
          outputChannel[i] = inputChannel[i];
        }
      }

      // 2. Normalize the signal: Increase volume to use full dynamic range
      let maxValue = 0;
      for (let i = 0; i < outputChannel.length; i++) {
        maxValue = Math.max(maxValue, Math.abs(outputChannel[i]));
      }

      if (maxValue > 0) {
        const normalizationFactor = 0.9 / maxValue; // Slightly less than max to avoid clipping
        for (let i = 0; i < outputChannel.length; i++) {
          outputChannel[i] *= normalizationFactor;
        }
      }

      // Convert back to a Blob
      const offlineContext = new OfflineAudioContext(
        1,
        outputBuffer.length,
        outputBuffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = outputBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();

      // Convert to WAV format (16-bit PCM)
      const wavBuffer = this.audioBufferToWav(renderedBuffer);

      return new Blob([wavBuffer], { type: "audio/wav" });
    } catch (error) {
      console.error("Audio preprocessing failed:", error);
      return audio; // Return original audio if processing fails
    }
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numSamples = buffer.length;
    const bytesPerSample = 2; // 16-bit

    const dataSize = numChannels * numSamples * bytesPerSample;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    this.writeWavHeader(
      view,
      numChannels,
      sampleRate,
      bytesPerSample,
      dataSize
    );

    // Write audio data
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        // Convert float [-1.0, 1.0] to 16-bit PCM [-32768, 32767]
        const pcmValue = Math.max(-1, Math.min(1, sample));
        const pcmInt = pcmValue < 0 ? pcmValue * 32768 : pcmValue * 32767;
        view.setInt16(offset, pcmInt, true);
        offset += bytesPerSample;
      }
    }

    return arrayBuffer;
  }

  /**
   * Write WAV header to a DataView
   */
  private writeWavHeader(
    view: DataView,
    numChannels: number,
    sampleRate: number,
    bytesPerSample: number,
    dataSize: number
  ): void {
    // RIFF chunk descriptor
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, "WAVE");

    // fmt sub-chunk
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // fmt chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // Byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // Block align
    view.setUint16(34, bytesPerSample * 8, true); // Bits per sample

    // data sub-chunk
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
  }

  /**
   * Helper to write a string to a DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Transcribe audio using the OpenAI API
   */
  private async transcribeWithOpenAI(
    audio: Blob,
    language: GhanaianLanguage,
    prompt?: string
  ): Promise<WhisperResponse> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is required for online transcription");
    }

    const formData = new FormData();
    formData.append("file", audio, "audio.webm");
    formData.append("model", "whisper-1");

    // Add language code if available
    if (WHISPER_LANGUAGE_CODES[language]) {
      formData.append("language", WHISPER_LANGUAGE_CODES[language]);
    }

    // Add prompt if available
    if (prompt) {
      formData.append("prompt", prompt);
    }

    // Call OpenAI API
    const response = await httpClient.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    // Parse and return response
    return {
      text: response.data.text,
      confidence: 0.95, // OpenAI API doesn't return confidence, so use a default
      language: WHISPER_LANGUAGE_CODES[language] || "en",
    };
  }

  /**
   * Transcribe audio using offline model with Transformers.js
   */
  private async transcribeOffline(
    audio: Blob,
    language: GhanaianLanguage,
    model: "tiny" | "base" | "small" | "medium",
    prompt?: string
  ): Promise<WhisperResponse> {
    try {
      if (!this.isOfflineAvailable) {
        throw new Error("Offline transcription is not available");
      }

      // Get model name for the requested language and model size
      const modelId =
        model === "medium" && language === "english"
          ? "Xenova/whisper-medium"
          : model === "small"
          ? "Xenova/whisper-small"
          : model === "base"
          ? "Xenova/whisper-base"
          : "Xenova/whisper-tiny";

      // Get or load the model
      const pipe = await this.getOrLoadModel(modelId);

      // Prepare audio data
      const audioArrayBuffer = await audio.arrayBuffer();
      const audioData = await this.prepareAudio(audioArrayBuffer);

      // Transcribe audio
      const result = await pipe(audioData, {
        language: WHISPER_LANGUAGE_CODES[language] || "en",
        task: "transcribe",
        initial_prompt: prompt || undefined,
      });

      // Create response
      const response: WhisperResponse = {
        text: result.text,
        confidence: result.confidence || 0.9,
        language: WHISPER_LANGUAGE_CODES[language] || "en",
        segments: result.chunks?.map((chunk: any) => ({
          text: chunk.text,
          start: chunk.timestamp[0],
          end: chunk.timestamp[1],
          confidence: chunk.confidence || 0.9,
        })),
      };

      return response;
    } catch (error: any) {
      console.error("Offline transcription failed:", error);

      // Fallback to web speech API or placeholder
      return this.fallbackWebSpeechRecognition(audio, language);
    }
  }

  /**
   * Fallback to Web Speech API when offline models aren't available
   */
  private async fallbackWebSpeechRecognition(
    audio: Blob,
    language: GhanaianLanguage
  ): Promise<WhisperResponse> {
    return new Promise((resolve, reject) => {
      // Check if Web Speech API is available
      if (
        !("webkitSpeechRecognition" in window) &&
        !("SpeechRecognition" in window)
      ) {
        resolve({
          text: "[Speech recognition is not supported in this browser. Please try in Chrome or install required models.]",
          confidence: 0,
          language: WHISPER_LANGUAGE_CODES[language] || "en",
        });
        return;
      }

      // Create a placeholder response with a message for the user
      resolve({
        text: "[Speech recognition unavailable offline. Please connect to the internet or install required models.]",
        confidence: 0,
        language: WHISPER_LANGUAGE_CODES[language] || "en",
      });

      // In a real implementation, we would:
      // 1. Use a MediaSource to play the audio blob
      // 2. Initialize SpeechRecognition to listen to it
      // 3. Return the transcription
    });
  }

  /**
   * Load or retrieve an offline Whisper model
   */
  private async getOrLoadModel(modelName: string): Promise<any> {
    if (!this.isOfflineAvailable) {
      throw new Error("Offline models are not available");
    }

    // Check if model is already loaded
    if (this.localModels.has(modelName)) {
      return this.localModels.get(modelName);
    }

    // Check if model is being loaded
    if (this.isModelLoading[modelName]) {
      // Wait for model to be loaded (poll every 100ms)
      while (this.isModelLoading[modelName]) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.localModels.get(modelName);
    }

    // Mark model as loading
    this.isModelLoading[modelName] = true;

    try {
      // Load model
      const pipe = await pipeline("automatic-speech-recognition", modelName);

      // Store model
      this.localModels.set(modelName, pipe);

      return pipe;
    } finally {
      // Mark model as no longer loading
      this.isModelLoading[modelName] = false;
    }
  }

  /**
   * Prepare audio for Whisper (convert to correct format and sampling rate)
   */
  private async prepareAudio(audioBuffer: ArrayBuffer): Promise<Float32Array> {
    if (!this.audioContext) {
      // Basic conversion without resampling
      return new Float32Array(audioBuffer);
    }

    try {
      // Decode audio data
      const audioData = await this.audioContext.decodeAudioData(audioBuffer);

      // Whisper expects 16kHz audio
      const targetSampleRate = 16000;

      if (audioData.sampleRate === targetSampleRate) {
        // No resampling needed
        return audioData.getChannelData(0);
      }

      // Create offline context for resampling
      const offlineContext = new OfflineAudioContext(
        1,
        Math.ceil((audioData.length * targetSampleRate) / audioData.sampleRate),
        targetSampleRate
      );

      // Create buffer source
      const source = offlineContext.createBufferSource();
      source.buffer = audioData;
      source.connect(offlineContext.destination);
      source.start();

      // Start rendering
      const renderedBuffer = await offlineContext.startRendering();

      // Return resampled audio
      return renderedBuffer.getChannelData(0);
    } catch (error) {
      console.error("Audio preparation failed:", error);
      return new Float32Array(audioBuffer);
    }
  }

  /**
   * Check if a specific language model is available offline
   */
  async isLanguageModelAvailable(language: GhanaianLanguage): Promise<boolean> {
    if (!this.isOfflineAvailable) {
      return false;
    }

    const modelName = this.offlineModels[language];
    return this.localModels.has(modelName);
  }

  /**
   * Download an offline model for a specific language
   */
  async downloadLanguageModel(language: GhanaianLanguage): Promise<boolean> {
    if (!this.isOfflineAvailable) {
      return false;
    }

    try {
      const modelName = this.offlineModels[language];
      await this.getOrLoadModel(modelName);
      return true;
    } catch (error) {
      console.error(`Failed to download model for ${language}:`, error);
      return false;
    }
  }

  /**
   * Set API key for the service
   */
  setAPIKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<WhisperConfig>): void {
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
    }

    if (config.defaultModel !== undefined) {
      this.defaultModel = config.defaultModel;
    }

    if (config.offlineModels !== undefined) {
      this.offlineModels = {
        ...this.offlineModels,
        ...config.offlineModels,
      };
    }

    if (config.enableAudioPreprocessing !== undefined) {
      this.enableAudioPreprocessing = config.enableAudioPreprocessing;
    }
  }
}

// Create a singleton instance
export const whisperService = new WhisperService();
