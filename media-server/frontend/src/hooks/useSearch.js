import { useState } from "react";

const BACKEND_URL = "https://media-server-backend-qqjx.onrender.com";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const runSearch = async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setError("Enter a search term.");
      setResults([]);
      setHasMore(false);
      return;
    }

    setIsSearching(true);
    setError("");
    setPage(1);

    const params = new URLSearchParams({ q: trimmed, page: "1" });
    const targetUrl = `${BACKEND_URL}/search?${params.toString()}`;

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Server returned status ${response.status}`);
      }

      const payload = await response.json();
      setResults(Array.isArray(payload.results) ? payload.results : []);
      setHasMore(payload.hasMore || false);
      setLastQuery(trimmed);
      setQuery(trimmed);
    } catch (searchError) {
      setResults([]);
      setHasMore(false);
      // מציג על המסך באייפון את השגיאה הפיזית האמיתית
      setError(`Error: ${searchError.message} | URL: ${targetUrl}`);
    } finally {
      setIsSearching(false);
    }
  };

  const loadMore = async () => {
    if (isSearching || !hasMore || !lastQuery) return;

    const nextPage = page + 1;
    setIsSearching(true);
    const params = new URLSearchParams({ q: lastQuery, page: nextPage.toString() });
    const targetUrl = `${BACKEND_URL}/search?${params.toString()}`;

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) throw new Error("Failed to load more results.");

      const payload = await response.json();
      const newTracks = Array.isArray(payload.results) ? payload.results : [];

      setResults((prev) => [...prev, ...newTracks]);
      setPage(nextPage);
      setHasMore(payload.hasMore || false);
    } catch (searchError) {
      setError(`LoadMore Error: ${searchError.message} | URL: ${targetUrl}`);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setLastQuery("");
    setError("");
    setPage(1);
    setHasMore(false);
  };

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    lastQuery,
    hasMore,
    runSearch,
    loadMore,
    clearResults,
  };
}