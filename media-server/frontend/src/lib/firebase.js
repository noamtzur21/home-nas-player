import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firebase Auth defaults to indexedDB-backed persistence, which has known
// hangs inside embedded WebViews (Capacitor's `capacitor://localhost`
// origin on iOS in particular — auth.currentUser sign-in can stall forever
// with no error). localStorage-based persistence is far more reliable
// there and is plenty for a single-account app.
const persistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => {});

const CLOUD_EMAIL = import.meta.env.VITE_FIREBASE_USER_EMAIL;
const CLOUD_PASSWORD = import.meta.env.VITE_FIREBASE_USER_PASSWORD;
const SIGN_IN_TIMEOUT_MS = 8000;

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

let signInPromise = null;

// There's exactly one account for this app (it's a single-user personal
// library). We sign into it silently on startup so every device/install
// reads and writes the same cloud data — no login screen needed.
export function ensureSignedIn() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (signInPromise) return signInPromise;

  if (!CLOUD_EMAIL || !CLOUD_PASSWORD) {
    return Promise.reject(new Error("Cloud sync is not configured (missing Firebase credentials)."));
  }

  signInPromise = withTimeout(
    persistenceReady.then(() => signInWithEmailAndPassword(auth, CLOUD_EMAIL, CLOUD_PASSWORD)),
    SIGN_IN_TIMEOUT_MS,
    "Cloud sign-in timed out",
  )
    .then((credential) => credential.user)
    .finally(() => {
      signInPromise = null;
    });

  return signInPromise;
}
