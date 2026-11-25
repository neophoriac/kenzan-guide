const coliseumUseStory = document.querySelector('#coliseum-use-story');
const coliseumStatus = document.querySelector('#coliseum-progress');
const coliseumProgressPrefix = 'kenzan-guide:coliseum-done:';
const coliseumFiltersKey = 'kenzan-guide:coliseum-filters';
const coliseumGroups = ['tournaments', 'fighters'].map(name => {
  const group = document.querySelector('#coliseum-' + name);
  const table = group.querySelector('.table-wrap');
  const empty = group.querySelector('#coliseum-' + name + '-empty');
  const entries = [...group.querySelectorAll('[data-coliseum-done]')].map(checkbox => ({
    checkbox,
    row: checkbox.closest('tr'),
    key: coliseumProgressPrefix + checkbox.dataset.coliseumDone,
  }));
  return { group, table, empty, entries };
});

function filterColiseum(linkedRow) {
  const checkpoint = coliseumUseStory.checked && storyData.checkpoints[storyObjective.value];
  const completed = [];
  for (const { group, table, empty, entries } of coliseumGroups) {
    let shown = 0;
    let done = 0;
    for (const { checkbox, row } of entries) {
      const first = storyData.checkpoints[row.dataset.coliseumWindow];
      row.hidden = row !== linkedRow && (hideCompletedEntry(row, checkbox.checked)
        || Boolean(first && checkpoint && (!checkpoint.clock || checkpoint.order < first.order)));
      if (checkbox.checked) done += 1;
      if (!row.hidden) shown += 1;
    }
    table.hidden = shown === 0;
    empty.hidden = shown !== 0;
    if (document.activeElement?.closest('tr')?.hidden && group.contains(document.activeElement)) {
      group.querySelector('summary').focus({ preventScroll: true });
    }
    completed.push(done + ' of ' + entries.length);
  }
  coliseumStatus.textContent = completed[0] + ' tournaments cleared · ' + completed[1] + ' fighters defeated';
}

function loadColiseumProgress() {
  try {
    const filters = JSON.parse(window.kenzanStorage.getItem(coliseumFiltersKey));
    coliseumUseStory.checked = filters?.useStory !== false;
    for (const { entries } of coliseumGroups) {
      for (const { checkbox, key } of entries) checkbox.checked = window.kenzanStorage.getItem(key) === '1';
    }
  } catch {
    // The checklists still work for the current visit.
  }
  filterColiseum();
}

for (const { entries } of coliseumGroups) {
  for (const { checkbox, key } of entries) {
    checkbox.addEventListener('change', () => {
      saveProgress(checkbox, key);
      filterColiseum();
    });
  }
}
coliseumUseStory.addEventListener('change', () => {
  try {
    window.kenzanStorage.setItem(coliseumFiltersKey, JSON.stringify({ useStory: coliseumUseStory.checked }));
  } catch {
    // The filter still works for the current visit.
  }
  filterColiseum();
});
function showLinkedTournament() {
  if (!location.hash.startsWith('#coliseum-tournament-')) return;
  const row = findGuideTarget(location.hash.slice(1));
  if (!row || checklistClosest(row, '[data-completion-excluded]')) return;
  const panel = checklistClosest(row, 'details');
  panel.open = true;
  updateChecklistPanel(panel);
  filterColiseum(row);
  if (guideHost.getAttribute('data-restoring-scroll') !== 'saved') row.scrollIntoView({ block: 'nearest' });
}

