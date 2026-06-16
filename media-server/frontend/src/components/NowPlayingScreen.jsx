import { useEffect, useState } from "react";
import { darken, extractDominantColor, rgbString } from "../utils/dominantColor";
import { IconChevronDown, IconMinusCircle, IconNext, IconPause, IconPlay, IconPrevious, IconSpinner } from "./PlayerIcons.jsx";
import SeekSlider from "./SeekSlider.jsx";
import "./NowPlayingScreen.css";

function formatTime(seconds) {
  if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function NowPlayingScreen({
  currentTrack,
  artworkUrl,
  isPlaying,
  isLoading,
  playbackError,
  currentTime,
  duration,
  onTogglePlayPause,
  onSeek,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onClose,
  onRemoveTrack,
}) {
  const [tint, setTint] = useState(null);
  const [previewTime, setPreviewTime] = useState(null);

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

  const displayTime = previewTime ?? currentTime;
  const remaining = Math.max(duration - displayTime, 0);

  const background = tint
    ? `linear-gradient(180deg, ${rgbString(tint)} 0%, ${rgbString(darken(tint, 0.18))} 45%, #0a0a0a 100%)`
    : "linear-gradient(180deg, #1f4f43 0%, #122621 45%, #0a0a0a 100%)";

  const handleRemove = () => {
    const confirmed = window.confirm(`להסיר את "${currentTrack.title}" מהפלייליסט?`);
    if (!confirmed) return;
    onRemoveTrack?.(currentTrack.id);
  };

  return (
    <div className="now-playing-screen" style={{ background }}>
      <div className="now-playing-header">
        <button type="button" className="now-playing-icon-btn" onClick={onClose} aria-label="Minimize player">
          <IconChevronDown />
        </button>
        <span className="now-playing-header-label">{currentTrack.artist}</span>
        <span className="now-playing-header-spacer" aria-hidden="true" />
      </div>

      <div className="now-playing-art-wrap">
        <img src={artworkUrl} alt="" className="now-playing-art" />
      </div>

      <div className="now-playing-title-row">
        <div className="now-playing-title-text">
          <h2>{currentTrack.title}</h2>
          <p>{currentTrack.artist}</p>
        </div>
        {onRemoveTrack ? (
          <button
            type="button"
            className="now-playing-icon-btn now-playing-remove-btn"
            onClick={handleRemove}
            aria-label={`Remove ${currentTrack.title} from playlist`}
          >
            <IconMinusCircle />
          </button>
        ) : null}
      </div>

      {playbackError ? <p className="now-playing-error">{playbackError}</p> : null}

      <div className="now-playing-progress-row">
        <SeekSlider
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          onSeekPreview={setPreviewTime}
          className="now-playing-seek"
        />
        <div className="now-playing-time-row">
          <span>{formatTime(displayTime)}</span>
          <span>-{formatTime(remaining)}</span>
        </div>
      </div>

      <div className="now-playing-transport-row now-playing-transport-row--simple">
        <button
          type="button"
          className="now-playing-skip-btn"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous track"
        >
          <IconPrevious />
        </button>

        <button
          type="button"
          className="now-playing-play-btn"
          onClick={onTogglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading && !isPlaying ? <IconSpinner /> : isPlaying ? <IconPause /> : <IconPlay />}
        </button>

        <button
          type="button"
          className="now-playing-skip-btn"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next track"
        >
          <IconNext />
        </button>
      </div>
    </div>
  );
}
