import "./AppHeader.css";

export default function AppHeader({ activePlaylistName, onOpenPlaylists }) {
  return (
    <header className="app-header">
      <div className="app-brand">
        <span className="app-brand-mark" aria-hidden="true">
          ♫
        </span>
        <div>
          <p className="app-brand-eyebrow">Welcome back</p>
          <h1 className="app-brand-title">Noam Music</h1>
        </div>
      </div>

      <button type="button" className="playlist-chip" onClick={onOpenPlaylists}>
        <span className="playlist-chip-label">My Playlist</span>
        <span className="playlist-chip-name">{activePlaylistName}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </header>
  );
}
