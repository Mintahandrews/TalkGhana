import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(
    baseConfig: AxiosRequestConfig = {},
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.axiosInstance = axios.create(baseConfig);

    this.retryConfig = {
      maxRetries: retryConfig.maxRetries || 3,
      retryDelay: retryConfig.retryDelay || 1000,
      retryStatusCodes: retryConfig.retryStatusCodes || [
        408, 429, 500, 502, 503, 504,
      ],
    };

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;

        // Initialize retry count if it doesn't exist
        if (!config || !config.retry) {
          config.retry = 0;
        }

        // Check if we should retry the request
        if (
          config.retry < this.retryConfig.maxRetries &&
          // Retry on network errors
          (!error.response ||
            // Retry on specific status codes
            (error.response &&
              this.retryConfig.retryStatusCodes.includes(
                error.response.status
              )))
        ) {
          config.retry += 1;

          // Exponential backoff
          const delay =
            this.retryConfig.retryDelay * Math.pow(2, config.retry - 1);

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config);
  }
}

// Create a default client instance
export const httpClient = new HttpClient();
