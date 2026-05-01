// ============================================================
//  firebase.js — Initialisation Firebase (version compat)
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
console.log('[Firebase] Initialisé ✓');
