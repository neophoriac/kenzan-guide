const { publicRows, stripControlPrompts } = require('../inventory/inventory-reference.cjs');
const { plainNativeText } = require('./native-text.cjs');
const { guideMapLabel } = require('../map/guide-artwork-names.cjs');

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—' };
const decode = text => String(text).replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
  if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? entity;
  const point = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
  return point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
});
const clean = text => plainNativeText(decode(text)).replace(/\s+/g, ' ').trim();
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const ignored = new Set(['script', 'style', 'svg', 'nav', 'form', 'button', 'select']);
const targetTags = new Set(['article', 'section', 'details', 'tr', 'li', 'h2', 'h3', 'h4']);

// Expand only known generated lazy envelopes for indexing. The shipped guide
// keeps its original lazy bodies; this does not add hidden markup to the page.
function expandSearchContent(html, sources) {
  let result = html.replace(/<tbody data-checklist-content="([^"]+)">([\s\S]*?)<\/tbody>/g, (original, url, rows) => {
    const content = sources.get(url);
    if (!Array.isArray(content)) return original;
    let index = 0;
    return '<tbody>' + rows.replace(/(<tr\b[^>]*>)([\s\S]*?)(<\/tr>)/g, (_, start, cells, end) => {
      const extra = (content[index++] ?? []).map(([, value]) => value).join(' ');
      return start + cells + extra + end;
    }) + '</tbody>';
  });
  for (let depth = 0; depth < 8; depth++) {
    let changed = false;
    result = result.replace(/(<details\b[^>]*\bdata-lazy-details="([^"]+)"[^>]*>)([\s\S]*?)(<\/details>)/g,
      (original, start, url, body, end) => {
        const content = sources.get(url);
        if (typeof content !== 'string') return original;
        changed = true;
        return start.replace(/\sdata-lazy-details="[^"]+"/, '') + body + content + end;
      });
    if (!changed) break;
  }
  return result;
}

