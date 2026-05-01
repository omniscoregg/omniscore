// ============================================================
//  ranks.js — Système de rangs OmniScore
// ============================================================

const RANKS = [
  // Bronze
  { name: 'Bronze',   star: 1, min: 0,     max: 29,    color: '#cd7f32', icon: '🥉', bg: '#1a0f00' },
  { name: 'Bronze',   star: 2, min: 30,    max: 59,    color: '#cd7f32', icon: '🥉', bg: '#1a0f00' },
  { name: 'Bronze',   star: 3, min: 60,    max: 99,    color: '#cd7f32', icon: '🥉', bg: '#1a0f00' },
  // Argent
  { name: 'Argent',   star: 1, min: 100,   max: 149,   color: '#c0c0c0', icon: '🥈', bg: '#1a1a1a' },
  { name: 'Argent',   star: 2, min: 150,   max: 199,   color: '#c0c0c0', icon: '🥈', bg: '#1a1a1a' },
  { name: 'Argent',   star: 3, min: 200,   max: 299,   color: '#c0c0c0', icon: '🥈', bg: '#1a1a1a' },
  // Or
  { name: 'Or',       star: 1, min: 300,   max: 399,   color: '#ffd700', icon: '🥇', bg: '#1a1500' },
  { name: 'Or',       star: 2, min: 400,   max: 499,   color: '#ffd700', icon: '🥇', bg: '#1a1500' },
  { name: 'Or',       star: 3, min: 500,   max: 699,   color: '#ffd700', icon: '🥇', bg: '#1a1500' },
  // Platine
  { name: 'Platine',  star: 1, min: 700,   max: 899,   color: '#00d4ff', icon: '💎', bg: '#001a1a' },
  { name: 'Platine',  star: 2, min: 900,   max: 1199,  color: '#00d4ff', icon: '💎', bg: '#001a1a' },
  { name: 'Platine',  star: 3, min: 1200,  max: 1499,  color: '#00d4ff', icon: '💎', bg: '#001a1a' },
  // Diamant
  { name: 'Diamant',  star: 1, min: 1500,  max: 1999,  color: '#b9f2ff', icon: '💠', bg: '#001020' },
  { name: 'Diamant',  star: 2, min: 2000,  max: 2499,  color: '#b9f2ff', icon: '💠', bg: '#001020' },
  { name: 'Diamant',  star: 3, min: 2500,  max: 2999,  color: '#b9f2ff', icon: '💠', bg: '#001020' },
  // Maître
  { name: 'Maître',   star: 1, min: 3000,  max: 3999,  color: '#a855f7', icon: '🔮', bg: '#150020' },
  { name: 'Maître',   star: 2, min: 4000,  max: 4999,  color: '#a855f7', icon: '🔮', bg: '#150020' },
  { name: 'Maître',   star: 3, min: 5000,  max: 6999,  color: '#a855f7', icon: '🔮', bg: '#150020' },
  // Champion
  { name: 'Champion', star: 1, min: 7000,  max: 8999,  color: '#f97316', icon: '👑', bg: '#1a0800' },
  { name: 'Champion', star: 2, min: 9000,  max: 11999, color: '#f97316', icon: '👑', bg: '#1a0800' },
  { name: 'Champion', star: 3, min: 12000, max: Infinity, color: '#f97316', icon: '👑', bg: '#1a0800' },
];

const OMNI_RANK = {
  name: 'OMNI', star: 0, color: '#ffffff', icon: '⚡', bg: '#0a0a0a',
  glow: true, special: true,
};

