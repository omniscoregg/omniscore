// ============================================================
//  app.js — v4 : onglets Résultats / Prochains matchs par jeu
// ============================================================

const GENRE_COLORS = {
  moba:    { bg: '#1a1f3a', accent: '#7c88ff' },
  fps:     { bg: '#1a2a1a', accent: '#4ade80' },
  fighting:{ bg: '#3a1a1a', accent: '#f87171' },
  br:      { bg: '#2a1a0a', accent: '#fbbf24' },
  sport:   { bg: '#1a2a3a', accent: '#38bdf8' },
  card:    { bg: '#2a1a3a', accent: '#c084fc' },
};

const state = {
  selectedGame:        null,
  selectedGenre:       'all',
  activeTab:           'results', // 'results' | 'upcoming'
  allMatches:          [],
  upcoming:            [],
  selectedTournaments: {}, // { [game]: Set<tournamentName> } — null = tout afficher
};

// Store des matchs par index pour éviter les problèmes de sérialisation JSON
const matchStore = new Map();

// ----------------------------------------------------------
//  Initialisation
// ----------------------------------------------------------
async function init() {
  i18n.renderLangSwitcher();
  renderGameFilters();
  loadPreferences();
  loadTournamentPrefs();
  showSkeleton();
  await loadAllData();
  renderMainTabs();
  renderTournamentFilter();
  renderMatches();
  renderUpcoming();
  i18n.applyTranslations();
  setTimeout(() => { if (window.initPredictions) initPredictions(); if (window.loadGameFavButtons) loadGameFavButtons(); }, 600);
}

async function loadAllData() {
  const allKeys = Object.keys(EsportAPI.GAME_CONFIG);
  const [matches, upcoming, live] = await Promise.all([
    EsportAPI.getMatches({ games: allKeys, status: 'past', count: 15 }),
    EsportAPI.getUpcoming({ games: allKeys, count: 20 }),
    EsportAPI.getMatches({ games: allKeys, status: 'running', count: 20 }),
  ]);
  state.allMatches  = matches;
  state.upcoming    = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  state.liveMatches = live;

  // Stocker tous les matchs dans matchStore pour les fiches d'équipes
  const allForStore = [...matches, ...upcoming, ...live];
  allForStore.forEach(m => {
    matchStore.set('match_' + m.id, m);
  });
  renderMainTabs();
  renderLiveIndicator();
}


// ----------------------------------------------------------
//  Onglets principaux : Résultats / En direct / À venir
// ----------------------------------------------------------
function renderMainTabs() {
  const existing = document.getElementById('main-tabs');
  if (existing) existing.remove();

  const tabs = document.createElement('div');
  tabs.id        = 'main-tabs';
  tabs.className = 'main-tabs';
  tabs.innerHTML = `
    <button class="main-tab ${state.activeMainTab === 'results' ? 'active' : ''}" onclick="setMainTab('results')">
      📋 Résultats
    </button>
    <button class="main-tab live-tab ${state.activeMainTab === 'live' ? 'active' : ''}" onclick="setMainTab('live')">
      <span class="live-dot-small"></span> En direct
      ${(state.liveMatches && state.liveMatches.length > 0) ? '<span class="live-count">' + state.liveMatches.length + '</span>' : ''}
    </button>
    <button class="main-tab ${state.activeMainTab === 'upcoming' ? 'active' : ''}" onclick="setMainTab('upcoming')">
      🕐 À venir
    </button>
  `;

  const main = document.querySelector('.main-content');
  if (main) main.insertBefore(tabs, main.firstChild);
}

function setMainTab(tab) {
  state.activeMainTab = tab;
  state.activeTab     = tab === 'upcoming' ? 'upcoming' : 'results';
  savePreferences();
  renderMainTabs();
  renderTournamentFilter();
  renderMatches();
}

// ----------------------------------------------------------
//  Live Indicator
// ----------------------------------------------------------
function renderLiveIndicator() {
  // Bandeau supprimé — l'onglet "En direct" remplace cette fonctionnalité
  const existing = document.getElementById('live-indicator');
  if (existing) existing.remove();
}

