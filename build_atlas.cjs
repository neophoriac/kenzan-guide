const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
require('./atlas/build.cjs').prepareAtlasBuild();
const { atlasSidebar } = require('./atlas/distribution.cjs');
const { fontStyles } = require('./src/guide/font-styles.cjs');
const { copyAtlasRendererAssets } = require('./atlas/renderer-assets.cjs');
const { assetNames: rendererAssetNames } = require('./atlas/renderer-assets.cjs');
const { collectSceneAssets, validatePublicationDirectory } = require('./atlas/publication.cjs');
const { readView } = require('./src/guide/view-assets.cjs');
const { writeExecutableAsset, scriptTag } = require('./src/guide/script-assets.cjs');
const { atlasRuntime, atlasStyles: mapStyles } = require('./atlas/bundle.cjs');
const { renderAtlas: renderMap, renderSidebarStart, escape } = require('./atlas/render.cjs');
const { overviewVariants, buildAtlasOverview } = require('./tools/maps/build_atlas_overview.cjs');
const { loadRevelations, revelationPlaces } = require('./src/activities/revelation-guide.cjs');
const { loadLockerKeys } = require('./src/activities/locker-key-guide.cjs');
const { loadLocationPhoto, loadPlacePhoto } = require('./src/map/location-photos.cjs');
const { trainingGroups } = require('./src/activities/training-guide.cjs');
const { icons: webIcons, credits: webIconCredits } = require('./atlas/kenzan-web-icons.json');

const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const atlasStyles = () => mapStyles({ includeSidebar: false });
const guide = 'Kenzan Side Content Guide.html';
const manifest = JSON.parse(read('maps/data/areas.json'));

// The stage maps have separate coordinate origins. These placements follow travel connections.
const positions = {
  st_rendaino_jnt: [236, 86, 115],
  st_kaido_tanbo: [236, 352, 280],
  st_yoshioka_jnt: [588, 405, 215],
  st_kaido_rakunai: [870, 343, 320],
  st_rakugaicho: [1265, 410, 368],
  st_gion: [1325, 45, 268],
  st_kaido_kawa: [1190, 672, 112],
  st_kawa_jnt: [1170, 972, 225],
  st_hozoin: [1165, 1230, 158],
  st_kaido_tani: [1500, 966, 150],
  st_kaido_rindo: [1725, 647, 455],
  st_dokutsu_soto: [1955, 493, 224],
  st_dokutsu_01: [2200, 495, 190],
  st_kiyomizu_jnt: [2225, 645, 145],
  st_kiyomizu: [2155, 858, 280],
  st_kaido_yama: [2010, 823, 104],
  st_taki: [1755, 740, 84],
  st_sanjusangen_jnt: [1715, 1120, 180],
  st_sanjusangendo: [1725, 948, 145],
  st_tatsuya: [1665, 257, 152, undefined, 'Building interiors'],
  st_yagyu_sato: [2490, 690, 225, undefined, 'Yagyū Village'],
  st_yagyu_naka: [2790, 842, 160, undefined, 'Yagyū Village'],
};

const storyAreas = new Set(['st_akudaikan', 'st_inei', 'st_karyu', 'st_miya_dojo', 'st_sanmon', 'st_toaru_tani',
  'st_toaru_tera', 'st_toaru_yashiki', 'st_ufo', 'st_ukiyo_ienonaka', 'st_ukiyo_ienosoto', 'st_yuuki_nakaniwa', 'st_yuuki_shinshitsu']);
const sections = {
  interiors: 'Building interiors',
  cave: 'Shishido’s cave',
  rendai: 'Rendai Field battles',
  ganryu: 'Ganryū Island',
  story: 'Other story areas',
};
const panels = [];

function sectionFor(id) {
  if (id.startsWith('st_dokutsu_')) return 'cave';
  if (id.startsWith('st_rendaino_')) return 'rendai';
  if (id.startsWith('st_ganryu_')) return 'ganryu';
  if (storyAreas.has(id)) return 'story';
  return 'interiors';
}

function placeSection(section, x, y, columns, cellWidth) {
  const maps = manifest.filter(({ id }) => !positions[id] && sectionFor(id) === section);
  const cellHeight = 183;
  if (!maps.length) return y;
  for (const [index, { id, width, height }] of maps.entries()) {
    const w = Math.min(cellWidth - 24, (cellHeight - 82) * width / height);
    positions[id] = [x + 20 + (index % columns) * cellWidth, y + 128 + Math.floor(index / columns) * cellHeight, w, cellWidth - 10, sections[section]];
  }
  const height = 68 + Math.ceil(maps.length / columns) * cellHeight;
  panels.push({ label: sections[section], x, y, w: columns * cellWidth + 20, h: height });
  return y + height;
}

