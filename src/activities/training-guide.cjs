const assert = require('node:assert/strict');
const { renderPhotoPreview } = require('../../atlas/render.cjs');
const { loadPlacePhoto, loadLocationPhoto } = require('../map/location-photos.cjs');

const trainingGroups = ['komaki', 'inventions', 'other', 'outdoor'].flatMap(name => require(`../../data/activities/training-${name}.json`));
const masteryTargets = require('../../data/activities/training-mastery.json');
const minigameGroupIds = ['yabusame', 'waterfall', 'scarecrow', 'jiraiya', 'melon'];
const trainingMinigames = minigameGroupIds.map(id => trainingGroups.find(group => group.id === id));
const standaloneTraining = trainingGroups.filter(({ id }) => !minigameGroupIds.includes(id));
assert.deepEqual(Object.keys(masteryTargets).sort(), trainingMinigames.flatMap(({ id, entries }) => entries.map(entry => `${id}-${entry.id}`)).sort());

function trainingAvailability(storyOrder) {
  const rules = {};
  const ids = group => trainingGroups.find(item => item.id === group).entries.map(entry => `${group}-${entry.id}`);
  const dojoLessons = ids('komaki').filter(id => !['komaki-komaki-join', 'komaki-komaki-swordless-justice'].includes(id));
  const inventions = ids('inventions').filter(id => id !== 'inventions-mew-sandals-reward');
  const scarecrow = trainingGroups.find(group => group.id === 'scarecrow').entries;
  const floor = window => scarecrow.filter(entry => window.includes(entry.window)).map(entry => `scarecrow-${entry.id}`);
  const zanki = ids('zanki');
  const prerequisites = {
    'komaki-komaki-herculean-throw-2': ['komaki-komaki-herculean-throw'],
    'komaki-komaki-surviving-fist': ['komaki-komaki-cat-flip'],
    'komaki-komaki-swordless-justice': [...dojoLessons, ...zanki],
    'inventions-red-bat': ['inventions-bat'],
    'inventions-sturdy-bat': ['inventions-red-bat'],
    'inventions-raijin-hame-yumimaru': ['inventions-hame-yumimaru'],
    'inventions-piss-mountain-stone': ['inventions-hunger-pill'],
    'inventions-mew-sandals-reward': inventions,
    'zanki-zanki-blade-second': ['zanki-zanki-blade-first'],
    'zanki-zanki-blade-third': ['zanki-zanki-blade-second'],
    'jiraiya-earth-chamber': ['jiraiya-first-chamber'],
    'jiraiya-water-chamber': ['jiraiya-earth-chamber'],
    'jiraiya-fire-chamber': ['jiraiya-water-chamber'],
    'jiraiya-wind-chamber': ['jiraiya-water-chamber'],
    'jiraiya-heavenly-chamber': ['jiraiya-fire-chamber', 'jiraiya-wind-chamber'],
    'jiraiya-ultimate-chamber': ['jiraiya-heavenly-chamber'],
    'yabusame-advanced': ['yabusame-beginner', 'yabusame-intermediate'],
    'yabusame-expert': ['yabusame-advanced'],
    'waterfall-white-spirit': ['waterfall-red-spirit'],
    'waterfall-black-spirit': ['waterfall-white-spirit'],
    'waterfall-blue-spirit': ['waterfall-black-spirit'],
    'waterfall-yellow-spirit': ['waterfall-blue-spirit'],
    'melon-applied': ['melon-boar-scroll', 'melon-foundational'],
    'melon-advanced': ['melon-applied'],
    'melon-asura-scroll': ids('melon').filter(id => id !== 'melon-asura-scroll'),
  };
  for (const id of dojoLessons) (prerequisites[id] ??= []).push('komaki-komaki-join');
  for (const id of zanki) {
    if (id !== 'zanki-rock-cutter' && !prerequisites[id]) prerequisites[id] = ['zanki-rock-cutter'];
  }
  for (const id of floor(['9-1'])) prerequisites[id] = floor(['6-6', '7-4']);
  for (const id of floor(['10-9'])) prerequisites[id] = floor(['9-1']);
  for (const { id: group, entries } of trainingGroups) {
    const closes = group === 'komaki' || group === 'inventions' ? storyOrder('12-4') : undefined;
    const clocks = { yabusame: ['day', 'evening'], tengu: ['evening'] }[group];
    for (const { id, window } of entries) {
      const key = `${group}-${id}`;
      assert(/^\d+-\d+$/.test(window), `Missing first window for training activity ${key}`);
      rules[key] = {
        first: storyOrder(key === 'inventions-back-pain-remedy' ? '7-4' : window),
        closes: key === 'komaki-komaki-swordless-justice' ? undefined : closes,
        clocks,
        after: prerequisites[key],
        quests: key === 'inventions-back-pain-remedy' ? [47] : undefined,
        storyOnly: key === 'melon-boar-scroll' ? ['8-8', '8-9'] : undefined,
        freeRoamFrom: key === 'melon-boar-scroll' ? storyOrder('9-1') : undefined,
        continuation: key === 'komaki-komaki-swordless-justice' ? {
          from: storyOrder('12-4'),
          note: 'Continue only if you spoke to Komaki about Shibusawa before leaving Gion.',
        } : undefined,
      };
    }
  }
  for (const [key, dependencies] of Object.entries(prerequisites)) {
    assert(rules[key] && dependencies.every(id => id !== key && rules[id]), `Invalid training prerequisites for ${key}`);
  }
  return rules;
}

