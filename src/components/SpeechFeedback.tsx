import { useState, useEffect } from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface SpeechFeedbackProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  children?: React.ReactNode;
}

/**
 * A visual feedback component for speech recognition and synthesis
 */
const SpeechFeedback: React.FC<SpeechFeedbackProps> = ({
  isListening = false,
  isSpeaking = false,
  children
}) => {
  const [dots, setDots] = useState('');
  
  // Animated dots effect
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [isListening, isSpeaking]);
  
  if (!isListening && !isSpeaking) return null;
  
  return (
    <div className="fixed z-50 bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-4 py-2 flex items-center">
      {isListening ? (
        <>
          <div className="relative">
            <Mic className="text-red-500 animate-pulse" size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
          <span className="ml-2 text-sm font-medium">
            Listening{dots}
          </span>
        </>
      ) : isSpeaking ? (
        <>
          <div className="relative">
            <Volume2 className="text-blue-500" size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </div>
          <span className="ml-2 text-sm font-medium">
            Speaking{dots}
          </span>
        </>
      ) : null}
      
      {children}
    </div>
  );
};

export default SpeechFeedback;
