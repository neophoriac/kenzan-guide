const assert = require('node:assert/strict');
const data = require('../../data/weapons/weapon-upgrades.json');
const artwork = require('../../data/weapons/weapon-artwork.json');
const weaponStats = require('../../data/weapons/weapon-stats.json');
const weaponExtra = require('../../data/weapons/weapon-extra-data.json');
const shopInventory = require('../../maps/data/atlas-shop-inventory.json');
const weaponPairs = require('../../data/weapons/weapon-pairs.json');
const forgingItems = require('../../data/weapons/weapon-materials.json').items;
const turtleFoods = require('../../data/turtles/turtle-foods.json').items;
const { renderShareDialog } = require('../../atlas/render.cjs');
const { withGuideMapURLs } = require('../guide/guide-map-urls.js');

const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = path => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;

function weaponSaveCatalogue() {
  const byId = new Map(data.weapons.map(weapon => [weapon.id, weapon]));
  // Native item.bin row count at +0x08; its source hash is in weaponExtra.sources.itemTable.
  const itemCount = 667;
  assert(data.weapons.every(weapon => weapon.itemId > 0 && weapon.itemId < itemCount));
  return {
    itemCount,
    materials: forgingItems.filter(item => item.kind === 'material').map(item => item.itemId),
    turtleFoods: turtleFoods.map(item => item.itemId),
    books: forgingItems.filter(item => item.kind === 'book').map(item => ({ itemId: item.itemId, keyItemIndex: item.itemId & 0x7fff })),
    weapons: data.weapons.map(weapon => ({ itemId: weapon.itemId, key: 'kenzan-guide:side-done:' + weapon.key })),
    recipes: data.recipes.map(recipe => ({ index: recipe.native.index,
      outputItemId: byId.get(recipe.to).itemId, key: recipe.id })),
  };
}

function buyingData(weapon, extra) {
  const sourceLines = weapon.acquisitionHtml.split(/<br\s*\/?>/i);
  const matchedLines = new Set();
  const offers = extra.shopOffers.map(offer => ({
    table: offer.table, price: offer.priceMon, conditional: Boolean(offer.unlock),
    // Keep the native stock context, including exact duplicate table rows, in data.
    unlock: offer.unlock?.scenario ?? null,
    merchants: (offer.merchants ?? []).map(merchant => {
      const shop = shopInventory[merchant.id];
      assert(shop, `Unknown weapon merchant: ${merchant.id}`);
      const sourceLine = sourceLines.find(line => /^Buy at /i.test(line.trim()) && shop.places.some(place =>
        line.includes(`data-map-place="${place.area}:${place.name}"`)));
      const mapPlace = sourceLine?.match(/data-map-place="([^"]+)"/)?.[1]
        ?? `${shop.places[0].area}:${shop.places[0].name}`;
      const access = sourceLine?.match(/ for [\d,]+ mon(?: ([^<]*?))?\.\s*(?:<a|$)/i)?.[1]?.trim() ?? '';
      if (sourceLine) matchedLines.add(sourceLine);
      const area = shop.area === 'st_gion' ? 'Gion' : shop.area === 'st_rakugaicho' ? 'Rakugai' : null;
      return { id: merchant.id, name: merchant.name, area, mapPlace, access };
    }),
  }));
  // Retain every other reviewed acquisition source and all unmatched prose.
  return { offers, otherSource: withGuideMapURLs(sourceLines.filter(line => !matchedLines.has(line)).join('<br>')) };
}

