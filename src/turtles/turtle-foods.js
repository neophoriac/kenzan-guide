(() => {
  const root = document.querySelector('[data-turtle-foods]');
  if (!root) return;
  const fields = root.querySelector('[data-food-filters]');
  const search = fields.querySelector('[data-food-search]');
  const effect = fields.querySelector('[data-food-effect]');
  const source = fields.querySelector('[data-food-source]');
  const ownedOnly = root.querySelector('[data-food-owned-only]');
  const count = root.querySelector('[data-food-count]');
  const empty = root.querySelector('[data-food-empty]');
  const reset = root.querySelector('[data-food-reset]');
  const rows = [...root.querySelectorAll('[data-food-item]')];
  const saved = viewState.turtleFoods ?? {};
  let exactName = saved.exactName ?? '';
  const fold = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();
  const escape = value => String(value).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"/></svg>';
  const numbers = new Intl.NumberFormat('en');
  const dates = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  let snapshot;

  guideView.updateTurtleFoodSave = next => {
    if (viewSignal.aborted || (next && next === snapshot)) return;
    snapshot = next;
    const note = root.querySelector('[data-food-save-note]');
    const stamp = new Date(snapshot?.observedAt ?? '');
    note.innerHTML = snapshot ? `Ownership from ${escape(snapshot.source ?? 'your save')}${Number.isFinite(stamp.getTime())
      ? ` · Read <time datetime="${stamp.toISOString()}">${escape(dates.format(stamp))}</time>` : ''}. Counts update when you sync or import another save.`
      : '<a href="#save-sync">Sync or import your save</a> to see how much food you have on you and in storage.';
    for (const row of rows) {
      const host = row.querySelector('[data-food-ownership]');
      host.hidden = !snapshot;
      const stock = snapshot?.crafting?.foods?.[row.dataset.itemId];
      const total = stock?.total ?? null;
      const owned = (total ?? stock?.minimum ?? 0) > 0;
      host.dataset.owned = String(owned);
      const label = total === null ? stock?.minimum ? `At least ${numbers.format(stock.minimum)} owned` : 'Count unavailable'
        : total ? `${numbers.format(total)} owned` : 'Not owned · 0';
      host.innerHTML = `${owned ? check : ''}<strong>${label}</strong>${stock
        ? `<span>${stock.onPlayer === null ? 'On-you count unavailable' : `${numbers.format(stock.onPlayer)} on you`} · ${stock.storage === null ? 'Storage count unavailable' : `${numbers.format(stock.storage)} in storage`}</span>` : ''}`;
    }
    filter();
  };

  search.value = saved.search ?? '';
  effect.value = [...effect.options].some(option => option.value === saved.effect) ? saved.effect : 'all';
  source.value = [...source.options].some(option => option.value === saved.source) ? saved.source : 'all';
  ownedOnly.checked = saved.ownedOnly === true;
  root.open = saved.open === true;
  for (const row of rows) if ((saved.sources ?? saved.shops)?.includes(row.id)) {
    const details = row.querySelector('.turtle-food-sources');
    if (details) details.open = true;
  }

  function remember() {
    viewState.turtleFoods = { hash: location.hash, exactName, search: search.value, effect: effect.value, source: source.value, ownedOnly: ownedOnly.checked, open: root.open,
      sources: rows.filter(row => row.querySelector('.turtle-food-sources')?.open).map(row => row.id) };
  }
  function filter() {
    const focused = document.activeElement;
    const focusedRow = root.contains(focused) ? focused.closest('[data-food-item]') : null;
    const focusedEmpty = empty.contains(focused);
    const words = fold(search.value.trim()).split(/\s+/).filter(Boolean);
    let shown = 0;
    let uncertain = 0;
    for (const row of rows) {
      const matches = (!exactName || row.dataset.foodName === exactName)
        && (effect.value === 'all' || (effect.value === 'none' ? !row.dataset.foodStats : row.dataset.foodStats.split(' ').includes(effect.value)))
        && (source.value === 'all' || row.dataset.foodSourceTypes.split(' ').includes(source.value))
        && words.every(word => row.dataset.foodSearch.includes(word));
      const stock = snapshot?.crafting?.foods?.[row.dataset.itemId];
      const owned = (stock?.total ?? stock?.minimum ?? 0) > 0;
      if (matches && !owned && stock?.total == null) uncertain++;
      row.hidden = !matches || (ownedOnly.checked && !owned);
      if (!row.hidden) {
        shown++;
        const image = shown <= 3 ? row.querySelector('img') : null;
        if (image && image.loading !== 'eager') { image.loading = 'eager'; image.decode?.().catch(() => {}); }
      }
    }
    const unread = !snapshot?.crafting?.foods;
    count.textContent = ownedOnly.checked && unread ? snapshot ? 'Ownership unavailable' : 'Ownership not checked'
      : ownedOnly.checked && uncertain ? `${shown} confirmed owned feeding item${shown === 1 ? '' : 's'} shown`
        : `${shown} of ${rows.length} feeding items`;
    empty.hidden = shown > 0;
    const message = !ownedOnly.checked ? 'No foods match. Try another food or place, or choose a different filter.'
      : unread ? `<a href="#save-sync">Sync or import your save${snapshot ? ' again' : ''}</a> to show the food you own.`
        : uncertain ? 'No confirmed owned foods match. Some counts could not be read; sync your save again or clear the filters.'
          : 'No owned foods match. Clear the filters or turn off Owned only.';
    if (empty.innerHTML !== message) empty.innerHTML = message;
    reset.hidden = !search.value && effect.value === 'all' && source.value === 'all' && !ownedOnly.checked;
    remember();
    if (focusedRow?.hidden || (focusedEmpty && (empty.hidden || !focused.isConnected))) ownedOnly.focus({ preventScroll: true });
  }
  function revealLink({ focus = false } = {}) {
    const nameTarget = document.getElementById(location.hash.slice(1));
    const nameRow = location.hash.startsWith('#turtle-food-name-') && root.contains(nameTarget) ? nameTarget?.closest('[data-food-item]') : null;
    const row = nameRow ?? rows.find(row => '#' + row.id === location.hash);
    if (!row && location.hash !== '#turtle-foods') return;
    root.open = true;
    if (nameRow || row?.hidden) { exactName = nameRow?.dataset.foodName ?? ''; search.value = exactName; effect.value = 'all'; source.value = 'all'; ownedOnly.checked = false; filter(); }
    remember();
    if (focus) requestAnimationFrame(() => {
      const target = row ?? root;
      if (!viewSignal.aborted && (location.hash === '#' + target.id || (nameRow && location.hash === '#' + nameTarget.id))) {
        target.scrollIntoView({ block: 'start' });
        (row ?? root.querySelector('summary')).focus({ preventScroll: true });
      }
    });
  }
  fields.hidden = false;
  fields.addEventListener('submit', event => event.preventDefault(), { signal: viewSignal });
  search.addEventListener('input', () => { exactName = ''; filter(); }, { signal: viewSignal });
  effect.addEventListener('change', filter, { signal: viewSignal });
  source.addEventListener('change', filter, { signal: viewSignal });
  ownedOnly.addEventListener('change', filter, { signal: viewSignal });
  reset.addEventListener('click', () => {
    exactName = ''; search.value = ''; effect.value = 'all'; source.value = 'all'; ownedOnly.checked = false;
    filter(); search.focus();
  }, { signal: viewSignal });
  root.addEventListener('toggle', remember, { capture: true, signal: viewSignal });
  window.addEventListener('hashchange', () => revealLink({ focus: true }), { signal: viewSignal });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#turtle-food"]');
    if (link?.hash === location.hash) revealLink({ focus: true });
  }, { signal: viewSignal });
  filter();
  if (saved.hash !== location.hash) revealLink();
})();
