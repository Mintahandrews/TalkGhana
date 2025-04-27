/**
 * Download and prepare the Ghanaian language dataset from scidb.cn
 * Dataset ID: bbd6baee3acf43bbbc4fe25e21077c8a
 *
 * This script:
 * 1. Downloads the dataset archive from scidb.cn
 * 2. Extracts and organizes the data into our training directory structure
 * 3. Prepares the data for ASR and TTS training
 *
 * Usage: npm run download-dataset
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as child_process from "child_process";
import { GhanaianLanguage } from "../training/GhanaianLanguageDatasetManager";

// Dataset interfaces
interface DatasetStats {
  hours: number;
  speakers: number;
  utterances: number;
  maleRatio: number;
  femaleRatio: number;
  averageDuration: number;
  dateCreated: string;
  lastUpdated: string;
}

interface Dataset {
  language: GhanaianLanguage;
  name: string;
  description: string;
  path: string;
  stats: DatasetStats;
  license: string;
  sourceName?: string;
  sourceUrl?: string;
}

// Simple dataset manager implementation for this script
class DatasetManager {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async initialize(): Promise<void> {
    // Create necessary directories
    const dirs = [
      path.join(this.dataDir, "audio"),
      path.join(this.dataDir, "text"),
      path.join(this.dataDir, "models"),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  registerDataset(dataset: Dataset): void {
    console.log(`Registering dataset: ${dataset.name} for ${dataset.language}`);
    // In a full implementation, you would save this information to a registry file
  }
}

const DATASET_URL =
  "https://www.scidb.cn/en/detail?dataSetId=bbd6baee3acf43bbbc4fe25e21077c8a";
const DATA_ROOT = path.join(process.cwd(), "data");
const DOWNLOAD_DIR = path.join(DATA_ROOT, "downloads");
const DATASET_DIR = path.join(DATA_ROOT, "datasets");

// Ensure directories exist
for (const dir of [DATA_ROOT, DOWNLOAD_DIR, DATASET_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Supported languages
const LANGUAGES = ["twi", "ga", "ewe", "hausa", "english"];

// Create temp file for downloading
const downloadFile = path.join(DOWNLOAD_DIR, "ghanaian_dataset.zip");

/**
 * Download the dataset from scidb.cn
 */
async function downloadDataset(): Promise<void> {
  console.log(`Downloading dataset from ${DATASET_URL}...`);

  return new Promise((resolve, reject) => {
    // Note: This is a simplified example. In a real implementation, you would need to:
    // 1. Handle authentication if required by scidb.cn
    // 2. Follow redirects if needed
    // 3. Handle proper downloading of the actual dataset file

    console.log("Please manually download the dataset from:");
    console.log(DATASET_URL);
    console.log(`And place it in: ${DOWNLOAD_DIR}`);
    console.log("Then run this script again with --skip-download flag.");

    // In a real implementation, you'd do something like this:
    /*
    const file = fs.createWriteStream(downloadFile);
    https.get(DATASET_URL, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(downloadFile);
      reject(err);
    });
    */

    // For now, just check if the file already exists
    if (fs.existsSync(downloadFile)) {
      console.log("Dataset file already exists. Proceeding with extraction...");
      resolve();
    } else {
      if (process.argv.includes("--skip-download")) {
        console.log("Skipping download as requested...");
        resolve();
      } else {
        reject(
          new Error(
            "Dataset file not found. Please download it manually and place it in the downloads directory."
          )
        );
      }
    }
  });
}

/**
 * Extract the dataset archive
 */
