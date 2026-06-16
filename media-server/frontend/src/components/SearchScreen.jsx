import SearchBar from "./SearchBar.jsx";
import SearchResults from "./SearchResults.jsx";
import "./SearchScreen.css";

export default function SearchScreen({
  query,
  onQueryChange,
  onSubmit,
  isSearching,
  lastQuery,
  results,
  searchError,
  selectedResultId,
  onSelectResult,
  hasMore,
  onLoadMore,
}) {
  return (
    <div className="search-screen">
      <div className="search-screen-intro">
        <h2>Search</h2>
        <p>Find songs and copy YouTube URLs instantly.</p>
      </div>

      <SearchBar
        query={query}
        onQueryChange={onQueryChange}
        onSubmit={onSubmit}
        isSearching={isSearching}
      />

      <SearchResults
        query={lastQuery}
        results={results}
        isSearching={isSearching}
        error={searchError}
        selectedResultId={selectedResultId}
        onSelectResult={onSelectResult}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}
