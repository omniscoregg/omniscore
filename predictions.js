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

async function savePrediction(uid, matchId, game, team1, team2, predictedWinner, predictedScore1 = null, predictedScore2 = null, matchStartTime = null) {
  const predId = `${uid}_${matchId}`;
  await db.collection('predictions').doc(predId).set({
    uid, matchId, game, team1, team2, predictedWinner,
    predictedScore1, predictedScore2,
    matchStartTime, // ISO string — permet à la règle Firestore de vérifier "avant le début du match" pour la modif Premium
    result: null, points: 0, createdAt: new Date().toISOString(),
  });
  await db.collection('users').doc(uid).update({
    predictions: firebase.firestore.FieldValue.increment(1)
  });
}

// Modifier une prédiction existante (Premium, avant le début du match).
// Envoie aussi matchStartTime : pour les prédictions créées avant l'ajout de ce
// champ, ça permet de le renseigner rétroactivement (la règle Firestore l'autorise
// une seule fois, quand le champ est absent du document).
async function updatePrediction(uid, matchId, predictedWinner, predictedScore1 = null, predictedScore2 = null) {
  const predId = `${uid}_${matchId}`;
  const matchStartTime = getMatchStartTime(matchId);
  const payload = { predictedWinner, predictedScore1, predictedScore2 };
  if (matchStartTime) payload.matchStartTime = matchStartTime;
  await db.collection('predictions').doc(predId).update(payload);
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
  const cacheKey = 'lbGlobal:' + limitCount;
  const cached   = _cacheGet(cacheKey);
  if (cached) return cached;
  const snap = await db.collection('users').orderBy('points', 'desc').limit(limitCount).get();
  const result = snap.docs.map((d, i) => ({ rank: i + 1, id: d.id, ...d.data() }));
  _cacheSet(cacheKey, result);
  return result;
}

// Début de la saison en cours (reset les 1er janvier / mai / septembre,
// même cadence que le reset des points de saison côté worker)
function getCurrentSeasonStart() {
  const now   = new Date();
  const month = now.getMonth(); // 0 = janvier
  const startMonth = month >= 8 ? 8 : month >= 4 ? 4 : 0;
  return new Date(now.getFullYear(), startMonth, 1, 0, 0, 0, 0);
}
window.getCurrentSeasonStart = getCurrentSeasonStart;

// Cache court (60s) pour éviter de refaire les mêmes lectures coûteuses
// quand un utilisateur ré-ouvre le classement ou change d'onglet plusieurs fois.
const _cache = {}; // key -> { at: timestamp, data }
const CACHE_TTL_MS = 60 * 1000;
function _cacheGet(key) {
  const hit = _cache[key];
  if (hit && (Date.now() - hit.at) < CACHE_TTL_MS) return hit.data;
  return null;
}
function _cacheSet(key, data) { _cache[key] = { at: Date.now(), data }; }
window._omniInvalidateCache = () => { Object.keys(_cache).forEach(k => delete _cache[k]); };

