import { twiConfig } from "../locales/twi";
import { gaConfig } from "../locales/ga";
import { eweConfig } from "../locales/ewe";
import { hausaConfig } from "../locales/hausa";

export type GhanaianLanguage = "twi" | "ga" | "ewe" | "hausa" | "english";

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  speechRecognition: {
    code: string;
    fallback: string;
  };
  textToSpeech: {
    code: string;
    fallback: string;
    voicePreferences: string[];
  };
  commands: Record<string, string>;
  conversations: Record<string, string>;
}

const languageConfigs: Record<GhanaianLanguage, LanguageConfig> = {
  twi: twiConfig,
  ga: gaConfig,
  ewe: eweConfig,
  hausa: hausaConfig,
  english: {
    code: "en-GH",
    name: "English",
    nativeName: "English",
    speechRecognition: {
      code: "en-GH",
      fallback: "en-US",
    },
    textToSpeech: {
      code: "en-GH",
      fallback: "en-US",
      voicePreferences: ["en-GH-Standard-A", "en-GH-Standard-B"],
    },
    commands: {
      help: "Help me",
      yes: "Yes",
      no: "No",
      emergency: "Emergency",
      thankyou: "Thank you",
      water: "I need water",
      food: "I am hungry",
      bathroom: "I need the bathroom",
      pain: "I am in pain",
      medicine: "I need medicine",
      cold: "I am cold",
      hot: "I am hot",
    },
    conversations: {
      greeting: "Hello",
      howAreYou: "How are you?",
      imFine: "I am fine",
      goodbye: "Goodbye",
      understand: "I understand",
      dontUnderstand: "I do not understand",
      speakSlowly: "Please speak slowly",
      repeat: "Please repeat that",
    },
  },
};

class LanguageService {
  private currentLanguage: GhanaianLanguage = "english";
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis;
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
      }
    }
  }

  setLanguage(language: GhanaianLanguage) {
    this.currentLanguage = language;
    const config = this.getLanguageConfig();

    // Update speech recognition language
    if (this.recognition) {
      this.recognition.lang = config.speechRecognition.code;
      // If the primary language code isn't supported, try the fallback
      this.recognition.onerror = (event) => {
        if (event.error === "language-not-supported") {
          this.recognition!.lang = config.speechRecognition.fallback;
        }
      };
    }

    // Update document language for accessibility
    if (typeof document !== "undefined") {
      document.documentElement.lang = config.code;
    }

    // Broadcast language change event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("languagechange"));
    }
  }

  getLanguageConfig(): LanguageConfig {
    return languageConfigs[this.currentLanguage];
  }

  getCurrentLanguage(): GhanaianLanguage {
    return this.currentLanguage;
  }

  getVoiceForLanguage(): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null;

    const config = this.getLanguageConfig();
    const voices = this.synthesis.getVoices();

    // Try to find a voice matching the preferred voices
    for (const preferredVoice of config.textToSpeech.voicePreferences) {
      const voice = voices.find((v) => v.name === preferredVoice);
      if (voice) return voice;
    }

    // Try to find any voice matching the language code
    const languageVoice = voices.find((voice) =>
      voice.lang.toLowerCase().includes(config.textToSpeech.code.toLowerCase())
    );
    if (languageVoice) return languageVoice;

    // Fall back to any voice matching the fallback language
    return (
      voices.find((voice) =>
        voice.lang
          .toLowerCase()
          .includes(config.textToSpeech.fallback.toLowerCase())
      ) || null
    );
  }

  translateCommand(command: string): string {
    const config = this.getLanguageConfig();
    return config.commands[command] || command;
  }

  translateConversation(key: string): string {
    const config = this.getLanguageConfig();
    return config.conversations[key] || key;
  }
}

export const languageService = new LanguageService();
