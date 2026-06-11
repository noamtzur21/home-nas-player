import { useState } from "react";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  const runSearch = async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError("Enter a search term.");
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const params = new URLSearchParams({ q: trimmed });
      const searchPath = import.meta.env.DEV ? "/search" : "/api/search";
      const response = await fetch(`${searchPath}?${params.toString()}`);

      if (!response.ok) throw new Error(`Search failed`);

      const payload = await response.json();
      setResults(Array.isArray(payload.results) ? payload.results : []);
      setLastQuery(trimmed);
      setQuery(trimmed);
    } catch (searchError) {
      setResults([]);
      setError("Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    lastQuery,
    hasMore: false,
    runSearch,
    loadMore: () => {},
    clearResults: () => {
      setResults([]);
      setLastQuery("");
      setError("");
    },
  };
}