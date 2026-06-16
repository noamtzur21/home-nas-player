import { useState } from "react";
import TrackList from "./TrackList.jsx";
import "./LibraryScreen.css";

export default function LibraryScreen({
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onRemoveTrack,
  onRenameTrack,
  onUploadMp3,
  onSelectTrack,
  activeTrackId,
  onCreatePlaylist,
  isUploading,
}) {
  const [view, setView] = useState("grid");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId);

  const openPlaylist = (id) => {
    setSelectedPlaylistId(id);
    onSelectPlaylist(id);
    setView("detail");
  };

  const handleCreate = () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    const created = onCreatePlaylist(trimmed);
    setNewPlaylistName("");
    if (created?.id) openPlaylist(created.id);
  };

  if (view === "detail" && selectedPlaylist) {
    return (
      <div className="library-screen">
        <button type="button" className="library-back" onClick={() => setView("grid")}>
          ← All playlists
        </button>

        <div className="library-detail-hero library-detail-hero--compact" style={{ background: selectedPlaylist.gradient }}>
          <p>Playlist</p>
          <h2>{selectedPlaylist.name}</h2>
          <span>{selectedPlaylist.tracks.length} songs</span>
        </div>

        <TrackList
          tracks={selectedPlaylist.tracks}
          activeTrackId={activeTrackId}
          onSelectTrack={(track) => onSelectTrack(track, selectedPlaylist.id)}
          onRemoveTrack={(trackId) => onRemoveTrack(trackId, selectedPlaylist.id)}
          onRenameTrack={(trackId, fields) => onRenameTrack(trackId, fields, selectedPlaylist.id)}
          onAddTrack={(payload) => onUploadMp3({ ...payload, playlistId: selectedPlaylist.id })}
          title={selectedPlaylist.name}
          isUploading={isUploading}
        />
      </div>
    );
  }

  return (
    <div className="library-screen">
      <div className="library-header">
        <h2>Your Library</h2>
        <p>{playlists.length} playlists</p>
      </div>

      <div className="library-create">
        <input
          type="text"
          placeholder="Create new playlist"
          value={newPlaylistName}
          onChange={(event) => setNewPlaylistName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleCreate()}
        />
        <button type="button" onClick={handleCreate}>
          Create
        </button>
      </div>

      <div className="library-grid">
        {playlists.map((playlist) => {
          const isActive = playlist.id === activePlaylistId;
          return (
            <button
              key={playlist.id}
              type="button"
              className={`library-card${isActive ? " active" : ""}`}
              onClick={() => openPlaylist(playlist.id)}
            >
              <div className="library-card-cover" style={{ background: playlist.gradient }}>
                <span>♫</span>
              </div>
              <div className="library-card-meta">
                <strong>{playlist.name}</strong>
                <span>{playlist.tracks.length} songs</span>
              </div>
              {isActive ? <span className="library-card-badge">Active</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
