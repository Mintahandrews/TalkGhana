#!/usr/bin/env node

/**
 * Fix Dagbani Type Errors for TalkGhana
 *
 * This script fixes all dagbani-related type errors in the TalkGhana application.
 */

const fs = require("fs");
const path = require("path");

// ANSI colors for terminal output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

// Log utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) =>
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

// Function to read a file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    log.error(`Could not read file: ${filePath}`);
    log.error(error.message);
    return null;
  }
}

// Function to write a file
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  } catch (error) {
    log.error(`Could not write file: ${filePath}`);
    log.error(error.message);
    return false;
  }
}

// Function to check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Fix GhanaianSpeechDemo.tsx
function fixGhanaianSpeechDemo() {
  log.info("Fixing GhanaianSpeechDemo.tsx...");

  const filePath = path.join(
    process.cwd(),
    "src/components/GhanaianSpeechDemo.tsx"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/components/GhanaianSpeechDemo.tsx");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Add dagbani entry to DEMO_PHRASES
  if (content.includes("DEMO_PHRASES: Record<GhanaianLanguage, string[]>")) {
    const demoPhrases =
      /const DEMO_PHRASES: Record<GhanaianLanguage, string\[\]> = \{([^}]+)\};/g;
    const demoPhrasesMatch = demoPhrases.exec(content);

    if (demoPhrasesMatch && !demoPhrasesMatch[1].includes("dagbani:")) {
      const updatedContent = content.replace(
        /const DEMO_PHRASES: Record<GhanaianLanguage, string\[\]> = \{([^}]+)\};/,
        (
          match,
          p1
        ) => `const DEMO_PHRASES: Record<GhanaianLanguage, string[]> = {${p1}  dagbani: [
    "Desiba! This is TalkGhana",
    "I can help you communicate in Dagbani",
    "Try saying some basic phrases",
    "You can also type if you prefer"
  ],
};`
      );

      if (writeFile(filePath, updatedContent)) {
        log.success("Successfully fixed GhanaianSpeechDemo.tsx");
        return true;
      }
    }
  }

  log.warning("Could not find DEMO_PHRASES in GhanaianSpeechDemo.tsx");
  return false;
}

// Fix GhanaianTTS.ts
function fixGhanaianTTS() {
  log.info("Fixing GhanaianTTS.ts...");

  const filePath = path.join(process.cwd(), "src/services/GhanaianTTS.ts");
  if (!fileExists(filePath)) {
    log.error("File not found: src/services/GhanaianTTS.ts");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Add dagbani entry to phoneticMappings
  if (
    content.includes(
      "phoneticMappings: Record<GhanaianLanguage, Record<string, string>>"
    )
  ) {
    content = content.replace(
      /private phoneticMappings: Record<GhanaianLanguage, Record<string, string>> = \{([^}]+)english: \{\}([\s\n]+)\};/,
      (
        match,
        p1,
        p2
      ) => `private phoneticMappings: Record<GhanaianLanguage, Record<string, string>> = {${p1}english: {},${p2}  dagbani: {
    ɛ: "eh",
    ɔ: "oh",
    ŋ: "ng",
    ɲ: "ny",
    ʒ: "zh",
    ʃ: "sh",
    // Common words
    desiba: "deh see ba",
    naa: "naa",
    sɔŋmi: "song-mi"
  }
};`
    );
  }

  // Add dagbani entry to pitchValues
  if (content.includes("pitchValues: Record<GhanaianLanguage, number>")) {
    content = content.replace(
      /private pitchValues: Record<GhanaianLanguage, number> = \{([^}]+)\};/,
      (
        match,
        p1
      ) => `private pitchValues: Record<GhanaianLanguage, number> = {${p1}  dagbani: 1.05
};`
    );
  }

  // Add dagbani entry to rateValues
  if (content.includes("rateValues: Record<GhanaianLanguage, number>")) {
    content = content.replace(
      /private rateValues: Record<GhanaianLanguage, number> = \{([^}]+)\};/,
      (
        match,
        p1
      ) => `private rateValues: Record<GhanaianLanguage, number> = {${p1}  dagbani: 0.9
};`
    );
  }

  if (writeFile(filePath, content)) {
    log.success("Successfully fixed GhanaianTTS.ts");
    return true;
  }

  return false;
}

