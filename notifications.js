// notifications.js — Omniscore

window.notificationsUnread = 0;

function updateNotifBadge(count) {
  window.notificationsUnread = count;
  const badges = document.querySelectorAll('.notif-badge');
  badges.forEach(b => {
    b.textContent = count > 9 ? '9+' : count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

async function loadNotifications() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const container = document.getElementById('notifications-list');
  if (container) container.innerHTML = '<p class="notif-loading">Chargement...</p>';

  firebase.firestore()
    .collection('users').doc(user.uid)
    .collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(snapshot => {
      let unread = 0;
      const notifs = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (!d.read) unread++;
        notifs.push({ id: doc.id, ...d });
      });
      updateNotifBadge(unread);
      renderNotifications(notifs);
    });
}

function renderNotifications(notifs) {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  if (notifs.length === 0) {
    container.innerHTML = '<p class="notif-empty">Aucune notification pour l\'instant.</p>';
    return;
  }

  const predictions = notifs.filter(n => n.type === 'prediction');
  const favorites = notifs.filter(n => n.type === 'favorite_match');

  let html = '';

  if (predictions.length > 0) {
    html += '<div class="notif-section-title">🏆 Résultats prédictions</div>';
    predictions.forEach(n => {
      html += notifCard(n);
    });
  }

  if (favorites.length > 0) {
    html += '<div class="notif-section-title">📅 Matchs équipes favorites</div>';
    favorites.forEach(n => {
      html += notifCard(n);
    });
  }

  container.innerHTML = html;
}

function notifCard(n) {
  const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
  const timeAgo = formatTimeAgo(date);
  const unreadClass = !n.read ? 'notif-unread' : '';
  return `
    <div class="notif-card ${unreadClass}" data-id="${n.id}">
      <div class="notif-card-body">
        <div class="notif-card-title">${n.title || ''}</div>
        <div class="notif-card-text">${n.body || ''}</div>
        <div class="notif-card-time">${timeAgo}</div>
      </div>
    </div>
  `;
}

function formatTimeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  return `Il y a ${Math.floor(diff/86400)}j`;
}

async function markAllNotifsRead() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const snap = await firebase.firestore()
    .collection('users').doc(user.uid)
    .collection('notifications')
    .where('read', '==', false)
    .get();
  const batch = firebase.firestore().batch();
  snap.forEach(doc => batch.update(doc.ref, { read: true }));
  await batch.commit();
}

function showNotificationsPage() {
  document.getElementById('notifications-modal')?.remove();
  closeMobileProfileMenu && closeMobileProfileMenu();

  const modal = document.createElement('div');
  modal.id        = 'notifications-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide notif-box">
      <div class="modal-header">
        <div class="modal-title">🔔 Notifications</div>
        <button class="modal-close" onclick="document.getElementById('notifications-modal').remove()">✕</button>
      </div>
      <div id="notifications-list"><div class="notif-loading">Chargement...</div></div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  markAllNotifsRead();
}

window.showNotificationsPage = showNotificationsPage;

window.loadNotifications = loadNotifications;
window.markAllNotifsRead = markAllNotifsRead;
window.updateNotifBadge = updateNotifBadge;