// ----------------------------------------------------------
//  Onglets (visibles seulement quand un jeu est sélectionné)
// ----------------------------------------------------------
function renderTabs() {
  const container = document.getElementById('game-tabs');
  if (!container) return;

  if (!state.selectedGame) {
    container.style.display = 'none';
    document.getElementById('results-label').style.display = 'block';
    return;
  }

  const cfg    = EsportAPI.GAME_CONFIG[state.selectedGame];
  const colors = GENRE_COLORS[cfg?.genre] || { accent: '#a78bfa' };

  container.style.display = 'flex';
  document.getElementById('results-label').style.display = 'none';

  container.innerHTML = `
    <div class="game-tab-header">
      <span class="game-tab-title" style="color:${colors.accent}">${cfg?.label || ''}</span>
      <div class="game-tab-btns">
        <button
          class="tab-btn ${state.activeTab === 'results' ? 'active' : ''}"
          style="${state.activeTab === 'results' ? `border-color:${colors.accent};color:${colors.accent}` : ''}"
          onclick="switchTab('results')"
        >${i18n.t('recentResults')}</button>
        <button
          class="tab-btn ${state.activeTab === 'upcoming' ? 'active' : ''}"
          style="${state.activeTab === 'upcoming' ? `border-color:${colors.accent};color:${colors.accent}` : ''}"
          onclick="switchTab('upcoming')"
        >${i18n.t('upcoming')}</button>
      </div>
    </div>
  `;
}

function switchTab(tab) {
  state.activeTab = tab;
  renderMatches();
}

// ----------------------------------------------------------
//  Filtres genre
// ----------------------------------------------------------
function renderGenreFilters() {
  const genres = ['all', ...new Set(Object.values(EsportAPI.GAME_CONFIG).map(g => g.genre))];
  document.getElementById('genre-filters').innerHTML = genres.map(g => `
    <button class="genre-btn ${g === 'all' ? 'active' : ''}" data-genre="${g}" onclick="setGenre('${g}')">
      ${i18n.t(g === 'all' ? 'all' : g)}
    </button>
  `).join('');
}

function setGenre(genre) {
  state.selectedGenre = genre;
  state.selectedGame  = null;
  state.activeTab     = 'results';
  document.querySelectorAll('.genre-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.genre === genre)
  );
  updateGameHighlight(null);
  renderMatches();
}

