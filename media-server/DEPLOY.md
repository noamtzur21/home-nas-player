# Deploy — NAS Player (עצמאי מה-Mac)

## שלב 1: Render Backend (Docker + yt-dlp)

1. היכנס ל-[Render Dashboard](https://dashboard.render.com)
2. **New → Blueprint** (או עדכון שירות קיים)
3. חבר את ה-Git repo
4. **Root Directory:** `media-server/backend`
5. Render יזהה את `render.yaml` + `Dockerfile`

### אם מעדכנים שירות קיים (`media-server-backend-qqjx`)

1. Settings → **Runtime: Docker**
2. Docker File Path: `Dockerfile`
3. Root Directory: `media-server/backend`
4. Save → **Manual Deploy**

### Environment Variables (Render)

| Key | Value |
|-----|-------|
| `PUBLIC_BACKEND_URL` | `https://media-server-backend-qqjx.onrender.com` |
| `NODE_ENV` | `production` |
| `CACHE_DIR` | `/app/cache` |

### בדיקה אחרי deploy

```bash
curl https://media-server-backend-qqjx.onrender.com/health
# צריך להחזיר: {"ok":true,"ytDlp":"2024.xx.xx",...}

curl -I "https://media-server-backend-qqjx.onrender.com/stream?id=jNQXAC9IVRw"
# צריך: HTTP 200, Content-Type: audio/mpeg
```

> **שיר ראשון** לוקח 10–30 שניות (הורדה). שירים שכבר ב-cache — מיידי.

### שדרוג מומלץ לרכב ($7/חודש)

- **Starter plan** — השרver לא "נרדם" אחרי 15 דק
- **Persistent Disk 1GB** — cache נשמר בין deploys

---

## שלב 2: Vercel Frontend

### Environment Variables (Vercel → Settings)

| Key | Value |
|-----|-------|
| `VITE_STREAM_BACKEND_URL` | `https://media-server-backend-qqjx.onrender.com` |
| `STREAM_BACKEND_URL` | `https://media-server-backend-qqjx.onrender.com` |

### Deploy

```bash
cd media-server/frontend
vercel --prod
```

---

## שלב 3: בדיקה באייפון / רכב

```
https://frontend-jade-nu-dej3pukqqd.vercel.app/?debug=1
```

1. חפש שיר → Play
2. הוסף ל-Home Screen (PWA)
3. CarPlay יזהה את הנגן אוטומטית

---

## ארכיטקטורה סופית

```
iPhone / CarPlay (4G)
       ↓
  Vercel (UI + search)
       ↓
  Render (Docker + yt-dlp → MP3)
```

**אין תלות ב-Mac, WiFi, או tunnel.**
