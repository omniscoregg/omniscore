// ============================================================
//  landing.js — Page d'accueil + pop-up de bienvenue
// ============================================================

// ----------------------------------------------------------
//  Page d'accueil (pour les non-connectés)
// ----------------------------------------------------------
function showLandingPage() {
  const main = document.getElementById('matches-list');
  if (!main) return;

  main.innerHTML = `
    <div class="landing-page">

      <!-- Hero -->
      <div class="landing-hero">
        <div class="landing-logo">⚡ OMNISCORE</div>
        <div class="landing-tagline">Le site de référence des résultats esport</div>
        <div class="landing-sub">Suivez vos matchs, prédisez les résultats et grimpez dans le classement !</div>
        <div class="landing-cta-btns">
          <button class="landing-cta primary" onclick="showAuthModal('register')">Créer un compte gratuit</button>
          <button class="landing-cta secondary" onclick="showAuthModal('login')">Se connecter</button>
        </div>
        <div class="landing-games-strip">
          <span>League of Legends</span>
          <span>•</span>
          <span>Counter-Strike 2</span>
          <span>•</span>
          <span>Valorant</span>
          <span>•</span>
          <span>Dota 2</span>
          <span>•</span>
          <span>Mobile Legends</span>
          <span>•</span>
          <span>et 6 autres jeux</span>
        </div>
      </div>

      <!-- Comment ça marche -->
      <div class="landing-section">
        <div class="landing-section-title">Comment ça marche ?</div>
        <div class="landing-steps">
          <div class="landing-step">
            <div class="step-icon">📋</div>
            <div class="step-title">1. Suivez les matchs</div>
            <div class="step-desc">Résultats en temps réel, matchs en direct et à venir sur 11 jeux esport professionnels.</div>
          </div>
          <div class="landing-step">
            <div class="step-icon">🎯</div>
            <div class="step-title">2. Prédisez</div>
            <div class="step-desc">Avant chaque match, prédisez le gagnant et le score exact pour gagner des points.</div>
          </div>
          <div class="landing-step">
            <div class="step-icon">🏆</div>
            <div class="step-title">3. Grimpez</div>
            <div class="step-desc">Accumulez des points, montez en rang et défiez vos amis dans des ligues privées.</div>
          </div>
        </div>
      </div>

      <!-- Système de points -->
      <div class="landing-section dark">
        <div class="landing-section-title">Système de points</div>
        <div class="landing-points-grid">
          <div class="landing-point-card perfect">
            <div class="point-icon">🏆</div>
            <div class="point-value">+3 pts</div>
            <div class="point-label">Bon gagnant + score exact</div>
          </div>
          <div class="landing-point-card correct">
            <div class="point-icon">✅</div>
            <div class="point-value">+1 pt</div>
            <div class="point-label">Bon gagnant, mauvais score</div>
          </div>
          <div class="landing-point-card wrong">
            <div class="point-icon">❌</div>
            <div class="point-value">0 pt</div>
            <div class="point-label">Mauvais gagnant</div>
          </div>
          <div class="landing-point-card streak">
            <div class="point-icon">🔥</div>
            <div class="point-value">Bonus</div>
            <div class="point-label">Séries de bonnes prédictions</div>
            <div class="point-detail">3 consécutives = +1 · 5 = +2 · 10 = +5</div>
          </div>
          <div class="landing-point-card daily">
            <div class="point-icon">📅</div>
            <div class="point-value">+5 pts</div>
            <div class="point-label">7 jours consécutifs actifs</div>
          </div>
        </div>
      </div>

      <!-- Rangs -->
      <div class="landing-section">
        <div class="landing-section-title">Système de rangs</div>
        <div class="landing-ranks-strip">
          <div class="landing-rank-item" style="color:#cd7f32">🥉 Bronze</div>
          <div class="landing-rank-arrow">→</div>
          <div class="landing-rank-item" style="color:#c0c0c0">🥈 Argent</div>
          <div class="landing-rank-arrow">→</div>
          <div class="landing-rank-item" style="color:#ffd700">🥇 Or</div>
          <div class="landing-rank-arrow">→</div>
          <div class="landing-rank-item" style="color:#00d4ff">💎 Platine</div>
          <div class="landing-rank-arrow">→</div>
          <div class="landing-rank-item" style="color:#b9f2ff">💠 Diamant</div>
          <div class="landing-rank-arrow">→</div>
          <div class="landing-rank-item" style="color:#a855f7">🔮 Maître</div>
          <div class="landing-rank-arrow">→</div>
          <div class="landing-rank-item" style="color:#f97316">👑 Champion</div>
          <div class="landing-rank-arrow">→</div>
          <div class="landing-rank-item omni-rank" style="color:#fff">⚡ OMNI</div>
        </div>
        <div class="landing-rank-note">Chaque rang comporte 3 niveaux d'étoiles · Le rang OMNI est réservé au TOP 500</div>
      </div>

      <!-- Fonctionnalités -->
      <div class="landing-section dark">
        <div class="landing-section-title">Tout ce qu'Omniscore propose</div>
        <div class="landing-features-grid">
          <div class="landing-feature">
            <span class="feature-icon">⭐</span>
            <div>
              <div class="feature-title">Favoris</div>
              <div class="feature-desc">Suivez vos équipes et jeux préférés</div>
            </div>
          </div>
          <div class="landing-feature">
            <span class="feature-icon">⚔️</span>
            <div>
              <div class="feature-title">Ligues privées</div>
              <div class="feature-desc">Créez une ligue et défiez vos amis</div>
            </div>
          </div>
          <div class="landing-feature">
            <span class="feature-icon">🔴</span>
            <div>
              <div class="feature-title">En direct</div>
              <div class="feature-desc">Scores en temps réel sur tous les jeux</div>
            </div>
          </div>
          <div class="landing-feature">
            <span class="feature-icon">📊</span>
            <div>
              <div class="feature-title">Fiches de match</div>
              <div class="feature-desc">H2H, forme des équipes, prédictions</div>
            </div>
          </div>
          <div class="landing-feature">
            <span class="feature-icon">👥</span>
            <div>
              <div class="feature-title">Fiches d'équipes</div>
              <div class="feature-desc">Roster, winrate et prochains matchs</div>
            </div>
          </div>
          <div class="landing-feature">
            <span class="feature-icon">🌍</span>
            <div>
              <div class="feature-title">Multilingue</div>
              <div class="feature-desc">Disponible en français, anglais et espagnol</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA final -->
      <div class="landing-final-cta">
        <div class="landing-final-title">Prêt à prédire ?</div>
        <div class="landing-final-sub">Rejoignez la communauté Omniscore gratuitement</div>
        <button class="landing-cta primary large" onclick="showAuthModal('register')">Commencer maintenant</button>
        <div class="landing-final-note">Gratuit · Sans carte bancaire · 1 ligue privée offerte</div>
      </div>

    </div>
  `;
}

