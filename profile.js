// ============================================================
//  profile.js — Page profil utilisateur
// ============================================================

// ----------------------------------------------------------
//  Avatar — Gravatar + fallback initiales colorées
// ----------------------------------------------------------
async function getAvatarHtml(email, username, color, size, points, premium) {
  size   = size || 64;
  points = points || 0;
  const initials    = (username || '?')[0].toUpperCase();
  const gravatarUrl = typeof md5 === 'function'
    ? 'https://www.gravatar.com/avatar/' + md5((email||'').trim().toLowerCase()) + '?s=' + size + '&d=404'
    : null;
  const rankObj    = window.getSeasonRank ? window.getSeasonRank(points) : { name: 'Bronze', color: '#cd7f32' };
  const frameClass = 'rank-frame-' + rankObj.name.toLowerCase().replace(/[îâêàùé]/g, c => ({'î':'i','â':'a','ê':'e','à':'a','ù':'u','é':'e'}[c]||c));

  return `<div class="lb-avatar-frame ${frameClass}${premium ? ' is-premium' : ''}" style="width:${size}px;height:${size}px;--rank-color:${color}">
    <div class="lb-avatar-photo">
      ${gravatarUrl ? `<img src="${gravatarUrl}" class="lb-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" style="display:block">` : ''}
      <div class="lb-avatar-initials" style="${gravatarUrl ? 'display:none' : 'display:flex'};color:${color};font-size:${Math.round(size*0.4)}px;font-weight:800;background:${color}20">
        ${initials}
      </div>
      ${premium ? '<div class="premium-shine"></div>' : ''}
    </div>
  </div>`;
}

