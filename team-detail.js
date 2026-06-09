// ============================================================
//  team-detail.js — Fiche d'équipe
// ============================================================

async function showTeamDetail(teamName, game, fromMatch = null, teamLogo = '', fromProfile = false) {
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
          ${fromProfile ? '<button class="back-btn" onclick="closeTeamDetail();showProfilePage()">← Profil</button>' : ''}
          ${fromMatch ? '<button class="back-btn" onclick="closeTeamDetail();showMatchDetail(window._lastOpenedMatch)">← Match</button>' : ''}
          ${teamLogo ? '<img src="' + teamLogo + '" class="td-logo-header-img">' : ''}
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

    // Mettre à jour le logo depuis l'API si pas déjà fourni
    const logoEl = document.querySelector('#team-detail-modal .td-logo-header-img');
    const apiLogo = teamData?.image_url || teamData?.logo || null;
    if (!logoEl && apiLogo) {
      const headerDiv = document.querySelector('#team-detail-modal .modal-header > div');
      if (headerDiv) {
        const img = document.createElement('img');
        img.src = apiLogo;
        img.className = 'td-logo-header-img';
        img.onerror = () => img.remove();
        // Insérer après les boutons retour
        const firstDiv = headerDiv.querySelector('div');
        headerDiv.insertBefore(img, firstDiv);
      }
    } else if (logoEl && !logoEl.src && apiLogo) {
      logoEl.src = apiLogo;
    }

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
//  Récupérer les matchs d'une équipe via l'API (même logique que match-detail.js)
// ----------------------------------------------------------
async function fetchTeamMatches(teamName, game, token, cfg, status, count) {
  // Toujours appeler l'API pour avoir un historique complet et cohérent
  if (token && token !== 'VOTRE_CLE_ICI' && cfg && cfg.source === 'pandascore') {
    try {
      const apiStatus = status === 'past' ? 'past' : 'upcoming';
      const params = new URLSearchParams({
        game, slug: cfg.slug, status: apiStatus, count: '50', token,
      });
      const res  = await fetch('https://omniscore-cache.omniscoregg.workers.dev?' + params);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const filtered = data
            .filter(m => (m.opponents || []).some(
              o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase()
            ))
            .slice(0, count);
          if (filtered.length > 0) return filtered;
        }
      }
    } catch(e) {
      console.warn('[fetchTeamMatches] API error:', e);
    }
  }

  // Fallback : matchStore en mémoire
  const stored = window.matchStore ? [...window.matchStore.values()] : [];
  return stored.filter(m => {
    if (m.game !== game) return false;
    if (status === 'upcoming') return m.status === 'upcoming';
    if (status === 'past')     return m.status === 'finished';
    return true;
  }).filter(m =>
    m.team1.name.toLowerCase() === teamName.toLowerCase() ||
    m.team2.name.toLowerCase() === teamName.toLowerCase()
  ).slice(0, count).map(m => ({
    opponents: [
      { opponent: { name: m.team1.name, image_url: m.team1.logo } },
      { opponent: { name: m.team2.name, image_url: m.team2.logo } },
    ],
    results:      [{ score: m.score1 }, { score: m.score2 }],
    scheduled_at: m.date,
    league:       { name: m.tournament },
  }));
}

// ----------------------------------------------------------
//  Rendu de la fiche équipe
// ----------------------------------------------------------
function renderTeamDetail(team, teamName, recentMatches, upcomingMatches, colors, game, teamLogo = '') {
  let html = '';

  // Header équipe
  // Mettre le pays sous le nom
  const countryEl = document.getElementById('td-country');
  const countryNames = {
  AF:'Afghanistan',AL:'Albanie',DZ:'Algérie',AR:'Argentine',AU:'Australie',AT:'Autriche',BE:'Belgique',BR:'Brésil',BG:'Bulgarie',CA:'Canada',CL:'Chili',CN:'Chine',CO:'Colombie',HR:'Croatie',CZ:'République Tchèque',DK:'Danemark',EG:'Égypte',FI:'Finlande',FR:'France',DE:'Allemagne',GR:'Grèce',HK:'Hong Kong',HU:'Hongrie',IN:'Inde',ID:'Indonésie',IR:'Iran',IL:'Israël',IT:'Italie',JP:'Japon',KZ:'Kazakhstan',KR:'Corée du Sud',MX:'Mexique',MN:'Mongolie',MA:'Maroc',NL:'Pays-Bas',NZ:'Nouvelle-Zélande',NO:'Norvège',PH:'Philippines',PL:'Pologne',PT:'Portugal',RO:'Roumanie',RU:'Russie',SA:'Arabie Saoudite',SG:'Singapour',ZA:'Afrique du Sud',ES:'Espagne',SE:'Suède',CH:'Suisse',TW:'Taïwan',TH:'Thaïlande',TR:'Turquie',UA:'Ukraine',GB:'Royaume-Uni',US:'États-Unis',VN:'Vietnam',
};
if (countryEl && team?.location) {
  const code = team.location.toUpperCase();
  countryEl.textContent = countryNames[code] || team.location;
}

  html += '<div class="td-header">';
  html += '<div class="td-header-info">';

  // Stats WinRate — calculées depuis les matchs API (recentMatches)
  let w = 0, l = 0;
  recentMatches.forEach(m => {
    const ops = m.opponents || [];
    const res = m.results   || [];
    const idx = ops.findIndex(o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase());
    if (idx === -1) return;
    const myS  = res[idx]?.score ?? 0;
    const oppS = res[1 - idx]?.score ?? 0;
    if (myS > oppS) w++; else l++;
  });

  // Fallback sur les données API team si pas de matchs récents
  if (w + l === 0 && team) {
    w = team.wins   || 0;
    l = team.losses || 0;
  }

  const wr = (w + l) > 0 ? Math.round((w / (w + l)) * 100) : 0;
  if (w + l > 0 || team) {
    html += '<div class="ti-stats">'
      + '<span class="ti-stat wr">' + wr + '% WR</span>'
      + '<span class="ti-stat">' + w + 'V ' + l + 'D</span>'
      + '</div>';
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
    html += '<div class="td-section" style="margin-top:16px"><div class="td-section-title">Roster</div>';
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

  // Historique enrichi depuis recentMatches
  if (recentMatches.length > 0) {
    html += '<div class="td-section" style="margin-top:16px"><div class="td-section-title">Historique</div>';
    recentMatches.forEach(m => {
      const ops        = m.opponents || [];
      const res        = m.results   || [];
      const idx        = ops.findIndex(o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase());
      const opp        = ops[1 - idx]?.opponent;
      const myS        = res[idx]?.score ?? '?';
      const oppS       = res[1 - idx]?.score ?? '?';
      const won        = myS > oppS;
      const date       = m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
      const tournament = m.league?.name || '—';
      const logoHtml   = opp?.image_url
        ? '<img src="' + opp.image_url + '" class="form-row-logo" onerror="this.style.display=\'none\'">'
        : '';
      html += '<div class="h2h-row">'
        + '<div class="h2h-row-meta">' + tournament + ' · ' + date + '</div>'
        + '<div class="h2h-row-match">'
        + '<span class="h2h-score ' + (won ? 'win' : 'loss') + '">' + myS + ' - ' + oppS + '</span>'
        + logoHtml
        + '<span class="h2h-team right">' + (opp?.name || '?') + '</span>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
  }

  // Prochains matchs style H2H
  if (upcomingMatches.length > 0) {
    html += '<div class="td-section" style="margin-top:16px"><div class="td-section-title">Prochains matchs</div>';
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
