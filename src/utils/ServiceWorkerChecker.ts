/**
 * Utility to check if the service worker is working correctly
 */

import { logError } from "./ErrorHandler";

/**
 * Check if service workers are supported in the current browser
 * @returns boolean indicating if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator;
}

/**
 * Check if the app is running in PWA mode (installed)
 * @returns boolean indicating if the app is running as a PWA
 */
export function isRunningAsPWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if the service worker is registered and active
 * @returns Promise resolving to boolean indicating if service worker is active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration && !!registration.active;
  } catch (error) {
    logError(new Error("Error checking service worker status"), error);
    return false;
  }
}

/**
 * Get information about the current service worker
 * @returns Promise resolving to an object with service worker information
 */
export async function getServiceWorkerInfo(): Promise<{
  supported: boolean;
  registered: boolean;
  active: boolean;
  waiting: boolean;
  installing: boolean;
  controller: boolean;
  scope?: string;
  scriptURL?: string;
  state?: string;
}> {
  if (!isServiceWorkerSupported()) {
    return {
      supported: false,
      registered: false,
      active: false,
      waiting: false,
      installing: false,
      controller: false,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      return {
        supported: true,
        registered: false,
        active: false,
        waiting: false,
        installing: false,
        controller: !!navigator.serviceWorker.controller,
      };
    }

    return {
      supported: true,
      registered: true,
      active: !!registration.active,
      waiting: !!registration.waiting,
      installing: !!registration.installing,
      controller: !!navigator.serviceWorker.controller,
      scope: registration.scope,
      scriptURL: registration.active?.scriptURL,
      state: registration.active?.state,
    };
  } catch (error) {
    logError(new Error("Error getting service worker info"), error);
    return {
      supported: true,
      registered: false,
      active: false,
      waiting: false,
      installing: false,
      controller: false,
    };
  }
}

/**
 * Check if the app can work offline
 * @returns Promise resolving to boolean indicating if the app can work offline
 */
export async function canWorkOffline(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    // Check if service worker is active
    const swActive = await isServiceWorkerActive();
    if (!swActive) {
      return false;
    }

    // Check if cache storage is available
    if (!("caches" in window)) {
      return false;
    }

    // Check if we have cached the static assets
    const cache = await caches.open("ghanaian-language-training-v1");
    const cachedFiles = await cache.keys();

    // We need at least some cached files to work offline
    return cachedFiles.length > 0;
  } catch (error) {
    logError(new Error("Error checking offline capability"), error);
    return false;
  }
}
