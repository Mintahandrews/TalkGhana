#!/usr/bin/env node

/**
 * Script to prepare sample Ghanaian language data for training
 * This creates sample text and audio data directories with placeholder files
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = path.resolve(__dirname, "..");

// Sample text data for each language
const sampleTexts = {
  twi: [
    "Akwaaba. Wo ho te sɛn?",
    "Me din de Kofi. Me firi Ghana.",
    "Ɛhɔ yɛ fɛ paa.",
    "Meda wo ase.",
    "Yɛbɛhyia bio.",
    "Me pɛ sɛ me sua Twi.",
    "Ɛte sɛn?",
    "Aane, mete aseɛ.",
    "Daabi, mente aseɛ.",
    "Wo kɔ he?",
  ],
  ga: [
    "Mii gbɛkɛ ojogbaŋŋ.",
    "Oyiwala dɔŋŋ.",
    "Miiŋ tsu nii.",
    "Miina bo.",
    "Miina bo wɔ jɛmɛ.",
    "Miina bo wɔ blɛoo.",
    "Miina bo wɔ shwane.",
    "Miina bo wɔ gbɛkɛ.",
    "Miina bo wɔ nyɔɔŋ.",
    "Miina bo wɔ ŋmɛnɛ.",
  ],
  ewe: [
    "Ŋdi na wò.",
    "Ndi na mi.",
    "Ŋdɔ na mi.",
    "Fiẽ na mi.",
    "Zã na mi.",
    "Akpe.",
    "Akpe kakaka.",
    "Mawu nayra wò.",
    "Mawu nedi kplii wò.",
    "Mawu nedi kpli mi.",
  ],
  hausa: [
    "Sannu.",
    "Ina kwana?",
    "Ina wuni?",
    "Ina yini?",
    "Yaya gajiya?",
    "Lafiya lau.",
    "Na gode.",
    "Na gode sosai.",
    "Allah ya kiyaye.",
    "Sai anjima.",
  ],
  english: [
    "Hello, how are you?",
    "My name is Kofi. I am from Ghana.",
    "It is very beautiful there.",
    "Thank you.",
    "See you later.",
    "I want to learn Twi.",
    "How is it going?",
    "Yes, I understand.",
    "No, I don't understand.",
    "Where are you going?",
  ],
};

/**
 * Create directory if it doesn't exist
 * @param {string} dir Directory path
 */
function ensureDirectoryExists(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
    throw new Error(`Failed to create directory ${dir}: ${error.message}`);
  }
}

/**
 * Write data to file with error handling
 * @param {string} filePath Path to file
 * @param {string|Buffer} data Data to write
 * @param {string} successMessage Message to log on success
 */
function writeFileWithErrorHandling(filePath, data, successMessage) {
  try {
    fs.writeFileSync(filePath, data);
    console.log(successMessage || `Created file: ${filePath}`);
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    throw new Error(`Failed to write to file ${filePath}: ${error.message}`);
  }
}

// Create data directory structure
const dataDir = path.join(cwd, "data");
const languages = ["twi", "ga", "ewe", "hausa", "english"];
const dataTypes = ["audio", "text"];
const stages = ["raw", "processed"];

// Create directories
console.log("Creating directory structure...");
for (const dataType of dataTypes) {
  for (const stage of stages) {
    for (const language of languages) {
      const dir = path.join(dataDir, dataType, stage, language);
      ensureDirectoryExists(dir);
    }
  }
}

// Create models and training_logs directories
const modelsDir = path.join(dataDir, "models");
ensureDirectoryExists(modelsDir);

for (const language of languages) {
  const languageModelDir = path.join(modelsDir, language);
  ensureDirectoryExists(languageModelDir);
}

const logsDir = path.join(dataDir, "training_logs");
ensureDirectoryExists(logsDir);

// Create sample text files
console.log("\nCreating sample text files...");
for (const language of languages) {
  const texts = sampleTexts[language];

  // Create raw text file
  const rawTextFile = path.join(
    dataDir,
    "text",
    "raw",
    language,
    "samples.txt"
  );
  writeFileWithErrorHandling(
    rawTextFile,
    texts.join("\n"),
    `Created raw text file: ${rawTextFile}`
  );

  // Create CSV file with text and translations
  const csvFile = path.join(dataDir, "text", "raw", language, "samples.csv");
  const csvContent = [
    "id,text,translation,speaker,duration",
    ...texts.map(
      (text, i) =>
        `${language}_${i + 1},${text},${
          sampleTexts.english[i % sampleTexts.english.length]
        },speaker1,3.5`
    ),
  ].join("\n");
  writeFileWithErrorHandling(
    csvFile,
    csvContent,
    `Created CSV file: ${csvFile}`
  );

  // Create processed text file (simulated cleaned version)
  const processedTextFile = path.join(
    dataDir,
    "text",
    "processed",
    language,
    "cleaned_samples.txt"
  );
  writeFileWithErrorHandling(
    processedTextFile,
    texts.map((t) => t.toLowerCase()).join("\n"),
    `Created processed text file: ${processedTextFile}`
  );

  // Create vocabulary file
  const vocabFile = path.join(
    dataDir,
    "text",
    "processed",
    language,
    "vocabulary.json"
  );
  const words = new Set();
  texts.forEach((text) => {
    text.split(/\s+/).forEach((word) => {
      words.add(word.replace(/[^\w\s]/g, "").toLowerCase());
    });
  });
  const vocabulary = ["<pad>", "<unk>", "<sos>", "<eos>", ...Array.from(words)];
  writeFileWithErrorHandling(
    vocabFile,
    JSON.stringify(vocabulary, null, 2),
    `Created vocabulary file: ${vocabFile}`
  );
}

