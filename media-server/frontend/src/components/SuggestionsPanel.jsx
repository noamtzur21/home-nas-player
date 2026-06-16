import { useState } from "react";
import { copyYoutubeUrl, getYoutubeUrl } from "../utils/youtubeUrl.js";
import "./SuggestionsPanel.css";

export default function SuggestionsPanel({
  suggestions,
  isLoading,
  error,
  onRefresh,
  onSelectResult,
  selectedResultId,
}) {
  const [copyFeedback, setCopyFeedback] = useState("");

  const handleCopy = async (result) => {
    onSelectResult(result);
    try {
      await copyYoutubeUrl(result);
      setCopyFeedback(result.id);
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("failed");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  return (
    <section className="suggestions-panel">
      <div className="suggestions-header">
        <div>
          <h2>Suggestions for you</h2>
          <p>Based on your playlist taste</p>
        </div>
        <button type="button" className="suggestions-refresh-btn" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? <p className="suggestions-error">{error}</p> : null}

      <div className="suggestions-list">
        {suggestions.map((result) => {
          const isSelected = selectedResultId === result.id;
          const url = getYoutubeUrl(result);

          return (
            <button
              key={result.id}
              type="button"
              className={`suggestion-row ${isSelected ? "active" : ""}`}
              onClick={() => handleCopy(result)}
            >
              <img src={result.thumbnail} alt="" className="suggestion-art" />
              <div className="suggestion-meta">
                <strong>{result.title}</strong>
                <span>{result.artist}</span>
                <span className="suggestion-url">{url}</span>
              </div>
              <span className="suggestion-action">
                {copyFeedback === result.id ? "Copied!" : "Copy URL"}
              </span>
            </button>
          );
        })}
      </div>

      {!isLoading && suggestions.length === 0 && !error ? (
        <p className="suggestions-empty">Add songs to your playlist to get suggestions.</p>
      ) : null}
    </section>
  );
}
