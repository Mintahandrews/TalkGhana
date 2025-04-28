import React, { useEffect, useState } from "react";
import { registerWebComponents } from "../web";
import { useLanguage } from "../../hooks/useLanguage";
import { GhanaianLanguage } from "../../types";

/**
 * This component demonstrates how to use the LocalizedElement Web Component
 * within a React application, showing how it automatically updates when
 * the language changes.
 */
export const WebComponentDemo: React.FC = () => {
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [registered, setRegistered] = useState(false);

  // Register web components when the component mounts
  useEffect(() => {
    registerWebComponents();
    setRegistered(true);
  }, []);

  // Handle language change
  const handleLanguageChange = (newLang: GhanaianLanguage) => {
    setCurrentLanguage(newLang);
  };

  if (!registered) {
    return <div>Loading web components...</div>;
  }

  return (
    <div className="web-component-demo">
      <h2>Web Component Demo</h2>
      <p>
        This demonstrates how Web Components can work with the language system:
      </p>

      <div className="language-selector">
        <label htmlFor="language-select">Select Language: </label>
        <select
          id="language-select"
          value={currentLanguage}
          onChange={(e) =>
            handleLanguageChange(e.target.value as GhanaianLanguage)
          }
        >
          <option value="english">English</option>
          <option value="twi">Twi</option>
          <option value="ga">Ga</option>
          <option value="ewe">Ewe</option>
          <option value="dagbani">Dagbani</option>
          <option value="hausa">Hausa</option>
        </select>
      </div>

      <div className="component-examples">
        <h3>Web Component Examples:</h3>

        <div className="example">
          <p>
            <strong>Standard:</strong>
          </p>
          <localized-text data-i18n="greeting"></localized-text>
        </div>

        <div className="example">
          <p>
            <strong>Uppercase:</strong>
          </p>
          <localized-text
            data-i18n="welcome"
            data-format="uppercase"
          ></localized-text>
        </div>

        <div className="example">
          <p>
            <strong>Lowercase:</strong>
          </p>
          <localized-text
            data-i18n="appTitle"
            data-format="lowercase"
          ></localized-text>
        </div>

        <div className="example">
          <p>
            <strong>Capitalized:</strong>
          </p>
          <localized-text
            data-i18n="language"
            data-format="capitalize"
          ></localized-text>
        </div>
      </div>

      <p className="note">
        Note: The Web Component automatically updates when the language changes
        without requiring a React re-render.
      </p>
    </div>
  );
};

export default WebComponentDemo;
