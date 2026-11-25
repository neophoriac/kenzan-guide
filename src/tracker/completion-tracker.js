(() => {
  const tracker = document.querySelector('#completion-tracker');
  const hideExcluded = tracker.querySelector('#completion-hide-excluded');
  const totalLabel = tracker.querySelector('#completion-total');
  const percentLabel = tracker.querySelector('#completion-percent');
  const bar = tracker.querySelector('#completion-bar');
  const indexLink = document.querySelector('#completion-index-link');
  const compactTracker = document.querySelector('#completion-compact');
  const compactPercent = compactTracker.querySelector('#completion-compact-percent');
  const compactBar = compactTracker.querySelector('#completion-compact-bar');
  const compactTotal = compactTracker.querySelector('#completion-compact-total');
  const compactRows = new Map([...compactTracker.querySelectorAll('[data-compact-category]')].map(row =>
    [row.dataset.compactCategory, { row, count: row.querySelector('[data-compact-count]') }]));
  const hiddenNote = tracker.querySelector('#completion-hidden-note');
  const key = 'kenzan-guide:completion-preferences';
  const themeKey = 'kenzan-guide:completion-theme';
  const themeSettings = document.querySelector('#completion-theme-settings');
  const themeCurrent = themeSettings.querySelector('#completion-theme-current');
  const themeOptions = new Map([...themeSettings.querySelectorAll('.completion-theme-tile')].map(button => [button.dataset.completionTheme, button]));
  const highlightList = tracker.querySelector('.completion-highlights');
  const highlights = new Map([...highlightList.children].map(row => [row.dataset.completionHighlight, {
    row, count: row.querySelector('.completion-highlight-count'), included: true,
  }]));
  const defaultTheme = tracker.dataset.completionTheme;

  let activeTheme;
  let unsavedTheme = false;
  let featured = [];
  function updateHighlights() {
    let visible = false;
    for (const [id, { row, included }] of highlights) {
      row.hidden = !included || !featured.includes(id);
      if (!row.hidden) visible = true;
    }
    highlightList.hidden = !visible;
  }

  function setTheme(theme) {
    const migratedTheme = theme === 'original-preview' ? 'original'
      : theme === 'classic-preview' ? 'classic' : null;
    if (migratedTheme) {
      theme = migratedTheme;
      try { window.kenzanStorage.setItem(themeKey, theme); } catch { /* Theme still applies for this visit. */ }
    }
    if (!themeOptions.has(theme)) theme = defaultTheme;
    if (activeTheme === theme) return;
    activeTheme = theme;
    for (const [id, button] of themeOptions) {
      button.setAttribute('aria-pressed', String(id === theme));
      const state = button.querySelector('[data-theme-selection]');
      if (state) state.textContent = id === theme ? 'Selected' : 'Use theme';
    }
    themeCurrent.textContent = themeOptions.get(theme).querySelector('.completion-theme-name').textContent;
    tracker.dataset.completionTheme = theme;
    compactTracker.dataset.completionTheme = theme;
    indexLink.dataset.completionTheme = theme;
    featured = themeOptions.get(theme).dataset.themeHighlights.split(' ').filter(Boolean);
    for (const id of featured) highlightList.append(highlights.get(id).row);
    updateHighlights();
  }

  function loadTheme(force = false) {
    if (unsavedTheme && !force) return;
    try { setTheme(window.kenzanStorage.getItem(themeKey)); unsavedTheme = false; }
    catch { if (!activeTheme) setTheme(defaultTheme); }
  }
  loadTheme();
  themeSettings.addEventListener('click', event => {
    const button = event.target.closest('.completion-theme-tile');
    if (!button) return;
    const { completionTheme } = button.dataset;
    setTheme(completionTheme);
    try { window.kenzanStorage.setItem(themeKey, completionTheme); unsavedTheme = false; }
    catch { unsavedTheme = true; /* Keep this choice for the visit when storage is full or blocked. */ }
  });

  for (const menu of tracker.querySelectorAll('.completion-primary > details')) {
    const description = menu.querySelector('[data-native-description]');
    let selection;
    function selectRow(row) {
      if (!row || row === selection) return;
      selection?.removeAttribute('data-native-selected');
      selection = row;
      selection.setAttribute('data-native-selected', '');
      description.textContent = row.querySelector('.completion-target').textContent;
    }
    const previewRow = event => {
      if (activeTheme === 'classic') selectRow(event.target.closest('.completion-row'));
    };
    menu.addEventListener('pointerover', previewRow);
    menu.addEventListener('focusin', previewRow);
    menu.addEventListener('click', previewRow);
    selectRow(menu.querySelector('.completion-row'));
  }
  let refreshFrame = 0;
  const linkedSections = new Map([
    ['arena-and-completion', ['arena-and-completion', 'coliseum-tournaments']],
    ['locker-keys', ['locker-keys', 'locker-key-pickups']],
    ['training-and-upgrades', ['training-and-upgrades', 'training-inventions']],
  ]);
  const selectors = {
    substories: '#guide .quest > .quest-heading .quest-check input',
    'locker-key-pickups': '#locker-keys [data-collectible-collected]',
    'locker-keys': '#locker-keys [data-side-done]',
    'arena-and-completion': '#coliseum-fighters [data-coliseum-done]',
    'coliseum-tournaments': '#coliseum-tournaments [data-coliseum-done]',
    'training-and-upgrades': '[data-training-group]:not(#training-inventions) [data-training-done]',
    'training-inventions': '#training-inventions [data-training-done]:not([data-training-done="inventions-mew-sandals-reward"])',
  };
  const collectibleAll = tracker.querySelector('#completion-collectibles-all');
  const collectibleRow = tracker.querySelector('[data-completion-include="collectibles"]');
  const collectibleToggle = collectibleRow.querySelector('#completion-collectibles-toggle');
  const collectibleCount = collectibleRow.querySelector('[data-completion-count]');
  const collectibleOptions = tracker.querySelector('#completion-collectible-options');
  const collectibleVisibility = [document.getElementById('collectibles'),
    ...guideLayout.querySelectorAll('[data-completion-section="collectibles"]')];
  const collectibleGroups = [...collectibleOptions.querySelectorAll('[data-completion-collectible]')].map(input => {
    const id = input.dataset.completionCollectible;
    const section = document.getElementById(id);
    const checks = section.querySelectorAll('[data-collectible-collected]');
    const byItem = new Map();
    for (const check of checks) {
      const item = check.dataset.collectibleCollected;
      if (!byItem.has(item)) byItem.set(item, []);
      byItem.get(item).push(check);
    }
    const visibility = [section, ...guideLayout.querySelectorAll(`[data-completion-section="${id}"]`)];
    return { id, input, goals: [...byItem.values()], visibility };
  });
  const minigamePrefixes = ['turtle-race', 'shogi', 'minigame-mahjong', 'minigame-koi-koi', 'minigame-cho-han',
    'minigame-cee-lo', 'minigame-konpira', 'minigame-tokkuri', 'minigame-karuta', 'minigame-tosenkyo',
    'mastery-yabusame', 'mastery-melon', 'mastery-waterfall', 'mastery-scarecrow', 'mastery-jiraiya', 'minigame-kabuki'];
  const gameStatus = tracker.querySelector('#game-completion-status');
  const categories = [...tracker.querySelectorAll('input[data-completion-include]')].map(input => {
    const id = input.dataset.completionInclude;
    const checks = [...document.querySelectorAll(selectors[id] ?? `#${id} [data-side-done]`)];
    const unique = new Map();
    for (const check of checks) {
      const key = check.dataset.sideDone ?? check.dataset.collectibleCollected ?? check;
      if (!unique.has(key)) unique.set(key, []);
      unique.get(key).push(check);
    }
    const goals = id === 'minigame-completion' ? minigamePrefixes.map(prefix => checks.filter(({ dataset: { sideDone } }) =>
      sideDone.startsWith(`${prefix}-`) && (!sideDone.startsWith('shogi-rank-') || sideDone === 'shogi-rank-21'))) :
      id === 'restaurant-completion' ? checks.map(check => [check]) : [...unique.values()];
    const selector = id === 'arena-and-completion' ? '[data-completion-section="coliseum-fighters"]' : `[data-completion-section="${id}"]`;
    const visibility = [...guideLayout.querySelectorAll(selector)];
    const sectionId = id === 'arena-and-completion' ? 'coliseum-fighters' : id;
    const shared = ['locker-keys', 'training-and-upgrades'].includes(id);
    const section = document.getElementById(sectionId);
    if (id === 'substories') visibility.push(...guideLayout.querySelectorAll('#guide .chapter'));
    else if (section && !shared && id !== 'minigame-completion') visibility.push(section);
    if (id === 'locker-keys') visibility.push(document.querySelector('#locker-keys .side-content-filters'));
    return { id, input, count: input.parentElement.querySelector('[data-completion-count]'), visibility, goals, game: input.hasAttribute('data-game-category') };
  });
  const minigamesSection = document.getElementById('minigame-completion');
  const trainingMinigames = document.getElementById('minigame-training-mastery');
  const otherMinigames = [...minigamesSection.querySelectorAll(':scope > .collectible-group')];
  const minigamesIndex = guideLayout.querySelector('li[data-completion-section="minigame-completion"]');
  const otherMinigameLinks = [...minigamesIndex.querySelectorAll(':scope > details > ul > li[data-completion-section]:not([data-completion-section^="training-"])')];
  const masteryCells = [...trainingMinigames.querySelectorAll('[data-minigame-mastery]')];
  const firstClearCells = [...trainingMinigames.querySelectorAll('[data-minigame-first-clear]')];
  const minigameProgress = minigamesSection.querySelector('[data-side-progress]');

  function setCollectibleOptions(open) {
    collectibleOptions.hidden = !open;
    collectibleToggle.setAttribute('aria-expanded', String(open));
    collectibleToggle.textContent = open ? 'Hide categories' : 'Choose categories';
  }

  function updateCollectibleSelection() {
    const included = collectibleGroups.filter(({ input }) => input.checked).length;
    collectibleAll.checked = included === collectibleGroups.length;
    collectibleAll.indeterminate = included > 0 && !collectibleAll.checked;
  }

  collectibleToggle.addEventListener('click', () => setCollectibleOptions(collectibleOptions.hidden));


  function updateCompactRow(id, included, done, total) {
    const { row, count } = compactRows.get(id);
    row.hidden = !included;
    if (included) count.textContent = `${done} / ${total}`;
  }

  function updateCategoryMeter(row, done, total) {
    row.style.setProperty('--ct-row-progress', `${total ? done * 100 / total : 0}%`);
  }

  function updateCounts() {
    let total = 0;
    let completed = 0;
    for (const { id, input, goals } of collectibleGroups) {
      const done = input.checked ? goals.filter(group => group.some(check => check.checked)).length : 0;
      updateCompactRow(id, input.checked, done, goals.length);
      if (input.checked) {
        total += goals.length;
        completed += done;
      }
    }
    collectibleCount.textContent = `${completed} / ${total}`;
    updateCategoryMeter(collectibleRow, completed, total);
    updateCompactRow('collectibles', collectibleAll.checked || collectibleAll.indeterminate, completed, total);
    let gameTotal = 0;
    let gameDone = 0;
    for (const { id, input, count, goals, game } of categories) {
      const done = goals.filter(group => id === 'minigame-completion'
        ? group.length && group.every(check => check.checked)
        : group.some(check => check.checked)).length;
      count.textContent = `${done} / ${goals.length}`;
      updateCategoryMeter(input.parentElement, done, goals.length);
      const highlight = highlights.get(id);
      if (highlight) {
        highlight.included = input.checked;
        highlight.count.textContent = count.textContent;
        updateCategoryMeter(highlight.row, done, goals.length);
      }
      updateCompactRow(id, input.checked, done, goals.length);
      if (!input.checked) continue;
      total += goals.length;
      completed += done;
      if (game) {
        gameTotal += 1;
        if (done === goals.length) gameDone += 1;
      }
    }
    bar.value = total ? completed / total : 0;
    tracker.style.setProperty('--ct-progress', `${bar.value * 100}%`);
    percentLabel.textContent = total ? `${Math.floor(completed * 100 / total)}%` : '—';
    totalLabel.textContent = total ? `${completed} of ${total} tracked goals done` : 'No checklists selected';
    compactBar.value = bar.value;
    compactPercent.textContent = percentLabel.textContent;
    const compactTotalText = total ? `${completed} of ${total} goals` : totalLabel.textContent;
    if (compactTotal.textContent !== compactTotalText) compactTotal.textContent = compactTotalText;
    gameStatus.textContent = gameTotal ? `${gameDone} of ${gameTotal} included categories complete` : 'No categories included';
    updateHighlights();
  }

  function updateVisibility() {
    const searchWasExcluded = Boolean(document.querySelector('#substories')?.closest('[data-completion-excluded]'));
    const hidden = new Set(categories.filter(({ input }) => hideExcluded.checked && !input.checked).map(({ id }) => id));
    for (const { id, visibility } of categories) {
      for (const element of visibility) {
        if (element === minigamesIndex) continue;
        element.toggleAttribute('data-completion-excluded', hidden.has(id));
      }
    }
    for (const element of collectibleVisibility) {
      element.toggleAttribute('data-completion-excluded', hideExcluded.checked && !collectibleAll.checked && !collectibleAll.indeterminate);
    }
    for (const { input, visibility } of collectibleGroups) {
      for (const element of visibility) element.toggleAttribute('data-completion-excluded', hideExcluded.checked && !input.checked);
    }
    for (const [id, owners] of linkedSections) {
      const excluded = owners.every(owner => hidden.has(owner));
      document.getElementById(id).toggleAttribute('data-completion-excluded', excluded);
    }
    const hideMinigames = hidden.has('minigame-completion');
    const hideTraining = hidden.has('training-and-upgrades');
    minigamesSection.toggleAttribute('data-completion-excluded', hideMinigames && hideTraining);
    minigamesIndex.toggleAttribute('data-completion-excluded', hideMinigames && hideTraining);
    for (const element of [...otherMinigames, ...otherMinigameLinks, ...masteryCells, minigameProgress]) {
      element.toggleAttribute('data-completion-excluded', hideMinigames);
    }
    for (const element of firstClearCells) {
      element.toggleAttribute('data-completion-excluded', hideTraining);
    }
    if (searchWasExcluded !== Boolean(document.querySelector('#substories')?.closest('[data-completion-excluded]'))) filterQuests();
    else filterTraining();
    document.dispatchEvent(new Event('kenzan:completion-visibility'));
  }

  function loadPreferences() {
    let saved;
    try {
      saved = JSON.parse(window.kenzanStorage.getItem(key));
    } catch {
      return;
    }
    const excluded = new Set(Array.isArray(saved?.excluded) ? saved.excluded : []);
    if (saved && saved.version !== 2) {
      for (const [old, extra] of [['locker-keys', 'locker-key-pickups'], ['arena-and-completion', 'coliseum-tournaments'],
        ['training-and-upgrades', 'training-inventions']]) {
        if (excluded.has(old)) excluded.add(extra);
      }
    }
    for (const { id, input } of categories) input.checked = !excluded.has(id);
    const excludedCollectibles = new Set(Array.isArray(saved?.excludedCollectibles) ? saved.excludedCollectibles : []);
    for (const { id, input } of collectibleGroups) input.checked = !excluded.has('collectibles') && !excludedCollectibles.has(id);
    updateCollectibleSelection();
    hideExcluded.checked = saved?.hideExcluded === true;
    updateVisibility();
  }

  function showHiddenSectionNotice() {
    if (!checklistClosest(findGuideTarget(location.hash.slice(1)), '[data-completion-excluded]')) return;
    hiddenNote.hidden = false;
    tracker.scrollIntoView();
  }

  tracker.addEventListener('change', event => {
    if (!event.target.matches('input[data-completion-include], [data-completion-collectible], #completion-collectibles-all, #completion-hide-excluded')) return;
    if (event.target === collectibleAll) {
      for (const { input } of collectibleGroups) input.checked = collectibleAll.checked;
    }
    updateCollectibleSelection();
    try {
      const excluded = categories.filter(({ input }) => !input.checked).map(({ id }) => id);
      if (!collectibleAll.checked && !collectibleAll.indeterminate) excluded.push('collectibles');
      const excludedCollectibles = collectibleGroups.filter(({ input }) => !input.checked).map(({ id }) => id);
      window.kenzanStorage.setItem(key, JSON.stringify({ version: 2, excluded, excludedCollectibles, hideExcluded: hideExcluded.checked }));
    } catch {
      // The settings still apply for this visit.
    }
    hiddenNote.hidden = true;
    updateVisibility();
    updateCounts();
  });
  // Read the synced checkboxes after the guide and map finish handling the change.
  function queueCounts() {
    if (refreshFrame) return;
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      updateCounts();
    });
  }
  document.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]') || tracker.contains(event.target)) return;
    queueCounts();
  }, { capture: true, signal: viewSignal });
  document.addEventListener('kenzan:side-progress', queueCounts, { signal: viewSignal });
  window.addEventListener('storage', event => {
    if (event.key === themeKey || event.key === null) loadTheme(event.key === themeKey || event.isTrusted);
    if (event.key === null || event.key === key) loadPreferences();
    updateCounts();
  }, { signal: viewSignal });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    loadTheme();
    loadPreferences();
    updateCounts();
  }, { signal: viewSignal });
  window.addEventListener('hashchange', () => {
    hiddenNote.hidden = true;
    showHiddenSectionNotice();
  }, { signal: viewSignal });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link?.hash === location.hash && !event.defaultPrevented && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      showHiddenSectionNotice();
    }
  }, { signal: viewSignal });
  loadPreferences();
  updateCounts();
  tracker.hidden = false;
  themeSettings.hidden = false;
  mountCompletionDrawer(compactTracker, tracker, themeSettings, viewSignal);
  viewSignal.addEventListener('abort', () => {
    if (refreshFrame) cancelAnimationFrame(refreshFrame);
  }, { once: true });
  indexLink.hidden = false;
  showHiddenSectionNotice();
})();
