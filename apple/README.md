# Noam Spotify — Apple / iOS / CarPlay

תיקייה זו **נפרדת לחלוטין** מה-PWA ב-`media-server/frontend`.

- ✅ Vercel / PWA — **לא נוגעים**, ממשיכים לעבוד כמו היום
- ✅ כאן — עטיפת iOS native (Capacitor) + מסמכים ל-App Store / CarPlay

```
spotify/
├── media-server/frontend/   ← האפליקציה שלך (Vercel) — לא משתנה
└── apple/                   ← פרויקט Apple בלבד
    ├── legal/               ← פרטיות + תנאי שימוש
    ├── docs/                ← רשימות ל-Apple
    ├── scripts/             ← העתקת build מה-web
    ├── web-dist/            ← output (נוצר אוטומטית, לא ב-git)
    └── ios/                 ← Xcode (נוצר אחרי cap add ios)
```

---

## התחלה מהירה (Mac + Xcode)

```bash
cd apple
npm install
npm run cap:add-ios      # פעם אחת — יוצר ios/
npm run cap:sync         # בונה את ה-web + מעתיק ל-iOS
npm run cap:open         # פותח Xcode
```

ב-Xcode:
1. Team → חשבון Apple Developer שלך
2. Bundle ID: `com.noam.spotify` (או שנה ב-`capacitor.config.ts`)
3. Run על iPhone / Simulator

---

## CarPlay — אייקון במולטימדיה

1. הגש בקשה: https://developer.apple.com/contact/carplay/
   - סוג: **Audio App**
   - תאר: נגן מוזיקה אישי, פלייליסטים, MP3 offline
2. אחרי אישור Apple — הוסף entitlement ב-Xcode
3. ראה `docs/CARPLAY_ENTITLEMENT.md`

**עד האישור:** Now Playing ב-CarPlay עובד דרך Media Session (גם ב-PWA).

---

## App Store — מה Apple יבקשו

| דרישה | איפה |
|--------|------|
| Privacy Policy URL | `legal/privacy-policy.html` — העלה ל-hosting (ראה למטה) |
| Terms (מומלץ) | `legal/terms-of-service.html` |
| App Privacy (Nutrition Labels) | `docs/APP_STORE_CHECKLIST.md` |
| אייקון 1024×1024 | TODO — הוסף ל-`ios/App/App/Assets.xcassets` |
| Screenshots | iPhone 6.7" + 6.5" |
| Support URL / Email | עדכן ב-legal וב-App Store Connect |

### איפה לפרסם Privacy / Terms

בלי לשנות את ה-frontend, אפשר:
- **GitHub Pages** מתיקיית `apple/legal`
- **Vercel project נפרד** רק ל-legal
- **Notion** public page (URL ב-App Store Connect)

---

## שני מצבי עבודה

### A) Bundled (מומלץ — offline מלא)
`webDir: web-dist` — האפליקציה iOS מכילה את ה-build. API חיפוש עדיין דורש רשת.

### B) Remote URL
ב-`capacitor.config.ts` הוסף:
```ts
server: {
  url: "https://frontend-jade-nu-dej3pukqqd.vercel.app",
  cleartext: false,
},
```
ואז `webDir` רק fallback. עדכון UI = deploy ל-Vercel בלבד.

---

## שימוש ב-iPhone בלי App Store

- **TestFlight** — עד 10,000 בeta testers
- **Development install** — Xcode → Run על המכשיר שלך

---

## שאלות?

ראה `docs/APP_STORE_CHECKLIST.md` לרשימה מלאה לפני submit.
