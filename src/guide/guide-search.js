// One lifecycle-bound search presenter. The index is static reference data;
// choosing a result delegates all reveal/filter behavior to existing routing.
function appendGuideSearchSnippet(target, value, query) {
  const text = String(value ?? '');
  const fold = value => value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();
  const terms = [...new Set(fold(String(query ?? '')).split(/\s+/).filter(Boolean))];
  const starts = [], ends = [];
  let normalized = '';
  // Keep source offsets through decomposed accents and expanded characters.
  // Highlight original text rather than inserting user input as HTML.
  for (const segment of text.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
    const part = fold(segment[0]);
    normalized += part;
    for (let index = 0; index < part.length; index++) {
      starts.push(segment.index); ends.push(segment.index + segment[0].length);
    }
  }
  const ranges = [];
  for (const term of terms) {
    let index = normalized.indexOf(term);
    while (index >= 0) {
      ranges.push([starts[index], ends[index + term.length - 1]]);
      index = normalized.indexOf(term, index + 1);
    }
  }
  ranges.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
  const merged = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([...range]);
  }
  let end = 0;
  for (const [start, stop] of merged) {
    target.append(document.createTextNode(text.slice(end, start)));
    const strong = document.createElement('strong');
    strong.textContent = text.slice(start, stop); target.append(strong);
    end = stop;
  }
  target.append(document.createTextNode(text.slice(end)));
}

function mountGuideSearch(root, signal, state) {
  if (!root) return;
  const input = root.querySelector('input');
  const clear = root.querySelector('[data-guide-search-clear]');
  const panel = root.querySelector('[data-guide-search-results]');
  const list = panel.querySelector('ul');
  const status = panel.querySelector('[role="status"]');
  const source = root.dataset.guideSearchSource;
  let index;
  let loading;
  let version = 0;
  let matches = [];
  let matchQuery = '';
  let expanded = false;
  input.value = state.query ?? new URLSearchParams(location.search).get('q') ?? '';

  const virtual = createWindowedList({ list, scroller: panel, signal,
    estimateHeight: () => parseFloat(getComputedStyle(document.documentElement).fontSize) * 7,
    renderRow(item) {
      const row = document.createElement('li');
      const link = document.createElement('a'); link.href = item.href;
      if (item.weaponId) link.dataset.weaponTreeSelect = item.weaponId;
      const name = document.createElement('strong'); name.textContent = item.title;
      const kind = document.createElement('span'); kind.className = 'guide-search-kind'; kind.textContent = item.kind;
      const text = document.createElement('small'); appendGuideSearchSnippet(text, item.snippet, matchQuery);
      link.append(name, kind, text); row.append(link); return row;
    } });
  function close() { expanded = false; panel.hidden = true; }
  function positionResults() {
    if (!expanded || signal.aborted) return;
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0, bottom = top + (viewport?.height ?? innerHeight);
    const field = root.querySelector('.guide-search-input').getBoundingClientRect();
    const below = bottom - field.bottom - 12, above = field.top - top - 12;
    const placement = below < 160 && above > below ? 'above' : 'below';
    panel.dataset.placement = placement;
    panel.style.maxBlockSize = `${Math.max(72, Math.min(576, placement === 'above' ? above : below))}px`;
    virtual.refresh();
  }
  function save() { state.query = input.value; }
  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const clean = () => { script.onload = script.onerror = null; script.remove(); signal.removeEventListener('abort', cancel); };
      const cancel = () => { clean(); reject(signal.reason); };
      script.receiveGuideSearch = records => {
        clean();
        createGuideSearchClient(records, signal).then(client => { index = client; resolve(client); }, reject);
      };
      script.onload = script.onerror = () => { clean(); reject(new Error('Search data could not load.')); };
      signal.addEventListener('abort', cancel, { once: true });
      script.src = source;
      document.head.append(script);
    }).finally(() => { loading = undefined; });
    return loading;
  }

  async function search() {
    const request = ++version;
    const query = input.value;
    save();
    clear.hidden = !input.value;
    // A worker reply belongs to one query. Never leave the previous query's
    // anchors or paging actions selectable while the next reply is pending.
    matches = []; virtual.setItems(matches, { resetScroll: true });
    if (!input.value.trim()) { close(); return; }
    expanded = true;
    panel.hidden = false;
    positionResults();
    status.textContent = index ? 'Searching…' : 'Loading search…';
    let result;
    try {
      const model = await load();
      if (signal.aborted || request !== version || !expanded) return;
      // Search data is bounded static reference data. Keep its matches in the
      // model; only the visible rows and a small overscan become DOM controls.
      result = await model.query(query, model.size);
    }
    catch {
      if (signal.aborted || request !== version || !expanded) return;
      index = undefined;
      matches = []; virtual.setItems(matches);
      status.textContent = 'Search could not load. Try typing again or reload the page.';
      return;
    }
    if (signal.aborted || request !== version || !expanded) return;
    matchQuery = query;
    matches = result.items; virtual.setItems(matches, { resetScroll: true });
    status.textContent = result.total ? `${result.total} ${result.total === 1 ? 'result' : 'results'}` : 'No matches. Try another name or keyword.';
    positionResults();
  }

  input.addEventListener('input', () => search(), { signal });
  input.addEventListener('focus', () => { if (input.value.trim()) search(); }, { signal });
  root.addEventListener('submit', event => {
    event.preventDefault();
    if (matches.length && expanded) { virtual.focusIndex(0); list.querySelector('[data-virtual-index="0"] a')?.click(); }
    else search();
  }, { signal });
  clear.addEventListener('click', () => {
    input.value = ''; version++; save(); clear.hidden = true; close(); input.focus();
  }, { signal });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); input.focus(); close(); return; }
    if (!expanded || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const active = document.activeElement?.closest('[data-virtual-index]');
    const current = active ? Number(active.dataset.virtualIndex) : -1;
    const next = event.key === 'ArrowDown' ? Math.min(matches.length - 1, current + 1) : current - 1;
    if (next >= 0) { event.preventDefault(); virtual.focusIndex(next); }
    else if (current >= 0) { event.preventDefault(); input.focus(); }
  }, { signal });
  list.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    guideView.focusLinkDestination(link.hash);
    close();
    // The native hash/weapon handlers own navigation. A repeated destination
    // still needs to reveal a previously collapsed or filtered-out target.
    if (link.hash === location.hash && !link.dataset.weaponTreeSelect) {
      requestAnimationFrame(() => { if (!signal.aborted) guideView.open({ reveal: true, focus: true }); });
    }
  }, { signal });
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); }, { signal });
  // Safari can blur the input with relatedTarget=null before delivering a tap
  // to a result. Hiding that result here would cancel its click. Real outside
  // pointers and explicit keyboard focus changes still dismiss the surface.
  root.addEventListener('focusout', event => { if (event.relatedTarget && !root.contains(event.relatedTarget)) close(); }, { signal });
  window.addEventListener('resize', positionResults, { signal });
  window.addEventListener('scroll', positionResults, { passive: true, signal });
  window.visualViewport?.addEventListener('resize', positionResults, { signal });
  window.visualViewport?.addEventListener('scroll', positionResults, { signal });
  signal.addEventListener('abort', () => { version++; save(); close(); }, { once: true });
  clear.hidden = !input.value;
}
