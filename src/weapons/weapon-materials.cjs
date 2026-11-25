const assert = require('node:assert/strict');
const data = require('../../data/weapons/weapon-materials.json');
const { withGuideMapURLs } = require('../guide/guide-map-urls.js');
const { guideMapLabel } = require('../map/guide-artwork-names.cjs');
const { formatNativeText, plainNativeText } = require('../guide/native-text.cjs');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fold = text => String(text).normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();
const icon = path => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
const sourceGroups = [
  { id: 'fixed', label: 'Fixed finds & rewards', types: ['fixed', 'reward'], path: 'm5 12 4 4L19 6' },
  { id: 'random', label: 'Random finds', types: ['random'], path: 'M5 7h3c4 0 4 10 8 10h3m-3-3 3 3-3 3M5 17h3c1.8 0 2.8-2 4-5s2.2-5 4-5h3m-3-3 3 3-3 3' },
  { id: 'shop', label: 'Shops & exchanges', types: ['shop'], path: 'M3 9h18l-2-5H5L3 9Zm1 0v11h16V9M9 20v-6h6v6M3 9c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0' },
];

function sourceLink(source) {
  const attributes = ['mapPlace', 'mapCollectible', 'mapLockerKey', 'mapQuest', 'mapArea', 'mapStreet']
    .filter(key => source[key] !== undefined)
    .map(key => `data-${key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())}="${escape(source[key])}"`);
  const href = attributes.length ? '#quest-map' : source.href;
  const areaOnly = source.mapArea !== undefined && !['mapPlace', 'mapCollectible', 'mapLockerKey', 'mapQuest', 'mapStreet'].some(key => source[key] !== undefined);
  const displayLabel = guideMapLabel(source);
  const alias = displayLabel !== source.label ? ` data-guide-search-alias="${escape(source.label)}"` : '';
  const name = escape(displayLabel) + (areaOnly ? ' <span class="forging-area-link-note">(area map)</span>' : '');
  if (!href) return `<strong>${name}</strong>`;
  assert(href.startsWith('#') || /^https:\/\//.test(href), 'Unsafe material-source URL');
  return `<a href="${escape(href)}"${attributes.length ? ' ' + attributes.join(' ') : ''}${alias}>${name}</a>`;
}

function renderSources(item) {
  return sourceGroups.map(group => {
    const rows = (item.sources ?? []).filter(source => group.types.includes(source.type));
    if (!rows.length) return '';
    return `<div class="forging-source-group"><dt>${icon(group.path)}${group.label}</dt><dd><ul>${rows.map(source =>
      `<li>${sourceLink(source)}${source.text ? `<span>${escape(source.text)}</span>` : ''}${source.note ? `<small>${escape(source.note)}</small>` : ''}${source.links?.length ? `<span class="forging-source-links">${source.links.map(sourceLink).join(' · ')}</span>` : ''}</li>`).join('')}</ul></dd></div>`;
  }).join('') || '<div class="forging-source-group"><dt>Where to find it</dt><dd>Acquisition location not yet verified.</dd></div>';
}

function renderMaterial(item) {
  assert(/^(?:item|key-item)-\d+$/.test(item.id), 'Invalid material ID');
  assert(['material', 'book'].includes(item.kind) && item.name && typeof item.description === 'string');
  assert(item.uses?.length && item.uses.every(use => use.weaponId && use.name && use.count > 0));
  assert((item.sources ?? []).every(source => sourceGroups.some(group => group.types.includes(source.type))));
  const groups = sourceGroups.filter(group => item.sources?.some(source => group.types.includes(source.type))).map(group => group.id);
  const search = fold([item.name, item.kind === 'material' ? plainNativeText(item.description) : '', ...item.uses.map(use => use.name),
    ...(item.sources ?? []).flatMap(source => [source.label, guideMapLabel(source), source.text ?? '', source.note ?? ''])].join(' '));
  return `<li class="forging-material-row" id="forging-${item.id}" data-forging-item data-item-id="${item.itemId}" data-kind="${item.kind}" data-source-types="${groups.join(' ')}" data-material-search="${escape(search)}" tabindex="-1">
    <div class="forging-material-identity"><div class="forging-material-title">${item.image?.src ? `<img src="${escape(item.image.src)}" width="${item.image.width ?? 64}" height="${item.image.height ?? 64}" alt="" loading="lazy" decoding="async">` : ''}<h4>${escape(item.name)}</h4></div>
      <p class="forging-ownership" data-forging-ownership hidden></p>
      ${item.kind === 'material' ? `<p class="forging-native-description" data-native-material-description>${formatNativeText(item.description)}</p>` : ''}
      <details class="forging-uses"><summary>Used in ${item.uses.length} weapon recipe${item.uses.length === 1 ? '' : 's'}</summary><ul>${item.uses.map(use => `<li><a href="?weapon=${encodeURIComponent(use.weaponId)}#weapon-upgrade-trees" data-weapon-tree-select="${escape(use.weaponId)}">${escape(use.name)}</a>${item.kind === 'material' ? `<span>× ${use.count}</span>` : ''}</li>`).join('')}</ul></details>
    </div><dl class="forging-material-sources" aria-label="Where to find ${escape(item.name)}">${renderSources(item)}</dl>
  </li>`;
}

function renderWeaponMaterials() {
  const items = [...data.items].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
  const materials = items.filter(item => item.kind === 'material').length;
  const books = items.filter(item => item.kind === 'book').length;
  assert(materials === 45 && books === 21 && new Set(items.map(item => item.id)).size === items.length,
    'Unexpected forging ingredient coverage');
  return withGuideMapURLs(`<details class="weapon-materials forging-catalog" id="weapon-materials" data-weapon-materials aria-labelledby="weapon-materials-title">
    <summary class="forging-heading"><h3 id="weapon-materials-title">Forging materials</h3><small>${materials} materials · ${books} required books</small></summary>
    <div class="forging-catalog-body">
    <p class="forging-intro">Find the ingredients for a weapon, check where to get them, then follow the recipe back to its upgrade tree. Materials are used up when forging; required books are kept.</p>
    <p class="forging-save-note" data-forging-save-note><a href="#save-sync">Sync or import your save</a> to see what you own, on you and in storage.</p>
    <form class="forging-filters" role="search" aria-label="Find forging materials" data-forging-filters hidden>
      <label class="forging-search">Find a material or place<input type="search" name="forging-search" autocomplete="off" spellcheck="false" placeholder="Steel, a place, or a weapon…" data-forging-search aria-controls="forging-material-list"></label>
      <label>Show<select name="forging-kind" data-forging-kind aria-controls="forging-material-list"><option value="material">Materials (${materials})</option><option value="book">Required books (${books})</option><option value="all">Materials & books</option></select></label>
      <label>Source<select name="forging-source" data-forging-source aria-controls="forging-material-list"><option value="all">Any source</option>${sourceGroups.map(group => `<option value="${group.id}">${group.label}</option>`).join('')}</select></label>
    </form>
    <div class="forging-list-status"><p data-forging-count role="status" aria-live="polite"></p><div class="forging-list-actions"><label class="forging-owned-toggle"><input type="checkbox" data-forging-owned-only aria-controls="forging-material-list">Owned only</label><button type="button" class="forging-reset" data-forging-reset hidden>Clear filters</button></div></div>
    <p class="forging-empty" data-forging-empty hidden>No matching ingredients. Try another name or choose a different source.</p>
    <ul class="forging-material-list" id="forging-material-list">${items.map(renderMaterial).join('\n')}</ul>
    <p class="forging-reference-note">Material descriptions come from the English-patched game. Random finds are possible results, not guaranteed drops. Source conditions apply to the location beside them.</p>
    </div>
  </details>`);
}

function withWeaponMaterials(html) {
  const marker = '<details class="collectible-group" id="weapon-group-1">';
  assert(html.includes(marker), 'Missing Weapons material-list insertion point');
  return html.replace(marker, renderWeaponMaterials() + '\n' + marker);
}
module.exports = { renderWeaponMaterials, withWeaponMaterials };
