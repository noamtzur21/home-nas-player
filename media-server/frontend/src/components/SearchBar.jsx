import { useRef } from "react";
import "./SearchBar.css";

export default function SearchBar({ query, onQueryChange, onSubmit, isSearching }) {
  const inputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) {
      inputRef.current?.focus();
      return;
    }
    onSubmit(query);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search songs, artists, albums"
        aria-label="Search songs, artists, albums"
      />
      <button type="submit" disabled={isSearching}>
        {isSearching ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
