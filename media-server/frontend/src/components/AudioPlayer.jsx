import { useCallback, useEffect, useRef, useState } from "react";
import { playAudioElement } from "../utils/audioPlayback";
import { buildStreamUrl } from "../utils/stream";
import { debugLog, getAudioErrorDetails, toggleDebug } from "../utils/debugLog";
import "./AudioPlayer.css";

export default function AudioPlayer({
  audioRef,
  currentTrack,
  isPlaying,
  setIsPlaying,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onTrackEnded,
}) {
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const playRequestRef = useRef(0);
  const loadedTrackKeyRef = useRef(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [audioRef, isSeeking]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [audioRef]);

  const handleWaiting = useCallback(() => setIsLoading(true), []);
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setPlaybackError("");
  }, []);
  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setPlaybackError("");
  }, []);
  const handleAudioError = useCallback(() => {
    const details = getAudioErrorDetails(audioRef.current);
    setIsLoading(false);
    setIsPlaying(false);
    debugLog("error", "Audio element error event", details);
    setPlaybackError(`Audio error: ${details.label || details}`);
  }, [setIsPlaying, audioRef]);

  useEffect(() => {
    if (!currentTrack) return;

    let cancelled = false;

    loadedTrackKeyRef.current = null;
    setStreamUrl("");
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError("");
    setIsLoading(true);

    buildStreamUrl(currentTrack).then((url) => {
      if (cancelled) return;
      if (!url) {
        setPlaybackError("No stream URL returned");
        setIsLoading(false);
        return;
      }
      debugLog("info", "Track stream ready", { urlPreview: url.slice(0, 100) });
      setStreamUrl(url);
      setIsLoading(false);
    }).catch((error) => {
      if (cancelled) return;
      debugLog("error", "buildStreamUrl failed", { message: error.message });
      setPlaybackError(error.message.slice(0, 80));
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl || !currentTrack) return;

    const trackKey = currentTrack.id || currentTrack.streamId;
    if (loadedTrackKeyRef.current === trackKey) return;

    loadedTrackKeyRef.current = trackKey;
    audio.dataset.requestedSrc = streamUrl;
    audio.src = streamUrl;
    debugLog("info", "Preloaded audio src", { srcPreview: streamUrl.slice(0, 100) });
    setIsLoading(true);
  }, [audioRef, streamUrl, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isPlaying) return;
    audio.pause();
  }, [isPlaying, audioRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleAudioError);
    audio.addEventListener("ended", onTrackEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleAudioError);
      audio.removeEventListener("ended", onTrackEnded);
    };
  }, [
    audioRef,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleWaiting,
    handleCanPlay,
    handlePlaying,
    handleAudioError,
    onTrackEnded,
  ]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: "Home Media Server",
      artwork: [
        {
          src: currentTrack.artwork || "https://placehold.co/512x512/1db954/ffffff?text=Music",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", async () => {
      const audio = audioRef.current;
      const url = streamUrl || (await buildStreamUrl(currentTrack).catch(() => ""));
      if (!audio || !url) return;

      try {
        await playAudioElement(audio, url);
        setIsPlaying(true);
        setPlaybackError("");
      } catch {
        setPlaybackError("Tap ▶ to start playback");
      }
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      playRequestRef.current += 1;
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (hasPrevious) onPrevious();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (hasNext) onNext();
    });
  }, [currentTrack, hasNext, hasPrevious, onNext, onPrevious, setIsPlaying, audioRef, streamUrl]);

  if (!currentTrack) return null;

  const handleSeekInput = (e) => {
    setIsSeeking(true);
    setCurrentTime(parseFloat(e.target.value));
  };

  const handleSeekCommit = (e) => {
    const nextTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
    setCurrentTime(nextTime);
    setIsSeeking(false);
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    const url = streamUrl || (await buildStreamUrl(currentTrack).catch(() => ""));
    if (!audio || !url) {
      setPlaybackError("Still loading track…");
      return;
    }

    if (isPlaying) {
      playRequestRef.current += 1;
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setPlaybackError("");
    setIsLoading(true);

    try {
      await playAudioElement(audio, url);
      setIsPlaying(true);
      setPlaybackError("");
    } catch (error) {
      setIsPlaying(false);
      debugLog("error", "handlePlayPause failed", { message: error.message });
      setPlaybackError(error.message.slice(0, 90));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (Number.isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleArtworkTap = () => {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      toggleDebug();
    }
  };

  return (
    <div className="audio-player" role="region" aria-label="Audio player">
      <div className="player-track-info">
        <img
          src={currentTrack.artwork || "https://placehold.co/56"}
          alt=""
          className="player-artwork"
          onClick={handleArtworkTap}
        />
        <div className="player-text-details">
          <h4>{currentTrack.title}</h4>
          <p>{currentTrack.artist}</p>
          {isLoading ? <span className="player-status">Loading…</span> : null}
          {playbackError ? (
            <span className="player-status player-status--tap">{playbackError}</span>
          ) : null}
        </div>
      </div>

      <div className="player-progress-row">
        <span className="player-time">{formatTime(currentTime)}</span>
        <div className="player-progress-wrap">
          <div className="player-progress-fill" style={{ width: `${progress}%` }} />
          <input
            type="range"
            className="progress-slider"
            min={0}
            max={duration || 0}
            step="any"
            value={currentTime}
            onInput={handleSeekInput}
            onChange={handleSeekInput}
            onPointerUp={handleSeekCommit}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            aria-label="Seek"
          />
        </div>
        <span className="player-time">{formatTime(duration)}</span>
      </div>

      <div className="player-controls-row">
        <div className="player-volume-zone">
          <span className="player-volume-icon" aria-hidden="true">🔊</span>
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={1}
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
          />
        </div>

        <div className="player-controls">
          <button
            type="button"
            className="control-btn"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="Previous track"
          >
            ⏮
          </button>
          <button
            type="button"
            className="control-btn play-toggle"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoading && !isPlaying ? "◌" : isPlaying ? "⏸" : "▶"}
          </button>
          <button
            type="button"
            className="control-btn"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next track"
          >
            ⏭
          </button>
        </div>

        <div className="player-controls-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
