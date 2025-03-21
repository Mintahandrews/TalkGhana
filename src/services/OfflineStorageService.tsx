import { useState, useEffect, useCallback } from 'react';
import { GhanaianLanguage } from '../context/LanguageContext';

// Interface for the storage service
export interface OfflineStorageStats {
  totalSize: number;
  languageModelsSize: number;
  cacheSize: number;
  languageModels: {
    language: GhanaianLanguage;
    size: number;
    lastUpdated: Date;
  }[];
}

// Open and initialize the IndexedDB for offline storage
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TalkGhanaOfflineDB', 1);
    
    request.onerror = (event) => {
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = (event) => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create object stores for different types of data
      if (!db.objectStoreNames.contains('languageModels')) {
        db.createObjectStore('languageModels', { keyPath: 'language' });
      }
      
      if (!db.objectStoreNames.contains('commandCache')) {
        db.createObjectStore('commandCache', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('phraseCache')) {
        db.createObjectStore('phraseCache', { keyPath: 'text' });
      }
      
      if (!db.objectStoreNames.contains('stats')) {
        db.createObjectStore('stats', { keyPath: 'id' });
      }
    };
  });
};

// Function to simulate downloading a language model
export const downloadLanguageModel = async (
  language: GhanaianLanguage
): Promise<boolean> => {
  // In a real implementation, this would fetch actual model data from a server
  return new Promise((resolve, reject) => {
    // Simulate network delay and download progress
    setTimeout(async () => {
      try {
        // Generate mock language model data
        const modelSize = Math.floor(Math.random() * 10) + 20; // Random size between 20-30MB
        const mockModelData = {
          language,
          data: new Uint8Array(1024 * 1024), // Just 1MB of actual data for the mock
          size: modelSize * 1024 * 1024, // Size in bytes
          version: '1.0',
          lastUpdated: new Date(),
          metadata: {
            vocabulary: 5000,
            phrases: 1000,
            commands: 100,
          }
        };
        
        // Store in IndexedDB
        const db = await openDatabase();
        const transaction = db.transaction(['languageModels', 'stats'], 'readwrite');
        const store = transaction.objectStore('languageModels');
        const statsStore = transaction.objectStore('stats');
        
        // Store the model
        store.put(mockModelData);
        
        // Update stats
        const statsRequest = statsStore.get('offlineStats');
        statsRequest.onsuccess = () => {
          const stats = statsRequest.result || {
            id: 'offlineStats',
            totalSize: 0,
            languageModelsSize: 0,
            cacheSize: 0,
            languageModels: []
          };
          
          // Update or add language model stats
          const existingLangIndex = stats.languageModels.findIndex(
            (lm: any) => lm.language === language
          );
          
          if (existingLangIndex >= 0) {
            stats.languageModelsSize -= stats.languageModels[existingLangIndex].size;
            stats.languageModels[existingLangIndex] = {
              language,
              size: mockModelData.size,
              lastUpdated: mockModelData.lastUpdated
            };
          } else {
            stats.languageModels.push({
              language,
              size: mockModelData.size,
              lastUpdated: mockModelData.lastUpdated
            });
          }
          
          stats.languageModelsSize += mockModelData.size;
          stats.totalSize = stats.languageModelsSize + stats.cacheSize;
          
          statsStore.put(stats);
        };
        
        transaction.oncomplete = () => {
          // Also store a flag in localStorage for quick checks
          localStorage.setItem(`offline-${language}`, 'true');
          resolve(true);
        };
        
        transaction.onerror = () => {
          reject(new Error('Failed to store language model'));
        };
      } catch (error) {
        reject(error);
      }
    }, 3000); // Simulate 3 second download
  });
};

