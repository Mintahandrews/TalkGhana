import { useState, useEffect, useRef } from "react";
import {
  Archive,
  Calendar,
  Clock,
  Loader,
  Mic,
  PanelRight,
  PanelRightClose,
  Send,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useSpeechRecognition } from "../services/SpeechRecognitionService";
import { useTextToSpeech } from "../services/TextToSpeechService";
import SpeechFeedback from "../components/SpeechFeedback";
import ConversationSuggestions from "../components/ConversationSuggestions";

interface Message {
  id: number;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastActive: Date;
  messages: Message[];
}

const ConversationMode = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { t, currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();

  // Initialize speech recognition
  const {
    text: recognizedText,
    isListening,
    error: recognitionError,
    confidence,
    startListening,
    stopListening,
    resetText,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition(currentLanguage);

  // Initialize text-to-speech
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    selectedVoice,
    setSelectedVoice,
    browserSupportsTTS,
  } = useTextToSpeech(currentLanguage);

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
      console.log(`Language change event received in Conversation Mode`);

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
          setSelectedVoice(languageVoices[0].name);
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
    resetText,
    browserSupportsSpeechRecognition,
    browserSupportsTTS,
    setSelectedVoice,
  ]);

  // Common phrases and responses for the AI to use
  const commonPhrases = [
    {
      phrase: "hello",
      responses: [
        "Hello! How can I help you today?",
        "Hi there! What can I do for you?",
      ],
    },
    {
      phrase: "how are you",
      responses: [
        "I'm functioning well, thank you for asking! How are you?",
        "I'm here and ready to help!",
      ],
    },
    {
      phrase: "thank you",
      responses: ["You're welcome!", "Glad I could help!", "It's my pleasure."],
    },
    {
      phrase: "help",
      responses: ["What do you need help with?", "I'm here to assist you."],
    },
    {
      phrase: "bye",
      responses: ["Goodbye! Have a great day!", "See you later!"],
    },
  ];

  // Load conversations from localStorage
  useEffect(() => {
    const storedConversations = localStorage.getItem("conversations");
    if (storedConversations) {
      try {
        const parsedConversations = JSON.parse(storedConversations);
        // Convert string dates back to Date objects
        parsedConversations.forEach((convo: any) => {
          convo.lastActive = new Date(convo.lastActive);
          convo.messages.forEach((msg: any) => {
            msg.timestamp = new Date(msg.timestamp);
          });
        });
        setConversations(parsedConversations);
      } catch (e) {
        console.error("Failed to parse stored conversations");
      }
    }
  }, []);

  // Start a new conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createNewConversation();
    } else if (!currentConversation) {
      // Set the most recent conversation as current
      setCurrentConversation(conversations[0].id);
      setMessages(conversations[0].messages);
    }
  }, [conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update input text when speech is recognized
  useEffect(() => {
    if (recognizedText) {
      setInputText(recognizedText);
    }
  }, [recognizedText]);

  // Handle errors
  useEffect(() => {
    if (recognitionError) {
      console.error("Speech recognition error:", recognitionError);
    }
  }, [recognitionError]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `Conversation on ${new Date().toLocaleDateString()}`,
      lastActive: new Date(),
      messages: [],
    };

    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation.id);
    setMessages([]);
    saveConversations([newConversation, ...conversations]);
  };

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversationId);
      setMessages(conversation.messages);
      setShowHistory(false);
    }
  };

  const deleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      const updatedConversations = conversations.filter(
        (c) => c.id !== conversationId
      );
      setConversations(updatedConversations);
      saveConversations(updatedConversations);

      // If we deleted the current conversation, load another one
      if (conversationId === currentConversation) {
        if (updatedConversations.length > 0) {
          loadConversation(updatedConversations[0].id);
        } else {
          createNewConversation();
        }
      }
    }
  };

  const saveConversations = (conversationsToSave: Conversation[]) => {
    localStorage.setItem("conversations", JSON.stringify(conversationsToSave));
  };

  const updateCurrentConversation = (newMessages: Message[]) => {
    if (!currentConversation) return;

    const updatedConversations = conversations.map((convo) => {
      if (convo.id === currentConversation) {
        return {
          ...convo,
          messages: newMessages,
          lastActive: new Date(),
        };
      }
      return convo;
    });

    setConversations(updatedConversations);
    saveConversations(updatedConversations);
  };

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    const newUserMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputText("");
    resetText();
    setLoading(true);

    // Update the conversation in storage
    updateCurrentConversation(updatedMessages);

    // Find a response based on the input (simulating AI response)
    setTimeout(() => {
      let responseText = "";
      const input = inputText.toLowerCase();

      // Try to match with common phrases
      const matchedPhrase = commonPhrases.find((item) =>
        input.includes(item.phrase)
      );

      if (matchedPhrase) {
        // Random response from the matched phrase
        const responses = matchedPhrase.responses;
        responseText = responses[Math.floor(Math.random() * responses.length)];
      } else {
        // Generate a context-aware response based on conversation history
        if (messages.length > 0) {
          if (input.includes("help")) {
            responseText =
              "I'm here to help. Could you tell me more about what you need?";
          } else if (
            input.includes("weather") ||
            input.includes("temperature")
          ) {
            responseText =
              "I'm sorry, I don't have access to real-time weather data in this version.";
          } else if (input.includes("name")) {
            responseText =
              "My name is TalkGhana, I'm your AI conversation assistant.";
          } else if (input.length < 10) {
            responseText =
              "Could you please elaborate a bit more so I can better assist you?";
          } else {
            // Simulate understanding the message in the selected language
            responseText = `I understand that you said "${inputText}" in ${currentLanguage}. This is a simulated response as if I were properly trained on Ghanaian languages.`;
          }
        } else {
          responseText = "Hello! How can I assist you today?";
        }
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: responseText,
        sender: "assistant",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      setLoading(false);

      // Update conversation in storage
      updateCurrentConversation(finalMessages);

      // Speak the response
      if (browserSupportsTTS) {
        speak(responseText, preferences.speechRate, preferences.speechPitch);
      }
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Generate contextual suggestions based on conversation history
  const generateSuggestions = (): string[] => {
    // Start with some default suggestions
    const defaultSuggestions = [
      "Hello, how are you?",
      "I need help.",
      "Thank you for your assistance.",
      "Could you explain that again?",
    ];

    // If we have conversation history, try to generate contextual suggestions
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // If the last message was from the assistant, generate relevant responses
      if (lastMessage.sender === "assistant") {
        const text = lastMessage.text.toLowerCase();

        if (text.includes("how can i help")) {
          return [
            "I need information about...",
            "I'd like to have a conversation.",
            "I'm just exploring the app.",
            "Can you tell me what you can do?",
          ];
        } else if (text.includes("hello") || text.includes("hi there")) {
          return [
            "I'm doing well, thank you.",
            "I need some assistance.",
            "What can you help me with?",
            "Tell me about yourself.",
          ];
        } else if (text.includes("question")) {
          return [
            "Yes, I understand.",
            "No, could you explain more?",
            "I'm not sure.",
            "Can we talk about something else?",
          ];
        }
      }

      // Add some follow-up suggestions based on user's previous messages
      const userMessages = messages
        .filter((m) => m.sender === "user")
        .map((m) => m.text.toLowerCase());
      if (userMessages.some((m) => m.includes("weather"))) {
        defaultSuggestions.push("What's the weather like tomorrow?");
      }
      if (userMessages.some((m) => m.includes("help"))) {
        defaultSuggestions.push("I need more help with this.");
      }
    }

    return defaultSuggestions;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t("conversationMode")}</h1>
        <div className="flex space-x-2">
          <button
            onClick={createNewConversation}
            className={`p-2 rounded-lg text-white ${
              preferences.highContrast
                ? "bg-blue-700 hover:bg-blue-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            aria-label="New conversation"
          >
            <Archive size={18} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg ${
              showHistory
                ? "bg-blue-500 text-white"
                : preferences.highContrast
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label={
              showHistory ? "Close history" : "Show conversation history"
            }
          >
            {showHistory ? (
              <PanelRightClose size={18} />
            ) : (
              <PanelRight size={18} />
            )}
          </button>
        </div>
      </div>

      {recognitionError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{recognitionError}</p>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div
          className={`flex-1 flex flex-col ${
            showHistory ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex-1 overflow-y-auto mb-4 rounded-lg bg-white shadow p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Start a conversation by typing a message or selecting a
                suggestion below.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === "user"
                        ? "ml-auto bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-xs ${
                          message.sender === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.sender === "user" ? "You" : "TalkGhana"}
                      </span>
                      <span
                        className={`text-xs ${
                          message.sender === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p>{message.text}</p>
                    {message.sender === "assistant" && (
                      <button
                        onClick={() =>
                          speak(
                            message.text,
                            preferences.speechRate,
                            preferences.speechPitch
                          )
                        }
                        className="mt-1 text-gray-600 hover:text-blue-500"
                        aria-label="Speak message"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <ConversationSuggestions
            suggestions={generateSuggestions()}
            onSuggestionClick={handleSuggestionClick}
          />

          {/* Show recognized speech if listening */}
          {isListening && (
            <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center">
              <div className="flex-1">
                <p className="font-medium">Listening...</p>
                <p
                  className={
                    recognizedText ? "text-gray-800" : "text-gray-500 italic"
                  }
                >
                  {recognizedText || "Say something..."}
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full ${
                  confidence > 0.8
                    ? "bg-green-500"
                    : confidence > 0.5
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></div>
            </div>
          )}

          <div className="flex space-x-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                preferences.largeText ? "text-lg" : "text-base"
              } ${
                preferences.highContrast
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white border-gray-300"
              }`}
              rows={2}
            />
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleSendMessage}
                disabled={inputText.trim() === "" || loading}
                className={`p-3 rounded-lg ${
                  inputText.trim() === "" || loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : preferences.highContrast
                    ? "bg-blue-700 text-white hover:bg-blue-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="Send message"
              >
                {loading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
              <button
                onClick={toggleListening}
                disabled={!browserSupportsSpeechRecognition}
                className={`p-3 rounded-lg ${
                  !browserSupportsSpeechRecognition
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isListening
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : preferences.highContrast
                    ? "bg-green-700 text-white hover:bg-green-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
                aria-label={isListening ? "Stop recording" : "Record voice"}
              >
                {isListening ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <Mic size={20} />
                )}
              </button>
              <button
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                className={`p-3 rounded-lg ${
                  !isSpeaking
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : preferences.highContrast
                    ? "bg-red-700 text-white hover:bg-red-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
                aria-label="Stop speech"
              >
                <VolumeX size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Conversation history sidebar */}
        {showHistory && (
          <div className="w-full md:w-1/3 flex flex-col bg-white rounded-lg shadow p-4 overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Archive size={18} className="mr-2" />
              Conversation History
            </h2>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => loadConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer ${
                        conversation.id === currentConversation
                          ? preferences.highContrast
                            ? "bg-blue-700 text-white"
                            : "bg-blue-100 border-l-4 border-blue-500"
                          : preferences.highContrast
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate max-w-[80%]">
                          {conversation.title}
                        </h3>
                        <button
                          onClick={(e) =>
                            deleteConversation(conversation.id, e)
                          }
                          className={`p-1 rounded-full ${
                            preferences.highContrast
                              ? "text-gray-300 hover:bg-red-700 hover:text-white"
                              : "text-gray-500 hover:bg-red-100 hover:text-red-500"
                          }`}
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Calendar size={12} className="mr-1" />
                        <span className="mr-2">
                          {conversation.lastActive.toLocaleDateString()}
                        </span>
                        <Clock size={12} className="mr-1" />
                        <span>
                          {conversation.lastActive.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {conversation.messages.length > 0
                          ? `${conversation.messages.length} messages`
                          : "No messages yet"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHistory(false)}
              className={`mt-4 w-full py-2 rounded-lg ${
                preferences.highContrast
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Close History
            </button>
          </div>
        )}
      </div>

      {/* Visual feedback component */}
      <SpeechFeedback isListening={isListening} isSpeaking={isSpeaking} />
    </div>
  );
};

export default ConversationMode;
