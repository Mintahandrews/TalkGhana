const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// OpenAI Whisper API endpoint
router.post("/whisper", upload.single("audio"), async (req, res) => {
  let audioFile = null;

  try {
    audioFile = req.file;
    const language = req.body.language || "en";
    const model = req.body.model || "whisper-1";

    if (!audioFile) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Clean up if we have a file but no API key
      if (audioFile && fs.existsSync(audioFile.path)) {
        fs.unlinkSync(audioFile.path);
      }
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    // Call OpenAI Whisper API
    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioFile.path));
    formData.append("model", model);
    formData.append("language", language);

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 second timeout for large audio files
      }
    );

    // Clean up the uploaded file
    if (fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }

    res.json(response.data);
  } catch (error) {
    // Clean up the uploaded file even if there's an error
    if (audioFile && audioFile.path && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }

    console.error("Whisper API error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message,
      success: false,
    });
  }
});

// Add a new endpoint for health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ASR Service",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
