import { useState } from "react";
import "./AddTrackForm.css";

export default function AddTrackForm({ onSubmit, onCancel, initialValues }) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [artist, setArtist] = useState(initialValues?.artist || "");
  const [sourceUrl, setSourceUrl] = useState(initialValues?.sourceUrl || "");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onSubmit({ title, artist, sourceUrl });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setTitle("");
    setArtist("");
    setSourceUrl("");
    setError("");
  };

  return (
    <section className="add-track-panel">
      <div className="add-track-header">
        <div>
          <h2>Save to playlist</h2>
          <p>Store a media URL with a custom song name and artist.</p>
        </div>
        {onCancel ? (
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Close
          </button>
        ) : null}
      </div>

      <form className="add-track-form" onSubmit={handleSubmit}>
        <label>
          Song name
          <input
            type="text"
            placeholder="My favorite track"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label>
          Artist
          <input
            type="text"
            placeholder="Artist name"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
          />
        </label>

        <label>
          Media URL
          <input
            type="url"
            placeholder="http://nas.local/music/song.mp3"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            Save to playlist
          </button>
        </div>
      </form>
    </section>
  );
}
