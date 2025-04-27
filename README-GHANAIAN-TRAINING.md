# TalkGhana Training Tools

This toolkit provides comprehensive tools for training Text-to-Speech (TTS) and Speech-to-Text (STT) models for Ghanaian languages, including Twi, Ga, Ewe, Dagbani, Hausa, and Ghanaian English.

## Features

- **Dataset Management**: Import, process, and manage text and audio data for Ghanaian languages
- **TTS Training**: Train Text-to-Speech models with support for tonal features and syllable-level modeling
- **STT Training**: Train Speech-to-Text models with configurable audio processing parameters
- **Interactive Mode**: User-friendly interactive training interface
- **Command-line Interface**: Powerful CLI for automation and scripting
- **Web Interface**: Visual interface for training and managing models

## Installation

1. Clone the TalkGhana repository
2. Install dependencies:

```bash
npm install --save --legacy-peer-deps @tensorflow-models/speech-commands @huggingface/inference iso-639-1 compromise compromise-syllables natural csv-parser commander
```

## Directory Structure

TalkGhana uses the following directory structure:

```
data/
├── audio/
│   ├── raw/
│   │   ├── twi/
│   │   ├── ga/
│   │   ├── ewe/
│   │   ├── hausa/
│   │   ├── dagbani/
│   │   └── english/
│   └── processed/
│       ├── twi/
│       ├── ga/
│       ├── ewe/
│       ├── hausa/
│       ├── dagbani/
│       └── english/
├── text/
│   ├── raw/
│   │   ├── twi/
│   │   ├── ga/
│   │   ├── ewe/
│   │   ├── hausa/
│   │   ├── dagbani/
│   │   └── english/
│   └── processed/
│       ├── twi/
│       ├── ga/
│       ├── ewe/
│       ├── hausa/
│       ├── dagbani/
│       └── english/
├── models/
│   ├── twi/
│   ├── ga/
│   ├── ewe/
│   ├── hausa/
│   ├── dagbani/
│   └── english/
└── training_logs/
```

## Quick Start

### Prepare Sample Data

To get started quickly with TalkGhana, generate sample data:

```bash
npm run data:prepare
```

This will create sample text and audio files for all supported languages.

### Training Models

#### Interactive Mode

For a guided training experience:

```bash
npm run train:interactive
```

Follow the prompts to select language, model type, and training parameters.

#### Command-line Training

Train a TTS model:

```bash
npm run train:tts -- -l twi
```

Train an STT model:

```bash
npm run train:stt -- -l ga
```

Training for Dagbani:

```bash
npm run train:tts -- -l dagbani
npm run train:stt -- -l dagbani
```

### Data Management

List available data:

```bash
npm run data:list -- -l twi
```

Import text data:

```bash
npm run data:import -- -l twi -t path/to/text.csv
```

Import audio data:

```bash
npm run data:import -- -l ga -a path/to/audio/directory
```

## Command-line Options

### TTS Training Options

```
-l, --language <language>     Target language (twi, ga, ewe, hausa, dagbani, english)
-m, --model <architecture>    Model architecture (fastspeech, tacotron, glowtts, vits)
-b, --batch-size <size>       Batch size
-e, --epochs <count>          Number of epochs
-r, --learning-rate <rate>    Learning rate
--tones                       Enable tonal features
--syllables                   Use syllable-level modeling
-o, --output <dir>           Output directory
--export <formats>           Export formats (comma-separated: tfjs,tflite,tensorflowjs)
```

### STT Training Options

```
-l, --language <language>     Target language (twi, ga, ewe, hausa, dagbani, english)
-m, --model <architecture>    Model architecture (conformer, quartznet, wav2vec, whisper)
-b, --batch-size <size>       Batch size
-e, --epochs <count>          Number of epochs
-r, --learning-rate <rate>    Learning rate
-s, --sample-rate <rate>      Audio sample rate (8000, 16000, 22050, 44100)
--mel-bands <count>           Number of mel bands
-o, --output <dir>           Output directory
--export <formats>           Export formats (comma-separated: tfjs,tflite,tensorflowjs)
```

## Language-Specific Considerations

Each Ghanaian language has unique characteristics that impact training:

### Twi (Akan)

- Tonal language with pitch carrying semantic meaning
- Multiple dialects (Asante, Akuapem, Fante)
- Requires syllable-level modeling for best results

### Ga

- Uses tonal patterns that can change meaning
- Includes double consonants (kp, gb) that need special handling
- Benefits from special handling of nasalization

### Ewe

- Seven tones that must be preserved for intelligibility
- Includes special characters like ɖ, ƒ, ŋ
- Requires custom lexicon for pronunciation

### Dagbani

- Tonal language with two primary tones (high, low)
- Includes syllabic nasals that require special handling
- Benefits from tone marking for disambiguation

### Hausa

- Includes glottalized consonants (ɓ, ɗ)
- Tone system simpler than other Ghanaian languages
- Standard orthography well-established

### Ghanaian English

- Features unique intonation patterns distinct from other English variants
- Often incorporates words or pronunciation patterns from local languages
- Benefits from transfer learning from standard English models
