import { useCallback, useEffect, useRef, useState } from "react";
import { searchApiUrl } from "../utils/apiBase";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { searchVideosForApp } from "../utils/pipedSearch";

function buildSearchQuery(tracks, usedQueries) {
  const artists = [...new Set(tracks.map((track) => track.artist).filter(Boolean))];
  if (!artists.length) return null;

  const candidates = [
    ...artists.map((artist) => `${artist} songs`),
    ...artists.map((artist) => `${artist} official`),
    ...artists.map((artist) => `${artist} playlist`),
  ];

  const fresh = candidates.filter((query) => !usedQueries.has(query));
  const pool = fresh.length ? fresh : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function searchVideos(query) {
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

export function useSuggestions(tracks) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const excludedIdsRef = useRef(new Set());
  const usedQueriesRef = useRef(new Set());
  const tracksSignature = tracks.map((track) => track.id).join("|");

  const fetchSuggestions = useCallback(async () => {
    if (!tracks.length) {
      setSuggestions([]);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const playlistIds = new Set(
        tracks.filter((track) => track.streamId).map((track) => track.streamId),
      );
      const next = [];
      let attempts = 0;

      while (next.length < 5 && attempts < 12) {
        attempts += 1;
        const query = buildSearchQuery(tracks, usedQueriesRef.current);
        if (!query) {
          usedQueriesRef.current.clear();
          continue;
        }

        usedQueriesRef.current.add(query);
        const results = await searchVideos(query);

        for (const result of results) {
          if (next.length >= 5) break;
          if (playlistIds.has(result.id)) continue;
          if (excludedIdsRef.current.has(result.id)) continue;
          if (next.some((item) => item.id === result.id)) continue;

          next.push({
            ...result,
            url: result.url || `https://www.youtube.com/watch?v=${result.id}`,
          });
        }
      }

      if (next.length < 5 && excludedIdsRef.current.size > 20) {
        usedQueriesRef.current.clear();
      }

      setSuggestions(next);
      if (!next.length) {
        setError("No new suggestions right now. Try refresh again.");
      }
    } catch (loadError) {
      setSuggestions([]);
      setError(loadError.message || "Could not load suggestions");
    } finally {
      setIsLoading(false);
    }
  }, [tracks]);

  useEffect(() => {
    excludedIdsRef.current = new Set();
    usedQueriesRef.current = new Set();
    fetchSuggestions();
  }, [tracksSignature, fetchSuggestions]);

  const refresh = useCallback(() => {
    setSuggestions((current) => {
      current.forEach((item) => excludedIdsRef.current.add(item.id));
      return current;
    });
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refresh,
    hasPlaylist: tracks.length > 0,
  };
}
