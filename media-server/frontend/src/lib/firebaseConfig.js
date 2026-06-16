// Firebase web config — these values are safe to commit. They identify the
// project to Google's servers; they are not secrets. Real access control
// lives in the Firestore/Storage security rules (only the one signed-in
// account configured via env vars can read/write).
export const firebaseConfig = {
  apiKey: "AIzaSyD8wd-gRGW6xCmz-PJClGv2d527Rfx8x0M",
  authDomain: "noam-spotify.firebaseapp.com",
  projectId: "noam-spotify",
  storageBucket: "noam-spotify.firebasestorage.app",
  messagingSenderId: "952695001446",
  appId: "1:952695001446:web:f866d6bfdc33d708eab8a7",
};
