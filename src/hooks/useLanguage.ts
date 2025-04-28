import { useContext } from "react";
import LanguageContext from "../contexts/LanguageContext";
import { GhanaianLanguage } from "../types";

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
