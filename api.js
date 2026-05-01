// ============================================================
//  api.js — Couche d'abstraction multi-sources
//  Sources : PandaScore + Liquipedia
// ============================================================

const PANDASCORE_TOKEN = '4U4XspWxILG2eufIZkowjW0uDKwy2L2MbFOTXCISpCOHMRMBKZo'; // Remplacez par votre clé
const PANDASCORE_CACHE = 'https://omniscore-cache.omniscoregg.workers.dev';
const LIQUIPEDIA_PROXY = 'https://omniscore-proxy.omniscoregg.workers.dev';

// ----------------------------------------------------------
//  Mapping jeu → source + slug API
// ----------------------------------------------------------
const GAME_CONFIG = {
  lol:         { source: 'pandascore', slug: 'lol',      label: 'League of Legends',  genre: 'moba'    },
  dota2:       { source: 'pandascore', slug: 'dota2',   label: 'Dota 2',             genre: 'moba'    },
  mlbb:        { source: 'pandascore', slug: 'mlbb',    label: 'Mobile Legends',     genre: 'moba'    },
  kog:         { source: 'pandascore', slug: 'kog',     label: 'Honor of Kings',     genre: 'moba'    },
  cs2:         { source: 'pandascore', slug: 'csgo',    label: 'Counter-Strike 2',   genre: 'fps'     },
  valorant:    { source: 'pandascore', slug: 'valorant',label: 'Valorant',           genre: 'fps'     },
  overwatch:   { source: 'pandascore', slug: 'ow',      label: 'Overwatch 2',        genre: 'fps'     },
  r6:          { source: 'pandascore', slug: 'r6siege', label: 'Rainbow Six Siege',  genre: 'fps'     },
  cod:         { source: 'pandascore', slug: 'codmw',   label: 'Call of Duty',       genre: 'fps'     },
  rl:          { source: 'pandascore', slug: 'rl',      label: 'Rocket League',      genre: 'sport'   },
  pubg:        { source: 'pandascore', slug: 'pubg',    label: 'PUBG',               genre: 'br'      },
  sf6:         { source: 'liquipedia', slug: 'fighters',     label: 'Street Fighter 6', genre: 'fighting', lp_game: 'Street_Fighter_6'          },
  tekken8:     { source: 'liquipedia', slug: 'fighters',     label: 'Tekken 8',         genre: 'fighting', lp_game: 'Tekken_8'                  },
  smash:       { source: 'liquipedia', slug: 'smashbros',    label: 'Smash Bros.',      genre: 'fighting', lp_game: ''                          },
  pubgmobile:  { source: 'liquipedia', slug: 'pubgmobile',   label: 'PUBG Mobile',      genre: 'br',       lp_game: ''                          },
  apexlegends: { source: 'liquipedia', slug: 'apexlegends',  label: 'Apex Legends',     genre: 'br',       lp_game: ''                          },
  hearthstone: { source: 'liquipedia', slug: 'hearthstone',  label: 'Hearthstone',      genre: 'card',     lp_game: ''                          },
};

