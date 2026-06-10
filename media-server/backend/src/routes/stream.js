import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveStreamUrlById } from "../data/mockCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '../../cache');

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export async function streamProxy(req, res) {
  try {
    const streamId = req.query.id;

    if (streamId && !streamId.startsWith('mock-')) {
        const filePath = path.join(CACHE_DIR, `${streamId}.mp3`);

        // אם השיר לא קיים, מורידים אותו
        if (!fs.existsSync(filePath)) {
            console.log(`Downloading track ${streamId} to local cache...`);
            const videoUrl = `https://www.youtube.com/watch?v=${streamId}`;
            execSync(`yt-dlp -x --audio-format mp3 -o "${path.join(CACHE_DIR, streamId)}.%(ext)s" "${videoUrl}"`);
            console.log(`Download finished: ${streamId}`);
        }

        // --- מנגנון תמיכה ב-Range Requests (חיוני להעברה חלקה של השיר) ---
        const stat = fs.statSync(filePath);
        const totalSize = stat.size;
        const range = req.headers.range;

        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Accept-Ranges", "bytes");

        if (range) {
            // פירוק הכותרת: למשל "bytes=1000-5000"
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
            const chunkSize = (end - start) + 1;

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${totalSize}`,
                "Content-Length": chunkSize
            });

            // פתיחת הסטרים בדיוק מהנקודה שהמשתמש ביקש בבר
            const readStream = fs.createReadStream(filePath, { start, end });
            readStream.pipe(res);
        } else {
            // בקשה רגילה לכל הקובץ
            res.setHeader("Content-Length", totalSize);
            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);
        }
        return;
    }

    // פלבק לקבצי ה-NAS המקוריים
    if (streamId) {
        const resolvedUrl = resolveStreamUrlById(streamId);
        if (resolvedUrl) return res.redirect(resolvedUrl);
    }

    const targetUrl = req.query.url;
    if (targetUrl) return res.redirect(targetUrl);

    return res.status(400).json({ error: "Missing required parameter" });

  } catch (error) {
    console.error("Streaming error caught in backend:", error.message);
    if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process audio stream" });
    }
  }
}