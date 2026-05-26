// ============================================================
//  champions.js — Fiches champions & agents
//  LoL (Data Dragon) | Valorant (valorant-api.com)
//  Dota 2 (OpenDota) | R6 (statique + r6operators CDN)
// ============================================================

var CHAMP_CONFIG = {
  lol:      { label: 'Champions', accent: '#7c88ff' },
  valorant: { label: 'Agents',    accent: '#4ade80' },
  dota2:    { label: 'Héros',     accent: '#b45af2' },
  r6:       { label: 'Opérateurs',accent: '#f97316' },
};

// CDN r6operators pour les icônes
var R6_ICON_CDN = 'https://r6operators.marcopixel.eu/icons/png/';

// ----------------------------------------------------------
//  Entrée principale
// ----------------------------------------------------------
async function loadChampionsForGame(gameKey, container) {
  container.innerHTML = '<div style="padding:40px;text-align:center"><div class="lb-loading">Chargement...</div></div>';
  try {
    const data = await fetchChampions(gameKey);
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="lb-empty">Aucune donnée disponible.</div>';
      return;
    }
    renderChampionGrid(gameKey, data, container);
  } catch(e) {
    console.error('[Champions]', gameKey, e);
    container.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}

// ----------------------------------------------------------
//  Fetch selon le jeu
// ----------------------------------------------------------
async function fetchChampions(gameKey) {
  switch(gameKey) {
    case 'lol':      return fetchLoLChampions();
    case 'valorant': return fetchValorantAgents();
    case 'dota2':    return fetchDota2Heroes();
    case 'r6':       return getR6Operators();
    default:         return [];
  }
}

// ----------------------------------------------------------
//  League of Legends — Data Dragon
// ----------------------------------------------------------
async function fetchLoLChampions() {
  const verRes  = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await verRes.json();
  const version  = versions[0];

  const res  = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`);
  const json = await res.json();

  return Object.values(json.data).map(c => ({
    id:      c.id,
    name:    c.name,
    title:   c.title,
    roles:   c.tags || [],
    image:   `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`,
    blurb:   c.blurb,
    version: version,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// Charger les sorts d'un champion LoL
async function fetchLoLChampionDetail(champId, version) {
  const res  = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion/${champId}.json`);
  const json = await res.json();
  const c    = json.data[champId];
  if (!c) return null;
  return {
    passive: {
      name:  c.passive.name,
      desc:  c.passive.description.replace(/<[^>]+>/g, ''),
      image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${c.passive.image.full}`,
    },
    spells: c.spells.map((s, i) => ({
      key:   ['Q','W','E','R'][i],
      name:  s.name,
      desc:  s.description.replace(/<[^>]+>/g, ''),
      image: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${s.image.full}`,
    })),
  };
}

