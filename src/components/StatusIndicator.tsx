import { useEffect, useState } from 'react';
import { Squircle, Check, Wifi, WifiOff, Zap } from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';

interface StatusIndicatorProps {
  type?: 'online' | 'processing' | 'success' | 'error';
  message?: string;
  timeout?: number;
  isVisible?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type = 'online',
  message,
  timeout = 3000,
  isVisible = false
}) => {
  const [visible, setVisible] = useState(isVisible);
  const [isMounted, setIsMounted] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const { preferences } = useUserPreferences();
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Handle visibility and auto-hide
  useEffect(() => {
    setIsMounted(true);
    setVisible(isVisible);
    
    if (isVisible && timeout > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, timeout]);
  
  // Always show offline indicator when offline
  useEffect(() => {
    if (!onlineStatus) {
      setVisible(true);
    } else if (type === 'online') {
      // When coming back online, show briefly then hide
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [onlineStatus, type]);
  
  if (!isMounted) return null;
  
  // Don't render if not visible and not offline
  if (!visible && onlineStatus) return null;
  
  // For offline status, override the type
  const displayType = !onlineStatus ? 'offline' : type;
  const displayMessage = !onlineStatus 
    ? 'You are offline. Some features may be limited.'
    : message;
  
  const getTypeStyles = () => {
    switch (displayType) {
      case 'offline':
        return {
          bgColor: preferences.highContrast ? 'bg-yellow-900' : 'bg-yellow-100',
          textColor: preferences.highContrast ? 'text-yellow-100' : 'text-yellow-800',
          icon: <WifiOff size={16} className={preferences.highContrast ? 'text-yellow-100' : 'text-yellow-500'} />
        };
      case 'processing':
        return {
          bgColor: preferences.highContrast ? 'bg-blue-900' : 'bg-blue-100',
          textColor: preferences.highContrast ? 'text-blue-100' : 'text-blue-800',
          icon: <Zap size={16} className={preferences.highContrast ? 'text-blue-100' : 'text-blue-500'} />
        };
      case 'success':
        return {
          bgColor: preferences.highContrast ? 'bg-green-900' : 'bg-green-100',
          textColor: preferences.highContrast ? 'text-green-100' : 'text-green-800',
          icon: <Check size={16} className={preferences.highContrast ? 'text-green-100' : 'text-green-500'} />
        };
      case 'error':
        return {
          bgColor: preferences.highContrast ? 'bg-red-900' : 'bg-red-100',
          textColor: preferences.highContrast ? 'text-red-100' : 'text-red-800',
          icon: <Squircle size={16} className={preferences.highContrast ? 'text-red-100' : 'text-red-500'} />
        };
      case 'online':
      default:
        return {
          bgColor: preferences.highContrast ? 'bg-green-900' : 'bg-green-100',
          textColor: preferences.highContrast ? 'text-green-100' : 'text-green-800',
          icon: <Wifi size={16} className={preferences.highContrast ? 'text-green-100' : 'text-green-500'} />
        };
    }
  };
  
  const { bgColor, textColor, icon } = getTypeStyles();
  
  return (
    <div className={`fixed top-16 inset-x-0 z-50 flex justify-center items-center transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
    }`}>
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md ${bgColor}`}>
        {icon}
        <span className={`text-sm font-medium ${textColor}`}>
          {displayMessage || (displayType === 'offline' ? 'You are offline' : 'You are online')}
        </span>
      </div>
    </div>
  );
};

export default StatusIndicator;
