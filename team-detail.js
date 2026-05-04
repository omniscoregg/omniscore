// ============================================================
//  team-detail.js — Fiche d'équipe
// ============================================================

async function showTeamDetail(teamName, game, fromMatch = null, teamLogo = '') {
  document.getElementById('team-detail-modal')?.remove();

  const cfg    = window.EsportAPI?.GAME_CONFIG?.[game];
  const token  = window._pandaToken;
  const colors = window.GENRE_COLORS?.[cfg?.genre] || { bg: '#1a1e2c', accent: '#a78bfa' };

  // Créer la modal avec skeleton
  const modal = document.createElement('div');
  modal.id        = 'team-detail-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide team-detail-box">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:10px">
          ${fromMatch ? '<button class="back-btn" onclick="closeTeamDetail();showMatchDetail(window._lastOpenedMatch)">← Match</button>' : ''}
          <div>
            <div class="md-game" style="color:${colors.accent}">${cfg?.label || game}</div>
            <div class="td-team-name" id="td-name">Chargement...</div>
            <div class="td-country" id="td-country"></div>
          </div>
        </div>
        <div class="md-header-actions">
          <div id="td-fav-btn"></div>
          <button class="modal-close" onclick="closeTeamDetail()">✕</button>
        </div>
      </div>

      <div class="td-logo-header">
        ${teamLogo ? '<img src="' + teamLogo + '" class="td-logo-big">' : ''}
      </div>
      <div id="td-content">
        <div class="lb-loading">Chargement de la fiche équipe...</div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeTeamDetail(); });

  // Charger les données
  await loadTeamDetail(teamName, game, token, cfg, colors, teamLogo);
}

async function loadTeamDetail(teamName, game, token, cfg, colors, teamLogo = '') {
  const el = document.getElementById('td-content');
  if (!el) return;

  try {
    // Récupérer les données en parallèle
    const [teamData, recentMatches, upcomingMatches] = await Promise.all([
      fetchTeamData(teamName, game, token, cfg),
      fetchTeamMatches(teamName, game, token, cfg, 'past', 5),
      fetchTeamMatches(teamName, game, token, cfg, 'upcoming', 3),
    ]);

    // Mettre à jour le nom
    const nameEl = document.getElementById('td-name');
    if (nameEl) nameEl.textContent = teamData?.name || teamName;

    // Bouton favori
    const favEl  = document.getElementById('td-fav-btn');
    const user   = window.FirebaseService?.getCurrentUser();
    if (favEl && user) {
      const isFav = await window.FirebaseService.isFavorite(user.uid, teamName, game);
      favEl.innerHTML = '<button class="fav-btn ' + (isFav ? 'active' : '') + '" data-team="' + teamName + '" data-game="' + game + '" onclick="handleFavClick(this)">' + (isFav ? '⭐' : '☆') + ' ' + (isFav ? 'Suivi' : 'Suivre') + '</button>';
    }

    // Rendu complet
    el.innerHTML = renderTeamDetail(teamData, teamName, recentMatches, upcomingMatches, colors, game, teamLogo);

  } catch(e) {
    console.error('[TeamDetail]', e);
    el.innerHTML = '<div class="lb-empty">Impossible de charger la fiche équipe.</div>';
  }
}

// ----------------------------------------------------------
//  Récupérer les infos de l'équipe
// ----------------------------------------------------------
async function fetchTeamData(teamName, game, token, cfg) {
  if (!token || token === 'VOTRE_CLE_ICI' || !cfg || cfg.source !== 'pandascore') return null;
  try {
    const params = new URLSearchParams({
      type: 'team',
      name: teamName,
      exact: '1',
      slug: cfg.slug,
      token: token,
      game: game,
    });
    const res  = await fetch('https://omniscore-cache.omniscoregg.workers.dev?' + params);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : null;
  } catch(e) { return null; }
}

