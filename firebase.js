// ============================================================
//  firebase.js — Initialisation Firebase
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

// ── Debug token App Check pour le dev local ──
// À activer UNIQUEMENT en local (localhost / 127.0.0.1), jamais en prod.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

firebase.initializeApp(firebaseConfig);

// ── App Check ──
try {
  const appCheck = firebase.appCheck();
  appCheck.activate('6Le4IAktAAAAAdw5qymbxT-eDAH1BhJ8mW2KsdTa', true);
  console.log('[App Check] Activé ✓');
} catch (e) {
  console.warn('[App Check] Non disponible:', e.message);
}

console.log('[Firebase] Initialisé ✓');