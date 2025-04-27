import React, { useState, useEffect } from "react";
import { Play, Pause, Trash, Upload, Check } from "lucide-react";
import offlineStorageService, {
  Recording,
} from "../services/OfflineStorageService";
import { useToast } from "../components/ui/use-toast";
import { formatTime } from "../utils/formatTime";

interface RecordingsListProps {
  onUploadForTranscription?: (recording: Recording) => Promise<void>;
}

const RecordingsList: React.FC<RecordingsListProps> = ({
  onUploadForTranscription,
}) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    loadRecordings();
  }, []);

  useEffect(() => {
    // Clean up audio element when component unmounts
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const recordingsList = await offlineStorageService.getAllRecordings();
      setRecordings(recordingsList);
    } catch (error) {
      console.error("Failed to load recordings:", error);
      toast("Error", "Failed to load recordings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async (recording: Recording) => {
    try {
      if (currentPlayingId === recording.id) {
        // If already playing this recording, pause it
        if (audioElement) {
          if (audioElement.paused) {
            await audioElement.play();
          } else {
            audioElement.pause();
          }
        }
      } else {
        // Stop currently playing audio if any
        if (audioElement) {
          audioElement.pause();
          audioElement.src = "";
        }

        // Create a URL for the audio blob
        const audioURL = URL.createObjectURL(recording.blob);
        const newAudio = new Audio(audioURL);

        newAudio.onended = () => {
          setCurrentPlayingId(null);
        };

        newAudio.onpause = () => {
          // Don't reset currentPlayingId when paused manually
        };

        await newAudio.play();
        setAudioElement(newAudio);
        setCurrentPlayingId(recording.id);
      }
    } catch (error) {
      console.error("Error playing recording:", error);
      toast("Playback Error", "Could not play this recording", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Stop playback if deleting the currently playing recording
      if (currentPlayingId === id && audioElement) {
        audioElement.pause();
        audioElement.src = "";
        setCurrentPlayingId(null);
      }

      await offlineStorageService.deleteRecording(id);
      setRecordings(recordings.filter((rec) => rec.id !== id));
      toast("Recording Deleted", "The recording has been deleted successfully");
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast("Error", "Failed to delete recording", "error");
    }
  };

  const handleUpload = async (recording: Recording) => {
    if (!onUploadForTranscription) {
      toast("Not Available", "Upload functionality is not available");
      return;
    }

    try {
      await onUploadForTranscription(recording);
      await offlineStorageService.markAsUploaded(recording.id);

      // Update the local state to reflect the change
      setRecordings(
        recordings.map((rec) =>
          rec.id === recording.id ? { ...rec, uploaded: true } : rec
        )
      );

      toast(
        "Upload Successful",
        "The recording has been uploaded for transcription"
      );
    } catch (error) {
      console.error("Error uploading recording:", error);
      toast(
        "Upload Failed",
        "Could not upload recording for transcription",
        "error"
      );
    }
  };

  const isPlaying = (id: string) => {
    return currentPlayingId === id && audioElement && !audioElement.paused;
  };

  if (loading) {
    return (
      <div className="flex justify-center my-4">Loading recordings...</div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center p-6 text-gray-500">
        No recordings saved yet
      </div>
    );
  }

  return (
    <div className="w-full border rounded-lg bg-white shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Saved Recordings</h3>
        <p className="text-sm text-gray-500">
          Manage your offline voice recordings
        </p>
      </div>
      <div className="p-4">
        <div className="h-[300px] overflow-y-auto pr-2">
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{recording.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(recording.createdAt).toLocaleString()} •{" "}
                    {formatTime(recording.duration)}
                  </div>
                  {recording.transcription && (
                    <div className="mt-1 italic text-sm text-gray-600 dark:text-gray-400 truncate">
                      "{recording.transcription}"
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {recording.uploaded ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-md">
                      <Check size={12} /> Uploaded
                    </span>
                  ) : (
                    <button
                      className="p-1 rounded border hover:bg-gray-100"
                      onClick={() => handleUpload(recording)}
                      disabled={!onUploadForTranscription}
                      title="Upload for transcription"
                    >
                      <Upload size={16} />
                    </button>
                  )}

                  <button
                    className="p-1 rounded border hover:bg-gray-100"
                    onClick={() => handlePlayPause(recording)}
                    title={isPlaying(recording.id) ? "Pause" : "Play"}
                  >
                    {isPlaying(recording.id) ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>

                  <button
                    className="p-1 rounded border hover:bg-gray-100"
                    onClick={() => handleDelete(recording.id)}
                    title="Delete recording"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingsList;
