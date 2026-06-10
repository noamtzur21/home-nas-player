const DEMO_STREAMS = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
];

export const MOCK_CATALOG = [
  {
    id: "mock-1",
    title: "Mock Song",
    artist: "Mock Artist",
    duration: "3:45",
    thumbnail: "https://placehold.co/100x100/1db954/000000?text=1",
    sourceUrl: DEMO_STREAMS[0],
  },
  {
    id: "mock-2",
    title: "Home Server Groove",
    artist: "NAS Collective",
    duration: "4:12",
    thumbnail: "https://placehold.co/100x100/169c46/ffffff?text=2",
    sourceUrl: DEMO_STREAMS[1],
  },
  {
    id: "mock-3",
    title: "Late Night Stream",
    artist: "Proxy Players",
    duration: "5:01",
    thumbnail: "https://placehold.co/100x100/1ed760/000000?text=3",
    sourceUrl: DEMO_STREAMS[2],
  },
  {
    id: "mock-4",
    title: "Playlist Starter",
    artist: "Mock Artist",
    duration: "3:18",
    thumbnail: "https://placehold.co/100x100/333333/ffffff?text=4",
    sourceUrl: DEMO_STREAMS[3],
  },
  {
    id: "mock-5",
    title: "Search Result Demo",
    artist: "Local Library",
    duration: "2:59",
    thumbnail: "https://placehold.co/100x100/555555/ffffff?text=5",
    sourceUrl: DEMO_STREAMS[4],
  },
];

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const catalogMatches = MOCK_CATALOG.filter(
    (track) =>
      track.title.toLowerCase().includes(q) || track.artist.toLowerCase().includes(q)
  ).map(({ sourceUrl: _sourceUrl, ...track }) => track);

  if (catalogMatches.length > 0) {
    return catalogMatches.slice(0, 5);
  }

  const label = titleCase(q);

  return Array.from({ length: 5 }, (_, index) => ({
    id: `mock-${q}-${index + 1}`,
    title: `${label} Song ${index + 1}`,
    artist: `Mock Artist ${index + 1}`,
    duration: `3:${String(40 + index).padStart(2, "0")}`,
    thumbnail: `https://placehold.co/100x100/1db954/ffffff?text=${index + 1}`,
  }));
}

export function resolveStreamUrlById(id) {
  const catalogTrack = MOCK_CATALOG.find((track) => track.id === id);
  if (catalogTrack) {
    return catalogTrack.sourceUrl;
  }

  const dynamicMatch = id.match(/^mock-.+-(\d+)$/);
  if (dynamicMatch) {
    const index = Number(dynamicMatch[1]) - 1;
    return DEMO_STREAMS[index % DEMO_STREAMS.length];
  }

  return null;
}
