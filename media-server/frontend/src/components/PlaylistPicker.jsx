import { useState } from "react";
import "./PlaylistPicker.css";

export default function PlaylistPicker({
  isOpen,
  onClose,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreatePlaylist(trimmed);
    setNewName("");
    setMessage("Playlist created");
    setTimeout(() => setMessage(""), 2000);
  };

  const handleDelete = async (id) => {
    const result = await onDeletePlaylist(id);
    setMessage(result.ok ? "Playlist removed" : result.error);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleRename = (id) => {
    const result = onRenamePlaylist(id, editName);
    if (result.ok) {
      setEditingId("");
      setEditName("");
    } else {
      setMessage(result.error);
      setTimeout(() => setMessage(""), 2500);
    }
  };

  return (
    <div className="playlist-picker-overlay" onClick={onClose} role="presentation">
      <div className="playlist-picker-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="My playlists">
        <div className="playlist-picker-handle" aria-hidden="true" />
        <div className="playlist-picker-header">
          <h2>My Playlists</h2>
          <button type="button" className="playlist-picker-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="playlist-picker-create">
          <input
            type="text"
            placeholder="New playlist name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleCreate()}
          />
          <button type="button" onClick={handleCreate}>
            Add
          </button>
        </div>

        {message ? <p className="playlist-picker-message">{message}</p> : null}

        <ul className="playlist-picker-list">
          {playlists.map((playlist) => {
            const isActive = playlist.id === activePlaylistId;
            const isEditing = editingId === playlist.id;

            return (
              <li key={playlist.id} className={`playlist-picker-item${isActive ? " active" : ""}`}>
                <button
                  type="button"
                  className="playlist-picker-select"
                  onClick={() => {
                    onSelectPlaylist(playlist.id);
                    onClose();
                  }}
                >
                  <span className="playlist-picker-cover" style={{ background: playlist.gradient }} />
                  <span className="playlist-picker-meta">
                    <strong>{playlist.name}</strong>
                    <span>{playlist.tracks.length} songs</span>
                  </span>
                  {isActive ? <span className="playlist-picker-badge">Active</span> : null}
                </button>

                <div className="playlist-picker-actions">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && handleRename(playlist.id)}
                      />
                      <button type="button" onClick={() => handleRename(playlist.id)}>
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(playlist.id);
                        setEditName(playlist.name);
                      }}
                    >
                      Rename
                    </button>
                  )}
                  <button type="button" className="danger" onClick={() => handleDelete(playlist.id)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