// ----------------------------------------------------------
//  Obtenir le rang selon les points (et optionnellement le rang global)
// ----------------------------------------------------------
function getRank(points, globalRank = null) {
  // Top 500 = OMNI
  if (globalRank !== null && globalRank <= 500) return OMNI_RANK;

  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

// ----------------------------------------------------------
//  Rendu du badge de rang
// ----------------------------------------------------------
function renderRankBadge(points, globalRank = null, size = 'normal') {
  const rank  = getRank(points, globalRank);
  const stars = rank.star > 0 ? '⭐'.repeat(rank.star) : '';
  const isOmni = rank.special;

  if (size === 'small') {
    return '<span class="rank-badge rank-badge-small ' + (isOmni ? 'rank-omni' : '') + '" style="color:' + rank.color + ';background:' + rank.bg + ';' + (isOmni ? 'box-shadow:0 0 8px ' + rank.color + '40' : '') + '">'
      + rank.icon + ' ' + rank.name
      + '</span>';
  }

  if (size === 'large') {
    return '<div class="rank-badge-large ' + (isOmni ? 'rank-omni' : '') + '" style="color:' + rank.color + ';background:' + rank.bg + ';border-color:' + rank.color + '40;' + (isOmni ? 'box-shadow:0 0 20px ' + rank.color + '60' : '') + '">'
      + '<div class="rank-icon">' + rank.icon + '</div>'
      + '<div class="rank-name">' + rank.name + '</div>'
      + (stars ? '<div class="rank-stars">' + stars + '</div>' : '<div class="rank-stars" style="color:#ffd700;font-size:14px">TOP 500</div>')
      + '</div>';
  }

  // Normal
  return '<div class="rank-badge-normal ' + (isOmni ? 'rank-omni' : '') + '" style="color:' + rank.color + ';background:' + rank.bg + ';border-color:' + rank.color + '40">'
    + '<span class="rank-icon-sm">' + rank.icon + '</span>'
    + '<span class="rank-name-sm">' + rank.name + '</span>'
    + (stars ? '<span class="rank-stars-sm">' + stars + '</span>' : '<span class="rank-stars-sm" style="color:#ffd700">TOP 500</span>')
    + '</div>';
}

// ----------------------------------------------------------
//  Barre de progression vers le prochain rang
// ----------------------------------------------------------
function renderRankProgress(points, globalRank = null) {
  if (globalRank !== null && globalRank <= 500) {
    return '<div class="rank-progress-wrap">'
      + '<div class="rank-progress-label">⚡ Vous êtes dans le TOP 500 !</div>'
      + '</div>';
  }

  const rank = getRank(points);
  const rankIndex = RANKS.indexOf(rank);

  if (rankIndex === RANKS.length - 1) {
    return '<div class="rank-progress-wrap"><div class="rank-progress-label">Rang maximum atteint !</div></div>';
  }

  const nextRank = RANKS[rankIndex + 1];
  const progress = Math.round(((points - rank.min) / (rank.max - rank.min + 1)) * 100);
  const ptsLeft  = rank.max + 1 - points;

  return '<div class="rank-progress-wrap">'
    + '<div class="rank-progress-label">'
    + '<span style="color:' + rank.color + '">' + rank.icon + ' ' + rank.name + ' ' + '⭐'.repeat(rank.star) + '</span>'
    + '<span style="color:var(--text3)"> → </span>'
    + '<span style="color:' + nextRank.color + '">' + nextRank.icon + ' ' + nextRank.name + ' ' + '⭐'.repeat(nextRank.star) + '</span>'
    + '</div>'
    + '<div class="rank-progress-bar">'
    + '<div class="rank-progress-fill" style="width:' + progress + '%;background:' + rank.color + '"></div>'
    + '</div>'
    + '<div class="rank-progress-pts">' + points + ' / ' + (rank.max + 1) + ' pts · encore <strong>' + ptsLeft + ' pts</strong></div>'
    + '</div>';
}

window.getRank          = getRank;
window.renderRankBadge  = renderRankBadge;
window.renderRankProgress = renderRankProgress;
window.RANKS            = RANKS;
window.OMNI_RANK        = OMNI_RANK;

console.log('[ranks] chargé ✓');
