const assert = require('node:assert/strict');
const foods = require('../../data/turtles/turtle-foods.json');
const materials = require('../../data/weapons/weapon-materials.json');
const acquisition = require('../../data/turtles/turtle-food-sources.json');
const { normalizeText, fold } = require('../map/guide-map-links.cjs');
const { publicRows } = require('../inventory/inventory-reference.cjs');
const inventory = publicRows(require('../../data/inventory/inventory-reference.json').items);
const weapons = require('../../data/weapons/weapon-upgrades.json').weapons;
const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const foodNameAnchor = name => 'turtle-food-name-' + fold(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const excluded = new Set(foods.displayPolicy.excludedItemIds);
const visibleFoods = foods.items.filter(item => !excluded.has(item.itemId));
const names = new Map();
const foodGroups = new Map();
for (const item of visibleFoods) {
  const key = fold(item.name);
  if (!foodGroups.has(key)) foodGroups.set(key, []);
  foodGroups.get(key).push(item);
}
function add(name, target, { replace = false } = {}) {
  const key = fold(name);
  const existing = names.get(key);
  assert(replace || !existing || existing.href === target.href, 'Conflicting item reference: ' + name);
  names.set(key, { ...target, matchedName: name });
}
const inventoryGroups = new Map();
for (const item of inventory) {
  const key = fold(item.name);
  if (!inventoryGroups.has(key)) inventoryGroups.set(key, []);
  inventoryGroups.get(key).push(item);
}
for (const items of inventoryGroups.values()) {
  const item = items[0];
  add(item.name, { href: items.length === 1 ? '#inventory-item-' + item.itemId
    : '?inventory=' + encodeURIComponent(item.name) + '#items-valuables',
  title: `View ${item.name} in Items & valuables`, name: item.name,
  ...(items.length > 1 ? { inventoryName: item.name } : {}) });
}
for (const group of foodGroups.values()) {
  const item = group[0];
  add(item.name, { href: '#' + (group.length > 1 ? foodNameAnchor(item.name) : 'turtle-food-' + item.itemId),
    title: group.length > 1 ? `View both ${item.name} entries in Turtle food` : `View ${item.name} in Turtle food`, name: item.name }, { replace: true });
}
for (const item of materials.items) add(item.name,
  { href: '#forging-' + item.id, title: `View ${item.name} in Forging materials`, name: item.name }, { replace: true });
for (const weapon of weapons) add(weapon.name, {
  href: '?weapon=' + encodeURIComponent(weapon.id) + '#weapon-upgrade-trees',
  title: `View ${weapon.name} in Weapon upgrade trees`, name: weapon.name, weaponId: weapon.id,
});
// Do not link a shorter obtainable food inside a rejected large/test item's name.
for (const item of foods.items.filter(item => excluded.has(item.itemId))) {
  if (!names.has(fold(item.name))) names.set(fold(item.name), { blocked: true });
}
// Published translation aliases identify a name, never choose between duplicate IDs.
for (const source of acquisition.reportedSources ?? []) {
  if (!source.sourceRewardName) continue;
  const candidates = visibleFoods.filter(item => source.candidateItemIds.includes(item.itemId));
  if (candidates.length && new Set(candidates.map(item => fold(item.name))).size === 1) {
    add(source.sourceRewardName, names.get(fold(candidates[0].name)));
  }
}
// Quest #30's reward is a weapon, not an ingredient named Gold.
for (const name of ['Golden Kiseru', 'Gold Kiseru', 'Solid Gold Kiseru']) add(name,
  { href: '?weapon=weori6001#weapon-upgrade-trees', title: 'View Golden Kiseru in Weapon upgrade trees',
    name: 'Golden Kiseru', weaponId: 'weori6001' });
add('Back Pain Remedy', names.get(fold('Togarashi Poultice')));

const pattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + [...names.keys()].sort((a,b) => b.length-a.length)
  .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}\\p{N}_])', 'gu');
