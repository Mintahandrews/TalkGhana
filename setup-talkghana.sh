#!/bin/bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}             TalkGhana Complete Setup              ${NC}"
echo -e "${BLUE}===================================================${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}$2${NC}"
        return 1
    fi
    return 0
}

check_python_version() {
    local python_cmd=$1
    local version=$($python_cmd --version 2>&1 | cut -d ' ' -f 2)
    local major=$(echo $version | cut -d '.' -f 1)
    local minor=$(echo $version | cut -d '.' -f 2)
    
    if [ "$major" -lt 3 ] || ([ "$major" -eq 3 ] && [ "$minor" -lt 8 ]); then
        echo -e "${RED}Python 3.8 or higher is required. Found: $version${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Python version $version is compatible${NC}"
    return 0
}

# Check for required system tools
echo -e "\n${YELLOW}Checking system requirements...${NC}"

# Check for git
check_command "git" "Git is required but not found. Please install git." || exit 1
echo -e "${GREEN}Git found.${NC}"

# Check for Node.js
check_command "node" "Node.js is not installed. Please install Node.js version 14 or later." || exit 1
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
echo -e "${GREEN}Node.js version: ${NODE_VERSION}${NC}"

# Check for npm
check_command "npm" "npm is not installed. Please install npm." || exit 1
NPM_VERSION=$(npm -v)
echo -e "${GREEN}npm version: ${NPM_VERSION}${NC}"

# Check for Python
check_command "python3" "Python 3 is not installed. Please install Python 3.8 or later." || exit 1
check_python_version "python3" || exit 1

# Check for additional dependencies
echo -e "\n${YELLOW}Checking additional dependencies...${NC}"

# Check for pip
check_command "pip3" "pip3 is not installed. Please install pip3." || exit 1
echo -e "${GREEN}pip3 found.${NC}"

# Check for audio processing tools
for cmd in ffmpeg sox; do
    if check_command "$cmd" ""; then
        echo -e "${GREEN}$cmd found.${NC}"
    else
        echo -e "${YELLOW}$cmd not found. Some audio functionality may be limited.${NC}"
    fi
done

# Create project directories
echo -e "\n${YELLOW}Creating project directories...${NC}"
mkdir -p backend/src/espnet/models/{asr,tts}/{twi,ga,ewe,hausa,english}
mkdir -p backend/uploads/{audio,temp}
mkdir -p data/models

# Install Python dependencies in a virtual environment
echo -e "\n${YELLOW}Setting up Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}Created virtual environment in 'venv' directory${NC}"
else
    echo -e "${GREEN}Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "\n${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}Virtual environment activated${NC}"

# Install basic Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
pip install --upgrade pip
pip install wheel setuptools numpy scipy scikit-learn librosa soundfile torch torchaudio

# Install Node.js dependencies
echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
npm install --legacy-peer-deps

# Install backend dependencies
echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

# Setup ESPnet
echo -e "\n${YELLOW}Configuring ESPnet...${NC}"
if [ ! -d "espnet" ]; then
    echo -e "${YELLOW}Cloning ESPnet repository...${NC}"
    git clone https://github.com/espnet/espnet.git
    
    echo -e "${YELLOW}Installing ESPnet...${NC}"
    cd espnet
    
    # Create a minimal installation for inference only
    cd tools
    
    # Modify the Makefile to skip Kaldi
    echo -e "${YELLOW}Configuring ESPnet for lightweight usage...${NC}"
    make PYTHON=python3 KALDI=/dev/null -j 1
    
    # Back to main directory
    cd ../..
    
    # Install ESPnet as a Python package
    echo -e "${YELLOW}Installing ESPnet Python package...${NC}"
    pip install -e ./espnet
else
    echo -e "${GREEN}ESPnet already exists. Updating...${NC}"
    cd espnet
    git pull
    cd ..
fi

# Configure environment variables
echo -e "\n${YELLOW}Setting up environment variables...${NC}"
export ESPNET_ROOT="$(pwd)/espnet"
echo "export ESPNET_ROOT=\"$(pwd)/espnet\"" >> venv/bin/activate

# Download demo models or create placeholder configs
echo -e "\n${YELLOW}Preparing model configurations...${NC}"

# Create a Python script for model setup
cat > scripts/setup_models.py << 'EOF'
#!/usr/bin/env python3
import os
import json
from pathlib import Path

# Model configurations
models_config = {
    "asr": {
        "english": {
            "description": "LibriSpeech ASR model",
            "placeholder": False
        },
        "twi": {
            "description": "Twi ASR model (placeholder)",
            "placeholder": True
        },
        "ga": {
            "description": "Ga ASR model (placeholder)",
            "placeholder": True
        },
        "ewe": {
            "description": "Ewe ASR model (placeholder)",
            "placeholder": True
        },
        "hausa": {
            "description": "Hausa ASR model (placeholder)",
            "placeholder": True
        }
    },
    "tts": {
        "english": {
            "description": "LJSpeech TTS model",
            "placeholder": False
        },
        "twi": {
            "description": "Twi TTS model (placeholder)",
            "placeholder": True
        },
        "ga": {
            "description": "Ga TTS model (placeholder)",
            "placeholder": True
        },
        "ewe": {
            "description": "Ewe TTS model (placeholder)",
            "placeholder": True
        },
        "hausa": {
            "description": "Hausa TTS model (placeholder)",
            "placeholder": True
        }
    }
}

def create_model_placeholders():
    """Create placeholder model files and configurations"""
    base_dir = Path("backend/src/espnet/models")
    print(f"Creating model placeholders in {base_dir}")
    
    for model_type in ["asr", "tts"]:
        for language in ["english", "twi", "ga", "ewe", "hausa"]:
            model_dir = base_dir / model_type / language
            model_dir.mkdir(parents=True, exist_ok=True)
            
            # Create config file
            config_path = model_dir / "config.json"
            if not config_path.exists():
                config = {
                    "model_type": model_type,
                    "language": language,
                    "description": models_config[model_type][language]["description"],
                    "placeholder": models_config[model_type][language]["placeholder"],
                    "version": "0.1.0",
                    "created": "2023-06-15",
                    "parameters": {
                        "sampling_rate": 16000,
                        "features": "fbank" if model_type == "asr" else "mel",
                        "model_architecture": "transformer" if model_type == "asr" else "tacotron2",
                    }
                }
                
                with open(config_path, "w") as f:
                    json.dump(config, f, indent=2)
                print(f"Created config for {language} {model_type}")
            
            # Create empty placeholder model file
            model_path = model_dir / "model.pth"
            if not model_path.exists() and models_config[model_type][language]["placeholder"]:
                with open(model_path, "w") as f:
                    f.write(f"# Placeholder for {language} {model_type} model\n")
                    f.write("# This file should be replaced with a real model for production use\n")
                print(f"Created placeholder model for {language} {model_type}")

if __name__ == "__main__":
    create_model_placeholders()
    print("Model setup complete!")
EOF

chmod +x scripts/setup_models.py
python scripts/setup_models.py

# Build the application
echo -e "\n${YELLOW}Building the application...${NC}"

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
cd backend
npm run build
cd ..

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

echo -e "\n${GREEN}TalkGhana setup complete!${NC}"
echo -e "To start the application, run:"
echo -e "${YELLOW}  source venv/bin/activate${NC}"
echo -e "${YELLOW}  npm run start${NC}"
echo -e "\nThis will start both the frontend and backend servers."
echo -e "${BLUE}Thank you for installing TalkGhana!${NC}" 