// ============================================================
//  share.js — Cartes de partage Omniscore
//  Génère des images PNG via canvas HTML
//  3 types : prédiction match, stats saison, stats globales
// ============================================================

const SHARE_W = 1080;
const SHARE_H = 1080;

// ----------------------------------------------------------
//  Utilitaires canvas
// ----------------------------------------------------------
function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width  = SHARE_W;
  canvas.height = SHARE_H;
  return canvas;
}

function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function drawGradientBg(ctx, color1, color2) {
  const grad = ctx.createLinearGradient(0, 0, SHARE_W, SHARE_H);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);
}

function drawGrid(ctx) {
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth   = 1;
  for (let x = 0; x < SHARE_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SHARE_H); ctx.stroke();
  }
  for (let y = 0; y < SHARE_H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SHARE_W, y); ctx.stroke();
  }
}

function drawLogo(ctx) {
  ctx.font      = 'bold 36px system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur  = 15;
  ctx.textAlign   = 'left';
  ctx.fillText('⚡ OMNISCORE', 60, 80);
  ctx.shadowBlur  = 0;
  ctx.font        = '16px system-ui, sans-serif';
  ctx.fillStyle   = '#4a5568';
  ctx.fillText('omniscore.pages.dev', 60, 105);
}

function drawUsername(ctx, username, rankName, rankColor, rankIcon) {
  ctx.textAlign   = 'right';
  ctx.font        = 'bold 24px system-ui, sans-serif';
  ctx.fillStyle   = '#e8eaf0';
  ctx.fillText(username, SHARE_W - 60, 80);
  ctx.font        = '18px system-ui, sans-serif';
  ctx.fillStyle   = rankColor || '#a78bfa';
  ctx.fillText(`${rankIcon || '🔮'} ${rankName || 'Maître'}`, SHARE_W - 60, 108);
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

async function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ----------------------------------------------------------
//  1. Carte Prédiction Match
// ----------------------------------------------------------
async function shareMatchPrediction(matchData) {
  const { team1, team2, score1, score2, result, points, game, tournament, predictedWinner, predictedScore1, predictedScore2, username, rankName, rankColor, rankIcon } = matchData;

  const canvas = createCanvas();
  const ctx    = canvas.getContext('2d');

  // Couleurs selon résultat
  const colors = {
    perfect: { accent: '#fbbf24', bg1: '#1a1200', bg2: '#0a0800', label: '🏆 PARFAIT !', pts: `+${points} pts` },
    correct: { accent: '#4ade80', bg1: '#001a00', bg2: '#000a00', label: '✅ CORRECT',   pts: `+${points} pts` },
    wrong:   { accent: '#f87171', bg1: '#1a0000', bg2: '#0a0000', label: '❌ MANQUÉ',    pts: '' },
  };
  const c = colors[result] || colors.wrong;

  // Fond
  drawGradientBg(ctx, c.bg1, '#0a0b10');
  drawGrid(ctx);

  // Bordure colorée
  ctx.strokeStyle = c.accent + '60';
  ctx.lineWidth   = 3;
  ctx.strokeRect(20, 20, SHARE_W - 40, SHARE_H - 40);

  // Glow haut
  const glowGrad = ctx.createLinearGradient(0, 0, SHARE_W, 0);
  glowGrad.addColorStop(0, 'transparent');
  glowGrad.addColorStop(0.5, c.accent + '30');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(20, 20, SHARE_W - 40, 4);

  // Logo + username
  drawLogo(ctx);
  drawUsername(ctx, username, rankName, rankColor, rankIcon);

  // Résultat badge
  ctx.textAlign   = 'center';
  ctx.font        = 'bold 72px system-ui, sans-serif';
  ctx.fillStyle   = c.accent;
  ctx.shadowColor = c.accent;
  ctx.shadowBlur  = 30;
  ctx.fillText(c.label, SHARE_W / 2, 260);
  ctx.shadowBlur  = 0;

  if (c.pts) {
    ctx.font      = 'bold 36px system-ui, sans-serif';
    ctx.fillStyle = c.accent;
    ctx.fillText(c.pts, SHARE_W / 2, 320);
  }

  // Séparateur
  const sepGrad = ctx.createLinearGradient(60, 0, SHARE_W - 60, 0);
  sepGrad.addColorStop(0, 'transparent');
  sepGrad.addColorStop(0.5, c.accent + '80');
  sepGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(60, 370); ctx.lineTo(SHARE_W - 60, 370); ctx.stroke();

  // Match
  ctx.font      = '20px system-ui, sans-serif';
  ctx.fillStyle = '#4a5568';
  ctx.fillText(game + (tournament ? ' · ' + tournament : ''), SHARE_W / 2, 420);

  // Équipes + score
  ctx.font        = 'bold 52px system-ui, sans-serif';
  ctx.fillStyle   = '#e8eaf0';
  ctx.textAlign   = 'left';
  ctx.fillText(team1, 60, 510);
  ctx.textAlign   = 'right';
  ctx.fillText(team2, SHARE_W - 60, 510);

  // Score
  ctx.textAlign   = 'center';
  ctx.font        = 'bold 80px system-ui, sans-serif';
  ctx.fillStyle   = '#ffffff';
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  ctx.shadowBlur  = 10;
  ctx.fillText(`${score1}  :  ${score2}`, SHARE_W / 2, 510);
  ctx.shadowBlur  = 0;

  // Séparateur 2
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath(); ctx.moveTo(60, 560); ctx.lineTo(SHARE_W - 60, 560); ctx.stroke();

  // Prédiction
  ctx.font      = '20px system-ui, sans-serif';
  ctx.fillStyle = '#4a5568';
  ctx.fillText('Ta prédiction', SHARE_W / 2, 620);

  ctx.font      = 'bold 36px system-ui, sans-serif';
  ctx.fillStyle = '#8892a4';
  const predScore = (predictedScore1 !== null && predictedScore2 !== null)
    ? ` (${predictedScore1}-${predictedScore2})` : '';
  ctx.fillText(predictedWinner + predScore, SHARE_W / 2, 670);

  // Footer
  drawRoundedRect(ctx, 60, SHARE_H - 120, SHARE_W - 120, 60, 12, 'rgba(255,255,255,0.05)', null);
  ctx.font      = '20px system-ui, sans-serif';
  ctx.fillStyle = '#4a5568';
  ctx.fillText('Rejoins-nous sur omniscore.pages.dev', SHARE_W / 2, SHARE_H - 80);

  downloadCanvas(canvas, `omniscore-prediction-${team1}-vs-${team2}.png`);
  showShareToast();
}

// ----------------------------------------------------------
//  2. Carte Stats Saison
// ----------------------------------------------------------
async function shareSeasonStats(statsData) {
  const { username, rankName, rankColor, rankIcon, seasonPoints, seasonName, seasonIcon, daysLeft, predCount, pct, perfect } = statsData;

  const canvas = createCanvas();
  const ctx    = canvas.getContext('2d');

  drawGradientBg(ctx, '#0d0a1a', '#0a0b10');
  drawGrid(ctx);

  ctx.strokeStyle = (rankColor || '#a78bfa') + '40';
  ctx.lineWidth   = 3;
  ctx.strokeRect(20, 20, SHARE_W - 40, SHARE_H - 40);

  const glowGrad = ctx.createLinearGradient(0, 0, SHARE_W, 0);
  glowGrad.addColorStop(0, 'transparent');
  glowGrad.addColorStop(0.5, (rankColor || '#a78bfa') + '40');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(20, 20, SHARE_W - 40, 4);

  drawLogo(ctx);
  drawUsername(ctx, username, rankName, rankColor, rankIcon);

  // Titre saison
  ctx.textAlign   = 'center';
  ctx.font        = 'bold 28px system-ui, sans-serif';
  ctx.fillStyle   = '#8892a4';
  ctx.fillText(`${seasonIcon || '☀️'} ${seasonName || 'Saison en cours'}`, SHARE_W / 2, 200);

  // Points saison
  ctx.font        = 'bold 120px system-ui, sans-serif';
  ctx.fillStyle   = rankColor || '#a78bfa';
  ctx.shadowColor = rankColor || '#a78bfa';
  ctx.shadowBlur  = 40;
  ctx.fillText(seasonPoints, SHARE_W / 2, 360);
  ctx.shadowBlur  = 0;
  ctx.font        = '28px system-ui, sans-serif';
  ctx.fillStyle   = '#4a5568';
  ctx.fillText('points saison', SHARE_W / 2, 410);

  // Rang
  ctx.font        = 'bold 48px system-ui, sans-serif';
  ctx.fillStyle   = rankColor || '#a78bfa';
  ctx.shadowColor = rankColor || '#a78bfa';
  ctx.shadowBlur  = 20;
  ctx.fillText(`${rankIcon} ${rankName}`, SHARE_W / 2, 490);
  ctx.shadowBlur  = 0;

  // Séparateur
  const sepGrad = ctx.createLinearGradient(60, 0, SHARE_W - 60, 0);
  sepGrad.addColorStop(0, 'transparent');
  sepGrad.addColorStop(0.5, (rankColor || '#a78bfa') + '60');
  sepGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 540); ctx.lineTo(SHARE_W - 60, 540); ctx.stroke();

  // Stats en grille
  const stats = [
    { label: 'Prédictions', value: predCount },
    { label: 'Réussite', value: pct + '%' },
    { label: 'Parfaites', value: '🏆 ' + perfect },
    { label: 'Jours restants', value: daysLeft + 'j' },
  ];

  const PAD = 60, GAP = 20;
  const BW  = (SHARE_W - PAD * 2 - GAP) / 2;
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx  = PAD + col * (BW + GAP);
    const by  = 610 + row * 120;
    drawRoundedRect(ctx, bx, by, BW, 100, 12, 'rgba(255,255,255,0.04)', null);
    ctx.textAlign = 'center';
    ctx.font      = 'bold 40px system-ui, sans-serif';
    ctx.fillStyle = s.color || '#e8eaf0';
    ctx.fillText(s.value, bx + BW / 2, by + 55);
    ctx.font      = '18px system-ui, sans-serif';
    ctx.fillStyle = '#4a5568';
    ctx.fillText(s.label, bx + BW / 2, by + 85);
  });

  // Footer
  ctx.textAlign = 'center';
  ctx.font      = '20px system-ui, sans-serif';
  ctx.fillStyle = '#4a5568';
  ctx.fillText('omniscore.pages.dev', SHARE_W / 2, SHARE_H - 40);

  downloadCanvas(canvas, `omniscore-saison-${username}.png`);
  showShareToast();
}