function renderWeaponTrees() {
  const images = new Map(artwork.weapons.map(item => [item.id, item]));
  const recipes = new Map(data.recipes.map(recipe => [recipe.to, recipe]));
  const statsById = new Map(weaponStats.weapons.map(weapon => [weapon.id, weapon]));
  const extraByItem = new Map(weaponExtra.weapons.map(weapon => [weapon.itemId, weapon]));
  const weapons = data.weapons.map(weapon => {
    const image = images.get(weapon.id);
    assert(image?.completion && image.src && image.name === weapon.name, `Missing weapon artwork: ${weapon.id}`);
    const recipe = recipes.get(weapon.id);
    const stats = statsById.get(weapon.id);
    const extra = extraByItem.get(weapon.itemId);
    assert(extra?.inCompletionList && extra.name === weapon.name, `Missing weapon reference data: ${weapon.id}`);
    const expectedSell = extra.sellPriceHasOverride ? extra.sellPriceMon : Math.floor(extra.basePriceMon / 2);
    assert(extra.sellPriceMon === expectedSell, `Unexpected weapon resale rule: ${weapon.id}`);
    const buying = buyingData(weapon, extra);
    assert(stats?.completion && stats.itemId === weapon.itemId && stats.name === weapon.name
      && Number.isInteger(stats.attack) && Number.isInteger(stats.force) && stats.speed.label,
    `Missing verified weapon stats: ${weapon.id}`);
    return { id: weapon.id, key: weapon.key, itemId: weapon.itemId, name: weapon.name, category: weapon.category,
      image: image.src, description: weapon.description, source: buying.otherSource, offers: buying.offers,
      selling: extra.cannotSell ? { prohibited: true } : { prohibited: false, price: extra.sellPriceMon },
      stats: { attack: stats.attack, force: stats.force, speed: stats.speed.label },
      parent: weapon.parent, children: weapon.children, root: weapon.root,
      recipe: recipe ? { id: recipe.id, kind: recipe.kind, from: recipe.from, cost: recipe.cost,
        materials: recipe.materials, books: recipe.books } : null };
  });
  const families = data.components.map(group => ({ id: group.root, name: group.name,
    category: group.category, ids: group.weaponIds }));
  assert(weapons.length === 227 && recipes.size === 175 && families.length === 52, 'Unexpected weapon tree coverage');
  const featured = families.find(group => group.name === 'Nameless Kodachi') ?? families.find(group => group.ids.length > 1);
  const featuredIds = new Set(featured.ids);
  const defaultWeapon = weapons.filter(weapon => featuredIds.has(weapon.id))
    .sort((a, b) => b.children.length - a.children.length)[0];
  assert(weaponPairs.families.length === 15 && weaponPairs.roles.first.completionWeaponIds.length === 84
    && weaponPairs.roles.second.completionWeaponIds.length === 54, 'Unexpected native pair coverage');
  const pairData = { roles: weaponPairs.roles, speedLabels: weaponPairs.speedLabels,
    families: weaponPairs.families.map(({ id, baseAttack, baseForce, speed, firstSlots, secondSlots }) =>
      ({ id, baseAttack, baseForce, speed, firstSlots, secondSlots })),
    weapons: weaponPairs.weapons.filter(weapon => weapon.completion) };
  const payload = JSON.stringify({ weapons, families, pairs: pairData, defaultId: defaultWeapon.id }).replaceAll('<', '\\u003c');
  const categories = [...new Set(families.map(group => group.category))];
  return `<div class="weapon-tools-workspace" id="weapon-tools" data-weapon-tools>
    <div class="weapon-tool-tabs" role="tablist" aria-label="Weapon tools">${[['tree', 'Upgrade trees'], ['owned', 'My weapons'], ['compare', 'Compare weapons'], ['dual', 'Dual-sword stance']].map(([id, label]) => `<button type="button" role="tab" id="weapon-tab-${id}" data-weapon-tab="${id}" aria-controls="weapon-pane-${id}" aria-selected="${id === 'tree'}" tabindex="${id === 'tree' ? 0 : -1}">${label}</button>`).join('')}</div>
    <div id="weapon-pane-tree" role="tabpanel" aria-labelledby="weapon-tab-tree" data-weapon-pane="tree">
    <section class="weapon-browser" id="weapon-upgrade-trees" aria-labelledby="weapon-tree-title">
    <div class="weapon-tree-heading"><h3 id="weapon-tree-title">Weapon upgrade trees</h3><span>17 trees · 35 standalone weapons</span></div>
    <p class="weapon-tree-intro">Choose a family or find a weapon. Follow the lines to see what it becomes, then select it for the recipe. Gold lines trace your selected weapon’s path; green checks mean you have acquired it. Pictures show base Attack, Force and Speed; special effects and paired setups can change combat results.</p>
    <div class="weapon-tree-controls">
      <div class="weapon-tree-search"><label for="weapon-tree-search">Find a weapon</label>
        <div class="weapon-search-field"><input type="search" id="weapon-tree-search" name="weapon-tree-search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" placeholder="Search all 227 weapons…" autocomplete="off" spellcheck="false" aria-controls="weapon-search-results"><button type="button" data-weapon-clear aria-label="Clear weapon search" title="Clear search" hidden>${icon('m6 6 12 12M18 6 6 18')}</button></div>
        <ul id="weapon-search-results" role="listbox" aria-label="Matching weapons" hidden></ul>
        <p class="sr-only" data-weapon-search-status role="status"></p>
      </div>
      <label class="weapon-family-field" for="weapon-family">Weapon family<select id="weapon-family" name="weapon-family">${categories.map(category => `<optgroup label="${escape(category)}">${families.filter(group => group.category === category).map(group => `<option value="${escape(group.id)}">${escape(group.name)}${group.ids.length > 1 ? ` · ${group.ids.length} weapons` : ' · standalone'}</option>`).join('')}</optgroup>`).join('')}</select></label>
    </div>
    <div class="weapon-tree-toolbar"><p data-weapon-family-summary></p><div class="weapon-tree-zoom" role="group" aria-label="Tree view">
      <button type="button" data-weapon-zoom="-1" aria-label="Zoom out weapon tree" title="Zoom out">${icon('M5 12h14')}</button><output data-weapon-zoom-level aria-label="Tree zoom">100%</output><button type="button" data-weapon-zoom="1" aria-label="Zoom in weapon tree" title="Zoom in">${icon('M5 12h14M12 5v14')}</button><button type="button" data-weapon-center aria-label="Center selected weapon" title="Center selection">${icon('M12 3v3m0 12v3M3 12h3m12 0h3M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z')}</button><button type="button" data-weapon-expand aria-label="Expand weapon tree" aria-haspopup="dialog" aria-expanded="false" aria-controls="weapon-tree-expanded" title="Expand tree">${icon('M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5')}</button>
    </div></div>
    <div class="weapon-expanded-selection"><div class="weapon-expanded-identity"><strong data-weapon-expanded-name></strong><span data-weapon-expanded-stats></span></div><div class="weapon-expanded-actions"><span class="weapon-share-slot"><button type="button" class="weapon-share-button" data-weapon-share aria-label="Copy weapon link" title="Copy weapon link">${icon('M7 10H5v10h14V10h-2M12 15V3m-4 4 4-4 4 4')}</button><span class="atlas-share-status" data-weapon-share-status role="status"></span></span><button type="button" data-weapon-details-toggle aria-expanded="false" aria-controls="weapon-tree-details">Details</button></div></div>
    <div class="weapon-tree-workspace"><div class="weapon-tree-chart">
      <div class="weapon-tree-viewport" role="region" aria-label="Weapon upgrade diagram" tabindex="0" aria-describedby="weapon-tree-hint"><div class="weapon-tree-size"><div class="weapon-tree-stage"></div></div></div>
      <p class="weapon-tree-hint" id="weapon-tree-hint">Wheel to zoom; drag to move. Shift + wheel pans. Use arrow keys between weapons.</p>
    </div><div class="weapon-tree-detail" id="weapon-tree-details" data-weapon-detail role="region" aria-labelledby="weapon-selected-title"></div></div>
    <noscript><p>The complete weapon checklist below includes every recipe and acquisition source.</p></noscript>
    <script type="application/json" data-weapon-tree-data>${payload}</script>
  </section></div>
    <section class="weapon-browser weapon-tools-panel" id="weapon-pane-owned" role="tabpanel" aria-labelledby="weapon-tab-owned" data-weapon-pane="owned" hidden></section>
    <section class="weapon-browser weapon-tools-panel" id="weapon-pane-compare" role="tabpanel" aria-labelledby="weapon-tab-compare" data-weapon-pane="compare" hidden></section>
    <section class="weapon-browser weapon-tools-panel" id="weapon-pane-dual" role="tabpanel" aria-labelledby="weapon-tab-dual" data-weapon-pane="dual" hidden><div data-weapon-dual-host></div></section>
  </div>${renderShareDialog('weapon-share')}<dialog id="weapon-tree-expanded" class="weapon-tree-dialog" aria-labelledby="weapon-tree-title"></dialog>`;
}

function withWeaponTrees(html) {
  const marker = '<details class="collectible-group" id="weapon-group-1">';
  assert(html.includes(marker), 'Missing Weapons guide');
  let linked = 0;
  const enriched = html.replace(/(<tr id="weapon-([a-z0-9]+)"><th scope="row">)([^<]+)(<\/th>)/g,
    (_, open, id, name, close) => {
      linked++;
      return `${open}<a href="?weapon=${encodeURIComponent(id)}#weapon-upgrade-trees" data-weapon-tree-select="${id}">${name}</a>${close}`;
    });
  assert.equal(linked, 227, 'Unexpected weapon checklist coverage');
  return enriched.replace(marker, renderWeaponTrees() + '\n' + marker);
}

module.exports = { withWeaponTrees, weaponSaveCatalogue };
