import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import "./styles/theme.css";
import "./styles/menu.css";
import "./styles/language.css";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ConversationMode from "./pages/ConversationMode";
import VoiceCommands from "./pages/VoiceCommands";
import Settings from "./pages/Settings";
import OfflineMode from "./pages/OfflineMode";
import { LanguageProvider } from "./contexts/LanguageContext";
import LoadingIndicator from "./components/LoadingIndicator";
import OfflineIndicator from "./components/OfflineIndicator";
import { OfflineProvider } from "./contexts/OfflineContext";
import { ThemeProvider } from "./context/ThemeContext";
import Conversation from "./pages/Conversation";
import { ToastProvider } from "./components/ui/use-toast";
import { applyLanguageToElements, applyLanguageStyles } from "./i18n";
import { useTranslation } from "react-i18next";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { i18n } = useTranslation();

  useEffect(() => {
    // Apply language styling at startup
    const currentLng = i18n.language || "en";
    applyLanguageToElements(currentLng);
    applyLanguageStyles(currentLng);

    // Simulate initialization time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Check for service worker updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          setUpdateAvailable(true);
        });
      });
    }

    // Handle window resize for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Listen for language changes to update document attributes
    const handleLanguageChange = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.language) {
        const html = document.documentElement;
        // Update document classes if needed based on language
        const language = event.detail.language;

        // Reset RTL/LTR direction based on language
        // English and most Ghanaian languages are LTR
        html.dir = "ltr";

        // Add a language-specific class to enable language-specific CSS
        const languageClasses = [
          "lang-en",
          "lang-twi",
          "lang-ga",
          "lang-ewe",
          "lang-hausa",
          "lang-dagbani",
        ];
        languageClasses.forEach((cls) => html.classList.remove(cls));
        html.classList.add(`lang-${language === "english" ? "en" : language}`);

        // Apply to web components and other custom elements
        document.querySelectorAll("[data-i18n]").forEach((el) => {
          if (el instanceof HTMLElement) {
            const key = el.getAttribute("data-i18n");
            if (key) {
              el.textContent = i18n.t(key);
            }
          }
        });

        // Apply to all document nodes that support lang attribute
        document.querySelectorAll("input, textarea, button").forEach((el) => {
          if (el instanceof HTMLElement && el.hasAttribute("placeholder")) {
            const placeholderKey = el.getAttribute("data-i18n-placeholder");
            if (placeholderKey) {
              el.setAttribute("placeholder", i18n.t(placeholderKey));
            }
          }
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("app-language-change", handleLanguageChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("app-language-change", handleLanguageChange);
    };
  }, [i18n]);

  const handleUpdate = () => {
    // Reload the page to activate the new service worker
    window.location.reload();
  };

  return (
    <ThemeProvider>
      <div
        className={`app min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        <LanguageProvider>
          <OfflineProvider>
            <ToastProvider>
              {isLoading ? (
                <div className="app-loading flex items-center justify-center min-h-screen">
                  <LoadingIndicator
                    isLoading={true}
                    message="Initializing application..."
                  />
                </div>
              ) : (
                <Router>
                  <OfflineIndicator />
                  {updateAvailable && (
                    <div className="update-banner fixed top-0 left-0 right-0 bg-blue-600 text-white py-2 px-4 z-50 flex justify-between items-center">
                      <p>A new version is available!</p>
                      <button
                        onClick={handleUpdate}
                        className="px-3 py-1 rounded bg-white text-blue-600 text-sm font-medium hover:bg-blue-50"
                      >
                        Update Now
                      </button>
                    </div>
                  )}
                  <div className={isMobile ? "pb-16" : ""}>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Conversation />} />
                        <Route path="/home" element={<Home />} />
                        <Route
                          path="/conversation"
                          element={<Conversation />}
                        />
                        <Route
                          path="/voice-commands"
                          element={<VoiceCommands />}
                        />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/offline" element={<OfflineMode />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </div>
                </Router>
              )}
            </ToastProvider>
          </OfflineProvider>
        </LanguageProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
