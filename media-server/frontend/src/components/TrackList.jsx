import "./TrackList.css";

export default function TrackList({ 
  tracks, 
  activeTrackId, 
  onSelectTrack, 
  downloadTrack, 
  downloadingIds 
}) {
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
            const isDownloading = downloadingIds?.has(track.id);
            const isDownloaded = track.isDownloaded;

            return (
              <div 
                key={track.id} 
                className={`track-row ${isActive ? "active" : ""}`}
              >
                {/* אזור הניגון - לחיצה עליו מפעילה את השיר */}
                <div 
                  className="track-clickable-area" 
                  onClick={() => onSelectTrack(track)}
                >
                  <span className="track-index">{index + 1}</span>
                  <img src={track.artwork} alt="" className="track-art" />
                  <div className="track-meta">
                    <strong>{track.title}</strong>
                    <span>{track.artist}</span>
                  </div>
                </div>

                {/* אזור הפעולות - כפתור הורדה אופליין */}
                <div className="track-actions">
                  <button
                    type="button"
                    className={`download-btn ${isDownloaded ? "downloaded" : ""} ${isDownloading ? "spinning" : ""}`}
                    disabled={isDownloaded || isDownloading}
                    onClick={() => downloadTrack(track)}
                    title={isDownloaded ? "Available offline" : "Download for offline"}
                  >
                    {isDownloading ? "⏳" : isDownloaded ? "✅" : "⬇️"}
                  </button>
                  <span className="play-badge" onClick={() => onSelectTrack(track)}>
                    {isActive ? "Now Playing" : "Play"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}