const interiorsEnd = placeSection('interiors', 44, 585, 7, 150);
const storyTop = Math.max(1450, interiorsEnd + 40);
const caveEnd = placeSection('cave', 44, storyTop, 5, 174);
const rendaiEnd = placeSection('rendai', 980, storyTop, 5, 174);
const ganryuEnd = placeSection('ganryu', 1916, storyTop, 5, 194);
const storyEnd = placeSection('story', 44, Math.max(caveEnd, rendaiEnd, ganryuEnd) + 40, 9, 186);
const world = { width: 2990, height: Math.max(1430, storyEnd + 40) };
const imageryTrialAreas = [
  ['st_kaido_kawa', 'riverside'],
  ['st_kiyomizu', 'kiyomizudera', '512'],
  ['st_kaido_rindo', 'forest-path', '512'],
  ['st_ganryu_yosai_04', 'ganryu-fortress', '512'],
];
const imageryTrials = Object.fromEntries(imageryTrialAreas.flatMap(([id, parameter, defaultVariant]) => {
  const file = `maps/assets/pyramids/${id}/manifest.json`;
  if (!fs.existsSync(path.join(__dirname, file))) return [];
  const { variants } = JSON.parse(read(file));
  assert(!defaultVariant || Object.hasOwn(variants, defaultVariant), `Unknown default imagery variant for ${id}`);
  return [[id, { parameter, defaultVariant, variants }]];
}));

// Follow the stage transitions in wdr_par/wdr.par and scenario/player_pos.bin.
// Endpoints use the map's gate bars or projected triggers at unmarked entrances.
// The middle points only steer the lines through gaps in the atlas layout.
const forestGate = ['st_kaido_rindo', .985060, .707696];
const mountainGate = ['st_kaido_yama', .699219, .018799];
const forestTempleDoors = [['st_kiyomizu_jnt', .163159, .231283], ['st_kiyomizu', .041369, .064721]];
const mountainTempleDoors = [['st_kiyomizu_jnt', .030087, .522611], ['st_kiyomizu', .011520, .178244]];
const connections = [
  [['st_rendaino_jnt', .517467, .960938], ['st_kaido_tanbo', .209473, .039063]],
  [['st_kaido_tanbo', .985164, .696079], ['st_yoshioka_jnt', .078125, .484375]],
  [['st_yoshioka_jnt', .900391, .541016], ['st_kaido_rakunai', .010323, .714295]],
  [['st_kaido_rakunai', .983925, .709449], ['st_rakugaicho', .052670, .201297]],
  [['st_gion', .3547, .8989], ['st_tatsuya', .026367, .449843], [[1420, 367], [1615, 367], [1648, 300]]],
  [['st_tatsuya', .888804, .747851], ['st_rakugaicho', .321863, .150102], [[1800, 394], [1383, 394]]],
  [['st_rakugaicho', .036279, .898422], ['st_kaido_kawa', .894468, .060013]],
  [['st_kaido_kawa', .828182, .965706], ['st_kawa_jnt', .357222, .102466]],
  [['st_kawa_jnt', .241211, .895270], ['st_hozoin', .5074, .0981]],
  [['st_kawa_jnt', .917969, .451577], ['st_kaido_tani', .134766, .901961]],
  [['st_kaido_tani', .870003, .039302], ['st_sanjusangen_jnt', .307359, .861323], [[1680, 955], [1698, 987], [1698, 1285], [1770, 1285]]],
  [['st_rakugaicho', .647199, .932205], ['st_kaido_rindo', .012105, .587376]],
  [['st_kaido_rindo', .6511, .1322], ['st_dokutsu_soto', .2165, .4437]],
  [['st_dokutsu_soto', .869133, .422153], ['st_dokutsu_01', .125681, .6266], [], 'story-gate'],
  [forestGate, forestTempleDoors[0]],
  [mountainGate, mountainTempleDoors[0], [[2083, 776], [2150, 721]]],
  // Forest and Mountain Path load the alternate temple grounds during the Chapter 10 rescue.
  [forestGate, forestTempleDoors[1], [[2190, 701], [2140, 714], [2140, 855]], 'story-gate'],
  [mountainGate, mountainTempleDoors[1], [[2120, 843], [2120, 879]], 'story-gate'],
  [['st_kaido_yama', .5099, .3410], ['st_taki', .6832, .7968], [[1955, 887]]],
  [['st_kaido_yama', .120117, .982666], ['st_sanjusangen_jnt', .949164, .420026]],
  [['st_sanjusangen_jnt', .415578, .123367], ['st_sanjusangendo', .512794, .726051], [], 'story-gate'],
];

