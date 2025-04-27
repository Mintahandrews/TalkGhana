#!/usr/bin/env python3
import os
import sys
import json
import shutil
import urllib.request
import tarfile
from pathlib import Path
import subprocess

ESPNET_DOWNLOADS = {
    "asr": {
        "english": {
            "url": "https://zenodo.org/record/3966501/files/asr_train_asr_transformer_e18_raw_bpe_sp_valid.acc.ave.zip",
            "description": "LibriSpeech Transformer ASR model from ESPnet"
        }
    },
    "tts": {
        "english": {
            "url": "https://zenodo.org/record/4034069/files/tts_train_xvector_tacotron2_raw_phn_tacotron_g2p_en_no_space_train.loss.ave.zip",
            "description": "LJSpeech Tacotron2 TTS model from ESPnet"
        }
    }
}

def download_file(url, target_path):
    """Download a file with progress indicator"""
    print(f"Downloading from {url}...")
    
    def progress_callback(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size)
        sys.stdout.write(f"\rDownloading: {percent}% [{int(count * block_size / 1024 / 1024)} MB]")
        sys.stdout.flush()
    
    try:
        urllib.request.urlretrieve(url, target_path, progress_callback)
        print(f"\nDownload complete: {target_path}")
        return True
    except Exception as e:
        print(f"\nError downloading file: {e}")
        return False

def extract_file(file_path, extract_dir):
    """Extract a zip/tar file"""
    print(f"Extracting {file_path} to {extract_dir}...")
    try:
        if file_path.endswith('.zip'):
            # Use unzip command for zip files
            subprocess.run(['unzip', '-o', file_path, '-d', extract_dir], check=True)
        elif file_path.endswith('.tar.gz') or file_path.endswith('.tgz'):
            with tarfile.open(file_path) as tar:
                tar.extractall(path=extract_dir)
        print(f"Extraction complete: {extract_dir}")
        return True
    except Exception as e:
        print(f"Error extracting file: {e}")
        return False

def setup_model(model_type, language):
    """Download and setup a specific model"""
    # Create directories
    data_dir = Path("data/models")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    model_dir = Path(f"backend/src/espnet/models/{model_type}/{language}")
    model_dir.mkdir(parents=True, exist_ok=True)
    
    download_info = ESPNET_DOWNLOADS.get(model_type, {}).get(language)
    if not download_info:
        print(f"No download information for {language} {model_type} model")
        return False
    
    # Download the model
    url = download_info["url"]
    filename = url.split('/')[-1]
    download_path = data_dir / filename
    
    if not download_path.exists():
        if not download_file(url, download_path):
            return False
    else:
        print(f"Model file already exists: {download_path}")
    
    # Extract the model
    extract_dir = data_dir / f"{model_type}_{language}_tmp"
    extract_dir.mkdir(exist_ok=True)
    
    if not extract_file(download_path, extract_dir):
        return False
    
    # Move relevant files to the model directory
    for file in extract_dir.glob("**/*"):
        if file.name in ["model.json", "config.yaml", "train.yaml", "model.pth"]:
            shutil.copy(file, model_dir)
            print(f"Copied {file.name} to {model_dir}")
    
    # Create a config.json file
    config = {
        "model_type": model_type,
        "language": language,
        "description": download_info["description"],
        "placeholder": False,
        "version": "1.0.0",
        "created": "2023-06-15",
        "source": url,
        "parameters": {
            "sampling_rate": 16000 if model_type == "asr" else 22050,
            "features": "fbank" if model_type == "asr" else "mel",
            "model_architecture": "transformer" if model_type == "asr" else "tacotron2"
        }
    }
    
    with open(model_dir / "config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"{language.capitalize()} {model_type.upper()} model setup complete!")
    return True

def main():
    """Main function to download and setup English models"""
    print("Setting up English models for TalkGhana...")
    
    # Setup English ASR model
    if setup_model("asr", "english"):
        print("English ASR model setup successful!")
    else:
        print("English ASR model setup failed!")
    
    # Setup English TTS model
    if setup_model("tts", "english"):
        print("English TTS model setup successful!")
    else:
        print("English TTS model setup failed!")
    
    print("\nModel download and setup complete!")
    print("Note: These are pre-trained models for English only.")
    print("For Ghanaian languages, you'll need to train custom models or use the placeholders.")

if __name__ == "__main__":
    main() 