#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}      ESPnet Cleanup Script for TalkGhana          ${NC}"
echo -e "${BLUE}===================================================${NC}"

# Function to ask for confirmation
confirm() {
    read -p "$(echo -e $YELLOW"$1 [y/N]: "$NC)" choice
    case "$choice" in
        y|Y ) return 0;;
        * ) return 1;;
    esac
}

# Check if we're in the right directory
if [ ! -d "src" ] || [ ! -d "scripts" ]; then
    echo -e "${RED}Error: This script must be run from the TalkGhana project root directory.${NC}"
    exit 1
fi

# Begin main cleanup
echo -e "\n${YELLOW}Beginning ESPnet cleanup...${NC}"

# 1. Organize ESPnet model directory structure
if [ -d "src/espnet/models" ]; then
    echo -e "\n${GREEN}Organizing ESPnet model directory structure...${NC}"
    
    # Ensure proper directories exist
    mkdir -p src/espnet/models/asr/english
    mkdir -p src/espnet/models/asr/twi
    mkdir -p src/espnet/models/asr/ga
    mkdir -p src/espnet/models/asr/ewe
    mkdir -p src/espnet/models/asr/hausa
    
    mkdir -p src/espnet/models/tts/english
    mkdir -p src/espnet/models/tts/twi
    mkdir -p src/espnet/models/tts/ga
    mkdir -p src/espnet/models/tts/ewe
    mkdir -p src/espnet/models/tts/hausa
    
    # Find and remove any placeholder files
    find src/espnet -name "*.placeholder" -type f -exec rm -f {} \;
    
    echo -e "${GREEN}ESPnet model directory structure organized.${NC}"
else
    echo -e "${YELLOW}Creating ESPnet model directory structure...${NC}"
    mkdir -p src/espnet/models/asr/{english,twi,ga,ewe,hausa}
    mkdir -p src/espnet/models/tts/{english,twi,ga,ewe,hausa}
    echo -e "${GREEN}ESPnet model directory structure created.${NC}"
fi

# 2. Check for and organize configuration files
echo -e "\n${GREEN}Checking ESPnet configuration files...${NC}"

# Create config files for each language if they don't exist
for MODEL_TYPE in "asr" "tts"; do
    for LANGUAGE in "english" "twi" "ga" "ewe" "hausa"; do
        CONFIG_DIR="src/espnet/models/$MODEL_TYPE/$LANGUAGE"
        CONFIG_FILE="$CONFIG_DIR/config.json"
        
        if [ ! -f "$CONFIG_FILE" ]; then
            echo -e "${YELLOW}Creating config for $LANGUAGE $MODEL_TYPE...${NC}"
            
            # Create config directory if it doesn't exist
            mkdir -p "$CONFIG_DIR"
            
            # Create a basic config template
            cat > "$CONFIG_FILE" << EOF
{
  "language": "$LANGUAGE",
  "model_type": "$MODEL_TYPE",
  "description": "$LANGUAGE $MODEL_TYPE model",
  "source": "",
  "placeholder": true,
  "created": "$(date)"
}
EOF
        fi
    done
done

# 3. Clean up any temporary ESPnet files
echo -e "\n${GREEN}Cleaning up temporary ESPnet files...${NC}"
find src/espnet -name "*.tmp" -type f -delete
find src/espnet -name "*.bak" -type f -delete
find src/espnet -name "*.log" -type f -delete
echo -e "${GREEN}Temporary files cleaned up.${NC}"

# 4. Ask about removing placeholder model files
if confirm "Do you want to remove placeholder ESPnet model files? (They will be downloaded as needed)"; then
    find src/espnet/models -name "model.pth" -type f -size -10k -delete
    echo -e "${GREEN}Placeholder model files removed.${NC}"
fi

# 5. Create a README for the ESPnet directory if it doesn't exist
if [ ! -f "src/espnet/README.md" ]; then
    echo -e "\n${GREEN}Creating ESPnet README file...${NC}"
    cat > "src/espnet/README.md" << 'EOF'
# ESPnet Integration for TalkGhana

This directory contains the ESPnet integration files for TalkGhana's speech processing capabilities.

## Directory Structure