// ----------------------------------------------------------
//  PandaScore
// ----------------------------------------------------------
async function fetchPandaScore(gameKey, status = 'past', count = 10) {
  const cfg = GAME_CONFIG[gameKey];
  if (!cfg || cfg.source !== 'pandascore') return [];
  if (PANDASCORE_TOKEN === 'VOTRE_CLE_ICI') return getMockMatches(gameKey, count, status);

  // Passe par le cache Cloudflare au lieu d'appeler PandaScore directement
  const params = new URLSearchParams({
    game:   gameKey,
    slug:   cfg.slug,
    status: status,
    count:  String(count),
    token:  PANDASCORE_TOKEN,
  });
  const url = `${PANDASCORE_CACHE}?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.map(m => normalizePandaScore(m, gameKey));
  } catch (err) {
    console.warn(`[PandaScore] ${gameKey}:`, err.message);
    return getMockMatches(gameKey, count, status);
  }
}

function normalizePandaScore(m, gameKey) {
  const cfg = GAME_CONFIG[gameKey];
  const op  = m.opponents || [];
  const res = m.results   || [];
  return {
    id:         String(m.id),
    game:       gameKey,
    gameLabel:  cfg.label,
    genre:      cfg.genre,
    team1:      { name: op[0]?.opponent?.name || '?', logo: op[0]?.opponent?.image_url || null },
    team2:      { name: op[1]?.opponent?.name || '?', logo: op[1]?.opponent?.image_url || null },
    score1:     res[0]?.score ?? null,
    score2:     res[1]?.score ?? null,
    winner:     m.winner ? (m.winner.id === op[0]?.opponent?.id ? 1 : 2) : null,
    date:       m.scheduled_at || m.begin_at,
    tournament: m.league?.name || m.tournament?.name || '—',
    format:     m.number_of_games ? `Bo${m.number_of_games}` : '—',
    status:     m.status === 'finished' ? 'finished' : m.status === 'running' ? 'running' : 'upcoming',
    source:     'pandascore',
  };
}

// ----------------------------------------------------------
//  Liquipedia
// ----------------------------------------------------------
async function fetchLiquipedia(gameKey, count = 10) {
  const cfg = GAME_CONFIG[gameKey];
  if (!cfg || cfg.source !== 'liquipedia') return [];

  const cond = cfg.lp_game ? `[[game::${cfg.lp_game}]] AND [[finished::1]]` : '[[finished::1]]';
  const params = new URLSearchParams({
    wiki: cfg.slug, query: 'match2opponents,date,tournament,bestof,winner,finished',
    conditions: cond, order: 'date DESC', limit: String(count),
  });

  try {
    const res = await fetch(`${LIQUIPEDIA_PROXY}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.result || []).map(m => normalizeLiquipedia(m, gameKey));
  } catch (err) {
    console.warn(`[Liquipedia] ${gameKey}:`, err.message);
    return getMockMatches(gameKey, count, 'past');
  }
}

function normalizeLiquipedia(m, gameKey) {
  const cfg = GAME_CONFIG[gameKey];
  const ops = m.match2opponents || [];
  return {
    id:         `lp-${gameKey}-${m.date}-${Math.random().toString(36).slice(2, 6)}`,
    game:       gameKey,
    gameLabel:  cfg.label,
    genre:      cfg.genre,
    team1:      { name: ops[0]?.name || 'TBD', logo: ops[0]?.icon || null },
    team2:      { name: ops[1]?.name || 'TBD', logo: ops[1]?.icon || null },
    score1:     ops[0]?.score != null ? Number(ops[0].score) : null,
    score2:     ops[1]?.score != null ? Number(ops[1].score) : null,
    winner:     m.winner === '1' ? 1 : m.winner === '2' ? 2 : null,
    date:       m.date || null,
    tournament: m.tournament || '—',
    format:     m.bestof ? `Bo${m.bestof}` : '—',
    status:     m.finished === '1' ? 'finished' : 'upcoming',
    source:     'liquipedia',
  };
}

// ----------------------------------------------------------
//  Points d'entrée publics
// ----------------------------------------------------------
async function getMatches({ games = Object.keys(GAME_CONFIG), status = 'past', count = 8 } = {}) {
  const promises = games.map(key => {
    const cfg = GAME_CONFIG[key];
    if (!cfg) return Promise.resolve([]);
    return cfg.source === 'pandascore'
      ? fetchPandaScore(key, status, count)
      : fetchLiquipedia(key, count);
  });
  const results = await Promise.allSettled(promises);
  // cutoff désactivé
  return results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    // filtre désactivé - on garde tous les matchs retournés par l API
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function getUpcoming({ games = Object.keys(GAME_CONFIG), count = 20 } = {}) {
  const pandaGames = games.filter(g => GAME_CONFIG[g]?.source === 'pandascore');
  const results    = await Promise.allSettled(pandaGames.map(g => fetchPandaScore(g, 'upcoming', count)));
  return results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // tri par date ET heure
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return da - db;
    });
}

