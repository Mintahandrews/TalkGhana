/**
 * Utility for managing offline functionality
 */

import { logError } from "./ErrorHandler";

// Define types for offline data
export interface OfflineData {
  models: OfflineModel[];
  datasets: OfflineDataset[];
  lastSynced: string;
}

export interface OfflineModel {
  id: string;
  name: string;
  language: string;
  type: "tts" | "stt";
  createdAt: string;
  size: number;
  modelData?: ArrayBuffer;
  configData: any;
}

export interface OfflineDataset {
  id: string;
  name: string;
  language: string;
  type: "audio" | "text";
  count: number;
  createdAt: string;
  data: any[];
}

// Local storage keys
const OFFLINE_DATA_KEY = "ghanaian_language_offline_data";
const OFFLINE_MODELS_KEY = "ghanaian_language_offline_models";
const OFFLINE_DATASETS_KEY = "ghanaian_language_offline_datasets";

/**
 * Initialize offline data structure
 */
export function initializeOfflineData(): OfflineData {
  return {
    models: [],
    datasets: [],
    lastSynced: new Date().toISOString(),
  };
}

/**
 * Save offline data to local storage
 * @param data Offline data to save
 */
export function saveOfflineData(data: OfflineData): boolean {
  try {
    // Save metadata without large binary data
    const metadataOnly: OfflineData = {
      ...data,
      models: data.models.map((model) => ({
        ...model,
        modelData: undefined, // Don't store binary data in main metadata
      })),
    };

    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(metadataOnly));

    // Save models with binary data separately
    for (const model of data.models) {
      if (model.modelData) {
        // Store binary data separately using IndexedDB or another approach
        // For now, we'll skip storing the actual model data in this example
        console.log(
          `Model ${model.id} would be stored with ${model.size} bytes of data`
        );
      }
    }

    // Save datasets separately if they're large
    localStorage.setItem(OFFLINE_DATASETS_KEY, JSON.stringify(data.datasets));

    return true;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "saveOfflineData",
      dataSize: JSON.stringify(data).length,
    });
    return false;
  }
}

/**
 * Load offline data from local storage
 */
export function loadOfflineData(): OfflineData | null {
  try {
    const dataString = localStorage.getItem(OFFLINE_DATA_KEY);
    if (!dataString) return null;

    const data = JSON.parse(dataString) as OfflineData;

    // Load datasets if stored separately
    const datasetsString = localStorage.getItem(OFFLINE_DATASETS_KEY);
    if (datasetsString) {
      data.datasets = JSON.parse(datasetsString);
    }

    // We would load model binary data here if needed
    // For now, we'll just return the metadata

    return data;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "loadOfflineData",
    });
    return null;
  }
}

/**
 * Check if the app is currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Add a model to offline storage
 * @param model Model to add
 */
export function addOfflineModel(model: OfflineModel): boolean {
  try {
    const data = loadOfflineData() || initializeOfflineData();

    // Check if model already exists
    const existingIndex = data.models.findIndex((m) => m.id === model.id);
    if (existingIndex >= 0) {
      // Update existing model
      data.models[existingIndex] = model;
    } else {
      // Add new model
      data.models.push(model);
    }

    return saveOfflineData(data);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "addOfflineModel",
      modelId: model.id,
    });
    return false;
  }
}

/**
 * Add a dataset to offline storage
 * @param dataset Dataset to add
 */
export function addOfflineDataset(dataset: OfflineDataset): boolean {
  try {
    const data = loadOfflineData() || initializeOfflineData();

    // Check if dataset already exists
    const existingIndex = data.datasets.findIndex((d) => d.id === dataset.id);
    if (existingIndex >= 0) {
      // Update existing dataset
      data.datasets[existingIndex] = dataset;
    } else {
      // Add new dataset
      data.datasets.push(dataset);
    }

    return saveOfflineData(data);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "addOfflineDataset",
      datasetId: dataset.id,
    });
    return false;
  }
}

/**
 * Remove a model from offline storage
 * @param modelId ID of the model to remove
 */
export function removeOfflineModel(modelId: string): boolean {
  try {
    const data = loadOfflineData();
    if (!data) return false;

    data.models = data.models.filter((model) => model.id !== modelId);

    return saveOfflineData(data);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "removeOfflineModel",
      modelId,
    });
    return false;
  }
}

/**
 * Remove a dataset from offline storage
 * @param datasetId ID of the dataset to remove
 */
export function removeOfflineDataset(datasetId: string): boolean {
  try {
    const data = loadOfflineData();
    if (!data) return false;

    data.datasets = data.datasets.filter((dataset) => dataset.id !== datasetId);

    return saveOfflineData(data);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "removeOfflineDataset",
      datasetId,
    });
    return false;
  }
}

/**
 * Clear all offline data
 */
export function clearOfflineData(): boolean {
  try {
    localStorage.removeItem(OFFLINE_DATA_KEY);
    localStorage.removeItem(OFFLINE_MODELS_KEY);
    localStorage.removeItem(OFFLINE_DATASETS_KEY);
    return true;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "clearOfflineData",
    });
    return false;
  }
}

/**
 * Register event listeners for online/offline events
 * @param onOnline Callback for when the app goes online
 * @param onOffline Callback for when the app goes offline
 */
export function registerConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  // Return a function to remove the listeners
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

export default {
  initializeOfflineData,
  saveOfflineData,
  loadOfflineData,
  isOffline,
  addOfflineModel,
  addOfflineDataset,
  removeOfflineModel,
  removeOfflineDataset,
  clearOfflineData,
  registerConnectivityListeners,
};
