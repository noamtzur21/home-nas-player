import { useState } from "react";
import { copyYoutubeUrl, getYoutubeUrl } from "../utils/youtubeUrl.js";
import "./SearchResults.css";

export default function SearchResults({
  query,
  results,
  isSearching,
  error,
  selectedResultId,
  onSelectResult,
  hasMore,
  onLoadMore,
}) {
  const [copyFeedback, setCopyFeedback] = useState("");

  if (!query && results.length === 0 && !error) {
    return null;
  }

  const selected = results.find((result) => result.id === selectedResultId) || results[0];
  const selectedUrl = selected ? getYoutubeUrl(selected) : "";

  const handleCopy = async (result) => {
    onSelectResult(result);
    try {
      await copyYoutubeUrl(result);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("Copy failed");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  return (
    <section className="search-results">
      <div className="search-results-header">
        <div>
          <h2>Song URL</h2>
          {query ? <p>Results for "{query}"</p> : null}
        </div>
        <span>{results.length} matches</span>
      </div>

      {error ? <p className="search-results-error">{error}</p> : null}

      {selectedUrl ? (
        <div className="search-url-hero">
          <p className="search-url-label">YouTube URL</p>
          <a href={selectedUrl} target="_blank" rel="noreferrer" className="search-url-link">
            {selectedUrl}
          </a>
          <div className="search-url-actions">
            <button
              type="button"
              className="result-copy-btn result-copy-btn--primary"
              onClick={() => selected && handleCopy(selected)}
            >
              {copyFeedback || "Copy URL"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="search-results-list">
        {results.map((result) => {
          const isSelected =
            selectedResultId === result.id || (!selectedResultId && result.id === results[0]?.id);
          const url = getYoutubeUrl(result);

          return (
            <button
              key={result.id}
              type="button"
              className={`search-result-row search-result-row--button ${isSelected ? "active" : ""}`}
              onClick={() => handleCopy(result)}
            >
              <img src={result.thumbnail} alt="" className="search-result-art" />
              <div className="search-result-meta">
                <strong>{result.title}</strong>
                <span>{result.artist}</span>
                <span className="search-result-url">{url}</span>
              </div>
              <span className="search-result-duration">{result.duration}</span>
              <span className="search-result-pick">{isSelected ? "Selected" : "Tap for URL"}</span>
            </button>
          );
        })}
      </div>

      {isSearching ? <p className="search-results-status">Searching...</p> : null}

      {!isSearching && !error && results.length === 0 && query ? (
        <p className="search-results-status">No results found for "{query}".</p>
      ) : null}

      {hasMore && !isSearching ? (
        <div className="search-load-more-wrap">
          <button type="button" className="search-load-more-btn" onClick={onLoadMore}>
            Show More
          </button>
        </div>
      ) : null}
    </section>
  );
}
