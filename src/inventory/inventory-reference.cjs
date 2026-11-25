const assert = require('node:assert/strict');
const { withGuideMapURLs } = require('../guide/guide-map-urls.js');
const contextData = require('../../data/inventory/inventory-context.json');
const { formatNativeText, plainNativeText } = require('../guide/native-text.cjs');
const { guideMapLabel } = require('../map/guide-artwork-names.cjs');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fold = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();
const sourceGroups = [['shop', 'Shops & exchanges'], ['fixed', 'Fixed finds & rewards'], ['random', 'Random finds']];
const mapFields = ['mapQuest', 'mapStep', 'mapRevelation', 'mapPlace', 'mapCollectible', 'mapLockerKey', 'mapArea', 'mapStreet'];

function stripControlPrompts(text) {
  const original = String(text ?? '');
  const cleaned = original
    .replace(/\s*\(\s*(?:press|hold|tap|click|push)\b[^)]*\)/gi, '')
    .replace(/(?:^|\n)[ \t]*(?:press|hold|tap|click|push)\b[^\n]*<Sign:[^>]+>[^\n]*/gi, '');
  return cleaned === original ? original : cleaned.trim();
}

function link(target, label = target.label) {
  const displayLabel = guideMapLabel(target, label);
  const alias = displayLabel !== label ? ` data-guide-search-alias="${escape(label)}"` : '';
  const fields = mapFields.filter(key => target.mapData?.[key] !== undefined);
  const href = target.href || (fields.length ? '#quest-map' : '');
  if (!href) return `<strong${alias}>${escape(displayLabel)}</strong>`;
  assert(href.startsWith('#') || /^\?(?:weapon|weapon-tool)=/.test(href) || /^https:\/\//.test(href), 'Unsafe inventory destination: ' + href);
  const mapAttributes = href === '#quest-map' ? fields.map(key =>
    `data-${key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())}="${escape(target.mapData[key])}"`).join(' ') : '';
  return `<a${href.startsWith('#quest-map') ? ' class="guide-map-link"' : ''} href="${escape(href)}"${mapAttributes ? ' ' + mapAttributes : ''}${alias}>${escape(displayLabel)}</a>`;
}

function renderUse(use, index, itemId) {
  const targets = use.targets ?? [];
  const countLabel = use.kind === 'Gifts' ? (targets.length === 1 ? 'reaction' : 'reactions') : (targets.length === 1 ? 'recipe' : 'recipes');
  return `<li class="inventory-use">${link(use)}${use.detail ? `<p>${escape(use.detail)}</p>` : ''}${targets.length ? `<details data-inventory-panel="${itemId}-use-${index}"><summary>${targets.length} ${countLabel}</summary><ul class="inventory-use-targets">${targets.map(target => `<li>${link(target)}${target.detail ? `<span>${escape(target.detail)}</span>` : ''}</li>`).join('')}</ul></details>` : ''}</li>`;
}

function sourceRow(source) {
  const money = source.priceMon !== undefined ? `${Number(source.priceMon).toLocaleString('en')} mon`
    : source.price !== undefined && source.currency ? `${Number(source.price).toLocaleString('en')} ${source.currency}` : '';
  const facts = [money, source.quantity !== undefined && source.quantity !== 1 ? `× ${source.quantity}` : '',
    source.chancePercent !== undefined ? `${source.chancePercent}% chance` : ''].filter(Boolean);
  const links = (source.links ?? []).filter(target => !/^\s*find key\b/i.test(target.label));
  return `<li>${link(source)}${facts.length ? `<span class="inventory-price">${facts.map(escape).join(' · ')}</span>` : ''}${source.detail ? `<p>${escape(source.detail)}</p>` : ''}${links.length ? `<div class="inventory-source-links">${links.map(target => link(target)).join(' · ')}</div>` : ''}</li>`;
}

function renderSources(item) {
  if (!item.displaySources.length) {
    const context = item.relatedContext;
    return `${context ? `<div class="inventory-related-context"><h4>${escape(context.heading)}</h4><p>${link(context.lead)}</p>${context.detail ? `<p>${escape(context.detail)}</p>` : ''}${context.links?.length ? `<p class="inventory-source-links">${context.links.map(target => link(target)).join(' · ')}</p>` : ''}</div>` : ''}<p class="inventory-unverified">${escape(context?.qualification || item.availabilityNote || 'No normal carried source has been verified. This does not establish that this entry is unused.')}</p>${item.knownVariants?.length ? `<p class="inventory-identity-note">Separate ${item.knownVariants.length === 1 ? 'entry' : 'entries'} with the same name and a verified source: ${item.knownVariants.map(target => link(target)).join(' · ')}.</p>` : ''}`;
  }
  return sourceGroups.map(([kind, title]) => {
    const rows = item.displaySources.filter(source => (source.type === 'reward' ? 'fixed' : source.type) === kind);
    if (!rows.length) return '';
    return `<div class="inventory-source-group"><h4>${title}</h4><ul class="inventory-sources">${rows.slice(0, 2).map(sourceRow).join('')}</ul>${rows.length > 2 ? `<details data-inventory-panel="${item.itemId}-sources-${kind}"><summary>${rows.length - 2} more ${rows.length === 3 ? 'source' : 'sources'}</summary><ul class="inventory-sources">${rows.slice(2).map(sourceRow).join('')}</ul></details>` : ''}</div>`;
  }).join('');
}

function publicRows(items) {
  assert(contextData.schemaVersion === 1 && new Set(contextData.items.map(item => item.itemId)).size === contextData.items.length, 'Invalid inventory context index');
  const contexts = new Map(contextData.items.map(context => [context.itemId, context]));
  for (const context of contextData.items) {
    const item = items.find(item => item.itemId === context.itemId);
    assert(item && !item.displaySources.length && context.heading && context.lead?.label && context.qualification, 'Context must qualify an unverified inventory entry');
  }
  const omitted = contextData.omittedDuplicates ?? [];
  const hiddenIds = new Set(omitted.map(item => item.itemId));
  assert(hiddenIds.size === omitted.length, 'Duplicate inventory omission');
  for (const duplicate of omitted) {
    const item = items.find(item => item.itemId === duplicate.itemId);
    assert(item && !item.displaySources.length && duplicate.replacementItemIds?.length, 'Only unverified duplicates may be omitted');
    for (const id of duplicate.replacementItemIds) {
      const replacement = items.find(item => item.itemId === id);
      assert(replacement?.displaySources.length && !hiddenIds.has(id), 'An omitted entry needs an existing verified inventory replacement');
    }
  }
  const result = items.filter(item => !hiddenIds.has(item.itemId)).map(item => {
    // Navigation redirects do not merge native identities, uses or sources.
    const redirected = omitted.filter(duplicate => duplicate.replacementItemIds[0] === item.itemId);
    return { ...item, nativeItemIds: [item.itemId], relatedContext: contexts.get(item.itemId),
      redirectIds: redirected.map(duplicate => duplicate.itemId),
      searchAliases: redirected.map(duplicate => items.find(other => other.itemId === duplicate.itemId).name) };
  });
  const turtles = result.filter(item => item.publicFamily?.id === 'carried-turtles');
  if (turtles.length) {
    assert(turtles.length === 5 && new Set(turtles.map(item => item.description)).size === 1, 'Unexpected carried-turtle family');
    const seen = new Map();
    for (const item of turtles) for (const source of item.displaySources) {
      const key = JSON.stringify({ ...source, sourceId: undefined });
      if (!seen.has(key)) seen.set(key, source);
    }
    result.splice(0, result.length, ...result.filter(item => !turtles.includes(item)), {
      ...turtles[0], name: 'Turtles', displaySources: [...seen.values()], nativeItemIds: turtles.map(item => item.itemId),
      identityNote: 'Breed, name and stats vary by turtle.',
    });
  }
  result.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }) || a.itemId - b.itemId);
  const duplicates = new Map();
  for (const item of result) {
    if (!item.displaySources.length) {
      item.knownVariants = result.filter(other => other.name === item.name && other.displaySources.length)
        .map(other => ({ label: `${other.name} · ${other.tabCandidate}`, href: `#inventory-item-${other.itemId}` }));
    }
    const same = result.filter(other => other.tabCandidate === item.tabCandidate && other.name === item.name);
    if (same.length > 1) {
      const key = item.tabCandidate + ':' + item.name;
      duplicates.set(key, (duplicates.get(key) ?? 0) + 1);
      item.identityNote = `Separate game entry ${duplicates.get(key)} of ${same.length}; these uses and sources belong to this entry.`;
    }
  }
  return result;
}

