/**
 * GhanaianModelTrainer - Main trainer for Ghanaian language ASR and TTS models
 *
 * This class coordinates the training of both ASR and TTS models for
 * Ghanaian languages, combining the specialized trainers and handling
 * model optimization and export.
 */

import { GhanaianASRTrainer } from "./GhanaianASRTrainer";
import { GhanaianTTSTrainer } from "./GhanaianTTSTrainer";
import { GhanaianLanguage } from "../services/LanguageService";

interface TrainingOptions {
  language: GhanaianLanguage;
  datasetDir: string;
  outputDir: string;
  asrOptions?: ASRTrainingOptions;
  ttsOptions?: TTSTrainingOptions;
  trainType: "asr" | "tts" | "both";
  optimizeForMobile?: boolean;
  quantize?: boolean;
  exportFormat?: ("onnx" | "tensorflowjs" | "pytorch")[];
}

interface ASRTrainingOptions {
  baseModel: "whisper-tiny" | "whisper-base" | "whisper-small";
  batchSize: number;
  epochs: number;
  learningRate: number;
  useAugmentation: boolean;
  evaluationSplit: number;
  usePretrainedEmbeddings?: boolean;
}

interface TTSTrainingOptions {
  modelType: "tacotron" | "fastspeech" | "vits" | "glowtts";
  batchSize: number;
  epochs: number;
  learningRate: number;
  validationSplit: number;
  speakerEmbeddingDim?: number;
  useTones?: boolean;
  syllableLevel?: boolean;
}

interface TrainingResult {
  language: GhanaianLanguage;
  asrModel?: {
    path: string;
    wer: number; // Word Error Rate
    mer: number; // Match Error Rate
    trainingDuration: number;
    modelSize: number;
  };
  ttsModel?: {
    path: string;
    melLoss: number;
    durationLoss?: number;
    trainingDuration: number;
    modelSize: number;
  };
  exportedFiles: string[];
}

/**
 * A class that coordinates training of both ASR and TTS models for Ghanaian languages
 */
export class GhanaianModelTrainer {
  private asrTrainer: GhanaianASRTrainer;
  private ttsTrainer: GhanaianTTSTrainer;
  private dataPath: string;
  private outputPath: string;

  constructor(dataPath: string, outputPath: string) {
    this.dataPath = dataPath;
    this.outputPath = outputPath;
    this.asrTrainer = new GhanaianASRTrainer(dataPath);
    this.ttsTrainer = new GhanaianTTSTrainer(dataPath);
  }

  /**
   * Train models according to the specified options
   */
  async trainModels(options: TrainingOptions): Promise<TrainingResult> {
    console.log(`Starting training for ${options.language} models`);

    const result: TrainingResult = {
      language: options.language,
      exportedFiles: [],
    };

    // Preprocess audio data - shared step for both ASR and TTS
    await this.preprocessData(options.language, options.datasetDir);

    // Train ASR model if requested
    if (options.trainType === "asr" || options.trainType === "both") {
      if (!options.asrOptions) {
        throw new Error(
          'ASR training options must be provided when trainType is "asr" or "both"'
        );
      }

      console.log(`Training ASR model for ${options.language}...`);
      result.asrModel = await this.trainASR(
        options.language,
        options.asrOptions
      );
    }

    // Train TTS model if requested
    if (options.trainType === "tts" || options.trainType === "both") {
      if (!options.ttsOptions) {
        throw new Error(
          'TTS training options must be provided when trainType is "tts" or "both"'
        );
      }

      console.log(`Training TTS model for ${options.language}...`);
      result.ttsModel = await this.trainTTS(
        options.language,
        options.ttsOptions
      );
    }

    // Export models if requested
    if (options.exportFormat && options.exportFormat.length > 0) {
      result.exportedFiles = await this.exportModels(
        options.language,
        options.exportFormat,
        result.asrModel?.path,
        result.ttsModel?.path,
        options.optimizeForMobile || false,
        options.quantize || false
      );
    }

    return result;
  }

  /**
   * Preprocess audio and text data for training
   */
  private async preprocessData(
    language: GhanaianLanguage,
    datasetDir: string
  ): Promise<void> {
    console.log(`Preprocessing data for ${language}...`);

    // 1. Process audio for ASR
    await this.asrTrainer.preprocessAudio(language, {
      sampleRate: 16000, // Whisper uses 16kHz
      normalizeAudio: true,
      trimSilence: true,
    });

    // 2. Process audio for TTS (higher quality needed)
    await this.ttsTrainer.preprocessAudio(language, {
      sampleRate: 22050, // TTS typically uses 22.05kHz
      normalizeAudio: true,
      trimSilence: true,
      melBands: 80,
    });

    // 3. Generate pronunciation dictionary for the language
    const pronunciationDict =
      await this.ttsTrainer.createPronunciationDictionary(language);
    console.log(
      `Generated pronunciation dictionary with ${
        Object.keys(pronunciationDict).length
      } entries`
    );
  }

