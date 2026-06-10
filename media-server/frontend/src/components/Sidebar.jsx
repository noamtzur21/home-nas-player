import "./Sidebar.css";

export default function Sidebar({
  tracks,
  activeTrackId,
  onSelectTrack,
  onRemoveTrack,
  onAddClick,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">♪</div>
        <div>
          <strong>My Playlist</strong>
          <span>{tracks.length} saved {tracks.length === 1 ? "track" : "tracks"}</span>
        </div>
      </div>

      <button type="button" className="sidebar-add-btn" onClick={onAddClick}>
        + Add track
      </button>

      <nav className="sidebar-nav" aria-label="Saved playlist">
        {tracks.length === 0 ? (
          <p className="sidebar-empty">
            No saved tracks yet. Add a song with a custom name, artist, and media URL.
          </p>
        ) : (
          tracks.map((track) => {
            const isActive = track.id === activeTrackId;
            return (
              <div key={track.id} className={`sidebar-track ${isActive ? "active" : ""}`}>
                <button
                  type="button"
                  className="sidebar-track-btn"
                  onClick={() => onSelectTrack(track)}
                >
                  <img src={track.artwork} alt="" className="sidebar-track-art" />
                  <span className="sidebar-track-meta">
                    <strong>{track.title}</strong>
                    <small>{track.artist}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="sidebar-remove-btn"
                  onClick={() => onRemoveTrack(track.id)}
                  aria-label={`Remove ${track.title}`}
                  title="Remove from playlist"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}
