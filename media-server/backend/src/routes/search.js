import { spawnSync } from "child_process";
import { getYtDlpExtraArgs } from "../ytdlpConfig.js";

let cachedVideos = [];
let lastQuery = "";

function runYtDlpSearch(query) {
  const result = spawnSync(
    "yt-dlp",
    [
      ...getYtDlpExtraArgs(),
      `ytsearch100:${query}`,
      "--dump-json",
      "--flat-playlist",
      "--extractor-args",
      "youtube:player_client=android,web",
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "yt-dlp search failed").trim());
  }

  return result.stdout;
}

export async function searchTracks(req, res) {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;

    if (!query) {
      return res.json({ results: [], hasMore: false });
    }

    if (query !== lastQuery) {
      lastQuery = query;
      cachedVideos = [];
      console.log(`Performing massive yt-dlp search for: ${query}`);

      try {
        const output = runYtDlpSearch(query);
        const lines = output.split("\n").filter((line) => line.trim());
        cachedVideos = lines
          .map((line) => {
            const video = JSON.parse(line);
            const totalSeconds = video.duration || 0;
            const mins = Math.floor(totalSeconds / 60);
            const secs = Math.floor(totalSeconds % 60);
            const timestamp = totalSeconds ? `${mins}:${secs < 10 ? "0" : ""}${secs}` : "3:30";

            return {
              videoId: video.id,
              title: video.title,
              author: video.uploader || query,
              timestamp,
              thumbnail: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
            };
          })
          .filter((v) => v.videoId);

        console.log(`Successfully cached ${cachedVideos.length} tracks for query: ${query}`);
      } catch (searchErr) {
        console.error("yt-dlp search failed, fallback to empty array", searchErr.message);
        cachedVideos = [];
      }
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const slicedVideos = cachedVideos.slice(startIndex, endIndex);

    const tracks = slicedVideos.map((video) => ({
      id: video.videoId,
      title: video.title,
      artist: video.author,
      duration: video.timestamp,
      thumbnail: video.thumbnail,
    }));

    return res.json({
      results: tracks,
      hasMore: endIndex < cachedVideos.length,
    });
  } catch (error) {
    console.error("Global search proxy error:", error.message);
    return res.status(500).json({ results: [], hasMore: false });
  }
}
