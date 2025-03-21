import { useState, useEffect } from 'react';
import { Eye, EyeOff, MousePointer, SlidersVertical, Type, Vibrate, ZoomIn, ZoomOut } from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useLanguage } from '../context/LanguageContext';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onClose }) => {
  const { preferences, updatePreference } = useUserPreferences();
  const { t } = useLanguage();
  const [touchTargetSize, setTouchTargetSize] = useState<'normal' | 'large' | 'extra-large'>(
    (localStorage.getItem('touchTargetSize') as any) || 'normal'
  );
  const [motion, setMotion] = useState<boolean>(
    localStorage.getItem('reduceMotion') === 'true'
  );

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('touchTargetSize', touchTargetSize);
  }, [touchTargetSize]);

  useEffect(() => {
    localStorage.setItem('reduceMotion', motion.toString());
    if (motion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [motion]);

  if (!isOpen) return null;

  const handleTouchTargetChange = (size: 'normal' | 'large' | 'extra-large') => {
    setTouchTargetSize(size);
    document.documentElement.classList.remove('touch-normal', 'touch-large', 'touch-xl');
    document.documentElement.classList.add(`touch-${size === 'extra-large' ? 'xl' : size}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="accessibility-title">
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto ${
          preferences.highContrast ? 'border-2 border-white text-white bg-black' : ''
        }`}
      >
        <div className="sticky top-0 bg-blue-600 text-white p-4 rounded-t-lg">
          <h2 id="accessibility-title" className="text-xl font-bold flex items-center">
            <SlidersVertical className="mr-2" size={20} />
            Accessibility Options
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Visual */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Eye className="mr-2" size={18} />
              Visual Settings
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="flex items-center">
                  <span className="mr-2">High Contrast Mode</span>
                </label>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                    preferences.highContrast ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  onClick={() => updatePreference('highContrast', !preferences.highContrast)}
                  role="switch"
                  aria-checked={preferences.highContrast}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      updatePreference('highContrast', !preferences.highContrast);
                    }
                  }}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                      preferences.highContrast ? 'translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <label className="flex items-center">
                  <span className="mr-2">Large Text</span>
                </label>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                    preferences.largeText ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  onClick={() => updatePreference('largeText', !preferences.largeText)}
                  role="switch"
                  aria-checked={preferences.largeText}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      updatePreference('largeText', !preferences.largeText);
                    }
                  }}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                      preferences.largeText ? 'translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <label className="flex items-center">
                  <span className="mr-2">Reduce Motion</span>
                </label>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                    motion ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  onClick={() => setMotion(!motion)}
                  role="switch"
                  aria-checked={motion}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setMotion(!motion);
                    }
                  }}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                      motion ? 'translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Touch targets */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <MousePointer className="mr-2" size={18} />
              Touch Target Size
            </h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleTouchTargetChange('normal')}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    touchTargetSize === 'normal' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  aria-pressed={touchTargetSize === 'normal'}
                >
                  Normal
                </button>
                <button 
                  onClick={() => handleTouchTargetChange('large')}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    touchTargetSize === 'large' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  aria-pressed={touchTargetSize === 'large'}
                >
                  Large
                </button>
                <button 
                  onClick={() => handleTouchTargetChange('extra-large')}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    touchTargetSize === 'extra-large' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  aria-pressed={touchTargetSize === 'extra-large'}
                >
                  Extra Large
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Increase button and interactive element sizes for easier touch access
              </p>
            </div>
          </section>
          
          {/* Feedback */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Vibrate className="mr-2" size={18} />
              Feedback Settings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="flex items-center">
                  <span className="mr-2">Audio Feedback</span>
                </label>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                    preferences.audioFeedback ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  onClick={() => updatePreference('audioFeedback', !preferences.audioFeedback)}
                  role="switch"
                  aria-checked={preferences.audioFeedback}
                  tabIndex={0}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                      preferences.audioFeedback ? 'translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Play subtle sounds when actions are performed
              </p>
              
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Note: For haptic feedback, you may need to enable it in your device settings.
                </p>
              </div>
            </div>
          </section>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end border-t">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              preferences.highContrast
                ? 'bg-blue-700 text-white hover:bg-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