// ----------------------------------------------------------
//  Valorant — valorant-api.com
// ----------------------------------------------------------
async function fetchValorantAgents() {
  const res  = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=fr-FR');
  const json = await res.json();

  return json.data.map(a => ({
    id:         a.uuid,
    name:       a.displayName,
    title:      a.developerName || '',
    roles:      [a.role?.displayName || ''],
    roleIcon:   a.role?.displayIcon || null,
    image:      a.displayIcon,
    fullImage:  a.fullPortrait || a.displayIcon,
    blurb:      a.description,
    abilities:  (a.abilities || []).map(ab => ({
      slot:   ab.slot,
      name:   ab.displayName,
      desc:   ab.description,
      image:  ab.displayIcon,
    })),
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// ----------------------------------------------------------
//  Dota 2 — OpenDota
// ----------------------------------------------------------
async function fetchDota2Heroes() {
  const [heroesRes, statsRes] = await Promise.all([
    fetch('https://api.opendota.com/api/heroes'),
    fetch('https://api.opendota.com/api/heroStats'),
  ]);
  const heroes = await heroesRes.json();
  const stats  = await statsRes.json();

  const statsMap = {};
  stats.forEach(h => { statsMap[h.id] = h; });

  const attrLabels = { str: '💪 Force', agi: '⚡ Agilité', int: '🧠 Intelligence', all: '✨ Universel' };

  return heroes.map(h => {
    const stat    = statsMap[h.id] || {};
    const imgPath = stat.img ? 'https://cdn.cloudflare.steamstatic.com' + stat.img : null;
    return {
      id:    h.id,
      name:  h.localized_name,
      title: attrLabels[h.primary_attr] || '',
      roles: h.roles || [],
      image: imgPath,
      blurb: (h.roles || []).join(' · '),
      attr:  h.primary_attr,
      stats: stat ? {
        hp:     stat.base_health + stat.base_str * 22,
        armor:  stat.base_armor,
        speed:  stat.move_speed,
        attack: `${stat.base_attack_min}-${stat.base_attack_max}`,
      } : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

// ----------------------------------------------------------
//  R6 Siege — données statiques + icônes r6operators CDN
// ----------------------------------------------------------
function getR6Operators() {
  var ops = [
    // ── ATTAQUANTS ──
    { id:'sledge',     name:'Sledge',     side:'Attaque', org:'SAS',          speed:2, armor:2, gadget:'Bélier de brèche',           gadgetDesc:'Crée des ouvertures dans les murs mous sans alerter les défenseurs.' },
    { id:'thatcher',   name:'Thatcher',   side:'Attaque', org:'SAS',          speed:2, armor:2, gadget:'Grenade EMP',                gadgetDesc:'Neutralise les gadgets électroniques à travers les murs.' },
    { id:'ash',        name:'Ash',        side:'Attaque', org:'FBI SWAT',      speed:3, armor:1, gadget:'Lance-grenades M120 CREM',   gadgetDesc:'Détruit les barricades, barbelés et gadgets à distance.' },
    { id:'thermite',   name:'Thermite',   side:'Attaque', org:'FBI SWAT',      speed:2, armor:2, gadget:'Charge Exothermic-C',        gadgetDesc:'La seule charge capable de détruire les murs renforcés.' },
    { id:'twitch',     name:'Twitch',     side:'Attaque', org:'GIGN',          speed:2, armor:2, gadget:'Drone Shock',                gadgetDesc:'Drone télécommandé qui détruit les gadgets défenseurs.' },
    { id:'montagne',   name:'Montagne',   side:'Attaque', org:'GIGN',          speed:1, armor:3, gadget:'Bouclier Le Rocher',          gadgetDesc:'Bouclier extensible qui couvre entièrement l\'opérateur.' },
    { id:'glaz',       name:'Glaz',       side:'Attaque', org:'SPETSNAZ',      speed:3, armor:1, gadget:'Lunette thermique',           gadgetDesc:'Permet de voir et tirer à travers la fumée.' },
    { id:'fuze',       name:'Fuze',       side:'Attaque', org:'SPETSNAZ',      speed:1, armor:3, gadget:'Cluster Charge',              gadgetDesc:'Perfore les surfaces douces pour lancer des grenades.' },
    { id:'blitz',      name:'Blitz',      side:'Attaque', org:'GSG 9',         speed:2, armor:2, gadget:'Flash-Shield',                gadgetDesc:'Bouclier avec flash intégré qui aveugle les défenseurs.' },
    { id:'iq',         name:'IQ',         side:'Attaque', org:'GSG 9',         speed:3, armor:1, gadget:'Électronique Scanner',         gadgetDesc:'Détecte et localise tous les gadgets électroniques.' },
    { id:'buck',       name:'Buck',       side:'Attaque', org:'JTF2',          speed:2, armor:2, gadget:'Skeleton Key',                gadgetDesc:'Sous-canon multi-coups fixé sur le fusil pour détruire les murs.' },
    { id:'blackbeard', name:'Blackbeard', side:'Attaque', org:'NAVY SEAL',     speed:2, armor:2, gadget:'Rifle Shield',                gadgetDesc:'Bouclier fixé sur la lunette pour se couvrir la tête.' },
    { id:'hibana',     name:'Hibana',     side:'Attaque', org:'SAT',           speed:3, armor:1, gadget:'X-KAIROS',                   gadgetDesc:'Projectiles explosifs qui détruisent les murs renforcés à distance.' },
    { id:'jackal',     name:'Jackal',     side:'Attaque', org:'GEO',           speed:2, armor:2, gadget:'Eyenox Model III',            gadgetDesc:'Scanne et traque les empreintes de pas des défenseurs.' },
    { id:'ying',       name:'Ying',       side:'Attaque', org:'SDU',           speed:2, armor:2, gadget:'Candela',                    gadgetDesc:'Disque roulant qui émet des flashs multiples simultanés.' },
    { id:'lion',       name:'Lion',       side:'Attaque', org:'GIGN',          speed:2, armor:2, gadget:'EE-ONE-D',                   gadgetDesc:'Révèle tous les ennemis qui bougent sur toute la carte.' },
    { id:'finka',      name:'Finka',      side:'Attaque', org:'CBRN',          speed:2, armor:2, gadget:'Poussée d\'adrénaline',       gadgetDesc:'Boost instantané de toute l\'équipe attaquante.' },
    { id:'maverick',   name:'Maverick',   side:'Attaque', org:'NIGHTHAVEN',    speed:3, armor:1, gadget:'Torche Breaching',            gadgetDesc:'Brûle silencieusement les murs renforcés de façon précise.' },
    { id:'nomad',      name:'Nomad',      side:'Attaque', org:'GIGR',          speed:2, armor:2, gadget:'Airjab',                     gadgetDesc:'Mines de proximité qui repoussent les défenseurs.' },
    { id:'gridlock',   name:'Gridlock',   side:'Attaque', org:'SASR',          speed:1, armor:3, gadget:'Trax Stingers',              gadgetDesc:'Couvre le sol de pièges qui blessent et ralentissent.' },
    { id:'amaru',      name:'Amaru',      side:'Attaque', org:'APCA',          speed:2, armor:2, gadget:'Garra Hook',                 gadgetDesc:'Grappin pour entrer instantanément par les fenêtres.' },
    { id:'kali',       name:'Kali',       side:'Attaque', org:'NIGHTHAVEN',    speed:3, armor:1, gadget:'LV Lance-Nade',               gadgetDesc:'Perce les sols et plafonds pour éliminer les défenseurs.' },
    { id:'iana',       name:'Iana',       side:'Attaque', org:'REU',           speed:2, armor:2, gadget:'Gemini Replicator',           gadgetDesc:'Hologramme clone contrôlable à distance pour le repérage.' },
    { id:'ace',        name:'Ace',        side:'Attaque', org:'NIGHTHAVEN',    speed:2, armor:2, gadget:'S.E.L.M.A.',                  gadgetDesc:'Appareil qui détruit les renforts en rafale progressive.' },
    { id:'zero',       name:'Zero',       side:'Attaque', org:'ECHELON',       speed:3, armor:1, gadget:'Argus Camera',               gadgetDesc:'Caméra pénétrante qui hackle les gadgets défenseurs.' },
    { id:'flores',     name:'Flores',     side:'Attaque', org:'AFEAU',         speed:2, armor:2, gadget:'RCE-Ratero Drone',            gadgetDesc:'Drone télécommandé qui explose sur commande.' },
    { id:'osa',        name:'Osa',        side:'Attaque', org:'NIGHTHAVEN',    speed:1, armor:3, gadget:'Talon-8 Shield',              gadgetDesc:'Bouclier transparent deployable pour sécuriser une zone.' },
    { id:'sens',       name:'Sens',       side:'Attaque', org:'CBRN',          speed:3, armor:1, gadget:'R.O.U Projector',             gadgetDesc:'Déploie un rideau de fumée mobile sur le sol.' },
    { id:'grim',       name:'Grim',       side:'Attaque', org:'NIGHTHAVEN',    speed:3, armor:1, gadget:'Kawan Hive Launcher',         gadgetDesc:'Micro-drones qui révèlent les ennemis dans une zone.' },
    { id:'ram',        name:'Ram',        side:'Attaque', org:'707th SMB',     speed:1, armor:3, gadget:'BU-GI Auto-Breacher',         gadgetDesc:'Détruit automatiquement murs et gadgets dans son passage.' },
    // ── DÉFENSEURS ──
    { id:'smoke',      name:'Smoke',      side:'Défense', org:'SAS',           speed:2, armor:2, gadget:'Grenade à déclenchement',     gadgetDesc:'Grenades à gaz activables à distance pour contrôler les zones.' },
    { id:'mute',       name:'Mute',       side:'Défense', org:'SAS',           speed:1, armor:3, gadget:'Signal Jammer',               gadgetDesc:'Brouille les drones et gadgets à déclenchement dans sa zone.' },
    { id:'castle',     name:'Castle',     side:'Défense', org:'FBI SWAT',      speed:2, armor:2, gadget:'Armor Pack',                  gadgetDesc:'Barricades en kevlar résistantes aux balles et explosions.' },
    { id:'pulse',      name:'Pulse',      side:'Défense', org:'FBI SWAT',      speed:3, armor:1, gadget:'Heartbeat Sensor',            gadgetDesc:'Détecte les battements de coeur des attaquants à travers les murs.' },
    { id:'doc',        name:'Doc',        side:'Défense', org:'GIGN',          speed:1, armor:3, gadget:'Stim Pistol',                 gadgetDesc:'Pistolet de soin qui soigne ou booste lui-même et ses alliés.' },
    { id:'rook',       name:'Rook',       side:'Défense', org:'GIGN',          speed:1, armor:3, gadget:'Armor Pack',                  gadgetDesc:'Dépose un sac d\'armures renforcées pour toute l\'équipe.' },
    { id:'kapkan',     name:'Kapkan',     side:'Défense', org:'SPETSNAZ',      speed:2, armor:2, gadget:'EDD Mk II',                   gadgetDesc:'Mines piégées dans les encadrements de fenêtres et portes.' },
    { id:'tachanka',   name:'Tachanka',   side:'Défense', org:'SPETSNAZ',      speed:1, armor:3, gadget:'Shumikha Launcher',           gadgetDesc:'Lance des grenades incendiaires pour contrôler les zones.' },
    { id:'jager',      name:'Jäger',      side:'Défense', org:'GSG 9',         speed:3, armor:1, gadget:'ADS',                        gadgetDesc:'Intercepte et détruit automatiquement les grenades ennemies.' },
    { id:'bandit',     name:'Bandit',     side:'Défense', org:'GSG 9',         speed:3, armor:1, gadget:'Shock Wire',                  gadgetDesc:'Électrifie les barbelés et les murs renforcés pour détruire les charges.' },
    { id:'frost',      name:'Frost',      side:'Défense', org:'JTF2',          speed:2, armor:2, gadget:'Welcome Mat',                 gadgetDesc:'Piège à ours qui neutralise instantanément les ennemis.' },
    { id:'echo',       name:'Echo',       side:'Défense', org:'SAT',           speed:1, armor:3, gadget:'Yokai',                      gadgetDesc:'Drone volant invisible qui émet des ultrasons désorienter.' },
    { id:'caveira',    name:'Caveira',    side:'Défense', org:'BOPE',          speed:3, armor:1, gadget:'Silent Step + Interrogation', gadgetDesc:'Se déplace silencieusement et révèle la position de toute l\'équipe ennemie.' },
    { id:'valkyrie',   name:'Valkyrie',   side:'Défense', org:'NAVY SEAL',     speed:2, armor:2, gadget:'Black Eye',                   gadgetDesc:'Mini-caméras deployables pour surveiller plusieurs zones.' },
    { id:'lesion',     name:'Lesion',     side:'Défense', org:'SDU',           speed:2, armor:2, gadget:'Gu Mines',                   gadgetDesc:'Aiguilles empoisonnées invisibles qui ralentissent et blessent.' },
    { id:'ela',        name:'Ela',        side:'Défense', org:'GROM',          speed:3, armor:1, gadget:'Grzmot Mine',                 gadgetDesc:'Mines concussion qui désorientent les attaquants.' },
    { id:'vigil',      name:'Vigil',      side:'Défense', org:'707th SMB',     speed:3, armor:1, gadget:'ERC-7',                      gadgetDesc:'Disparaît temporairement des caméras et drones ennemis.' },
    { id:'maestro',    name:'Maestro',    side:'Défense', org:'GIS',           speed:1, armor:3, gadget:'Evil Eye',                   gadgetDesc:'Tourelle laser résistante aux balles, contrôlée à distance.' },
    { id:'alibi',      name:'Alibi',      side:'Défense', org:'GIS',           speed:3, armor:1, gadget:'Prisma',                     gadgetDesc:'Hologrammes parfaits qui leurre et marque les attaquants.' },
    { id:'mozzie',     name:'Mozzie',     side:'Défense', org:'SASR',          speed:2, armor:2, gadget:'Pest',                       gadgetDesc:'Capture les drones attaquants pour les retourner contre eux.' },
    { id:'warden',     name:'Warden',     side:'Défense', org:'SECRET SERVICE', speed:1, armor:3, gadget:'Glance Smart Glasses',      gadgetDesc:'Voit à travers la fumée et n\'est pas aveuglé par les flashs.' },
    { id:'goyo',       name:'Goyo',       side:'Défense', org:'FUERZAS ESPECIALES', speed:1, armor:3, gadget:'Volcan Shield',        gadgetDesc:'Bouclier piégé qui explose et crée une zone incendiaire.' },
    { id:'wamai',      name:'Wamai',      side:'Défense', org:'NIGHTHAVEN',    speed:2, armor:2, gadget:'Mag-NET',                    gadgetDesc:'Intercepte et redirige les grenades et gadgets ennemis.' },
    { id:'oryx',       name:'Oryx',       side:'Défense', org:'GIGR',          speed:3, armor:1, gadget:'Remah Dash',                 gadgetDesc:'Charge à travers les barricades et peut escalader les brèches.' },
    { id:'melusi',     name:'Melusi',     side:'Défense', org:'INKABA',        speed:2, armor:2, gadget:'Banshee',                    gadgetDesc:'Capteurs soniques qui ralentissent les attaquants qui s\'approchent.' },
    { id:'aruni',      name:'Aruni',      side:'Défense', org:'NIGHTHAVEN',    speed:2, armor:2, gadget:'Surya Gate',                 gadgetDesc:'Barrière laser qui détruit gadgets et ralentit les ennemis.' },
    { id:'thunderbird',name:'Thunderbird',side:'Défense', org:'CJIRU',         speed:2, armor:2, gadget:'Kóna Station',               gadgetDesc:'Distributeur automatique de soins pour les alliés proches.' },
    { id:'thorn',      name:'Thorn',      side:'Défense', org:'ERG',           speed:2, armor:2, gadget:'Razorbloom',                 gadgetDesc:'Mine à déclenchement temporisé après activation.' },
    { id:'azami',      name:'Azami',      side:'Défense', org:'SAT',           speed:2, armor:2, gadget:'Kiba Barrier',               gadgetDesc:'Crée des boucliers circulaires dans les brèches des murs.' },
    { id:'solis',      name:'Solis',      side:'Défense', org:'AFEAU',         speed:2, armor:2, gadget:'SPEC-IO Electro-Sensor',      gadgetDesc:'Détecte et localise les gadgets électroniques attaquants.' },
    { id:'fenrir',     name:'Fenrir',     side:'Défense', org:'FMK',           speed:2, armor:2, gadget:'F-NATT Dread Mine',          gadgetDesc:'Mines activables à distance qui sèment la peur et ralentissent.' },
    { id:'tubarao',    name:'Tubarão',    side:'Défense', org:'DAE',           speed:2, armor:2, gadget:'Zoto Canister',              gadgetDesc:'Congèle les gadgets attaquants dans une zone.' },
  ];

  // Ajouter l'image depuis le CDN r6operators
  return ops.map(op => ({
    ...op,
    roles: [op.side],
    image: R6_ICON_CDN + op.id + '.png',
    blurb: op.gadgetDesc,
    abilities: [{
      slot: 'GADGET',
      name: op.gadget,
      desc: op.gadgetDesc,
      image: null,
    }],
  }));
}

// ----------------------------------------------------------
//  Rendu de la grille
// ----------------------------------------------------------
function renderChampionGrid(gameKey, champions, container) {
  var cfg    = CHAMP_CONFIG[gameKey] || {};
  var accent = cfg.accent || '#a78bfa';
  var lang   = window.i18n ? window.i18n.currentLang() : 'fr';

  var isR6   = gameKey === 'r6';
  var filterValues = isR6
    ? ['Attaque', 'Défense']
    : [...new Set(champions.flatMap(c => c.roles || []))].filter(Boolean).sort();

  var fl = { fr:{ all:'Tous', search:'Rechercher...' }, en:{ all:'All', search:'Search...' }, es:{ all:'Todos', search:'Buscar...' } }[lang] || { all:'Tous', search:'Rechercher...' };

  var filtersHtml = filterValues.length > 1 ? `
    <div class="champ-filters">
      <button class="champ-filter-btn active" data-filter="all" onclick="filterChampions(this,'all')" style="background:${accent};border-color:${accent};color:#fff">${fl.all}</button>
      ${filterValues.map(r => `<button class="champ-filter-btn" data-filter="${r}" onclick="filterChampions(this,'${r}')">${r}</button>`).join('')}
    </div>` : '';

  var cardsHtml = champions.map(c => renderChampCard(c, gameKey, accent)).join('');

  container.innerHTML = `
    <div class="champ-toolbar">
      <input type="text" class="champ-search" placeholder="${fl.search}" oninput="filterChampionSearch(this.value)">
      ${filtersHtml}
    </div>
    <div class="champ-grid" id="champ-grid">${cardsHtml}</div>
  `;

  window._champData = champions;
  window._champGame = gameKey;
}

function renderChampCard(c, gameKey, accent) {
  var isR6      = gameKey === 'r6';
  var roleStr   = isR6 ? c.side : (c.roles || []).join(', ');
  var sideColor = c.side === 'Attaque' ? '#4ade80' : c.side === 'Défense' ? '#f87171' : accent;
  var filterVal = isR6 ? (c.side || '') : (c.roles || []).join(' ');
  var attrIcons = { str:'💪', agi:'⚡', int:'🧠', all:'✨' };
  var attrHtml  = c.attr ? `<span class="champ-attr">${attrIcons[c.attr] || ''}</span>` : '';

  return `
    <div class="champ-card" data-filter="${filterVal}" data-name="${c.name.toLowerCase()}" onclick="showChampDetail('${String(c.id).replace(/'/g,"\\'")}','${gameKey}')">
      <div class="champ-img-wrap">
        ${c.image ? `<img src="${c.image}" class="champ-img" alt="${c.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
        <div class="champ-img-fallback" style="${c.image?'display:none':'display:flex'};color:${accent}">${c.name[0]}</div>
        ${attrHtml}
      </div>
      <div class="champ-info">
        <div class="champ-name">${c.name}</div>
        ${c.title ? `<div class="champ-title">${c.title}</div>` : ''}
        <div class="champ-role" style="color:${isR6 ? sideColor : accent}">${roleStr}</div>
      </div>
    </div>`;
}

// ----------------------------------------------------------
//  Filtrage
// ----------------------------------------------------------
function filterChampions(btn, filterVal) {
  document.querySelectorAll('.champ-filter-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.color = '';
    b.style.borderColor = '';
  });
  var accent = CHAMP_CONFIG[window._champGame]?.accent || '#a78bfa';
  btn.classList.add('active');
  btn.style.background   = accent;
  btn.style.color        = '#fff';
  btn.style.borderColor  = accent;

  var searchVal = document.querySelector('.champ-search')?.value?.toLowerCase() || '';
  document.querySelectorAll('#champ-grid .champ-card').forEach(card => {
    var matchFilter = filterVal === 'all' || (card.dataset.filter || '').includes(filterVal);
    var matchSearch = !searchVal || (card.dataset.name || '').includes(searchVal);
    card.style.display = matchFilter && matchSearch ? '' : 'none';
  });
}

function filterChampionSearch(val) {
  var searchVal    = val.toLowerCase();
  var activeFilter = document.querySelector('.champ-filter-btn.active')?.dataset.filter || 'all';
  document.querySelectorAll('#champ-grid .champ-card').forEach(card => {
    var matchFilter = activeFilter === 'all' || (card.dataset.filter || '').includes(activeFilter);
    var matchSearch = !searchVal || (card.dataset.name || '').includes(searchVal);
    card.style.display = matchFilter && matchSearch ? '' : 'none';
  });
}

// ----------------------------------------------------------
//  Modal détail champion avec compétences
// ----------------------------------------------------------
async function showChampDetail(champId, gameKey) {
  var data   = window._champData?.find(c => String(c.id) === String(champId));
  if (!data) return;

  var cfg    = CHAMP_CONFIG[gameKey] || {};
  var accent = cfg.accent || '#a78bfa';
  var isR6   = gameKey === 'r6';

  document.getElementById('champ-detail-modal')?.remove();

  var modal = document.createElement('div');
  modal.id        = 'champ-detail-modal';
  modal.className = 'modal-overlay';

  var roleStr   = isR6 ? data.side : (data.roles || []).join(' · ');
  var sideColor = data.side === 'Attaque' ? '#4ade80' : data.side === 'Défense' ? '#f87171' : accent;
  var attrIcons = { str:'💪 Force', agi:'⚡ Agilité', int:'🧠 Intelligence', all:'✨ Universel' };

  // Stats R6
  var r6StatsHtml = isR6 ? `
    <div class="champ-detail-stats">
      <div class="champ-detail-stat"><span class="champ-stat-label">Organisation</span><span class="champ-stat-value" style="font-size:11px">${data.org || '—'}</span></div>
      <div class="champ-detail-stat"><span class="champ-stat-label">Vitesse</span><span class="champ-stat-value">${'⚡'.repeat(data.speed||0)}${'·'.repeat(3-(data.speed||0))}</span></div>
      <div class="champ-detail-stat"><span class="champ-stat-label">Armure</span><span class="champ-stat-value">${'🛡️'.repeat(data.armor||0)}${'·'.repeat(3-(data.armor||0))}</span></div>
    </div>` : '';

  // Stats Dota
  var dotaStatsHtml = gameKey === 'dota2' && data.stats ? `
    <div class="champ-detail-stats">
      <div class="champ-detail-stat"><span class="champ-stat-label">HP</span><span class="champ-stat-value">${data.stats.hp}</span></div>
      <div class="champ-detail-stat"><span class="champ-stat-label">Armure</span><span class="champ-stat-value">${data.stats.armor}</span></div>
      <div class="champ-detail-stat"><span class="champ-stat-label">Vitesse</span><span class="champ-stat-value">${data.stats.speed}</span></div>
      <div class="champ-detail-stat"><span class="champ-stat-label">Attaque</span><span class="champ-stat-value">${data.stats.attack}</span></div>
    </div>` : '';

  modal.innerHTML = `
    <div class="modal-box champ-detail-box">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="champ-detail-img-wrap">
            ${data.image ? `<img src="${data.image}" class="champ-detail-img" onerror="this.style.display='none'">` : ''}
            <div class="champ-img-fallback large" style="${data.image?'display:none':'display:flex'};color:${accent}">${data.name[0]}</div>
          </div>
          <div>
            <div class="champ-detail-name" style="color:${accent}">${data.name}</div>
            ${data.title ? `<div class="champ-detail-title">${data.title}</div>` : ''}
            <div class="champ-detail-role" style="color:${isR6 ? sideColor : accent}">${roleStr}</div>
            ${data.attr ? `<div class="champ-detail-attr">${attrIcons[data.attr]||''}</div>` : ''}
          </div>
        </div>
        <button class="modal-close" onclick="document.getElementById('champ-detail-modal').remove()">✕</button>
      </div>
      ${r6StatsHtml}
      ${dotaStatsHtml}
      ${data.blurb ? `<div class="champ-detail-blurb">${data.blurb}</div>` : ''}
      <div id="champ-abilities-section" class="champ-abilities-loading">
        ${data.abilities ? '' : '<div class="lb-loading" style="padding:16px;text-align:center">Chargement des compétences...</div>'}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Charger les compétences
  await loadAbilities(data, gameKey, accent);
}

async function loadAbilities(data, gameKey, accent) {
  var section = document.getElementById('champ-abilities-section');
  if (!section) return;

  var abilities = data.abilities || null;

  // LoL : charger depuis champion/{id}.json
  if (gameKey === 'lol' && !abilities) {
    try {
      var detail = await fetchLoLChampionDetail(data.id, data.version);
      if (detail) {
        abilities = [
          { slot:'P', name: detail.passive.name, desc: detail.passive.desc, image: detail.passive.image },
          ...detail.spells.map(s => ({ slot: s.key, name: s.name, desc: s.desc, image: s.image })),
        ];
      }
    } catch(e) { console.warn('[LoL abilities]', e); }
  }

  if (!abilities || abilities.length === 0) {
    section.innerHTML = '';
    return;
  }

  var abilitiesHtml = abilities.map(ab => `
    <div class="champ-ability-row">
      <div class="champ-ability-left">
        ${ab.image ? `<img src="${ab.image}" class="champ-ability-icon" onerror="this.style.display='none'">` : ''}
        <span class="champ-ability-slot" style="color:${accent}">${ab.slot || ''}</span>
      </div>
      <div class="champ-ability-info">
        <div class="champ-ability-name" style="color:${accent}">${ab.name || ''}</div>
        ${ab.desc ? `<div class="champ-ability-desc">${ab.desc}</div>` : ''}
      </div>
    </div>
  `).join('');

  var titleMap = { lol:'Compétences', valorant:'Capacités', dota2:'Rôles', r6:'Gadget' };
  section.innerHTML = `
    <div class="champ-abilities-section">
      <div class="champ-abilities-title" style="color:${accent}">⚔️ ${titleMap[gameKey] || 'Compétences'}</div>
      ${abilitiesHtml}
    </div>
  `;
}

// Exposer globalement
window.loadChampionsForGame = loadChampionsForGame;
window.filterChampions      = filterChampions;
window.filterChampionSearch = filterChampionSearch;
window.showChampDetail      = showChampDetail;

console.log('[champions] chargé ✓');
