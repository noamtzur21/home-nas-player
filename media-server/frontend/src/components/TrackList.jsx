import AddMp3Button from "./AddMp3Button.jsx";
import TrackArtwork from "./TrackArtwork.jsx";
import "./TrackList.css";

export default function TrackList({
  tracks,
  activeTrackId,
  onSelectTrack,
  onRemoveTrack,
  onAddTrack,
  isUploading,
  title = "Songs",
}) {
  return (
    <section className="track-panel">
      <div className="track-panel-header">
        <h2>{title}</h2>
        <div className="track-panel-header-actions">
          <span>{tracks.length} tracks</span>
          {onAddTrack ? <AddMp3Button onUpload={onAddTrack} disabled={isUploading} /> : null}
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="track-panel-empty">No songs yet. Tap + to add an MP3.</p>
      ) : (
        <div className="track-list">
          {tracks.map((track, index) => {
            const isActive = track.id === activeTrackId;

            return (
              <div key={track.id} className={`track-row${isActive ? " active" : ""}`}>
                <button type="button" className="track-clickable-area" onClick={() => onSelectTrack(track)}>
                  <span className="track-index">{index + 1}</span>
                  <TrackArtwork track={track} className="track-art" />
                  <div className="track-meta">
                    <strong>{track.title}</strong>
                    <span>{track.artist}</span>
                  </div>
                </button>

                <div className="track-actions">
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
          })}
        </div>
      )}
    </section>
  );
}
