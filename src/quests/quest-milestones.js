// A view of the shared save snapshot, not another save reader. Personal save
// facts stay in this mounted view; only explicit guide checks use the facade.
function mountQuestMilestones(signal, viewState = {}) {
  const host = document.querySelector('#guide-view') ?? document;
  const data = host.querySelector('#quest-milestones-data');
  if (!data) return () => {};
  let registry;
  try { registry = JSON.parse(data.textContent); } catch { return () => {}; }
  if (!Array.isArray(registry.quests)) return () => {};
  const definitions = new Map(registry.quests.map(quest => [String(quest.id), quest]));
  const state = viewState.questMilestones ??= { helpOpen: [] };
  const openHelp = new Set(state.helpOpen ?? []);
  const memory = new Map();
  const panels = [...host.querySelectorAll('[data-quest-milestones]')].map(element => ({
    element,
    definition: definitions.get(element.dataset.questMilestones),
    rows: [...element.querySelectorAll('[data-milestone-row]')],
    help: element.querySelector('.quest-milestones-help'),
  })).filter(panel => panel.definition);
  let latest = null;
  let connection = 'unconnected';
  let scheduled = false;

  function check(key) {
    if (!key) return false;
    try { return window.kenzanStorage.getItem(key) === '1'; }
    catch { return memory.get(key) === true; }
  }
  function guideCount(spec) {
    return Array.isArray(spec?.keys) ? spec.keys.filter(check).length : null;
  }
  function counterText(counter, questId, counterId) {
    if (!counter) return 'Save: count unknown';
    const { value, minimum, target, required } = counter;
    if (Number(questId) === 69 && counterId === 'tastings' && counter.complete === true) {
      return 'Save: tasting requirement met';
    }
    if (counter.completedByEvent === true) return 'Save: requirement met';
    if (required && Number.isFinite(value)) return `Save: ${value} returned · ${required} needed, up to ${target}`;
    if (Number.isFinite(value)) return `Save: ${value} / ${target}`;
    if (counter.complete === true) return 'Save: requirement met · exact count unknown';
    if (Number.isFinite(minimum) && minimum > 0) return `Save: at least ${minimum} / ${target}`;
    return 'Save: count unknown';
  }
  function factText(row, definition, questId, counter) {
    if (definition.counterId) {
      if (row?.complete === true && Number(questId) === 69) return 'Save: tasting requirement met';
      if (row?.complete === true && !Number.isFinite(counter?.value)) return 'Save: requirement met · exact count unknown';
      return counterText(counter, questId, definition.counterId);
    }
    if (row?.complete !== true && row?.complete !== false) return 'Save: unknown';
    if (row.complete === false) return 'Save: not recorded';
    if (row.used === true) return 'Save: used for remedy';
    if (definition.kind === 'ingredient') return 'Save: ingredient available';
    if (definition.kind === 'acquisition') return 'Save: acquired';
    if (definition.kind === 'invention') return 'Save: made';
    if (definition.kind === 'prerequisite') return 'Save: met';
    if (Number(questId) === 58) return 'Save: returned';
    if (Number(questId) === 86 && definition.id === 'return-all') return 'Save: handed over together';
    return definition.kind === 'delivery' ? 'Save: handed over' : 'Save: recorded';
  }
  function ownershipText(owned, used) {
    if (!owned) return '';
    if (owned.kind === 'key') {
      if (owned.held === null) return 'Quest-item possession unknown';
      if (used === true && !owned.held) return 'Quest item already used';
      return owned.held ? 'Quest item held now' : 'Quest item not held now';
    }
    const player = Number.isFinite(owned.onPlayer) ? owned.onPlayer : 'unknown';
    const storage = Number.isFinite(owned.storage) ? owned.storage : 'unknown';
    if (owned.total === null && owned.minimum > 0) return `Owned now: at least ${owned.minimum} · on you ${player}, storage ${storage}`;
    if (owned.total === null) return `Owned now: unknown · on you ${player}, storage ${storage}`;
    return `Owned now: ${owned.total} · on you ${player}, storage ${storage}${used === true ? ' · already used for remedy' : ''}`;
  }
  function actionText(row, definition, quest, record, prerequisite = false) {
    const id = definition.id;
    const rows = new Map((record?.milestones ?? []).map(item => [item.id, item]));
    const done = key => rows.get(key)?.complete === true;
    const all = keys => keys.every(done);
    const held = row?.owned?.onPlayer > 0 || row?.owned?.held === true;
    const stored = !held && row?.owned?.storage > 0;
    const finished = record?.complete === true;
    if (finished) {
      if (quest.id === 20) return 'Five copies accepted; request complete.';
      if (quest.id === 58) return row?.complete === true ? '5,000 mon earned.' : 'Search finished; no more required.';
      if (quest.id === 69) return 'Ultimate Fried Udon unlocked.';
      if (quest.id === 103) return '5,000 mon earned.';
      return quest.id === 138 ? 'Bounty complete.' : 'Request complete.';
    }
    switch (quest.id) {
      case 20: {
        if (record?.counters?.['accepted-swords']?.value >= 5) return 'Five copies accepted; request complete.';
        if (id === 'beckoning-sword' && held) return 'Finish #42 if still borrowed.';
        if (held) return 'Bring to the swordsmith.';
        if (stored) return 'Collect from storage.';
        if (row?.acquired === true || row?.complete === true) return row?.owned?.total === 0
          ? 'Bring another copy; duplicates count.'
          : 'Check inventory; bring any qualifying sword.';
        return {
          bassarimaru: 'Buy at Ebisuya if needed.',
          'drunken-blade': 'Complete #25 if needed.',
          'beckoning-sword': 'Claim #42’s permanent reward if needed.',
          'greedy-katana': 'Complete #43 if needed.',
          'mortal-blade': 'Read #136’s poster; defeat Heinosuke.',
        }[id];
      }
      case 31:
        return row?.complete === true ? 'Speak to the palanquin bearer.' : 'Take 30 palanquin rides.';
      case 36: {
        if (done('deliver')) return 'Wait three minutes; revisit the stall.';
        const made = done('poultice') || row?.used === true;
        if (definition.kind === 'ingredient') {
          if (made) return 'Deliver the poultice by day.';
          if (stored) return 'Collect from storage.';
          if (held) return 'Bring to Gyotensai.';
          return {
            'togarashi-set': 'Speak to her father.',
            washi: 'Complete #47 Talent.',
            'dried-agar': 'Buy from the turtle vendor.',
          }[id];
        }
        if (id === 'poultice') return made ? 'Deliver the poultice by day.' : 'Make Back Pain Remedy.';
        return made ? 'Deliver the poultice by day.' : 'Make the poultice first.';
      }
      case 44:
        if (done('dango')) return 'Collect your reward.';
        if (id === 'pill') return done('pill') ? 'Check the door; fetch dango.' : 'Give the Special Vitality Pill.';
        return done('pill') ? 'Bring Kusa Dango.' : 'Give the pill first.';
      case 58: {
        const returned = record?.counters?.['returned-cats'];
        if (row?.complete === true) return 'More cats are optional.';
        return returned?.minimum >= 1 || returned?.value >= 1 ? 'Optional: return another cat.' : 'Return a cat to Tsuchiura.';
      }
      case 61: {
        if (row?.complete === true) {
          const next = latest?.questMilestones?.quests?.[62];
          if (next?.complete === true) return 'Restaurant request complete.';
          if (next?.milestones?.some(item => item.id === 'blend-7' && item.complete === true)) return 'Visit her father; then Shirohebi.';
          return all(quest.milestones.map(item => item.id)) ? 'Continue with request #62.' : 'Deliver the remaining ingredients.';
        }
        if (stored) return 'Collect from storage.';
        if (held) return 'Give to her father.';
        const vendor = ['shiso', 'sansho', 'ginger', 'sesame'].includes(id) ? 'Etchuya Drugs'
          : id === 'nori' ? 'Turtle vendor' : 'Arigataya Market';
        return `${vendor}, if needed.`;
      }
      case 62:
        if (done('blend-7')) return 'Visit her father; then Shirohebi.';
        if (row?.complete === true) return id === 'blend-3' && !done('blend-5') ? '5-Blend is optional.' : 'Give 7-Blend to advance.';
        if (id !== 'blend-7') return 'Optional; give before 7-Blend.';
        return 'Give 7-Blend after optional blends.';
      case 65:
        if (done('reward')) return 'Reward collected.';
        if (all(['meal-1', 'meal-2', 'meal-3'])) return 'If still following, dig where it stops.';
        if (id === 'reward') return 'Feed three meals first.';
        return row?.complete === true ? 'Offer the next meal.' : 'Raw Chicken recommended.';
      case 69: {
        const tasted = rows.get('tastings')?.complete === true || record?.counters?.tastings?.complete === true;
        if (done('ultimate-udon')) return 'Ultimate Fried Udon unlocked.';
        if (tasted) return 'Order Ultimate Fried Udon.';
        return id === 'tastings' ? 'Taste; leave and re-enter.' : 'Taste at least five times.';
      }
      case 86:
        if (done('return-all')) return 'Visit the father and daughter.';
        if (id === 'return-all' || row?.complete === true) return all(['sugar', 'syrup', 'egg', 'flour'])
          ? 'Return all four together.'
          : 'Collect all four first.';
        return {
          sugar: 'Ask the Ebisu Street confectioner.',
          syrup: 'Ask the Higashiyama candy vendor.',
          egg: 'Buy on Countryside Path.',
          flour: 'Ask outside Shirohebi Udon.',
        }[id];
      case 87:
        if (done('offering-2')) return 'Speak to the old man.';
        if (id === 'offering-1') return done('offering-1') ? 'Offer the second Ohagi.' : 'Offer Ohagi; close your eyes.';
        return done('offering-1') ? 'Offer; close, then open your eyes.' : 'Make the first offering.';
      case 97: {
        if (done('flight')) return 'Return to Gyotensai.';
        const materials = ['rake', 'bamboo', 'washi'];
        if (all(materials)) return id === 'flight' ? 'Agree if needed; launch in Chapter 11 daylight.' : 'Agree to the test if needed.';
        const next = materials.find(key => !done(key));
        if (prerequisite) {
          if (materials.some(key => done(key) || rows.get(key)?.acquired === true)) return 'Supply the next material.';
          if (row?.complete === true) return record?.prerequisites?.length === 3 && record.prerequisites.every(item => item.complete === true)
            ? 'Discuss the flying machine.' : 'Finish the other inventions.';
          return `Invent ${definition.label} with Gyotensai.`;
        }
        if (id === 'flight') return 'Supply the materials first.';
        if (row?.complete === true) return next === 'bamboo' ? 'Bring Bamboo Sticks next.' : 'Bring Washi next.';
        const preceding = materials.slice(0, materials.indexOf(id));
        if (preceding.some(key => rows.get(key)?.complete === false)) return id === 'bamboo' ? 'Supply Rake first.' : 'Supply Rake and Bamboo Sticks first.';
        if (held) return 'Bring to Gyotensai when requested.';
        if (stored) return 'Collect from storage.';
        return {
          rake: 'Check beside the Countryside stable.',
          bamboo: 'Look south of the blacksmith.',
          washi: 'Use the Washi from #47.',
        }[id];
      }
      case 100: {
        const counters = record?.counters;
        if (row?.complete === true) return ['requests', 'commissions', 'bounties', 'fighters'].every(key => counters?.[key]?.complete === true)
          ? 'Visit Okappiki; return at night.' : 'Finish the other requirements.';
        return {
          requests: 'Finish the remaining requests.', commissions: 'Finish the remaining commissions.',
          bounties: 'Finish the remaining bounties.', fighters: 'Defeat each Hozoin fighter once.',
        }[id];
      }
      case 103:
        if (done('offer-2')) return 'Speak to Yosuke.';
        if (done('offer-1')) return 'Offer a second food item.';
        return id === 'offer-1' ? 'Offer suitable food.' : 'Offer suitable food twice.';
      case 113:
        if (done('reward-letter')) return 'Final letter read.';
        if (all(['round-1', 'round-2', 'round-3'])) return 'Read the final Tatsuya letter.';
        if (id === 'reward-letter') return 'Finish all three rounds first.';
        if (row?.complete === true) return 'Read the next Tatsuya letter.';
        return id === 'round-1' ? 'Visit Tsubaki, then the customer.' : 'Read; visit Tsubaki, then the customer.';
      case 138:
        return row?.complete === true ? 'Read the poster; visit at night.' : 'Fight 80 ordinary street encounters.';
      default: return 'See the walkthrough.';
    }
  }
  function setText(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
  }
  function renderProgress(element, record, questId) {
    const bar = element.querySelector('[data-milestone-bar]');
    const summary = element.querySelector('[data-milestone-progress-value]');
    if (!bar || !summary) return;
    const target = Number(element.dataset.progressTarget);
    const label = element.dataset.progressLabel;
    const unit = element.dataset.progressUnit;
    let value = null;
    let state = 'unknown';
    let text = 'Progress unknown';
    if (element.dataset.progressCounter) {
      const counter = record?.counters?.[element.dataset.progressCounter];
      if (counter?.completedByEvent === true || (Number(questId) === 69 && record?.complete === true)) {
        value = target;
        state = 'event';
        text = 'Requirement met';
      } else if (Number.isFinite(counter?.value)) {
        value = counter.value;
        state = 'known';
        text = Number(questId) === 58 && value >= target ? 'Required cat return met'
          : value > target ? `${value} ${unit} · ${target} required`
            : `${value} of ${target} ${unit}`;
      } else if (Number.isFinite(counter?.minimum) && counter.minimum > 0) {
        value = counter.minimum;
        state = 'partial';
        text = Number(questId) === 58 && value >= target ? 'Required cat return met · further returns unknown'
          : `At least ${value} of ${target} ${unit} · remaining progress unknown`;
      }
    } else {
      const ids = (element.dataset.progressRows ?? '').split(',').filter(Boolean);
      const rows = new Map((record?.milestones ?? []).map(row => [row.id, row]));
      const states = ids.map(id => rows.get(id)?.complete);
      const confirmed = states.filter(complete => complete === true).length;
      const unknown = states.some(complete => complete !== true && complete !== false);
      if (!unknown || confirmed > 0) {
        value = confirmed;
        state = unknown ? 'partial' : 'known';
        text = unknown ? `At least ${value} of ${target} ${unit} · remaining progress unknown`
          : `${value} of ${target} ${unit}`;
      }
    }
    element.dataset.progressState = state;
    setText(summary, text);
    bar.max = target;
    bar.hidden = value === null;
    if (value === null) bar.removeAttribute('value');
    else bar.value = Math.min(target, Math.max(0, value));
    bar.setAttribute('aria-valuetext', `${label}. ${text}${state === 'event' ? ' from a recorded completion event; the current counter may have reset.' : ''}`);
  }
  function renderSnapshot(element, hasRecord) {
    const fragment = document.createDocumentFragment();
    const link = document.createElement('a');
    link.href = '#save-sync';
    if (!hasRecord) {
      link.textContent = 'Sync or import a gameplay save';
      fragment.append(link, ' for recorded progress.');
    } else {
      const stamp = latest?.observedAt ?? latest?.questMilestones?.observedAt;
      const validDate = typeof stamp === 'string' && Number.isFinite(Date.parse(stamp));
      fragment.append(latest?.source ? `${latest.source} · ` : 'Gameplay save · ');
      if (validDate) {
        const time = document.createElement('time');
        time.dateTime = stamp;
        time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(stamp));
        fragment.append('read ', time, '. ');
      } else fragment.append('read time unavailable. ');
      if (connection === 'disconnected') fragment.append('Folder disconnected; showing the last read. ');
      else fragment.append('Snapshot updates after the next successful read. ');
      link.textContent = 'Sync or import';
      fragment.append(link, '.');
    }
    // Avoid replacing the refresh link on guide-only changes while it has focus.
    if (element.textContent !== fragment.textContent) element.replaceChildren(fragment);
    else {
      // The minute-formatted text may match while the read's exact ISO changed.
      // Refresh semantic time data without replacing a focused refresh link.
      const currentTime = element.querySelector('time');
      const nextTime = fragment.querySelector('time');
      if (currentTime && nextTime && currentTime.dateTime !== nextTime.dateTime) currentTime.dateTime = nextTime.dateTime;
    }
  }
  function refresh() {
    scheduled = false;
    if (signal?.aborted) return;
    for (const { element, definition, rows } of panels) {
      const record = latest?.questMilestones?.quests?.[definition.id];
      renderSnapshot(element.querySelector('[data-milestone-snapshot]'), Boolean(record));
      element.querySelector('[data-milestone-quest-complete]').hidden = record?.complete !== true;
      const nativeRows = new Map((record?.milestones ?? []).map(row => [row.id, row]));
      const nativePrerequisites = new Map((record?.prerequisites ?? []).map(row => [row.id ?? row.reuseKey, row]));
      const evidenceRows = new Map([...element.querySelectorAll('[data-milestone-evidence-row]')].map(row => [
        (row.hasAttribute('data-milestone-evidence-prerequisite') ? 'prerequisite:' : 'milestone:') + row.dataset.milestoneEvidenceRow, row,
      ]));
      let visibleManual = false;
      for (const rowElement of rows) {
        const prerequisite = rowElement.hasAttribute('data-milestone-prerequisite');
        const key = rowElement.dataset.milestoneRow;
        const rowDefinition = (prerequisite ? definition.prerequisites : definition.milestones)
          ?.find(row => String(row.id ?? row.reuseKey) === key);
        if (!rowDefinition) continue;
        const row = (prerequisite ? nativePrerequisites : nativeRows).get(key);
        const counterDefinition = definition.counters?.[rowDefinition.counterId];
        const counter = row?.counter ?? record?.counters?.[rowDefinition.counterId];
        const complete = row?.complete ?? (rowDefinition.counterId ? counter?.complete : null);
        rowElement.dataset.status = complete === true ? 'complete' : complete === false ? 'pending' : 'unknown';
        setText(rowElement.querySelector('[data-milestone-fact]'), actionText(row, rowDefinition, definition, record, prerequisite));
        const evidence = evidenceRows.get((prerequisite ? 'prerequisite:' : 'milestone:') + key);
        setText(evidence?.querySelector('[data-milestone-evidence-fact]'), factText(row, rowDefinition, definition.id, counter));
        const owned = evidence?.querySelector('[data-milestone-owned]');
        const ownedText = ownershipText(row?.owned, row?.used);
        if (owned) owned.hidden = !ownedText;
        setText(owned, ownedText);
        const guide = evidence?.querySelector('[data-milestone-guide]');
        let guideText = '';
        if (rowDefinition.reuseKey) guideText = `Existing guide check: ${check(rowDefinition.reuseKey) ? 'checked' : 'unchecked'}`;
        if (counterDefinition?.type === 'existingProgress') guideText = `Existing guide checks: ${guideCount(counterDefinition)} / ${counterDefinition.target}`;
        if (guide) guide.hidden = !guideText;
        setText(guide, guideText);
        const input = rowElement.querySelector('[data-milestone-manual-key]');
        if (input) {
          input.checked = check(input.dataset.milestoneManualKey);
          const label = input.closest('[data-milestone-manual]');
          // A later read must not remove the active control or erase a personal
          // check. A manual check never changes the native indicator or fact.
          label.hidden = complete !== null && complete !== undefined && !input.checked && document.activeElement !== input;
          visibleManual ||= !label.hidden;
        }
      }
      for (const counterElement of element.querySelectorAll('[data-milestone-counter]')) {
        const key = counterElement.dataset.milestoneCounter;
        setText(counterElement.querySelector('[data-milestone-counter-value]'), counterText(record?.counters?.[key], definition.id, key).replace(/^Save: /, ''));
      }
      for (const progressElement of element.querySelectorAll('[data-milestone-progress]')) renderProgress(progressElement, record, definition.id);
      const manualNote = element.querySelector('[data-milestone-manual-note]');
      if (manualNote) manualNote.hidden = !visibleManual;
    }
  }
  function scheduleRefresh() {
    if (scheduled || signal?.aborted) return;
    scheduled = true;
    queueMicrotask(refresh);
  }
  for (const { definition, help } of panels) {
    if (!help) continue;
    help.open = openHelp.has(definition.id);
    help.addEventListener('toggle', () => {
      if (help.open) openHelp.add(definition.id); else openHelp.delete(definition.id);
      state.helpOpen = [...openHelp];
    }, { signal });
  }
  host.addEventListener('change', event => {
    const input = event.target.closest?.('[data-milestone-manual-key]');
    if (input) {
      const key = input.dataset.milestoneManualKey;
      if (!/^kenzan-guide:milestone-manual:\d+:[\w-]+$/.test(key)) return;
      memory.set(key, input.checked);
      try {
        if (input.checked) window.kenzanStorage.setItem(key, '1');
        else window.kenzanStorage.removeItem(key);
      } catch { /* The facade normally retains failed writes in tab memory. */ }
    }
    scheduleRefresh();
  }, { signal });
  window.addEventListener('storage', scheduleRefresh, { signal });
  for (const event of ['kenzan:collectible-progress', 'kenzan:ability-progress', 'kenzan:storage-state']) {
    document.addEventListener(event, scheduleRefresh, { signal });
  }
  refresh();
  return (snapshot, folderConnection = connection) => {
    if (signal?.aborted) return;
    latest = snapshot ?? null;
    connection = typeof folderConnection === 'string' ? folderConnection : folderConnection?.connection ?? 'unconnected';
    refresh();
  };
}