// Fix TrainingInterface.tsx
function fixTrainingInterface() {
  log.info("Fixing TrainingInterface.tsx...");

  const filePath = path.join(
    process.cwd(),
    "src/training/TrainingInterface.tsx"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/training/TrainingInterface.tsx");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Add dagbani entry to languageVocabulary
  if (
    content.includes("languageVocabulary: Record<GhanaianLanguage, string[]>")
  ) {
    content = content.replace(
      /const languageVocabulary: Record<GhanaianLanguage, string\[\]> = \{([^}]+)\};/,
      (
        match,
        p1
      ) => `const languageVocabulary: Record<GhanaianLanguage, string[]> = {${p1}  dagbani: [
    "Desiba", "Naa", "Sɔŋmi", "Ii", "Ayi", "Pihimi", "Kɔm", "Nanzua"
  ]
};`
    );
  }

  // Fix type errors by updating declarations.d.ts
  const declarationsPath = path.join(
    process.cwd(),
    "src/types/declarations.d.ts"
  );
  if (fileExists(declarationsPath)) {
    let declarations = readFile(declarationsPath);
    if (declarations) {
      declarations = declarations.replace(
        /export const (\w+): any;/g,
        "export const $1: any;"
      );

      // Add missing Bootstrap components
      if (!declarations.includes("export const Table: any;")) {
        declarations = declarations.replace(
          "export const Nav: any;",
          "export const Nav: any;\n  export const Table: any;\n  export const Badge: any;\n  export const Modal: any;\n  export const ListGroup: any;\n  export const Accordion: any;"
        );
      }

      // Add missing Chart.js components
      if (!declarations.includes("export const CategoryScale: any;")) {
        declarations = declarations.replace(
          "export function register(...items: any[]): void;",
          "export function register(...items: any[]): void;\n  export const CategoryScale: any;\n  export const LinearScale: any;\n  export const PointElement: any;\n  export const LineElement: any;\n  export const Title: any;\n  export const Tooltip: any;\n  export const Legend: any;"
        );
      }

      writeFile(declarationsPath, declarations);
      log.success("Updated type declarations for React Bootstrap and Chart.js");
    }
  }

  // Fix parameter type issues
  content = content.replace(
    /onChange={\(e\) =>/g,
    "onChange={(e: React.ChangeEvent<HTMLInputElement>) =>"
  );

  if (writeFile(filePath, content)) {
    log.success("Successfully fixed TrainingInterface.tsx");
    return true;
  }

  return false;
}

// Fix GhanaianModelTrainer.ts
function fixGhanaianModelTrainer() {
  log.info("Fixing GhanaianModelTrainer.ts...");

  const filePath = path.join(
    process.cwd(),
    "src/training/GhanaianModelTrainer.ts"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/training/GhanaianModelTrainer.ts");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Add dagbani to result object if not already fixed
  if (
    content.includes(
      "result: Record<GhanaianLanguage, { asr: any[]; tts: any[] }>"
    ) &&
    !content.includes("dagbani: { asr: [], tts: [] }")
  ) {
    content = content.replace(
      /const result: Record<GhanaianLanguage, \{ asr: any\[\]; tts: any\[\] \}> = \{([^}]+)\};/,
      (
        match,
        p1
      ) => `const result: Record<GhanaianLanguage, { asr: any[]; tts: any[] }> = {${p1}  dagbani: { asr: [], tts: [] }
};`
    );
  }

  // Fix the interface issue with MER
  content = content.replace(
    /interface EvaluationResult \{[^}]*mer: number;[^}]*\}/,
    "interface EvaluationResult {\n  path: string;\n  wer: number; // Word Error Rate\n  mer?: number; // Match Error Rate (optional now)\n  trainingDuration: number;\n  modelSize: number;\n}"
  );

  // Update return type to make mer optional
  content = content.replace(/return \{([^}]+)\};/g, (match, p1) => {
    if (p1.includes("mer: evaluation.mer")) {
      return match; // Don't modify it if it already includes mer
    }
    return `return {${p1}  // mer is now optional
};`;
  });

  if (writeFile(filePath, content)) {
    log.success("Successfully fixed GhanaianModelTrainer.ts");
    return true;
  }

  return false;
}

