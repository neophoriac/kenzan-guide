const registry = require('../../data/quests/quest-milestones-data.json');

const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// These reader-facing notes describe the evidence, not the decoder's internal
// scenario names. The registry remains the authority for rows and saved facts.
const notes = {
  20: ['The usual five-blade route is below. Five accepted swords finish the request; duplicates can count.',
    'Acquired blades and accepted swords are separate. The initial Beckoning Sword loan does not establish its permanent reward.'],
  31: ['Unlock prerequisite: take 30 palanquin rides.',
    'The saved ride count and your guide check are separate. Confirm readiness in game when save facts are unavailable.'],
  36: ['Gather the ingredients, make the remedy, then deliver the poultice.',
    'Ingredients already used for a recorded remedy stay satisfied. This Washi bundle is separate from the flying-machine material.'],
  44: ['Give the pill first, then Kusa Dango.',
    'The initial pill handover has no reliable separate receipt before acceptance. Owning a pill does not prove it was given.'],
  58: ['Return at least one cat to open the next request. Further returns are optional rewards.',
    'These are returned cats. Temporary captures can be lost during the chase and do not count as returns.'],
  61: ['Track the six ingredient handovers independently.',
    'Owned copies and recorded deliveries are separate. Giving an ingredient can consume your last copy.'],
  62: ['7-Blend is required. Give 3-Blend and 5-Blend first if you also want their optional payments.',
    'The 7-Blend handover alone advances the request. Unrecorded optional deliveries do not block it.'],
  65: ['Feed the dog three times, then dig up the reward.',
    'Three Raw Chicken is the recommended route for Jomon Pottery. Recorded meals do not identify the food used or guarantee that reward.'],
  69: ['Taste at least five experimental dishes, then order Ultimate Fried Udon.',
    'Individual dishes are not durable tasting checks. The tasting counter resets at completion, so the recorded final order takes precedence over a reset count.'],
  86: ['Collect the four quest ingredients, then return them together.',
    'These are quest ingredients, separate from ordinary foods with similar names. Acquisition is recorded individually; handover is one group event.'],
  87: ['Offer Ohagi twice, in order.', 'These are two offerings of the same food.'],
  97: ['Hand over Rake, Bamboo Sticks and Washi in that order, then test the machine.',
    'Material acquisition does not prove handover. The prerequisite inventions reuse their existing checks; this Washi is separate from the remedy bundle.'],
  100: ['Readiness reuses the existing request, commission, bounty and fighter records.',
    'Save counts describe the dated gameplay save. Guide counts reflect your existing completion checks; neither creates another set of goals.'],
  103: ['Offer suitable food twice.',
    'Two different foods are not required. Recorded offers are separate from food currently owned.'],
  113: ['Finish the three letter/customer rounds, then read the final reward letter.',
    'Round milestones do not add a separate goal for each dialogue choice.'],
  138: ['Unlock prerequisite: 80 ordinary street encounters.',
    'Story, quest and arena fights do not qualify. The saved count and your guide check stay separate.'],
};

