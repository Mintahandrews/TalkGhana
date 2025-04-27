import { GhanaianLanguage } from "./LanguageService";

interface TortoiseTTSConfig {
  language: GhanaianLanguage;
  voice: string;
  preset: "fast" | "standard" | "high_quality";
  numSamples: number;
  numAutoregressiveSamples: number;
  temperature: number;
  lengthPenalty: number;
  repetitionPenalty: number;
  topK: number;
  topP: number;
}

// To be loaded from worker
interface TortoiseTTSModel {
  generate: (text: string, config: any) => Promise<Float32Array>;
  getAudioSampleRate: () => number;
}

/**
 * TortoiseTTSService for high-quality Ghanaian TTS
 *
 * This service implements TortoiseTTS, a high-quality neural
 * text-to-speech model capable of realistic voice synthesis
 * for Ghanaian languages with proper tones and accents.
 */
class TortoiseTTSService {
  private static instance: TortoiseTTSService;
  private isInitialized: boolean = false;
  private availableVoices: Map<string, boolean> = new Map();
  private workerInstance: Worker | null = null;
  private modelInstances: Map<string, TortoiseTTSModel> = new Map();
  private pendingRequests: Map<
    string,
    { resolve: Function; reject: Function }
  > = new Map();
  private audioContext: AudioContext | null = null;
  private requestCounter: number = 0;
  private voiceCache: Map<string, ArrayBuffer> = new Map();

  private constructor() {
    this.initializeWorkerIfSupported();

    try {
      if (typeof window !== "undefined" && window.AudioContext) {
        this.audioContext = new window.AudioContext();
      }
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
    }

    // Initialize available voices with basic set
    this.availableVoices.set("english-default", false);
    this.availableVoices.set("twi-default", false);
    this.availableVoices.set("ga-default", false);
    this.availableVoices.set("ewe-default", false);
    this.availableVoices.set("hausa-default", false);

    // Try to load cached voices from local storage
    this.loadVoiceCache();
  }

  static getInstance(): TortoiseTTSService {
    if (!TortoiseTTSService.instance) {
      TortoiseTTSService.instance = new TortoiseTTSService();
    }
    return TortoiseTTSService.instance;
  }

  /**
   * Initialize the Web Worker for TortoiseTTS if supported
   */
  private initializeWorkerIfSupported(): void {
    if (typeof Worker !== "undefined") {
      try {
        // Create a worker for TortoiseTTS processing
        this.workerInstance = new Worker(
          new URL("../workers/tortoise-tts.worker.ts", import.meta.url),
          { type: "module" }
        );

        // Set up message handler
        this.workerInstance.onmessage = this.handleWorkerMessage.bind(this);
        this.workerInstance.onerror = this.handleWorkerError.bind(this);
      } catch (error) {
        console.error("Failed to initialize TortoiseTTS worker:", error);
        this.workerInstance = null;
      }
    }
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const { id, type, data, error } = event.data;

    // Find the pending request
    const pendingRequest = this.pendingRequests.get(id);
    if (!pendingRequest) {
      console.warn(`Received message for unknown request: ${id}`);
      return;
    }

    // Handle the response based on type
    if (type === "error") {
      pendingRequest.reject(new Error(error || "Unknown error"));
    } else if (type === "initialize") {
      this.isInitialized = true;
      pendingRequest.resolve(true);
    } else if (type === "generate") {
      pendingRequest.resolve(data);
    } else if (type === "loadVoice") {
      const voiceKey = data.voiceKey;
      this.availableVoices.set(voiceKey, true);
      pendingRequest.resolve(true);
    } else if (type === "cloneVoice") {
      const voiceId = data.voiceId;
      const voiceKey = `${data.language}-${voiceId}`;
      this.availableVoices.set(voiceKey, true);
      pendingRequest.resolve(voiceId);
    }

    // Remove the pending request
    this.pendingRequests.delete(id);
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error("TortoiseTTS worker error:", error);

    // Reject all pending requests
    this.pendingRequests.forEach((request) => {
      request.reject(new Error("Worker error: " + error.message));
    });

    // Clear pending requests
    this.pendingRequests.clear();
  }

