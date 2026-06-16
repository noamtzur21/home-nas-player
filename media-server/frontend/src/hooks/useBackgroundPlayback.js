import { useEffect, useRef } from "react";
import { debugLog } from "../utils/debugLog.js";

/**
 * Keeps audio playing when the app goes to background, lock screen, or another app.
 * Stops only when the user pauses or the OS kills the app (force quit / power off).
 */
export function useBackgroundPlayback({ audioRef, isPlaying }) {
  const isPlayingRef = useRef(isPlaying);
  const userPausedRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) {
      userPausedRef.current = false;
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const resumePlayback = () => {
      if (userPausedRef.current || !isPlayingRef.current) return;
      if (audio.paused && audio.src) {
        audio.play().catch((error) => {
          debugLog("warn", "Background resume failed", { message: error.message });
        });
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        debugLog("info", "App backgrounded — keeping playback alive");
        resumePlayback();
      }
    };

    const onPageHide = () => {
      resumePlayback();
    };

    const onAudioPause = () => {
      if (userPausedRef.current || !isPlayingRef.current) return;
      if (document.hidden) {
        debugLog("info", "System paused in background — resuming");
        window.setTimeout(resumePlayback, 120);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    audio.addEventListener("pause", onAudioPause);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      audio.removeEventListener("pause", onAudioPause);
    };
  }, [audioRef]);

  const markUserPaused = () => {
    userPausedRef.current = true;
    isPlayingRef.current = false;
  };

  return { markUserPaused };
}
