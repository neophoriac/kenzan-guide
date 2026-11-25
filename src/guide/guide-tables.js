// One reading layer for static, deferred and save-updated reference tables.
// Keep the original cells and controls: checklist loading relies on their slots.
function startGuideTables() {
  const root = document.querySelector('#guide');
  const states = new Map();
  const pending = new Set();
  let sequence = 0;
  let frame = 0;
  const clean = text => text.replace(/\s+/g, ' ').trim();
  const instructionColumns = /^(First window \(pending objective\)|Requirements and steps|Race plan|Rules and unlock|Appearance requirements|Objective|Pickup|Location and directions|What to do|How to get it|Food or gifts|In-game description)$/i;
  const numericColumns = /^(Price|Handsomeness|Intoxication|Hearts|Venue hearts|Now|Growth limit|Best score|Winner[’']s prize)$/i;

  function nearbyHeading(element) {
    for (let current = element; current && current !== root; current = current.parentElement) {
      for (let previous = current.previousElementSibling; previous; previous = previous.previousElementSibling) {
        if (/^H[2-6]$/.test(previous.tagName)) return clean(previous.textContent);
      }
      if (current.matches('details')) return clean(current.querySelector(':scope > summary')?.textContent ?? '');
    }
    return '';
  }

  function tableName(table, wrap) {
    if (table.matches('.weapon-compare-table')) return 'Compare weapons';
    if (table.closest('.turtle-planner-results')) return `Race planner · ${nearbyHeading(table) || 'Compare your turtles'}`;
    const profile = table.closest('.yujo-profile')?.querySelector('h3');
    const ownName = table.getAttribute('aria-label');
    const regionName = wrap?.getAttribute('aria-label');
    const localName = ownName || (regionName !== 'Guide table' ? regionName : '') || nearbyHeading(wrap ?? table);
    const context = profile ? clean(profile.textContent) : '';
    return [context, localName].filter((part, index, parts) => part && parts.indexOf(part) === index).join(' · ') || 'Reference table';
  }

  function register(table) {
    if (states.has(table)) return states.get(table);
    const wrap = table.parentElement?.matches('.table-wrap') ? table.parentElement : null;
    // Food, planner and weapon comparisons have their own responsive semantics.
    const specialized = table.matches('.weapon-compare-table')
      || Boolean(table.closest('.turtle-food-effects, .turtle-planner-results'));
    const state = { table, wrap, specialized, id: `guide-table-${++sequence}` };
    states.set(table, state);
    const name = tableName(table, wrap);
    // A real caption already names a specialised table. Keep it authoritative.
    if (!table.hasAttribute('aria-labelledby') && (!specialized || !table.caption)) table.setAttribute('aria-label', name);
    if (wrap) {
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', name);
      wrap.dataset.guideTable = '';
      const cue = document.createElement('p');
      cue.className = 'guide-table-hint';
      cue.id = `${state.id}-hint`;
      cue.hidden = true;
      wrap.before(cue);
      state.cue = cue;
      resize.observe(wrap);
      // The view is initially hidden. Re-measure when its containing disclosure opens.
    }
    return state;
  }

  function enrich(state) {
    const { table, wrap, specialized, id } = state;
    const headings = [...(table.tHead?.rows[0]?.cells ?? [])];
    const labels = headings.map(cell => clean(cell.textContent));
    if (!headings.length || specialized) return;
    const records = labels.some(label => instructionColumns.test(label)) || Boolean(table.closest('.turtle-race-candidates'));
    table.classList.add('guide-reference-table');
    table.classList.toggle('guide-table-records', records);
    table.setAttribute('role', 'table');
    table.tHead.setAttribute('role', 'rowgroup');
    table.tHead.rows[0].setAttribute('role', 'row');
    headings.forEach((cell, index) => {
      cell.scope = 'col';
      cell.setAttribute('role', 'columnheader');
      if (!cell.id) cell.id = `${id}-col-${index + 1}`;
      cell.classList.toggle('guide-table-number', numericColumns.test(labels[index]));
    });
    let rowCount = 0;
    const completeRows = [];
    for (const body of table.tBodies) {
      body.setAttribute('role', 'rowgroup');
      for (const row of body.rows) {
        row.setAttribute('role', 'row');
        // Closed checklists retain only their identity and live/control cells.
        // Include excluded columns in this raw slot mapping; do not renumber them.
        if (row.cells.length !== headings.length) continue;
        rowCount++;
        completeRows.push(row);
        const identity = row.cells[0];
        if (!identity.id) identity.id = `${id}-row-${row.rowIndex}`;
        [...row.cells].forEach((cell, index) => {
          cell.dataset.label = labels[index];
          cell.classList.toggle('guide-table-number', numericColumns.test(labels[index]));
          cell.classList.toggle('guide-table-instructions', instructionColumns.test(labels[index]));
          if (index === 0) {
            cell.setAttribute('role', 'rowheader');
            if (cell.tagName === 'TH') cell.scope = 'row';
          } else {
            cell.setAttribute('role', 'cell');
            cell.setAttribute('headers', `${identity.id} ${headings[index].id}`);
          }
        });
      }
    }
    // Condense entirely empty restaurant requirement columns into one explicit note.
    // The original cell slots and all progress controls remain in the DOM.
    const requirement = labels.indexOf('Requirement');
    if (requirement >= 0 && table.closest('[id^="restaurant-menu-"]')) {
      const noRequirements = completeRows.length > 0 && completeRows.every(row => clean(row.cells[requirement].textContent) === '—');
      table.toggleAttribute('data-table-no-requirements', noRequirements);
      headings[requirement].classList.toggle('guide-table-empty-column', noRequirements);
      completeRows.forEach(row => row.cells[requirement].classList.toggle('guide-table-empty-column', noRequirements));
      const note = table.querySelector('caption[data-table-requirement-note]');
      if (noRequirements && !note && !table.caption) {
        const caption = table.createCaption();
        caption.dataset.tableRequirementNote = '';
        caption.className = 'guide-table-note';
        caption.textContent = 'No order-specific requirements.';
      } else if (!noRequirements) note?.remove();
    }
    if (wrap) {
      wrap.toggleAttribute('data-table-long', rowCount > 12);
      // A small matrix needs enough space for words, rather than minimum word widths.
      wrap.toggleAttribute('data-table-matrix', !records && (labels.length >= 5 || labels.some(label => /^First window/.test(label))));
    }
  }

  function measure(state) {
    const { table, wrap, cue } = state;
    if (!wrap) return;
    if (!wrap.getClientRects().length || wrap.clientWidth === 0) {
      if (!cue.hidden) cue.hidden = true;
      wrap.removeAttribute('tabindex');
      wrap.removeAttribute('data-table-overflow-x');
      wrap.removeAttribute('data-table-overflow-y');
      wrap.removeAttribute('data-table-pin-identity');
      const descriptions = (wrap.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(value => value && value !== cue.id);
      if (descriptions.length) wrap.setAttribute('aria-describedby', descriptions.join(' '));
      else wrap.removeAttribute('aria-describedby');
      return;
    }
    const records = getComputedStyle(table).getPropertyValue('--guide-record-layout').trim() === '1';
    const mode = records ? 'records' : 'matrix';
    if (wrap.dataset.tableLayout !== mode) wrap.dataset.tableLayout = mode;
    const horizontal = wrap.scrollWidth > wrap.clientWidth + 2;
    const vertical = wrap.scrollHeight > wrap.clientHeight + 2;
    const firstRow = [...table.tBodies].flatMap(body => [...body.rows]).find(row => row.getClientRects().length);
    const identityWidth = firstRow?.cells[0]?.getBoundingClientRect().width ?? 0;
    // An oversized pinned cell would cover the data the player is trying to read.
    wrap.toggleAttribute('data-table-pin-identity', horizontal && !records && identityWidth > 0 && identityWidth <= wrap.clientWidth * .55);
    const overflow = horizontal || vertical;
    // Keep tab stops for real scroll regions, not every small reference table.
    if (overflow) wrap.tabIndex = 0;
    else wrap.removeAttribute('tabindex');
    wrap.toggleAttribute('data-table-overflow-x', horizontal);
    wrap.toggleAttribute('data-table-overflow-y', vertical);
    const message = horizontal && vertical ? 'Scroll for more columns and rows. Arrow keys work when this table is focused.'
      : horizontal ? 'Scroll sideways for more columns. Use Left and Right Arrow keys when this table is focused.'
        : 'Scroll within this table for more rows. Use Up and Down Arrow keys when it is focused.';
    if (cue.textContent !== message) cue.textContent = message;
    if (cue.hidden === overflow) cue.hidden = !overflow;
    const descriptions = (wrap.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(value => value && value !== cue.id);
    if (overflow) descriptions.push(cue.id);
    if (descriptions.length) wrap.setAttribute('aria-describedby', descriptions.join(' '));
    else wrap.removeAttribute('aria-describedby');
  }

  function flush() {
    frame = 0;
    for (const table of pending) {
      if (table.isConnected && root.contains(table)) enrich(register(table));
    }
    pending.clear();
    for (const [table, state] of states) {
      if (!root.contains(table)) {
        if (state.wrap) resize.unobserve(state.wrap);
        state.cue?.remove();
        states.delete(table);
      } else measure(state);
    }
  }

  function schedule() {
    if (!frame && !viewSignal.aborted) frame = requestAnimationFrame(flush);
  }

  const resize = new ResizeObserver(schedule);
  const mutations = new MutationObserver(records => {
    for (const mutation of records) {
      const element = mutation.target.nodeType === Node.ELEMENT_NODE ? mutation.target : mutation.target.parentElement;
      const table = element?.closest('table');
      if (table) pending.add(table);
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches('table')) pending.add(node);
        node.querySelectorAll('table').forEach(table => pending.add(table));
      }
    }
    schedule();
  });
  root.querySelectorAll('table').forEach(table => pending.add(table));
  mutations.observe(root, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ['open', 'hidden', 'data-completion-excluded'] });
  document.addEventListener('toggle', schedule, { capture: true, signal: viewSignal });
  window.addEventListener('resize', schedule, { signal: viewSignal });
  document.fonts.ready.then(schedule);
  viewSignal.addEventListener('abort', () => {
    mutations.disconnect();
    resize.disconnect();
    cancelAnimationFrame(frame);
    states.clear();
    pending.clear();
  }, { once: true });
  schedule();
}
