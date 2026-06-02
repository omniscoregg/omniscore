// ============================================================
//  firebase.js — Initialisation Firebase + App Check reCAPTCHA v3
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyDjyIgX_ZISnu-GHdQR0z5Ipc3bxrYOpo4",
  authDomain:        "omniscore-gg.firebaseapp.com",
  projectId:         "omniscore-gg",
  storageBucket:     "omniscore-gg.firebasestorage.app",
  messagingSenderId: "855448847453",
  appId:             "1:855448847453:web:171132c616b1da6478f9b4",
  measurementId:     "G-JK2QY60L8Z"
};

firebase.initializeApp(firebaseConfig);

// ── App Check reCAPTCHA v3 ──
const appCheck = firebase.appCheck();
appCheck.activate('6Le4IAktAAAAAdw5qymbxT-eDAH1BhJ8mW2KsdTa', true);

console.log('[Firebase] Initialisé ✓');
console.log('[App Check] Activé ✓');

// ── App Check reCAPTCHA v3 ──
try {
  const appCheck = firebase.appCheck();
  appCheck.activate('6Le4IAktAAAAAdw5qymbxT-eDAH1BhJ8mW2KsdTa', true);
  console.log('[App Check] Activé ✓');
} catch(e) {
  console.warn('[App Check] Non disponible:', e.message);
}