import { GhanaianLanguage } from "../context/LanguageContext";

interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  retries?: number;
  retryDelay?: number;
  important?: boolean; // Mark requests that should be queued if offline
  timeout?: number; // Request timeout in ms
}

interface QueuedRequest {
  endpoint: string;
  config: ApiRequestConfig;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

// Default API configuration
const DEFAULT_CONFIG: ApiRequestConfig = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  retries: 3,
  retryDelay: 1000,
  important: false,
  timeout: 30000, // 30 second default timeout
};

// Define interface for voices response
interface VoicesResponse {
  success: boolean;
  voices: Record<GhanaianLanguage, any[]>;
}

// API base URL - use environment variables with fallbacks
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.talkghana.com"
    : "http://localhost:5002");

class ApiService {
  private static instance: ApiService;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private isOnline = navigator.onLine;
  private connectionListeners: Set<(isOnline: boolean) => void> = new Set();
  private lastConnectionChange = Date.now();
  private reconnectionAttempts = 0;
  private abortControllers: Map<string, AbortController> = new Map();

  private constructor() {
    // Initialize online status listener
    window.addEventListener("online", this.handleOnlineStatus);
    window.addEventListener("offline", this.handleOnlineStatus);

    // Load queued requests from storage
    this.loadQueueFromStorage();

    // Start processing queue if online
    if (this.isOnline) {
      this.processQueue();
    }

    // Regular check for actual connectivity
    this.startConnectivityCheck();
  }

  // Singleton pattern
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private handleOnlineStatus = () => {
    const currentOnline = navigator.onLine;

    // Update last connection change timestamp
    this.lastConnectionChange = Date.now();

    if (currentOnline !== this.isOnline) {
      this.isOnline = currentOnline;

      // Reset reconnection attempts when connection status changes
      this.reconnectionAttempts = 0;

      // Notify all listeners
      this.connectionListeners.forEach((listener) => listener(this.isOnline));

      console.log(
        `Connection status changed: ${this.isOnline ? "online" : "offline"}`
      );

      // If we're back online, process the queue
      if (this.isOnline && !this.isProcessingQueue) {
        this.processQueue();
      }
    }
  };

  // Actively check connectivity by pinging the server
  private startConnectivityCheck = () => {
    setInterval(async () => {
      // Skip if browser reports offline and we checked recently
      if (!navigator.onLine && Date.now() - this.lastConnectionChange < 10000) {
        return;
      }

      try {
        // Simple check if server is reachable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${API_BASE_URL}/api/ping`, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const isServerReachable = response.ok;

        // Update connection status if it differs from current status
        if (isServerReachable !== this.isOnline) {
          this.isOnline = isServerReachable;
          this.lastConnectionChange = Date.now();
          this.connectionListeners.forEach((listener) =>
            listener(this.isOnline)
          );

          console.log(
            `Server connectivity changed: ${
              isServerReachable ? "reachable" : "unreachable"
            }`
          );

          if (isServerReachable) {
            this.processQueue();
          }
        }

        // Reset reconnection attempts on successful connection
        if (isServerReachable) {
          this.reconnectionAttempts = 0;
        }
      } catch (error) {
        // On failure, try to process queue with increased backoff
        this.reconnectionAttempts++;

        // If browser says we're online but server is unreachable
        if (navigator.onLine) {
          this.isOnline = false;
          this.connectionListeners.forEach((listener) => listener(false));
        }
      }
    }, 30000); // Check every 30 seconds
  };

  // Subscribe to connection status changes
  public onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  // Main request method
  public async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    // Merge with default config
    const fullConfig: ApiRequestConfig = { ...DEFAULT_CONFIG, ...config };

    // If offline and this is an important request, add to queue
    if (!this.isOnline && fullConfig.important) {
      return this.queueRequest<T>(endpoint, fullConfig);
    }

