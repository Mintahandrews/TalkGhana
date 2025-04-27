#!/usr/bin/env node

/**
 * Fix Broken Export in GhanaianLanguageDatasetManager.ts
 */

const fs = require("fs");
const path = require("path");

// ANSI colors for terminal output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

// Log utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Main function to fix the file
function fixFile() {
  log.info("Fixing export in GhanaianLanguageDatasetManager.ts...");

  const filePath = path.join(
    process.cwd(),
    "src/training/GhanaianLanguageDatasetManager.ts"
  );

  try {
    // Read the file
    let content = fs.readFileSync(filePath, "utf8");

    // Fix the commented out section and export
    const lines = content.split("\n");

    // Find where the commented out class ends
    const commentedEndIndex = lines.findIndex(
      (line) => line.trim() === "  // }"
    );

    if (commentedEndIndex !== -1) {
      // Replace lines after the commented out class end
      lines.splice(commentedEndIndex + 1);

      // Add fixed export statements
      lines.push("");
      lines.push("// Expose a singleton instance");
      lines.push(
        "export const ghanaianDatasetManager = new GhanaianLanguageDatasetManager();"
      );
      lines.push("export default ghanaianDatasetManager;");

      // Write fixed content back to file
      fs.writeFileSync(filePath, lines.join("\n"));
      log.success("Successfully fixed GhanaianLanguageDatasetManager.ts");
    } else {
      // Alternative approach: just remove the export default line if it's duplicated
      content = content.replace(
        /export default ghanaianDatasetManager;(\r?\n)*$/,
        ""
      );
      fs.writeFileSync(filePath, content);
      log.success(
        "Removed duplicate export in GhanaianLanguageDatasetManager.ts"
      );
    }
  } catch (error) {
    log.error(`Error fixing file: ${error.message}`);
    return false;
  }

  return true;
}

// Run the fix
fixFile();