// ----------------------------------------------------------
//  Données de démo
// ----------------------------------------------------------
function getMockMatches(gameKey, count, status) {
  const cfg   = GAME_CONFIG[gameKey];
  const teams = {
    lol:         [['T1','Gen.G'],['G2','Fnatic'],['Cloud9','Team Liquid'],['KT Rolster','HLE'],['NaVi','BIG']],
    dota2:       [['Team Spirit','OG'],['Liquid','EG'],['PSG.LGD','VP'],['Secret','Alliance'],['NaVi','Tundra']],
    mlbb:        [['ONIC','RRQ'],['Fnatic','Echo'],['Blacklist','ECHO'],['Liquid','Falcons'],['RSG','Alter Ego']],
    kog:         [['Nova','Weibo'],['Hero','JDG'],['LGD','eStar'],['RNG','iG'],['OMG','FPX']],
    cs2:         [['Natus Vincere','Astralis'],['FaZe','G2'],['Vitality','NIP'],['Cloud9','ENCE'],['MOUZ','Liquid']],
    valorant:    [['Sentinels','NRG'],['Fnatic','Liquid'],['LOUD','NaVi'],['PRX','EDG'],['C9','100T']],
    overwatch:   [['Seoul Dynasty','NY Excelsior'],['SF Shock','LAG'],['Houston','Dallas'],['Boston','London'],['Philly','Wash.']],
    r6:          [['G2','Spacestation'],['Team Liquid','DZ'],['Rogue','Chiefs'],['NaVi','BDS'],['TSM','EG']],
    cod:         [['OpTic','Atlanta FaZe'],['LAT','NY Subliners'],['Boston','Miami'],['Vegas','Toronto'],['Rokkr','Surge']],
    rl:          [['Gentle Mates','Vitality'],['G2','NRG'],['FaZe','BDS'],['Spacestation','Complexity'],['OpTic','Version1']],
    eafc:        [['Tekkz','Gorilla'],['Obrun','Nicolas99FC'],['Msdossary','Agge'],['Stokes','Henny'],['Ryan','Shellzz']],
    pubg:        [['DBD','Twisted Minds'],['NAVI','GNL'],['GEX','Quad'],['Danawa','DreamFire'],['Havan','4Rivals']],
    sf6:         [['Xiaohai','Punk'],['MenaRD','Blaz'],['Tokido','Fuudo'],['Nephew','EndingWalker'],['Bonchan','NL']],
    tekken8:     [['Knee','JDCR'],['Arslan Ash','Awais'],['Main Man','Malgu'],['Nobi','Ulsan'],['KYOHEI','Mulgold']],
    smash:       [['MkLeo','Tweek'],['Quik','Light'],['Sparg0','Glutonny'],['Yonni','Tea'],['Maister','Sisqui']],
    pubgmobile:  [['Bigetron','BOX'],['Nova','SuperSkrull'],['Stalwart','D9'],['Fnatic','Mortal'],['Tencent','Loops']],
    apexlegends: [['TSM','NRG'],['Sentinels','Optic'],['FaZe','Alliance'],['Dignitas','100T'],['XSET','Luminosity']],
    hearthstone: [['Viper','Nalguidan'],['Fr0zen','Shaxy'],['Kolento','Neirea'],['Thijs','Sintolol'],['Casie','Jarla']],
  };
  const tours = {
    lol: ['LCK Spring','LEC Spring','LCS Spring'], cs2: ['ESL Pro League','PGL Major','BLAST'],
    valorant: ['VCT Americas','VCT EMEA','Champions'], dota2: ['The International','ESL One'],
    mlbb: ['MPL ID','MPL PH','M-Series'], kog: ['KPL Spring','Honor League'],
    cod: ['CDL Major','CDL Champs','CDL Kickoff'], sf6: ['Capcom Pro Tour','EWC 2025'],
    tekken8: ['EWC 2025','Tekken World Tour'], smash: ['EVO 2025','Summit'],
    default: ['World Championship','Major','Regional'],
  };
  const teamList = teams[gameKey] || [['Team A','Team B'],['Team C','Team D']];
  const tourList = tours[gameKey] || tours.default;
  const formats  = ['Bo3','Bo3','Bo5','Bo1','Bo3'];

  return Array.from({ length: Math.min(count, teamList.length) }, (_, i) => {
    const [t1, t2] = teamList[i];
    const isPast   = status !== 'upcoming';
    const s1       = isPast ? Math.floor(Math.random() * 3) : null;
    const s2       = isPast ? (s1 === 2 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3)) : null;
    const offset   = status === 'upcoming' ? -(i + 1) : (i + 1);
    return {
      id: `demo-${gameKey}-${i}`, game: gameKey, gameLabel: cfg.label, genre: cfg.genre,
      team1: { name: t1, logo: null }, team2: { name: t2, logo: null },
      score1: s1, score2: s2,
      winner: isPast ? (s1 > s2 ? 1 : 2) : null,
      date: new Date(Date.now() - offset * 86400000).toISOString(),
      tournament: tourList[i % tourList.length],
      format: formats[i % formats.length],
      status: isPast ? 'finished' : 'upcoming',
      source: 'demo',
    };
  });
}

window.EsportAPI  = { getMatches, getUpcoming, GAME_CONFIG };
window._pandaToken = PANDASCORE_TOKEN;
