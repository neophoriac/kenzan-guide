(() => {
  const root = document.querySelector('[data-weapon-materials]');
  if (!root) return;
  const fields = root.querySelector('[data-forging-filters]');
  const search = root.querySelector('[data-forging-search]');
  const kind = root.querySelector('[data-forging-kind]');
  const source = root.querySelector('[data-forging-source]');
  const ownedOnly = root.querySelector('[data-forging-owned-only]');
  const count = root.querySelector('[data-forging-count]');
  const reset = root.querySelector('[data-forging-reset]');
  const empty = root.querySelector('[data-forging-empty]');
  const rows = [...root.querySelectorAll('[data-forging-item]')];
  const fold = text => String(text).normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();
  const saved = viewState.forgingMaterials ?? {};
  root.open = saved.expanded === true;
  let lastSnapshot;
  const escape = value => String(value).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const check = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"/></svg>';
  const numbers = new Intl.NumberFormat('en');
  const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  guideView.updateCraftingSave = snapshot => {
    if (viewSignal.aborted || snapshot === lastSnapshot) return;
    lastSnapshot = snapshot;
    const note = root.querySelector('[data-forging-save-note]');
    const stamp = new Date(snapshot?.observedAt ?? '');
    note.innerHTML = snapshot ? `Ownership from ${escape(snapshot.source)}${Number.isFinite(stamp.getTime())
      ? ` · Read <time datetime="${stamp.toISOString()}">${escape(dateFormat.format(stamp))}</time>` : ''}. Counts update when you sync or import another save.`
      : '<a href="#save-sync">Sync or import your save</a> to see what you own, on you and in storage.';
    for (const row of rows) {
      const host = row.querySelector('[data-forging-ownership]');
      host.hidden = !snapshot;
      const id = row.dataset.itemId;
      if (row.dataset.kind === 'book') {
        const owned = snapshot?.crafting?.books?.[id] ?? null;
        host.dataset.owned = String(owned === true);
        host.innerHTML = `${owned === true ? check : ''}<strong>${owned === null ? 'Ownership unavailable' : owned ? 'Owned' : 'Not owned'}</strong>`;
      } else {
        const stock = snapshot?.crafting?.materials?.[id];
        const total = stock?.total ?? null;
        host.dataset.owned = String((total ?? stock?.minimum ?? 0) > 0);
        const title = total === null ? stock?.minimum ? `At least ${numbers.format(stock.minimum)} owned` : 'Count unavailable'
          : total ? `${numbers.format(total)} owned` : 'Not owned · 0';
        host.innerHTML = `${host.dataset.owned === 'true' ? check : ''}<strong>${title}</strong>${stock
          ? `<span>${stock.onPlayer === null ? 'On-you count unavailable' : `${numbers.format(stock.onPlayer)} on you`} · ${stock.storage === null ? 'Storage count unavailable' : `${numbers.format(stock.storage)} in storage`}</span>` : ''}`;
      }
    }
    filter();
  };
  search.value = saved.search ?? '';
  kind.value = ['all', 'material', 'book'].includes(saved.kind) ? saved.kind : 'material';
  source.value = ['all', 'fixed', 'random', 'shop'].includes(saved.source) ? saved.source : 'all';
  ownedOnly.checked = saved.ownedOnly === true;
  for (const row of rows) if (saved.open?.includes(row.id)) row.querySelector('details').open = true;

  function filter() {
    const focused = document.activeElement;
    const focusedRow = root.contains(focused) ? focused.closest('[data-forging-item]') : null;
    const focusedEmpty = empty.contains(focused);
    const words = fold(search.value.trim()).split(/\s+/).filter(Boolean);
    let shown = 0;
    let uncertain = 0;
    for (const row of rows) {
      const matches = (kind.value === 'all' || row.dataset.kind === kind.value)
        && (source.value === 'all' || row.dataset.sourceTypes.split(' ').includes(source.value))
        && words.every(word => row.dataset.materialSearch.includes(word));
      const id = row.dataset.itemId;
      const stock = lastSnapshot?.crafting?.materials?.[id];
      const isOwned = row.dataset.kind === 'book' ? lastSnapshot?.crafting?.books?.[id] === true
        : (stock?.total ?? stock?.minimum ?? 0) > 0;
      const unknown = row.dataset.kind === 'book' ? typeof lastSnapshot?.crafting?.books?.[id] !== 'boolean'
        : !isOwned && (stock?.total === null || stock?.total === undefined);
      if (matches && unknown) uncertain++;
      const visible = matches && (!ownedOnly.checked || isOwned);
      row.hidden = !visible;
      shown += Number(visible);
      const image = visible && shown <= 3 ? row.querySelector('img') : null;
      if (image && image.loading !== 'eager') {
        image.loading = 'eager';
        image.decode?.().catch(() => {});
      }
    }
    const total = rows.filter(row => kind.value === 'all' || row.dataset.kind === kind.value).length;
    const noun = kind.value === 'material' ? 'material' : kind.value === 'book' ? 'book' : 'ingredient';
    const noOwnership = !lastSnapshot?.crafting;
    count.textContent = ownedOnly.checked && noOwnership ? lastSnapshot ? 'Ownership unavailable' : 'Ownership not checked'
      : ownedOnly.checked && uncertain ? `${shown} confirmed owned ${noun}${shown === 1 ? '' : 's'} shown`
        : `${shown} of ${total} ${noun}${total === 1 ? '' : 's'}`;
    empty.hidden = shown > 0;
    const emptyMessage = !ownedOnly.checked ? 'No matching ingredients. Try another name or choose a different source.'
      : noOwnership ? `<a href="#save-sync">Sync or import your save${lastSnapshot ? ' again' : ''}</a> to show what you own.`
        : uncertain ? 'No confirmed owned ingredients match. Some ownership could not be read; sync your save again or clear the filters.'
          : 'No owned ingredients match these filters. Clear the filters or turn off Owned only.';
    if (empty.innerHTML !== emptyMessage) empty.innerHTML = emptyMessage;
    reset.hidden = !search.value && kind.value === 'material' && source.value === 'all' && !ownedOnly.checked;
    viewState.forgingMaterials = { expanded: root.open, hash: location.hash, search: search.value, kind: kind.value, source: source.value, ownedOnly: ownedOnly.checked,
      open: rows.filter(row => row.querySelector('details').open).map(row => row.id) };
    if (focusedRow?.hidden || (focusedEmpty && (empty.hidden || !focused.isConnected))) ownedOnly.focus({ preventScroll: true });
  }
  function revealLink({ focus = false } = {}) {
    const row = rows.find(row => '#' + row.id === location.hash);
    if (!row && location.hash !== '#weapon-materials') return;
    root.open = true;
    if (row?.hidden) {
      search.value = '';
      kind.value = row.dataset.kind;
      source.value = 'all';
      ownedOnly.checked = false;
      filter();
    }
    filter();
    if (focus) requestAnimationFrame(() => {
      const target = row ?? root;
      if (!viewSignal.aborted && location.hash === '#' + target.id) {
        target.scrollIntoView({ block: 'start' });
        (row ?? root.querySelector('summary')).focus({ preventScroll: true });
      }
    });
  }
  fields.hidden = false;
  fields.addEventListener('submit', event => event.preventDefault(), { signal: viewSignal });
  search.addEventListener('input', filter, { signal: viewSignal });
  kind.addEventListener('change', filter, { signal: viewSignal });
  source.addEventListener('change', filter, { signal: viewSignal });
  ownedOnly.addEventListener('change', filter, { signal: viewSignal });
  root.addEventListener('toggle', event => { if (event.target === root || event.target.matches('.forging-uses')) filter(); }, { capture: true, signal: viewSignal });
  reset.addEventListener('click', () => {
    search.value = ''; kind.value = 'material'; source.value = 'all'; ownedOnly.checked = false;
    filter(); search.focus();
  }, { signal: viewSignal });
  window.addEventListener('hashchange', () => revealLink({ focus: true }), { signal: viewSignal });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#forging-"], a[href="#weapon-materials"]');
    if (link?.hash === location.hash) revealLink({ focus: true });
  }, { signal: viewSignal });
  filter();
  if (saved.hash !== location.hash) revealLink();
})();
