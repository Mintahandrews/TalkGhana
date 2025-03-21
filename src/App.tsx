import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ConversationMode from "./pages/ConversationMode";
import VoiceCommands from "./pages/VoiceCommands";
import Settings from "./pages/Settings";
import OfflineMode from "./pages/OfflineMode";
import TrainingInterface from "./training/TrainingInterface";
import { LanguageProvider } from "./context/LanguageContext";
import { UserPreferencesProvider } from "./context/UserPreferencesContext";
import { registerServiceWorker } from "./services/OfflineStorageService";
import LoadingIndicator from "./components/LoadingIndicator";
import OfflineIndicator from "./components/OfflineIndicator";

function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Register service worker for PWA functionality
    const initApp = async () => {
      try {
        await registerServiceWorker();
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsLoading(false);
      }
    };

    initApp();

    // Listen for service worker update events
    const handleServiceWorkerUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener("serviceWorkerUpdated", handleServiceWorkerUpdate);

    return () => {
      window.removeEventListener(
        "serviceWorkerUpdated",
        handleServiceWorkerUpdate
      );
    };
  }, []);

  const handleUpdate = () => {
    // Reload the page to activate the new service worker
    window.location.reload();
  };

  return (
    <UserPreferencesProvider>
      <LanguageProvider>
        {isLoading ? (
          <div className="app-loading">
            <LoadingIndicator
              isLoading={true}
              message="Initializing application..."
            />
          </div>
        ) : (
          <Router>
            <OfflineIndicator />
            {updateAvailable && (
              <div className="update-banner">
                <p>A new version is available!</p>
                <button onClick={handleUpdate}>Update Now</button>
              </div>
            )}
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/conversation" element={<ConversationMode />} />
                <Route path="/voice-commands" element={<VoiceCommands />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/offline" element={<OfflineMode />} />
                <Route path="/training" element={<TrainingInterface />} />
              </Routes>
            </Layout>
          </Router>
        )}
      </LanguageProvider>
    </UserPreferencesProvider>
  );
}

export default App;