const tiles = manifest.map(({ id, label, file, width, height }) => {
  assert(positions[id], `Atlas placement missing for ${id}`);
  const [x, y, w, labelWidth, group = 'Outdoor areas'] = positions[id];
  const h = Number((w * height / width).toFixed(2));
  assert(x >= 0 && y >= 0 && x + w <= world.width && y + h <= world.height, `Map ${id} falls outside the atlas`);
  return { id, label, file, x, y, w, h, width, height, labelWidth, group };
});
const byId = new Map(tiles.map(tile => [tile.id, tile]));
assert.equal(byId.size, tiles.length, 'Duplicate atlas map ID');
const streets = JSON.parse(read('maps/data/atlas-streets.json').replace(/^\uFEFF/, ''));
const districts = JSON.parse(read('maps/data/atlas-districts.json'));
const mapGeometry = JSON.parse(read('maps/data/native/landmarks.json'));
const places = ['buildings', 'services'].flatMap(kind => JSON.parse(read(`maps/data/atlas-${kind}.json`).replace(/^\uFEFF/, '')))
  .map(({ source, ...place }) => place);
const additionalRoutes = JSON.parse(read('maps/data/additional-routes.json'));
const routeWaypoints = {
  'st_kiyomizu_jnt/st_yagyu_sato': [[2247, 795], [2458, 795], [2458, 1020], [2605, 1020]],
};
const mapRoutes = [
  ...connections.map(([from, to, via, kind = 'travel']) => ({ from, to, via, kind })),
  ...additionalRoutes,
];
const entrances = new Map();

function addEntrance(from, to, { name, detail } = {}) {
  const [area, x, y] = from;
  const [destination, dx, dy] = to;
  atlasPoint(from);
  atlasPoint(to);
  const key = from.join('/');
  if (!entrances.has(key)) {
    const marker = places.find(place => place.area === area && place.x === x && place.y === y);
    const venue = places.find(place => place.area === area && place.name === name && place.type === 'building');
    const entrance = marker ?? { area, x, y, type: 'travel', name: name ?? `To ${byId.get(destination).label}` };
    entrance.detail ??= detail ?? venue?.detail;
    entrance.reference ??= venue?.reference;
    entrance.destinations = [];
    entrances.set(key, entrance);
    if (!marker) places.push(entrance);
  }
  const entrance = entrances.get(key);
  if (!entrance.destinations.some(point => point.area === destination && point.x === dx && point.y === dy)) {
    entrance.destinations.push({ area: destination, x: dx, y: dy });
    if (!name && entrance.destinations.length > 1) entrance.name = 'Connected areas';
  }
}

for (const { from, to, kind, label, detail, oneWay } of additionalRoutes) {
  assert(['travel', 'story-gate', 'interior'].includes(kind), `Invalid route type for ${from[0]} → ${to[0]}`);
  if (kind === 'interior' || label || detail) {
    addEntrance(from, to, { name: label, detail });
    if (!oneWay) addEntrance(to, from);
  }
}
for (const [gate, doors] of [[forestGate, forestTempleDoors], [mountainGate, mountainTempleDoors]]) {
  const gateInfo = {
    name: `Kiyomizudera gate · ${byId.get(gate[0]).label}`,
    detail: 'This exit loads the larger temple grounds during the Chapter 10 rescue. At other times it leads to the regular entrance.',
  };
  for (const door of doors) addEntrance(gate, door, gateInfo);
}

