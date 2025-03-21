// Command categories used throughout the application
export const COMMAND_CATEGORIES = {
  EMERGENCY: 'emergency',
  DAILY_NEEDS: 'daily',
  CONVERSATIONS: 'conversations',
  CUSTOM: 'custom'
};

// Type for voice commands
export interface VoiceCommand {
  id: string;
  text: string;
  icon: string;
  category: string;
  isCustom?: boolean;
}
