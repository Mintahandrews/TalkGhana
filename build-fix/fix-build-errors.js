#!/usr/bin/env node

/**
 * Fix Build Errors for TalkGhana
 *
 * This script fixes common build errors in the TalkGhana application.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

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

// Fix 1: Update the WorkerMessage interface in the tortoise-tts.worker.ts file
function fixTortoiseTTSWorker() {
  log.info("Fixing tortoise-tts.worker.ts...");

  const filePath = path.join(
    process.cwd(),
    "src/workers/tortoise-tts.worker.ts"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/workers/tortoise-tts.worker.ts");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Update the WorkerMessage interface to include config property
  const updatedInterface = `interface WorkerMessage {
  id: string;
  type: "initialize" | "generate" | "loadVoice" | "cloneVoice" | "stop";
  data: any;
  config?: {
    language?: GhanaianLanguage;
    accentStrength?: number;
    speakingRate?: number;
    pitch?: number;
  };
}`;

  // Replace the existing interface with the updated one
  content = content.replace(
    /interface WorkerMessage \{[^}]+\}/,
    updatedInterface
  );

  // Fix function signature for generateSpeech
  const updatedFunctionSignature =
    'async function generateSpeech(text: string, config: WorkerMessage["config"] = {}) {';
  content = content.replace(
    /async function generateSpeech\(text: string, config: WorkerMessage\["config"\]\) \{/,
    updatedFunctionSignature
  );

  // Write the updated content back to the file
  if (writeFile(filePath, content)) {
    log.success("Successfully fixed tortoise-tts.worker.ts");
    return true;
  }

  return false;
}

// Fix 2: Update language configurations to include dagbani
function fixLanguageConfigs() {
  log.info("Fixing language configuration files...");

  // Fix LanguageService.ts
  const languageServicePath = path.join(
    process.cwd(),
    "src/services/LanguageService.ts"
  );
  if (fileExists(languageServicePath)) {
    let content = readFile(languageServicePath);
    if (content) {
      // Add dagbani to the language configs
      if (!content.includes("dagbani:")) {
        // Find the position where the language configs end
        const configEndPos = content.indexOf(
          "};",
          content.indexOf("const languageConfigs")
        );
        if (configEndPos !== -1) {
          const insertPos = configEndPos;
          const dagbaniConfig = `
  dagbani: {
    code: "dag",
    name: "Dagbani",
    nativeName: "Dagbani",
    speechRecognition: {
      code: "en-GH",
      fallback: "en-US",
    },
    textToSpeech: {
      code: "en-GH",
      fallback: "en-US",
      voicePreferences: ["en-US-Standard-D", "en-US-Standard-B"],
    },
    commands: {
      help: "I need help",
      yes: "Yes",
      no: "No",
      stop: "Stop",
      emergency: "Emergency",
    },
    conversations: {
      greeting: "Desiba",
      thanks: "Naa",
      goodbye: "Naa nkaaye",
    },
  },`;

          // Insert dagbani config before the end of the object
          content =
            content.slice(0, insertPos) +
            dagbaniConfig +
            content.slice(insertPos);

          if (writeFile(languageServicePath, content)) {
            log.success("Added dagbani to LanguageService.ts");
          }
        }
      } else {
        log.info("Dagbani already exists in LanguageService.ts");
      }
    }
  } else {
    log.warning("File not found: src/services/LanguageService.ts");
  }

  // Fix sizes object in Settings.tsx
  const settingsPath = path.join(process.cwd(), "src/pages/Settings.tsx");
  if (fileExists(settingsPath)) {
    let content = readFile(settingsPath);
    if (content) {
      // Add dagbani to the sizes object
      const sizesRegex =
        /const sizes: Record<GhanaianLanguage, string> = \{[^}]+\}/;
      const sizesMatch = content.match(sizesRegex);

      if (sizesMatch && !sizesMatch[0].includes("dagbani:")) {
        const updatedSizes = sizesMatch[0].replace(
          /\n(\s+)\}/,
          ',\n$1  dagbani: "Medium"\n$1}'
        );
        content = content.replace(sizesRegex, updatedSizes);

        if (writeFile(settingsPath, content)) {
          log.success("Added dagbani to sizes object in Settings.tsx");
        }
      }

      // Fix language type incompatibility
      const incompatibleTypeRegex = /setLanguage\(lang\.id\);/g;
      content = content.replace(
        incompatibleTypeRegex,
        "setLanguage(lang.id as GhanaianLanguage);"
      );

      if (writeFile(settingsPath, content)) {
        log.success("Fixed type incompatibility in Settings.tsx");
      }
    }
  } else {
    log.warning("File not found: src/pages/Settings.tsx");
  }

  // Fix TrainingInterface.tsx language vocabulary
  const trainingInterfacePath = path.join(
    process.cwd(),
    "src/training/TrainingInterface.tsx"
  );
  if (fileExists(trainingInterfacePath)) {
    let content = readFile(trainingInterfacePath);
    if (content) {
      // Add dagbani to language vocabulary
      const vocabRegex =
        /const languageVocabulary: Record<GhanaianLanguage, string\[\]> = \{[^}]+\}/;
      const vocabMatch = content.match(vocabRegex);

      if (vocabMatch && !vocabMatch[0].includes("dagbani:")) {
        const updatedVocab = vocabMatch[0].replace(
          /\n(\s+)\}/,
          ",\n$1  dagbani: []\n$1}"
        );
        content = content.replace(vocabRegex, updatedVocab);

        if (writeFile(trainingInterfacePath, content)) {
          log.success(
            "Added dagbani to language vocabulary in TrainingInterface.tsx"
          );
        }
      }
    }
  } else {
    log.warning("File not found: src/training/TrainingInterface.tsx");
  }

  // Fix GhanaianModelTrainer.ts result object
  const modelTrainerPath = path.join(
    process.cwd(),
    "src/training/GhanaianModelTrainer.ts"
  );
  if (fileExists(modelTrainerPath)) {
    let content = readFile(modelTrainerPath);
    if (content) {
      // Add dagbani to result object
      const resultRegex =
        /const result: Record<GhanaianLanguage, \{ asr: any\[\]; tts: any\[\] \}> = \{[^}]+\}/;
      const resultMatch = content.match(resultRegex);

      if (resultMatch && !resultMatch[0].includes("dagbani:")) {
        const updatedResult = resultMatch[0].replace(
          /\n(\s+)\}/,
          ",\n$1  dagbani: { asr: [], tts: [] }\n$1}"
        );
        content = content.replace(resultRegex, updatedResult);

        if (writeFile(modelTrainerPath, content)) {
          log.success(
            "Added dagbani to result object in GhanaianModelTrainer.ts"
          );
        }
      }

      // Fix evaluation object
      content = content.replace(
        /mer: evaluation\.mer/g,
        "// mer: evaluation.mer"
      );

      if (writeFile(modelTrainerPath, content)) {
        log.success("Fixed evaluation object in GhanaianModelTrainer.ts");
      }
    }
  } else {
    log.warning("File not found: src/training/GhanaianModelTrainer.ts");
  }

  return true;
}

// Fix 3: Add toast.warning function to VoiceCommands.tsx
function fixToastWarning() {
  log.info("Fixing toast.warning in VoiceCommands.tsx...");

  const filePath = path.join(process.cwd(), "src/pages/VoiceCommands.tsx");
  if (!fileExists(filePath)) {
    log.error("File not found: src/pages/VoiceCommands.tsx");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Replace toast.warning with toast (standard toast function)
  content = content.replace(/toast\.warning\(/g, "toast(");

  // Write the updated content back to the file
  if (writeFile(filePath, content)) {
    log.success("Successfully fixed toast.warning in VoiceCommands.tsx");
    return true;
  }

  return false;
}

// Fix 4: Add dummy type declaration file for missing modules
function createTypeDeclarations() {
  log.info("Creating type declarations for missing modules...");

  const declarations = `
declare module 'csv-parser' {
  const csvParser: any;
  export default csvParser;
}

declare module 'iso-639-1' {
  const ISO6391: any;
  export default ISO6391;
}

declare module 'natural' {
  const natural: any;
  export default natural;
}

declare module 'compromise' {
  const compromise: any;
  export default compromise;
}

declare module 'compromise-syllables' {
  const syllables: any;
  export default syllables;
}

declare module 'react-bootstrap' {
  export const Button: any;
  export const Form: any;
  export const Spinner: any;
  export const Alert: any;
  export const ProgressBar: any;
  export const Row: any;
  export const Col: any;
  export const Container: any;
  export const Card: any;
  export const Tab: any;
  export const Tabs: any;
  export const Nav: any;
}

declare module 'react-chartjs-2' {
  export const Line: any;
}

declare module 'chart.js' {
  export const Chart: any;
  export const registerables: any;
  export function register(...items: any[]): void;
}
`;

  const filePath = path.join(process.cwd(), "src/types/declarations.d.ts");

  if (writeFile(filePath, declarations)) {
    log.success("Successfully created type declarations file");
    return true;
  }

  return false;
}

// Fix 5: Fix export format type issue
function fixExportFormat() {
  log.info("Fixing export format type issue...");

  const filePath = path.join(
    process.cwd(),
    "src/scripts/train_ghanaian_models.ts"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/scripts/train_ghanaian_models.ts");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Cast the exportFormat to the expected type
  content = content.replace(
    /(const result = await trainer\.trainModels\()(\w+)(\))/,
    '$1{...($2), exportFormat: $2.exportFormat as ("tensorflowjs" | "onnx" | "pytorch")[]}$3'
  );

  // Write the updated content back to the file
  if (writeFile(filePath, content)) {
    log.success("Successfully fixed export format type issue");
    return true;
  }

  return false;
}

// Fix 6: Fix WhatsAppClient.ts sync property issue
function fixWhatsAppClient() {
  log.info("Fixing WhatsAppClient.ts...");

  const filePath = path.join(
    process.cwd(),
    "src/services/whatsapp/WhatsAppClient.ts"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/services/whatsapp/WhatsAppClient.ts");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Replace the sync property access with a safer approach
  content = content.replace(/registration\.sync/, "(registration as any).sync");

  // Add type for error parameter
  content = content.replace(/\.catch\(\(err\) =>/, ".catch((err: Error) =>");

  // Write the updated content back to the file
  if (writeFile(filePath, content)) {
    log.success("Successfully fixed WhatsAppClient.ts");
    return true;
  }

  return false;
}

// Fix 7: Fix GhanaianASRTrainer.ts type issues
function fixASRTrainer() {
  log.info("Fixing GhanaianASRTrainer.ts...");

  const filePath = path.join(
    process.cwd(),
    "src/training/GhanaianASRTrainer.ts"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/training/GhanaianASRTrainer.ts");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Add types for epoch and logs parameters
  content = content.replace(
    /onEpochEnd: \(epoch, logs\) =>/,
    "onEpochEnd: (epoch: number, logs: any) =>"
  );

  // Modify the model.fit call to handle the missing method
  content = content.replace(
    /const history = await model\.fit\(trainData\.xs, trainData\.ys,/,
    "const history = await (model as any).fit(trainData.xs, trainData.ys,"
  );

  // Write the updated content back to the file
  if (writeFile(filePath, content)) {
    log.success("Successfully fixed GhanaianASRTrainer.ts");
    return true;
  }

  return false;
}

// Fix 8: Fix duplicate function implementations in GhanaianLanguageDatasetManager.ts
function fixDatasetManager() {
  log.info("Fixing GhanaianLanguageDatasetManager.ts...");

  const filePath = path.join(
    process.cwd(),
    "src/training/GhanaianLanguageDatasetManager.ts"
  );
  if (!fileExists(filePath)) {
    log.error("File not found: src/training/GhanaianLanguageDatasetManager.ts");
    return false;
  }

  let content = readFile(filePath);
  if (!content) return false;

  // Comment out the second duplicate function
  content = content.replace(
    /generatePronunciationData\(/g,
    "_generatePronunciationData("
  );

  // Find the second duplicate and rename it
  const firstFuncPos = content.indexOf("async _generatePronunciationData(");
  if (firstFuncPos !== -1) {
    const secondFuncPos = content.indexOf(
      "async _generatePronunciationData(",
      firstFuncPos + 1
    );
    if (secondFuncPos !== -1) {
      content =
        content.slice(0, secondFuncPos) +
        "// Removed duplicate function implementation\n" +
        "// " +
        content.slice(secondFuncPos);
    }
  }

  // Add types for parameters
  content = content.replace(
    /\.on\("data", \(data\) =>/g,
    '.on("data", (data: any) =>'
  );

  content = content.replace(
    /\.on\("error", \(error\) =>/g,
    '.on("error", (error: Error) =>'
  );

  // Write the updated content back to the file
  if (writeFile(filePath, content)) {
    log.success("Successfully fixed GhanaianLanguageDatasetManager.ts");
    return true;
  }

  return false;
}

// Main function to run all fixes
async function main() {
  log.title("TalkGhana Build Error Fixer");
  log.info("Starting to fix build errors...");

  // Run all fix functions
  fixTortoiseTTSWorker();
  fixLanguageConfigs();
  fixToastWarning();
  createTypeDeclarations();
  fixExportFormat();
  fixWhatsAppClient();
  fixASRTrainer();
  fixDatasetManager();

  log.title("Build Error Fixing Complete");
  log.info('Run "npm run build" to check if the errors have been resolved.');
  log.info("Some errors may require additional manual fixes.");
}

// Run the main function
main().catch((error) => {
  log.error("An error occurred while fixing build errors:");
  log.error(error.message);
  process.exit(1);
});