for (const file of ['atlas-shop-inventory.json', 'atlas-gambling-rewards.json']) {
  const catalogues = JSON.parse(read(`maps/data/${file}`));
  for (const [id, { places: venues, sections = [], note }] of Object.entries(catalogues)) {
    assert(venues.length && (sections.length || note), `Empty catalogue ${id}`);
    for (const { label, currency, items } of sections) {
      assert(label && currency && items.length && items.every(({ name, price }) =>
        name && (price === null || Number.isFinite(price) && price >= 0)), `Invalid items in ${id}: ${label}`);
    }
    const markers = venues.flatMap(({ area, name }) => {
      const matches = places.filter(place => place.area === area && place.name === name);
      assert(matches.length, `Unknown atlas marker for ${id}: ${area} / ${name}`);
      return matches;
    });
    const description = markers.find(place => place.detail);
    for (const place of new Set(markers)) {
      (place.catalogues ??= []).push({ sections, note });
      place.detail ??= description?.detail;
      place.reference ??= description?.reference;
    }
  }
}

const placeTypes = [
  ['building', 'Buildings', '■', 'Building'],
  ['landmark', 'Landmarks', '◆', 'Landmark'],
  ['save', 'Save points', 'S', 'Save point'],
  ['palanquin', 'Palanquins', 'P', 'Palanquin'],
  ['travel', 'Entrances', '↗', 'Entrance'],
  ['revelation', 'Revelations', 'R', 'Revelation'],
  ['encounter', 'Enemy encounters', 'E', 'Possible enemy spawn'],
];
for (const place of places) {
  assert(byId.has(place.area) && [place.x, place.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1),
    `Invalid label coordinates for ${place.name}`);
  assert(place.name && placeTypes.some(([id]) => id === place.type), `Invalid label type for ${place.name}`);
  assert(!place.reference || new URL(place.reference).protocol === 'https:', `Invalid reference for ${place.name}`);
}
const standardLayers = [['request', 'Requests'], ['commission', 'Contracts'], ['steps', 'Step pins'], ['street', 'Street names'], ['district', 'Districts'], ...placeTypes.filter(([type]) =>
  type === 'revelation' || places.some(place => place.type === type)), ['area', 'Area names'], ['routes', 'Travel routes']];

const collectibleLayers = [
  { id: 'locker-key', label: 'Locker Keys', symbol: 'K', color: '#6d5423', enabled: false },
  { id: 'turtle-rescue', label: 'Turtle Rescues', symbol: 'T', color: '#337148', enabled: true },
  { id: 'wild-turtle', label: 'Wild Turtle Spawns', legend: 'Wild turtles', symbol: 'W', color: '#3c665d', enabled: true },
  { id: 'field-pickup', label: 'Fixed Pickups', symbol: 'F', color: '#4c5887', enabled: true },
  { id: 'stage-weapon', label: 'Story-stage Weapons', legend: 'Stage weapons', symbol: '⚔', color: '#933d37', enabled: true },
  { id: 'stage-supply', label: 'Story-stage Supplies and Materials', legend: 'Stage supplies', symbol: '+', color: '#3d687c', enabled: false },
  { id: 'quest-find', label: 'Quest Finds', symbol: 'Q', color: '#76547e', enabled: false },
  { id: 'collection-reward', label: 'Collection Rewards', legend: 'Rewards', symbol: '★', color: '#725186', enabled: true },
];

