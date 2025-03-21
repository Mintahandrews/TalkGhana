import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface ConnectionStatusProps {
  className?: string;
  compact?: boolean;
  showReconnectButton?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = "",
  compact = false,
  showReconnectButton = false,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleReconnect = () => {
    if (isOnline) return;

    setIsReconnecting(true);

    // Simulate reconnection attempt
    setTimeout(() => {
      setIsReconnecting(false);

      // Check if we're back online
      if (navigator.onLine) {
        setIsOnline(true);
      }
    }, 2000);
  };

  if (compact) {
    return (
      <div className={`flex items-center ${className}`}>
        {isOnline ? (
          <Wifi className="text-green-500" size={16} />
        ) : (
          <WifiOff className="text-red-500" size={16} />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center">
        {isOnline ? (
          <>
            <Wifi className="text-green-500 mr-2" size={18} />
            <span className="text-sm text-green-600">
              Online - All features available
            </span>
          </>
        ) : (
          <>
            <WifiOff className="text-red-500 mr-2" size={18} />
            <span className="text-sm text-red-600">
              Offline - Limited functionality
            </span>
          </>
        )}
      </div>

      {showReconnectButton && !isOnline && (
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          className={`ml-4 px-3 py-1 rounded-md text-sm 
            ${
              isReconnecting
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
        >
          {isReconnecting ? (
            <>
              <RefreshCw className="inline-block mr-1 animate-spin" size={14} />
              Connecting...
            </>
          ) : (
            "Reconnect"
          )}
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
