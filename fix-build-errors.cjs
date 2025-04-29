#!/usr/bin/env node

/**
 * TalkGhana Build Error Fix Script
 *
 * This script fixes all the TypeScript errors preventing the build from completing.
 * Run it with "node fix-build-errors.cjs" before deploying.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔧 Running TalkGhana build error fixes...");

// Ensure required directories exist
const dirs = [
  "src/hooks",
  "src/components/ui",
  "src/types",
  "src/i18n/locales",
];

dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`📁 Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Fix 1: Update i18n/index.ts exports
const i18nPath = path.join(__dirname, "src/i18n/index.ts");
if (fs.existsSync(i18nPath)) {
  console.log("🔧 Fixing i18n exports...");
  let content = fs.readFileSync(i18nPath, "utf8");

  // Make sure applyLanguageToElements and applyLanguageStyles are exported
  content = content.replace(
    /const applyLanguageToElements = \(lng: string\)/g,
    "export const applyLanguageToElements = (lng: string)"
  );

  content = content.replace(
    /const applyLanguageStyles = \(lng: string\)/g,
    "export const applyLanguageStyles = (lng: string)"
  );

  // Fix translateText function return type
  content = content.replace(
    /export const translateText = \(key: string, options\?: any\): string => {[\s\S]*?return i18n\.t\(key, options\);/g,
    'export const translateText = (key: string, options?: any): string => {\n  const translated = i18n.t(key, options);\n  return typeof translated === "string" ? translated : String(translated);'
  );

  fs.writeFileSync(i18nPath, content);
}

// Fix 2: Create custom-elements.d.ts
const customElementsPath = path.join(
  __dirname,
  "src/types/custom-elements.d.ts"
);
console.log("📝 Creating custom elements declaration file...");
const customElementsContent = `/**
 * Custom elements declaration file for TalkGhana
 * This file adds type definitions for our custom web components
 */

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'localized-text': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'data-i18n'?: string;
          'data-format'?: 'uppercase' | 'lowercase' | 'capitalize';
        },
        HTMLElement
      >;
      'theme-toggle': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}`;

fs.writeFileSync(customElementsPath, customElementsContent);

// Fix 3: Create Text component
const textComponentPath = path.join(__dirname, "src/components/ui/text.tsx");
console.log("📝 Creating Text component...");
const textComponentContent = `import React from 'react';
import { useTranslation } from 'react-i18next';

export interface TextProps {
  id: string;
  fallback: string;
  className?: string;
  htmlFor?: string;
  values?: Record<string, any>;
  children?: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  id,
  fallback,
  className = '',
  htmlFor,
  values,
  children,
}) => {
  const { t } = useTranslation();
  const content = t(id, { fallback, ...values });

  if (htmlFor) {
    return (
      <label className={className} htmlFor={htmlFor}>
        {content}
        {children}
      </label>
    );
  }

  return (
    <span className={className}>
      {content}
      {children}
    </span>
  );
};

export default Text;`;

fs.writeFileSync(textComponentPath, textComponentContent);

// Fix 4: Create Label component
const labelComponentPath = path.join(__dirname, "src/components/ui/Label.tsx");
console.log("📝 Creating Label component...");
const labelComponentContent = `import React from 'react';
import { useTranslation } from 'react-i18next';

export interface LabelProps {
  id: string;
  fallback: string;
  className?: string;
  htmlFor: string;
  children?: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  id,
  fallback,
  className = '',
  htmlFor,
  children,
}) => {
  const { t } = useTranslation();
  const content = t(id, { fallback });

  return (
    <label className={className} htmlFor={htmlFor}>
      {content}
      {children}
    </label>
  );
};

