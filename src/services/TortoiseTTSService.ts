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

class TortoiseTTSService {
  private static instance: TortoiseTTSService;
  private isInitialized: boolean = false;
  private worker: Worker | null = null;

  private constructor() {}

  static getInstance(): TortoiseTTSService {
    if (!TortoiseTTSService.instance) {
      TortoiseTTSService.instance = new TortoiseTTSService();
    }
    return TortoiseTTSService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Tortoise-TTS worker
      this.worker = new Worker(
        new URL("../workers/tortoise-tts.worker.ts", import.meta.url),
        { type: "module" }
      );

      // Set up message handling
      this.worker.onmessage = (event) => {
        const { type, data } = event.data;
        switch (type) {
          case "initialized":
            this.isInitialized = true;
            break;
          case "error":
            console.error("Tortoise-TTS error:", data);
            break;
          case "progress":
            // Handle progress updates
            break;
        }
      };

      // Wait for initialization
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Tortoise-TTS initialization timeout"));
        }, 30000);

        this.worker!.onmessage = (event) => {
          if (event.data.type === "initialized") {
            clearTimeout(timeout);
            resolve();
          }
        };
      });
    } catch (error) {
      console.error("Failed to initialize Tortoise-TTS:", error);
      throw error;
    }
  }

  async generateSpeech(
    text: string,
    config: Partial<TortoiseTTSConfig> = {}
  ): Promise<ArrayBuffer> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const defaultConfig: TortoiseTTSConfig = {
      language: "english",
      voice: "default",
      preset: "standard",
      numSamples: 1,
      numAutoregressiveSamples: 16,
      temperature: 0.7,
      lengthPenalty: 1.0,
      repetitionPenalty: 1.0,
      topK: 50,
      topP: 0.95,
    };

    const finalConfig = { ...defaultConfig, ...config };

    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        const { type, data } = event.data;
        if (type === "speech") {
          this.worker!.removeEventListener("message", messageHandler);
          resolve(data.audio);
        } else if (type === "error") {
          this.worker!.removeEventListener("message", messageHandler);
          reject(new Error(data.message));
        }
      };

      this.worker!.addEventListener("message", messageHandler);
      this.worker!.postMessage({
        type: "generate",
        text,
        config: finalConfig,
      });
    });
  }

  async loadVoice(language: GhanaianLanguage, voiceId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        const { type, data } = event.data;
        if (type === "voice_loaded") {
          this.worker!.removeEventListener("message", messageHandler);
          resolve();
        } else if (type === "error") {
          this.worker!.removeEventListener("message", messageHandler);
          reject(new Error(data.message));
        }
      };

      this.worker!.addEventListener("message", messageHandler);
      this.worker!.postMessage({
        type: "load_voice",
        language,
        voiceId,
      });
    });
  }

  async cloneVoice(
    audioClips: ArrayBuffer[],
    language: GhanaianLanguage
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        const { type, data } = event.data;
        if (type === "voice_cloned") {
          this.worker!.removeEventListener("message", messageHandler);
          resolve(data.voiceId);
        } else if (type === "error") {
          this.worker!.removeEventListener("message", messageHandler);
          reject(new Error(data.message));
        }
      };

      this.worker!.addEventListener("message", messageHandler);
      this.worker!.postMessage({
        type: "clone_voice",
        audioClips,
        language,
      });
    });
  }

  async stop(): Promise<void> {
    if (this.worker) {
      this.worker.postMessage({ type: "stop" });
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

export const tortoiseTTSService = TortoiseTTSService.getInstance();
