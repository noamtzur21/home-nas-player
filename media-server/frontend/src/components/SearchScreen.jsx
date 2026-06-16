import SearchBar from "./SearchBar.jsx";
import SearchResults from "./SearchResults.jsx";
import SuggestionsPanel from "./SuggestionsPanel.jsx";
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
  suggestions,
  isLoadingSuggestions,
  suggestionsError,
  onRefreshSuggestions,
  showSuggestions,
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

      {showSuggestions ? (
        <SuggestionsPanel
          suggestions={suggestions}
          isLoading={isLoadingSuggestions}
          error={suggestionsError}
          onRefresh={onRefreshSuggestions}
          onSelectResult={onSelectResult}
          selectedResultId={selectedResultId}
        />
      ) : null}

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
