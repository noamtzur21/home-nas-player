import { useEffect, useState } from "react";
import { darken, extractDominantColor, rgbString } from "../utils/dominantColor";
import {
  IconChevronDown,
  IconDevices,
  IconDots,
  IconNext,
  IconPause,
  IconPlay,
  IconPlusCircle,
  IconPrevious,
  IconQueue,
  IconRepeat,
  IconShare,
  IconShuffle,
  IconSpinner,
} from "./PlayerIcons.jsx";
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
  isShuffled,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  onOpenQueue,
  onRenameTrack,
}) {
  const [tint, setTint] = useState(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(currentTrack?.title || "");
  const [artist, setArtist] = useState(currentTrack?.artist || "");

  useEffect(() => {
    let cancelled = false;
    extractDominantColor(artworkUrl).then((color) => {
      if (!cancelled) setTint(color);
    });
    return () => {
      cancelled = true;
    };
  }, [artworkUrl]);

  useEffect(() => {
    setTitle(currentTrack?.title || "");
    setArtist(currentTrack?.artist || "");
    setIsEditing(false);
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  const displayTime = isSeeking ? seekTime : currentTime;
  const remaining = Math.max(duration - displayTime, 0);
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  const background = tint
    ? `linear-gradient(180deg, ${rgbString(tint)} 0%, ${rgbString(darken(tint, 0.18))} 45%, #0a0a0a 100%)`
    : "linear-gradient(180deg, #1f4f43 0%, #122621 45%, #0a0a0a 100%)";

  const handleShare = async () => {
    const text = `${currentTrack.title} — ${currentTrack.artist}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text });
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleSaveEdit = (event) => {
    event.preventDefault();
    const result = onRenameTrack?.(currentTrack.id, { title, artist });
    if (result?.ok) setIsEditing(false);
  };

  return (
    <div className="now-playing-screen" style={{ background }}>
      <div className="now-playing-header">
        <button type="button" className="now-playing-icon-btn" onClick={onClose} aria-label="Minimize player">
          <IconChevronDown />
        </button>
        <span className="now-playing-header-label">{currentTrack.artist}</span>
        <button type="button" className="now-playing-icon-btn" onClick={() => setIsEditing(true)} aria-label="More options">
          <IconDots />
        </button>
      </div>

      <div className="now-playing-art-wrap">
        <img src={artworkUrl} alt="" className="now-playing-art" />
      </div>

      {isEditing ? (
        <form className="now-playing-edit-form" onSubmit={handleSaveEdit}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Song title"
            autoFocus
          />
          <input type="text" value={artist} onChange={(event) => setArtist(event.target.value)} placeholder="Artist" />
          <div className="now-playing-edit-actions">
            <button type="submit" className="now-playing-edit-save">
              Save
            </button>
            <button type="button" className="now-playing-edit-cancel" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="now-playing-title-row">
          <div className="now-playing-title-text">
            <h2>{currentTrack.title}</h2>
            <p>{currentTrack.artist}</p>
          </div>
          {onRenameTrack ? (
            <button
              type="button"
              className="now-playing-icon-btn"
              onClick={() => setIsEditing(true)}
              aria-label="Edit song info"
              title="Fix song name / artist"
            >
              <IconPlusCircle />
            </button>
          ) : null}
        </div>
      )}

      {playbackError ? <p className="now-playing-error">{playbackError}</p> : null}

      <div className="now-playing-progress-row">
        <div className="now-playing-progress-wrap">
          <div className="now-playing-progress-fill" style={{ width: `${progress}%` }} />
          <input
            type="range"
            className="now-playing-progress-slider"
            min={0}
            max={duration || 0}
            step="any"
            value={displayTime}
            onInput={(event) => {
              setIsSeeking(true);
              setSeekTime(parseFloat(event.target.value));
            }}
            onChange={(event) => {
              setIsSeeking(true);
              setSeekTime(parseFloat(event.target.value));
            }}
            onPointerUp={(event) => {
              onSeek(parseFloat(event.target.value));
              setIsSeeking(false);
            }}
            aria-label="Seek"
          />
        </div>
        <div className="now-playing-time-row">
          <span>{formatTime(displayTime)}</span>
          <span>-{formatTime(remaining)}</span>
        </div>
      </div>

      <div className="now-playing-transport-row">
        <button
          type="button"
          className={`now-playing-toggle-btn${isShuffled ? " active" : ""}`}
          onClick={onToggleShuffle}
          aria-pressed={isShuffled}
          aria-label="Shuffle"
        >
          <IconShuffle />
        </button>

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

        <button
          type="button"
          className={`now-playing-toggle-btn${repeatMode !== "off" ? " active" : ""}`}
          onClick={onCycleRepeat}
          aria-pressed={repeatMode !== "off"}
          aria-label={`Repeat: ${repeatMode}`}
        >
          <IconRepeat mode={repeatMode} />
        </button>
      </div>

      <div className="now-playing-bottom-row">
        <span className="now-playing-icon-btn" aria-hidden="true">
          <IconDevices />
        </span>
        <button type="button" className="now-playing-icon-btn" onClick={handleShare} aria-label="Share">
          <IconShare />
        </button>
        <button type="button" className="now-playing-icon-btn" onClick={onOpenQueue} aria-label="Queue">
          <IconQueue />
        </button>
      </div>
    </div>
  );
}
