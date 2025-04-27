const fs = require("fs");
const path = require("path");

const conversationPath = path.join(__dirname, "src/pages/Conversation.tsx");
if (fs.existsSync(conversationPath)) {
  let content = fs.readFileSync(conversationPath, "utf8");

  // Find and fix the syntax error
  const errorPattern =
    /return \(\) => window\.removeEventListener\('resize', checkIfMobile\); else {/;
  if (errorPattern.test(content)) {
    // This is the corrupted code - replace the entire checkIfMobile function and useEffect
    const badCodePattern =
      /useEffect\(\s*\(\s*\)\s*=>\s*{[\s\S]*?const checkIfMobile[\s\S]*?}\s*,\s*\[\s*\]\s*\);/;

    const fixedCode = `useEffect(() => {
    const checkIfMobile = () => {
      setCompactMode(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);`;

    content = content.replace(badCodePattern, fixedCode);

    fs.writeFileSync(conversationPath, content);
    console.log("Fixed syntax error in Conversation.tsx");
  } else {
    console.log("No syntax error found or pattern does not match.");

    // Try an alternative approach - replace the entire useEffect for mobile detection
    let lines = content.split("\n");
    let startLine = -1;
    let endLine = -1;

    // Find the problematic useEffect block
    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].includes("useEffect") &&
        lines[i + 1]?.includes("checkIfMobile")
      ) {
        startLine = i;
      }
      if (startLine !== -1 && lines[i].includes("}, [])")) {
        endLine = i;
        break;
      }
    }

    if (startLine !== -1 && endLine !== -1) {
      const newCode = [
        "  useEffect(() => {",
        "    const checkIfMobile = () => {",
        "      setCompactMode(window.innerWidth < 768);",
        "    };",
        "    ",
        "    // Initial check",
        "    checkIfMobile();",
        "    ",
        "    // Add resize listener",
        "    window.addEventListener('resize', checkIfMobile);",
        "    ",
        "    // Cleanup",
        "    return () => window.removeEventListener('resize', checkIfMobile);",
        "  }, []);",
      ];

      // Replace the problematic lines
      lines.splice(startLine, endLine - startLine + 1, ...newCode);

      // Write back the file
      fs.writeFileSync(conversationPath, lines.join("\n"));
      console.log("Fixed mobile detection useEffect in Conversation.tsx");
    } else {
      console.log("Could not locate the exact mobile detection code block.");
    }
  }
} else {
  console.log("Conversation.tsx file not found");
}
