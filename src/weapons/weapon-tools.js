function mountKenzanWeaponTools(root, { weapons, families, pairs, state, signal, onTabChange }) {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const byId = new Map(weapons.map(weapon => [weapon.id, weapon]));
  const tabs = [...root.querySelectorAll('[data-weapon-tab]')];
  const panes = [...root.querySelectorAll('[data-weapon-pane]')];
  const owned = root.querySelector('[data-weapon-pane="owned"]');
  const compare = root.querySelector('[data-weapon-pane="compare"]');
  const katana = new Set(pairs.roles.first.completionWeaponIds);
  const kodachi = new Set(pairs.roles.second.completionWeaponIds);
  const groupOf = weapon => katana.has(weapon.id) ? 'Katana' : kodachi.has(weapon.id) ? 'Kodachi'
    : weapon.category.startsWith('Odachi') ? 'Odachi' : weapon.category;
  const groups = [...new Set(weapons.map(groupOf))];
  const fold = value => value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase().trim();
  const number = new Intl.NumberFormat();
  const time = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const comparison = state.comparison ??= {};
  if (!groups.includes(comparison.group)) comparison.group = 'Katana';
  let snapshot;
  let pickers = [];
  const options = { signal };
  const groupOptions = (all = false) => `${all ? '<option value="">All weapon groups</option>' : ''}${groups.map(group => `<option value="${escape(group)}">${escape(group)}</option>`).join('')}`;

  owned.innerHTML = `<div class="weapon-tree-heading"><h3>My weapons</h3><span data-owned-count></span></div>
    <p class="weapon-tool-intro">See which weapons are present in your save, including extra copies and their saved equipment sets. Acquisition checkmarks are separate: a weapon stays checked after you sell it or use it in a recipe.</p>
    <div data-owned-source></div>
    <p class="weapon-tool-note" data-owned-attack-note hidden></p>
    <p class="weapon-tool-note">Lists the 227 weapons covered by this guide. Other equipment and temporary weapons are not included. An equipment set is a saved combination of gear; its assignments can differ from what you have equipped during gameplay.</p>
    <div class="weapon-tool-fields" data-owned-filters hidden><label for="owned-weapon-search">Find an owned weapon<input type="search" id="owned-weapon-search" name="owned-weapon-search" autocomplete="off" spellcheck="false" placeholder="Search your weapons…"></label><label for="owned-weapon-group">Weapon group<select id="owned-weapon-group" name="owned-weapon-group">${groupOptions(true)}</select></label></div>
    <p class="weapon-tool-note" data-owned-status role="status"></p><ul class="weapon-owned-list" data-owned-list></ul>`;
  compare.innerHTML = `<div class="weapon-tree-heading"><h3>Compare weapons</h3></div>
    <p class="weapon-tool-intro">Choose two weapons from the same group to compare their base stats side by side. Use Upgrade family to narrow the choices to one blacksmith tree.</p>
    <div class="weapon-tool-fields"><label for="weapon-compare-group">Weapon group<select id="weapon-compare-group" name="weapon-compare-group">${groupOptions()}</select></label><label for="weapon-compare-family">Upgrade family<select id="weapon-compare-family" name="weapon-compare-family"></select></label></div>
    <p class="weapon-tool-note">Katana and kodachi are separate groups. Other groups follow the in-game weapon checklist.</p>
    <p class="weapon-tool-note" data-compare-status role="status"></p><div class="weapon-pair-fields" data-compare-choices></div>
    <div data-compare-result role="status" aria-live="polite" aria-atomic="true"></div>
    <p class="weapon-pair-caveat" id="weapon-compare-caveat">These are individual base menu stats, not final damage or dual-sword totals. Force’s full combat effect is not yet verified. A larger number alone does not account for special effects or the move you use.</p>`;
  const ownedSearch = owned.querySelector('#owned-weapon-search');
  const ownedGroup = owned.querySelector('#owned-weapon-group');
  const ownedList = owned.querySelector('[data-owned-list]');
  const ownedWindow = createWindowedList({ list: ownedList, signal,
    estimateHeight: () => parseFloat(getComputedStyle(document.documentElement).fontSize) * 15,
    columns: () => getComputedStyle(ownedList).gridTemplateColumns.split(' ').length,
    renderRow(html) { const template = document.createElement('template'); template.innerHTML = html; return template.content.firstElementChild; } });
  const compareGroup = compare.querySelector('#weapon-compare-group');
  const compareFamily = compare.querySelector('#weapon-compare-family');
  ownedSearch.value = state.ownedSearch ?? '';
  ownedGroup.value = groups.includes(state.ownedGroup) ? state.ownedGroup : '';

  function showTab(id, { focus = false, rememberURL = false } = {}) {
    if (!tabs.some(tab => tab.dataset.weaponTab === id)) id = 'tree';
    closePickers();
    onTabChange?.(id);
    state.tab = id;
    for (const tab of tabs) {
      const active = tab.dataset.weaponTab === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const pane of panes) pane.hidden = pane.dataset.weaponPane !== id;
    if (rememberURL) {
      const url = new URL(location.href);
      if (id === 'tree') url.searchParams.delete('weapon-tool');
      else url.searchParams.set('weapon-tool', id);
      url.hash = id === 'tree' ? 'weapon-upgrade-trees' : 'weapon-tools';
      if (url.href !== location.href) history.pushState(history.state, '', url);
    }
    if (focus) {
      const heading = panes.find(pane => pane.dataset.weaponPane === id).querySelector('h3');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  root.querySelector('[role="tablist"]').addEventListener('click', event => {
    const tab = event.target.closest('[data-weapon-tab]');
    if (tab) showTab(tab.dataset.weaponTab, { rememberURL: true });
  }, options);
  root.querySelector('[role="tablist"]').addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    showTab(tabs[next].dataset.weaponTab, { rememberURL: true });
    tabs[next].focus({ preventScroll: true });
  }, options);

  function renderOwned() {
    const focused = document.activeElement;
    const focusedRow = focused?.closest('[data-owned-weapon]');
    const focusedId = owned.contains(focusedRow) ? focusedRow.dataset.ownedWeapon : undefined;
    const focusedFilter = owned.contains(focused) && focused.closest('[data-owned-filters]');
    const restoreFocus = () => {
      if (focusedFilter && owned.querySelector('[data-owned-filters]').hidden) {
        const heading = owned.querySelector('h3');
        heading.tabIndex = -1; heading.focus({ preventScroll: true }); return;
      }
      if (!focusedId || focused.isConnected) return;
      const row = owned.querySelector(`[data-owned-weapon="${focusedId}"]`);
      const replacement = row?.querySelector(focused.tagName === 'A' ? 'a' : 'button');
      const fallback = owned.querySelector('[data-owned-filters]').hidden ? owned.querySelector('h3') : ownedSearch;
      if (!replacement && fallback.tagName === 'H3') fallback.tabIndex = -1;
      (replacement ?? fallback).focus({ preventScroll: true });
    };
    const data = snapshot?.weapons;
    const known = data?.known && weapons.every(weapon => Number.isInteger(data.byItemId[weapon.itemId]?.count));
    const stamp = new Date(snapshot?.observedAt ?? '');
    const dated = Number.isFinite(stamp.getTime()) ? `<p class="weapon-snapshot-source">${escape(snapshot.source ?? 'Save')} · Read <time datetime="${stamp.toISOString()}">${escape(time.format(stamp))}</time></p>` : '';
    owned.querySelector('[data-owned-source]').innerHTML = `${dated}${known ? '<p class="weapon-tool-note">Ownership reflects this save snapshot, not live gameplay.</p>' : `<p>${snapshot ? 'Weapon ownership could not be read from this save. ' : ''}<a href="#save-sync">Sync or import your save</a> to see your weapons.</p>`}`;
    owned.querySelector('[data-owned-filters]').hidden = !known;
    const attackNote = owned.querySelector('[data-owned-attack-note]');
    attackNote.hidden = !known;
    const power = data?.characterPower;
    const bonus = Number.isInteger(power) && power >= 0 && power <= 0xffff ? Math.floor(power / 10) : null;
    attackNote.textContent = bonus === null
      ? 'Character power could not be read. Sync or import your save again to calculate Equipment-menu Attack. Base stats remain available.'
      : `Equipment-menu Attack adds your saved character-power bonus (+${number.format(bonus)}) to Base Attack. This is a single-weapon preview, not damage per hit; kodachi depend on their paired katana.`;
    const list = owned.querySelector('[data-owned-list]');
    const status = owned.querySelector('[data-owned-status]');
    if (!known) {
      owned.querySelector('[data-owned-count]').textContent = '';
      status.textContent = ''; ownedWindow.setItems([]); restoreFocus();
      return;
    }
    const all = weapons.filter(weapon => data.byItemId[weapon.itemId].count > 0);
    const copies = all.reduce((sum, weapon) => sum + data.byItemId[weapon.itemId].count, 0);
    owned.querySelector('[data-owned-count]').textContent = `${number.format(all.length)} distinct weapons · ${number.format(copies)} ${copies === 1 ? 'copy' : 'copies'}`;
    const tokens = fold(ownedSearch.value).split(/\s+/).filter(Boolean);
    const filtered = all.filter(weapon => (!ownedGroup.value || groupOf(weapon) === ownedGroup.value)
      && tokens.every(token => fold(weapon.name).includes(token)));
    status.textContent = !all.length ? 'This save contains none of the weapons covered by this guide.'
      : !filtered.length ? 'No owned weapons match. Try another name or weapon group.'
        : `${filtered.length} matching weapons.`;
    const rows = filtered.map(weapon => {
      const record = data.byItemId[weapon.itemId];
      const sets = [...new Set(record.instances.flatMap(instance => instance.assignments.map(assignment => assignment.set)))].sort();
      const assignment = sets.length ? `Equipment set${sets.length > 1 ? 's' : ''} ${sets.join(' and ')}${sets.includes(data.activeSet) ? ` · set ${data.activeSet} selected in this save` : ''}`
        : record.assigned === false ? 'Not assigned to an equipment set' : 'Equipment-set assignment unavailable';
      const paired = kodachi.has(weapon.id);
      const menuAttack = paired ? null : window.getKenzanEquipmentMenuAttack(weapon.stats.attack, power);
      const menuState = paired ? 'pair' : menuAttack === null ? 'unknown' : 'known';
      const menuValue = paired ? 'Pair-dependent' : menuAttack === null ? 'Unavailable' : number.format(menuAttack);
      return `<li data-owned-weapon="${weapon.id}"><img src="${escape(weapon.image)}" width="64" height="64" alt="" loading="lazy" decoding="async" draggable="false"><div class="weapon-owned-identity"><a href="?weapon=${encodeURIComponent(weapon.id)}#weapon-upgrade-trees" data-weapon-tree-select="${weapon.id}">${escape(weapon.name)}</a><span>${escape(groupOf(weapon))} · ${record.count} ${record.count === 1 ? 'copy' : 'copies'}</span><dl class="weapon-owned-attack" aria-label="Attack values"><div><dt>Base Attack</dt><dd data-owned-base-attack>${number.format(weapon.stats.attack)}</dd></div><div><dt>Equipment-menu Attack</dt><dd data-owned-menu-attack data-state="${menuState}">${menuValue}</dd></div></dl><span class="weapon-owned-stats">Force <b>${weapon.stats.force}</b> · Speed ${escape(weapon.stats.speed)}</span><span>${escape(assignment)}</span></div><button type="button" class="weapon-tool-action" data-owned-compare="${weapon.id}" aria-label="Compare ${escape(weapon.name)}">Compare</button></li>`;
    });
    ownedWindow.setItems(rows);
    if (focusedId) ownedWindow.revealIndex(filtered.findIndex(weapon => weapon.id === focusedId));
    restoreFocus();
  }
  for (const input of [ownedSearch, ownedGroup]) input.addEventListener(input === ownedSearch ? 'input' : 'change', () => {
    state.ownedSearch = ownedSearch.value; state.ownedGroup = ownedGroup.value; owned.querySelector('[data-owned-list]').scrollTop = 0; renderOwned();
  }, options);
  owned.addEventListener('click', event => {
    const button = event.target.closest('[data-owned-compare]');
    if (button) seedComparison(button.dataset.ownedCompare);
  }, options);

  function comparisonItems() {
    return weapons.filter(weapon => groupOf(weapon) === comparison.group
      && (!comparison.family || weapon.root === comparison.family));
  }
  function choiceHTML(role, label, weapon) {
    const id = `weapon-compare-${role}`;
    return `<div class="weapon-pair-choice" data-compare-picker="${role}"><label for="${id}">${label}</label><div class="weapon-pair-input"><input type="text" id="${id}" name="${id}" data-weapon-pair-role="${role}" role="combobox" aria-label="${label}" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-describedby="${id}-selected weapon-compare-caveat" autocomplete="off" spellcheck="false" placeholder="Type a weapon name…"><button type="button" data-weapon-pair-toggle tabindex="-1" aria-label="Show ${label.toLowerCase()} choices" title="Show choices"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div><p class="sr-only" data-weapon-pair-search-status role="status"></p><div class="weapon-pair-preview"><img src="${escape(weapon.image)}" width="128" height="128" alt="" decoding="async" draggable="false"><div><p class="weapon-pair-current" id="${id}-selected">Selected: <strong>${escape(weapon.name)}</strong></p></div></div><a class="weapon-text-link weapon-comparison-view" data-compare-view="${role}" data-weapon-tree-select="${weapon.id}" href="?weapon=${encodeURIComponent(weapon.id)}#weapon-upgrade-trees">View weapon</a></div>`;
  }
  function updateComparison() {
    const first = byId.get(comparison.first), second = byId.get(comparison.second);
    for (const role of ['first', 'second']) {
      const weapon = byId.get(comparison[role]);
      const host = compare.querySelector(`[data-compare-picker="${role}"]`);
      host.querySelector('.weapon-pair-current strong').textContent = weapon.name;
      host.querySelector('img').src = weapon.image;
      const link = host.querySelector('[data-compare-view]');
      link.dataset.weaponTreeSelect = weapon.id;
      link.href = `?weapon=${encodeURIComponent(weapon.id)}#weapon-upgrade-trees`;
      link.setAttribute('aria-label', `View ${weapon.name} in the upgrade tree`);
    }
    const delta = key => second.stats[key] - first.stats[key];
    const readingCell = (key, role, weapon, value, difference = '') => `<td role="cell" headers="weapon-compare-${key}-heading weapon-compare-${role}-heading"><span class="weapon-compare-label" aria-hidden="true"><span>${role === 'first' ? 'First weapon' : 'Second weapon'}</span>${escape(weapon.name)}</span><span class="weapon-compare-reading">${escape(value)}${difference ? ` <small>${escape(difference)}</small>` : ''}</span></td>`;
    const numericCells = key => readingCell(key, 'first', first, first.stats[key])
      + readingCell(key, 'second', second, second.stats[key], delta(key) === 0 ? 'Same' : `${delta(key) > 0 ? '+' : '−'}${Math.abs(delta(key))}`);
    const statRow = (key, label, cells) => `<tr role="row"><th id="weapon-compare-${key}-heading" scope="row" role="rowheader">${label}</th>${cells}</tr>`;
    compare.querySelector('[data-compare-result]').innerHTML = `<table class="weapon-compare-table" role="table"><caption>Base menu stats. Differences are the second weapon minus the first.</caption><thead role="rowgroup"><tr role="row"><th id="weapon-compare-stat-heading" scope="col" role="columnheader">Stat</th><th id="weapon-compare-first-heading" scope="col" role="columnheader"><span class="sr-only">First weapon: </span>${escape(first.name)}</th><th id="weapon-compare-second-heading" scope="col" role="columnheader"><span class="sr-only">Second weapon: </span>${escape(second.name)}</th></tr></thead><tbody role="rowgroup">${statRow('attack', 'Attack', numericCells('attack'))}${statRow('force', 'Force', numericCells('force'))}${statRow('speed', 'Speed', readingCell('speed', 'first', first, first.stats.speed) + readingCell('speed', 'second', second, second.stats.speed, first.stats.speed === second.stats.speed ? 'Same' : ''))}</tbody></table>`;
  }
  function renderComparison(message = '') {
    pickers.forEach(picker => picker.dispose()); pickers = [];
    compareGroup.value = comparison.group;
    const familyOptions = families.filter(family => family.ids.some(id => groupOf(byId.get(id)) === comparison.group));
    if (!familyOptions.some(family => family.id === comparison.family)) comparison.family = '';
    compareFamily.innerHTML = `<option value="">All upgrade families</option>${familyOptions.map(family => `<option value="${family.id}">${escape(family.name)}${family.ids.length === 1 ? ' · standalone' : ''}</option>`).join('')}`;
    compareFamily.value = comparison.family;
    const items = comparisonItems(), ids = new Set(items.map(weapon => weapon.id));
    if (!ids.has(comparison.first)) comparison.first = items[0].id;
    if (!ids.has(comparison.second)) comparison.second = (items.find(weapon => weapon.id !== comparison.first) ?? items[0]).id;
    compare.querySelector('[data-compare-status]').textContent = `${message}${message ? ' ' : ''}${items.length === 1 ? 'This family contains one weapon. Choose All upgrade families to compare it with another weapon in this group.' : `${items.length} weapons available.`}`;
    compare.querySelector('[data-compare-choices]').innerHTML = ['first', 'second'].map(role => choiceHTML(role, role === 'first' ? 'First weapon' : 'Second weapon', byId.get(comparison[role]))).join('');
    pickers = ['first', 'second'].map(role => mountWeaponPairPicker(compare.querySelector(`[data-compare-picker="${role}"]`), {
      items, selected: comparison[role], signal,
      onSelect(id) { comparison[role] = id; updateComparison(); },
    }));
    updateComparison();
  }
  compareGroup.addEventListener('change', () => {
    comparison.group = compareGroup.value; comparison.family = '';
    renderComparison('Weapon group changed; the two selections now use this group.');
  }, options);
  compareFamily.addEventListener('change', () => {
    comparison.family = compareFamily.value;
    renderComparison('Family filter changed; selections outside it have been replaced.');
  }, options);
  function seedComparison(id) {
    const weapon = byId.get(id);
    if (!weapon) return;
    comparison.group = groupOf(weapon); comparison.family = ''; comparison.first = id;
    renderComparison(`${weapon.name} is the first weapon.`);
    showTab('compare', { focus: true, rememberURL: true });
  }
  function closePickers() { pickers.forEach(picker => picker.close()); }
  signal.addEventListener('abort', () => pickers.forEach(picker => picker.dispose()), { once: true });
  const requestedTab = new URLSearchParams(location.search).get('weapon-tool');
  renderOwned(); renderComparison(); showTab(requestedTab ?? state.tab ?? 'tree');
  return { showTab, seedComparison, closePickers, setSnapshot(value) { snapshot = value; renderOwned(); } };
}
