import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { MessageCircle, Settings, Command, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import NavLink from "./NavLink";
import MobileNavLink from "./MobileNavLink";

interface LayoutProps {
  children: React.ReactNode;
}

// Mobile tab navigation link component
const MobileTabLink = ({
  to,
  isActive,
  icon,
  label,
}: {
  to: string;
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
}) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center py-2 px-3 transition-colors ${
        isActive
          ? "text-blue-600 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-400"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const { theme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menu when changing routes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="app-layout min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header
        className={`app-header sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? "bg-white dark:bg-gray-800 shadow-md"
            : "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        }`}
      >
        <div className="header-content max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="logo flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-2">
              <MessageCircle className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              TalkGhana
            </h1>
          </Link>

          {isMobile ? (
            <div className="flex items-center space-x-2">
              <ThemeToggle className="theme-toggle" />
              <button
                ref={buttonRef}
                className="menu-toggle h-10 w-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={toggleMenu}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <ThemeToggle className="theme-toggle" />
              <nav className="desktop-nav flex space-x-1">
                <NavLink
                  to="/conversation"
                  isActive={
                    location.pathname === "/conversation" ||
                    location.pathname === "/"
                  }
                  icon={<MessageCircle size={18} />}
                  label="Conversation"
                />
                <NavLink
                  to="/voice-commands"
                  isActive={location.pathname === "/voice-commands"}
                  icon={<Command size={18} />}
                  label="Commands"
                />
                <NavLink
                  to="/settings"
                  isActive={location.pathname === "/settings"}
                  icon={<Settings size={18} />}
                  label="Settings"
                />
              </nav>
            </div>
          )}
        </div>

        {isMobile && (
          <div
            ref={menuRef}
            id="mobile-menu"
            className={`mobile-menu px-4 pb-4 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 overflow-hidden ${
              menuOpen ? "open" : "closed"
            }`}
            aria-hidden={!menuOpen}
          >
            <MobileNavLink
              to="/conversation"
              isActive={
                location.pathname === "/conversation" ||
                location.pathname === "/"
              }
              icon={<MessageCircle size={20} />}
              label="Conversation"
              onClick={() => setMenuOpen(false)}
            />
            <MobileNavLink
              to="/voice-commands"
              isActive={location.pathname === "/voice-commands"}
              icon={<Command size={20} />}
              label="Commands"
              onClick={() => setMenuOpen(false)}
            />
            <MobileNavLink
              to="/settings"
              isActive={location.pathname === "/settings"}
              icon={<Settings size={20} />}
              label="Settings"
              onClick={() => setMenuOpen(false)}
            />
          </div>
        )}
      </header>

      <main className="main-content flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {isMobile && (
        <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20 flex justify-around">
          <MobileTabLink
            to="/conversation"
            isActive={
              location.pathname === "/conversation" || location.pathname === "/"
            }
            icon={<MessageCircle size={24} />}
            label="Chat"
          />
          <MobileTabLink
            to="/voice-commands"
            isActive={location.pathname === "/voice-commands"}
            icon={<Command size={24} />}
            label="Commands"
          />
          <MobileTabLink
            to="/settings"
            isActive={location.pathname === "/settings"}
            icon={<Settings size={24} />}
            label="Settings"
          />
        </nav>
      )}
    </div>
  );
};

export default Layout;
