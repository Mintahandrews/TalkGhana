/**
 * GhanaianLanguageDatasetManager - Manager for language datasets and resources
 *
 * This module manages language-specific datasets, tools, and resources
 * for Ghanaian languages, including pronunciation dictionaries, text corpora,
 * and audio datasets.
 */

import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import ISO6391 from "iso-639-1";
import natural from "natural";
import compromise from "compromise";
import syllables from "compromise-syllables";

// Register plugins
compromise.plugin(syllables);

// Define Ghanaian language type
export type GhanaianLanguage =
  | "twi"
  | "ga"
  | "ewe"
  | "hausa"
  | "dagbani"
  | "english";

// Define interfaces
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

interface DatasetStats {
  hours: number;
  speakers: number;
  utterances: number;
  maleRatio: number;
  femaleRatio: number;
  averageDuration: number; // seconds
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

interface PronunciationDictionary {
  [word: string]: string[];
}

class GhanaianLanguageDatasetManager {
  private datasetRegistry: Record<GhanaianLanguage, Dataset[]> = {
    twi: [],
    ga: [],
    ewe: [],
    hausa: [],
    english: [],
    dagbani: [],
  };

  private pronunciationDictionaries: Record<
    GhanaianLanguage,
    PronunciationDictionary
  > = {
    twi: {},
    ga: {},
    ewe: {},
    hausa: {},
    english: {},
    dagbani: {},
  };

  private dataDir: string;
  private tokenizerCache: Record<GhanaianLanguage, any> = {} as any;
  private initialized = false;

  /**
   * Creates a new instance of GhanaianLanguageDatasetManager
   * @param dataDir Directory where data will be stored
   */
  constructor(dataDir = path.join(process.cwd(), "data")) {
    this.dataDir = dataDir;
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.loadDatasetRegistry();
      await this.loadPronunciationDictionaries();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize dataset manager:", error);
      // Create sample data if initialization fails
      this.createSampleDatasetRegistry();

      // Create sample pronunciation dictionaries
      Object.keys(this.pronunciationDictionaries).forEach((lang) => {
        this.createSamplePronunciations(lang as GhanaianLanguage);
      });

      this.initialized = true;
    }
  }

