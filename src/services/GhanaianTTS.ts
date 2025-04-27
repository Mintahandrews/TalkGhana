import { GhanaianLanguage } from "../context/LanguageContext";

/**
 * Class to handle improved text-to-speech for Ghanaian languages
 */
export class GhanaianTTS {
  private static instance: GhanaianTTS;
  private audioContext: AudioContext | null = null;
  private cachedAudio: Map<string, ArrayBuffer> = new Map();
  private language: GhanaianLanguage = "english";
  private apiUrl: string = "/api/synthesize";

  // Phonetic transcription maps for better pronunciation
  private phoneticMappings: Record<GhanaianLanguage, Record<string, string>> = {
    twi: {
      // Twi phonetic replacements (Akan)
      ɛ: "eh", // Open e
      ɔ: "aw", // Open o
      ŋ: "ng", // Velar nasal
      ɲ: "ny", // Palatal nasal
      kw: "qu", // Labialised velar
      hw: "wh", // Labialised glottal
      hy: "sh", // Labialised palatal
      // Common words with better pronunciation
      akwaaba: "a-kwa-'a-ba", // Welcome
      medaase: "me-da-'a-se", // Thank you
    },
    ga: {
      // Ga phonetic replacements
      ɛ: "eh", // Open e
      ɔ: "aw", // Open o
      ŋ: "ng", // Velar nasal
      dz: "j", // Affricate
      ts: "ch", // Affricate
      kp: "kp", // Double consonant
      gb: "gb", // Double consonant
      // Common words with better pronunciation
      ogekoo: "o-ge-'koo", // Welcome
      oyiwaladon: "o-yi-wa-la-'don", // Thank you
    },
    ewe: {
      // Ewe phonetic replacements
      ɛ: "eh", // Open e
      ɔ: "aw", // Open o
      ɖ: "d", // Retroflex d
      ƒ: "f", // Bilabial f
      ŋ: "ng", // Velar nasal
      x: "h", // Velar fricative
      // Common words with better pronunciation
      woezɔ: "woe-'zɔ", // Welcome
      akpe: "a-'kpe", // Thank you
    },
    hausa: {
      // Hausa phonetic replacements
      ɓ: "b'", // Implosive b
      ɗ: "d'", // Implosive d
      ƙ: "k'", // Implosive k
      ts: "ch", // Affricate
      ƴ: "y'", // Implosive y
      ʼy: "y", // Glottalized y
      // Common words with better pronunciation
      sannu: "'san-nu", // Hello
      nagode: "na-'go-de", // Thank you
    },
    dagbani: {
      // Dagbani phonetic replacements
      ɛ: "eh", // Open e
      ɔ: "aw", // Open o
      ŋ: "ng", // Velar nasal
      ɣ: "gh", // Voiced velar fricative
      ʒ: "zh", // Voiced palatal fricative
      // Common words with better pronunciation
      mpagya: "m-pa-'gya", // Welcome
      npuhimiya: "n-pu-hi-'mi-ya", // Thank you
    },
    english: {}, // No replacements needed for English
  };

  // Mapping of languages to optimal pitch values
  private pitchValues: Record<GhanaianLanguage, number> = {
    twi: 1.1, // Slightly higher pitch helps with tone
    ga: 1.05, // A bit higher for Ga
    ewe: 1.1, // Higher pitch for Ewe tones
    hausa: 1.15, // Higher pitch for Hausa tones
    english: 1.0, // Default pitch for English
    dagbani: 1.05,
  };

  // Mapping to optimal speech rate values
  private rateValues: Record<GhanaianLanguage, number> = {
    twi: 0.9, // Slightly slower for better comprehension
    ga: 0.9, // Slightly slower for better comprehension
    ewe: 0.85, // Slower for Ewe
    hausa: 0.9, // Slightly slower for Hausa
    english: 1.0, // Default rate for English
    dagbani: 0.9,
  };

  private constructor() {
    // Initialize AudioContext if available
    try {
      if (typeof window !== "undefined" && window.AudioContext) {
        this.audioContext = new window.AudioContext();
      }
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
    }

    // Load cached audio from localStorage
    this.loadCache();
  }

