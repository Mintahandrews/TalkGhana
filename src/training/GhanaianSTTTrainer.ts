import * as fs from "fs";
import * as path from "path";
// Using require for modules without type declarations
const tf = require("@tensorflow/tfjs-node");
const tfnGpu = require("@tensorflow/tfjs-node-gpu");
import {
  GhanaianLanguage,
  ghanaianDatasetManager,
} from "./GhanaianLanguageDatasetManager";

// Define interface for tf.LayersModel since we're using require instead of import
interface LayersModel {
  summary(): void;
  compile(config: any): void;
  save(path: string): Promise<any>;
  fit(x: any, y: any, config?: any): Promise<any>;
  predict(x: any): any;
}

// Use GPU if available
const tfjsBackend = process.env.TF_FORCE_CPU === "1" ? tf : tfnGpu || tf;

interface TrainingOptions {
  batchSize: number;
  epochs: number;
  learningRate: number;
  validationSplit: number;
  modelType: "quartznet" | "wav2vec" | "conformer" | "whisper";
  checkpointDir: string;
  usePretrainedEmbeddings: boolean;
  finetuneExisting?: string;
  melSpecConfig?: {
    sampleRate: number;
    fftSize: number;
    melBands: number;
    hopLength: number;
  };
  bidirectional?: boolean;
  attentionHeads?: number;
  contextWindow?: number;
}

interface TrainingResult {
  modelPath: string;
  trainingHistory: any;
  metrics: {
    loss: number;
    validationLoss: number;
    wordErrorRate: number;
    characterErrorRate: number;
  };
  trainingDuration: number;
  modelSize: number;
  language: GhanaianLanguage;
  vocabulary: string[];
}

/**
 * Trainer for Ghanaian STT models
 */
export class GhanaianSTTTrainer {
  private dataDir: string;
  private modelsDir: string;
  private logsDir: string;
  private currentModel: LayersModel | null = null;
  private vocabulary: Map<GhanaianLanguage, string[]> = new Map();

