import React, { useState, useRef } from "react";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface TranscriptResult {
  text: string;
  language: string;
  words: WordTimestamp[];
  duration: number;
  confidence: number;
}

interface GhanaianASRProps {
  language?: string;
  onTranscriptChange?: (text: string, confidence?: number) => void;
  onSpeechEnd?: () => void;
  onError?: (errorMessage: string) => void;
}

const GhanaianASR: React.FC<GhanaianASRProps> = ({
  language = "twi",
  onTranscriptChange,
  onSpeechEnd,
  onError,
}) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [transcriptResult, setTranscriptResult] =
    useState<TranscriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start recording
  const startRecording = async () => {
    try {
      // Reset states
      setError(null);
      setAudioBlob(null);
      setTranscriptResult(null);
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setAudioBlob(audioBlob);

        // Release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      const errorMessage =
        "Could not access microphone. Please check permissions.";
      setError(errorMessage);
      setRecording(false);

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);

      if (onSpeechEnd) {
        onSpeechEnd();
      }
    }
  };

  // Upload file handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset states
      setError(null);
      setAudioBlob(file);
      setTranscriptResult(null);
    }
  };

  // Transcribe audio
  const transcribeAudio = async () => {
    if (!audioBlob) {
      const errorMessage = "No audio to transcribe";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("language", language);

      // Send to API
      const response = await fetch("/api/asr/whisper", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setTranscriptResult(data);

        // Notify parent component
        if (onTranscriptChange && data.text) {
          onTranscriptChange(data.text, data.confidence);
        }

        if (onSpeechEnd) {
          onSpeechEnd();
        }
      } else {
        const errorMessage = data.error || "Failed to transcribe audio";
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      console.error("Error transcribing audio:", err);
      const errorMessage = "Failed to connect to the server";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Render highlighted transcript with word timings
  const renderHighlightedTranscript = () => {
    if (!transcriptResult || !transcriptResult.words) return null;

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        {transcriptResult.words.map((word, index) => (
          <span
            key={index}
            className="inline-block px-1 py-0.5 m-0.5 rounded cursor-pointer hover:bg-blue-100"
            title={`${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s`}
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = word.start;
                audioRef.current.play();
              }
            }}
          >
            {word.word}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Ghanaian Speech Recognition</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="language" className="block text-sm font-medium mb-1">
            Language
          </label>
          <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
            <span>{language.charAt(0).toUpperCase() + language.slice(1)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
              recording
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            }`}
            disabled={isUploading}
          >
            {recording ? "Stop Recording" : "Record Audio"}
          </button>

          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
              disabled={recording || isUploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              disabled={recording || isUploading}
            >
              Upload Audio
            </button>
          </div>
        </div>

        {audioBlob && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Recorded Audio</h3>
            <audio ref={audioRef} controls className="w-full">
              <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>

            <button
              onClick={transcribeAudio}
              disabled={isUploading}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {isUploading ? "Transcribing..." : "Transcribe Audio"}
            </button>
          </div>
        )}

        {transcriptResult && (
          <div className="mt-6">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium">Transcript</h3>
              <span className="text-sm text-gray-500">
                Confidence: {(transcriptResult.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-lg">{transcriptResult.text}</p>
            </div>

            <h4 className="text-md font-medium mt-4 mb-2">Word Timestamps</h4>
            {renderHighlightedTranscript()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GhanaianASR;