// ----------------------------------------------------------
//  Pop-up de bienvenue (une seule fois)
// ----------------------------------------------------------
function showWelcomePopup(username) {
  // Vérifier si déjà vu
  if (localStorage.getItem('omniscore_welcome_seen')) return;
  localStorage.setItem('omniscore_welcome_seen', '1');

  const modal = document.createElement('div');
  modal.id        = 'welcome-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box welcome-box">
      <div class="welcome-header">
        <div class="welcome-emoji">🎉</div>
        <div class="welcome-title">Bienvenue, ${username} !</div>
        <div class="welcome-sub">Vous venez de rejoindre Omniscore</div>
      </div>

      <div class="welcome-steps">
        <div class="welcome-step">
          <span class="ws-num">1</span>
          <div>
            <div class="ws-title">Explorez les matchs</div>
            <div class="ws-desc">Résultats, matchs en direct et à venir sur 11 jeux</div>
          </div>
        </div>
        <div class="welcome-step">
          <span class="ws-num">2</span>
          <div>
            <div class="ws-title">Faites vos premières prédictions</div>
            <div class="ws-desc">Cliquez sur 👈 ou 👉 sur une carte de match à venir</div>
          </div>
        </div>
        <div class="welcome-step">
          <span class="ws-num">3</span>
          <div>
            <div class="ws-title">Invitez vos amis</div>
            <div class="ws-desc">Créez une ligue privée via le bouton ⚔️</div>
          </div>
        </div>
      </div>

      <div class="welcome-points-hint">
        <span style="color:#a78bfa">🏆 +3 pts</span> score exact ·
        <span style="color:#4ade80">✅ +1 pt</span> bon gagnant ·
        <span style="color:#fbbf24">🔥 bonus</span> séries
      </div>

      <button class="form-submit" onclick="document.getElementById('welcome-modal').remove()">
        C'est parti ! 🚀
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ----------------------------------------------------------
//  Gérer l'affichage selon l'état de connexion
// ----------------------------------------------------------
function handleLandingDisplay(user) {
  const matchesList = document.getElementById('matches-list');
  if (!matchesList) return;

  if (!user) {
    // Non connecté → page d'accueil
    showLandingPage();
    // Cacher les onglets et filtres
    document.getElementById('main-tabs')?.style.setProperty('display', 'none');
  } else {
    // Connecté → afficher les matchs normalement
    document.getElementById('main-tabs')?.style.removeProperty('display');
    if (window.renderMatches) window.renderMatches();
  }
}

window.showLandingPage    = showLandingPage;
window.showWelcomePopup   = showWelcomePopup;
window.handleLandingDisplay = handleLandingDisplay;

console.log('[landing] chargé ✓');