  // Singleton pattern
  public static getInstance(): GhanaianTTS {
    if (!GhanaianTTS.instance) {
      GhanaianTTS.instance = new GhanaianTTS();
    }
    return GhanaianTTS.instance;
  }

  // Set current language
  public setLanguage(language: GhanaianLanguage): void {
    this.language = language;
  }

  // Get current language
  public getLanguage(): GhanaianLanguage {
    return this.language;
  }

  // Apply phonetic replacements for better pronunciation
  private applyPhoneticRules(text: string, language: GhanaianLanguage): string {
    const mappings = this.phoneticMappings[language];
    if (!mappings || Object.keys(mappings).length === 0) {
      return text;
    }

    let processedText = text;

    // First check for whole word replacements
    const words = text.split(/\s+/);
    const replacedWords = words.map((word) => {
      const lowerWord = word.toLowerCase();
      return mappings[lowerWord] || word;
    });
    processedText = replacedWords.join(" ");

    // Then do character replacements
    Object.entries(mappings).forEach(([pattern, replacement]) => {
      // Skip whole words (already handled)
      if (pattern.includes(" ") || pattern.length > 3) return;

      // Replace the pattern globally
      processedText = processedText.replace(
        new RegExp(pattern, "g"),
        replacement
      );
    });

    return processedText;
  }

  // Get cache key for a text in a specific language
  private getCacheKey(text: string, language: GhanaianLanguage): string {
    return `${language}:${text}`;
  }

  // Load cached audio from localStorage
  private loadCache(): void {
    try {
      const cachedKeys = localStorage.getItem("ghanaian_tts_keys");
      if (cachedKeys) {
        const keys = JSON.parse(cachedKeys) as string[];

        keys.forEach((key) => {
          const audioData = localStorage.getItem(`ghanaian_tts_${key}`);
          if (audioData) {
            // Convert Base64 to ArrayBuffer
            const binaryString = window.atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            this.cachedAudio.set(key, bytes.buffer);
          }
        });
      }
    } catch (error) {
      console.error("Failed to load cached audio:", error);
    }
  }

  // Save audio to cache
  private saveToCache(
    text: string,
    language: GhanaianLanguage,
    audio: ArrayBuffer
  ): void {
    try {
      const key = this.getCacheKey(text, language);

      // Only cache shorter phrases
      if (text.length > 100) return;

      this.cachedAudio.set(key, audio);

      // Get the current list of keys
      let keys: string[] = [];
      try {
        const cachedKeys = localStorage.getItem("ghanaian_tts_keys");
        if (cachedKeys) {
          keys = JSON.parse(cachedKeys);
        }
      } catch (e) {
        // Start fresh if corrupt
        keys = [];
      }

      // Add our key if not present
      if (!keys.includes(key)) {
        keys.push(key);
        // Limit cache size
        if (keys.length > 50) {
          const removedKey = keys.shift();
          if (removedKey) {
            localStorage.removeItem(`ghanaian_tts_${removedKey}`);
          }
        }
        localStorage.setItem("ghanaian_tts_keys", JSON.stringify(keys));
      }

      // Store the audio data
      // Convert ArrayBuffer to Base64
      const bytes = new Uint8Array(audio);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = window.btoa(binary);

      localStorage.setItem(`ghanaian_tts_${key}`, base64);
    } catch (error) {
      console.error("Failed to cache audio:", error);
    }
  }

  // Check if we have cached audio for this text
  public hasCache(text: string, language: GhanaianLanguage): boolean {
    const key = this.getCacheKey(text, language);
    return this.cachedAudio.has(key);
  }

  // Get cached audio if available
  public getCachedAudio(
    text: string,
    language: GhanaianLanguage
  ): ArrayBuffer | null {
    const key = this.getCacheKey(text, language);
    return this.cachedAudio.get(key) || null;
  }

