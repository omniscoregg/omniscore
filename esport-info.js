// ============================================================
//  esport-info.js — Page Infos Esport par jeu
//  Pattern : même overlay que leagues.js / profile.js
// ============================================================

const ESPORT_INFO = {
  lol: {
    label: 'League of Legends',
    icon: '⚔️',
    genre: 'moba',
    accent: '#7c88ff',
    description: {
      fr: 'League of Legends est un MOBA 5v5 développé par Riot Games. Deux équipes s\'affrontent sur la carte de la Faille de l\'Invocateur avec pour objectif de détruire le Nexus adverse.',
      en: 'League of Legends is a 5v5 MOBA developed by Riot Games. Two teams fight on Summoner\'s Rift with the goal of destroying the enemy Nexus.',
      es: 'League of Legends es un MOBA 5v5 desarrollado por Riot Games. Dos equipos se enfrentan en la Grieta del Invocador con el objetivo de destruir el Nexo enemigo.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo1 en phase de groupes, Bo3 en playoffs, Bo5 en finales' },
        { label: 'Durée d\'une partie', value: '25 à 45 minutes en moyenne' },
        { label: 'Composition', value: '5 joueurs par équipe : Top, Jungle, Mid, ADC, Support' },
        { label: 'Draft', value: 'Ban/Pick alterné — 5 bans par équipe, 5 picks par équipe' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo1 in group stage, Bo3 in playoffs, Bo5 in finals' },
        { label: 'Game duration', value: '25 to 45 minutes on average' },
        { label: 'Composition', value: '5 players per team: Top, Jungle, Mid, ADC, Support' },
        { label: 'Draft', value: 'Alternating Ban/Pick — 5 bans per team, 5 picks per team' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo1 en fase de grupos, Bo3 en playoffs, Bo5 en finales' },
        { label: 'Duración de partida', value: '25 a 45 minutos de promedio' },
        { label: 'Composición', value: '5 jugadores por equipo: Top, Jungla, Mid, ADC, Support' },
        { label: 'Draft', value: 'Ban/Pick alternado — 5 bans por equipo, 5 picks por equipo' },
      ],
    },
    leagues: [
      { name: 'LCK', region: '🇰🇷 Corée du Sud', tier: 1, desc: { fr: 'Ligue coréenne, souvent considérée la meilleure au monde', en: 'Korean league, often considered the best in the world', es: 'Liga coreana, frecuentemente considerada la mejor del mundo' } },
      { name: 'LPL', region: '🇨🇳 Chine', tier: 1, desc: { fr: 'Ligue chinoise, nombreux titres mondiaux', en: 'Chinese league, multiple world titles', es: 'Liga china, múltiples títulos mundiales' } },
      { name: 'LEC', region: '🇪🇺 Europe', tier: 1, desc: { fr: 'Ligue européenne organisée par Riot Games', en: 'European league organized by Riot Games', es: 'Liga europea organizada por Riot Games' } },
      { name: 'LCS', region: '🇺🇸 Amérique du Nord', tier: 1, desc: { fr: 'Ligue nord-américaine', en: 'North American league', es: 'Liga norteamericana' } },
      { name: 'Worlds', region: '🌍 International', tier: 0, desc: { fr: 'Championnat du Monde annuel — le tournoi ultime', en: 'Annual World Championship — the ultimate tournament', es: 'Campeonato del Mundo anual — el torneo definitivo' } },
    ],
    links: [
      { label: 'lolesports.com', url: 'https://lolesports.com' },
      { label: 'Liquipedia LoL', url: 'https://liquipedia.net/leagueoflegends' },
    ],
  },

  valorant: {
    label: 'Valorant',
    icon: '🎯',
    genre: 'fps',
    accent: '#4ade80',
    description: {
      fr: 'Valorant est un FPS tactique 5v5 développé par Riot Games. Les équipes s\'affrontent en attaque et en défense sur des maps avec objectifs de bombe (Spike).',
      en: 'Valorant is a 5v5 tactical FPS developed by Riot Games. Teams compete in attack and defense on maps with bomb (Spike) objectives.',
      es: 'Valorant es un FPS táctico 5v5 desarrollado por Riot Games. Los equipos compiten en ataque y defensa en mapas con objetivos de bomba (Spike).',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo1 en phase de poules, Bo3 en playoffs, Bo5 en finales' },
        { label: 'Structure d\'un match', value: '12 rounds en attaque, 12 rounds en défense. Prolongations si 12-12' },
        { label: 'Durée d\'une partie', value: '45 à 90 minutes en moyenne' },
        { label: 'Agents', value: '5 agents par équipe — Duelliste, Initiateur, Contrôleur, Sentinelle' },
        { label: 'Draft', value: 'Pas de draft — chaque joueur choisit librement son agent' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo1 in group stage, Bo3 in playoffs, Bo5 in finals' },
        { label: 'Match structure', value: '12 rounds attacking, 12 rounds defending. Overtime at 12-12' },
        { label: 'Game duration', value: '45 to 90 minutes on average' },
        { label: 'Agents', value: '5 agents per team — Duelist, Initiator, Controller, Sentinel' },
        { label: 'Draft', value: 'No draft — each player freely picks their agent' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo1 en fase de grupos, Bo3 en playoffs, Bo5 en finales' },
        { label: 'Estructura de partida', value: '12 rondas atacando, 12 rondas defendiendo. Prórroga a 12-12' },
        { label: 'Duración de partida', value: '45 a 90 minutos de promedio' },
        { label: 'Agentes', value: '5 agentes por equipo — Duelista, Iniciador, Controlador, Centinela' },
        { label: 'Draft', value: 'Sin draft — cada jugador elige libremente su agente' },
      ],
    },
    leagues: [
      { name: 'VCT Americas', region: '🌎 Amériques', tier: 1, desc: { fr: 'Circuit officiel Riot — NA, Brésil, LATAM', en: 'Official Riot circuit — NA, Brazil, LATAM', es: 'Circuito oficial Riot — NA, Brasil, LATAM' } },
      { name: 'VCT EMEA', region: '🇪🇺 Europe/Moyen-Orient', tier: 1, desc: { fr: 'Circuit officiel Riot — Europe, Moyen-Orient, Afrique', en: 'Official Riot circuit — Europe, Middle East, Africa', es: 'Circuito oficial Riot — Europa, Oriente Medio, África' } },
      { name: 'VCT Pacific', region: '🌏 Asie-Pacifique', tier: 1, desc: { fr: 'Circuit officiel Riot — Asie du Sud-Est, Japon, Corée', en: 'Official Riot circuit — Southeast Asia, Japan, Korea', es: 'Circuito oficial Riot — Sudeste Asiático, Japón, Corea' } },
      { name: 'VCT Masters', region: '🌍 International', tier: 0, desc: { fr: 'Tournoi international mi-saison entre les 3 circuits', en: 'Mid-season international tournament between the 3 circuits', es: 'Torneo internacional de mitad de temporada entre los 3 circuitos' } },
      { name: 'VCT Champions', region: '🌍 International', tier: 0, desc: { fr: 'Championnat du Monde — fin de saison', en: 'World Championship — end of season', es: 'Campeonato del Mundo — fin de temporada' } },
    ],
    links: [
      { label: 'valorantesports.com', url: 'https://valorantesports.com' },
      { label: 'Liquipedia Valorant', url: 'https://liquipedia.net/valorant' },
    ],
  },

  cs2: {
    label: 'Counter-Strike 2',
    icon: '💣',
    genre: 'fps',
    accent: '#4ade80',
    description: {
      fr: 'Counter-Strike 2 est le FPS tactique 5v5 de référence développé par Valve. Les Terroristes doivent poser et défendre la bombe (C4), les Counter-Terroristes doivent l\'empêcher ou la désamorcer.',
      en: 'Counter-Strike 2 is the reference 5v5 tactical FPS developed by Valve. Terrorists must plant and defend the bomb (C4), Counter-Terrorists must prevent or defuse it.',
      es: 'Counter-Strike 2 es el FPS táctico 5v5 de referencia desarrollado por Valve. Los Terroristas deben plantar y defender la bomba (C4), los Counter-Terroristas deben impedirlo o desactivarla.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo1 en phase de poules, Bo3 en playoffs, Bo5 en finales majeures' },
        { label: 'Structure d\'un match', value: '12 rounds par demi-temps, max 30 rounds. Overtime en MR3' },
        { label: 'Durée d\'une partie', value: '45 à 75 minutes en moyenne' },
        { label: 'Économie', value: 'Gestion du budget d\'achat d\'armes entre chaque round' },
        { label: 'Maps', value: 'Pool de 7 maps tournantes — veto avant chaque série' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo1 in group stage, Bo3 in playoffs, Bo5 in major finals' },
        { label: 'Match structure', value: '12 rounds per half, max 30 rounds. Overtime in MR3' },
        { label: 'Game duration', value: '45 to 75 minutes on average' },
        { label: 'Economy', value: 'Weapon purchase budget management between each round' },
        { label: 'Maps', value: 'Pool of 7 rotating maps — veto before each series' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo1 en fase de grupos, Bo3 en playoffs, Bo5 en finales mayores' },
        { label: 'Estructura de partida', value: '12 rondas por mitad, máx 30 rondas. Tiempo extra en MR3' },
        { label: 'Duración de partida', value: '45 a 75 minutos de promedio' },
        { label: 'Economía', value: 'Gestión del presupuesto de compra de armas entre cada ronda' },
        { label: 'Mapas', value: 'Pool de 7 mapas rotativos — veto antes de cada serie' },
      ],
    },
    leagues: [
      { name: 'CS Major', region: '🌍 International', tier: 0, desc: { fr: 'Tournoi le plus prestigieux, organisé par Valve 2x/an', en: 'Most prestigious tournament, organized by Valve 2x/year', es: 'Torneo más prestigioso, organizado por Valve 2x/año' } },
      { name: 'ESL Pro League', region: '🌍 International', tier: 1, desc: { fr: 'Circuit ESL — les meilleures équipes mondiales', en: 'ESL circuit — the best teams in the world', es: 'Circuito ESL — los mejores equipos del mundo' } },
      { name: 'BLAST Premier', region: '🌍 International', tier: 1, desc: { fr: 'Circuit BLAST avec Spring et Fall Finals', en: 'BLAST circuit with Spring and Fall Finals', es: 'Circuito BLAST con Spring y Fall Finals' } },
      { name: 'IEM Katowice', region: '🇵🇱 Pologne', tier: 1, desc: { fr: 'Tournoi légendaire à Katowice, Pologne', en: 'Legendary tournament in Katowice, Poland', es: 'Torneo legendario en Katowice, Polonia' } },
    ],
    links: [
      { label: 'HLTV.org', url: 'https://hltv.org' },
      { label: 'Liquipedia CS2', url: 'https://liquipedia.net/counterstrike' },
    ],
  },

  dota2: {
    label: 'Dota 2',
    icon: '🛡️',
    genre: 'moba',
    accent: '#7c88ff',
    description: {
      fr: 'Dota 2 est un MOBA 5v5 développé par Valve. Deux équipes (Radiant et Dire) s\'affrontent pour détruire l\'Ancient adverse. Connu pour sa profondeur stratégique extrême et son mécanisme de deny.',
      en: 'Dota 2 is a 5v5 MOBA developed by Valve. Two teams (Radiant and Dire) compete to destroy the enemy Ancient. Known for its extreme strategic depth and deny mechanic.',
      es: 'Dota 2 es un MOBA 5v5 desarrollado por Valve. Dos equipos (Radiant y Dire) compiten para destruir el Ancient enemigo. Conocido por su extrema profundidad estratégica.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo2 en phase de groupes, Bo3 en playoffs, Bo5 en finales' },
        { label: 'Durée d\'une partie', value: '35 à 60 minutes en moyenne, parfois plus de 80 min' },
        { label: 'Composition', value: '5 joueurs — Carry, Mid, Offlane, Soft Support, Hard Support' },
        { label: 'Draft', value: 'Captains Mode — bans et picks alternés, 3 phases de ban' },
        { label: 'Spécificité', value: 'Plus de 120 héros, pas de méta fixe, grande liberté tactique' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo2 in group stage, Bo3 in playoffs, Bo5 in finals' },
        { label: 'Game duration', value: '35 to 60 minutes on average, sometimes over 80 min' },
        { label: 'Composition', value: '5 players — Carry, Mid, Offlane, Soft Support, Hard Support' },
        { label: 'Draft', value: 'Captains Mode — alternating bans and picks, 3 ban phases' },
        { label: 'Specificity', value: 'Over 120 heroes, no fixed meta, great tactical freedom' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo2 en fase de grupos, Bo3 en playoffs, Bo5 en finales' },
        { label: 'Duración de partida', value: '35 a 60 minutos de promedio, a veces más de 80 min' },
        { label: 'Composición', value: '5 jugadores — Carry, Mid, Offlane, Soft Support, Hard Support' },
        { label: 'Draft', value: 'Captains Mode — bans y picks alternados, 3 fases de ban' },
        { label: 'Especificidad', value: 'Más de 120 héroes, sin meta fija, gran libertad táctica' },
      ],
    },
    leagues: [
      { name: 'The International', region: '🌍 International', tier: 0, desc: { fr: 'LE tournoi Dota 2 — prize pool record, organisé par Valve', en: 'THE Dota 2 tournament — record prize pool, organized by Valve', es: 'EL torneo de Dota 2 — premio récord, organizado por Valve' } },
      { name: 'Dota Pro Circuit', region: '🌍 International', tier: 1, desc: { fr: 'Circuit officiel Valve avec points de qualification pour TI', en: 'Official Valve circuit with qualification points for TI', es: 'Circuito oficial de Valve con puntos de clasificación para TI' } },
      { name: 'ESL One', region: '🌍 International', tier: 1, desc: { fr: 'Tournois ESL majeurs hors-circuit', en: 'Major ESL tournaments outside the circuit', es: 'Torneos ESL mayores fuera del circuito' } },
    ],
    links: [
      { label: 'dota2.com/esports', url: 'https://www.dota2.com/esports' },
      { label: 'Liquipedia Dota 2', url: 'https://liquipedia.net/dota2' },
    ],
  },

  r6: {
    label: 'Rainbow Six Siege',
    icon: '🚔',
    genre: 'fps',
    accent: '#4ade80',
    description: {
      fr: 'Rainbow Six Siege est un FPS tactique 5v5 développé par Ubisoft. Les Attaquants doivent accomplir un objectif (neutraliser une bombe, sauver un otage) tandis que les Défenseurs l\'en empêchent.',
      en: 'Rainbow Six Siege is a 5v5 tactical FPS developed by Ubisoft. Attackers must complete an objective (defuse a bomb, rescue a hostage) while Defenders prevent them.',
      es: 'Rainbow Six Siege es un FPS táctico 5v5 desarrollado por Ubisoft. Los Atacantes deben completar un objetivo (desactivar una bomba, rescatar un rehén) mientras los Defensores se lo impiden.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo3 en playoffs, Bo5 en finales majeures' },
        { label: 'Structure d\'un match', value: 'Premier à 7 rounds gagne (avec 2 rounds d\'avance minimum)' },
        { label: 'Durée d\'une partie', value: '30 à 60 minutes en moyenne' },
        { label: 'Opérateurs', value: '5 opérateurs par équipe — Attaquants et Défenseurs distincts' },
        { label: 'Ban', value: '2 bans par équipe avant chaque manche — ban d\'opérateurs' },
        { label: 'Maps', value: 'Pool de maps avec veto — chaque équipe ban des maps' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo3 in playoffs, Bo5 in major finals' },
        { label: 'Match structure', value: 'First to 7 rounds wins (with minimum 2-round lead)' },
        { label: 'Game duration', value: '30 to 60 minutes on average' },
        { label: 'Operators', value: '5 operators per team — distinct Attackers and Defenders' },
        { label: 'Ban', value: '2 bans per team before each map — operator bans' },
        { label: 'Maps', value: 'Map pool with veto — each team bans maps' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo3 en playoffs, Bo5 en finales mayores' },
        { label: 'Estructura de partida', value: 'Primero en 7 rondas gana (con mínimo 2 rondas de ventaja)' },
        { label: 'Duración de partida', value: '30 a 60 minutos de promedio' },
        { label: 'Operadores', value: '5 operadores por equipo — Atacantes y Defensores distintos' },
        { label: 'Ban', value: '2 bans por equipo antes de cada mapa — bans de operadores' },
        { label: 'Mapas', value: 'Pool de mapas con veto — cada equipo banea mapas' },
      ],
    },
    leagues: [
      { name: 'Six Invitational', region: '🌍 International', tier: 0, desc: { fr: 'Championnat du Monde annuel de R6 — le tournoi majeur', en: 'Annual R6 World Championship — the major tournament', es: 'Campeonato del Mundo anual de R6 — el torneo principal' } },
      { name: 'BLAST R6 Major', region: '🌍 International', tier: 1, desc: { fr: 'Tournois majeurs organisés par BLAST', en: 'Major tournaments organized by BLAST', es: 'Torneos mayores organizados por BLAST' } },
      { name: 'R6 APAC', region: '🌏 Asie-Pacifique', tier: 2, desc: { fr: 'Circuit régional Asie-Pacifique', en: 'Asia-Pacific regional circuit', es: 'Circuito regional Asia-Pacífico' } },
      { name: 'R6 Europe', region: '🇪🇺 Europe', tier: 2, desc: { fr: 'Circuit régional européen', en: 'European regional circuit', es: 'Circuito regional europeo' } },
      { name: 'R6 NA', region: '🌎 Amérique du Nord', tier: 2, desc: { fr: 'Circuit régional nord-américain', en: 'North American regional circuit', es: 'Circuito regional norteamericano' } },
    ],
    links: [
      { label: 'ubisoft.com/siege/esports', url: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege/esports' },
      { label: 'Liquipedia R6', url: 'https://liquipedia.net/rainbowsix' },
    ],
  },

  mlbb: {
    label: 'Mobile Legends',
    icon: '📱',
    genre: 'moba',
    accent: '#7c88ff',
    description: {
      fr: 'Mobile Legends: Bang Bang est un MOBA 5v5 mobile développé par Moonton. Le jeu le plus populaire en Asie du Sud-Est, avec des parties plus courtes et accessibles que sur PC.',
      en: 'Mobile Legends: Bang Bang is a 5v5 mobile MOBA developed by Moonton. The most popular game in Southeast Asia, with shorter and more accessible matches than PC.',
      es: 'Mobile Legends: Bang Bang es un MOBA 5v5 móvil desarrollado por Moonton. El juego más popular en el Sudeste Asiático, con partidas más cortas y accesibles que en PC.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo3 en playoffs, Bo5 en finales mondiales' },
        { label: 'Durée d\'une partie', value: '15 à 25 minutes — plus court qu\'un MOBA PC' },
        { label: 'Composition', value: '5 joueurs — Tank, Fighter, Assassin, Mage, Marksman, Support' },
        { label: 'Draft', value: 'Draft avec bans — chaque équipe ban 3 héros et pick 5' },
        { label: 'Spécificité', value: 'Respawn rapide, rappel à la base, interface optimisée mobile' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo3 in playoffs, Bo5 in world finals' },
        { label: 'Game duration', value: '15 to 25 minutes — shorter than a PC MOBA' },
        { label: 'Composition', value: '5 players — Tank, Fighter, Assassin, Mage, Marksman, Support' },
        { label: 'Draft', value: 'Draft with bans — each team bans 3 heroes and picks 5' },
        { label: 'Specificity', value: 'Fast respawn, base recall, mobile-optimized interface' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo3 en playoffs, Bo5 en finales mundiales' },
        { label: 'Duración de partida', value: '15 a 25 minutos — más corto que un MOBA de PC' },
        { label: 'Composición', value: '5 jugadores — Tank, Luchador, Asesino, Mago, Tirador, Support' },
        { label: 'Draft', value: 'Draft con bans — cada equipo banea 3 héroes y elige 5' },
        { label: 'Especificidad', value: 'Reaparición rápida, regreso a base, interfaz optimizada móvil' },
      ],
    },
    leagues: [
      { name: 'M-Series (Worlds)', region: '🌍 International', tier: 0, desc: { fr: 'Championnat du Monde annuel MLBB', en: 'Annual MLBB World Championship', es: 'Campeonato del Mundo anual de MLBB' } },
      { name: 'MSC', region: '🌍 International', tier: 1, desc: { fr: 'Mid-Season Cup — tournoi international mi-saison', en: 'Mid-Season Cup — international mid-season tournament', es: 'Mid-Season Cup — torneo internacional de mitad de temporada' } },
      { name: 'MPL Philippines', region: '🇵🇭 Philippines', tier: 1, desc: { fr: 'Ligue la plus compétitive au monde', en: 'Most competitive league in the world', es: 'Liga más competitiva del mundo' } },
      { name: 'MPL Indonesia', region: '🇮🇩 Indonésie', tier: 1, desc: { fr: 'Ligue indonésienne très suivie', en: 'Highly followed Indonesian league', es: 'Liga indonesia muy seguida' } },
      { name: 'MPL MY/SG', region: '🇲🇾 Malaisie/Singapour', tier: 2, desc: { fr: 'Ligue Malaisie & Singapour', en: 'Malaysia & Singapore League', es: 'Liga de Malasia y Singapur' } },
    ],
    links: [
      { label: 'mobilelegends.net', url: 'https://m.mobilelegends.net/en/esports' },
      { label: 'Liquipedia MLBB', url: 'https://liquipedia.net/mobilelegends' },
    ],
  },

  kog: {
    label: 'Honor of Kings',
    icon: '👑',
    genre: 'moba',
    accent: '#7c88ff',
    description: {
      fr: 'Honor of Kings (王者荣耀) est un MOBA 5v5 mobile développé par TiMi Studio (Tencent). Le jeu mobile le plus joué au monde avec plus de 100 millions de joueurs quotidiens en Chine.',
      en: 'Honor of Kings (王者荣耀) is a 5v5 mobile MOBA developed by TiMi Studio (Tencent). The most played mobile game in the world with over 100 million daily players in China.',
      es: 'Honor of Kings (王者荣耀) es un MOBA 5v5 móvil desarrollado por TiMi Studio (Tencent). El juego móvil más jugado del mundo con más de 100 millones de jugadores diarios en China.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo3 en playoffs, Bo5 en finales internationales' },
        { label: 'Durée d\'une partie', value: '18 à 30 minutes' },
        { label: 'Composition', value: '5 joueurs — Tank, Warrior, Assassin, Mage, Marksman, Support' },
        { label: 'Draft', value: 'Draft avec bans et contre-picks' },
        { label: 'Roster', value: 'Plus de 120 héros inspirés de la mythologie chinoise et mondiale' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo3 in playoffs, Bo5 in international finals' },
        { label: 'Game duration', value: '18 to 30 minutes' },
        { label: 'Composition', value: '5 players — Tank, Warrior, Assassin, Mage, Marksman, Support' },
        { label: 'Draft', value: 'Draft with bans and counter-picks' },
        { label: 'Roster', value: 'Over 120 heroes inspired by Chinese and world mythology' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo3 en playoffs, Bo5 en finales internacionales' },
        { label: 'Duración de partida', value: '18 a 30 minutos' },
        { label: 'Composición', value: '5 jugadores — Tank, Guerrero, Asesino, Mago, Tirador, Support' },
        { label: 'Draft', value: 'Draft con bans y counter-picks' },
        { label: 'Roster', value: 'Más de 120 héroes inspirados en la mitología china y mundial' },
      ],
    },
    leagues: [
      { name: 'KIC (Kings International Championship)', region: '🌍 International', tier: 0, desc: { fr: 'Championnat du Monde annuel HoK', en: 'Annual HoK World Championship', es: 'Campeonato del Mundo anual de HoK' } },
      { name: 'KPL', region: '🇨🇳 Chine', tier: 1, desc: { fr: 'Kings Pro League — ligue professionnelle chinoise', en: 'Kings Pro League — Chinese professional league', es: 'Kings Pro League — liga profesional china' } },
      { name: 'HoK Global Championship', region: '🌍 International', tier: 1, desc: { fr: 'Compétition internationale pour les régions hors Chine', en: 'International competition for regions outside China', es: 'Competición internacional para regiones fuera de China' } },
    ],
    links: [
      { label: 'honorofkings.com', url: 'https://www.honorofkings.com' },
      { label: 'Liquipedia HoK', url: 'https://liquipedia.net/honorofkings' },
    ],
  },

  overwatch: {
    label: 'Overwatch',
    icon: '⚡',
    genre: 'fps',
    accent: '#4ade80',
    description: {
      fr: 'Overwatch est un FPS en équipe 5v5 développé par Blizzard. Les équipes s\'affrontent sur des objectifs variés (Escorte, Contrôle, Hybride) avec une grande variété de héros aux capacités uniques.',
      en: 'Overwatch is a 5v5 team FPS developed by Blizzard. Teams compete on various objectives (Escort, Control, Hybrid) with a wide variety of heroes with unique abilities.',
      es: 'Overwatch es un FPS de equipo 5v5 desarrollado por Blizzard. Los equipos compiten en objetivos variados (Escolta, Control, Híbrido) con una amplia variedad de héroes con habilidades únicas.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo3 en playoffs, Bo5 en finales' },
        { label: 'Structure d\'un match', value: '3 maps différentes par match — le mode de jeu change selon la map' },
        { label: 'Durée d\'une partie', value: '20 à 40 minutes par match' },
        { label: 'Rôles', value: '2 Tanks, 2 DPS, 2 Supports — structure 2-2-2 obligatoire' },
        { label: 'Héros', value: 'Pas de draft — les joueurs changent de héros librement entre rounds' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo3 in playoffs, Bo5 in finals' },
        { label: 'Match structure', value: '3 different maps per match — game mode changes per map' },
        { label: 'Game duration', value: '20 to 40 minutes per match' },
        { label: 'Roles', value: '2 Tanks, 2 DPS, 2 Supports — mandatory 2-2-2 structure' },
        { label: 'Heroes', value: 'No draft — players swap heroes freely between rounds' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo3 en playoffs, Bo5 en finales' },
        { label: 'Estructura de partida', value: '3 mapas diferentes por partido — el modo de juego cambia por mapa' },
        { label: 'Duración de partida', value: '20 a 40 minutos por partido' },
        { label: 'Roles', value: '2 Tanks, 2 DPS, 2 Supports — estructura 2-2-2 obligatoria' },
        { label: 'Héroes', value: 'Sin draft — los jugadores cambian héroes libremente entre rondas' },
      ],
    },
    leagues: [
      { name: 'Overwatch Champions Series', region: '🌍 International', tier: 0, desc: { fr: 'Circuit mondial officiel Blizzard depuis 2024', en: 'Official Blizzard worldwide circuit since 2024', es: 'Circuito mundial oficial de Blizzard desde 2024' } },
      { name: 'OWCS Americas', region: '🌎 Amériques', tier: 1, desc: { fr: 'Circuit officiel pour les Amériques', en: 'Official circuit for the Americas', es: 'Circuito oficial para las Américas' } },
      { name: 'OWCS EMEA', region: '🇪🇺 Europe', tier: 1, desc: { fr: 'Circuit officiel pour l\'Europe et le Moyen-Orient', en: 'Official circuit for Europe and the Middle East', es: 'Circuito oficial para Europa y Oriente Medio' } },
    ],
    links: [
      { label: 'overwatch.blizzard.com', url: 'https://overwatch.blizzard.com/esports' },
      { label: 'Liquipedia Overwatch', url: 'https://liquipedia.net/overwatch' },
    ],
  },

  rl: {
    label: 'Rocket League',
    icon: '🚀',
    genre: 'sport',
    accent: '#38bdf8',
    description: {
      fr: 'Rocket League est un jeu de sport unique développé par Psyonix (Epic Games) : du football joué avec des voitures à réacteur. Matchs 3v3, gameplay ultra-dynamique avec des mécaniques de saut, de rotation et d\'aériens.',
      en: 'Rocket League is a unique sports game developed by Psyonix (Epic Games): soccer played with rocket-powered cars. 3v3 matches, ultra-dynamic gameplay with jump, rotation and aerial mechanics.',
      es: 'Rocket League es un juego de deportes único desarrollado por Psyonix (Epic Games): fútbol jugado con coches a reacción. Partidas 3v3, jugabilidad ultra-dinámica con mecánicas de salto, rotación y aéreos.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Bo5 en playoffs, Bo7 en finales mondiales' },
        { label: 'Structure d\'un match', value: '5 minutes réglementaires + prolongation soudaine mort si égalité' },
        { label: 'Équipe', value: '3 joueurs par équipe + 1 remplaçant' },
        { label: 'Spécificité', value: 'Mécanique de boost, aériens, redirections — très technique' },
      ],
      en: [
        { label: 'Standard format', value: 'Bo5 in playoffs, Bo7 in world finals' },
        { label: 'Match structure', value: '5 regulation minutes + sudden death overtime if tied' },
        { label: 'Team', value: '3 players per team + 1 substitute' },
        { label: 'Specificity', value: 'Boost mechanic, aerials, redirects — very technical' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Bo5 en playoffs, Bo7 en finales mundiales' },
        { label: 'Estructura de partida', value: '5 minutos reglamentarios + muerte súbita si hay empate' },
        { label: 'Equipo', value: '3 jugadores por equipo + 1 suplente' },
        { label: 'Especificidad', value: 'Mecánica de boost, aéreos, redirecciones — muy técnico' },
      ],
    },
    leagues: [
      { name: 'RLCS World Championship', region: '🌍 International', tier: 0, desc: { fr: 'Championnat du Monde annuel Rocket League', en: 'Annual Rocket League World Championship', es: 'Campeonato del Mundo anual de Rocket League' } },
      { name: 'RLCS Majors', region: '🌍 International', tier: 1, desc: { fr: '3 Majors par saison — NA, EU, Monde', en: '3 Majors per season — NA, EU, World', es: '3 Majors por temporada — NA, EU, Mundo' } },
      { name: 'RLCS Europe', region: '🇪🇺 Europe', tier: 2, desc: { fr: 'Circuit régional européen', en: 'European regional circuit', es: 'Circuito regional europeo' } },
      { name: 'RLCS North America', region: '🌎 Amérique du Nord', tier: 2, desc: { fr: 'Circuit régional nord-américain', en: 'North American regional circuit', es: 'Circuito regional norteamericano' } },
    ],
    links: [
      { label: 'rocketleague.com/esports', url: 'https://www.rocketleague.com/esports' },
      { label: 'Liquipedia RL', url: 'https://liquipedia.net/rocketleague' },
    ],
  },

  cod: {
    label: 'Call of Duty',
    icon: '🎖️',
    genre: 'fps',
    accent: '#4ade80',
    description: {
      fr: 'Call of Duty League est le circuit professionnel officiel de CoD. Les équipes s\'affrontent en 4v4 sur des modes Search & Destroy, Hardpoint et Control.',
      en: 'Call of Duty League is the official professional CoD circuit. Teams compete 4v4 in Search & Destroy, Hardpoint and Control modes.',
      es: 'Call of Duty League es el circuito profesional oficial de CoD. Los equipos compiten 4v4 en modos Search & Destroy, Hardpoint y Control.',
    },
    format: {
      fr: [
        { label: 'Format standard', value: 'Série de 3 modes : Hardpoint, Search & Destroy, Control' },
        { label: 'Équipe', value: '4 joueurs par équipe' },
        { label: 'Maps', value: 'Pool de maps avec veto — règles de rotation strictes' },
        { label: 'Durée', value: '45 à 75 minutes par série' },
      ],
      en: [
        { label: 'Standard format', value: 'Series of 3 modes: Hardpoint, Search & Destroy, Control' },
        { label: 'Team', value: '4 players per team' },
        { label: 'Maps', value: 'Map pool with veto — strict rotation rules' },
        { label: 'Duration', value: '45 to 75 minutes per series' },
      ],
      es: [
        { label: 'Formato estándar', value: 'Serie de 3 modos: Hardpoint, Search & Destroy, Control' },
        { label: 'Equipo', value: '4 jugadores por equipo' },
        { label: 'Mapas', value: 'Pool de mapas con veto — reglas de rotación estrictas' },
        { label: 'Duración', value: '45 a 75 minutos por serie' },
      ],
    },
    leagues: [
      { name: 'CDL Championship', region: '🌍 International', tier: 0, desc: { fr: 'Championnat annuel Call of Duty League', en: 'Annual Call of Duty League Championship', es: 'Campeonato anual de Call of Duty League' } },
      { name: 'CDL Majors', region: '🌍 International', tier: 1, desc: { fr: '4 Majors par saison avec les franchises CDL', en: '4 Majors per season with CDL franchises', es: '4 Majors por temporada con las franquicias CDL' } },
    ],
    links: [
      { label: 'callofdutyleague.com', url: 'https://callofdutyleague.com' },
      { label: 'Liquipedia CoD', url: 'https://liquipedia.net/callofduty' },
    ],
  },
};

// ----------------------------------------------------------
//  Affichage de la page
// ----------------------------------------------------------
function showEsportInfoPage(gameKey) {
  // Créer ou réutiliser l'overlay
  let overlay = document.getElementById('esport-info-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'esport-info-overlay';
    overlay.className = 'esport-info-overlay';
    document.body.appendChild(overlay);
  }

  const lang = window.i18n ? window.i18n.currentLang() : 'fr';

  // Si pas de jeu spécifique → page liste de tous les jeux
  if (!gameKey || !ESPORT_INFO[gameKey]) {
    overlay.innerHTML = renderEsportInfoList(lang);
    overlay.classList.add('open');
    return;
  }

  overlay.innerHTML = renderEsportInfoDetail(gameKey, lang);
  overlay.classList.add('open');
}

function closeEsportInfoPage() {
  const overlay = document.getElementById('esport-info-overlay');
  if (overlay) overlay.classList.remove('open');
}

// ----------------------------------------------------------
//  Page liste — tous les jeux
// ----------------------------------------------------------
function renderEsportInfoList(lang) {
  const titles = { fr: 'Infos Esport', en: 'Esport Info', es: 'Info Esport' };
  const subtitles = { fr: 'Découvre les formats, règles et circuits de chaque jeu', en: 'Discover the formats, rules and circuits of each game', es: 'Descubre los formatos, reglas y circuitos de cada juego' };

  const cards = Object.entries(ESPORT_INFO).map(([key, info]) => {
    const accent = info.accent;
    const genreColors = {
      moba: '#1a1f3a',
      fps: '#1a2a1a',
      sport: '#1a2a3a',
    };
    const bg = genreColors[info.genre] || '#161a27';
    return `
      <div class="esport-info-game-card" style="border-color:${accent}30;background:${bg}" onclick="showEsportInfoPage('${key}')">
        <div class="esport-info-game-icon">${info.icon}</div>
        <div class="esport-info-game-label" style="color:${accent}">${info.label}</div>
        <div class="esport-info-game-arrow">›</div>
      </div>
    `;
  }).join('');

  return `
    <div class="esport-info-box">
      <div class="esport-info-header">
        <button class="esport-info-close" onclick="closeEsportInfoPage()">✕</button>
        <div class="esport-info-title">📚 ${titles[lang] || titles.fr}</div>
        <div class="esport-info-subtitle">${subtitles[lang] || subtitles.fr}</div>
      </div>
      <div class="esport-info-grid">
        ${cards}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------
//  Page détail — un jeu
// ----------------------------------------------------------
function renderEsportInfoDetail(key, lang) {
  const info = ESPORT_INFO[key];
  if (!info) return '';

  const accent = info.accent;
  const desc = info.description[lang] || info.description.fr;
  const formatItems = (info.format[lang] || info.format.fr);
  const backLabel = { fr: 'Retour', en: 'Back', es: 'Volver' };
  const formatLabel = { fr: 'Format & Règles', en: 'Format & Rules', es: 'Formato & Reglas' };
  const leaguesLabel = { fr: 'Circuits & Ligues', en: 'Circuits & Leagues', es: 'Circuitos & Ligas' };
  const linksLabel = { fr: 'Liens utiles', en: 'Useful links', es: 'Enlaces útiles' };
  const tierLabels = {
    0: { fr: 'Mondial', en: 'Worldwide', es: 'Mundial', color: '#fbbf24' },
    1: { fr: 'Tier 1', en: 'Tier 1', es: 'Tier 1', color: info.accent },
    2: { fr: 'Tier 2', en: 'Tier 2', es: 'Tier 2', color: '#8892a4' },
  };

  const leagueRows = info.leagues.map(l => {
    const tier = tierLabels[l.tier] || tierLabels[1];
    const lDesc = l.desc[lang] || l.desc.fr;
    return `
      <div class="esport-info-league-row">
        <div class="esport-info-league-left">
          <span class="esport-info-league-name" style="color:${accent}">${l.name}</span>
          <span class="esport-info-league-region">${l.region}</span>
        </div>
        <div class="esport-info-league-right">
          <span class="esport-info-league-tier" style="color:${tier.color};border-color:${tier.color}40">${tier[lang] || tier.fr}</span>
          <span class="esport-info-league-desc">${lDesc}</span>
        </div>
      </div>
    `;
  }).join('');

  const linkBtns = info.links.map(l => `
    <a href="${l.url}" target="_blank" rel="noopener" class="esport-info-link-btn" style="border-color:${accent}40;color:${accent}">
      🔗 ${l.label}
    </a>
  `).join('');

  return `
    <div class="esport-info-box">
      <div class="esport-info-header" style="border-bottom-color:${accent}30">
        <button class="esport-info-back" onclick="showEsportInfoPage(null)">‹ ${backLabel[lang] || backLabel.fr}</button>
        <button class="esport-info-close" onclick="closeEsportInfoPage()">✕</button>
        <div class="esport-info-game-title">
          <span style="font-size:28px">${info.icon}</span>
          <span style="color:${accent}">${info.label}</span>
        </div>
        <p class="esport-info-desc">${desc}</p>
      </div>

      <div class="esport-info-section">
        <div class="esport-info-section-title" style="color:${accent}">⚙️ ${formatLabel[lang] || formatLabel.fr}</div>
        <div class="esport-info-format-list">
          ${formatItems.map(item => `
            <div class="esport-info-format-row">
              <span class="esport-info-format-label">${item.label}</span>
              <span class="esport-info-format-value">${item.value}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="esport-info-section">
        <div class="esport-info-section-title" style="color:${accent}">🏆 ${leaguesLabel[lang] || leaguesLabel.fr}</div>
        <div class="esport-info-leagues">
          ${leagueRows}
        </div>
      </div>

      <div class="esport-info-section">
        <div class="esport-info-section-title" style="color:${accent}">🔗 ${linksLabel[lang] || linksLabel.fr}</div>
        <div class="esport-info-links">
          ${linkBtns}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------
//  Bouton dans la sidebar — ajouté à chaque jeu

// ----------------------------------------------------------
//  Boutons ℹ️ dans la sidebar
// ----------------------------------------------------------
function addEsportInfoButtons() {
  Object.keys(ESPORT_INFO).forEach(key => {
    // Chercher la ligne du jeu dans la sidebar
    const toggle = document.getElementById('gt-' + key);
    if (!toggle) return;
    const row = toggle.closest('.game-toggle-row');
    if (!row || row.querySelector('.esport-info-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'esport-info-btn';
    btn.title = 'Infos esport';
    btn.innerHTML = 'ℹ️';
    btn.onclick = (e) => {
      e.stopPropagation();
      showEsportInfoPage(key);
    };
    row.appendChild(btn);
  });
}

// ----------------------------------------------------------
//  Bouton dans la navbar — classe dédiée pour éviter display:none mobile
// ----------------------------------------------------------
function addEsportInfoNavButton() {
  const navbar = document.querySelector('.navbar');
  if (!navbar || document.getElementById('esport-info-nav-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'esport-info-nav-btn';
  btn.className = 'esport-info-nav-btn';   // classe dédiée, pas fav-nav-btn
  btn.innerHTML = '📚 Infos';
  btn.title = 'Infos Esport';
  btn.onclick = () => showEsportInfoPage(null);

  // Insérer avant auth-bar
  const authBar = document.getElementById('auth-bar');
  if (authBar) navbar.insertBefore(btn, authBar);
  else navbar.appendChild(btn);
}

// ----------------------------------------------------------
//  Init
// ----------------------------------------------------------
function initEsportInfo() {
  addEsportInfoNavButton();
  setTimeout(addEsportInfoButtons, 800);
}

// Exposer globalement
window.showEsportInfoPage  = showEsportInfoPage;
window.closeEsportInfoPage = closeEsportInfoPage;
window.initEsportInfo      = initEsportInfo;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initEsportInfo, 1500));
} else {
  setTimeout(initEsportInfo, 1500);
}
