# TalkGhana ESPnet Integration

This document provides instructions for setting up the ESPnet integration for TalkGhana, enabling advanced ASR (Automatic Speech Recognition) and TTS (Text-to-Speech) capabilities for Ghanaian languages.

## Overview

TalkGhana uses ESPnet, a powerful end-to-end speech processing toolkit, to provide:

- **Automatic Speech Recognition (ASR)** for Twi, Ga, Ewe, Dagbani, Hausa, and Ghanaian English
- **Text-to-Speech (TTS)** with natural voice rendering in multiple Ghanaian languages
- **Offline processing** capabilities for resource-constrained environments
- **Multi-speaker voice synthesis** with customizable voice characteristics

## Prerequisites

Before installing the ESPnet integration, ensure you have the following:

- Python 3.6+ (3.8 recommended)
- FFmpeg for audio processing
- CUDA-capable GPU (optional, for faster model training)
- Node.js and npm (already required for TalkGhana)

## Installation

### 1. Install Required System Packages

#### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y build-essential cmake sox libsndfile1-dev ffmpeg
sudo apt install -y python3-dev python3-pip python3-setuptools python3-wheel
```

#### macOS:

```bash
brew update
brew install cmake sox libsndfile ffmpeg
```

### 2. Clone and Install ESPnet

```bash
# Create a directory for ESPnet (adjust path as needed)
mkdir -p ~/espnet
cd ~/espnet

# Clone ESPnet repository
git clone https://github.com/espnet/espnet.git .

# Set up the Python environment
./tools/setup_anaconda.sh anaconda espnet 3.8

# Activate the created environment
source tools/venv/bin/activate

# Install ESPnet
pip install -e .

# Install additional dependencies
pip install soundfile librosa

# For text processing
pip install transformers sentencepiece
```

### 3. Configure TalkGhana to Use ESPnet

Set the environment variable to point to your ESPnet installation:

```bash
# Add to your .bashrc or .zshrc
echo 'export ESPNET_ROOT=~/espnet' >> ~/.bashrc
source ~/.bashrc
```

### 4. Install Backend Dependencies

```bash
cd /path/to/TalkGhana/backend
npm install
```

## Using Pre-trained Models

TalkGhana can use pre-trained ESPnet models for quick start:

1. The system will automatically download pre-trained models when needed
2. For English, we use a robust LibriSpeech-based model
3. For Ghanaian languages, we provide placeholder configurations that can be updated with actual models

## Training Custom Models for Ghanaian Languages

To train custom models for Ghanaian languages:

1. Collect speech data in the target language
2. Format the data according to ESPnet requirements
3. Use our training scripts to fine-tune models

Example training command:

```bash
npm run train:tts -- -l twi
```

For Dagbani language support:

```bash
npm run train:tts -- -l dagbani
```

## Language Support

TalkGhana includes support for the following Ghanaian languages:

| Language | ASR Support | TTS Support | Phonetic Handling | Syllable-Level |
| -------- | ----------- | ----------- | ----------------- | -------------- |
| Twi      | ✅          | ✅          | ✅                | ✅             |
| Ga       | ✅          | ✅          | ✅                | ✅             |
| Ewe      | ✅          | ✅          | ✅                | ✅             |
| Hausa    | ✅          | ✅          | ✅                | ✅             |
| Dagbani  | ✅          | ✅          | ✅                | ✅             |
| English  | ✅          | ✅          | ⚪                | ⚪             |

## Troubleshooting

If you encounter issues with ESPnet integration:

1. **Model download failures**: Check your internet connection and that the model URL is valid
2. **Audio processing errors**: Ensure ffmpeg is correctly installed
3. **Python errors**: Verify you're using the correct Python environment with all dependencies installed

## Additional Resources

- [ESPnet Documentation](https://espnet.github.io/espnet/)
- [Ghanaian Language Resources](http://www.language-archives.org/language/twi)
- [TalkGhana Training Guide](README-GHANAIAN-TRAINING.md)

## Contributing

We welcome contributions to improve our ESPnet integration, especially:

- Better acoustic models for Ghanaian languages
- Improved language modeling
- More natural TTS voices
- UI enhancements for the speech interface