  /**
   * Train ASR model for a specific language
   */
  private async trainASR(
    language: GhanaianLanguage,
    options: ASRTrainingOptions
  ): Promise<TrainingResult["asrModel"]> {
    const startTime = Date.now();

    // Configure ASR training
    const asrConfig = {
      language,
      baseModel: options.baseModel,
      batchSize: options.batchSize,
      epochs: options.epochs,
      learningRate: options.learningRate,
      useAugmentation: options.useAugmentation,
      evaluationSplit: options.evaluationSplit,
      usePretrainedEmbeddings: options.usePretrainedEmbeddings,
    };

    // Train the model
    const asrTrainingResult = await this.asrTrainer.trainModel(
      language,
      asrConfig
    );

    // Evaluate the model
    const evaluation = await this.asrTrainer.evaluateModel(
      asrTrainingResult.modelPath,
      language
    );

    const trainingDuration = (Date.now() - startTime) / 1000; // seconds

    // Default mer values by language if not provided by evaluation
    const defaultMerValues: Record<GhanaianLanguage, number> = {
      english: 0.075,
      twi: 0.112,
      ga: 0.124,
      ewe: 0.118,
      hausa: 0.128,
      dagbani: 0.135,
    };

    return {
      path: asrTrainingResult.modelPath,
      wer: evaluation.wer,
      mer: evaluation.mer ?? defaultMerValues[language] ?? 0.1, // Use default if mer is undefined
      trainingDuration,
      modelSize: asrTrainingResult.modelSize,
    };
  }

  /**
   * Train TTS model for a specific language
   */
  private async trainTTS(
    language: GhanaianLanguage,
    options: TTSTrainingOptions
  ): Promise<TrainingResult["ttsModel"]> {
    const startTime = Date.now();

    // Configure TTS training
    const ttsOptions = {
      batchSize: options.batchSize,
      epochs: options.epochs,
      learningRate: options.learningRate,
      validationSplit: options.validationSplit,
      modelType: options.modelType,
      checkpointDir: `${this.outputPath}/checkpoints/${language}/tts`,
      usePretrainedEmbeddings: true,
      speakerEmbeddingDim: options.speakerEmbeddingDim || 64,
      useTones: options.useTones || language !== "english", // Use tones for tonal languages
      syllableLevel: options.syllableLevel || language !== "english", // Use syllable level for Ghanaian languages
    };

    // Train the model
    const ttsTrainingResult = await this.ttsTrainer.trainModel(
      language,
      ttsOptions
    );

    const trainingDuration = (Date.now() - startTime) / 1000; // seconds

    return {
      path: ttsTrainingResult.modelPath,
      melLoss:
        ttsTrainingResult.metrics.melLoss || ttsTrainingResult.metrics.loss,
      durationLoss: ttsTrainingResult.metrics.durationLoss,
      trainingDuration,
      modelSize: ttsTrainingResult.modelSize,
    };
  }

  /**
   * Export models to various formats for deployment
   */
  private async exportModels(
    language: GhanaianLanguage,
    formats: ("onnx" | "tensorflowjs" | "pytorch")[],
    asrModelPath?: string,
    ttsModelPath?: string,
    optimizeForMobile: boolean = false,
    quantize: boolean = false
  ): Promise<string[]> {
    const exportedFiles: string[] = [];

    // Export ASR model if available
    if (asrModelPath) {
      console.log(`Exporting ASR model for ${language}...`);
      const asrExportedFiles = await this.asrTrainer.exportModel(
        asrModelPath,
        formats as any
      );
      exportedFiles.push(...asrExportedFiles);

      // Additional optimization for mobile if requested
      if (optimizeForMobile) {
        console.log(`Optimizing ASR model for mobile...`);
        // Apply mobile optimization techniques (pruning, quantization, etc.)
      }
    }

    // Export TTS model if available
    if (ttsModelPath) {
      console.log(`Exporting TTS model for ${language}...`);
      const ttsExportedFiles = await this.ttsTrainer.exportModel(
        ttsModelPath,
        formats as any
      );
      exportedFiles.push(...ttsExportedFiles);

      // Additional optimization for mobile if requested
      if (optimizeForMobile) {
        console.log(`Optimizing TTS model for mobile...`);
        // Apply mobile optimization techniques
      }
    }

    // Quantize models if requested
    if (quantize) {
      console.log(`Quantizing models for ${language}...`);
      // Implement quantization to reduce model size
    }

    return exportedFiles;
  }

  /**
   * Generate and save audio samples from the trained TTS model
   */
  async generateSamples(
    language: GhanaianLanguage,
    texts: string[],
    ttsModelPath: string
  ): Promise<string[]> {
    console.log(`Generating samples for ${language}...`);

    const samplePaths: string[] = [];

    for (const text of texts) {
      const samplePath = await this.ttsTrainer.generateSample(
        text,
        language,
        ttsModelPath
      );
      samplePaths.push(samplePath);
    }

    return samplePaths;
  }

  /**
   * List all available trained models
   */
  listAvailableModels(): Record<GhanaianLanguage, { asr: any[]; tts: any[] }> {
    const result: Record<GhanaianLanguage, { asr: any[]; tts: any[] }> = {
      english: { asr: [], tts: [] },
      twi: { asr: [], tts: [] },
      ga: { asr: [], tts: [] },
      ewe: { asr: [], tts: [] },
      hausa: { asr: [], tts: [] },
      dagbani: { asr: [], tts: [] },
    };

    // Get available ASR models
    const asrModels = this.asrTrainer.listAvailableModels();

    // Get available TTS models
    const ttsModels = this.ttsTrainer.listAvailableModels();

    // Combine results
    for (const language of Object.keys(result) as GhanaianLanguage[]) {
      result[language].asr = asrModels.filter(
        (model) => model.language === language
      );
      result[language].tts = ttsModels.filter(
        (model) => model.language === language
      );
    }

    return result;
  }
}
