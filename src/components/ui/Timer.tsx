import React, { useState, useEffect, useRef } from "react";
import { formatTime } from "../../utils/formatTime";

interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  isRunning,
  onTimeUpdate,
  className = "",
}) => {
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - time;
      intervalRef.current = setInterval(() => {
        const newTime = Date.now() - startTimeRef.current;
        setTime(newTime);
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);

  const resetTimer = () => {
    setTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (onTimeUpdate) {
      onTimeUpdate(0);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="font-mono text-lg">{formatTime(time)}</div>
      {!isRunning && time > 0 && (
        <button
          onClick={resetTimer}
          className="text-xs text-gray-500 hover:text-gray-700"
          aria-label="Reset timer"
        >
          Reset
        </button>
      )}
    </div>
  );
};
