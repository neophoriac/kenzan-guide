const sidebar = document.querySelector('.sidebar');
const guideLayout = document.querySelector('#guide-layout');
const guideHost = guideLayout.closest('#guide-view');
const guideSidebar = setupSidebar(guideLayout, false, document.querySelector('#guide'), viewSignal, viewState.sidebar);
const toggle = document.querySelector('.index-toggle');
const hideCompleted = document.querySelector('#hide-completed');
const missableOnly = document.querySelector('#missable-only');
const storyObjective = document.querySelector('#story-objective');
const storyHelp = document.querySelector('#story-filter-help');
const storyData = JSON.parse(document.querySelector('#story-data').textContent);
const status = document.querySelector('#search-status');
const overview = document.querySelector('#overview');
const progress = document.querySelector('#quest-progress');
const trainingProgressKey = 'kenzan-guide:training-done:';
const trainingObjective = document.querySelector('#training-story-objective');
const trainingUseStory = document.querySelector('#training-use-story');
const trainingResults = document.querySelector('#training-results');
const trainingFiltersKey = 'kenzan-guide:training-filters';
const minigameUseStory = document.querySelector('#minigame-completion [data-side-use-story]');
const collectibleRows = [...document.querySelectorAll('#collectibles [data-collectible-collected]')].map(check => ({ check, row: check.closest('tr') }));
const revelationEntries = [...document.querySelectorAll('#revelations .revelation-entry')].map(entry => ({
  entry,
  check: document.getElementById(entry.querySelector('[data-revelation-ability]').hash.slice(1)).querySelector('[data-side-done]'),
}));
const trainingChecks = [...document.querySelectorAll('[data-training-done]')].map(checkbox => ({
  checkbox,
  progressKey: trainingProgressKey + checkbox.dataset.trainingDone,
}));
const trainingGroups = [...document.querySelectorAll('[data-training-group]')].map(group => ({
  group,
  minigame: group.hasAttribute('data-training-minigame'),
  count: group.querySelector('[data-training-count]'),
  empty: group.querySelector('[data-training-empty]'),
  table: group.querySelector('.table-wrap'),
  rows: [...group.querySelectorAll('[data-training-entry]')].map(row => ({
    row,
    checkbox: row.querySelector('[data-training-done]') ?? document.getElementById(row.querySelector('[data-training-ability]').hash.slice(1)).querySelector('[data-side-done]'),
    firstClear: row.querySelector('[data-minigame-first-clear]'),
    mastery: row.querySelector('[data-minigame-mastery] input'),
    rule: storyData.training[row.dataset.trainingEntry],
    warning: row.querySelector('.quest-prerequisite-warning'),
    continuation: row.querySelector('[data-training-continuation]'),
  })),
}));
const chapters = [...document.querySelectorAll('.chapter')].map(chapter => ({
  chapter,
  index: document.querySelector(`[data-index="${chapter.id}"]`),
  overview: chapter.querySelector('.chapter-overview'),
  groups: [...chapter.querySelectorAll('.quest-group')],
}));
const supplements = [...document.querySelectorAll('.supplement, #in-game-checklist-index, #kenzan-checklist-entries, #supplement-index')];
const indexLinks = new Map([...sidebar.querySelectorAll('nav a')].map(link => [link.hash.slice(1), link]));
const entries = [...document.querySelectorAll('.quest')].map(quest => ({
  quest,
  id: Number(quest.dataset.number),
  link: document.querySelector(`#index-${quest.id}`),
  windowNote: quest.querySelector('.quest-window-note'),
  checkbox: quest.querySelector('.quest-check input'),
  missable: quest.hasAttribute('data-missable'),
  progressKey: `${questProgressPrefix}${quest.dataset.number}`,
}));
const questIds = entries.map(entry => entry.id);
let linkedChecklistEntry;
let linkedQuestEntry;
let linkedFocusHash;
let filterURLTimer = 0;

function cancelFilterURLWrite() {
  clearTimeout(filterURLTimer);
  filterURLTimer = 0;
}

