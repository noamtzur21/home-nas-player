import { useCallback, useEffect, useRef, useState } from "react";
import { playAudioElement } from "../utils/audioPlayback";
import { buildStreamUrl } from "../utils/stream";
import { DEFAULT_OFFLINE_ARTWORK } from "../utils/defaultArtwork";
import { getArtworkUrl } from "../utils/offlineStorage";
import { buildMediaSessionArtwork, resolveMediaSessionArtwork } from "../utils/mediaSessionArtwork";
import { useBackgroundPlayback } from "./useBackgroundPlayback.js";
import { useMediaSession } from "./useMediaSession.js";

export function usePersistentAudio({
  audioRef,
  activeTrack,
  isPlaying,
  setIsPlaying,
  onTrackEnded,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  queueIndex = 0,
  queueSize = 0,
  playlistName = "Noam Spotify",
}) {
  const [streamUrl, setStreamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [artworkUrl, setArtworkUrl] = useState(DEFAULT_OFFLINE_ARTWORK);
  const [sessionArtwork, setSessionArtwork] = useState(null);
  const loadedTrackKeyRef = useRef(null);

  const { markUserPaused } = useBackgroundPlayback({ audioRef, isPlaying });

  useEffect(() => {
    if (!activeTrack) {
      setStreamUrl("");
      setPlaybackError("");
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let cancelled = false;
    loadedTrackKeyRef.current = null;
    setStreamUrl("");
    setCurrentTime(0);
    setDuration(0);
    setPlaybackError("");
    setIsLoading(true);

    getArtworkUrl(activeTrack.id, activeTrack.artwork || DEFAULT_OFFLINE_ARTWORK).then(async (url) => {
      if (cancelled) return;
      const resolved = url || DEFAULT_OFFLINE_ARTWORK;
      setArtworkUrl(resolved);
      const forSession = await resolveMediaSessionArtwork(resolved);
      if (!cancelled) setSessionArtwork(forSession);
    });

    buildStreamUrl(activeTrack)
      .then((url) => {
        if (cancelled) return;
        if (!url) {
          setPlaybackError("Could not load audio");
          setIsLoading(false);
          return;
        }
        setStreamUrl(url);
        setIsLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setPlaybackError(error.message?.slice(0, 80) || "Playback failed");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTrack, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl || !activeTrack) return;

    const trackKey = activeTrack.id;
    if (loadedTrackKeyRef.current === trackKey) return;

    loadedTrackKeyRef.current = trackKey;
    audio.src = streamUrl;
    setIsLoading(true);
  }, [audioRef, streamUrl, activeTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => {
      setIsLoading(false);
      setPlaybackError("");
    };
    const onPlaying = () => {
      setIsLoading(false);
      setPlaybackError("");
    };
    const onEnded = () => onTrackEnded?.();
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setPlaybackError("Playback error");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audioRef, onTrackEnded, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    if (isPlaying && streamUrl) {
      if (audio.paused) {
        playAudioElement(audio, streamUrl).catch(() => {
          setIsPlaying(false);
          setPlaybackError("Tap play to start");
        });
      }
    } else if (!isPlaying) {
      audio.pause();
    }
  }, [isPlaying, streamUrl, audioRef, setIsPlaying]);

  const handleMediaPlay = useCallback(async () => {
    const audio = audioRef.current;
    setIsPlaying(true);
    if (audio?.paused && streamUrl) {
      await playAudioElement(audio, streamUrl).catch(() => setIsPlaying(false));
    }
  }, [audioRef, setIsPlaying, streamUrl]);

  const handleMediaPause = useCallback(() => {
    markUserPaused();
    setIsPlaying(false);
  }, [markUserPaused, setIsPlaying]);

  useMediaSession({
    title: activeTrack?.title,
    artist: activeTrack?.artist,
    album: playlistName,
    artwork: sessionArtwork,
    isPlaying,
    currentTime,
    duration,
    onPlay: handleMediaPlay,
    onPause: handleMediaPause,
    onStop: handleMediaPause,
    onNext,
    onPrevious,
    onSeek: (time) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setCurrentTime(time);
    },
    hasNext,
    hasPrevious,
    queueIndex,
    queueSize,
  });

  const seekTo = useCallback(
    (time) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setCurrentTime(time);
    },
    [audioRef],
  );

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    if (isPlaying) {
      markUserPaused();
      setIsPlaying(false);
      return;
    }

    const url = streamUrl || (await buildStreamUrl(activeTrack).catch(() => ""));
    if (!url) {
      setPlaybackError("Still loading…");
      return;
    }

    try {
      await playAudioElement(audio, url);
      setIsPlaying(true);
      setPlaybackError("");
    } catch {
      setIsPlaying(false);
      setPlaybackError("Could not play");
    }
  }, [activeTrack, audioRef, isPlaying, markUserPaused, setIsPlaying, streamUrl]);

  return {
    streamUrl,
    isLoading,
    playbackError,
    currentTime,
    duration,
    artworkUrl,
    seekTo,
    togglePlayPause,
  };
}