function renderTraining(revelations, escape, objectives, abilitySources) {
  return `<section class="supplement" id="training-and-upgrades" aria-labelledby="training-title">
    <h2 id="training-title" data-completion-section="training-and-upgrades">Training and upgrades</h2>
    <p>Use these checklists to track lessons, exams and inventions. First windows show the earliest story opportunity. Check the requirements for any levels, prior lessons, fees or materials you still need. Finished checkmarks are saved in this browser.</p>
    <p>For course unlocks, first-clear rewards and mastery ranks, see the <a href="#minigame-training-mastery">training minigames</a>.</p>
    <p>Finish the Gion dojo and inventor tasks you want before telling Itō you’re ready to leave in 12-3. The Rakugai blacksmith opens for crafting and refining in Chapter 5. See the <a href="#collectibles-collection-reward">crafting book checklist</a> and the separate <a href="#revelation-pictures">picture Revelations</a>.</p>
    <fieldset class="quest-filters training-filters">
      <legend class="sr-only">Filter training and inventions</legend>
      <div class="story-picker">
        <label for="training-story-objective">Current story objective</label>
        <select id="training-story-objective" autocomplete="off" aria-describedby="training-story-help"></select>
      </div>
      <label><input type="checkbox" id="training-use-story" autocomplete="off" checked> Use current story objective</label>
    </fieldset>
    <p id="training-results" class="quest-meta" role="status" aria-atomic="true"></p>
    <p id="training-story-help" class="quest-meta">This is the same objective used by the substories and map. The filter checks the story window and time of day. Check the requirements for levels, materials and other conditions that aren’t tracked here.</p>
    <nav class="training-index" aria-label="Training and inventions index">
      ${standaloneTraining.map(({ id, title }) => `<a href="#training-${escape(id)}" data-completion-section="${id === 'inventions' ? 'training-inventions' : 'training-and-upgrades'}">${escape(title)}</a>`).join('')}
    </nav>
    ${renderTrainingGroups(standaloneTraining, revelations, escape, objectives, abilitySources)}
  </section>`;
}

