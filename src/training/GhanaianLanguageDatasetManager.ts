import * as fs from "fs";
import * as path from "path";
import * as csv from "csv-parser";
import ISO6391 from "iso-639-1";
import natural from "natural";
import compromise from "compromise";
import syllables from "compromise-syllables";

// Add syllable plugin to compromise
compromise.extend(syllables);

// Define supported Ghanaian languages
export type GhanaianLanguage = "twi" | "ga" | "ewe" | "hausa" | "english";

// Map Ghanaian languages to ISO codes (approximations where direct codes don't exist)
const languageISOMap: Record<GhanaianLanguage, string> = {
  twi: "ak", // Akan
  ga: "gaa",
  ewe: "ee",
  hausa: "ha",
  english: "en",
};

// Data entry interface
interface DataEntry {
  id: string;
  text: string;
  textClean?: string;
  translation?: string;
  language: GhanaianLanguage;
  audioPath?: string;
  metadata?: Record<string, any>;
  source?: string;
}

/**
 * Manager for Ghanaian language datasets
 */
export class GhanaianLanguageDatasetManager {
  private dataDir: string;
  private tokenizerCache: Record<GhanaianLanguage, any> = {} as any;

  /**
   * Create a new dataset manager
   * @param dataDir Root directory for data storage
   */
  constructor(dataDir = path.join(process.cwd(), "data")) {
    this.dataDir = dataDir;
    this.ensureDirectoriesExist();
  }

