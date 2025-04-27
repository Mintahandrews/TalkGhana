import React, { useState, useCallback, useRef, useEffect } from "react";
import ASRComponent from "../components/speech/ASRComponent";
import TTSComponent from "../components/speech/TTSComponent";
import GhanaianASR from "../components/GhanaianASR";
import GhanaianTTS from "../components/GhanaianTTS";
import PhrasesCollection from "../components/speech/PhrasesCollection";
import LanguageSelector from "../components/speech/LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";
import { useOffline } from "../contexts/OfflineContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import {
  Share2,
  Download,
  HelpCircle,
  Mic,
  Volume2,
  Menu,
  Minimize2,
  Maximize2,
} from "lucide-react";
import AudioRecorder from "../components/AudioRecorder";
import RecordingsList from "../components/RecordingsList";
import offlineStorageService from "../services/OfflineStorageService";
import { useToast } from "../components/ui/use-toast";
import { OfflineIndicator } from "../components/ui/OfflineIndicator";
import AccessibilityControls from "../components/ui/AccessibilityControls";

interface ConversationHistory {
  id: string;
  text: string;
  timestamp: Date;
  isInput: boolean; // true if from ASR, false if from TTS
  language?: string; // Store language for each entry
}

interface ErrorState {
  message: string;
  type: "asr" | "tts" | "general";
  timestamp: Date;
}

// Add pronunciation tips for common Ghanaian language phonetics
const pronunciationTips: Record<string, string[]> = {
  twi: [
    "ɛ is pronounced like 'eh' in 'bet'",
    "ɔ is pronounced like 'aw' in 'saw'",
    "Tones are important - high, mid, and low",
    "Try 'Akwaaba' (Welcome) - a-kwa-'a-ba",
  ],
  ga: [
    "Nasal sounds are common",
    "ŋ is pronounced like 'ng' in 'sing'",
    "Tone changes can change word meaning",
    "Try 'Ogekoo' (Welcome) - o-ge-'koo",
  ],
  ewe: [
    "ƒ is pronounced like 'f' but made with both lips",
    "ɖ is pronounced with the tongue curled back",
    "Try 'Woezɔ' (Welcome) - woe-'zɔ",
  ],
  hausa: [
    "Implosive consonants like ɓ and ɗ are distinctive",
    "Long vowels are written double (aa)",
    "Try 'Sannu' ('san-nu) - Hello",
  ],
  english: [
    "Standard pronunciation works well",
    "Speak clearly and at a moderate pace",
  ],
};

