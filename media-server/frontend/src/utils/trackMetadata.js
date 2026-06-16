// Junk fragments that show up in YouTube upload titles/filenames but aren't
// part of the actual song name or artist. Hebrew + English variants.
const JUNK_PATTERNS = [
  /^(ytmp3|y2mate|ssyoutube|mp3juice|320ytmp3)[^\w]*/i,
  /^\d+[-_\s]*/,
  /\(?\[?official\s*(music\s*)?video\)?\]?/gi,
  /\(?\[?official\s*(music\s*)?audio\)?\]?/gi,
  /\(?\[?lyrics?\s*video\)?\]?/gi,
  /\(?\[?visualizer\)?\]?/gi,
  /\(audio\)/gi,
  /\(lyrics?\)/gi,
  /\(hd\)/gi,
  /\(4k\)/gi,
  /320\s*kbps/gi,
  /128\s*kbps/gi,
  /free\s*download/gi,
  /הקליפ\s*הרשמי/gi,
  /הסרטון\s*הרשמי/gi,
  /וידאו\s*רשמי/gi,
  /אודיו\s*רשמי/gi,
  /קליפ\s*רשמי/gi,
  /מילים\s*ולחן\s*[:\-]?[^|()[\]]*/gi,
  /מילים\s*[:\-][^|()[\]]*/gi,
  /לחן\s*[:\-][^|()[\]]*/gi,
  /מפיק\s*[:\-][^|()[\]]*/gi,
  /הפקה\s*[:\-][^|()[\]]*/gi,
  /מופץ\s*ע["׳]?י[^|()[\]]*/gi,
  /prod(uced)?\.?\s*by\s*[^|()[\]]*/gi,
];

// Keywords that, if found inside a bracketed/parenthesised chunk, mean the
// whole chunk is junk (production credits, channel notes, etc). Brackets
// that DON'T match any of these are left alone, since they're often a real
// part of the song name (Remix, Live, feat. X, Acoustic...).
const BRACKET_JUNK_KEYWORDS =
  /official|lyrics?|audio|video|hd|4k|kbps|prod(uced)?|מילים|לחן|מפיק|הפקה|מופץ|הרשמי|רשמי|free\s*download/i;

function stripJunkBrackets(text) {
  return text.replace(/[([{][^)\]}]*[)\]}]/g, (match) =>
    BRACKET_JUNK_KEYWORDS.test(match) ? " " : match,
  );
}

function cleanText(text) {
  let value = stripJunkBrackets(text.trim());
  for (const pattern of JUNK_PATTERNS) {
    value = value.replace(pattern, " ");
  }
  return value
    .replace(/[|•·]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—,.:]+|[\s\-–—,.:]+$/g, "")
    .trim();
}

function cleanArtistName(name) {
  return cleanText(name).replace(/\s*-\s*topic$/i, "").replace(/vevo$/i, "").trim();
}

// --- Fuzzy matching helpers -------------------------------------------

function normalizeForCompare(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeForCompare(text).split(" ").filter(Boolean);
}

// Dice coefficient over word sets - cheap, dependency-free, and good enough
// to tell "right song" from "unrelated cover/reaction video".
function similarity(a, b) {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (!tokensA.size || !tokensB.size) return 0;

  let shared = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) shared += 1;
  }

  return (2 * shared) / (tokensA.size + tokensB.size);
}

const MATCH_CONFIDENCE_THRESHOLD = 0.3;

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

// Many official YouTube uploads format their own title as "Artist - Song".
// If a candidate's raw title still has that shape after cleaning, prefer
// splitting it that way over blindly reusing the filename's guessed artist.
function splitArtistTitle(rawTitle, guess) {
  const cleaned = cleanText(rawTitle);
  const parts = cleaned.split(/\s[-–—|]\s/).map((part) => cleanText(part)).filter(Boolean);

  if (parts.length < 2) {
    return { artist: guess.artist, title: cleaned || guess.title };
  }

  const [first, ...rest] = parts;
  const second = rest.join(" - ");

  // Whichever side looks more like the artist we guessed from the filename
  // tells us the orientation (some uploads are "Song - Artist").
  if (similarity(second, guess.artist) > similarity(first, guess.artist)) {
    return { artist: second, title: first };
  }

  return { artist: first, title: second };
}

function pickBestMatch(candidates, guess) {
  let best = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = Math.max(
      similarity(candidate.title, guess.query),
      similarity(`${candidate.artist} ${candidate.title}`, guess.query),
    );
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return { best, bestScore };
}

export async function lookupTrackMetadata(filename) {
  const guess = parseFilename(filename);

  try {
    const searchPath = import.meta.env.DEV ? "/search" : "/api/search";
    const response = await fetch(`${searchPath}?${new URLSearchParams({ q: guess.query })}`);
    if (!response.ok) return guess;

    const payload = await response.json();
    const candidates = payload.results || [];
    if (!candidates.length) return guess;

    const { best, bestScore } = pickBestMatch(candidates, guess);
    if (!best || bestScore < MATCH_CONFIDENCE_THRESHOLD) {
      return guess;
    }

    const { artist, title } = splitArtistTitle(best.title, guess);

    return {
      title: title || guess.title,
      artist: cleanArtistName(artist) || guess.artist,
      artwork: best.thumbnail,
      streamId: best.id,
      query: guess.query,
      matchConfidence: bestScore,
    };
  } catch {
    return guess;
  }
}