function renderItem(item) {
  assert(Number.isSafeInteger(item.itemId) && item.itemId > 0 && item.name && typeof item.description === 'string');
  const uses = item.displayUses ?? [];
  const kinds = [...new Set(uses.map(use => use.kind))];
  const sourceTypes = [...new Set(item.displaySources.map(source => source.type === 'reward' ? 'fixed' : source.type))];
  const description = stripControlPrompts(item.description);
  const search = fold([item.name, ...(item.searchAliases ?? []), plainNativeText(description), ...kinds,
    ...(item.relatedContext ? [item.relatedContext.heading, item.relatedContext.lead.label, item.relatedContext.detail, item.relatedContext.qualification, ...(item.relatedContext.links ?? []).map(target => target.label)] : []),
    ...uses.flatMap(use => [use.label, use.detail, ...(use.targets ?? []).flatMap(target => [target.label, target.detail])]),
    ...item.displaySources.flatMap(source => [source.label, guideMapLabel(source), source.detail, ...(source.links ?? []).filter(target => !/^\s*find key\b/i.test(target.label)).flatMap(target => [target.label, guideMapLabel(target)])])].join(' '));
  const nativeDescription = `<p class="inventory-native-description">${formatNativeText(description || 'No in-game description is stored for this entry.')}</p>`;
  assert(!item.image?.src || /^assets\/[\w./-]+\.webp$/.test(item.image.src), 'Expected a shipped inventory WebP');
  return `<li class="inventory-item-row" id="inventory-item-${item.itemId}" data-inventory-item data-item-id="${item.itemId}" data-inventory-aliases="${item.nativeItemIds.join(' ')}" data-inventory-redirects="${(item.redirectIds ?? []).join(' ')}" data-inventory-tab="${escape(item.tabCandidate)}" data-inventory-uses="${escape(JSON.stringify(kinds))}" data-inventory-sources="${sourceTypes.join(' ')}" data-inventory-known="${item.displaySources.length ? 'true' : 'false'}" data-inventory-search="${escape(search)}" tabindex="-1">
    ${item.nativeItemIds.filter(id => id !== item.itemId).map(id => `<span id="inventory-item-${id}" class="inventory-alias" aria-hidden="true"></span>`).join('')}
    ${(item.redirectIds ?? []).map(id => `<span id="inventory-item-${id}" class="inventory-alias" data-inventory-redirect aria-hidden="true"></span>`).join('')}
    <div class="inventory-identity-and-uses"><div class="inventory-item-title">${item.image?.src ? `<img src="${escape(item.image.src)}" width="64" height="64" alt="" loading="lazy" decoding="async">` : ''}<div><h3>${escape(item.name)}</h3><p class="inventory-tab-note">${escape(item.tabCandidate)}</p></div></div>
      ${item.description.length > 550 ? `<details class="inventory-long-description" data-inventory-panel="${item.itemId}-description"><summary>In-game description</summary>${nativeDescription}</details>` : nativeDescription}
      ${item.identityNote ? `<p class="inventory-identity-note">${escape(item.identityNote)}</p>` : ''}
      <details class="inventory-item-uses" data-inventory-panel="${item.itemId}-uses"><summary>Uses</summary>${uses.length ? `<ul class="inventory-uses">${uses.map((use, index) => renderUse(use, index, item.itemId)).join('')}</ul>` : '<p class="inventory-unverified">A direct use has not been verified for this exact entry.</p>'}</details>
    </div><div class="inventory-item-sources">${renderSources(item)}</div>
  </li>`;
}