// Fix GhanaianLanguageDatasetManager.ts and GhanaianTTSTrainer.ts
function fixTrainingModules() {
  log.info(
    "Fixing GhanaianLanguageDatasetManager.ts and GhanaianTTSTrainer.ts..."
  );

  // Fix GhanaianTTSTrainer.ts
  const ttsTrainerPath = path.join(
    process.cwd(),
    "src/training/GhanaianTTSTrainer.ts"
  );
  if (fileExists(ttsTrainerPath)) {
    let content = readFile(ttsTrainerPath);
    if (content) {
      // Fix reference to deprecated function
      content = content.replace(
        /ghanaianDatasetManager\.generatePronunciationData/g,
        "ghanaianDatasetManager._generatePronunciationData"
      );

      if (writeFile(ttsTrainerPath, content)) {
        log.success("Successfully fixed GhanaianTTSTrainer.ts");
      }
    }
  }

  // Fix GhanaianLanguageDatasetManager.ts
  const datasetManagerPath = path.join(
    process.cwd(),
    "src/training/GhanaianLanguageDatasetManager.ts"
  );
  if (fileExists(datasetManagerPath)) {
    let content = readFile(datasetManagerPath);
    if (content) {
      // Comment out duplicate function implementations
      let lines = content.split("\n");

      // Find the first _generatePronunciationData function
      const firstFuncIndex = lines.findIndex((line) =>
        line.includes("async _generatePronunciationData(")
      );

      if (firstFuncIndex !== -1) {
        // Find the end of the first function
        let braceCount = 1;
        let endFirstFunc = firstFuncIndex;
        for (let i = firstFuncIndex + 1; i < lines.length; i++) {
          if (lines[i].includes("{")) braceCount++;
          if (lines[i].includes("}")) braceCount--;
          if (braceCount === 0) {
            endFirstFunc = i;
            break;
          }
        }

        // Find the second function
        const secondFuncIndex = lines.findIndex(
          (line, idx) =>
            idx > endFirstFunc && line.includes("_generatePronunciationData(")
        );

        if (secondFuncIndex !== -1) {
          // Comment out the second function
          lines[secondFuncIndex] = "  // Commented out duplicate function";

          // Find the end of the second function
          braceCount = 1;
          let endSecondFunc = secondFuncIndex;
          for (let i = secondFuncIndex + 1; i < lines.length; i++) {
            if (lines[i].includes("{") && !lines[i].includes("//"))
              braceCount++;
            if (lines[i].includes("}") && !lines[i].includes("//"))
              braceCount--;
            lines[i] = "  // " + lines[i];
            if (braceCount === 0) {
              endSecondFunc = i;
              break;
            }
          }
        }
      }

      // Fix csv import and usage
      const updatedContent = lines
        .join("\n")
        .replace(
          /import \* as csv from "csv-parser";/,
          'import csv from "csv-parser";'
        )
        .replace(/\.on\("data", \(data\) =>/g, '.on("data", (data: any) =>')
        .replace(
          /\.on\("error", \(error\) =>/g,
          '.on("error", (error: Error) =>'
        );

      if (writeFile(datasetManagerPath, updatedContent)) {
        log.success("Successfully fixed GhanaianLanguageDatasetManager.ts");
      }
    }
  }

  return true;
}

// Main function to run all fixes
async function main() {
  log.title("TalkGhana Dagbani Type Error Fixer");
  log.info("Fixing all dagbani-related type errors...");

  // Run all fix functions
  fixGhanaianSpeechDemo();
  fixGhanaianTTS();
  fixTrainingInterface();
  fixGhanaianModelTrainer();
  fixTrainingModules();

  log.title("Dagbani Type Error Fixing Complete");
  log.info('Run "npm run build" to check if the errors have been resolved.');
}

// Run the main function
main().catch((error) => {
  log.error("An error occurred while fixing type errors:");
  log.error(error.message);
  process.exit(1);
});
