import { GhanaianLanguage } from "../context/LanguageContext";

interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  retries?: number;
  retryDelay?: number;
  important?: boolean; // Mark requests that should be queued if offline
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
};

// API base URL - adjust as needed for your deployment
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.yourdomain.com"
    : "http://localhost:3000";

class ApiService {
  private static instance: ApiService;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private isOnline = navigator.onLine;
  private connectionListeners: Set<(isOnline: boolean) => void> = new Set();

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
    if (currentOnline !== this.isOnline) {
      this.isOnline = currentOnline;

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
    try {
      const url = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        `API request failed (attempt ${attempt}/${config.retries}):`,
        error
      );

      // Check if we should retry
      if (attempt < (config.retries || 1) && this.isOnline) {
        const delay = config.retryDelay || 1000;
        console.log(`Retrying in ${delay}ms...`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Exponential backoff
        const nextConfig = {
          ...config,
          retryDelay: (config.retryDelay || 1000) * 1.5,
        };

        return this.makeRequest<T>(endpoint, nextConfig, attempt + 1);
      }

      // If we're offline, queue the request for later
      if (!this.isOnline && config.important) {
        return this.queueRequest<T>(endpoint, config);
      }

      throw error;
    }
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
        request.reject(error);
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
      this.requestQueue = [];
    }
  }

  // Specialized API methods for the Ghanaian language app

  public async getVoicesForLanguage(
    language: GhanaianLanguage
  ): Promise<any[]> {
    return this.request<any[]>(`/api/voices?language=${language}`);
  }

  public async getModelInfo(
    language: GhanaianLanguage,
    modelType: "tts" | "stt"
  ): Promise<any> {
    return this.request<any>(`/api/models/${language}/${modelType}`);
  }

  public async sendFeedback(feedbackData: {
    language: GhanaianLanguage;
    text: string;
    rating: number;
    feedbackType: "tts" | "stt";
    comments?: string;
  }): Promise<any> {
    return this.request<any>("/api/feedback", {
      method: "POST",
      body: feedbackData,
      important: true, // Queue if offline
    });
  }

  public async uploadAudioSample(
    language: GhanaianLanguage,
    audioBlob: Blob,
    transcript: string
  ): Promise<any> {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("language", language);
    formData.append("transcript", transcript);

    return this.request<any>("/api/audio-samples", {
      method: "POST",
      headers: {}, // Let browser set content-type with boundary
      body: formData,
      important: true, // Queue if offline
      retries: 5, // More retries for large uploads
    });
  }

  // Clean up resources
  public cleanup() {
    window.removeEventListener("online", this.handleOnlineStatus);
    window.removeEventListener("offline", this.handleOnlineStatus);
    this.connectionListeners.clear();
  }
}

// Export singleton instance
export default ApiService.getInstance();
