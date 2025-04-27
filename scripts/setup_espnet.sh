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

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  echo -e "\n${YELLOW}Activating virtual environment...${NC}"
  source venv/bin/activate
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}Python 3 not found. Please install Python 3.8 or later.${NC}"
  exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [ $PYTHON_MAJOR -lt 3 ] || ([ $PYTHON_MAJOR -eq 3 ] && [ $PYTHON_MINOR -lt 8 ]); then
  echo -e "${RED}Python 3.8 or later is required. Found: ${PYTHON_VERSION}${NC}"
  exit 1
fi

echo -e "${GREEN}Python version: ${PYTHON_VERSION}${NC}"

# Install ESPnet
echo -e "\n${YELLOW}Installing ESPnet...${NC}"
if [ ! -d "espnet" ]; then
  git clone https://github.com/espnet/espnet.git
  cd espnet
  # Install ESPnet
  cd tools
  make PYTHON=python3 -j 1
  cd ..
  # Install main package
  pip install -e .
  cd ..
else
  echo "ESPnet directory already exists. Updating..."
  cd espnet
  git pull
  cd ..
fi

# Create Python script to set up placeholder models
echo -e "\n${YELLOW}Creating model setup script...${NC}"
cat > scripts/download_espnet_models.py << 'EOF'
#!/usr/bin/env python3
import os
import json
from pathlib import Path

# Model configuration
models_config = {
    "asr": {
        "english": {
            "url": "https://github.com/espnet/espnet/blob/master/egs/librispeech/asr1/RESULTS.md",
            "description": "LibriSpeech ASR model"
        },
        "twi": {
            "url": "",
            "description": "Twi ASR model (placeholder)"
        },
        "ga": {
            "url": "",
            "description": "Ga ASR model (placeholder)"
        },
        "ewe": {
            "url": "",
            "description": "Ewe ASR model (placeholder)"
        },
        "hausa": {
            "url": "",
            "description": "Hausa ASR model (placeholder)"
        }
    },
    "tts": {
        "english": {
            "url": "https://github.com/espnet/espnet/blob/master/egs/ljspeech/tts1/RESULTS.md",
            "description": "LJSpeech TTS model"
        },
        "twi": {
            "url": "",
            "description": "Twi TTS model (placeholder)"
        },
        "ga": {
            "url": "",
            "description": "Ga TTS model (placeholder)"
        },
        "ewe": {
            "url": "",
            "description": "Ewe TTS model (placeholder)"
        },
        "hausa": {
            "url": "",
            "description": "Hausa TTS model (placeholder)"
        }
    }
}

def create_directories():
    """Create necessary directories for models"""
    base_dir = Path("backend/src/espnet/models")
    for model_type in ["asr", "tts"]:
        for language in ["english", "twi", "ga", "ewe", "hausa"]:
            (base_dir / model_type / language).mkdir(parents=True, exist_ok=True)
    return base_dir

def create_placeholder_models():
    """Create placeholder model files for development"""
    base_dir = create_directories()
    for model_type in ["asr", "tts"]:
        for language in ["english", "twi", "ga", "ewe", "hausa"]:
            model_path = base_dir / model_type / language / "model.pth"
            config_path = base_dir / model_type / language / "config.json"
            
            # Create empty model file if it doesn't exist
            if not model_path.exists():
                print(f"Creating placeholder for {language} {model_type} model")
                with open(model_path, "w") as f:
                    f.write(f"# This is a placeholder for the {language} {model_type} model\n")
                    f.write(f"# Replace with a real model for production use\n")
            
            # Create config file
            if not config_path.exists():
                config = {
                    "language": language,
                    "model_type": model_type,
                    "description": models_config[model_type][language]["description"],
                    "source": models_config[model_type][language]["url"] or "No URL available",
                    "placeholder": True,
                    "created": "Development placeholder"
                }
                with open(config_path, "w") as f:
                    json.dump(config, f, indent=2)

def main():
    """Main function to set up ESPnet models"""
    print("Setting up ESPnet models for TalkGhana")
    
    # Create placeholder models for development
    create_placeholder_models()
    
    print("\nPlaceholder models created successfully!")
    print("\nTo use real models:")
    print("1. Download or train models for each language")
    print("2. Place them in the backend/src/espnet/models/TYPE/LANGUAGE/ directory")
    print("3. Update the config.json files with the correct model information")

if __name__ == "__main__":
    main()