// Get stats about offline storage usage
export const getOfflineStorageStats = async (): Promise<OfflineStorageStats> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['stats'], 'readonly');
    const store = transaction.objectStore('stats');
    
    return new Promise((resolve, reject) => {
      const request = store.get('offlineStats');
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Return default stats if none exist yet
          resolve({
            totalSize: 0,
            languageModelsSize: 0,
            cacheSize: 0,
            languageModels: []
          });
        }
      };
      
      request.onerror = () => {
        reject(new Error('Failed to get storage stats'));
      };
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalSize: 0,
      languageModelsSize: 0,
      cacheSize: 0,
      languageModels: []
    };
  }
};

// Add a phrase to the cache with priority
export const cachePhraseWithPriority = async (
  text: string,
  language: GhanaianLanguage,
  priority: number = 1
): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['phraseCache', 'stats'], 'readwrite');
    const store = transaction.objectStore('phraseCache');
    const statsStore = transaction.objectStore('stats');
    
    // Check if phrase already exists
    const getRequest = store.get(text);
    
    getRequest.onsuccess = () => {
      const existingPhrase = getRequest.result;
      const phraseData = {
        text,
        language,
        priority: existingPhrase ? existingPhrase.priority + 1 : priority,
        lastUsed: new Date(),
        // In a real implementation, we might store TTS audio data here
        size: text.length * 2, // Estimate size in bytes
      };
      
      store.put(phraseData);
      
      // Update stats
      const statsRequest = statsStore.get('offlineStats');
      statsRequest.onsuccess = () => {
        const stats = statsRequest.result || {
          id: 'offlineStats',
          totalSize: 0,
          languageModelsSize: 0,
          cacheSize: 0,
          languageModels: []
        };
        
        // If updating, subtract old size first
        if (existingPhrase) {
          stats.cacheSize -= existingPhrase.size;
        }
        
        stats.cacheSize += phraseData.size;
        stats.totalSize = stats.languageModelsSize + stats.cacheSize;
        
        statsStore.put(stats);
      };
    };
  } catch (error) {
    console.error('Error caching phrase:', error);
  }
};

// Clear all cached data
export const clearAllCachedData = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    
    // Clear language model flags in localStorage first
    const languages: GhanaianLanguage[] = ['english', 'twi', 'ga', 'ewe', 'hausa'];
    languages.forEach(lang => {
      localStorage.removeItem(`offline-${lang}`);
    });
    
    // Clear each object store
    const transaction = db.transaction(
      ['languageModels', 'commandCache', 'phraseCache', 'stats'], 
      'readwrite'
    );
    
    transaction.objectStore('languageModels').clear();
    transaction.objectStore('commandCache').clear();
    transaction.objectStore('phraseCache').clear();
    
    // Reset stats
    const statsStore = transaction.objectStore('stats');
    statsStore.put({
      id: 'offlineStats',
      totalSize: 0,
      languageModelsSize: 0,
      cacheSize: 0,
      languageModels: []
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear cache'));
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Delete a specific language model
export const deleteLanguageModel = async (language: GhanaianLanguage): Promise<void> => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['languageModels', 'stats'], 'readwrite');
    const store = transaction.objectStore('languageModels');
    const statsStore = transaction.objectStore('stats');
    
    // Delete the model
    store.delete(language);
    
    // Update stats
    const statsRequest = statsStore.get('offlineStats');
    statsRequest.onsuccess = () => {
      if (statsRequest.result) {
        const stats = statsRequest.result;
        const existingLangIndex = stats.languageModels.findIndex(
          (lm: any) => lm.language === language
        );
        
        if (existingLangIndex >= 0) {
          stats.languageModelsSize -= stats.languageModels[existingLangIndex].size;
          stats.languageModels.splice(existingLangIndex, 1);
          stats.totalSize = stats.languageModelsSize + stats.cacheSize;
          
          statsStore.put(stats);
        }
      }
    };
    
    // Remove flag from localStorage
    localStorage.removeItem(`offline-${language}`);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to delete language model'));
    });
  } catch (error) {
    console.error('Error deleting language model:', error);
  }
};

// Hook for checking if we're online/offline
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Register the service worker for PWA functionality
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
};
