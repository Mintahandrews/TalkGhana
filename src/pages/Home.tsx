import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Squircle,
  Bell,
  CircleHelp,
  MessageSquare,
  Mic,
  Settings,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import QuickActionButton from "../components/QuickActionButton";
import StatusIndicator from "../components/StatusIndicator";
import OnboardingTutorial from "../components/OnboardingTutorial";
import ContextualHelp from "../components/ContextualHelp";
import AccessibilityPanel from "../components/AccessibilityPanel";
import GhanaianSpeechDemo from "../components/GhanaianSpeechDemo";

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { preferences } = useUserPreferences();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [showSpeechDemo, setShowSpeechDemo] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "online" | "processing" | "success" | "error";
    message: string;
    visible: boolean;
  }>({ type: "online", message: "", visible: false });

  // Check if first time user
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleEmergencyAction = () => {
    setStatusMessage({
      type: "processing",
      message: "Accessing emergency features...",
      visible: true,
    });

    setTimeout(() => {
      navigate("/voice-commands");
      // We'll show a success message after navigation
      setTimeout(() => {
        setStatusMessage({
          type: "success",
          message: "Emergency commands ready",
          visible: true,
        });
      }, 500);
    }, 1000);
  };

  const showAccessibilityControls = () => {
    setShowAccessibilityPanel(true);
  };

  return (
    <div className="flex flex-col space-y-6 py-4">
      <StatusIndicator
        type={statusMessage.type}
        message={statusMessage.message}
        isVisible={statusMessage.visible}
      />

      <div className="text-center">
        <h1
          className={`${
            preferences.largeText ? "text-4xl" : "text-3xl"
          } font-bold text-blue-600`}
        >
          {t("homeTitle")}
        </h1>
        <p className="mt-2 text-gray-600">{t("homeSubtitle")}</p>
      </div>

      {/* Emergency Action Section */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center justify-between">
        <div className="flex items-center">
          <Squircle className="text-red-500 mr-3" size={24} />
          <div>
            <h2 className="font-bold text-red-800">Emergency Quick Access</h2>
            <p className="text-red-600 text-sm">
              Fast access to emergency communication
            </p>
          </div>
        </div>
        <button
          onClick={handleEmergencyAction}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center"
          aria-label="Emergency communication"
        >
          <span className="mr-1">Emergency</span>
          <Bell size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
        <QuickActionButton
          icon={<MessageSquare size={24} />}
          label="Conversation"
          onClick={() => navigate("/conversation")}
          color="blue"
          size="lg"
        />

        <QuickActionButton
          icon={<Mic size={24} />}
          label="Commands"
          onClick={() => navigate("/voice-commands")}
          color="green"
          size="lg"
        />

        <QuickActionButton
          icon={<Settings size={24} />}
          label="Settings"
          onClick={() => navigate("/settings")}
          color="purple"
          size="lg"
        />

        <QuickActionButton
          icon={<CircleHelp size={24} />}
          label="Accessibility"
          onClick={showAccessibilityControls}
          color="yellow"
          size="lg"
        />
      </div>

      {/* Ghanaian Speech Demo */}
      <div
        className={`rounded-lg shadow-md p-4 ${
          preferences.highContrast ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Enhanced Ghanaian Speech</h2>
          <button
            onClick={() => setShowSpeechDemo(!showSpeechDemo)}
            className={`px-3 py-1 rounded-md text-sm ${
              preferences.highContrast
                ? "bg-blue-700 text-white hover:bg-blue-800"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            {showSpeechDemo ? "Hide Demo" : "Show Demo"}
          </button>
        </div>

        {showSpeechDemo ? (
          <GhanaianSpeechDemo />
        ) : (
          <p
            className={`${
              preferences.highContrast ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Try our enhanced speech capabilities for Ghanaian languages with
            improved pronunciation, phonetic mappings, and natural-sounding
            voices.
          </p>
        )}
      </div>

      {/* Recently Used Commands */}
      <div
        className={`rounded-lg shadow-md p-4 ${
          preferences.highContrast ? "bg-gray-900" : "bg-white"
        }`}
      >
        <h2 className="text-lg font-semibold mb-3">Recently Used</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {/* This would be populated from actual usage data */}
          {[
            { icon: "💧", text: "I need water" },
            { icon: "🆘", text: "Help me" },
            { icon: "🚻", text: "Bathroom" },
            { icon: "👋", text: "Hello" },
            { icon: "🙏", text: "Thank you" },
            { icon: "❌", text: "No" },
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setStatusMessage({
                  type: "success",
                  message: `Speaking: "${item.text}"`,
                  visible: true,
                });
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                preferences.highContrast
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <span className="text-2xl" role="img" aria-label={item.text}>
                {item.icon}
              </span>
              <span
                className={`mt-1 text-xs ${
                  preferences.largeText ? "text-sm" : ""
                } text-center`}
              >
                {item.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Usage Tips */}
      <div
        className={`rounded-lg shadow-md p-4 ${
          preferences.highContrast ? "bg-gray-900" : "bg-white"
        }`}
      >
        <h2 className="text-lg font-semibold mb-3">Tips & Guides</h2>
        <div className="space-y-2">
          <button
            onClick={() => setShowOnboarding(true)}
            className={`w-full text-left p-3 rounded-lg flex items-center ${
              preferences.highContrast
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-blue-50 hover:bg-blue-100"
            }`}
          >
            <div className="bg-blue-500 text-white p-2 rounded-full mr-3">
              <CircleHelp size={18} />
            </div>
            <div>
              <h3 className="font-medium">App Tutorial</h3>
              <p
                className={`text-sm ${
                  preferences.highContrast ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Learn how to use all features of TalkGhana
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/voice-commands")}
            className={`w-full text-left p-3 rounded-lg flex items-center ${
              preferences.highContrast
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-green-50 hover:bg-green-100"
            }`}
          >
            <div className="bg-green-500 text-white p-2 rounded-full mr-3">
              <Mic size={18} />
            </div>
            <div>
              <h3 className="font-medium">Create Custom Commands</h3>
              <p
                className={`text-sm ${
                  preferences.highContrast ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Set up personalized voice commands for your needs
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={showAccessibilityPanel}
        onClose={() => setShowAccessibilityPanel(false)}
      />

      {/* Contextual Help */}
      <ContextualHelp section="home" />
    </div>
  );
};

export default Home;
