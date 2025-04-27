# TalkGhana Installation Guide

This guide provides step-by-step instructions for setting up and running the TalkGhana application.

## System Requirements

- **Operating System**: macOS or Linux (Ubuntu/Debian recommended for Linux)
- **Node.js**: v14.x or higher
- **Python**: 3.8 or higher
- **Storage**: At least 10GB of free disk space (for ESPnet models and dependencies)
- **RAM**: Minimum 8GB, recommended 16GB
- **GPU**: Optional but recommended for faster speech synthesis and recognition

## Automatic Installation

For most users, the automated setup script is the easiest way to install:

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/yourusername/TalkGhana.git
cd TalkGhana

# Make the setup script executable
chmod +x scripts/setup.sh

# Run the installation script
npm run setup
```

This script will:

1. Install all system dependencies
2. Set up a Python virtual environment
3. Install ESPnet and required Python packages
4. Download pre-trained models (placeholder files if real models aren't available)
5. Configure the application

## Manual Installation

If you prefer to install components manually or the automatic script doesn't work for you:

### 1. Install System Dependencies

**On macOS:**

```bash
brew install python@3.8 node npm sox ffmpeg libsndfile
```

**On Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install -y python3.8 python3.8-dev python3-pip nodejs npm sox ffmpeg libsndfile1-dev
```

### 2. Set Up Node.js Environment

```bash
npm install
```

### 3. Set Up Python Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install torch torchaudio numpy scipy pandas
```

### 4. Install ESPnet

```bash
git clone https://github.com/espnet/espnet.git
cd espnet/tools
make PYTHON=python3 -j 1
cd ..
pip install -e .
cd ..
```

### 5. Create Necessary Directories

```bash
mkdir -p data/{audio,text}/{twi,ga,ewe,hausa,dagbani,english}
mkdir -p backend/temp/{uploads,generated,models}
mkdir -p backend/src/espnet/models
mkdir -p logs
```

## Running the Application

### Start the Backend Server

```bash
# In one terminal
npm run server
```

### Start the Frontend Development Server

```bash
# In another terminal
npm run dev
```

### Or Run Both Together

```bash
npm run start
```

## Additional Scripts

- **Prepare Training Data**: `npm run prepare-data`
- **Import Text Data**: `npm run import-text`
- **Import Audio Data**: `npm run import-audio`
- **Train TTS Models**: `npm run train:tts`
- **Train STT Models**: `npm run train:stt`
- **Generate Transcripts**: `npm run generate-transcripts`
- **View Data Statistics**: `npm run data-stats`
- **Verify Data Integrity**: `npm run verify-data`

## Language Support

TalkGhana supports the following Ghanaian languages:

| Language   | Code      | Status          |
| ---------- | --------- | --------------- |
| Twi (Akan) | `twi`     | Fully supported |
| Ga         | `ga`      | Fully supported |
| Ewe        | `ewe`     | Fully supported |
| Hausa      | `hausa`   | Fully supported |
| Dagbani    | `dagbani` | Fully supported |
| English    | `english` | Fully supported |

## Troubleshooting

### ESPnet Installation Issues

If you encounter issues installing ESPnet:

1. Ensure you have the right Python version (3.8 is recommended)
2. Check that all system dependencies are installed
3. Try installing with verbose output: `cd espnet/tools && make PYTHON=python3 -j 1 VERBOSE=1`

### Backend Won't Start

- Check if all dependencies are installed: `npm install`
- Ensure the server file path is correct in the package.json
- Verify the port (default: 3000) is available and not in use by another process

### Frontend Won't Connect to Backend

- Verify the API_BASE_URL in src/services/ApiService.ts is set correctly
- Check that CORS is properly configured in backend/src/server.ts
- Ensure the backend server is running and accessible

## Data Security and Privacy

- All user data stays on your local machine by default
- Audio recordings are temporarily stored in backend/temp/uploads and automatically deleted
- Training data is stored in the data directory
- No data is sent to external servers unless explicitly configured

## Additional Resources

- [ESPnet Documentation](https://github.com/espnet/espnet/blob/master/doc/installation.md)
- [Ghanaian Language Training Guide](./README-GHANAIAN-TRAINING.md)
- [ESPnet Integration Details](./README-ESPNET.md)
