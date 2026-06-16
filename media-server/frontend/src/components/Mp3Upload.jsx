import { useRef, useState } from "react";
import "./Mp3Upload.css";

function parseFilename(filename) {
  const base = filename.replace(/\.(mp3|m4a|wav|aac|ogg)$/i, "").trim();
  const parts = base.split(" - ");

  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(" - ").trim(),
    };
  }

  return {
    artist: "Local upload",
    title: base || "Untitled track",
  };
}

export default function Mp3Upload({ onUpload, trackCount }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    setMessage("");

    try {
      for (const file of files) {
        const meta = parseFilename(file.name);
        const result = await onUpload({ file, ...meta });
        if (!result.ok) {
          throw new Error(result.error);
        }
      }
      setMessage(`Added ${files.length} track${files.length === 1 ? "" : "s"} to your playlist.`);
    } catch (error) {
      setMessage(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <section className="mp3-upload-panel">
      <div className="mp3-upload-header">
        <div>
          <h2>Upload MP3</h2>
          <p>Add your own audio files to the playlist ({trackCount} tracks saved).</p>
        </div>
      </div>

      <div className="mp3-upload-actions">
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,.mp3,audio/mp4,.m4a,audio/*"
          multiple
          hidden
          onChange={handleFiles}
        />
        <button
          type="button"
          className="mp3-upload-btn"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading..." : "Choose MP3 files"}
        </button>
      </div>

      {message ? <p className="mp3-upload-message">{message}</p> : null}
    </section>
  );
}
