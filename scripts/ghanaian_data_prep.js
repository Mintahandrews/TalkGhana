#!/usr/bin/env node

/**
 * Ghanaian Language Data Preparation Script
 *
 * This script provides utilities for collecting, processing, and preparing
 * data for training Ghanaian language speech models.
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { program } = require("commander");
const csvParser = require("csv-parser");

// Set up command line interface
program
  .name("ghanaian-data-prep")
  .description("Data preparation tools for Ghanaian language speech models")
  .version("1.0.0");

// Define paths
const DATA_ROOT = path.join(__dirname, "../data");
const AUDIO_RAW = path.join(DATA_ROOT, "audio/raw");
const AUDIO_PROCESSED = path.join(DATA_ROOT, "audio/processed");
const TEXT_RAW = path.join(DATA_ROOT, "text/raw");
const TEXT_PROCESSED = path.join(DATA_ROOT, "text/processed");
const LANGUAGES = ["twi", "ga", "ewe", "hausa", "english"];

// Ensure all directories exist
function ensureDirectories() {
  const dirs = [
    DATA_ROOT,
    AUDIO_RAW,
    AUDIO_PROCESSED,
    TEXT_RAW,
    TEXT_PROCESSED,
  ];

  // Create language subdirectories
  LANGUAGES.forEach((lang) => {
    dirs.push(
      path.join(AUDIO_RAW, lang),
      path.join(AUDIO_PROCESSED, lang),
      path.join(TEXT_RAW, lang),
      path.join(TEXT_PROCESSED, lang)
    );
  });

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Preprocess text function (normalize, clean, etc.)
function preprocessText(text, language) {
  // Basic normalization
  let processedText = text
    .replace(/[\r\n]+/g, " ") // Replace newlines with space
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim(); // Trim leading/trailing whitespace

  // Language-specific preprocessing
  switch (language) {
    case "twi":
      // Twi-specific normalization
      processedText = processedText.replace(/([0-9]+)/g, (m) => {
        // Convert numbers to words (simplified example)
        const num = parseInt(m);
        if (num === 1) return "baako";
        if (num === 2) return "mmienu";
        if (num === 3) return "mmiɛnsa";
        return m; // Keep as is if no mapping
      });
      break;

    case "ga":
      // Ga-specific normalization
      break;

    case "ewe":
      // Ewe-specific normalization
      break;

    case "hausa":
      // Hausa-specific normalization
      break;

    default:
      // Default normalization
      break;
  }

  return processedText;
}

// Import text data from CSV
program
  .command("import-text")
  .description("Import text data from CSV file")
  .requiredOption(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english)"
  )
  .requiredOption("-f, --file <file>", "CSV file with text data")
  .option("-id, --id-column <column>", "Column name for ID", "id")
  .option("-t, --text-column <column>", "Column name for text content", "text")
  .action(async (options) => {
    try {
      ensureDirectories();

      const { language, file, idColumn, textColumn } = options;

      if (!LANGUAGES.includes(language)) {
        console.error(
          `Error: Unsupported language. Supported languages are: ${LANGUAGES.join(
            ", "
          )}`
        );
        process.exit(1);
      }

      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      console.log(`Importing text data for ${language} from ${file}...`);

      const importedCount = await new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(file)
          .pipe(csvParser())
          .on("data", (data) => {
            const id = data[idColumn];
            const text = data[textColumn];

            if (id && text) {
              results.push({ id, text });
            }
          })
          .on("end", async () => {
            console.log(`Parsed ${results.length} entries from CSV.`);

            for (const { id, text } of results) {
              const processedText = preprocessText(text, language);
              const outputFile = path.join(
                TEXT_PROCESSED,
                language,
                `${id}.txt`
              );
              fs.writeFileSync(outputFile, processedText);
            }

            resolve(results.length);
          })
          .on("error", (err) => {
            reject(err);
          });
      });

      console.log(
        `Successfully imported ${importedCount} text entries for ${language}.`
      );
    } catch (error) {
      console.error("Error importing text data:", error);
      process.exit(1);
    }
  });

// Import and process audio files
program
  .command("import-audio")
  .description("Import and process audio files")
  .requiredOption(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english)"
  )
  .requiredOption(
    "-d, --directory <directory>",
    "Directory containing audio files"
  )
  .option("-f, --format <format>", "Target audio format (wav, mp3)", "wav")
  .option("-sr, --sample-rate <rate>", "Target sample rate", "16000")
  .option("-c, --channels <channels>", "Target number of channels", "1")
  .action(async (options) => {
    try {
      ensureDirectories();

      const { language, directory, format, sampleRate, channels } = options;

      if (!LANGUAGES.includes(language)) {
        console.error(
          `Error: Unsupported language. Supported languages are: ${LANGUAGES.join(
            ", "
          )}`
        );
        process.exit(1);
      }

      if (!fs.existsSync(directory)) {
        console.error(`Error: Directory not found: ${directory}`);
        process.exit(1);
      }

      console.log(`Importing audio files for ${language} from ${directory}...`);

      // Get audio files
      const files = fs.readdirSync(directory).filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".wav", ".mp3", ".ogg", ".flac", ".m4a"].includes(ext);
      });

      if (files.length === 0) {
        console.log("No audio files found in the specified directory.");
        process.exit(0);
      }

      console.log(`Found ${files.length} audio files. Processing...`);

      let processedCount = 0;

      for (const file of files) {
        const inputPath = path.join(directory, file);
        const fileId = path.basename(file, path.extname(file));
        const outputPath = path.join(
          AUDIO_PROCESSED,
          language,
          `${fileId}.${format}`
        );

        // Copy to raw directory
        const rawPath = path.join(AUDIO_RAW, language, file);
        fs.copyFileSync(inputPath, rawPath);

        // Process audio with ffmpeg
        const ffmpegCmd = `ffmpeg -i "${inputPath}" -ar ${sampleRate} -ac ${channels} -y "${outputPath}"`;

        await new Promise((resolve, reject) => {
          exec(ffmpegCmd, (error) => {
            if (error) {
              console.error(`Error processing ${file}:`, error.message);
              reject(error);
            } else {
              processedCount++;
              console.log(
                `Processed (${processedCount}/${files.length}): ${file}`
              );
              resolve();
            }
          });
        });
      }

      console.log(
        `Successfully processed ${processedCount} audio files for ${language}.`
      );
    } catch (error) {
      console.error("Error importing audio data:", error);
      process.exit(1);
    }
  });

// Generate transcription files
program
  .command("generate-transcripts")
  .description("Generate transcription files from audio and text data")
  .requiredOption(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english)"
  )
  .option(
    "-o, --output <file>",
    "Output file path for transcriptions",
    "transcripts.csv"
  )
  .action(async (options) => {
    try {
      const { language, output } = options;

      if (!LANGUAGES.includes(language)) {
        console.error(
          `Error: Unsupported language. Supported languages are: ${LANGUAGES.join(
            ", "
          )}`
        );
        process.exit(1);
      }

      const audioDir = path.join(AUDIO_PROCESSED, language);
      const textDir = path.join(TEXT_PROCESSED, language);

      if (!fs.existsSync(audioDir)) {
        console.error(`Error: Audio directory not found: ${audioDir}`);
        process.exit(1);
      }

      if (!fs.existsSync(textDir)) {
        console.error(`Error: Text directory not found: ${textDir}`);
        process.exit(1);
      }

      // Get audio files
      const audioFiles = fs.readdirSync(audioDir);
      const transcriptions = [];

      for (const audioFile of audioFiles) {
        const fileId = path.basename(audioFile, path.extname(audioFile));
        const textFile = path.join(textDir, `${fileId}.txt`);

        if (fs.existsSync(textFile)) {
          const text = fs.readFileSync(textFile, "utf-8").trim();
          const audioPath = path.join(audioDir, audioFile);

          // Get audio duration using ffprobe
          const duration = await new Promise((resolve, reject) => {
            exec(
              `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`,
              (error, stdout) => {
                if (error) {
                  console.error(
                    `Error getting duration for ${audioFile}:`,
                    error.message
                  );
                  reject(error);
                } else {
                  resolve(parseFloat(stdout.trim()));
                }
              }
            );
          });

          transcriptions.push({
            id: fileId,
            audio_file: audioFile,
            text,
            duration: duration.toFixed(2),
          });
        }
      }

      // Write transcriptions to CSV
      const outputPath = path.resolve(output);
      const header = "id,audio_file,duration,text\n";
      const rows = transcriptions
        .map(
          (t) =>
            `${t.id},${t.audio_file},${t.duration},"${t.text.replace(
              /"/g,
              '""'
            )}"`
        )
        .join("\n");

      fs.writeFileSync(outputPath, header + rows);

      console.log(
        `Generated transcription file with ${transcriptions.length} entries: ${outputPath}`
      );
    } catch (error) {
      console.error("Error generating transcripts:", error);
      process.exit(1);
    }
  });

// Generate data statistics
program
  .command("stats")
  .description("Generate statistics about the dataset")
  .option(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english, all)",
    "all"
  )
  .action(async (options) => {
    try {
      const { language } = options;
      const languages = language === "all" ? LANGUAGES : [language];

      for (const lang of languages) {
        if (!LANGUAGES.includes(lang)) {
          console.error(`Error: Unsupported language: ${lang}`);
          continue;
        }

        const audioDir = path.join(AUDIO_PROCESSED, lang);
        const textDir = path.join(TEXT_PROCESSED, lang);

        if (!fs.existsSync(audioDir) || !fs.existsSync(textDir)) {
          console.log(`No data found for language: ${lang}`);
          continue;
        }

        const audioFiles = fs.existsSync(audioDir)
          ? fs.readdirSync(audioDir)
          : [];
        const textFiles = fs.existsSync(textDir) ? fs.readdirSync(textDir) : [];

        // Calculate total audio duration
        let totalDuration = 0;
        for (const audioFile of audioFiles) {
          const audioPath = path.join(audioDir, audioFile);
          try {
            const duration = await new Promise((resolve, reject) => {
              exec(
                `ffprobe -i "${audioPath}" -show_entries format=duration -v quiet -of csv="p=0"`,
                (error, stdout) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(parseFloat(stdout.trim()));
                  }
                }
              );
            });
            totalDuration += duration;
          } catch (error) {
            console.warn(`Could not get duration for ${audioFile}`);
          }
        }

        // Calculate total word count
        let totalWords = 0;
        for (const textFile of textFiles) {
          const textPath = path.join(textDir, textFile);
          try {
            const text = fs.readFileSync(textPath, "utf-8").trim();
            const words = text.split(/\s+/).length;
            totalWords += words;
          } catch (error) {
            console.warn(`Could not process ${textFile}`);
          }
        }

        console.log(`\n=== Statistics for ${lang.toUpperCase()} ===`);
        console.log(`Audio files: ${audioFiles.length}`);
        console.log(`Text files: ${textFiles.length}`);
        console.log(
          `Total audio duration: ${(totalDuration / 3600).toFixed(2)} hours`
        );
        console.log(`Total word count: ${totalWords}`);
        console.log(
          `Average duration per file: ${(
            totalDuration / audioFiles.length
          ).toFixed(2)} seconds`
        );
        console.log(
          `Average words per file: ${(totalWords / textFiles.length).toFixed(
            2
          )}`
        );
      }
    } catch (error) {
      console.error("Error generating statistics:", error);
      process.exit(1);
    }
  });

// Verify data integrity
program
  .command("verify")
  .description("Verify data integrity")
  .option(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english, all)",
    "all"
  )
  .action(async (options) => {
    try {
      const { language } = options;
      const languages = language === "all" ? LANGUAGES : [language];

      for (const lang of languages) {
        if (!LANGUAGES.includes(lang)) {
          console.error(`Error: Unsupported language: ${lang}`);
          continue;
        }

        const audioDir = path.join(AUDIO_PROCESSED, lang);
        const textDir = path.join(TEXT_PROCESSED, lang);

        if (!fs.existsSync(audioDir) || !fs.existsSync(textDir)) {
          console.log(`No data found for language: ${lang}`);
          continue;
        }

        const audioFiles = fs.readdirSync(audioDir);
        const textFiles = fs
          .readdirSync(textDir)
          .map((f) => path.basename(f, ".txt"));

        // Find mismatches
        const audioSet = new Set(
          audioFiles.map((f) => path.basename(f, path.extname(f)))
        );
        const textSet = new Set(textFiles);

        const missingText = [...audioSet].filter((id) => !textSet.has(id));
        const missingAudio = [...textSet].filter((id) => !audioSet.has(id));

        console.log(`\n=== Verification for ${lang.toUpperCase()} ===`);
        console.log(`Total audio files: ${audioFiles.length}`);
        console.log(`Total text files: ${textFiles.length}`);
        console.log(
          `Audio files missing transcriptions: ${missingText.length}`
        );
        console.log(`Text files missing audio: ${missingAudio.length}`);

        if (missingText.length > 0) {
          console.log(`\nAudio files missing transcriptions (first 10):`);
          missingText.slice(0, 10).forEach((id) => console.log(`- ${id}`));
        }

        if (missingAudio.length > 0) {
          console.log(`\nText files missing audio (first 10):`);
          missingAudio.slice(0, 10).forEach((id) => console.log(`- ${id}`));
        }

        // Check audio integrity
        let corruptedAudio = 0;
        for (const audioFile of audioFiles.slice(0, 10)) {
          // Check only first 10 for performance
          const audioPath = path.join(audioDir, audioFile);
          try {
            await new Promise((resolve, reject) => {
              exec(`ffprobe -i "${audioPath}" -v quiet`, (error) => {
                if (error) {
                  corruptedAudio++;
                  console.warn(`Corrupted audio file: ${audioFile}`);
                  reject(error);
                } else {
                  resolve();
                }
              });
            });
          } catch (error) {
            // Error already logged
          }
        }

        console.log(`Corrupted audio files (sample): ${corruptedAudio}`);
      }
    } catch (error) {
      console.error("Error verifying data:", error);
      process.exit(1);
    }
  });

// Parse and execute commands
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}
