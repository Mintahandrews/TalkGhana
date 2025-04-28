#!/usr/bin/env node

/**
 * Postinstall script for TalkGhana
 *
 * This script:
 * 1. Checks if all required dependencies are installed
 * 2. Sets up the development environment
 * 3. Ensures language files are available
 */

console.log("🌍 Setting up TalkGhana development environment...");

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Ensure i18next-http-backend is installed
try {
  require.resolve("i18next-http-backend");
  console.log("✅ i18next-http-backend is installed");
} catch (e) {
  console.log("🔄 Installing i18next-http-backend...");
  try {
    execSync("npm install i18next-http-backend --save", { stdio: "inherit" });
    console.log("✅ i18next-http-backend installed successfully");
  } catch (err) {
    console.error("❌ Failed to install i18next-http-backend:", err.message);
  }
}

// Check if environment file exists, create it if not
const envFile = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envFile)) {
  console.log("📝 Creating .env file...");
  const envExample = `# TalkGhana Environment Variables
NODE_ENV=development
VITE_API_URL=http://localhost:3000
# Hugging Face API
VITE_HUGGINGFACE_API_KEY=
# WhatsApp Integration (Optional)
VITE_WHATSAPP_ENABLED=false
VITE_WHATSAPP_NUMBER=
`;

  fs.writeFileSync(envFile, envExample);
  console.log("✅ Created .env file");
}

// Create locales directory and base files if they don't exist
const localesDir = path.join(__dirname, "..", "src", "i18n", "locales");
if (!fs.existsSync(localesDir)) {
  console.log("📁 Creating locales directory...");
  fs.mkdirSync(localesDir, { recursive: true });

  // Create base English translations file
  const enTranslations = {
    appTitle: "TalkGhana",
    greeting: "Welcome to TalkGhana",
    welcome: "Your voice matters",
    language: "Language",
    settings: "Settings",
    conversation: "Conversation",
    speechRate: "Speech Rate",
    speechPitch: "Speech Pitch",
    download: "Download",
    downloaded: "Downloaded",
    notDownloaded: "Not downloaded",
  };

  fs.writeFileSync(
    path.join(localesDir, "en.json"),
    JSON.stringify(enTranslations, null, 2)
  );

  console.log("✅ Created base translation files");
}

console.log("🎉 TalkGhana setup complete!");
console.log('🚀 Run "npm run dev" to start the development server');
