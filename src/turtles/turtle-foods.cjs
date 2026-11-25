const assert = require('node:assert/strict');
const data = require('../../data/turtles/turtle-foods.json');
const acquisition = require('../../data/turtles/turtle-food-sources.json');
const { foodNameAnchor } = require('../guide/guide-item-links.cjs');
const { withGuideMapURLs } = require('../guide/guide-map-urls.js');
const { guideMapLabel } = require('../map/guide-artwork-names.cjs');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fold = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();
const stats = { fullness: 'Fullness', stamina: 'Stamina', legPower: 'Leg Power', water: 'Water', sand: 'Sand', mud: 'Mud' };
const number = value => value > 0 ? `+${value}` : String(value).replace('-', '−');
const points = value => `<span${value ? ` class="turtle-food-${value > 0 ? 'gain' : 'loss'}"` : ''}>${number(value)}</span>`;
const byItem = new Map(acquisition.items.map(item => [item.itemId, item]));
const sourceGroups = [
  { id: 'fixed', label: 'Fixed finds & rewards', types: ['fixed', 'reward'], path: 'm5 12 4 4L19 6' },
  { id: 'random', label: 'Random finds', types: ['random'], path: 'M5 7h3c4 0 4 10 8 10h3m-3-3 3 3-3 3M5 17h3c1.8 0 2.8-2 4-5s2.2-5 4-5h3m-3-3 3 3-3 3' },
  { id: 'shop', label: 'Shops & exchanges', types: ['shop'], path: 'M3 9h18l-2-5H5L3 9Zm1 0v11h16V9M9 20v-6h6v6M3 9c0 3 4 3 4 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 4 3 4 0' },
  { id: 'reported', label: 'Reported rewards', types: ['reported'], path: 'M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
];
const icon = path => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;

function sourceLink(source) {
  const fields = ['mapPlace', 'mapCollectible', 'mapLockerKey', 'mapQuest', 'mapStep', 'mapArea', 'mapStreet'];
  const attributes = fields.filter(key => source[key] !== undefined).map(key =>
    `data-${key.replace(/[A-Z]/g, char => '-' + char.toLowerCase())}="${escape(source[key])}"`);
  const href = attributes.length ? '#quest-map' : source.href;
  const areaOnly = source.mapArea !== undefined && !['mapPlace', 'mapCollectible', 'mapLockerKey', 'mapQuest', 'mapStreet'].some(key => source[key] !== undefined);
  const displayLabel = guideMapLabel(source);
  const alias = displayLabel !== source.label ? ` data-guide-search-alias="${escape(source.label)}"` : '';
  const label = escape(displayLabel) + (areaOnly ? ' <span class="forging-area-link-note">(area map)</span>' : '');
  if (!href) return `<strong>${label}</strong>`;
  assert(href.startsWith('#') || /^https:\/\//.test(href), 'Unsafe food-source URL');
  return `<a href="${escape(href)}"${attributes.length ? ' ' + attributes.join(' ') : ''}${source.sourceId ? ` data-food-source-route="${escape(source.sourceId)}"` : ''}${alias}>${label}</a>`;
}

function compactSources(sources) {
  const rows = [];
  const encounters = sources.filter(source => source.native?.file === 'scenario/random_battle.bin');
  for (const source of sources) {
    if (!encounters.includes(source)) { rows.push(source); continue; }
    if (source !== encounters[0]) continue;
    assert(encounters.every(other => other.text === source.text && other.note === source.note
      && JSON.stringify(other.native.levelTiers) === JSON.stringify(source.native.levelTiers)), 'Encounter grouping changed producer conditions');
    rows.push({ ...source, label: 'Ordinary encounters', mapArea: undefined, area: undefined,
      links: encounters.map(other => ({ label: other.label.replace(/ · ordinary encounters$/, ''), mapArea: other.mapArea, sourceId: other.sourceId })) });
  }
  return rows;
}

function renderSources(item) {
  const record = byItem.get(item.itemId);
  assert(record && Array.isArray(record.sources), 'Missing food-source coverage record');
  const reported = (acquisition.reportedSources ?? []).filter(source => source.candidateItemIds.includes(item.itemId));
  const sources = [...record.sources, ...reported];
  if (!sources.length) return `<p class="turtle-food-note turtle-food-source-gap" data-food-source-gap>${escape(record.sourceNote)}</p>`;
  const count = reported.length ? `${record.sources.length} verified · ${reported.length} reported` : `${sources.length} source${sources.length === 1 ? '' : 's'}`;
  return `${record.sourceNote ? `<p class="turtle-food-note turtle-food-source-gap" data-food-source-gap>${escape(record.sourceNote)}</p>` : ''}<details class="forging-uses turtle-food-sources"><summary>Where to find it <span>${count}</span></summary><dl class="forging-material-sources">${sourceGroups.map(group => {
    const rows = compactSources(sources.filter(source => group.types.includes(source.type)));
    return rows.length ? `<div class="forging-source-group" data-food-source-group="${group.id}"><dt>${icon(group.path)}${group.label}</dt><dd><ul>${rows.map(source => `<li data-food-source-entry="${escape(source.sourceId)}">${sourceLink(source)}${source.text ? `<span>${escape(source.text)}</span>` : ''}${source.note ? `<small>${escape(source.note)}</small>` : ''}${source.links?.length ? `<span class="forging-source-links">${source.links.map(sourceLink).join(' · ')}</span>` : ''}</li>`).join('')}</ul></dd></div>` : '';
  }).join('')}</dl></details>`;
}

function renderFood(item, duplicates, nameTarget) {
  const effects = new Map(item.effects.map(effect => [effect.stat, { ...effect }]));
  const fullness = effects.get('fullness') ?? { stat: 'fullness', current: 0, cap: 0 };
  fullness.current = item.fullnessBase;
  effects.set('fullness', fullness);
  const changes = Object.keys(stats).filter(stat => effects.get(stat)?.current || effects.get(stat)?.cap);
  const sourceRecord = byItem.get(item.itemId);
  assert(sourceRecord);
  const displaySources = [...sourceRecord.sources, ...(acquisition.reportedSources ?? []).filter(source => source.candidateItemIds.includes(item.itemId))];
  const groups = sourceGroups.filter(group => displaySources.some(source => group.types.includes(source.type))).map(group => group.id);
  const search = fold([item.name, ...changes.map(stat => stats[stat]), ...(item.notes ?? []),
    ...displaySources.flatMap(source => [source.label, guideMapLabel(source), source.text ?? '', source.note ?? '', ...(source.links ?? []).flatMap(link => [link.label, guideMapLabel(link)])])].join(' '));
  assert(item.itemId > 0 && item.image?.src && item.name && item.effects.every(effect => effect.stat in stats));
  return `<li class="forging-material-row turtle-food-row" id="turtle-food-${item.itemId}" data-food-item data-item-id="${item.itemId}" data-food-name="${escape(item.name)}" data-food-stats="${changes.join(' ')}" data-food-source-types="${groups.join(' ')}" data-food-search="${escape(search)}" tabindex="-1">
    <div class="forging-material-identity"><div class="forging-material-title"><img src="${escape(item.image.src)}" width="${item.image.width}" height="${item.image.height}" alt="" loading="lazy" decoding="async"><h4${nameTarget ? ` id="${escape(nameTarget)}"` : ''}>${escape(item.name)}</h4></div>
      <p class="forging-ownership" data-food-ownership hidden></p>
      ${duplicates.has(item.name) ? '<p class="turtle-food-note">Separate inventory items share this name. Counts and sources are shown separately.</p>' : ''}
      ${renderSources(item)}
    </div><div class="turtle-food-effects">${changes.length ? `<table role="table"><caption>Base feeding effects</caption><thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Stat</th><th scope="col" role="columnheader">Now</th><th scope="col" role="columnheader">Growth limit</th></tr></thead><tbody role="rowgroup">${changes.map(stat => {
      const effect = effects.get(stat);
      return `<tr role="row" data-food-stat="${stat}"><th scope="row" role="rowheader">${stats[stat]}</th><td role="cell"><span class="turtle-food-value-label" aria-hidden="true">Now</span>${points(effect.current)}</td><td role="cell"><span class="turtle-food-value-label" aria-hidden="true">Growth limit</span>${points(effect.cap)}</td></tr>`;
    }).join('')}</tbody></table>` : '<p class="turtle-food-no-gain">No direct stat gain</p>'}
      ${(item.notes ?? []).map(note => `<p class="turtle-food-note">${escape(note)}</p>`).join('')}
    </div>
  </li>`;
}

function renderTurtleFoods() {
  const excluded = new Set(data.displayPolicy.excludedItemIds);
  const items = data.items.filter(item => !excluded.has(item.itemId))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }) || a.itemId - b.itemId);
  assert(items.length === data.displayPolicy.displayedItemCount && new Set(items.map(item => item.itemId)).size === items.length,
    'Unexpected displayed food coverage');
  const duplicates = new Set(items.filter((item, index) => items.findIndex(other => other.name === item.name) !== index).map(item => item.name));
  const firstByName = new Map(items.map(item => [item.name, items.find(other => other.name === item.name).itemId]));
  return withGuideMapURLs(`<details class="weapon-materials turtle-foods" id="turtle-foods" data-turtle-foods>
    <summary><span>Turtle food</span><small>${items.length} feeding items</small></summary>
    <div class="turtle-food-body">
      <p class="forging-intro">Pick food for the stat you want to improve. This list covers carried foods with verified sources, including medicines and seasonings. Some items lower stats, and a few give no direct stat gain.</p>
      <p class="turtle-food-key"><strong>Now</strong> shows the change to the current stat. <strong>Growth limit</strong> shows how much its trained limit changes. The values are base points, not percentages. A 0 means no change.</p>
      <p class="turtle-food-care">Feeding moves Form one step through its cycle, which can make it better or worse. It also uses <strong>1 lifespan unit</strong>, unless your turtle is Eternal. A full turtle cannot eat anything, even a Hunger Pill.</p>
      <details class="turtle-food-rules"><summary>How age, trust and limits affect feeding</summary>
        <p>Fullness changes first, up to your turtle’s current Fullness limit. Age and trust do not change this amount. The game scales other current-stat changes and all growth-limit changes by age and trust, then rounds them towards zero. A gain or loss can be smaller or larger than the base value, or zero.</p>
        <p>Growth-limit gains stop at your turtle’s own ceiling, and current stats stop at their trained limit. Water, Sand and Mud are terrain aptitude points. You can see how much room your turtle has left to improve under Growth in <a href="#my-turtles">My turtles</a>.</p>
        <p>Feeding costs up to 8 trust when the actual stat and growth-limit changes add up to a negative amount. The initial Fullness change is left out of this calculation. If the total is zero or positive and you have an active post-race feeding bonus, feeding gives up to 16 trust and uses up the bonus.</p>
        <p>Eternal Turtle Candy does not make a turtle Eternal. Where to find it lists fixed finds, rewards, possible random finds, shops and exchanges. Each source keeps its own story windows and conditions; random finds are not guaranteed drops. Reported rewards are listed separately because their native awards still need confirmation.</p>
      </details>
      <p class="forging-save-note" data-food-save-note><a href="#save-sync">Sync or import your save</a> to see how much food you have on you and in storage.</p>
      <form class="forging-filters turtle-food-filters" role="search" aria-label="Find turtle food" data-food-filters hidden>
        <label class="forging-search">Find food, a stat or a place<input type="search" autocomplete="off" spellcheck="false" placeholder="Snail, Leg Power, Tsuruya…" data-food-search aria-controls="turtle-food-list"></label>
        <label>Affects<select data-food-effect aria-controls="turtle-food-list"><option value="all">Any stat</option>${Object.entries(stats).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}<option value="none">No direct stat gain</option></select></label>
        <label>Source<select data-food-source aria-controls="turtle-food-list"><option value="all">Any source</option>${sourceGroups.map(group => `<option value="${group.id}">${group.label}</option>`).join('')}</select></label>
      </form>
      <div class="forging-list-status"><p data-food-count role="status" aria-live="polite"></p><div class="forging-list-actions"><label class="forging-owned-toggle"><input type="checkbox" data-food-owned-only aria-controls="turtle-food-list">Owned only</label><button type="button" class="forging-reset" data-food-reset hidden>Clear filters</button></div></div>
      <p class="forging-empty" data-food-empty hidden></p>
      <ul class="forging-material-list" id="turtle-food-list">${items.map(item => renderFood(item, duplicates,
        duplicates.has(item.name) && firstByName.get(item.name) === item.itemId ? foodNameAnchor(item.name) : undefined)).join('\n')}</ul>
      <p class="forging-reference-note">The feeding effects come from the English-patched game’s item table and feeding code. Acquisition routes retain their source-specific conditions and any unresolved details. Your ownership counts come from the last save you synced or imported.</p>
    </div>
  </details>`);
}

function withTurtleFoods(html) {
  const marker = '<h4 id="turtle-deaths">';
  assert(html.includes(marker), 'Missing turtle-food insertion point');
  return html.replace(marker, renderTurtleFoods() + '\n    ' + marker);
}
module.exports = { withTurtleFoods, renderTurtleFoods };
