import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, ensureSignedIn, storage } from "./firebase";

const CLOUD_OP_TIMEOUT_MS = 10000;

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

function libraryDocRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in to cloud sync.");
  return doc(db, "users", uid, "library", "main");
}

export async function fetchCloudLibrary() {
  await ensureSignedIn();
  const snapshot = await withTimeout(getDoc(libraryDocRef()), CLOUD_OP_TIMEOUT_MS, "Cloud library fetch timed out");
  if (!snapshot.exists()) return null;
  return snapshot.data().library || null;
}

export async function saveCloudLibrary(library) {
  await ensureSignedIn();
  await withTimeout(
    setDoc(libraryDocRef(), { library, updatedAt: Date.now() }),
    CLOUD_OP_TIMEOUT_MS,
    "Cloud library save timed out",
  );
}

function audioStoragePath(uid, trackId) {
  return `users/${uid}/tracks/${trackId}.mp3`;
}

// Uploads a locally-added MP3's audio so it survives reinstalls/new devices.
// Returns a permanent download URL to store on the track record.
export async function uploadTrackAudio(trackId, blob) {
  await ensureSignedIn();
  const uid = auth.currentUser.uid;
  const storageRef = ref(storage, audioStoragePath(uid, trackId));
  await uploadBytes(storageRef, blob, { contentType: blob.type || "audio/mpeg" });
  return getDownloadURL(storageRef);
}
