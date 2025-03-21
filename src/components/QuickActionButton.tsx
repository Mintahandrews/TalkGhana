import React from 'react';
import { useUserPreferences } from '../context/UserPreferencesContext';

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onClick,
  color = 'blue',
  size = 'md'
}) => {
  const { preferences } = useUserPreferences();
  
  const getColorClasses = () => {
    const baseClasses = preferences.highContrast 
      ? {
        blue: 'bg-blue-800 text-white hover:bg-blue-700',
        green: 'bg-green-800 text-white hover:bg-green-700',
        red: 'bg-red-800 text-white hover:bg-red-700',
        yellow: 'bg-yellow-700 text-white hover:bg-yellow-600',
        purple: 'bg-purple-800 text-white hover:bg-purple-700',
      }
      : {
        blue: 'bg-blue-500 text-white hover:bg-blue-600',
        green: 'bg-green-500 text-white hover:bg-green-600',
        red: 'bg-red-500 text-white hover:bg-red-600',
        yellow: 'bg-yellow-500 text-white hover:bg-yellow-600',
        purple: 'bg-purple-500 text-white hover:bg-purple-600',
      };
    
    return baseClasses[color];
  };
  
  const getSizeClasses = () => {
    const sizes = {
      sm: 'p-2 text-xs',
      md: 'p-3 text-sm',
      lg: 'p-4 text-base',
    };
    
    const iconSizes = {
      sm: 'mb-1',
      md: 'mb-2',
      lg: 'mb-3',
    };
    
    return {
      button: sizes[size],
      icon: iconSizes[size]
    };
  };
  
  const colorClasses = getColorClasses();
  const sizeClasses = getSizeClasses();
  
  const touchTargetSize = localStorage.getItem('touchTargetSize') || 'normal';
  const extraPadding = touchTargetSize === 'large' ? 'p-1' : touchTargetSize === 'extra-large' ? 'p-2' : '';
  
  return (
    <button
      onClick={onClick}
      className={`${colorClasses} ${sizeClasses.button} ${extraPadding} rounded-lg flex flex-col items-center justify-center transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500`}
    >
      <div className={sizeClasses.icon}>
        {icon}
      </div>
      <span className={`font-medium ${preferences.largeText ? 'text-base' : ''}`}>
        {label}
      </span>
    </button>
  );
};

export default QuickActionButton;