// ----------------------------------------------------------
//  3. Carte Stats Globales
// ----------------------------------------------------------
async function shareGlobalStats(statsData) {
  const { username, rankName, rankColor, rankIcon, totalPoints, predCount, pct, perfect, correct, wrong, bestStreak } = statsData;

  const canvas = createCanvas();
  const ctx    = canvas.getContext('2d');

  drawGradientBg(ctx, '#0a0f1a', '#0a0b10');
  drawGrid(ctx);

  ctx.strokeStyle = '#38bdf840';
  ctx.lineWidth   = 3;
  ctx.strokeRect(20, 20, SHARE_W - 40, SHARE_H - 40);

  const glowGrad = ctx.createLinearGradient(0, 0, SHARE_W, 0);
  glowGrad.addColorStop(0, 'transparent');
  glowGrad.addColorStop(0.5, '#38bdf840');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(20, 20, SHARE_W - 40, 4);

  drawLogo(ctx);
  drawUsername(ctx, username, '', '', '');

  // Titre
  ctx.textAlign   = 'center';
  ctx.font        = 'bold 28px system-ui, sans-serif';
  ctx.fillStyle   = '#8892a4';
  ctx.fillText('🏅 Statistiques Carrière', SHARE_W / 2, 200);

  // Points carrière
  ctx.font        = 'bold 110px system-ui, sans-serif';
  ctx.fillStyle   = '#fbbf24';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur  = 40;
  ctx.fillText(totalPoints, SHARE_W / 2, 360);
  ctx.shadowBlur  = 0;
  ctx.font        = '28px system-ui, sans-serif';
  ctx.fillStyle   = '#4a5568';
  ctx.fillText('points carrière', SHARE_W / 2, 410);

  // Séparateur
  const sepGrad = ctx.createLinearGradient(60, 0, SHARE_W - 60, 0);
  sepGrad.addColorStop(0, 'transparent');
  sepGrad.addColorStop(0.5, '#38bdf860');
  sepGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(60, 540); ctx.lineTo(SHARE_W - 60, 540); ctx.stroke();

  // Stats
  const stats = [
    { label: 'Prédictions', value: predCount,       color: '#e8eaf0' },
    { label: 'Réussite',    value: pct + '%',        color: '#4ade80' },
    { label: 'Parfaites',   value: '🏆 ' + perfect,  color: '#fbbf24' },
    { label: 'Meilleure série', value: '🔥 ' + bestStreak, color: '#f97316' },
  ];

  const PAD2 = 60, GAP2 = 20;
  const BW2  = (SHARE_W - PAD2 * 2 - GAP2) / 2;
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx  = PAD2 + col * (BW2 + GAP2);
    const by  = 560 + row * 120;
    drawRoundedRect(ctx, bx, by, BW2, 100, 12, 'rgba(255,255,255,0.04)', null);
    ctx.textAlign = 'center';
    ctx.font      = 'bold 40px system-ui, sans-serif';
    ctx.fillStyle = s.color;
    ctx.fillText(s.value, bx + BW2 / 2, by + 55);
    ctx.font      = '18px system-ui, sans-serif';
    ctx.fillStyle = '#4a5568';
    ctx.fillText(s.label, bx + BW2 / 2, by + 85);
  });

  // Footer
  ctx.textAlign = 'center';
  ctx.font      = '20px system-ui, sans-serif';
  ctx.fillStyle = '#4a5568';
  ctx.fillText('omniscore.pages.dev', SHARE_W / 2, SHARE_H - 40);

  downloadCanvas(canvas, `omniscore-stats-${username}.png`);
  showShareToast();
}

