import "dotenv/config";
import { spawnSync } from "child_process";
import cors from "cors";
import express from "express";
import { searchTracks } from "./routes/search.js";
import { resolveStream, streamProxy, STREAM_HANDLER_VERSION } from "./routes/stream.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  const ytdlp = spawnSync("yt-dlp", ["--version"], { encoding: "utf8" });
  res.json({
    ok: true,
    version: STREAM_HANDLER_VERSION,
    ytDlp: ytdlp.status === 0 ? ytdlp.stdout.trim() : null,
    cacheDir: process.env.CACHE_DIR || "default",
  });
});

app.get("/search", searchTracks);
app.get("/resolve", resolveStream);
app.get("/stream", streamProxy);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Media proxy listening on http://0.0.0.0:${PORT}`);
});