  private async loadDatasetRegistry(): Promise<void> {
    const registryPath = path.join(this.dataDir, "dataset-registry.json");
    if (fs.existsSync(registryPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(registryPath, "utf8"));
        this.datasetRegistry = data;
      } catch (error) {
        console.error("Failed to load dataset registry:", error);
        throw error;
      }
    } else {
      // Create default registry
      this.createSampleDatasetRegistry();
      this.saveDatasetRegistry();
    }
  }

  private createSampleDatasetRegistry(): void {
    // Sample datasets for each language
    const languages: GhanaianLanguage[] = [
      "twi",
      "ga",
      "ewe",
      "hausa",
      "english",
      "dagbani",
    ];

    languages.forEach((lang) => {
      this.datasetRegistry[lang] = [
        {
          language: lang,
          name: `${lang}-common-phrases`,
          description: `Common phrases in ${lang}`,
          path: path.join(this.dataDir, lang, "common-phrases"),
          stats: {
            hours: 0.5,
            speakers: 2,
            utterances: 100,
            maleRatio: 0.5,
            femaleRatio: 0.5,
            averageDuration: 3,
            dateCreated: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
          license: "CC BY 4.0",
          sourceName: "TalkGhana Sample Data",
          sourceUrl: "https://talkghana.example.org",
        },
        {
          language: lang,
          name: `${lang}-conversations`,
          description: `Conversational data in ${lang}`,
          path: path.join(this.dataDir, lang, "conversations"),
          stats: {
            hours: 1.2,
            speakers: 5,
            utterances: 250,
            maleRatio: 0.6,
            femaleRatio: 0.4,
            averageDuration: 4.5,
            dateCreated: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
          license: "CC BY 4.0",
          sourceName: "TalkGhana Sample Data",
          sourceUrl: "https://talkghana.example.org",
        },
      ];
    });
  }

  private saveDatasetRegistry(): void {
    const registryPath = path.join(this.dataDir, "dataset-registry.json");
    try {
      fs.writeFileSync(
        registryPath,
        JSON.stringify(this.datasetRegistry, null, 2)
      );
    } catch (error) {
      console.error("Failed to save dataset registry:", error);
    }
  }

  private async loadPronunciationDictionaries(): Promise<void> {
    const languages: GhanaianLanguage[] = [
      "twi",
      "ga",
      "ewe",
      "hausa",
      "english",
      "dagbani",
    ];

    for (const lang of languages) {
      const dictPath = path.join(this.dataDir, `pronunciation-${lang}.json`);

      if (fs.existsSync(dictPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dictPath, "utf8"));
          this.pronunciationDictionaries[lang] = data;
        } catch (error) {
          console.error(
            `Failed to load pronunciation dictionary for ${lang}:`,
            error
          );
          this.createSamplePronunciations(lang);
        }
      } else {
        this.createSamplePronunciations(lang);
        this.savePronunciationDictionary(lang);
      }
    }
  }

  private createSamplePronunciations(language: GhanaianLanguage): void {
    // Create some sample pronunciations for each language
    const sampleWords: Record<GhanaianLanguage, Record<string, string[]>> = {
      twi: {
        akwaaba: ["a", "kwa", "ba"],
        yɛ: ["yeh"],
        ɔdɔ: ["oh", "doh"],
        medaase: ["me", "da", "se"],
      },
      ga: {
        ogekoo: ["o", "ge", "koo"],
        miyiwaladon: ["mi", "yi", "wa", "la", "don"],
        ŋmɛnɛ: ["ŋmɛ", "nɛ"],
      },
      ewe: {
        akpe: ["a", "kpe"],
        woezɔ: ["wo", "e", "zɔ"],
        ɖeka: ["ɖe", "ka"],
      },
      hausa: {
        sannu: ["san", "nu"],
        nagode: ["na", "go", "de"],
        ina: ["i", "na"],
      },
      english: {
        hello: ["he", "llo"],
        welcome: ["wel", "come"],
        thank: ["thank"],
        you: ["you"],
      },
      dagbani: {
        desiba: ["de", "si", "ba"],
        naa: ["naa"],
        sɔŋmi: ["sɔŋ", "mi"],
      },
    };

    this.pronunciationDictionaries[language] = {};

    // Add sample words
    if (sampleWords[language]) {
      Object.entries(sampleWords[language]).forEach(([word, syllables]) => {
        this.pronunciationDictionaries[language][word] = syllables;
      });
    }
  }

  private savePronunciationDictionary(language: GhanaianLanguage): void {
    const dictPath = path.join(this.dataDir, `pronunciation-${language}.json`);

    try {
      fs.writeFileSync(
        dictPath,
        JSON.stringify(this.pronunciationDictionaries[language], null, 2)
      );
    } catch (error) {
      console.error(
        `Failed to save pronunciation dictionary for ${language}:`,
        error
      );
    }
  }

  registerDataset(dataset: Dataset): void {
    if (!this.datasetRegistry[dataset.language]) {
      this.datasetRegistry[dataset.language] = [];
    }
    this.datasetRegistry[dataset.language].push(dataset);
    this.saveDatasetRegistry();
  }

  getDatasets(language: GhanaianLanguage): Dataset[] {
    if (!this.datasetRegistry[language]) {
      return [];
    }
    return this.datasetRegistry[language];
  }

  getAllDatasets(): Record<GhanaianLanguage, Dataset[]> {
    return this.datasetRegistry;
  }

  async _generatePronunciationData(
    language: GhanaianLanguage
  ): Promise<PronunciationDictionary> {
    if (!this.initialized) {
      await this.initialize();
    }

    // This is a placeholder for more sophisticated generation
    // In a real system, this would use language-specific rules
    return this.pronunciationDictionaries[language];
  }

  getPronunciation(language: GhanaianLanguage, word: string): string[] {
    const dict = this.pronunciationDictionaries[language];
    const normalizedWord = word.toLowerCase().trim();

    if (dict[normalizedWord]) {
      return dict[normalizedWord];
    }

    // Simple fallback using general syllabification
    return this.syllabify(normalizedWord, language);
  }

  async getTextCorpus(
    language: GhanaianLanguage,
    maxLines = 1000
  ): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const corpusPath = path.join(this.dataDir, language, "corpus", "text.txt");

    if (fs.existsSync(corpusPath)) {
      const content = fs.readFileSync(corpusPath, "utf8");
      return content.split("\n").slice(0, maxLines);
    }

    // Generate dummy corpus if no real data exists
    return this.generateDummyCorpus(language, maxLines);
  }

  private generateDummyCorpus(
    language: GhanaianLanguage,
    lines: number
  ): string[] {
    // Simple phrases for testing
    const corpus: string[] = [];
    const prefix = language.charAt(0).toUpperCase() + language.slice(1);

    for (let i = 0; i < lines; i++) {
      corpus.push(`${prefix} sample text ${i + 1}`);
    }

    return corpus;
  }

  getDatasetSplit(
    language: GhanaianLanguage,
    datasetName: string
  ): { train: string[]; val: string[]; test: string[] } {
    // Default empty split
    const emptySplit = { train: [], val: [], test: [] };

    // Find the dataset
    const dataset = this.datasetRegistry[language]?.find(
      (ds) => ds.name === datasetName
    );

    if (!dataset) {
      return emptySplit;
    }

    // In a real implementation, this would read actual split files
    return {
      train: this.generateDummyCorpus(language, 80),
      val: this.generateDummyCorpus(language, 10),
      test: this.generateDummyCorpus(language, 10),
    };
  }

  getAudioDataPath(language: GhanaianLanguage): string {
    const audioPath = path.join(this.dataDir, language, "audio");

    if (!fs.existsSync(audioPath)) {
      fs.mkdirSync(audioPath, { recursive: true });
    }

    return audioPath;
  }

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
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return new Promise((resolve, reject) => {
      const results: DataEntry[] = [];

      fs.createReadStream(filePath)
        .pipe(
          csvParser({
            separator: options.delimiter || ",",
            skipLines: options.skipLines || 0,
          })
        )
        .on("data", (data: any) => {
          if (!data[options.textColumn]) {
            return; // Skip if no text
          }

          const entry: DataEntry = {
            id:
              data[options.idColumn || "id"] ||
              `${language}-${Date.now()}-${results.length}`,
            text: data[options.textColumn],
            language,
          };

          if (options.translationColumn && data[options.translationColumn]) {
            entry.translation = data[options.translationColumn];
          }

          // Clean the text
          entry.textClean = this.cleanText(entry.text, language);

          results.push(entry);
        })
        .on("error", (error: Error) => {
          reject(error);
        })
        .on("end", () => {
          resolve(results);
        });
    });
  }

  cleanText(text: string, language: GhanaianLanguage): string {
    // Basic cleaning functions
    let cleaned = text.trim();

    // Remove excess spaces
    cleaned = cleaned.replace(/\s+/g, " ");

    // Remove special characters based on language
    if (language === "english") {
      // For English, remove most punctuation except essential ones
      cleaned = cleaned.replace(/[^\w\s.,?!-]/g, "");
    } else {
      // For Ghanaian languages, preserve more characters that might be part of the language
      cleaned = cleaned.replace(/[^\w\s.,?!\-\u0300-\u036F\u0250-\u02AF]/g, "");
    }

    // Normalize specific characters for Ghanaian languages
    if (language !== "english") {
      // Map various forms of open-o and open-e to standard forms
      cleaned = cleaned.replace(/[ɔòóôõöø]/g, "ɔ").replace(/[ɛèéêë]/g, "ɛ");
    }

    return cleaned;
  }

  getTokenizer(language: GhanaianLanguage) {
    if (this.tokenizerCache[language]) {
      return this.tokenizerCache[language];
    }

    // Create appropriate tokenizer by language
    let tokenizer;

    if (language === "english") {
      // For English, use natural's tokenizer
      tokenizer = new natural.WordTokenizer();
    } else {
      // For Ghanaian languages, use a custom tokenizer that respects diacritics
      tokenizer = {
        tokenize: (text: string) => {
          // Split on spaces and punctuation, but keep diacritics with their base characters
          return text
            .split(/[\s.,!?;:"'()\[\]{}\\\/\-+=$&@#%^*_|~<>]+/)
            .filter((token) => token.length > 0);
        },
      };
    }

    this.tokenizerCache[language] = tokenizer;
    return tokenizer;
  }

  tokenize(text: string, language: GhanaianLanguage): string[] {
    const tokenizer = this.getTokenizer(language);
    return tokenizer.tokenize(text);
  }

  syllabify(text: string, language: GhanaianLanguage): string[] {
    if (language === "english") {
      // Use compromise for English
      const doc = compromise(text);
      const syllables = doc.syllables().json({ text: true, normal: true });

      if (syllables && syllables.length > 0) {
        return syllables[0].syllables || [text];
      }

      return [text];
    }

    // Simple syllabification rules for Ghanaian languages
    // This is a very basic implementation; real systems would use language-specific rules
    const words = this.tokenize(text, language);
    const results: string[] = [];

    for (const word of words) {
      // Check if we have this word in our pronunciation dictionary
      const pronunciation =
        this.pronunciationDictionaries[language][word.toLowerCase()];

      if (pronunciation) {
        results.push(...pronunciation);
        continue;
      }

      // Basic CV syllabification for Ghanaian languages
      // Most Ghanaian languages have simple CV (consonant-vowel) syllable structure
      const chars = word.split("");
      let currentSyllable = "";

      for (let i = 0; i < chars.length; i++) {
        currentSyllable += chars[i];

        // If this is a vowel and not the last character, break the syllable
        const isVowel = /[aeiouɛɔ]/i.test(chars[i]);
        const isLastChar = i === chars.length - 1;

        if (isVowel && !isLastChar) {
          // Look ahead to see if next char is a vowel
          const nextIsVowel = /[aeiouɛɔ]/i.test(chars[i + 1]);

          if (!nextIsVowel) {
            results.push(currentSyllable);
            currentSyllable = "";
          }
        } else if (isLastChar && currentSyllable) {
          results.push(currentSyllable);
        }
      }
    }

    return results;
  }

  saveTextData(entries: DataEntry[], language: GhanaianLanguage): void {
    const textDir = path.join(this.dataDir, language, "text");

    if (!fs.existsSync(textDir)) {
      fs.mkdirSync(textDir, { recursive: true });
    }

    // Save as JSON
    const jsonPath = path.join(textDir, `${language}-data-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(entries, null, 2));

    // Also save as CSV
    const csvPath = path.join(textDir, `${language}-data-${Date.now()}.csv`);
    const csvHeader = "id,text,textClean,translation,language\n";
    const csvRows = [csvHeader];

    entries.forEach((entry) => {
      csvRows.push(
        `"${entry.id}","${entry.text.replace(/"/g, '""')}","${(
          entry.textClean || ""
        ).replace(/"/g, '""')}","${(entry.translation || "").replace(
          /"/g,
          '""'
        )}","${entry.language}"\n`
      );
    });

    fs.writeFileSync(csvPath, csvRows.join(""));

    // Update registry
    this.registerDataset({
      language,
      name: `${language}-text-${Date.now()}`,
      description: `Text data for ${language}`,
      path: textDir,
      stats: {
        hours: 0,
        speakers: 0,
        utterances: entries.length,
        maleRatio: 0,
        femaleRatio: 0,
        averageDuration: 0,
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
      license: "CC BY 4.0",
    });
  }

  async importAudioFiles(
    audioDir: string,
    metadataFile: string | null,
    language: GhanaianLanguage
  ): Promise<void> {
    if (!fs.existsSync(audioDir)) {
      throw new Error(`Audio directory not found: ${audioDir}`);
    }

    const outputDir = this.getAudioDataPath(language);
    const entries: DataEntry[] = [];

    // Read metadata if provided
    let metadata: Record<string, any> = {};

    if (metadataFile && fs.existsSync(metadataFile)) {
      try {
        const metadataContent = fs.readFileSync(metadataFile, "utf8");

        // Check if it's JSON or CSV
        if (metadataFile.endsWith(".json")) {
          metadata = JSON.parse(metadataContent);
        } else if (metadataFile.endsWith(".csv")) {
          // Parse CSV
          await new Promise((resolve, reject) => {
            fs.createReadStream(metadataFile)
              .pipe(csvParser())
              .on("data", (data: any) => {
                if (data.id && data.text) {
                  metadata[data.id] = data;
                }
              })
              .on("error", (error: Error) => {
                reject(error);
              })
              .on("end", () => {
                resolve(null);
              });
          });
        }
      } catch (error) {
        console.error("Failed to parse metadata file:", error);
      }
    }

    // Process audio files
    const files = fs.readdirSync(audioDir);

    for (const file of files) {
      if (!file.match(/\.(wav|mp3|ogg|flac)$/i)) {
        continue; // Skip non-audio files
      }

      const filePath = path.join(audioDir, file);
      const stats = fs.statSync(filePath);

      if (!stats.isFile()) {
        continue;
      }

      // Generate an ID from the filename
      const id = path.basename(file, path.extname(file));

      // Copy file to output directory
      const outputPath = path.join(outputDir, file);
      fs.copyFileSync(filePath, outputPath);

      // Create entry
      const entry: DataEntry = {
        id,
        text: metadata[id]?.text || "",
        language,
        audioPath: outputPath,
      };

      // Add metadata if available
      if (metadata[id]) {
        entry.metadata = { ...metadata[id] };

        if (metadata[id].translation) {
          entry.translation = metadata[id].translation;
        }
      }

      entries.push(entry);
    }

    // Save entries
    if (entries.length > 0) {
      const jsonPath = path.join(
        outputDir,
        `${language}-audio-data-${Date.now()}.json`
      );
      fs.writeFileSync(jsonPath, JSON.stringify(entries, null, 2));

      // Update registry
      this.registerDataset({
        language,
        name: `${language}-audio-${Date.now()}`,
        description: `Audio data for ${language}`,
        path: outputDir,
        stats: {
          hours: entries.length * 0.1, // Rough estimate
          speakers: 1, // Default assumption
          utterances: entries.length,
          maleRatio: 0.5, // Default assumption
          femaleRatio: 0.5, // Default assumption
          averageDuration: 3, // Default assumption
          dateCreated: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
        license: "CC BY 4.0",
      });
    }
  }

  listAvailableData(
    language: GhanaianLanguage,
    type: "text" | "audio" = "text"
  ): string[] {
    const dataPath = path.join(this.dataDir, language, type);

    if (!fs.existsSync(dataPath)) {
      return [];
    }

    return fs.readdirSync(dataPath).filter((file) => {
      const filePath = path.join(dataPath, file);
      return fs.statSync(filePath).isFile();
    });
  }

  getSamples(language: GhanaianLanguage, maxSamples = 10): DataEntry[] {
    // Get datasets for this language
    const datasets = this.getDatasets(language);
    const samples: DataEntry[] = [];

    for (const dataset of datasets) {
      const datasetPath = dataset.path;

      // Look for JSON files in the dataset path
      if (fs.existsSync(datasetPath)) {
        const files = fs
          .readdirSync(datasetPath)
          .filter((file) => file.endsWith(".json"))
          .filter((file) => !file.includes("registry"));

        for (const file of files) {
          try {
            const filePath = path.join(datasetPath, file);
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

            if (Array.isArray(data)) {
              samples.push(...data.slice(0, maxSamples - samples.length));

              if (samples.length >= maxSamples) {
                break;
              }
            }
          } catch (error) {
            console.error(`Failed to read sample data from ${file}:`, error);
          }
        }

        if (samples.length >= maxSamples) {
          break;
        }
      }
    }

    return samples;
  }
}

// Expose a singleton instance
export const ghanaianDatasetManager = new GhanaianLanguageDatasetManager();
