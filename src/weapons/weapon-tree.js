(() => {
  const panel = document.querySelector('#weapon-upgrade-trees');
  if (!panel) return;
  const toolRoot = document.querySelector('[data-weapon-tools]');
  const dualHost = toolRoot.querySelector('[data-weapon-dual-host]');
  const { weapons, families, pairs, defaultId } = JSON.parse(panel.querySelector('[data-weapon-tree-data]').textContent);
  const byId = new Map(weapons.map(weapon => [weapon.id, weapon]));
  const byRoot = new Map(families.map(group => [group.id, group]));
  const checks = new Map([...document.querySelectorAll('#weapon-completion [data-side-done]')]
    .map(check => [check.dataset.sideDone, check]));
  const familySelect = panel.querySelector('#weapon-family');
  const search = panel.querySelector('#weapon-tree-search');
  const results = panel.querySelector('#weapon-search-results');
  const searchStatus = panel.querySelector('[data-weapon-search-status]');
  const viewport = panel.querySelector('.weapon-tree-viewport');
  const size = panel.querySelector('.weapon-tree-size');
  const stage = panel.querySelector('.weapon-tree-stage');
  const detail = panel.querySelector('[data-weapon-detail]');
  const dialog = document.querySelector('#weapon-tree-expanded');
  const expandButton = panel.querySelector('[data-weapon-expand]');
  const detailsButton = panel.querySelector('[data-weapon-details-toggle]');
  const zoomLevel = panel.querySelector('[data-weapon-zoom-level]');
  const zoomOut = panel.querySelector('[data-weapon-zoom="-1"]');
  const zoomIn = panel.querySelector('[data-weapon-zoom="1"]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const home = document.createComment('weapon tree position');
  panel.before(home);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const checkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"/></svg>';
  const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10H5v10h14V10h-2M12 15V3m-4 4 4-4 4 4"/></svg>';
  const fold = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const saved = viewState.weaponTree;
  const initialWeapon = byId.has(saved?.id) ? saved.id : defaultId;
  const pairRoles = ['first', 'second'];
  const pairChoices = Object.fromEntries(pairRoles.map(role => [role,
    pairs.roles[role].completionWeaponIds.filter(id => byId.has(id))]));
  const savedPair = viewState.weaponPair ?? {};
  const pairState = viewState.weaponPair = { open: Boolean(savedPair.open), rulesOpen: Boolean(savedPair.rulesOpen),
    first: pairChoices.first.includes(savedPair.first) ? savedPair.first : pairChoices.first[0],
    second: pairChoices.second.includes(savedPair.second) ? savedPair.second : pairChoices.second[0] };
  const linkedWeapon = new URLSearchParams(location.search).get('weapon');
  let selected = byId.has(linkedWeapon) ? linkedWeapon : initialWeapon;
  const minZoom = .5, maxZoom = 2;
  let zoom = Number.isFinite(saved?.zoom) && saved.zoom >= minZoom && saved.zoom <= maxZoom ? saved.zoom : 1;
  let currentRoot;
  let positions = new Map();
  let canvas = { width: 0, height: 0 };
  let pendingCenter = true;
  let drag;
  let suppressClick = false;
  let wheelFrame = 0;
  let pendingWheel;
  let zoomMotion;
  let renderedScroll = { x: viewport.scrollLeft, y: viewport.scrollTop };
  let releaseScroll;
  let modalVersion = 0;
  let initialCenter = !byId.has(linkedWeapon) && saved?.center && Number.isFinite(saved.center.x) && Number.isFinite(saved.center.y) ? saved.center : null;
  let geometry;
  let geometryDirty = true;
  let searchMatches = [];
  let activeResult = -1;
  let resultHeight = 72;
  let searchFrame = 0;
  let searchRange = '';
  let shareSelection;
  let weaponSnapshot;
  let pairPickers = [];
  let tools;
  let revealRequest = 0;
  const numberFormat = new Intl.NumberFormat();
  const snapshotTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const W = 10.25, H = 10.25, column = 12.25, row = 11.5, pad = 1.5;
  const shareActions = mountAtlasLinkSharing({ signal: viewSignal, dialog: document.querySelector('#weapon-share-dialog'),
    getAddress: () => weaponURL(selected).href,
    getName: () => byId.get(selected).name,
    onStatus: text => { for (const status of panel.querySelectorAll('[data-weapon-share-status]')) status.textContent = text; },
  });

  function measureGeometry() {
    if (geometryDirty || !geometry?.width) {
      geometry = { width: viewport.clientWidth, height: viewport.clientHeight,
        rem: parseFloat(getComputedStyle(document.documentElement).fontSize) };
      geometryDirty = !geometry.width;
    }
    return geometry;
  }

  function weaponURL(id) {
    const url = new URL(location.href);
    url.searchParams.set('weapon', id);
    url.searchParams.delete('weapon-tool');
    url.hash = 'weapon-upgrade-trees';
    return url;
  }

  function writeWeaponURL(id) {
    const url = weaponURL(id);
    if (url.href !== location.href) history.pushState(history.state, '', url);
  }

  function isAcquired(id) { return Boolean(checks.get(byId.get(id).key)?.checked); }
  function weaponLabel(id) {
    const weapon = byId.get(id);
    return `${weapon.name}. Base Attack ${weapon.stats.attack}, Force ${weapon.stats.force}, Speed ${weapon.stats.speed}${isAcquired(id) ? '. Acquired' : ''}`;
  }
  function pictureStats(weapon) {
    return `<span class="weapon-picture-stats"><span title="Base Attack for this weapon variant"><small>Attack</small><b data-weapon-stat="attack">${weapon.stats.attack}</b></span><span title="Base Force for this weapon variant"><small>Force</small><b data-weapon-stat="force">${weapon.stats.force}</b></span></span>`;
  }

  function buyingHTML(weapon) {
    const offers = new Map();
    for (const offer of weapon.offers) for (const merchant of offer.merchants) {
      const key = JSON.stringify([merchant.id, offer.price, offer.unlock, merchant.access]);
      if (!offers.has(key)) offers.set(key, { ...offer, merchant, tables: [] });
      offers.get(key).tables.push(offer.table);
    }
    const rows = [...offers.values()].map(({ merchant, price, conditional, unlock, tables }) => {
      const chapterGate = { '000c0000': '5', '000d0000': '6', '000e0000': '7' }[unlock];
      const explained = chapterGate && new RegExp(`from chapter ${chapterGate}\\b`, 'i').test(merchant.access);
      const access = merchant.access ? merchant.access[0].toUpperCase() + merchant.access.slice(1) : '';
      return `<li class="weapon-shop-offer" data-weapon-shop-merchant="${escape(merchant.id)}" data-weapon-stock-tables="${escape(tables.join(' '))}"><div><a href="${escape(kenzanMapHref({ mapPlace: merchant.mapPlace }))}" data-map-place="${escape(merchant.mapPlace)}">${escape(merchant.name)}${merchant.area ? ` <span>· ${escape(merchant.area)}</span>` : ''}</a><strong>${numberFormat.format(price)} mon</strong></div>${access ? `<p>${escape(access)}.</p>` : ''}${conditional && !explained ? '<p class="weapon-stock-note">Stock unlock: the exact condition has not yet been verified.</p>' : ''}</li>`;
    }).join('');
    return `${rows ? `<ul class="weapon-shop-offers" aria-label="Verified shop offers">${rows}</ul>` : ''}${weapon.source ? `<div class="weapon-other-sources">${rows ? '<h5>Other sources and notes</h5>' : ''}${weapon.source}</div>` : ''}`;
  }

  function pairHTML() {
    const fields = pairRoles.map(role => {
      const name = byId.get(pairState[role]).name;
      return `<div class="weapon-pair-choice" data-weapon-pair-picker="${role}"><label for="weapon-pair-${role}">${escape(pairs.roles[role].label)}</label><div class="weapon-pair-input"><input type="text" id="weapon-pair-${role}" name="weapon-pair-${role}" data-weapon-pair-role="${role}" role="combobox" aria-label="${escape(pairs.roles[role].label)}" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-describedby="weapon-pair-order weapon-pair-${role}-selected" autocomplete="off" spellcheck="false" placeholder="Type a ${escape(pairs.roles[role].label.toLowerCase())} name…" value="${escape(name)}"><button type="button" data-weapon-pair-toggle tabindex="-1" aria-label="Show ${escape(pairs.roles[role].label.toLowerCase())} choices" title="Show choices"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div><p class="sr-only" data-weapon-pair-search-status role="status"></p><div class="weapon-pair-preview"><img data-weapon-pair-image="${role}" src="${escape(byId.get(pairState[role]).image)}" width="128" height="128" alt="" decoding="async" draggable="false"><div><p class="weapon-pair-current" id="weapon-pair-${role}-selected">Selected: <strong data-weapon-pair-name="${role}">${escape(name)}</strong></p><p data-weapon-pair-base="${role}"></p></div></div></div>`;
    }).join('');
    return `<div class="weapon-pair-panel" data-weapon-pair><div class="weapon-tree-heading"><h3>Dual-sword stance</h3></div><p class="weapon-pair-intro" id="weapon-pair-order">See the equipment-menu stats you get when using a katana and a kodachi together in dual-sword stance. Choose a weapon for each role; you don’t need to own them or import a save.</p><div class="weapon-pair-fields">${fields}</div><div class="weapon-pair-result" role="status" aria-live="polite" aria-atomic="true" aria-describedby="weapon-pair-caveat" data-weapon-pair-result></div><p class="weapon-pair-caveat" id="weapon-pair-caveat">These are the pair’s base menu stats. They don’t predict final damage. Force’s full combat effect is still unverified, and a special matching pair doesn’t guarantee better values for every stat.</p><details class="weapon-pair-rules" data-weapon-pair-rules${pairState.rulesOpen ? ' open' : ''}><summary>How these values are calculated</summary><div data-weapon-pair-explanation></div></details></div>`;
  }

  function updatePair() {
    const result = window.kenzanWeaponPairs.calculatePair(pairs, pairState.first, pairState.second);
    const output = dualHost.querySelector('[data-weapon-pair-result]');
    if (!output) return;
    for (const role of pairRoles) {
      const weapon = byId.get(pairState[role]);
      pairPickers.find(picker => picker.role === role)?.setValue(pairState[role]);
      dualHost.querySelector(`[data-weapon-pair-name="${role}"]`).textContent = weapon.name;
      const image = dualHost.querySelector(`[data-weapon-pair-image="${role}"]`);
      if (weapon) {
        image.src = weapon.image;
        dualHost.querySelector(`[data-weapon-pair-base="${role}"]`).textContent =
          `Base Attack ${weapon.stats.attack} · Force ${weapon.stats.force} · Speed ${weapon.stats.speed}`;
      }
    }
    output.dataset.specialPair = String(Boolean(result.specialPair));
    const explanation = dualHost.querySelector('[data-weapon-pair-explanation]');
    if (!result.valid) { output.textContent = result.reason; explanation.textContent = ''; return; }
    output.innerHTML = `<p class="weapon-pair-rule-name">${result.specialPair ? 'Special matching pair' : 'Standard two-sword rule'}</p><dl class="weapon-pair-stats"><div><dt>Paired Attack</dt><dd data-weapon-pair-stat="attack">${numberFormat.format(result.attack)}</dd></div><div><dt>Paired Force</dt><dd data-weapon-pair-stat="force">${numberFormat.format(result.force)}</dd></div><div><dt>Paired Speed</dt><dd data-weapon-pair-stat="speed">${escape(result.speed.label)}</dd></div></dl>`;
    if (result.specialPair) {
      const family = pairs.families.find(family => family.id === result.specialPair.id);
      explanation.innerHTML = `<p>The game checks its matching-pair table first. These variants match, so it uses that rule instead of the standard formula.</p><ul><li>Attack: ${family.baseAttack} + ${result.specialPair.firstSlot} variant adjustment = <strong>${result.attack}</strong>.</li><li>Force: ${family.baseForce} + ${result.specialPair.secondSlot} variant adjustment = <strong>${result.force}</strong>.</li><li>Speed: <strong>${escape(result.speed.label)}</strong>, from the matching-pair rule.</li></ul><p>The variant adjustments follow each weapon’s position in the game’s table. They aren’t calculated from the +1 or EX in its name.</p>`;
    } else {
      const katana = byId.get(pairState.first), kodachi = byId.get(pairState.second);
      explanation.innerHTML = `<p>No special matching rule applies, so the game uses its standard two-sword calculation. Round down means dropping any fraction.</p><ul><li>Attack: round down (7 × ${katana.stats.attack} ÷ 10) = <strong>${result.attack}</strong>.</li><li>Force: round down (${katana.stats.force} ÷ 2) + ${kodachi.stats.force} = <strong>${result.force}</strong>.</li><li>Speed: the katana’s <strong>${escape(result.speed.label)}</strong> category.</li></ul><p>The two individual Attack values are not added together. These rules do not describe the full combat damage calculation.</p>`;
    }
  }

  function saveHTML(weapon) {
    const savedWeapons = weaponSnapshot?.weapons;
    const record = savedWeapons?.known && savedWeapons.byItemId[weapon.itemId];
    const stamp = new Date(weaponSnapshot?.observedAt ?? '');
    const time = Number.isFinite(stamp.getTime())
      ? `<p class="weapon-snapshot-source">${escape(weaponSnapshot.source)} · Read <time datetime="${stamp.toISOString()}">${escape(snapshotTimeFormat.format(stamp))}</time></p>` : '';
    const heading = `<div class="weapon-section-heading"><h5>Your save</h5>${time}</div>`;
    if (!record || !Number.isInteger(record.count)) return `${heading}<p class="weapon-save-empty">${weaponSnapshot ? 'Weapon information could not be read from this save. ' : ''}<a href="#save-sync">Sync or import your save to check</a> ownership and saved equipment sets.</p>`;
    const instances = record.instances.map((instance, index) => {
      const assignedSets = [...new Set(instance.assignments.map(assignment => assignment.set))];
      return `<li><strong>Copy ${index + 1}</strong><div>${assignedSets.length ? assignedSets.map(set => `<span class="weapon-loadout-assignment">Assigned to equipment set ${set}${set === savedWeapons.activeSet ? ' <em>Selected in this save</em>' : ''}</span>`).join('') : `<span>${savedWeapons.assignmentKnown ? 'Not assigned to an equipment set' : 'Assignment could not be fully read'}</span>`}</div></li>`;
    }).join('');
    const loadouts = record.count ? `<details class="weapon-save-copies"><summary data-weapon-save-copies>Copies and equipment sets</summary><p>An equipment set is a saved combination of gear. ${savedWeapons.activeSet ? `Equipment set ${savedWeapons.activeSet} is selected in this save.` : 'The selected equipment set could not be read.'} Temporary equipment during gameplay can differ.</p>${!savedWeapons.assignmentKnown ? '<p>Some equipment-set references could not be read; assignments shown below may be incomplete.</p>' : ''}<ul>${instances}</ul></details>` : '';
    const assignedSets = [...new Set(record.instances.flatMap(instance => instance.assignments.map(assignment => assignment.set)))].sort();
    const assignment = record.count ? `<p class="weapon-save-assignment" data-weapon-assignment><strong>${assignedSets.length ? `Assigned to equipment set${assignedSets.length > 1 ? 's' : ''} ${assignedSets.join(' and ')}` : record.assigned === false ? 'Not assigned to an equipment set' : 'Equipment-set assignment could not be fully read'}</strong>${assignedSets.includes(savedWeapons.activeSet) ? `<span>Equipment set ${savedWeapons.activeSet} is selected in this save.</span>` : ''}</p>` : '';
    const history = record.acquired === true ? 'Recorded in this save' : record.acquired === false ? 'Not recorded in this save' : 'Could not be read';
    return `${heading}<dl class="weapon-save-summary"><div><dt>Owned</dt><dd>${record.count ? 'Yes' : 'No'}</dd></div><div><dt>Copies</dt><dd>${numberFormat.format(record.count)}</dd></div><div><dt>Acquired before</dt><dd>${history}</dd></div></dl><p class="weapon-guide-history-note" data-weapon-guide-history></p>${assignment}${loadouts}<p class="weapon-save-caveat">Ownership and equipment sets reflect this save, not live gameplay. Acquired history remains after selling or using a weapon.</p>`;
  }

  function updateGuideHistoryNote() {
    const note = detail.querySelector('[data-weapon-guide-history]');
    if (!note) return;
    const record = weaponSnapshot?.weapons?.byItemId[byId.get(selected).itemId];
    note.textContent = record?.acquired === false && isAcquired(selected)
      ? 'Marked acquired in your guide; this save has no acquisition record.'
      : record?.acquired === true && !isAcquired(selected)
        ? 'This save records acquisition; your guide checklist is currently clear.' : '';
    note.hidden = !note.textContent;
  }

  function updateSaveDetails() {
    const region = detail.querySelector('[data-weapon-save]');
    if (!region) return;
    const open = region.querySelector('details')?.open;
    const focused = region.contains(document.activeElement);
    region.innerHTML = saveHTML(byId.get(selected));
    if (region.querySelector('details')) region.querySelector('details').open = Boolean(open);
    updateGuideHistoryNote();
    const craft = detail.querySelector('[data-weapon-craft-status]');
    if (craft) {
      const record = weaponSnapshot?.weapons?.byItemId[byId.get(selected).itemId];
      craft.textContent = record?.crafted === true ? 'Crafted before · recorded in this save'
        : record?.crafted === false ? 'Not crafted in this save' : 'Sync or import your save to check crafting history';
      craft.dataset.recorded = String(record?.crafted === true);
    }
    updateRecipeSupplies();
    if (focused) (region.querySelector('[data-weapon-save-copies]') ?? region.querySelector('a') ?? region).focus({ preventScroll: true });
  }

  function updateRecipeSupplies() {
    const weapon = byId.get(selected);
    const recipe = weapon.recipe;
    const ready = detail.querySelector('[data-recipe-ready]');
    if (!recipe || !ready) return;
    const result = window.kenzanCrafting.assessRecipe(recipe, weaponSnapshot?.crafting,
      weaponSnapshot?.weapons, byId.get(recipe.from).itemId);
    ready.dataset.state = !weaponSnapshot ? 'offline' : result.met === true ? 'ready' : result.met === false ? 'missing' : 'unknown';
    ready.innerHTML = !weaponSnapshot ? '<a href="#save-sync">Sync or import your save to check supplies</a>'
      : result.met === true ? `${checkIcon}Supplies ready to ${recipe.kind === 'temper' ? 'temper' : 'forge'}`
        : result.met === false ? 'Requirements missing' : 'Some requirements could not be read';
    const set = (key, met, text) => {
      const host = detail.querySelector(`[data-recipe-check="${key}"]`);
      if (!host) return;
      host.dataset.met = met === null ? 'unknown' : String(met);
      const status = host.querySelector('[data-recipe-status]');
      status.textContent = !weaponSnapshot ? 'Sync or import your save to check this requirement.' : text;
      host.title = status.textContent;
      host.querySelector('a, button')?.setAttribute('aria-describedby', status.id);
    };
    set('source', result.source.met, result.source.met === null ? 'Ownership could not be read.'
      : result.source.met ? 'Weapon owned in this save.' : 'Weapon not owned in this save.');
    set('fee', result.fee.met, result.fee.met === null ? 'Mon could not be read.'
      : result.fee.met ? 'Enough mon in this save.' : 'Not enough mon in this save.');
    for (const item of result.materials) set('material-' + item.itemId, item.met,
      item.met === null ? 'Material quantity could not be read.'
        : item.met ? 'Required quantity available in this save.' : 'Not enough of this material in this save.');
    for (const item of result.books) set('book-' + item.itemId, item.met,
      item.met === null ? 'Book ownership could not be read.' : item.met ? 'Book owned in this save.' : 'Book not owned in this save.');
  }

  function requirementHTML(key, value) {
    return `<span class="weapon-requirement" data-recipe-check="${key}"><span class="weapon-requirement-value">${value}</span><span class="weapon-requirement-mark" aria-hidden="true">${checkIcon}</span><span class="sr-only" id="weapon-recipe-${key}-status" data-recipe-status></span></span>`;
  }

  guideView.updateWeaponSave = snapshot => {
    if (viewSignal.aborted || snapshot === weaponSnapshot) return;
    weaponSnapshot = snapshot;
    updateSaveDetails();
    tools?.setSnapshot(snapshot);
  };
  function stopWheel() {
    if (wheelFrame) cancelAnimationFrame(wheelFrame);
    wheelFrame = 0;
    pendingWheel = undefined;
    zoomMotion = undefined;
    delete viewport.dataset.zooming;
    updateZoomControls();
  }
  function centerSelection() {
    stopWheel();
    const position = positions.get(selected);
    const { width, height, rem } = measureGeometry();
    if (!position || !width) return;
    viewport.scrollTo({ left: (position.x + W / 2) * rem * zoom - width / 2,
      top: (position.y + H / 2) * rem * zoom - height / 2, behavior: 'instant' });
    pendingCenter = false;
  }

  function viewCenter() {
    const { width, height } = measureGeometry();
    return { x: (viewport.scrollLeft + width / 2) / zoom,
      y: (viewport.scrollTop + height / 2) / zoom };
  }
  function restoreCenter(point) {
    const { width, height } = measureGeometry();
    viewport.scrollTo({ left: point.x * zoom - width / 2,
      top: point.y * zoom - height / 2, behavior: 'instant' });
  }
  function updateTransform() {
    stage.style.transform = `scale(${zoom})`;
    size.style.width = `${canvas.width * zoom}rem`;
    size.style.height = `${canvas.height * zoom}rem`;
    updateZoomControls();
  }
  function updateZoomControls() {
    const text = `${Math.round(zoom * 100)}%`;
    if (zoomLevel.textContent !== text) zoomLevel.textContent = text;
    const target = zoomMotion?.destination.scale ?? zoom;
    zoomOut.disabled = target <= minZoom;
    zoomIn.disabled = target >= maxZoom;
  }
  function currentCamera() {
    return { x: -(zoomMotion ? renderedScroll.x : viewport.scrollLeft),
      y: -(zoomMotion ? renderedScroll.y : viewport.scrollTop), scale: zoom };
  }
  function applyCamera(camera) {
    const { width, height, rem } = measureGeometry();
    zoom = camera.scale;
    updateTransform();
    // Clamp from the known canvas and viewport geometry, without forcing a
    // read-back layout after changing its dimensions on every animation frame.
    renderedScroll = {
      x: Math.round(Math.max(0, Math.min(-camera.x, Math.max(0, Math.round(canvas.width * rem * zoom) - width)))),
      y: Math.round(Math.max(0, Math.min(-camera.y, Math.max(0, Math.round(canvas.height * rem * zoom) - height)))),
    };
    viewport.scrollTo({ left: renderedScroll.x, top: renderedScroll.y, behavior: 'instant' });
  }
  function advanceZoom(now) {
    if (!zoomMotion) return;
    const { start, destination, anchor, control, logChange, time, duration } = zoomMotion;
    if (now - time >= duration || reducedMotion.matches) {
      zoomMotion = undefined;
      delete viewport.dataset.zooming;
      applyCamera(destination);
      return;
    }
    const easing = atlasSampleWheelEasing(control, Math.max(0, (now - time) / duration));
    applyCamera(atlasZoomTransform(start, start.scale * Math.exp(logChange * easing.value), anchor));
    zoomMotion.velocity = logChange * easing.slope / duration;
  }
  function startZoom(value, anchor, now, kind, previous) {
    const next = Math.max(minZoom, Math.min(maxZoom, value));
    const start = currentCamera();
    const logChange = Math.log(next / zoom);
    const destination = atlasZoomTransform(start, next, anchor);
    if (reducedMotion.matches || Math.abs(logChange) < 1e-9) {
      zoomMotion = undefined;
      delete viewport.dataset.zooming;
      applyCamera(destination);
      return;
    }
    zoomMotion = { start, destination, anchor, kind, logChange, velocity: 0, duration: 200,
      time: previous ? now : now - 5,
      control: previous ? atlasWheelRetargetControl(logChange, previous.velocity) : { x: .25, y: .1 } };
    viewport.dataset.zooming = '';
    if (!previous) advanceZoom(now);
    updateZoomControls();
  }
  function requestZoomFrame() {
    if (!wheelFrame) wheelFrame = requestAnimationFrame(drawZoom);
  }
  function drawZoom(now) {
    wheelFrame = 0;
    const wheel = pendingWheel;
    pendingWheel = undefined;
    advanceZoom(now);
    if (wheel?.delta) {
      const previous = zoomMotion?.kind === 'wheel' ? zoomMotion : undefined;
      const target = previous?.destination.scale ?? zoom;
      const next = atlasWheelTargetScale(target, wheel.delta, minZoom, maxZoom);
      if (next !== target) startZoom(next, previous?.anchor ?? wheel.anchor, now, 'wheel', previous);
    }
    if (zoomMotion || pendingWheel) requestZoomFrame();
  }
  function setZoom(value, anchor) {
    const { width, height } = measureGeometry();
    anchor ??= { x: width / 2, y: height / 2 };
    const now = performance.now();
    advanceZoom(now);
    pendingWheel = undefined;
    startZoom(value, anchor, now, 'button', zoomMotion);
    if (zoomMotion) requestZoomFrame();
  }
  function setDetails(open) {
    if (!open) pairPickers.forEach(picker => picker.close());
    stopWheel();
    const center = viewCenter();
    panel.toggleAttribute('data-details-visible', open);
    detail.hidden = dialog.open && !open;
    detailsButton.setAttribute('aria-expanded', String(open));
    detailsButton.textContent = open ? 'Hide details' : 'Details';
    geometryDirty = true;
    restoreCenter(center);
  }
  function collapse({ focus = true } = {}) {
    pairPickers.forEach(picker => picker.close());
    if (!panel.hasAttribute('data-expanded')) return;
    const version = ++modalVersion;
    shareActions.reset();
    stopWheel();
    const center = viewCenter();
    if (version !== modalVersion || !panel.hasAttribute('data-expanded')) return;
    const release = releaseScroll; releaseScroll = undefined;
    delete panel.dataset.expanded;
    delete panel.dataset.detailsVisible;
    detail.hidden = false;
    release?.();
    expandButton.setAttribute('aria-expanded', 'false');
    expandButton.setAttribute('aria-label', 'Expand weapon tree');
    expandButton.title = 'Expand tree';
    expandButton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5"/></svg>';
    home.after(panel);
    if (version !== modalVersion || panel.hasAttribute('data-expanded')) return;
    geometryDirty = true;
    restoreCenter(center);
    // Retire the old panel and lease before native close restores focus. A
    // focus callback may reopen this same dialog; the old continuation stops.
    if (dialog.open) dialog.close();
    if (version !== modalVersion || panel.hasAttribute('data-expanded')) return;
    if (focus) expandButton.focus({ preventScroll: true });
  }
  function expand() {
    if (viewSignal.aborted || panel.hasAttribute('data-expanded')) return;
    const version = ++modalVersion;
    pairPickers.forEach(picker => picker.close());
    stopWheel();
    const center = viewCenter();
    dialog.append(panel);
    panel.dataset.expanded = '';
    detail.hidden = true;
    delete panel.dataset.detailsVisible;
    detailsButton.setAttribute('aria-expanded', 'false');
    detailsButton.textContent = 'Details';
    try {
      releaseScroll = acquireDocumentScrollLock(document);
      dialog.showModal();
    } catch (error) { if (version === modalVersion) collapse({ focus: false }); throw error; }
    if (viewSignal.aborted || version !== modalVersion || !panel.hasAttribute('data-expanded')) return;
    expandButton.setAttribute('aria-expanded', 'true');
    expandButton.setAttribute('aria-label', 'Close expanded weapon tree');
    expandButton.title = 'Close expanded view';
    expandButton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    geometryDirty = true;
    restoreCenter(center);
    expandButton.focus({ preventScroll: true });
  }

  function renderFamily(root) {
    stopWheel();
    currentRoot = root;
    const family = byRoot.get(root);
    positions = new Map();
    let leaf = 0;
    function place(id, depth) {
      const children = byId.get(id).children;
      const y = children.length ? children.map(child => place(child, depth + 1)).reduce((a, b) => a + b) / children.length : pad + leaf++ * row;
      positions.set(id, { x: pad + depth * column, y });
      return y;
    }
    place(root, 0);
    canvas = { width: Math.max(...[...positions.values()].map(point => point.x)) + W + pad,
      height: Math.max(...[...positions.values()].map(point => point.y)) + H + pad };
    stage.style.width = `${canvas.width}rem`;
    stage.style.height = `${canvas.height}rem`;
    geometryDirty = true;
    const edges = family.ids.flatMap(id => byId.get(id).children.map(child => {
      const from = positions.get(id), to = positions.get(child);
      const x1 = from.x + W, y1 = from.y + H / 2, x2 = to.x, y2 = to.y + H / 2, middle = (x1 + x2) / 2;
      return `<path data-weapon-edge="${child}" d="M${x1} ${y1}H${middle}V${y2}H${x2}"/><path class="weapon-edge-arrow" data-weapon-edge="${child}" d="m${x2 - .32} ${y2 - .22} .32 .22-.32 .22"/>`;
    })).join('');
    stage.innerHTML = `<svg class="weapon-tree-connectors" viewBox="0 0 ${canvas.width} ${canvas.height}" aria-hidden="true" focusable="false">${edges}</svg>` + family.ids.map(id => {
      const weapon = byId.get(id), position = positions.get(id);
      return `<button type="button" class="weapon-node" data-weapon-node="${id}" style="left:${position.x}rem;top:${position.y}rem" aria-pressed="false" aria-controls="weapon-tree-details"><span class="weapon-node-art"><img src="${escape(weapon.image)}" width="128" height="128" alt="" loading="lazy" decoding="async" draggable="false">${pictureStats(weapon)}</span><span class="weapon-node-name">${escape(weapon.name)}</span><span class="weapon-node-speed" data-weapon-stat="speed">Speed · ${escape(weapon.stats.speed)}</span><span class="weapon-node-acquired" aria-hidden="true">${checkIcon}</span></button>`;
    }).join('');
    familySelect.value = root;
    panel.querySelector('[data-weapon-family-summary]').textContent = family.ids.length > 1
      ? `${family.name} · ${family.ids.length} weapons` : `${family.name} · no blacksmith upgrades`;
    updateTransform();
  }

  function renderSelection() {
    const weapon = byId.get(selected);
    const pairRole = pairRoles.find(role => pairChoices[role].includes(selected));
    if (shareSelection !== selected) { shareActions.reset(); shareSelection = selected; }
    panel.querySelector('[data-weapon-expanded-name]').textContent = weapon.name;
    panel.querySelector('[data-weapon-expanded-stats]').textContent = `Base Attack ${weapon.stats.attack} · Force ${weapon.stats.force} · Speed ${weapon.stats.speed}`;
    const ancestors = new Set();
    for (let id = selected; byId.get(id).parent; id = byId.get(id).parent) ancestors.add(id);
    for (const button of stage.querySelectorAll('[data-weapon-node]')) {
      const id = button.dataset.weaponNode;
      button.setAttribute('aria-pressed', String(id === selected));
      button.dataset.acquired = String(isAcquired(id));
      button.setAttribute('aria-label', weaponLabel(id));
      button.tabIndex = id === selected ? 0 : -1;
    }
    for (const edge of stage.querySelectorAll('[data-weapon-edge]')) {
      const active = ancestors.has(edge.dataset.weaponEdge);
      edge.classList.toggle('is-ancestor', active);
      if (active) edge.parentElement.append(edge);
    }
    const recipe = weapon.recipe;
    detail.innerHTML = `<div class="weapon-detail-heading"><div class="weapon-detail-art"><img src="${escape(weapon.image)}" width="128" height="128" alt="" decoding="async" draggable="false">${pictureStats(weapon)}<span class="weapon-picture-speed" data-weapon-stat="speed">Speed · ${escape(weapon.stats.speed)}</span></div><div class="weapon-detail-copy"><div class="weapon-detail-title"><h4 id="weapon-selected-title">${escape(weapon.name)}</h4><span class="weapon-share-slot weapon-inline-share"><button type="button" class="weapon-share-button" data-weapon-share aria-label="Copy link to ${escape(weapon.name)}" title="Copy weapon link">${shareIcon}</button><span class="atlas-share-status" data-weapon-share-status role="status"></span></span></div><p>${escape(weapon.category)}</p><p class="weapon-base-stats-note">Base stats, not final damage. Force’s full combat effect is not yet verified; paired setups and special effects are separate.</p></div><button type="button" class="weapon-acquired-toggle" data-weapon-acquired aria-pressed="${isAcquired(selected)}" aria-describedby="weapon-acquired-help">${checkIcon}<span>${isAcquired(selected) ? 'Acquired' : 'Mark acquired'}</span></button></div>
      <p class="sr-only" id="weapon-acquired-help">Guide acquisition checklist, not current ownership. This can be marked manually or by save sync.</p>
      ${weapon.description ? `<p class="weapon-native-description">${escape(weapon.description)}</p>` : ''}
      <div class="weapon-detail-tools"><button type="button" class="weapon-tool-action" data-weapon-compare-selected>Compare this weapon</button>${pairRole ? `<button type="button" class="weapon-tool-action" data-weapon-pair-use="${pairRole}">Use in dual-sword stance</button>` : ''}</div>
      <div class="weapon-saved-data" data-weapon-save role="region" aria-label="Your save" tabindex="-1"></div>
      ${recipe ? `<section class="weapon-reference-section" aria-labelledby="weapon-recipe-heading">
        <div class="weapon-section-heading"><h5 id="weapon-recipe-heading">Recipe</h5><span class="weapon-craft-status" data-weapon-craft-status></span></div>
        <p class="weapon-recipe-ready" data-recipe-ready role="status"></p>
        <div class="weapon-recipe">
          <div><h5>Weapon consumed · ${recipe.kind === 'temper' ? 'temper' : 'forge'}</h5>${requirementHTML('source', `<button type="button" class="weapon-text-link" data-weapon-select="${recipe.from}">${escape(byId.get(recipe.from).name)}</button>`)}</div>
          <div><h5>Blacksmith fee</h5>${requirementHTML('fee', `${recipe.cost.toLocaleString()} mon`)}</div>
          ${recipe.materials.length ? `<div><h5>Materials</h5><ul>${recipe.materials.map(item => `<li>${requirementHTML('material-' + item.itemId, `<a href="#forging-item-${item.itemId}">${escape(item.name)}</a> <strong>× ${item.count}</strong>`)}</li>`).join('')}</ul></div>` : ''}
          ${recipe.books.length ? `<div><h5>Book required</h5><ul>${recipe.books.map(item => `<li>${requirementHTML('book-' + item.itemId, `<a href="#forging-key-item-${item.keyItemIndex}">${escape(item.name)}</a>`)}</li>`).join('')}</ul></div>` : ''}
        </div><p class="weapon-recipe-note">Ticks mean this save meets the requirement. Materials in storage count; books are kept. Blacksmith access follows the story.</p></section>`
        : `<p class="weapon-base-note">${weapon.children.length ? 'Base weapon for this upgrade family.' : 'This weapon has no blacksmith upgrade path.'}</p>`}
      <div class="weapon-detail-footer"><details class="weapon-acquisition"><summary>Where to get it</summary><div>${buyingHTML(weapon)}</div></details><a class="weapon-checklist-link" href="#${escape(weapon.key)}">View checklist entry</a></div>
      <section class="weapon-selling" aria-label="Selling"><h5>Selling</h5><p data-weapon-sell-value>${weapon.selling.prohibited ? '<strong>Cannot sell</strong>' : `Sell value <strong>${numberFormat.format(weapon.selling.price)} mon</strong>`}</p></section>
      ${weapon.children.length ? `<div class="weapon-next"><h5>Upgrades to</h5><div>${weapon.children.map(id => `<button type="button" data-weapon-select="${id}">${escape(byId.get(id).name)}</button>`).join('')}</div></div>` : ''}`;
    updateSaveDetails();
    for (const button of panel.querySelectorAll('[data-weapon-share]')) button.setAttribute('aria-label', `Copy link to ${weapon.name}`);
  }

  function selectWeapon(id, { focus = false, history: rememberURL = true } = {}) {
    if (!byId.has(id)) return;
    stopWheel();
    selected = id;
    initialCenter = null;
    pendingCenter = true;
    if (rememberURL) writeWeaponURL(id);
    if (currentRoot !== byId.get(id).root) renderFamily(byId.get(id).root);
    renderSelection();
    centerSelection();
    if (focus) stage.querySelector(`[data-weapon-node="${id}"]`).focus({ preventScroll: true });
  }

  function refreshAcquired() {
    for (const button of stage.querySelectorAll('[data-weapon-node]')) {
      const id = button.dataset.weaponNode;
      button.dataset.acquired = String(isAcquired(id));
      button.setAttribute('aria-label', weaponLabel(id));
    }
    const toggle = detail.querySelector('[data-weapon-acquired]');
    toggle.setAttribute('aria-pressed', String(isAcquired(selected)));
    toggle.querySelector('span').textContent = isAcquired(selected) ? 'Acquired' : 'Mark acquired';
    updateGuideHistoryNote();
  }

  familySelect.addEventListener('change', () => selectWeapon(familySelect.value));
  toolRoot.addEventListener('toggle', event => {
    if (event.target.matches('[data-weapon-pair-rules]')) pairState.rulesOpen = event.target.open;
  }, { signal: viewSignal, capture: true });
  panel.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (dialog.open && link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      collapse({ focus: false });
    }
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.weaponNode) selectWeapon(button.dataset.weaponNode);
    else if (button.hasAttribute('data-weapon-pair-use')) {
      pairState[button.dataset.weaponPairUse] = selected;
      updatePair();
      if (dialog.open) collapse({ focus: false });
      tools.showTab('dual', { focus: true, rememberURL: true });
      toolRoot.scrollIntoView({ block: 'start' });
    }
    else if (button.hasAttribute('data-weapon-compare-selected')) {
      if (dialog.open) collapse({ focus: false });
      tools.seedComparison(selected);
      toolRoot.scrollIntoView({ block: 'start' });
    }
    else if (button.dataset.weaponSelect) { selectWeapon(button.dataset.weaponSelect, { focus: true }); closeSearch(); }
    else if (button.hasAttribute('data-weapon-acquired')) {
      guideView.setSideChecklistProgress(byId.get(selected).key, !isAcquired(selected));
    } else if (button.hasAttribute('data-weapon-zoom')) setZoom((zoomMotion?.destination.scale ?? zoom) + Number(button.dataset.weaponZoom) * .25);
    else if (button.hasAttribute('data-weapon-center')) centerSelection();
    else if (button.hasAttribute('data-weapon-expand')) { if (dialog.open) collapse(); else expand(); }
    else if (button.hasAttribute('data-weapon-details-toggle')) setDetails(detailsButton.getAttribute('aria-expanded') !== 'true');
    else if (button.hasAttribute('data-weapon-clear')) { search.value = ''; updateSearch(); search.focus(); }
    else if (button.hasAttribute('data-weapon-share')) { guideView.flushFiltersURL?.(); shareActions.copy(button); }
  });

  function closeSearch() {
    if (results.contains(document.activeElement)) search.focus({ preventScroll: true });
    results.hidden = true;
    search.setAttribute('aria-expanded', 'false');
    search.removeAttribute('aria-activedescendant');
  }

  function renderSearchWindow() {
    searchFrame = 0;
    if (results.hidden || !searchMatches.length || viewSignal.aborted) return;
    const rem = measureGeometry().rem;
    const nextHeight = rem * 4.5;
    if (nextHeight !== resultHeight) {
      results.scrollTop *= nextHeight / resultHeight;
      resultHeight = nextHeight;
      searchRange = '';
    }
    const padding = rem * .3;
    const start = Math.max(0, Math.floor(Math.max(0, results.scrollTop - padding) / resultHeight) - 3);
    const end = Math.min(searchMatches.length, Math.ceil((results.scrollTop + (results.clientHeight || rem * 17)) / resultHeight) + 3);
    const indexes = new Set(Array.from({ length: end - start }, (_, index) => start + index));
    if (activeResult >= 0) indexes.add(activeResult);
    const focused = document.activeElement.closest?.('[data-weapon-result-index]');
    if (focused && results.contains(focused)) indexes.add(Number(focused.dataset.weaponResultIndex));
    const order = [...indexes].sort((a, b) => a - b);
    const range = order.join(',') + ':' + activeResult + ':' + resultHeight;
    if (range === searchRange) return;
    searchRange = range;
    let spacer = results.querySelector('.weapon-search-spacer');
    if (!spacer) {
      spacer = document.createElement('li');
      spacer.className = 'weapon-search-spacer';
      spacer.setAttribute('role', 'presentation');
      spacer.setAttribute('aria-hidden', 'true');
      results.prepend(spacer);
    }
    spacer.style.height = `${searchMatches.length * resultHeight}px`;
    const rows = new Map([...results.querySelectorAll('[data-weapon-result-row]')].map(row => [Number(row.dataset.weaponResultRow), row]));
    for (const [index, row] of rows) if (!indexes.has(index)) row.remove();
    for (const index of order) {
      const weapon = searchMatches[index];
      let row = rows.get(index);
      if (!row) {
        row = document.createElement('li');
        row.dataset.weaponResultRow = index;
        row.setAttribute('role', 'presentation');
        row.innerHTML = `<button type="button" role="option" tabindex="-1" id="weapon-result-${weapon.id}" data-weapon-result-index="${index}" data-weapon-select="${weapon.id}" aria-posinset="${index + 1}" aria-setsize="${searchMatches.length}" aria-label="${escape(weapon.name)}. ${escape(weapon.category)}" title="${escape(weapon.name)} · ${escape(weapon.category)}"><span class="weapon-result-name">${escape(weapon.name)}</span><small>${escape(weapon.category)}</small></button>`;
        const after = [...results.querySelectorAll('[data-weapon-result-row]')].find(row => Number(row.dataset.weaponResultRow) > index);
        results.insertBefore(row, after ?? null);
      }
      row.style.top = `${padding + index * resultHeight}px`;
      row.querySelector('button').setAttribute('aria-selected', String(index === activeResult));
    }
    if (activeResult >= 0) search.setAttribute('aria-activedescendant', `weapon-result-${searchMatches[activeResult].id}`);
    else search.removeAttribute('aria-activedescendant');
  }

  function requestSearchWindow() {
    if (!searchFrame && !viewSignal.aborted) searchFrame = requestAnimationFrame(renderSearchWindow);
  }

  function setActiveResult(index) {
    if (!searchMatches.length) return;
    activeResult = Math.max(0, Math.min(index, searchMatches.length - 1));
    const padding = measureGeometry().rem * .3;
    const top = padding + activeResult * resultHeight;
    if (top < results.scrollTop + padding) results.scrollTop = top - padding;
    else if (top + resultHeight > results.scrollTop + results.clientHeight - padding) {
      results.scrollTop = top + resultHeight - results.clientHeight + padding;
    }
    renderSearchWindow();
  }

  function updateSearch() {
    const query = fold(search.value.trim());
    panel.querySelector('[data-weapon-clear]').hidden = !query;
    activeResult = -1;
    searchRange = '';
    searchMatches = query ? weapons.filter(weapon => fold(weapon.name).includes(query)) : [];
    results.replaceChildren();
    results.scrollTop = 0;
    if (!query) { closeSearch(); searchStatus.textContent = ''; return; }
    results.hidden = false;
    search.setAttribute('aria-expanded', 'true');
    search.removeAttribute('aria-activedescendant');
    if (searchMatches.length) renderSearchWindow();
    else results.innerHTML = '<li class="weapon-search-empty" role="presentation">No weapons match. Try another name.</li>';
    searchStatus.textContent = `${searchMatches.length} matching ${searchMatches.length === 1 ? 'weapon' : 'weapons'}. Use arrow keys to browse, Page Up or Page Down to skip, and Enter to select.`;
  }
  results.addEventListener('scroll', requestSearchWindow, { passive: true });
  results.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-weapon-result-index]')) event.preventDefault();
  });
  search.addEventListener('input', updateSearch);
  search.addEventListener('focus', () => { if (search.value.trim() && results.hidden) updateSearch(); });
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !results.hidden) { closeSearch(); event.preventDefault(); event.stopPropagation(); }
    else if (event.key === 'Escape' && dialog.open) { event.preventDefault(); event.stopPropagation(); collapse(); }
    else if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
      if (['ArrowDown', 'ArrowUp'].includes(event.key) && results.hidden && search.value.trim()) updateSearch();
      if (results.hidden || !searchMatches.length) return;
      const page = Math.max(1, Math.floor(results.clientHeight / resultHeight));
      if (event.key === 'ArrowDown') setActiveResult(activeResult < 0 ? 0 : activeResult + 1);
      else if (event.key === 'ArrowUp') setActiveResult(activeResult < 0 ? searchMatches.length - 1 : activeResult - 1);
      else if (event.key === 'Home' && activeResult >= 0) setActiveResult(0);
      else if (event.key === 'End' && activeResult >= 0) setActiveResult(searchMatches.length - 1);
      else if (event.key === 'PageDown') setActiveResult(activeResult < 0 ? 0 : activeResult + page);
      else if (event.key === 'PageUp') setActiveResult(activeResult < 0 ? 0 : activeResult - page);
      else if (event.key === 'Enter' && activeResult >= 0) {
        selectWeapon(searchMatches[activeResult].id, { focus: true });
        closeSearch();
      } else return;
      event.preventDefault();
    }
  });
  panel.querySelector('.weapon-tree-search').addEventListener('focusout', event => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeSearch();
  });
  panel.querySelector('.weapon-tree-search').addEventListener('keydown', event => {
    if (event.key !== 'Escape' || results.hidden) return;
    search.focus({ preventScroll: true });
    closeSearch();
    event.preventDefault();
    event.stopPropagation();
  });
  function prepareWeaponLink(event) {
    const link = event.target.closest('[data-weapon-tree-select]');
    if (!link || !byId.has(link.dataset.weaponTreeSelect)) return;
    guideView.flushFiltersURL?.();
    link.href = weaponURL(link.dataset.weaponTreeSelect).href;
  }
  // Deferred checklist rows also inherit the current filters for Ctrl-click,
  // keyboard activation and the browser's Copy link action.
  for (const type of ['pointerdown', 'focusin', 'contextmenu']) {
    document.addEventListener(type, prepareWeaponLink, { capture: true, signal: viewSignal });
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('.weapon-tree-search')) closeSearch();
    const link = event.target.closest('[data-weapon-tree-select]');
    if (link && !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      showWeapon(link.dataset.weaponTreeSelect);
    }
  }, { signal: viewSignal });

  function restoreWeaponURL() {
    const id = new URLSearchParams(location.search).get('weapon');
    const next = byId.has(id) ? id : initialWeapon;
    if (next !== selected) selectWeapon(next, { history: false });
    if (location.hash === '#weapon-upgrade-trees') tools?.showTab('tree');
    else if (location.hash === '#weapon-tools') tools?.showTab(new URLSearchParams(location.search).get('weapon-tool') ?? viewState.weaponTools?.tab ?? 'tree');
  }
  window.addEventListener('popstate', restoreWeaponURL, { signal: viewSignal });
  window.addEventListener('hashchange', restoreWeaponURL, { signal: viewSignal });
  window.addEventListener('kenzan:route-change', restoreWeaponURL, { signal: viewSignal });

  stage.addEventListener('keydown', event => {
    const button = event.target.closest('[data-weapon-node]');
    if (!button || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const weapon = byId.get(button.dataset.weaponNode);
    const siblings = byRoot.get(currentRoot).ids.filter(id => byId.get(id).parent === weapon.parent);
    let next;
    if (event.key === 'ArrowLeft') next = weapon.parent;
    if (event.key === 'ArrowRight') next = weapon.children[0];
    if (event.key === 'ArrowUp') next = siblings[siblings.indexOf(weapon.id) - 1];
    if (event.key === 'ArrowDown') next = siblings[siblings.indexOf(weapon.id) + 1];
    if (event.key === 'Home') next = currentRoot;
    if (event.key === 'End') { next = weapon.id; while (byId.get(next).children.length) next = byId.get(next).children.at(-1); }
    if (next) selectWeapon(next, { focus: true });
    event.preventDefault();
  });
  viewport.addEventListener('pointerdown', event => {
    stopWheel();
    suppressClick = false;
    if (viewSignal.aborted || drag || event.button !== 0 || event.pointerType === 'touch' || event.isPrimary === false) return;
    const { width, height } = measureGeometry();
    const rect = viewport.getBoundingClientRect();
    if (event.clientX - rect.left >= width || event.clientY - rect.top >= height) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
  }, { signal: viewSignal });
  viewport.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!(event.buttons & 1)) { stopDrag(event); return; }
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.dataset.dragging = '';
    }
    viewport.scrollLeft = drag.left + drag.x - event.clientX;
    viewport.scrollTop = drag.top + drag.y - event.clientY;
  }, { signal: viewSignal });
  const stopDrag = event => {
    if (!drag || event && event.pointerId !== drag.id) return;
    // Pen implicit capture can transfer from a node to the viewport. The
    // child's bubbled capture loss does not end the viewport's own drag.
    if (event?.type === 'lostpointercapture' && event.target !== viewport) return;
    const previous = drag;
    drag = undefined;
    delete viewport.dataset.dragging;
    if (viewport.hasPointerCapture(previous.id)) viewport.releasePointerCapture(previous.id);
    if (previous.moved) {
      suppressClick = true;
      if (!viewSignal.aborted && event?.type === 'pointerup') viewport.focus({ preventScroll: true });
    }
  };
  // A candidate is uncaptured until it crosses the drag threshold, so its
  // release may happen outside the viewport. End it at the document boundary.
  for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, stopDrag, { capture: true, signal: viewSignal });
  viewport.addEventListener('lostpointercapture', stopDrag, { signal: viewSignal });
  viewport.addEventListener('click', event => {
    if (!suppressClick || !event.detail) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true, signal: viewSignal });
  viewport.addEventListener('dragstart', event => event.preventDefault(), { signal: viewSignal });
  viewport.addEventListener('selectstart', event => event.preventDefault(), { signal: viewSignal });
  viewport.addEventListener('scroll', () => {
    if (zoomMotion && (Math.abs(viewport.scrollLeft - renderedScroll.x) > .75 ||
      Math.abs(viewport.scrollTop - renderedScroll.y) > .75)) stopWheel();
  }, { signal: viewSignal });
  viewport.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', ' '].includes(event.key)) stopWheel();
  }, { capture: true, signal: viewSignal });
  viewport.addEventListener('wheel', event => {
    if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) { stopWheel(); return; }
    const delta = atlasWheelDelta(event, measureGeometry().height);
    // A wheel over the chart always belongs to zoom, including at either limit.
    // Letting it fall through pans the tree or scrolls the surrounding guide.
    if (delta) event.preventDefault();
    if (!delta || drag?.moved) return;
    const rect = viewport.getBoundingClientRect();
    pendingWheel ??= { delta: 0, anchor: { x: event.clientX - rect.left - viewport.clientLeft, y: event.clientY - rect.top - viewport.clientTop } };
    pendingWheel.delta += delta;
    requestZoomFrame();
  }, { passive: false, signal: viewSignal });
  dialog.addEventListener('cancel', event => { event.preventDefault(); collapse(); }, { signal: viewSignal });
  // A queued close from the previous modal session must not collapse a reopen.
  dialog.addEventListener('close', () => { if (!dialog.open) collapse(); }, { signal: viewSignal });
  document.addEventListener('kenzan:side-progress', refreshAcquired, { signal: viewSignal });
  window.addEventListener('storage', refreshAcquired, { signal: viewSignal });
  function restoreInitialView() {
    if (!pendingCenter || !measureGeometry().width) return;
    if (initialCenter) { restoreCenter(initialCenter); pendingCenter = false; }
    else centerSelection();
  }
  let viewportBox = { width: viewport.offsetWidth, height: viewport.offsetHeight };
  const resize = new ResizeObserver(() => {
    const next = { width: viewport.offsetWidth, height: viewport.offsetHeight };
    if (next.width !== viewportBox.width || next.height !== viewportBox.height) stopWheel();
    viewportBox = next;
    geometryDirty = true;
    restoreInitialView();
    requestSearchWindow();
  });
  resize.observe(viewport);
  const searchResize = new ResizeObserver(requestSearchWindow);
  searchResize.observe(results);
  const fontsChanged = () => {
    geometryDirty = true;
    stopWheel();
    requestSearchWindow();
  };
  document.fonts.addEventListener('loadingdone', fontsChanged, { signal: viewSignal });
  window.addEventListener('resize', fontsChanged, { signal: viewSignal });
  viewSignal.addEventListener('abort', () => {
    revealRequest++;
    stopDrag(); suppressClick = false;
    pairPickers.forEach(picker => picker.dispose());
    stopWheel();
    const center = viewCenter();
    collapse({ focus: false });
    viewState.weaponTree = { id: selected, zoom, center };
    resize.disconnect();
    searchResize.disconnect();
    if (searchFrame) cancelAnimationFrame(searchFrame);
  }, { once: true });
  renderFamily(byId.get(selected).root);
  renderSelection();
  dualHost.innerHTML = pairHTML();
  pairPickers = pairRoles.map(role => ({ role, ...mountWeaponPairPicker(dualHost.querySelector(`[data-weapon-pair-picker="${role}"]`), {
    items: pairChoices[role].map(id => byId.get(id)), selected: pairState[role], signal: viewSignal,
    onSelect(id) { pairState[role] = id; updatePair(); },
  }) }));
  updatePair();
  const toolState = viewState.weaponTools ??= {};
  if (byId.has(linkedWeapon) && location.hash === '#weapon-upgrade-trees') toolState.tab = 'tree';
  tools = mountKenzanWeaponTools(toolRoot, { weapons, families, pairs, state: toolState, signal: viewSignal,
    onTabChange: id => {
      revealRequest++;
      stopWheel();
      pairPickers.forEach(picker => picker.close());
      geometryDirty = true;
      if (id === 'tree') requestAnimationFrame(() => { if (!viewSignal.aborted) restoreInitialView(); });
    } });
  requestAnimationFrame(() => { if (!viewSignal.aborted) restoreInitialView(); });

  async function showWeapon(id) {
    if (dialog.open) collapse({ focus: false });
    tools.showTab('tree');
    selectWeapon(id);
    const request = ++revealRequest;
    guideView.open({ reveal: true });
    await settleGuideContent();
    requestAnimationFrame(() => {
      if (viewSignal.aborted || request !== revealRequest || selected !== id || location.hash !== '#weapon-upgrade-trees') return;
      // Explicit checklist navigation must reveal the tree even when only the
      // weapon query changed and normal hash handling preserves scroll.
      toolRoot.scrollIntoView({ block: 'start' });
      geometryDirty = true;
      centerSelection();
      stage.querySelector(`[data-weapon-node="${id}"]`)?.focus({ preventScroll: true });
    });
  }
})();