  // Play audio from an ArrayBuffer
  public async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch (error) {
        throw new Error(`Could not create AudioContext: ${error}`);
      }
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      return new Promise((resolve, reject) => {
        source.onended = () => resolve();

        // Add proper error handling without using the non-existent onerror
        // Handle potential errors by setting up one-time error event on the audio context
        const errorHandler = () => {
          this.audioContext?.removeEventListener("error", errorHandler);
          reject(new Error("Audio playback error"));
        };

        this.audioContext?.addEventListener("error", errorHandler, {
          once: true,
        });

        // Start playback
        source.start(0);
      });
    } catch (error) {
      throw new Error(`Failed to play audio: ${error}`);
    }
  }

  // Fetch synthesized speech from the server
  private async fetchSynthesizedSpeech(
    text: string,
    language: GhanaianLanguage,
    options: {
      rate?: number;
      pitch?: number;
      useGPT?: boolean;
      isComparison?: boolean;
    } = {}
  ): Promise<ArrayBuffer> {
    const useComparisonEndpoint = options.isComparison === true;
    const endpoint = useComparisonEndpoint
      ? "/api/compare-tts"
      : "/api/synthesize";

    // Process text with phonetic rules before sending to server
    const processedText = this.applyPhoneticRules(text, language);

    // Create request parameters with appropriate options
    const requestParams = {
      text: processedText,
      language,
      speed: options.rate || this.rateValues[language],
      pitch: options.pitch || this.pitchValues[language],
      useGPT: options.useGPT !== undefined ? options.useGPT : true,
      format: "mp3",
    };

    try {
      // Fetch the audio data from the server
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch speech: ${response.status} ${response.statusText}`
        );
      }

      // Convert the response to ArrayBuffer
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error fetching synthesized speech:", error);
      throw error;
    }
  }

  // Main method to speak text
  public async speak(
    text: string,
    options: {
      language?: GhanaianLanguage;
      rate?: number;
      pitch?: number;
      useCache?: boolean;
      useGPT?: boolean;
      isComparison?: boolean;
    } = {}
  ): Promise<void> {
    const language = options.language || this.language;
    const useCache = options.useCache !== false;

    // Check if the text is in the cache
    const cacheKey = this.getCacheKey(text, language);
    if (useCache && this.cachedAudio.has(cacheKey) && !options.isComparison) {
      const cachedData = this.cachedAudio.get(cacheKey);
      if (cachedData) {
        await this.playAudio(cachedData);
        return;
      }
    }

    try {
      // Fetch the audio from the server
      const audioData = await this.fetchSynthesizedSpeech(text, language, {
        rate: options.rate,
        pitch: options.pitch,
        useGPT: options.useGPT,
        isComparison: options.isComparison,
      });

      // Save to cache if not a comparison (which may have different settings)
      if (useCache && !options.isComparison) {
        this.saveToCache(text, language, audioData);
      }

      // Play the audio
      await this.playAudio(audioData);
    } catch (error) {
      console.error("Failed to speak:", error);
      throw error;
    }
  }

  // Submit feedback about speech quality
  public async submitFeedback(
    text: string,
    language: GhanaianLanguage,
    rating: number,
    options: {
      useGPT?: boolean;
      comments?: string;
    } = {}
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/speech-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language,
          rating,
          useGPT: options.useGPT !== undefined ? options.useGPT : true,
          comments: options.comments || "",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to submit feedback: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      return result.status === "success";
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return false;
    }
  }

  // Preload phrases for faster playback later
  public async preloadPhrases(
    phrases: string[],
    language: GhanaianLanguage
  ): Promise<void> {
    // Filter to phrases we don't already have cached
    const phrasesToLoad = phrases.filter(
      (phrase) => !this.hasCache(phrase, language)
    );

    if (phrasesToLoad.length === 0) return;

    // Batch the preloading in groups to avoid overwhelming the network
    const batchSize = 3;
    for (let i = 0; i < phrasesToLoad.length; i += batchSize) {
      const batch = phrasesToLoad.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (phrase) => {
          try {
            const audioData = await this.fetchSynthesizedSpeech(
              phrase,
              language
            );
            this.saveToCache(phrase, language, audioData);
          } catch (error) {
            console.error(`Failed to preload phrase: ${phrase}`, error);
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < phrasesToLoad.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
}

// Export a singleton instance
export default GhanaianTTS.getInstance();
