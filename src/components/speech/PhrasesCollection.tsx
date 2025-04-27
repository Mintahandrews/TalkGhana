import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import useTTS from "../../hooks/useTTS";

type PhraseCategory =
  | "greetings"
  | "needs"
  | "medical"
  | "questions"
  | "emergency"
  | "custom"
  | "cultural"
  | "market"
  | "proverbs";

interface Phrase {
  id: string;
  text: string;
  language: string;
  category: PhraseCategory;
  isFavorite: boolean;
  lastUsed?: Date;
  audioCache?: Blob;
  translation?: string;
}

interface PhrasesCollectionProps {
  onPhraseSelect?: (phrase: Phrase) => void;
  showCategories?: boolean;
  initialCategory?: PhraseCategory;
  maxPhrasesPerCategory?: number;
  showFavoritesOnly?: boolean;
  className?: string;
  showTranslations?: boolean;
}

const DEFAULT_PHRASES: Record<
  PhraseCategory,
  Record<string, string | { text: string; translation: string }>
> = {
  greetings: {
    twi: "Mema wo akye",
    ga: "Ojekoo",
    ewe: "Ŋdi na mi",
    dagbani: "Dasiba",
    hausa: "Sannu",
    english: "Good morning",
  },
  needs: {
    twi: "Me pɛ nsuo",
    ga: "Miitao nu",
    ewe: "Medi tsi",
    dagbani: "N bora kom",
    hausa: "Ina son ruwa",
    english: "I need water",
  },
  medical: {
    twi: "Me ho mfa me",
    ga: "Mitsɔmɔ hewalɛ",
    ewe: "Mele dɔ lém",
    dagbani: "N ti bi",
    hausa: "Ba ni da lafiya",
    english: "I am not feeling well",
  },
  questions: {
    twi: "Wo din de sɛn?",
    ga: "Mɛni ji ogbɛi?",
    ewe: "Ŋkɔwò ɖe?",
    dagbani: "A yuuli?",
    hausa: "Mene ne sunanka?",
    english: "What is your name?",
  },
  emergency: {
    twi: "Me hia mmoa",
    ga: "Miihia yelikɛbuamɔ",
    ewe: "Mehiã kpekpeɖeŋu",
    dagbani: "N bora sɔŋsim",
    hausa: "Ina bukatar taimako",
    english: "I need help",
  },
  cultural: {
    twi: {
      text: "Akwaaba",
      translation: "Welcome",
    },
    ga: {
      text: "Abɔkɛ",
      translation: "Welcome/We receive you",
    },
    ewe: {
      text: "Woezo",
      translation: "Welcome",
    },
    hausa: {
      text: "Barka da asuba",
      translation: "Good morning",
    },
    english: {
      text: "You are welcome",
      translation: "A common response to thanks in Ghana",
    },
  },
  market: {
    twi: {
      text: "Ɛyɛ sɛn?",
      translation: "How much is it?",
    },
    ga: {
      text: "Nɛ je ni?",
      translation: "How much is it?",
    },
    ewe: {
      text: "Esia xɔ nenie?",
      translation: "How much does this cost?",
    },
    hausa: {
      text: "Nawa ne?",
      translation: "How much is it?",
    },
    english: {
      text: "Please reduce the price",
      translation: "Bargaining is common in Ghanaian markets",
    },
  },
  proverbs: {
    twi: {
      text: "Tiri nkwa, na yɛmfa nto akyene mu",
      translation: "Life is valuable and should not be risked carelessly",
    },
    ga: {
      text: "Kɛ mɔ ko fee gbeɔ, esha ekome fɔŋ",
      translation:
        "If everyone sweeps in front of their house, the whole village will be clean",
    },
    ewe: {
      text: "Ne ame aɖe xɔ agbe la, ekemɛ hã axɔe",
      translation: "If one person is saved, then the other will also be saved",
    },
    hausa: {
      text: "Hakuri maganin duniya",
      translation: "Patience is the cure for the world",
    },
    english: {
      text: "The elder who sits under the big tree speaks wisdom",
      translation: "A Ghanaian saying about respecting elders' wisdom",
    },
  },
  custom: {
    english: "Add your own phrase",
  },
};

// Colors for different categories
const CATEGORY_COLORS: Record<PhraseCategory, string> = {
  greetings: "bg-blue-100 border-blue-300 text-blue-800",
  needs: "bg-green-100 border-green-300 text-green-800",
  medical: "bg-red-100 border-red-300 text-red-800",
  questions: "bg-purple-100 border-purple-300 text-purple-800",
  emergency: "bg-orange-100 border-orange-300 text-orange-800",
  cultural: "bg-amber-100 border-amber-300 text-amber-800",
  market: "bg-cyan-100 border-cyan-300 text-cyan-800",
  proverbs: "bg-indigo-100 border-indigo-300 text-indigo-800",
  custom: "bg-gray-100 border-gray-300 text-gray-800",
};

