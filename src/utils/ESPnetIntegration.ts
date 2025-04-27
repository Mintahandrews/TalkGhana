/**
 * ESPnetIntegration.ts
 *
 * This utility manages the ESPnet integration for TalkGhana,
 * providing a clean interface for using ESPnet models for
 * speech recognition and text-to-speech capabilities.
 */

import { GhanaianLanguage } from "../types";

// Check if ESPnet integration is enabled in environment variables
const ESPNET_ENABLED = import.meta.env.VITE_ENABLE_ESPNET === "true";
const ESPNET_API_URL = import.meta.env.VITE_ESPNET_API_URL || "/api/espnet";

// Language model paths for each supported language
const ESPnetModelPaths = {
  asr: {
    english: "english",
    twi: "twi",
    ga: "ga",
    ewe: "ewe",
    hausa: "hausa",
  },
  tts: {
    english: "english",
    twi: "twi",
    ga: "ga",
    ewe: "ewe",
    hausa: "hausa",
  },
};

// Check if ESPnet is available for use
export const isESPnetAvailable = (): boolean => {
  return ESPNET_ENABLED;
};

// Interface for ESPnet TTS options
export interface ESPnetTTSOptions {
  text: string;
  language: GhanaianLanguage;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: "wav" | "mp3";
}

// Interface for ESPnet ASR options
export interface ESPnetASROptions {
  audioData: Blob | File;
  language: GhanaianLanguage;
  format?: string;
}

/**
 * Synthesize speech using ESPnet TTS
 * @param options TTS options
 * @returns URL to the generated audio
 */
export const synthesizeSpeech = async (
  options: ESPnetTTSOptions
): Promise<string> => {
  if (!isESPnetAvailable()) {
    throw new Error("ESPnet integration is not enabled");
  }

  try {
    const response = await fetch(`${ESPNET_API_URL}/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: options.text,
        language: options.language,
        speed: options.speed || 1.0,
        pitch: options.pitch || 1.0,
        volume: options.volume || 1.0,
        format: options.format || "mp3",
      }),
    });

    if (!response.ok) {
      throw new Error(`ESPnet API error: ${response.status}`);
    }

    // Create blob URL for the audio
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error in ESPnet speech synthesis:", error);
    throw error;
  }
};

/**
 * Recognize speech using ESPnet ASR
 * @param options ASR options
 * @returns Recognized text
 */
export const recognizeSpeech = async (
  options: ESPnetASROptions
): Promise<string> => {
  if (!isESPnetAvailable()) {
    throw new Error("ESPnet integration is not enabled");
  }

  try {
    const formData = new FormData();
    formData.append("audio", options.audioData);
    formData.append("language", options.language);

    if (options.format) {
      formData.append("format", options.format);
    }

    const response = await fetch(`${ESPNET_API_URL}/recognize`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ESPnet API error: ${response.status}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("Error in ESPnet speech recognition:", error);
    throw error;
  }
};

/**
 * Check if models are available for a specific language
 * @param language Language to check
 * @param modelType Type of model to check (asr or tts)
 * @returns Promise resolving to true if model is available
 */
export const checkModelAvailability = async (
  language: GhanaianLanguage,
  modelType: "asr" | "tts"
): Promise<boolean> => {
  if (!isESPnetAvailable()) {
    return false;
  }

  try {
    const response = await fetch(`${ESPNET_API_URL}/check-model`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        modelType,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.available;
  } catch (error) {
    console.error("Error checking model availability:", error);
    return false;
  }
};

/**
 * Get a list of available models
 * @returns Promise resolving to an object with available models
 */
export const getAvailableModels = async (): Promise<{
  asr: GhanaianLanguage[];
  tts: GhanaianLanguage[];
}> => {
  if (!isESPnetAvailable()) {
    return { asr: [], tts: [] };
  }

  try {
    const response = await fetch(`${ESPNET_API_URL}/available-models`);

    if (!response.ok) {
      throw new Error(`ESPnet API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting available models:", error);
    return { asr: [], tts: [] };
  }
};

export default {
  isESPnetAvailable,
  synthesizeSpeech,
  recognizeSpeech,
  checkModelAvailability,
  getAvailableModels,
  ESPnetModelPaths,
};
