import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { COMMAND_CATEGORIES, VoiceCommand } from '../constants/commandCategories';
import { useUserPreferences } from '../context/UserPreferencesContext';

// Common emoji sets for different categories
const CATEGORY_EMOJIS = {
  [COMMAND_CATEGORIES.EMERGENCY]: ['🆘', '🚨', '🚑', '⚠️', '❗', '🔴', '😣'],
  [COMMAND_CATEGORIES.DAILY_NEEDS]: ['🍽️', '💧', '🚻', '💊', '🛌', '👕', '❄️', '🔥'],
  [COMMAND_CATEGORIES.CONVERSATIONS]: ['👍', '👎', '✅', '❌', '🙏', '👋', '😊', '🤔'],
  [COMMAND_CATEGORIES.CUSTOM]: ['📝', '🔧', '🛠️', '📌', '🔍', '📢', '💬', '🎯']
};

interface CommandEditorProps {
  command: VoiceCommand | null;
  onSave: (command: VoiceCommand) => void;
  onCancel: () => void;
}

const CommandEditor: React.FC<CommandEditorProps> = ({ command, onSave, onCancel }) => {
  const { preferences } = useUserPreferences();
  const [text, setText] = useState(command?.text || '');
  const [icon, setIcon] = useState(command?.icon || '');
  const [category, setCategory] = useState(command?.category || COMMAND_CATEGORIES.CUSTOM);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Set initial values when command changes
  useEffect(() => {
    if (command) {
      setText(command.text);
      setIcon(command.icon);
      setCategory(command.category);
    } else {
      setText('');
      setIcon('');
      setCategory(COMMAND_CATEGORIES.CUSTOM);
    }
  }, [command]);
  
  const handleSave = () => {
    if (!text.trim()) {
      alert('Command text is required');
      return;
    }
    
    if (!icon) {
      alert('Please select an icon');
      return;
    }
    
    onSave({
      id: command?.id || '',
      text: text.trim(),
      icon,
      category,
      isCustom: true
    });
  };
  
  const handleEmojiSelect = (emoji: string) => {
    setIcon(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={`p-6 rounded-lg shadow-md ${
      preferences.highContrast ? 'bg-gray-800 text-white' : 'bg-white'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {command ? 'Edit Command' : 'Create New Command'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
          aria-label="Cancel"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="command-text">
            Command Text
          </label>
          <input
            id="command-text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you want to say..."
            className={`w-full p-3 border rounded-lg ${
              preferences.highContrast
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Icon
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-16 h-16 flex items-center justify-center text-3xl border rounded-lg ${
                preferences.highContrast
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
            >
              {icon || 'Select'}
            </button>
            <div className="flex-1">
              <p className="text-sm text-gray-500">
                Select an emoji that represents this command
              </p>
            </div>
          </div>
          
          {showEmojiPicker && (
            <div className={`mt-2 p-3 border rounded-lg grid grid-cols-8 gap-2 ${
              preferences.highContrast
                ? 'bg-gray-700 border-gray-600'
                : 'bg-white border-gray-300'
            }`}>
              {CATEGORY_EMOJIS[category].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`text-2xl p-2 rounded-lg ${
                    preferences.highContrast
                      ? 'hover:bg-gray-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
              {/* Common emojis that might be useful */}
              {['👍', '👎', '👋', '🙌', '👏', '🤝', '✋', '👆'].map((emoji, index) => (
                <button
                  key={`common-${index}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`text-2xl p-2 rounded-lg ${
                    preferences.highContrast
                      ? 'hover:bg-gray-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full p-3 border rounded-lg capitalize ${
              preferences.highContrast
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          >
            {Object.values(COMMAND_CATEGORIES).map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className={`px-4 py-2 rounded-lg ${
            preferences.highContrast
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg flex items-center ${
            preferences.highContrast
              ? 'bg-blue-700 text-white hover:bg-blue-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <Save size={16} className="mr-1" />
          Save Command
        </button>
      </div>
    </div>
  );
};

export default CommandEditor;