```
models/
├── asr/              # Automatic Speech Recognition models
│   ├── english/
│   ├── twi/
│   ├── ga/
│   ├── ewe/
│   └── hausa/
└── tts/              # Text-to-Speech models
    ├── english/
    ├── twi/
    ├── ga/
    ├── ewe/
    └── hausa/
```

## Usage

Models are loaded dynamically when needed by the application. Placeholder configurations are included for development, but real models should be used in production.

To add a new model:
1. Place the model file in the appropriate directory
2. Update the config.json file with the model details
3. Restart the application

## Model Sources

- English models: Based on LibriSpeech (ASR) and LJSpeech (TTS)
- Ghanaian language models: Custom trained using the TalkGhana training tools

For more information, see the main [README-ESPNET.md](../../README-ESPNET.md) file.
EOF
    echo -e "${GREEN}ESPnet README created.${NC}"
fi

# 6. Check and validate scripts
echo -e "\n${GREEN}Validating ESPnet scripts...${NC}"

# Check if the setup script exists
if [ -f "scripts/setup_espnet.sh" ]; then
    echo -e "${GREEN}Found ESPnet setup script.${NC}"
    # Make it executable if it's not
    chmod +x scripts/setup_espnet.sh
else
    echo -e "${YELLOW}ESPnet setup script not found. Creating a basic script...${NC}"
    cat > "scripts/setup_espnet.sh" << 'EOF'
#!/bin/bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}      ESPnet Integration Setup for TalkGhana       ${NC}"
echo -e "${BLUE}===================================================${NC}"

# Create the ESPnet model directories
mkdir -p src/espnet/models/asr/{english,twi,ga,ewe,hausa}
mkdir -p src/espnet/models/tts/{english,twi,ga,ewe,hausa}

# Create placeholder configs
for MODEL_TYPE in "asr" "tts"; do
    for LANGUAGE in "english" "twi" "ga" "ewe" "hausa"; do
        CONFIG_DIR="src/espnet/models/$MODEL_TYPE/$LANGUAGE"
        CONFIG_FILE="$CONFIG_DIR/config.json"
        
        # Create a basic config template
        cat > "$CONFIG_FILE" << EOC
{
  "language": "$LANGUAGE",
  "model_type": "$MODEL_TYPE",
  "description": "$LANGUAGE $MODEL_TYPE model",
  "source": "",
  "placeholder": true,
  "created": "$(date)"
}
EOC
    done
done

echo -e "${GREEN}ESPnet integration setup complete.${NC}"
echo -e "${YELLOW}Note: This script created placeholder configurations only.${NC}"
echo -e "${YELLOW}To use actual models, please follow the instructions in README-ESPNET.md${NC}"
EOF
    chmod +x scripts/setup_espnet.sh
    echo -e "${GREEN}Basic ESPnet setup script created.${NC}"
fi

# 7. Update .env file to ensure ESPnet integration is enabled
if [ -f ".env" ]; then
    if ! grep -q "VITE_ENABLE_ESPNET=" .env; then
        echo -e "\n${GREEN}Adding ESPnet configuration to .env file...${NC}"
        echo -e "\n# ESPnet Integration" >> .env
        echo "VITE_ENABLE_ESPNET=true" >> .env
        echo "VITE_ESPNET_API_URL=/api/espnet" >> .env
        echo -e "${GREEN}ESPnet configuration added to .env file.${NC}"
    else
        echo -e "${GREEN}ESPnet configuration already exists in .env file.${NC}"
    fi
fi

# 8. Create the ESPnet integration utility if it doesn't exist
if [ ! -f "src/utils/ESPnetIntegration.ts" ]; then
    echo -e "\n${GREEN}Creating ESPnet integration utility...${NC}"
    mkdir -p src/utils
    cat > "src/utils/ESPnetIntegration.ts" << 'EOF'
/**
 * ESPnetIntegration.ts
 * 
 * This utility manages the ESPnet integration for TalkGhana,
 * providing a clean interface for using ESPnet models for
 * speech recognition and text-to-speech capabilities.
 */

import { GhanaianLanguage } from '../types';

// Check if ESPnet integration is enabled in environment variables
const ESPNET_ENABLED = import.meta.env.VITE_ENABLE_ESPNET === 'true';
const ESPNET_API_URL = import.meta.env.VITE_ESPNET_API_URL || '/api/espnet';

