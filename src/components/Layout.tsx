import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Database,
  House,
  MessageSquare,
  Mic,
  Settings,
  Cpu,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import ConnectionStatus from "./ConnectionStatus";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { preferences } = useUserPreferences();

  // Determine if route is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`min-h-screen flex flex-col ${
        preferences.highContrast ? "bg-black text-white" : "bg-slate-50"
      } ${preferences.largeText ? "text-lg" : "text-base"}`}
    >
      <header className="p-4 bg-blue-600 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t("homeTitle")}</h1>
          <ConnectionStatus compact />
        </div>
      </header>

      {/* Connection status indicator with reconnect button */}
      <div
        className={`py-2 px-4 ${
          preferences.highContrast ? "bg-gray-900" : "bg-white"
        } border-b border-gray-200 shadow-sm`}
      >
        <div className="container mx-auto">
          <ConnectionStatus showReconnectButton />
        </div>
      </div>

      <main className="flex-1 container mx-auto p-4">{children}</main>

      <nav
        className={`py-2 px-4 border-t border-gray-200 ${
          preferences.highContrast ? "bg-gray-900" : "bg-white"
        } shadow-lg`}
      >
        <div className="container mx-auto">
          <ul className="flex justify-around">
            <li>
              <button
                onClick={() => navigate("/")}
                className={`flex flex-col items-center p-2 ${
                  isActive("/")
                    ? preferences.highContrast
                      ? "text-blue-400"
                      : "text-blue-600"
                    : preferences.highContrast
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-label={t("homeTitle")}
                aria-current={isActive("/") ? "page" : undefined}
              >
                <House size={24} />
                <span className="text-xs mt-1">{t("homeTitle")}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/conversation")}
                className={`flex flex-col items-center p-2 ${
                  isActive("/conversation")
                    ? preferences.highContrast
                      ? "text-blue-400"
                      : "text-blue-600"
                    : preferences.highContrast
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-label={t("conversationMode")}
                aria-current={isActive("/conversation") ? "page" : undefined}
              >
                <MessageSquare size={24} />
                <span className="text-xs mt-1">{t("conversationMode")}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/voice-commands")}
                className={`flex flex-col items-center p-2 ${
                  isActive("/voice-commands")
                    ? preferences.highContrast
                      ? "text-blue-400"
                      : "text-blue-600"
                    : preferences.highContrast
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-label={t("voiceCommands")}
                aria-current={isActive("/voice-commands") ? "page" : undefined}
              >
                <Mic size={24} />
                <span className="text-xs mt-1">{t("voiceCommands")}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/offline")}
                className={`flex flex-col items-center p-2 ${
                  isActive("/offline")
                    ? preferences.highContrast
                      ? "text-blue-400"
                      : "text-blue-600"
                    : preferences.highContrast
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-label={t("offlineMode")}
                aria-current={isActive("/offline") ? "page" : undefined}
              >
                <Database size={24} />
                <span className="text-xs mt-1">{t("offlineMode")}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/settings")}
                className={`flex flex-col items-center p-2 ${
                  isActive("/settings")
                    ? preferences.highContrast
                      ? "text-blue-400"
                      : "text-blue-600"
                    : preferences.highContrast
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-label={t("settings")}
                aria-current={isActive("/settings") ? "page" : undefined}
              >
                <Settings size={24} />
                <span className="text-xs mt-1">{t("settings")}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/training")}
                className={`flex flex-col items-center p-2 ${
                  isActive("/training")
                    ? preferences.highContrast
                      ? "text-blue-400"
                      : "text-blue-600"
                    : preferences.highContrast
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                aria-label="Training"
                aria-current={isActive("/training") ? "page" : undefined}
              >
                <Cpu size={24} />
                <span className="text-xs mt-1">Training</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
