import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Activity } from "lucide-react";
import { useOffline } from "../../contexts/OfflineContext";

interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Network status component that shows connection status and optional speed information
 * Provides visual feedback about the user's current connection quality
 */
export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  className = "",
  showDetails = false,
}) => {
  const { isOffline } = useOffline();
  const [networkInfo, setNetworkInfo] = useState<{
    downlink: number | null;
    effectiveType: string | null;
    rtt: number | null;
  }>({
    downlink: null,
    effectiveType: null,
    rtt: null,
  });

  // Update network information when available
  useEffect(() => {
    // Check if the Network Information API is available
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      // Set initial values
      setNetworkInfo({
        downlink: connection.downlink || null,
        effectiveType: connection.effectiveType || null,
        rtt: connection.rtt || null,
      });

      // Listen for changes
      const updateConnectionInfo = () => {
        setNetworkInfo({
          downlink: connection.downlink || null,
          effectiveType: connection.effectiveType || null,
          rtt: connection.rtt || null,
        });
      };

      connection.addEventListener("change", updateConnectionInfo);
      return () => {
        connection.removeEventListener("change", updateConnectionInfo);
      };
    }
  }, []);

  // Get connection quality label
  const getConnectionQuality = (): {
    label: string;
    color: string;
  } => {
    if (isOffline) {
      return { label: "Offline", color: "text-red-500" };
    }

    if (!networkInfo.effectiveType) {
      return { label: "Unknown", color: "text-gray-500" };
    }

    switch (networkInfo.effectiveType) {
      case "slow-2g":
      case "2g":
        return { label: "Poor", color: "text-red-500" };
      case "3g":
        return { label: "Fair", color: "text-yellow-500" };
      case "4g":
        return { label: "Good", color: "text-green-500" };
      default:
        return { label: "Unknown", color: "text-gray-500" };
    }
  };

  const quality = getConnectionQuality();

  if (!showDetails) {
    // Simple version
    return (
      <div
        className={`inline-flex items-center gap-1 ${className}`}
        title={`Network status: ${quality.label}`}
      >
        {isOffline ? (
          <WifiOff size={16} className="text-red-500" aria-hidden="true" />
        ) : (
          <Wifi size={16} className={quality.color} aria-hidden="true" />
        )}
        <span className="sr-only">Network status: {quality.label}</span>
      </div>
    );
  }

  // Detailed version
  return (
    <div className={`rounded-md border border-gray-200 p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">Network Status</h3>
        {isOffline ? (
          <WifiOff size={18} className="text-red-500" aria-hidden="true" />
        ) : (
          <Wifi size={18} className={quality.color} aria-hidden="true" />
        )}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={quality.color + " font-medium"}>
            {quality.label}
          </span>
        </div>

        {!isOffline && networkInfo.downlink !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Speed:</span>
            <span>~{networkInfo.downlink.toFixed(1)} Mbps</span>
          </div>
        )}

        {!isOffline && networkInfo.effectiveType && (
          <div className="flex justify-between">
            <span className="text-gray-600">Connection:</span>
            <span>{networkInfo.effectiveType.toUpperCase()}</span>
          </div>
        )}

        {!isOffline && networkInfo.rtt !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Latency:</span>
            <span>{networkInfo.rtt} ms</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
