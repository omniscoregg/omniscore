// ============================================================
//  tournaments.js — Prédictions de tournois
//  +5 pts par demi-finaliste correct
//  +15 pts pour le gagnant correct
// ============================================================

const TOURN_CACHE_URL  = 'https://omniscore-cache.omniscoregg.workers.dev';
const TOURN_PANDA_TOKEN = '4U4XspWxILG2eufIZkowjW0uDKwy2L2MbFOTXCISpCOHMRMBKZo';

// ----------------------------------------------------------
//  Récupérer les tournois en cours + à venir
// ----------------------------------------------------------
async function fetchTournaments(gameKey) {
  const cfg = EsportAPI?.GAME_CONFIG?.[gameKey];
  if (!cfg) return [];

  try {
    const [running, upcoming] = await Promise.all([
      fetch(`${TOURN_CACHE_URL}?type=tournaments&status=running&slug=${cfg.slug}&token=${TOURN_PANDA_TOKEN}&per_page=10`).then(r => r.json()).catch(() => []),
      fetch(`${TOURN_CACHE_URL}?type=tournaments&status=upcoming&slug=${cfg.slug}&token=${TOURN_PANDA_TOKEN}&per_page=10`).then(r => r.json()).catch(() => []),
    ]);

    const all = [...(Array.isArray(running) ? running : []), ...(Array.isArray(upcoming) ? upcoming : [])];
    return all.filter(t => t.teams && t.teams.length >= 4);
  } catch(e) {
    console.error('[Tournaments] fetchTournaments:', e);
    return [];
  }
}

// ----------------------------------------------------------
//  Sauvegarder une prédiction de tournoi
// ----------------------------------------------------------
async function saveTournamentPrediction(uid, tournamentId, game, tournamentName, semis, winner) {
  await firebase.firestore()
    .collection('tournament_predictions')
    .doc(`${uid}_${tournamentId}`)
    .set({
      uid,
      tournamentId: String(tournamentId),
      game,
      tournamentName,
      semis,   // array de 4 team names
      winner,  // 1 team name
      result:  null,
      points:  0,
      createdAt: new Date().toISOString(),
    });
}

// ----------------------------------------------------------
//  Lire la prédiction existante
// ----------------------------------------------------------
async function getTournamentPrediction(uid, tournamentId) {
  try {
    const snap = await firebase.firestore()
      .collection('tournament_predictions')
      .doc(`${uid}_${tournamentId}`)
      .get();
    return snap.exists ? snap.data() : null;
  } catch(e) { return null; }
}

// ----------------------------------------------------------
//  Afficher la page tournois
// ----------------------------------------------------------
async function showTournamentsPage() {
  // Masquer le contenu principal
  document.querySelector('.layout')?.style.setProperty('display', 'none');

  // Créer ou récupérer le conteneur
  let page = document.getElementById('tournaments-page');
  if (!page) {
    page = document.createElement('div');
    page.id = 'tournaments-page';
    page.className = 'tournaments-page';
    document.body.appendChild(page);
  }

  page.style.display = 'block';
  page.innerHTML = `
    <div class="tourn-header">
      <button class="back-btn" onclick="closeTournamentsPage()">← Retour</button>
      <h2 class="tourn-title">🏆 Tournois</h2>
    </div>
    <div class="tourn-game-tabs" id="tourn-game-tabs"></div>
    <div id="tourn-content" class="tourn-content">
      <div class="lb-loading">Chargement...</div>
    </div>
  `;

  // Générer les onglets de jeux
  const tabs = document.getElementById('tourn-game-tabs');
  const games = Object.entries(EsportAPI.GAME_CONFIG).filter(([, c]) => c.source === 'pandascore');
  let selectedGame = games[0]?.[0];

  tabs.innerHTML = games.map(([key, cfg]) => `
    <button class="tourn-game-tab ${key === selectedGame ? 'active' : ''}"
      onclick="selectTournGame('${key}', this)">
      ${cfg.label}
    </button>
  `).join('');

  await loadTournamentsByGame(selectedGame);
}

function closeTournamentsPage() {
  document.getElementById('tournaments-page')?.remove();
  document.querySelector('.layout')?.style.removeProperty('display');
}