export default Label;`;

fs.writeFileSync(labelComponentPath, labelComponentContent);

// Fix 5: Create useLanguage hook
const useLanguagePath = path.join(__dirname, "src/hooks/useLanguage.ts");
console.log("📝 Creating useLanguage hook...");
const useLanguageContent = `import { useContext } from 'react';
import LanguageContext from '../contexts/LanguageContext';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default useLanguage;`;

fs.writeFileSync(useLanguagePath, useLanguageContent);

// Fix 6: Fix web component registration
const webIndexPath = path.join(__dirname, "src/components/web/index.ts");
if (fs.existsSync(webIndexPath)) {
  console.log("🔧 Fixing web component registration...");
  const webIndexContent = `/**
 * Web Components Registration
 *
 * This file exports custom web components that can be used outside of the React application.
 * Both components are automatically registered when imported.
 */

import { LocalizedElement } from "./LocalizedElement";
import { ThemeToggle } from "./ThemeToggle";

export { LocalizedElement } from "./LocalizedElement";
export { ThemeToggle } from "./ThemeToggle";

/**
 * Register all web components for use in the application
 */
export const registerWebComponents = (): void => {
  // Register custom elements if not already defined
  if (!customElements.get('localized-text')) {
    customElements.define('localized-text', LocalizedElement);
  }
  
  if (!customElements.get('theme-toggle')) {
    customElements.define('theme-toggle', ThemeToggle);
  }
};

// Default export for convenience
export default {
  LocalizedElement,
  ThemeToggle,
  registerWebComponents
};`;

  fs.writeFileSync(webIndexPath, webIndexContent);
}

// Fix 7: Fix LocalizedElement import path
const localizedElementPath = path.join(
  __dirname,
  "src/components/web/LocalizedElement.ts"
);
if (fs.existsSync(localizedElementPath)) {
  console.log("🔧 Fixing LocalizedElement import path...");
  let content = fs.readFileSync(localizedElementPath, "utf8");
  content = content.replace(
    /import i18n from "\.\.\/\.\.\/locales\/i18n"/g,
    'import i18n from "../../i18n"'
  );
  fs.writeFileSync(localizedElementPath, content);
}

// Fix 8: Create/update translation files
const enTranslationsPath = path.join(__dirname, "src/i18n/locales/en.json");
console.log("📝 Creating English translations file...");
const enTranslations = {
  appTitle: "TalkGhana",
  greeting: "Welcome to TalkGhana",
  welcome: "Your voice matters",
  language: "Language",
  settings: "Settings",
  conversation: "Conversation",
  speechRate: "Speech Rate",
  speechPitch: "Speech Pitch",
  voiceCommands: "Voice Commands",
  offlineMode: "Offline Mode",
  accessibilitySettings: "Accessibility Settings",
  highContrast: "High Contrast",
  largerText: "Larger Text",
  slower: "Slower",
  faster: "Faster",
  lower: "Lower",
  higher: "Higher",
  testSpeech: "Test Speech",
  testing: "Testing...",
  languageSettings: "Language Settings",
  currentLanguage: "Current Language",
  offlineCapabilities: "Offline Capabilities",
  offlineLanguageData: "Offline Language Data",
  downloadedSize: "Downloaded ({{size}})",
  notDownloaded: "Not downloaded",
  download: "Download",
  downloaded: "Downloaded",
  downloading: "Downloading...",
  speechTestPhrase:
    "This is a test of the speech settings with the current rate and pitch.",
};

fs.writeFileSync(enTranslationsPath, JSON.stringify(enTranslations, null, 2));

// Fix 9: Install missing dependency
console.log("📦 Installing i18next-http-backend...");
try {
  execSync("npm install i18next-http-backend --save", { stdio: "inherit" });
} catch (err) {
  console.error("❌ Failed to install i18next-http-backend:", err.message);
}

// Fix 10: Update package.json type field but keep it as module
const packageJsonPath = path.join(__dirname, "package.json");
if (fs.existsSync(packageJsonPath)) {
  console.log("🔧 Updating package.json...");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Make sure type is module
  packageJson.type = "module";

  // Add verify and fix scripts
  if (packageJson.scripts) {
    packageJson.scripts.verify = "node scripts/verify-setup.js";
    packageJson.scripts.fix = "node fix-build-errors.cjs";
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

console.log("✅ All fixes applied successfully!");
console.log('🚀 You can now run "npm run build" to build the project');
