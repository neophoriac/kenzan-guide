const assert = require('node:assert/strict');
const streets = require('../../maps/data/atlas-streets.json');
const districts = require('../../maps/data/atlas-districts.json');
const { kenzanMapHref } = require('../guide/guide-map-urls.js');
const { guideArtworkAliases, guideArtworkLabel } = require('./guide-artwork-names.cjs');

const venueTypes = new Set(['building', 'landmark', 'save', 'palanquin', 'revelation']);
const ambiguousNames = new Set([
  'arms dealer', 'blacksmith', 'gambling den', 'information booth', 'mahjong parlor',
  'old man\'s house', 'outdoor mahjong', 'outdoor shogi', 'rakugai shopping district',
  'temple gate', 'the well', 'theatre', 'turtle seller', 'waterfall',
]);
const genericQuestTitles = new Set(['A Cry for Help', 'Debt Collection', 'Exorcism', 'Food Delivery',
  'Gift Delivery', 'Talent', 'The Baby', 'The Oracle', 'The Woman']);
const prose = new Set(['p', 'li', 'dd', 'td', 'th']);
const protectedTags = new Set(['a', 'button', 'label', 'option', 'script', 'select', 'style', 'summary',
  'svg', 'template', 'textarea', 'code', 'pre']);
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const nativeContent = /\b(?:inventory-native-description|forging-native-description|weapon-native-description|restaurant-order-description|completion-native-info|yujo-prompt|yujo-leadin|yujo-answers)\b/;
const entities = { amp: '&', apos: "'", lsquo: '‘', rsquo: '’', quot: '"', nbsp: ' ', ndash: '–', mdash: '—' };

function fold(text, keepCase = false) {
  const normalized = text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'");
  return keepCase ? normalized : normalized.toLowerCase();
}

function escape(text) {
  return text.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
}

function decodeCharacter(char) {
  if (!char.startsWith('&') || !char.endsWith(';')) return char;
  const code = char.slice(1, -1);
  if (!code.startsWith('#')) return entities[code] ?? char;
  const hex = code[1]?.toLowerCase() === 'x';
  const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
  return Number.isInteger(point) && point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : char;
}

