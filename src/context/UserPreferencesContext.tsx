import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface UserPreferences {
  highContrast: boolean;
  largeText: boolean;
  offlineMode: boolean;
  speechRate: number;
  speechPitch: number;
  audioFeedback: boolean;
  keyboardNavigation: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
}

const defaultPreferences: UserPreferences = {
  highContrast: false,
  largeText: false,
  offlineMode: false,
  speechRate: 1.0,
  speechPitch: 1.0,
  audioFeedback: true,
  keyboardNavigation: false,
};

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: defaultPreferences,
  updatePreference: () => {},
});

export const useUserPreferences = () => useContext(UserPreferencesContext);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider = ({
  children,
}: UserPreferencesProviderProps) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    // Load preferences from localStorage
    const storedPreferences = localStorage.getItem('userPreferences');
    if (storedPreferences) {
      try {
        setPreferences(JSON.parse(storedPreferences));
      } catch (e) {
        console.error('Failed to parse stored preferences');
      }
    }
  }, []);

  useEffect(() => {
    // Apply accessibility preferences to the document
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (preferences.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    
    if (preferences.keyboardNavigation) {
      document.documentElement.classList.add('keyboard-nav');
    } else {
      document.documentElement.classList.remove('keyboard-nav');
    }
    
    // Handle audio feedback
    if (preferences.audioFeedback) {
      const setupAudioFeedback = () => {
        // Add event listeners for buttons to play subtle click sounds
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          button.addEventListener('click', playFeedbackSound);
        });
      };
      
      // Simple audio feedback implementation
      const playFeedbackSound = () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.1;
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start();
          
          // Short duration
          setTimeout(() => {
            oscillator.stop();
            audioContext.close();
          }, 50);
        } catch (e) {
          console.error('Audio feedback error:', e);
        }
      };
      
      // Set up listeners when the DOM is fully loaded
      if (document.readyState === 'complete') {
        setupAudioFeedback();
      } else {
        window.addEventListener('load', setupAudioFeedback);
        return () => window.removeEventListener('load', setupAudioFeedback);
      }
    }
  }, [preferences]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    // Save to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
