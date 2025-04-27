export const WHATSAPP_CONFIG = {
  API_VERSION: "v17.0",
  BASE_URL: "https://graph.facebook.com",
  DEFAULT_RETRY_COUNT: 3,
  DEFAULT_RETRY_DELAY: 2000,
  MAX_AUDIO_DURATION_SECONDS: 120, // 2 minutes
  SUPPORTED_AUDIO_FORMATS: [
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/amr",
    "audio/wav",
  ],
  OFFLINE_SYNC_INTERVAL: 300000, // 5 minutes
};
