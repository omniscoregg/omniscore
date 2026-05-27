// ============================================================
//  seasons.js — Système de saisons Omniscore
//  3 saisons par an : Hiver/Printemps | Été | Automne
//  Reset des points + rangs + archives + badges
// ============================================================

// ----------------------------------------------------------
//  Définition des saisons
// ----------------------------------------------------------
var SEASONS = [
  {
    id: 1,
    name: { fr: 'Saison Hiver / Printemps', en: 'Winter / Spring Season', es: 'Temporada Invierno / Primavera' },
    short: { fr: 'Hiver·Printemps', en: 'Winter·Spring', es: 'Invierno·Primavera' },
    icon: '❄️',
    startMonth: 1,  // Janvier
    startDay: 1,
    endMonth: 4,    // Fin Avril
    endDay: 30,
  },
  {
    id: 2,
    name: { fr: 'Saison Été', en: 'Summer Season', es: 'Temporada Verano' },
    short: { fr: 'Été', en: 'Summer', es: 'Verano' },
    icon: '☀️',
    startMonth: 5,  // Mai
    startDay: 1,
    endMonth: 8,    // Fin Août
    endDay: 31,
  },
  {
    id: 3,
    name: { fr: 'Saison Automne', en: 'Autumn Season', es: 'Temporada Otoño' },
    short: { fr: 'Automne', en: 'Autumn', es: 'Otoño' },
    icon: '🍂',
    startMonth: 9,  // Septembre
    startDay: 1,
    endMonth: 12,   // Fin Décembre
    endDay: 31,
  },
];

// ----------------------------------------------------------
//  Seuils de rangs saisonniers (÷4 des rangs globaux)
// ----------------------------------------------------------
var SEASON_RANKS = [
  { name: 'Bronze',   star: 1, min: 0,    max: 7,    color: '#cd7f32', icon: '🥉', bg: '#1a0f00' },
  { name: 'Bronze',   star: 2, min: 8,    max: 14,   color: '#cd7f32', icon: '🥉', bg: '#1a0f00' },
  { name: 'Bronze',   star: 3, min: 15,   max: 24,   color: '#cd7f32', icon: '🥉', bg: '#1a0f00' },
  { name: 'Argent',   star: 1, min: 25,   max: 37,   color: '#c0c0c0', icon: '🥈', bg: '#1a1a1a' },
  { name: 'Argent',   star: 2, min: 38,   max: 49,   color: '#c0c0c0', icon: '🥈', bg: '#1a1a1a' },
  { name: 'Argent',   star: 3, min: 50,   max: 74,   color: '#c0c0c0', icon: '🥈', bg: '#1a1a1a' },
  { name: 'Or',       star: 1, min: 75,   max: 99,   color: '#ffd700', icon: '🥇', bg: '#1a1500' },
  { name: 'Or',       star: 2, min: 100,  max: 124,  color: '#ffd700', icon: '🥇', bg: '#1a1500' },
  { name: 'Or',       star: 3, min: 125,  max: 174,  color: '#ffd700', icon: '🥇', bg: '#1a1500' },
  { name: 'Platine',  star: 1, min: 175,  max: 224,  color: '#00d4ff', icon: '💎', bg: '#001a1a' },
  { name: 'Platine',  star: 2, min: 225,  max: 299,  color: '#00d4ff', icon: '💎', bg: '#001a1a' },
  { name: 'Platine',  star: 3, min: 300,  max: 374,  color: '#00d4ff', icon: '💎', bg: '#001a1a' },
  { name: 'Diamant',  star: 1, min: 375,  max: 499,  color: '#b9f2ff', icon: '💠', bg: '#001020' },
  { name: 'Diamant',  star: 2, min: 500,  max: 624,  color: '#b9f2ff', icon: '💠', bg: '#001020' },
  { name: 'Diamant',  star: 3, min: 625,  max: 749,  color: '#b9f2ff', icon: '💠', bg: '#001020' },
  { name: 'Maître',   star: 1, min: 750,  max: 999,  color: '#a855f7', icon: '🔮', bg: '#150020' },
  { name: 'Maître',   star: 2, min: 1000, max: 1249, color: '#a855f7', icon: '🔮', bg: '#150020' },
  { name: 'Maître',   star: 3, min: 1250, max: 1749, color: '#a855f7', icon: '🔮', bg: '#150020' },
  { name: 'Champion', star: 1, min: 1750, max: 2249, color: '#f97316', icon: '👑', bg: '#1a0800' },
  { name: 'Champion', star: 2, min: 2250, max: 2999, color: '#f97316', icon: '👑', bg: '#1a0800' },
  { name: 'Champion', star: 3, min: 3000, max: Infinity, color: '#f97316', icon: '👑', bg: '#1a0800' },
];