function normalizeText(text, keepCase = false) {
  let normalized = '';
  const offsets = [0];
  for (const match of text.matchAll(/&(?:#\d+|#x[\da-f]+|[a-z]+);|\P{M}\p{M}*|\p{M}+/giu)) {
    const segment = fold(decodeCharacter(match[0]), keepCase);
    normalized += segment;
    for (let i = 0; i < segment.length; i++) offsets.push(match.index + match[0].length);
  }
  return { normalized, offsets };
}

function isPickupInstruction(before) {
  const action = /\b(?:pick(?:ing)? up|collect(?:ing)?|find(?:ing)?|recover(?:ing)?|take|retrieve|grab|claim)\b[^.!?;]{0,72}$/i.exec(before);
  return Boolean(action && !/\b(?:buy|purchase|sell|forge|temper|equip|trade|use)\b/i.test(action[0]));
}

function createGuideMapLinker(mapMarkup) {
  const data = mapMarkup.match(/<script type="application\/json" id="atlas-data">([^<]+)<\/script>/)?.[1];
  assert(data, 'Missing atlas data for guide map links');
  const { tiles, places, quests } = JSON.parse(data);
  const areaLabels = new Map(tiles.map(({ id, label }) => [id, label]));
  const names = new Map();
  const targets = new Map();

  function add(name, kind, key, priority, { label = name, pickupOnly = false, exactTitle = false, displayLabel = false } = {}) {
    const alias = fold(name);
    const target = { kind, key, label, pickupOnly, exactTitle, displayLabel };
    targets.set(kind + ':' + key, target);
    const existing = names.get(alias);
    if (!existing || existing.priority < priority) names.set(alias, { priority, target });
    else if (existing.priority === priority && existing.target?.key !== key) names.set(alias, { priority, target: null });
  }

  for (const { id, label } of tiles) {
    if (!ambiguousNames.has(fold(label))) add(label, 'area', id, 1);
  }
  for (const { name, layer } of districts) add(name, 'area', layer, 2);
  for (const { name, area } of streets) {
    assert(areaLabels.has(area), 'Unknown map area for street ' + name);
    add(name, 'street', area + ':' + name, 2);
  }
  for (const { type, name, area, id, linkId, entries, routes } of places) {
    const door = /^(.*?) · (North|South) door$/.exec(name);
    if (venueTypes.has(type) || door || name === 'Chapter 7 · Enter Tsuruya') {
      const key = linkId ?? id ?? area + ':' + name;
      if (!ambiguousNames.has(fold(name))) add(name, 'place', key, 3);
      const areaLabel = areaLabels.get(area);
      if (!fold(name).startsWith(fold(areaLabel) + ' ')) {
        for (const variant of [areaLabel + ' ' + name, areaLabel + "'s " + name, name + ' in ' + areaLabel]) {
          add(variant, 'place', key, 3, { label: name });
        }
      }
      if (door) {
        const [, venue, side] = door;
        for (const variant of [venue + "'s " + side + ' door', side + ' door of ' + venue, areaLabel + ' ' + venue + ' ' + side + ' door']) {
          add(variant, 'place', key, 4, { label: name });
        }
      }
    }
    if (type === 'locker-key') add(name, 'locker-key', id, 4);
    for (const entry of entries ?? []) {
      add(entry.name, 'collectible', id + ':' + entry.progressId, 2, {
        pickupOnly: type !== 'turtle-rescue' && type !== 'wild-turtle',
      });
    }
    for (const route of routes ?? []) add(route.name, 'revelation', route.id, 1, { exactTitle: true });
  }
  for (const { name, id } of quests) {
    if (!genericQuestTitles.has(name) && name.includes(' ')) add(name, 'quest', String(id), 1, { exactTitle: true });
  }

  // A reviewed old sheet heading identifies the same artwork ID. Unqualified
  // dojo/temple names still need context: never guess between their sheets.
  for (const { area, name, label } of guideArtworkAliases()) {
    if (!areaLabels.has(area) || name === 'Yoshioka Dojo' || ambiguousNames.has(fold(name))) continue;
    add(name, 'area', area, 4, { label, displayLabel: true });
  }

  const aliases = [
    ['Whitesnake Udon', 'place', 'st_rakugaicho:Shirohebi Udon'],
    ['Rakugai weapon shop', 'place', 'st_rakugaicho:Arms Dealer'],
    ['turtle vendor', 'place', 'st_rakugaicho:Turtle Seller'],
    ['turtle seller', 'place', 'st_rakugaicho:Turtle Seller'],
    ['wanted board', 'place', 'st_rakugaicho:Police Box and Wanted Board'],
    ['wanted poster', 'place', 'st_rakugaicho:Police Box and Wanted Board'],
    ['Rakugai police box', 'place', 'st_rakugaicho:Police Box and Wanted Board'],
    ['Tsuruya back entrance', 'place', 'st_gion:Tsuruya Backyard'],
    ["Tsuruya's back entrance", 'place', 'st_gion:Tsuruya Backyard'],
    ["Tsuruya's back door", 'place', 'st_gion:Chapter 7 · Enter Tsuruya'],
    ["Tsuruya's rear courtyard", 'place', 'st_gion:Tsuruya Backyard'],
    ['horse archery stable', 'place', 'st_kaido_rindo:Horse Archery Grounds'],
    ['Forest Path stable', 'place', 'st_kaido_rindo:Horse Archery Grounds'],
    ["Koetsu's basement", 'area', 'st_koetsu_chika'],
    ["Shishido's cave", 'area', 'st_dokutsu_01'],
    ['Kiyomizudera', 'area', 'st_kiyomizu_jnt'],
    ['Kiyomizudera grounds', 'area', 'st_kiyomizu'],
    ['Sanjusangendo', 'area', 'st_sanjusangen_jnt'],
    ['Tsuruya 1F', 'area', 'st_tsuruya_1f'],
    ['Tsuruya 2F', 'area', 'st_tsuruya_2f'],
    ['Tsuruya 3F', 'area', 'st_tsuruya_3f'],
    ['Tsuruya 4F', 'area', 'st_tsuruya_4f'],
    ['Tsurumachi Street', 'street', 'st_gion:Tsurumachi Alley'],
    ['Enkiridera', 'place', 'st_rakugaicho:Enkiridera (Divorce Temple)'],
    ['Divorce Temple', 'place', 'st_rakugaicho:Enkiridera (Divorce Temple)'],
  ];
  for (const [name, kind, key] of aliases) {
    const target = targets.get(kind + ':' + key);
    assert(target, 'Unknown atlas link for ' + name);
    add(name, kind, key, 4, { label: target.label, displayLabel: kind === 'area' || name === 'Whitesnake Udon' });
  }

  const alternatives = [...names.keys()].sort((a, b) => b.length - a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const namedPlace = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + alternatives + ')(?![\\p{L}\\p{N}_])', 'gu');

  function anchor(text, { key, kind, label, displayLabel }) {
    const field = 'map-' + kind;
    const data = { [field.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]: key };
    const alias = displayLabel && normalizeText(text).normalized !== fold(label)
      ? ` data-guide-search-alias="${escape(text.replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/giu, decodeCharacter))}"` : '';
    return `<a class="guide-map-link" href="${escape(kenzanMapHref(data))}" data-map-${kind}="${escape(key)}" title="Show ${escape(label)} on map"${alias}>${displayLabel ? escape(label) : text}</a>`;
  }

  return function linkGuideMapText(html) {
    const stack = [];
    let before = '';
    // Host-authored area links may already exist before automatic linking.
    // Update only their leading controlled label; preserve nested notes/actions.
    const controlled = html.replace(/(<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>)([^<]*)([\s\S]*?<\/a>)/gi, (whole, open, text, rest) => {
      const area = /\bdata-map-area=(["'])(.*?)\1/i.exec(open)?.[2];
      if (!area) return whole;
      const original = text.trim().replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/giu, decodeCharacter);
      const label = guideArtworkLabel(area, original);
      if (label === original) return whole;
      const alias = /\bdata-guide-search-alias=/.test(open) ? '' : ` data-guide-search-alias="${escape(original)}"`;
      return open.replace(/>$/, alias + '>') + text.replace(text.trim(), escape(label)) + rest;
    });
    const headings = controlled.replace(/(<(h[2-5])\b[^>]*>)([^<>]+)(<\/\2>)/gi, (whole, open, tag, text, close) => {
      const { target } = names.get(normalizeText(text).normalized.trim()) ?? {};
      return target && ['area', 'street', 'place'].includes(target.kind) ? open + anchor(text, target) + close : whole;
    });
    return headings.replace(/<!--[\s\S]*?-->|<\/?[a-z](?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+|</gi, text => {
      const tag = /^<(\/?)([\w-]+)/.exec(text);
      if (tag) {
        const name = tag[2].toLowerCase();
        if (prose.has(name) || name === 'br') before = '';
        if (tag[1]) {
          const index = stack.findLastIndex(entry => entry.name === name);
          if (index >= 0) stack.length = index;
        } else if (!voidTags.has(name) && !text.endsWith('/>')) {
          stack.push({ name, blocked: protectedTags.has(name) || nativeContent.test(text) });
        }
        return text;
      }
      if (text.startsWith('<') || !stack.some(entry => prose.has(entry.name)) || stack.some(entry => entry.blocked)) {
        return text;
      }
      const { normalized, offsets } = normalizeText(text);
      let output = '';
      let end = 0;
      for (const { 0: name, index } of normalized.matchAll(namedPlace)) {
        const { target } = names.get(name);
        if (!target || (target.pickupOnly && !isPickupInstruction(before + normalized.slice(0, index)))) continue;
        const start = offsets[index];
        const stop = offsets[index + name.length];
        const original = text.slice(start, stop);
        if (target.exactTitle && normalizeText(original, true).normalized !== fold(target.label, true)) continue;
        output += text.slice(end, start);
        end = stop;
        output += anchor(original, target);
      }
      before = (before + normalized).slice(-100);
      return output + text.slice(end);
    });
  };
}

module.exports = { createGuideMapLinker, normalizeText, fold };
