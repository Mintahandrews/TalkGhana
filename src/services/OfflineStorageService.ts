/**
 * Service for managing offline storage and service worker registration
 */

import { logError } from "../utils/ErrorHandler";
import { GhanaianLanguage } from "../context/LanguageContext";

interface StorageStats {
  totalSize: number;
  languageModelsSize: number;
  cacheSize: number;
  languageModels: any[];
}

/**
 * Get statistics about offline storage usage
 */
export async function getOfflineStorageStats(): Promise<StorageStats> {
  try {
    // Estimate storage usage
    const estimate = await navigator.storage?.estimate();
    const totalSize = estimate?.usage || 0;

    // For demo purposes, we'll return mock data
    // In a real app, you would calculate these from IndexedDB/Cache storage
    return {
      totalSize,
      languageModelsSize: Math.floor(totalSize * 0.7), // 70% of total
      cacheSize: Math.floor(totalSize * 0.3), // 30% of total
      languageModels: [
        { language: "twi", size: Math.floor(totalSize * 0.2) },
        { language: "ga", size: Math.floor(totalSize * 0.2) },
        { language: "ewe", size: Math.floor(totalSize * 0.2) },
        { language: "hausa", size: Math.floor(totalSize * 0.1) },
      ],
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "getOfflineStorageStats",
    });
    throw error;
  }
}

/**
 * Clear all cached data including models and audio files
 */
export async function clearAllCachedData(): Promise<void> {
  try {
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    // Clear IndexedDB data
    const databases = await window.indexedDB.databases();
    await Promise.all(
      databases.map((db) => db.name && window.indexedDB.deleteDatabase(db.name))
    );

    console.log("All cached data cleared");
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "clearAllCachedData",
    });
    throw error;
  }
}

/**
 * Delete a specific language model and its associated data
 */
export async function deleteLanguageModel(
  language: GhanaianLanguage
): Promise<void> {
  try {
    // Delete language-specific cache
    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      const languageCaches = cacheKeys.filter((key) => key.includes(language));
      await Promise.all(languageCaches.map((key) => caches.delete(key)));
    }

    // Delete language-specific IndexedDB data
    const dbName = `${language}-model`;
    await window.indexedDB.deleteDatabase(dbName);

    console.log(`Deleted ${language} language model and associated data`);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "deleteLanguageModel",
    });
    throw error;
  }
}

/**
 * Register the service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<boolean> {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
        }
      );

      console.log("Service Worker registered with scope:", registration.scope);

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker is installed and ready to take over
              console.log("New service worker installed and ready");

              // Notify the user about the update
              if (window.confirm("New version available! Reload to update?")) {
                window.location.reload();
              }
            }
          });
        }
      });

      return true;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "registerServiceWorker",
      });
      console.error("Service Worker registration failed:", error);
      return false;
    }
  } else {
    console.warn("Service Workers are not supported in this browser");
    return false;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorkers(): Promise<boolean> {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        await registration.unregister();
        console.log("Service Worker unregistered");
      }

      return true;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "unregisterServiceWorkers",
      });
      console.error("Service Worker unregistration failed:", error);
      return false;
    }
  }

  return false;
}

/**
 * Check if the app is installed (in standalone mode)
 */
export function isAppInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if the app can be installed
 * @param callback Function to call when installation is available
 */
export function checkInstallAvailability(callback: () => void): () => void {
  let deferredPrompt: any = null;

  const handler = (event: Event) => {
    // Prevent the default browser install prompt
    event.preventDefault();

    // Store the event for later use
    deferredPrompt = event;

    // Notify that installation is available
    callback();
  };

  window.addEventListener("beforeinstallprompt", handler);

  // Return a function to trigger the install prompt
  return () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }

        // Clear the deferred prompt
        deferredPrompt = null;
      });
    }
  };
}

/**
 * Clear the application cache
 */
export async function clearAppCache(): Promise<boolean> {
  try {
    // Clear cache storage
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log("Cache storage cleared");
    }

    // Clear application storage if available
    if (navigator.storage && typeof navigator.storage.estimate === "function") {
      // Note: navigator.storage.clear() is not standard
      // We can use IndexedDB deletion instead
      const databases = await window.indexedDB.databases();
      databases.forEach((db) => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
      console.log("Application storage cleared");
    }

    return true;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "clearAppCache",
    });
    console.error("Failed to clear app cache:", error);
    return false;
  }
}

export default {
  registerServiceWorker,
  unregisterServiceWorkers,
  isAppInstalled,
  checkInstallAvailability,
  clearAppCache,
};
