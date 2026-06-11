import ytSearch from 'yt-search';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const r = await ytSearch(q);
    const results = r.videos.slice(0, 20).map(video => ({
      id: video.videoId,
      title: video.title,
      artist: video.author.name,
      thumbnail: video.thumbnail || video.image,
      duration: video.duration.timestamp,
    }));

    return res.status(200).json({ results, hasMore: false });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch search results' });
  }
}