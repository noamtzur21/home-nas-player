import { useEffect } from "react";

function isMediaSessionSupported() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

export function useMediaSession({
  title,
  artist,
  album = "My Playlist",
  artwork,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  hasNext = false,
  hasPrevious = false,
}) {
  useEffect(() => {
    if (!isMediaSessionSupported()) return undefined;

    const artworkTypes = artwork
      ? [
          { src: artwork, sizes: "96x96", type: "image/jpeg" },
          { src: artwork, sizes: "256x256", type: "image/jpeg" },
          { src: artwork, sizes: "512x512", type: "image/jpeg" },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
      album,
      artwork: artworkTypes,
    });

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    if (duration > 0 && Number.isFinite(currentTime)) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(Math.max(currentTime, 0), duration),
        });
      } catch {
        // Some browsers reject position updates until playback is ready.
      }
    }
  }, [title, artist, album, artwork, isPlaying, currentTime, duration]);

  useEffect(() => {
    if (!isMediaSessionSupported()) return undefined;

    const setHandler = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Action may be unsupported on this device/browser.
      }
    };

    setHandler("play", () => {
      onPlay?.();
    });

    setHandler("pause", () => {
      onPause?.();
    });

    setHandler("nexttrack", hasNext
      ? () => {
          onNext?.();
        }
      : null);

    setHandler("previoustrack", hasPrevious
      ? () => {
          onPrevious?.();
        }
      : null);

    setHandler("seekto", onSeek
      ? (details) => {
          if (details.seekTime != null) {
            onSeek(details.seekTime);
          }
        }
      : null);

    return () => {
      ["play", "pause", "nexttrack", "previoustrack", "seekto"].forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore cleanup errors.
        }
      });
    };
  }, [onPlay, onPause, onNext, onPrevious, onSeek, hasNext, hasPrevious]);
}
