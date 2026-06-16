import { useState } from "react";
import { searchApiUrl } from "../utils/apiBase";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { searchVideosForApp } from "../utils/pipedSearch";

async function fetchSearchResults(query) {
  try {
    const response = await fetchWithTimeout(searchApiUrl(query), 12000);
    if (response.ok) {
      const payload = await response.json();
      const results = Array.isArray(payload.results) ? payload.results : [];
      if (results.length) return results;
    }
  } catch {
    /* try piped fallback below */
  }

  return searchVideosForApp(query);
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  const runSearch = async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError("");
      return { ok: false, empty: true };
    }

    setIsSearching(true);
    setError("");

    try {
      const nextResults = await fetchSearchResults(trimmed);
      if (!nextResults.length) {
        setResults([]);
        setLastQuery(trimmed);
        setQuery(trimmed);
        return { ok: true };
      }

      setResults(nextResults);
      setLastQuery(trimmed);
      setQuery(trimmed);
      return { ok: true };
    } catch {
      setResults([]);
      setError("החיפוש נכשל. נסה שוב.");
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
