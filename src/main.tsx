import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