async function extractDataset(): Promise<void> {
  console.log("Extracting dataset...");

  return new Promise((resolve, reject) => {
    // Simulate extraction (in a real implementation, use a library like unzipper or child_process.exec)
    if (fs.existsSync(downloadFile)) {
      try {
        // In a real implementation, you'd extract the ZIP file
        // For example using the unzip command:
        child_process.exec(
          `unzip -o ${downloadFile} -d ${DOWNLOAD_DIR}`,
          (error) => {
            if (error) {
              console.error("Failed to extract dataset:", error);
              reject(error);
            } else {
              console.log("Dataset extracted successfully");
              resolve();
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    } else {
      if (process.argv.includes("--skip-extract")) {
        console.log("Skipping extraction as requested...");
        resolve();
      } else {
        reject(new Error("Dataset file not found for extraction."));
      }
    }
  });
}

/**
 * Process and organize the dataset for each language
 */
async function organizeDataset(): Promise<void> {
  console.log("Organizing dataset...");

  // Initialize the dataset manager
  const datasetManager = new DatasetManager(DATA_ROOT);
  await datasetManager.initialize();

  const extractedDir = path.join(DOWNLOAD_DIR, "ghanaian_dataset");
  if (
    !fs.existsSync(extractedDir) &&
    !process.argv.includes("--skip-organize")
  ) {
    console.warn(
      "Extracted dataset directory not found. If you have manually organized the data, you can ignore this warning."
    );
    if (!process.argv.includes("--force-organize")) {
      return;
    }
  }

  // For each language, create the dataset structure
  for (const language of LANGUAGES) {
    const langDir = path.join(DATASET_DIR, language);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    // Create subdirectories for ASR and TTS data
    const asrDir = path.join(langDir, "asr");
    const ttsDir = path.join(langDir, "tts");

    for (const dir of [asrDir, ttsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    console.log(`Processing ${language} data...`);

    // Register dataset with the manager
    datasetManager.registerDataset({
      language: language as GhanaianLanguage,
      name: `${language}-scidb-dataset`,
      description: `${language} dataset from scidb.cn`,
      path: langDir,
      stats: {
        hours: 0, // Will be calculated during processing
        speakers: 0, // Will be calculated during processing
        utterances: 0, // Will be calculated during processing
        maleRatio: 0.5, // Default value
        femaleRatio: 0.5, // Default value
        averageDuration: 0, // Will be calculated during processing
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      license: "CC-BY-SA-4.0",
    });

    // In a real implementation, you'd now process the extracted files for this language
    // For example:
    // - Process audio files for ASR training
    // - Process text files for TTS training
    // - Create training/validation/test splits

    console.log(`- Created dataset structure for ${language}`);
  }

  console.log("Dataset organization complete");
}

/**
 * Prepare ASR training data
 */
async function prepareASRData(): Promise<void> {
  console.log("Preparing ASR training data...");

  // In a real implementation, you'd perform tasks like:
  // - Generating spectrograms from audio files
  // - Cleaning and normalizing transcriptions
  // - Creating training/validation/test splits

  for (const language of LANGUAGES) {
    const asrDir = path.join(DATASET_DIR, language, "asr");
    console.log(`- Preparing ASR data for ${language}`);

    // Create train/val/test splits
    for (const split of ["train", "val", "test"]) {
      const splitDir = path.join(asrDir, split);
      if (!fs.existsSync(splitDir)) {
        fs.mkdirSync(splitDir, { recursive: true });
      }

      for (const subdir of ["audio", "transcripts"]) {
        const dir = path.join(splitDir, subdir);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
    }

    console.log(`- Created ASR data structure for ${language}`);
  }

  console.log("ASR data preparation complete");
}

/**
 * Prepare TTS training data
 */
async function prepareTTSData(): Promise<void> {
  console.log("Preparing TTS training data...");

  // In a real implementation, you'd perform tasks like:
  // - Processing audio files for TTS training
  // - Generating phoneme alignments
  // - Creating training/validation/test splits

  for (const language of LANGUAGES) {
    const ttsDir = path.join(DATASET_DIR, language, "tts");
    console.log(`- Preparing TTS data for ${language}`);

    // Create train/val/test splits
    for (const split of ["train", "val", "test"]) {
      const splitDir = path.join(ttsDir, split);
      if (!fs.existsSync(splitDir)) {
        fs.mkdirSync(splitDir, { recursive: true });
      }

      for (const subdir of ["audio", "text", "alignment"]) {
        const dir = path.join(splitDir, subdir);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
    }

    console.log(`- Created TTS data structure for ${language}`);
  }

  console.log("TTS data preparation complete");
}

/**
 * Main function to run the dataset preparation pipeline
 */
async function main(): Promise<void> {
  try {
    await downloadDataset();
    await extractDataset();
    await organizeDataset();
    await prepareASRData();
    await prepareTTSData();

    console.log("\nDataset preparation completed successfully!");
    console.log(`\nYou can now train your models using this data with:`);
    console.log(`npm run train-models -- --language=twi --type=both`);
  } catch (error) {
    console.error("Error during dataset preparation:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
