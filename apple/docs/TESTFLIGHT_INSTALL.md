# התקנה על האייפון — TestFlight (מדריך צעד-אחר-צעד)

יש לך Apple Developer ($99/שנה) — מעולה. זה המסלול הנכון לאפליקציה "אמיתית" על המכשיר.

---

## שלב 0 — הכנה (פעם אחת)

```bash
cd apple
npm install
npm run cap:sync
open ios/App/App.xcworkspace
```

---

## שלב 1 — App Store Connect

1. היכנס ל-[App Store Connect](https://appstoreconnect.apple.com)
2. **Apps** → **+** → **New App**
3. מלא:
   - **Platform:** iOS
   - **Name:** Noam Music
   - **Primary Language:** Hebrew או English
   - **Bundle ID:** `com.noam.music` (חייב להופיע ברשימה — אם לא, צור ב-[Identifiers](https://developer.apple.com/account/resources/identifiers/list))
   - **SKU:** `noam-music-ios` (כל מזהה ייחודי)
   - **User Access:** Full Access

---

## שלב 2 — Xcode Signing

1. פתח `App.xcworkspace` (לא `.xcodeproj`)
2. בחר target **App** → **Signing & Capabilities**
3. **Team:** החשבון שלך (W8P2Q5W8GA)
4. **Bundle Identifier:** `com.noam.music`
5. סמן **Automatically manage signing**
6. ודא שאין שגיאות אדומות

---

## שלב 3 — Archive + Upload

1. למעלה ב-Xcode: בחר **Any iOS Device (arm64)** — לא Simulator
2. **Product → Archive** (2–5 דקות)
3. חלון Organizer נפתח → **Distribute App**
4. **App Store Connect** → **Upload** → Next → Next → Upload
5. המתן ל-"Upload Successful"

---

## שלב 4 — TestFlight על האייפון

1. App Store Connect → האפליקציה → **TestFlight**
2. Build יופיע תוך 5–30 דקות (Processing)
3. **Internal Testing** → **+** → הוסף את עצמך (Apple ID)
4. באייפון: התקן **TestFlight** מה-App Store
5. תקבל הזמנה / פתח TestFlight → **Install**

---

## שלב 5 — בדיקות לפני CarPlay

- [ ] העלאת MP3 מהקבצים
- [ ] נגינה + pause/play
- [ ] נגינה ברקע (מסך נעול)
- [ ] חיפוש + כפתור הורדה
- [ ] הסרת שיר — הנגינה נעצרת

---

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| Bundle ID לא ברשימה | Developer Portal → Identifiers → + → App → `com.noam.music` |
| Signing failed | Xcode → Settings → Accounts → Download Manual Profiles |
| Archive אפור | בחר Any iOS Device, לא Simulator |
| Build stuck ב-Processing | המתן 30 דק, או העלה build חדש עם version גבוה יותר |
| Missing compliance | App Store Connect → Export Compliance → No encryption beyond HTTPS |

---

## אחרי TestFlight — CarPlay

רק **אחרי** שהאפליקציה יציבה על המכשיר:
→ `docs/CARPLAY_ENTITLEMENT.md`
