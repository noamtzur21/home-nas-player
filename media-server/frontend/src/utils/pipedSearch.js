import { fetchWithTimeout } from "./fetchWithTimeout";

export const PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.leptons.xyz",
  "https://api.piped.yt",
];

export function extractVideoId(url = "") {
  const match = url.match(/(?:[?&]v=|\/shorts\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match?.[1] || null;
}

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const tokensA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeText(b).split(" ").filter(Boolean));
  if (!tokensA.size || !tokensB.size) return 0;
  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared += 1;
  }
  return (2 * shared) / (tokensA.size + tokensB.size);
}

export function pickBestVideoMatch(items, query) {
  let best = null;
  let bestScore = -1;

  for (const item of items.slice(0, 10)) {
    const id = extractVideoId(item.url || item.id || "");
    if (!id) continue;
    const score = Math.max(similarity(item.title, query), similarity(`${item.uploaderName || ""} ${item.title}`, query));
    if (score > bestScore) {
      bestScore = score;
      best = { id, title: item.title, score };
    }
  }

  return { best, bestScore };
}

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) return "";
  const total = Math.floor(Number(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function mapPipedItem(item) {
  const id = extractVideoId(item.url || item.id || "");
  if (!id) return null;

  return {
    id,
    title: item.title || "",
    artist: item.uploaderName || "",
    thumbnail: item.thumbnail || "",
    duration: formatDuration(item.duration),
    url: item.url || `https://www.youtube.com/watch?v=${id}`,
  };
}

export async function searchVideosForApp(query) {
  if (!query?.trim()) return [];

  for (const base of PIPED_INSTANCES) {
    try {
      const response = await fetchWithTimeout(
        `${base.replace(/\/$/, "")}/search?q=${encodeURIComponent(query)}&filter=videos`,
        10000,
      );
      if (!response.ok) continue;

      const data = await response.json();
      const results = (data.items || [])
        .map(mapPipedItem)
        .filter(Boolean);

      if (results.length) return results.slice(0, 20);
    } catch {
      /* try next instance */
    }
  }

  return [];
}

export async function searchPipedVideos(query) {
  if (!query?.trim()) return [];

  for (const base of PIPED_INSTANCES) {
    try {
      const response = await fetchWithTimeout(
        `${base.replace(/\/$/, "")}/search?q=${encodeURIComponent(query)}&filter=videos`,
        10000,
      );
      if (!response.ok) continue;

      const data = await response.json();
      const items = (data.items || [])
        .map((item) => ({
          id: extractVideoId(item.url),
          title: item.title || "",
          url: item.url || "",
          uploaderName: item.uploaderName || "",
        }))
        .filter((item) => item.id);

      if (items.length) return items;
    } catch {
      /* try next instance */
    }
  }

  return [];
}

export async function resolveYoutubeVideoId(track) {
  if (track?.streamId) return track.streamId;

  const query = `${track?.artist || ""} ${track?.title || ""}`.trim();
  if (!query) return null;

  const items = await searchPipedVideos(query);
  const { best } = pickBestVideoMatch(items, query);
  return best?.id || items[0]?.id || null;
}