async function getLeaderboardByGame(game, limitCount = 20) {
  const cacheKey = 'lbGame:' + game + ':' + limitCount;
  const cached   = _cacheGet(cacheKey);
  if (cached) return cached;

  const seasonStart = getCurrentSeasonStart();
  // Filtre par jeu ET par saison directement côté Firestore
  // (nécessite un index composite game + createdAt — Firestore en fournit
  //  le lien de création automatiquement dans la console si besoin).
  const snap = await db.collection('predictions')
    .where('game', '==', game)
    .where('createdAt', '>=', seasonStart.toISOString())
    .get();

  const byUser = {};
  snap.docs.map(d => d.data()).forEach(p => {
    if (!byUser[p.uid]) byUser[p.uid] = { uid: p.uid, id: p.uid, points: 0, predictions: 0 };
    byUser[p.uid].points      += p.points;
    byUser[p.uid].predictions += 1;
  });

  const sorted = Object.values(byUser).sort((a, b) => b.points - a.points).slice(0, limitCount);

  // Récupérer les usernames + statut premium depuis la collection users
  await Promise.all(sorted.map(async u => {
    try {
      const userSnap = await db.collection('users').doc(u.uid).get();
      const data = userSnap.exists ? userSnap.data() : {};
      u.username = data.username || '—';
      u.email    = data.email    || '';
      u.premium  = !!data.premium;
    } catch(e) { u.username = '—'; }
  }));

  const result = sorted.map((u, i) => ({ rank: i + 1, ...u }));
  _cacheSet(cacheKey, result);
  return result;
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
//  Calculer les stats agrégées à partir d'un tableau de prédictions
//  (partagé entre profile.js et leagues.js, pour éviter la duplication)
// ----------------------------------------------------------
function computePredictionStats(preds) {
  const total    = preds.length;
  const correct  = preds.filter(p => p.result === 'correct' || p.result === 'perfect').length;
  const perfect  = preds.filter(p => p.result === 'perfect').length;
  const wrong    = preds.filter(p => p.result === 'wrong').length;
  const pending  = preds.filter(p => p.result === null).length;
  const resolved = total - pending;
  const pct      = resolved > 0 ? Math.round((correct / resolved) * 100) : 0;
  return { total, correct, perfect, wrong, pending, pct };
}
window.computePredictionStats = computePredictionStats;

// ----------------------------------------------------------
//  Exposer FirebaseService globalement
// ----------------------------------------------------------
window.FirebaseService = {
  register, login, logout,
  getUserProfile, hasPredicted,
  savePrediction, updatePrediction, getPredictionsForMatch, watchPredictions,
  getLeaderboard, getLeaderboardByGame,
  addFavorite, removeFavorite, getFavorites, isFavorite,
  addFavoriteGame, removeFavoriteGame, getFavoriteGames,
  getUserPredictions: async (uid) => {
    const cacheKey = 'userPreds:' + uid;
    const cached   = _cacheGet(cacheKey);
    if (cached) return cached;
    const snap = await db.collection('predictions')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    const result = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _cacheSet(cacheKey, result);
    return result;
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
    const rankObj    = window.getSeasonRank ? window.getSeasonRank(currentProfile.points || 0) : { name: 'Bronze', color: '#cd7f32' };
    const frameClass = 'rank-frame-' + rankObj.name.toLowerCase().replace(/[îâêàùé]/g, c => ({'î':'i','â':'a','ê':'e','à':'a','ù':'u','é':'e'}[c]||c));
    const initials   = (currentProfile.username || '?')[0].toUpperCase();
    const isPremium  = !!currentProfile.premium;

    el.innerHTML = `
      <div class="auth-user">
        <!-- Avatar cliquable → profil -->
        <div class="auth-avatar lb-avatar-frame ${frameClass}${isPremium ? ' is-premium' : ''}" id="auth-avatar-wrap" onclick="showProfilePage()" style="cursor:pointer;--rank-color:${rankObj.color};width:30px;height:30px">
          <div class="lb-avatar-photo">
            <div class="lb-avatar-initials" style="display:flex;color:${rankObj.color};font-size:12px">${initials}</div>
            ${isPremium ? '<div class="premium-shine"></div>' : ''}
          </div>
        </div>
        <!-- Pseudo + points : masqués sur mobile -->
        <span class="auth-username desktop-only" onclick="showProfilePage()" style="cursor:pointer">${currentProfile.username}</span>
        <span class="auth-points desktop-only" id="auth-season-pts">⭐ ${currentProfile.points} pts</span>
        <!-- Points mobile : version courte -->
        <span class="auth-points mobile-only" id="auth-season-pts-mobile">⭐ ${currentProfile.points}</span>
        ${currentProfile.streak > 0 ? `<span class="auth-streak desktop-only" title="Série de ${currentProfile.streak}">🔥 ${currentProfile.streak}</span>` : ''}
        <!-- Boutons desktop uniquement -->
        <button class="auth-btn small desktop-only tooltip-btn notif-btn" onclick="showNotificationsPage()" data-tooltip="Notifications" style="position:relative">🔔<span class="notif-badge" style="display:none"></span></button>
       <button class="auth-btn small desktop-only tooltip-btn" onclick="showTournamentsPage()" data-tooltip="Tournois">🎯</button>
	   <button class="auth-btn small desktop-only tooltip-btn" onclick="showLeaderboard()" data-tooltip="Classement">🏆</button>
        <button class="auth-btn small desktop-only tooltip-btn" onclick="showLeaguesPage ? showLeaguesPage() : null" data-tooltip="Ligues">⚔️</button>
        <button class="auth-btn small desktop-only tooltip-btn" onclick="showProfilePage()" data-tooltip="Profil">👤</button>
        <button class="auth-btn small logout desktop-only tooltip-btn" onclick="handleLogout()" data-tooltip="Déconnexion">↩</button>
      </div>`;

    // Charger les points saisonniers + Gravatar
    if (window.getSeasonPoints) {
      window.getSeasonPoints(currentUser.uid).then(seasonPts => {
        const pts = document.getElementById('auth-season-pts');
        if (pts) pts.textContent = '⭐ ' + seasonPts + ' pts saison';
        const ptsMobile = document.getElementById('auth-season-pts-mobile');
        if (ptsMobile) ptsMobile.textContent = '⭐ ' + seasonPts;
      });
    }
    // Charger l'avatar Gravatar
    if (typeof md5 === 'function' && currentProfile.email) {
      const avatarWrap = document.getElementById('auth-avatar-wrap');
      if (avatarWrap) {
        const gravatarUrl = 'https://www.gravatar.com/avatar/' + md5(currentProfile.email.trim().toLowerCase()) + '?s=30&d=404';
        const img = new Image();
        img.onload = () => {
          const photoContainer = avatarWrap.querySelector('.lb-avatar-photo');
          if (photoContainer) {
            photoContainer.innerHTML = `<img src="${gravatarUrl}" class="lb-avatar-img" style="display:block">${isPremium ? '<div class="premium-shine"></div>' : ''}`;
          }
        };
        img.src = gravatarUrl;
      }
    }
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
      <div class="form-group"><label>Email</label><input type="email" id="auth-email" placeholder="votre@email.com" class="form-input" autocomplete="email"></div>
      <div class="form-group"><label>Mot de passe</label><input type="password" id="auth-password" placeholder="Votre mot de passe" class="form-input" autocomplete="current-password"></div>
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
  const emailInput    = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const usernameInput = document.getElementById('auth-username');
  const email    = emailInput?.value?.trim();
  const password = passwordInput?.value;
  const username = usernameInput?.value?.trim();

  // Réinitialiser les bordures d'erreur
  [emailInput, passwordInput, usernameInput].forEach(el => el?.classList.remove('form-input-error'));

  if (!email || !password) {
    if (!email) emailInput?.classList.add('form-input-error');
    if (!password) passwordInput?.classList.add('form-input-error');
    showFormError('Veuillez remplir tous les champs.');
    (!email ? emailInput : passwordInput)?.focus();
    return;
  }
  try {
    if (authModalMode === 'register') {
      if (!username) { usernameInput?.classList.add('form-input-error'); usernameInput?.focus(); showFormError('Veuillez choisir un pseudo.'); return; }
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
//  Scores valides selon le format
// ----------------------------------------------------------
function getValidScores(format) {
  const scores = {
    'Bo1': [[1, 0]],
    'Bo3': [[2, 0], [2, 1]],
    'Bo5': [[3, 0], [3, 1], [3, 2]],
    'Bo7': [[4, 0], [4, 1], [4, 2], [4, 3]],
  };
  return scores[format] || scores['Bo3'];
}
window.getValidScores = getValidScores;

async function confirmPredWithScore(matchId, game, team1, team2, winner, s1, s2) {
  // 1. Stocker immédiatement
  window._predStore[matchId] = { winner, score1: s1, score2: s2 };

  // 2. Mettre à jour les pastilles AVANT de fermer quoi que ce soit
  updateMatchCardPills(matchId, winner, s1, s2);

  // 3. Supprimer le panel de score
  document.getElementById('score-row-' + matchId)?.remove();
  document.querySelectorAll('.onetap-score-panel, .score-choice-panel').forEach(e => e.remove());

  // 4. Fermer la fiche de match si ouverte
  const matchModal = document.getElementById('match-detail-modal');
  if (matchModal) matchModal.remove();

  // 5. Son
  playPredictionSound();

  // 6. Glow
  glowMatchCard(matchId, game, winner, s1, s2);

  // 7. Sauvegarder en arrière-plan
  await predict(matchId, game, team1, team2, winner, s1, s2);
}
window.confirmPredWithScore = confirmPredWithScore;

// ----------------------------------------------------------
//  Mettre à jour les pastilles d'une carte sans recharger
// ----------------------------------------------------------
function updateMatchCardPills(matchId, winner, score1, score2) {
  const card = document.querySelector('[data-match-id="' + matchId + '"]');
  if (!card) return;

  const pills = card.querySelectorAll('.pred-pill');
  if (pills.length < 2) return;

  const pill1 = pills[0];
  const pill2 = pills[1];
  const t1 = pill1.dataset.t1 || '';
  const isWinner1 = winner === t1;
  const s1 = score1 !== null && score1 !== undefined ? score1 : '';
  const s2 = score2 !== null && score2 !== undefined ? score2 : '';

  const span1 = document.createElement('span');
  span1.className = 'pred-pill-result ' + (isWinner1 ? 'win' : 'lose');
  span1.innerHTML = (s1 !== '' ? s1 + ' ' : '') + '<span class="pred-pill-dot filled"></span>';
  pill1.replaceWith(span1);

  const span2 = document.createElement('span');
  span2.className = 'pred-pill-result ' + (!isWinner1 ? 'win' : 'lose');
  span2.innerHTML = '<span class="pred-pill-dot filled"></span>' + (s2 !== '' ? ' ' + s2 : '');
  pill2.replaceWith(span2);
}
window.updateMatchCardPills = updateMatchCardPills;

// ----------------------------------------------------------
//  Son de validation prédiction
// ----------------------------------------------------------
function playPredictionSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Note 1 — montée
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.15);
    // Note 2 — plus haute
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc2.start(ctx.currentTime + 0.12); osc2.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}
window.playPredictionSound = playPredictionSound;

// ----------------------------------------------------------
//  Effet glow sur la carte de match après prédiction
// ----------------------------------------------------------
function glowMatchCard(matchId, game, winner, s1, s2) {
  const card = document.querySelector('[data-match-id="' + matchId + '"]');
  if (!card) return;

  // Couleur selon le jeu
  const cfg    = EsportAPI.GAME_CONFIG[game];
  const colors = window.GENRE_COLORS?.[cfg?.genre] || {};
  const glowColor = colors.accent || '#a78bfa';

  // Glow sur le cadre
  card.style.transition = 'box-shadow 0.2s ease, border-color 0.2s ease';
  card.style.boxShadow  = '0 0 20px ' + glowColor + '80, 0 0 40px ' + glowColor + '40';
  card.style.borderColor = glowColor;

  setTimeout(() => {
    card.style.boxShadow  = '';
    card.style.borderColor = '';
    // Le flash temporaire cède la place au cadre violet persistant
    // (normalement appliqué seulement au rendu complet de la carte)
    card.classList.add('pred-border-upcoming');
  }, 1200);
}
window.glowMatchCard = glowMatchCard;

// ----------------------------------------------------------
//  Bouton prédiction sur les cartes
// ----------------------------------------------------------
async function renderPredictionBtn(matchId, game, team1, team2, status, format = 'Bo3') {
  if (status !== 'upcoming') return '';
  if (!currentUser) {
    return `<div class="pred-cta" onclick="showAuthModal('login')">Connectez-vous pour prédire</div>`;
  }
  const existing = await hasPredicted(currentUser.uid, matchId);
  if (existing) {
    const resultColors = { correct: '#4ade80', wrong: '#f87171', perfect: '#fbbf24' };
    const color = existing.result ? (resultColors[existing.result] || '') : '';
    const badgeStyle = `color:${color};font-weight:700;border:1px solid ${color}70;box-shadow:0 0 10px ${color}40;border-radius:20px;padding:2px 10px;display:inline-block`;
    const t1esc = team1.replace(/'/g, "\\'");
    const t2esc = team2.replace(/'/g, "\\'");
    // Modification de prédiction avant le début du match — réservé aux membres Premium
    // (le match est encore "upcoming" à ce stade, donc pas encore commencé)
    const editBtn = existing.result
      ? ''
      : currentProfile?.premium
        ? `<button class="pred-edit-btn" onclick="startEditPrediction('${matchId}','${game}','${t1esc}','${t2esc}','${format}')" title="Modifier ma prédiction">✏️</button>`
        : `<button class="pred-edit-btn locked" onclick="showPremiumModal()" title="Modifier sa prédiction (Premium)">✏️ 👑</button>`;
    return `<div class="pred-existing">${existing.result ? `<span style="${badgeStyle}">${existing.points} pts</span>` : `Prédit : ${existing.predictedWinner}`}${editBtn}</div>`;
  }
  return `
    <div class="pred-buttons">
      <span class="pred-label">Qui va gagner ?</span>
      <div class="pred-teams-row">
        <button class="pred-btn" onclick="selectPredTeam(this,'${matchId}','${game}','${team1}','${team2}','${team1}','${format}')">${team1}</button>
        <button class="pred-btn" onclick="selectPredTeam(this,'${matchId}','${game}','${team1}','${team2}','${team2}','${format}')">${team2}</button>
      </div>
      <div id="score-row-${matchId}"></div>
    </div>`;
}

function selectPredTeam(btn, matchId, game, team1, team2, winner, format = 'Bo3') {
  const row = btn.closest('.pred-teams-row');
  if (row) row.querySelectorAll('.pred-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  document.querySelectorAll('.onetap-score-panel, .score-choice-panel').forEach(e => e.remove());

  const validScores = getValidScores(format);
  const isTeam1Winner = winner === team1;

  const scoreContainer = document.getElementById('score-row-' + matchId);

  const btns = validScores.map(([w, l]) => {
    const s1 = isTeam1Winner ? w : l;
    const s2 = isTeam1Winner ? l : w;
    return `<button class="score-choice-btn" onclick="event.stopPropagation();if(!this._touched){confirmPredWithScore('${matchId}','${game}','${team1}','${team2}','${winner}',${s1},${s2})}" ontouchend="event.stopPropagation();event.preventDefault();this._touched=true;confirmPredWithScore('${matchId}','${game}','${team1}','${team2}','${winner}',${s1},${s2})">${s1} - ${s2}</button>`;
  }).join('');

  const panelHTML = `
    <div class="score-choice-panel">
      <span class="pred-score-label">Score prédit <span style="color:var(--text3);font-size:10px">(optionnel)</span></span>
      <div class="score-choice-btns">${btns}</div>
      <button class="score-skip-btn" onclick="event.stopPropagation();if(!this._touched){confirmPredWithScore('${matchId}','${game}','${team1}','${team2}','${winner}',null,null)}" ontouchend="event.stopPropagation();event.preventDefault();this._touched=true;confirmPredWithScore('${matchId}','${game}','${team1}','${team2}','${winner}',null,null)">Sans score</button>
    </div>`;

  const stopAll = e => e.stopPropagation();
  if (scoreContainer) {
    scoreContainer.innerHTML = panelHTML;
    ['click','mousedown','touchstart','touchend'].forEach(ev => scoreContainer.addEventListener(ev, stopAll));
  } else {
    // Panel flottant pour les cartes onetap
    const panel = document.createElement('div');
    panel.className = 'onetap-score-panel score-choice-panel';
    panel.id = 'score-row-' + matchId;
    panel.innerHTML = `
      <span class="pred-score-label">Score prédit <span style="color:var(--text3);font-size:10px">(optionnel)</span></span>
      <div class="score-choice-btns">${btns}</div>
      <button class="score-skip-btn" onclick="event.stopPropagation();if(!this._touched){confirmPredWithScore('${matchId}','${game}','${team1}','${team2}','${winner}',null,null)}" ontouchend="event.stopPropagation();event.preventDefault();this._touched=true;confirmPredWithScore('${matchId}','${game}','${team1}','${team2}','${winner}',null,null)">Sans score</button>
      <button class="pred-cancel-btn" onclick="event.stopPropagation();document.getElementById('score-row-${matchId}')?.remove()">✕</button>
    `;
    ['click','mousedown','touchstart','touchend'].forEach(ev => panel.addEventListener(ev, stopAll));
    const card = btn.closest('.match-card');
    if (card) card.appendChild(panel);
  }
}

// Store local des prédictions pour affichage pastilles
window._predStore = window._predStore || {};

// Retrouve la date de début d'un match dans le store local (utilisé pour
// autoriser/bloquer côté Firestore la modification de prédiction Premium).
function getMatchStartTime(matchId) {
  if (!window.matchStore || typeof window.matchStore.get !== 'function') return null;
  const m = window.matchStore.get(matchId) || window.matchStore.get(String(matchId)) || window.matchStore.get(Number(matchId));
  return m?.date || null;
}

async function predict(matchId, game, team1, team2, winner, score1 = null, score2 = null) {
  if (!currentUser) { showAuthModal('login'); return; }
  try {
    const matchStartTime = getMatchStartTime(matchId);
    await savePrediction(currentUser.uid, matchId, game, team1, team2, winner, score1, score2, matchStartTime);
    window._predStore[matchId] = { winner, score1, score2 };
    await window.FirebaseService.updateDailyActivity(currentUser.uid);
    currentProfile = await getUserProfile(currentUser.uid);
    renderAuthBar();
    // Nouvelle prédiction = les classements en cache ne sont plus à jour
    if (window._omniInvalidateCache) window._omniInvalidateCache();
  } catch (err) { console.error('Erreur prédiction:', err); }
}

function selectPredTeamGlobal(btn, matchId, game, team1, team2, winner, format = 'Bo3') {
  selectPredTeam(btn, matchId, game, team1, team2, winner, format);
}

// ----------------------------------------------------------
//  Modifier une prédiction existante (Premium, avant le début du match)
// ----------------------------------------------------------
function startEditPrediction(matchId, game, team1, team2, format) {
  document.getElementById('edit-pred-modal')?.remove();
  const modal = document.createElement('div');
  modal.id        = 'edit-pred-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">✏️ Modifier ma prédiction</div>
        <button class="modal-close" onclick="document.getElementById('edit-pred-modal').remove()">✕</button>
      </div>
      <span class="pred-label">Qui va gagner ?</span>
      <div class="pred-teams-row" style="margin:8px 0 12px">
        <button class="pred-btn" id="edit-pred-team1" onclick="selectEditTeam('${team1.replace(/'/g, "\\'")}')">${team1}</button>
        <button class="pred-btn" id="edit-pred-team2" onclick="selectEditTeam('${team2.replace(/'/g, "\\'")}')">${team2}</button>
      </div>
      <div id="edit-pred-score-row"></div>
      <div id="edit-pred-error" class="form-error" style="display:none;margin-top:8px"></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  window._editPredCtx = { matchId, game, team1, team2, format, winner: null };
}
window.startEditPrediction = startEditPrediction;

function selectEditTeam(winner) {
  const ctx = window._editPredCtx;
  if (!ctx) return;
  ctx.winner = winner;

  const btn1 = document.getElementById('edit-pred-team1');
  const btn2 = document.getElementById('edit-pred-team2');
  [btn1, btn2].forEach(b => b?.classList.remove('selected'));
  (winner === ctx.team1 ? btn1 : btn2)?.classList.add('selected');

  const validScores   = getValidScores(ctx.format);
  const isTeam1Winner  = winner === ctx.team1;
  const btns = validScores.map(([w, l]) => {
    const s1 = isTeam1Winner ? w : l;
    const s2 = isTeam1Winner ? l : w;
    return `<button class="score-choice-btn" onclick="confirmEditPrediction(${s1},${s2})">${s1} - ${s2}</button>`;
  }).join('');

  const scoreRow = document.getElementById('edit-pred-score-row');
  if (scoreRow) {
    scoreRow.innerHTML = `
      <span class="pred-score-label">Score prédit <span style="color:var(--text3);font-size:10px">(optionnel)</span></span>
      <div class="score-choice-btns">${btns}</div>
      <button class="score-skip-btn" onclick="confirmEditPrediction(null,null)">Sans score</button>
    `;
  }
}
window.selectEditTeam = selectEditTeam;

async function confirmEditPrediction(s1, s2) {
  const ctx = window._editPredCtx;
  if (!ctx || !ctx.winner || !currentUser) return;

  try {
    await window.FirebaseService.updatePrediction(currentUser.uid, ctx.matchId, ctx.winner, s1, s2);
    window._predStore[ctx.matchId] = { winner: ctx.winner, score1: s1, score2: s2 };
    if (window._omniInvalidateCache) window._omniInvalidateCache();
    document.getElementById('edit-pred-modal')?.remove();
    playPredictionSound();
    if (window.renderMatches) window.renderMatches();
    // Si la fiche de match détaillée est ouverte sur ce même match, rafraîchir son résumé de prédiction
    if (document.getElementById('match-detail-modal') && window._lastOpenedMatch
        && String(window._lastOpenedMatch.id) === String(ctx.matchId) && window.loadPredAction) {
      window.loadPredAction(window._lastOpenedMatch, window.GENRE_COLORS?.[window._lastOpenedMatch.genre] || { accent: '#a78bfa' }, true);
    }
  } catch(e) {
    console.error('[Predictions] confirmEditPrediction:', e);
    const err = document.getElementById('edit-pred-error');
    if (err) {
      err.textContent = "Impossible de modifier cette prédiction (le match a peut-être déjà commencé).";
      err.style.display = 'block';
    }
  }
}
window.confirmEditPrediction = confirmEditPrediction;

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
        <button class="lb-tab active" onclick="loadLeaderboard('season', this)">Global saisonnier</button>
        ${Object.entries(EsportAPI.GAME_CONFIG)
          .filter(([, c]) => c.source === 'pandascore')
          .map(([k, c]) => `<button class="lb-tab" onclick="loadLeaderboard('${k}', this)">${c.label}</button>`)
          .join('')}
      </div>
      <div id="leaderboard-content"><div class="lb-loading">Chargement...</div></div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  await loadLeaderboard('season', modal.querySelector('.lb-tab'));
}

async function loadLeaderboard(type, btn) {
  document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById('leaderboard-content');
  el.innerHTML = '<div class="lb-loading">Chargement...</div>';
  try {
    // Classement saisonnier
    if (type === 'season' && window.renderSeasonLeaderboard) {
      await window.renderSeasonLeaderboard(el, window.i18n ? window.i18n.currentLang() : 'fr');
      return;
    }
    const data = type === 'global' ? await getLeaderboard() : await getLeaderboardByGame(type);
    if (data.length === 0) { el.innerHTML = '<div class="lb-empty">Aucune prédiction pour l\'instant.<br><span style="font-size:12px;color:var(--text3)">Sois le premier à prédire un match pour apparaître dans ce classement !</span></div>'; return; }
    // Générer les avatars Gravatar pour chaque joueur
    const avatarMap = {};
    if (typeof md5 === 'function') {
      data.forEach(u => {
       if (u.email) avatarMap[u.id] = 'https://www.gravatar.com/avatar/' + md5(u.email.trim().toLowerCase()) + '?s=36&d=404';
      });
    }

    el.innerHTML = `
      <table class="lb-table">
        <thead><tr><th>#</th><th>Joueur</th><th>Rang</th><th>Points</th><th>🔥</th></tr></thead>
        <tbody>${data.map(u => {
          const rankObj   = window.getRank ? window.getRank(u.points, u.rank) : { name: 'Bronze', color: '#cd7f32', icon: '🥉' };
          const rankBadge = window.renderRankBadge ? window.renderRankBadge(u.points, u.rank, 'small') : '';
          const frameClass = 'rank-frame-' + rankObj.name.toLowerCase().replace(/[îâêàùé]/g, c => ({'î':'i','â':'a','ê':'e','à':'a','ù':'u','é':'e'}[c]||c));
          const initials  = (u.username || '?')[0].toUpperCase();
          const avatarUrl = avatarMap[u.id];
          const avatarHtml = `<div class="lb-avatar-frame ${frameClass}${u.premium ? ' is-premium' : ''}" style="--rank-color:${rankObj.color}">
            <div class="lb-avatar-photo">
              ${avatarUrl ? `<img src="${avatarUrl}" class="lb-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
              <div class="lb-avatar-initials" style="${avatarUrl ? 'display:none' : 'display:flex'};color:${rankObj.color}">${initials}</div>
              ${u.premium ? '<div class="premium-shine"></div>' : ''}
            </div>
          </div>`;
          return `
          <tr class="${u.id === currentUser?.uid ? 'lb-me' : ''}">
            <td class="lb-rank">${u.rank}</td>
            <td class="lb-name">
              <div style="display:flex;align-items:center;gap:8px">
                ${avatarHtml}
                <span>${u.username || '—'}</span>
              </div>
            </td>
            <td>${rankBadge}</td>
            <td class="lb-pts">${u.points}</td>
            <td class="lb-streak">${u.streak > 0 ? u.streak : '—'}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>`;
  } catch (err) { el.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>'; }
}

// ----------------------------------------------------------
//  Init — écoute auth
// ----------------------------------------------------------
// ----------------------------------------------------------
//  Stores locaux pour les cadres et pastilles
// ----------------------------------------------------------
window._predStore     = window._predStore     || {};
window._resolvedStore = window._resolvedStore || {};

async function loadPredStore(uid) {
  try {
    const snap = await firebase.firestore().collection('predictions')
      .where('uid', '==', uid)
      .where('result', '==', null)
      .get();
    window._predStore = {};
    snap.docs.forEach(d => {
      const p = d.data();
      window._predStore[String(p.matchId)] = {
        winner: p.predictedWinner,
        score1: p.predictedScore1,
        score2: p.predictedScore2
      };
    });
    console.log('[Predictions] PredStore:', Object.keys(window._predStore).length, 'en attente');
  } catch(e) { console.warn('[Predictions] loadPredStore:', e); }
}

async function loadResolvedStore(uid) {
  try {
    const snap = await firebase.firestore().collection('predictions')
      .where('uid', '==', uid)
      .where('result', 'in', ['correct', 'perfect', 'wrong'])
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    window._resolvedStore = {};
    snap.docs.forEach(d => {
      const p = d.data();
      window._resolvedStore[String(p.matchId)] = { result: p.result, points: p.points };
    });
    console.log('[Predictions] ResolvedStore:', Object.keys(window._resolvedStore).length, 'résolues');
  } catch(e) { console.warn('[Predictions] loadResolvedStore:', e); }
}

function initPredictions() {
  auth.onAuthStateChanged(async user => {
    currentUser    = user;
    currentProfile = user ? await getUserProfile(user.uid) : null;
window.currentProfile = currentProfile;
    renderAuthBar();
    if (user && window.loadNotifications) window.loadNotifications();
    const favBtn = document.getElementById('fav-nav-btn');
if (favBtn) favBtn.style.display = user ? 'flex' : 'none';

const teamSearchWrap = document.querySelector('.navbar-team-search');
if (teamSearchWrap) teamSearchWrap.style.display = user ? 'flex' : 'none';

// Bouton profil mobile
const mnavProfile = document.getElementById('mnav-profile');
if (mnavProfile) mnavProfile.style.display = user ? 'flex' : 'none';

// Mettre à jour le pseudo dans le bouton mobile
if (user && currentProfile) {
  const label = document.getElementById('mnav-profile-label');
  if (label) label.textContent = currentProfile.username || 'Profil';
}

    // Charger les stores de prédictions AVANT de rendre les cartes
    if (user) {
      await Promise.all([loadPredStore(user.uid), loadResolvedStore(user.uid)]);
    }

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
window.loadPredStore       = loadPredStore;
window.loadResolvedStore   = loadResolvedStore;

console.log('[Predictions] chargé ✓');
