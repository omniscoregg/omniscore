// ----------------------------------------------------------
//  Avatar — Gravatar + fallback initiales colorées
// ----------------------------------------------------------
async function getAvatarHtml(email, username, color, size) {
  size = size || 64;
  // Hash MD5 simplifié pour Gravatar (on utilise une lib CDN)
  const initials = (username || '?')[0].toUpperCase();
  const gravatarUrl = 'https://www.gravatar.com/avatar/' + md5(email.trim().toLowerCase()) + '?s=' + size + '&d=404';

  // On tente Gravatar, fallback SVG initiales
  return `<div class="profile-avatar-wrap" style="width:${size}px;height:${size}px">
    <img src="${gravatarUrl}" class="profile-avatar-img"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
      style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block">
    <div class="profile-avatar-initials" style="display:none;width:${size}px;height:${size}px;background:${color}20;color:${color};border:2px solid ${color};border-radius:50%;font-size:${Math.round(size*0.4)}px;font-weight:800;align-items:center;justify-content:center">
      ${initials}
    </div>
  </div>`;
}

// MD5 minimal pour Gravatar
function md5(str) {
  // Utilise une implémentation simple
  function safeAdd(x, y) { var lsw = (x & 0xFFFF) + (y & 0xFFFF); var msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
  var i, x = [], s = unescape(encodeURIComponent(str)), l = s.length;
  var w = Array(Math.ceil((l + 8) / 64) * 16).fill(0);
  for (i = 0; i < l; i++) w[i >> 2] |= s.charCodeAt(i) << ((i % 4) * 8);
  w[l >> 2] |= 0x80 << ((l % 4) * 8);
  w[w.length - 2] = l * 8;
  var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (i = 0; i < w.length; i += 16) {
    var aa = a, bb = b, cc = c, dd = d;
    a = md5ff(a,b,c,d,w[i],7,-680876936); d = md5ff(d,a,b,c,w[i+1],12,-389564586); c = md5ff(c,d,a,b,w[i+2],17,606105819); b = md5ff(b,c,d,a,w[i+3],22,-1044525330);
    a = md5ff(a,b,c,d,w[i+4],7,-176418897); d = md5ff(d,a,b,c,w[i+5],12,1200080426); c = md5ff(c,d,a,b,w[i+6],17,-1473231341); b = md5ff(b,c,d,a,w[i+7],22,-45705983);
    a = md5ff(a,b,c,d,w[i+8],7,1770035416); d = md5ff(d,a,b,c,w[i+9],12,-1958414417); c = md5ff(c,d,a,b,w[i+10],17,-42063); b = md5ff(b,c,d,a,w[i+11],22,-1990404162);
    a = md5ff(a,b,c,d,w[i+12],7,1804603682); d = md5ff(d,a,b,c,w[i+13],12,-40341101); c = md5ff(c,d,a,b,w[i+14],17,-1502002290); b = md5ff(b,c,d,a,w[i+15],22,1236535329);
    a = md5gg(a,b,c,d,w[i+1],5,-165796510); d = md5gg(d,a,b,c,w[i+6],9,-1069501632); c = md5gg(c,d,a,b,w[i+11],14,643717713); b = md5gg(b,c,d,a,w[i],20,-373897302);
    a = md5gg(a,b,c,d,w[i+5],5,-701558691); d = md5gg(d,a,b,c,w[i+10],9,38016083); c = md5gg(c,d,a,b,w[i+15],14,-660478335); b = md5gg(b,c,d,a,w[i+4],20,-405537848);
    a = md5gg(a,b,c,d,w[i+9],5,568446438); d = md5gg(d,a,b,c,w[i+14],9,-1019803690); c = md5gg(c,d,a,b,w[i+3],14,-187363961); b = md5gg(b,c,d,a,w[i+8],20,1163531501);
    a = md5gg(a,b,c,d,w[i+13],5,-1444681467); d = md5gg(d,a,b,c,w[i+2],9,-51403784); c = md5gg(c,d,a,b,w[i+7],14,1735328473); b = md5gg(b,c,d,a,w[i+12],20,-1926607734);
    a = md5hh(a,b,c,d,w[i+5],4,-378558); d = md5hh(d,a,b,c,w[i+8],11,-2022574463); c = md5hh(c,d,a,b,w[i+11],16,1839030562); b = md5hh(b,c,d,a,w[i+14],23,-35309556);
    a = md5hh(a,b,c,d,w[i+1],4,-1530992060); d = md5hh(d,a,b,c,w[i+4],11,1272893353); c = md5hh(c,d,a,b,w[i+7],16,-155497632); b = md5hh(b,c,d,a,w[i+10],23,-1094730640);
    a = md5hh(a,b,c,d,w[i+13],4,681279174); d = md5hh(d,a,b,c,w[i],11,-358537222); c = md5hh(c,d,a,b,w[i+3],16,-722521979); b = md5hh(b,c,d,a,w[i+6],23,76029189);
    a = md5hh(a,b,c,d,w[i+9],4,-640364487); d = md5hh(d,a,b,c,w[i+12],11,-421815835); c = md5hh(c,d,a,b,w[i+15],16,530742520); b = md5hh(b,c,d,a,w[i+2],23,-995338651);
    a = md5ii(a,b,c,d,w[i],6,-198630844); d = md5ii(d,a,b,c,w[i+7],10,1126891415); c = md5ii(c,d,a,b,w[i+14],15,-1416354905); b = md5ii(b,c,d,a,w[i+5],21,-57434055);
    a = md5ii(a,b,c,d,w[i+12],6,1700485571); d = md5ii(d,a,b,c,w[i+3],10,-1894986606); c = md5ii(c,d,a,b,w[i+10],15,-1051523); b = md5ii(b,c,d,a,w[i+1],21,-2054922799);
    a = md5ii(a,b,c,d,w[i+8],6,1873313359); d = md5ii(d,a,b,c,w[i+15],10,-30611744); c = md5ii(c,d,a,b,w[i+6],15,-1560198380); b = md5ii(b,c,d,a,w[i+13],21,1309151649);
    a = md5ii(a,b,c,d,w[i+4],6,-145523070); d = md5ii(d,a,b,c,w[i+11],10,-1120210379); c = md5ii(c,d,a,b,w[i+2],15,718787259); b = md5ii(b,c,d,a,w[i+9],21,-343485551);
    a = safeAdd(a,aa); b = safeAdd(b,bb); c = safeAdd(c,cc); d = safeAdd(d,dd);
  }
  var hex = '';
  [a,b,c,d].forEach(n => { for (var j = 0; j < 4; j++) hex += ('0' + ((n >> (j*8)) & 0xFF).toString(16)).slice(-2); });
  return hex;
}

// ============================================================
//  profile.js — Page profil utilisateur
// ============================================================

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

    // Rang dans le classement
    const rank      = leaderboard.findIndex(u => u.id === user.uid) + 1;
    const rankLabel = rank === 0 ? '—' : rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;

    // Stats prédictions
    const total   = predictions.length;
    const correct = predictions.filter(p => p.result === 'correct' || p.result === 'perfect').length;
    const perfect = predictions.filter(p => p.result === 'perfect').length;
    const wrong   = predictions.filter(p => p.result === 'wrong').length;
    const pending = predictions.filter(p => p.result === null).length;
    const pct     = total > 0 ? Math.round((correct / (total - pending)) * 100) || 0 : 0;

    // Streak depuis Firebase (mis à jour par le resolver)
    const streak      = profile.streak || calculateStreak(predictions);
    const bestStreak  = profile.bestStreak || 0;
    const dayStreak   = profile.dayStreak || 0;
    const nextBonus   = 7 - (dayStreak % 7);

    el.innerHTML = `
      <!-- Header profil -->
      <div class="profile-header">
        <div id="profile-avatar-container"></div>
        <div class="profile-info">
          <div class="profile-username">${profile.username}</div>
          <div class="profile-email">${profile.email}</div>
          <div class="profile-since">Membre depuis ${formatDate(profile.createdAt)}</div>
          ${window.renderSeasonRankBadge ? window.renderSeasonRankBadge(profile.points, rank || 9999, 'normal') : (window.renderRankBadge ? window.renderRankBadge(profile.points, rank || 9999, 'normal') : '')}
        </div>
        <div class="profile-rank">${rankLabel}</div>
      </div>
      ${window.renderSeasonSection ? '' : (window.renderRankProgress ? window.renderRankProgress(profile.points, rank || 9999) : '')}

      <div class="daily-streak-wrap" id="daily-streak-section"></div>

      <!-- Ligne 1 : Prédictions / Réussite / Série -->
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
          <div class="profile-stat-value" style="color:#fbbf24">🔥 ${streak}</div>
          <div class="profile-stat-label">Série</div>
        </div>
      </div>

      <!-- Ligne 2 : Points saison + carrière -->
      <div class="profile-points-row">
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#a78bfa;font-size:28px">⭐ ${profile.points}</div>
          <div class="profile-stat-label">Points saison</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#fbbf24;font-size:22px">🏅 ${profile.totalPoints || profile.points}</div>
          <div class="profile-stat-label">Points carrière</div>
        </div>
      </div>

      <!-- Détail prédictions centré -->
      <div class="profile-pred-detail centered">
        <span class="pred-detail-item correct">✅ ${correct} correctes</span>
        <span class="pred-detail-item perfect">🏆 ${perfect} parfaites</span>
        <span class="pred-detail-item wrong">❌ ${wrong} manquées</span>
        <span class="pred-detail-item pending">⏳ ${pending} en attente</span>
      </div>

      <!-- Favoris -->
      ${favTeams.length > 0 || favGames.length > 0 ? `
      <div class="profile-section">
        <div class="profile-section-title">⭐ Mes Favoris</div>
        ${favGames.length > 0 ? `
        <div class="profile-favs-category">
          <div class="profile-favs-label">🎮 Jeux</div>
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
          <div class="profile-favs-label">🏆 Équipes</div>
          <div class="profile-favs-grid">
            ${favTeams.map(f => {
              const cfg    = EsportAPI.GAME_CONFIG[f.game];
              const colors = window.GENRE_COLORS?.[cfg?.genre] || {};
              const accent = colors.accent || '#a78bfa';
              let logo = null;
              if (window.matchStore) {
                for (const [, m] of window.matchStore) {
                  if (m.game === f.game) {
                    if (m.team1?.name?.toLowerCase() === f.teamName.toLowerCase() && m.team1?.logo) { logo = m.team1.logo; break; }
                    if (m.team2?.name?.toLowerCase() === f.teamName.toLowerCase() && m.team2?.logo) { logo = m.team2.logo; break; }
                  }
                }
              }
              const logoHtml = logo
                ? `<img src="${logo}" class="profile-fav-logo" onerror="this.style.display='none'">`
                : `<span class="profile-fav-dot" style="background:${accent}"></span>`;
              return `<div class="profile-fav-card team" style="border-color:${accent}30;cursor:pointer" onclick="document.getElementById('profile-modal')?.remove();showTeamDetail('${f.teamName.replace(/'/g,"\'")}','${f.game}')">
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

      <!-- Section saison -->
      <div id="season-section-wrap"></div>

      <!-- Historique prédictions -->
      <div class="profile-section">
        <div class="profile-section-title">📋 Dernières prédictions</div>
        ${predictions.length === 0
          ? '<div class="lb-empty">Aucune prédiction pour l\'instant.</div>'
          : predictions.slice(0, 10).map(p => renderPredRow(p)).join('')
        }
      </div>
    `;

    // Rendre le daily streak après que le HTML est injecté
    renderDailyStreak(dayStreak, nextBonus);

    // Rendre l'avatar
    const avatarColor = window.getSeasonRank ? window.getSeasonRank(profile.points).color : '#a78bfa';
    const avatarContainer = document.getElementById('profile-avatar-container');
    if (avatarContainer) {
      getAvatarHtml(profile.email || '', profile.username || '?', avatarColor, 64).then(html => {
        avatarContainer.innerHTML = html;
      });
    }

    // Rendre la section saison
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
  const icons  = { correct: '✅', perfect: '🏆', wrong: '❌', null: '⏳' };
  const icon   = icons[p.result] || '⏳';
  const pts    = p.points > 0 ? `+${p.points} pts` : '';
  const score  = (p.predictedScore1 !== null && p.predictedScore2 !== null)
    ? ` (${p.predictedScore1}-${p.predictedScore2})`
    : '';
  const cfg    = EsportAPI.GAME_CONFIG[p.game];
  const colors = window.GENRE_COLORS?.[cfg?.genre] || { accent: '#a78bfa' };
  const date   = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

  return `<div class="pred-history-row">
    <span class="pred-history-icon">${icon}</span>
    <div class="pred-history-info">
      <span class="pred-history-game" style="color:${colors.accent}">${cfg?.label || p.game}</span>
      <span class="pred-history-team">${p.predictedWinner}${score}</span>
      <span class="pred-history-match">vs ${p.team1 === p.predictedWinner ? p.team2 : p.team1}</span>
    </div>
    <div class="pred-history-right">
      ${pts ? `<span class="pred-history-pts">${pts}</span>` : ''}
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
  if (dayStreak === 0) {
    info = 'Faites une prédiction aujourd&apos;hui pour commencer votre série !';
  } else if (nextBonus === 7) {
    info = '🎉 Bonus de 7 jours atteint ! Prochain bonus dans 7 jours.';
  } else {
    info = 'Encore <strong>' + nextBonus + ' jour' + (nextBonus > 1 ? 's' : '') + '</strong> pour le bonus +5 pts !';
  }

  el.innerHTML = '<div class="daily-streak-title">📅 Activité quotidienne <span style="color:var(--text3);font-size:11px">— Bonus +5 pts tous les 7 jours</span></div>'
    + '<div class="daily-streak-bar">' + dayDots + '</div>'
    + '<div class="daily-streak-info">' + info + '</div>';
}

window.showProfilePage = showProfilePage;
console.log('[profile] chargé ✓');
