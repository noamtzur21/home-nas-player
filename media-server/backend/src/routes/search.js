import { execSync } from 'child_process';

// זיכרון זמני בשרת כדי לא להעמיס על יוטיוב בכל לחיצה
let cachedVideos = [];
let lastQuery = "";

export async function searchTracks(req, res) {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 10; // 10 שירים בכל לחיצה

        if (!query) {
            return res.json({ results: [], hasMore: false });
        }

        // אם זו שאילתה חדשה, נשתמש ב-yt-dlp כדי להביא 100 שירים במכה אחת לזיכרון
        if (query !== lastQuery) {
            lastQuery = query;
            cachedVideos = [];
            console.log(`Performing massive yt-dlp search for: ${query}`);

            try {
                // פקודה שמבקשת מיוטיוב את 100 התוצאות הראשונות בפורמט JSON מהיר בלי להוריד כלום
                const command = `yt-dlp "ytsearch100:${query}" --dump-json --flat-playlist`;
                const output = execSync(command, { maxBuffer: 10 * 1024 * 1024 }).toString();
                
                // הפיכת הפלט לשורות JSON נפרדות
                const lines = output.split('\n').filter(line => line.trim());
                cachedVideos = lines.map(line => {
                    const video = JSON.parse(line);
                    
                    // המרה של שניות (למשל 209) לפורמט סטנדרטי (3:29)
                    const totalSeconds = video.duration || 0;
                    const mins = Math.floor(totalSeconds / 60);
                    const secs = Math.floor(totalSeconds % 60);
                    const timestamp = totalSeconds ? `${mins}:${secs < 10 ? '0' : ''}${secs}` : "3:30";

                    return {
                        videoId: video.id,
                        title: video.title,
                        author: video.uploader || query,
                        timestamp: timestamp,
                        thumbnail: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` // תמונת קאבר רשמית ישירה
                    };
                }).filter(v => v.videoId); // סינון שורות ריקות

                console.log(`Successfully cached ${cachedVideos.length} tracks for query: ${query}`);
            } catch (searchErr) {
                console.error("yt-dlp search failed, fallback to empty array", searchErr.message);
                cachedVideos = [];
            }
        }

        // חיתוך המערך לפי העמוד הנוכחי (0-10, 10-20, 20-30...)
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const slicedVideos = cachedVideos.slice(startIndex, endIndex);

        const tracks = slicedVideos.map(video => ({
            id: video.videoId,
            title: video.title,
            artist: video.author,
            duration: video.timestamp,
            thumbnail: video.thumbnail
        }));

        // מחזירים לפרונטאנד, הכפתור יישאר דלוק כל עוד לא עברנו את ה-100 שירים
        return res.json({ 
            results: tracks, 
            hasMore: endIndex < cachedVideos.length 
        });

    } catch (error) {
        console.error("Global search proxy error:", error.message);
        return res.status(500).json({ results: [], hasMore: false });
    }
}