function renderInventoryReference() {
  const data = require('../../data/inventory/inventory-reference.json');
  assert(data.items.length === 346, 'Expected all 346 carried candidates');
  const items = publicRows(data.items);
  const uses = [...new Set(items.flatMap(item => (item.displayUses ?? []).map(use => use.kind)))].sort();
  return withGuideMapURLs(`<details class="supplement inventory-catalog" id="items-valuables" data-inventory-reference>
    <summary class="inventory-heading"><h2>Items &amp; valuables</h2><small>${items.filter(item => item.displaySources.length).length} entries with known sources</small></summary>
    <div class="inventory-body"><p class="inventory-intro">In-game descriptions, uses and places to find each item. Follow a quest or map link for the walkthrough or exact spot.</p>
    <form class="inventory-filters" role="search" aria-label="Find items and valuables" data-inventory-filters hidden>
      <label class="inventory-search">Find an item or place<input type="search" name="inventory-search" autocomplete="off" spellcheck="false" placeholder="Item, use or place…" aria-controls="inventory-item-list"></label>
      <label>Use<select name="inventory-use" aria-controls="inventory-item-list"><option value="all">Any use</option>${uses.map(kind => `<option value="${escape(kind)}">${escape(kind)}</option>`).join('')}</select></label>
      <label>Source<select name="inventory-source" aria-controls="inventory-item-list"><option value="all">Any source</option>${sourceGroups.map(([id, title]) => `<option value="${id}">${title}</option>`).join('')}<option value="unknown">Source not verified</option></select></label>
    </form>
    <div class="inventory-toolbar"><div class="inventory-tabs" role="group" aria-label="Inventory tab">${[['all', 'All'], ['Items', 'Items'], ['Valuables', 'Valuables']].map(([id, title]) => `<button type="button" data-inventory-tab-button="${id}" aria-pressed="${id === 'all'}">${title}</button>`).join('')}</div><div><span data-inventory-count role="status" aria-live="polite"></span><button type="button" class="inventory-clear" data-inventory-reset hidden>Clear filters</button></div></div>
    <label class="inventory-research-toggle"><input type="checkbox" data-inventory-unverified aria-controls="inventory-item-list">Include entries with unverified availability</label>
    <p class="inventory-unverified-note" data-inventory-unknown-note hidden>These exact game records have no verified normal carried source. They may be older or alternate records; this does not prove they are unused.</p>
    <ul class="inventory-item-list" id="inventory-item-list">${items.map(renderItem).join('\n')}</ul>
    <p class="inventory-empty" data-inventory-empty hidden>No matching items. Try another name or clear the filters.</p>
    <div class="inventory-reference-notes">${(data.referenceNotes ?? []).map(note => `<p class="inventory-reference-note">${escape(note)}</p>`).join('')}<p class="inventory-reference-note">Random finds are possible results, not guaranteed drops. Items and Valuables are the in-game inventory tabs.</p></div>
    </div></details>`);
}

module.exports = { renderInventoryReference, publicRows, renderItem, link, stripControlPrompts };
