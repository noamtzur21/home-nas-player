import { useCallback, useRef } from "react";
import { playAudioElement } from "../utils/audioPlayback";
import { buildStreamUrl, getInstantStreamUrl } from "../utils/stream";

export function useAudioPlayback() {
  const audioRef = useRef(null);

  const playTrackWithGesture = useCallback(async (track) => {
    const audio = audioRef.current;
    if (!audio || !track) {
      return { ok: false, url: "" };
    }

    try {
      const url = await buildStreamUrl(track);
      if (!url) {
        return { ok: false, url: "" };
      }

      await playAudioElement(audio, url);
      return { ok: true, url };
    } catch {
      return { ok: false, url: getInstantStreamUrl(track) };
    }
  }, []);

  return { audioRef, playTrackWithGesture };
}