// Create placeholder audio files
console.log("\nCreating placeholder audio files...");
for (const language of languages) {
  const texts = sampleTexts[language];

  // Create placeholder WAV files (empty files)
  for (let i = 0; i < texts.length; i++) {
    const rawAudioFile = path.join(
      dataDir,
      "audio",
      "raw",
      language,
      `sample_${i + 1}.wav`
    );
    writeFileWithErrorHandling(
      rawAudioFile,
      "", // Empty file
      `Created placeholder audio file: ${rawAudioFile}`
    );

    // Create processed audio file (simulated feature extraction)
    const processedAudioFile = path.join(
      dataDir,
      "audio",
      "processed",
      language,
      `sample_${i + 1}_features.json`
    );
    const features = {
      id: `${language}_${i + 1}`,
      text: texts[i],
      duration: 3.5,
      features: {
        mfcc: Array(13)
          .fill()
          .map(() => Array(100).fill(0)),
        melSpectrogram: Array(80)
          .fill()
          .map(() => Array(100).fill(0)),
      },
    };
    writeFileWithErrorHandling(
      processedAudioFile,
      JSON.stringify(features, null, 2),
      `Created processed audio features: ${processedAudioFile}`
    );
  }

  // Create metadata file
  const metadataFile = path.join(
    dataDir,
    "audio",
    "raw",
    language,
    "metadata.csv"
  );
  const metadataContent = [
    "file_name,text,duration",
    ...texts.map((text, i) => `sample_${i + 1}.wav,${text},3.5`),
  ].join("\n");
  writeFileWithErrorHandling(
    metadataFile,
    metadataContent,
    `Created audio metadata file: ${metadataFile}`
  );
}

// Create sample model config files
console.log("\nCreating sample model configurations...");
for (const language of languages) {
  // Create TTS model config
  const ttsModelConfig = {
    language,
    options: {
      modelType: "fastspeech",
      batchSize: 32,
      epochs: 100,
      learningRate: 0.001,
      useTones: language !== "english",
      syllableLevel: true,
    },
    history: {
      loss: [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.8, 1.6, 1.5],
      val_loss: [5.5, 5.0, 4.5, 4.0, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4],
    },
    timestamp: new Date().toISOString(),
    trainingDuration: 3600,
    vocabSize: 100,
  };

  const ttsConfigFile = path.join(
    modelsDir,
    language,
    `${language}_fastspeech_sample_config.json`
  );
  writeFileWithErrorHandling(
    ttsConfigFile,
    JSON.stringify(ttsModelConfig, null, 2),
    `Created TTS model config: ${ttsConfigFile}`
  );

  // Create STT model config
  const sttModelConfig = {
    language,
    options: {
      modelType: "conformer",
      batchSize: 16,
      epochs: 100,
      learningRate: 0.0001,
      melSpecConfig: {
        sampleRate: 16000,
        fftSize: 512,
        melBands: 80,
        hopLength: 160,
      },
    },
    history: {
      loss: [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.8, 1.6, 1.5],
      val_loss: [5.5, 5.0, 4.5, 4.0, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4],
    },
    timestamp: new Date().toISOString(),
    trainingDuration: 4800,
    vocabularySize: 100,
  };

  const sttConfigFile = path.join(
    modelsDir,
    language,
    `${language}_conformer_sample_config.json`
  );
  writeFileWithErrorHandling(
    sttConfigFile,
    JSON.stringify(sttModelConfig, null, 2),
    `Created STT model config: ${sttConfigFile}`
  );
}

console.log("\nSample data preparation complete!");
console.log(`All data has been created in: ${dataDir}`);
console.log("\nYou can now use the training tools with this sample data:");
console.log("- npm run train:interactive");
console.log("- npm run train:tts -- -l twi");
console.log("- npm run train:stt -- -l ga");
console.log("- npm run data:list -- -l ewe");
