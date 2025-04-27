import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, Monitor } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return <Sun size={18} />;
      case "system":
        return <Monitor size={18} />;
      default:
        return <Moon size={18} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "dark"
            ? "bg-gray-700 text-yellow-200 hover:bg-gray-600"
            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
        } ${className}`}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {getIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-xl z-50">
          <button
            onClick={() => handleThemeChange("light")}
            className={`flex items-center w-full px-4 py-2 text-sm ${
              theme === "light"
                ? "text-blue-600 bg-blue-50 dark:bg-gray-700"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Sun size={16} className="mr-2" />
            Light
            {theme === "light" && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </button>
          <button
            onClick={() => handleThemeChange("dark")}
            className={`flex items-center w-full px-4 py-2 text-sm ${
              theme === "dark"
                ? "text-blue-600 bg-blue-50 dark:bg-gray-700"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Moon size={16} className="mr-2" />
            Dark
            {theme === "dark" && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </button>
          <button
            onClick={() => handleThemeChange("system")}
            className={`flex items-center w-full px-4 py-2 text-sm ${
              theme === "system"
                ? "text-blue-600 bg-blue-50 dark:bg-gray-700"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Monitor size={16} className="mr-2" />
            System
            {theme === "system" && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