const prose = new Set(['p', 'li', 'dd', 'td', 'th']);
const protectedTags = new Set(['a', 'button', 'label', 'summary', 'option', 'script', 'style', 'textarea', 'code', 'pre', 'svg']);
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const ambiguousSingleNames = new Set(['turtles', 'tachi', 'leftovers', 'rake', 'vase', 'paintbrush', 'inkwell', 'steel', 'orange', 'egg', 'sugar', 'snail']);

function hasItemContext(name, before, after) {
  if (!ambiguousSingleNames.has(name)) return true;
  // A species, weapon class or ordinary verb is not the same as a carried item.
  if (name === 'turtles' && !/\b(?:inventory|carried item|item named|item called)\b[^.!?]{0,60}$/.test(before)) return false;
  if (name === 'tachi' && /^\s+(?:swords?|weapons?|stance|are equipped)\b/.test(after)) return false;
  if (/\b(?:buy|purchase|bring|get|obtain|find|collect|pick up|receive|reward|ingredients?|materials?|requires?|need|give|hand|show|use|trade|eat|feed|cook|deliver|sell|gifts?|carrying|store|forge|temper|acquire|consume)\b[^.!?]{0,85}$/.test(before)) return true;
  if (/\b\d+\s*(?:×|x)?\s*$/.test(before) || /^\s*(?:×|x)\s*\d+\b/.test(after)) return true;
  return /^\s+(?:(?:can be|is|are)\s+)?(?:used|required|needed|obtained|bought|sold|given|fed|received|found|costs|restores|raises|increases|boosts|heals|fills)\b/.test(after);
}

function linkGuideItems(html) {
  const stack = [];
  return html.replace(/<!--[\s\S]*?-->|<\/?[a-z](?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+|</gi, (text, offset) => {
    const tag = /^<(\/?)([\w-]+)/.exec(text);
    if (tag) {
      const name = tag[2].toLowerCase();
      if (tag[1]) {
        const index = stack.findLastIndex(entry => entry.name === name);
        if (index >= 0) stack.length = index;
      } else if (!voidTags.has(name) && !text.endsWith('/>')) {
        const reference = /\bclass=["'][^"']*\b(?:forging-material-row|turtle-food-row|forging-native-description|weapon-native-description|inventory-native-description|restaurant-native-description|completion-native-info)\b/.test(text);
        stack.push({ name, start: offset + text.length, blocked: protectedTags.has(name) || reference });
      }
      return text;
    }
    if (text.startsWith('<') || !stack.some(entry => prose.has(entry.name)) || stack.some(entry => entry.blocked)) return text;
    const { normalized, offsets } = normalizeText(text);
    let result = '', end = 0;
    for (const match of normalized.matchAll(pattern)) {
      const target = names.get(match[0]);
      if (target.blocked) continue;
      const start = offsets[match.index], stop = offsets[match.index + match[0].length];
      const original = text.slice(start, stop);
      // Single-word common nouns such as Steel or Orange need the item's capitalization.
      if (!match[0].includes(' ') && normalizeText(original, true).normalized !== target.matchedName) continue;
      const block = stack.findLast(entry => prose.has(entry.name));
      const endTag = html.indexOf('</' + block.name, offset + stop);
      const before = normalizeText(html.slice(block.start, offset + start).replace(/<[^>]*>/g, ' ')).normalized.slice(-180);
      const after = normalizeText(html.slice(offset + stop, endTag < 0 ? offset + stop + 180 : endTag).replace(/<[^>]*>/g, ' ')).normalized.slice(0, 180);
      if (!hasItemContext(match[0], before, after)) continue;
      result += text.slice(end, start) + `<a class="guide-item-link" href="${escape(target.href)}" title="${escape(target.title)}"${target.weaponId ? ` data-weapon-tree-select="${target.weaponId}"` : ''}${target.inventoryName ? ` data-inventory-name="${escape(target.inventoryName)}"` : ''}>${original}</a>`;
      end = stop;
    }
    return result + text.slice(end);
  });
}
module.exports = { linkGuideItems, foodNameAnchor };
