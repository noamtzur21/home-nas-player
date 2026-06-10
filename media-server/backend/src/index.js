import "dotenv/config";
import cors from "cors";
import express from "express";
import { searchTracks } from "./routes/search.js";
import { streamProxy } from "./routes/stream.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/search", searchTracks);
app.get("/stream", streamProxy);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Media proxy listening on http://localhost:${PORT}`);
});