// Language model paths for each supported language
const ESPnetModelPaths = {
  asr: {
    english: 'english',
    twi: 'twi',
    ga: 'ga',
    ewe: 'ewe',
    hausa: 'hausa',
  },
  tts: {
    english: 'english',
    twi: 'twi',
    ga: 'ga',
    ewe: 'ewe',
    hausa: 'hausa',
  }
};

// Check if ESPnet is available for use
export const isESPnetAvailable = (): boolean => {
  return ESPNET_ENABLED;
};

// Interface for ESPnet TTS options
export interface ESPnetTTSOptions {
  text: string;
  language: GhanaianLanguage;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: 'wav' | 'mp3';
}

// Interface for ESPnet ASR options
export interface ESPnetASROptions {
  audioData: Blob | File;
  language: GhanaianLanguage;
  format?: string;
}

/**
 * Synthesize speech using ESPnet TTS
 * @param options TTS options
 * @returns URL to the generated audio
 */
export const synthesizeSpeech = async (options: ESPnetTTSOptions): Promise<string> => {
  if (!isESPnetAvailable()) {
    throw new Error('ESPnet integration is not enabled');
  }

  try {
    const response = await fetch(`${ESPNET_API_URL}/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: options.text,
        language: options.language,
        speed: options.speed || 1.0,
        pitch: options.pitch || 1.0,
        volume: options.volume || 1.0,
        format: options.format || 'mp3',
      }),
    });

    if (!response.ok) {
      throw new Error(`ESPnet API error: ${response.status}`);
    }

    // Create blob URL for the audio
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error in ESPnet speech synthesis:', error);
    throw error;
  }
};

/**
 * Recognize speech using ESPnet ASR
 * @param options ASR options
 * @returns Recognized text
 */
export const recognizeSpeech = async (options: ESPnetASROptions): Promise<string> => {
  if (!isESPnetAvailable()) {
    throw new Error('ESPnet integration is not enabled');
  }

  try {
    const formData = new FormData();
    formData.append('audio', options.audioData);
    formData.append('language', options.language);
    
    if (options.format) {
      formData.append('format', options.format);
    }

    const response = await fetch(`${ESPNET_API_URL}/recognize`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ESPnet API error: ${response.status}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error('Error in ESPnet speech recognition:', error);
    throw error;
  }
};

/**
 * Check if models are available for a specific language
 * @param language Language to check
 * @param modelType Type of model to check (asr or tts)
 * @returns Promise resolving to true if model is available
 */
export const checkModelAvailability = async (
  language: GhanaianLanguage,
  modelType: 'asr' | 'tts'
): Promise<boolean> => {
  if (!isESPnetAvailable()) {
    return false;
  }

  try {
    const response = await fetch(`${ESPNET_API_URL}/check-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language,
        modelType,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.available;
  } catch (error) {
    console.error('Error checking model availability:', error);
    return false;
  }
};

/**
 * Get a list of available models
 * @returns Promise resolving to an object with available models
 */
export const getAvailableModels = async (): Promise<{
  asr: GhanaianLanguage[];
  tts: GhanaianLanguage[];
}> => {
  if (!isESPnetAvailable()) {
    return { asr: [], tts: [] };
  }

  try {
    const response = await fetch(`${ESPNET_API_URL}/available-models`);

    if (!response.ok) {
      throw new Error(`ESPnet API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting available models:', error);
    return { asr: [], tts: [] };
  }
};

export default {
  isESPnetAvailable,
  synthesizeSpeech,
  recognizeSpeech,
  checkModelAvailability,
  getAvailableModels,
  ESPnetModelPaths,
};
EOF
    echo -e "${GREEN}ESPnet integration utility created.${NC}"
fi

echo -e "\n${BLUE}===================================================${NC}"
echo -e "${GREEN}ESPnet cleanup and organization completed!${NC}"
echo -e "${BLUE}===================================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Run ${GREEN}./scripts/setup_espnet.sh${NC} to set up ESPnet integration"
echo -e "2. For training custom models, see ${GREEN}README-GHANAIAN-TRAINING.md${NC}"
echo -e "3. Check ${GREEN}README-ESPNET.md${NC} for more information about the ESPnet integration" 