var SEASON_OMNI_RANK = {
  name: 'OMNI', star: 0, color: '#ffffff', icon: '⚡', bg: '#0a0a0a',
  glow: true, special: true,
};

// ----------------------------------------------------------
//  Badges de fin de saison
// ----------------------------------------------------------
var SEASON_BADGES = {
  rank1:    { icon: '🥇', label: { fr: '1er Global',    en: '1st Global',    es: '1° Global'    }, color: '#ffd700' },
  rank2:    { icon: '🥈', label: { fr: '2ème Global',   en: '2nd Global',    es: '2° Global'    }, color: '#c0c0c0' },
  rank3:    { icon: '🥉', label: { fr: '3ème Global',   en: '3rd Global',    es: '3° Global'    }, color: '#cd7f32' },
  top10:    { icon: '🏅', label: { fr: 'Top 10',        en: 'Top 10',        es: 'Top 10'       }, color: '#4ade80' },
  top50:    { icon: '🎖️', label: { fr: 'Top 50',        en: 'Top 50',        es: 'Top 50'       }, color: '#38bdf8' },
  top100:   { icon: '🎗️', label: { fr: 'Top 100',       en: 'Top 100',       es: 'Top 100'      }, color: '#a78bfa' },
  champion: { icon: '👑', label: { fr: 'Champion',      en: 'Champion',      es: 'Campeón'      }, color: '#f97316' },
  omni:     { icon: '⚡', label: { fr: 'OMNI',          en: 'OMNI',          es: 'OMNI'         }, color: '#ffffff' },
  played:   { icon: '🎮', label: { fr: 'Participant',   en: 'Participant',   es: 'Participante' }, color: '#8892a4' },
};

// ----------------------------------------------------------
//  Obtenir la saison courante
// ----------------------------------------------------------
function getCurrentSeason(date) {
  date = date || new Date();
  const month = date.getMonth() + 1;
  const day   = date.getDate();
  const year  = date.getFullYear();

  for (var s of SEASONS) {
    const start = new Date(year, s.startMonth - 1, s.startDay);
    const end   = new Date(year, s.endMonth - 1, s.endDay, 23, 59, 59);
    if (date >= start && date <= end) {
      return { ...s, year, seasonKey: `${year}-S${s.id}` };
    }
  }
  return { ...SEASONS[0], year, seasonKey: `${year}-S1` };
}

// ----------------------------------------------------------
//  Obtenir la saison précédente
// ----------------------------------------------------------
function getPreviousSeason(date) {
  date = date || new Date();
  const current = getCurrentSeason(date);
  const idx     = SEASONS.findIndex(s => s.id === current.id);
  if (idx === 0) {
    // Retourner à la saison 3 de l'année précédente
    return { ...SEASONS[2], year: current.year - 1, seasonKey: `${current.year - 1}-S3` };
  }
  return { ...SEASONS[idx - 1], year: current.year, seasonKey: `${current.year}-S${SEASONS[idx - 1].id}` };
}

// ----------------------------------------------------------
//  Jours restants dans la saison
// ----------------------------------------------------------
function getDaysLeftInSeason(date) {
  date = date || new Date();
  const season = getCurrentSeason(date);
  const end    = new Date(season.year, season.endMonth - 1, season.endDay, 23, 59, 59);
  return Math.ceil((end - date) / 86400000);
}

