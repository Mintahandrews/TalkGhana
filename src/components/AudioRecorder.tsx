import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  StopCircle,
  Save,
  Trash,
  Upload,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { useUserPreferences } from "../context/UserPreferencesContext";

interface AudioRecorderProps {
  onSaveRecording: (blob: Blob, name: string) => void;
  onUploadForTranscription?: (blob: Blob) => Promise<void>;
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSaveRecording,
  onUploadForTranscription,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingName, setRecordingName] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { preferences } = useUserPreferences();

  // Set up audio element for playback
  useEffect(() => {
    audioRef.current = new Audio();

    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onended = () => setIsPlaying(false);

    return () => {
      if (audioRef.current) {
        audioRef.current.onplay = null;
        audioRef.current.onpause = null;
        audioRef.current.onended = null;
      }
    };
  }, []);

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const url = URL.createObjectURL(audioBlob);

        setAudioBlob(audioBlob);
        setAudioUrl(url);

        if (audioRef.current) {
          audioRef.current.src = url;
        }

        // Generate a default name based on date and time
        const now = new Date();
        const defaultName = `recording_${now
          .toLocaleDateString()
          .replace(/\//g, "-")}_${now.toLocaleTimeString().replace(/:/g, "-")}`;
        setRecordingName(defaultName);

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start the timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Save recording
  const saveRecording = () => {
    if (audioBlob && recordingName.trim()) {
      onSaveRecording(audioBlob, recordingName.trim());

      // Clear current recording
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingName("");

      if (audioRef.current) {
        audioRef.current.src = "";
      }
    }
  };

  // Discard recording
  const discardRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingName("");

    if (audioRef.current) {
      audioRef.current.src = "";
    }
  };

  // Upload for transcription
  const handleUploadForTranscription = async () => {
    if (!audioBlob || !onUploadForTranscription) return;

    try {
      setUploadLoading(true);
      setError(null);
      await onUploadForTranscription(audioBlob);

      // Clear recording after successful upload
      discardRecording();
    } catch (err) {
      console.error("Error uploading for transcription:", err);
      setError("Failed to upload recording. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      className={`border rounded-lg p-4 ${
        preferences?.highContrast
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}
      aria-live="polite"
    >
      {error && (
        <div
          className={`mb-3 p-2 rounded ${
            preferences?.highContrast
              ? "bg-red-900 text-white"
              : "bg-red-100 text-red-800"
          }`}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-2">
        <h3
          className={`font-medium ${
            preferences?.highContrast ? "text-white" : "text-gray-800"
          }`}
        >
          {isRecording
            ? "Recording..."
            : audioBlob
            ? "Recording Ready"
            : "Audio Recorder"}
        </h3>

        {isRecording && (
          <div
            className={`flex items-center ${
              preferences?.highContrast ? "text-red-400" : "text-red-600"
            }`}
            aria-live="assertive"
          >
            <span className="inline-block w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></span>
            <span aria-label={`Recording time: ${formatTime(recordingTime)}`}>
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            disabled={disabled}
            className={`px-3 py-2 rounded-md flex items-center ${
              disabled
                ? preferences?.highContrast
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                : preferences?.highContrast
                ? "bg-blue-700 text-white hover:bg-blue-600"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            aria-label="Start recording"
          >
            <Mic size={18} className="mr-2" aria-hidden="true" /> Record
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className={`px-3 py-2 rounded-md flex items-center ${
              preferences?.highContrast
                ? "bg-red-700 text-white hover:bg-red-600"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            aria-label="Stop recording"
          >
            <StopCircle size={18} className="mr-2" aria-hidden="true" /> Stop
          </button>
        )}

        {audioBlob && (
          <>
            <button
              onClick={togglePlayback}
              className={`px-3 py-2 rounded-md flex items-center ${
                preferences?.highContrast
                  ? "bg-green-700 text-white hover:bg-green-600"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
              aria-label={isPlaying ? "Pause playback" : "Play recording"}
            >
              {isPlaying ? (
                <>
                  <PauseCircle size={18} className="mr-2" aria-hidden="true" />{" "}
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle size={18} className="mr-2" aria-hidden="true" />{" "}
                  Play
                </>
              )}
            </button>

            <button
              onClick={discardRecording}
              className={`px-3 py-2 rounded-md flex items-center ${
                preferences?.highContrast
                  ? "bg-red-700 text-white hover:bg-red-600"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
              aria-label="Discard recording"
            >
              <Trash size={18} className="mr-2" aria-hidden="true" /> Discard
            </button>
          </>
        )}
      </div>

      {audioBlob && (
        <div className="space-y-3">
          <div
            className={`${
              preferences?.highContrast ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <label htmlFor="recording-name" className="block text-sm mb-1">
              Recording Name:
            </label>
            <input
              id="recording-name"
              type="text"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${
                preferences?.highContrast
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
              placeholder="Enter a name for this recording"
              aria-required="true"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={saveRecording}
              disabled={!recordingName.trim()}
              className={`px-3 py-2 rounded-md flex items-center ${
                !recordingName.trim()
                  ? preferences?.highContrast
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : preferences?.highContrast
                  ? "bg-green-700 text-white hover:bg-green-600"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
              aria-label="Save recording"
            >
              <Save size={18} className="mr-2" aria-hidden="true" /> Save
            </button>

            {onUploadForTranscription && (
              <button
                onClick={handleUploadForTranscription}
                disabled={uploadLoading || !recordingName.trim()}
                className={`px-3 py-2 rounded-md flex items-center ${
                  uploadLoading || !recordingName.trim()
                    ? preferences?.highContrast
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : preferences?.highContrast
                    ? "bg-purple-700 text-white hover:bg-purple-600"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
                aria-label="Upload for transcription"
              >
                <Upload size={18} className="mr-2" aria-hidden="true" />
                {uploadLoading ? "Uploading..." : "Transcribe"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
