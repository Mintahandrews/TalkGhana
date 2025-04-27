const fs = require("fs");
const path = require("path");

const layoutPath = path.join(__dirname, "src/components/Layout.tsx");
if (fs.existsSync(layoutPath)) {
  let content = fs.readFileSync(layoutPath, "utf8");

  // Check if the specific syntax error exists
  if (content.includes("}, []); children }: LayoutProps)")) {
    console.log("Found the syntax error in Layout.tsx");

    // Recreate the entire component from scratch to avoid partial fixes
    const newLayoutContent = `import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import ThemeToggle from './components/ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when changing routes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <div className="app-layout container">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>TalkGhana</h1>
          </Link>
          
          <ThemeToggle />
          
          {isMobile ? (
            <button 
              className="menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          ) : (
            <nav className="desktop-nav">
              <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                Conversation
              </Link>
              <Link to="/voice-commands" className={location.pathname === "/voice-commands" ? "active" : ""}>
                Commands
              </Link>
              <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>
                Settings
              </Link>
            </nav>
          )}
        </div>
        
        {isMobile && menuOpen && (
          <nav className="mobile-menu">
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>
              Conversation
            </Link>
            <Link to="/voice-commands" className={location.pathname === "/voice-commands" ? "active" : ""}>
              Commands
            </Link>
            <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>
              Settings
            </Link>
          </nav>
        )}
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      {isMobile && (
        <nav className="mobile-nav">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Conversation
          </Link>
          <Link to="/voice-commands" className={location.pathname === "/voice-commands" ? "active" : ""}>
            Commands
          </Link>
          <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>
            Settings
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Layout;
`;

    // Write the fixed file
    fs.writeFileSync(layoutPath, newLayoutContent);
    console.log("Fixed Layout.tsx with a completely rewritten component");
  } else {
    // If we don't find the exact error, but the file looks corrupted
    console.log(
      "The exact syntax error pattern was not found, performing general repair"
    );

    // Read the file contents line by line
    const lines = content.split("\n");
    let inComponentDef = false;
    let fixedLines = [];

    // Process each line, handling the component definition carefully
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for the component definition start
      if (line.includes("const Layout") && line.includes("LayoutProps")) {
        inComponentDef = true;
        fixedLines.push(
          "const Layout: React.FC<LayoutProps> = ({ children }) => {"
        );
        continue;
      }

      // Skip problematic lines if we've identified we're in the component definition
      if (
        inComponentDef &&
        (line.includes("children }:") || line.includes("}, []); children"))
      ) {
        inComponentDef = false;
        continue;
      }

      // Add all other lines
      fixedLines.push(line);
    }

    // Write the fixed content back
    fs.writeFileSync(layoutPath, fixedLines.join("\n"));
    console.log("Performed general repair on Layout.tsx");
  }
} else {
  console.log("Layout.tsx file not found");
}
