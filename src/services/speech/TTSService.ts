import { GhanaianLanguage } from "../../types";
import { httpClient } from "../../utils/httpClient";

interface TTSRequest {
  text: string;
  language: GhanaianLanguage;
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

interface TTSConfig {
  apiKey?: string;
  defaultVoices?: Partial<Record<GhanaianLanguage, string>>;
  enableOfflineMode?: boolean;
  cacheAudio?: boolean;
  remoteTTSEndpoint?: string;
}

interface CachedAudio {
  text: string;
  language: GhanaianLanguage;
  blob: Blob;
  timestamp: number;
}

// Map of default voices for each Ghanaian language
const DEFAULT_VOICES: Record<GhanaianLanguage, string> = {
  twi: "female-1", // Default Twi voice
  ga: "female-1", // Default Ga voice
  ewe: "female-1", // Default Ewe voice
  dagbani: "female-1", // Default Dagbani voice
  hausa: "female-1", // Default Hausa voice
  english: "en-US-Standard-F", // Default English voice for Ghana
};

// Maximum cache size and expiration
const MAX_CACHE_SIZE = 50; // Maximum number of cached audio items
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export class TTSService {
  private apiKey?: string;
  private defaultVoices: Record<GhanaianLanguage, string>;
  private cache: CachedAudio[] = [];
  private enableOfflineMode: boolean;
  private cacheAudio: boolean;
  private remoteTTSEndpoint: string;
  private audioElement: HTMLAudioElement | null = null;

  constructor(config?: TTSConfig) {
    // Use import.meta.env for Vite environment variables or fallback to defaults
    this.apiKey =
      config?.apiKey ||
      (import.meta.env.VITE_HUGGINGFACE_API_KEY as string) ||
      "";
    this.defaultVoices = {
      ...DEFAULT_VOICES,
      ...(config?.defaultVoices || {}),
    };
    this.enableOfflineMode =
      config?.enableOfflineMode ||
      import.meta.env.VITE_ENABLE_OFFLINE_MODE === "true" ||
      true;
    this.cacheAudio =
      config?.cacheAudio !== false &&
      import.meta.env.VITE_CACHE_AUDIO !== "false"; // Default to true

    // Use a default endpoint if not provided
    const apiUrl =
      (import.meta.env.VITE_API_URL as string) || "http://localhost:5002/api";
    this.remoteTTSEndpoint = config?.remoteTTSEndpoint || `${apiUrl}/tts`;

    // Initialize audio element
    if (typeof window !== "undefined") {
      this.audioElement = new Audio();
    }

    // Load cache from localStorage
    this.loadCacheFromStorage();
  }

  /**
   * Load cached audio from localStorage
   */
  private loadCacheFromStorage(): void {
    if (!this.cacheAudio || typeof localStorage === "undefined") return;

    try {
      const cachedData = localStorage.getItem("ttsAudioCache");
      if (cachedData) {
        // Note: Blobs can't be serialized, so cached entries without blobs
        // will need to be re-fetched
        this.cache = JSON.parse(cachedData);
      }
    } catch (error) {
      console.error("Failed to load TTS audio cache:", error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    if (
      !this.cacheAudio ||
      typeof localStorage === "undefined" ||
      this.cache.length === 0
    )
      return;

    try {
      const serializedCache = JSON.stringify(
        this.cache.map(({ text, language, timestamp }) => ({
          text,
          language,
          timestamp,
          // Blobs cannot be serialized, so we exclude them here
        }))
      );
      localStorage.setItem("ttsAudioCache", serializedCache);
    } catch (error) {
      console.error("Failed to save TTS audio cache:", error);
    }
  }

  /**
   * Get cached audio if available
   */
  private getCachedAudio(
    text: string,
    language: GhanaianLanguage
  ): Blob | null {
    if (!this.cacheAudio) return null;

    const cachedItem = this.cache.find(
      (item) => item.text === text && item.language === language && item.blob
    );

    if (cachedItem && cachedItem.blob) {
      // Update timestamp to mark as recently used
      this.updateCacheTimestamp(text, language);
      return cachedItem.blob;
    }

    return null;
  }

  /**
   * Add audio to cache
   */
  private addToCache(
    text: string,
    language: GhanaianLanguage,
    blob: Blob
  ): void {
    if (!this.cacheAudio) return;

    // Remove expired items
    const now = Date.now();
    this.cache = this.cache.filter(
      (item) => now - item.timestamp < CACHE_EXPIRY
    );

    // Add new item
    this.cache = [
      { text, language, blob, timestamp: now },
      ...this.cache.filter(
        (item) => !(item.text === text && item.language === language)
      ),
    ];

    // Limit cache size
    if (this.cache.length > MAX_CACHE_SIZE) {
      this.cache = this.cache.slice(0, MAX_CACHE_SIZE);
    }

    // Save to localStorage
    this.saveCacheToStorage();
  }

  /**
   * Update timestamp for a cached item
   */
  private updateCacheTimestamp(text: string, language: GhanaianLanguage): void {
    this.cache = this.cache.map((item) =>
      item.text === text && item.language === language
        ? { ...item, timestamp: Date.now() }
        : item
    );

    // Save to localStorage
    this.saveCacheToStorage();
  }

  /**
   * Convert text to speech using remote API or local fallback
   */
  async speak(request: TTSRequest): Promise<boolean> {
    const { text, language, voice, pitch = 1, rate = 1, volume = 1 } = request;

    if (!text) return false;

    try {
      // Check if audio is cached
      const cachedAudioBlob = this.getCachedAudio(text, language);

      if (cachedAudioBlob) {
        return this.playAudioBlob(cachedAudioBlob, rate, volume);
      }

      // If offline and no cached version, try using Web Speech API
      if (!navigator.onLine && !cachedAudioBlob) {
        if (this.enableOfflineMode) {
          return this.speakWithWebSpeech(text, language, pitch, rate, volume);
        } else {
          throw new Error("Device is offline and no cached audio available");
        }
      }

      // Use remote TTS API
      const audioBlob = await this.fetchAudioFromAPI(
        text,
        language,
        voice,
        pitch,
        rate,
        volume
      );

      // Cache the audio for future use
      this.addToCache(text, language, audioBlob);

      // Play the audio
      return this.playAudioBlob(audioBlob, rate, volume);
    } catch (error) {
      console.error("TTS error:", error);

      // Fallback to Web Speech API if remote fails
      return this.speakWithWebSpeech(text, language, pitch, rate, volume);
    }
  }

  /**
   * Fetch audio from remote TTS API
   */
  private async fetchAudioFromAPI(
    text: string,
    language: GhanaianLanguage,
    voice?: string,
    pitch: number = 1,
    rate: number = 1,
    volume: number = 1
  ): Promise<Blob> {
    // Prepare request data
    const requestData: TTSRequest = {
      text,
      language,
      voice: voice || this.defaultVoices[language],
      pitch,
      rate,
      volume,
    };

    // Add API key if available
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      // Call remote TTS API
      const response = await httpClient.post(
        this.remoteTTSEndpoint,
        requestData,
        { headers }
      );

      // For test server that returns JSON instead of a blob
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.success
      ) {
        console.log("Mock TTS response received:", response.data);

        // Create a mock audio blob with silence for testing
        return new Blob(
          [
            new Uint8Array([
              255, 227, 24, 196, 0, 0, 0, 3, 72, 0, 0, 0, 0, 76, 65, 77, 69,
            ]),
          ],
          { type: "audio/mpeg" }
        );
      }

      // Real API would return a blob
      return response.data;
    } catch (error) {
      console.error("Error fetching audio:", error);
      throw new Error(`Failed to fetch audio: ${(error as Error).message}`);
    }
  }

  /**
   * Play audio blob with the specified parameters
   */
  private playAudioBlob(
    blob: Blob,
    rate: number = 1,
    volume: number = 1
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.audioElement) {
        reject(new Error("Audio element not available"));
        return;
      }

      // Stop any currently playing audio
      this.stop();

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Set up audio element
      this.audioElement.src = url;
      this.audioElement.playbackRate = rate;
      this.audioElement.volume = volume;

      // Set up event handlers
      this.audioElement.onplay = () => resolve(true);
      this.audioElement.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback error"));
      };
      this.audioElement.onended = () => {
        URL.revokeObjectURL(url);
      };

