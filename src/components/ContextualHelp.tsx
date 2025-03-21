import { useState, useEffect } from 'react';
import { CircleAlert, ArrowRight, ShieldQuestion, X } from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';

interface ContextualHelpProps {
  section: 'home' | 'conversation' | 'voiceCommands' | 'settings';
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({ section }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [autoShown, setAutoShown] = useState(false);
  const { preferences } = useUserPreferences();
  
  // Auto show help on first visit to each section
  useEffect(() => {
    const helpDismissed = localStorage.getItem(`help-dismissed-${section}`);
    if (!helpDismissed && !autoShown) {
      // Show help after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
        setAutoShown(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [section, autoShown]);
  
  const handleDismiss = () => {
    setIsOpen(false);
    setHasDismissed(true);
    localStorage.setItem(`help-dismissed-${section}`, 'true');
  };
  
  const helpContent = {
    home: {
      title: "Welcome to TalkGhana",
      tips: [
        "Access different features through the cards on the home screen",
        "Use the bottom navigation to quickly switch between sections",
        "Customize your experience in the Settings page",
      ],
      keyAction: "Try tapping on the Conversation Mode card to get started",
    },
    conversation: {
      title: "Using Conversation Mode",
      tips: [
        "Tap the microphone button to start voice recognition",
        "Type in the text area for manual input",
        "View suggested responses below the conversation",
        "Access conversation history using the button in the top right",
      ],
      keyAction: "Try starting a conversation by saying 'Hello' or 'Help me'",
    },
    voiceCommands: {
      title: "Working with Voice Commands",
      tips: [
        "Browse commands by category using the buttons at the top",
        "Tap on any command to speak it out loud",
        "Create custom commands using the Manage Commands button",
        "Use the microphone at the bottom to recognize speech and match to commands",
      ],
      keyAction: "Try creating a custom command for a phrase you use often",
    },
    settings: {
      title: "Customizing Your Experience",
      tips: [
        "Change the language for speech recognition and display",
        "Enable high contrast or large text for better visibility",
        "Adjust speech rate and pitch for better understanding",
        "Download language models for offline use",
      ],
      keyAction: "Try enabling high contrast mode and see how it looks",
    },
  };
  
  const content = helpContent[section];
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 p-3 rounded-full shadow-lg z-40 ${
          preferences.highContrast
            ? 'bg-blue-700 text-white hover:bg-blue-600'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        aria-label="Show help"
      >
        <ShieldQuestion size={24} />
      </button>
      
      {isOpen && (
        <div className="fixed inset-x-0 bottom-24 mx-4 z-40">
          <div 
            className={`rounded-lg shadow-lg overflow-hidden ${
              preferences.highContrast ? 'bg-gray-900 border border-gray-700' : 'bg-white'
            }`}
            role="dialog"
            aria-labelledby="help-title"
          >
            <div className="p-4 bg-blue-500 text-white flex justify-between items-center">
              <h3 id="help-title" className="font-medium flex items-center">
                <CircleAlert size={18} className="mr-2" />
                {content.title}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-white hover:bg-blue-600 rounded-full p-1"
                aria-label="Close help"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4">
              <ul className="space-y-2 mb-4">
                {content.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight size={16} className="mr-2 mt-1 flex-shrink-0 text-blue-500" />
                    <span className={preferences.highContrast ? 'text-gray-300' : 'text-gray-700'}>
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className={`p-3 rounded-lg ${
                preferences.highContrast ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-800'
              }`}>
                <p className="text-sm font-medium">
                  <strong>Try it:</strong> {content.keyAction}
                </p>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 flex justify-end border-t">
              <button
                onClick={handleDismiss}
                className={`px-4 py-2 rounded ${
                  preferences.highContrast
                    ? 'bg-blue-700 text-white hover:bg-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextualHelp;
