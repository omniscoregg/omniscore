// ============================================================
//  i18n.js — Système de traduction (FR / EN / ES)
// ============================================================

const TRANSLATIONS = {
  fr: {
    flag: '🇫🇷', name: 'Français',
    tagline: 'Résultats esport · 17 jeux couverts',
    games: 'Jeux',
    upcoming: 'À venir',
    recentResults: 'Résultats récents',
    all: 'Tous',
    moba: 'MOBA',
    fps: 'FPS',
    fighting: 'Combat',
    br: 'Battle Royale',
    sport: 'Sport',
    card: 'Carte',
    demo: 'démo',
    noMatch: 'Aucun match trouvé pour cette sélection.',
    noUpcoming: 'Aucun match à venir.',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    tomorrow: 'Demain',
    daysAgo: (n) => `Il y a ${n}j`,
    inDays: (n) => `Dans ${n}j`,
    start: 'Début',
    end: 'Fin',
    duration: 'Durée',
    sources: 'Sources',
    bo: 'Bo',
  },
  en: {
    flag: '🇬🇧', name: 'English',
    tagline: 'Esport results · 17 games covered',
    games: 'Games',
    upcoming: 'Upcoming',
    recentResults: 'Recent results',
    all: 'All',
    moba: 'MOBA',
    fps: 'FPS',
    fighting: 'Fighting',
    br: 'Battle Royale',
    sport: 'Sport',
    card: 'Card',
    demo: 'demo',
    noMatch: 'No matches found for this selection.',
    noUpcoming: 'No upcoming matches.',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    daysAgo: (n) => `${n}d ago`,
    inDays: (n) => `In ${n}d`,
    start: 'Start',
    end: 'End',
    duration: 'Duration',
    sources: 'Sources',
    bo: 'Bo',
  },
  es: {
    flag: '🇪🇸', name: 'Español',
    tagline: 'Resultados esport · 17 juegos cubiertos',
    games: 'Juegos',
    upcoming: 'Próximos',
    recentResults: 'Resultados recientes',
    all: 'Todos',
    moba: 'MOBA',
    fps: 'FPS',
    fighting: 'Lucha',
    br: 'Battle Royale',
    sport: 'Deporte',
    card: 'Cartas',
    demo: 'demo',
    noMatch: 'No se encontraron partidas para esta selección.',
    noUpcoming: 'No hay partidas próximas.',
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    daysAgo: (n) => `Hace ${n}d`,
    inDays: (n) => `En ${n}d`,
    start: 'Inicio',
    end: 'Fin',
    duration: 'Duración',
    sources: 'Fuentes',
    bo: 'Al',
  },
};

// Langue active (détection navigateur puis fallback FR)
function detectLang() {
  const saved = localStorage.getItem('omniscore_lang');
  if (saved && TRANSLATIONS[saved]) return saved;
  const browser = navigator.language?.slice(0, 2);
  if (browser && TRANSLATIONS[browser]) return browser;
  return 'fr';
}

let currentLang = detectLang();

function t(key, ...args) {
  const val = TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS['fr'][key];
  return typeof val === 'function' ? val(...args) : val;
}

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('omniscore_lang', lang);
  applyTranslations();
  renderLangSwitcher();
}

function applyTranslations() {
  // Navbar
  const tagline = document.getElementById('navbar-tagline');
  if (tagline) tagline.textContent = t('tagline');

  // Sidebar titres
  const gamesTitle = document.getElementById('games-title');
  if (gamesTitle) gamesTitle.textContent = t('games');
  const upcomingTitle = document.getElementById('upcoming-title');
  if (upcomingTitle) upcomingTitle.textContent = t('upcoming');

  // Section label
  const resultsLabel = document.getElementById('results-label');
  if (resultsLabel) resultsLabel.textContent = t('recentResults');

  // Filtres genre
  document.querySelectorAll('.genre-btn').forEach(btn => {
    const genre = btn.dataset.genre;
    if (genre) btn.textContent = t(genre === 'all' ? 'all' : genre);
  });

  // Re-render les matchs et upcoming pour mettre à jour les dates/textes
  if (window.renderMatches) renderMatches();
  if (window.renderUpcoming) renderUpcoming();
}

function renderLangSwitcher() {
  const el = document.getElementById('lang-switcher');
  if (!el) return;
  el.innerHTML = Object.entries(TRANSLATIONS).map(([code, tr]) => `
    <button
      class="lang-btn ${code === currentLang ? 'active' : ''}"
      onclick="setLang('${code}')"
      title="${tr.name}"
    >${tr.flag}</button>
  `).join('');
}

window.i18n = { t, setLang, currentLang: () => currentLang, renderLangSwitcher, applyTranslations };
