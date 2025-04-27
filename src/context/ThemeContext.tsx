import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Check for user's theme preference or fallback to system preference
const getInitialTheme = (): string => {
  // Check if theme was set previously in localStorage
  const storedTheme =
    typeof window !== "undefined" ? localStorage.getItem("theme") : null;

  // If a theme was previously chosen, use that
  if (storedTheme) {
    return storedTheme;
  }

  // Default to system theme
  return "system";
};

// Helper to get the system theme preference
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<string>(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme
  );

  // Set theme in localStorage and state
  const setTheme = (newTheme: ThemeType) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  };

  // Toggle between light and dark modes
  const toggleTheme = () => {
    if (theme === "system") {
      // If current theme is system, toggle to the opposite of system preference
      setTheme(systemTheme === "dark" ? "light" : "dark");
    } else {
      // Regular toggle between light and dark
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    // Set initial system theme
    handleChange();

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Legacy support
    else if ("addListener" in mediaQuery) {
      // @ts-ignore - For older browsers
      mediaQuery.addListener(handleChange);
      return () => {
        // @ts-ignore - For older browsers
        mediaQuery.removeListener(handleChange);
      };
    }
  }, []);

  // Apply the appropriate theme to the document
  useEffect(() => {
    // Determine which theme to apply
    const themeToApply = theme === "system" ? systemTheme : theme;

    // Apply theme to document
    if (themeToApply === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [theme, systemTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