// ----------------------------------------------------------
//  Rang saisonnier
// ----------------------------------------------------------
function getSeasonRank(seasonPoints, globalRank) {
  if (globalRank !== null && globalRank !== undefined && globalRank <= 500) return SEASON_OMNI_RANK;
  for (var i = SEASON_RANKS.length - 1; i >= 0; i--) {
    if (seasonPoints >= SEASON_RANKS[i].min) return SEASON_RANKS[i];
  }
  return SEASON_RANKS[0];
}

// ----------------------------------------------------------
//  Rendu badge rang saisonnier
// ----------------------------------------------------------
function renderSeasonRankBadge(seasonPoints, globalRank, size) {
  size = size || 'normal';
  const rank   = getSeasonRank(seasonPoints, globalRank);
  const stars  = rank.star > 0 ? '⭐'.repeat(rank.star) : '';
  const isOmni = rank.special;

  if (size === 'small') {
    return '<span class="rank-badge rank-badge-small ' + (isOmni ? 'rank-omni' : '') + '" style="color:' + rank.color + ';background:' + rank.bg + '">'
      + rank.icon + ' ' + rank.name + '</span>';
  }

  return '<div class="rank-badge-normal ' + (isOmni ? 'rank-omni' : '') + '" style="color:' + rank.color + ';background:' + rank.bg + ';border-color:' + rank.color + '40">'
    + '<span class="rank-icon-sm">' + rank.icon + '</span>'
    + '<span class="rank-name-sm">' + rank.name + '</span>'
    + (stars ? '<span class="rank-stars-sm">' + stars + '</span>' : '<span class="rank-stars-sm" style="color:#ffd700">TOP 500</span>')
    + '</div>';
}

// ----------------------------------------------------------
//  Firebase — lire/écrire points saisonniers
// ----------------------------------------------------------
async function getSeasonPoints(uid) {
  try {
    const season = getCurrentSeason();
    const snap   = await firebase.firestore()
      .collection('users').doc(uid)
      .collection('seasons').doc(season.seasonKey)
      .get();
    return snap.exists ? (snap.data().points || 0) : 0;
  } catch(e) { return 0; }
}

