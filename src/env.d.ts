/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_HUGGINGFACE_API_KEY: string;
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  readonly VITE_CACHE_AUDIO: string;
  readonly VITE_PORT: string;
  // More env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
