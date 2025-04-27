import { v4 as uuidv4 } from "uuid";
import { httpClient } from "../../utils/httpClient";
import { WHATSAPP_CONFIG } from "../../config/whatsapp.config";

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  baseUrl?: string;
  apiVersion?: string;
}

export interface MessageOptions {
  preview_url?: boolean;
  recipient_type?: "individual" | "group";
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  offlineQueued?: boolean;
  error?: string;
}

export interface MediaUploadResponse {
  id: string;
  url?: string;
  error?: string;
}

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;
  private apiVersion: string;

  constructor(config: WhatsAppConfig) {
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this.baseUrl = config.baseUrl || WHATSAPP_CONFIG.BASE_URL;
    this.apiVersion = config.apiVersion || WHATSAPP_CONFIG.API_VERSION;
  }

  // Send a text message
  async sendText(
    recipient: string,
    text: string,
    options: MessageOptions = {}
  ): Promise<MessageResponse> {
    try {
      // Check network connectivity
      if (!navigator.onLine) {
        await this.queueTextMessage(recipient, text, options);
        return {
          success: true,
          offlineQueued: true,
        };
      }

      const response = await httpClient.post(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: options.recipient_type || "individual",
          to: recipient,
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error("Error sending WhatsApp text message:", error);

      // Queue message if network error
      if (!error.response || error.response.status >= 500) {
        await this.queueTextMessage(recipient, text, options);
        return {
          success: true,
          offlineQueued: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  // Send an audio message
  async sendAudio(
    recipient: string,
    audioBlob: Blob,
    options: MessageOptions = {}
  ): Promise<MessageResponse> {
    try {
      // Check network connectivity
      if (!navigator.onLine) {
        await this.queueAudioMessage(recipient, audioBlob, options);
        return {
          success: true,
          offlineQueued: true,
        };
      }

      // Upload media first
      const mediaUpload = await this.uploadMedia(audioBlob, "audio/ogg");

      if (!mediaUpload.id) {
        throw new Error("Failed to upload audio file");
      }

      // Send message with media ID
      const response = await httpClient.post(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: options.recipient_type || "individual",
          to: recipient,
          type: "audio",
          audio: { id: mediaUpload.id },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error("Error sending WhatsApp audio message:", error);

      // Queue message if network error
      if (!error.response || error.response.status >= 500) {
        await this.queueAudioMessage(recipient, audioBlob, options);
        return {
          success: true,
          offlineQueued: true,
        };
      }

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  // Upload media to WhatsApp servers
  async uploadMedia(
    fileBlob: Blob,
    fileType: string
  ): Promise<MediaUploadResponse> {
    try {
      const formData = new FormData();
      formData.append("file", fileBlob);
      formData.append("messaging_product", "whatsapp");
      formData.append("type", fileType);

      const response = await httpClient.post(
        `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return {
        id: response.data.id,
        url: response.data.url,
      };
    } catch (error: any) {
      console.error("Error uploading media to WhatsApp:", error);

      // Store media for later upload
      const mediaId = await this.queueMediaUpload(fileBlob, fileType);

      return {
        id: mediaId,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  // Queue a text message for later sending
  private async queueTextMessage(
    recipient: string,
    text: string,
    options: MessageOptions = {}
  ): Promise<string> {
    const messageId = `pending_${uuidv4()}`;

    // Store in IndexedDB
    const pendingMessages = JSON.parse(
      localStorage.getItem("pendingWhatsAppMessages") || "[]"
    );

    pendingMessages.push({
      id: messageId,
      type: "text",
      recipient,
      content: {
        text,
        options,
      },
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });

    localStorage.setItem(
      "pendingWhatsAppMessages",
      JSON.stringify(pendingMessages)
    );

    // Register for background sync
    this.registerBackgroundSync();

    return messageId;
  }

  // Queue an audio message for later sending
  private async queueAudioMessage(
    recipient: string,
    audioBlob: Blob,
    options: MessageOptions = {}
  ): Promise<string> {
    const messageId = `pending_${uuidv4()}`;
    const mediaId = `media_${uuidv4()}`;

    // Store the audio blob
    try {
      const pendingMedia = JSON.parse(
        localStorage.getItem("pendingWhatsAppMedia") || "{}"
      );

      // Convert blob to base64
      const base64 = await this.blobToBase64(audioBlob);

      pendingMedia[mediaId] = {
        base64,
        type: audioBlob.type,
        createdAt: Date.now(),
      };

      localStorage.setItem(
        "pendingWhatsAppMedia",
        JSON.stringify(pendingMedia)
      );

      // Store message reference
      const pendingMessages = JSON.parse(
        localStorage.getItem("pendingWhatsAppMessages") || "[]"
      );

      pendingMessages.push({
        id: messageId,
        type: "audio",
        recipient,
        content: {
          mediaId,
          options,
        },
        createdAt: Date.now(),
        attempts: 0,
        status: "pending",
      });

      localStorage.setItem(
        "pendingWhatsAppMessages",
        JSON.stringify(pendingMessages)
      );

      // Register for background sync
      this.registerBackgroundSync();

      return messageId;
    } catch (error: any) {
      console.error("Error queuing audio message:", error);
      throw error;
    }
  }

  // Convert blob to base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Queue media for later upload
  private async queueMediaUpload(
    fileBlob: Blob,
    fileType: string
  ): Promise<string> {
    const mediaId = `media_${uuidv4()}`;

    try {
      const pendingMedia = JSON.parse(
        localStorage.getItem("pendingWhatsAppMedia") || "{}"
      );

      // Convert blob to base64
      const base64 = await this.blobToBase64(fileBlob);

      pendingMedia[mediaId] = {
        base64,
        type: fileType,
        createdAt: Date.now(),
      };

      localStorage.setItem(
        "pendingWhatsAppMedia",
        JSON.stringify(pendingMedia)
      );

      return mediaId;
    } catch (error: any) {
      console.error("Error queuing media upload:", error);
      throw error;
    }
  }

  // Process pending messages
  async processPendingMessages(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    try {
      // Get all pending messages
      const pendingMessages = JSON.parse(
        localStorage.getItem("pendingWhatsAppMessages") || "[]"
      );

      if (pendingMessages.length === 0) {
        return;
      }

      // Sort by creation time (oldest first)
      const messages = pendingMessages
        .filter((msg: any) => msg.status === "pending")
        .sort((a: any, b: any) => a.createdAt - b.createdAt);

      const updatedMessages = [...pendingMessages];

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const messageIndex = updatedMessages.findIndex(
          (m) => m.id === message.id
        );

        try {
          // Update status to sending
          if (messageIndex !== -1) {
            updatedMessages[messageIndex].status = "sending";
            localStorage.setItem(
              "pendingWhatsAppMessages",
              JSON.stringify(updatedMessages)
            );
          }

          if (message.type === "text") {
            // Send text message
            const { text, options } = message.content;
            await this.sendText(message.recipient, text, options);

            // Remove successfully sent message
            if (messageIndex !== -1) {
              updatedMessages.splice(messageIndex, 1);
              localStorage.setItem(
                "pendingWhatsAppMessages",
                JSON.stringify(updatedMessages)
              );
            }
          } else if (message.type === "audio") {
            // Get the media file
            const { mediaId, options } = message.content;
            const pendingMedia = JSON.parse(
              localStorage.getItem("pendingWhatsAppMedia") || "{}"
            );

            const media = pendingMedia[mediaId];

            if (!media) {
              throw new Error(`Media not found: ${mediaId}`);
            }

            // Convert base64 back to blob
            const base64Response = await fetch(media.base64);
            const blob = await base64Response.blob();

            // Send audio message
            await this.sendAudio(message.recipient, blob, options);

            // Delete successfully sent message and media
            if (messageIndex !== -1) {
              updatedMessages.splice(messageIndex, 1);
              localStorage.setItem(
                "pendingWhatsAppMessages",
                JSON.stringify(updatedMessages)
              );
            }

            delete pendingMedia[mediaId];
            localStorage.setItem(
              "pendingWhatsAppMedia",
              JSON.stringify(pendingMedia)
            );
          }
        } catch (error: any) {
          console.error(`Error processing message ${message.id}:`, error);

          // Update attempts and status
          if (messageIndex !== -1) {
            const attempts = updatedMessages[messageIndex].attempts + 1;

            // Mark as failed after too many attempts
            updatedMessages[messageIndex].status =
              attempts >= 5 ? "failed" : "pending";
            updatedMessages[messageIndex].attempts = attempts;
            updatedMessages[messageIndex].error = error.message;

            localStorage.setItem(
              "pendingWhatsAppMessages",
              JSON.stringify(updatedMessages)
            );
          }
        }
      }
    } catch (error: any) {
      console.error("Error processing pending messages:", error);
    }
  }

  // Register for background sync
  private registerBackgroundSync(): void {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        (registration as any).sync
          .register("sync-whatsapp-messages")
          .catch((err: Error) =>
            console.error("Background sync registration failed:", err)
          );
      });
    }
  }
}