function collectiblePlaces(quests, revelations, lockerKeys) {
  const questsById = new Map(quests.map(quest => [quest.id, quest]));
  const revelationsById = new Map(revelations.pictures.map(revelation => [revelation.id, revelation]));
  const keysById = new Map(lockerKeys.map(key => [key.id, key]));
  const groups = new Map(collectibleLayers.map(group => [group.id, group]));
  const markers = new Map();
  const ids = new Set();
  for (const file of ['turtles', 'pickups', 'rewards']) {
    for (const entry of JSON.parse(read(`maps/data/collectible-${file}.json`))) {
      const { id, group, name, detail, window, approximate, questId, revelationId, lockerKeyId, step, progressId = id } = entry;
      assert(id && !ids.has(id) && groups.has(group) && group !== 'locker-key' && name && detail, `Invalid collectible ${id}`);
      ids.add(id);
      const route = questsById.get(questId) ?? revelationsById.get(revelationId);
      const key = keysById.get(lockerKeyId);
      assert(questId === undefined || questsById.has(questId), `Unknown quest for ${id}`);
      assert(revelationId === undefined || revelationsById.has(revelationId), `Unknown Revelation for ${id}`);
      assert(lockerKeyId === undefined || key, `Unknown locker key for ${id}`);
      const routePoint = step === undefined ? route?.pin : route?.locations[route.steps[step]?.letter];
      const point = entry.area ? entry : key ?? routePoint;
      assert(point, `No map location for ${id}`);
      const { area, x, y, precision } = point;
      atlasPoint([area, x, y]);
      const markerKey = `${group}/${area}/${x}/${y}`;
      if (!markers.has(markerKey)) markers.set(markerKey, { id, type: group, area, x, y, entries: [] });
      markers.get(markerKey).entries.push({ progressId, name, detail, window, approximate: approximate ?? precision === 'approximate',
        questId, revelationId, lockerKeyId });
    }
  }
  const spawnsByArea = Map.groupBy([...markers.values()].filter(place => place.type === 'wild-turtle'), place => place.area);
  for (const [area, spawns] of spawnsByArea) {
    const { label, width, height } = byId.get(area);
    const [major, minor] = width >= height ? ['x', 'y'] : ['y', 'x'];
    spawns.sort((a, b) => a[major] - b[major] || a[minor] - b[minor]);
    for (const [index, spawn] of spawns.entries()) {
      const caption = `Spawn ${index + 1}`;
      spawn.caption = caption;
      spawn.entries[0].name = `${label} · ${caption}`;
    }
  }
  return [...markers.values()].map(place => {
    const { label, symbol, color } = groups.get(place.type);
    const names = new Set(place.entries.map(entry => entry.name));
    return { ...place, photo: loadLocationPhoto('place-photos', place.id), groupLabel: label, symbol, color,
      name: names.size === 1 ? place.entries[0].name : `${names.size} ${label.toLowerCase()}` };
  });
}

function atlasPoint([id, u, v]) {
  assert(byId.has(id) && [u, v].every(value => Number.isFinite(value) && value >= 0 && value <= 1),
    `Invalid atlas coordinates on ${id}`);
  const { x, y, w, h } = byId.get(id);
  return [Number((x + u * w).toFixed(2)), Number((y + v * h).toFixed(2))];
}

function tileArtwork({ file, label, ...tile }) {
  const stem = path.parse(file).name;
  const lossless = file.replace(/\.png$/i, '.webp');
  const detail = fs.existsSync(path.join(__dirname, 'maps', lossless)) ? lossless : file;
  const sources = { detail: 'maps/' + detail };
  for (const [tier, folder] of [['preview', 'previews'], ['medium', 'medium']]) {
    const source = 'maps/assets/' + folder + '/' + stem + '.webp';
    if (fs.existsSync(path.join(__dirname, source))) sources[tier] = source;
  }
  return { ...tile, label, shortLabel: label, sources };
}

const districtsWithGeometry = districts.map(({ name, layer, labelY, widthScale }) => {
  const feature = mapGeometry[layer];
  assert(feature?.geometry?.length >= 3, 'Missing district map geometry for ' + name);
  return { ...feature, id: layer, name, y: labelY ?? feature.y, widthScale };
});
const routes = mapRoutes.filter(route => route.kind !== 'interior').map(({ from, to, via, kind, oneWay }) => ({
  from, to, via: via ?? routeWaypoints[from[0] + '/' + to[0]],
  class: kind === 'story-gate' ? kind : undefined, oneWay,
}));
const questTypes = {
  Requests: { layer: 'request', label: 'Request', color: '#7c332a' },
  Commissions: { layer: 'commission', label: 'Contract', color: '#285e60' },
  Bounties: { layer: 'bounty', label: 'Bounty', color: '#6b4f87' },
};
const placeStyles = {
  building: { color: '#5b4932', minExtent: 225, scrollToDetail: true },
  landmark: { color: '#405a50' },
  save: { color: '#3a643f' },
  palanquin: { color: '#35577e' },
  travel: { color: '#405a50' },
  revelation: { color: '#176667' },
  encounter: { color: '#8a4934', minExtent: 225 },
};
const markerTypes = Object.fromEntries(placeTypes.map(([id, , symbol, label]) => [id, { label, symbol, ...placeStyles[id], icon: webIcons[id] }]));
const layerBadges = {
  ...Object.fromEntries(Object.entries(questTypes).map(([type, { layer, color }]) =>
    [layer, { symbol: type[0], color, swatch: 'circle' }])),
  steps: { symbol: 'A', color: '#8c352c', swatch: 'circle' },
  street: { symbol: 'Aa', color: '#3a413c' },
  district: { symbol: '', color: '#a45079', swatch: 'boundary' },
  area: { symbol: 'A', color: '#48554a' },
  routes: { symbol: '', color: '#8c754b', swatch: 'route' },
};
const [encounterType, encounterLabel] = placeTypes.find(([id]) => id === 'encounter');
const encounters = Object.entries(JSON.parse(read('maps/data/atlas-encounters.json'))).flatMap(([area, sections]) => {
  let number = 0;
  return sections.flatMap(({ sites }, index) => sites.map(({ actor, x, y, behavior }) => {
    number += 1;
    const name = `Enemy spawn ${number}`;
    const section = index + 1;
    const movement = behavior === 'Idle' ? 'Enemies start standing here.' : 'Enemies may patrol away from this starting point.';
    return {
      id: 'encounter-' + actor, linkId: `encounter:${area}:${number}`, type: encounterType, area, x, y, name,
      caption: `Spawn ${number}`, accessibleName: `${byId.get(area).label} · ${name}`,
      detail: `Possible spawn in section ${section}. The game can use at most one of the ${sites.length} sites in this section at a time. ${movement}`,
      guideLinks: [{ anchor: 'random-encounters', label: 'Random encounters guide' }],
    };
  }));
});
const roofStyle = { symbol: '↑', color: '#f2cc7b', textColor: '#382714', icon: webIcons['locker-roof'] };

