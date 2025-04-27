/**
 * train_ghanaian_models.ts - Model training script for TalkGhana
 *
 * This script demonstrates how to train and enhance ASR and TTS models
 * for Ghanaian languages using the GhanaianModelTrainer.
 *
 * Run with: npm run train-models -- --language=twi --type=asr
 */

import { GhanaianModelTrainer } from "../training/GhanaianModelTrainer";
import { GhanaianLanguage } from "../training/GhanaianLanguageDatasetManager";
import * as path from "path";
import * as fs from "fs";

// Parse command line arguments
const args = process.argv.slice(2);
const parsedArgs: Record<string, string> = {};

args.forEach((arg) => {
  const [key, value] = arg.split("=");
  if (key && value) {
    parsedArgs[key.replace(/^--/, "")] = value;
  }
});

// Default values
const language: GhanaianLanguage =
  (parsedArgs.language as GhanaianLanguage) || "twi";
const trainType: "asr" | "tts" | "both" =
  (parsedArgs.type as "asr" | "tts" | "both") || "both";
const dataDir = parsedArgs.dataDir || path.join(process.cwd(), "data");
const outputDir = parsedArgs.outputDir || path.join(process.cwd(), "models");
const optimize = parsedArgs.optimize === "true";
const quantize = parsedArgs.quantize === "true";

// Create directories if they don't exist
[dataDir, outputDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize trainer
const trainer = new GhanaianModelTrainer(dataDir, outputDir);

// Define training configuration
const trainingConfig = {
  language,
  datasetDir: path.join(dataDir, "datasets", language),
  outputDir: path.join(outputDir, language),
  trainType,
  optimizeForMobile: optimize,
  quantize,
  exportFormat: ["tensorflowjs", "onnx"],

  // ASR-specific options
  asrOptions: {
    baseModel: "whisper-tiny" as const,
    batchSize: 16,
    epochs: 50,
    learningRate: 0.001,
    useAugmentation: true,
    evaluationSplit: 0.1,
    usePretrainedEmbeddings: true,
  },

  // TTS-specific options
  ttsOptions: {
    modelType: "fastspeech" as const,
    batchSize: 32,
    epochs: 100,
    learningRate: 0.0005,
    validationSplit: 0.1,
    speakerEmbeddingDim: 64,
    useTones: language !== "english", // Use tones for Ghanaian languages
    syllableLevel: language !== "english", // Use syllable level for Ghanaian languages
  },
};

/**
 * Main function to run the training process
 */
async function main() {
  console.log(`Starting ${trainType} model training for ${language}...`);
  console.log("Configuration:", JSON.stringify(trainingConfig, null, 2));

  try {
    // Train models
    const result = await trainer.trainModels({
      ...trainingConfig,
      exportFormat: trainingConfig.exportFormat as (
        | "tensorflowjs"
        | "onnx"
        | "pytorch"
      )[],
    });

    // Print results
    console.log("\nTraining completed successfully!");
    console.log("----------------------------------");
    console.log(`Language: ${result.language}`);

    if (result.asrModel) {
      console.log("\nASR Model:");
      console.log(`- Path: ${result.asrModel.path}`);
      console.log(`- Word Error Rate: ${result.asrModel.wer.toFixed(4)}`);
      if (result.asrModel.mer !== undefined) {
        console.log(`- Match Error Rate: ${result.asrModel.mer.toFixed(4)}`);
      }
      console.log(`- Size: ${result.asrModel.modelSize.toFixed(2)} MB`);
      console.log(
        `- Training duration: ${formatDuration(
          result.asrModel.trainingDuration
        )}`
      );
    }

    if (result.ttsModel) {
      console.log("\nTTS Model:");
      console.log(`- Path: ${result.ttsModel.path}`);
      console.log(`- Mel Loss: ${result.ttsModel.melLoss.toFixed(4)}`);
      if (result.ttsModel.durationLoss) {
        console.log(
          `- Duration Loss: ${result.ttsModel.durationLoss.toFixed(4)}`
        );
      }
      console.log(`- Size: ${result.ttsModel.modelSize.toFixed(2)} MB`);
      console.log(
        `- Training duration: ${formatDuration(
          result.ttsModel.trainingDuration
        )}`
      );
    }

    console.log("\nExported files:");
    result.exportedFiles.forEach((file) => console.log(`- ${file}`));

    // Generate samples if TTS model was trained
    if (result.ttsModel) {
      console.log("\nGenerating TTS samples...");

      const sampleTexts = getSampleTexts(language);
      const samplePaths = await trainer.generateSamples(
        language,
        sampleTexts,
        result.ttsModel.path
      );

      console.log("\nSample audio files:");
      samplePaths.forEach((path, i) => {
        console.log(`- "${sampleTexts[i]}": ${path}`);
      });
    }

    console.log("\nTraining and evaluation completed!");
  } catch (error) {
    console.error("Error during training:", error);
    process.exit(1);
  }
}

/**
 * Format duration in seconds to a human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Get sample texts for a language
 */
function getSampleTexts(language: GhanaianLanguage): string[] {
  // Sample texts for each language
  const samples: Record<GhanaianLanguage, string[]> = {
    twi: [
      "Akwaaba, ɛte sɛn?",
      "Meda wase",
      "Me din de Kofi",
      "Ghana yɛ ɔman a ɛyɛ fɛ",
    ],
    ga: [
      "Ojekoo, te oyaa?",
      "Oyiwaladon",
      "Migbɛi ji Nii",
      "Ghana ji mãŋ fɛfɛo",
    ],
    ewe: [
      "Ŋdi na mi, aleke nèle?",
      "Akpe",
      "Ŋkɔnye Kwame",
      "Ghana nye anyigba nyui aɖe",
    ],
    hausa: [
      "Sannu, yaya kake?",
      "Na gode",
      "Sunana Aliyu",
      "Ghana tana da kyau",
    ],
    dagbani: [
      "Dasiba, a wula be?",
      "Mba puya",
      "N yuuli Yakubu",
      "Ghana ka tingbani viela",
    ],
    english: [
      "Welcome, how are you?",
      "Thank you",
      "My name is John",
      "Ghana is a beautiful country",
    ],
  };

  return samples[language];
}

// Run the main function
main().catch(console.error);
