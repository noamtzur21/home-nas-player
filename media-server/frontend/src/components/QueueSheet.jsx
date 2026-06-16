import TrackArtwork from "./TrackArtwork.jsx";
import "./QueueSheet.css";

export default function QueueSheet({ isOpen, onClose, queueTracks, activeTrackId, onSelectTrack }) {
  if (!isOpen) return null;

  const activeIndex = queueTracks.findIndex((track) => track.id === activeTrackId);
  const upcoming = activeIndex >= 0 ? queueTracks.slice(activeIndex + 1) : queueTracks;

  return (
    <div className="queue-sheet-overlay" onClick={onClose} role="presentation">
      <div className="queue-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Queue">
        <div className="queue-sheet-handle" aria-hidden="true" />
        <div className="queue-sheet-header">
          <h2>Next up</h2>
          <button type="button" className="queue-sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {upcoming.length === 0 ? (
          <p className="queue-sheet-empty">No more songs queued.</p>
        ) : (
          <ul className="queue-sheet-list">
            {upcoming.map((track) => (
              <li key={track.id}>
                <button
                  type="button"
                  className="queue-sheet-item"
                  onClick={() => {
                    onSelectTrack(track);
                    onClose();
                  }}
                >
                  <TrackArtwork track={track} className="queue-sheet-art" />
                  <span className="queue-sheet-meta">
                    <strong>{track.title}</strong>
                    <span>{track.artist}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
