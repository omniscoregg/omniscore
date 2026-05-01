// ============================================================
//  favorites.js — Page des équipes favorites
// ============================================================

async function showFavoritesPage() {
  document.getElementById('favorites-modal')?.remove();

  const user = window.FirebaseService?.getCurrentUser();
  if (!user) {
    showAuthModal('login');
    return;
  }

  const modal = document.createElement('div');
  modal.id        = 'favorites-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide fav-page">
      <div class="modal-header">
        <div class="modal-title">⭐ Mes Favoris</div>
        <button class="modal-close" onclick="document.getElementById('favorites-modal').remove()">✕</button>
      </div>
      <div class="fav-tabs">
        <button class="fav-tab active" onclick="switchFavTab('results', this)">📋 Résultats</button>
        <button class="fav-tab" onclick="switchFavTab('live', this)">🔴 En direct</button>
        <button class="fav-tab" onclick="switchFavTab('upcoming', this)">🕐 À venir</button>
      </div>
      <div id="fav-content"><div class="lb-loading">Chargement de vos favoris...</div></div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  await loadFavContent('results');
}

let currentFavTab = 'results';

async function switchFavTab(tab, btn) {
  currentFavTab = tab;
  document.querySelectorAll('.fav-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  await loadFavContent(tab);
}

async function loadFavContent(tab) {
  const el   = document.getElementById('fav-content');
  const user = window.FirebaseService?.getCurrentUser();
  if (!el || !user) return;

  el.innerHTML = '<div class="lb-loading">Chargement...</div>';

  // Récupérer les favoris équipes ET jeux
  const [favs, favGames] = await Promise.all([
    window.FirebaseService.getFavorites(user.uid),
    window.FirebaseService.getFavoriteGames(user.uid),
  ]);
  
  // Combiner : ajouter tous les matchs des jeux favoris
  const allGamesFromFavs = [...new Set([...favs.map(f => f.game), ...favGames])];
  if (favs.length === 0 && favGames.length === 0) {
    el.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">⭐</div>
        <div class="fav-empty-title">Aucun favori</div>
        <div class="fav-empty-sub">Cliquez sur ☆ dans la sidebar pour suivre un jeu, ou ouvrez la fiche d'un match pour suivre une équipe !</div>
      </div>`;
    return;
  }

  // Récupérer les matchs selon l'onglet
  const status  = tab === 'live' ? 'running' : tab === 'upcoming' ? 'upcoming' : 'past';
  const games   = allGamesFromFavs;
  const matches = tab === 'upcoming'
    ? await EsportAPI.getUpcoming({ games, count: 20 })
    : await EsportAPI.getMatches({ games, status, count: 20 });

  // Filtrer : équipes favorites OU jeux favoris entiers
  const favTeams   = favs.map(f => f.teamName.toLowerCase());
  const favMatches = matches.filter(m =>
    favGames.includes(m.game) || // jeu entier suivi
    favTeams.includes(m.team1.name.toLowerCase()) ||
    favTeams.includes(m.team2.name.toLowerCase())
  );

  if (favMatches.length === 0) {
    el.innerHTML = `<div class="fav-empty">
      <div class="fav-empty-icon">${tab === 'live' ? '🔴' : tab === 'upcoming' ? '🕐' : '📋'}</div>
      <div class="fav-empty-title">Aucun match ${tab === 'live' ? 'en direct' : tab === 'upcoming' ? 'à venir' : 'récent'}</div>
      <div class="fav-empty-sub">pour vos équipes favorites</div>
    </div>`;
    return;
  }

  // Grouper par jeu
  const byGame = {};
  for (const m of favMatches) {
    if (!byGame[m.game]) byGame[m.game] = { label: m.gameLabel, genre: m.genre, matches: [] };
    byGame[m.game].matches.push(m);
  }

  const colors = window.GENRE_COLORS || {};
  el.innerHTML = Object.entries(byGame).map(([game, { label, genre, matches }]) => {
    const accent = colors[genre]?.accent || '#a78bfa';
    return `<div class="fav-game-section">
      <div class="fav-game-title" style="color:${accent}">${label}</div>
      ${matches.map(m => renderFavMatchCard(m, accent, tab)).join('')}
    </div>`;
  }).join('');
}

function renderFavMatchCard(m, accent, tab) {
  // Stocker le match pour l'ouvrir depuis les favoris
  if (!window._favMatchStore) window._favMatchStore = new Map();
  window._favMatchStore.set(m.id, m);
  if (window.matchStore) window.matchStore.set('match_' + m.id, m);
  const isUpcoming = tab === 'upcoming';
  const isLive     = tab === 'live';
  const score      = !isUpcoming && m.score1 !== null
    ? `${m.score1} <span style="color:var(--text3)">:</span> ${m.score2}`
    : '<span style="color:var(--text3);font-size:13px">vs</span>';
  const w1 = !isUpcoming && m.winner === 1 ? 'font-weight:600;color:#e8eaf0' : 'color:#8892a4';
  const w2 = !isUpcoming && m.winner === 2 ? 'font-weight:600;color:#e8eaf0' : 'color:#8892a4';
  const timeStr = m.date ? new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const dateStr = m.date ? new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

  return `<div class="fav-match-card" style="border-left:3px solid ${accent}40" onclick="openMatchDetailFromFav('${m.id}')">
    <div class="fav-match-meta">${m.tournament} · ${m.format} ${isLive ? '<span class="live-pill"><span class="live-dot-small"></span> LIVE</span>' : ''}</div>
    <div class="fav-match-body">
      <span style="${w1}">${m.team1.name}</span>
      <span class="fav-match-score">${score}</span>
      <span style="${w2}">${m.team2.name}</span>
    </div>
    <div class="fav-match-time">${dateStr}${timeStr ? ' · ' + timeStr : ''}</div>
  </div>`;
}

function openMatchDetailFromFav(matchId) {
  // Chercher le match dans le store global
  const key = 'match_' + matchId;
  const m   = window.matchStore?.get(key) || window._favMatchStore?.get(matchId);
  if (!m) return;
  document.getElementById('favorites-modal')?.remove();
  window._lastOpenedMatch = m;
  if (window.showMatchDetail) showMatchDetail(m, true);
}

window.openMatchDetailFromFav = openMatchDetailFromFav;
window.showFavoritesPage = showFavoritesPage;
window.switchFavTab      = switchFavTab;

console.log('[favorites] chargé ✓');