function linkMarkup(link, fallback) {
  if (!link || typeof link.href !== 'string' || !/^#[\w:?-]/.test(link.href)) return escape(fallback);
  return `<a href="${escape(link.href)}">${escape(fallback)}</a>`;
}

function progressDefinition(quest) {
  const rows = quest.milestones.filter(row => !row.optional).map(row => row.id);
  const rowSpec = (label, unit, ids = rows) => ({ id: 'required-steps', label, unit, rows: ids, target: ids.length });
  const counterSpec = (id, label, unit, target) => ({ id, counter: id, label, unit, target });
  switch (quest.id) {
    case 20: return counterSpec('accepted-swords', 'Sword copies accepted', 'sword copies accepted', 5);
    case 31: return counterSpec('readiness', 'Required palanquin rides', 'palanquin rides', 30);
    case 36: return rowSpec('Make and deliver the remedy', 'remedy steps complete', ['poultice', 'deliver']);
    case 44: return rowSpec('Item handovers', 'handovers made');
    case 58: return counterSpec('returned-cats', 'Required cat return', 'required cat returns', 1);
    case 61: return rowSpec('Ingredients delivered', 'ingredients delivered');
    case 62: return rowSpec('Required 7-Blend delivery', 'required deliveries made', ['blend-7']);
    case 65: return rowSpec('Meals and reward', 'meal and reward steps complete');
    case 69: return counterSpec('tastings', 'Required experimental tastings', 'experimental tastings', 5);
    case 86: return rowSpec('Four ingredients and their return', 'milestones complete');
    case 87: return rowSpec('Ohagi offerings', 'offerings made');
    case 97: return rowSpec('Material handovers and flight test', 'steps complete');
    case 103: return rowSpec('Food offers', 'food offers made');
    case 113: return rowSpec('Letter rounds and final reward', 'round and reward steps complete');
    case 138: return counterSpec('readiness', 'Required ordinary street encounters', 'ordinary street encounters', 80);
    default: return null;
  }
}

function progressAttributes(spec) {
  return `data-milestone-progress="${escape(spec.id)}" data-progress-target="${spec.target}" data-progress-label="${escape(spec.label)}" data-progress-unit="${escape(spec.unit)}"${spec.counter ? ` data-progress-counter="${escape(spec.counter)}"` : ` data-progress-rows="${escape(spec.rows.join(','))}"`} data-progress-state="unknown"`;
}

function progressBar(spec) {
  // An absent record is unknown, never a determinate zero.
  return `<progress data-milestone-bar max="${spec.target}" aria-label="${escape(spec.label)}" aria-valuetext="Progress unknown" hidden></progress>`;
}

function renderProgress(spec) {
  if (!spec) return '';
  return `<div class="quest-milestones-progress" ${progressAttributes(spec)}${spec.id === 'accepted-swords' ? ' data-milestone-counter="accepted-swords"' : ''}>
      <p><strong>${escape(spec.label)}</strong> · <span data-milestone-progress-value${spec.id === 'accepted-swords' ? ' data-milestone-counter-value' : ''}>Progress unknown</span></p>
      ${progressBar(spec)}
    </div>`;
}

function renderRow(quest, row, prerequisite = false) {
  const prefix = `quest-milestone-${quest.id}-${prerequisite ? 'prerequisite-' : ''}${row.id ?? row.reuseKey?.split(':').at(-1)}`;
  const reuse = Boolean(row.reuseKey);
  const manual = !prerequisite && !reuse && typeof row.manualKey === 'string'
    && row.manualKey.startsWith(`kenzan-guide:milestone-manual:${quest.id}:`);
  let progress;
  if (!prerequisite && [31, 138].includes(quest.id)) progress = progressDefinition(quest);
  if (!prerequisite && quest.id === 100) {
    const counter = quest.counters[row.counterId];
    progress = { id: row.counterId, counter: row.counterId, label: `${row.label} required`, unit: 'complete', target: counter.target };
  }
  return `<li class="quest-milestone-row" data-milestone-row="${escape(row.id ?? row.reuseKey)}"${prerequisite ? ' data-milestone-prerequisite' : ''} data-status="unknown"${progress ? ` ${progressAttributes(progress)}` : ''}>
    ${[31, 138].includes(quest.id) ? '' : '<span class="guidebook-dot quest-milestone-mark" aria-hidden="true"></span>'}
    <span class="quest-milestone-label" id="${escape(prefix)}-label">${linkMarkup(row.link, row.label)}</span>${row.optional ? '<small class="quest-milestone-optional">Optional</small>' : ''}
    <span class="quest-milestone-fact" data-guidebook-stage data-milestone-fact data-milestone-action>Follow this step in the walkthrough.</span>
    ${progress ? `<small data-milestone-progress-value>Progress unknown</small>${progressBar(progress)}` : ''}${manual ? `
    <label class="quest-milestone-manual" data-milestone-manual>
      <input type="checkbox" autocomplete="off" data-milestone-manual-key="${escape(row.manualKey)}" aria-labelledby="${escape(prefix)}-manual ${escape(prefix)}-label">
      <span id="${escape(prefix)}-manual">My check</span>
    </label>` : ''}
  </li>`;
}

function renderEvidence(row, prerequisite = false) {
  return `<li data-milestone-evidence-row="${escape(row.id ?? row.reuseKey)}"${prerequisite ? ' data-milestone-evidence-prerequisite' : ''}>
      <strong>${escape(row.label)}</strong>
      <span data-milestone-evidence-fact>No gameplay save read.</span>
      <small data-milestone-owned hidden></small><small data-milestone-guide hidden></small>
    </li>`;
}

function renderQuestMilestones(id) {
  const quest = registry.quests.find(quest => quest.id === Number(id));
  if (!quest) return '';
  const title = quest.mode === 'prerequisite' ? 'Unlock readiness' : 'Milestones';
  const copy = notes[quest.id] ?? ['Track the meaningful steps in this request.', 'Owned items do not by themselves prove handover.'];
  const rowCounters = new Set(quest.milestones.map(row => row.counterId).filter(Boolean));
  const counters = Object.entries(quest.counters ?? {}).filter(([key]) => !rowCounters.has(key) && !(quest.id === 20 && key === 'accepted-swords'));
  const manual = quest.milestones.some(row => !row.reuseKey && row.manualKey);
  const list = (rows, prerequisite = false) => `<ul class="guidebook-milestones quest-milestones-rows" role="list">${rows.map(row => renderRow(quest, row, prerequisite)).join('')}</ul>`;
  const milestones = quest.id === 36
    ? `<h6>Ingredient readiness</h6>${list(quest.milestones.filter(row => row.kind === 'ingredient'))}<h6>Make and deliver</h6>${list(quest.milestones.filter(row => row.kind !== 'ingredient'))}`
    : `${quest.id === 20 ? '<h6>Usual acquisition route</h6>' : ''}${list(quest.milestones)}`;
  return `<section class="guidebook-progress quest-milestones" id="quest-${quest.id}-milestones" data-quest-milestones="${quest.id}" aria-labelledby="quest-title-${quest.id} quest-${quest.id}-milestones-title">
    <h5 id="quest-${quest.id}-milestones-title">${title}</h5><p class="quest-milestones-complete" data-milestone-quest-complete hidden>Request complete in save</p>
    <p class="quest-milestones-context">${escape(copy[0])}</p>
    <p class="quest-milestones-snapshot" data-milestone-snapshot><a href="#save-sync">Sync or import a gameplay save</a> for recorded progress.</p>
    ${[31, 100, 138].includes(quest.id) ? '' : renderProgress(progressDefinition(quest))}
    ${counters.length ? `<ul class="quest-milestones-counters" role="list">${counters.map(([key, counter]) => `<li data-milestone-counter="${escape(key)}"><strong>${escape(counter.label)}</strong> <span data-milestone-counter-value>Progress unknown</span></li>`).join('')}</ul>` : ''}
    ${quest.prerequisites?.length ? `<div class="quest-milestones-prerequisites"><h6>Existing invention prerequisites</h6>${list(quest.prerequisites, true)}</div>` : ''}
    ${milestones}
    <details class="quest-milestones-help"><summary>About this progress</summary>
      <p>${escape(copy[1])}</p>
      <p>Save facts come from the last gameplay save read. “Not recorded” means the supported record is absent; “unknown” means it cannot be established reliably. The read time is not the game’s save time. Your guide checks stay separate, including after another save is read.</p>
      ${manual ? '<p class="quest-milestones-manual-note" data-milestone-manual-note>My check is a guide note. It does not change saved facts or mark the request Done. Action hints follow the last gameplay save read.</p>' : ''}
      <ul class="quest-milestones-evidence" role="list">${(quest.prerequisites ?? []).map(row => renderEvidence(row, true)).join('')}${quest.milestones.map(row => renderEvidence(row)).join('')}</ul>
    </details>
  </section>`;
}

function renderQuestMilestonesData() {
  return `<script type="application/json" id="quest-milestones-data">${JSON.stringify(registry).replaceAll('<', '\\u003c')}</script>`;
}

module.exports = { renderQuestMilestones, renderQuestMilestonesData };