function parseGuide(html) {
  const root = { tag: 'root', attrs: {}, parts: [] };
  const stack = [root];
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<\/?[a-z](?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+|</gi)) {
    const value = token[0];
    const tag = /^<(\/?)([\w-]+)/.exec(value);
    if (!tag) { if (!value.startsWith('<')) stack.at(-1).parts.push(value); continue; }
    const name = tag[2].toLowerCase();
    if (tag[1]) {
      const index = stack.findLastIndex(node => node.tag === name);
      if (index > 0) stack.length = index;
      continue;
    }
    const attrs = {};
    for (const [, key, , text] of value.matchAll(/\b([\w-]+)\s*=\s*(["'])(.*?)\2/g)) attrs[key.toLowerCase()] = decode(text);
    const node = { tag: name, attrs, parts: [], parent: stack.at(-1) };
    stack.at(-1).parts.push(node);
    if (!voidTags.has(name) && !value.endsWith('/>')) stack.push(node);
  }
  return root;
}

function target(node) {
  return targetTags.has(node.tag) && node.attrs.id && !/^(?:completion-|save-sync-|weapon-tools-|weapon-tree-(?:search|family|viewport|stage))/.test(node.attrs.id);
}
function textOf(node, ownOnly = false) {
  if (typeof node === 'string') return node;
  if (ignored.has(node.tag)) return '';
  return [node.attrs['data-guide-search-alias'] ?? '', ...node.parts.map(part => typeof part !== 'string' && ownOnly && target(part) ? '' : textOf(part, ownOnly))].join(' ');
}
function headingOf(node) {
  for (const part of node.parts) {
    if (typeof part === 'string') continue;
    if (/^h[234]$/.test(part.tag) || part.tag === 'summary' || part.tag === 'th') return clean(textOf(part));
    if (['div', 'a'].includes(part.tag)) {
      const nested = headingOf(part);
      if (nested) return nested;
    }
  }
  return /^h[234]$/.test(node.tag) ? clean(textOf(node)) : '';
}
function kindOf(id) {
  if (/^quest-\d+$/.test(id)) return 'Quest';
  if (id.startsWith('locker-key-')) return 'Locker key';
  if (id.startsWith('collectible-')) return 'Collectible';
  if (id.startsWith('revelation-')) return 'Revelation';
  if (id.startsWith('forging-')) return 'Forging material';
  if (id.startsWith('turtle-food-')) return 'Turtle food';
  if (id.startsWith('inventory-item-')) return 'Item';
  if (id.startsWith('weapon-')) return 'Weapon checklist';
  if (/^(?:scarecrow|jiraiya|training|minigame)-/.test(id)) return 'Training & minigames';
  return 'Guide';
}

function buildGuideSearchRecords(html, sources, { weapons, inventory, stats = [], recipes = [] } = {}) {
  const main = /<main\b[^>]*id="guide"[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1] ?? html;
  const tree = parseGuide(expandSearchContent(main, sources));
  const records = new Map();
  function visit(node, excluded = false) {
    if (typeof node === 'string') return;
    const hidden = excluded || ignored.has(node.tag) || node.attrs['aria-hidden'] === 'true';
    if (!hidden && target(node)) {
      const title = headingOf(node);
      const text = clean(textOf(node, true));
      const parentTitles = [];
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (target(parent)) {
          const name = headingOf(parent);
          if (name && !parentTitles.includes(name)) parentTitles.push(name);
        }
      }
      const repeatedHeading = /^h[234]$/.test(node.tag) && parentTitles[0] === title;
      if (title && text && !repeatedHeading) {
        const id = node.attrs.id;
        const key = id.startsWith('locker-key-') && /\b([A-J])[- ]?([1-5])\b/i.exec(title);
        records.set(id, { id, title: title.replace(/\s+\(\d+\)$/, ''), kind: kindOf(id),
          href: '#' + encodeURIComponent(id), text: clean([parentTitles.slice(0, 2).join(' '), text,
            key ? `${key[1]}${key[2]} ${key[1]}-${key[2]}` : ''].join(' ')) });
      }
    }
    for (const part of node.parts) visit(part, hidden);
  }
  visit(tree);
  // Weapon nodes and the inventory pager are dynamic. Their fixed reference
  // records are indexed directly, with no personal save information included.
  const statsById = new Map(stats.map(record => [record.id, record]));
  const recipeByOutput = new Map(recipes.map(record => [record.to, record]));
  const weaponById = new Map((weapons ?? []).map(record => [record.id, record]));
  for (const weapon of weapons ?? []) {
    const id = 'weapon:' + weapon.id;
    const acquisition = clean(weapon.acquisitionHtml?.replace(/<[^>]*>/g, ' ') ?? '');
    const fixed = statsById.get(weapon.id);
    const recipe = recipeByOutput.get(weapon.id);
    records.set(id, { id, title: weapon.name, kind: 'Weapon', weaponId: weapon.id,
      href: '?weapon=' + encodeURIComponent(weapon.id) + '#weapon-upgrade-trees',
      text: clean([weapon.name, weapon.group, weapon.category, weapon.description, acquisition,
        fixed && `Base Attack ${fixed.attack} Force ${fixed.force} Speed ${fixed.speed.label}`,
        recipe && `Recipe ${weaponById.get(recipe.from)?.name ?? ''} ${recipe.cost} mon ` +
          [...recipe.materials, ...recipe.books].map(item => `${item.name} × ${item.count}`).join(' '),
      ].filter(Boolean).join(' ')) });
  }
  for (const item of inventory ? publicRows(inventory) : []) {
    const id = 'inventory-item-' + item.itemId;
    records.set(id, { id, title: item.name, kind: item.tabCandidate === 'Valuables' ? 'Valuable' : 'Item',
      href: '#' + id, text: clean([item.name, item.tabCandidate, stripControlPrompts(item.description),
        ...(item.displayUses ?? []).flatMap(use => [use.label, use.detail, ...(use.targets ?? []).flatMap(target => [target.label, target.detail])]),
        ...item.displaySources.flatMap(source => [source.label, guideMapLabel(source), source.detail, ...(source.links ?? []).flatMap(target => [target.label, guideMapLabel(target)])]),
        item.relatedContext?.qualification].filter(Boolean).join(' ')) });
  }
  return [...records.values()];
}

module.exports = { buildGuideSearchRecords, expandSearchContent, parseGuide };
