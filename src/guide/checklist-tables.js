const checklistTables = new Map();
const checklistTargets = new Map();
const checklistPanels = new Map();
const guideTargetRoutes = new Map(Object.entries(JSON.parse(document.getElementById('guide-target-routes')?.textContent ?? '{}')));

function loadGuideContent(url) {
  if (!/^assets\/guide-content\/[1-9]\d*\.js$/.test(url)) {
    return Promise.reject(new Error('Unexpected guide content path.'));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    const cancel = () => {
      script.remove();
      reject(viewSignal.reason);
    };
    viewSignal.addEventListener('abort', cancel, { once: true });
    script.receiveGuideContent = content => {
      viewSignal.removeEventListener('abort', cancel);
      script.remove();
      resolve(content);
    };
    script.onerror = script.onload = () => {
      viewSignal.removeEventListener('abort', cancel);
      script.remove();
      reject(new Error(`Unable to load guide content from ${url}`));
    };
    script.src = url;
    document.head.append(script);
  });
}

function guideHashId(hash = location.hash) {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  try { return decodeURIComponent(value); } catch { return value; }
}

function findGuideTarget(id) {
  const key = guideHashId(id);
  return document.getElementById(key) ?? checklistTargets.get(key);
}

async function materializeGuideTarget(id, isCurrent) {
  const key = guideHashId(id);
  if (findGuideTarget(key)) return;
  for (const step of guideTargetRoutes.get(key) ?? []) {
    if (viewSignal.aborted || !isCurrent()) return;
    if (step.kind === 'details') {
      const panel = guideHost.querySelector(`[data-lazy-details="${CSS.escape(step.source)}"]`);
      if (!panel) return;
      panel.open = true;
      await updateWalkthrough(panel);
    } else if (step.kind === 'checklist') {
      const state = [...checklistTables.values()].find(item => item.body.dataset.checklistContent === step.source);
      if (!state) return;
      for (const panel of [...state.panels].reverse()) panel.open = true;
      await updateChecklistTable(state);
    }
  }
}

function checklistClosest(element, selector) {
  const match = element?.closest(selector);
  if (match || !element || element.isConnected) return match;
  return checklistTables.get(element.closest('tbody'))?.table.closest(selector);
}

function checklistIsOpen({ table, panels }) {
  return panels.every(panel => panel.open) && !table.closest('[data-completion-excluded]');
}

async function updateChecklistTable(state) {
  const { body, table } = state;
  const shouldMount = checklistIsOpen(state);
  if (shouldMount === state.open) return state.loading;
  state.open = shouldMount;
  state.error?.remove();
  state.error = undefined;

  if (shouldMount) {
    const loading = loadGuideContent(body.dataset.checklistContent);
    state.loading = loading;
    let content;
    try {
      content = await loading;
    } catch {
      if (viewSignal.aborted || state.loading !== loading || !checklistIsOpen(state)) return;
      state.loading = undefined;
      const message = document.createElement('p');
      message.className = 'collectible-intro';
      message.textContent = 'This checklist could not load. Check the assets folder, then close and reopen this section.';
      table.parentElement.before(message);
      state.error = message;
      return;
    }
    if (viewSignal.aborted || state.loading !== loading || !checklistIsOpen(state)) return;
    state.loading = undefined;
    for (const [index, row] of [...body.rows].entries()) {
      const cells = [...row.cells];
      for (const [slot, html, trainingCopy] of content[index]) {
        if (trainingCopy) {
          cells[slot].querySelector('[data-checklist-copy]').innerHTML = html;
          continue;
        }
        const nextCell = cells[slot];
        const previousCell = nextCell ? nextCell.previousElementSibling : row.lastElementChild;
        if (nextCell) nextCell.insertAdjacentHTML('beforebegin', html);
        else row.insertAdjacentHTML('beforeend', html);
        const firstInserted = previousCell ? previousCell.nextElementSibling : row.firstElementChild;
        for (let cell = firstInserted; cell && cell !== nextCell; cell = cell.nextElementSibling) {
          state.inserted.push(cell);
        }
      }
    }
    for (const [index, detail] of [...body.querySelectorAll('details')].entries()) {
      if (state.expanded.has(index)) detail.open = true;
    }
    table.append(body);
    const target = checklistTargets.get(guideHashId());
    if (target?.closest('tbody') === body && guideHost.getAttribute('data-restoring-scroll') !== 'saved') target.scrollIntoView();
  } else {
    state.loading = undefined;
    body.remove();
    state.expanded = new Set([...body.querySelectorAll('details')].flatMap((detail, index) => detail.open ? [index] : []));
    for (const cell of state.inserted) cell.remove();
    state.inserted.length = 0;
    for (const copy of body.querySelectorAll('[data-checklist-copy]')) copy.replaceChildren();
  }
}

function updateChecklistPanel(panel) {
  return Promise.all([...(checklistPanels.get(panel) ?? [])].map(updateChecklistTable));
}

function startChecklistLoading() {
  const initialLoads = [];
  for (const body of document.querySelectorAll('#guide tbody[data-checklist-content]')) {
    const table = body.parentElement;
    const panels = [];
    for (let panel = table.closest('details'); panel; panel = panel.parentElement.closest('details')) panels.push(panel);
    const state = { body, table, panels, open: false, inserted: [], expanded: new Set() };
    checklistTables.set(body, state);
    for (const panel of panels) {
      if (!checklistPanels.has(panel)) checklistPanels.set(panel, []);
      checklistPanels.get(panel).push(state);
    }
    for (const target of body.querySelectorAll('[id]')) checklistTargets.set(target.id, target);
    body.remove();
    if (checklistIsOpen(state)) initialLoads.push(updateChecklistTable(state));
  }
  document.addEventListener('toggle', event => updateChecklistPanel(event.target), { capture: true, signal: viewSignal });
  document.addEventListener('kenzan:completion-visibility', () => {
    for (const state of checklistTables.values()) updateChecklistTable(state);
  }, { signal: viewSignal });
  return initialLoads;
}

async function settleGuideContent() {
  await Promise.all([...checklistLoads, ...[...guideHost.querySelectorAll('details[data-lazy-details][open]')].map(updateWalkthrough)]);
  if (!viewSignal.aborted) await document.fonts.ready;
  // Content observers enrich responsive tables after insertion. Wait for that
  // layout before finding the fragment, rather than scrolling to an old slot.
  for (let pass = 0; pass < 2 && !viewSignal.aborted; pass++) await new Promise(resolve => {
    let frame;
    const finish = () => { viewSignal.removeEventListener('abort', cancel); resolve(); };
    const cancel = () => { cancelAnimationFrame(frame); finish(); };
    viewSignal.addEventListener('abort', cancel, { once: true });
    frame = requestAnimationFrame(finish);
  });
}
