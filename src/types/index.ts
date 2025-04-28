/**
 * Common type definitions for TalkGhana
 */

export type GhanaianLanguage =
  | "twi"
  | "ga"
  | "ewe"
  | "dagbani"
  | "hausa"
  | "english";

export interface UserPreferences {
  preferredLanguage: GhanaianLanguage;
  voiceRate: number;
  voicePitch: number;
  useHighContrast: boolean;
  textSize: "small" | "medium" | "large" | "x-large";
  offline: {
    enableOfflineMode: boolean;
    downloadedLanguages: GhanaianLanguage[];
  };
  whatsapp: {
    enabled: boolean;
    recipient?: string;
    apiConfigured: boolean;
  };
}

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  language: string;
}

export interface ModelInfo {
  id: string;
  language: GhanaianLanguage;
  type: "asr" | "tts";
  size: string;
  version: string;
  sizeInBytes: number;
  url: string;
  downloaded: boolean;
}

export interface ModelDownloadProgress {
  modelId: string;
  progress: number; // 0-100
  status: "pending" | "downloading" | "completed" | "failed";
  error?: string;
}

export interface LanguageResource {
  code: GhanaianLanguage;
  name: string;
  localName: string;
  voiceAvailable: boolean;
  offlineSupport: boolean;
  whisperModel: string;
}
