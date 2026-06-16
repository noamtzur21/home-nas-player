import { useState } from "react";
import { IconNext, IconPause, IconPlay, IconPrevious, IconSpinner } from "./PlayerIcons.jsx";
import "./AudioPlayer.css";

export default function AudioPlayer({
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
}) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  if (!currentTrack) return null;

  const displayTime = isSeeking ? seekTime : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  const formatTime = (seconds) => {
    if (Number.isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSeekInput = (event) => {
    setIsSeeking(true);
    setSeekTime(parseFloat(event.target.value));
  };

  const handleSeekCommit = (event) => {
    const nextTime = parseFloat(event.target.value);
    onSeek(nextTime);
    setSeekTime(nextTime);
    setIsSeeking(false);
  };

  return (
    <div className="audio-player" role="region" aria-label="Audio player">
      <div className="player-track-info">
        <img src={artworkUrl} alt="" className="player-artwork" />
        <div className="player-text-details">
          <h4>{currentTrack.title}</h4>
          <p>{currentTrack.artist}</p>
          {isLoading ? <span className="player-status">Loading…</span> : null}
          {playbackError ? <span className="player-status player-status--tap">{playbackError}</span> : null}
        </div>
      </div>

      <div className="player-progress-row">
        <span className="player-time">{formatTime(displayTime)}</span>
        <div className="player-progress-wrap">
          <div className="player-progress-fill" style={{ width: `${progress}%` }} />
          <input
            type="range"
            className="progress-slider"
            min={0}
            max={duration || 0}
            step="any"
            value={displayTime}
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
        <button
          type="button"
          className="control-btn control-btn--skip"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous track"
        >
          <IconPrevious />
        </button>

        <button
          type="button"
          className="control-btn play-toggle"
          onClick={onTogglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading && !isPlaying ? <IconSpinner /> : isPlaying ? <IconPause /> : <IconPlay />}
        </button>

        <button
          type="button"
          className="control-btn control-btn--skip"
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
