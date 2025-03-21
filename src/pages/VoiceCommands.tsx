import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Download,
  Mic,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useSpeechRecognition } from "../services/SpeechRecognitionService";
import { useTextToSpeech } from "../services/TextToSpeechService";
import CommandEditor from "../components/CommandEditor";
import {
  COMMAND_CATEGORIES,
  VoiceCommand,
} from "../constants/commandCategories";

// Default commands set
const defaultCommands: VoiceCommand[] = [
  {
    id: "help",
    text: "I need help",
    icon: "🆘",
    category: COMMAND_CATEGORIES.EMERGENCY,
  },
  {
    id: "emergency",
    text: "Emergency",
    icon: "🚨",
    category: COMMAND_CATEGORIES.EMERGENCY,
  },
  {
    id: "water",
    text: "I need water",
    icon: "💧",
    category: COMMAND_CATEGORIES.DAILY_NEEDS,
  },
  {
    id: "food",
    text: "I am hungry",
    icon: "🍽️",
    category: COMMAND_CATEGORIES.DAILY_NEEDS,
  },
  {
    id: "bathroom",
    text: "I need the bathroom",
    icon: "🚻",
    category: COMMAND_CATEGORIES.DAILY_NEEDS,
  },
  {
    id: "pain",
    text: "I am in pain",
    icon: "😣",
    category: COMMAND_CATEGORIES.EMERGENCY,
  },
  {
    id: "medicine",
    text: "I need medicine",
    icon: "💊",
    category: COMMAND_CATEGORIES.DAILY_NEEDS,
  },
  {
    id: "yes",
    text: "Yes",
    icon: "✅",
    category: COMMAND_CATEGORIES.CONVERSATIONS,
  },
  {
    id: "no",
    text: "No",
    icon: "❌",
    category: COMMAND_CATEGORIES.CONVERSATIONS,
  },
  {
    id: "thanks",
    text: "Thank you",
    icon: "🙏",
    category: COMMAND_CATEGORIES.CONVERSATIONS,
  },
  {
    id: "cold",
    text: "I am cold",
    icon: "❄️",
    category: COMMAND_CATEGORIES.DAILY_NEEDS,
  },
  {
    id: "hot",
    text: "I am hot",
    icon: "🔥",
    category: COMMAND_CATEGORIES.DAILY_NEEDS,
  },
];

// Keep track of frequently used commands
interface CommandUsage {
  id: string;
  count: number;
}

