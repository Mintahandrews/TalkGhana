import React from "react";
import "./LoadingIndicator.css";

interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showSpinner?: boolean;
  className?: string;
}

/**
 * Loading indicator component for displaying loading states
 * with optional progress bar and custom message
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  message = "Loading...",
  progress,
  showSpinner = true,
  className = "",
}) => {
  if (!isLoading) return null;

  const hasProgress =
    typeof progress === "number" && progress >= 0 && progress <= 100;

  return (
    <div className={`loading-indicator ${className}`}>
      {showSpinner && (
        <div className="spinner">
          <div className="spinner-inner"></div>
        </div>
      )}

      {message && <div className="loading-message">{message}</div>}

      {hasProgress && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