  /**
   * Create a new STT trainer
   * @param dataDir Root directory for data
   */
  constructor(dataDir = path.join(process.cwd(), "data")) {
    this.dataDir = dataDir;
    this.modelsDir = path.join(this.dataDir, "models");
    this.logsDir = path.join(this.dataDir, "training_logs");

    // Ensure directories exist
    for (const dir of [this.modelsDir, this.logsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Set TensorFlow to use GPU if available
    tfjsBackend.setBackend("tensorflow");
  }

  /**
   * Build vocabulary for the language
   * @param language Target language
   * @param minOccurrence Minimum occurrence count for a word to be included
   */
  async buildVocabulary(
    language: GhanaianLanguage,
    minOccurrence = 2
  ): Promise<string[]> {
    console.log(`Building vocabulary for ${language}...`);

    // This would require access to the text corpus
    // Let's simulate with a very simple approach
    const wordFreq: Record<string, number> = {};

    // Get available text data samples from the dataset manager
    const samples = await ghanaianDatasetManager.getSamples(language, 10); // Use a number instead of "text"

    // Count word frequencies
    for (const sample of samples) {
      const words = sample.text.toLowerCase().split(/\s+/);
      for (const word of words) {
        const cleanWord = word.replace(/[^\w\s]/g, "").trim();
        if (cleanWord) {
          wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
      }
    }

    // Filter by minimum occurrence
    const vocabulary = Object.entries(wordFreq)
      .filter(([_, count]) => count >= minOccurrence)
      .map(([word]) => word);

    // Add special tokens
    const specialTokens = ["<pad>", "<unk>", "<sos>", "<eos>"];
    const fullVocabulary = [...specialTokens, ...vocabulary.sort()];

    // Save vocabulary
    const vocabPath = path.join(this.modelsDir, language, "vocabulary.json");
    if (!fs.existsSync(path.dirname(vocabPath))) {
      fs.mkdirSync(path.dirname(vocabPath), { recursive: true });
    }

    fs.writeFileSync(vocabPath, JSON.stringify(fullVocabulary, null, 2));

    // Cache vocabulary
    this.vocabulary.set(language, fullVocabulary);

    return fullVocabulary;
  }

  /**
   * Load vocabulary for the language
   * @param language Target language
   */
  loadVocabulary(language: GhanaianLanguage): string[] {
    // Check cache first
    if (this.vocabulary.has(language)) {
      return this.vocabulary.get(language)!;
    }

    // Try to load from file
    const vocabPath = path.join(this.modelsDir, language, "vocabulary.json");
    if (fs.existsSync(vocabPath)) {
      try {
        const vocab = JSON.parse(fs.readFileSync(vocabPath, "utf8"));
        this.vocabulary.set(language, vocab);
        return vocab;
      } catch (error) {
        console.error(`Error loading vocabulary for ${language}:`, error);
      }
    }

    // Return empty vocabulary
    return [];
  }

  /**
   * Preprocess audio features for the STT model
   * @param language Target language
   * @param options Audio preprocessing options
   */
  async preprocessAudioFeatures(
    language: GhanaianLanguage,
    options: {
      sampleRate?: number;
      fftSize?: number;
      hopLength?: number;
      melBands?: number;
      normalizeAudio?: boolean;
      augmentData?: boolean;
    } = {}
  ): Promise<string> {
    console.log(`Preprocessing audio features for ${language}...`);

    // Set default options
    const sampleRate = options.sampleRate || 16000;
    const fftSize = options.fftSize || 512;
    const hopLength = options.hopLength || 160;
    const melBands = options.melBands || 80;
    const normalizeAudio = options.normalizeAudio !== false;
    const augmentData = options.augmentData || false;

    // In a real implementation, we would:
    // 1. Load audio files
    // 2. Extract mel-spectrograms
    // 3. Apply normalizations
    // 4. Save features to disk

    // Output directory for processed features
    const outputDir = path.join(this.dataDir, "audio", "features", language);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Log preprocessing configuration
    const logFile = path.join(
      this.logsDir,
      `${language}_audio_preprocessing.json`
    );
    const preprocessingLog = {
      language,
      timestamp: new Date().toISOString(),
      parameters: {
        sampleRate,
        fftSize,
        hopLength,
        melBands,
        normalizeAudio,
        augmentData,
      },
      processed: 0,
      augmented: 0,
    };

    fs.writeFileSync(logFile, JSON.stringify(preprocessingLog, null, 2));

    return outputDir;
  }

  /**
   * Create a model architecture for speech recognition
   * @param options Training options
   * @param vocabularySize Size of the vocabulary
   */
  private createModelArchitecture(
    options: TrainingOptions,
    vocabularySize: number
  ): LayersModel {
    console.log(`Creating ${options.modelType} model architecture...`);

    // Configure standard parameters
    const inputLength = 2000; // Frames
    const featureDim = options.melSpecConfig?.melBands || 80;
    const encoderDim = 512;
    const attentionHeads = options.attentionHeads || 8;
    const contextWindow = options.contextWindow || 150;

    // Input layers
    const audioInput = tfjsBackend.layers.input({
      name: "audio_input",
      shape: [inputLength, featureDim],
      dtype: "float32",
    });

    // Length input (for masking)
    const lengthInput = tfjsBackend.layers.input({
      name: "input_length",
      shape: [1],
      dtype: "int32",
    });

    // Common preprocessing
    let features = tfjsBackend.layers
      .masking({
        name: "masking",
        maskValue: 0.0,
      })
      .apply(audioInput);

    // Normalization
    features = tfjsBackend.layers
      .layerNormalization({
        name: "input_normalization",
      })
      .apply(features);

    // Apply different architectures based on the selected model type
    let encoded;

    if (options.modelType === "quartznet") {
      // QuartzNet-style architecture with 1D convolutions
      let x = features;

      // Initial convolution block
      x = tfjsBackend.layers
        .conv1d({
          filters: 256,
          kernelSize: 11,
          strides: 2,
          padding: "same",
          useBias: false,
          name: "init_conv",
        })
        .apply(x);

      x = tfjsBackend.layers
        .batchNormalization({
          name: "init_bn",
        })
        .apply(x);

      x = tfjsBackend.layers
        .relu({
          name: "init_relu",
        })
        .apply(x);

      // Main QuartzNet blocks
      const blockSizes = [3, 5, 7, 9, 11];
      const channels = [256, 256, 512, 512, 512];

      for (let b = 0; b < blockSizes.length; b++) {
        const kernelSize = blockSizes[b];
        const blockChannels = channels[b];

        for (let r = 0; r < 3; r++) {
          // Each block repeated 3 times
          const shortcut = x;

          // Depthwise separable convolution sequence
          x = tfjsBackend.layers
            .separableConv1d({
              filters: blockChannels,
              kernelSize,
              padding: "same",
              useBias: false,
              name: `block${b + 1}_conv${r + 1}`,
            })
            .apply(x);

          x = tfjsBackend.layers
            .batchNormalization({
              name: `block${b + 1}_bn${r + 1}_1`,
            })
            .apply(x);

          x = tfjsBackend.layers
            .relu({
              name: `block${b + 1}_relu${r + 1}_1`,
            })
            .apply(x);

          x = tfjsBackend.layers
            .conv1d({
              filters: blockChannels,
              kernelSize: 1,
              padding: "same",
              useBias: false,
              name: `block${b + 1}_pointwise${r + 1}`,
            })
            .apply(x);

          x = tfjsBackend.layers
            .batchNormalization({
              name: `block${b + 1}_bn${r + 1}_2`,
            })
            .apply(x);

          // Residual connection
          if (r === 0 && blockChannels !== channels[b > 0 ? b - 1 : 0]) {
            // Match dimensions for residual if needed
            let shortcutVar = tfjsBackend.layers
              .conv1d({
                filters: blockChannels,
                kernelSize: 1,
                padding: "same",
                name: `block${b + 1}_res_match`,
              })
              .apply(shortcut);
          }

          x = tfjsBackend.layers
            .add({
              name: `block${b + 1}_add${r + 1}`,
            })
            .apply([x, shortcut]);

          x = tfjsBackend.layers
            .relu({
              name: `block${b + 1}_relu${r + 1}_2`,
            })
            .apply(x);
        }
      }

      encoded = x;
    } else if (
      options.modelType === "conformer" ||
      options.modelType === "wav2vec"
    ) {
      // Conformer/Wav2vec style with self-attention
      let x = features;

      // Subsampling via convolution (reduces sequence length)
      x = tfjsBackend.layers
        .conv1d({
          filters: 512,
          kernelSize: 3,
          strides: 2,
          padding: "same",
          name: "subsample_conv1",
        })
        .apply(x);

      x = tfjsBackend.layers.relu({}).apply(x);

      x = tfjsBackend.layers
        .conv1d({
          filters: 512,
          kernelSize: 3,
          strides: 2,
          padding: "same",
          name: "subsample_conv2",
        })
        .apply(x);

      x = tfjsBackend.layers.relu({}).apply(x);

      // Positional encoding
      // In real implementation, would add sinusoidal positional encoding here

      // Conformer/Transformer blocks
      for (let i = 0; i < 12; i++) {
        const shortcut = x;

        // Feed-forward module 1
        let ffn1 = tfjsBackend.layers
          .layerNormalization({
            name: `block${i + 1}_ffn1_norm`,
          })
          .apply(x);

        ffn1 = tfjsBackend.layers
          .dense({
            units: 1024,
            activation: "relu",
            name: `block${i + 1}_ffn1_dense1`,
          })
          .apply(ffn1);

        ffn1 = tfjsBackend.layers
          .dense({
            units: 512,
            name: `block${i + 1}_ffn1_dense2`,
          })
          .apply(ffn1);

        ffn1 = tfjsBackend.layers
          .dropout({
            rate: 0.1,
            name: `block${i + 1}_ffn1_dropout`,
          })
          .apply(ffn1);

        x = tfjsBackend.layers
          .add({
            name: `block${i + 1}_ffn1_residual`,
          })
          .apply([x, ffn1]);

        // Multi-head self-attention module
        let att = tfjsBackend.layers
          .layerNormalization({
            name: `block${i + 1}_mhsa_norm`,
          })
          .apply(x);

        // Note: In a real implementation, would use a proper multi-head attention layer
        // This is a simplified approximation
        att = tfjsBackend.layers
          .dense({
            units: 512 * 3, // Q, K, V projections concatenated
            name: `block${i + 1}_mhsa_qkv`,
          })
          .apply(att);

        // Simplified attention mechanism
        att = tfjsBackend.layers
          .dense({
            units: 512,
            name: `block${i + 1}_mhsa_output`,
          })
          .apply(att);

        att = tfjsBackend.layers
          .dropout({
            rate: 0.1,
            name: `block${i + 1}_mhsa_dropout`,
          })
          .apply(att);

        x = tfjsBackend.layers
          .add({
            name: `block${i + 1}_mhsa_residual`,
          })
          .apply([x, att]);

        // Convolution module (only in Conformer)
        if (options.modelType === "conformer") {
          let conv = tfjsBackend.layers
            .layerNormalization({
              name: `block${i + 1}_conv_norm`,
            })
            .apply(x);

          conv = tfjsBackend.layers
            .conv1d({
              filters: 512,
              kernelSize: 3,
              padding: "same",
              name: `block${i + 1}_conv1`,
            })
            .apply(conv);

          conv = tfjsBackend.layers
            .gelu({
              name: `block${i + 1}_gelu`,
            })
            .apply(conv);

          conv = tfjsBackend.layers
            .dropout({
              rate: 0.1,
              name: `block${i + 1}_conv_dropout`,
            })
            .apply(conv);

          x = tfjsBackend.layers
            .add({
              name: `block${i + 1}_conv_residual`,
            })
            .apply([x, conv]);
        }

        // Feed-forward module 2
        let ffn2 = tfjsBackend.layers
          .layerNormalization({
            name: `block${i + 1}_ffn2_norm`,
          })
          .apply(x);

        ffn2 = tfjsBackend.layers
          .dense({
            units: 1024,
            activation: "relu",
            name: `block${i + 1}_ffn2_dense1`,
          })
          .apply(ffn2);

        ffn2 = tfjsBackend.layers
          .dense({
            units: 512,
            name: `block${i + 1}_ffn2_dense2`,
          })
          .apply(ffn2);

        ffn2 = tfjsBackend.layers
          .dropout({
            rate: 0.1,
            name: `block${i + 1}_ffn2_dropout`,
          })
          .apply(ffn2);

        x = tfjsBackend.layers
          .add({
            name: `block${i + 1}_ffn2_residual`,
          })
          .apply([x, ffn2]);

        // Final layer norm
        x = tfjsBackend.layers
          .layerNormalization({
            name: `block${i + 1}_final_norm`,
          })
          .apply(x);
      }

      encoded = x;
    } else {
      // Default to a simplified "whisper" style encoder-decoder
      // Encoder
      let encoder = features;

      // Conv layers for feature extraction
      encoder = tfjsBackend.layers
        .conv1d({
          filters: 384,
          kernelSize: 3,
          strides: 1,
          padding: "same",
          name: "encoder_conv1",
        })
        .apply(encoder);

      encoder = tfjsBackend.layers
        .layerNormalization({
          name: "encoder_norm1",
        })
        .apply(encoder);

      encoder = tfjsBackend.layers
        .gelu({
          name: "encoder_gelu1",
        })
        .apply(encoder);

      // Transformer encoder blocks
      for (let i = 0; i < 6; i++) {
        // Self-attention
        const attnNorm = tfjsBackend.layers
          .layerNormalization({
            name: `encoder_block${i + 1}_attn_norm`,
          })
          .apply(encoder);

        // Simplified multi-head attention
        const attn = tfjsBackend.layers
          .dense({
            units: 384,
            name: `encoder_block${i + 1}_attn_proj`,
          })
          .apply(attnNorm);

        // Add residual
        encoder = tfjsBackend.layers
          .add({
            name: `encoder_block${i + 1}_attn_add`,
          })
          .apply([encoder, attn]);

        // FFN
        const ffnNorm = tfjsBackend.layers
          .layerNormalization({
            name: `encoder_block${i + 1}_ffn_norm`,
          })
          .apply(encoder);

        const ffn1 = tfjsBackend.layers
          .dense({
            units: 1536,
            activation: "relu",
            name: `encoder_block${i + 1}_ffn1`,
          })
          .apply(ffnNorm);

        const ffn2 = tfjsBackend.layers
          .dense({
            units: 384,
            name: `encoder_block${i + 1}_ffn2`,
          })
          .apply(ffn1);

        // Add residual
        encoder = tfjsBackend.layers
          .add({
            name: `encoder_block${i + 1}_ffn_add`,
          })
          .apply([encoder, ffn2]);
      }

      // Final normalization
      encoder = tfjsBackend.layers
        .layerNormalization({
          name: "encoder_final_norm",
        })
        .apply(encoder);

      encoded = encoder;
    }

    // Output projection to vocabulary
    const output = tfjsBackend.layers
      .dense({
        units: vocabularySize,
        activation: "softmax",
        name: "output_projection",
      })
      .apply(encoded);

    // Create model
    const model = tfjsBackend.model({
      inputs: [audioInput, lengthInput],
      outputs: output,
      name: `ghanaian_${options.modelType.toLowerCase()}`,
    });

    // Compile model with CTC loss
    // Note: In a real implementation, would use proper CTC loss
    model.compile({
      optimizer: tfjsBackend.train.adam(options.learningRate),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  /**
   * Train a speech recognition model for the specified language
   * @param language Target language
   * @param options Training options
   */
  async trainModel(
    language: GhanaianLanguage,
    options: Partial<TrainingOptions> = {}
  ): Promise<TrainingResult> {
    console.log(`Training STT model for ${language}...`);

    const startTime = Date.now();

    // Set default options
    const defaultOptions: TrainingOptions = {
      batchSize: 16,
      epochs: 100,
      learningRate: 0.0001,
      validationSplit: 0.1,
      modelType: "conformer",
      checkpointDir: path.join(this.modelsDir, language),
      usePretrainedEmbeddings: false,
      bidirectional: true,
      attentionHeads: 8,
      contextWindow: 200,
      melSpecConfig: {
        sampleRate: 16000,
        fftSize: 512,
        melBands: 80,
        hopLength: 160,
      },
    };

    const trainingOptions: TrainingOptions = { ...defaultOptions, ...options };

    // Ensure checkpoint directory exists
    if (!fs.existsSync(trainingOptions.checkpointDir)) {
      fs.mkdirSync(trainingOptions.checkpointDir, { recursive: true });
    }

    // Build or load vocabulary
    let vocabulary = this.loadVocabulary(language);
    if (vocabulary.length === 0) {
      vocabulary = await this.buildVocabulary(language);
    }

    // Preprocess audio features
    await this.preprocessAudioFeatures(language, trainingOptions.melSpecConfig);

    // Create or load model
    if (
      trainingOptions.finetuneExisting &&
      fs.existsSync(trainingOptions.finetuneExisting)
    ) {
      console.log(
        `Loading existing model from ${trainingOptions.finetuneExisting}...`
      );
      this.currentModel = await tfjsBackend.loadLayersModel(
        `file://${trainingOptions.finetuneExisting}`
      );
    } else {
      this.currentModel = this.createModelArchitecture(
        trainingOptions,
        vocabulary.length
      );
    }

    // Log model summary
    if (this.currentModel) {
      this.currentModel.summary();
    }

    // In a real implementation, we would load actual training data here
    // Since we can't do that, we'll simulate the training process

    // Simulate training history
    const history = {
      loss: Array.from({ length: 10 }, (_, i) => 5.0 - i * 0.5),
      val_loss: Array.from({ length: 10 }, (_, i) => 5.5 - i * 0.5),
      accuracy: Array.from({ length: 10 }, (_, i) => 0.1 + i * 0.1),
      val_accuracy: Array.from({ length: 10 }, (_, i) => 0.05 + i * 0.1),
    };

    // Save model
    const modelPath = path.join(
      trainingOptions.checkpointDir,
      `${language}_${trainingOptions.modelType}_${Date.now()}`
    );

    if (this.currentModel) {
      await this.currentModel.save(`file://${modelPath}`);
    }

    // Save training configuration and history
    const configPath = `${modelPath}_config.json`;
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          language,
          options: trainingOptions,
          history,
          timestamp: new Date().toISOString(),
          trainingDuration: (Date.now() - startTime) / 1000, // in seconds
          vocabularySize: vocabulary.length,
        },
        null,
        2
      )
    );

    // Return results
    return {
      modelPath,
      trainingHistory: history,
      metrics: {
        loss: history.loss[history.loss.length - 1],
        validationLoss: history.val_loss[history.val_loss.length - 1],
        wordErrorRate: 0.25, // Simulated WER
        characterErrorRate: 0.1, // Simulated CER
      },
      trainingDuration: (Date.now() - startTime) / 1000,
      modelSize: 8 * 1024 * 1024, // Simulated model size (8MB)
      language,
      vocabulary,
    };
  }

  /**
   * Export the trained model to various formats
   * @param modelPath Path to the trained model
   * @param formats Export formats
   */
  async exportModel(
    modelPath: string,
    formats: ("tfjs" | "tflite" | "tensorflowjs")[] = ["tfjs"]
  ): Promise<string[]> {
    console.log(`Exporting model from ${modelPath}...`);

    const outputPaths: string[] = [];

    for (const format of formats) {
      const outputPath = `${modelPath}_${format}`;

      if (format === "tfjs") {
        // TensorFlow.js format (already saved)
        outputPaths.push(modelPath);
      } else if (format === "tensorflowjs") {
        // Web-optimized TensorFlow.js
        outputPaths.push(`${outputPath}_web`);
      } else if (format === "tflite") {
        // Simulated TFLite conversion
        outputPaths.push(`${outputPath}.tflite`);
      }

      console.log(`Exported model to ${outputPath}`);
    }

    return outputPaths;
  }

  /**
   * Evaluate a trained model
   * @param modelPath Path to the trained model
   * @param language Target language
   */
  async evaluateModel(
    modelPath: string,
    language: GhanaianLanguage
  ): Promise<any> {
    console.log(`Evaluating model ${modelPath} for ${language}...`);

    // In a real implementation, we would load test data and evaluate the model
    // Since we can't do that, we'll return simulated metrics

    return {
      wordErrorRate: 0.25,
      characterErrorRate: 0.1,
      accuracy: 0.82,
      lossValue: 1.5,
      realTimeRatio: 0.8,
      metadata: {
        noiseRobustness: 0.75,
        accentRobustness: 0.7,
        dialectVariation: 0.65,
      },
    };
  }

  /**
   * Transcribe an audio file
   * @param audioPath Path to the audio file
   * @param language Target language
   * @param modelPath Path to the model (optional)
   */
  async transcribeAudio(
    audioPath: string,
    language: GhanaianLanguage,
    modelPath?: string
  ): Promise<string> {
    console.log(`Transcribing audio file ${audioPath} in ${language}...`);

    // Load model if specified
    if (modelPath && fs.existsSync(modelPath)) {
      this.currentModel = await tfjsBackend.loadLayersModel(
        `file://${modelPath}`
      );
    }

    if (!this.currentModel) {
      throw new Error("No model loaded. Train or load a model first.");
    }

    // In a real implementation, we would:
    // 1. Load the audio file
    // 2. Extract features
    // 3. Run inference
    // 4. Decode the output to text

    // For this simulation, we'll just return a mock transcription
    return "This is a simulated transcription of Ghanaian speech.";
  }

  /**
   * Get information about available models
   * @param language Optional filter by language
   */
  listAvailableModels(language?: GhanaianLanguage): any[] {
    const models: any[] = [];

    // Check if models directory exists
    if (!fs.existsSync(this.modelsDir)) {
      return [];
    }

    // Get language directories
    const languageDirs = language
      ? [path.join(this.modelsDir, language)]
      : fs
          .readdirSync(this.modelsDir)
          .map((dir) => path.join(this.modelsDir, dir))
          .filter((dir) => fs.statSync(dir).isDirectory());

    // Find model files in each directory
    for (const dir of languageDirs) {
      if (!fs.existsSync(dir)) continue;

      const configFiles = fs
        .readdirSync(dir)
        .filter(
          (file) => file.endsWith("_config.json") && file.includes("_stt_")
        );

      for (const configFile of configFiles) {
        try {
          const configPath = path.join(dir, configFile);
          const modelConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

          models.push({
            language: modelConfig.language,
            modelType: modelConfig.options.modelType,
            path: configFile.replace("_config.json", ""),
            timestamp: modelConfig.timestamp,
            metrics: modelConfig.metrics || {},
          });
        } catch (error) {
          console.error(`Error loading model config ${configFile}:`, error);
        }
      }
    }

    return models.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

// Expose a singleton instance
export const ghanaianSTTTrainer = new GhanaianSTTTrainer();
export default ghanaianSTTTrainer;
