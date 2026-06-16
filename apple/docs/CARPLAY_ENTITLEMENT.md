# CarPlay Entitlement — Noam Spotify

## 1. הגש בקשה ל-Apple

1. היכנס ל-[CarPlay Contact Form](https://developer.apple.com/contact/carplay/)
2. בחר **CarPlay Audio App**
3. מלא:
   - **App name:** Noam Spotify
   - **Bundle ID:** `com.noam.spotify` (אותו ID כמו ב-capacitor.config.ts)
   - **Description:** Personal music player. Users manage playlists, upload MP3 files for offline playback, search songs for YouTube URLs. Background audio, lock screen, and CarPlay Now Playing controls.
   - **Why CarPlay:** Safe in-car playback of user's own music library without phone interaction.

## 2. אחרי אישור

Apple יוסיפו entitlement ל-App ID שלך ב-Developer Portal:

1. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → App ID → `com.noam.spotify`
2. ודא ש-CarPlay Audio מסומן
3. ב-Xcode → Signing & Capabilities → **+ Capability** → CarPlay → **Audio App**

## 3. קוד CarPlay (Swift)

אחרי `npx cap add ios`, ב-Xcode:

- `AppDelegate` / Scene — רשום `CPApplicationDelegate` (ראה [CarPlay Audio Programming Guide](https://developer.apple.com/carplay/documentation/CarPlay-Audio-App-Programming-Guide.pdf))
- שלב ראשון: **Now Playing only** — MPNowPlayingInfoCenter מתעדכן מה-WebView דרך Media Session (כבר מיושם ב-web)
- שלב מתקדם: **MPPlayableContentManager** — רשימת פלייליסטים/שירים על מסך CarPlay

## 4. Info.plist — Background Audio

ודא שקיים:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```

Capacitor iOS template לרוב כולל זאת אחרי הוספת audio session — בדוק ב-Xcode.

## 5. בדיקה

- iPhone + CarPlay (USB / wireless)
- או **Simulator → I/O → External Display → CarPlay**

---

**הערה:** בלי entitlement, האפליקציה עדיין מנגנת ב-CarPlay דרך **Now Playing** — לא כאייקון נפרד במסך האפליקציות.
