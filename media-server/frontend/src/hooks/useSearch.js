import { useState } from "react";

// הכתובת הרשמית של השרת שלך ב-Render
const BACKEND_URL = "https://media-server-backend-qqjx.onrender.com";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // חיפוש ראשוני (עמוד 1)
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
    setPage(1); // מאפסים לעמוד הראשון

    try {
      const params = new URLSearchParams({ q: trimmed, page: "1" });
      // פנייה ישירה לשרת בענן במקום ל-localhost
      const response = await fetch(`${BACKEND_URL}/search?${params.toString()}`);

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Search failed with ${response.status}`);
      }

      const payload = await response.json();
      setResults(Array.isArray(payload.results) ? payload.results : []);
      setHasMore(payload.hasMore || false);
      setLastQuery(trimmed);
      setQuery(trimmed);
    } catch (searchError) {
      setResults([]);
      setHasMore(false);
      setError(searchError.message || "Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  // טעינת עמודים נוספים (לחיצה על Show More)
  const loadMore = async () => {
    if (isSearching || !hasMore || !lastQuery) return;

    const nextPage = page + 1;
    setIsSearching(true);

    try {
      const params = new URLSearchParams({ q: lastQuery, page: nextPage.toString() });
      // פנייה ישירה לשרת בענן במקום ל-localhost
      const response = await fetch(`${BACKEND_URL}/search?${params.toString()}`);

      if (!response.ok) throw new Error("Failed to load more results.");

      const payload = await response.json();
      const newTracks = Array.isArray(payload.results) ? payload.results : [];

      // משרשרים את השירים החדשים לקצה של המערך הקיים!
      setResults((prev) => [...prev, ...newTracks]);
      setPage(nextPage);
      setHasMore(payload.hasMore || false);
    } catch (searchError) {
      setError(searchError.message || "Failed to load more tracks.");
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