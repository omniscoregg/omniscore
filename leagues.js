// ============================================================
//  leagues.js — Ligues privées entre amis
// ============================================================

// ----------------------------------------------------------
//  Fonctions Firebase pour les ligues
// ----------------------------------------------------------
async function createLeague(uid, username, leagueName, tournament) {
  const code    = generateCode();
  const leagueData = {
    name:      leagueName,
    code,
    creatorId: uid,
    members:   [{ uid, username, points: 0, correct: 0, predictions: 0, pct: 0 }],
    createdAt: new Date().toISOString(),
  };
  if (tournament) {
    leagueData.tournamentId    = tournament.id;
    leagueData.tournamentName  = tournament.name;
    leagueData.tournamentDisplayName = tournament.displayName || tournament.name;
    leagueData.tournamentGame  = tournament.game;
    leagueData.tournamentTeams = tournament.teams || [];
  }
  const leagueRef = await firebase.firestore().collection('leagues').add(leagueData);

  // Lier la ligue à l'utilisateur
  await firebase.firestore().collection('users').doc(uid).update({
    leagues: firebase.firestore.FieldValue.arrayUnion(leagueRef.id)
  });

  return { id: leagueRef.id, code, name: leagueName };
}

// ----------------------------------------------------------
//  Lier une ligue existante à un tournoi (pick'em)
// ----------------------------------------------------------
async function linkLeagueToTournament(leagueId, tournament) {
  await firebase.firestore().collection('leagues').doc(leagueId).update({
    tournamentId:    tournament.id,
    tournamentName:  tournament.name,
    tournamentDisplayName: tournament.displayName || tournament.name,
    tournamentGame:  tournament.game,
    tournamentTeams: tournament.teams || [],
  });
}

// ----------------------------------------------------------
//  Un tournoi a-t-il commencé ? (au moins un match en direct/terminé)
// ----------------------------------------------------------
async function hasTournamentStarted(game, tournamentName) {
  try {
    const [running, past] = await Promise.all([
      EsportAPI.getMatches({ games: [game], status: 'running', count: 20 }),
      EsportAPI.getMatches({ games: [game], status: 'past', count: 20 }),
    ]);
    const needle = (tournamentName || '').toLowerCase().trim();
    return [...running, ...past].some(m => (m.tournament || '').toLowerCase().trim() === needle);
  } catch(e) { return false; }
}

