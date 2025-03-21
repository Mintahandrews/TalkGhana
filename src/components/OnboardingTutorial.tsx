import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Command, MessageSquare, Mic, Settings, Volume2, X } from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { preferences } = useUserPreferences();
  
  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const tutorials = [
    {
      title: "Welcome to TalkGhana",
      description: "TalkGhana helps you communicate effectively using voice commands and text-to-speech technology.",
      icon: <Volume2 size={48} className="text-blue-500" />,
    },
    {
      title: "Voice Commands",
      description: "Quickly communicate common needs and phrases using pre-defined or custom voice commands.",
      icon: <Command size={48} className="text-blue-500" />,
    },
    {
      title: "Conversation Mode",
      description: "Have back-and-forth conversations using voice or text input. The app will generate responses based on context.",
      icon: <MessageSquare size={48} className="text-blue-500" />,
    },
    {
      title: "Voice Recognition",
      description: "Speak into your device and TalkGhana will convert your speech to text. Works with various Ghanaian languages.",
      icon: <Mic size={48} className="text-blue-500" />,
    },
    {
      title: "Accessibility Features",
      description: "Customize the app with high contrast mode, large text, and other accessibility options from the settings menu.",
      icon: <Settings size={48} className="text-blue-500" />,
    },
  ];
  
  const handleNext = () => {
    if (currentStep < tutorials.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed
      localStorage.setItem('onboardingCompleted', 'true');
      onClose();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    // Mark onboarding as completed even if skipped
    localStorage.setItem('onboardingCompleted', 'true');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full ${
          preferences.highContrast ? 'border-2 border-white text-white bg-black' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div className="p-4 flex justify-end">
          <button
            onClick={handleSkip}
            className={`p-2 rounded-full ${
              preferences.highContrast ? 'text-white hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label="Skip tutorial"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-8 py-6 text-center">
          <div className="flex justify-center mb-6">
            {tutorials[currentStep].icon}
          </div>
          
          <h2 
            id="tutorial-title"
            className={`text-2xl font-bold mb-4 ${
              preferences.highContrast ? 'text-white' : 'text-gray-800'
            }`}
          >
            {tutorials[currentStep].title}
          </h2>
          
          <p className={`mb-8 ${preferences.highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
            {tutorials[currentStep].description}
          </p>
          
          <div className="flex justify-center mb-6">
            {tutorials.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 mx-1 rounded-full ${
                  currentStep === index
                    ? preferences.highContrast ? 'bg-blue-400' : 'bg-blue-500'
                    : preferences.highContrast ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between border-t">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg flex items-center ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : preferences.highContrast
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className={`px-4 py-2 rounded-lg flex items-center ${
              preferences.highContrast
                ? 'bg-blue-700 text-white hover:bg-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {currentStep === tutorials.length - 1 ? 'Get Started' : 'Next'}
            {currentStep < tutorials.length - 1 && <ChevronRight size={16} className="ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
