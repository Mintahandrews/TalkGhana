import React from "react";
import { useOffline } from "../../contexts/OfflineContext";
import { WifiOff } from "lucide-react";

interface OfflineIndicatorProps {
  className?: string;
  compact?: boolean;
}

/**
 * Component that shows offline status with visual indicator
 * Provides both standard and compact views for different contexts
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = "",
  compact = false,
}) => {
  const { isOffline } = useOffline();

  if (!isOffline) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-full bg-amber-100 text-amber-800 ${className}`}
        role="status"
        aria-live="polite"
      >
        <WifiOff size={16} />
        <span className="sr-only">You are currently offline</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center text-amber-800 ${className}`}
      role="status"
      aria-live="polite"
    >
      <WifiOff size={20} className="mr-2" aria-hidden="true" />
      <div>
        <p className="font-medium">You are currently offline</p>
        <p className="text-sm mt-1">
          Some features may be limited or unavailable
        </p>
      </div>
    </div>
  );
};

export default OfflineIndicator;
