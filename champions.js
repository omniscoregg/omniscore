// ============================================================
//  champions.js — Fiches champions & agents
//  Jeux : LoL (Data Dragon) | Valorant (valorant-api.com)
//         Dota 2 (OpenDota) | R6 Siege (statique r6operators)
// ============================================================

// ----------------------------------------------------------
//  Config par jeu
// ----------------------------------------------------------
var CHAMP_CONFIG = {
  lol: {
    label: 'Champions',
    accent: '#7c88ff',
    roles: { Assassin:'Assassin', Fighter:'Combattant', Mage:'Mage', Marksman:'Tireur', Support:'Support', Tank:'Tank' },
  },
  valorant: {
    label: 'Agents',
    accent: '#4ade80',
    roles: { Duelist:'Duelliste', Initiator:'Initiateur', Controller:'Contrôleur', Sentinel:'Sentinelle' },
  },
  dota2: {
    label: 'Héros',
    accent: '#7c88ff',
    roles: {},
  },
  r6: {
    label: 'Opérateurs',
    accent: '#4ade80',
    roles: { Attacker:'Attaquant', Defender:'Défenseur' },
  },
};

// ----------------------------------------------------------
//  Entrée principale — appelée par esport-info.js
// ----------------------------------------------------------
async function loadChampionsForGame(gameKey, container) {
  container.innerHTML = '<div class="champ-loading"><div class="lb-loading">Chargement...</div></div>';

  try {
    const data = await fetchChampions(gameKey);
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="lb-empty">Aucune donnée disponible.</div>';
      return;
    }
    renderChampionGrid(gameKey, data, container);
  } catch(e) {
    console.error('[Champions]', e);
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
//  League of Legends — Riot Data Dragon
// ----------------------------------------------------------
async function fetchLoLChampions() {
  // Récupérer la version actuelle
  const verRes  = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await verRes.json();
  const version  = versions[0];

  const res  = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`);
  const json = await res.json();

  return Object.values(json.data).map(c => ({
    id:     c.id,
    name:   c.name,
    title:  c.title,
    roles:  c.tags || [],
    image:  `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`,
    blurb:  c.blurb,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// ----------------------------------------------------------
//  Valorant — valorant-api.com
// ----------------------------------------------------------
async function fetchValorantAgents() {
  const res  = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=fr-FR');
  const json = await res.json();

  return json.data.map(a => ({
    id:     a.uuid,
    name:   a.displayName,
    title:  a.developerName || '',
    roles:  [a.role?.displayName || ''],
    image:  a.displayIcon,
    blurb:  a.description,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// ----------------------------------------------------------
//  Dota 2 — OpenDota API
// ----------------------------------------------------------
async function fetchDota2Heroes() {
  const [heroesRes, statsRes] = await Promise.all([
    fetch('https://api.opendota.com/api/heroes'),
    fetch('https://api.opendota.com/api/heroStats'),
  ]);
  const heroes = await heroesRes.json();
  const stats  = await statsRes.json();

  // Map stats par id pour les images
  const statsMap = {};
  stats.forEach(h => { statsMap[h.id] = h; });

  return heroes.map(h => {
    const stat = statsMap[h.id] || {};
    const imgPath = stat.img ? 'https://cdn.cloudflare.steamstatic.com' + stat.img : null;
    return {
      id:    h.id,
      name:  h.localized_name,
      title: '',
      roles: h.roles || [],
      image: imgPath,
      blurb: (h.roles || []).join(' · '),
      attr:  h.primary_attr, // str / agi / int / all
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

// ----------------------------------------------------------
//  Rainbow Six Siege — données statiques (r6operators)
// ----------------------------------------------------------
function getR6Operators() {
  return [
    // Attaquants
    { id:'sledge',    name:'Sledge',    roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/5PduhX7K5jPZqwA3ikBnQH/18e1bb9efa5af2c2df6e748fb22a4f6a/R6_OPERATOR_R_sledge.png',    blurb:'Bélier de brèche — crée des ouvertures dans les murs mous.',     side:'Attaque',   org:'SAS',         speed:2, armor:2 },
    { id:'thatcher',  name:'Thatcher',  roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/3a25C3HqQD1V3VNMaW3WoW/a2c1f6a1b2e5e9b2b2b2b2b2b2b2b2b2/R6_OPERATOR_R_thatcher.png', blurb:'Neutralise les gadgets électroniques ennemis.',                  side:'Attaque',   org:'SAS',         speed:2, armor:2 },
    { id:'ash',       name:'Ash',       roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/3wZmzAiCGfnNHiPVlbNWQW/4c5e8a1b2b2b2b2b2b2b2b2b2b2b2b2b/R6_OPERATOR_R_ash.png',      blurb:'Lance-grenades M120 CREM pour détruire barricades et gadgets.',  side:'Attaque',   org:'FBI SWAT',    speed:3, armor:1 },
    { id:'thermite',  name:'Thermite',  roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/thermite/img.png',  blurb:'Charge Exothermic-C — détruit les murs renforcés.',             side:'Attaque',   org:'FBI SWAT',    speed:2, armor:2 },
    { id:'twitch',    name:'Twitch',    roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/twitch/img.png',    blurb:'Drone Shock — détruit les gadgets défenseurs à distance.',      side:'Attaque',   org:'GIGN',        speed:2, armor:2 },
    { id:'montagne',  name:'Montagne',  roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/montagne/img.png',  blurb:'Bouclier Le Rocher extensible — protection maximale.',           side:'Attaque',   org:'GIGN',        speed:1, armor:3 },
    { id:'glaz',      name:'Glaz',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/glaz/img.png',      blurb:'Sniper à lunette thermique — voit à travers la fumée.',         side:'Attaque',   org:'SPETSNAZ',    speed:3, armor:1 },
    { id:'fuze',      name:'Fuze',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/fuze/img.png',      blurb:'Cluster charge — perfore les surfaces pour lancer des grenades.',side:'Attaque',   org:'SPETSNAZ',    speed:1, armor:3 },
    { id:'blitz',     name:'Blitz',     roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/blitz/img.png',     blurb:'Bouclier Flash-Shield — aveugle les défenseurs.',               side:'Attaque',   org:'GSG 9',       speed:2, armor:2 },
    { id:'iq',        name:'IQ',        roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/iq/img.png',        blurb:'Électronique Scanner — détecte les gadgets électroniques.',     side:'Attaque',   org:'GSG 9',       speed:3, armor:1 },
    { id:'buck',      name:'Buck',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/buck/img.png',      blurb:'Skeleton Key — sous-canon multi-coups pour détruire les murs.', side:'Attaque',   org:'JTF2',        speed:2, armor:2 },
    { id:'blackbeard',name:'Blackbeard',roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/blackbeard/img.png',blurb:'Rifle Shield — bouclier fixé sur l\'arme pour se couvrir.',     side:'Attaque',   org:'NAVY SEAL',   speed:2, armor:2 },
    { id:'hibana',    name:'Hibana',    roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/hibana/img.png',    blurb:'X-KAIROS — projectiles explosifs qui détruisent les renforts.',  side:'Attaque',   org:'SAT',         speed:3, armor:1 },
    { id:'jackal',    name:'Jackal',    roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/jackal/img.png',    blurb:'Eyenox Model III — scanne et traque les empreintes ennemies.',  side:'Attaque',   org:'GEO',         speed:2, armor:2 },
    { id:'ying',      name:'Ying',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/ying/img.png',      blurb:'Candela — flashs multiples qui aveuglent les défenseurs.',      side:'Attaque',   org:'SDU',         speed:2, armor:2 },
    { id:'lion',      name:'Lion',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/lion/img.png',      blurb:'EE-ONE-D — révèle tous les ennemis qui bougent.',              side:'Attaque',   org:'GIGN',        speed:2, armor:2 },
    { id:'finka',     name:'Finka',     roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/finka/img.png',     blurb:'Adrénaline — boost toute l\'équipe attaquante.',               side:'Attaque',   org:'CBRN',        speed:2, armor:2 },
    { id:'maverick',  name:'Maverick',  roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/maverick/img.png',  blurb:'Torche Breaching — brûle silencieusement les murs renforcés.',  side:'Attaque',   org:'NIGHTHAVEN', speed:3, armor:1 },
    { id:'nomad',     name:'Nomad',     roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/nomad/img.png',     blurb:'Airjab — mines de proximity qui repoussent les défenseurs.',   side:'Attaque',   org:'GIGR',        speed:2, armor:2 },
    { id:'gridlock',  name:'Gridlock',  roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/gridlock/img.png',  blurb:'Trax Stingers — couvre le sol de pièges anti-rush.',           side:'Attaque',   org:'SASR',        speed:1, armor:3 },
    { id:'amaru',     name:'Amaru',     roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/amaru/img.png',     blurb:'Garra Hook — grappin pour entrer par les fenêtres rapidement.', side:'Attaque',   org:'APCA',        speed:2, armor:2 },
    { id:'kali',      name:'Kali',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/kali/img.png',      blurb:'LV Lance-Nade — perce les sols et plafonds pour éliminer.',    side:'Attaque',   org:'NIGHTHAVEN', speed:3, armor:1 },
    { id:'iana',      name:'Iana',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/iana/img.png',      blurb:'Gemini Replicator — hologramme clone pour leurrer l\'ennemi.', side:'Attaque',   org:'REU',         speed:2, armor:2 },
    { id:'ace',       name:'Ace',       roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/ace/img.png',       blurb:'S.E.L.M.A. — appareil qui détruit les renforts en rafale.',    side:'Attaque',   org:'NIGHTHAVEN', speed:2, armor:2 },
    { id:'zero',      name:'Zero',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/zero/img.png',      blurb:'Argus Camera — caméra qui hackle les gadgets défenseurs.',     side:'Attaque',   org:'ECHELON',     speed:3, armor:1 },
    { id:'flores',    name:'Flores',    roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/flores/img.png',    blurb:'RCE-Ratero Drone — drone explosif télécommandé.',              side:'Attaque',   org:'AFEAU',       speed:2, armor:2 },
    { id:'osa',       name:'Osa',       roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/osa/img.png',       blurb:'Talon-8 Shield — bouclier transparent deployable.',            side:'Attaque',   org:'NIGHTHAVEN', speed:1, armor:3 },
    { id:'sens',      name:'Sens',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/sens/img.png',      blurb:'R.O.U Projector — rideau de fumée mobile.',                   side:'Attaque',   org:'CBRN',        speed:3, armor:1 },
    { id:'grim',      name:'Grim',      roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/grim/img.png',      blurb:'Kawan Hive Launcher — révèle les ennemis par micro-drones.',   side:'Attaque',   org:'NIGHTHAVEN', speed:3, armor:1 },
    { id:'ram',       name:'Ram',       roles:['Attacker'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/ram/img.png',       blurb:'BU-GI Auto-Breacher — détruit murs et gadgets automatiquement.',side:'Attaque',   org:'707th SMB',   speed:1, armor:3 },
    // Défenseurs
    { id:'smoke',     name:'Smoke',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/smoke/img.png',     blurb:'Grenades à déclenchement à distance — contrôle de zone.',     side:'Défense',   org:'SAS',         speed:2, armor:2 },
    { id:'mute',      name:'Mute',      roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/mute/img.png',      blurb:'Signal Jammer — bloque drones et gadgets à déclenchement.',   side:'Défense',   org:'SAS',         speed:1, armor:3 },
    { id:'castle',    name:'Castle',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/castle/img.png',    blurb:'Armor Pack — barricades en kevlar résistantes.',              side:'Défense',   org:'FBI SWAT',    speed:2, armor:2 },
    { id:'pulse',     name:'Pulse',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/pulse/img.png',     blurb:'Heartbeat Sensor — détecte les ennemis à travers les murs.',  side:'Défense',   org:'FBI SWAT',    speed:3, armor:1 },
    { id:'doc',       name:'Doc',       roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/doc/img.png',       blurb:'Stim Pistol — soigne ou booste lui-même et ses alliés.',      side:'Défense',   org:'GIGN',        speed:1, armor:3 },
    { id:'rook',      name:'Rook',      roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/rook/img.png',      blurb:'Armor Pack — dépose des armures pour toute l\'équipe.',       side:'Défense',   org:'GIGN',        speed:1, armor:3 },
    { id:'kapkan',    name:'Kapkan',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/kapkan/img.png',    blurb:'EDD Mk II — mines dans les fenêtres et portes.',              side:'Défense',   org:'SPETSNAZ',    speed:2, armor:2 },
    { id:'tachanka',  name:'Tachanka',  roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/tachanka/img.png',  blurb:'Shumikha Launcher — lance des grenades incendiaires.',        side:'Défense',   org:'SPETSNAZ',    speed:1, armor:3 },
    { id:'jager',     name:'Jäger',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/jager/img.png',     blurb:'ADS — intercepte automatiquement les grenades ennemies.',     side:'Défense',   org:'GSG 9',       speed:3, armor:1 },
    { id:'bandit',    name:'Bandit',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/bandit/img.png',    blurb:'Shock Wire — électrifie les barbelés et les renforts.',       side:'Défense',   org:'GSG 9',       speed:3, armor:1 },
    { id:'frost',     name:'Frost',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/frost/img.png',     blurb:'Welcome Mat — piège à ours qui neutralise instantanément.',   side:'Défense',   org:'JTF2',        speed:2, armor:2 },
    { id:'echo',      name:'Echo',      roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/echo/img.png',      blurb:'Yokai — drone volant invisible qui émet des ultrasons.',       side:'Défense',   org:'SAT',         speed:1, armor:3 },
    { id:'caveira',   name:'Caveira',   roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/caveira/img.png',   blurb:'Silent Step + Interrogation — traque et interroge les ennemis.',side:'Défense',  org:'BOPE',        speed:3, armor:1 },
    { id:'valkyrie',  name:'Valkyrie',  roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/valkyrie/img.png',  blurb:'Black Eye — mini-caméras deployables pour la surveillance.',   side:'Défense',   org:'NAVY SEAL',   speed:2, armor:2 },
    { id:'hibana_d',  name:'Lesion',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/lesion/img.png',    blurb:'Gu Mines — aiguilles empoisonnées invisibles.',               side:'Défense',   org:'SDU',         speed:2, armor:2 },
    { id:'ela',       name:'Ela',       roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/ela/img.png',       blurb:'Grzmot Mine — mines concussion qui désorienter les attaquants.',side:'Défense',  org:'GROM',        speed:3, armor:1 },
    { id:'vigil',     name:'Vigil',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/vigil/img.png',     blurb:'ERC-7 — disparaît temporairement des drones ennemis.',        side:'Défense',   org:'707th SMB',   speed:3, armor:1 },
    { id:'maestro',   name:'Maestro',   roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/maestro/img.png',   blurb:'Evil Eye — tourelle laser résistante et rotative.',           side:'Défense',   org:'GIS',         speed:1, armor:3 },
    { id:'alibi',     name:'Alibi',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/alibi/img.png',     blurb:'Prisma — hologrammes qui leurre et marque les attaquants.',   side:'Défense',   org:'GIS',         speed:3, armor:1 },
    { id:'mozzie',    name:'Mozzie',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/mozzie/img.png',    blurb:'Pest — capture les drones attaquants pour les retourner.',    side:'Défense',   org:'SASR',        speed:2, armor:2 },
    { id:'warden',    name:'Warden',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/warden/img.png',    blurb:'Glance Smart Glasses — voit à travers la fumée et les flashs.',side:'Défense',  org:'SECRET SERVICE',speed:1, armor:3 },
    { id:'goyo',      name:'Goyo',      roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/goyo/img.png',      blurb:'Volcan Shield — bouclier piégé qui explose et brûle.',        side:'Défense',   org:'FUERZAS ESP.',speed:1, armor:3 },
    { id:'wamai',     name:'Wamai',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/wamai/img.png',     blurb:'Mag-NET — intercepte et redirige les grenades ennemies.',     side:'Défense',   org:'NIGHTHAVEN', speed:2, armor:2 },
    { id:'oryx',      name:'Oryx',      roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/oryx/img.png',      blurb:'Remah Dash — charge à travers les barricades mou.',           side:'Défense',   org:'GIGR',        speed:3, armor:1 },
    { id:'melusi',    name:'Melusi',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/melusi/img.png',    blurb:'Banshee Sonic Defense — ralentit les attaquants qui s\'approchent.',side:'Défense',org:'INKABA',    speed:2, armor:2 },
    { id:'aruni',     name:'Aruni',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/aruni/img.png',     blurb:'Surya Gate — barrière laser qui détruit les gadgets.',        side:'Défense',   org:'NIGHTHAVEN', speed:2, armor:2 },
    { id:'thunderbird',name:'Thunderbird',roles:['Defender'],image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/thunderbird/img.png',blurb:'Kóna Station — distributeur de soins pour les alliés.',     side:'Défense',   org:'CJIRU',       speed:2, armor:2 },
    { id:'thorn',     name:'Thorn',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/thorn/img.png',     blurb:'Razorbloom — mine à déclenchement temporisé.',               side:'Défense',   org:'ERG',         speed:2, armor:2 },
    { id:'azami',     name:'Azami',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/azami/img.png',     blurb:'Kiba Barrier — crée des boucliers dans les brèches.',        side:'Défense',   org:'SAT',         speed:2, armor:2 },
    { id:'solis',     name:'Solis',     roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/solis/img.png',     blurb:'SPEC-IO Electro-Sensor — détecte les gadgets électroniques.',  side:'Défense',   org:'AFEAU',       speed:2, armor:2 },
    { id:'fenrir',    name:'Fenrir',    roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/fenrir/img.png',     blurb:'F-NATT Dread Mine — mine qui sème la peur.',                 side:'Défense',   org:'FMK',         speed:2, armor:2 },
    { id:'tubarao',   name:'Tubarão',   roles:['Defender'], image:'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDk7/tubarao/img.png',   blurb:'Zoto Canister — congèle les gadgets attaquants.',            side:'Défense',   org:'DAE',         speed:2, armor:2 },
  ];
}

// ----------------------------------------------------------
//  Rendu de la grille
// ----------------------------------------------------------
function renderChampionGrid(gameKey, champions, container) {
  const cfg    = CHAMP_CONFIG[gameKey] || {};
  const accent = cfg.accent || '#a78bfa';
  const lang   = window.i18n ? window.i18n.currentLang() : 'fr';

  // Construire les filtres de rôles uniques
  const allRoles = [...new Set(champions.flatMap(c => c.roles || []))].filter(Boolean).sort();

  const filterLabels = {
    fr: { all: 'Tous', search: 'Rechercher...' },
    en: { all: 'All',  search: 'Search...' },
    es: { all: 'Todos',search: 'Buscar...' },
  };
  const fl = filterLabels[lang] || filterLabels.fr;

  // Pour R6 : filtres par side plutôt que role
  const isR6 = gameKey === 'r6';
  const filterValues = isR6
    ? ['Attaque', 'Défense']
    : allRoles;

  const filtersHtml = filterValues.length > 1 ? `
    <div class="champ-filters">
      <button class="champ-filter-btn active" data-filter="all" onclick="filterChampions(this, 'all')" style="border-color:${accent}40">
        ${fl.all}
      </button>
      ${filterValues.map(r => `
        <button class="champ-filter-btn" data-filter="${r}" onclick="filterChampions(this, '${r}')" style="">
          ${r}
        </button>
      `).join('')}
    </div>
  ` : '';

  const searchHtml = `
    <div class="champ-search-wrap">
      <input type="text" class="champ-search" placeholder="${fl.search}" oninput="filterChampionSearch(this.value)">
    </div>
  `;

  const cardsHtml = champions.map(c => renderChampCard(c, gameKey, accent)).join('');

  container.innerHTML = `
    <div class="champ-toolbar">
      ${searchHtml}
      ${filtersHtml}
    </div>
    <div class="champ-grid" id="champ-grid">
      ${cardsHtml}
    </div>
  `;

  // Stocker les données pour le filtrage
  window._champData = champions;
  window._champGame = gameKey;
}

function renderChampCard(c, gameKey, accent) {
  const isR6     = gameKey === 'r6';
  const roleStr  = isR6 ? (c.side || '') : (c.roles || []).join(', ');
  const sideColor = c.side === 'Attaque' ? '#4ade80' : c.side === 'Défense' ? '#f87171' : accent;

  // Attribut Dota 2
  const attrIcons = { str: '💪', agi: '⚡', int: '🧠', all: '✨' };
  const attrHtml  = c.attr ? `<span class="champ-attr">${attrIcons[c.attr] || ''}</span>` : '';

  // Filtre data attribute
  const filterVal = isR6 ? (c.side || '') : (c.roles || []).join(' ');

  const imgHtml = c.image
    ? `<img src="${c.image}" class="champ-img" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const fallbackHtml = `<div class="champ-img-fallback" style="${c.image ? 'display:none' : ''};color:${accent}">${c.name[0]}</div>`;

  return `
    <div class="champ-card" data-filter="${filterVal}" data-name="${c.name.toLowerCase()}" onclick="showChampDetail('${c.id}', '${window._champGame || gameKey}')">
      <div class="champ-img-wrap">
        ${imgHtml}
        ${fallbackHtml}
        ${attrHtml}
      </div>
      <div class="champ-info">
        <div class="champ-name">${c.name}</div>
        ${c.title ? `<div class="champ-title">${c.title}</div>` : ''}
        <div class="champ-role" style="color:${isR6 ? sideColor : accent}">${roleStr}</div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------
//  Filtrage
// ----------------------------------------------------------
function filterChampions(btn, filterVal) {
  // Mettre à jour les boutons actifs
  document.querySelectorAll('.champ-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const grid = document.getElementById('champ-grid');
  if (!grid) return;

  const searchVal = document.querySelector('.champ-search')?.value?.toLowerCase() || '';

  grid.querySelectorAll('.champ-card').forEach(card => {
    const matchFilter = filterVal === 'all' || card.dataset.filter?.includes(filterVal);
    const matchSearch = !searchVal || card.dataset.name?.includes(searchVal);
    card.style.display = matchFilter && matchSearch ? '' : 'none';
  });
}

function filterChampionSearch(val) {
  const grid = document.getElementById('champ-grid');
  if (!grid) return;

  const searchVal   = val.toLowerCase();
  const activeFilter = document.querySelector('.champ-filter-btn.active')?.dataset.filter || 'all';

  grid.querySelectorAll('.champ-card').forEach(card => {
    const matchFilter = activeFilter === 'all' || card.dataset.filter?.includes(activeFilter);
    const matchSearch = !searchVal || card.dataset.name?.includes(searchVal);
    card.style.display = matchFilter && matchSearch ? '' : 'none';
  });
}

// ----------------------------------------------------------
//  Modal détail champion
// ----------------------------------------------------------
function showChampDetail(champId, gameKey) {
  const data = window._champData?.find(c => String(c.id) === String(champId));
  if (!data) return;

  const cfg    = CHAMP_CONFIG[gameKey] || {};
  const accent = cfg.accent || '#a78bfa';
  const isR6   = gameKey === 'r6';

  document.getElementById('champ-detail-modal')?.remove();

  const modal = document.createElement('div');
  modal.id        = 'champ-detail-modal';
  modal.className = 'modal-overlay';

  const roleStr    = isR6 ? data.side : (data.roles || []).join(' · ');
  const sideColor  = data.side === 'Attaque' ? '#4ade80' : data.side === 'Défense' ? '#f87171' : accent;
  const attrIcons  = { str: '💪 Force', agi: '⚡ Agilité', int: '🧠 Intelligence', all: '✨ Universel' };
  const attrLabel  = data.attr ? attrIcons[data.attr] || '' : '';

  // Infos R6 spécifiques
  const r6Extras = isR6 ? `
    <div class="champ-detail-stats">
      <div class="champ-detail-stat">
        <span class="champ-stat-label">Organisation</span>
        <span class="champ-stat-value">${data.org || '—'}</span>
      </div>
      <div class="champ-detail-stat">
        <span class="champ-stat-label">Vitesse</span>
        <span class="champ-stat-value">${'⚡'.repeat(data.speed || 0)}${'○'.repeat(3 - (data.speed || 0))}</span>
      </div>
      <div class="champ-detail-stat">
        <span class="champ-stat-label">Armure</span>
        <span class="champ-stat-value">${'🛡️'.repeat(data.armor || 0)}${'○'.repeat(3 - (data.armor || 0))}</span>
      </div>
    </div>
  ` : '';

  modal.innerHTML = `
    <div class="modal-box champ-detail-box">
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="champ-detail-img-wrap">
            ${data.image
              ? `<img src="${data.image}" class="champ-detail-img" onerror="this.style.display='none'">`
              : `<div class="champ-img-fallback large" style="color:${accent}">${data.name[0]}</div>`}
          </div>
          <div>
            <div class="champ-detail-name" style="color:${accent}">${data.name}</div>
            ${data.title ? `<div class="champ-detail-title">${data.title}</div>` : ''}
            <div class="champ-detail-role" style="color:${isR6 ? sideColor : accent}">${roleStr}</div>
            ${attrLabel ? `<div class="champ-detail-attr">${attrLabel}</div>` : ''}
          </div>
        </div>
        <button class="modal-close" onclick="document.getElementById('champ-detail-modal').remove()">✕</button>
      </div>
      ${r6Extras}
      ${data.blurb ? `<div class="champ-detail-blurb">${data.blurb}</div>` : ''}
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// Exposer globalement
window.loadChampionsForGame  = loadChampionsForGame;
window.filterChampions       = filterChampions;
window.filterChampionSearch  = filterChampionSearch;
window.showChampDetail       = showChampDetail;

console.log('[champions] chargé ✓');