// Category icons (simplified for this example)
const CATEGORY_ICONS: Record<PhraseCategory, React.ReactNode> = {
  greetings: <span>👋</span>,
  needs: <span>🥄</span>,
  medical: <span>🏥</span>,
  questions: <span>❓</span>,
  emergency: <span>🚨</span>,
  cultural: <span>🏛️</span>,
  market: <span>🛒</span>,
  proverbs: <span>🦉</span>,
  custom: <span>✏️</span>,
};

// Category labels with descriptions
const CATEGORY_LABELS: Record<
  PhraseCategory,
  { name: string; description: string }
> = {
  greetings: {
    name: "Greetings",
    description: "Everyday greetings and pleasantries",
  },
  needs: {
    name: "Basic Needs",
    description: "Express basic needs like hunger or thirst",
  },
  medical: {
    name: "Medical",
    description: "Health-related phrases and symptoms",
  },
  questions: {
    name: "Questions",
    description: "Common questions to ask others",
  },
  emergency: {
    name: "Emergency",
    description: "Urgent help and emergency phrases",
  },
  cultural: {
    name: "Cultural",
    description: "Traditional Ghanaian cultural expressions",
  },
  market: {
    name: "Market",
    description: "Phrases for shopping and bargaining",
  },
  proverbs: {
    name: "Proverbs",
    description: "Traditional wisdom and sayings",
  },
  custom: {
    name: "Custom",
    description: "Your personal phrases",
  },
};

