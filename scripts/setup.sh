#!/bin/bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}     TalkGhana Installation and Setup Script       ${NC}"
echo -e "${BLUE}===================================================${NC}"

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "${GREEN}Running on macOS${NC}"
  OS_TYPE="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo -e "${GREEN}Running on Linux${NC}"
  OS_TYPE="linux"
else
  echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
  echo "This script supports macOS and Linux"
  exit 1
fi

# Create necessary directories
echo -e "\n${YELLOW}Creating necessary directories...${NC}"
mkdir -p data/{audio,text}/{twi,ga,ewe,hausa,english}
mkdir -p backend/temp/{uploads,generated,models}
mkdir -p logs

# Install system dependencies
echo -e "\n${YELLOW}Installing system dependencies...${NC}"
if [[ "$OS_TYPE" == "macos" ]]; then
  # Check if Homebrew is installed
  if ! command -v brew &> /dev/null; then
    echo -e "${RED}Homebrew not found. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  
  echo "Installing dependencies with Homebrew..."
  brew install python@3.8 node npm sox ffmpeg libsndfile
  
elif [[ "$OS_TYPE" == "linux" ]]; then
  echo "Installing dependencies with apt..."
  sudo apt-get update
  sudo apt-get install -y python3.8 python3.8-dev python3-pip nodejs npm sox ffmpeg libsndfile1-dev
fi

# Set up Node.js environment
echo -e "\n${YELLOW}Setting up Node.js environment...${NC}"
npm install

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
  echo -e "\n${YELLOW}Creating Python virtual environment...${NC}"
  python3 -m venv venv
fi

# Activate virtual environment
echo -e "\n${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
pip install --upgrade pip
pip install torch torchaudio numpy scipy pandas tqdm requests

# Make setup scripts executable
echo -e "\n${YELLOW}Making scripts executable...${NC}"
chmod +x scripts/*.sh
chmod +x scripts/*.py 2>/dev/null || true

# Run ESPnet setup
echo -e "\n${YELLOW}Setting up ESPnet integration...${NC}"
bash scripts/setup_espnet.sh

# Build the application
echo -e "\n${YELLOW}Building the application...${NC}"
npm run build

echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}Installation and setup completed successfully!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo -e "\nTo start the frontend development server: ${BLUE}npm run dev${NC}"
echo -e "To start the backend server: ${BLUE}npm run server${NC}"
echo -e "To start both: ${BLUE}npm run start${NC}"
echo -e "\nThank you for setting up TalkGhana!" 