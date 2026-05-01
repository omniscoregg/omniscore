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
        <div class="profile-avatar" style="border: 2px solid ${window.getRank ? window.getRank(profile.points, rank || 9999).color : '#a78bfa'}">${profile.username?.[0]?.toUpperCase() || '?'}</div>
        <div class="profile-info">
          <div class="profile-username">${profile.username}</div>
          <div class="profile-email">${profile.email}</div>
          <div class="profile-since">Membre depuis ${formatDate(profile.createdAt)}</div>
          ${window.renderRankBadge ? window.renderRankBadge(profile.points, rank || 9999, 'normal') : ''}
        </div>
        <div class="profile-rank">${rankLabel}</div>
      </div>
      ${window.renderRankProgress ? window.renderRankProgress(profile.points, rank || 9999) : ''}

      <div class="daily-streak-wrap" id="daily-streak-section"></div>

      <!-- Stats -->
      <div class="profile-stats" style="grid-template-columns: repeat(3, 1fr)">
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#a78bfa">⭐ ${profile.points}</div>
          <div class="profile-stat-label">Points</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#4ade80">${pct}%</div>
          <div class="profile-stat-label">Réussite</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value">${total}</div>
          <div class="profile-stat-label">Prédictions</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat-value" style="color:#fbbf24">🔥 ${streak}</div>
          <div class="profile-stat-label">Série</div>
        </div>
      </div>

      <!-- Détail prédictions -->
      <div class="profile-pred-detail">
        <span class="pred-detail-item correct">✅ ${correct} correctes</span>
        <span class="pred-detail-item perfect">🏆 ${perfect} parfaites</span>
        <span class="pred-detail-item wrong">❌ ${wrong} manquées</span>
        <span class="pred-detail-item pending">⏳ ${pending} en attente</span>
      </div>

      <!-- Favoris -->
      ${favTeams.length > 0 || favGames.length > 0 ? `
      <div class="profile-section">
        <div class="profile-section-title">⭐ Mes Favoris</div>
        <div class="profile-favs">
          ${favGames.map(g => {
            const cfg = EsportAPI.GAME_CONFIG[g];
            return cfg ? `<span class="profile-fav-tag game">${cfg.label}</span>` : '';
          }).join('')}
          ${favTeams.map(f => {
            const cfg = EsportAPI.GAME_CONFIG[f.game];
            return `<span class="profile-fav-tag team" title="${cfg?.label || f.game}">${f.teamName} <span style="opacity:0.6;font-size:10px">${cfg?.label || f.game}</span></span>`;
          }).join('')}
        </div>
      </div>
      ` : ''}

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
      .limit(50)
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