// MD5 pour Gravatar
function md5(str) {
  function safeAdd(x,y){var l=(x&0xFFFF)+(y&0xFFFF);return((x>>16)+(y>>16)+(l>>16)<<16)|(l&0xFFFF);}
  function bitRotateLeft(n,c){return(n<<c)|(n>>>(32-c));}
  function md5cmn(q,a,b,x,s,t){return safeAdd(bitRotateLeft(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);}
  function md5ff(a,b,c,d,x,s,t){return md5cmn((b&c)|(~b&d),a,b,x,s,t);}
  function md5gg(a,b,c,d,x,s,t){return md5cmn((b&d)|(c&~d),a,b,x,s,t);}
  function md5hh(a,b,c,d,x,s,t){return md5cmn(b^c^d,a,b,x,s,t);}
  function md5ii(a,b,c,d,x,s,t){return md5cmn(c^(b|~d),a,b,x,s,t);}
  var s=unescape(encodeURIComponent(str)),l=s.length;
  var w=Array(Math.ceil((l+8)/64)*16).fill(0);
  for(var i=0;i<l;i++)w[i>>2]|=s.charCodeAt(i)<<((i%4)*8);
  w[l>>2]|=0x80<<((l%4)*8);w[w.length-2]=l*8;
  var a=1732584193,b=-271733879,c=-1732584194,d=271733878;
  for(i=0;i<w.length;i+=16){
    var aa=a,bb=b,cc=c,dd=d;
    a=md5ff(a,b,c,d,w[i],7,-680876936);d=md5ff(d,a,b,c,w[i+1],12,-389564586);c=md5ff(c,d,a,b,w[i+2],17,606105819);b=md5ff(b,c,d,a,w[i+3],22,-1044525330);
    a=md5ff(a,b,c,d,w[i+4],7,-176418897);d=md5ff(d,a,b,c,w[i+5],12,1200080426);c=md5ff(c,d,a,b,w[i+6],17,-1473231341);b=md5ff(b,c,d,a,w[i+7],22,-45705983);
    a=md5ff(a,b,c,d,w[i+8],7,1770035416);d=md5ff(d,a,b,c,w[i+9],12,-1958414417);c=md5ff(c,d,a,b,w[i+10],17,-42063);b=md5ff(b,c,d,a,w[i+11],22,-1990404162);
    a=md5ff(a,b,c,d,w[i+12],7,1804603682);d=md5ff(d,a,b,c,w[i+13],12,-40341101);c=md5ff(c,d,a,b,w[i+14],17,-1502002290);b=md5ff(b,c,d,a,w[i+15],22,1236535329);
    a=md5gg(a,b,c,d,w[i+1],5,-165796510);d=md5gg(d,a,b,c,w[i+6],9,-1069501632);c=md5gg(c,d,a,b,w[i+11],14,643717713);b=md5gg(b,c,d,a,w[i],20,-373897302);
    a=md5gg(a,b,c,d,w[i+5],5,-701558691);d=md5gg(d,a,b,c,w[i+10],9,38016083);c=md5gg(c,d,a,b,w[i+15],14,-660478335);b=md5gg(b,c,d,a,w[i+4],20,-405537848);
    a=md5gg(a,b,c,d,w[i+9],5,568446438);d=md5gg(d,a,b,c,w[i+14],9,-1019803690);c=md5gg(c,d,a,b,w[i+3],14,-187363961);b=md5gg(b,c,d,a,w[i+8],20,1163531501);
    a=md5gg(a,b,c,d,w[i+13],5,-1444681467);d=md5gg(d,a,b,c,w[i+2],9,-51403784);c=md5gg(c,d,a,b,w[i+7],14,1735328473);b=md5gg(b,c,d,a,w[i+12],20,-1926607734);
    a=md5hh(a,b,c,d,w[i+5],4,-378558);d=md5hh(d,a,b,c,w[i+8],11,-2022574463);c=md5hh(c,d,a,b,w[i+11],16,1839030562);b=md5hh(b,c,d,a,w[i+14],23,-35309556);
    a=md5hh(a,b,c,d,w[i+1],4,-1530992060);d=md5hh(d,a,b,c,w[i+4],11,1272893353);c=md5hh(c,d,a,b,w[i+7],16,-155497632);b=md5hh(b,c,d,a,w[i+10],23,-1094730640);
    a=md5hh(a,b,c,d,w[i+13],4,681279174);d=md5hh(d,a,b,c,w[i],11,-358537222);c=md5hh(c,d,a,b,w[i+3],16,-722521979);b=md5hh(b,c,d,a,w[i+6],23,76029189);
    a=md5hh(a,b,c,d,w[i+9],4,-640364487);d=md5hh(d,a,b,c,w[i+12],11,-421815835);c=md5hh(c,d,a,b,w[i+15],16,530742520);b=md5hh(b,c,d,a,w[i+2],23,-995338651);
    a=md5ii(a,b,c,d,w[i],6,-198630844);d=md5ii(d,a,b,c,w[i+7],10,1126891415);c=md5ii(c,d,a,b,w[i+14],15,-1416354905);b=md5ii(b,c,d,a,w[i+5],21,-57434055);
    a=md5ii(a,b,c,d,w[i+12],6,1700485571);d=md5ii(d,a,b,c,w[i+3],10,-1894986606);c=md5ii(c,d,a,b,w[i+10],15,-1051523);b=md5ii(b,c,d,a,w[i+1],21,-2054922799);
    a=md5ii(a,b,c,d,w[i+8],6,1873313359);d=md5ii(d,a,b,c,w[i+15],10,-30611744);c=md5ii(c,d,a,b,w[i+6],15,-1560198380);b=md5ii(b,c,d,a,w[i+13],21,1309151649);
    a=md5ii(a,b,c,d,w[i+4],6,-145523070);d=md5ii(d,a,b,c,w[i+11],10,-1120210379);c=md5ii(c,d,a,b,w[i+2],15,718787259);b=md5ii(b,c,d,a,w[i+9],21,-343485551);
    a=safeAdd(a,aa);b=safeAdd(b,bb);c=safeAdd(c,cc);d=safeAdd(d,dd);
  }
  var hex='';
  [a,b,c,d].forEach(n=>{for(var j=0;j<4;j++)hex+=('0'+((n>>(j*8))&0xFF).toString(16)).slice(-2);});
  return hex;
}

async function showProfilePage() {
  document.getElementById('profile-modal')?.remove();

  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const modal = document.createElement('div');
  modal.id        = 'profile-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide profile-box">
      <div class="modal-header">
        <div class="modal-title">👤 Mon Profil</div>
        <button class="modal-close" onclick="document.getElementById('profile-modal').remove()">✕</button>
      </div>
      <div id="profile-content"><div class="lb-loading">Chargement...</div></div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  await loadProfileContent(user);
}

async function loadProfileContent(user) {
  const el = document.getElementById('profile-content');
  if (!el) return;

  try {
    const [profile, predictions, leaderboard, favTeams, favGames] = await Promise.all([
      window.FirebaseService.getUserProfile(user.uid),
      window.FirebaseService.getUserPredictions ? window.FirebaseService.getUserPredictions(user.uid) : getUserPredictionsLocal(user.uid),
      window.FirebaseService.getLeaderboard(100),
      window.FirebaseService.getFavorites(user.uid),
      window.FirebaseService.getFavoriteGames(user.uid),
    ]);

    if (!profile) { el.innerHTML = '<div class="lb-empty">Profil introuvable.</div>'; return; }

    // Résoudre les logos des équipes favorites absentes du matchStore
    // (fetchTeamData vient de team-detail.js, réutilisée pour éviter un point mort)
    window._profileFavLogos = window._profileFavLogos || {};
    await Promise.all(favTeams.map(async f => {
      const logoKey = f.game + '|' + f.teamName.toLowerCase();
      if (window._profileFavLogos[logoKey] !== undefined) return; // déjà résolu (cache session)
      let logo = null;
      if (window.matchStore) {
        for (const [, m] of window.matchStore) {
          if (m.game === f.game) {
            if (m.team1?.name?.toLowerCase() === f.teamName.toLowerCase() && m.team1?.logo) { logo = m.team1.logo; break; }
            if (m.team2?.name?.toLowerCase() === f.teamName.toLowerCase() && m.team2?.logo) { logo = m.team2.logo; break; }
          }
        }
      }
      if (!logo && typeof fetchTeamData === 'function') {
        const cfg  = EsportAPI.GAME_CONFIG[f.game];
        const data = await fetchTeamData(f.teamName, f.game, cfg);
        logo = data?.image_url || data?.logo || null;
      }
      window._profileFavLogos[logoKey] = logo;
    }));

    const rank      = leaderboard.findIndex(u => u.id === user.uid) + 1;
    const rankLabel = rank === 0 ? '—' : '#' + rank;

    const stats   = window.computePredictionStats(predictions);
    const total   = stats.total;
    const correct = stats.correct - stats.perfect;
    const perfect = stats.perfect;
    const wrong   = stats.wrong;
    const pending = stats.pending;
    const pct     = stats.pct;

    const streak     = profile.streak || calculateStreak(predictions);
    const dayStreak  = profile.dayStreak || 0;
    const nextBonus  = 7 - (dayStreak % 7);

    el.innerHTML = `
      <div class="profile-header">
        <div id="profile-avatar-container"></div>
        <div class="profile-info">
          <div class="profile-username">${profile.username}</div>
          <div class="profile-email">${profile.email ? profile.email.replace(/(.{2}).*(@.*)/, '$1***$2') : ''}</div>
          <div class="profile-since">Membre depuis ${formatDate(profile.createdAt)}</div>
          ${window.renderSeasonRankBadge ? window.renderSeasonRankBadge(profile.points, rank || 9999, 'normal') : (window.renderRankBadge ? window.renderRankBadge(profile.points, rank || 9999, 'normal') : '')}
          <div class="profile-premium-slot">
            ${profile.premium
              ? '<span class="premium-badge">👑 Premium</span><button class="premium-manage-btn" onclick="openBillingPortal()">Gérer l\'abonnement</button>'
              : '<button class="premium-cta-btn" onclick="showPremiumModal()">Passer Premium</button>'
            }
          </div>
        </div>
        <div class="profile-rank">${rankLabel}</div>
      </div>

      <div class="profile-tools-row">
        <button class="premium-cta-btn" onclick="showSeasonRecap()">📊 Bilan de saison${profile.premium ? '' : ' 👑'}</button>
        <button class="premium-cta-btn" onclick="showAdvancedStats()">📈 Statistiques avancées${profile.premium ? '' : ' 👑'}</button>
      </div>

      <div class="daily-streak-wrap" id="daily-streak-section"></div>

      <div class="profile-stats-row">
        <div class="profile-stat">
          <div class="profile-stat-value">${total}</div>
          <div class="profile-stat-label">Prédictions</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#4ade80">${pct}%</div>
          <div class="profile-stat-label">Réussite</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#fbbf24">${streak}</div>
          <div class="profile-stat-label">Série</div>
        </div>
      </div>

      <div class="profile-points-row">
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#a78bfa;font-size:28px">${profile.points}</div>
          <div class="profile-stat-label">Points saison</div>
          <button class="share-btn-small" onclick="shareFromProfile('season')" title="Partager mes stats saison">📤</button>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#fbbf24;font-size:22px">${profile.totalPoints || profile.points}</div>
          <div class="profile-stat-label">Points carrière</div>
          <button class="share-btn-small" onclick="shareFromProfile('global')" title="Partager mes stats globales">📤</button>
        </div>
      </div>

      <div class="profile-pred-detail centered">
        <span class="pred-detail-item correct">${correct} correctes</span>
        <span class="pred-detail-item perfect">${perfect} parfaites</span>
        <span class="pred-detail-item wrong">${wrong} manquées</span>
        <span class="pred-detail-item pending">${pending} en attente</span>
      </div>

      ${favTeams.length > 0 || favGames.length > 0 ? `
      <div class="profile-section">
        <div class="profile-section-title">⭐ Mes Favoris</div>
        ${favGames.length > 0 ? `
        <div class="profile-favs-category">
          <div class="profile-favs-label">Jeux</div>
          <div class="profile-favs-grid">
            ${favGames.map(g => {
              const cfg = EsportAPI.GAME_CONFIG[g];
              if (!cfg) return '';
              const colors = window.GENRE_COLORS?.[cfg.genre] || {};
              const accent = colors.accent || '#a78bfa';
              return `<div class="profile-fav-card game" style="border-color:${accent}30">
                <span class="profile-fav-dot" style="background:${accent}"></span>
                <span class="profile-fav-name">${cfg.label}</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
        ${favTeams.length > 0 ? `
        <div class="profile-favs-category">
          <div class="profile-favs-label">Équipes</div>
          ${favTeams.length > 5 ? `<input type="text" id="profile-fav-search" class="form-input" placeholder="Rechercher une équipe..." oninput="filterProfileFavTeams(this.value)" style="margin-bottom:10px">` : ''}
          <div class="profile-favs-grid" id="profile-favs-teams-grid">
            ${favTeams.map(f => {
              const cfg    = EsportAPI.GAME_CONFIG[f.game];
              const colors = window.GENRE_COLORS?.[cfg?.genre] || {};
              const accent = colors.accent || '#a78bfa';
              const logo   = window._profileFavLogos?.[f.game + '|' + f.teamName.toLowerCase()] || null;
              const logoHtml = logo
                ? `<img src="${logo}" class="profile-fav-logo" onerror="this.style.display='none'">`
                : `<span class="profile-fav-dot" style="background:${accent}"></span>`;
              const tname = f.teamName.replace(/'/g, "\\'");
              return `<div class="profile-fav-card team" data-name="${f.teamName.toLowerCase()}" style="border-color:${accent}30;cursor:pointer" onclick="document.getElementById('profile-modal')?.remove();showTeamDetail('${tname}','${f.game}',null,'',true)">
                ${logoHtml}
                <div class="profile-fav-info">
                  <span class="profile-fav-name" style="color:${accent}">${f.teamName}</span>
                  <span class="profile-fav-game">${cfg?.label || f.game}</span>
                </div>
                <span class="profile-fav-arrow">›</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
      </div>
      ` : ''}

      <div id="season-section-wrap"></div>

      <div class="profile-section">
        <div class="profile-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>Historique</span>
          <div class="pred-view-toggle">
            <button class="pred-view-btn active" id="pred-view-list" onclick="switchPredView('list')">Liste</button>
            <button class="pred-view-btn" id="pred-view-game" onclick="switchPredView('game')">Par jeu</button>
          </div>
        </div>
        <div id="pred-history-container">
        ${predictions.length === 0
          ? '<div class="lb-empty">Aucune prédiction pour l\'instant.<br><span style="font-size:12px;color:var(--text3)">Retourne sur la liste des matchs et prédis ton premier résultat !</span></div>'
          : predictions.slice(0, profile.premium ? predictions.length : 20).map(p => renderPredRow(p)).join('')
        }
        ${!profile.premium && predictions.length > 20
          ? `<div class="lb-empty" style="padding:14px 0"><span style="font-size:12px;color:var(--text3)">Historique limité aux 20 dernières prédictions. </span><button class="premium-cta-btn" style="font-size:12px;padding:5px 10px;margin-top:6px" onclick="showPremiumModal()">Passer Premium pour l'historique illimité</button></div>`
          : ''
        }
        </div>
      </div>
    `;

    renderDailyStreak(dayStreak, nextBonus);
    _predCache      = predictions;
    _predIsPremium  = !!profile.premium;

    // Avatar Gravatar + cadre rang
    const avatarColor = window.getSeasonRank ? window.getSeasonRank(profile.points || 0).color : '#a78bfa';
    const avatarContainer = document.getElementById('profile-avatar-container');
    if (avatarContainer) {
      getAvatarHtml(profile.email || '', profile.username || '?', avatarColor, 64, profile.points || 0, profile.premium).then(html => {
        avatarContainer.innerHTML = html;
      });
    }

    if (window.renderSeasonSection) {
      const lang = window.i18n ? window.i18n.currentLang() : 'fr';
      const seasonWrap = document.getElementById('season-section-wrap');
      if (seasonWrap) {
        renderSeasonSection(user.uid, rank || 9999, lang).then(html => {
          seasonWrap.innerHTML = html;
        });
      }
    }

  } catch(e) {
    console.error('[Profile]', e);
    el.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}

async function getUserPredictionsLocal(uid) {
  try {
    const snap = await firebase.firestore().collection('predictions')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { return []; }
}

function calculateStreak(predictions) {
  const resolved = predictions.filter(p => p.result !== null).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  let streak = 0;
  for (const p of resolved) {
    if (p.result === 'correct' || p.result === 'perfect') streak++;
    else break;
  }
  return streak;
}

function renderPredRow(p) {
  const resultColors = { correct: '#4ade80', wrong: '#f87171', perfect: '#fbbf24' };
  const borderClass = { correct: 'pred-border-correct', wrong: 'pred-border-wrong', perfect: 'pred-border-perfect' }[p.result] || '';
  const dotColor = resultColors[p.result] || 'var(--text3)';
  const pts    = p.result ? `+${p.points} pts` : '';
  const score  = (p.predictedScore1 !== null && p.predictedScore2 !== null)
    ? ` (${p.predictedScore1}-${p.predictedScore2})` : '';
  const cfg    = EsportAPI.GAME_CONFIG[p.game];
  const colors = window.GENRE_COLORS?.[cfg?.genre] || { accent: '#a78bfa' };
  const date   = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
  return `<div class="pred-history-row ${borderClass}">
    <div class="pred-history-info">
      <span class="pred-history-game" style="color:${colors.accent}">${cfg?.label || p.game}</span>
      <span class="pred-history-team">${p.predictedWinner}${score}</span>
      <span class="pred-history-match">vs ${p.team1 === p.predictedWinner ? p.team2 : p.team1}</span>
    </div>
    <div class="pred-history-right">
      ${pts ? `<span class="pred-history-pts" style="color:${dotColor};font-weight:700;border:1px solid ${dotColor}70;box-shadow:0 0 8px ${dotColor}40;border-radius:20px;padding:1px 8px">${pts}</span>` : ''}
      <span class="pred-history-date">${date}</span>
    </div>
  </div>`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderDailyStreak(dayStreak, nextBonus) {
  const el = document.getElementById('daily-streak-section');
  if (!el) return;
  const dayNames = ['D','L','M','M','J','V','S'];
  const today    = new Date().getDay();
  const filled   = dayStreak % 7 || (dayStreak > 0 && dayStreak % 7 === 0 ? 7 : 0);
  const dayDots  = Array.from({length: 7}, (_, i) => {
    const dayIndex = (today - 6 + i + 7) % 7;
    const isFilled = i >= (7 - filled);
    return '<div class="daily-day ' + (isFilled ? 'filled' : '') + '"><span>' + dayNames[dayIndex] + '</span></div>';
  }).join('');
  let info = '';
  if (dayStreak === 0) info = 'Faites une prédiction aujourd\'hui pour commencer votre série !';
  else if (nextBonus === 7) info = 'Bonus de 7 jours atteint ! Prochain bonus dans 7 jours.';
  else info = 'Encore <strong>' + nextBonus + ' jour' + (nextBonus > 1 ? 's' : '') + '</strong> pour le bonus +5 pts !';
  el.innerHTML = '<div class="daily-streak-title">Activité quotidienne <span style="color:var(--text3);font-size:11px">— Bonus +5 pts tous les 7 jours</span></div>'
    + '<div class="daily-streak-bar">' + dayDots + '</div>'
    + '<div class="daily-streak-info">' + info + '</div>';
}

// ----------------------------------------------------------
//  Historique prédictions — Vue liste
// ----------------------------------------------------------
function renderPredHistoryList(preds) {
  return preds.map(p => renderPredRow(p)).join('');
}

// ----------------------------------------------------------
//  Historique prédictions — Vue par jeu
// ----------------------------------------------------------
function renderPredHistoryByGame(preds) {
  // Grouper par jeu
  const byGame = {};
  preds.forEach(p => {
    if (!byGame[p.game]) byGame[p.game] = [];
    byGame[p.game].push(p);
  });

  return Object.entries(byGame).map(([game, gamePreds]) => {
    const cfg    = EsportAPI.GAME_CONFIG[game];
    const colors = window.GENRE_COLORS?.[cfg?.genre] || {};
    const accent = colors.accent || '#a78bfa';
    const label  = cfg?.label || game;

    const resolved = gamePreds.filter(p => p.result !== null);
    const correct  = gamePreds.filter(p => p.result === 'correct' || p.result === 'perfect').length;
    const perfect  = gamePreds.filter(p => p.result === 'perfect').length;
    const pct      = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0;

    // Grouper par tournoi
    const byTournoi = {};
    gamePreds.forEach(p => {
      const t = p.tournament || 'Autre';
      if (!byTournoi[t]) byTournoi[t] = [];
      byTournoi[t].push(p);
    });

    const tournoiHtml = Object.entries(byTournoi).map(([tournoi, tPreds]) => {
      const tCorrect = tPreds.filter(p => p.result === 'correct' || p.result === 'perfect').length;
      const tResolved = tPreds.filter(p => p.result !== null).length;
      const tPct = tResolved > 0 ? Math.round((tCorrect / tResolved) * 100) : 0;
      return `
        <div class="pred-tournoi-group">
          <div class="pred-tournoi-header">
            <span class="pred-tournoi-name">${tournoi}</span>
            <span class="pred-tournoi-stats">${tPreds.length} préd · ${tPct}%</span>
          </div>
          ${tPreds.slice(0, 5).map(p => renderPredRow(p)).join('')}
        </div>`;
    }).join('');

    return `
      <div class="pred-game-group">
        <div class="pred-game-header" style="border-left:3px solid ${accent}">
          <div class="pred-game-info">
            <span class="pred-game-label" style="color:${accent}">${label}</span>
            <span class="pred-game-stats">${gamePreds.length} prédictions · ${pct}% de réussite · ${perfect} parfaites</span>
          </div>
          <div class="pred-game-pct" style="color:${pct >= 60 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171'}">${pct}%</div>
        </div>
        ${tournoiHtml}
      </div>`;
  }).join('');
}

// Switcher de vue
let _predViewMode   = 'list';
let _predCache      = [];
let _predIsPremium  = false;
function switchPredView(mode) {
  _predViewMode = mode;
  document.querySelectorAll('.pred-view-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('pred-view-' + mode);
  if (btn) btn.classList.add('active');
  const container = document.getElementById('pred-history-container');
  if (!container || _predCache.length === 0) return;
  const listPreds = _predIsPremium ? _predCache : _predCache.slice(0, 20);
  container.innerHTML = mode === 'game'
    ? renderPredHistoryByGame(_predCache)
    : renderPredHistoryList(listPreds);
}
window.switchPredView = switchPredView;

// ----------------------------------------------------------
//  Bilan de saison (Premium)
// ----------------------------------------------------------
async function showSeasonRecap() {
  document.getElementById('season-recap-modal')?.remove();
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const profile = await window.FirebaseService.getUserProfile(user.uid);
  if (!profile?.premium) { showPremiumModal(); return; }

  const modal = document.createElement('div');
  modal.id        = 'season-recap-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">📊 Bilan de saison</div>
        <button class="modal-close" onclick="document.getElementById('season-recap-modal').remove()">✕</button>
      </div>
      <div id="season-recap-content"><div class="lb-loading">Chargement...</div></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  const content = document.getElementById('season-recap-content');
  try {
    const seasonStart = window.getCurrentSeasonStart ? window.getCurrentSeasonStart() : new Date(0);
    const allPreds = _predCache.length
      ? _predCache
      : (window.FirebaseService.getUserPredictions ? await window.FirebaseService.getUserPredictions(user.uid) : []);
    const seasonPreds = allPreds.filter(p => p.createdAt && new Date(p.createdAt) >= seasonStart);

    const stats = window.computePredictionStats
      ? window.computePredictionStats(seasonPreds)
      : { total: seasonPreds.length, correct: 0, perfect: 0, wrong: 0, pending: 0, pct: 0 };

    // Meilleur jeu de la saison (par points)
    const byGame = {};
    seasonPreds.forEach(p => {
      if (!byGame[p.game]) byGame[p.game] = { points: 0, count: 0 };
      byGame[p.game].points += (p.points || 0);
      byGame[p.game].count  += 1;
    });
    const bestGameEntry  = Object.entries(byGame).sort((a, b) => b[1].points - a[1].points)[0];
    const bestGameLabel  = bestGameEntry ? (EsportAPI.GAME_CONFIG[bestGameEntry[0]]?.label || bestGameEntry[0]) : '—';
    const bestGamePoints = bestGameEntry ? bestGameEntry[1].points : 0;
    const bestGameCount  = bestGameEntry ? bestGameEntry[1].count : 0;

    // Meilleure série de la saison (streak le plus long, pas seulement l'actuelle)
    const resolvedSeason = seasonPreds
      .filter(p => p.result !== null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let bestStreak = 0, curStreak = 0;
    resolvedSeason.forEach(p => {
      if (p.result === 'correct' || p.result === 'perfect') { curStreak++; bestStreak = Math.max(bestStreak, curStreak); }
      else curStreak = 0;
    });

    const seasonPoints = seasonPreds.reduce((sum, p) => sum + (p.points || 0), 0);

    content.innerHTML = `
      <div class="profile-stats-row">
        <div class="profile-stat">
          <div class="profile-stat-value">${stats.total}</div>
          <div class="profile-stat-label">Prédictions</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#4ade80">${stats.pct}%</div>
          <div class="profile-stat-label">Réussite</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#fbbf24">${bestStreak}</div>
          <div class="profile-stat-label">Meilleure série</div>
        </div>
      </div>

      <div class="profile-pred-detail centered">
        <span class="pred-detail-item correct">${stats.correct - stats.perfect} correctes</span>
        <span class="pred-detail-item perfect">${stats.perfect} parfaites</span>
        <span class="pred-detail-item wrong">${stats.wrong} manquées</span>
        <span class="pred-detail-item pending">${stats.pending} en attente</span>
      </div>

      <div class="profile-section" style="margin-top:16px">
        <div class="profile-section-title">🏆 Meilleur jeu de la saison</div>
        <div class="pred-game-group">
          <div class="pred-game-header" style="border-left:3px solid #a78bfa">
            <div class="pred-game-info">
              <span class="pred-game-label" style="color:#a78bfa">${bestGameLabel}</span>
              <span class="pred-game-stats">${bestGameCount} prédictions</span>
            </div>
            <div class="pred-game-pct" style="color:#4ade80">${bestGamePoints} pts</div>
          </div>
        </div>
      </div>

      <div class="profile-points-row" style="margin-top:16px">
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#a78bfa;font-size:28px">${seasonPoints}</div>
          <div class="profile-stat-label">Points cette saison</div>
        </div>
      </div>
    `;
  } catch(e) {
    console.error('[SeasonRecap]', e);
    content.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}
window.showSeasonRecap = showSeasonRecap;

// ----------------------------------------------------------
//  Statistiques avancées (Premium)
// ----------------------------------------------------------
async function showAdvancedStats() {
  document.getElementById('advanced-stats-modal')?.remove();
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const profile = await window.FirebaseService.getUserProfile(user.uid);
  if (!profile?.premium) { showPremiumModal(); return; }

  const modal = document.createElement('div');
  modal.id        = 'advanced-stats-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide">
      <div class="modal-header">
        <div class="modal-title">📈 Statistiques avancées</div>
        <button class="modal-close" onclick="document.getElementById('advanced-stats-modal').remove()">✕</button>
      </div>
      <div id="advanced-stats-content"><div class="lb-loading">Chargement...</div></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  const content = document.getElementById('advanced-stats-content');
  try {
    const predictions = _predCache.length
      ? _predCache
      : (window.FirebaseService.getUserPredictions ? await window.FirebaseService.getUserPredictions(user.uid) : []);
    const tournamentPreds = window.getUserTournamentPredictions ? await window.getUserTournamentPredictions(user.uid) : [];

    // 1. Taux de réussite par jeu (carrière)
    const byGame = {};
    predictions.forEach(p => {
      if (!byGame[p.game]) byGame[p.game] = { total: 0, correct: 0, perfect: 0, wrong: 0, pending: 0 };
      const g = byGame[p.game];
      g.total++;
      if (p.result === 'perfect') { g.correct++; g.perfect++; }
      else if (p.result === 'correct') { g.correct++; }
      else if (p.result === 'wrong') { g.wrong++; }
      else { g.pending++; }
    });
    const gameRows = Object.entries(byGame)
      .map(([game, g]) => {
        const resolved = g.total - g.pending;
        const pct = resolved > 0 ? Math.round((g.correct / resolved) * 100) : 0;
        const cfg = EsportAPI.GAME_CONFIG[game];
        const colors = window.GENRE_COLORS?.[cfg?.genre] || {};
        return { game, label: cfg?.label || game, accent: colors.accent || '#a78bfa', ...g, pct };
      })
      .sort((a, b) => b.total - a.total);

    const gameRowsHtml = gameRows.length > 0 ? gameRows.map(g => `
      <div class="pred-game-group">
        <div class="pred-game-header" style="border-left:3px solid ${g.accent}">
          <div class="pred-game-info">
            <span class="pred-game-label" style="color:${g.accent}">${g.label}</span>
            <span class="pred-game-stats">${g.total} prédictions · ${g.perfect} parfaites</span>
          </div>
          <div class="pred-game-pct" style="color:${g.pct >= 60 ? '#4ade80' : g.pct >= 40 ? '#fbbf24' : '#f87171'}">${g.pct}%</div>
        </div>
      </div>
    `).join('') : '<div class="lb-empty">Pas encore de prédictions.</div>';

    // 2. Meilleure série all-time (toute la carrière, pas juste la saison en cours)
    const resolvedAll = predictions
      .filter(p => p.result !== null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let bestStreakAll = 0, curStreakAll = 0;
    resolvedAll.forEach(p => {
      if (p.result === 'correct' || p.result === 'perfect') { curStreakAll++; bestStreakAll = Math.max(bestStreakAll, curStreakAll); }
      else curStreakAll = 0;
    });

    // 3. Évolution des points (par mois, 6 derniers mois actifs)
    const byMonth = {};
    predictions.forEach(p => {
      if (!p.createdAt || !p.points) return;
      const d   = new Date(p.createdAt);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      byMonth[key] = (byMonth[key] || 0) + p.points;
    });
    const monthKeys    = Object.keys(byMonth).sort().slice(-6);
    const maxMonthPts  = Math.max(1, ...monthKeys.map(k => byMonth[k]));
    const monthLabels  = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' };
    const evolutionHtml = monthKeys.length > 0
      ? monthKeys.map(k => {
          const m   = k.split('-')[1];
          const pts = byMonth[k];
          const widthPct = Math.max(4, Math.round((pts / maxMonthPts) * 100));
          return `
            <div class="stat-bar-row">
              <span class="stat-bar-label">${monthLabels[m] || m}</span>
              <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${widthPct}%"></div></div>
              <span class="stat-bar-value">${pts} pts</span>
            </div>`;
        }).join('')
      : '<div class="lb-empty">Pas encore assez de données.</div>';

    // 4. Comparaison matchs vs tournois
    const matchStats    = window.computePredictionStats(predictions);
    const tournResolved = tournamentPreds.filter(t => t.result !== null);
    const tournSuccess  = tournamentPreds.filter(t => t.result === 'partial' || t.result === 'perfect').length;
    const tournPct      = tournResolved.length > 0 ? Math.round((tournSuccess / tournResolved.length) * 100) : 0;

    content.innerHTML = `
      <div class="profile-section">
        <div class="profile-stats-row">
          <div class="profile-stat">
            <div class="profile-stat-value" style="color:#fbbf24">${bestStreakAll}</div>
            <div class="profile-stat-label">Meilleure série (carrière)</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${predictions.length}</div>
            <div class="profile-stat-label">Prédictions totales</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value" style="color:#4ade80">${matchStats.pct}%</div>
            <div class="profile-stat-label">Réussite globale</div>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">🎮 Réussite par jeu (carrière)</div>
        ${gameRowsHtml}
      </div>

      <div class="profile-section">
        <div class="profile-section-title">📊 Évolution des points</div>
        <div class="stat-bar-chart">${evolutionHtml}</div>
      </div>

      <div class="profile-section">
        <div class="profile-section-title">⚔️ Matchs vs Tournois</div>
        <div class="profile-stats-row">
          <div class="profile-stat">
            <div class="profile-stat-value">${matchStats.total}</div>
            <div class="profile-stat-label">Prédictions de match</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value" style="color:#4ade80">${matchStats.pct}%</div>
            <div class="profile-stat-label">Réussite matchs</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${tournamentPreds.length}</div>
            <div class="profile-stat-label">Pick'ems tournoi</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value" style="color:#4ade80">${tournPct}%</div>
            <div class="profile-stat-label">Réussite tournois</div>
          </div>
        </div>
      </div>
    `;
  } catch(e) {
    console.error('[AdvancedStats]', e);
    content.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}
window.showAdvancedStats = showAdvancedStats;

function filterProfileFavTeams(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('#profile-favs-teams-grid .profile-fav-card').forEach(card => {
    const match = !q || (card.dataset.name || '').includes(q);
    card.style.display = match ? '' : 'none';
  });
}
window.filterProfileFavTeams = filterProfileFavTeams;

// ----------------------------------------------------------
//  Premium — modale de tarifs, paiement, portail de gestion
// ----------------------------------------------------------
const BILLING_WORKER_URL = 'https://omniscore-billing.omniscoregg.workers.dev';
const PREMIUM_PRICE_MONTHLY = 'price_1UGa6iBukfxnqd9K7UTw0z57';
const PREMIUM_PRICE_YEARLY  = 'price_1UGa6hBukfxnqd9KBXJPam7y';

function showPremiumModal() {
  document.getElementById('premium-modal')?.remove();
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const modal = document.createElement('div');
  modal.id        = 'premium-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">Omniscore Premium</div>
        <button class="modal-close" onclick="document.getElementById('premium-modal').remove()">✕</button>
      </div>
      <div class="premium-plans">
        <div class="premium-plan">
          <div class="premium-plan-name">Mensuel</div>
          <div class="premium-plan-price">3€<span>/mois</span></div>
          <button class="form-submit" onclick="startCheckout('${PREMIUM_PRICE_MONTHLY}')">S'abonner</button>
        </div>
        <div class="premium-plan highlight">
          <div class="premium-plan-badge">Meilleure offre</div>
          <div class="premium-plan-name">Annuel</div>
          <div class="premium-plan-price">20€<span>/an</span></div>
          <div class="premium-plan-note">soit 1,67€/mois</div>
          <button class="form-submit" onclick="startCheckout('${PREMIUM_PRICE_YEARLY}')">S'abonner</button>
        </div>
      </div>
      <ul class="premium-features-list">
        <li>Pick'ems de tournoi illimités (3/saison en gratuit)</li>
        <li>Badge et contour d'avatar exclusifs</li>
        <li>Ligues privées illimitées</li>
        <li>Statistiques avancées</li>
        <li>Modification de prédiction avant le début du match</li>
        <li>Notifications avec délai personnalisable</li>
        <li>Bilan de saison + historique illimité</li>
        <li>Joker saisonnier</li>
      </ul>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function startCheckout(priceId) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const btn = event?.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Redirection...'; }

  try {
    const profile = await window.FirebaseService.getUserProfile(user.uid);
    const res = await fetch(BILLING_WORKER_URL + '/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, priceId, email: profile?.email || user.email || '' }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Erreur lors de la création du paiement. Réessaie plus tard.');
      if (btn) { btn.disabled = false; btn.textContent = "S'abonner"; }
    }
  } catch(e) {
    console.error('[Premium] startCheckout:', e);
    alert('Erreur lors de la création du paiement. Réessaie plus tard.');
    if (btn) { btn.disabled = false; btn.textContent = "S'abonner"; }
  }
}

async function openBillingPortal() {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;
  try {
    const res = await fetch(BILLING_WORKER_URL + '/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Impossible d'ouvrir le portail de gestion.");
    }
  } catch(e) {
    console.error('[Premium] openBillingPortal:', e);
    alert("Erreur lors de l'ouverture du portail.");
  }
}

window.showPremiumModal  = showPremiumModal;
window.startCheckout     = startCheckout;
window.openBillingPortal = openBillingPortal;

window.showProfilePage = showProfilePage;
console.log('[profile] chargé ✓');
