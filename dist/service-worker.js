/**
 * Service Worker for TalkGhana
 * Provides offline functionality and caching
 */

const CACHE_NAME = "talkghana-v2";
const AUDIO_CACHE_NAME = "talkghana-audio-v1";
const DATA_CACHE_NAME = "talkghana-data-v1";

// Assets to cache on install
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/static/js/main.js",
  "/static/css/main.css",
  "/static/media/logo.png",
  // Add core UI assets
  "/static/css/tailwind.css",
  // Add default phrases for all supported languages
  "/static/data/phrases/en.json",
  "/static/data/phrases/twi.json",
  "/static/data/phrases/ga.json",
  "/static/data/phrases/ewe.json",
  "/static/data/phrases/hausa.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Static cache opened");
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        console.log("Audio cache opened");
        // We don't precache audio files as they'll be cached on demand
      }),
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log("Data cache opened");
        // We don't precache API responses as they'll be cached on demand
      }),
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME, AUDIO_CACHE_NAME, DATA_CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker activated and controlling");
        return self.clients.claim();
      })
  );
});

// Helper function to determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // API requests
  if (url.pathname.includes("/api/")) {
    return "network-first";
  }

  // Audio files - more aggressive caching
  if (
    url.pathname.includes("/tts/") ||
    url.pathname.includes("/audio/") ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".wav") ||
    url.pathname.endsWith(".ogg")
  ) {
    return "cache-first";
  }

  // HTML navigation requests - network first
  if (request.mode === "navigate") {
    return "network-first";
  }

  // Default to stale-while-revalidate for other assets
  return "stale-while-revalidate";
}

// Fetch event - serve cached content or fetch new content
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const strategy = getCacheStrategy(event.request);

  // Network-first strategy (for API requests and HTML navigation)
  if (strategy === "network-first") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store it in cache
          const responseToCache = response.clone();
          const cacheName = event.request.url.includes("/api/")
            ? DATA_CACHE_NAME
            : CACHE_NAME;

          caches.open(cacheName).then((cache) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If nothing in cache, and it's an API request,
            // respond with a custom offline response
            if (event.request.url.includes("/api/")) {
              return new Response(
                JSON.stringify({
                  error: "You are offline",
                  offline: true,
                  timestamp: new Date().toISOString(),
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            // For HTML navigation, return the offline page
            if (event.request.mode === "navigate") {
              return caches.match("/offline.html").then((offlineResponse) => {
                return (
                  offlineResponse ||
                  new Response("You are offline", {
                    status: 503,
                    headers: { "Content-Type": "text/html" },
                  })
                );
              });
            }
          });
        })
    );
  }
  // Cache-first strategy (for audio files)
  else if (strategy === "cache-first") {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((response) => {
          return (
            response ||
            fetch(event.request)
              .then((fetchResponse) => {
                // Clone the response to store it in cache
                const responseToCache = fetchResponse.clone();
                cache.put(event.request, responseToCache);
                return fetchResponse;
              })
              .catch((error) => {
                console.error("Audio fetch failed:", error);
                // Return a silent audio file as fallback if available
                return caches.match("/static/media/silent.mp3");
              })
          );
        })
      )
    );
  }
  // Stale-while-revalidate strategy (for other assets)
  else {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((response) => {
          // Return from cache immediately
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Update cache with fresh response in background
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch((error) => {
              console.log("Fetch failed for asset:", error);
              // We already returned cached version if available
            });

          return response || fetchPromise;
        })
      )
    );
  }
});

// Background sync for offline speech recognition data
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-asr-data") {
    event.waitUntil(syncASRData());
  } else if (event.tag === "sync-recordings") {
    event.waitUntil(syncRecordings());
  }
});

// Function to sync ASR data that was recorded while offline
async function syncASRData() {
  try {
    const clients = await self.clients.matchAll();
    if (clients && clients.length > 0) {
      // Send message to client to process sync queue
      clients[0].postMessage({
        type: "SYNC_ASR_DATA",
      });
    }
    return true;
  } catch (error) {
    console.error("Background sync failed:", error);
    return false;
  }
}

// Function to sync voice recordings
async function syncRecordings() {
  try {
    const clients = await self.clients.matchAll();
    if (clients && clients.length > 0) {
      // Send message to client to process voice recordings sync
      clients[0].postMessage({
        type: "SYNC_RECORDINGS",
      });
    }
    return true;
  } catch (error) {
    console.error("Recordings sync failed:", error);
    return false;
  }
}

// Handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "New notification from TalkGhana",
      icon: "/static/media/logo.png",
      badge: "/static/media/badge.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
        timestamp: new Date().toISOString(),
      },
      actions: [
        {
          action: "open",
          title: "Open",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification("TalkGhana", options));
  } catch (e) {
    console.error("Push notification error:", e);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === event.notification.data.url && "focus" in client) {
            return client.focus();
          }
        }

        // If not, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