const Conversation: React.FC = () => {
  const { toast } = useToast();
  const [recognizedText, setRecognizedText] = useState("");
  const [textToSpeak, setTextToSpeak] = useState("");
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [activeTab, setActiveTab] = useState<
    "conversation" | "phrases" | "recordings"
  >("conversation");
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showPronunciationTips, setShowPronunciationTips] = useState(false);
  const [sharingLink, setSharingLink] = useState<string | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const { currentLanguage } = useLanguage();
  const { isOffline } = useOffline();
  const { preferences } = useUserPreferences();

  const conversationEndRef = useRef<HTMLDivElement>(null);
  const offlineStatusRef = useRef<boolean>(isOffline);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of conversation history
  const scrollToBottom = useCallback(() => {
    if (conversationEndRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      requestAnimationFrame(() => {
        conversationEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  }, []);

  // Track status change for online/offline
  useEffect(() => {
    const checkIfMobile = () => {
      setCompactMode(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add resize listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Ensure auto-scrolling when history changes
  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  // New enhanced transcript change handler with highlighting
  const handleEnhancedASRTranscript = useCallback(
    (text: string, confidence?: number) => {
      setRecognizedText(text);

      // Highlight the new text briefly
      setHighlightedText(text);
      setTimeout(() => {
        setHighlightedText(null);
      }, 2000);

      // Clear any existing ASR errors when we get successful results
      if (error?.type === "asr") {
        setError(null);
      }
    },
    [error]
  );

  // Handle ASR errors
  const handleASRError = useCallback((errorMessage: string) => {
    setError({
      message: errorMessage,
      type: "asr",
      timestamp: new Date(),
    });

    // Increment reconnect attempts
    setReconnectAttempts((prev) => prev + 1);
  }, []);

  // Handle TTS errors
  const handleTTSError = useCallback((errorMessage: string) => {
    setError({
      message: errorMessage,
      type: "tts",
      timestamp: new Date(),
    });
  }, []);

  // Handle speech recognition completion
  const handleSpeechEnd = useCallback(() => {
    if (recognizedText.trim()) {
      const newEntry: ConversationHistory = {
        id: `asr-${Date.now()}`,
        text: recognizedText,
        timestamp: new Date(),
        isInput: true,
        language: currentLanguage,
      };

      setHistory((prev) => [...prev, newEntry]);
      setRecognizedText("");

      // Small delay to ensure DOM updates before scrolling
      setTimeout(scrollToBottom, 100);
    }
  }, [recognizedText, currentLanguage, scrollToBottom]);

  // Handle text-to-speech
  const handleSpeak = useCallback(() => {
    if (textToSpeak.trim()) {
      const newEntry: ConversationHistory = {
        id: `tts-${Date.now()}`,
        text: textToSpeak,
        timestamp: new Date(),
        isInput: false,
        language: currentLanguage,
      };

      setHistory((prev) => [...prev, newEntry]);
      setTextToSpeak(""); // Clear text after speaking

      // Focus text input for next entry
      if (textInputRef.current) {
        textInputRef.current.focus();
      }

      // Small delay to ensure DOM updates before scrolling
      setTimeout(scrollToBottom, 100);
    }
  }, [textToSpeak, currentLanguage, scrollToBottom]);

  // Handle phrase selection from phrases collection
  const handlePhraseSelect = useCallback(
    (phrase: any) => {
      setTextToSpeak(phrase.text);

      const newEntry: ConversationHistory = {
        id: `phrase-${Date.now()}`,
        text: phrase.text,
        timestamp: new Date(),
        isInput: false,
        language: currentLanguage,
      };

      setHistory((prev) => [...prev, newEntry]);

      // Small delay to ensure DOM updates before scrolling
      setTimeout(scrollToBottom, 100);
    },
    [currentLanguage, scrollToBottom]
  );

  // Clear conversation history
  const clearHistory = () => {
    if (
      window.confirm("Are you sure you want to clear the conversation history?")
    ) {
      setHistory([]);
      localStorage.removeItem("conversation-history");
    }
  };

  // Clear error message
  const dismissError = () => {
    setError(null);
    setReconnectAttempts(0);
  };

  // Handle audio file upload for transcription
  const handleAudioUpload = (blob: Blob) => {
    setAudioBlob(blob);
    setProcessingAudio(true);

    // In a real implementation, we would send this to a speech recognition API
    // For now we'll simulate processing
    setTimeout(() => {
      setProcessingAudio(false);
      setRecognizedText(
        "This is a simulated transcription from uploaded audio."
      );
    }, 2000);
  };

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if not in text input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Handle keyboard shortcuts
      switch (e.key.toLowerCase()) {
        case "r":
          // Start/stop recording with "R" key
          if (activeTab === "conversation") {
            // This would need an exposed method from the ASR component
            // For now, we can just log a message
            console.log("Record shortcut triggered");
          }
          break;
        case "s":
          // Play/Stop speech with "S" key
          if (activeTab === "conversation") {
            console.log("Speak shortcut triggered");
          }
          break;
        case "t":
          // Toggle between tabs with "T" key
          setActiveTab(
            activeTab === "conversation" ? "phrases" : "conversation"
          );
          break;
        case "p":
          // Toggle pronunciation tips with "P" key
          setShowPronunciationTips(!showPronunciationTips);
          break;
        case "?":
          // Toggle shortcut help with "?" key
          setShowShortcutHelp(!showShortcutHelp);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, showPronunciationTips, showShortcutHelp]);

  // Generate sharing link
  const generateSharingLink = () => {
    if (history.length === 0) {
      setError({
        message: "No conversation to share",
        type: "general",
        timestamp: new Date(),
      });
      return;
    }

    try {
      // Create a shareable version of the conversation
      const shareableData = history.map((item) => ({
        text: item.text,
        isInput: item.isInput,
        language: item.language || currentLanguage,
      }));

      // Encode the data for URL sharing
      const encodedData = encodeURIComponent(JSON.stringify(shareableData));
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?share=${encodedData}`;

      // For demo purposes, show a shortened version
      setSharingLink(shareUrl.substring(0, 60) + "...");

      // In a real app, you might use a URL shortener service here
    } catch (err) {
      console.error("Failed to generate sharing link:", err);
      setError({
        message: "Failed to generate sharing link",
        type: "general",
        timestamp: new Date(),
      });
    }
  };

  // Export conversation history
  const exportConversation = () => {
    try {
      const dataStr = JSON.stringify(history, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `talkghana-conversation-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error("Failed to export conversation:", err);
      setError({
        message: "Failed to export conversation",
        type: "general",
        timestamp: new Date(),
      });
    }
  };

  // Toggle compact mode
  const toggleCompactMode = () => {
    setCompactMode(!compactMode);
  };

  return (
    <div
      className={`container mx-auto transition-all duration-300 ${
        compactMode ? "px-2 pt-16 pb-4" : "p-4 md:p-6"
      } ${preferences?.highContrast ? "bg-gray-900 text-white" : ""}`}
    >
      {/* Header - conditionally shown in compact mode */}
      {!compactMode && (
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1
              className={`text-2xl font-bold ${
                preferences?.highContrast ? "text-white" : "text-gray-800"
              }`}
            >
              TalkGhana
            </h1>
            <div className="flex items-center flex-wrap gap-2">
              <AccessibilityControls compact />
              <button
                onClick={toggleCompactMode}
                className={`p-2 rounded-full ${
                  preferences?.highContrast
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                aria-label="Compact mode"
                title="Compact mode"
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={() => setShowShortcutHelp(!showShortcutHelp)}
                className={`p-2 rounded-full ${
                  preferences?.highContrast
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts"
              >
                <HelpCircle size={18} />
              </button>
              <LanguageSelector />
            </div>
          </div>

          {isOffline && <OfflineIndicator className="mb-4" />}

          {error && (
            <div
              className={`border rounded-lg p-3 mb-4 flex items-center ${
                error.type === "asr"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : error.type === "tts"
                  ? "bg-orange-50 border-orange-200 text-orange-800"
                  : "bg-gray-50 border-gray-200 text-gray-800"
              }`}
              role="alert"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <span>{error.message}</span>
                {reconnectAttempts > 0 && error.type === "asr" && (
                  <span className="block text-sm mt-1">
                    Reconnection attempts: {reconnectAttempts}/3
                  </span>
                )}
              </div>
              <button
                onClick={dismissError}
                className="ml-2 text-sm font-medium"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Keyboard shortcuts help dialog */}
          {showShortcutHelp && (
            <div
              className={`mb-4 p-4 ${
                preferences?.highContrast
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-200"
              } rounded-lg shadow-md`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3
                  className={`font-medium ${
                    preferences?.highContrast ? "text-white" : "text-gray-800"
                  }`}
                >
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setShowShortcutHelp(false)}
                  className={`text-sm ${
                    preferences?.highContrast
                      ? "text-gray-400"
                      : "text-gray-500"
                  } hover:underline`}
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <kbd
                    className={`px-2 py-1 mr-2 rounded ${
                      preferences?.highContrast
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    R
                  </kbd>
                  <span>Start/stop recording</span>
                </div>
                <div className="flex items-center">
                  <kbd
                    className={`px-2 py-1 mr-2 rounded ${
                      preferences?.highContrast
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    S
                  </kbd>
                  <span>Play/stop speech</span>
                </div>
                <div className="flex items-center">
                  <kbd
                    className={`px-2 py-1 mr-2 rounded ${
                      preferences?.highContrast
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    T
                  </kbd>
                  <span>Toggle between tabs</span>
                </div>
                <div className="flex items-center">
                  <kbd
                    className={`px-2 py-1 mr-2 rounded ${
                      preferences?.highContrast
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    P
                  </kbd>
                  <span>Show/hide pronunciation tips</span>
                </div>
                <div className="flex items-center">
                  <kbd
                    className={`px-2 py-1 mr-2 rounded ${
                      preferences?.highContrast
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    ?
                  </kbd>
                  <span>Show/hide this help</span>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Mobile floating header for compact mode */}
      {compactMode && (
        <div className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center p-2 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-full ${
              preferences?.highContrast ? "text-white" : "text-gray-700"
            }`}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1
              className={`text-lg font-bold ${
                preferences?.highContrast ? "text-white" : "text-gray-800"
              }`}
            >
              TalkGhana
            </h1>
            {isOffline && <OfflineIndicator compact />}
          </div>
          <button
            onClick={toggleCompactMode}
            className={`p-2 rounded-full ${
              preferences?.highContrast ? "text-white" : "text-gray-700"
            }`}
          >
            <Maximize2 size={20} />
          </button>
        </div>
      )}

      {/* Mobile menu drawer */}
      {compactMode && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className={`fixed top-0 left-0 bottom-0 w-64 p-4 ${
              preferences?.highContrast ? "bg-gray-900" : "bg-white"
            } shadow-lg`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`font-bold ${
                  preferences?.highContrast ? "text-white" : "text-gray-800"
                }`}
              >
                Menu
              </h2>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3
                  className={`text-sm font-medium mb-2 ${
                    preferences?.highContrast
                      ? "text-gray-300"
                      : "text-gray-600"
                  }`}
                >
                  Language
                </h3>
                <LanguageSelector />
              </div>

              <div>
                <h3
                  className={`text-sm font-medium mb-2 ${
                    preferences?.highContrast
                      ? "text-gray-300"
                      : "text-gray-600"
                  }`}
                >
                  Actions
                </h3>
                <button
                  onClick={() => {
                    setShowPronunciationTips(!showPronunciationTips);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left p-2 rounded-md ${
                    preferences?.highContrast
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100"
                  } mb-1`}
                >
                  Pronunciation Tips
                </button>
                <button
                  onClick={() => {
                    setActiveTab(
                      activeTab === "conversation" ? "phrases" : "conversation"
                    );
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left p-2 rounded-md ${
                    preferences?.highContrast
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100"
                  } mb-1`}
                >
                  Switch to{" "}
                  {activeTab === "conversation" ? "Phrases" : "Conversation"}
                </button>
                <button
                  onClick={() => {
                    setShowShortcutHelp(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left p-2 rounded-md ${
                    preferences?.highContrast
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Keyboard Shortcuts
                </button>
              </div>

              {history.length > 0 && (
                <div>
                  <h3
                    className={`text-sm font-medium mb-2 ${
                      preferences?.highContrast
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    Conversation
                  </h3>
                  <button
                    onClick={() => {
                      generateSharingLink();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left p-2 rounded-md ${
                      preferences?.highContrast
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    } mb-1`}
                  >
                    Share Conversation
                  </button>
                  <button
                    onClick={() => {
                      exportConversation();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left p-2 rounded-md ${
                      preferences?.highContrast
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    } mb-1`}
                  >
                    Export Conversation
                  </button>
                  <button
                    onClick={() => {
                      clearHistory();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left p-2 rounded-md ${
                      preferences?.highContrast
                        ? "text-red-900"
                        : "text-red-600"
                    }`}
                  >
                    Clear History
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation - modified for responsive layout */}
      <div
        className={`flex border-b border-gray-200 mb-4 overflow-x-auto ${
          compactMode ? "mt-2" : ""
        }`}
        role="tablist"
      >
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "conversation"
              ? preferences?.highContrast
                ? "text-blue-300 border-b-2 border-blue-300"
                : "text-blue-600 border-b-2 border-blue-600"
              : preferences?.highContrast
              ? "text-gray-300 hover:text-gray-100"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("conversation")}
          role="tab"
          aria-selected={activeTab === "conversation"}
          aria-controls="conversation-panel"
          id="conversation-tab"
        >
          Conversation
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "phrases"
              ? preferences?.highContrast
                ? "text-blue-300 border-b-2 border-blue-300"
                : "text-blue-600 border-b-2 border-blue-600"
              : preferences?.highContrast
              ? "text-gray-300 hover:text-gray-100"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("phrases")}
          role="tab"
          aria-selected={activeTab === "phrases"}
          aria-controls="phrases-panel"
          id="phrases-tab"
        >
          Common Phrases
        </button>
        <button
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === "recordings"
              ? preferences?.highContrast
                ? "text-blue-300 border-b-2 border-blue-300"
                : "text-blue-600 border-b-2 border-blue-600"
              : preferences?.highContrast
              ? "text-gray-300 hover:text-gray-100"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("recordings")}
          role="tab"
          aria-selected={activeTab === "recordings"}
          aria-controls="recordings-panel"
          id="recordings-tab"
        >
          Recordings
        </button>
      </div>

      {/* Main content based on active tab */}
      <div className="mb-6">
        {activeTab === "conversation" ? (
          <div
            role="tabpanel"
            id="conversation-panel"
            aria-labelledby="conversation-tab"
            className="space-y-6"
          >
            {/* Pronunciation tips panel */}
            {showPronunciationTips && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  preferences?.highContrast
                    ? "bg-blue-900 border border-blue-800"
                    : "bg-blue-50 border border-blue-100"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3
                    className={`font-medium ${
                      preferences?.highContrast ? "text-white" : "text-blue-800"
                    }`}
                  >
                    {currentLanguage.charAt(0).toUpperCase() +
                      currentLanguage.slice(1)}{" "}
                    Pronunciation Tips
                  </h3>
                  <button
                    onClick={() => setShowPronunciationTips(false)}
                    className={`text-sm ${
                      preferences?.highContrast
                        ? "text-blue-300"
                        : "text-blue-600"
                    } hover:underline`}
                  >
                    Close
                  </button>
                </div>
                <ul
                  className={`list-disc pl-5 ${
                    preferences?.highContrast
                      ? "text-blue-100"
                      : "text-blue-700"
                  } text-sm space-y-1`}
                >
                  {pronunciationTips[currentLanguage]?.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conversation history */}
            {history.length > 0 && (
              <div className="mb-6">
                <div
                  className={`flex justify-between items-center mb-2 ${
                    compactMode ? "flex-wrap gap-y-2" : ""
                  }`}
                >
                  <h2
                    className={`text-lg font-medium ${
                      preferences?.highContrast ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Conversation
                  </h2>
                  {!compactMode && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setShowPronunciationTips(!showPronunciationTips)
                        }
                        className={`text-sm px-2 py-1 rounded ${
                          preferences?.highContrast
                            ? "bg-gray-800 text-blue-300 hover:bg-gray-700"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                        aria-label="Show pronunciation tips"
                      >
                        Pronunciation Tips
                      </button>
                      <button
                        onClick={generateSharingLink}
                        className={`text-sm px-2 py-1 rounded flex items-center ${
                          preferences?.highContrast
                            ? "bg-gray-800 text-green-300 hover:bg-gray-700"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                        aria-label="Share conversation"
                      >
                        <Share2 size={14} className="mr-1" />
                        Share
                      </button>
                      <button
                        onClick={exportConversation}
                        className={`text-sm px-2 py-1 rounded flex items-center ${
                          preferences?.highContrast
                            ? "bg-gray-800 text-purple-300 hover:bg-gray-700"
                            : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                        }`}
                        aria-label="Export conversation"
                      >
                        <Download size={14} className="mr-1" />
                        Export
                      </button>
                      <button
                        onClick={clearHistory}
                        className={`text-sm ${
                          preferences?.highContrast
                            ? "text-red-400 hover:text-red-300"
                            : "text-red-600 hover:text-red-800"
                        }`}
                        aria-label="Clear conversation history"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Sharing link display */}
                {sharingLink && (
                  <div
                    className={`mb-3 p-3 rounded-lg flex items-center justify-between ${
                      preferences?.highContrast
                        ? "bg-gray-700 border border-gray-600"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <div className="overflow-hidden text-ellipsis flex-1">
                      <span
                        className={`text-xs ${
                          preferences?.highContrast
                            ? "text-gray-300"
                            : "text-green-800"
                        }`}
                      >
                        Sharing link (click to copy):
                      </span>
                      <p
                        className={`text-sm truncate cursor-pointer ${
                          preferences?.highContrast
                            ? "text-blue-300"
                            : "text-blue-600"
                        }`}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            sharingLink.replace("...", "")
                          );
                          alert("Link copied to clipboard!");
                        }}
                      >
                        {sharingLink}
                      </p>
                    </div>
                    <button
                      onClick={() => setSharingLink(null)}
                      className={`text-xs ${
                        preferences?.highContrast
                          ? "text-gray-400"
                          : "text-gray-500"
                      } hover:underline ml-2`}
                    >
                      Close
                    </button>
                  </div>
                )}

                <div
                  className={`${
                    preferences?.highContrast ? "bg-gray-800" : "bg-white"
                  } border ${
                    preferences?.highContrast
                      ? "border-gray-700"
                      : "border-gray-200"
                  } rounded-lg p-4 max-h-[300px] overflow-y-auto`}
                >
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className={`mb-3 p-3 rounded-lg ${
                        entry.isInput
                          ? preferences?.highContrast
                            ? "bg-gray-700 border border-gray-600"
                            : "bg-gray-100 border border-gray-200"
                          : preferences?.highContrast
                          ? "bg-blue-900 border border-blue-800"
                          : "bg-blue-50 border border-blue-200"
                      } ${
                        highlightedText === entry.text
                          ? "animate-pulse border-yellow-400"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-xs font-medium ${
                            preferences?.highContrast
                              ? "text-gray-300"
                              : "text-gray-500"
                          }`}
                        >
                          {entry.isInput ? "Heard" : "Spoke"}
                          {entry.language && ` (${entry.language})`}
                        </span>
                        <span
                          className={`text-xs ${
                            preferences?.highContrast
                              ? "text-gray-400"
                              : "text-gray-400"
                          }`}
                        >
                          {entry.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p
                        className={`${
                          preferences?.highContrast
                            ? "text-white"
                            : "text-gray-800"
                        } ${preferences?.largeText ? "text-lg" : ""}`}
                      >
                        {entry.text}
                      </p>
                    </div>
                  ))}
                  <div ref={conversationEndRef} />
                </div>
              </div>
            )}

            {/* Speech recognition - updated for compact mode */}
            <div className={`mb-6 ${compactMode ? "mt-4" : ""}`}>
              <h2
                className={`text-lg font-medium ${
                  preferences?.highContrast ? "text-white" : "text-gray-700"
                } mb-2 flex items-center`}
              >
                <Mic size={18} className="mr-2" />
                Listen
              </h2>
              {isOffline ? (
                <ASRComponent
                  onTranscriptChange={handleEnhancedASRTranscript}
                  onSpeechEnd={handleSpeechEnd}
                  continuous={false}
                  placeholder="Press Start to listen..."
                  onError={handleASRError}
                />
              ) : (
                <GhanaianASR
                  language={currentLanguage}
                  onTranscriptChange={handleEnhancedASRTranscript}
                  onSpeechEnd={handleSpeechEnd}
                  onError={handleASRError}
                />
              )}
            </div>

            {/* Text-to-speech - kept as is */}
            <div>
              <h2
                className={`text-lg font-medium ${
                  preferences?.highContrast ? "text-white" : "text-gray-700"
                } mb-2 flex items-center`}
              >
                <Volume2 size={18} className="mr-2" />
                Speak
              </h2>
              {isOffline ? (
                <TTSComponent
                  text={textToSpeak}
                  autoPlay={false}
                  showControls={true}
                  showSettings={true}
                  onPlayStart={handleSpeak}
                  onPlayEnd={() => {}}
                  onError={handleTTSError}
                />
              ) : (
                <GhanaianTTS
                  text={textToSpeak}
                  language={currentLanguage}
                  autoPlay={false}
                  onPlayStart={handleSpeak}
                  onPlayEnd={() => {}}
                  onError={handleTTSError}
                  showSettings={true}
                />
              )}
            </div>
          </div>
        ) : activeTab === "phrases" ? (
          <div role="tabpanel" id="phrases-panel" aria-labelledby="phrases-tab">
            <PhrasesCollection
              onPhraseSelect={handlePhraseSelect}
              showCategories={true}
              maxPhrasesPerCategory={0}
              showTranslations={true}
            />
          </div>
        ) : (
          <div
            role="tabpanel"
            id="recordings-panel"
            aria-labelledby="recordings-tab"
          >
            <div className="space-y-6">
              <AudioRecorder
                onSaveRecording={(blob, name) => {
                  // Pass to offline storage service
                  offlineStorageService
                    .saveRecording(name, blob, recordingTime)
                    .then(() => {
                      toast(
                        "Recording Saved",
                        "Your recording has been saved successfully"
                      );
                    })
                    .catch((err) => {
                      console.error("Error saving recording:", err);
                      toast("Error", "Failed to save recording", "error");
                    });
                }}
                onUploadForTranscription={async (blob) => {
                  setProcessingAudio(true);
                  try {
                    const formData = new FormData();
                    formData.append("audio", blob);
                    formData.append("language", currentLanguage);

                    const response = await fetch("/api/asr/whisper", {
                      method: "POST",
                      body: formData,
                    });

                    const data = await response.json();
                    if (response.ok && data.text) {
                      setRecognizedText(data.text);
                      handleEnhancedASRTranscript(data.text, data.confidence);
                      toast(
                        "Transcription Complete",
                        "Audio has been transcribed successfully"
                      );
                    } else {
                      throw new Error(data.error || "Transcription failed");
                    }
                  } catch (err) {
                    console.error("Transcription error:", err);
                    toast(
                      "Transcription Failed",
                      "Could not transcribe the audio",
                      "error"
                    );
                    setError({
                      message:
                        "Transcription failed: " + (err as Error).message,
                      type: "asr",
                      timestamp: new Date(),
                    });
                  } finally {
                    setProcessingAudio(false);
                  }
                }}
              />
              <RecordingsList
                onUploadForTranscription={async (recording) => {
                  setProcessingAudio(true);
                  try {
                    const formData = new FormData();
                    formData.append("audio", recording.blob);
                    formData.append("language", currentLanguage);

                    const response = await fetch("/api/asr/whisper", {
                      method: "POST",
                      body: formData,
                    });

                    const data = await response.json();
                    if (response.ok && data.text) {
                      setRecognizedText(data.text);
                      handleEnhancedASRTranscript(data.text, data.confidence);

                      // Update transcription in storage
                      await offlineStorageService.updateTranscription(
                        recording.id,
                        data.text
                      );

                      return;
                    } else {
                      throw new Error(data.error || "Transcription failed");
                    }
                  } catch (err) {
                    console.error("Transcription error:", err);
                    setError({
                      message:
                        "Transcription failed: " + (err as Error).message,
                      type: "asr",
                      timestamp: new Date(),
                    });
                    throw err;
                  } finally {
                    setProcessingAudio(false);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile floating action buttons for compact mode 
         - Added a new floating button to toggle the current active tab */}
      {compactMode && (
        <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => {
              setActiveTab(
                activeTab === "conversation"
                  ? "phrases"
                  : activeTab === "phrases"
                  ? "recordings"
                  : "conversation"
              );
            }}
            className={`p-3 rounded-full shadow-lg ${
              preferences?.highContrast
                ? "bg-indigo-700 text-white"
                : "bg-indigo-600 text-white"
            }`}
            aria-label="Switch tabs"
          >
            {
              activeTab === "conversation"
                ? "📝" // Switch to phrases
                : activeTab === "phrases"
                ? "🎙️" // Switch to recordings
                : "💬" // Switch to conversation
            }
          </button>

          {history.length > 0 && (
            <>
              <button
                onClick={() => setShowPronunciationTips(!showPronunciationTips)}
                className={`p-3 rounded-full shadow-lg ${
                  preferences?.highContrast
                    ? "bg-blue-700 text-white"
                    : "bg-blue-600 text-white"
                }`}
                aria-label="Pronunciation tips"
              >
                <HelpCircle size={20} />
              </button>
              <button
                onClick={generateSharingLink}
                className={`p-3 rounded-full shadow-lg ${
                  preferences?.highContrast
                    ? "bg-green-700 text-white"
                    : "bg-green-600 text-white"
                }`}
                aria-label="Share conversation"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={exportConversation}
                className={`p-3 rounded-full shadow-lg ${
                  preferences?.highContrast
                    ? "bg-purple-700 text-white"
                    : "bg-purple-600 text-white"
                }`}
                aria-label="Export conversation"
              >
                <Download size={20} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Keep advanced controls but hide in compact mode */}
      {!compactMode && (
        <>
          {/* Advanced controls toggle */}
          <div className="mt-4 mb-2">
            <button
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className={`text-sm ${
                preferences?.highContrast
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-800"
              }`}
              aria-expanded={showAdvancedControls}
              aria-controls="advanced-controls"
            >
              {showAdvancedControls
                ? "Hide Advanced Options"
                : "Show Advanced Options"}
            </button>
          </div>

          {showAdvancedControls && (
            <div
              id="advanced-controls"
              className={`p-3 rounded-lg mb-6 ${
                preferences?.highContrast
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <h3
                className={`text-sm font-medium mb-2 ${
                  preferences?.highContrast ? "text-white" : "text-gray-700"
                }`}
              >
                Advanced Options
              </h3>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="upload-audio"
                    className={`block text-sm mb-1 ${
                      preferences?.highContrast
                        ? "text-gray-300"
                        : "text-gray-600"
                    }`}
                  >
                    Upload audio for transcription:
                  </label>
                  <input
                    type="file"
                    id="upload-audio"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAudioUpload(file);
                      }
                    }}
                    className={`block w-full text-sm ${
                      preferences?.highContrast
                        ? "text-gray-300 file:bg-gray-700 file:text-gray-300 file:border-gray-600"
                        : "text-gray-700 file:bg-gray-100 file:text-gray-700"
                    } file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:text-sm file:font-medium`}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer - hidden in compact mode */}
      {!compactMode && (
        <footer
          className={`mt-8 pt-6 border-t ${
            preferences?.highContrast ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-medium ${
              preferences?.highContrast ? "text-white" : "text-gray-700"
            } mb-2`}
          >
            About TalkGhana
          </h2>
          <p
            className={`${
              preferences?.highContrast ? "text-gray-300" : "text-gray-600"
            } mb-2 ${preferences?.largeText ? "text-lg" : ""}`}
          >
            TalkGhana is an assistive communication app for speech-impaired
            individuals using Ghanaian languages.
          </p>
          <p
            className={`${
              preferences?.highContrast ? "text-gray-300" : "text-gray-600"
            } mb-4 ${preferences?.largeText ? "text-lg" : ""}`}
          >
            Use the "Listen" section to convert speech to text, and the "Speak"
            section or "Common Phrases" tab to convert text to speech.
          </p>
          <div
            className={`text-sm ${
              preferences?.highContrast ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <p>Need help? Contact support@talkghana.org</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Conversation;
