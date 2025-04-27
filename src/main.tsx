import "regenerator-runtime/runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { whisperService } from "./services/speech/WhisperService";
import { ttsService } from "./services/speech/TTSService";
import React from "react";
import registerWebComponents from "./components/web/registerWebComponents";

// Initialize services
const initServices = async () => {
  // This is where we would load configuration and
  // initialize the services with proper settings
  console.log("Initializing TalkGhana services");

  // Check for network connectivity
  if (navigator.onLine) {
    console.log("Application is online, initializing remote services");

    // Test API connection
    try {
      const response = await fetch("http://localhost:5002/api/ping");
      if (response.ok) {
        const data = await response.json();
        console.log("API Server is online:", data);
      } else {
        console.warn("API Server is not responding correctly");
      }
    } catch (error) {
      console.warn("Failed to connect to API server:", error);
      console.log("Speech services will operate in fallback mode");
    }

    // Configure whisperService
    // In a production app, we would set the API key properly here
    // whisperService.setAPIKey(apiKey);
  } else {
    console.log("Application is offline, initializing offline services");
  }
};

// Call initialization function
initServices().catch((error) => {
  console.error("Failed to initialize services:", error);
});

// Register service worker for offline support
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );

        // Set up background sync for offline requests
        if ("sync" in registration) {
          // Request permission for notifications (needed for offline status)
          Notification.requestPermission();

          // Check for updates every hour
          setInterval(() => {
            registration
              .update()
              .then(() => console.log("Service Worker checked for updates"))
              .catch((err) =>
                console.error("Error updating Service Worker:", err)
              );
          }, 60 * 60 * 1000);
        }
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

// Handle online/offline events for the app
window.addEventListener("online", () => {
  console.log("App is online");
  document.dispatchEvent(new CustomEvent("app-online"));
});

window.addEventListener("offline", () => {
  console.log("App is offline");
  document.dispatchEvent(new CustomEvent("app-offline"));
});

// Register web components before rendering the app
registerWebComponents()
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to register web components:", error);
    // Render the app anyway to prevent complete failure
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
