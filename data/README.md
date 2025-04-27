# TalkGhana Dataset Integration

This directory contains the datasets used for training the ASR (Automatic Speech Recognition) and TTS (Text-to-Speech) models for Ghanaian languages in the TalkGhana application.

## Dataset from SciDB (ID: bbd6baee3acf43bbbc4fe25e21077c8a)

The dataset from SciDB contains audio recordings and text data for various Ghanaian languages, which can be used to improve the performance of the ASR and TTS models.

### Dataset Structure

```
data/
├── downloads/            # Downloaded dataset files
├── datasets/             # Processed datasets ready for training
│   ├── twi/
│   │   ├── asr/
│   │   │   ├── train/    # Training data for ASR
│   │   │   ├── val/      # Validation data for ASR
│   │   │   └── test/     # Test data for ASR
│   │   └── tts/
│   │       ├── train/    # Training data for TTS
│   │       ├── val/      # Validation data for TTS
│   │       └── test/     # Test data for TTS
│   ├── ga/
│   ├── ewe/
│   ├── hausa/
│   └── english/
├── models/               # Trained models
└── README.md             # This file
```

## Getting Started

### 1. Download and Prepare the Dataset

1. Download the dataset from SciDB:

   - Visit: https://www.scidb.cn/en/detail?dataSetId=bbd6baee3acf43bbbc4fe25e21077c8a
   - Download the dataset archive

2. Run the dataset preparation script:

   ```bash
   npm run download-dataset
   ```

   If you have manually downloaded the dataset, place it in the `data/downloads` directory and run:

   ```bash
   npm run download-dataset -- --skip-download
   ```

### 2. Train the Models

After preparing the dataset, you can train the ASR and TTS models using the following command:

```bash
# Train both ASR and TTS models for Twi
npm run train-models -- --language=twi --type=both

# Train only ASR model for Ga
npm run train-models -- --language=ga --type=asr

# Train only TTS model for Ewe
npm run train-models -- --language=ewe --type=tts
```

### 3. Using the Trained Models

The trained models will be saved in the `data/models` directory. The TalkGhana application will automatically use these models when they are available.

## Adding Custom Data

You can add custom data to improve the model performance:

1. Create a new directory in the corresponding language folder:

   ```bash
   mkdir -p data/datasets/twi/asr/custom
   ```

2. Add your audio files and transcriptions following the same format as the SciDB dataset.

3. Retrain the models including your custom data:
   ```bash
   npm run train-models -- --language=twi --type=asr --include-custom=true
   ```

## Troubleshooting

If you encounter any issues during dataset preparation or model training, please check the following:

1. Make sure you have sufficient disk space for the dataset and trained models.
2. Ensure you have all the required dependencies installed.
3. Check the error logs for specific error messages.

For more assistance, contact the TalkGhana development team or open an issue on the GitHub repository.
