import { useEffect, useState } from "react";
import { darken, extractDominantColor, rgbString } from "../utils/dominantColor";
import { IconDevices, IconPause, IconPlay, IconSpinner } from "./PlayerIcons.jsx";
import "./AudioPlayer.css";

export default function AudioPlayer({
  currentTrack,
  artworkUrl,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  onTogglePlayPause,
  onExpand,
}) {
  const [tint, setTint] = useState(null);

  useEffect(() => {
    let cancelled = false;
    extractDominantColor(artworkUrl).then((color) => {
      if (!cancelled) setTint(color);
    });
    return () => {
      cancelled = true;
    };
  }, [artworkUrl]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const background = tint
    ? `linear-gradient(120deg, ${rgbString(tint)} 0%, ${rgbString(darken(tint))} 100%)`
    : "linear-gradient(120deg, #1f4f43 0%, #0c0c0c 100%)";

  return (
    <div className="mini-player" style={{ background }}>
      <span className="mini-player-progress" style={{ width: `${progress}%` }} aria-hidden="true" />

      <button type="button" className="mini-player-main" onClick={onExpand} aria-label={`Now playing: ${currentTrack.title}`}>
        <img src={artworkUrl} alt="" className="mini-player-art" />
        <span className="mini-player-text">
          <strong>{currentTrack.title}</strong>
          <span>{currentTrack.artist}</span>
        </span>
      </button>

      <span className="mini-player-actions">
        <span className="mini-player-icon-btn" aria-hidden="true">
          <IconDevices />
        </span>
        <button
          type="button"
          className="mini-player-icon-btn mini-player-play"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={onTogglePlayPause}
        >
          {isLoading && !isPlaying ? <IconSpinner /> : isPlaying ? <IconPause /> : <IconPlay />}
        </button>
      </span>
    </div>
  );
}