function keyMarker(key) {
  const { id, code, area, x, y, name, type, location, approximate, roof, mode, steps, reward, note, photo } = key;
  const listMeta = [key.indoor && 'Indoors', roof ? 'Roof' : key.surface !== 'Interior' && key.surface,
    (key.lookUp || roof) && 'Look up'].filter(Boolean).join(' · ');
  const suffix = roof ? ' · Roof' : '';
  return {
    id, type, area, x, y, name, location, approximate, linkId: 'locker:' + id,
    symbol: 'K', color: '#6d5423', caption: code + suffix, accessibleName: name + suffix,
    ...(roof && { ...roofStyle, variant: 'locker-roof' }),
    pickup: {
      progressId: 'locker-key:' + id, listMeta, summary: [listMeta, mode].filter(Boolean).join(' · '),
      steps, reward: 'Locker reward · ' + reward, note, photo,
      link: { anchor: 'locker-key-' + id, label: 'View in locker key guide' },
    },
  };
}

function collectibleMarker(place) {
  const entries = place.entries.map(({ questId, revelationId, lockerKeyId, ...entry }) => {
    const links = questId ? [{ anchor: 'quest-' + questId, label: 'Open quest #' + questId }]
      : revelationId ? [{ anchor: 'revelation-' + revelationId, label: 'Open Revelation' }]
        : lockerKeyId ? [{ anchor: 'locker-key-' + lockerKeyId, label: 'Open locker key entry' }] : [];
    return { ...entry, links, guideLink: { anchor: 'collectible-' + place.id + ':' + entry.progressId, label: 'View in collectibles guide' } };
  });
  return { ...place, entries, repeatable: place.type === 'wild-turtle' };
}

