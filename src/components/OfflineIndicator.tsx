import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import "./OfflineIndicator.css";

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = "",
}) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine);

    // Show indicator if offline
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    // Add event listeners for online/offline status
    const handleOnline = () => {
      setIsOffline(false);

      // Hide indicator after a delay
      setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowIndicator(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't render if we're online and not showing the indicator
  if (!isOffline && !showIndicator) {
    return null;
  }

  return (
    <div
      className={`offline-indicator ${
        isOffline ? "offline" : "online"
      } ${className}`}
    >
      <WifiOff size={18} />
      <span>
        {isOffline
          ? "You are offline. Some features may be limited."
          : "Connection restored. You are back online!"}
      </span>
    </div>
  );
};

export default OfflineIndicator;
