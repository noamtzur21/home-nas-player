import { ClientType, Innertube } from "youtubei.js";

export const PIPED_FALLBACKS = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.private.coffee",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.leptons.xyz",
  "https://api.piped.yt",
  "https://pipedapi.moomoo.me",
  "https://pipedapi.syncpundit.io",
  "https://piped-api.lunar.icu",
  "https://pipedapi.nosebs.ru",
  "https://pipedapi.rivo.lol",
];

const urlCache = new Map();
const CACHE_TTL_MS = 45 * 60 * 1000;

let innertubePromise;

function getCachedUrl(videoId) {
  const cached = urlCache.get(videoId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    urlCache.delete(videoId);
    return null;
  }
  return cached.url;
}

function setCachedUrl(videoId, url) {
  urlCache.set(videoId, { url, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function getPipedInstances() {
  const merged = [...PIPED_FALLBACKS];

  try {
    const response = await fetch("https://piped-instances.kavin.rocks/");
    if (response.ok) {
      const instances = await response.json();
      for (const instance of instances) {
        if (instance.api_url) merged.push(instance.api_url);
      }
    }
  } catch {
    // Use static fallbacks only.
  }

  return [...new Set(merged.map((base) => base.replace(/\/$/, "")))];
}

function pickPlayableStream(data) {
  const audioStream =
    data.audioStreams?.find((stream) => stream.mimeType?.includes("audio/mp4")) ||
    data.audioStreams?.find((stream) => stream.mimeType?.includes("audio")) ||
    data.audioStreams?.[0];
  if (audioStream?.url) return audioStream;

  return (
    data.videoStreams?.find(
      (stream) => stream.mimeType?.includes("video/mp4") && !String(stream.quality).includes("LBRY"),
    ) ||
    data.formatStreams?.find((stream) => stream.url) ||
    data.videoStreams?.[0]
  );
}

const PIPED_TIMEOUT_MS = 4500;

async function tryPipedInstance(base, videoId) {
  const response = await fetch(`${base}/streams/${encodeURIComponent(videoId)}`, {
    signal: AbortSignal.timeout(PIPED_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${base} returned ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`${base}: ${String(data.error).slice(0, 120)}`);
  }

  const playableStream = pickPlayableStream(data);
  if (!playableStream?.url) {
    throw new Error(`${base} had no playable streams`);
  }

  return {
    url: playableStream.url,
    source: `piped:${new URL(base).hostname}`,
  };
}

export async function resolveFromPiped(videoId) {
  const instances = await getPipedInstances();
  const prioritized = [
    "https://api.piped.private.coffee",
    ...instances.filter((base) => base !== "https://api.piped.private.coffee"),
  ].slice(0, 8);

  const attempts = await Promise.allSettled(
    prioritized.map((base) => tryPipedInstance(base, videoId)),
  );

  for (const attempt of attempts) {
    if (attempt.status === "fulfilled") {
      return attempt.value;
    }
  }

  const lastError = attempts
    .filter((attempt) => attempt.status === "rejected")
    .map((attempt) => attempt.reason?.message || "unknown")
    .join(" | ");

  throw new Error(lastError || "All Piped instances failed");
}

async function getInnertube() {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({ client_type: ClientType.IOS });
  }
  return innertubePromise;
}

function normalizeStreamUrl(data) {
  if (typeof data === "string") return data;
  if (data?.url) return data.url;
  if (data?.deciphered_url) return data.deciphered_url;
  return null;
}

export async function resolveFromYoutubei(videoId) {
  const cached = getCachedUrl(videoId);
  if (cached) {
    return { url: cached, source: "youtubei-ios-cache" };
  }

  const yt = await getInnertube();
  let lastError = "youtubei could not resolve stream";

  for (const type of ["audio", "video"]) {
    try {
      const data = await yt.getStreamingData(videoId, {
        type,
        quality: type === "audio" ? "best" : "360p",
      });
      const url = normalizeStreamUrl(data);
      if (!url) continue;

      setCachedUrl(videoId, url);
      return { url, source: "youtubei-ios" };
    } catch (error) {
      lastError = error.message;
    }
  }

  throw new Error(lastError);
}

export async function resolveUpstreamStreamUrl(videoId) {
  try {
    return await resolveFromPiped(videoId);
  } catch (pipedError) {
    console.warn(`[stream] Piped failed for ${videoId}:`, pipedError.message);
    return resolveFromYoutubei(videoId);
  }
}

export async function resolveFromCobalt(videoId) {
  const cobaltUrl = "https://api.cobalt.tools/";
  const body = {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    downloadMode: "audio",
    audioFormat: "mp3",
  };

  const response = await fetch(cobaltUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Cobalt returned ${response.status}`);
  }

  const data = await response.json();

  if (data.status === "error" || data.status === "rate-limit") {
    throw new Error(`Cobalt: ${data.error?.code || data.status}`);
  }

  const url = data.url;
  if (!url) {
    throw new Error(`Cobalt returned no URL (status: ${data.status})`);
  }

  return { url, source: "cobalt" };
}

export function buildAudioProxyUrl(videoId) {
  return `/api/audio?id=${encodeURIComponent(videoId)}`;
}