// ----------------------------------------------------------
//  Calculer les stats d'un membre pour une ligue donnée
//  (classique : points globaux — liée à un tournoi : pick'em + matchs du tournoi)
// ----------------------------------------------------------
async function computeMemberStats(uid, league) {
  if (league.tournamentId) {
    const tournPred = await getTournamentPrediction(uid, league.tournamentId);
    const pickemPts = tournPred?.points || 0;

    const predSnap = await firebase.firestore().collection('predictions')
      .where('uid', '==', uid)
      .where('tournament', '==', league.tournamentName)
      .get();
    const preds    = predSnap.docs.map(d => d.data());
    const stats    = window.computePredictionStats(preds);
    const matchPts = preds.reduce((sum, p) => sum + (p.points || 0), 0);

    return { points: pickemPts + matchPts, correct: stats.correct, predictions: stats.total, pct: stats.pct };
  }

  const userSnap  = await firebase.firestore().collection('users').doc(uid).get();
  const userData  = userSnap.data() || {};
  const predSnap  = await firebase.firestore().collection('predictions')
    .where('uid', '==', uid).get();
  const preds  = predSnap.docs.map(d => d.data());
  const stats  = window.computePredictionStats(preds);

  return { points: userData.points || 0, correct: stats.correct, predictions: stats.total, pct: stats.pct };
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

  const stats = await computeMemberStats(uid, league);

  await leagueDoc.ref.update({
    members: firebase.firestore.FieldValue.arrayUnion({ uid, username, ...stats })
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

  // Requêtes groupées par paquets de 10 (limite Firestore pour "in"),
  // au lieu d'une lecture individuelle par ligue.
  const chunks = [];
  for (let i = 0; i < leagueIds.length; i += 10) chunks.push(leagueIds.slice(i, i + 10));

  const results = await Promise.all(chunks.map(chunk =>
    firebase.firestore().collection('leagues')
      .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
      .get()
  ));

  const leagues = [];
  results.forEach(snap => snap.forEach(doc => leagues.push({ id: doc.id, ...doc.data() })));
  return leagues;
}

async function refreshLeagueMember(uid, leagueId) {
  const leagueRef  = firebase.firestore().collection('leagues').doc(leagueId);
  const leagueSnap = await leagueRef.get();
  if (!leagueSnap.exists) return;

  const league = leagueSnap.data();
  const stats  = await computeMemberStats(uid, league);

  const members = league.members.map(m => {
    if (m.uid !== uid) return m;
    return { ...m, ...stats };
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

    // Pour les ligues liées à un tournoi, vérifier si le tournoi a démarré
    const startedMap = {};
    await Promise.all(freshLeagues.filter(l => l.tournamentId).map(async l => {
      startedMap[l.id] = await hasTournamentStarted(l.tournamentGame, l.tournamentName);
    }));

    el.innerHTML = freshLeagues.map(l => renderLeagueCard(l, user.uid, startedMap[l.id])).join('');

  } catch(e) {
    console.error('[Leagues]', e);
    el.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}

function renderLeagueCard(league, currentUid, tournStarted) {
  const isCreator = league.creatorId === currentUid;
  const isLinked  = !!league.tournamentId;

  // Trier les membres : d'abord par points, puis par %
  const sorted = [...(league.members || [])].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.pct - a.pct;
  });

  const rows = sorted.map((m, i) => {
    const isMe    = m.uid === currentUid;
    const rankStr = '#' + (i + 1);
    return `<tr class="${isMe ? 'lb-me' : ''}">
      <td class="lb-rank">${rankStr}</td>
      <td class="lb-name">${m.username || '—'} ${isMe ? '<span style="color:var(--text3);font-size:10px">(vous)</span>' : ''}</td>
      <td class="lb-pts">${m.points}</td>
      <td class="lb-streak">${m.pct}%</td>
      <td class="lb-pred">${m.predictions || 0}</td>
    </tr>`;
  }).join('');

  const tournBadge = isLinked
    ? `<div class="league-tourn-badge">${league.tournamentDisplayName || league.tournamentName}${tournStarted ? ' · Prédictions classiques activées' : ' · Pick\'em en cours'}</div>`
    : '';

  const tournAction = isLinked
    ? (tournStarted
        ? ''
        : `<button class="league-leave-btn" onclick="showLeaguePickemModal('${league.id}')">Mon pick'em</button>`)
    : (isCreator ? `<button class="league-leave-btn" onclick="showLinkTournamentModal('${league.id}')">Lier à un tournoi</button>` : '');

  return `
    <div class="league-card">
      <div class="league-card-header">
        <div>
          <div class="league-name">${league.name}</div>
          <div class="league-meta">${sorted.length} membre${sorted.length > 1 ? 's' : ''} · ${isCreator ? 'Créateur' : 'Membre'}</div>
        </div>
        <div class="league-card-actions">
          <div class="league-code" onclick="copyCode('${league.code}')" title="Cliquez pour copier">
            ${league.code}
          </div>
          ${tournAction}
          ${isCreator 
            ? `<button class="league-leave-btn delete" onclick="handleDeleteLeague('${league.id}')">Supprimer</button>`
            : `<button class="league-leave-btn" onclick="handleLeaveLeague('${league.id}')">Quitter</button>`
          }
        </div>
      </div>
      ${tournBadge}
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

  const games = Object.entries(EsportAPI.GAME_CONFIG).filter(([, c]) => c.source === 'pandascore');
  const gameOptions = games.map(([key, cfg]) => `<option value="${key}">${cfg.label}</option>`).join('');

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
      <div class="form-group">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:400">
          <input type="checkbox" id="league-tourn-toggle" onchange="toggleLeagueTournUI(this.checked)">
          Lier à un tournoi (pick'em)
        </label>
      </div>
      <div id="league-tourn-picker" style="display:none">
        <div class="form-group">
          <label>Jeu</label>
          <select id="league-tourn-game" class="form-input" onchange="loadLeagueTournOptions(this.value, 'league-tourn-select')">
            <option value="">Choisir un jeu</option>
            ${gameOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Tournoi</label>
          <select id="league-tourn-select" class="form-input"><option value="">Choisir un jeu d'abord</option></select>
        </div>
      </div>
      <div id="league-form-error" class="form-error" style="display:none"></div>
      <button class="form-submit" onclick="handleCreateLeague()">Créer la ligue</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function toggleLeagueTournUI(checked) {
  const el = document.getElementById('league-tourn-picker');
  if (el) el.style.display = checked ? 'block' : 'none';
}

// Stocke les tournois candidats trouvés (par jeu), pour retrouver leurs données au clic
window._leagueTournCandidates = {};

async function loadLeagueTournOptions(gameKey, selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  if (!gameKey) { select.innerHTML = '<option value="">Choisir un jeu d\'abord</option>'; return; }

  select.innerHTML = '<option value="">Chargement...</option>';
  const tournaments = await fetchTournaments(gameKey);
  window._leagueTournCandidates[gameKey] = tournaments;

  if (tournaments.length === 0) {
    select.innerHTML = '<option value="">Aucun tournoi disponible pour ce jeu</option>';
    return;
  }
  select.innerHTML = '<option value="">Choisir un tournoi</option>'
    + tournaments.map(t => `<option value="${t.id}" data-game="${gameKey}">${t.league?.name ? t.league.name + ' — ' : ''}${t.name}</option>`).join('');
}

function getSelectedLeagueTournament(selectId) {
  const select = document.getElementById(selectId);
  const opt    = select?.selectedOptions?.[0];
  if (!opt || !opt.value) return null;
  const gameKey = opt.dataset.game;
  const t = (window._leagueTournCandidates[gameKey] || []).find(t => String(t.id) === opt.value);
  if (!t) return null;
  return {
    id:    t.id,
    // Le champ "tournament" des matchs (api.js) vaut m.league?.name — on doit
    // stocker la même valeur ici pour que le filtrage des matchs fonctionne.
    name:  t.league?.name || t.name,
    displayName: t.league?.name ? t.league.name + ' — ' + t.name : t.name,
    game:  gameKey,
    teams: (t.teams || []).slice(0, 16).map(team => ({ name: team.name, image_url: team.image_url || null })),
  };
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

  const profile = await window.FirebaseService.getUserProfile(user.uid);

  // Vérifier la limite (1 ligue gratuite, illimité en Premium)
  if (!profile?.premium) {
    const leagues   = await getUserLeagues(user.uid);
    const myLeagues = leagues.filter(l => l.creatorId === user.uid);
    if (myLeagues.length >= 1) {
      const err = document.getElementById('league-form-error');
      if (err) {
        err.textContent = 'Limite atteinte : 1 ligue gratuite. Passez Premium pour en créer plus !';
        err.style.display = 'block';
      }
      return;
    }
  }

  try {
    const tournToggle = document.getElementById('league-tourn-toggle');
    let tournament = null;
    if (tournToggle?.checked) {
      tournament = getSelectedLeagueTournament('league-tourn-select');
      if (!tournament) {
        const err = document.getElementById('league-form-error');
        if (err) { err.textContent = 'Veuillez choisir un tournoi, ou décocher l\'option.'; err.style.display = 'block'; }
        return;
      }
    }
    const { code } = await createLeague(user.uid, profile?.username || 'Anonyme', name, tournament);
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

async function handleDeleteLeague(leagueId) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;
  if (!confirm('Supprimer définitivement cette ligue ? Tous les membres seront exclus.')) return;
  try {
    // Supprimer la ligue de tous les membres
    const leagueSnap = await firebase.firestore().collection('leagues').doc(leagueId).get();
    if (!leagueSnap.exists) return;
    const members = leagueSnap.data().members || [];
    await Promise.all(members.map(m =>
      firebase.firestore().collection('users').doc(m.uid).update({
        leagues: firebase.firestore.FieldValue.arrayRemove(leagueId)
      })
    ));
    // Supprimer la ligue
    await firebase.firestore().collection('leagues').doc(leagueId).delete();
    showLeaguesPage();
  } catch(e) {
    console.error('[Leagues] Erreur suppression:', e);
    alert('Erreur lors de la suppression.');
  }
}

async function handleLeaveLeague(leagueId) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;
  if (!confirm('Quitter cette ligue ?')) return;
  await leaveLeague(user.uid, leagueId);
  showLeaguesPage();
}

// ----------------------------------------------------------
//  Lier une ligue existante à un tournoi
// ----------------------------------------------------------
function showLinkTournamentModal(leagueId) {
  document.getElementById('league-link-tourn-modal')?.remove();
  const games = Object.entries(EsportAPI.GAME_CONFIG).filter(([, c]) => c.source === 'pandascore');
  const gameOptions = games.map(([key, cfg]) => `<option value="${key}">${cfg.label}</option>`).join('');

  const modal = document.createElement('div');
  modal.id        = 'league-link-tourn-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">Lier à un tournoi</div>
        <button class="modal-close" onclick="document.getElementById('league-link-tourn-modal').remove()">✕</button>
      </div>
      <div class="form-group">
        <label>Jeu</label>
        <select id="link-tourn-game" class="form-input" onchange="loadLeagueTournOptions(this.value, 'link-tourn-select')">
          <option value="">Choisir un jeu</option>
          ${gameOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Tournoi</label>
        <select id="link-tourn-select" class="form-input"><option value="">Choisir un jeu d'abord</option></select>
      </div>
      <div id="link-tourn-error" class="form-error" style="display:none"></div>
      <button class="form-submit" onclick="handleLinkTournament('${leagueId}')">Lier ce tournoi</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function handleLinkTournament(leagueId) {
  const tournament = getSelectedLeagueTournament('link-tourn-select');
  if (!tournament) {
    const err = document.getElementById('link-tourn-error');
    if (err) { err.textContent = 'Veuillez choisir un tournoi.'; err.style.display = 'block'; }
    return;
  }
  await linkLeagueToTournament(leagueId, tournament);
  document.getElementById('league-link-tourn-modal')?.remove();
  showLeaguesPage();
}

// ----------------------------------------------------------
//  Modale de pick'em pour une ligue liée à un tournoi
//  (réutilise le formulaire et les fonctions de tournaments.js)
// ----------------------------------------------------------
async function showLeaguePickemModal(leagueId) {
  document.getElementById('league-pickem-modal')?.remove();
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;

  const leagueSnap = await firebase.firestore().collection('leagues').doc(leagueId).get();
  if (!leagueSnap.exists) return;
  const league = leagueSnap.data();
  if (!league.tournamentId) return;

  const cfg     = EsportAPI.GAME_CONFIG[league.tournamentGame];
  const colors  = window.GENRE_COLORS?.[cfg?.genre] || {};
  const accent  = colors.accent || '#a78bfa';

  const modal = document.createElement('div');
  modal.id        = 'league-pickem-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box wide">
      <div class="modal-header">
        <div class="modal-title">${league.tournamentDisplayName || league.tournamentName}</div>
        <button class="modal-close" onclick="document.getElementById('league-pickem-modal').remove()">✕</button>
      </div>
      <div id="tourn-body-${league.tournamentId}"><div class="lb-loading">Chargement...</div></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Reconstruire un objet "tournoi" compatible avec loadTournamentPredForm (tournaments.js)
  const t = {
    id:   league.tournamentId,
    name: league.tournamentName,
    teams: league.tournamentTeams || [],
    game: { slug: cfg?.slug || '' },
  };
  await loadTournamentPredForm(t, user.uid, accent);
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
window.handleDeleteLeague = handleDeleteLeague;
window.copyCode           = copyCode;
window.toggleLeagueTournUI       = toggleLeagueTournUI;
window.loadLeagueTournOptions    = loadLeagueTournOptions;
window.showLinkTournamentModal   = showLinkTournamentModal;
window.handleLinkTournament      = handleLinkTournament;
window.showLeaguePickemModal     = showLeaguePickemModal;

console.log('[leagues] chargé ✓');
