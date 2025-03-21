import React from 'react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useLanguage } from '../context/LanguageContext';

interface ConversationSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const ConversationSuggestions: React.FC<ConversationSuggestionsProps> = ({
  suggestions,
  onSuggestionClick
}) => {
  const { preferences } = useUserPreferences();
  const { t } = useLanguage();

  return (
    <div className="mb-4">
      <h2 className="text-md font-medium mb-2">{t('suggestions')}</h2>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className={`text-sm px-3 py-2 rounded-full ${
              preferences.highContrast
                ? 'bg-blue-800 text-white hover:bg-blue-700'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConversationSuggestions;
