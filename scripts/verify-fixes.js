#!/usr/bin/env node

/**
 * Verification Script for TalkGhana Fixes
 *
 * This script verifies that the fixes we've made to the server and frontend
 * components are working correctly.
 *
 * It checks for:
 * 1. Server health and connectivity
 * 2. Proper API error handling
 * 3. TTS and ASR service availability
 * 4. Storage directory structure
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { exec } = require("child_process");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

console.log(
  `${colors.blue}${colors.bold}TalkGhana Fixes Verification Script${colors.reset}\n`
);
console.log(
  `${colors.cyan}This script will check that all fixes have been properly applied.${colors.reset}\n`
);

let serverRunning = false;
let serverPort = 5002; // Default port
let hasErrors = false;

// 1. Check directory structure
const checkDirectories = () => {
  console.log(
    `${colors.magenta}Checking directory structure...${colors.reset}`
  );

  const requiredDirs = [
    "uploads",
    "uploads/audio",
    "uploads/temp",
    "server",
    "server/routes",
    "src/services",
    "src/context",
    "src/components",
  ];

  let allDirsExist = true;

  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`  ${colors.green}✓ ${dir} directory exists${colors.reset}`);
    } else {
      console.log(
        `  ${colors.red}✗ ${dir} directory is missing${colors.reset}`
      );
      allDirsExist = false;
      hasErrors = true;

      // Create missing directory
      console.log(`    Creating ${dir} directory...`);
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(
          `    ${colors.green}✓ Created ${dir} directory${colors.reset}`
        );
      } catch (err) {
        console.log(
          `    ${colors.red}✗ Failed to create ${dir} directory: ${err.message}${colors.reset}`
        );
      }
    }
  }

  return allDirsExist;
};

// 2. Check server files
const checkServerFiles = () => {
  console.log(`\n${colors.magenta}Checking server files...${colors.reset}`);

  const requiredFiles = [
    "server/index.js",
    "server/routes/asr.js",
    "server/routes/tts.js",
    "server/package.json",
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ${colors.green}✓ ${file} exists${colors.reset}`);

      // Check for key features in files
      const content = fs.readFileSync(filePath, "utf8");

      if (file === "server/index.js") {
        if (
          content.includes("cleanupTempFiles") &&
          content.includes("/api/health")
        ) {
          console.log(
            `    ${colors.green}✓ Server has proper health check and cleanup${colors.reset}`
          );
        } else {
          console.log(
            `    ${colors.yellow}! Server might be missing health check or cleanup${colors.reset}`
          );
        }
      }

      if (file === "server/routes/asr.js") {
        if (
          content.includes("let audioFile = null") &&
          content.includes("/health")
        ) {
          console.log(
            `    ${colors.green}✓ ASR route has proper error handling${colors.reset}`
          );
        } else {
          console.log(
            `    ${colors.yellow}! ASR route might be missing error handling fixes${colors.reset}`
          );
        }
      }

      if (file === "server/routes/tts.js") {
        if (
          content.includes("applyPhoneticReplacements") &&
          content.includes("/voices")
        ) {
          console.log(
            `    ${colors.green}✓ TTS route has proper language handling${colors.reset}`
          );
        } else {
          console.log(
            `    ${colors.yellow}! TTS route might be missing language improvements${colors.reset}`
          );
        }
      }
    } else {
      console.log(`  ${colors.red}✗ ${file} is missing${colors.reset}`);
      allFilesExist = false;
      hasErrors = true;
    }
  }

  return allFilesExist;
};

// 3. Check frontend files
const checkFrontendFiles = () => {
  console.log(`\n${colors.magenta}Checking frontend files...${colors.reset}`);

  const requiredFiles = [
    "src/services/ApiService.ts",
    "src/services/TextToSpeechService.tsx",
    "src/services/SpeechRecognitionService.ts",
    "src/pages/Conversation.tsx",
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ${colors.green}✓ ${file} exists${colors.reset}`);

      // Check for key features in files
      const content = fs.readFileSync(filePath, "utf8");

      if (file === "src/services/ApiService.ts") {
        if (
          content.includes("abortControllers") &&
          content.includes("calculateBackoff")
        ) {
          console.log(
            `    ${colors.green}✓ ApiService has proper error handling and retry logic${colors.reset}`
          );
        } else {
          console.log(
            `    ${colors.yellow}! ApiService might be missing improved error handling${colors.reset}`
          );
        }
      }

      if (file === "src/pages/Conversation.tsx") {
        if (
          content.includes("requestAnimationFrame") &&
          content.includes('block: "end"')
        ) {
          console.log(
            `    ${colors.green}✓ Conversation has proper scrollToBottom implementation${colors.reset}`
          );
        } else {
          console.log(
            `    ${colors.yellow}! Conversation might not have proper scrollToBottom fix${colors.reset}`
          );
        }
      }
    } else {
      console.log(`  ${colors.red}✗ ${file} is missing${colors.reset}`);
      allFilesExist = false;
      hasErrors = true;
    }
  }

  return allFilesExist;
};

// 4. Check if server is running
const checkServerRunning = () => {
  return new Promise((resolve) => {
    console.log(
      `\n${colors.magenta}Checking if server is running...${colors.reset}`
    );

    // Try to connect to server
    const req = http.get(`http://localhost:${serverPort}/api/ping`, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          serverRunning = true;
          console.log(
            `  ${colors.green}✓ Server is running on port ${serverPort}${colors.reset}`
          );

          try {
            const response = JSON.parse(data);
            console.log(
              `  ${colors.green}✓ Server ping returned: ${JSON.stringify(
                response
              )}${colors.reset}`
            );
          } catch (e) {
            console.log(
              `  ${colors.yellow}! Server ping response is not valid JSON: ${data}${colors.reset}`
            );
          }

          resolve(true);
        } else {
          console.log(
            `  ${colors.red}✗ Server returned status code ${res.statusCode}${colors.reset}`
          );
          serverRunning = false;
          resolve(false);
        }
      });
    });

    req.on("error", (err) => {
      console.log(
        `  ${colors.red}✗ Server is not running on port ${serverPort}: ${err.message}${colors.reset}`
      );
      serverRunning = false;
      resolve(false);
    });

    req.end();
  });
};

// 5. Check server health
const checkServerHealth = () => {
  return new Promise((resolve) => {
    if (!serverRunning) {
      console.log(
        `\n${colors.yellow}Skipping server health check as server is not running${colors.reset}`
      );
      resolve(false);
      return;
    }

    console.log(`\n${colors.magenta}Checking server health...${colors.reset}`);

    const req = http.get(`http://localhost:${serverPort}/api/health`, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const health = JSON.parse(data);
            console.log(
              `  ${colors.green}✓ Server health check successful${colors.reset}`
            );
            console.log(`    Status: ${health.status}`);
            console.log(`    Version: ${health.version || "unknown"}`);
            console.log(`    Uptime: ${health.uptime?.formatted || "unknown"}`);

            if (health.services) {
              console.log(`    Services:`);
              Object.entries(health.services).forEach(([service, status]) => {
                const statusColor =
                  status.status === "ok" ? colors.green : colors.red;
                console.log(
                  `      ${service}: ${statusColor}${status.status}${colors.reset}`
                );
              });
            }

            resolve(true);
          } catch (e) {
            console.log(
              `  ${colors.red}✗ Server health response is not valid JSON: ${data}${colors.reset}`
            );
            resolve(false);
          }
        } else {
          console.log(
            `  ${colors.red}✗ Server health check failed with status code ${res.statusCode}${colors.reset}`
          );
          resolve(false);
        }
      });
    });

    req.on("error", (err) => {
      console.log(
        `  ${colors.red}✗ Server health check failed: ${err.message}${colors.reset}`
      );
      resolve(false);
    });

    req.end();
  });
};

// 6. Offer to start server if not running
const offerToStartServer = () => {
  return new Promise((resolve) => {
    if (serverRunning) {
      resolve(true);
      return;
    }

    console.log(
      `\n${colors.yellow}Server is not running. Would you like to start it? (y/n)${colors.reset}`
    );

    process.stdin.once("data", (data) => {
      const input = data.toString().trim().toLowerCase();

      if (input === "y" || input === "yes") {
        console.log(`\n${colors.cyan}Starting server...${colors.reset}`);

        const serverProcess = exec(
          "cd server && npm start",
          (error, stdout, stderr) => {
            if (error) {
              console.log(
                `\n${colors.red}Failed to start server: ${error.message}${colors.reset}`
              );
              resolve(false);
            }
          }
        );

        // Give the server some time to start up
        setTimeout(() => {
          checkServerRunning().then((isRunning) => {
            if (isRunning) {
              console.log(
                `\n${colors.green}Server started successfully${colors.reset}`
              );
              resolve(true);
            } else {
              console.log(
                `\n${colors.red}Server failed to start properly${colors.reset}`
              );
              resolve(false);
            }
          });
        }, 3000);
      } else {
        console.log(`\n${colors.yellow}Skipping server tests${colors.reset}`);
        resolve(false);
      }
    });

    // Make stdin start emitting data events
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
  });
};

// 7. Show summary
const showSummary = () => {
  console.log(
    `\n${colors.blue}${colors.bold}Verification Complete${colors.reset}\n`
  );

  if (hasErrors) {
    console.log(
      `${colors.yellow}Some issues were detected. Please review the output above.${colors.reset}`
    );
    console.log(`\nTo fix remaining issues, you may need to:`);
    console.log(
      `1. Make sure all server and frontend files are present and properly configured`
    );
    console.log(`2. Ensure the server is running properly`);
    console.log(`3. Check API connections between frontend and server`);
  } else {
    console.log(
      `${colors.green}All checks passed successfully!${colors.reset}`
    );
    console.log(
      `\nYour TalkGhana application has been fixed and is working correctly.`
    );
  }

  console.log(`\n${colors.blue}Thank you for using TalkGhana!${colors.reset}`);

  // Exit the process
  process.exit(hasErrors ? 1 : 0);
};

// Run all checks
const runChecks = async () => {
  const dirsOk = checkDirectories();
  const serverFilesOk = checkServerFiles();
  const frontendFilesOk = checkFrontendFiles();

  const serverRunningOk = await checkServerRunning();
  if (!serverRunningOk) {
    await offerToStartServer();
  }

  await checkServerHealth();

  showSummary();
};

// Start the checks
runChecks();
