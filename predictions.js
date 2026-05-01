// ============================================================
//  predictions.js — Version Firebase Compat (sans imports ES)
// ============================================================

const auth = firebase.auth();
const db   = firebase.firestore();

let currentUser    = null;
let currentProfile = null;
let authModalMode  = 'login';

// ----------------------------------------------------------
//  Auth functions
// ----------------------------------------------------------
async function register(email, password, username) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await db.collection('users').doc(cred.user.uid).set({
    username, email, points: 0, predictions: 0, correct: 0,
    favorites: [], favoriteGames: [],
    createdAt: new Date().toISOString(),
  });
  return cred.user;
}

async function login(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

async function logout() { await auth.signOut(); }

async function getUserProfile(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function savePrediction(uid, matchId, game, team1, team2, predictedWinner, predictedScore1 = null, predictedScore2 = null) {
  const predId = `${uid}_${matchId}`;
  await db.collection('predictions').doc(predId).set({
    uid, matchId, game, team1, team2, predictedWinner,
    predictedScore1, predictedScore2,
    result: null, points: 0, createdAt: new Date().toISOString(),
  });
  await db.collection('users').doc(uid).update({
    predictions: firebase.firestore.FieldValue.increment(1)
  });
}

async function hasPredicted(uid, matchId) {
  const snap = await db.collection('predictions').doc(`${uid}_${matchId}`).get();
  return snap.exists ? snap.data() : null;
}

async function getPredictionsForMatch(matchId) {
  const snap = await db.collection('predictions').where('matchId', '==', matchId).get();
  return snap.docs.map(d => d.data());
}

function watchPredictions(matchId, callback) {
  return db.collection('predictions').where('matchId', '==', matchId)
    .onSnapshot(snap => callback(snap.docs.map(d => d.data())));
}

async function getLeaderboard(limitCount = 20) {
  const snap = await db.collection('users').orderBy('points', 'desc').limit(limitCount).get();
  return snap.docs.map((d, i) => ({ rank: i + 1, id: d.id, ...d.data() }));
}

async function getLeaderboardByGame(game, limitCount = 20) {
  const snap   = await db.collection('predictions').orderBy('points', 'desc').get();
  const byUser = {};
  snap.docs.map(d => d.data()).filter(p => p.game === game).forEach(p => {
    if (!byUser[p.uid]) byUser[p.uid] = { uid: p.uid, points: 0, predictions: 0 };
    byUser[p.uid].points      += p.points;
    byUser[p.uid].predictions += 1;
  });
  return Object.values(byUser).sort((a, b) => b.points - a.points).slice(0, limitCount).map((u, i) => ({ rank: i + 1, ...u }));
}

// ----------------------------------------------------------
//  Favoris — Équipes
// ----------------------------------------------------------
async function addFavorite(uid, teamName, game) {
  await db.collection('users').doc(uid).update({
    favorites: firebase.firestore.FieldValue.arrayUnion({ teamName, game })
  });
}

async function removeFavorite(uid, teamName, game) {
  await db.collection('users').doc(uid).update({
    favorites: firebase.firestore.FieldValue.arrayRemove({ teamName, game })
  });
}

async function getFavorites(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? (snap.data().favorites || []) : [];
}

async function isFavorite(uid, teamName, game) {
  const favs = await getFavorites(uid);
  return favs.some(f => f.teamName === teamName && f.game === game);
}

// ----------------------------------------------------------
//  Favoris — Jeux
// ----------------------------------------------------------
async function addFavoriteGame(uid, game) {
  await db.collection('users').doc(uid).update({
    favoriteGames: firebase.firestore.FieldValue.arrayUnion(game)
  });
}

async function removeFavoriteGame(uid, game) {
  await db.collection('users').doc(uid).update({
    favoriteGames: firebase.firestore.FieldValue.arrayRemove(game)
  });
}

async function getFavoriteGames(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? (snap.data().favoriteGames || []) : [];
}

// ----------------------------------------------------------
//  Exposer FirebaseService globalement
// ----------------------------------------------------------
window.FirebaseService = {
  register, login, logout,
  getUserProfile, hasPredicted,
  savePrediction, getPredictionsForMatch, watchPredictions,
  getLeaderboard, getLeaderboardByGame,
  addFavorite, removeFavorite, getFavorites, isFavorite,
  addFavoriteGame, removeFavoriteGame, getFavoriteGames,
  getUserPredictions: async (uid) => {
    const snap = await db.collection('predictions')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getStreak: async (uid) => {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? (snap.data().streak || 0) : 0;
  },
  getBestStreak: async (uid) => {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? (snap.data().bestStreak || 0) : 0;
  },
  updateDailyActivity: async (uid) => {
    const today    = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const snap     = await db.collection('users').doc(uid).get();
    const data     = snap.data() || {};
    const lastDay  = data.lastActivityDay || '';
    const dayStreak = data.dayStreak || 0;

    if (lastDay === today) return; // Déjà compté aujourd'hui

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newDayStreak = lastDay === yesterday ? dayStreak + 1 : 1;

    const updates = {
      lastActivityDay: today,
      dayStreak: newDayStreak,
    };

    // Bonus à 7 jours consécutifs
    if (newDayStreak % 7 === 0) {
      updates.points = firebase.firestore.FieldValue.increment(5);
      console.log('[DailyStreak] Bonus +5 pts pour', uid, '- jour', newDayStreak);
    }

    await db.collection('users').doc(uid).update(updates);
  },
  getCurrentUser: () => auth.currentUser,
  onAuthChange: (cb) => auth.onAuthStateChanged(cb),
};

// ----------------------------------------------------------
//  Auth UI
// ----------------------------------------------------------
function renderAuthBar() {
  const el = document.getElementById('auth-bar');
  if (!el) return;
  if (currentUser && currentProfile) {
    el.innerHTML = `
      <div class="auth-user">
        <span class="auth-username" onclick="showProfilePage()" style="cursor:pointer">👤 ${currentProfile.username}</span>
        <span class="auth-points">⭐ ${currentProfile.points} pts</span>
        ${currentProfile.streak > 0 ? `<span class="auth-streak" title="Série de ${currentProfile.streak}">🔥 ${currentProfile.streak}</span>` : ''}
        <button class="auth-btn small" onclick="showLeaderboard()">🏆</button>
        <button class="auth-btn small" onclick="showLeaguesPage ? showLeaguesPage() : null">⚔️</button>
        <button class="auth-btn small" onclick="showProfilePage()">⚙️</button>
        <button class="auth-btn small logout" onclick="handleLogout()">↩</button>
      </div>`;
  } else {
    el.innerHTML = `
      <button class="auth-btn" onclick="showAuthModal('login')">Connexion</button>
      <button class="auth-btn primary" onclick="showAuthModal('register')">S'inscrire</button>`;
  }
}

function showAuthModal(mode = 'login') {
  authModalMode = mode;
  document.getElementById('auth-modal')?.remove();
  const isLogin = mode === 'login';
  const modal   = document.createElement('div');
  modal.id        = 'auth-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">${isLogin ? 'Connexion' : 'Créer un compte'}</div>
        <button class="modal-close" onclick="document.getElementById('auth-modal').remove()">✕</button>
      </div>
      ${!isLogin ? `<div class="form-group"><label>Pseudo</label><input type="text" id="auth-username" placeholder="Votre pseudo" class="form-input"></div>` : ''}
      <div class="form-group"><label>Email</label><input type="email" id="auth-email" placeholder="votre@email.com" class="form-input"></div>
      <div class="form-group"><label>Mot de passe</label><input type="password" id="auth-password" placeholder="••••••••" class="form-input"></div>
      <div id="auth-error" class="form-error" style="display:none"></div>
      <button class="form-submit" onclick="handleAuth()">${isLogin ? 'Se connecter' : 'Créer mon compte'}</button>
      <div class="form-switch">
        ${isLogin
          ? `Pas de compte ? <a style="cursor:pointer;color:var(--accent)" onclick="showAuthModal('register')">S'inscrire</a>`
          : `Déjà un compte ? <a style="cursor:pointer;color:var(--accent)" onclick="showAuthModal('login')">Se connecter</a>`}
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function handleAuth() {
  const email    = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  const username = document.getElementById('auth-username')?.value?.trim();
  if (!email || !password) { showFormError('Veuillez remplir tous les champs.'); return; }
  try {
    if (authModalMode === 'register') {
      if (!username) { showFormError('Veuillez choisir un pseudo.'); return; }
      await register(email, password, username);
    } else {
      await login(email, password);
    }
    document.getElementById('auth-modal')?.remove();
  } catch (err) {
    const msgs = {
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/invalid-email':        'Email invalide.',
      'auth/weak-password':        'Mot de passe trop court (6 caractères min).',
      'auth/user-not-found':       'Aucun compte avec cet email.',
      'auth/wrong-password':       'Mot de passe incorrect.',
      'auth/invalid-credential':   'Email ou mot de passe incorrect.',
    };
    showFormError(msgs[err.code] || 'Une erreur est survenue.');
  }
}

function showFormError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function handleLogout() { await logout(); }

// ----------------------------------------------------------
//  Bouton prédiction sur les cartes
// ----------------------------------------------------------
async function renderPredictionBtn(matchId, game, team1, team2, status) {
  if (status !== 'upcoming') return '';
  if (!currentUser) {
    return `<div class="pred-cta" onclick="showAuthModal('login')">🎯 Connectez-vous pour prédire</div>`;
  }
  const existing = await hasPredicted(currentUser.uid, matchId);
  if (existing) {
    const icons = { correct: '✅', wrong: '❌', perfect: '🏆' };
    return `<div class="pred-existing">${existing.result ? `${icons[existing.result]||'⏳'} ${existing.points} pts` : `⏳ Prédit : ${existing.predictedWinner}`}</div>`;
  }
  return `
    <div class="pred-buttons">
      <span class="pred-label">🎯 Qui va gagner ?</span>
      <div class="pred-teams-row">
        <button class="pred-btn" onclick="selectPredTeam(this,'${matchId}','${game}','${team1}','${team2}','${team1}')">${team1}</button>
        <button class="pred-btn" onclick="selectPredTeam(this,'${matchId}','${game}','${team1}','${team2}','${team2}')">${team2}</button>
      </div>
      <div class="pred-score-row" id="score-row-${matchId}" style="display:none">
        <span class="pred-score-label">Score prédit (optionnel) :</span>
        <div class="pred-score-inputs">
          <input type="number" id="score1-${matchId}" class="pred-score-input" min="0" max="3" placeholder="0">
          <span class="pred-score-sep">-</span>
          <input type="number" id="score2-${matchId}" class="pred-score-input" min="0" max="3" placeholder="0">
        </div>
        <button class="pred-confirm-btn" id="confirm-${matchId}">Confirmer</button>
      </div>
    </div>`;
}

function selectPredTeam(btn, matchId, game, team1, team2, winner, maxScore = 2) {
  const row = btn.closest('.pred-teams-row');
  if (row) row.querySelectorAll('.pred-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  let scoreRow = document.getElementById('score-row-' + matchId);

  if (!scoreRow) {
    document.querySelectorAll('.onetap-score-panel').forEach(e => e.remove());
    const panel = document.createElement('div');
    panel.className = 'onetap-score-panel';
    panel.id = 'score-row-' + matchId;
    panel.innerHTML = `
      <span class="pred-score-label">Score prédit (optionnel) :</span>
      <div class="pred-score-inputs">
        <input type="number" id="score1-${matchId}" class="pred-score-input" min="0" max="${maxScore}" placeholder="0" onclick="event.stopPropagation()" oninput="event.stopPropagation()">
<span class="pred-score-sep">-</span>
<input type="number" id="score2-${matchId}" class="pred-score-input" min="0" max="${maxScore}" placeholder="0" onclick="event.stopPropagation()" oninput="event.stopPropagation()">
      </div>
      <button class="pred-confirm-btn" id="confirm-${matchId}" onclick="event.stopPropagation()">Confirmer</button>
      <button class="pred-cancel-btn" onclick="event.stopPropagation();this.closest('.onetap-score-panel').remove()">✕</button>
    `;
    panel.addEventListener('click', e => e.stopPropagation());
    panel.addEventListener('mousedown', e => e.stopPropagation());
    btn.closest('.match-card').appendChild(panel);
    scoreRow = panel;
  } else {
    scoreRow.style.display = 'flex';
  }

  const confirmBtn = document.getElementById('confirm-' + matchId);
  if (confirmBtn) {
    confirmBtn.onclick = async (e) => {
  e.stopPropagation();
  const input1 = document.getElementById('score1-' + matchId);
  const input2 = document.getElementById('score2-' + matchId);
  const v1 = input1?.value?.trim();
  const v2 = input2?.value?.trim();
  const s1 = (v1 !== '' && v2 !== '' && !isNaN(parseInt(v1))) ? parseInt(v1) : null;
  const s2 = (v1 !== '' && v2 !== '' && !isNaN(parseInt(v2))) ? parseInt(v2) : null;
  document.getElementById('score-row-' + matchId)?.remove();
  await predict(matchId, game, team1, team2, winner, s1, s2);
   };
  }
}

async function predict(matchId, game, team1, team2, winner, score1 = null, score2 = null) {
  if (!currentUser) { showAuthModal('login'); return; }
  try {
    await savePrediction(currentUser.uid, matchId, game, team1, team2, winner, score1, score2);
    // Mettre à jour le daily streak
    await window.FirebaseService.updateDailyActivity(currentUser.uid);
    currentProfile = await getUserProfile(currentUser.uid);
    renderAuthBar();
    if (window.renderMatches) window.renderMatches();
  } catch (err) { console.error('Erreur prédiction:', err); }
}

function selectPredTeamGlobal(btn, matchId, game, team1, team2, winner, maxScore = 2) {
  selectPredTeam(btn, matchId, game, team1, team2, winner, maxScore);
}

// ----------------------------------------------------------
//  Classement
// ----------------------------------------------------------
async function showLeaderboard() {
  document.getElementById('leaderboard-modal')?.remove();
  const modal = document.createElement('div');
  modal.id        = 'leaderboard-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide">
      <div class="modal-header">
        <div class="modal-title">🏆 Classement</div>
        <button class="modal-close" onclick="document.getElementById('leaderboard-modal').remove()">✕</button>
      </div>
      <div class="leaderboard-tabs">
        <button class="lb-tab active" onclick="loadLeaderboard('global', this)">Global</button>
        ${Object.entries(EsportAPI.GAME_CONFIG)
          .filter(([, c]) => c.source === 'pandascore')
          .map(([k, c]) => `<button class="lb-tab" onclick="loadLeaderboard('${k}', this)">${c.label}</button>`)
          .join('')}
      </div>
      <div id="leaderboard-content"><div class="lb-loading">Chargement...</div></div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  await loadLeaderboard('global', modal.querySelector('.lb-tab'));
}

async function loadLeaderboard(type, btn) {
  document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById('leaderboard-content');
  el.innerHTML = '<div class="lb-loading">Chargement...</div>';
  try {
    const data = type === 'global' ? await getLeaderboard() : await getLeaderboardByGame(type);
    if (data.length === 0) { el.innerHTML = '<div class="lb-empty">Aucune prédiction pour l\'instant.</div>'; return; }
    el.innerHTML = `
      <table class="lb-table">
        <thead><tr><th>#</th><th>Pseudo</th><th>Rang</th><th>Points</th><th>🔥</th></tr></thead>
        <tbody>${data.map(u => {
          const rankBadge = window.renderRankBadge ? window.renderRankBadge(u.points, u.rank, 'small') : '';
          return `
          <tr class="${u.id === currentUser?.uid ? 'lb-me' : ''}">
            <td class="lb-rank">${u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : u.rank}</td>
            <td class="lb-name">${u.username || '—'}</td>
            <td>${rankBadge}</td>
            <td class="lb-pts">⭐ ${u.points}</td>
            <td class="lb-streak">${u.streak > 0 ? '🔥 ' + u.streak : '—'}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>`;
  } catch (err) { el.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>'; }
}

// ----------------------------------------------------------
//  Init — écoute auth
// ----------------------------------------------------------
function initPredictions() {
  auth.onAuthStateChanged(async user => {
    currentUser    = user;
    currentProfile = user ? await getUserProfile(user.uid) : null;
    renderAuthBar();
    const favBtn = document.getElementById('fav-nav-btn');
    if (favBtn) favBtn.style.display = user ? 'flex' : 'none';

    // Landing page ou matchs selon connexion
    if (window.handleLandingDisplay) {
      window.handleLandingDisplay(user);
    } else if (window.renderMatches) {
      window.renderMatches();
    }

    // Pop-up de bienvenue pour les nouveaux inscrits
    if (user && currentProfile && window.showWelcomePopup) {
      const isNew = currentProfile.createdAt &&
        (new Date() - new Date(currentProfile.createdAt)) < 60000;
      if (isNew) showWelcomePopup(currentProfile.username);
    }
  });
}

// Exposer globalement
window.showAuthModal       = showAuthModal;
window.handleAuth          = handleAuth;
window.handleLogout        = handleLogout;
window.predict             = predict;
window.selectPredTeam      = selectPredTeam;
window.selectPredTeamGlobal = selectPredTeamGlobal;
window.showLeaderboard     = showLeaderboard;
window.loadLeaderboard     = loadLeaderboard;
window.renderPredictionBtn = renderPredictionBtn;
window.initPredictions     = initPredictions;

console.log('[Predictions] chargé ✓');
