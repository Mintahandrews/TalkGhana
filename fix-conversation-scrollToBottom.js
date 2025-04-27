const fs = require("fs");
const path = require("path");

const conversationPath = path.join(__dirname, "src/pages/Conversation.tsx");
if (fs.existsSync(conversationPath)) {
  let content = fs.readFileSync(conversationPath, "utf8");

  // Check if the scrollToBottom function definition exists
  if (!content.includes("const scrollToBottom = useCallback(")) {
    console.log("Adding missing scrollToBottom function definition");

    // Find a good place to insert the scrollToBottom function - after the refs section
    const textInputRefLine = content.indexOf(
      "const textInputRef = useRef<HTMLTextAreaElement>(null);"
    );
    if (textInputRefLine !== -1) {
      const lineEndIndex = content.indexOf("\n", textInputRefLine) + 1;

      // Definition for scrollToBottom function
      const scrollToBottomDef = `
  // Scroll to bottom of conversation history
  const scrollToBottom = useCallback(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
`;

      // Insert the definition
      content =
        content.slice(0, lineEndIndex) +
        scrollToBottomDef +
        content.slice(lineEndIndex);

      // Write the updated file
      fs.writeFileSync(conversationPath, content);
      console.log("Added scrollToBottom function to Conversation.tsx");
    } else {
      console.log(
        "Could not find appropriate insertion point for scrollToBottom function"
      );
    }
  } else {
    console.log("scrollToBottom function already exists, no changes needed");
  }
} else {
  console.log("Conversation.tsx file not found");
}
