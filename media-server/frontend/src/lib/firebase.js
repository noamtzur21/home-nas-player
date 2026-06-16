import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const CLOUD_EMAIL = import.meta.env.VITE_FIREBASE_USER_EMAIL;
const CLOUD_PASSWORD = import.meta.env.VITE_FIREBASE_USER_PASSWORD;

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

  signInPromise = signInWithEmailAndPassword(auth, CLOUD_EMAIL, CLOUD_PASSWORD)
    .then((credential) => credential.user)
    .finally(() => {
      signInPromise = null;
    });

  return signInPromise;
}
