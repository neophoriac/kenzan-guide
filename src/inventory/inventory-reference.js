(() => {
  const root = document.querySelector('[data-inventory-reference]');
  if (!root) return;
  const form = root.querySelector('[data-inventory-filters]');
  const search = form.elements['inventory-search'];
  const use = form.elements['inventory-use'];
  const source = form.elements['inventory-source'];
  const list = root.querySelector('.inventory-item-list');
  const count = root.querySelector('[data-inventory-count]');
  const reset = root.querySelector('[data-inventory-reset]');
  const unverified = root.querySelector('[data-inventory-unverified]');
  const unknownNote = root.querySelector('[data-inventory-unknown-note]');
  const empty = root.querySelector('[data-inventory-empty]');
  const tabs = [...root.querySelectorAll('[data-inventory-tab-button]')];
  const fold = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();
  // Preserve static, escaped markup; only the scroll window remains in the DOM.
  const records = [...list.querySelectorAll('[data-inventory-item]')].map(row => ({
    id: row.id, itemId: row.dataset.itemId, name: row.querySelector('h3').textContent, aliases: row.dataset.inventoryAliases.split(' '),
    redirects: (row.dataset.inventoryRedirects ?? '').split(' ').filter(Boolean), html: row.outerHTML,
    tab: row.dataset.inventoryTab, uses: JSON.parse(row.dataset.inventoryUses),
    sources: row.dataset.inventorySources.split(' '), known: row.dataset.inventoryKnown === 'true', search: row.dataset.inventorySearch,
  }));
  const saved = viewState.inventoryReference ?? {};
  let tab = ['all', 'Items', 'Valuables'].includes(saved.tab) ? saved.tab : 'all';
  const openPanels = new Set(saved.openPanels ?? []);
  let matching = [];
  search.value = saved.search ?? '';
  use.value = [...use.options].some(option => option.value === saved.use) ? saved.use : 'all';
  source.value = [...source.options].some(option => option.value === saved.source) ? saved.source : 'all';
  unverified.checked = saved.unverified === true || source.value === 'unknown';
  root.open = saved.expanded === true;
  const windowed = createWindowedList({ list, signal: viewSignal,
    estimateHeight: () => parseFloat(getComputedStyle(document.documentElement).fontSize) * 24,
    overscan: 2,
    renderRow(record) {
      const template = document.createElement('template'); template.innerHTML = record.html;
      const row = template.content.firstElementChild;
      for (const panel of row.querySelectorAll('[data-inventory-panel]')) panel.open = openPanels.has(panel.dataset.inventoryPanel);
      return row;
    } });

  function remember() {
    viewState.inventoryReference = { expanded: root.open, search: search.value, use: use.value, source: source.value,
      unverified: unverified.checked, tab, scrollTop: list.scrollTop, openPanels: [...openPanels] };
  }

  function matches(record) {
    const words = fold(search.value).trim().split(/\s+/).filter(Boolean);
    return (unverified.checked || record.known) && (tab === 'all' || record.tab === tab)
      && (use.value === 'all' || record.uses.includes(use.value))
      && (source.value === 'all' || (source.value === 'unknown' ? !record.known : record.sources.includes(source.value)))
      && words.every(word => record.search.includes(word));
  }

  function render(resetScroll = false) {
    matching = records.filter(matches);
    windowed.setItems(matching, { resetScroll });
    count.textContent = `${matching.length} ${matching.length === 1 ? 'entry' : 'entries'}`;
    empty.hidden = matching.length > 0;
    unknownNote.hidden = !unverified.checked;
    reset.hidden = !(search.value || use.value !== 'all' || source.value !== 'all' || tab !== 'all' || unverified.checked);
    for (const button of tabs) button.setAttribute('aria-pressed', String(button.dataset.inventoryTabButton === tab));
    remember();
  }

  function filter() {
    const url = new URL(location.href);
    if (url.searchParams.has('inventory')) {
      url.searchParams.delete('inventory');
      try { history.replaceState(history.state, '', url); } catch { /* Filtering still works in this view. */ }
    }
    render(true);
  }
  function reveal({ focus = false } = {}) {
    const id = location.hash.slice(1);
    const named = id === root.id ? new URLSearchParams(location.search).get('inventory') : undefined;
    const sameName = named && records.filter(record => fold(record.name) === fold(named));
    const match = /^inventory-item-(\d+)$/.exec(id);
    const record = match && records.find(record => record.aliases.includes(match[1]) || record.redirects.includes(match[1]));
    if (!record && id !== root.id) return;
    root.open = true;
    if (sameName?.length) {
      search.value = named; use.value = 'all'; source.value = 'all'; tab = 'all';
      unverified.checked = sameName.some(record => !record.known);
    }
    if (record) {
      if (!matches(record)) {
        search.value = ''; use.value = 'all'; source.value = 'all'; tab = 'all';
        unverified.checked = !record.known;
      }
    }
    render();
    if (record) windowed.revealIndex(matching.indexOf(record));
    if (focus) requestAnimationFrame(() => {
      if (viewSignal.aborted || location.hash.slice(1) !== id) return;
      const target = record ? document.getElementById(record.id) : root.querySelector(':scope > summary');
      target?.scrollIntoView({ block: 'start' });
      target?.focus({ preventScroll: true });
    });
  }

  guideView.revealInventoryLink = reveal;
  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault(), { signal: viewSignal });
  search.addEventListener('input', filter, { signal: viewSignal });
  use.addEventListener('change', filter, { signal: viewSignal });
  source.addEventListener('change', () => { if (source.value === 'unknown') unverified.checked = true; filter(); }, { signal: viewSignal });
  unverified.addEventListener('change', () => { if (!unverified.checked && source.value === 'unknown') source.value = 'all'; filter(); }, { signal: viewSignal });
  for (const button of tabs) button.addEventListener('click', () => { tab = button.dataset.inventoryTabButton; filter(); }, { signal: viewSignal });
  reset.addEventListener('click', () => {
    search.value = ''; use.value = 'all'; source.value = 'all'; unverified.checked = false; tab = 'all';
    filter(); search.focus();
  }, { signal: viewSignal });
  root.addEventListener('toggle', event => {
    if (event.target === root) remember();
    else if (event.target.dataset.inventoryPanel) {
      const key = event.target.dataset.inventoryPanel;
      if (event.target.open) openPanels.add(key); else openPanels.delete(key);
      remember();
    }
  }, { capture: true, signal: viewSignal });
  document.addEventListener('click', event => {
    const named = event.target.closest('a[data-inventory-name]');
    if (named && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      const url = new URL(location.href);
      url.searchParams.set('inventory', named.dataset.inventoryName);
      url.hash = root.id;
      if (url.href !== location.href) history.pushState(null, '', url);
      window.dispatchEvent(new Event('kenzan:route-change'));
      reveal({ focus: true });
      return;
    }
    const anchor = event.target.closest('a[href^="#inventory-item-"], a[href="#items-valuables"]');
    if (anchor && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && anchor.hash === location.hash) reveal({ focus: true });
  }, { signal: viewSignal });
  for (const name of ['hashchange', 'popstate', 'kenzan:route-change']) {
    window.addEventListener(name, () => reveal({ focus: true }), { signal: viewSignal });
  }
  viewSignal.addEventListener('abort', remember, { once: true });
  render();
  if (Number.isFinite(saved.scrollTop)) { list.scrollTop = Math.max(0, saved.scrollTop); windowed.refresh(); }
  reveal();
})();
