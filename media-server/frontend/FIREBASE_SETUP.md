# Firebase cloud backup — setup notes

The app stores a copy of your playlists/songs in Firebase so they survive
reinstalls or switching phones. There's exactly one account (yours) — the
app signs into it silently, no login screen.

## Security rules

Paste these into the Firebase console so only your signed-in account can
read/write (anyone else would need your email+password, which is never
exposed publicly — only baked into this app's build).

**Firestore → Rules:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Storage → Rules:**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Local + production env vars

`media-server/frontend/.env` (gitignored, already created locally):

```
VITE_FIREBASE_USER_EMAIL=...
VITE_FIREBASE_USER_PASSWORD=...
```

Add the same two keys in **Vercel → Project Settings → Environment
Variables** (Production + Preview) so the deployed PWA can sign in too —
the Apple/iOS wrapper just loads the same deployed frontend, so nothing
extra is needed there.

## Data model

- `users/{uid}/library/main` — one Firestore document holding the entire
  `{ playlists, activePlaylistId }` library (small enough at this scale —
  way under Firestore's 1MB document limit even at hundreds of songs).
- `users/{uid}/tracks/{trackId}.mp3` in Storage — the actual audio bytes
  for songs you uploaded manually (YouTube-sourced songs don't need this;
  they're streamed/cached from YouTube's own CDN).

## How sync works

- On startup the app signs in, downloads the cloud library, and uses it as
  the source of truth (if this is the very first run anywhere, it instead
  pushes the local library up to seed the cloud).
- Every local change is written back to the cloud after a short debounce.
- Uploading an MP3 saves it on-device immediately (so playback works right
  away) and uploads the audio to Storage in the background.
- On a *different* device, songs show up immediately (metadata syncs
  instantly); the actual audio downloads on first play and is cached for
  next time.

**Known limitation:** this is "last write wins" — if you add songs on two
devices while one of them is offline, whichever syncs to the cloud last
overwrites the other's additions. Fine for typical one-device-at-a-time
personal use; not a multi-device-simultaneously system.
