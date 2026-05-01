// ============================================================
//  leagues.js — Ligues privées entre amis
// ============================================================

// ----------------------------------------------------------
//  Fonctions Firebase pour les ligues
// ----------------------------------------------------------
async function createLeague(uid, username, leagueName) {
  const code    = generateCode();
  const leagueRef = await firebase.firestore().collection('leagues').add({
    name:      leagueName,
    code,
    creatorId: uid,
    members:   [{ uid, username, points: 0, correct: 0, predictions: 0, pct: 0 }],
    createdAt: new Date().toISOString(),
  });

  // Lier la ligue à l'utilisateur
  await firebase.firestore().collection('users').doc(uid).update({
    leagues: firebase.firestore.FieldValue.arrayUnion(leagueRef.id)
  });

  return { id: leagueRef.id, code, name: leagueName };
}

async function joinLeague(uid, username, code) {
  const snap = await firebase.firestore().collection('leagues')
    .where('code', '==', code.toUpperCase().trim())
    .limit(1)
    .get();

  if (snap.empty) throw new Error('Code invalide — ligue introuvable.');

  const leagueDoc = snap.docs[0];
  const league    = leagueDoc.data();

  // Vérifier si déjà membre
  if (league.members.some(m => m.uid === uid)) {
    throw new Error('Vous êtes déjà membre de cette ligue !');
  }

  // Calculer les stats actuelles de l'utilisateur
  const userSnap = await firebase.firestore().collection('users').doc(uid).get();
  const userData = userSnap.data() || {};

  await leagueDoc.ref.update({
    members: firebase.firestore.FieldValue.arrayUnion({
      uid, username,
      points:      userData.points      || 0,
      correct:     userData.correct     || 0,
      predictions: userData.predictions || 0,
      pct:         userData.predictions > 0 ? Math.round((userData.correct / userData.predictions) * 100) : 0,
    })
  });

  await firebase.firestore().collection('users').doc(uid).update({
    leagues: firebase.firestore.FieldValue.arrayUnion(leagueDoc.id)
  });

  return { id: leagueDoc.id, name: league.name };
}

async function getUserLeagues(uid) {
  const userSnap = await firebase.firestore().collection('users').doc(uid).get();
  const leagueIds = userSnap.data()?.leagues || [];
  if (leagueIds.length === 0) return [];

  const leagues = [];
  for (const id of leagueIds) {
    const snap = await firebase.firestore().collection('leagues').doc(id).get();
    if (snap.exists) leagues.push({ id: snap.id, ...snap.data() });
  }
  return leagues;
}

async function refreshLeagueMember(uid, leagueId) {
  const userSnap   = await firebase.firestore().collection('users').doc(uid).get();
  const userData   = userSnap.data() || {};
  const leagueRef  = firebase.firestore().collection('leagues').doc(leagueId);
  const leagueSnap = await leagueRef.get();
  if (!leagueSnap.exists) return;

  const members = leagueSnap.data().members.map(m => {
    if (m.uid !== uid) return m;
    return {
      ...m,
      points:      userData.points      || 0,
      correct:     userData.correct     || 0,
      predictions: userData.predictions || 0,
      pct:         userData.predictions > 0 ? Math.round((userData.correct / userData.predictions) * 100) : 0,
    };
  });
  await leagueRef.update({ members });
}