    return this.makeRequest<T>(endpoint, fullConfig);
  }

  // Queue a request for later processing
  private queueRequest<T>(
    endpoint: string,
    config: ApiRequestConfig
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        endpoint,
        config,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      this.requestQueue.push(queuedRequest);
      this.saveQueueToStorage();

      console.log(`Request queued for later: ${endpoint}`);
    });
  }

  // Make an HTTP request with retry logic
  private async makeRequest<T>(
    endpoint: string,
    config: ApiRequestConfig,
    attempt = 1
  ): Promise<T> {
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const requestId = `${endpoint}-${Date.now()}`;
    this.abortControllers.set(requestId, controller);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.abortControllers.delete(requestId);
    }, config.timeout || 30000);

    try {
      const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      // Clear timeout and remove controller
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }

        throw new Error(
          `API error: ${response.status} ${response.statusText} - ${
            errorData.message || errorText
          }`
        );
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else if (contentType && contentType.includes("text/")) {
        // Handle text responses
        const text = await response.text();
        return text as unknown as T;
      } else {
        // Handle other response types (like blobs)
        const blob = await response.blob();
        return blob as unknown as T;
      }
    } catch (error: any) {
      // Clear timeout and remove controller
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      console.error(
        `API request failed (attempt ${attempt}/${config.retries}):`,
        error
      );

      // AbortError means request timed out or was cancelled
      if (error.name === "AbortError") {
        console.log(`Request aborted: ${endpoint}`);
        throw new Error(`Request timeout after ${config.timeout || 30000}ms`);
      }

      // Network error or other problem
      // Check if we should retry
      if (attempt < (config.retries || 1) && this.isOnline) {
        const delay = this.calculateBackoff(config.retryDelay || 1000, attempt);
        console.log(`Retrying in ${delay}ms...`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Exponential backoff for next attempt
        const nextConfig = {
          ...config,
          retryDelay: config.retryDelay || 1000,
        };

        return this.makeRequest<T>(endpoint, nextConfig, attempt + 1);
      }

      // If we're offline, queue the request for later if important
      if (!this.isOnline && config.important) {
        return this.queueRequest<T>(endpoint, config);
      }

      throw error;
    }
  }

  // Calculate backoff time with jitter to prevent thundering herd problem
  private calculateBackoff(baseDelay: number, attempt: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const expBackoff = baseDelay * Math.pow(2, attempt - 1);
    // Add jitter: random value between 0 and 1000ms
    const jitter = Math.random() * 1000;
    return Math.min(expBackoff + jitter, 30000); // Cap at 30 seconds
  }

  // Process the request queue
  private async processQueue() {
    if (
      this.isProcessingQueue ||
      !this.isOnline ||
      this.requestQueue.length === 0
    ) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`Processing request queue: ${this.requestQueue.length} items`);

    while (this.requestQueue.length > 0 && this.isOnline) {
      const request = this.requestQueue.shift();
      if (!request) continue;

      try {
        const result = await this.makeRequest(request.endpoint, request.config);
        request.resolve(result);
      } catch (error) {
        console.error("Failed to process queued request:", error);

        // If we're still online, reject the request
        // Otherwise, put it back in the queue
        if (this.isOnline) {
          request.reject(error);
        } else {
          this.requestQueue.unshift(request);
          break; // Stop processing the queue
        }
      }

      // Update storage after each processed request
      this.saveQueueToStorage();
    }

    this.isProcessingQueue = false;
  }

  // Save queue to localStorage
  private saveQueueToStorage() {
    try {
      // Convert the queue to a simplified format for storage
      const serializedQueue = this.requestQueue.map((request) => ({
        endpoint: request.endpoint,
        config: request.config,
        timestamp: request.timestamp,
      }));

      localStorage.setItem("apiRequestQueue", JSON.stringify(serializedQueue));
    } catch (error) {
      console.error("Failed to save request queue to storage:", error);
    }
  }

  // Load queue from localStorage
  private loadQueueFromStorage() {
    try {
      const serialized = localStorage.getItem("apiRequestQueue");
      if (!serialized) return;

      const queueData = JSON.parse(serialized);

      // Convert back to request objects with new promise callbacks
      this.requestQueue = queueData.map((item: any) => ({
        ...item,
        resolve: (value: any) => {
          console.log(`Resolved queued request for: ${item.endpoint}`);
        },
        reject: (reason: any) => {
          console.error(`Failed queued request for: ${item.endpoint}`, reason);
        },
      }));

      console.log(`Loaded ${this.requestQueue.length} requests from queue`);
    } catch (error) {
      console.error("Failed to load request queue from storage:", error);
      // Clear corrupted data
      localStorage.removeItem("apiRequestQueue");
    }
  }

  // Get voices for a specific language
  public async getVoicesForLanguage(
    language: GhanaianLanguage
  ): Promise<any[]> {
    try {
      const response = await this.request<VoicesResponse>("/api/tts/voices", {
        important: true,
      });
      return response.voices[language] || [];
    } catch (error) {
      console.error(`Failed to get voices for ${language}:`, error);
      return [];
    }
  }

  // Get information about a speech model
  public async getModelInfo(
    language: GhanaianLanguage,
    modelType: "tts" | "stt"
  ): Promise<any> {
    try {
      return await this.request<any>(`/api/models/${modelType}/${language}`, {
        important: false,
      });
    } catch (error) {
      console.error(`Failed to get model info for ${language}:`, error);
      return null;
    }
  }

  // Send user feedback about speech quality
  public async sendFeedback(feedbackData: {
    language: GhanaianLanguage;
    text: string;
    rating: number;
    feedbackType: "tts" | "stt";
    comments?: string;
  }): Promise<any> {
    try {
      return await this.request<any>("/api/feedback", {
        method: "POST",
        body: feedbackData,
        important: true,
      });
    } catch (error) {
      console.error("Failed to send feedback:", error);
      throw error;
    }
  }

  // Upload audio sample for ASR
  public async uploadAudioSample(
    language: GhanaianLanguage,
    audioBlob: Blob,
    transcript: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("language", language);
      formData.append("transcript", transcript);

      // Custom request for FormData
      const url = `${API_BASE_URL}/api/asr/upload`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: unknown) {
      console.error("Failed to upload audio sample:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Unknown error during audio upload");
      }
    }
  }

  // Cancel all pending requests
  public cancelAllRequests() {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  // Clean up resources
  public cleanup() {
    window.removeEventListener("online", this.handleOnlineStatus);
    window.removeEventListener("offline", this.handleOnlineStatus);
    this.cancelAllRequests();
  }

  // Check server health
  public async checkHealth(): Promise<any> {
    try {
      return await this.request<any>("/api/health", {
        timeout: 5000,
        retries: 1,
      });
    } catch (error: unknown) {
      console.error("Health check failed:", error);
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export default ApiService.getInstance();
