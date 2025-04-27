import { useEffect, DependencyList } from "react";
import { useLanguage } from "../context/LanguageContext";

/**
 * A custom hook that runs an effect when the language changes
 *
 * @param effect Function to run when language changes
 * @param deps Additional dependencies for the effect
 */
function useLanguageEffect(
  effect: (language: string) => void | (() => void),
  deps: DependencyList = []
): void {
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    return effect(currentLanguage);
  }, [currentLanguage, effect, ...deps]);
}

export default useLanguageEffect;
