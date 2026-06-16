import TrackList from "./TrackList.jsx";
import "./HomeScreen.css";

export default function HomeScreen({
  activePlaylist,
  tracks,
  activeTrackId,
  onSelectTrack,
  onOpenPlaylist,
  onAddTrack,
  onRemoveTrack,
  onRenameTrack,
  isUploading,
}) {
  return (
    <div className="home-screen">
      <section className="home-playlist-bar">
        <button type="button" className="home-playlist-switch" onClick={onOpenPlaylist}>
          <span className="home-playlist-label">My Playlist</span>
          <strong>{activePlaylist?.name || "My Playlist"}</strong>
        </button>
        <span className="home-playlist-count">{tracks.length} songs</span>
      </section>

      <TrackList
        tracks={tracks}
        activeTrackId={activeTrackId}
        onSelectTrack={onSelectTrack}
        onRemoveTrack={onRemoveTrack}
        onRenameTrack={onRenameTrack}
        onAddTrack={onAddTrack}
        title="Your songs"
        isUploading={isUploading}
      />
    </div>
  );
}
