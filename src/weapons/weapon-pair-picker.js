// Editable, role-filtered choices. The host keeps the confirmed pair separate from a search draft.
function mountWeaponPairPicker(host, { items, selected, signal, onSelect }) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const input = host.querySelector('[data-weapon-pair-role]');
  const button = host.querySelector('[data-weapon-pair-toggle]');
  const status = host.querySelector('[data-weapon-pair-search-status]');
  const popup = document.createElement('div');
  popup.className = 'weapon-pair-popup';
  popup.id = input.id + '-results';
  popup.setAttribute('role', 'listbox');
  popup.setAttribute('aria-label', input.getAttribute('aria-label') + ' choices');
  input.setAttribute('aria-controls', popup.id);
  const topLayer = typeof popup.showPopover === 'function';
  if (topLayer) { popup.setAttribute('popover', 'manual'); host.append(popup); }
  else { popup.hidden = true; (host.closest('dialog') ?? document.body).append(popup); }
  const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();
  const byId = new Map(items.map(item => [item.id, item]));
  let value = selected;
  let open = false;
  let composing = false;
  let matches = [];
  let active = -1;
  let rowHeight = 44;
  const rowMeasurements = new Map();
  let popupLayout = '';
  let frame = 0;
  let disposed = false;

  function close({ revert = true } = {}) {
    if (disposed) return;
    if (topLayer && popup.matches(':popover-open')) popup.hidePopover();
    else if (!topLayer) popup.hidden = true;
    open = false;
    if (revert) input.value = byId.get(value).name;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    status.textContent = '';
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function measureRows(rem) {
    const style = getComputedStyle(popup);
    const width = Math.max(1, popup.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    const key = `${width}:${rem}:${style.fontFamily}`;
    if (rowMeasurements.has(key)) return rowMeasurements.get(key);
    // Measure the actual wrapping and padding once per width/font, outside the
    // visible list. Scrolling keeps the existing option nodes and cached height.
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    Object.assign(probe.style, { position: 'absolute', width: width + 'px', height: '0',
      overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none' });
    const rows = items.map(item => {
      const row = document.createElement('div');
      row.className = 'weapon-pair-option';
      Object.assign(row.style, { position: 'static', height: 'auto' });
      row.textContent = item.name;
      probe.append(row);
      return row;
    });
    popup.append(probe);
    const height = Math.ceil(Math.max(44, ...rows.map(row => row.getBoundingClientRect().height)));
    probe.remove();
    rowMeasurements.set(key, height);
    if (rowMeasurements.size > 8) rowMeasurements.delete(rowMeasurements.keys().next().value);
    return height;
  }

  function position() {
    if (!open || !input.isConnected) return;
    const rect = input.getBoundingClientRect();
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? document.documentElement.clientWidth;
    const height = viewport?.height ?? innerHeight;
    const pane = input.closest('.weapon-tree-detail');
    const paneRect = pane?.getBoundingClientRect();
    if (rect.bottom < top || rect.top > top + height || !input.getClientRects().length
      || paneRect && (rect.bottom < paneRect.top || rect.top > paneRect.bottom)) { close(); return; }
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const below = top + height - rect.bottom - 8, above = rect.top - top - 8;
    const downward = below >= Math.min(18 * rem, rowHeight * 2) || below >= above;
    const maxHeight = Math.max(1, Math.min(18 * rem, downward ? below : above));
    const popupWidth = Math.min(Math.max(rect.width, 20 * rem), width - 16);
    popup.style.width = popupWidth + 'px';
    popup.style.maxHeight = maxHeight + 'px';
    const nextRowHeight = measureRows(rem);
    if (nextRowHeight !== rowHeight) {
      const logicalScroll = popup.scrollTop / rowHeight;
      rowHeight = nextRowHeight;
      const spacer = popup.querySelector('.weapon-pair-options-space');
      if (spacer) spacer.style.height = matches.length * rowHeight + 'px';
      popup.scrollTop = logicalScroll * rowHeight;
      render();
    }
    const header = popup.querySelector('.weapon-pair-popup-selection');
    const layout = `${popup.clientWidth}:${popup.clientHeight}:${rowHeight}:${header?.offsetHeight ?? 0}`;
    if (layout !== popupLayout) {
      popupLayout = layout;
      const option = popup.querySelector('[role="option"][aria-selected="true"]');
      if (option) {
        // A resize can shrink the visible range. Reveal the keyboard-active row
        // then, without pulling ordinary wheel/touch scrolling back to it.
        const bounds = popup.getBoundingClientRect();
        const row = option.getBoundingClientRect();
        const style = getComputedStyle(popup);
        const top = header?.getBoundingClientRect().bottom ?? bounds.top + popup.clientTop + parseFloat(style.paddingTop);
        const bottom = bounds.top + popup.clientTop + popup.clientHeight - parseFloat(style.paddingBottom);
        const delta = row.top < top ? row.top - top : row.bottom > bottom ? row.bottom - bottom : 0;
        if (delta) { popup.scrollTop += delta; render(); }
      }
    }
    popup.style.left = Math.max(left + 8, Math.min(rect.left, left + width - popupWidth - 8)) + 'px';
    popup.style.top = (downward ? rect.bottom + 4 : Math.max(top + 4, rect.top - popup.getBoundingClientRect().height - 4)) + 'px';
  }

  function render() {
    frame = 0;
    if (!open) return;
    let selectedName = popup.querySelector('.weapon-pair-popup-selection');
    if (!selectedName) {
      selectedName = document.createElement('p');
      selectedName.className = 'weapon-pair-popup-selection';
      selectedName.setAttribute('aria-hidden', 'true');
    }
    const confirmedName = 'Selected: ' + byId.get(value).name;
    if (selectedName.textContent !== confirmedName) selectedName.textContent = confirmedName;
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'weapon-pair-no-match';
      empty.textContent = 'No matching weapons. Try another name.';
      popup.replaceChildren(selectedName, empty);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    const first = Math.max(0, Math.floor(popup.scrollTop / rowHeight) - 2);
    const last = Math.min(matches.length, first + Math.ceil(popup.clientHeight / rowHeight) + 5);
    const indexes = new Set(Array.from({ length: last - first }, (_, index) => first + index));
    if (active >= 0) indexes.add(active);
    let spacer = popup.querySelector('.weapon-pair-options-space');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'weapon-pair-options-space';
      spacer.setAttribute('role', 'presentation');
      popup.replaceChildren(selectedName, spacer);
    }
    spacer.style.height = matches.length * rowHeight + 'px';
    const visibleIds = new Set([...indexes].map(index => matches[index].id));
    const rows = new Map([...spacer.children].map(option => [option.dataset.weaponPairId, option]));
    for (const [id, option] of rows) if (!visibleIds.has(id)) option.remove();
    let previous;
    for (const index of [...indexes].sort((a, b) => a - b)) {
      const item = matches[index];
      let option = rows.get(item.id);
      if (!option) {
        option = document.createElement('div');
        option.dataset.weaponPairId = item.id;
        option.className = 'weapon-pair-option';
        option.setAttribute('role', 'option');
        option.textContent = item.name;
      }
      option.id = popup.id + '-' + item.id;
      option.dataset.weaponPairOption = index;
      option.setAttribute('aria-selected', String(index === active));
      option.setAttribute('aria-posinset', index + 1);
      option.setAttribute('aria-setsize', matches.length);
      option.style.top = index * rowHeight + 'px';
      option.style.height = rowHeight + 'px';
      const next = previous ? previous.nextElementSibling : spacer.firstElementChild;
      if (next !== option) spacer.insertBefore(option, next);
      previous = option;
    }
    if (active >= 0) input.setAttribute('aria-activedescendant', popup.id + '-' + matches[active].id);
    else input.removeAttribute('aria-activedescendant');
  }

  function show(query) {
    if (disposed || signal.aborted || !host.isConnected) return;
    const tokens = normalize(query).split(' ').filter(Boolean);
    matches = items.filter(item => tokens.every(token => normalize(item.name).includes(token)));
    active = -1;
    if (!topLayer) (host.closest('dialog') ?? document.body).append(popup);
    open = true;
    if (topLayer && !popup.matches(':popover-open')) popup.showPopover();
    else if (!topLayer) popup.hidden = false;
    popup.scrollTop = 0;
    position();
    render();
    position();
    input.setAttribute('aria-expanded', String(open));
    status.textContent = `${matches.length} matching ${matches.length === 1 ? 'weapon' : 'weapons'}. Use Up or Down and Enter to choose. Your selection stays unchanged until you choose a weapon.`;
  }

  function commit(id) {
    if (!byId.has(id)) return;
    value = id;
    close();
    onSelect(id);
  }

  function move(index) {
    if (!matches.length) return;
    active = Math.max(0, Math.min(index, matches.length - 1));
    const top = active * rowHeight;
    const visibleHeight = popup.clientHeight - (popup.querySelector('.weapon-pair-popup-selection')?.offsetHeight ?? 0);
    if (top < popup.scrollTop) popup.scrollTop = top;
    else if (top + rowHeight > popup.scrollTop + visibleHeight) popup.scrollTop = top + rowHeight - visibleHeight;
    render();
  }

  input.value = byId.get(value).name;
  input.addEventListener('focus', () => { show(input.value === byId.get(value).name ? '' : input.value); input.select(); }, options);
  input.addEventListener('input', event => { if (!composing && !event.isComposing) show(input.value); }, options);
  input.addEventListener('compositionstart', () => { composing = true; close({ revert: false }); }, options);
  input.addEventListener('compositionend', () => { composing = false; show(input.value); }, options);
  input.addEventListener('blur', close, options);
  input.addEventListener('keydown', event => {
    if (composing || event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === 'Tab') { close(); return; }
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) show(input.value === byId.get(value).name ? '' : input.value);
      move(active < 0 ? event.key === 'ArrowDown' ? 0 : matches.length - 1 : active + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      if (!open) show(input.value === byId.get(value).name ? '' : input.value);
      const page = Math.max(1, Math.floor(popup.clientHeight / rowHeight));
      move(active < 0 ? 0 : active + (event.key === 'PageDown' ? page : -page));
    } else if (event.key === 'Enter') {
      const exact = items.filter(item => normalize(item.name) === normalize(input.value));
      const id = open && active >= 0 ? matches[active].id : exact.length === 1 ? exact[0].id : null;
      if (id) { event.preventDefault(); commit(id); }
      else if (open) event.preventDefault();
    }
  }, options);
  button.addEventListener('pointerdown', event => event.preventDefault(), options);
  button.addEventListener('click', () => { if (open) close(); else { input.focus({ preventScroll: true }); show(''); } }, options);
  popup.addEventListener('pointerdown', event => { if (event.target.closest('[data-weapon-pair-option]')) event.preventDefault(); }, options);
  popup.addEventListener('click', event => {
    const option = event.target.closest('[data-weapon-pair-option]');
    if (option) commit(matches[Number(option.dataset.weaponPairOption)].id);
  }, options);
  popup.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(render); }, { ...options, passive: true });
  document.addEventListener('pointerdown', event => {
    if (!host.contains(event.target) && !popup.contains(event.target)) close();
  }, { ...options, capture: true });
  document.addEventListener('scroll', event => { if (open && event.target !== popup) position(); }, { ...options, capture: true, passive: true });
  window.addEventListener('resize', position, options);
  window.visualViewport?.addEventListener('resize', position, options);
  window.visualViewport?.addEventListener('scroll', position, options);
  document.fonts.addEventListener('loadingdone', () => {
    rowMeasurements.clear();
    if (open) { position(); render(); }
  }, options);
  const resize = new ResizeObserver(() => { if (open) { position(); render(); } });
  resize.observe(input);
  function dispose() {
    if (disposed) return;
    close();
    disposed = true;
    controller.abort();
    resize.disconnect();
    popup.remove();
  }
  signal.addEventListener('abort', dispose, { once: true, signal: controller.signal });
  return { close, dispose, setValue(id) { if (byId.has(id)) { value = id; input.value = byId.get(id).name; } } };
}