const PhrasesCollection: React.FC<PhrasesCollectionProps> = ({
  onPhraseSelect,
  showCategories = true,
  initialCategory = "greetings",
  maxPhrasesPerCategory = 5,
  showFavoritesOnly = false,
  className = "",
  showTranslations = true,
}) => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<PhraseCategory>(initialCategory);
  const [customPhrase, setCustomPhrase] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { currentLanguage } = useLanguage();
  const { speak, isSpeaking } = useTTS();

  // Generate initial phrases from the default phrases
  useEffect(() => {
    const initialPhrases: Phrase[] = [];
    Object.entries(DEFAULT_PHRASES).forEach(([category, languagePhrases]) => {
      Object.entries(languagePhrases).forEach(([language, textOrObject]) => {
        // Handle both string phrases and object phrases with translations
        if (typeof textOrObject === "string") {
          initialPhrases.push({
            id: `${category}-${language}-${Date.now()}`,
            text: textOrObject,
            language,
            category: category as PhraseCategory,
            isFavorite: false,
          });
        } else if (typeof textOrObject === "object") {
          initialPhrases.push({
            id: `${category}-${language}-${Date.now()}`,
            text: textOrObject.text,
            translation: textOrObject.translation,
            language,
            category: category as PhraseCategory,
            isFavorite: false,
          });
        }
      });
    });

    // Load any saved phrases from localStorage
    try {
      const savedPhrases = localStorage.getItem("savedPhrases");
      if (savedPhrases) {
        const parsedPhrases: Phrase[] = JSON.parse(savedPhrases);
        // Merge saved phrases with default phrases, prioritizing saved ones
        const mergedPhrases = [...initialPhrases];

        parsedPhrases.forEach((savedPhrase) => {
          const index = mergedPhrases.findIndex(
            (p) =>
              p.category === savedPhrase.category &&
              p.language === savedPhrase.language
          );

          if (index !== -1) {
            mergedPhrases[index] = savedPhrase;
          } else {
            mergedPhrases.push(savedPhrase);
          }
        });

        setPhrases(mergedPhrases);
      } else {
        setPhrases(initialPhrases);
      }
    } catch (error) {
      console.error("Failed to load saved phrases:", error);
      setPhrases(initialPhrases);
    }
  }, []);

  // Save phrases to localStorage when they change
  useEffect(() => {
    if (phrases.length > 0) {
      try {
        localStorage.setItem("savedPhrases", JSON.stringify(phrases));
      } catch (error) {
        console.error("Failed to save phrases:", error);
      }
    }
  }, [phrases]);

  // Filter phrases based on selected category, language, search query, and favorites filter
  useEffect(() => {
    let filtered = phrases.filter(
      (phrase) =>
        (selectedCategory === "custom" ||
          phrase.category === selectedCategory) &&
        (showFavoritesOnly ? phrase.isFavorite : true) &&
        phrase.language === currentLanguage
    );

    // Apply search filter if there's a query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (phrase) =>
          phrase.text.toLowerCase().includes(query) ||
          phrase.translation?.toLowerCase().includes(query)
      );
    }

    // Limit to max phrases per category
    if (maxPhrasesPerCategory > 0 && !showFavoritesOnly && !searchQuery) {
      filtered = filtered.slice(0, maxPhrasesPerCategory);
    }

    setFilteredPhrases(filtered);
  }, [
    phrases,
    selectedCategory,
    currentLanguage,
    showFavoritesOnly,
    maxPhrasesPerCategory,
    searchQuery,
  ]);

  // Toggle phrase favorite status
  const toggleFavorite = useCallback((id: string) => {
    setPhrases((prevPhrases) =>
      prevPhrases.map((phrase) =>
        phrase.id === id
          ? { ...phrase, isFavorite: !phrase.isFavorite }
          : phrase
      )
    );
  }, []);

  // Handle phrase selection
  const handlePhraseSelect = useCallback(
    (phrase: Phrase) => {
      // Update the last used timestamp
      setPhrases((prevPhrases) =>
        prevPhrases.map((p) =>
          p.id === phrase.id ? { ...p, lastUsed: new Date() } : p
        )
      );

      // Speak the phrase if a TTS function is available
      if (!isSpeaking) {
        speak(phrase.text);
      }

      // Call onPhraseSelect callback if provided
      if (onPhraseSelect) {
        onPhraseSelect(phrase);
      }
    },
    [onPhraseSelect, speak, isSpeaking]
  );

  // Add a custom phrase
  const addCustomPhrase = useCallback(() => {
    if (customPhrase.trim()) {
      const newPhrase: Phrase = {
        id: `custom-${currentLanguage}-${Date.now()}`,
        text: customPhrase.trim(),
        language: currentLanguage,
        category: "custom",
        isFavorite: false,
        lastUsed: new Date(),
      };

      setPhrases((prevPhrases) => [...prevPhrases, newPhrase]);
      setCustomPhrase("");
      setShowAddCustom(false);
    }
  }, [customPhrase, currentLanguage]);

  return (
    <div className={`w-full ${className}`}>
      {/* Search box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search phrases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          aria-label="Search for phrases"
        />
      </div>

      {/* Category selector */}
      {showCategories && (
        <div className="mb-4">
          <h3
            className="text-lg font-medium text-gray-700 mb-2"
            id="category-heading"
          >
            Categories
          </h3>
          <div
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
            role="radiogroup"
            aria-labelledby="category-heading"
          >
            {Object.entries(CATEGORY_LABELS).map(
              ([category, { name, description }]) => (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category as PhraseCategory)
                  }
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                    selectedCategory === category
                      ? CATEGORY_COLORS[category as PhraseCategory] +
                        " shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label={`Select ${name} category`}
                  aria-pressed={selectedCategory === category}
                  aria-describedby={`${category}-desc`}
                  role="radio"
                  aria-checked={selectedCategory === category}
                >
                  <div className="text-xl mb-1">
                    {CATEGORY_ICONS[category as PhraseCategory]}
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                  <span id={`${category}-desc`} className="sr-only">
                    {description}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Phrases list */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-700">
            {CATEGORY_LABELS[selectedCategory].name}
          </h3>
          {selectedCategory === "custom" && (
            <button
              onClick={() => setShowAddCustom(true)}
              className="text-sm px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
              aria-label="Add custom phrase"
            >
              + Add Phrase
            </button>
          )}
        </div>

        {filteredPhrases.length === 0 ? (
          <p className="text-center py-4 text-gray-500">
            {searchQuery
              ? "No matching phrases found. Try a different search."
              : "No phrases available. Try selecting a different category."}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredPhrases.map((phrase) => (
              <div
                key={phrase.id}
                className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500"
              >
                <div className="flex justify-between items-start">
                  <button
                    onClick={() => handlePhraseSelect(phrase)}
                    className="text-left flex-1 focus:outline-none"
                    aria-label={`Speak phrase: ${phrase.text}${
                      phrase.translation ? ` (${phrase.translation})` : ""
                    }`}
                  >
                    <p className="text-gray-800 font-medium">{phrase.text}</p>
                    {showTranslations && phrase.translation && (
                      <p className="text-gray-500 text-sm mt-1">
                        {phrase.translation}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => toggleFavorite(phrase.id)}
                    className={`ml-2 p-1 rounded-full ${
                      phrase.isFavorite
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-gray-400 hover:text-gray-500"
                    }`}
                    aria-label={
                      phrase.isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                    aria-pressed={phrase.isFavorite}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={phrase.isFavorite ? "currentColor" : "none"}
                      stroke="currentColor"
                      className="w-5 h-5"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={phrase.isFavorite ? "0" : "2"}
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add custom phrase dialog */}
        {showAddCustom && (
          <div
            className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
            role="dialog"
            aria-labelledby="add-phrase-heading"
          >
            <h4
              className="text-sm font-medium text-blue-800 mb-2"
              id="add-phrase-heading"
            >
              Add Custom Phrase
            </h4>
            <input
              type="text"
              value={customPhrase}
              onChange={(e) => setCustomPhrase(e.target.value)}
              placeholder="Enter your phrase..."
              className="w-full p-2 border border-gray-300 rounded-md mb-2"
              aria-label="Custom phrase text"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddCustom(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addCustomPhrase}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!customPhrase.trim()}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhrasesCollection;
