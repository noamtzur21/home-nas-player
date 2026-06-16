import { useState } from "react";
import TrackArtwork from "./TrackArtwork.jsx";

export default function TrackRow({ track, index, isActive, onSelectTrack, onRemoveTrack, onRenameTrack }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [error, setError] = useState("");

  const startEditing = () => {
    setTitle(track.title);
    setArtist(track.artist);
    setError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError("");
  };

  const saveEditing = (event) => {
    event.preventDefault();
    const result = onRenameTrack(track.id, { title, artist });
    if (!result?.ok) {
      setError(result?.error || "Could not save.");
      return;
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form className="track-row track-row--editing" onSubmit={saveEditing}>
        <TrackArtwork track={track} className="track-art" />
        <div className="track-edit-fields">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Song title"
            autoFocus
          />
          <input
            type="text"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Artist"
          />
          {error ? <span className="track-edit-error">{error}</span> : null}
        </div>
        <div className="track-edit-actions">
          <button type="submit" className="track-edit-save">
            Save
          </button>
          <button type="button" className="track-edit-cancel" onClick={cancelEditing}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`track-row${isActive ? " active" : ""}`}>
      <button type="button" className="track-clickable-area" onClick={() => onSelectTrack(track)}>
        <span className="track-index">{index + 1}</span>
        <TrackArtwork track={track} className="track-art" />
        <div className="track-meta">
          <strong>{track.title}</strong>
          <span>{track.artist}</span>
        </div>
      </button>

      <div className="track-actions">
        {onRenameTrack ? (
          <button
            type="button"
            className="track-rename-btn"
            onClick={startEditing}
            aria-label={`Rename ${track.title}`}
            title="Edit song name / artist"
          >
            ✎
          </button>
        ) : null}
        {onRemoveTrack ? (
          <button
            type="button"
            className="track-remove-btn"
            onClick={() => onRemoveTrack(track.id)}
            aria-label={`Remove ${track.title}`}
          >
            ✕
          </button>
        ) : null}
        <button type="button" className="play-badge" onClick={() => onSelectTrack(track)}>
          {isActive ? "Playing" : "Play"}
        </button>
      </div>
    </div>
  );
}
