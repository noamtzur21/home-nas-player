import { useEffect, useRef } from "react";
import { buildMediaSessionArtwork } from "../utils/mediaSessionArtwork.js";

const SEEK_STEP_SECONDS = 10;
const POSITION_SYNC_MS = 1000;

function isMediaSessionSupported() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

function syncPositionState({ duration, currentTime, isPlaying }) {
  if (!isMediaSessionSupported() || duration <= 0 || !Number.isFinite(currentTime)) return;

  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: isPlaying ? 1 : 0,
      position: Math.min(Math.max(currentTime, 0), duration),
    });
  } catch {
    // Safari may reject until media is ready.
  }
}

export function useMediaSession({
  title,
  artist,
  album = "Noam Music",
  artwork,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onStop,
  hasNext = false,
  hasPrevious = false,
  queueIndex = 0,
  queueSize = 0,
}) {
  const seekRef = useRef(onSeek);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);

  seekRef.current = onSeek;
  currentTimeRef.current = currentTime;
  durationRef.current = duration;

  const albumLabel =
    queueSize > 1 ? `${album} · ${queueIndex + 1} of ${queueSize}` : album;

  useEffect(() => {
    if (!isMediaSessionSupported()) return undefined;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
      album: albumLabel,
      artwork: buildMediaSessionArtwork(artwork),
    });

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    syncPositionState({ duration, currentTime, isPlaying });
  }, [title, artist, albumLabel, artwork, isPlaying, currentTime, duration]);

  useEffect(() => {
    if (!isMediaSessionSupported() || !isPlaying || duration <= 0) return undefined;

    const timer = window.setInterval(() => {
      syncPositionState({ duration, currentTime, isPlaying: true });
    }, POSITION_SYNC_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying, duration, currentTime]);

  useEffect(() => {
    if (!isMediaSessionSupported()) return undefined;

    const setHandler = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Unsupported on this device (common for some CarPlay builds).
      }
    };

    setHandler("play", () => onPlay?.());
    setHandler("pause", () => onPause?.());
    setHandler("stop", () => onStop?.() ?? onPause?.());

    setHandler(
      "nexttrack",
      hasNext
        ? () => {
            onNext?.();
          }
        : null,
    );

    setHandler(
      "previoustrack",
      hasPrevious
        ? () => {
            onPrevious?.();
          }
        : null,
    );

    setHandler("seekto", (details) => {
      if (details.seekTime == null) return;
      seekRef.current?.(details.seekTime);
    });

    setHandler("seekforward", (details) => {
      const offset = details.seekOffset ?? SEEK_STEP_SECONDS;
      const max = durationRef.current || Infinity;
      seekRef.current?.(Math.min(currentTimeRef.current + offset, max));
    });

    setHandler("seekbackward", (details) => {
      const offset = details.seekOffset ?? SEEK_STEP_SECONDS;
      seekRef.current?.(Math.max(currentTimeRef.current - offset, 0));
    });

    return () => {
      [
        "play",
        "pause",
        "stop",
        "nexttrack",
        "previoustrack",
        "seekto",
        "seekforward",
        "seekbackward",
      ].forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          /* ignore */
        }
      });
    };
  }, [onPlay, onPause, onStop, onNext, onPrevious, hasNext, hasPrevious]);
}

export { SEEK_STEP_SECONDS };