async function selectTournGame(gameKey, btn) {
  document.querySelectorAll('.tourn-game-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  await loadTournamentsByGame(gameKey);
}

async function loadTournamentsByGame(gameKey) {
  const content = document.getElementById('tourn-content');
  if (!content) return;
  content.innerHTML = '<div class="lb-loading">Chargement des tournois...</div>';

  const tournaments = await fetchTournaments(gameKey);
  const cfg = EsportAPI.GAME_CONFIG[gameKey];
  const colors = window.GENRE_COLORS?.[cfg?.genre] || {};
  const accent = colors.accent || '#a78bfa';
  const user = window.FirebaseService?.getCurrentUser();

  if (tournaments.length === 0) {
    content.innerHTML = '<div class="lb-empty">Aucun tournoi en cours ou à venir pour ce jeu.</div>';
    return;
  }

  content.innerHTML = tournaments.map(t => {
    const isRunning = t.begin_at && new Date(t.begin_at) <= new Date();
    const date = t.begin_at ? new Date(t.begin_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
    const teams = (t.teams || []).slice(0, 16);

    return `
      <div class="tourn-card" id="tourn-${t.id}">
        <div class="tourn-card-header" style="border-left:3px solid ${accent}">
          <div class="tourn-card-info">
            <span class="tourn-card-name">${t.name}</span>
            <span class="tourn-card-league">${t.league?.name || ''} · ${date}</span>
          </div>
          <span class="tourn-status-pill ${isRunning ? 'live' : 'upcoming'}">${isRunning ? '🔴 EN COURS' : '📅 À venir'}</span>
        </div>
        <div class="tourn-card-body" id="tourn-body-${t.id}">
          <div class="lb-loading">Chargement prédiction...</div>
        </div>
      </div>
    `;
  }).join('');

  // Charger les prédictions existantes pour chaque tournoi
  if (user) {
    await Promise.all(tournaments.map(t => loadTournamentPredForm(t, user.uid, accent)));
  }
}

async function loadTournamentPredForm(t, uid, accent) {
  const body = document.getElementById(`tourn-body-${t.id}`);
  if (!body) return;

  const existing = await getTournamentPrediction(uid, t.id);
  const teams = (t.teams || []).slice(0, 16);

  if (existing) {
    // Afficher la prédiction existante
    body.innerHTML = renderExistingPred(existing, accent);
    return;
  }

  // Formulaire de prédiction
  body.innerHTML = `
    <div class="tourn-pred-form" data-tourn-id="${t.id}">
      <div class="tourn-section-title">🎯 Choisis tes 4 équipes qualifiées pour les playoffs</div>
      <div class="tourn-teams-grid" id="semis-grid-${t.id}">
        ${teams.map(team => `
          <button class="tourn-team-btn" 
            onclick="toggleSemiTeam(this, '${t.id}', '${team.name.replace(/'/g, "\\'")}')"
            data-team="${team.name}">
            ${team.image_url ? `<img src="${team.image_url}" class="tourn-team-logo" onerror="this.style.display='none'">` : ''}
            <span class="tourn-team-name">${team.name}</span>
          </button>
        `).join('')}
      </div>
      <div class="tourn-section-title" style="margin-top:16px">🏆 Choisis le gagnant / 1er du classement</div>
      <div class="tourn-teams-grid" id="winner-grid-${t.id}">
        ${teams.map(team => `
          <button class="tourn-team-btn winner-btn" 
            onclick="selectWinnerTeam(this, '${t.id}', '${team.name.replace(/'/g, "\\'")}')"
            data-team="${team.name}">
            ${team.image_url ? `<img src="${team.image_url}" class="tourn-team-logo" onerror="this.style.display='none'">` : ''}
            <span class="tourn-team-name">${team.name}</span>
          </button>
        `).join('')}
      </div>
      <div class="tourn-pred-summary" id="summary-${t.id}">
        <span class="tourn-semis-count">0/4 demi-finalistes</span>
        <span class="tourn-winner-name">Aucun gagnant</span>
      </div>
      <button class="tourn-confirm-btn" id="confirm-${t.id}" 
        onclick="confirmTournPred('${t.id}', '${t.name.replace(/'/g, "\\'")}', '${t.game?.slug || ''}')" 
        disabled>
        Confirmer mes prédictions (+35 pts max)
      </button>
    </div>
  `;

  // Store local pour ce tournoi
  window._tournPreds = window._tournPreds || {};
  window._tournPreds[t.id] = { semis: [], winner: null };
}

