import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Innertube } from "youtubei.js";
import { resolveStreamUrlById } from "../data/mockCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, "../../cache");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function hasYtDlp() {
  const result = spawnSync("yt-dlp", ["--version"], { encoding: "utf8" });
  return result.status === 0;
}

const YT_DLP_ARGS =
  '--no-playlist -x --audio-format mp3 --audio-quality 5 --extractor-args "youtube:player_client=android,web"';

function downloadWithYtDlp(streamId) {
  const videoUrl = `https://www.youtube.com/watch?v=${streamId}`;
  const outputTemplate = path.join(CACHE_DIR, `${streamId}.%(ext)s`);
  execSync(`yt-dlp ${YT_DLP_ARGS} -o "${outputTemplate}" "${videoUrl}"`, {
    stdio: "pipe",
    encoding: "utf8",
    timeout: 180000,
    maxBuffer: 20 * 1024 * 1024,
  });
}

async function downloadWithYoutubei(streamId) {
  const filePath = path.join(CACHE_DIR, `${streamId}.mp4`);
  const yt = await Innertube.create();
  const stream = await yt.download(streamId, { type: "audio", quality: "best" });

  const writer = fs.createWriteStream(filePath);
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    writer.write(Buffer.from(value));
  }

  await new Promise((resolve, reject) => {
    writer.end(() => resolve());
    writer.on("error", reject);
  });

  return filePath;
}

function findCachedFile(streamId) {
  for (const ext of [".mp3", ".m4a", ".mp4", ".webm"]) {
    const filePath = path.join(CACHE_DIR, `${streamId}${ext}`);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

async function ensureCachedAudio(streamId) {
  const existing = findCachedFile(streamId);
  if (existing) return existing;

  if (hasYtDlp()) {
    try {
      console.log(`[stream] Downloading ${streamId} with yt-dlp…`);
      downloadWithYtDlp(streamId);
      const cached = findCachedFile(streamId);
      if (cached) return cached;
    } catch (error) {
      console.error(`[stream] yt-dlp failed for ${streamId}:`, error.stderr || error.message);
    }
  }

  console.log(`[stream] Downloading ${streamId} with youtubei.js…`);
  return downloadWithYoutubei(streamId);
}

function serveCachedFile(req, res, filePath) {
  const stat = fs.statSync(filePath);
  const totalSize = stat.size;
  const range = req.headers.range;
  const contentType = filePath.endsWith(".mp3")
    ? "audio/mpeg"
    : filePath.endsWith(".webm")
      ? "audio/webm"
      : "audio/mp4";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Accept-Ranges", "bytes");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Content-Length": chunkSize,
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.setHeader("Content-Length", totalSize);
  fs.createReadStream(filePath).pipe(res);
}

export async function resolveStream(req, res) {
  try {
    const streamId = req.query.id;
    if (!streamId) {
      return res.status(400).json({ error: "Missing stream id" });
    }

    const filePath = await ensureCachedAudio(streamId);
    const backendBase = process.env.PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

    return res.json({
      url: `${backendBase}/stream?id=${streamId}`,
      source: "backend-cache",
    });
  } catch (error) {
    console.error("[resolve] error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

export async function streamProxy(req, res) {
  try {
    const streamId = req.query.id;

    if (streamId && !streamId.startsWith("mock-")) {
      const filePath = await ensureCachedAudio(streamId);
      return serveCachedFile(req, res, filePath);
    }

    if (streamId) {
      const resolvedUrl = resolveStreamUrlById(streamId);
      if (resolvedUrl) return res.redirect(resolvedUrl);
    }

    const targetUrl = req.query.url;
    if (targetUrl) return res.redirect(targetUrl);

    return res.status(400).json({ error: "Missing required parameter" });
  } catch (error) {
    console.error("[stream] error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process audio stream", detail: error.message });
    }
  }
}
