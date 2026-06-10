import { get, set, del } from "idb-keyval";

// פונקציה שמורידה את השיר מהשרת ושומרת אותו בטלפון
export async function downloadTrackToDevice(trackId, streamUrl) {
  try {
    const response = await fetch(streamUrl);
    if (!response.ok) throw new Error("Failed to fetch audio file");
    
    const blob = await response.blob(); // הופך את ה-MP3 לקובץ בינארי
    await set(`track-${trackId}`, blob); // שומר ב-IndexedDB של האייפון
    return true;
  } catch (error) {
    console.error("Download failed:", error);
    return false;
  }
}

// פונקציה שבודקת אם יש שיר שמור באופליין ומחזירה כתובת מקומית שלו
export async function getOfflineTrackUrl(trackId) {
  try {
    const blob = await get(`track-${trackId}`);
    if (!blob) return null;
    return URL.createObjectURL(blob); // מייצר לינק מקומי זמני שמנגן ישירות מהזיכרון של הטלפון
  } catch {
    return null;
  }
}

// פונקציה למחיקת השיר מהמכשיר במידה ורוצים לפנות מקום
export async function deleteOfflineTrack(trackId) {
  await del(`track-${trackId}`);
}
