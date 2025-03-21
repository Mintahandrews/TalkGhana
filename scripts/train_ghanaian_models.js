#!/usr/bin/env node

/**
 * Command-line script for training Ghanaian language models
 * This script allows training TTS and STT models without using the web interface
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { Command } from "commander";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = path.resolve(__dirname, "..");

// Create program instance
const program = new Command();

// Mock imports since we can't dynamically import ES modules in CommonJS
// In a real implementation, we would use proper imports
// import { ghanaianTTSTrainer } from '../lib/training/GhanaianTTSTrainer.js';
// import { ghanaianSTTTrainer } from '../lib/training/GhanaianSTTTrainer.js';
// import { ghanaianDatasetManager } from '../lib/training/GhanaianLanguageDatasetManager.js';

// Simulated trainers (for demonstration purposes)
const ghanaianTTSTrainer = {
  async trainModel(language, options) {
    console.log(`Training TTS model for ${language} with options:`, options);
    try {
      // Simulate training delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        modelPath: `${cwd}/data/models/${language}/tts_model_${Date.now()}`,
        trainingDuration: 3600,
        metrics: {
          loss: 1.5,
          validationLoss: 2.4,
        },
      };
    } catch (error) {
      console.error("Error in TTS training:", error);
      throw new Error(`TTS training failed: ${error.message}`);
    }
  },

  async exportModel(modelPath, formats) {
    console.log(`Exporting model from ${modelPath} to formats:`, formats);
    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return formats.map((format) => `${modelPath}_${format}`);
    } catch (error) {
      console.error("Error exporting model:", error);
      throw new Error(`Model export failed: ${error.message}`);
    }
  },
};

const ghanaianSTTTrainer = {
  async trainModel(language, options) {
    console.log(`Training STT model for ${language} with options:`, options);
    try {
      // Simulate training delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        modelPath: `${cwd}/data/models/${language}/stt_model_${Date.now()}`,
        trainingDuration: 4800,
        metrics: {
          wordErrorRate: 0.25,
          characterErrorRate: 0.1,
        },
      };
    } catch (error) {
      console.error("Error in STT training:", error);
      throw new Error(`STT training failed: ${error.message}`);
    }
  },

  async exportModel(modelPath, formats) {
    console.log(`Exporting model from ${modelPath} to formats:`, formats);
    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return formats.map((format) => `${modelPath}_${format}`);
    } catch (error) {
      console.error("Error exporting model:", error);
      throw new Error(`Model export failed: ${error.message}`);
    }
  },
};

const ghanaianDatasetManager = {
  async listAvailableData(language, type) {
    console.log(`Listing available ${type} data for ${language}`);
    try {
      // Simulate data listing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if data directory exists
      const baseDataDir = path.join(cwd, "data", type, "processed", language);
      if (!fs.existsSync(baseDataDir)) {
        console.warn(
          `No ${type} data directory found for ${language}. Try running 'npm run data:prepare' first.`
        );
        return {
          count: 0,
          totalDuration: type === "audio" ? 0 : null,
          samples: [],
        };
      }

      return {
        count: 100,
        totalDuration: type === "audio" ? 3600 : null,
        samples: [`${language}_sample_1`, `${language}_sample_2`],
      };
    } catch (error) {
      console.error(`Error listing ${type} data for ${language}:`, error);
      throw new Error(`Failed to list data: ${error.message}`);
    }
  },

  async importTextFromCSV(language, filePath) {
    console.log(`Importing text data for ${language} from ${filePath}`);
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Simulate import delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return { imported: 100, skipped: 5 };
    } catch (error) {
      console.error("Error importing text data:", error);
      throw new Error(`Failed to import text: ${error.message}`);
    }
  },

  async importAudioFiles(language, dirPath) {
    console.log(`Importing audio files for ${language} from ${dirPath}`);
    try {
      // Check if directory exists
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }

      // Simulate import delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return { imported: 50, skipped: 2, totalDuration: 3600 };
    } catch (error) {
      console.error("Error importing audio files:", error);
      throw new Error(`Failed to import audio: ${error.message}`);
    }
  },
};

// Configure the command-line interface
program
  .name("train-ghanaian-models")
  .description("Command-line tool for training Ghanaian language models")
  .version("1.0.0");

// Command for listing available data
program
  .command("list-data")
  .description("List available training data")
  .requiredOption(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english)"
  )
  .option("-t, --type <type>", "Data type (audio, text)", "both")
  .action(async (options) => {
    try {
      if (options.type === "both" || options.type === "audio") {
        const audioData = await ghanaianDatasetManager.listAvailableData(
          options.language,
          "audio"
        );
        console.log("\nAudio data:");
        console.log(`- Count: ${audioData.count} files`);
        console.log(
          `- Total duration: ${Math.floor(
            audioData.totalDuration / 60
          )} minutes`
        );
        console.log("- Sample files:", audioData.samples.join(", "));
      }

      if (options.type === "both" || options.type === "text") {
        const textData = await ghanaianDatasetManager.listAvailableData(
          options.language,
          "text"
        );
        console.log("\nText data:");
        console.log(`- Count: ${textData.count} entries`);
        console.log("- Sample entries:", textData.samples.join(", "));
      }
    } catch (error) {
      console.error("Error listing data:", error);
      process.exit(1);
    }
  });

// Command for importing data
program
  .command("import-data")
  .description("Import training data")
  .requiredOption(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english)"
  )
  .option("-t, --text <filepath>", "CSV file with text data")
  .option("-a, --audio <dirpath>", "Directory with audio files")
  .action(async (options) => {
    try {
      if (options.text) {
        const result = await ghanaianDatasetManager.importTextFromCSV(
          options.language,
          options.text
        );
        console.log(
          `\nImported ${result.imported} text entries (${result.skipped} skipped)`
        );
      }

      if (options.audio) {
        const result = await ghanaianDatasetManager.importAudioFiles(
          options.language,
          options.audio
        );
        console.log(
          `\nImported ${result.imported} audio files (${result.skipped} skipped)`
        );
        console.log(
          `Total duration: ${Math.floor(result.totalDuration / 60)} minutes`
        );
      }

      if (!options.text && !options.audio) {
        console.error("Error: You must specify either --text or --audio");
        process.exit(1);
      }
    } catch (error) {
      console.error("Error importing data:", error);
      process.exit(1);
    }
  });

// Command for training TTS models
program
  .command("train-tts")
  .description("Train a Text-to-Speech model")
  .requiredOption(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english)"
  )
  .option(
    "-m, --model <architecture>",
    "Model architecture (fastspeech, tacotron, glowtts, vits)",
    "fastspeech"
  )
  .option("-b, --batch-size <size>", "Batch size", "32")
  .option("-e, --epochs <count>", "Number of epochs", "100")
  .option("-r, --learning-rate <rate>", "Learning rate", "0.001")
  .option("--tones", "Enable tonal features", true)
  .option("--syllables", "Use syllable-level modeling", true)
  .option(
    "-o, --output <dir>",
    "Output directory (default: data/models/<language>)"
  )
  .option(
    "--export <formats>",
    "Export formats (comma-separated: tfjs,tflite,tensorflowjs)",
    "tfjs"
  )
  .action(async (options) => {
    try {
      console.log(`Starting TTS training for ${options.language}...`);

      // Verify that data exists for the language
      try {
        const textData = await ghanaianDatasetManager.listAvailableData(
          options.language,
          "text"
        );
        const audioData = await ghanaianDatasetManager.listAvailableData(
          options.language,
          "audio"
        );

        if (textData.count === 0 || audioData.count === 0) {
          console.warn("\nWarning: Limited or no data available for training.");
          console.warn(
            `Text entries: ${textData.count}, Audio files: ${audioData.count}`
          );

          const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer = await new Promise((resolve) => {
            readline.question(
              "Continue with training anyway? (y/n): ",
              resolve
            );
          });

          readline.close();

          if (answer.toLowerCase() !== "y") {
            console.log("Training cancelled.");
            return;
          }
        }
      } catch (error) {
        console.warn(
          "Warning: Unable to verify available data:",
          error.message
        );
      }

      const trainingOptions = {
        batchSize: parseInt(options.batchSize, 10),
        epochs: parseInt(options.epochs, 10),
        learningRate: parseFloat(options.learningRate),
        modelType: options.model,
        useTones: options.tones,
        syllableLevel: options.syllables,
        checkpointDir:
          options.output || path.join(cwd, "data", "models", options.language),
      };

      // Ensure model output directory exists
      const modelDir =
        options.output || path.join(cwd, "data", "models", options.language);
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
        console.log(`Created model directory: ${modelDir}`);
      }

      // Create training progress indicator
      const progressInterval = setInterval(() => {
        process.stdout.write(".");
      }, 1000);

      // Perform the training
      const result = await ghanaianTTSTrainer.trainModel(
        options.language,
        trainingOptions
      );

      clearInterval(progressInterval);
      console.log("\nTraining completed!");
      console.log(`- Model saved to: ${result.modelPath}`);
      console.log(
        `- Training duration: ${Math.floor(
          result.trainingDuration / 60
        )} minutes`
      );
      console.log("- Metrics:");
      Object.entries(result.metrics).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value.toFixed(4)}`);
      });

      // Export the model if requested
      if (options.export) {
        const formats = options.export.split(",");
        console.log(`\nExporting model to formats: ${formats.join(", ")}...`);
        const exportPaths = await ghanaianTTSTrainer.exportModel(
          result.modelPath,
          formats
        );
        console.log("- Exported to:");
        exportPaths.forEach((path) => console.log(`  - ${path}`));
      }
    } catch (error) {
      console.error("Error training TTS model:", error);
      process.exit(1);
    }
  });

// Command for training STT models
program
  .command("train-stt")
  .description("Train a Speech-to-Text model")
  .requiredOption(
    "-l, --language <language>",
    "Target language (twi, ga, ewe, hausa, english)"
  )
  .option(
    "-m, --model <architecture>",
    "Model architecture (conformer, quartznet, wav2vec, whisper)",
    "conformer"
  )
  .option("-b, --batch-size <size>", "Batch size", "16")
  .option("-e, --epochs <count>", "Number of epochs", "100")
  .option("-r, --learning-rate <rate>", "Learning rate", "0.0001")
  .option(
    "-s, --sample-rate <rate>",
    "Audio sample rate (8000, 16000, 22050, 44100)",
    "16000"
  )
  .option("--mel-bands <count>", "Number of mel bands", "80")
  .option(
    "-o, --output <dir>",
    "Output directory (default: data/models/<language>)"
  )
  .option(
    "--export <formats>",
    "Export formats (comma-separated: tfjs,tflite,tensorflowjs)",
    "tfjs"
  )
  .action(async (options) => {
    try {
      console.log(`Starting STT training for ${options.language}...`);

      // Verify that data exists for the language
      try {
        const textData = await ghanaianDatasetManager.listAvailableData(
          options.language,
          "text"
        );
        const audioData = await ghanaianDatasetManager.listAvailableData(
          options.language,
          "audio"
        );

        if (textData.count === 0 || audioData.count === 0) {
          console.warn("\nWarning: Limited or no data available for training.");
          console.warn(
            `Text entries: ${textData.count}, Audio files: ${audioData.count}`
          );

          const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer = await new Promise((resolve) => {
            readline.question(
              "Continue with training anyway? (y/n): ",
              resolve
            );
          });

          readline.close();

          if (answer.toLowerCase() !== "y") {
            console.log("Training cancelled.");
            return;
          }
        }
      } catch (error) {
        console.warn(
          "Warning: Unable to verify available data:",
          error.message
        );
      }

      const trainingOptions = {
        batchSize: parseInt(options.batchSize, 10),
        epochs: parseInt(options.epochs, 10),
        learningRate: parseFloat(options.learningRate),
        modelType: options.model,
        checkpointDir:
          options.output || path.join(cwd, "data", "models", options.language),
        melSpecConfig: {
          sampleRate: parseInt(options.sampleRate, 10),
          melBands: parseInt(options.melBands, 10),
          fftSize: parseInt(options.sampleRate, 10) === 8000 ? 256 : 512,
          hopLength: parseInt(options.sampleRate, 10) / 100, // 10ms hop
        },
      };

      // Ensure model output directory exists
      const modelDir =
        options.output || path.join(cwd, "data", "models", options.language);
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
        console.log(`Created model directory: ${modelDir}`);
      }

      // Create training progress indicator
      const progressInterval = setInterval(() => {
        process.stdout.write(".");
      }, 1000);

      // Perform the training
      const result = await ghanaianSTTTrainer.trainModel(
        options.language,
        trainingOptions
      );

      clearInterval(progressInterval);
      console.log("\nTraining completed!");
      console.log(`- Model saved to: ${result.modelPath}`);
      console.log(
        `- Training duration: ${Math.floor(
          result.trainingDuration / 60
        )} minutes`
      );
      console.log("- Metrics:");
      Object.entries(result.metrics).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value.toFixed(4)}`);
      });

      // Export the model if requested
      if (options.export) {
        const formats = options.export.split(",");
        console.log(`\nExporting model to formats: ${formats.join(", ")}...`);
        const exportPaths = await ghanaianSTTTrainer.exportModel(
          result.modelPath,
          formats
        );
        console.log("- Exported to:");
        exportPaths.forEach((path) => console.log(`  - ${path}`));
      }
    } catch (error) {
      console.error("Error training STT model:", error);
      process.exit(1);
    }
  });

// Interactive mode command
program
  .command("interactive")
  .description("Start interactive training mode")
  .action(() => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("======================================");
    console.log("Ghanaian Language Model Training Tool");
    console.log("======================================");
    console.log("");

    const promptLanguage = () => {
      rl.question(
        "Select language (twi, ga, ewe, hausa, english): ",
        (language) => {
          if (!["twi", "ga", "ewe", "hausa", "english"].includes(language)) {
            console.log("Invalid language. Please try again.");
            return promptLanguage();
          }

          promptModelType(language);
        }
      );
    };

    const promptModelType = (language) => {
      rl.question("Select model type (tts, stt): ", (modelType) => {
        if (!["tts", "stt"].includes(modelType)) {
          console.log("Invalid model type. Please try again.");
          return promptModelType(language);
        }

        if (modelType === "tts") {
          promptTTSOptions(language);
        } else {
          promptSTTOptions(language);
        }
      });
    };

    const promptTTSOptions = (language) => {
      console.log("\nTraining a TTS model for", language.toUpperCase());

      rl.question(
        "Model architecture (fastspeech, tacotron, glowtts, vits) [fastspeech]: ",
        (modelType) => {
          modelType = modelType || "fastspeech";
          if (
            !["fastspeech", "tacotron", "glowtts", "vits"].includes(modelType)
          ) {
            console.log("Invalid architecture. Using fastspeech.");
            modelType = "fastspeech";
          }

          rl.question("Number of epochs [100]: ", (epochs) => {
            epochs = parseInt(epochs || "100", 10);

            rl.question("Enable tonal features? (y/n) [y]: ", (tones) => {
              tones = (tones || "y").toLowerCase() === "y";

              rl.question(
                "Are you ready to start training? (y/n): ",
                async (confirm) => {
                  if (confirm.toLowerCase() === "y") {
                    console.log("\nStarting TTS training...");

                    try {
                      // Verify that data exists
                      try {
                        const textData =
                          await ghanaianDatasetManager.listAvailableData(
                            language,
                            "text"
                          );
                        const audioData =
                          await ghanaianDatasetManager.listAvailableData(
                            language,
                            "audio"
                          );

                        if (textData.count === 0 || audioData.count === 0) {
                          console.warn(
                            "\nWarning: Limited or no data available for training."
                          );
                          console.warn(
                            `Text entries: ${textData.count}, Audio files: ${audioData.count}`
                          );

                          const answer = await new Promise((resolve) => {
                            rl.question(
                              "Continue with training anyway? (y/n): ",
                              resolve
                            );
                          });

                          if (answer.toLowerCase() !== "y") {
                            console.log("Training cancelled.");
                            rl.close();
                            return;
                          }
                        }
                      } catch (error) {
                        console.warn(
                          "Warning: Unable to verify available data:",
                          error.message
                        );
                      }

                      // Create progress indicator
                      const progressInterval = setInterval(() => {
                        process.stdout.write(".");
                      }, 1000);

                      const result = await ghanaianTTSTrainer.trainModel(
                        language,
                        {
                          modelType,
                          epochs,
                          useTones: tones,
                          batchSize: 32,
                          learningRate: 0.001,
                          syllableLevel: true,
                        }
                      );

                      clearInterval(progressInterval);
                      console.log("\nTraining completed!");
                      console.log(`- Model saved to: ${result.modelPath}`);
                      console.log(
                        `- Training duration: ${Math.floor(
                          result.trainingDuration / 60
                        )} minutes`
                      );

                      rl.question(
                        "\nExport the model? (y/n): ",
                        async (exportConfirm) => {
                          if (exportConfirm.toLowerCase() === "y") {
                            const exportPaths =
                              await ghanaianTTSTrainer.exportModel(
                                result.modelPath,
                                ["tfjs"]
                              );
                            console.log("- Exported to:", exportPaths[0]);
                          }

                          console.log("\nTraining session completed.");
                          rl.close();
                        }
                      );
                    } catch (error) {
                      console.error("Error during training:", error);
                      rl.close();
                    }
                  } else {
                    console.log("Training cancelled.");
                    rl.close();
                  }
                }
              );
            });
          });
        }
      );
    };

    const promptSTTOptions = (language) => {
      console.log("\nTraining an STT model for", language.toUpperCase());

      rl.question(
        "Model architecture (conformer, quartznet, wav2vec, whisper) [conformer]: ",
        (modelType) => {
          modelType = modelType || "conformer";
          if (
            !["conformer", "quartznet", "wav2vec", "whisper"].includes(
              modelType
            )
          ) {
            console.log("Invalid architecture. Using conformer.");
            modelType = "conformer";
          }

          rl.question("Number of epochs [100]: ", (epochs) => {
            epochs = parseInt(epochs || "100", 10);

            rl.question(
              "Sample rate (8000, 16000, 22050, 44100) [16000]: ",
              (sampleRate) => {
                sampleRate = parseInt(sampleRate || "16000", 10);

                rl.question(
                  "Are you ready to start training? (y/n): ",
                  async (confirm) => {
                    if (confirm.toLowerCase() === "y") {
                      console.log("\nStarting STT training...");

                      try {
                        // Verify that data exists
                        try {
                          const textData =
                            await ghanaianDatasetManager.listAvailableData(
                              language,
                              "text"
                            );
                          const audioData =
                            await ghanaianDatasetManager.listAvailableData(
                              language,
                              "audio"
                            );

                          if (textData.count === 0 || audioData.count === 0) {
                            console.warn(
                              "\nWarning: Limited or no data available for training."
                            );
                            console.warn(
                              `Text entries: ${textData.count}, Audio files: ${audioData.count}`
                            );

                            const answer = await new Promise((resolve) => {
                              rl.question(
                                "Continue with training anyway? (y/n): ",
                                resolve
                              );
                            });

                            if (answer.toLowerCase() !== "y") {
                              console.log("Training cancelled.");
                              rl.close();
                              return;
                            }
                          }
                        } catch (error) {
                          console.warn(
                            "Warning: Unable to verify available data:",
                            error.message
                          );
                        }

                        // Create progress indicator
                        const progressInterval = setInterval(() => {
                          process.stdout.write(".");
                        }, 1000);

                        const result = await ghanaianSTTTrainer.trainModel(
                          language,
                          {
                            modelType,
                            epochs,
                            batchSize: 16,
                            learningRate: 0.0001,
                            melSpecConfig: {
                              sampleRate,
                              melBands: 80,
                              fftSize: sampleRate === 8000 ? 256 : 512,
                              hopLength: sampleRate / 100,
                            },
                          }
                        );

                        clearInterval(progressInterval);
                        console.log("\nTraining completed!");
                        console.log(`- Model saved to: ${result.modelPath}`);
                        console.log(
                          `- Training duration: ${Math.floor(
                            result.trainingDuration / 60
                          )} minutes`
                        );

                        rl.question(
                          "\nExport the model? (y/n): ",
                          async (exportConfirm) => {
                            if (exportConfirm.toLowerCase() === "y") {
                              const exportPaths =
                                await ghanaianSTTTrainer.exportModel(
                                  result.modelPath,
                                  ["tfjs"]
                                );
                              console.log("- Exported to:", exportPaths[0]);
                            }

                            console.log("\nTraining session completed.");
                            rl.close();
                          }
                        );
                      } catch (error) {
                        console.error("Error during training:", error);
                        rl.close();
                      }
                    } else {
                      console.log("Training cancelled.");
                      rl.close();
                    }
                  }
                );
              }
            );
          });
        }
      );
    };

    promptLanguage();
  });

// Parse command line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