document.addEventListener('kenzan:quest-filter', () => filterColiseum(), { signal: viewSignal });
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#coliseum-tournament-"]');
  if (link?.hash === location.hash && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    showLinkedTournament();
  }
}, { signal: viewSignal });
window.addEventListener('storage', ({ key }) => {
  if (key === null || key === coliseumFiltersKey || key.startsWith(coliseumProgressPrefix)) loadColiseumProgress();
}, { signal: viewSignal });
loadColiseumProgress();
(() => {
  const prefix = 'kenzan-guide:side-done:';
  const storyPrefix = 'kenzan-guide:side-show-all-windows:';
  const abilityLinks = [...document.querySelectorAll('[data-training-ability], [data-revelation-ability]')];
  const abilityAliases = new Map();
  for (const link of abilityLinks) {
    const { formerTraining, revelationAbility } = link.dataset;
    if (formerTraining) abilityAliases.set(link.hash.slice(1), `kenzan-guide:training-done:${formerTraining}`);
    if (revelationAbility) abilityAliases.set(link.hash.slice(1), `kenzan-guide:revelation-done:${revelationAbility}`);
  }
  const legacyAbilityKeys = new Set(abilityAliases.values());
  const checksByKey = new Map();
  const groups = [...document.querySelectorAll('[data-side-checklist]')].map(section => {
    const useStory = section.querySelector('[data-side-use-story]');
    const progress = section.querySelector('[data-side-progress]');
    const checks = [...section.querySelectorAll('[data-side-done]')];
    const rows = new Map();
    for (const check of checks) {
      const key = check.dataset.sideDone;
      if (!checksByKey.has(key)) checksByKey.set(key, []);
      checksByKey.get(key).push(check);
      const row = check.closest('tr, li');
      if (!row || row.hasAttribute('data-training-entry')) continue;
      if (!rows.has(row)) rows.set(row, []);
      rows.get(row).push(check);
    }
    for (const check of section.querySelectorAll('[data-collectible-collected]')) rows.get(check.closest('tr'))?.push(check);
    return { section, useStory, progress, checks, rows, storyKey: storyPrefix + section.id };
  });
  const lockers = groups.find(({ section }) => section.id === 'locker-keys');
  const openedLockers = new Map(lockers.checks.map(check => [check.dataset.sideDone, false]));
  const lockerPickups = new Map(lockers.checks.map(check => [check, check.closest('tr').querySelector('[data-collectible-collected]')]));

  function getSaved(key) {
    try {
      return window.kenzanStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }

  function saveChecked(key, checked) {
    try {
      if (checked) window.kenzanStorage.setItem(key, '1');
      else window.kenzanStorage.removeItem(key);
    } catch {
      // Checkmarks still work while the guide is open.
    }
  }

  function updateSection(group) {
    if (group === lockers) {
      for (const [check, pickup] of lockerPickups) {
        check.disabled = !pickup.checked;
        check.checked = pickup.checked && openedLockers.get(check.dataset.sideDone);
      }
    }
    const unique = new Map();
    for (const check of group.checks) {
      const key = check.dataset.sideDone;
      unique.set(key, check.checked || unique.get(key) === true);
    }
    const done = [...unique.values()].filter(Boolean).length;
    group.progress.textContent = `${done} of ${unique.size} ${group.progress.dataset.sideProgressUnit ?? 'done'}`;
    const current = group.useStory?.checked && storyData.checkpoints[storyObjective.value];
    for (const [row, checks] of group.rows) {
      const first = storyData.checkpoints[row.dataset.sideWindow];
      const closes = storyData.checkpoints[row.dataset.sideCloses];
      const outsideStory = current && ((first && current.order < first.order) || (closes && current.order >= closes.order));
      const goals = checks.filter(check => !checklistClosest(check, '[data-completion-excluded]'));
      row.hidden = Boolean(outsideStory || hideCompletedEntry(row, goals.length > 0 && goals.every(check => check.checked)));
      if (row.hidden && row.contains(document.activeElement)) {
        const next = [...row.parentElement.querySelectorAll('tr:not([hidden]) input[type="checkbox"]')]
          .find(input => !input.closest('[data-completion-excluded]'));
        (outsideStory ? group.useStory : next ?? group.progress).focus({ preventScroll: true });
      }
    }
    if (group.section.id === 'minigame-completion') filterTraining();
  }

  const abilitiesByKey = new Map();
  for (const link of abilityLinks) {
    const key = link.hash.slice(1);
    if (!abilitiesByKey.has(key)) abilitiesByKey.set(key, checksByKey.get(key)[0]);
  }

  function updateAbilityLinks() {
    for (const link of abilityLinks) {
      const checked = abilitiesByKey.get(link.hash.slice(1)).checked;
      link.textContent = checked ? 'Finished · Abilities' : 'Mark in Abilities';
    }
  }

  function loadChecks() {
    for (const [key, checks] of checksByKey) {
      const alias = abilityAliases.get(key);
      const checked = getSaved(prefix + key) || Boolean(alias && getSaved(alias));
      if (openedLockers.has(key)) openedLockers.set(key, checked);
      for (const check of checks) check.checked = checked;
    }
    for (const group of groups) {
      if (group.useStory) group.useStory.checked = !getSaved(group.storyKey);
      updateSection(group);
    }
    updateAbilityLinks();
    document.dispatchEvent(new Event('kenzan:ability-progress'));
  }

  function applySideCheckChange(check) {
      if (!check.matches('[data-side-done]') || check.disabled) return;
      const key = check.dataset.sideDone;
      const checked = check.checked;
      if (openedLockers.has(key)) openedLockers.set(key, checked);
      saveChecked(prefix + key, checked);
      const alias = abilityAliases.get(key);
      if (alias?.startsWith('kenzan-guide:training-done:')) saveChecked(alias, checked);
      if (alias?.startsWith('kenzan-guide:revelation-done:')) saveChecked(alias, checked);
      for (const peer of checksByKey.get(key)) peer.checked = checked;
      for (const affected of groups.filter(item => item.checks.some(peer => peer.dataset.sideDone === key))) {
        updateSection(affected);
      }
      if (alias) {
        updateAbilityLinks();
        document.dispatchEvent(new CustomEvent('kenzan:ability-progress', { detail: { checked, alias } }));
      }
      document.dispatchEvent(new CustomEvent('kenzan:side-progress', { detail: { key, checked } }));
  }

  // Alternate views share the registered controls even while their table bodies are detached.
  guideView.setSideChecklistProgress = (key, checked) => {
    const check = checksByKey.get(key)?.[0];
    if (!check || check.disabled) return false;
    check.checked = Boolean(checked);
    applySideCheckChange(check);
    return true;
  };
  for (const group of groups) {
    group.useStory?.addEventListener('change', () => {
      saveChecked(group.storyKey, !group.useStory.checked);
      updateSection(group);
    });
    group.section.addEventListener('change', event => {
      applySideCheckChange(event.target);
    });
  }
  document.addEventListener('kenzan:quest-filter', () => groups.forEach(updateSection), { signal: viewSignal });
  document.addEventListener('kenzan:completion-visibility', () => groups.forEach(updateSection), { signal: viewSignal });
  document.addEventListener('kenzan:collectible-progress', () => updateSection(lockers), { signal: viewSignal });
  window.addEventListener('storage', ({ key }) => {
    if (key === null || key.startsWith(prefix) || key.startsWith(storyPrefix) || legacyAbilityKeys.has(key)) loadChecks();
  }, { signal: viewSignal });
  loadChecks();
})();
