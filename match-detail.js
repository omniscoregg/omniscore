// ============================================================
//  match-detail.js — Fiche de match (sans imports Firebase)
// ============================================================

let predUnsubscribe = null;

// ----------------------------------------------------------
//  Ouvrir la fiche de match
// ----------------------------------------------------------
async function showMatchDetail(match, fromFavorites = false) {
  document.getElementById('match-detail-modal')?.remove();
  if (predUnsubscribe) { predUnsubscribe(); predUnsubscribe = null; }

  const colors     = window.GENRE_COLORS?.[match.genre] || { bg: '#1a1e2c', accent: '#a78bfa' };
  const isUpcoming = match.status === 'upcoming';

  const modal = document.createElement('div');
  modal.id        = 'match-detail-modal';
  modal.className = 'modal-overlay';
document.body.style.overflow = 'hidden';
  modal.innerHTML = `
    <div class="modal-box wide match-detail-box">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:10px">
          ${fromFavorites ? '<button class="back-btn" onclick="closeMatchDetail();showFavoritesPage()">← Favoris</button>' : ''}
          <div>
            <div class="md-game" style="color:${colors.accent}">${match.gameLabel}</div>
            <div class="md-tournament">${match.tournament} · ${match.format}</div>
          </div>
        </div>
        <div class="md-header-actions">
          <div id="fav-btn-t1" class="fav-btn-wrap"></div>
          <div id="fav-btn-t2" class="fav-btn-wrap"></div>
          <button class="modal-close" onclick="closeMatchDetail()">✕</button>
        </div>
      </div>

      <div class="md-teams">
        <div class="md-team left">
          <div class="td-clickable" onclick="showTeamDetail('${match.team1.name}','${match.game}',true,'${match.team1.logo || ''}')">
            ${match.team1.logo
              ? `<img src="${match.team1.logo}" class="md-logo" onerror="this.style.display='none'">`
              : `<div class="md-logo-abbr" style="background:${colors.bg};color:${colors.accent}">${abbr(match.team1.name)}</div>`}
            <div class="md-team-name ${match.winner === 1 ? 'winner' : ''}">${match.team1.name}</div>
          </div>
          <div id="form-t1" class="team-form"><span class="form-loading">...</span></div>
        </div>

        <div class="md-score-block">
          <div class="md-score">
            ${isUpcoming
              ? '<span class="md-vs">vs</span>'
              : `${match.score1 ?? '?'} <span class="md-score-sep">:</span> ${match.score2 ?? '?'}`}
          </div>
          <div class="md-date">${formatDateFull(match.date)}</div>
          ${match.date ? `<div class="md-time">${formatTimeStr(match.date)}</div>` : ''}
          <div class="md-form-label">Forme récente</div>
        </div>

        <div class="md-team right">
          <div class="td-clickable" onclick="showTeamDetail('${match.team2.name}','${match.game}',true,'${match.team2.logo || ''}')">
            ${match.team2.logo
              ? `<img src="${match.team2.logo}" class="md-logo" onerror="this.style.display='none'">`
              : `<div class="md-logo-abbr" style="background:${colors.bg};color:${colors.accent}">${abbr(match.team2.name)}</div>`}
            <div class="md-team-name ${match.winner === 2 ? 'winner' : ''}">${match.team2.name}</div>
          </div>
          <div id="form-t2" class="team-form"><span class="form-loading">...</span></div>
        </div>
      </div>

      <div id="md-h2h" class="md-h2h">
        <div class="md-h2h-title">🆚 Confrontations directes</div>
        <div id="md-h2h-content"><div class="md-pred-loading">Chargement...</div></div>
      </div>

      <div class="md-predictions">
        <div class="md-pred-title">🎯 Prédictions de la communauté</div>
        <div id="md-pred-bar"><div class="md-pred-loading">Chargement...</div></div>
        <div id="md-pred-action"></div>
      </div>

      <div class="md-status">
        <span class="md-status-badge ${isUpcoming ? 'upcoming' : 'finished'}">
          ${isUpcoming ? '🟡 À venir' : '✅ Terminé'}
        </span>
        ${match.source === 'demo' ? '<span class="demo-badge">démo</span>' : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeMatchDetail(); });

  loadFormAndPredictions(match, colors, isUpcoming);
}

async function loadFormAndPredictions(match, colors, isUpcoming) {
  const [form1, form2, h2h] = await Promise.all([
    getTeamForm(match.team1.name, match.game),
    getTeamForm(match.team2.name, match.game),
    getH2H(match.team1.name, match.team2.name, match.game),
  ]);

  const f1 = document.getElementById('form-t1');
  const f2 = document.getElementById('form-t2');
  if (f1) f1.innerHTML = renderForm(form1);
  if (f2) f2.innerHTML = renderForm(form2);

  const h2hEl = document.getElementById('md-h2h-content');
  if (h2hEl) h2hEl.innerHTML = renderH2H(h2h, match.team1.name, match.team2.name);

  await loadPredStats(match);
  await loadPredAction(match, colors, isUpcoming);
  await loadFavButtons(match);
}

async function loadFavButtons(match) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) return;

  const [isFav1, isFav2] = await Promise.all([
    window.FirebaseService.isFavorite(user.uid, match.team1.name, match.game),
    window.FirebaseService.isFavorite(user.uid, match.team2.name, match.game),
  ]);

  const btn1 = document.getElementById('fav-btn-t1');
  const btn2 = document.getElementById('fav-btn-t2');

  if (btn1) btn1.innerHTML = renderFavBtn(match.team1.name, match.game, isFav1);
  if (btn2) btn2.innerHTML = renderFavBtn(match.team2.name, match.game, isFav2);
}

function renderFavBtn(teamName, game, isFav) {
  const label = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
  const icon  = isFav ? '⭐' : '☆';
  const cls   = isFav ? 'fav-btn active' : 'fav-btn';
  const safeName = teamName.replace(/'/g, "\'");
  const safeGame = game.replace(/'/g, "\'");
  return '<button class="' + cls + '" title="' + label + '" data-team="' + teamName + '" data-game="' + game + '" onclick="handleFavClick(this)">' + icon + ' ' + teamName + '</button>';
}

async function toggleFav(teamName, game, btn) {
  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { showAuthModal('login'); return; }

  const isFav = btn.classList.contains('active');
  if (isFav) {
    await window.FirebaseService.removeFavorite(user.uid, teamName, game);
    btn.classList.remove('active');
    btn.innerHTML = '☆ ' + teamName;
    btn.title = 'Ajouter aux favoris';
  } else {
    await window.FirebaseService.addFavorite(user.uid, teamName, game);
    btn.classList.add('active');
    btn.innerHTML = '⭐ ' + teamName;
    btn.title = 'Retirer des favoris';
  }
}

// ----------------------------------------------------------
//  Forme des équipes
// ----------------------------------------------------------
async function getTeamForm(teamName, game) {
  const cfg   = window.EsportAPI?.GAME_CONFIG?.[game];
  const token = window._pandaToken;
  if (!cfg || cfg.source !== 'pandascore' || !token || token === 'VOTRE_CLE_ICI') return null;

  try {
    const params = new URLSearchParams({ game, slug: cfg.slug, status: 'past', count: '50', token });
    const res    = await fetch('https://omniscore-cache.omniscoregg.workers.dev?' + params);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data
      .filter(m => (m.opponents || []).some(o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase()))
      .slice(0, 5)
      .map(m => {
        const ops      = m.opponents || [];
        const idx      = ops.findIndex(o => o.opponent?.name?.toLowerCase() === teamName.toLowerCase());
        const res      = m.results || [];
        const myScore  = res[idx]?.score ?? 0;
        const oppScore = res[1 - idx]?.score ?? 0;
        return { won: myScore > oppScore, score: myScore + ':' + oppScore, opponent: ops[1 - idx]?.opponent?.name || '?' };
      });
  } catch(e) { return null; }
}

function renderForm(formData) {
  if (!formData || formData.length === 0) return '<span class="form-unavailable">—</span>';
  const wins = formData.filter(m => m.won).length;
  const dots = formData.map(m =>
    '<span class="form-dot ' + (m.won ? 'win' : 'loss') + '" title="' + (m.won ? 'V' : 'D') + ' vs ' + m.opponent + ' (' + m.score + ')">' + (m.won ? 'V' : 'D') + '</span>'
  ).join('');
  return '<div class="form-dots">' + dots + '</div><div class="form-record">' + wins + 'V ' + (formData.length - wins) + 'D</div>';
}

// ----------------------------------------------------------
//  Head-to-Head
// ----------------------------------------------------------
async function getH2H(team1, team2, game) {
  const cfg   = window.EsportAPI?.GAME_CONFIG?.[game];
  const token = window._pandaToken;
  if (!cfg || cfg.source !== 'pandascore' || !token || token === 'VOTRE_CLE_ICI') return [];

  try {
    const params = new URLSearchParams({ game, slug: cfg.slug, status: 'past', count: '50', token });
    const res    = await fetch('https://omniscore-cache.omniscoregg.workers.dev?' + params);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.filter(m => {
      const ops = (m.opponents || []).map(o => o.opponent?.name?.toLowerCase());
      return ops.includes(team1.toLowerCase()) && ops.includes(team2.toLowerCase());
    }).slice(0, 5).map(m => {
      const ops  = m.opponents || [];
      const res  = m.results   || [];
      const idx1 = ops.findIndex(o => o.opponent?.name?.toLowerCase() === team1.toLowerCase());
      const s1   = res[idx1]?.score ?? 0;
      const s2   = res[1 - idx1]?.score ?? 0;
      return {
        winner:     s1 > s2 ? team1 : team2,
        score1:     s1, score2: s2,
        tournament: m.league?.name || m.tournament?.name || '—',
        date:       m.scheduled_at || m.begin_at,
      };
    });
  } catch(e) { return []; }
}

function renderH2H(matches, team1, team2) {
  if (!matches || matches.length === 0) return '<div class="h2h-empty">Aucune confrontation directe trouvée.</div>';

  const t1wins = matches.filter(m => m.winner === team1).length;
  const t2wins = matches.filter(m => m.winner === team2).length;

  const rows = matches.map(m => {
    const isT1win = m.winner === team1;
    const dateStr = m.date ? new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    return '<div class="h2h-row">'
      + '<span class="h2h-team ' + (isT1win ? 'winner' : '') + '">' + team1 + '</span>'
      + '<span class="h2h-score">' + m.score1 + ' : ' + m.score2 + '</span>'
      + '<span class="h2h-team right ' + (!isT1win ? 'winner' : '') + '">' + team2 + '</span>'
      + '<span class="h2h-meta">' + m.tournament + ' · ' + dateStr + '</span>'
      + '</div>';
  }).join('');

  return '<div class="h2h-summary">'
    + '<span class="h2h-wins ' + (t1wins > t2wins ? 'leader' : '') + '">' + t1wins + 'V</span>'
    + '<span class="h2h-vs">sur ' + matches.length + ' matchs</span>'
    + '<span class="h2h-wins ' + (t2wins > t1wins ? 'leader' : '') + '">' + t2wins + 'V</span>'
    + '</div>' + rows;
}

// ----------------------------------------------------------
//  Prédictions temps réel
// ----------------------------------------------------------
async function loadPredStats(match) {
  const el = document.getElementById('md-pred-bar');
  if (!el) return;

  if (!window.FirebaseService) {
    el.innerHTML = '<div class="md-pred-empty">Connectez-vous pour voir les prédictions.</div>';
    return;
  }

  try {
    const preds = await window.FirebaseService.getPredictionsForMatch(match.id);
    renderPredBar(preds, match.team1.name, match.team2.name);

    if (window.FirebaseService.watchPredictions) {
      predUnsubscribe = window.FirebaseService.watchPredictions(match.id, preds => {
        renderPredBar(preds, match.team1.name, match.team2.name);
      });
    }
  } catch(e) {
    el.innerHTML = '<div class="md-pred-empty">Soyez le premier à prédire !</div>';
  }
}

function renderPredBar(preds, team1, team2) {
  const el = document.getElementById('md-pred-bar');
  if (!el) return;
  const total = preds.length;
  if (total === 0) { el.innerHTML = '<div class="md-pred-empty">Soyez le premier à prédire !</div>'; return; }
  const t1  = preds.filter(p => p.predictedWinner === team1).length;
  const p1  = Math.round((t1 / total) * 100);
  const p2  = 100 - p1;
  el.innerHTML = '<div class="md-pred-teams">'
    + '<span class="md-pred-team">' + team1 + '</span>'
    + '<span class="md-pred-count">' + total + ' prédiction' + (total > 1 ? 's' : '') + '</span>'
    + '<span class="md-pred-team">' + team2 + '</span>'
    + '</div>'
    + '<div class="md-pred-bar">'
    + '<div class="md-pred-fill t1" style="width:' + p1 + '%"></div>'
    + '<div class="md-pred-fill t2" style="width:' + p2 + '%"></div>'
    + '</div>'
    + '<div class="md-pred-pcts">'
    + '<span style="color:#7c88ff">' + p1 + '%</span>'
    + '<span style="color:#f87171">' + p2 + '%</span>'
    + '</div>';
}

// ----------------------------------------------------------
//  Action de prédiction dans la fiche
// ----------------------------------------------------------
async function loadPredAction(match, colors, isUpcoming = true) {
  const el   = document.getElementById('md-pred-action');
  if (!el || !window.FirebaseService) return;
  const user = window.FirebaseService.getCurrentUser();

  if (!user) {
    el.innerHTML = '<div class="pred-cta" onclick="closeMatchDetail();showAuthModal(\'login\')">Connectez-vous pour prédire</div>';
    return;
  }

  const existing = await window.FirebaseService.hasPredicted(user.uid, match.id);

  if (existing || !isUpcoming) {
    if (!existing) {
      el.innerHTML = '<div class="md-pred-empty">Aucune prédiction pour ce match.</div>';
      return;
    }
    // Afficher le résumé de la prédiction
    const icons    = { correct: '✅', wrong: '❌', perfect: '🏆' };
    const hasScore = existing.predictedScore1 !== null && existing.predictedScore1 !== undefined;
    const scoreStr = hasScore ? (existing.predictedScore1 ?? 0) + ' - ' + (existing.predictedScore2 ?? 0) : null;
    const isT1     = existing.predictedWinner === match.team1.name;
    const logo     = isT1
      ? (match.team1.logo ? '<img src="' + match.team1.logo + '" class="md-pred-team-logo">' : '')
      : (match.team2.logo ? '<img src="' + match.team2.logo + '" class="md-pred-team-logo">' : '');

    let resultHtml = '';
    if (existing.result) {
      const icon  = icons[existing.result] || '⏳';
      const label = existing.result === 'perfect' ? 'Score exact !' : existing.result === 'correct' ? 'Bon résultat !' : 'Mauvais résultat';
      resultHtml  = '<div class="md-pred-result ' + existing.result + '">' + icon + ' ' + label + ' · <strong>' + existing.points + ' pts</strong></div>';
    }

    el.innerHTML = '<div class="md-pred-summary">'
      + '<div class="md-pred-summary-label">Votre prédiction</div>'
      + '<div class="md-pred-summary-content">'
      + logo
      + '<div class="md-pred-summary-info">'
      + '<span class="md-pred-summary-team">' + existing.predictedWinner + '</span>'
      + (scoreStr ? '<span class="md-pred-summary-score">Score prédit : ' + scoreStr + '</span>' : '<span class="md-pred-summary-score">Aucun score prédit</span>')
      + '</div>'
      + '</div>'
      + resultHtml
      + '</div>';
    return;
  }

  // Formulaire de prédiction avec score
  const maxScore = match.format === 'Bo5' ? 3 : match.format === 'Bo1' ? 1 : 2;
  el.innerHTML = '<div class="md-pred-full">'
    + '<div class="md-pred-winner-label">🎯 Qui va gagner ?</div>'
    + '<div class="md-pred-winner-btns">'
    + '<button class="md-pred-btn" id="detail-btn-t1" style="border-color:' + colors.accent + '" onclick="selectDetailWinner(this,\'' + match.team1.name + '\',\'' + match.id + '\',\'' + match.format + '\')">' + match.team1.name + '</button>'
    + '<button class="md-pred-btn" id="detail-btn-t2" style="border-color:' + colors.accent + '" onclick="selectDetailWinner(this,\'' + match.team2.name + '\',\'' + match.id + '\',\'' + match.format + '\')">' + match.team2.name + '</button>'
    + '</div>'
    + '<div class="md-pred-score-row" id="detail-score-' + match.id + '" style="display:none">'
    + '<span class="pred-score-label">Score exact (optionnel) :</span>'
    + '<div class="pred-score-inputs">'
    + '<input type="number" id="detail-s1-' + match.id + '" class="pred-score-input" min="0" max="' + maxScore + '" placeholder="0">'
    + '<span class="pred-score-sep">-</span>'
    + '<input type="number" id="detail-s2-' + match.id + '" class="pred-score-input" min="0" max="' + maxScore + '" placeholder="0">'
    + '</div>'
    + '</div>'
    + '<button class="form-submit" id="detail-confirm-' + match.id + '" style="display:none;margin-top:10px" onclick="confirmDetailPred(\'' + match.id + '\',\'' + match.game + '\',\'' + match.team1.name + '\',\'' + match.team2.name + '\',\'' + match.format + '\')">'
    + 'Confirmer ma prédiction'
    + '</button>'
    + '</div>';
}

function selectDetailWinner(btn, winner, matchId, format) {
  document.querySelectorAll('.md-pred-winner-btns .md-pred-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  btn.dataset.winner = winner;

  const scoreRow   = document.getElementById('detail-score-' + matchId);
  const confirmBtn = document.getElementById('detail-confirm-' + matchId);
  if (scoreRow)   scoreRow.style.display   = 'flex';
  if (confirmBtn) confirmBtn.style.display = 'block';
}

async function confirmDetailPred(matchId, game, team1, team2, format) {
  const selectedBtn = document.querySelector('.md-pred-winner-btns .md-pred-btn.selected');
  if (!selectedBtn) return;
  const winner = selectedBtn.dataset.winner || selectedBtn.textContent.trim();

  const s1Input = document.getElementById('detail-s1-' + matchId);
  const s2Input = document.getElementById('detail-s2-' + matchId);
  const v1 = s1Input?.value;
  const v2 = s2Input?.value;
  // Les deux scores doivent être remplis pour compter
  const s1 = (v1 !== '' && v2 !== '') ? parseInt(v1) : null;
  const s2 = (v1 !== '' && v2 !== '') ? parseInt(v2) : null;

  const user = window.FirebaseService?.getCurrentUser();
  if (!user) { closeMatchDetail(); showAuthModal('login'); return; }

  await window.FirebaseService.savePrediction(user.uid, matchId, game, team1, team2, winner, s1, s2);

  const match = window._lastOpenedMatch;
  if (match) await loadPredAction(match, window.GENRE_COLORS?.[match.genre] || { accent: '#a78bfa' });
  if (window.renderMatches) window.renderMatches();
}

function closeMatchDetail() {
  if (predUnsubscribe) { predUnsubscribe(); predUnsubscribe = null; }
  document.getElementById('match-detail-modal')?.remove();
  document.body.style.overflow = '';
}

// ----------------------------------------------------------
//  Utilitaires
// ----------------------------------------------------------
function abbr(name) { return name.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase(); }
function formatTimeStr(iso) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function formatDateFull(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

window.showMatchDetail    = showMatchDetail;
window.toggleFav          = toggleFav;
window.handleFavClick     = function(btn) {
  const teamName = btn.dataset.team;
  const game     = btn.dataset.game;
  toggleFav(teamName, game, btn);
};
window.closeMatchDetail   = closeMatchDetail;
window.selectDetailWinner = selectDetailWinner;
window.confirmDetailPred  = confirmDetailPred;

window.GENRE_COLORS = {
  moba:    { bg: '#1a1f3a', accent: '#7c88ff' },
  fps:     { bg: '#1a2a1a', accent: '#4ade80' },
  fighting:{ bg: '#3a1a1a', accent: '#f87171' },
  br:      { bg: '#2a1a0a', accent: '#fbbf24' },
  sport:   { bg: '#1a2a3a', accent: '#38bdf8' },
  card:    { bg: '#2a1a3a', accent: '#c084fc' },
};

console.log('[match-detail] chargé ✓');