async function leaveLeague(uid, leagueId) {
  const leagueRef  = firebase.firestore().collection('leagues').doc(leagueId);
  const leagueSnap = await leagueRef.get();
  if (!leagueSnap.exists) return;

  const members = leagueSnap.data().members.filter(m => m.uid !== uid);
  if (members.length === 0) {
    await leagueRef.delete();
  } else {
    await leagueRef.update({ members });
  }

  await firebase.firestore().collection('users').doc(uid).update({
    leagues: firebase.firestore.FieldValue.arrayRemove(leagueId)
  });
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'OMNI-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ----------------------------------------------------------
//  UI — Page des ligues
// ----------------------------------------------------------
async function showLeaguesPage() {
  document.getElementById('leagues-modal')?.remove();

  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const modal = document.createElement('div');
  modal.id        = 'leagues-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide leagues-box">
      <div class="modal-header">
        <div class="modal-title">🏆 Ligues privées</div>
        <button class="modal-close" onclick="document.getElementById('leagues-modal').remove()">✕</button>
      </div>
      <div class="leagues-actions">
        <button class="league-action-btn create" onclick="showCreateLeague()">+ Créer une ligue</button>
        <button class="league-action-btn join" onclick="showJoinLeague()">🔑 Rejoindre une ligue</button>
      </div>
      <div id="leagues-content"><div class="lb-loading">Chargement...</div></div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  await loadLeaguesContent(user);
}

async function loadLeaguesContent(user) {
  const el = document.getElementById('leagues-content');
  if (!el) return;

  try {
    // Rafraîchir les stats du membre dans toutes ses ligues
    const leagues = await getUserLeagues(user.uid);

    if (leagues.length === 0) {
      el.innerHTML = `
        <div class="fav-empty">
          <div class="fav-empty-icon">🏆</div>
          <div class="fav-empty-title">Aucune ligue</div>
          <div class="fav-empty-sub">Créez une ligue et invitez vos amis avec le code !</div>
        </div>`;
      return;
    }

    // Rafraîchir les stats
    await Promise.all(leagues.map(l => refreshLeagueMember(user.uid, l.id)));
    const freshLeagues = await getUserLeagues(user.uid);

    el.innerHTML = freshLeagues.map(l => renderLeagueCard(l, user.uid)).join('');

  } catch(e) {
    console.error('[Leagues]', e);
    el.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}

function renderLeagueCard(league, currentUid) {
  const isCreator = league.creatorId === currentUid;

  // Trier les membres : d'abord par points, puis par %
  const sorted = [...(league.members || [])].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.pct - a.pct;
  });

  const rows = sorted.map((m, i) => {
    const isMe    = m.uid === currentUid;
    const rankStr = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
    return `<tr class="${isMe ? 'lb-me' : ''}">
      <td class="lb-rank">${rankStr}</td>
      <td class="lb-name">${m.username || '—'} ${isMe ? '<span style="color:var(--text3);font-size:10px">(vous)</span>' : ''}</td>
      <td class="lb-pts">⭐ ${m.points}</td>
      <td class="lb-streak">${m.pct}%</td>
      <td class="lb-pred">${m.predictions || 0}</td>
    </tr>`;
  }).join('');

  return `
    <div class="league-card">
      <div class="league-card-header">
        <div>
          <div class="league-name">${league.name}</div>
          <div class="league-meta">${sorted.length} membre${sorted.length > 1 ? 's' : ''} · ${isCreator ? 'Créateur' : 'Membre'}</div>
        </div>
        <div class="league-card-actions">
          <div class="league-code" onclick="copyCode('${league.code}')" title="Cliquez pour copier">
            🔑 ${league.code}
          </div>
          ${!isCreator ? `<button class="league-leave-btn" onclick="handleLeaveLeague('${league.id}')">Quitter</button>` : ''}
        </div>
      </div>
      <table class="lb-table" style="margin-top:10px">
        <thead><tr><th>#</th><th>Pseudo</th><th>Points</th><th>Réussite</th><th>Prédictions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function showCreateLeague() {
  document.getElementById('league-form-modal')?.remove();
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;

  const modal = document.createElement('div');
  modal.id        = 'league-form-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">+ Créer une ligue</div>
        <button class="modal-close" onclick="document.getElementById('league-form-modal').remove()">✕</button>
      </div>
      <div class="form-group">
        <label>Nom de la ligue</label>
        <input type="text" id="league-name-input" class="form-input" placeholder="Ex: La ligue des potes" maxlength="30">
      </div>
      <div id="league-form-error" class="form-error" style="display:none"></div>
      <button class="form-submit" onclick="handleCreateLeague()">Créer la ligue</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function handleCreateLeague() {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;

  const name = document.getElementById('league-name-input')?.value?.trim();
  if (!name) {
    const err = document.getElementById('league-form-error');
    if (err) { err.textContent = 'Veuillez entrer un nom.'; err.style.display = 'block'; }
    return;
  }

  // Vérifier la limite (1 ligue gratuite)
  const leagues = await getUserLeagues(user.uid);
  const myLeagues = leagues.filter(l => l.creatorId === user.uid);
  if (myLeagues.length >= 1) {
    const err = document.getElementById('league-form-error');
    if (err) {
      err.textContent = 'Limite atteinte : 1 ligue gratuite. Passez Premium pour en créer plus !';
      err.style.display = 'block';
    }
    return;
  }

  try {
    const profile  = await window.FirebaseService.getUserProfile(user.uid);
    const { code } = await createLeague(user.uid, profile?.username || 'Anonyme', name);
    document.getElementById('league-form-modal')?.remove();

    // Afficher le code
    const modal = document.createElement('div');
    modal.id        = 'league-code-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title">🎉 Ligue créée !</div>
          <button class="modal-close" onclick="document.getElementById('league-code-modal').remove();showLeaguesPage()">✕</button>
        </div>
        <div class="league-code-display">
          <div class="league-code-label">Code d'invitation :</div>
          <div class="league-code-big" onclick="copyCode('${code}')">${code}</div>
          <div class="league-code-hint">Cliquez pour copier · Partagez ce code à vos amis !</div>
        </div>
        <button class="form-submit" onclick="copyCode('${code}');document.getElementById('league-code-modal').remove();showLeaguesPage()">
          Copier le code et continuer
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); showLeaguesPage(); } });

  } catch(e) {
    const err = document.getElementById('league-form-error');
    if (err) { err.textContent = e.message; err.style.display = 'block'; }
  }
}

function showJoinLeague() {
  document.getElementById('league-join-modal')?.remove();
  const modal = document.createElement('div');
  modal.id        = 'league-join-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">🔑 Rejoindre une ligue</div>
        <button class="modal-close" onclick="document.getElementById('league-join-modal').remove()">✕</button>
      </div>
      <div class="form-group">
        <label>Code d'invitation</label>
        <input type="text" id="league-code-input" class="form-input" placeholder="Ex: OMNI-X7K2" maxlength="10" style="text-transform:uppercase;letter-spacing:2px;font-size:16px;text-align:center">
      </div>
      <div id="league-join-error" class="form-error" style="display:none"></div>
      <button class="form-submit" onclick="handleJoinLeague()">Rejoindre</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function handleJoinLeague() {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;

  const code = document.getElementById('league-code-input')?.value?.trim();
  if (!code) return;

  try {
    const profile = await window.FirebaseService.getUserProfile(user.uid);
    const league  = await joinLeague(user.uid, profile?.username || 'Anonyme', code);
    document.getElementById('league-join-modal')?.remove();
    showLeaguesPage();
  } catch(e) {
    const err = document.getElementById('league-join-error');
    if (err) { err.textContent = e.message; err.style.display = 'block'; }
  }
}

async function handleLeaveLeague(leagueId) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;
  if (!confirm('Quitter cette ligue ?')) return;
  await leaveLeague(user.uid, leagueId);
  showLeaguesPage();
}

function copyCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    // Feedback visuel
    const els = document.querySelectorAll('.league-code, .league-code-big');
    els.forEach(el => {
      const orig = el.textContent;
      el.textContent = '✓ Copié !';
      setTimeout(() => { el.textContent = orig; }, 1500);
    });
  });
}

window.showLeaguesPage    = showLeaguesPage;
window.showCreateLeague   = showCreateLeague;
window.handleCreateLeague = handleCreateLeague;
window.showJoinLeague     = showJoinLeague;
window.handleJoinLeague   = handleJoinLeague;
window.handleLeaveLeague  = handleLeaveLeague;
window.copyCode           = copyCode;

console.log('[leagues] chargé ✓');