function readGuideFilterURL() {
  const parameters = new URLSearchParams(location.search);
  const next = { hideCompleted: parameters.get('hide-completed') === '1',
    missableOnly: parameters.get('missables') === '1' };
  const changed = hideCompleted.checked !== next.hideCompleted || missableOnly.checked !== next.missableOnly;
  hideCompleted.checked = next.hideCompleted;
  missableOnly.checked = next.missableOnly;
  return changed;
}

function guideFilterURL() {
  const url = new URL(location.href);
  for (const [key, value] of [['hide-completed', hideCompleted.checked ? '1' : ''],
    ['missables', missableOnly.checked ? '1' : '']]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  return url;
}

function flushGuideFilterURL() {
  cancelFilterURLWrite();
  if (viewSignal.aborted) return false;
  const url = guideFilterURL();
  if (url.href === location.href) return true;
  try {
    history.replaceState(history.state, '', url);
    return true;
  } catch {
    // A browser may rate-limit or forbid history writes. Filtering must still
    // work, and the next deliberate commit can retry updating the address.
    return false;
  }
}

function writeGuideFilterURL() {
  cancelFilterURLWrite();
  if (guideFilterURL().href === location.href) return;
  const source = location.href;
  filterURLTimer = setTimeout(() => {
    filterURLTimer = 0;
    // Traversal or another route owns the URL once it changes. Never let an
    // old search timer overwrite that newer address.
    if (!viewSignal.aborted && location.href === source) flushGuideFilterURL();
  }, 200);
}
readGuideFilterURL();

const guideCollectibleKey = 'kenzan-atlas:collected:';
const guideCollectibleChecks = [...document.querySelectorAll('#guide [data-collectible-collected]')];
function loadGuideCollectibles() {
  try {
    for (const check of guideCollectibleChecks) {
      check.checked = window.kenzanStorage.getItem(guideCollectibleKey + check.dataset.collectibleCollected) === '1';
    }
  } catch {
    // Keep the current checkmarks when file storage is unavailable.
  }
  document.dispatchEvent(new Event('kenzan:collectible-progress'));
}

guideLayout.addEventListener('change', event => {
  const id = event.target.dataset?.collectibleCollected;
  if (!id) return;
  const checked = event.target.checked;
  try {
    if (checked) window.kenzanStorage.setItem(guideCollectibleKey + id, '1');
    else window.kenzanStorage.removeItem(guideCollectibleKey + id);
  } catch {
    // Keep the in-page change when file storage is unavailable.
  }
  for (const check of guideCollectibleChecks) {
    if (check.dataset.collectibleCollected === id) check.checked = checked;
  }
  document.dispatchEvent(new Event('kenzan:collectible-progress'));
});

function hideCompletedEntry(entry, done) {
  return hideCompleted.checked && done && entry !== linkedChecklistEntry;
}

function filterCollectibles() {
  for (const { row, check } of collectibleRows) row.hidden = hideCompletedEntry(row, check.checked);
  const active = document.activeElement?.closest('#collectibles tr[hidden]');
  if (active) active.closest('details')?.querySelector('summary').focus({ preventScroll: true });
}

function filterRevelations() {
  for (const { entry, check } of revelationEntries) entry.hidden = hideCompletedEntry(entry, check.checked);
}

function trainingStoryMatches(rule, checkpoint) {
  if (!checkpoint) return true;
  const { order, clock, code } = checkpoint;
  if (order < rule.first || (rule.closes && order >= rule.closes)) return false;
  if (rule.storyOnly?.includes(code)) return true;
  return Boolean(clock) && (!rule.clocks || rule.clocks.includes(clock))
    && (!rule.freeRoamFrom || order >= rule.freeRoamFrom);
}

function filterTraining() {
  trainingObjective.value = storyObjective.value;
  const story = storyData.checkpoints[storyObjective.value];
  const checkpoint = trainingUseStory.checked ? story : undefined;
  const completedTraining = new Set(trainingGroups.flatMap(({ rows }) => rows
    .filter(({ checkbox }) => checkbox.checked).map(({ row }) => row.dataset.trainingEntry)));
  const completedQuests = new Set(entries.filter(({ checkbox }) => checkbox.checked).map(({ id }) => id));
  let total = 0;
  for (const { group, minigame, count, empty, table, rows } of trainingGroups) {
    const current = minigame ? (minigameUseStory.checked ? story : undefined) : checkpoint;
    let shown = 0;
    for (const { row, checkbox, firstClear, mastery, rule, warning, continuation } of rows) {
      const clearVisible = !firstClear?.hasAttribute('data-completion-excluded');
      const masteryVisible = mastery && !checklistClosest(mastery, '[data-completion-excluded]');
      const done = (!clearVisible || checkbox.checked) && (!masteryVisible || mastery.checked);
      row.hidden = hideCompletedEntry(row, done) || !trainingStoryMatches(rule, current);
      if (row.hidden || checklistClosest(row, '[data-completion-excluded]')) continue;
      shown += 1;
      warning.hidden = !current || checkbox.checked || !(rule.after?.some(id => !completedTraining.has(id))
        || rule.quests?.some(id => !completedQuests.has(id)));
      continuation.hidden = !(current && rule.continuation && current.order >= rule.continuation.from);
      if (!continuation.hidden) continuation.textContent = rule.continuation.note;
    }
    count.textContent = `(${shown})`;
    table.hidden = shown === 0;
    empty.hidden = shown !== 0;
    if (group.contains(document.activeElement) && document.activeElement.closest('[data-training-entry]')?.hidden) {
      group.querySelector('summary').focus({ preventScroll: true });
    }
    if (!minigame) total += shown;
  }
  const windowLabel = checkpoint ? storyObjective.selectedOptions[0].textContent : 'All story windows';
  trainingResults.textContent = `${windowLabel} · ${total} ${total === 1 ? 'activity' : 'activities'}`;
}

function showProgress(saves = true) {
  const done = entries.filter(({ checkbox }) => checkbox.checked).length;
  progress.textContent = `${done} of ${entries.length} done${window.kenzanStorage.pendingCount ? ' · Unsaved changes' : saves ? '' : ' · Browser storage unavailable'}`;
}

function loadProgress() {
  try {
    const storage = window.kenzanStorage;
    const savedObjective = storage.getItem(storyWindowKey);
    storyObjective.value = Object.hasOwn(storyData.checkpoints, savedObjective) ? savedObjective : '';
    for (const { checkbox, progressKey } of [...entries, ...trainingChecks]) {
      checkbox.checked = storage.getItem(progressKey) === '1';
    }
    const trainingFilters = JSON.parse(storage.getItem(trainingFiltersKey));
    trainingUseStory.checked = trainingFilters?.useStory !== false;
    showProgress();
  } catch {
    storyObjective.value = viewState.filters.objective ?? '';
    showProgress(false);
  }
  filterQuests();
}

function saveProgress(checkbox, key) {
  try {
    if (checkbox.checked) window.kenzanStorage.setItem(key, '1');
    else window.kenzanStorage.removeItem(key);
    showProgress();
  } catch {
    showProgress(false);
  }
}

function filterQuests({ linkedEntry } = {}) {
  linkedQuestEntry = linkedEntry;
  const substoriesExcluded = Boolean(document.querySelector('#substories')?.closest('[data-completion-excluded]'));
  const checkpoint = storyData.checkpoints[storyObjective.value];
  const completed = new Set(entries.filter(({ checkbox }) => checkbox.checked).map(({ id }) => id));
  const mapState = questMapFilter(storyData, questIds, completed,
    storyObjective.value, hideCompleted.checked, missableOnly.checked);
  Object.assign(viewState.filters, { objective: storyObjective.value,
    hideCompleted: hideCompleted.checked, missableOnly: missableOnly.checked });
  writeGuideFilterURL();
  const filtering = Boolean(checkpoint) || hideCompleted.checked || missableOnly.checked;
  const retainChapterOverviews = Boolean(checkpoint);
  let count = 0;
  for (const entry of entries) {
    const { quest, link, windowNote } = entry;
    const { text: questNote, prerequisiteWarning } = mapState.notes[entry.id] ?? {};
    const matches = mapState.eligible.has(entry.id);
    const linked = entry === linkedEntry && !matches;
    quest.hidden = !matches && !linked;
    link.parentElement.hidden = quest.hidden;
    const note = [linked && 'Opened from a link. This quest is outside your current results.', questNote].filter(Boolean).join(' ');
    windowNote.hidden = !note;
    windowNote.classList.toggle('quest-prerequisite-warning', Boolean(prerequisiteWarning));
    if (note) windowNote.textContent = note;
    if (matches) count += 1;
  }
  for (const { chapter, index, overview: chapterOverview, groups } of chapters) {
    for (const group of groups) group.hidden = !group.querySelector('.quest:not([hidden])');
    const empty = groups.every(group => group.hidden);
    chapter.hidden = empty && !retainChapterOverviews;
    chapterOverview.hidden = filtering && !retainChapterOverviews;
    index.hidden = chapter.hidden;
  }
  for (const section of supplements) section.hidden = false;
  overview.hidden = Boolean(checkpoint);
  status.hidden = !filtering || substoriesExcluded;
  storyHelp.hidden = !checkpoint;
  const results = count === 0 ? 'No matching quests' : `${count} matching ${count === 1 ? 'quest' : 'quests'}`;
  status.textContent = checkpoint && !checkpoint.clock ? 'No substories during this story segment' : results;
  filterTraining();
  filterCollectibles();
  filterRevelations();
  document.dispatchEvent(new CustomEvent('kenzan:quest-filter', { detail: mapState }));
}

function followHash(reveal = true) {
  guideView.pendingNavigation = undefined;
  guideView.revealInventoryLink?.();
  const id = guideHashId();
  if (id === 'quest-map') return;
  const target = findGuideTarget(id);
  if (target?.id === 'save-sync') target.open = true;
  const supplement = checklistClosest(target, '.supplement');
  const previousEntry = linkedChecklistEntry;
  const excluded = checklistClosest(target, '[data-completion-excluded]');
  const entry = entries.find(({ quest }) => quest.id === id);
  const previousQuest = linkedQuestEntry;
  const linkedQuest = !excluded && entry && (entry === previousQuest || (reveal && entry.quest.hidden))
    ? entry : undefined;
  const openCompletedEntry = hideCompleted.checked && !excluded && target?.matches('tr, .revelation-entry')
    && (target.hidden || target === previousEntry);
  linkedChecklistEntry = openCompletedEntry ? target : undefined;
  if (previousEntry !== linkedChecklistEntry || previousQuest !== linkedQuest) {
    // A link may temporarily reveal a quest outside the current filters. Its
    // article and index row must return to those filters when the route changes.
    filterQuests({ linkedEntry: linkedQuest });
  }
  if (excluded) return;
  const group = checklistClosest(target, 'details');
  const groups = [];
  for (let panel = group; panel; panel = panel.parentElement.closest('details')) {
    groups.unshift(panel);
    if (!panel.open) {
      panel.open = true;
    }
  }
  guideView.pendingNavigation = Promise.all(groups.flatMap(panel => [updateChecklistPanel(panel), updateWalkthrough(panel)]));
  let link = entry?.link ?? indexLinks.get(id);
  for (let element = target?.parentElement; !link && element && supplement?.contains(element); element = element.parentElement) {
    link = indexLinks.get(element.id);
  }
  sidebar.querySelector('[aria-current]')?.removeAttribute('aria-current');
  if (!link) return;
  link.setAttribute('aria-current', 'location');
  for (let parent = link.closest('.checklist-index-group'); parent; parent = parent.parentElement.closest('.checklist-index-group')) {
    parent.open = true;
  }
  if (entry) {
    if (entry.quest.hidden && reveal) {
      filterQuests({ linkedEntry: entry });
    }
    if (!entry.quest.hidden) link.closest('details').open = true;
  }
}

hideCompleted.addEventListener('change', () => {
  linkedChecklistEntry = undefined;
  filterQuests();
  flushGuideFilterURL();
});
missableOnly.addEventListener('change', () => { filterQuests(); flushGuideFilterURL(); });
trainingObjective.replaceChildren(...[...storyObjective.children].map(option => option.cloneNode(true)));
trainingObjective.addEventListener('change', () => {
  storyObjective.value = trainingObjective.value;
  storyObjective.dispatchEvent(new Event('change'));
});
storyObjective.addEventListener('change', () => {
  window.kenzanStoryFollow.pause();
  try {
    window.kenzanStorage.setItem(storyWindowKey, storyObjective.value);
  } catch {
    showProgress(false);
  }
  filterQuests();
});
sidebar.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (guideSidebar.closeOnMobile()) {
    toggle.focus();
  }
});
sidebar.querySelector('nav').addEventListener('click', event => {
  const anchor = event.target.closest('a');
  if (!anchor) return;
  if (anchor.classList.contains('chapter-link') && missableOnly.checked) {
    missableOnly.checked = false;
    filterQuests();
    flushGuideFilterURL();
  }
  guideSidebar.closeOnMobile();
});
function guideDetailsPanels() {
  return [...guideHost.querySelectorAll('details')].filter(panel =>
    !panel.closest('tbody, .quest-full-content, #save-sync-manual-list, #story-pickup-review, [data-inventory-reference]'));
}

