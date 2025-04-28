#!/usr/bin/env node

/**
 * TalkGhana Setup Verification Script
 *
 * This script verifies that the environment is properly configured for TalkGhana development.
 * Run it with "node scripts/verify-setup.js" to confirm your setup is correct.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Verifying TalkGhana development setup...\n");

// Check Node.js version
const nodeVersion = process.version;
console.log(`Node.js version: ${nodeVersion}`);
const nodeMajorVersion = parseInt(nodeVersion.slice(1).split(".")[0], 10);

if (nodeMajorVersion < 18) {
  console.warn(
    "⚠️  Warning: Node.js version 18 or higher is recommended for TalkGhana"
  );
} else {
  console.log("✅ Node.js version is compatible");
}

// Check for critical files
const criticalFiles = [
  "package.json",
  "tsconfig.json",
  "vite.config.js",
  "tailwind.config.js",
  "src/i18n/index.ts",
  "src/i18n/locales/en.json",
  "src/components/ui/text.tsx",
  "src/components/web/LocalizedElement.ts",
];

console.log("\nChecking for critical files:");
let allFilesExist = true;

criticalFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} is missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error(
    "\n⚠️ Some critical files are missing. Please restore them from the repository."
  );
}

// Check for required dependencies
console.log("\nVerifying dependencies:");
const requiredDeps = [
  "react",
  "react-dom",
  "i18next",
  "react-i18next",
  "i18next-browser-languagedetector",
  "i18next-http-backend",
  "vite",
];

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
);
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

requiredDeps.forEach((dep) => {
  if (dependencies[dep]) {
    console.log(`✅ ${dep}: ${dependencies[dep]}`);
  } else {
    console.error(`❌ ${dep} is missing from package.json`);
  }
});

// Check for TypeScript to ensure build will work
console.log("\nVerifying TypeScript setup:");
try {
  execSync("npx tsc --version", { stdio: "pipe" });
  console.log("✅ TypeScript is installed and configured");
} catch (error) {
  console.error("❌ TypeScript is not properly installed or configured");
}

// Overall status
console.log("\n📋 Verification summary:");
if (allFilesExist && nodeMajorVersion >= 18) {
  console.log(
    '✅ Your TalkGhana setup looks good! You can start development with "npm run dev"'
  );
} else {
  console.log(
    "⚠️ Some issues were found with your setup. Please fix them before continuing."
  );
}

console.log("\n�� Happy coding!");
