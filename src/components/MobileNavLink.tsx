import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface MobileNavLinkProps {
  to: string;
  isActive: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({
  to,
  isActive,
  icon,
  label,
  onClick,
  className = "",
}) => {
  const { theme } = useTheme();

  return (
    <Link
      to={to}
      className={`nav-link flex items-center px-4 py-3 rounded-md font-medium my-1 transition-colors ${
        isActive
          ? `bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 ${
              theme === "dark"
                ? "border-l-4 border-blue-400"
                : "border-l-4 border-blue-600"
            }`
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
      } ${className}`}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      {icon && <span className="mr-3">{icon}</span>}
      <span>{label}</span>
      {isActive && <span className="sr-only">(current page)</span>}
    </Link>
  );
};

export default MobileNavLink;
