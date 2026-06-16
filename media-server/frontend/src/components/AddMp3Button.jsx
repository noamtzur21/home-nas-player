import { useRef } from "react";
import "./AddMp3Button.css";

export default function AddMp3Button({ onUpload, disabled }) {
  const inputRef = useRef(null);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      for (const file of files) {
        const result = await onUpload({ file });
        if (!result.ok) throw new Error(result.error);
      }
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
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
        className="add-mp3-btn"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label="Add MP3"
        title="Add song"
      >
        +
      </button>
    </>
  );
}