// ----------------------------------------------------------
//  Récupérer les matchs d'une équipe via le cache Worker
// ----------------------------------------------------------
async function fetchTeamMatches(teamName, game, token, cfg, status, count) {
  // Utiliser les matchs déjà en mémoire dans matchStore
  const stored = window.matchStore ? [...window.matchStore.values()] : [];
  const filtered = stored.filter(m => {
    if (m.game !== game) return false;
    if (status === 'upcoming') return m.status === 'upcoming';
    if (status === 'past') return m.status === 'finished';
    if (status === 'running') return m.status === 'running';
    return true;
  }).filter(m =>
    m.team1.name.toLowerCase() === teamName.toLowerCase() ||
    m.team2.name.toLowerCase() === teamName.toLowerCase()
  ).slice(0, count);

  // Si pas assez de matchs en mémoire, essayer le Worker
  if (filtered.length > 0) return filtered.map(m => ({
    opponents: [
      { opponent: { name: m.team1.name, image_url: m.team1.logo } },
      { opponent: { name: m.team2.name, image_url: m.team2.logo } },
    ],
    results: [{ score: m.score1 }, { score: m.score2 }],
    scheduled_at: m.date,
    league: { name: m.tournament },
  }));

  // Fallback Worker
  if (!token || token === 'VOTRE_CLE_ICI' || !cfg || cfg.source !== 'pandascore') return [];
  try {
    const params = new URLSearchParams({ game, slug: cfg.slug, status, count: String(count * 5), token });
    const res    = await fetch('https://omniscore-cache.omniscoregg.workers.dev?' + params);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(m => (m.opponents || []).some(o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase()))
      .slice(0, count);
  } catch(e) { return []; }
}