function renderAtlas({ quests, objectives, storyOptions, standalone = false, revelations = loadRevelations(quests), lockerKeys = loadLockerKeys(),
  collectibles = collectiblePlaces(quests, revelations, lockerKeys) }) {
  const integrated = storyOptions !== undefined && !standalone;
  const hasBounties = quests.some(quest => quest.type === 'Bounties');
  const resultTypes = ['Requests', 'Commissions', ...(hasBounties ? ['Bounties'] : []), 'Revelations'];
  const layers = hasBounties ? [...standardLayers.slice(0, 2), ['bounty', 'Bounties'], ...standardLayers.slice(2)] : standardLayers;
  const mapLayers = [...layers, [encounterType, encounterLabel, false]].map(([id, label, enabled]) => ({
    ...markerTypes[id], ...layerBadges[id], id, label, enabled, icon: webIcons[id],
  }));
  for (const quest of quests) {
    assert(quest.pin && objectives[quest.window], `Missing start or objective for quest ${quest.id}`);
    for (const point of [quest.pin, quest.interior, ...Object.values(quest.locations)].filter(Boolean)) {
      assert(byId.has(point.area) && [point.x, point.y].every(value => value >= 0 && value <= 1), `Invalid marker for quest ${quest.id}`);
    }
  }
  const revelationPins = revelationPlaces(revelations);
  for (const pin of revelationPins) {
    atlasPoint([pin.area, pin.x, pin.y]);
    for (const { locations } of pin.revelations) {
      for (const point of Object.values(locations)) atlasPoint([point.area, point.x, point.y]);
    }
  }
  for (const key of lockerKeys) atlasPoint([key.area, key.x, key.y]);
  const trainingLinks = new Map();
  for (const { id, title, map } of trainingGroups) {
    if (!map) continue;
    const key = `${map.area}:${map.name}`;
    assert(places.some(place => `${place.area}:${place.name}` === key), `Missing training map location ${key}`);
    if (!trainingLinks.has(key)) trainingLinks.set(key, []);
    trainingLinks.get(key).push({ id, title });
  }
  const venues = places.map(({ checklist, ...place }) => {
    const training = trainingLinks.get(place.area + ':' + place.name) ?? [];
    return {
      ...place,
      photo: loadPlacePhoto(place.area, place.name),
      linkId: place.name === 'Storage Lockers' ? 'locker:lockers' : undefined,
      referenceLabel: 'Venue reference',
      guideLinks: [
        ...(checklist ? [checklist] : []),
        ...training.map(({ id, title }) => ({ anchor: 'training-' + id, label: title + ' checklist', summary: title })),
      ],
    };
  });
  const routePlaces = revelationPins.map(({ revelations: entries, ...place }) => ({
    ...place, overviewOnly: place.id === 'shichigoro', referenceLabel: 'Revelation reference',
    photo: loadPlacePhoto(place.area, place.name),
    routes: entries.map(entry => ({ ...entry, chapter: entry.window.split('-')[0], guideAnchor: 'revelation-' + entry.id })),
  }));
  const overviewImages = overviewVariants(world).flatMap(({ file, width }) => {
    const source = 'maps/assets/previews/' + file;
    return fs.existsSync(path.join(__dirname, source)) ? [{ source, width }] : [];
  });
  const guideFile = integrated ? '' : encodeURI(guide);
  const { enrichAtlasFacts } = require('./src/map/atlas-facts.cjs');
  const { enrichAtlasPreviews } = require('./src/map/atlas-previews.cjs');
  const enriched = enrichAtlasPreviews(enrichAtlasFacts({ quests,
    places: [...venues, ...routePlaces, ...lockerKeys.map(keyMarker), ...collectibles.map(collectibleMarker), ...encounters] }));
  // Keep the guarded source directions for enrichment, then publish key hints
  // as prose rather than classifying a single pickup instruction as a route.
  for (const place of enriched.places.filter(place => place.type === 'locker-key')) {
    place.pickup.description = place.pickup.steps.join(' ');
    delete place.pickup.steps;
  }
  const atlasData = {
    title: 'Like a Dragon: Kenzan! Map', mapLabel: 'Like a Dragon: Kenzan! Map',
    sidebarLogo: { source: 'assets/kenzan-sidebar-logo.webp', alt: 'Like a Dragon: Kenzan!', width: 392, height: 357 },
    guideHref: integrated ? '#guide' : guideFile,
    world, tiles: tiles.map(tileArtwork), panels, overviewImages, streets, districts: districtsWithGeometry, routes,
    quests: enriched.quests, objectives, places: enriched.places.map(place => ({ ...place,
      shape: place.shape ?? 'teardrop', size: place.size ?? 'large' })),
    imageryTrials, layers: mapLayers, collectibleLayers: collectibleLayers.map(layer => ({ ...layer, icon: webIcons[layer.id] })), resultTypes, storyOptions, chapterLabels: { 12: 'Finale' },
    placeTypes: markerTypes, questTypes: Object.fromEntries(Object.entries(questTypes).filter(([type]) => resultTypes.includes(type))),
    stepLegend: 'Quest or Revelation step',
    routeLegend: [{ className: 'story-gate', label: 'Story-gated route' }],
    legendVariants: [{ layer: 'locker-key', id: 'locker-roof', label: 'Roof key', ...roofStyle }],
    routeFilterNote: 'Check each Revelation’s steps for pictures, level, and other prerequisites.',
    collectibleHelp: [
      '<p class="atlas-layer-hint"><a href="' + guideFile + '#collectibles">Collectibles guide</a> · <a href="' + guideFile + '#locker-keys">Locker Keys</a></p>',
      '<p class="atlas-layer-hint">The <a href="' + guideFile + '#collectibles-turtle-rescue">one-time turtle rescues</a> unlock special racing turtles you can collect later at Tatsuya.</p>',
    ].join('\n'),
    config: {
      sidebarMode: 'browse',
      storageNamespace: 'kenzan-atlas', guideHref: guideFile, legacyLayerIds: ['locker-key'],
      linkedRouteType: 'Revelations', linkedRouteLabel: 'Revelation',
      keepQuestNumbers: true, keepStepLetters: true,
      typeLabels: { Commissions: 'Contracts' }, iconCredits: webIconCredits,
    },
  };
  const rootURL = 'https://kenzan-publication.invalid/';
  validatePublicationDirectory({ version: 1, assets: [...collectSceneAssets(atlasData, { baseURL: rootURL }),
    ...rendererAssetNames.map(name => ({ url: 'assets/atlas-lib/' + name, kind: 'local' }))] }, __dirname,
  { rootURL, baseURL: rootURL + encodeURI(integrated ? guide : 'Kenzan Interactive Map.html') });
  return renderMap(atlasData);
}