      // Play the audio
      this.audioElement.play().catch((err) => {
        URL.revokeObjectURL(url);
        reject(err);
      });
    });
  }

  /**
   * Use Web Speech API as fallback
   */
  private speakWithWebSpeech(
    text: string,
    language: GhanaianLanguage,
    pitch: number = 1,
    rate: number = 1,
    volume: number = 1
  ): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    try {
      // Stop any current speech
      window.speechSynthesis.cancel();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Find appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = language === "english" ? "en" : language;
      const voice = voices.find((v) => v.lang.startsWith(langPrefix));

      if (voice) {
        utterance.voice = voice;
      }

      // Set parameters
      utterance.lang = language === "english" ? "en-US" : `${language}-GH`;
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = volume;

      // Speak
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      console.error("Web Speech API error:", error);
      return false;
    }
  }

  /**
   * Stop any currently playing speech
   */
  stop(): void {
    // Stop Web Speech API
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Stop audio element
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  /**
   * Check if a voice is available for a specific language
   */
  isVoiceAvailable(language: GhanaianLanguage): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = language === "english" ? "en" : language;
    return voices.some((voice) => voice.lang.startsWith(langPrefix));
  }

  /**
   * Pre-cache common phrases for offline use
   */
  async preloadCommonPhrases(
    phrases: string[],
    language: GhanaianLanguage
  ): Promise<number> {
    if (!navigator.onLine || !this.cacheAudio) return 0;

    let successCount = 0;

    for (const phrase of phrases) {
      try {
        // Skip if already cached
        if (this.getCachedAudio(phrase, language)) {
          successCount++;
          continue;
        }

        // Fetch and cache
        const audioBlob = await this.fetchAudioFromAPI(phrase, language);
        this.addToCache(phrase, language, audioBlob);
        successCount++;
      } catch (error) {
        console.error(`Failed to preload phrase: "${phrase}"`, error);
      }
    }

    return successCount;
  }

  /**
   * Get a list of all available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return [];
    }

    return window.speechSynthesis.getVoices();
  }

  /**
   * Set API key for the service
   */
  setAPIKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log("TTSService API key updated");
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }

    if (config.defaultVoices) {
      this.defaultVoices = { ...this.defaultVoices, ...config.defaultVoices };
    }

    if (config.remoteTTSEndpoint) {
      this.remoteTTSEndpoint = config.remoteTTSEndpoint;
    }

    if (config.enableOfflineMode !== undefined) {
      this.enableOfflineMode = config.enableOfflineMode;
    }

    if (config.cacheAudio !== undefined) {
      this.cacheAudio = config.cacheAudio;
    }

    console.log("TTSService configuration updated");
  }
}

// Create a singleton instance
export const ttsService = new TTSService();
