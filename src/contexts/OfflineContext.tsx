import React, { createContext, useContext, useState, useEffect } from "react";

interface OfflineContextType {
  isOffline: boolean;
  lastOnlineAt: Date | null;
  cachedResources: string[];
  isSyncPending: boolean;
  syncQueue: Array<{ endpoint: string; data: any; timestamp: number }>;
  addToSyncQueue: (endpoint: string, data: any) => void;
  processSyncQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  lastOnlineAt: null,
  cachedResources: [],
  isSyncPending: false,
  syncQueue: [],
  addToSyncQueue: () => {},
  processSyncQueue: async () => {},
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [cachedResources, setCachedResources] = useState<string[]>([]);
  const [syncQueue, setSyncQueue] = useState<
    Array<{ endpoint: string; data: any; timestamp: number }>
  >([]);
  const [isSyncPending, setIsSyncPending] = useState<boolean>(false);

  // Load sync queue from IndexedDB or localStorage when component mounts
  useEffect(() => {
    const loadedQueue = localStorage.getItem("syncQueue");
    if (loadedQueue) {
      setSyncQueue(JSON.parse(loadedQueue));
    }

    // Check and update cached resources
    const updateCachedResources = async () => {
      if ("caches" in window) {
        try {
          const cache = await caches.open("talkghana-assets");
          const keys = await cache.keys();
          setCachedResources(keys.map((request) => request.url));
        } catch (error) {
          console.error("Failed to load cached resources:", error);
        }
      }
    };

    updateCachedResources();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineAt(new Date());

      // Attempt to process sync queue when coming back online
      if (syncQueue.length > 0) {
        processSyncQueue();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  // Save sync queue to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("syncQueue", JSON.stringify(syncQueue));
  }, [syncQueue]);

  const addToSyncQueue = (endpoint: string, data: any) => {
    setSyncQueue((prev) => [
      ...prev,
      { endpoint, data, timestamp: Date.now() },
    ]);
  };

  const processSyncQueue = async () => {
    if (isOffline || isSyncPending || syncQueue.length === 0) {
      return;
    }

    setIsSyncPending(true);

    try {
      // Process each item in the queue
      const newQueue = [...syncQueue];
      const successfulSyncs: number[] = [];

      for (let i = 0; i < newQueue.length; i++) {
        const { endpoint, data } = newQueue[i];

        try {
          // Make API request
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            successfulSyncs.push(i);
          }
        } catch (error) {
          console.error(`Failed to sync item ${i}:`, error);
          // Continue with other items even if one fails
        }
      }

      // Remove successfully synced items
      const updatedQueue = newQueue.filter(
        (_, index) => !successfulSyncs.includes(index)
      );
      setSyncQueue(updatedQueue);
    } finally {
      setIsSyncPending(false);
    }
  };

  const value = {
    isOffline,
    lastOnlineAt,
    cachedResources,
    isSyncPending,
    syncQueue,
    addToSyncQueue,
    processSyncQueue,
  };

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
};

// Custom hook for using the offline context
export const useOffline = () => useContext(OfflineContext);

export default OfflineContext;