// ----------------------------------------------------------
//  Toast notification de partage
// ----------------------------------------------------------
function showShareToast() {
  const toast = document.createElement('div');
  toast.className = 'share-toast';
  toast.textContent = '✅ Image téléchargée ! Partage-la sur Instagram ou Twitter.';
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 100);
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// ----------------------------------------------------------
//  Bouton partage sur carte de match
// ----------------------------------------------------------
function getShareMatchData(matchId) {
  // Récupérer les données du match depuis le store
  const storeKey = Array.from(window.matchStore?.keys() || []).find(k => k.includes(matchId));
  const match    = storeKey ? window.matchStore.get(storeKey) : null;
  const pred     = window._predStore?.[String(matchId)] || window._resolvedStore?.[String(matchId)];
  const profile  = window.currentProfile;
  if (!match || !profile) return null;

  const rank = window.getSeasonRank ? window.getSeasonRank(profile.points || 0) : { name: 'Bronze', color: '#cd7f32', icon: '🥉' };

  return {
    team1:           match.team1?.name || '—',
    team2:           match.team2?.name || '—',
    score1:          match.score1 ?? 0,
    score2:          match.score2 ?? 0,
    result:          window._resolvedStore?.[String(matchId)]?.result || 'wrong',
    points:          window._resolvedStore?.[String(matchId)]?.points || 0,
    game:            window.EsportAPI?.GAME_CONFIG?.[match.game]?.label || match.game,
    tournament:      match.tournament || '',
    predictedWinner: pred?.winner || '—',
    predictedScore1: pred?.score1 ?? null,
    predictedScore2: pred?.score2 ?? null,
    username:        profile.username || '—',
    rankName:        rank.name,
    rankColor:       rank.color,
    rankIcon:        rank.icon,
  };
}

