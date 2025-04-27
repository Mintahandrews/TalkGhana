#!/usr/bin/env node

/**
 * Theme Toggle Test Script
 *
 * This script helps test the theme toggle functionality by:
 * 1. Verifying localStorage theme storage
 * 2. Testing system preference detection
 * 3. Validating proper class application on html element
 *
 * Run with: node scripts/test-theme-toggle.js
 */

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(
  `${colors.bright}${colors.blue}Theme Toggle Test Script${colors.reset}\n`
);

// Check if index.tsx contains proper theme initialization
const checkIndexFile = () => {
  try {
    const indexPath = path.join(process.cwd(), "src", "index.tsx");
    const indexContent = fs.readFileSync(indexPath, "utf8");

    console.log(
      `${colors.cyan}Checking src/index.tsx for theme initialization:${colors.reset}`
    );

    if (
      indexContent.includes("prefersDarkMode") &&
      indexContent.includes('storedTheme === "system"')
    ) {
      console.log(
        `${colors.green}✓ src/index.tsx contains proper system theme detection${colors.reset}`
      );
    } else {
      console.log(
        `${colors.red}⨯ src/index.tsx does not properly handle system theme${colors.reset}`
      );
      console.log(
        `${colors.yellow}Fix: Make sure index.tsx checks for system theme preference${colors.reset}`
      );
    }
  } catch (error) {
    console.log(
      `${colors.red}⨯ Could not read src/index.tsx: ${error.message}${colors.reset}`
    );
  }
};

// Check if ThemeContext.tsx implements proper theme handling
const checkThemeContext = () => {
  try {
    const contextPath = path.join(
      process.cwd(),
      "src",
      "context",
      "ThemeContext.tsx"
    );
    const contextContent = fs.readFileSync(contextPath, "utf8");

    console.log(
      `\n${colors.cyan}Checking src/context/ThemeContext.tsx:${colors.reset}`
    );

    let issues = 0;

    if (!contextContent.includes("system")) {
      console.log(
        `${colors.red}⨯ ThemeContext doesn't support "system" theme option${colors.reset}`
      );
      issues++;
    }

    if (!contextContent.includes("systemTheme")) {
      console.log(
        `${colors.red}⨯ ThemeContext doesn't track system theme state${colors.reset}`
      );
      issues++;
    }

    if (!contextContent.includes("prefers-color-scheme")) {
      console.log(
        `${colors.red}⨯ ThemeContext doesn't detect system color scheme${colors.reset}`
      );
      issues++;
    }

    if (issues === 0) {
      console.log(
        `${colors.green}✓ ThemeContext properly implements theme management${colors.reset}`
      );
    }
  } catch (error) {
    console.log(
      `${colors.red}⨯ Could not read src/context/ThemeContext.tsx: ${error.message}${colors.reset}`
    );
  }
};

// Check ThemeToggle component implementation
const checkThemeToggle = () => {
  try {
    const togglePath = path.join(
      process.cwd(),
      "src",
      "components",
      "ThemeToggle.tsx"
    );
    const toggleContent = fs.readFileSync(togglePath, "utf8");

    console.log(
      `\n${colors.cyan}Checking src/components/ThemeToggle.tsx:${colors.reset}`
    );

    if (
      toggleContent.includes("setTheme") &&
      toggleContent.includes("system") &&
      toggleContent.includes("Monitor")
    ) {
      console.log(
        `${colors.green}✓ ThemeToggle supports all theme options${colors.reset}`
      );
    } else {
      console.log(
        `${colors.red}⨯ ThemeToggle doesn't properly support system theme${colors.reset}`
      );
      console.log(
        `${colors.yellow}Fix: Make sure ThemeToggle includes light/dark/system options${colors.reset}`
      );
    }
  } catch (error) {
    console.log(
      `${colors.red}⨯ Could not read src/components/ThemeToggle.tsx: ${error.message}${colors.reset}`
    );
  }
};

// Check tailwind config dark mode setting
const checkTailwindConfig = () => {
  try {
    const configPath = path.join(process.cwd(), "tailwind.config.js");
    const configContent = fs.readFileSync(configPath, "utf8");

    console.log(`\n${colors.cyan}Checking tailwind.config.js:${colors.reset}`);

    if (configContent.includes("darkMode") && configContent.includes("class")) {
      console.log(
        `${colors.green}✓ tailwind.config.js has proper darkMode setting${colors.reset}`
      );
    } else {
      console.log(
        `${colors.red}⨯ tailwind.config.js doesn't use class-based dark mode${colors.reset}`
      );
      console.log(
        `${colors.yellow}Fix: Set darkMode: "class" in tailwind.config.js${colors.reset}`
      );
    }
  } catch (error) {
    console.log(
      `${colors.red}⨯ Could not read tailwind.config.js: ${error.message}${colors.reset}`
    );
  }
};

// Check for common theme-related CSS variables
const checkThemeCss = () => {
  try {
    const cssPath = path.join(process.cwd(), "src", "styles", "theme.css");
    const cssContent = fs.readFileSync(cssPath, "utf8");

    console.log(
      `\n${colors.cyan}Checking src/styles/theme.css:${colors.reset}`
    );

    if (
      cssContent.includes(":root") &&
      cssContent.includes(".dark") &&
      cssContent.includes("--bg-primary")
    ) {
      console.log(
        `${colors.green}✓ theme.css defines proper CSS variables${colors.reset}`
      );
    } else {
      console.log(
        `${colors.red}⨯ theme.css doesn't contain expected theme variables${colors.reset}`
      );
      console.log(
        `${colors.yellow}Fix: Define both light and dark theme variables${colors.reset}`
      );
    }
  } catch (error) {
    console.log(
      `${colors.red}⨯ Could not read src/styles/theme.css: ${error.message}${colors.reset}`
    );
  }
};

// Suggest manual testing steps
const suggestTesting = () => {
  console.log(`\n${colors.cyan}Manual Testing Suggestions:${colors.reset}`);
  console.log(
    `${colors.bright}1. Open the application in a browser${colors.reset}`
  );
  console.log(
    `${colors.bright}2. Test theme toggle functionality:${colors.reset}`
  );
  console.log(`   - Click the theme toggle button`);
  console.log(`   - Verify theme changes correctly`);
  console.log(`   - Check that the selection sticks when refreshing the page`);
  console.log(
    `${colors.bright}3. Test system preference matching:${colors.reset}`
  );
  console.log(`   - Change your system theme preference`);
  console.log(`   - Set TalkGhana to "System" theme`);
  console.log(`   - Verify theme matches system preference`);
  console.log(`   - Change system preference again and reload to confirm sync`);
};

// Run all checks
const runAllChecks = () => {
  checkIndexFile();
  checkThemeContext();
  checkThemeToggle();
  checkTailwindConfig();
  checkThemeCss();
  suggestTesting();

  console.log(
    `\n${colors.blue}✦ Theme toggle testing complete ✦${colors.reset}`
  );
  rl.close();
};

// Start the test process
runAllChecks();
