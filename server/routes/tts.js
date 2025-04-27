const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Language code mapping for Ghanaian languages
const LANGUAGE_CODES = {
  twi: "ak",
  ga: "gaa",
  ewe: "ee",
  dagbani: "dag",
  hausa: "ha",
  english: "en",
};

// Phonetic replacements for better pronunciation
const PHONETIC_MAPS = {
  twi: {
    ɛ: "eh",
    ɔ: "aw",
    akwaaba: "ah-kwa-ba",
    medaase: "meh-da-seh",
  },
  ga: {
    ɛ: "eh",
    ɔ: "aw",
    ogekoo: "oh-geh-koh",
  },
  ewe: {
    ɛ: "eh",
    ɔ: "aw",
    ƒ: "f",
    ɖ: "d",
  },
  hausa: {
    ɓ: "b",
    ɗ: "d",
  },
};

// Utility to apply phonetic replacements
const applyPhoneticReplacements = (text, language) => {
  if (!PHONETIC_MAPS[language]) return text;

  let result = text;
  const replacements = PHONETIC_MAPS[language];

  for (const [original, replacement] of Object.entries(replacements)) {
    result = result.replace(new RegExp(original, "g"), replacement);
  }

  return result;
};

// TTS endpoint
router.post("/", async (req, res) => {
  try {
    const { text, language = "english", voice, pitch = 1, rate = 1 } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const uploadDir = path.join(__dirname, "..", "..", "uploads");
    const audioDir = path.join(uploadDir, "audio");

    // Create directories if they don't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const filename = `${timestamp}-${language}.mp3`;
    const filepath = path.join(audioDir, filename);

    // Apply phonetic replacements for better pronunciation
    const processedText = applyPhoneticReplacements(text, language);

    // For now, simulate TTS processing with a delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // In a real implementation, this would call a TTS API and save the audio file

    // Return the simulated response for now
    res.status(200).json({
      success: true,
      message: "TTS request processed",
      language: language,
      text: processedText,
      audioUrl: `/uploads/audio/${filename}`,
      duration: text.length * 80, // Rough estimate of audio duration in ms
    });
  } catch (error) {
    console.error("TTS API error:", error.message);
    res.status(500).json({
      error: error.message || "Internal server error",
      success: false,
    });
  }
});

// Add an endpoint to get available voices
router.get("/voices", (req, res) => {
  try {
    // Simulate available voices for each language
    const voices = {
      english: [
        { id: "en-female-1", name: "Sophia (English)", gender: "female" },
        { id: "en-male-1", name: "James (English)", gender: "male" },
      ],
      twi: [{ id: "twi-female-1", name: "Adwoa (Twi)", gender: "female" }],
      ga: [{ id: "ga-female-1", name: "Emefa (Ga)", gender: "female" }],
      ewe: [{ id: "ewe-male-1", name: "Kofi (Ewe)", gender: "male" }],
      hausa: [{ id: "hausa-male-1", name: "Abdul (Hausa)", gender: "male" }],
    };

    res.status(200).json({
      success: true,
      voices,
    });
  } catch (error) {
    console.error("Error fetching voices:", error.message);
    res.status(500).json({
      error: error.message || "Failed to retrieve voices",
      success: false,
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TTS Service",
    timestamp: new Date().toISOString(),
    languages: Object.keys(LANGUAGE_CODES),
  });
});

module.exports = router;
