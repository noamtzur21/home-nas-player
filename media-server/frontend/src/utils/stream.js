export function buildStreamUrl(track) {
  if (track.streamId) {
    const params = new URLSearchParams({ id: track.streamId });
    return `/stream?${params.toString()}`;
  }

  if (track.sourceUrl) {
    const params = new URLSearchParams({ url: track.sourceUrl });
    return `/stream?${params.toString()}`;
  }

  return "";
}

export function searchResultToTrack(result) {
  return {
    id: result.id,
    title: result.title,
    artist: result.artist,
    artwork: result.thumbnail,
    streamId: result.id,
    durationLabel: result.duration,
  };
}