// ----------------------------------------------------------
//  Rendu de la fiche équipe
// ----------------------------------------------------------
function renderTeamDetail(team, teamName, recentMatches, upcomingMatches, colors, game, teamLogo = '') {
  let html = '';

  // Header équipe
  // Mettre le pays sous le nom
  const countryEl = document.getElementById('td-country');
  if (countryEl && team?.location) countryEl.textContent = '📍 ' + team.location;

  html += '<div class="td-header">';
  html += '<div class="td-header-info">';

  // Stats — calculées depuis les matchs en mémoire
  const storedMatches = window.matchStore ? [...window.matchStore.values()].filter(m =>
    m.game === game && m.status === 'finished' &&
    (m.team1.name.toLowerCase() === teamName.toLowerCase() ||
     m.team2.name.toLowerCase() === teamName.toLowerCase())
  ) : [];

  let w = 0, l = 0;
  storedMatches.forEach(m => {
    const isT1 = m.team1.name.toLowerCase() === teamName.toLowerCase();
    const won  = isT1 ? m.winner === 1 : m.winner === 2;
    if (won) w++; else l++;
  });

  // Fallback sur les données API si pas de matchs en mémoire
  if (storedMatches.length === 0 && team) {
    w = team.wins || 0;
    l = team.losses || 0;
  }

  const wr = (w + l) > 0 ? Math.round((w / (w + l)) * 100) : 0;
  if (w + l > 0 || team) {
    html += '<div class="ti-stats">'
      + '<span class="ti-stat wr">' + wr + '% WR</span>'
      + '</div>';
  }

  // Form rows depuis storedMatches
  if (storedMatches.length > 0) {
    html += '<div class="form-rows">';
    storedMatches.slice(0, 5).forEach(m => {
      const isT1 = m.team1.name.toLowerCase() === teamName.toLowerCase();
      const won  = isT1 ? m.winner === 1 : m.winner === 2;
      const myS  = isT1 ? m.score1 : m.score2;
      const oppS = isT1 ? m.score2 : m.score1;
      const opp  = isT1 ? m.team2 : m.team1;
      const logoHtml = opp.logo
        ? '<img src="' + opp.logo + '" class="form-row-logo" onerror="this.style.display=\'none\'">'
        : '<span class="form-row-opp">' + opp.name + '</span>';
      html += '<div class="form-row ' + (won ? 'win' : 'loss') + '">'
        + '<span class="form-row-score">' + myS + ' - ' + oppS + '</span>'
        + logoHtml
        + '</div>';
    });
    html += '</div>';
  }

  // Réseaux sociaux
  if (team?.social_media_accounts?.length > 0) {
    const icons = { twitter: '🐦', facebook: '📘', instagram: '📸', twitch: '🎮', youtube: '📺' };
    html += '<div class="ti-socials">';
    team.social_media_accounts.forEach(s => {
      html += '<a href="' + s.url + '" target="_blank" class="ti-social">' + (icons[s.network] || '🔗') + ' ' + s.network + '</a>';
    });
    html += '</div>';
  }
  html += '</div></div>';

  // Roster
  if (team?.players?.length > 0) {
    html += '<div class="td-section"><div class="td-section-title">👥 Roster</div>';
    html += '<div class="td-roster">';
    team.players.forEach(p => {
      const avatar = p.image_url
        ? '<img src="' + p.image_url + '" class="ti-avatar">'
        : '<div class="ti-avatar-placeholder">' + (p.name || '?')[0] + '</div>';
      html += '<div class="td-player">'
        + avatar
        + '<div class="ti-player-info">'
        + '<span class="ti-ign">' + (p.name || '—') + '</span>'
        + (p.role ? '<span class="ti-role">' + p.role + '</span>' : '')
        + (p.nationality ? '<span class="ti-role">' + p.nationality + '</span>' : '')
        + '</div>'
        + '</div>';
    });
    html += '</div></div>';
  }

  // Derniers matchs
  if (recentMatches.length > 0) {
    html += '<div class="td-section"><div class="td-section-title">📋 Derniers résultats</div>';
    recentMatches.forEach(m => {
      const ops  = m.opponents || [];
      const res  = m.results   || [];
      const idx  = ops.findIndex(o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase());
      const opp  = ops[1 - idx]?.opponent;
      const myS  = res[idx]?.score ?? '?';
      const oppS = res[1 - idx]?.score ?? '?';
      const won  = myS > oppS;
      const date = m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
      html += '<div class="td-match-row">'
        + '<span class="td-result ' + (won ? 'win' : 'loss') + '">' + (won ? 'V' : 'D') + '</span>'
        + '<span class="td-match-score">' + myS + ' - ' + oppS + '</span>'
        + '<span class="td-match-opp">vs ' + (opp?.name || '?') + '</span>'
        + '<span class="td-match-date">' + date + '</span>'
        + '</div>';
    });
    html += '</div>';
  }

  // Prochains matchs style H2H
  if (upcomingMatches.length > 0) {
    html += '<div class="td-section" style="margin-top:16px"><div class="td-section-title">🕐 Prochains matchs</div>';
    upcomingMatches.forEach(m => {
      const ops      = m.opponents || [];
      const idx      = ops.findIndex(o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase());
      const opp      = ops[1 - idx]?.opponent;
      const myTeam   = ops[idx]?.opponent;
      const date     = m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
      const time     = m.scheduled_at ? new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const tournament = m.league?.name || '—';
      html += '<div class="h2h-row">'
        + '<div class="h2h-row-meta">' + tournament + ' · ' + date + (time ? ' · ' + time : '') + '</div>'
        + '<div class="h2h-row-match">'
        + '<span class="h2h-team">' + (myTeam?.name || teamName) + '</span>'
        + '<span class="h2h-score">vs</span>'
        + '<span class="h2h-team right">' + (opp?.name || '?') + '</span>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
  }

  if (!team && recentMatches.length === 0 && upcomingMatches.length === 0) {
    html = '<div class="lb-empty">Aucune donnée disponible pour cette équipe.</div>';
  }

  return html;
}

function closeTeamDetail() {
  document.getElementById('team-detail-modal')?.remove();
}

window.showTeamDetail  = showTeamDetail;
window.closeTeamDetail = closeTeamDetail;

console.log('[team-detail] chargé ✓');