// ----------------------------------------------------------
//  Filtres jeu individuel
// ----------------------------------------------------------
function renderGameFilters() {
  const byGenre = {};
  for (const [key, cfg] of Object.entries(EsportAPI.GAME_CONFIG)) {
    if (!byGenre[cfg.genre]) byGenre[cfg.genre] = [];
    byGenre[cfg.genre].push({ key, cfg });
  }
  document.getElementById('game-filters').innerHTML = Object.entries(byGenre).map(([genre, games]) => `
    <div class="sidebar-group">
      <div class="sidebar-genre-label">${i18n.t(genre)}</div>
      ${games.map(({ key, cfg }) => `
        <div class="game-toggle-row">
          <div class="game-toggle" id="gt-${key}" onclick="selectGame('${key}')">
            <span class="toggle-dot" style="background:${(GENRE_COLORS[cfg.genre] || {}).accent || '#888'}"></span>
            <span class="game-toggle-label">${cfg.label}</span>
          </div>
          <button class="game-fav-btn" id="gfav-${key}" onclick="toggleGameFav('${key}')" title="Suivre ce jeu">☆</button>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function selectGame(key) {
  if (state.selectedGame === key) {
    state.selectedGame  = null;
    state.selectedGenre = 'all';
    state.activeTab     = 'results';
    document.querySelectorAll('.genre-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.genre === 'all')
    );
  } else {
    state.selectedGame  = key;
    state.selectedGenre = 'all';
    state.activeTab     = 'results';
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  }
  updateGameHighlight(state.selectedGame);
  savePreferences();
  renderTournamentFilter();
  renderMatches();
  // Fermer le drawer mobile et débloquer le scroll
  const drawer  = document.getElementById('games-drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (drawer)  drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function updateGameHighlight(activeKey) {
  document.querySelectorAll('.game-toggle').forEach(el => {
    if (activeKey === null) {
      el.classList.remove('active', 'dimmed');
    } else {
      const isActive = el.id === `gt-${activeKey}`;
      el.classList.toggle('active', isActive);
      el.classList.toggle('dimmed', !isActive);
    }
  });
}

// ----------------------------------------------------------
//  Rendu des matchs (tient compte de l'onglet actif)
// ----------------------------------------------------------
async function renderMatches() {
  const el = document.getElementById('matches-list');

  // Déterminer la source selon l'onglet principal
  let source;
  if (state.activeMainTab === 'live') {
    source = state.liveMatches || [];
  } else if (state.activeMainTab === 'upcoming') {
    source = state.upcoming || [];
  } else {
    source = state.allMatches || [];
  }

  // Filtrer par jeu ou genre
  if (state.selectedGame) {
    source = source.filter(m => m.game === state.selectedGame);
    // Filtre compétitions
    const activeTourneys = state.selectedTournaments[state.selectedGame];
    if (activeTourneys && activeTourneys.size > 0) {
      source = source.filter(m => activeTourneys.has(m.tournament));
    }
  } else if (state.selectedGenre !== 'all') {
    source = source.filter(m => m.genre === state.selectedGenre);
  }

  if (source.length === 0) {
    let msg;
    if (state.activeMainTab === 'live') {
      msg = '🔴 Aucun match en direct pour le moment.';
    } else if (state.activeMainTab === 'upcoming') {
      msg = i18n.t('noUpcoming');
    } else {
      msg = i18n.t('noMatch');
    }
    el.innerHTML = '<div class="empty-state">' + msg + '</div>';
    return;
  }

  try {
    const isUpcomingTab = state.activeMainTab === 'upcoming';
  const isLiveTab     = state.activeMainTab === 'live';
  const cards = await Promise.all(source.map(m => renderMatchCard(m, isUpcomingTab, isLiveTab)));
    el.innerHTML = cards.join('');
  } catch(err) {
    console.error('renderMatches error DETAIL:', err.message, err.stack);
    // Fallback sans prédictions
    el.innerHTML = source.map(m => renderMatchCardSimple(m, state.activeTab === 'upcoming')).join('');
  }
}

async function renderMatchCard(m, isUpcoming = false, isLive = false) {
  const colors  = GENRE_COLORS[m.genre] || { bg: '#1a1e2c', accent: '#8892a4' };
  const isDemo  = m.source === 'demo';
  const score   = !isUpcoming && m.score1 !== null
    ? `${m.score1} <span class="score-sep">:</span> ${m.score2}`
    : '<span style="font-size:14px;color:var(--text3)">vs</span>';
  const w1class = !isUpcoming && m.winner === 1 ? 'winner' : '';
  const w2class = !isUpcoming && m.winner === 2 ? 'winner' : '';
  const logo1   = m.team1.logo
    ? `<img src="${m.team1.logo}" alt="" class="team-logo-img" onerror="this.style.display='none'">`
    : `<div class="team-logo-abbr" style="background:${colors.bg};color:${colors.accent}">${abbr(m.team1.name)}</div>`;
  const logo2   = m.team2.logo
    ? `<img src="${m.team2.logo}" alt="" class="team-logo-img" onerror="this.style.display='none'">`
    : `<div class="team-logo-abbr" style="background:${colors.bg};color:${colors.accent}">${abbr(m.team2.name)}</div>`;
  const timeInfo = formatMatchTime(m, isUpcoming);

  // Bouton de prédiction (async) — attend que predictions.js soit prêt
  let predBtn = '';
  try {
    if (isUpcoming && window.renderPredictionBtn) {
      predBtn = await window.renderPredictionBtn(m.id, m.game, m.team1.name, m.team2.name, m.status);
    }
  } catch(e) { predBtn = ''; }

  const storeKey = `match_${m.id}`;
  matchStore.set(storeKey, m);
  // One-tap prediction : boutons directement sur les équipes
  let tapBtn1 = '', tapBtn2 = '';
  if (isUpcoming && !isDemo) {
    if (!window.FirebaseService?.getCurrentUser()) {
      tapBtn1 = '<button class="onetap-btn" onclick="event.stopPropagation();showAuthModal(&#39;login&#39;)" title="Connectez-vous">🎯</button>';
      tapBtn2 = '<button class="onetap-btn" onclick="event.stopPropagation();showAuthModal(&#39;login&#39;)" title="Connectez-vous">🎯</button>';
    } else if (predBtn.includes('pred-buttons')) {
      const id = String(m.id);
      const gm = String(m.game);
      const t1 = String(m.team1.name);
      const t2 = String(m.team2.name);
      const fmt = m.format || 'Bo3';
      tapBtn1 = '<button class="onetap-btn predict" data-id="' + id + '" data-game="' + gm + '" data-t1="' + t1 + '" data-t2="' + t2 + '" data-winner="' + t1 + '" data-format="' + fmt + '" onclick="event.stopPropagation();handleOnetap(this)" title="Prédire ' + t1 + '">👈</button>';
      tapBtn2 = '<button class="onetap-btn predict" data-id="' + id + '" data-game="' + gm + '" data-t1="' + t1 + '" data-t2="' + t2 + '" data-winner="' + t2 + '" data-format="' + fmt + '" onclick="event.stopPropagation();handleOnetap(this)" title="Prédire ' + t2 + '">👉</button>';
    } else if (predBtn.includes('pred-existing') || predBtn.includes('Prédit')) {
      tapBtn1 = '<span class="onetap-done">✓</span>';
      tapBtn2 = '<span class="onetap-done">✓</span>';
    }
  }

  return `
    <div class="match-card ${isUpcoming ? 'upcoming-match' : ''}" style="border-left:3px solid ${colors.accent}30;cursor:pointer" onclick="openMatchDetail('${storeKey}')" data-key="${storeKey}">
      <div class="match-top">
        <span class="match-game" style="color:${colors.accent}">${m.gameLabel}</span>
        <span class="match-meta">${m.tournament} · ${m.format}</span>
        <span class="match-date">${formatDate(m.date)}</span>
        ${isDemo ? `<span class="demo-badge">${i18n.t('demo')}</span>` : ''}
        ${isUpcoming ? `<span class="upcoming-pill">${i18n.t('upcoming')}</span>` : ''}
        ${isLive ? '<span class="live-pill"><span class="live-dot-small"></span> LIVE</span>' : ''}
      </div>
      <div class="match-body">
        <div class="team-block ${w1class}">
          ${tapBtn1}
          ${logo1}
          <span class="team-name">${m.team1.name}</span>
        </div>
        <div class="match-score">${score}</div>
        <div class="team-block right ${w2class}">
          <span class="team-name">${m.team2.name}</span>
          ${logo2}
          ${tapBtn2}
        </div>
      </div>
      ${timeInfo ? `<div class="match-time">${timeInfo}</div>` : ''}
    </div>
  `;
}

// ----------------------------------------------------------
//  Sidebar droite — matchs à venir
// ----------------------------------------------------------
function renderUpcoming() {
  const el = document.getElementById('upcoming-list');
  if (!el) return;
  const list = state.upcoming.slice(0, 8);
  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state small">${i18n.t('noUpcoming')}</div>`;
    return;
  }
  el.innerHTML = list.map(m => {
    const colors  = GENRE_COLORS[m.genre] || { accent: '#8892a4' };
    const timeStr = m.date ? formatTime(m.date) : '—';
    return `
      <div class="upcoming-card" onclick="selectGame('${m.game}')" style="cursor:pointer">
        <div class="upcoming-game" style="color:${colors.accent}">${m.gameLabel}</div>
        <div class="upcoming-teams">${m.team1.name} <span>vs</span> ${m.team2.name}</div>
        <div class="upcoming-date">${formatDate(m.date)} · <span class="upcoming-time">${timeStr}</span></div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------------
//  Skeleton loader
// ----------------------------------------------------------
function showSkeleton() {
  document.getElementById('matches-list').innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="match-card skeleton">
      <div class="skel-line short"></div>
      <div class="skel-teams">
        <div class="skel-circle"></div>
        <div class="skel-line medium"></div>
        <div class="skel-score"></div>
        <div class="skel-line medium"></div>
        <div class="skel-circle"></div>
      </div>
    </div>
  `).join('');
}

// ----------------------------------------------------------
//  Utilitaires — dates & heures
// ----------------------------------------------------------
function abbr(name) {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const diff = new Date(endIso) - new Date(startIso);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
}

function formatMatchTime(m, isUpcoming = false) {
  if (!m.date) return null;
  const start = formatTime(m.date);
  const end   = m.end_at ? formatTime(m.end_at) : null;
  const dur   = formatDuration(m.date, m.end_at);
  if (isUpcoming || m.status === 'upcoming') {
    return `<span class="time-icon">🕐</span> ${i18n.t('start')} : <strong>${start}</strong>`;
  }
  if (end && dur) {
    return `<span class="time-icon">🕐</span> ${start} → ${end} <span class="time-dur">(${dur})</span>`;
  }
  return `<span class="time-icon">🕐</span> ${start}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d    = new Date(iso);
  const diff = Math.round((new Date() - d) / 86400000);
  if (diff === 0)  return i18n.t('today');
  if (diff === 1)  return i18n.t('yesterday');
  if (diff === -1) return i18n.t('tomorrow');
  if (diff > 0 && diff < 7)  return i18n.t('daysAgo', diff);
  if (diff < 0 && diff > -7) return i18n.t('inDays', -diff);
  const locale = i18n.currentLang() === 'en' ? 'en-GB' : i18n.currentLang() === 'es' ? 'es-ES' : 'fr-FR';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}



// Version simple sans prédictions (fallback)
function renderMatchCardSimple(m, isUpcoming = false, isLive = false) {
  const colors  = GENRE_COLORS[m.genre] || { bg: '#1a1e2c', accent: '#8892a4' };
  const isDemo  = m.source === 'demo';
  const score   = !isUpcoming && m.score1 !== null
    ? `${m.score1} <span class="score-sep">:</span> ${m.score2}`
    : '<span style="font-size:14px;color:var(--text3)">vs</span>';
  const w1class = !isUpcoming && m.winner === 1 ? 'winner' : '';
  const w2class = !isUpcoming && m.winner === 2 ? 'winner' : '';
  const logo1   = m.team1.logo
    ? `<img src="${m.team1.logo}" alt="" class="team-logo-img" onerror="this.style.display='none'">`
    : `<div class="team-logo-abbr" style="background:${colors.bg};color:${colors.accent}">${abbr(m.team1.name)}</div>`;
  const logo2   = m.team2.logo
    ? `<img src="${m.team2.logo}" alt="" class="team-logo-img" onerror="this.style.display='none'">`
    : `<div class="team-logo-abbr" style="background:${colors.bg};color:${colors.accent}">${abbr(m.team2.name)}</div>`;
  const timeInfo = formatMatchTime(m, isUpcoming);
  const storeKey = `match_${m.id}`;
  matchStore.set(storeKey, m);
  return `
    <div class="match-card ${isUpcoming ? 'upcoming-match' : ''}" style="border-left:3px solid ${colors.accent}30;cursor:pointer" onclick="openMatchDetail('${storeKey}')" data-key="${storeKey}">
      <div class="match-top">
        <span class="match-game" style="color:${colors.accent}">${m.gameLabel}</span>
        <span class="match-meta">${m.tournament} · ${m.format}</span>
        <span class="match-date">${formatDate(m.date)}</span>
        ${isDemo ? `<span class="demo-badge">${i18n.t('demo')}</span>` : ''}
        ${isUpcoming ? `<span class="upcoming-pill">${i18n.t('upcoming')}</span>` : ''}
        ${isLive ? '<span class="live-pill"><span class="live-dot-small"></span> LIVE</span>' : ''}
      </div>
      <div class="match-body">
        <div class="team-block ${w1class}">${logo1}<span class="team-name">${m.team1.name}</span></div>
        <div class="match-score">${score}</div>
        <div class="team-block right ${w2class}"><span class="team-name">${m.team2.name}</span>${logo2}</div>
      </div>
      ${timeInfo ? `<div class="match-time">${timeInfo}</div>` : ''}
    </div>
  `;
}


function handleOnetap(btn) {
  const id     = btn.dataset.id;
  const game   = btn.dataset.game;
  const t1     = btn.dataset.t1;
  const t2     = btn.dataset.t2;
  const winner = btn.dataset.winner;
  const format = btn.dataset.format || 'Bo3';

  // Calculer le score max selon le format
  const maxScore = format === 'Bo5' ? 3 : format === 'Bo1' ? 1 : 2;
  btn.dataset.maxscore = maxScore;

  if (window.selectPredTeam) selectPredTeam(btn, id, game, t1, t2, winner, maxScore);
}

function openMatchDetail(key) {
  try {
    const m = matchStore.get(key);
    if (!m) return;
    window._lastOpenedMatch = m;
    if (window.showMatchDetail) showMatchDetail(m);
    else selectGame(m.game);
  } catch(e) { console.error(e); }
}


// ----------------------------------------------------------
//  Filtre par compétition
// ----------------------------------------------------------

// Flag pour savoir si le dropdown est ouvert (évite de recréer le DOM en permanence)
let _tourneyDropdownOpen = false;

function getTournamentsForCurrentGame() {
  if (!state.selectedGame) return [];
  let source = [];
  if (state.activeMainTab === 'live') source = state.liveMatches || [];
  else if (state.activeMainTab === 'upcoming') source = state.upcoming || [];
  else source = state.allMatches || [];
  const all = source.filter(m => m.game === state.selectedGame).map(m => m.tournament).filter(Boolean);
  return [...new Set(all)].sort();
}

function renderTournamentFilter() {
  const old = document.getElementById('tournament-filter-bar');
  if (old) old.remove();
  _tourneyDropdownOpen = false;

  if (!state.selectedGame) return;

  const tournaments = getTournamentsForCurrentGame();
  if (tournaments.length <= 1) return;

  const game = state.selectedGame;
  const activeTourneys = state.selectedTournaments[game];
  const allSelected = !activeTourneys || activeTourneys.size === 0;

  const bar = document.createElement('div');
  bar.id = 'tournament-filter-bar';
  bar.className = 'tournament-filter-bar';

  bar.innerHTML = `
    <button class="tourney-filter-btn" id="tourney-filter-toggle">
      🏆 Compétitions
      ${!allSelected ? `<span class="tourney-active-count">${activeTourneys.size}</span>` : ''}
      <span class="tourney-chevron" id="tourney-chevron">▾</span>
    </button>
    <div class="tourney-dropdown" id="tourney-dropdown" style="display:none">
      <div class="tourney-dropdown-inner" id="tourney-dropdown-inner"></div>
    </div>
  `;

  const mainTabs = document.getElementById('main-tabs');
  if (mainTabs) mainTabs.after(bar);
  else {
    const main = document.querySelector('.main-content');
    if (main) main.insertBefore(bar, main.firstChild);
  }

  // Remplir les options
  _renderTourneyOptions(game, tournaments);

  // Bouton toggle — stopPropagation pour ne pas déclencher le listener document
  document.getElementById('tourney-filter-toggle').addEventListener('click', function(e) {
    e.stopPropagation();
    toggleTournamentDropdown();
  });

  // Fermer en cliquant en dehors
  document.addEventListener('click', _closeTourneyOnOutsideClick);
}

function _renderTourneyOptions(game, tournaments) {
  const inner = document.getElementById('tourney-dropdown-inner');
  if (!inner) return;
  const activeTourneys = state.selectedTournaments[game];
  const allSelected = !activeTourneys || activeTourneys.size === 0;

  inner.innerHTML = `
    <label class="tourney-option ${allSelected ? 'checked' : ''}">
      <span class="tourney-checkbox">${allSelected ? '✓' : ''}</span>
      <span>Toutes les compétitions</span>
    </label>
    <div class="tourney-divider"></div>
    ${tournaments.map(t => {
      const checked = !allSelected && activeTourneys.has(t);
      return `
        <label class="tourney-option ${checked ? 'checked' : ''}" data-tourney="${t.replace(/"/g, '&quot;')}">
          <span class="tourney-checkbox">${checked ? '✓' : ''}</span>
          <span>${t}</span>
        </label>
      `;
    }).join('')}
  `;

  // Listener "Toutes les compétitions"
  inner.querySelector('.tourney-option:not([data-tourney])').addEventListener('click', function(e) {
    e.stopPropagation();
    setAllTournaments(game);
  });

  // Listeners sur chaque compétition via data-tourney
  inner.querySelectorAll('.tourney-option[data-tourney]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleTournament(game, el.dataset.tourney);
    });
  });
}

function _closeTourneyOnOutsideClick(e) {
  const bar = document.getElementById('tournament-filter-bar');
  if (!bar || !bar.contains(e.target)) {
    const dd = document.getElementById('tourney-dropdown');
    const chevron = document.getElementById('tourney-chevron');
    if (dd) dd.style.display = 'none';
    if (chevron) chevron.textContent = '▾';
    _tourneyDropdownOpen = false;
    document.removeEventListener('click', _closeTourneyOnOutsideClick);
  }
}

function toggleTournamentDropdown() {
  const dd = document.getElementById('tourney-dropdown');
  const chevron = document.getElementById('tourney-chevron');
  if (!dd) return;
  _tourneyDropdownOpen = !_tourneyDropdownOpen;
  dd.style.display = _tourneyDropdownOpen ? 'block' : 'none';
  if (chevron) chevron.textContent = _tourneyDropdownOpen ? '▴' : '▾';
}

function setAllTournaments(game) {
  delete state.selectedTournaments[game];
  saveTournamentPrefs();
  // Mettre à jour les options sans fermer le dropdown
  _refreshTourneyOptions(game);
  renderMatches();
}

function toggleTournament(game, tournament) {
  if (!state.selectedTournaments[game]) {
    // Première sélection : on coche uniquement celle-là
    state.selectedTournaments[game] = new Set([tournament]);
  } else {
    const set = state.selectedTournaments[game];
    if (set.has(tournament)) {
      set.delete(tournament);
      if (set.size === 0) delete state.selectedTournaments[game];
    } else {
      set.add(tournament);
    }
  }
  saveTournamentPrefs();
  // Mettre à jour les options sans fermer le dropdown
  _refreshTourneyOptions(game);
  renderMatches();
}

function _refreshTourneyOptions(game) {
  // Met à jour le badge sur le bouton + les checkboxes sans recréer tout le DOM
  const activeTourneys = state.selectedTournaments[game];
  const allSelected = !activeTourneys || activeTourneys.size === 0;

  // Badge
  const btn = document.getElementById('tourney-filter-toggle');
  if (btn) {
    let badge = btn.querySelector('.tourney-active-count');
    if (!allSelected) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tourney-active-count';
        btn.insertBefore(badge, btn.querySelector('.tourney-chevron'));
      }
      badge.textContent = activeTourneys.size;
    } else if (badge) {
      badge.remove();
    }
  }

  // Rechargement des options (dropdown reste ouvert)
  const tournaments = getTournamentsForCurrentGame();
  _renderTourneyOptions(game, tournaments);
}

function saveTournamentPrefs() {
  try {
    const serialized = {};
    for (const [game, set] of Object.entries(state.selectedTournaments)) {
      if (set instanceof Set) serialized[game] = [...set];
    }
    localStorage.setItem('omniscore_tourney_prefs', JSON.stringify(serialized));
  } catch(e) {}
}

function loadTournamentPrefs() {
  try {
    const saved = localStorage.getItem('omniscore_tourney_prefs');
    if (!saved) return;
    const parsed = JSON.parse(saved);
    for (const [game, arr] of Object.entries(parsed)) {
      if (Array.isArray(arr) && arr.length > 0) {
        state.selectedTournaments[game] = new Set(arr);
      }
    }
  } catch(e) {}
}

window.toggleTournamentDropdown = toggleTournamentDropdown;
window.setAllTournaments = setAllTournaments;
window.toggleTournament = toggleTournament;

// ----------------------------------------------------------
//  Préférences utilisateur (localStorage)
// ----------------------------------------------------------
function savePreferences() {
  try {
    const prefs = {
      selectedGame:  state.selectedGame,
      activeMainTab: state.activeMainTab,
    };
    localStorage.setItem('omniscore_prefs', JSON.stringify(prefs));
  } catch(e) {}
}

function loadPreferences() {
  try {
    const saved = localStorage.getItem('omniscore_prefs');
    if (!saved) return;
    const prefs = JSON.parse(saved);

    // Restaurer l'onglet principal
    if (prefs.activeMainTab) {
      state.activeMainTab = prefs.activeMainTab;
      state.activeTab     = prefs.activeMainTab === 'upcoming' ? 'upcoming' : 'results';
    }

    // Restaurer le jeu sélectionné
    if (prefs.selectedGame && EsportAPI.GAME_CONFIG[prefs.selectedGame]) {
      state.selectedGame = prefs.selectedGame;
    }
  } catch(e) {}
}

async function toggleGameFav(game) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { if (window.showAuthModal) showAuthModal('login'); return; }

  const btn    = document.getElementById('gfav-' + game);
  const isFav  = btn?.textContent === '⭐';

  if (isFav) {
    await window.FirebaseService.removeFavoriteGame(user.uid, game);
    if (btn) btn.textContent = '☆';
    if (btn) btn.title = 'Suivre ce jeu';
  } else {
    await window.FirebaseService.addFavoriteGame(user.uid, game);
    if (btn) btn.textContent = '⭐';
    if (btn) btn.title = 'Ne plus suivre';
  }
}

async function loadGameFavButtons() {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;
  const favGames = await window.FirebaseService.getFavoriteGames(user.uid);
  favGames.forEach(game => {
    const btn = document.getElementById('gfav-' + game);
    if (btn) { btn.textContent = '⭐'; btn.title = 'Ne plus suivre'; }
  });
}

window.toggleGameFav = toggleGameFav;
window.setMainTab  = setMainTab;

function mobileNav(tab, btn) {
  // Mettre à jour les boutons bottom nav
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Changer l'onglet
  setMainTab(tab);
  // Scroll vers le haut
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.mobileNav = mobileNav;

function toggleGameDrawer() {
  const drawer  = document.getElementById('games-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const isOpen  = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  } else {
    renderDrawerGames();
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
} 
function closeGameDrawer() {
  document.getElementById('games-drawer')?.classList.remove('open');
  document.getElementById('drawer-overlay')?.classList.remove('open');
}

function renderDrawerGames() {
  const el = document.getElementById('drawer-game-list');
  if (!el) return;

  const byGenre = {};
  for (const [key, cfg] of Object.entries(EsportAPI.GAME_CONFIG)) {
    if (!byGenre[cfg.genre]) byGenre[cfg.genre] = [];
    byGenre[cfg.genre].push({ key, cfg });
  }

  const genreLabels = { moba: 'MOBA', fps: 'FPS / Tir', fighting: 'Combat', br: 'Battle Royale', sport: 'Sport', card: 'Carte' };

  el.innerHTML = '<div class="drawer-game-item" onclick="selectGame(null);closeGameDrawer()" style="margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:12px">'
    + '<span style="font-size:16px">🌐</span>'
    + '<span class="drawer-game-label" style="font-weight:600">Tous les jeux</span>'
    + '</div>'
    + Object.entries(byGenre).map(([genre, games]) => 
        '<div class="drawer-genre-label">' + (genreLabels[genre] || genre) + '</div>'
        + games.map(({ key, cfg }) => {
          const accent = GENRE_COLORS[cfg.genre]?.accent || '#888';
          const isActive = state.selectedGame === key;
          return '<div class="drawer-game-item ' + (isActive ? 'active' : '') + '" onclick="selectGame(&quot;' + key + '&quot;);closeGameDrawer()">'
            + '<span class="drawer-game-dot" style="background:' + accent + '"></span>'
            + '<span class="drawer-game-label">' + cfg.label + '</span>'
            + (state.liveMatches?.some(m => m.game === key) ? '<span style="color:#f87171;font-size:10px">LIVE</span>' : '')
            + '</div>';
        }).join('')
      ).join('');
}

window.toggleGameDrawer = toggleGameDrawer;

function mobileGoHome(btn) {
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Revenir à la vue globale
  selectGame(null);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.mobileGoHome = mobileGoHome;
window.closeGameDrawer  = closeGameDrawer;
window.matchStore  = matchStore;
window._appState  = state;

document.addEventListener('DOMContentLoaded', init);