function renderExistingPred(pred, accent) {
  const semisHtml = pred.semis.map(s => `<span class="tourn-pred-tag" style="border-color:${accent}40;color:${accent}">${s}</span>`).join('');
  return `
    <div class="tourn-existing-pred">
      <div class="tourn-pred-label">🎯 Tes demi-finalistes :</div>
      <div class="tourn-pred-tags">${semisHtml}</div>
      <div class="tourn-pred-label" style="margin-top:10px">🏆 Ton gagnant :</div>
      <span class="tourn-pred-tag winner" style="border-color:#fbbf2440;color:#fbbf24">${pred.winner}</span>
      ${pred.result ? `<div class="tourn-result-badge">${pred.result === 'partial' ? `✅ ${pred.points} pts gagnés` : pred.result === 'perfect' ? '🏆 Parfait !' : '❌ Manqué'}</div>` : '<div class="tourn-pending">⏳ En attente du résultat</div>'}
    </div>
  `;
}

// ----------------------------------------------------------
//  Interactions formulaire
// ----------------------------------------------------------
function toggleSemiTeam(btn, tournId, teamName) {
  const store = window._tournPreds?.[tournId];
  if (!store) return;

  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    store.semis = store.semis.filter(s => s !== teamName);
  } else {
    if (store.semis.length >= 4) return; // Max 4
    btn.classList.add('selected');
    store.semis.push(teamName);
  }
  updateTournSummary(tournId);
}

function selectWinnerTeam(btn, tournId, teamName) {
  const store = window._tournPreds?.[tournId];
  if (!store) return;

  document.querySelectorAll(`#winner-grid-${tournId} .tourn-team-btn`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  store.winner = teamName;
  updateTournSummary(tournId);
}

function updateTournSummary(tournId) {
  const store = window._tournPreds?.[tournId];
  if (!store) return;

  const summary = document.getElementById(`summary-${tournId}`);
  const confirmBtn = document.getElementById(`confirm-${tournId}`);
  if (!summary || !confirmBtn) return;

  const semisEl = summary.querySelector('.tourn-semis-count');
  const winnerEl = summary.querySelector('.tourn-winner-name');
  if (semisEl) semisEl.textContent = `${store.semis.length}/4 demi-finalistes`;
  if (winnerEl) winnerEl.textContent = store.winner ? `Gagnant : ${store.winner}` : 'Aucun gagnant';

  confirmBtn.disabled = store.semis.length < 4 || !store.winner;
}

async function confirmTournPred(tournId, tournName, gameSlug) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const store = window._tournPreds?.[tournId];
  if (!store || store.semis.length < 4 || !store.winner) return;

  const btn = document.getElementById(`confirm-${tournId}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde...'; }

  // Trouver le jeu depuis le slug
  const gameKey = Object.entries(EsportAPI.GAME_CONFIG).find(([, c]) => c.slug === gameSlug)?.[0] || gameSlug;

  try {
    await saveTournamentPrediction(user.uid, tournId, gameKey, tournName, store.semis, store.winner);

    // Son de validation
    if (window.playPredictionSound) playPredictionSound();

    // Recharger le formulaire
    const cfg = EsportAPI.GAME_CONFIG[gameKey];
    const colors = window.GENRE_COLORS?.[cfg?.genre] || {};
    const body = document.getElementById(`tourn-body-${tournId}`);
    if (body) {
      body.innerHTML = renderExistingPred({ semis: store.semis, winner: store.winner, result: null }, colors.accent || '#a78bfa');
    }
  } catch(e) {
    console.error('[Tournaments] confirmTournPred:', e);
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmer mes prédictions'; }
  }
}

// ----------------------------------------------------------
//  Exposer globalement
// ----------------------------------------------------------
window.showTournamentsPage  = showTournamentsPage;
window.closeTournamentsPage = closeTournamentsPage;
window.selectTournGame      = selectTournGame;
window.toggleSemiTeam       = toggleSemiTeam;
window.selectWinnerTeam     = selectWinnerTeam;
window.confirmTournPred     = confirmTournPred;

console.log('[tournaments] chargé ✓');
