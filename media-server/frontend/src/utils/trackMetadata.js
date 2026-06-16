const JUNK_PATTERNS = [
  /^(ytmp3|y2mate|ssyoutube|mp3juice|320ytmp3)[^\w]*/i,
  /^\d+[-_\s]*/,
  /\(official\s*(music\s*)?video\)/gi,
  /\[official\s*(music\s*)?video\]/gi,
  /official\s*(music\s*)?video/gi,
  /\(audio\)/gi,
  /\(lyrics?\)/gi,
  /\(hd\)/gi,
  /\(4k\)/gi,
  /320\s*kbps/gi,
  /128\s*kbps/gi,
  /free\s*download/gi,
];

function cleanText(text) {
  let value = text.trim();
  for (const pattern of JUNK_PATTERNS) {
    value = value.replace(pattern, " ");
  }
  return value.replace(/\s+/g, " ").trim();
}

function cleanArtistName(name) {
  return cleanText(name).replace(/\s*-\s*topic$/i, "").replace(/vevo$/i, "").trim();
}

export function parseFilename(filename) {
  const base = cleanText(filename.replace(/\.(mp3|m4a|wav|aac|ogg|flac)$/i, ""));
  const parts = base.split(/\s[-–—|]\s/).map((part) => cleanText(part)).filter(Boolean);

  if (parts.length >= 2) {
    const artist = parts[0];
    const title = parts.slice(1).join(" - ");
    return { artist, title, query: `${artist} ${title}` };
  }

  const words = base.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return {
      artist: words[0],
      title: words.slice(1).join(" "),
      query: base,
    };
  }

  return {
    artist: "Unknown Artist",
    title: base || "Untitled",
    query: base || filename,
  };
}

function simplifyYouTubeTitle(title, fallbackTitle) {
  const cleaned = cleanText(title);
  const parts = cleaned.split(/\s[-–—|]\s/);
  if (parts.length >= 2) {
    return cleanText(parts.slice(1).join(" - ")) || fallbackTitle;
  }
  return cleaned || fallbackTitle;
}

export async function lookupTrackMetadata(filename) {
  const guess = parseFilename(filename);

  try {
    const searchPath = import.meta.env.DEV ? "/search" : "/api/search";
    const response = await fetch(`${searchPath}?${new URLSearchParams({ q: guess.query })}`);
    if (!response.ok) return guess;

    const payload = await response.json();
    const match = payload.results?.[0];
    if (!match) return guess;

    return {
      title: simplifyYouTubeTitle(match.title, guess.title),
      artist: cleanArtistName(match.artist) || guess.artist,
      artwork: match.thumbnail,
      streamId: match.id,
      query: guess.query,
    };
  } catch {
    return guess;
  }
}
