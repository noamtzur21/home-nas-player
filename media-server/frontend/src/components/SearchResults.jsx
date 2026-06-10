import "./SearchResults.css";

export default function SearchResults({
  query,
  results,
  isSearching,
  error,
  activeTrackId,
  onPlay,
  onAdd,
  hasMore,     // פרופ חדש שמגיע מההוק
  onLoadMore,  // פונקציה חדשה לטעינה
}) {
  if (!query && results.length === 0 && !error) {
    return null;
  }

  return (
    <section className="search-results">
      <div className="search-results-header">
        <div>
          <h2>Search Results</h2>
          {query ? <p>Showing results for "{query}"</p> : null}
        </div>
        <span>{results.length} tracks</span>
      </div>

      {error ? <p className="search-results-error">{error}</p> : null}

      <div className="search-results-list">
        {results.map((result) => {
          const isActive = activeTrackId === result.id;
          return (
            <div key={result.id} className={`search-result-row ${isActive ? "active" : ""}`}>
              <img src={result.thumbnail} alt="" className="search-result-art" />
              <div className="search-result-meta">
                <strong>{result.title}</strong>
                <span>{result.artist}</span>
              </div>
              <span className="search-result-duration">{result.duration}</span>
              <div className="search-result-actions">
                <button
                  type="button"
                  className="result-add-btn"
                  onClick={() => onAdd(result)}
                  aria-label={`Add ${result.title} to playlist`}
                  title="Add to playlist"
                >
                  +
                </button>
                <button
                  type="button"
                  className="result-play-btn"
                  onClick={() => onPlay(result)}
                >
                  {isActive ? "Now Playing" : "Play"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isSearching ? (
        <p className="search-results-status" style={{ textAlign: 'center', margin: '20px 0', color: '#b3b3b3' }}>Searching your media catalog...</p>
      ) : null}

      {!isSearching && !error && results.length === 0 && query ? (
        <p className="search-results-status">No results found for "{query}".</p>
      ) : null}

      {/* כפתור ה-Show More בעיצוב ספוטיפיי נקי בתחתית הרשימה */}
      {hasMore && !isSearching && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onLoadMore}
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '50px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.04)';
              e.target.style.backgroundColor = '#f6f6f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.backgroundColor = '#fff';
            }}
          >
            Show More
          </button>
        </div>
      )}
    </section>
  );
}