async function shareMatch(matchId) {
  const data = getShareMatchData(matchId);
  if (!data) return;
  await shareMatchPrediction(data);
}

// ----------------------------------------------------------
//  Partage depuis le profil
// ----------------------------------------------------------
async function shareFromProfile(type) {
  const profile = window.currentProfile;
  const user    = window.FirebaseService?.getCurrentUser();
  if (!profile || !user) return;

  // Rang saisonnier (pour carte saison)
  const seasonPts  = await (window.getSeasonPoints ? window.getSeasonPoints(user.uid) : Promise.resolve(profile.points || 0));
  const seasonRank = window.getSeasonRank ? window.getSeasonRank(seasonPts) : { name: 'Bronze', color: '#cd7f32', icon: '🥉' };

  // Rang global (pour carte globale) — basé sur totalPoints
  const totalPts   = profile.totalPoints || profile.points || 0;
  const globalRank = window.getRank ? window.getRank(totalPts) : seasonRank;

  if (type === 'season') {
    // Stats saison uniquement
    const season   = window.getCurrentSeason ? window.getCurrentSeason() : {};
    const daysLeft = window.getDaysLeftInSeason ? window.getDaysLeftInSeason() : 0;

    let predCount = 0, correct = 0, perfect = 0, wrong = 0;
    try {
      const snap = await firebase.firestore().collection('predictions')
        .where('uid', '==', user.uid)
        .where('seasonKey', '==', season.seasonKey || '')
        .get();
      snap.docs.forEach(d => {
        const r = d.data().result;
        if (r === 'correct') { correct++; predCount++; }
        if (r === 'perfect') { correct++; perfect++; predCount++; }
        if (r === 'wrong')   { wrong++; predCount++; }
        if (r === null)      predCount++;
      });
    } catch(e) {
      predCount = profile.predictions || 0;
    }

    const resolved = correct + wrong;
    const pct = resolved > 0 ? Math.round((correct / resolved) * 100) : 0;

    await shareSeasonStats({
      username:     profile.username,
      rankName:     seasonRank.name,
      rankColor:    seasonRank.color,
      rankIcon:     seasonRank.icon,
      seasonPoints: seasonPts,
      seasonName:   season.name?.fr || 'Saison en cours',
      seasonIcon:   season.icon || '☀️',
      daysLeft,
      predCount,
      pct,
      perfect,
    });

  } else {
    // Stats globales toutes saisons
    let predCount = 0, correct = 0, perfect = 0, wrong = 0;
    try {
      const snap = await firebase.firestore().collection('predictions')
        .where('uid', '==', user.uid)
        .where('result', 'in', ['correct', 'perfect', 'wrong'])
        .get();
      snap.docs.forEach(d => {
        const r = d.data().result;
        if (r === 'correct') { correct++; predCount++; }
        if (r === 'perfect') { correct++; perfect++; predCount++; }
        if (r === 'wrong')   { wrong++; predCount++; }
      });
    } catch(e) {
      predCount = profile.predictions || 0;
    }

    const resolved = correct + wrong;
    const pct = resolved > 0 ? Math.round((correct / resolved) * 100) : 0;

    await shareGlobalStats({
  username:    profile.username,
  rankName:    '',
  rankColor:   '',
  rankIcon:    '',
      totalPoints: totalPts,
      predCount,
      pct,
      perfect,
      correct,
      wrong,
      bestStreak:  profile.bestStreak || 0,
    });
  }
}

// ----------------------------------------------------------
//  Exposer globalement
// ----------------------------------------------------------
window.shareMatch       = shareMatch;
window.shareFromProfile = shareFromProfile;
window.shareMatchPrediction = shareMatchPrediction;
window.shareSeasonStats = shareSeasonStats;
window.shareGlobalStats = shareGlobalStats;

console.log('[share] chargé ✓');
