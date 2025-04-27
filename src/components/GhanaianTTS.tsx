import React, { useState, useEffect, useRef } from "react";

interface Voice {
  id: string;
  name: string;
  gender: string;
}

interface VoicesResponse {
  language: string;
  voices: Voice[];
}

interface GhanaianTTSProps {
  text?: string;
  language?: string;
  autoPlay?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (errorMessage: string) => void;
  showSettings?: boolean;
}

const GhanaianTTS: React.FC<GhanaianTTSProps> = ({
  text: initialText = "",
  language: initialLanguage = "twi",
  autoPlay = false,
  onPlayStart,
  onPlayEnd,
  onError,
  showSettings = true,
}) => {
  const [text, setText] = useState<string>(initialText);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [voice, setVoice] = useState<string>("default");
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Update text when props change
  useEffect(() => {
    if (initialText !== text) {
      setText(initialText);
    }
  }, [initialText]);

  // Update language when props change
  useEffect(() => {
    if (initialLanguage !== language) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  // Load available voices when language changes
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        // Try to fetch from server
        const response = await fetch(`/api/tts/voices?language=${language}`);

        // Check if response is ok
        if (response.ok) {
          const data: VoicesResponse = await response.json();
          setVoices(data.voices);

          // Set default voice if available
          if (data.voices.length > 0) {
            setVoice(data.voices[0].id);
          } else {
            setVoice("default");
          }
        } else {
          // If server doesn't have this endpoint, create default voices
          const defaultVoices: Voice[] = [
            {
              id: "female-1",
              name: `${
                language.charAt(0).toUpperCase() + language.slice(1)
              } Female`,
              gender: "female",
            },
            {
              id: "male-1",
              name: `${
                language.charAt(0).toUpperCase() + language.slice(1)
              } Male`,
              gender: "male",
            },
          ];
          setVoices(defaultVoices);
          setVoice(defaultVoices[0].id);
        }
      } catch (err) {
        console.error("Error fetching voices:", err);
        // Create default voices when API fails
        const defaultVoices: Voice[] = [
          {
            id: "female-1",
            name: `${
              language.charAt(0).toUpperCase() + language.slice(1)
            } Female`,
            gender: "female",
          },
          {
            id: "male-1",
            name: `${
              language.charAt(0).toUpperCase() + language.slice(1)
            } Male`,
            gender: "male",
          },
        ];
        setVoices(defaultVoices);
        setVoice(defaultVoices[0].id);
      }
    };

    fetchVoices();
  }, [language]);

  // Auto-play when text changes (if enabled)
  useEffect(() => {
    if (autoPlay && text && audioRef.current && !isLoading) {
      handleStreamAudio();
    }
  }, [autoPlay, text, isLoading]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      const errorMessage = "Please enter some text";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    setError(null);
    setIsLoading(true);

    if (onPlayStart) {
      onPlayStart();
    }

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language,
          voice,
          rate: speed,
          pitch,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAudioUrl(data.audioUrl);
        // Play audio automatically
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play();
        }
      } else {
        const errorMessage = data.error || "Failed to generate speech";
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      console.error("Error synthesizing speech:", err);
      const errorMessage = "Failed to connect to the server";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle streaming audio
  const handleStreamAudio = async () => {
    if (!text.trim()) {
      const errorMessage = "Please enter some text";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    setError(null);
    setIsLoading(true);

    if (onPlayStart) {
      onPlayStart();
    }

    try {
      // Create a URL for streaming
      const streamUrl = `/api/tts?${new URLSearchParams({
        text,
        language,
        voice,
        rate: speed.toString(),
        pitch: pitch.toString(),
      })}`;

      // Set the audio source to the streaming URL
      setAudioUrl(streamUrl);

      // Play audio automatically
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play();

        // Set up ended event for onPlayEnd callback
        audioRef.current.onended = () => {
          if (onPlayEnd) {
            onPlayEnd();
          }
        };
      }
    } catch (err) {
      console.error("Error streaming speech:", err);
      const errorMessage = "Failed to stream audio";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettingsPanel(!showSettingsPanel);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Ghanaian Text-to-Speech</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium mb-1">
            Text to Speak
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={4}
            placeholder="Enter text in a Ghanaian language..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="language"
              className="block text-sm font-medium mb-1"
            >
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="twi">Twi</option>
              <option value="ga">Ga</option>
              <option value="ewe">Ewe</option>
              <option value="hausa">Hausa</option>
              <option value="english">English</option>
            </select>
          </div>

          <div>
            <label htmlFor="voice" className="block text-sm font-medium mb-1">
              Voice
            </label>
            <select
              id="voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {voices.length === 0 ? (
                <option value="default">Default</option>
              ) : (
                voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} ({voice.gender})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {showSettings && showSettingsPanel && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="speed" className="block text-sm font-medium mb-1">
                Speed: {speed.toFixed(1)}
              </label>
              <input
                id="speed"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="pitch" className="block text-sm font-medium mb-1">
                Pitch: {pitch.toFixed(1)}
              </label>
              <input
                id="pitch"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate Speech"}
          </button>

          <button
            type="button"
            onClick={handleStreamAudio}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {isLoading ? "Streaming..." : "Stream Speech"}
          </button>

          {showSettings && (
            <button
              type="button"
              onClick={toggleSettings}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium"
              aria-expanded={showSettingsPanel}
            >
              {showSettingsPanel ? "Hide Settings" : "Show Settings"}
            </button>
          )}
        </div>
      </form>

      {audioUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Generated Audio</h3>
          <audio
            ref={audioRef}
            controls
            className="w-full"
            onEnded={() => {
              if (onPlayEnd) onPlayEnd();
            }}
          >
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default GhanaianTTS;