viewSignal.addEventListener('abort', () => {
  cancelFilterURLWrite();
  viewState.sidebarScroll = sidebar.scrollTop;
  viewState.openPanels = guideDetailsPanels().map(panel => panel.open);
}, { once: true });

const guideView = {
  navigation: 0,
  focusLinkDestination(hash) { linkedFocusHash = guideHashId(hash); },
  flushFiltersURL: flushGuideFilterURL,
  rememberScroll() {
    const main = guideLayout.querySelector('#guide');
    const { left, width } = main.getBoundingClientRect();
    const x = Math.min(innerWidth - 1, left + width / 2);
    const node = document.elementFromPoint(x, Math.min(innerHeight - 1, 180));
    const landmark = main.contains(node) ? node.closest('article[id], tr[id], details[id], section[id], #overview') : undefined;
    viewState.scroll = {
      top: window.scrollY,
      id: landmark?.id,
      offset: landmark?.getBoundingClientRect().top,
    };
  },
  async open({ reveal, restoreScroll, focus = false }) {
    const id = guideHashId();
    const navigation = ++guideView.navigation;
    focus ||= linkedFocusHash === id;
    const filtersChanged = readGuideFilterURL();
    const queryOnly = guideView.openedHash === location.hash && guideView.openedSearch !== location.search;
    guideView.openedHash = location.hash;
    guideView.openedSearch = location.search;
    if (filtersChanged) filterQuests();
    const previousFocus = document.activeElement;
    function focusDestination() {
      if (!focus || (document.activeElement !== previousFocus && document.activeElement !== document.body)) return;
      const usable = element => element?.isConnected && element.getClientRects().length
        && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[hidden], [inert]');
      const destination = findGuideTarget(id) ?? (restoreScroll?.id && findGuideTarget(restoreScroll.id));
      const target = destination?.matches('summary, button, a, input, select, textarea') ? destination
        : destination?.querySelector(':scope > summary, :scope > h1, :scope > h2, :scope > h3, :scope > h4, .quest-heading > h4') ?? destination;
      const fallback = document.querySelector('#overview') ?? document.querySelector('#guide h1');
      const node = usable(target) ? target : usable(fallback) ? fallback : document.querySelector('#guide h1');
      if (!usable(node)) return;
      if (!node.matches('summary, button, a, input, select, textarea') && !node.hasAttribute('tabindex')) node.tabIndex = -1;
      node.focus({ preventScroll: true });
      if (linkedFocusHash === id) linkedFocusHash = undefined;
    }
    if (restoreScroll?.top > 0) guideHost.setAttribute('data-restoring-scroll', 'saved');
    else guideHost.removeAttribute('data-restoring-scroll');
    const restoring = restoreScroll !== undefined;
    if (!queryOnly) {
      await materializeGuideTarget(id, () => navigation === guideView.navigation && guideHashId() === id);
      if (viewSignal.aborted || navigation !== guideView.navigation || guideHashId() !== id) return;
      followHash(reveal);
      showLinkedTournament();
    }
    guideView.openedSearch = location.search;
    if (restoring || (!queryOnly && id && id !== 'guide') || focus) {
      requestAnimationFrame(async () => {
        await guideView.pendingNavigation;
        if (restoring || focus || id) await settleGuideContent();
        if (viewSignal.aborted || navigation !== guideView.navigation || guideHashId() !== id) return;
        if (restoring) {
          sidebar.scrollTop = viewState.sidebarScroll ?? 0;
          const landmark = restoreScroll.id && document.getElementById(restoreScroll.id);
          const top = landmark?.getClientRects().length
            ? window.scrollY + landmark.getBoundingClientRect().top - restoreScroll.offset : restoreScroll.top;
          window.scrollTo(0, restoreScroll.top === 0 ? 0 : top);
        } else if (!queryOnly && id && id !== 'guide') {
          const target = findGuideTarget(id);
          target?.scrollIntoView();
        }
        focusDestination();
      });
    }
  },
};
function revealPrerequisite(hash) {
  const entry = entries.find(({ quest }) => `#${quest.id}` === hash);
  if (entry?.quest.closest('[data-completion-excluded]')) return;
  if (entry?.quest.hidden) filterQuests({ linkedEntry: entry });
  return entry;
}

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (anchor.hasAttribute('data-prerequisite')) revealPrerequisite(anchor.hash);
  if (anchor.hash === location.hash && anchor.hash !== '#quest-map') guideView.open({ reveal: true });
}, { signal: viewSignal });
for (const [index, { quest, checkbox, progressKey }] of entries.entries()) {
  checkbox.addEventListener('change', () => {
    const wasFocused = document.activeElement === checkbox;
    saveProgress(checkbox, progressKey);
    filterQuests();
    if (wasFocused && quest.hidden) {
      const next = entries.slice(index + 1).find(entry => !entry.quest.hidden)
        ?? entries.slice(0, index).findLast(entry => !entry.quest.hidden);
      (next?.checkbox ?? status).focus();
    }
  });
}
for (const { checkbox, progressKey } of trainingChecks) {
  checkbox.addEventListener('change', () => {
    saveProgress(checkbox, progressKey);
    filterTraining();
  });
}
trainingUseStory.addEventListener('change', () => {
  try {
    window.kenzanStorage.setItem(trainingFiltersKey, JSON.stringify({ useStory: trainingUseStory.checked }));
  } catch {
    // The filter still works for the current visit.
  }
  filterTraining();
});
document.addEventListener('kenzan:ability-progress', filterTraining, { signal: viewSignal });
document.addEventListener('kenzan:ability-progress', filterRevelations, { signal: viewSignal });
document.addEventListener('kenzan:collectible-progress', filterCollectibles, { signal: viewSignal });
window.addEventListener('storage', event => {
  if (event.key === null || event.key === storyWindowKey || event.key.startsWith(questProgressPrefix)
    || event.key === trainingFiltersKey || event.key.startsWith(trainingProgressKey)) loadProgress();
  if (event.key === null || event.key.startsWith(guideCollectibleKey)) loadGuideCollectibles();
}, { signal: viewSignal });
window.addEventListener('pageshow', event => {
  if (event.persisted) loadProgress();
}, { signal: viewSignal });
window.addEventListener('popstate', () => {
  cancelFilterURLWrite();
  if (readGuideFilterURL()) {
    linkedChecklistEntry = undefined;
    filterQuests();
  }
}, { signal: viewSignal });
window.addEventListener('beforeunload', flushGuideFilterURL, { signal: viewSignal });
window.addEventListener('pagehide', flushGuideFilterURL, { signal: viewSignal });
document.addEventListener('click', event => {
  // Commit before the browser resolves a relative hash link or opens a new tab.
  if (!event.defaultPrevented && event.target.closest('a[href]')) flushGuideFilterURL();
}, { capture: true, signal: viewSignal });
document.addEventListener('kenzan:storage-state', () => showProgress(), { signal: viewSignal });
loadGuideCollectibles();
if (viewState.openPanels) {
  guideDetailsPanels().forEach((panel, index) => { panel.open = viewState.openPanels[index] ?? panel.open; });
}
loadProgress();
if (new URLSearchParams(location.search).has('prerequisite')) {
  const entry = revealPrerequisite(location.hash);
  if (entry) requestAnimationFrame(() => entry.quest.scrollIntoView());
}