function renderTrainingGroups(groups, revelations, escape, objectives, abilitySources) {
  const revelationIds = new Set([...revelations.training, ...revelations.related].map(entry => entry.id));
  const groupIds = new Set();
  const entryIds = new Set();
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const link = ({ label, href }) => {
    assert(label && (href.startsWith('#') || new URL(href).protocol === 'https:'), `Invalid training link ${href}`);
    return `<a href="${escape(href)}">${escape(label)}</a>`;
  };
  return groups.map(({ id, title, intro, map, photo: photoName, photoCaption, entries, source, links = [] }) => {
      assert(slug.test(id) && !groupIds.has(id) && title && intro && entries.length, `Invalid training group ${id}`);
      groupIds.add(id);
      const minigame = minigameGroupIds.includes(id);
      const showBestScore = ['yabusame', 'waterfall', 'scarecrow', 'jiraiya'].includes(id);
      const photo = photoName ? loadLocationPhoto('place-photos', photoName) : map && loadPlacePhoto(map.area, map.name);
      const category = id === 'inventions' ? 'training-inventions' : 'training-and-upgrades';
      return `<details class="collectible-group" id="training-${id}" data-training-group${minigame ? ' data-training-minigame' : ` data-completion-section="${category}"`}>
        <summary${minigame ? ` id="mastery-${id}"` : ''}>${escape(title)} <span data-training-count>(${entries.length})</span></summary>
        <div class="collectible-intro">
          <p>${escape(intro)}</p>
          ${map ? `<p><a href="#quest-map" data-map-place="${escape(`${map.area}:${map.name}`)}">Show ${escape(map.name)} on map</a></p>` : ''}
          ${photo ? renderPhotoPreview(photo, photoCaption ?? title) : ''}
          ${photo && photoCaption ? `<p class="quest-meta">${escape(photoCaption)}</p>` : ''}
          ${links.length ? `<p>${links.map(link).join(' · ')}</p>` : ''}
          ${id === 'yabusame' ? '<p data-yabusame-score-help><a href="#save-sync">Sync a gameplay save</a> to show your best score for each course.</p>' : ''}
          ${['scarecrow', 'jiraiya'].includes(id) ? '<p data-training-record-help><a href="#save-sync">Sync or import a gameplay save</a> to show your saved records.</p>' : ''}
          ${id === 'scarecrow' ? '<p id="scarecrow-record-help">Your best listed time is the quickest of your entries on the saved ten-place board. Runs outside that board may not appear. Your best rank is saved separately.</p>' : ''}
          ${id === 'jiraiya' ? '<p id="jiraiya-record-help">Your best listed score is your highest entry on the saved ten-place board. Runs outside that board may not appear. Your best rank is saved separately.</p>' : ''}
          ${id === 'waterfall' ? `<p>Your save keeps the best total score and best rank from successful finishes; failed runs don’t update either.</p>
          <p data-waterfall-score-help><a href="#save-sync">Sync or import a gameplay save</a> to see your saved records.</p>
          <p class="quest-meta" data-waterfall-source hidden></p>` : ''}
        </div>
        <p class="collectible-intro" data-training-empty hidden>No activities match the current filters.</p>
        <div class="table-wrap" tabindex="0" role="region" aria-label="${escape(title)}">
          <table>
            <thead><tr><th scope="col">${minigame ? 'Course' : 'Activity'}</th><th scope="col">Requirements and steps</th><th scope="col">Reward</th><th scope="col"${minigame ? ' data-minigame-first-clear' : ''}>${minigame ? 'First clear' : 'Finished'}</th>${minigame ? '<th scope="col" data-minigame-mastery>Mastery rank</th>' : ''}${showBestScore ? `<th scope="col">${id === 'scarecrow' ? 'Your best listed time' : id === 'jiraiya' ? 'Your best listed score' : 'Best score'}</th>` : ''}</tr></thead>
            <tbody>${entries.map(({ id: entryId, name, window, requires, steps, materials, reward, revelation, links: entryLinks = [] }) => {
              const key = `${id}-${entryId}`;
              assert(slug.test(entryId) && !entryIds.has(key) && name, `Invalid training entry ${key}`);
              assert(!revelation || revelationIds.has(revelation), `Unknown training Revelation ${revelation}`);
              entryIds.add(key);
              const details = [
                window && `<strong>First window ${escape(window)}</strong>${objectives[window] ? ` · Pending objective · ${escape(objectives[window])}` : ''}`,
                requires && escape(requires),
                materials?.length && `<strong>Materials</strong> ${materials.map(escape).join(', ')}`,
                steps && escape(steps),
              ].filter(Boolean);
              const ability = abilitySources.get(`training-${key}`);
              const mastery = masteryTargets[key];
              return `<tr id="training-${key}" data-training-entry="${key}">
                <th scope="row">${escape(name)}</th>
                <td>${details.join('<br>')}${entryLinks.length ? `<br>${entryLinks.map(link).join(' · ')}` : ''}
                  <p class="quest-window-note" data-training-continuation hidden></p>
                  <p class="quest-window-note quest-prerequisite-warning" hidden>Prerequisite completion is unconfirmed. See the requirements above.</p>
                </td>
                <td>${reward ? escape(reward) : '—'}${revelation ? `<br><a href="#revelation-${escape(revelation)}">Revelation steps</a>` : ''}</td>
                <td${minigame ? ' data-minigame-first-clear' : ''}>${ability ? `<a class="quest-check" href="#${ability}" data-training-ability${revelation ? '' : ` data-former-training="${key}"`}>Mark in Abilities</a>`
                  : `<label class="quest-check"><input type="checkbox" autocomplete="off" data-training-done="${key}" aria-label="Mark ${escape(name)} finished"><span>Finished</span></label>`}</td>
                ${mastery ? `<td data-minigame-mastery><strong>${escape(mastery[0])}</strong><br>${escape(mastery[1])}<br><label class="quest-check"><input type="checkbox" autocomplete="off" data-side-done="mastery-${key}" aria-label="Mark ${escape(name)} mastery finished"> Finished</label></td>` : ''}
                ${id === 'yabusame' ? `<td data-checklist-live data-yabusame-score="${entryId}">—</td>` : ''}
                ${id === 'waterfall' ? `<td class="waterfall-score" data-checklist-live data-waterfall-score="${entryId}">Sync a gameplay save</td>` : ''}
                ${['scarecrow', 'jiraiya'].includes(id) ? `<td class="waterfall-score" data-checklist-live data-training-record="${entryId}" data-training-record-kind="${id}" aria-describedby="${id}-record-help">Sync a gameplay save</td>` : ''}
              </tr>`;
            }).join('\n')}</tbody>
          </table>
        </div>
        ${source ? `<p class="collectible-intro">${link({ label: source.label, href: source.url })}</p>` : ''}
      </details>`;
  }).join('\n');
}

module.exports = { renderTraining, renderTrainingGroups, trainingAvailability, trainingGroups, trainingMinigames, standaloneTraining };