function atlasScript(integrated = false, { includeRuntime = true } = {}) {
  return [...(integrated ? [] : [read('src/quests/quest-story.js')]),
    ...(includeRuntime ? [atlasRuntime({ includeSidebar: false })] : []), read('src/map/kenzan-atlas-adapter.js'),
    (integrated ? 'return ' : '') + 'mountKenzanMap(viewSignal, viewState);'].join('\n');
}

if (require.main === module && process.argv.includes('--build-overview')) {
  buildAtlasOverview({ world, tiles }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else if (require.main === module) {
  copyAtlasRendererAssets(__dirname);
  const mapMarkup = readView('map').markup;
  const source = mapMarkup.match(/<script type="application\/json" id="atlas-data">([^<]+)<\/script>/);
  assert(source, 'Interactive map data missing from the side content guide');
  const { quests, objectives } = JSON.parse(source[1]);
  const storyData = mapMarkup.match(/<script type="application\/json" id="atlas-story-data">([^<]+)<\/script>/)?.[0];
  const storySelect = mapMarkup.match(/<select id="atlas-objective"[^>]*>([\s\S]*?)<\/select>/)?.[1];
  const storyOptions = storySelect?.replace(/^<option value="">All story windows<\/option>/, '');
  assert(storyData && storyOptions, 'Standalone map requires the shared story checkpoint catalogue');
  const runtimeUrl = writeExecutableAsset('assets/atlas-runtime.js', atlasRuntime({ includeSidebar: false }));
  const standaloneUrl = writeExecutableAsset('assets/atlas-standalone.js',
    `${read('src/guide/browser-storage.js')}\nmountKenzanStorageNotice();\n${atlasSidebar()}\nconst viewSignal = new AbortController().signal;\nconst viewState = {};\n${atlasScript(false, { includeRuntime: false })}`);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Like a Dragon: Kenzan! Map</title><style>${fontStyles()}\n${fontStyles({ headingsOnly: true })}\nbody{margin:0}${read('atlas/sidebar.css')}\n${atlasStyles()}\n${read('src/guide/browser-storage.css')}</style>${scriptTag(runtimeUrl)}${scriptTag(standaloneUrl)}</head><body>
<aside id="browser-storage-notice" hidden aria-label="Browser storage"><p role="status" aria-live="polite" data-storage-status></p><button type="button" data-storage-retry>Retry saving</button></aside>
${renderAtlas({ quests, objectives, storyOptions, standalone: true })}${storyData}</body></html>`;
  const mapFile = 'Kenzan Interactive Map.html';
  const output = path.join(__dirname, mapFile);
  fs.writeFileSync(output, html);
  const mapUrl = encodeURI(mapFile);
  const redirectUrl = writeExecutableAsset('assets/atlas-redirect.js',
    `location.replace(${JSON.stringify(mapUrl)} + location.search + location.hash);`);
  fs.writeFileSync(path.join(__dirname, 'Kenzan Quest Atlas.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Kenzan Interactive Map</title>
${scriptTag(redirectUrl)}
<a href="${mapUrl}">Kenzan Interactive Map</a></html>\n`);
  console.log(`Built ${output} with ${tiles.length} areas and ${quests.length} quest starts`);
}

module.exports = { atlasScript, atlasStyles, collectibleLayers, collectiblePlaces, renderAtlas, renderSidebarStart };
