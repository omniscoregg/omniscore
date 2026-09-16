// ============================================================
//  notifications.js — Onglet notifications Omniscore
//  - Résultats de prédictions récentes
//  - Prochains matchs des équipes favorites
//  - Badge compteur non lues
// ============================================================

const NOTIF_STORAGE_KEY = 'omniscore_notifs_read';

// ----------------------------------------------------------
//  Charger les notifications
// ----------------------------------------------------------
async function loadNotifications() {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;

  try {
    const [predictions, favorites] = await Promise.all([
      loadPredictionNotifs(user.uid),
      loadFavoriteMatchNotifs(user.uid),
    ]);

    const all = [...predictions, ...favorites].sort((a, b) => b.timestamp - a.timestamp);
    window._notifications = all;

    updateNotifBadge(all);
  } catch(e) {
    console.error('[Notifications] Erreur:', e);
  }
}

// Prédictions résolues récentes
async function loadPredictionNotifs(uid) {
  try {
    const snap = await firebase.firestore().collection('predictions')
      .where('uid', '==', uid)
      .where('result', 'in', ['correct', 'perfect', 'wrong'])
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    return snap.docs.map(d => {
      const p = d.data();
      const labels = { correct: 'Correct', perfect: 'Parfait !', wrong: 'Manqué' };
      const pts = p.points > 0 ? ` +${p.points} pts` : '';
      const cfg = EsportAPI?.GAME_CONFIG?.[p.game];
      return {
        id: d.id,
        type: 'prediction',
        result: p.result,
        icon: '',
        title: labels[p.result] || p.result,
        body: `${p.predictedWinner}${pts}`,
        sub: cfg?.label || p.game,
        timestamp: new Date(p.createdAt).getTime(),
        color: p.result === 'perfect' ? '#fbbf24' : p.result === 'correct' ? '#4ade80' : '#f87171',
      };
    });
  } catch(e) { return []; }
}

// Prochains matchs des équipes favorites
async function loadFavoriteMatchNotifs(uid) {
  try {
    const userSnap = await firebase.firestore().collection('users').doc(uid).get();
    const favs = userSnap.data()?.favorites || [];
    if (favs.length === 0) return [];

    const notifs = [];
    const now = Date.now();
    const in48h = now + 48 * 3600 * 1000;

    if (window.matchStore) {
      for (const [, m] of window.matchStore) {
        if (m.status !== 'upcoming') continue;
        const matchTime = new Date(m.date).getTime();
        if (matchTime < now || matchTime > in48h) continue;

        const isFav = favs.some(f =>
          (f.game === m.game) && (
            f.teamName?.toLowerCase() === m.team1?.name?.toLowerCase() ||
            f.teamName?.toLowerCase() === m.team2?.name?.toLowerCase()
          )
        );

        if (isFav) {
          const favTeam = favs.find(f =>
            f.teamName?.toLowerCase() === m.team1?.name?.toLowerCase() ||
            f.teamName?.toLowerCase() === m.team2?.name?.toLowerCase()
          );
          const hoursLeft = Math.round((matchTime - now) / 3600000);
          const cfg = EsportAPI?.GAME_CONFIG?.[m.game];
          notifs.push({
            id: 'match_' + m.id,
            type: 'match',
            icon: '',
            title: favTeam?.teamName || 'Équipe favorite',
            body: `${m.team1?.name} vs ${m.team2?.name}`,
            sub: `Dans ${hoursLeft}h · ${cfg?.label || m.game}`,
            timestamp: matchTime,
            color: '#38bdf8',
            matchId: m.id,
          });
        }
      }
    }

    return notifs;
  } catch(e) { return []; }
}

// ----------------------------------------------------------
//  Badge compteur
// ----------------------------------------------------------
function updateNotifBadge(notifs) {
  const readIds = getReadNotifIds();
  const unread  = notifs.filter(n => !readIds.includes(n.id)).length;

  document.querySelectorAll('.notif-badge').forEach(badge => {
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

function getReadNotifIds() {
  try { return JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY) || '[]'); }
  catch(e) { return []; }
}

function markAllAsRead() {
  const ids = (window._notifications || []).map(n => n.id);
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(ids));
  updateNotifBadge([]);
  // Mettre à jour l'affichage
  document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
  const markBtn = document.getElementById('notif-mark-all');
  if (markBtn) markBtn.style.display = 'none';
}

// ----------------------------------------------------------
//  Afficher le panneau notifications
// ----------------------------------------------------------
function showNotificationsPage() {
  // Fermer si déjà ouvert
  const existing = document.getElementById('notif-panel');
  if (existing) { existing.remove(); return; }

  const notifs  = window._notifications || [];
  const readIds = getReadNotifIds();

  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.className = 'notif-panel';

  const unreadCount = notifs.filter(n => !readIds.includes(n.id)).length;

  panel.innerHTML = `
    <div class="notif-panel-header">
      <span class="notif-panel-title">🔔 Notifications</span>
      <div style="display:flex;gap:8px;align-items:center">
        ${unreadCount > 0 ? `<button class="notif-mark-btn" id="notif-mark-all" onclick="markAllAsRead()">Tout lire</button>` : ''}
        <button class="notif-close-btn" onclick="document.getElementById('notif-panel').remove()">✕</button>
      </div>
    </div>
    <div class="notif-list">
      ${notifs.length === 0
        ? '<div class="notif-empty">Aucune notification pour l\'instant<br><span style="font-size:12px;color:var(--text3)">Tu seras prévenu ici dès qu\'une de tes prédictions sera résolue, ou qu\'un match d\'une équipe favorite approche.</span></div>'
        : notifs.map(n => renderNotifItem(n, readIds)).join('')
      }
    </div>
  `;

  // Positionner sous le bouton cloche
  document.body.appendChild(panel);

  // Fermer en cliquant dehors
  setTimeout(() => {
    document.addEventListener('click', function closePanel(e) {
      if (!panel.contains(e.target) && !e.target.closest('.notif-btn')) {
        panel.remove();
        document.removeEventListener('click', closePanel);
      }
    });
  }, 100);
}

function renderNotifItem(n, readIds) {
  const isUnread = !readIds.includes(n.id);
  const date = new Date(n.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return `<div class="notif-item ${isUnread ? 'unread' : ''}" style="border-left:3px solid ${n.color}">
    <span class="notif-icon">${n.icon}</span>
    <div class="notif-content">
      <div class="notif-title" style="color:${n.color}">${n.title}</div>
      <div class="notif-body">${n.body}</div>
      <div class="notif-sub">${n.sub} · ${date}</div>
    </div>
    ${isUnread ? '<span class="notif-dot"></span>' : ''}
  </div>`;
}

// ----------------------------------------------------------
//  Exposer globalement
// ----------------------------------------------------------
window.loadNotifications    = loadNotifications;
window.showNotificationsPage = showNotificationsPage;
window.markAllAsRead        = markAllAsRead;
window.updateNotifBadge     = updateNotifBadge;

console.log('[notifications] chargé ✓');