EOF

# Make the script executable
chmod +x scripts/download_espnet_models.py

# Execute the model download script
echo -e "\n${YELLOW}Setting up ESPnet models...${NC}"
python3 scripts/download_espnet_models.py

# Create ESPnet utility script
echo -e "\n${YELLOW}Creating ESPnet utility functions...${NC}"
mkdir -p backend/src/espnet/utils
cat > backend/src/espnet/utils/espnetSetup.ts << 'EOF'
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Supported languages for TalkGhana
export const SUPPORTED_LANGUAGES = ['twi', 'ga', 'ewe', 'hausa', 'english'];

// Path to ESPnet installation (adjust if needed)
export const ESPNET_PATH = path.resolve(process.cwd(), './espnet');
export const MODELS_PATH = path.resolve(process.cwd(), './backend/src/espnet/models');

interface ModelPaths {
  [key: string]: {
    asr: string;
    tts: string;
  };
}

// Model paths for different languages
export const LANGUAGE_MODELS: ModelPaths = {
  twi: {
    asr: path.join(MODELS_PATH, 'asr/twi/model.pth'),
    tts: path.join(MODELS_PATH, 'tts/twi/model.pth'),
  },
  ga: {
    asr: path.join(MODELS_PATH, 'asr/ga/model.pth'),
    tts: path.join(MODELS_PATH, 'tts/ga/model.pth'),
  },
  ewe: {
    asr: path.join(MODELS_PATH, 'asr/ewe/model.pth'),
    tts: path.join(MODELS_PATH, 'tts/ewe/model.pth'),
  },
  hausa: {
    asr: path.join(MODELS_PATH, 'asr/hausa/model.pth'),
    tts: path.join(MODELS_PATH, 'tts/hausa/model.pth'),
  },
  english: {
    asr: path.join(MODELS_PATH, 'asr/english/model.pth'),
    tts: path.join(MODELS_PATH, 'tts/english/model.pth'),
  },
};

/**
 * Initialize ESPnet environment
 */
export async function initializeESPnet(): Promise<boolean> {
  try {
    // Check if ESPnet is installed
    if (!fs.existsSync(ESPNET_PATH)) {
      console.error('ESPnet not found. Please run the installation script first.');
      return false;
    }

    // Check if models exist
    for (const language of SUPPORTED_LANGUAGES) {
      const asrModelPath = LANGUAGE_MODELS[language].asr;
      const ttsModelPath = LANGUAGE_MODELS[language].tts;

      // Create placeholder models if they don't exist
      if (!fs.existsSync(asrModelPath)) {
        console.warn(`ASR model for ${language} not found at ${asrModelPath}`);
        fs.mkdirSync(path.dirname(asrModelPath), { recursive: true });
        fs.writeFileSync(asrModelPath, 'placeholder model file');
      }

      if (!fs.existsSync(ttsModelPath)) {
        console.warn(`TTS model for ${language} not found at ${ttsModelPath}`);
        fs.mkdirSync(path.dirname(ttsModelPath), { recursive: true });
        fs.writeFileSync(ttsModelPath, 'placeholder model file');
      }
    }

    // Check if Python and ESPnet dependencies are available
    try {
      const pythonOutput = execSync('python3 -c "import torch, torchaudio, numpy; print(\'Dependencies available\')"');
      console.log(pythonOutput.toString().trim());
    } catch (error) {
      console.error('Python dependencies not available:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error initializing ESPnet:', error);
    return false;
  }
}

/**
 * Get G2P configuration for a language
 */
export function getG2PConfig(language: string): any {
  try {
    const configPath = path.join(process.cwd(), `backend/src/espnet/g2p/configs/${language}_g2p.json`);
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      return config;
    }
    
    // Return default config if language-specific one doesn't exist
    console.warn(`No G2P configuration found for ${language}. Using default.`);
    return {
      phoneme_map: {},
      word_map: {},
      rules: []
    };
  } catch (error) {
    console.error(`Error loading G2P config for ${language}:`, error);
    return {
      phoneme_map: {},
      word_map: {},
      rules: []
    };
  }
}
EOF

echo -e "\n${GREEN}ESPnet integration setup completed successfully!${NC}"
echo -e "${YELLOW}Note:${NC} This setup created placeholder models for development."
echo -e "To use real ESPnet models, you'll need to train or download them separately."
echo -e "For more information, see the README-ESPNET.md file." 