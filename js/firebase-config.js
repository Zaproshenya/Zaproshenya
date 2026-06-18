/* ═══════════════════════════════════════════════════════
   Firebase Configuration & Initialization
   ═══════════════════════════════════════════════════════ */

window.ZAP = window.ZAP || {};

ZAP.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBfhpU5VCYLqs2M_N6ozEh5ZqJL8XlZMM8",
  authDomain:        "zaproshenya-82751.firebaseapp.com",
  databaseURL:       "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "zaproshenya-82751",
  storageBucket:     "zaproshenya-82751.firebasestorage.app",
  messagingSenderId: "912178652602",
  appId:             "1:912178652602:web:ade20cdf841e2194e02983",
  measurementId:     "G-B5VF0PHW3C"
};

try {
  ZAP.firebaseApp = firebase.initializeApp(ZAP.FIREBASE_CONFIG);
  ZAP.authInstance = firebase.auth();
  ZAP.dbRef = firebase.database();
  ZAP.messaging = null;
  try {
    ZAP.messaging = firebase.messaging();
  } catch (e) { console.warn('FCM not available:', e.message); }
  console.log('✦ Firebase initialized');
} catch (e) {
  console.error('Firebase init failed:', e.message);
  ZAP.authInstance = null;
  ZAP.dbRef = null;
}
