// ============================================================
//  home.js — Page d'accueil Omniscore
// ============================================================

// ----------------------------------------------------------
//  Afficher / masquer la page d'accueil
// ----------------------------------------------------------
function showHomePage() {
  // Masquer le layout principal
  document.querySelector('.layout').style.display = 'none';

  // Supprimer une ancienne page si elle existe
  const old = document.getElementById('home-page');
  if (old) old.remove();

  const page = document.createElement('div');
  page.id = 'home-page';
  page.innerHTML = buildHomeHTML();
  document.body.insertBefore(page, document.querySelector('.drawer-overlay'));

  // Remplir les sections dynamiques
  renderHomeLeaderboard();
  renderHomeLive();
  renderHomeUpcoming();
  renderHomeCompetitions();
  startSeasonCountdown();
}

function hideHomePage() {
  const page = document.getElementById('home-page');
  if (page) page.remove();
  document.querySelector('.layout').style.display = '';
}

// ----------------------------------------------------------
//  HTML statique de la page
// ----------------------------------------------------------
function buildHomeHTML() {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysLeft = Math.ceil((endOfMonth - now) / 86400000);

  return `
    <!-- HERO -->
    <div class="home-hero">
      <div class="home-hero-bg"></div>
      <div class="home-hero-content">
        <div class="home-hero-logo">⚡ OMNISCORE</div>
        <div class="home-hero-tagline">La plateforme de prédictions esport</div>
        <div class="home-hero-stats" id="home-global-stats">
          <div class="home-stat-pill">🎮 11 jeux suivis</div>
          <div class="home-stat-pill" id="home-stat-live">🔴 — matchs live</div>
          <div class="home-stat-pill" id="home-stat-upcoming">🕐 — matchs à venir</div>
        </div>
        <button class="home-cta-btn" onclick="hideHomePage()">Voir tous les matchs →</button>
      </div>
    </div>

    <!-- SAISON -->
    <div class="home-section home-season-bar">
      <div class="home-season-info">
        <span class="home-season-label">⏳ Saison en cours</span>
        <span class="home-season-name">Saison Mai ${now.getFullYear()}</span>
      </div>
      <div class="home-season-countdown" id="home-countdown">
        <div class="home-countdown-block"><span id="cd-days">--</span><small>jours</small></div>
        <div class="home-countdown-sep">:</div>
        <div class="home-countdown-block"><span id="cd-hours">--</span><small>heures</small></div>
        <div class="home-countdown-sep">:</div>
        <div class="home-countdown-block"><span id="cd-mins">--</span><small>min</small></div>
        <div class="home-countdown-sep">:</div>
        <div class="home-countdown-block"><span id="cd-secs">--</span><small>sec</small></div>
      </div>
    </div>

    <!-- GRILLE PRINCIPALE -->
    <div class="home-grid">

      <!-- LIVE -->
      <div class="home-section home-section-full">
        <div class="home-section-header">
          <span class="home-section-title"><span class="live-dot-small"></span> En direct</span>
          <button class="home-see-all" onclick="hideHomePage();setMainTab('live')">Tout voir →</button>
        </div>
        <div id="home-live-list" class="home-live-list">
          <div class="home-empty">Chargement…</div>
        </div>
      </div>

      <!-- MATCHS À VENIR -->
      <div class="home-section">
        <div class="home-section-header">
          <span class="home-section-title">🕐 Prochains matchs</span>
          <button class="home-see-all" onclick="hideHomePage();setMainTab('upcoming')">Tout voir →</button>
        </div>
        <div id="home-upcoming-list" class="home-upcoming-list">
          <div class="home-empty">Chargement…</div>
        </div>
      </div>

      <!-- CLASSEMENT TOP 5 -->
      <div class="home-section">
        <div class="home-section-header">
          <span class="home-section-title">🏆 Classement</span>
          <button class="home-see-all" onclick="hideHomePage();if(window.showLeaderboard)showLeaderboard()">Tout voir →</button>
        </div>
        <div id="home-leaderboard" class="home-leaderboard">
          <div class="home-empty">Chargement…</div>
        </div>
      </div>

      <!-- COMPÉTITIONS ACTIVES -->
      <div class="home-section home-section-full">
        <div class="home-section-header">
          <span class="home-section-title">🎯 Compétitions actives</span>
        </div>
        <div id="home-competitions" class="home-competitions">
          <div class="home-empty">Chargement…</div>
        </div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------------
//  Leaderboard top 5 (Firebase)
// ----------------------------------------------------------
async function renderHomeLeaderboard() {
  const el = document.getElementById('home-leaderboard');
  if (!el) return;

  try {
    const db = firebase.firestore();
    const snap = await db.collection('users')
      .orderBy('points', 'desc')
      .limit(5)
      .get();

    if (snap.empty) {
      el.innerHTML = '<div class="home-empty">Aucun joueur classé pour l\'instant.</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉', '4', '5'];
    const rows = [];
    let rank = 1;
    snap.forEach(doc => {
      const d = doc.data();
      const name = d.displayName || d.email?.split('@')[0] || 'Joueur';
      const pts  = d.points || 0;
      const rankInfo = window.getRankInfo ? getRankInfo(pts) : { label: '', icon: '' };
      const medal = medals[rank - 1];
      const isTop3 = rank <= 3;
      rows.push(`
        <div class="home-lb-row ${isTop3 ? 'top3' : ''}">
          <span class="home-lb-rank">${medal}</span>
          <span class="home-lb-name">${name}</span>
          <span class="home-lb-rank-badge">${rankInfo.icon || ''} ${rankInfo.label || ''}</span>
          <span class="home-lb-pts">${pts} <small>pts</small></span>
        </div>
      `);
      rank++;
    });

    el.innerHTML = rows.join('');
  } catch(e) {
    el.innerHTML = '<div class="home-empty">Impossible de charger le classement.</div>';
  }
}

// ----------------------------------------------------------
//  Matchs live
// ----------------------------------------------------------
function renderHomeLive() {
  const el = document.getElementById('home-live-list');
  const statEl = document.getElementById('home-stat-live');
  if (!el) return;

  const live = window._appState?.liveMatches || [];
  if (statEl) statEl.textContent = `🔴 ${live.length} match${live.length > 1 ? 's' : ''} live`;

  if (live.length === 0) {
    el.innerHTML = '<div class="home-empty">Aucun match en direct pour le moment.</div>';
    return;
  }

  el.innerHTML = live.slice(0, 6).map(m => {
    const colors  = GENRE_COLORS[m.genre] || { accent: '#a78bfa' };
    const storeKey = `match_${m.id}`;

    const logo1 = m.team1.logo
      ? `<img src="${m.team1.logo}" alt="${m.team1.name}" class="home-live-logo-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const abbr1 = `<div class="home-live-logo-abbr" style="background:${colors.bg||'#1a1e2c'};color:${colors.accent};${m.team1.logo?'display:none':''}">${m.team1.name.split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase()}</div>`;

    const logo2 = m.team2.logo
      ? `<img src="${m.team2.logo}" alt="${m.team2.name}" class="home-live-logo-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const abbr2 = `<div class="home-live-logo-abbr" style="background:${colors.bg||'#1a1e2c'};color:${colors.accent};${m.team2.logo?'display:none':''}">${m.team2.name.split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase()}</div>`;

    return `
      <div class="home-live-card" style="border-color:${colors.accent}40" onclick="hideHomePage();openMatchDetail('${storeKey}')">
        <div class="home-live-header">
          <div class="home-live-badge"><span class="live-dot-small"></span> LIVE</div>
          <div class="home-live-game" style="color:${colors.accent}">${m.gameLabel}</div>
        </div>
        <div class="home-live-matchup">
          <div class="home-live-team">
            <div class="home-live-logo-wrap">${logo1}${abbr1}</div>
            <span class="home-live-team-name">${m.team1.name}</span>
          </div>
          <div class="home-live-vs">
            <span class="home-live-score">${m.score1 ?? '0'}</span>
            <span class="home-live-sep">:</span>
            <span class="home-live-score">${m.score2 ?? '0'}</span>
          </div>
          <div class="home-live-team">
            <div class="home-live-logo-wrap">${logo2}${abbr2}</div>
            <span class="home-live-team-name">${m.team2.name}</span>
          </div>
        </div>
        <div class="home-live-tourney">${m.tournament}</div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------------
//  Matchs à venir
// ----------------------------------------------------------
function renderHomeUpcoming() {
  const el = document.getElementById('home-upcoming-list');
  const statEl = document.getElementById('home-stat-upcoming');
  if (!el) return;

  const upcoming = window._appState?.upcoming || [];
  if (statEl) statEl.textContent = `🕐 ${upcoming.length} à venir`;

  if (upcoming.length === 0) {
    el.innerHTML = '<div class="home-empty">Aucun match à venir.</div>';
    return;
  }

  el.innerHTML = upcoming.slice(0, 6).map(m => {
    const colors  = GENRE_COLORS[m.genre] || { accent: '#a78bfa' };
    const storeKey = `match_${m.id}`;
    const date = new Date(m.date);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `
      <div class="home-upcoming-card" onclick="hideHomePage();openMatchDetail('${storeKey}')">
        <div class="home-upcoming-left">
          <span class="home-upcoming-game" style="color:${colors.accent}">${m.gameLabel}</span>
          <span class="home-upcoming-teams">${m.team1.name} <span style="color:var(--text3)">vs</span> ${m.team2.name}</span>
          <span class="home-upcoming-tourney">${m.tournament}</span>
        </div>
        <div class="home-upcoming-right">
          <span class="home-upcoming-date">${dateStr}</span>
          <span class="home-upcoming-time">${timeStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------------
//  Compétitions actives
// ----------------------------------------------------------
function renderHomeCompetitions() {
  const el = document.getElementById('home-competitions');
  if (!el) return;

  const all = [
    ...(window._appState?.liveMatches || []),
    ...(window._appState?.upcoming || []),
    ...(window._appState?.allMatches || []),
  ];

  // Regrouper par tournoi + jeu
  const map = new Map(); // key = "game::tournament"
  all.forEach(m => {
    const key = `${m.game}::${m.tournament}`;
    if (!map.has(key)) {
      map.set(key, { game: m.game, gameLabel: m.gameLabel, tournament: m.tournament, genre: m.genre, count: 0 });
    }
    map.get(key).count++;
  });

  if (map.size === 0) {
    el.innerHTML = '<div class="home-empty">Aucune compétition détectée.</div>';
    return;
  }

  // Trier par nombre de matchs décroissant, max 12
  const sorted = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 12);

  el.innerHTML = sorted.map(c => {
    const colors = GENRE_COLORS[c.genre] || { accent: '#a78bfa' };
    return `
      <div class="home-comp-chip" style="border-color:${colors.accent}40" onclick="hideHomePage();selectGame('${c.game}')">
        <span class="home-comp-dot" style="background:${colors.accent}"></span>
        <div class="home-comp-info">
          <span class="home-comp-name">${c.tournament}</span>
          <span class="home-comp-game" style="color:${colors.accent}">${c.gameLabel}</span>
        </div>
        <span class="home-comp-count">${c.count}</span>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------------
//  Compte à rebours saison
// ----------------------------------------------------------
let _countdownInterval = null;

function startSeasonCountdown() {
  if (_countdownInterval) clearInterval(_countdownInterval);

  function update() {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const diff = end - now;
    if (diff <= 0) return;

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    const d = document.getElementById('cd-days');
    const h = document.getElementById('cd-hours');
    const m = document.getElementById('cd-mins');
    const s = document.getElementById('cd-secs');
    if (!d) { clearInterval(_countdownInterval); return; }

    d.textContent = String(days).padStart(2, '0');
    h.textContent = String(hours).padStart(2, '0');
    m.textContent = String(mins).padStart(2, '0');
    s.textContent = String(secs).padStart(2, '0');
  }

  update();
  _countdownInterval = setInterval(update, 1000);
}

// ----------------------------------------------------------
//  Rendre la navbar logo cliquable
// ----------------------------------------------------------
function initHomeNavigation() {
  const logo = document.querySelector('.navbar-logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      const homePage = document.getElementById('home-page');
      if (homePage) {
        hideHomePage();
      } else {
        showHomePage();
      }
    });
  }
}

window.showHomePage  = showHomePage;
window.hideHomePage  = hideHomePage;
window.initHomeNavigation = initHomeNavigation;
