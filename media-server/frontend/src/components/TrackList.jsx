import "./TrackList.css";

export default function TrackList({ tracks, activeTrackId, onSelectTrack }) {
  return (
    <section className="track-panel">
      <div className="track-panel-header">
        <h2>Now in your library</h2>
        <span>{tracks.length} tracks</span>
      </div>

      {tracks.length === 0 ? (
        <p className="track-panel-empty">
          Your playlist is empty. Use the sidebar or the form above to save your first track.
        </p>
      ) : (
        <div className="track-list">
          {tracks.map((track, index) => {
            const isActive = track.id === activeTrackId;
            return (
              <button
                key={track.id}
                type="button"
                className={`track-row ${isActive ? "active" : ""}`}
                onClick={() => onSelectTrack(track)}
              >
                <span className="track-index">{index + 1}</span>
                <img src={track.artwork} alt="" className="track-art" />
                <div className="track-meta">
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </div>
                <span className="play-badge">{isActive ? "Now Playing" : "Play"}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