  /**
   * Ensure all required directories exist
   */
  private ensureDirectoriesExist() {
    const dirs = [
      "audio/raw",
      "audio/processed",
      "text/raw",
      "text/processed",
      "models",
      "training_logs",
    ];

    for (const language of ["twi", "ga", "ewe", "hausa", "english"]) {
      dirs.push(`audio/raw/${language}`);
      dirs.push(`audio/processed/${language}`);
      dirs.push(`text/raw/${language}`);
      dirs.push(`text/processed/${language}`);
      dirs.push(`models/${language}`);
    }

    for (const dir of dirs) {
      const dirPath = path.join(this.dataDir, dir);
      try {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`Created directory: ${dirPath}`);
        }
      } catch (error: any) {
        console.error(`Error creating directory ${dirPath}:`, error);
        throw new Error(
          `Failed to create directory ${dirPath}: ${error.message}`
        );
      }
    }
  }

  /**
   * Import text data from CSV file
   * @param filePath Path to the CSV file
   * @param language Target language
   * @param options Import options
   */
  async importTextFromCSV(
    filePath: string,
    language: GhanaianLanguage,
    options: {
      textColumn: string;
      translationColumn?: string;
      idColumn?: string;
      delimiter?: string;
      skipLines?: number;
    }
  ): Promise<DataEntry[]> {
    const entries: DataEntry[] = [];

    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        reject(new Error(`File not found: ${filePath}`));
        return;
      }

      let count = 0;
      fs.createReadStream(filePath)
        .on("error", (error) => {
          reject(new Error(`Error reading file ${filePath}: ${error.message}`));
        })
        .pipe(
          csv({
            separator: options.delimiter || ",",
            skipLines: options.skipLines || 0,
          })
        )
        .on("data", (data) => {
          count++;
          // Create a unique ID if none provided
          const id =
            options.idColumn && data[options.idColumn]
              ? data[options.idColumn]
              : `${language}-${Date.now()}-${count}`;

          // Ensure text column exists
          if (!data[options.textColumn]) {
            console.warn(
              `Row ${count} is missing text column "${options.textColumn}", skipping.`
            );
            return;
          }

          const entry: DataEntry = {
            id,
            text: data[options.textColumn],
            language,
            source: path.basename(filePath),
          };

          if (options.translationColumn && data[options.translationColumn]) {
            entry.translation = data[options.translationColumn];
          }

          entries.push(entry);
        })
        .on("end", () => {
          try {
            this.saveTextData(entries, language);
            resolve(entries);
          } catch (error: any) {
            reject(new Error(`Error saving text data: ${error.message}`));
          }
        })
        .on("error", (error) => {
          reject(new Error(`Error parsing CSV file: ${error.message}`));
        });
    });
  }

  /**
   * Clean and preprocess text for the given language
   * @param text Input text
   * @param language Target language
   */
  cleanText(text: string, language: GhanaianLanguage): string {
    if (!text) return "";

    // Basic cleaning for all languages
    let cleaned = text
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\p{L}\p{N}\p{P}\s]/gu, "") // Keep only letters, numbers, punctuation and spaces
      .trim();

    // Language-specific cleaning
    switch (language) {
      case "twi":
        // Handle Twi-specific characters and patterns
        cleaned = cleaned
          .replace(/ɛ/g, "ε") // Normalize open e
          .replace(/ɔ/g, "ɔ"); // Normalize open o
        break;

      case "ga":
        // Handle Ga-specific characters
        cleaned = cleaned.replace(/ɛ/g, "ε").replace(/ɔ/g, "ɔ");
        break;

      case "ewe":
        // Handle Ewe-specific characters
        cleaned = cleaned
          .replace(/ɖ/g, "d")
          .replace(/ƒ/g, "f")
          .replace(/ɣ/g, "h");
        break;

      case "hausa":
        // Handle Hausa-specific characters
        cleaned = cleaned
          .replace(/ɓ/g, "b'")
          .replace(/ɗ/g, "d'")
          .replace(/ƙ/g, "k'");
        break;

      case "english":
        // Standard English cleaning
        cleaned = cleaned.toLowerCase();
        break;
    }

    return cleaned;
  }

  /**
   * Get or create a tokenizer for the specified language
   * @param language Target language
   */
  getTokenizer(language: GhanaianLanguage) {
    if (this.tokenizerCache[language]) {
      return this.tokenizerCache[language];
    }

    let tokenizer;

    if (language === "english") {
      // For English, use an existing tokenizer
      tokenizer = new natural.WordTokenizer();
    } else {
      // For Ghanaian languages, create a custom tokenizer
      // This is a simple implementation; for production, you'd want more sophisticated rules
      tokenizer = {
        tokenize: (text: string) => {
          // Split on whitespace and punctuation
          return text
            .split(/[\s,.!?;:()\[\]{}'"\/\\<>@#$%^&*_+=|-]+/)
            .filter((t) => t.length > 0);
        },
      };
    }

    this.tokenizerCache[language] = tokenizer;
    return tokenizer;
  }

  /**
   * Tokenize text in the specified language
   * @param text Input text
   * @param language Target language
   */
  tokenize(text: string, language: GhanaianLanguage): string[] {
    const tokenizer = this.getTokenizer(language);
    return tokenizer.tokenize(text);
  }

  /**
   * Split text into syllables (approximate for Ghanaian languages)
   * @param text Input text
   * @param language Target language
   */
  syllabify(text: string, language: GhanaianLanguage): string[] {
    if (language === "english") {
      // Use compromise for English
      const doc = compromise(text);
      // @ts-ignore - syllables plugin adds this method
      return doc.syllables().json()[0]?.syllables || [];
    }

    // For Ghanaian languages, use simplified syllabification rules
    // These are very basic approximations - a real system would need language-specific rules
    const vowels = "aeiouɛɔəɪʊ";
    const syllables: string[] = [];
    let currentSyllable = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      currentSyllable += char;

      if (vowels.includes(char.toLowerCase())) {
        // If we have a vowel and the next character is a consonant or end of word
        if (
          i === text.length - 1 ||
          !vowels.includes(text[i + 1].toLowerCase())
        ) {
          syllables.push(currentSyllable);
          currentSyllable = "";
        }
      }
    }

    // Add any remaining text
    if (currentSyllable.length > 0) {
      syllables.push(currentSyllable);
    }

    return syllables;
  }

  /**
   * Save text data to storage
   * @param entries Data entries to save
   * @param language Target language
   */
  saveTextData(entries: DataEntry[], language: GhanaianLanguage): void {
    if (entries.length === 0) {
      console.warn(`No entries to save for language ${language}`);
      return;
    }

    // Ensure directories exist
    const rawDir = path.join(this.dataDir, "text", "raw", language);
    const processedDir = path.join(this.dataDir, "text", "processed", language);

    try {
      if (!fs.existsSync(rawDir)) {
        fs.mkdirSync(rawDir, { recursive: true });
      }
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }

      // Clean the text for each entry
      for (const entry of entries) {
        entry.textClean = this.cleanText(entry.text, language);
      }

      // Save to raw data directory
      const timestamp = Date.now();
      const rawFilePath = path.join(rawDir, `data_${timestamp}.json`);

      fs.writeFileSync(rawFilePath, JSON.stringify(entries, null, 2));

      // Also save cleaned version to processed directory
      const processedFilePath = path.join(
        processedDir,
        `data_${timestamp}.json`
      );

      fs.writeFileSync(processedFilePath, JSON.stringify(entries, null, 2));

      console.log(`Saved ${entries.length} entries for ${language}`);
    } catch (error: any) {
      console.error(`Error saving text data for ${language}:`, error);
      throw new Error(`Failed to save text data: ${error.message}`);
    }
  }

  /**
   * Import audio files
   * @param audioDir Directory containing audio files
   * @param metadataFile Optional CSV file with metadata
   * @param language Target language
   */
  async importAudioFiles(
    audioDir: string,
    metadataFile: string | null,
    language: GhanaianLanguage
  ): Promise<void> {
    if (!fs.existsSync(audioDir)) {
      throw new Error(`Audio directory not found: ${audioDir}`);
    }

    // Get metadata if available
    const metadata: Record<string, any> = {};

    if (metadataFile && fs.existsSync(metadataFile)) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(metadataFile)
          .on("error", (error) => {
            reject(new Error(`Error reading metadata file: ${error.message}`));
          })
          .pipe(csv())
          .on("data", (data) => {
            // Assuming the CSV has a filename column and other metadata
            if (data.filename) {
              metadata[data.filename] = data;
            }
          })
          .on("end", resolve)
          .on("error", (error) => {
            reject(new Error(`Error parsing metadata file: ${error.message}`));
          });
      });
    }

    // Ensure target directories exist
    const targetDir = path.join(this.dataDir, "audio", "raw", language);
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    } catch (error: any) {
      throw new Error(
        `Failed to create directory ${targetDir}: ${error.message}`
      );
    }

    // Process all audio files in the directory
    try {
      const files = fs
        .readdirSync(audioDir)
        .filter((file) => file.endsWith(".mp3") || file.endsWith(".wav"));

      if (files.length === 0) {
        console.warn(`No audio files found in ${audioDir}`);
        return;
      }

      for (const file of files) {
        const sourcePath = path.join(audioDir, file);
        const targetPath = path.join(targetDir, file);

        // Copy file to raw directory
        fs.copyFileSync(sourcePath, targetPath);

        // Create an entry with metadata
        const entry: DataEntry = {
          id: path.basename(file, path.extname(file)),
          text: metadata[file]?.text || "",
          language,
          audioPath: targetPath,
          metadata: metadata[file] || {},
        };

        // Save to a metadata file
        const metaFilePath = path.join(
          targetDir,
          `${path.basename(file, path.extname(file))}.json`
        );

        fs.writeFileSync(metaFilePath, JSON.stringify(entry, null, 2));
      }

      console.log(`Imported ${files.length} audio files for ${language}`);
    } catch (error: any) {
      console.error(`Error importing audio files:`, error);
      throw new Error(`Failed to import audio files: ${error.message}`);
    }
  }

  /**
   * List all available data for a language
   * @param language Target language
   * @param type Data type (text or audio)
   */
  listAvailableData(
    language: GhanaianLanguage,
    type: "text" | "audio" = "text"
  ): string[] {
    const baseDir = path.join(this.dataDir, type, "processed", language);

    if (!fs.existsSync(baseDir)) {
      return [];
    }

    return fs.readdirSync(baseDir).filter((file) => file.endsWith(".json"));
  }

  /**
   * Get samples for a language
   * @param language Target language
   * @param maxSamples Maximum number of samples to return
   */
  getSamples(language: GhanaianLanguage, maxSamples = 10): DataEntry[] {
    const samples: DataEntry[] = [];
    const textFiles = this.listAvailableData(language, "text");

    for (const file of textFiles) {
      if (samples.length >= maxSamples) break;

      const filePath = path.join(
        this.dataDir,
        "text",
        "processed",
        language,
        file
      );
      const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as DataEntry[];

      samples.push(...data.slice(0, maxSamples - samples.length));
    }

    return samples;
  }

  /**
   * Generate training data for pronunciation
   * @param language Target language
   */
  generatePronunciationData(
    language: GhanaianLanguage
  ): Record<string, string[]> {
    const samples = this.getSamples(language, 100);
    const words = new Set<string>();

    // Collect unique words
    for (const sample of samples) {
      if (!sample.textClean) continue;
      const tokens = this.tokenize(sample.textClean, language);
      tokens.forEach((token) => words.add(token.toLowerCase()));
    }

    // Generate syllable mapping
    const pronunciationMap: Record<string, string[]> = {};

    for (const word of Array.from(words)) {
      pronunciationMap[word] = this.syllabify(word, language);
    }

    // Save pronunciation map
    const filePath = path.join(
      this.dataDir,
      "text",
      "processed",
      language,
      "pronunciation_map.json"
    );

    fs.writeFileSync(filePath, JSON.stringify(pronunciationMap, null, 2));

    return pronunciationMap;
  }

  /**
   * Generate language statistics
   * @param language Target language
   */
  generateLanguageStats(language: GhanaianLanguage): any {
    const samples = this.getSamples(language, 1000);

    if (samples.length === 0) {
      return {
        language,
        wordCount: 0,
        uniqueWords: 0,
      };
    }

    const allWords: string[] = [];
    const uniqueWords = new Set<string>();

    for (const sample of samples) {
      if (!sample.textClean) continue;
      const tokens = this.tokenize(sample.textClean, language);
      allWords.push(...tokens);
      tokens.forEach((token) => uniqueWords.add(token.toLowerCase()));
    }

    // Calculate word frequency
    const wordFrequency: Record<string, number> = {};

    for (const word of allWords) {
      const lowerWord = word.toLowerCase();
      wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
    }

    // Sort by frequency
    const sortedWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);

    const stats = {
      language,
      sampleCount: samples.length,
      wordCount: allWords.length,
      uniqueWords: uniqueWords.size,
      averageWordsPerSample: allWords.length / samples.length,
      top100Words: sortedWords,
      isoCode: languageISOMap[language],
      languageName: ISO6391.getName(languageISOMap[language]) || language,
    };

    // Save stats
    const filePath = path.join(
      this.dataDir,
      "text",
      "processed",
      language,
      "language_stats.json"
    );

    fs.writeFileSync(filePath, JSON.stringify(stats, null, 2));

    return stats;
  }

  /**
   * Export data to CSV format for use with training tools
   * @param language Target language
   * @param type Type of dataset to export
   */
  exportToCSV(
    language: GhanaianLanguage,
    type: "tts" | "asr" | "general"
  ): string {
    const samples = this.getSamples(language, 1000);
    const csvRows: string[] = [];

    if (type === "tts") {
      // TTS format: id,text,cleaned_text,audio_file
      csvRows.push("id,text,cleaned_text,audio_file");

      for (const sample of samples) {
        if (!sample.text) continue;
        csvRows.push(
          [
            sample.id,
            `"${sample.text.replace(/"/g, '""')}"`,
            `"${(sample.textClean || "").replace(/"/g, '""')}"`,
            sample.audioPath || "",
          ].join(",")
        );
      }
    } else if (type === "asr") {
      // ASR format: audio_file,transcript
      csvRows.push("audio_file,transcript");

      for (const sample of samples) {
        if (!sample.audioPath || !sample.text) continue;
        csvRows.push(
          [sample.audioPath, `"${sample.text.replace(/"/g, '""')}"`].join(",")
        );
      }
    } else {
      // General format: id,text,language,translation
      csvRows.push("id,text,language,translation");

      for (const sample of samples) {
        if (!sample.text) continue;
        csvRows.push(
          [
            sample.id,
            `"${sample.text.replace(/"/g, '""')}"`,
            sample.language,
            `"${(sample.translation || "").replace(/"/g, '""')}"`,
          ].join(",")
        );
      }
    }

    // Save to file
    const filename = `${language}_${type}_data_${Date.now()}.csv`;
    const filePath = path.join(this.dataDir, filename);

    fs.writeFileSync(filePath, csvRows.join("\n"));

    return filePath;
  }
}

// Expose a singleton instance
export const ghanaianDatasetManager = new GhanaianLanguageDatasetManager();
export default ghanaianDatasetManager;