  /**
   * Send a message to the worker and wait for the response
   */
  private async sendToWorker(type: string, data: any): Promise<any> {
    if (!this.workerInstance) {
      // Fall back to mock implementation if worker is not available
      return this.mockImplementation(type, data);
    }

    // Generate a unique ID for this request
    const id = `${type}-${this.requestCounter++}-${Date.now()}`;

    // Create a promise that will be resolved when the worker responds
    const promise = new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
    });

    // Send the message to the worker
    this.workerInstance.postMessage({ id, type, data });

    // Set a timeout to reject the promise after 30 seconds
    const timeoutId = setTimeout(() => {
      if (this.pendingRequests.has(id)) {
        this.pendingRequests
          .get(id)
          ?.reject(new Error(`Request ${id} timed out`));
        this.pendingRequests.delete(id);
      }
    }, 30000);

    try {
      // Wait for the response
      const result = await promise;
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Mock implementation for when the worker is not available
   */
  private mockImplementation(type: string, data: any): Promise<any> {
    console.log(`TortoiseTTSService: Mock ${type} for ${JSON.stringify(data)}`);

    switch (type) {
      case "initialize":
        this.isInitialized = true;
        return Promise.resolve(true);

      case "generate":
        // Create a tiny mock audio buffer (1 second of silence)
        const sampleRate = 22050;
        const numSamples = sampleRate * 1; // 1 second
        const buffer = new ArrayBuffer(numSamples * 2); // 16-bit samples
        const view = new Int16Array(buffer);

        // Generate silence with a few random samples to simulate some audio
        for (let i = 0; i < numSamples; i++) {
          if (i % 1000 === 0) {
            view[i] = Math.floor(Math.random() * 100); // Occasional tiny blip
          } else {
            view[i] = 0; // Silence
          }
        }

        // Return after a small delay to simulate processing
        return new Promise((resolve) => {
          setTimeout(() => resolve(buffer), 300);
        });

      case "loadVoice":
        const { language, voiceId } = data;
        const voiceKey = `${language}-${voiceId}`;
        this.availableVoices.set(voiceKey, true);
        return Promise.resolve(true);

      case "cloneVoice":
        const mockVoiceId = `cloned-${data.language}-${Date.now()}`;
        this.availableVoices.set(`${data.language}-${mockVoiceId}`, true);
        return Promise.resolve(mockVoiceId);

      default:
        return Promise.reject(new Error(`Unknown mock operation: ${type}`));
    }
  }

  /**
   * Initialize the TortoiseTTS service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    try {
      await this.sendToWorker("initialize", {});
      this.isInitialized = true;

      // Load default voices
      await this.loadDefaultVoices();

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to initialize TortoiseTTS:", error);
      // Fall back to mock implementation
      this.isInitialized = true;
      return Promise.resolve();
    }
  }

  /**
   * Load default voices for each language
   */
  private async loadDefaultVoices(): Promise<void> {
    const languages: GhanaianLanguage[] = [
      "english",
      "twi",
      "ga",
      "ewe",
      "hausa",
    ];

    // Load each language's default voice
    const promises = languages.map((language) =>
      this.loadVoice(language, "default").catch((error) =>
        console.warn(`Failed to load default voice for ${language}:`, error)
      )
    );

    await Promise.all(promises);
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(
    text: string,
    config: Partial<TortoiseTTSConfig> = {}
  ): Promise<ArrayBuffer> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Default configuration
    const defaultConfig: TortoiseTTSConfig = {
      language: "english",
      voice: "default",
      preset: "standard",
      numSamples: 1,
      numAutoregressiveSamples: 4,
      temperature: 0.8,
      lengthPenalty: 1.0,
      repetitionPenalty: 2.0,
      topK: 50,
      topP: 0.8,
    };

    // Merge with provided config
    const mergedConfig = { ...defaultConfig, ...config };

    // Get voice key and check if available
    const voiceKey = `${mergedConfig.language}-${mergedConfig.voice}`;
    if (!this.availableVoices.get(voiceKey)) {
      try {
        await this.loadVoice(mergedConfig.language, mergedConfig.voice);
      } catch (error) {
        console.error(`Failed to load voice ${voiceKey}:`, error);
        throw new Error(`Voice ${voiceKey} not available`);
      }
    }

    // Generate speech
    const audioData = await this.sendToWorker("generate", {
      text,
      voiceKey,
      config: mergedConfig,
    });

    // Apply audio processing if available
    if (this.audioContext) {
      return this.enhanceAudio(audioData);
    }

    return audioData;
  }

  /**
   * Enhance the generated audio for better quality
   */
  private async enhanceAudio(audioData: ArrayBuffer): Promise<ArrayBuffer> {
    if (!this.audioContext) {
      return audioData;
    }

    try {
      // Create a copy of the ArrayBuffer to prevent detachment issues
      const audioDataCopy = new ArrayBuffer(audioData.byteLength);
      new Uint8Array(audioDataCopy).set(new Uint8Array(audioData));

      // Decode audio data
      const decodedData = await this.audioContext.decodeAudioData(
        audioDataCopy
      );

      // Get audio channel data
      const inputChannel = decodedData.getChannelData(0);

      // Create a new buffer for processed audio
      const outputBuffer = this.audioContext.createBuffer(
        1,
        decodedData.length,
        decodedData.sampleRate
      );
      const outputChannel = outputBuffer.getChannelData(0);

      // Apply processing with error handling
      try {
        // 1. Apply a subtle dynamic range compression to improve clarity
        // Simple implementation of a soft-knee compressor
        const threshold = 0.5;
        const ratio = 3;
        const attack = 0.003;
        const release = 0.1;

        let envelope = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          // Calculate envelope (simplified)
          const inputAbs = Math.abs(inputChannel[i]);
          const attackOrRelease = inputAbs > envelope ? attack : release;
          envelope = envelope + (inputAbs - envelope) * attackOrRelease;

          // Apply compression
          let gain = 1.0;
          if (envelope > threshold) {
            const dbAbove = 20 * Math.log10(envelope / threshold);
            const dbReduction = dbAbove * (1 - 1 / ratio);
            gain = Math.pow(10, -dbReduction / 20);
          }

          outputChannel[i] = inputChannel[i] * gain;
        }

        // 2. Apply de-essing (reduce harshness in high frequencies)
        // This is a simplified version - a real implementation would use FFT
        const deEssingThreshold = 0.2;
        for (let i = 2; i < outputChannel.length - 2; i++) {
          // Simple high-frequency detection by looking at sample differences
          const highFreqValue =
            Math.abs(outputChannel[i] - outputChannel[i - 1]) +
            Math.abs(outputChannel[i] - outputChannel[i + 1]);

          if (highFreqValue > deEssingThreshold) {
            // Apply smoothing only to high-frequency components exceeding threshold
            outputChannel[i] =
              (outputChannel[i - 2] +
                outputChannel[i - 1] +
                outputChannel[i] +
                outputChannel[i + 1] +
                outputChannel[i + 2]) /
              5;
          }
        }

        // 3. Apply normalization to make it louder
        let maxValue = 0;
        for (let i = 0; i < outputChannel.length; i++) {
          maxValue = Math.max(maxValue, Math.abs(outputChannel[i]));
        }

        if (maxValue > 0 && maxValue < 0.8) {
          // Only normalize if not already loud enough
          const normalizationFactor = 0.9 / maxValue; // Target 90% of max volume
          for (let i = 0; i < outputChannel.length; i++) {
            outputChannel[i] *= normalizationFactor;
          }
        }
      } catch (processingError) {
        console.warn(
          "Audio processing failed, using unprocessed audio:",
          processingError
        );
        // Copy original data to output in case of processing error
        for (let i = 0; i < inputChannel.length; i++) {
          outputChannel[i] = inputChannel[i];
        }
      }

      // Convert processed audio back to ArrayBuffer using a safer approach
      try {
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

        // Convert to Wav format
        return this.audioBufferToWav(renderedBuffer);
      } catch (renderError) {
        console.warn("Failed to render processed audio:", renderError);
        // Fallback to direct WAV conversion of the output buffer
        return this.audioBufferToWav(outputBuffer);
      }
    } catch (error) {
      console.error("Audio enhancement failed:", error);
      // Return a copy of the original data to prevent detachment issues
      const fallbackCopy = new ArrayBuffer(audioData.byteLength);
      new Uint8Array(fallbackCopy).set(new Uint8Array(audioData));
      return fallbackCopy;
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
   * Load a voice for a specific language
   */
  async loadVoice(language: GhanaianLanguage, voiceId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const voiceKey = `${language}-${voiceId}`;

    // Check if voice is already loaded
    if (this.availableVoices.get(voiceKey)) {
      return Promise.resolve();
    }

    try {
      // Load the voice
      await this.sendToWorker("loadVoice", { language, voiceId });

      // Mark the voice as available
      this.availableVoices.set(voiceKey, true);

      return Promise.resolve();
    } catch (error) {
      console.error(`Failed to load voice ${voiceKey}:`, error);
      throw new Error(`Failed to load voice ${voiceKey}`);
    }
  }

  /**
   * Clone a voice from audio samples
   */
  async cloneVoice(
    audioClips: ArrayBuffer[],
    language: GhanaianLanguage
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Clone the voice
      const voiceId = await this.sendToWorker("cloneVoice", {
        audioClips,
        language,
      });

      // Mark the voice as available
      this.availableVoices.set(`${language}-${voiceId}`, true);

      return voiceId;
    } catch (error) {
      console.error(`Failed to clone voice for ${language}:`, error);
      throw new Error(`Failed to clone voice for ${language}`);
    }
  }

  /**
   * Get a list of available voices
   */
  getAvailableVoices(): string[] {
    return Array.from(this.availableVoices.entries())
      .filter(([, isAvailable]) => isAvailable)
      .map(([voiceKey]) => voiceKey);
  }

  /**
   * Save a voice to the cache
   */
  private saveVoiceToCache(voiceKey: string, voiceData: ArrayBuffer): void {
    try {
      // Don't cache if too large
      if (voiceData.byteLength > 5 * 1024 * 1024) {
        return;
      }

      this.voiceCache.set(voiceKey, voiceData);

      // Convert to base64 for storage
      const bytes = new Uint8Array(voiceData);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = window.btoa(binary);

      // Get current cache keys
      let cacheKeys: string[] = [];
      const storedKeys = localStorage.getItem("tortoise_voice_keys");
      if (storedKeys) {
        cacheKeys = JSON.parse(storedKeys);
      }

      // Add this key if not present
      if (!cacheKeys.includes(voiceKey)) {
        cacheKeys.push(voiceKey);
        localStorage.setItem("tortoise_voice_keys", JSON.stringify(cacheKeys));
      }

      // Store the voice data
      localStorage.setItem(`tortoise_voice_${voiceKey}`, base64);
    } catch (error) {
      console.warn("Failed to cache voice:", error);
    }
  }

  /**
   * Load cached voices from local storage
   */
  private loadVoiceCache(): void {
    try {
      const storedKeys = localStorage.getItem("tortoise_voice_keys");
      if (!storedKeys) return;

      const cacheKeys = JSON.parse(storedKeys) as string[];

      cacheKeys.forEach((voiceKey) => {
        const base64 = localStorage.getItem(`tortoise_voice_${voiceKey}`);
        if (base64) {
          // Convert base64 to ArrayBuffer
          const binaryString = window.atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Add to cache
          this.voiceCache.set(voiceKey, bytes.buffer);

          // Mark voice as available
          this.availableVoices.set(voiceKey, true);
        }
      });
    } catch (error) {
      console.warn("Failed to load voice cache:", error);
    }
  }

  /**
   * Stop any ongoing TTS processes
   */
  async stop(): Promise<void> {
    if (this.workerInstance) {
      try {
        await this.sendToWorker("stop", {});
      } catch (error) {
        console.warn("Failed to stop TortoiseTTS:", error);
      }
    }

    return Promise.resolve();
  }
}

export const tortoiseTTSService = TortoiseTTSService.getInstance();