const VoiceCommands = () => {
  const { t, currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();
  const [commandUsage, setCommandUsage] = useState<CommandUsage[]>([]);
  const [recognizedCommand, setRecognizedCommand] = useState<string | null>(
    null
  );
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [commands, setCommands] = useState<VoiceCommand[]>(defaultCommands);
  const [filteredCommands, setFilteredCommands] =
    useState<VoiceCommand[]>(defaultCommands);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommand, setEditingCommand] = useState<VoiceCommand | null>(
    null
  );
  const [isManagingCommands, setIsManagingCommands] = useState(false);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);

  // Initialize speech recognition
  const {
    text: recognizedText,
    isListening,
    startListening,
    stopListening,
    resetText,
    browserSupportsSpeechRecognition,
    confidence = 0,
  } = useSpeechRecognition(currentLanguage);

  // Initialize text-to-speech
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    browserSupportsTTS,
  } = useTextToSpeech(currentLanguage);

  // Load commands from storage
  const loadCommands = useCallback(() => {
    // Load saved commands from localStorage
    const storedCommands = localStorage.getItem("voiceCommands");
    if (storedCommands) {
      try {
        setCommands(JSON.parse(storedCommands));
        setFilteredCommands(JSON.parse(storedCommands));
      } catch (e) {
        console.error("Failed to parse saved commands data");
      }
    }

    // Load usage data from localStorage
    const storedUsage = localStorage.getItem("commandUsage");
    if (storedUsage) {
      try {
        setCommandUsage(JSON.parse(storedUsage));
      } catch (e) {
        console.error("Failed to parse command usage data");
      }
    }
  }, []);

  // Effect to handle language changes
  useEffect(() => {
    // Reset any active listening/speaking when language changes
    if (isListening) {
      stopListening();
    }
    if (isSpeaking) {
      stopSpeaking();
    }

    // Listen for language changes broadcast from other components
    const handleLanguageChange = () => {
      console.log(`Language change event received in Voice Commands`);
      // Reload commands for the new language
      loadCommands();

      // Reset speech recognition and TTS
      resetText();
      stopSpeaking();

      // Update speech recognition language
      if (browserSupportsSpeechRecognition) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang =
            currentLanguage === "english" ? "en-US" : currentLanguage;
        }
      }

      // Update TTS voice for new language
      if (browserSupportsTTS) {
        const voices = window.speechSynthesis.getVoices();
        const languageVoices = voices.filter((voice) =>
          voice.lang
            .toLowerCase()
            .includes(currentLanguage === "english" ? "en" : currentLanguage)
        );
        if (languageVoices.length > 0) {
          setSelectedVoice(languageVoices[0]);
        }
      }
    };

    window.addEventListener("languagechange", handleLanguageChange);

    // Initial setup
    handleLanguageChange();

    return () => {
      window.removeEventListener("languagechange", handleLanguageChange);
    };
  }, [
    currentLanguage,
    isListening,
    isSpeaking,
    stopListening,
    stopSpeaking,
    loadCommands,
    resetText,
    browserSupportsSpeechRecognition,
    browserSupportsTTS,
    setSelectedVoice,
  ]);

  // Load commands and usage data on mount
  useEffect(() => {
    loadCommands();
  }, [loadCommands]);

  // Filter commands when category changes
  useEffect(() => {
    if (activeCategory) {
      setFilteredCommands(
        commands.filter((cmd) => cmd.category === activeCategory)
      );
    } else {
      setFilteredCommands(commands);
    }
  }, [activeCategory, commands]);

  // Process recognized speech
  useEffect(() => {
    if (isListening && recognizedText) {
      // Find closest matching command
      const recognizedLower = recognizedText.toLowerCase();
      let bestMatch = null;
      let highestSimilarity = 0;

      for (const command of commands) {
        const commandLower = command.text.toLowerCase();
        // Simple similarity check - contains words from command
        const words = commandLower.split(" ");
        let matches = 0;
        for (const word of words) {
          if (recognizedLower.includes(word) && word.length > 2) {
            matches++;
          }
        }
        const similarity = matches / words.length;

        if (similarity > highestSimilarity && similarity > 0.3) {
          highestSimilarity = similarity;
          bestMatch = command;
        }
      }

      if (bestMatch) {
        setRecognizedCommand(bestMatch.text);
        setFeedbackVisible(true);
        setFeedbackSuccess(true);

        // Increment usage count
        updateCommandUsage(bestMatch.id);

        // Speak the command
        if (browserSupportsTTS) {
          speak(
            bestMatch.text,
            preferences.speechRate,
            preferences.speechPitch
          );
        }

        // Reset after a delay
        setTimeout(() => {
          setFeedbackVisible(false);
          setRecognizedCommand(null);
          stopListening();
        }, 3000);
      } else if (recognizedText.length > 10) {
        // If we have a substantial amount of text but no match
        setFeedbackVisible(true);
        setFeedbackSuccess(false);
        setRecognizedCommand(recognizedText);

        // Reset after a delay
        setTimeout(() => {
          setFeedbackVisible(false);
          setRecognizedCommand(null);
        }, 3000);
      }
    }
  }, [
    recognizedText,
    isListening,
    browserSupportsTTS,
    speak,
    preferences.speechRate,
    preferences.speechPitch,
    stopListening,
    commands,
  ]);

  const updateCommandUsage = (commandId: string) => {
    setCommandUsage((prev) => {
      const newUsage = [...prev];
      const existingIndex = newUsage.findIndex((item) => item.id === commandId);

      if (existingIndex >= 0) {
        newUsage[existingIndex] = {
          ...newUsage[existingIndex],
          count: newUsage[existingIndex].count + 1,
        };
      } else {
        newUsage.push({ id: commandId, count: 1 });
      }

      // Sort by usage count
      newUsage.sort((a, b) => b.count - a.count);

      // Store in localStorage
      localStorage.setItem("commandUsage", JSON.stringify(newUsage));

      return newUsage;
    });
  };

  const speakCommand = (text: string, commandId: string) => {
    if (browserSupportsTTS) {
      speak(text, preferences.speechRate, preferences.speechPitch);
      updateCommandUsage(commandId);
    }
  };

  const handleEditCommand = (command: VoiceCommand) => {
    setEditingCommand(command);
    setIsEditing(true);
  };

  const handleSaveCommand = (command: VoiceCommand) => {
    setCommands((prev) => {
      const newCommands = command.id
        ? prev.map((cmd) => (cmd.id === command.id ? command : cmd))
        : [...prev, { ...command, id: Date.now().toString(), isCustom: true }];

      // Save to localStorage
      localStorage.setItem("voiceCommands", JSON.stringify(newCommands));
      return newCommands;
    });

    setIsEditing(false);
    setEditingCommand(null);
  };

  const handleDeleteCommand = (commandId: string) => {
    setCommands((prev) => {
      const newCommands = prev.filter((cmd) => cmd.id !== commandId);
      localStorage.setItem("voiceCommands", JSON.stringify(newCommands));
      return newCommands;
    });
  };

  const exportCommands = () => {
    const dataStr = JSON.stringify(commands);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const exportFileDefaultName = `talkghana_commands_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importCommands = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCommands = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedCommands)) {
          setCommands(importedCommands);
          localStorage.setItem(
            "voiceCommands",
            JSON.stringify(importedCommands)
          );
        }
      } catch (error) {
        console.error("Error importing commands:", error);
        alert("Invalid command file format");
      }
    };
    reader.readAsText(file);
  };

  // Sort commands by usage count for display
  const sortedCommands = [...filteredCommands].sort((a, b) => {
    const aUsage = commandUsage.find((item) => item.id === a.id)?.count || 0;
    const bUsage = commandUsage.find((item) => item.id === b.id)?.count || 0;
    return bUsage - aUsage;
  });

  // Get most frequently used commands
  const frequentCommands = sortedCommands.slice(0, 6);

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("voiceCommands")}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsManagingCommands(!isManagingCommands)}
            className={`px-3 py-1 rounded-lg text-white text-sm flex items-center ${
              isManagingCommands
                ? "bg-blue-700"
                : preferences.highContrast
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <Pencil size={16} className="mr-1" />
            {isManagingCommands ? "Done" : "Manage Commands"}
          </button>
        </div>
      </div>

      {/* Recognition feedback */}
      {feedbackVisible && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            feedbackSuccess
              ? "bg-green-100 border-green-500"
              : "bg-yellow-100 border-yellow-500"
          } border-l-4`}
        >
          <div className="flex items-center">
            {feedbackSuccess ? (
              <CircleCheck className="text-green-500 mr-2" size={20} />
            ) : (
              <CircleAlert className="text-yellow-500 mr-2" size={20} />
            )}
            <div>
              <h3 className="font-medium">
                {feedbackSuccess
                  ? "Command Recognized"
                  : "Not Sure What You Said"}
              </h3>
              <p className="text-sm">{recognizedCommand}</p>
            </div>
          </div>
        </div>
      )}

      {/* Command management mode */}
      {isManagingCommands && (
        <div className="mb-6 p-4 rounded-lg bg-gray-50 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Manage Commands</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditingCommand(null);
                }}
                className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm flex items-center"
              >
                <Plus size={16} className="mr-1" />
                New Command
              </button>

              <button
                onClick={exportCommands}
                className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm flex items-center"
              >
                <Download size={16} className="mr-1" />
                Export
              </button>

              <label className="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm flex items-center cursor-pointer">
                <Upload size={16} className="mr-1" />
                Import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importCommands}
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Command
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commands.map((command) => {
                  const usageCount =
                    commandUsage.find((item) => item.id === command.id)
                      ?.count || 0;

                  return (
                    <tr key={command.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-2xl">
                        {command.icon}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {command.text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">
                        {command.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usageCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCommand(command)}
                            className="p-1 rounded-full text-blue-500 hover:bg-blue-100"
                          >
                            <Pencil size={16} />
                          </button>
                          {command.isCustom && (
                            <button
                              onClick={() => handleDeleteCommand(command.id)}
                              className="p-1 rounded-full text-red-500 hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Command categories */}
      {!isEditing && (
        <div className="mb-4">
          <div className="flex flex-wrap space-x-2 mb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                activeCategory === null
                  ? preferences.highContrast
                    ? "bg-blue-700 text-white"
                    : "bg-blue-500 text-white"
                  : preferences.highContrast
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {Object.values(COMMAND_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 rounded-full text-sm capitalize ${
                  activeCategory === category
                    ? preferences.highContrast
                      ? "bg-blue-700 text-white"
                      : "bg-blue-500 text-white"
                    : preferences.highContrast
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick access section for frequently used commands */}
      {!isEditing && frequentCommands.length > 0 && !isManagingCommands && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Frequently Used</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {frequentCommands.map((command) => {
              const usageCount =
                commandUsage.find((item) => item.id === command.id)?.count || 0;

              return (
                <button
                  key={command.id}
                  onClick={() => speakCommand(command.text, command.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg shadow-sm transition-transform transform hover:scale-105 ${
                    preferences.highContrast
                      ? "bg-slate-800 text-white hover:bg-slate-700"
                      : "bg-white hover:bg-blue-50"
                  }`}
                  style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                  <span
                    className="text-2xl"
                    role="img"
                    aria-label={command.text}
                  >
                    {command.icon}
                  </span>
                  <p
                    className={`${
                      preferences.largeText ? "text-sm" : "text-xs"
                    } font-medium mt-1 text-center truncate w-full`}
                  >
                    {command.text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Command editor */}
      {isEditing ? (
        <CommandEditor
          command={editingCommand}
          onSave={handleSaveCommand}
          onCancel={() => {
            setIsEditing(false);
            setEditingCommand(null);
          }}
        />
      ) : (
        // Main command grid
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedCommands.map((command) => {
            const usageCount =
              commandUsage.find((item) => item.id === command.id)?.count || 0;

            return (
              <button
                key={command.id}
                onClick={() => speakCommand(command.text, command.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
                  preferences.highContrast
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-white hover:bg-blue-50"
                }`}
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                <span
                  className="text-3xl mb-2"
                  role="img"
                  aria-label={command.text}
                >
                  {command.icon}
                </span>
                <p
                  className={`${
                    preferences.largeText ? "text-lg" : "text-base"
                  } font-medium`}
                >
                  {command.text}
                </p>
                <div className="mt-2 flex items-center justify-center">
                  <Volume2 size={16} className="text-blue-500 mr-1" />
                  <span className="text-xs text-gray-500">Tap to speak</span>
                </div>
                {usageCount > 0 && (
                  <span className="mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Used {usageCount} times
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Voice recognition control */}
      {!isEditing && (
        <div className="mt-8 p-4 rounded-lg bg-blue-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-blue-800">
              Voice Recognition
            </h2>
            <p className="text-sm text-blue-600">
              Tap the microphone to recognize speech and convert to commands
            </p>
            {isListening && recognizedText && (
              <div className="mt-2 flex items-center">
                <p className="text-sm font-medium">{recognizedText}</p>
                <ArrowRight size={16} className="mx-2" />
                <div
                  className={`w-3 h-3 rounded-full ${
                    confidence > 0.7
                      ? "bg-green-500"
                      : confidence > 0.4
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
              </div>
            )}
          </div>
          <button
            className={`p-4 rounded-full ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : preferences.highContrast
                ? "bg-blue-700 text-white"
                : "bg-blue-500 text-white"
            }`}
            aria-label={
              isListening ? "Stop voice recognition" : "Start voice recognition"
            }
            onClick={() => (isListening ? stopListening() : startListening())}
            disabled={!browserSupportsSpeechRecognition}
          >
            <Mic size={24} />
          </button>
        </div>
      )}

      {!isEditing && !browserSupportsSpeechRecognition && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
          <p className="font-medium">
            Your browser doesn't support speech recognition.
          </p>
          <p className="text-sm">
            Please try using Google Chrome for this feature.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceCommands;
