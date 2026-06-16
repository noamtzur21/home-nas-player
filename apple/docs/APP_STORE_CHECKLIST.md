# App Store Checklist — Noam Spotify

## לפני Submit

### חשבון ומסמכים
- [ ] Apple Developer Program פעיל ($99/שנה)
- [ ] Privacy Policy URL (עדכן email ב-`legal/privacy-policy.html`)
- [ ] Support URL או email
- [ ] Terms of Service (מומלץ)

### App Store Connect — App Privacy

סמן בערך כך (עדכן לפי המציאות):

| Data Type | Collected? | Linked to user? | Tracking? |
|-----------|------------|-----------------|-----------|
| Contact Info | No | — | No |
| User Content (playlists, MP3) | No (on device only) | — | No |
| Search queries | Yes (transient) | No | No |
| Diagnostics | No | — | No |

**הסבר:** פלייליסטים ו-MP3 נשמרים **רק במכשיר**. חיפוש שולח query לשרת Vercel.

### Metadata
- [ ] שם: Noam Spotify
- [ ] Subtitle: Personal music player
- [ ] Description (EN + HE אם רלוונטי)
- [ ] Keywords: music, playlist, offline, mp3
- [ ] Category: Music
- [ ] Age Rating: 4+ (אין תוכן מבוגרים באפליקציה)
- [ ] Copyright: © 2026 Noam [שם משפחה]

### Assets
- [ ] App Icon 1024×1024 (no transparency, no rounded corners — Apple rounds)
- [ ] Screenshots iPhone 6.7" (1290×2796)
- [ ] Screenshots iPhone 6.5" (1284×2778) — אם נדרש

### Build
- [ ] `npm run cap:sync` from `apple/`
- [ ] Archive in Xcode → Distribute → App Store Connect
- [ ] TestFlight internal test על מכשיר אמיתי
- [ ] בדיקת CarPlay / background audio / lock screen

### Review Notes (למreviewer)

```
Noam Spotify is a personal music player.

Login: Not required.

To test:
1. Open app
2. Tap + on Home to upload an MP3 from Files (or use pre-added tracks)
3. Tap a track to play
4. Search tab finds songs and copies YouTube URL (no download from YouTube in-app)

All playlist data and MP3 files stay on device. Search sends query text to our API only.
```

---

## דחיות נפוצות — איך להימנע

1. **Copyright** — הדגש: user-uploaded MP3 only; search returns URLs only
2. **Missing privacy policy** — URL חייב לעבוד
3. **Broken on launch** — בדוק TestFlight build על iPhone אמיתי
4. **Background audio** — UIBackgroundModes audio

---

## TestFlight (בלי App Store public)

מספיק לשימוש אישי + ראיון:
1. Upload build ל-App Store Connect
2. TestFlight → Internal Testing → המכשיר שלך