async function addSeasonPoints(uid, pts) {
  try {
    const season = getCurrentSeason();
    const ref    = firebase.firestore()
      .collection('users').doc(uid)
      .collection('seasons').doc(season.seasonKey);
    await ref.set({
      points:    firebase.firestore.FieldValue.increment(pts),
      seasonId:  season.id,
      seasonKey: season.seasonKey,
      year:      season.year,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch(e) { console.error('[Season] addSeasonPoints:', e); }
}

// ----------------------------------------------------------
//  Firebase — classement saisonnier
// ----------------------------------------------------------
async function getSeasonLeaderboard(limit) {
  limit = limit || 100;
  try {
    const season = getCurrentSeason();
    const snap   = await firebase.firestore()
      .collectionGroup('seasons')
      .where('seasonKey', '==', season.seasonKey)
      .orderBy('points', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => ({
      uid:    d.ref.parent.parent.id,
      points: d.data().points || 0,
      ...d.data(),
    }));
  } catch(e) {
    console.error('[Season] getSeasonLeaderboard:', e);
    return [];
  }
}

// ----------------------------------------------------------
//  Firebase — archives d'un utilisateur
// ----------------------------------------------------------
async function getUserSeasonArchives(uid) {
  try {
    const snap = await firebase.firestore()
      .collection('users').doc(uid)
      .collection('seasons')
      .orderBy('seasonKey', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { return []; }
}

// ----------------------------------------------------------
//  Firebase — sauvegarder badge de fin de saison
// ----------------------------------------------------------
async function saveSeasonBadge(uid, seasonKey, badgeKey, rank) {
  try {
    await firebase.firestore()
      .collection('users').doc(uid)
      .collection('seasons').doc(seasonKey)
      .set({
        badge:       badgeKey,
        finalRank:   rank,
        completedAt: new Date().toISOString(),
      }, { merge: true });
  } catch(e) { console.error('[Season] saveSeasonBadge:', e); }
}

// ----------------------------------------------------------
//  Déterminer le badge selon le classement final
// ----------------------------------------------------------
function getBadgeForRank(rank) {
  if (rank === 1)        return 'rank1';
  if (rank === 2)        return 'rank2';
  if (rank === 3)        return 'rank3';
  if (rank <= 10)        return 'top10';
  if (rank <= 50)        return 'top50';
  if (rank <= 100)       return 'top100';
  return 'played';
}

// ----------------------------------------------------------
//  Rendu d'un badge
// ----------------------------------------------------------
function renderSeasonBadge(badgeKey, seasonKey, lang) {
  lang = lang || 'fr';
  const badge = SEASON_BADGES[badgeKey];
  if (!badge) return '';
  const label = badge.label[lang] || badge.label.fr;

  // Parser le seasonKey ex: "2026-S2"
  const parts     = (seasonKey || '').split('-S');
  const year      = parts[0] || '';
  const seasonId  = parseInt(parts[1]) || 0;
  const season    = SEASONS.find(s => s.id === seasonId);
  const sName     = season ? (season.short[lang] || season.short.fr) : '';
  const sIcon     = season ? season.icon : '🏆';

  return '<div class="season-badge" style="border-color:' + badge.color + '40">'
    + '<span class="season-badge-icon">' + badge.icon + '</span>'
    + '<div class="season-badge-info">'
    + '<span class="season-badge-label" style="color:' + badge.color + '">' + label + '</span>'
    + '<span class="season-badge-season">' + sIcon + ' ' + sName + ' ' + year + '</span>'
    + '</div>'
    + '</div>';
}

// ----------------------------------------------------------
//  Section saison dans le profil
// ----------------------------------------------------------
async function renderSeasonSection(uid, globalRank, lang) {
  lang = lang || 'fr';
  const season      = getCurrentSeason();
  const daysLeft    = getDaysLeftInSeason();
  const seasonPts   = await getSeasonPoints(uid);
  const seasonRank  = getSeasonRank(seasonPts, globalRank);
  const archives    = await getUserSeasonArchives(uid);
  const nextRankIdx = SEASON_RANKS.indexOf(seasonRank);
  const nextRank    = nextRankIdx < SEASON_RANKS.length - 1 ? SEASON_RANKS[nextRankIdx + 1] : null;
  const progress    = nextRank
    ? Math.min(100, Math.round(((seasonPts - seasonRank.min) / (nextRank.min - seasonRank.min)) * 100))
    : 100;

  const titles = {
    fr: { season: 'Saison en cours', pts: 'pts saisonniers', daysLeft: 'jours restants', history: 'Historique des saisons', noBadge: 'Aucun badge encore' },
    en: { season: 'Current Season',  pts: 'season pts',      daysLeft: 'days left',       history: 'Season History',         noBadge: 'No badge yet' },
    es: { season: 'Temporada actual',pts: 'pts temporada',   daysLeft: 'días restantes',   history: 'Historial de temporadas',noBadge: 'Sin insignia aún' },
  };
  const T = titles[lang] || titles.fr;

  // Badges des saisons passées (sans la saison courante)
  const pastSeasons = archives.filter(a => a.seasonKey !== season.seasonKey && a.badge);

  const badgesHtml = pastSeasons.length > 0
    ? pastSeasons.map(a => renderSeasonBadge(a.badge, a.seasonKey, lang)).join('')
    : '<div class="season-no-badge">' + T.noBadge + '</div>';

  return `
    <div class="profile-section season-section">
      <div class="profile-section-title">${season.icon} ${T.season} — ${season.name[lang] || season.name.fr} ${season.year}</div>

      <div class="season-current">
        <div class="season-stats-row">
          <div class="season-stat">
            <div class="season-stat-value" style="color:${seasonRank.color}">⭐ ${seasonPts}</div>
            <div class="season-stat-label">${T.pts}</div>
          </div>
          <div class="season-stat">
            ${renderSeasonRankBadge(seasonPts, globalRank, 'normal')}
          </div>
          <div class="season-stat">
            <div class="season-stat-value" style="color:${daysLeft <= 14 ? '#f87171' : '#8892a4'}">${daysLeft}</div>
            <div class="season-stat-label">${T.daysLeft}</div>
          </div>
        </div>

        ${nextRank ? `
        <div class="season-progress-wrap">
          <div class="season-progress-label">
            <span style="color:${seasonRank.color}">${seasonRank.icon} ${seasonRank.name} ${'⭐'.repeat(seasonRank.star)}</span>
            <span style="color:var(--text3)"> → </span>
            <span style="color:${nextRank.color}">${nextRank.icon} ${nextRank.name} ${'⭐'.repeat(nextRank.star)}</span>
          </div>
          <div class="rank-progress-bar">
            <div class="rank-progress-fill" style="width:${progress}%;background:${seasonRank.color}"></div>
          </div>
          <div class="rank-progress-pts">${seasonPts} / ${nextRank.min} pts · encore <strong>${nextRank.min - seasonPts} pts</strong></div>
        </div>` : '<div class="rank-progress-wrap"><div class="rank-progress-label">🏆 Rang maximum atteint !</div></div>'}
      </div>

      ${pastSeasons.length > 0 ? `
      <div class="season-history">
        <div class="season-history-title">🏅 ${T.history}</div>
        <div class="season-badges-list">${badgesHtml}</div>
      </div>` : ''}
    </div>
  `;
}

// ----------------------------------------------------------
//  Classement saisonnier (pour la page classement)
// ----------------------------------------------------------
async function renderSeasonLeaderboard(container, lang) {
  lang = lang || 'fr';
  container.innerHTML = '<div class="lb-loading">Chargement...</div>';

  try {
    const [board, season] = await Promise.all([
      getSeasonLeaderboard(100),
      Promise.resolve(getCurrentSeason()),
    ]);

    if (board.length === 0) {
      container.innerHTML = '<div class="lb-empty">Aucun joueur cette saison.</div>';
      return;
    }

    // Récupérer les usernames
    const uids     = board.map(u => u.uid);
    const profiles = await Promise.all(
      uids.slice(0, 20).map(uid =>
        firebase.firestore().collection('users').doc(uid).get()
          .then(d => ({ uid, ...d.data() }))
          .catch(() => ({ uid, username: '—' }))
      )
    );
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.uid] = p; });

    const rows = board.map((u, i) => {
      const profile  = profileMap[u.uid] || {};
      const username = profile.username || '—';
      const rank     = getSeasonRank(u.points, i + 1);
      const rankStr  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
      const isMe     = window.FirebaseService?.getCurrentUser()?.uid === u.uid;

      return '<tr class="' + (isMe ? 'lb-me' : '') + '">'
        + '<td class="lb-rank">' + rankStr + '</td>'
        + '<td class="lb-name">' + username + (isMe ? ' <span style="color:var(--text3);font-size:10px">(vous)</span>' : '') + '</td>'
        + '<td class="lb-pts">⭐ ' + u.points + '</td>'
        + '<td>' + renderSeasonRankBadge(u.points, i + 1, 'small') + '</td>'
        + '</tr>';
    }).join('');

    container.innerHTML = '<table class="lb-table">'
      + '<thead><tr><th>#</th><th>Joueur</th><th>Pts Saison</th><th>Rang</th></tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>';

  } catch(e) {
    console.error('[Season] renderSeasonLeaderboard:', e);
    container.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}

// ----------------------------------------------------------
//  Exposer globalement
// ----------------------------------------------------------
window.SEASONS              = window.SEASONS || SEASONS;
window.SEASON_RANKS         = SEASON_RANKS;
window.SEASON_BADGES        = SEASON_BADGES;
window.getCurrentSeason     = getCurrentSeason;
window.getPreviousSeason    = getPreviousSeason;
window.getDaysLeftInSeason  = getDaysLeftInSeason;
window.getSeasonRank        = getSeasonRank;
window.getSeasonPoints      = getSeasonPoints;
window.addSeasonPoints      = addSeasonPoints;
window.getSeasonLeaderboard = getSeasonLeaderboard;
window.getUserSeasonArchives = getUserSeasonArchives;
window.saveSeasonBadge      = saveSeasonBadge;
window.getBadgeForRank      = getBadgeForRank;
window.renderSeasonBadge    = renderSeasonBadge;
window.renderSeasonSection  = renderSeasonSection;
window.renderSeasonRankBadge = renderSeasonRankBadge;
window.renderSeasonLeaderboard = renderSeasonLeaderboard;

console.log('[seasons] chargé ✓');
