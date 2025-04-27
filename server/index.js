require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

// Import routes
const asrRoutes = require("./routes/asr");
const ttsRoutes = require("./routes/tts");

const app = express();
const PORT = process.env.PORT || 5002;

// Create required directories if they don't exist
const uploadsDir = path.join(__dirname, "..", "uploads");
const audioDir = path.join(uploadsDir, "audio");
const tempDir = path.join(uploadsDir, "temp");

// Ensure all directories exist
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(audioDir);
fs.ensureDirSync(tempDir);

// Track server start time for uptime monitoring
const serverStartTime = new Date();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Add request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const { method, url } = req;

  // Log request info
  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // Capture and log response info
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${method} ${url} ${
        res.statusCode
      } - ${duration}ms`
    );
  });

  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  });
});

// WhatsApp API configuration
const WHATSAPP_API_URL = `https://graph.facebook.com/${
  process.env.WHATSAPP_API_VERSION || "v17.0"
}`;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "talkghana-verify-token";

// Static files
app.use("/uploads", express.static(uploadsDir));

// Clean up temp files older than 24 hours
const cleanupTempFiles = () => {
  try {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    fs.readdir(tempDir, (err, files) => {
      if (err) {
        console.error("Error reading temp directory:", err);
        return;
      }

      files.forEach((file) => {
        const filePath = path.join(tempDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(`Error getting stats for file ${filePath}:`, err);
            return;
          }

          if (now - stats.mtimeMs > oneDay) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting file ${filePath}:`, err);
              } else {
                console.log(`Deleted old temp file: ${filePath}`);
              }
            });
          }
        });
      });
    });
  } catch (error) {
    console.error("Error in cleanup task:", error);
  }
};

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

// Routes
app.use("/api/asr", asrRoutes);
app.use("/api/tts", ttsRoutes);

// Webhook verification endpoint (required by Meta)
app.get("/api/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook for incoming messages
app.post("/api/webhook", (req, res) => {
  const data = req.body;

  console.log("Webhook received:", JSON.stringify(data, null, 2));

  // Process incoming messages here
  if (data.object === "whatsapp_business_account") {
    for (const entry of data.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages") {
          // Process messages
          processMessages(change.value);
        }
      }
    }
  }

  res.sendStatus(200);
});

// Process incoming messages
function processMessages(data) {
  if (!data.messages || !data.messages.length) return;

  for (const message of data.messages) {
    const senderId = data.metadata.phone_number_id;
    const recipientPhone = message.from;
    const messageId = message.id;

    // Handle message based on type
    if (message.type === "text") {
      console.log(`Received text message: ${message.text.body}`);
      // Could respond automatically here
    } else if (message.type === "audio") {
      console.log("Received audio message");
      // Would handle voice message processing here
    }
  }
}

// Send WhatsApp message API
app.post("/api/send-message", async (req, res) => {
  try {
    const { recipient, message } = req.body;

    if (!recipient || !message) {
      return res
        .status(400)
        .json({ success: false, error: "Recipient and message are required" });
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
    });
  }
});

// Comprehensive health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const uptime = Math.floor((new Date() - serverStartTime) / 1000); // Uptime in seconds

    const diskSpace = {
      uploadsDir: await getDiskSpace(uploadsDir),
      tempDir: await getDiskSpace(tempDir),
      audioDir: await getDiskSpace(audioDir),
    };

    // Check services health
    const services = {
      server: { status: "ok" },
      asr: await checkServiceHealth("/api/asr/health"),
      tts: await checkServiceHealth("/api/tts/health"),
    };

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: require("./package.json").version,
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime),
      },
      services,
      environment: process.env.NODE_ENV || "development",
      memory: process.memoryUsage(),
      diskSpace,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Simple ping endpoint for basic connectivity checks
app.get("/api/ping", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper function to check service health
async function checkServiceHealth(endpoint) {
  try {
    const response = await axios.get(`http://localhost:${PORT}${endpoint}`, {
      timeout: 2000,
    });
    return { status: "ok", data: response.data };
  } catch (error) {
    return { status: "error", error: error.message };
  }
}

// Helper function to get disk space
async function getDiskSpace(directory) {
  try {
    const files = await fs.readdir(directory);
    let totalSize = 0;

    for (const file of files) {
      const stats = await fs.stat(path.join(directory, file));
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }

    return {
      files: files.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Format uptime into days, hours, minutes, seconds
function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * 24 * 60 * 60;
  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Started at: ${serverStartTime.toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  // Close any connections here
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  // Close any connections here
  process.exit(0);
});
