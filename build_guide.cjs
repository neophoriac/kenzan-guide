const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
require('./atlas/build.cjs').prepareAtlasBuild();
const { atlasGuideHelpers, atlasSidebar } = require('./atlas/distribution.cjs');
const { atlasRuntime } = require('./atlas/bundle.cjs');
const { marked } = require('marked');
const { fontStyles } = require('./src/guide/font-styles.cjs');
const { copyAtlasRendererAssets } = require('./atlas/renderer-assets.cjs');
copyAtlasRendererAssets(__dirname);
const { writeView, viewPaths } = require('./src/guide/view-assets.cjs');
const { writeExecutableAsset, scriptTag } = require('./src/guide/script-assets.cjs');
const { loadMapQuests } = require('./src/map/quest-map.cjs');
const { renderPhotoPreview, renderPhotoViewer } = require('./atlas/render.cjs');
const { loadLocationPhoto } = require('./src/map/location-photos.cjs');
const { atlasScript, atlasStyles, collectibleLayers, collectiblePlaces, renderAtlas, renderSidebarStart } = require('./build_atlas.cjs');
const { extraWindows, completedRequirements, clockGroups, continuations, lastWindows } = require('./src/quests/story-availability.cjs');
const { yujoByQuest, renderYujoGuide } = require('./src/activities/yujo-guide.cjs');
const { renderLazyDetails, getGuideContentSources } = require('./src/guide/lazy-details.cjs');
const { buildGuideSearchRecords } = require('./src/guide/search-data.cjs');
const { withGuideTargetRoutes } = require('./src/guide/navigation-targets.cjs');
const { decorateCompletionControls } = require('./src/guide/completion-controls.cjs');
const { deferChecklistTables: deferChecklistTableBodies } = require('./src/guide/checklist-tables.cjs');
const { createGuideMapLinker } = require('./src/map/guide-map-links.cjs');
const { linkGuideItems } = require('./src/guide/guide-item-links.cjs');
const { withGuideMapURLs } = require('./src/guide/guide-map-urls.js');
const { loadRevelations, renderRevelations } = require('./src/activities/revelation-guide.cjs');
const { loadLockerKeys, renderLockerKeys } = require('./src/activities/locker-key-guide.cjs');
const { renderCollectibles } = require('./src/activities/collectible-guide.cjs');
const { withWeaponTrees, weaponSaveCatalogue } = require('./src/weapons/weapon-tree.cjs');
const { withWeaponMaterials } = require('./src/weapons/weapon-materials.cjs');
const { withTurtleFoods } = require('./src/turtles/turtle-foods.cjs');
const { withRestaurantItems } = require('./src/inventory/restaurant-guide.cjs');
const { renderInventoryReference } = require('./src/inventory/inventory-reference.cjs');
const { renderQuestMilestones } = require('./src/quests/quest-milestones.cjs');
const { supportedKeys } = require('./src/tracker/save-sync.js');
const { renderTraining, renderTrainingGroups, trainingAvailability, trainingGroups, trainingMinigames, standaloneTraining } = require('./src/activities/training-guide.cjs');

const files = ['data/quests/requests_early', 'data/quests/requests_middle_bounties', 'data/quests/requests_late', 'data/quests/commissions'];
const types = ['Requests', 'Commissions', 'Bounties'];
const description = 'All 140 substories with English translation patch v12 names, starting locations and walkthroughs. Use the interactive map and checklists to track quests, training, collectibles, minigames and postgame challenges.';
const walkthroughNames = 'In Patrick Coffman’s walkthrough, Suburbs means Rakugai, Monmae means Monzen Alley, and Kawara means Kawaramachi.';
const supplementRoutes = new Set([1, 2, 3, 4, 5, 6, 7, 8, 122, 125]);
const scribdWalkthrough = 'https://www.scribd.com/document/480711319/Ry%C5%AB-ga-Gotoku-Kenzan-sub-story-guide';
const originalWalkthrough = 'https://gamefaqs.gamespot.com/ps3/943326-ryu-ga-gotoku-kenzan/faqs/52464';
const khhSubstories = 'https://www.khhsubs.com/kenzan/substory/';
const aerisBounties = 'https://coool.noor.jp/aeris/ryu3/tehai01.html';
const wantedBoard = 'Rakugai · Read the wanted poster at the northwest police box';
const routeReferences = `- Aeris’s Japanese walkthroughs helped cross-check [Requests](https://coool.noor.jp/aeris/ryu3/irai01.html), [Commissions](https://coool.noor.jp/aeris/ryu3/kake01.html), and [Bounties](${aerisBounties}).`;
const gameTitle = 'Like a Dragon: Kenzan!';
const guideSubtitle = 'Side Content Guide';
const storyObjectives = {
  '5-1': 'Speak to Ito behind Tsuruya',
  '5-2': 'Head home to Tatsuya',
  '5-4': 'Meet Shichigoro at Gion Inari after Itō tells you about Kōetsu',
  '5-6': 'Talk to the guard at Rakugai’s northwest checkpoint',
  '5-11': 'Show your permit at the Rakugai checkpoint',
  '5-12': 'Talk to the attendant outside Koetsu’s mansion',
  '5-13': 'Collect the greatsword from the Rakugai blacksmith',
  '5-15': 'Go into Shishido’s cave on Forest Path',
  '5-20': 'Return to Koetsu’s mansion after leaving the cave',
  '6-1': 'Raise 2 ryō for Gion Toji',
  '6-3': 'Train with Shibusawa at Zanki Dojo',
  '6-5': 'Get mugwort dango from the Riverside Tea House',
  '7-4': 'Ask the attendant behind Tsuruya about Haruka',
  '7-5': 'Meet Ito and Koetsu at Koetsu’s mansion',
  '7-6': 'Talk to the front attendant at Tsuruya to arrange a room',
  '7-8': 'Meet Ito at Tatsuya',
  '8-1': 'Ask the attendant at Kamenoya about Haruka',
  '8-2': 'Visit Koetsu at his mansion after checking on Haruka',
  '8-4': 'Return to Tatsuya for directions to Hozoin',
  '8-5': 'Talk to the gatekeeper at Hozoin Temple',
  '9-1': 'Head home to Tatsuya from Hozoin',
  '9-2': 'Meet Gion Toji outside Yoshioka Dojo',
  '9-3': 'Talk to the attendant at Tsuruya’s front entrance to visit Haruka',
  '9-4': 'Go to sleep at Tatsuya',
  '9-5': 'Travel to Rendai Field for the duel',
  '10-11': 'Make for Kiyomizudera',
  '11-1': 'Rest overnight at Tatsuya before the trip to Yagyu Village',
  '11-2': 'Set out for Yagyu Village via Kiyomizudera',
  '12-1': 'Talk to the attendant at Tsuruya’s main entrance',
};
const gionCutoff = 'Finish the Gion steps before telling Ito you’re ready to leave in 12-3.';
const gionQuests = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 23, 30, 33, 34, 35, 67, 68, 79, 82, 83, 84, 85,
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 127, 128, 135,
]);
const storyCutoffs = {
  20: 'Buy Bassarimaru at Ebisuya Pawn before Gion closes in 12-3. You can hand in the swords in Rakugai later.',
  36: 'Get the poultice from Gyotensai before Gion closes in 12-3.',
  97: 'Do the Cliffside Path scene during the Chapter 11 daytime window. Leave at least one invention unfinished until the quest starts.',
  99: 'Start on Forest Path before leaving for Yagyu Village in 11-2. Hear the conversation in Gion before Ito’s departure prompt in 12-3.',
};
const missableOutcomes = {
  56: 'Use Essence of Bellows by the furnace before the two smithy fights are over. This is its only opportunity.',
  58: 'Catch at least one cat to play #59. Catching zero skips that quest and records it as Finished.',
  59: 'If you caught zero cats in #58, this quest is recorded as Finished and its scene is skipped.',
  75: 'Stay after the first fight to earn the Painting of a Meditating Monk for the Enmei Heat Action.',
  85: 'Agree to look for Ken to earn the Fly Picture for the Fly Swatter Heat Action.',
};

function read(filename) {
  return fs.readFileSync(path.join(__dirname, filename), 'utf8').replace(/^\uFEFF/, '');
}

function bundleTurtleRaceModules(entryPath, variable) {
  const modules = [];
  const ids = new Map();
  function add(filename) {
    if (ids.has(filename)) return ids.get(filename);
    const id = modules.length;
    ids.set(filename, id);
    modules.push('');
    const source = read(filename);
    modules[id] = filename.endsWith('.json') ? 'module.exports = ' + JSON.stringify(JSON.parse(source)) + ';'
      : source.replace(/\brequire\('([^']+)'\)/g, (_, requested) => {
        assert(requested.startsWith('.'), 'The race planner requires a Node-only module');
        return 'load(' + add(path.posix.normalize(path.posix.join(path.posix.dirname(filename), requested))) + ')';
      });
    return id;
  }
  const entry = add(entryPath);
  return `const ${variable} = (() => {
  const modules = [${modules.map(source => `(module, load) => {\n${source}\n}`).join(',\n')}];
  const cache = [];
  function load(id) {
    if (cache[id]) return cache[id].exports;
    const module = cache[id] = { exports: {} };
    modules[id](module, load);
    return module.exports;
  }
  return load(${entry});
})();`;
}

function writeTurtleRaceWorker() {
  const simulator = bundleTurtleRaceModules('simulation/turtle-racing/race-planner-scenes.cjs', 'turtleRaceScenes');
  const worker = `(function registerTurtleRaceWorker() {
  function startTurtleRaceWorker() {
${simulator}
${read('src/turtles/turtle-race-worker.js')}
  }
  if (typeof document === 'undefined') startTurtleRaceWorker();
  else document.currentScript.turtleRaceWorkerSource = '(' + startTurtleRaceWorker.toString() + ')();';
})();\n`;
  fs.writeFileSync(path.join(__dirname, 'assets/turtle-race-worker.js'), worker);
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function slug(value) {
  return value.toLowerCase().replaceAll(/[^a-z\d]+/g, '-').replace(/^-|-$/g, '');
}

function chapterWindows(table) {
  const [header, , ...rows] = table.split('\n').map(line => line.slice(1, -1).split('|').map(cell => cell.trim()));
  const windows = new Map();
  const objectives = [];
  for (const [window, clock, ...cells] of rows) {
    objectives.push([window, clock.toLowerCase(), storyObjectives[window]]);
    for (const [column, cell] of cells.entries()) {
      const type = header[column + 2];
      assert(types.includes(type), `Unknown quest type ${type}`);
      for (const range of cell.split(',').map(part => part.trim()).filter(Boolean)) {
        const [first, last = first] = range.split('–').map(Number);
        assert(Number.isInteger(first) && Number.isInteger(last) && first <= last, `Invalid quest range ${range}`);
        for (let id = first; id <= last; id += 1) {
          assert(!windows.has(id), `Duplicate chapter window for quest ${id}`);
          windows.set(id, { window, type });
        }
      }
    }
  }
  return { windows, objectives };
}

function storyOrder(code) {
  const [chapter, checkpoint] = code.split('-').map(Number);
  return chapter * 100 + checkpoint;
}

function renderStoryOptions(checkpoints) {
  const groups = new Map();
  for (const { id, code, order, clock, label } of checkpoints) {
    const chapter = Math.floor(order / 100);
    const group = groups.get(chapter) ?? [];
    const time = clock ? clock[0].toUpperCase() + clock.slice(1) : 'Story only';
    const option = code === '12-5' ? `${code} (${time}) · ${label}` : `${code} · ${label} (${time})`;
    group.push(`<option value="${id}">${escape(chapter === 4 ? label : option)}</option>`);
    groups.set(chapter, group);
  }
  return [...groups].map(([chapter, options]) =>
    `<optgroup label="${chapter === 4 ? 'Before Chapter 5' : `Chapter ${chapter}`}">${options.join('\n')}</optgroup>`).join('\n');
}

function readSections(blocks) {
  const start = blocks.indexOf('## Chapter 5');
  const end = blocks.indexOf('# Kakemawari jobs and debt collection');
  assert(start > 0 && end > start, 'Chapter headings missing');
  const chapters = [];
  const supplements = [];
  for (const block of blocks.slice(start, end)) {
    if (/^## (Chapter \d+|Finale)$/.test(block)) {
      const title = block.slice(3);
      chapters.push({ title, anchor: slug(title), overview: [] });
    } else {
      chapters.at(-1).overview.push(block);
    }
  }
  for (const block of blocks.slice(end)) {
    if (/^# /.test(block)) {
      const title = block.slice(2);
      supplements.push({ title, anchor: slug(title), blocks: [] });
    } else {
      supplements.at(-1).blocks.push(block);
    }
  }
  return { introduction: blocks.slice(1, start), chapters, supplements };
}

function readQuests() {
  const records = files.flatMap(file => JSON.parse(read(`${file}.json`)));
  const quests = new Map(records.map(record => [record.id, record]));
  assert.equal(records.length, 140);
  assert.equal(quests.size, 140, 'Repeated quest ID');
  for (let id = 1; id <= 140; id += 1) {
    const quest = quests.get(id);
    assert(quest, `Missing quest ${id}`);
    for (const field of ['name', 'where', 'when']) assert(quest[field]?.trim(), `Quest ${id} needs ${field}`);
    assert(quest.steps?.length && quest.steps.every(step => step.trim()), `Quest ${id} needs a route`);
  }
  return quests;
}

function availability(quest, window) {
  const mentioned = quest.when.match(/\d+-\d+/)?.[0];
  if (mentioned) {
    assert.equal(mentioned, window, `First window mismatch for quest ${quest.id}`);
    return quest.when.replace(new RegExp(`^Chapter (?:${window} onward|\\d+ \\(${window} onward\\)), ([a-z])`, 'i'),
      (_whole, first) => `${window} · ${first.toUpperCase()}`);
  }
  return `${window} · ${quest.when}`;
}

function renderMarkdown(blocks, demoteTop = false) {
  const markdown = blocks.map(block => {
    if (block.split('\n', 1)[0].includes('| First window |')) {
      return block.replace('| First window |', '| First window (pending objective) |').replace(/\| (\d+-\d+) \|/g, (_match, window) => {
        assert(storyObjectives[window], `Missing story objective for ${window}`);
        return `| <strong class="window-code">${window}</strong> · ${storyObjectives[window]} |`;
      });
    }
    return demoteTop ? block.replace(/^# /, '## ') : block;
  }).join('\n\n');
  return marked.parse(markdown).replaceAll('<table>', '<div class="table-wrap" tabindex="0" role="region" aria-label="Guide table"><table>')
    .replaceAll('</table>', '</table></div>');
}

function questReferences(value) {
  return value.split(/((?:#|\b(?:request|commission|bounty) )\d{1,3})(?!\d)/gi).map((part, index) => {
    if (index % 2 === 0) return escape(part);
    const id = Number(part.match(/\d+$/)[0]);
    return id > 0 && id <= 140 ? `<a href="#quest-${id}">${escape(part)}</a>` : escape(part);
  }).join('');
}

function linkPrerequisite(id, text) {
  return `<a href="#quest-${id}" data-prerequisite>${escape(text)}</a>`;
}

function readPrerequisites(text, completionIds, quests) {
  const parts = [];
  const linked = new Set();
  const group = new Set(completionIds);
  let cursor = 0;
  for (const match of text.matchAll(/(?:#|\b(?:request|commission|bounty)\s+)(\d{1,3})(?:[–-](\d{1,3}))?(?!\d)/gi)) {
    const id = Number(match[1]);
    if (!quests.has(id)) continue;
    let start = match.index;
    let end = start + match[0].length;
    // A numbered title followed by an explicit ID refers to that ID.
    if (!match[0].startsWith('#') && /^\s*\(#\d{1,3}\)/.test(text.slice(end))) continue;
    if (match[2]) {
      const last = Number(match[2]);
      if (last < id || !quests.has(last)) continue;
      const ids = Array.from({ length: last - id + 1 }, (_, index) => id + index);
      parts.push({ text: text.slice(cursor, start) });
      if (ids.length <= 8) {
        for (const [index, target] of ids.entries()) {
          if (index) parts.push({ text: ', ' });
          parts.push({ id: target, text: `#${target}` });
          linked.add(target);
        }
      } else {
        parts.push({ text: match[0] });
        for (const target of ids) group.add(target);
      }
    } else {
      const name = quests.get(id).name;
      const precedingName = `${name} (`;
      if (text[end] === ')' && text.slice(cursor, start).endsWith(precedingName)) {
        start -= precedingName.length;
        end += 1;
      } else if (text.startsWith(` ${name}`, end)) {
        end += name.length + 1;
      }
      parts.push({ text: text.slice(cursor, start) }, { id, text: text.slice(start, end) });
      linked.add(id);
    }
    cursor = end;
  }
  parts.push({ text: text.slice(cursor) });
  const links = [...group].filter(id => !linked.has(id)).map(id => ({ id, text: `#${id} ${quests.get(id).name}` }));
  return { parts, links };
}

function renderPrerequisites({ parts, links }) {
  const inline = parts.map(({ id, text }) => id ? linkPrerequisite(id, text) : escape(text)
    .replace(/\b(Two Bones|Devastating Duo)(?= Heat Action)/g, name =>
      `<a href="#revelation-${name.toLowerCase().replaceAll(' ', '-')}">${name}</a>`)).join('');
  const group = links.length ? `<details class="quest-prerequisite-links"><summary>Browse ${links.length} required quests</summary><ul>${links.map(({ id, text }) => `<li>${linkPrerequisite(id, text)}</li>`).join('')}</ul></details>` : '';
  return inline + group;
}

// A few of Coffman's prerequisites name different quests from the current guide.
const sourcePrerequisites = { 51: [45, 55], 55: [15], 85: [33], 92: [72], 96: [90], 140: [60] };

function renderSourceRequirement(id, label, text) {
  if (!/^sub-?story requirements?$/i.test(label)) return escape(text);
  const ids = sourcePrerequisites[id] ?? completedRequirements[id] ?? [];
  if (ids.length === 1) return linkPrerequisite(ids[0], text);
  if (id === 51) {
    const names = text.split(' and ');
    if (names.length === ids.length) return names.map((name, index) => linkPrerequisite(ids[index], name)).join(' and ');
  }
  return escape(text);
}

function renderFullWalkthrough({ id, full, steps, type, unlock }) {
  const nativeRewards = {
    38: 'Quartz and 1,000 XP for the successful answers.',
    78: 'Invest 5,000 mon for 1 ryō and Excellent Steel, or 1 ryō for 2 ryō and Celestial Steel. Both successful routes give 1,000 XP; give him another chance after the first loss.',
    104: 'Locker Key J-2, 1,000 XP',
  };
  const facts = [
    ['Source title', full.title],
    ['Setting', full.setting],
    ['Story requirement', unlock?.activationWindow ? unlock.trigger : full.storyRequirement],
    ...full.requirements.map(({ label, text }) => [label, text]),
    [nativeRewards[id] ? 'Reward (English patch)' : 'Reward', nativeRewards[id] ?? full.reward],
  ].filter(([, value]) => value);
  const body = [];
  let list;
  for (const { text, list: kind } of full.body) {
    const tag = kind === 'ordered' ? 'ol' : kind === 'bullet' ? 'ul' : undefined;
    if (tag !== list) {
      if (list) body.push(`</${list}>`);
      if (tag) body.push(`<${tag}>`);
      list = tag;
    }
    body.push(tag ? `<li>${escape(text)}</li>` : `<p>${escape(text)}</p>`);
  }
  if (list) body.push(`</${list}>`);
  const content = `<div class="quest-full-content">
      ${supplementRoutes.has(id) ? `<h5>Playable route</h5>
      <ol>${steps.map((step, index) => `<li>${questReferences(step)}${id === 8 && index === 0 && guidebookPhoto
        ? `<div class="quest-walkthrough-photo">${renderPhotoPreview(guidebookPhoto, 'Gion Guidebook · Talk to the author')}</div>` : ''}</li>`).join('')}</ol>
      ${type === 'Bounties' ? `<p class="quest-source"><a href="${aerisBounties}">Aeris bounty guide (Japanese)</a></p>` : ''}` : ''}
      <h5>${full.body.length ? 'Patrick Coffman’s walkthrough' : 'Source notes'}</h5>
      <p class="quest-source"><a href="${scribdWalkthrough}">Scribd substory guide</a> · <a href="${originalWalkthrough}">Original GameFAQs walkthrough</a></p>
      ${type !== 'Bounties' ? `<p class="quest-source">Route and map reference · <a href="${khhSubstories}">KHHSubs’ substory guide</a></p>` : ''}
      <dl>${facts.map(([label, value]) => `<dt>${escape(label)}</dt><dd>${renderSourceRequirement(id, label, value)}</dd>`).join('')}</dl>
      ${id === 38 ? '<p class="quest-source">Reward correction: the successful route grants Quartz in this English-patched game. The imported walkthrough’s Lapis Lazuli label differs from the native item grant; its alternative-outcome reward has not been verified here.</p>'
        : id === 78 ? '<p class="quest-source">Native reward choices: invest 5,000 mon for Excellent Steel or 1 ryō for Celestial Steel, then choose “Trust Him” on the first return. The final “remember me?” answer does not change the material.</p>' : ''}
      ${body.join('\n')}
    </div>`;
  return renderLazyDetails('quest-full', 'Full walkthrough', linkGuideMapText(linkGuideItems(content)));
}

function renderGuidebookProgress() {
  return `<section class="guidebook-progress" aria-labelledby="quest-title-8 guidebook-progress-title">
      <h5 id="guidebook-progress-title">Guidebook progress</h5>
      <p data-guidebook-no-save><a href="#save-sync">Sync a gameplay save</a> to see which reports you’ve turned in.</p>
      <div data-guidebook-saved hidden>
        <p><strong data-guidebook-count></strong> <span data-guidebook-source></span></p>
        <progress max="7" value="0" aria-label="Guidebook reports paid"></progress>
        <ul class="guidebook-milestones" role="list">${[...yujoByQuest.values()].map(({ id, slug, name }) =>
          `<li data-guidebook-yujo="${slug}"><span class="guidebook-dot" aria-hidden="true"></span>
            <a href="#quest-${id}">${escape(name)}</a><span data-guidebook-stage></span><small data-guidebook-score hidden></small></li>`).join('')}
        </ul>
      </div>
    </section>`;
}

function renderKarutaPairs() {
  const cards = JSON.parse(read('data/activities/karuta-cards.json'));
  assert.equal(cards.length, 48, 'Expected all 48 in-game Iroha Karuta pairs');
  const pairs = cards.map(({ card, kana, japanese, english }) => `<li class="karuta-pair">
    <img src="assets/karuta-cards/${escape(card)}.webp" width="182" height="256" loading="lazy" decoding="async" alt="Card ${escape(kana)}">
    <div><strong lang="ja">${escape(kana)}</strong><p lang="ja">${escape(japanese)}</p><p>${escape(english)}</p></div>
  </li>`).join('\n');
  return renderLazyDetails('karuta-card-list', `Sayings and matching cards (${cards.length})`,
    `<ul class="karuta-pairs" role="list">${pairs}</ul>`);
}

function renderQuest(quest) {
  const { id, name, where, when, prerequisites, steps, type, unlock } = quest;
  const yujo = yujoByQuest.get(id);
  const bounty = type === 'Bounties';
  const cutoff = storyCutoffs[id] ?? (gionQuests.has(id) ? gionCutoff : '');
  const missable = missableOutcomes[id];
  return `<article class="quest" id="quest-${id}" data-number="${id}"${cutoff || missable ? ' data-missable' : ''} aria-labelledby="quest-title-${id}">
    <div class="quest-heading">
      <h4 id="quest-title-${id}"><a href="#quest-${id}"><span class="quest-number">#${id}</span> ${escape(name)}</a></h4>
      <label class="quest-check"><input type="checkbox" autocomplete="off" aria-labelledby="quest-done-${id} quest-title-${id}"> <span id="quest-done-${id}">Done</span></label>
    </div>
    <p class="quest-window-note" hidden></p>
    <dl><dt>Start</dt><dd class="quest-start">${questReferences(bounty ? wantedBoard : where)}</dd>
    ${bounty ? `<dt>Target</dt><dd class="quest-target">${questReferences(where)}</dd>` : ''}
    <dt>Available</dt><dd>${questReferences(when)} · <a href="#quest-map" data-map-quest="${id}">Show on map</a></dd>
    ${unlock ? `<dt>Story unlock</dt><dd>${escape(unlock.trigger)}${unlock.note ? ` ${escape(unlock.note)}` : ''}</dd>` : ''}
    ${prerequisites ? `<dt>Requires</dt><dd>${renderPrerequisites(prerequisites)}</dd>` : ''}
    ${id === 100 ? '<dt>Coliseum</dt><dd><a href="#coliseum-fighters">Check all 50 fighter defeats</a></dd>' : ''}
    ${yujo ? `<dt>Yūjo profile</dt><dd><a href="#yujo-${yujo.slug}">${yujo.name}’s preferences and dialogue</a></dd>` : ''}
    ${id === 36 || id === 97 ? '<dt>Inventions</dt><dd><a href="#training-inventions">Gyotensai’s recipes and materials</a></dd>' : ''}
    ${cutoff ? `<dt class="quest-warning">Story cutoff</dt><dd>${questReferences(cutoff)}</dd>` : ''}
    ${missable ? `<dt class="quest-warning">Missable</dt><dd>${questReferences(missable)}</dd>` : ''}</dl>
    <ol>${steps.map(step => `<li>${questReferences(step)}</li>`).join('')}</ol>
    ${id === 61 ? '<p>For free Ginger and Sansho, take the optional <a href="#food-quizzes">food quizzes</a> before finishing this request.</p>' : ''}
    ${id === 8 ? renderGuidebookProgress() : ''}
    ${renderQuestMilestones(id)}
    ${renderFullWalkthrough(quest)}
  </article>`;
}

function renderChapter(chapter) {
  return `<section class="chapter" id="${chapter.anchor}" aria-labelledby="${chapter.anchor}-title">
  <h2 id="${chapter.anchor}-title">${chapter.title}</h2>
  <div class="chapter-overview">${renderMarkdown(chapter.overview)}</div>
  ${chapter.groups.map(({ type, quests }) => `<section class="quest-group" aria-label="${type}">
    <h3 class="group-title">${type}</h3>${quests.map(renderQuest).join('\n')}
  </section>`).join('\n')}
</section>`;
}

function renderIndex(chapter) {
  const questsByWindow = new Map();
  for (const quest of chapter.groups.flatMap(group => group.quests)) {
    if (!questsByWindow.has(quest.window)) questsByWindow.set(quest.window, []);
    questsByWindow.get(quest.window).push(quest);
  }
  const windowGroups = [...questsByWindow].sort(([a], [b]) => storyOrder(a) - storyOrder(b)).map(([window, quests]) => `
  <div class="index-window" data-window="${window}">
    <h4>${window.replace('-', '.')}</h4>
    <ul class="quest-links">${quests.map(quest =>
      `<li><a href="#quest-${quest.id}" id="index-quest-${quest.id}">#${quest.id} ${escape(quest.name)}</a></li>`).join('\n')}</ul>
  </div>`).join('\n');
  return `<details data-index="${chapter.anchor}">
  <summary>${chapter.title}</summary>
  <a href="#${chapter.anchor}" class="chapter-link">${chapter.title} overview</a>
  ${windowGroups}
</details>`;
}

function readSideContentIndex(html) {
  return [...html.matchAll(/<section\b[^>]*\bid="([\w-]+)"[^>]*>\s*<h2[^>]*>([^<]+)<\/h2>([\s\S]*?)<\/section>/g)]
    .map(([, id, title, body]) => {
      const children = [];
      const stack = [children];
      const indexBody = body.replace(/<template\b[^>]*>[\s\S]*?<\/template>/g, '');
      const groups = /<details\b([^>]*)>\s*<summary>([^<]+)<\/summary>|<\/details>|<h4 id="([\w-]+)">([\s\S]*?)<\/h4>/g;
      for (const [tag, attributes, summary, headingId, heading] of indexBody.matchAll(groups)) {
        if (tag === '</details>') {
          stack.pop();
        } else if (headingId) {
          stack.at(-1).push({ id: headingId, title: heading.replace(/<[^>]+>/g, '') });
        } else {
          const groupId = attributes.match(/\bid="([\w-]+)"/)?.[1];
          const subgroups = [];
          if (groupId) {
            const label = summary.split(' · ')[0].replace(/\s+\(\d+\)$/, '');
            stack.at(-1).push({ id: groupId, title: label, children: subgroups });
          }
          stack.push(subgroups);
        }
      }
      assert.equal(stack.length, 1, `Unbalanced checklist groups in ${id}`);
      if (id === 'weapon-completion') children.unshift({ id: 'weapon-materials', title: 'Forging materials' });
      if (id === 'minigame-completion') {
        const turtleRacing = children.find(({ id }) => id === 'minigame-turtle-racing');
        const foodIndex = turtleRacing.children.findIndex(({ id }) => id === 'turtle-care') + 1;
        turtleRacing.children.splice(foodIndex, 0, { id: 'turtle-foods', title: 'Turtle food' });
        return { id, title, checklist: true, children: [
          { id: 'minigame-save-records', title: 'In-game records' },
          turtleRacing,
          { id: 'minigame-shogi', title: 'Shogi' },
          { id: 'minigame-mahjong', title: 'Mahjong' },
          { id: 'minigame-koi-koi', title: 'Koi-koi' },
          { id: 'minigame-cho-han', title: 'Cho-han' },
          { id: 'minigame-cee-lo', title: 'Cee-lo' },
          { id: 'parlor-tokkuri', title: 'Tokkuri Toppling' },
          { id: 'parlor-konpira', title: 'Konpira Fune Fune' },
          { id: 'parlor-karuta', title: 'Iroha Karuta' },
          { id: 'parlor-tosenkyo', title: 'Tosenkyo' },
          { id: 'training-yabusame', title: 'Yabusame' },
          { id: 'training-melon', title: 'Iaigiri Spirit Tempering' },
          { id: 'training-waterfall', title: 'Waterfall Meditation' },
          { id: 'training-scarecrow', title: 'Scarecrow Formations' },
          { id: 'training-jiraiya', title: 'Jiraiya Chambers' },
          { id: 'minigame-kabuki', title: 'Kabuki Acting' },
        ] };
      }
      return { id, title, children, checklist: /\bdata-(?:side|coliseum)-done=/.test(body) };
    });
}

function indexLink({ id, title }) {
  return `<a href="#${id}">${title}</a>`;
}

function renderChecklistIndex({ id, title, children }) {
  const item = children?.length ? `<details class="checklist-index-group">
    <summary>${title}</summary>
    <ul><li>${indexLink({ id, title: 'Overview' })}</li>${children.map(renderChecklistIndex).join('')}</ul>
  </details>` : indexLink({ id, title });
  return `<li data-completion-section="${id}">${item}</li>`;
}

function renderCompletionRows(rows, game = false) {
  return rows.map(([title, id, target, anchor = id]) => id === 'collectibles' ? `<div class="completion-category completion-row" data-completion-include="collectibles">
    <input id="completion-collectibles-all" type="checkbox" aria-label="Include all collectible categories" aria-describedby="completion-requirement-collectibles" autocomplete="off" checked>
    <a href="#${anchor}">${title}</a>
    <span class="completion-count" data-completion-count></span>
    <span class="completion-target" id="completion-requirement-collectibles">${target}</span>
    <button id="completion-collectibles-toggle" type="button" aria-expanded="false" aria-controls="completion-collectible-options">Choose categories</button>
    <span class="completion-category-meter" aria-hidden="true"></span>
    <div id="completion-collectible-options" role="group" aria-label="Collectible categories to include" hidden>
      ${collectibleChecklists.map(({ id, title }) => `<label><input type="checkbox" data-completion-collectible="${id}" autocomplete="off" checked> ${title}</label>`).join('')}
    </div>
  </div>` : `<div class="completion-category completion-row">
    <input type="checkbox" data-completion-include="${id}"${game ? ' data-game-category' : ''} aria-label="Include ${title}" aria-describedby="completion-requirement-${id}" autocomplete="off" checked>
    <a href="#${anchor}">${title}</a><span class="completion-count" data-completion-count></span>
    <span class="completion-target" id="completion-requirement-${id}">${target}</span>
    <span class="completion-category-meter" aria-hidden="true"></span>
  </div>`).join('');
}

function renderCompletionDescription(rows, id = '') {
  return `<p class="completion-native-info"><span${id ? ` id="${escape(id)}"` : ''} data-native-description></span><span class="completion-description-reserve" aria-hidden="true">${rows.map(([, , description]) => `<span>${escape(description)}</span>`).join('')}</span></p>`;
}

const gameList = [
  ['Food &amp; Drink', 'restaurant-completion', 'Eat or drink each listed menu item.'],
  ['Storage Lockers', 'locker-keys', 'Open all 50 lockers in Gion.'],
  ['Coliseum', 'arena-and-completion', 'Defeat each of the 50 fighters once.', 'coliseum-fighters'],
  ['Heat Actions', 'heat-action-completion', 'Perform all 56 listed Heat Actions.'],
  ['Abilities', 'ability-completion', 'Learn all 60 listed abilities.'],
  ['Weapons', 'weapon-completion', 'Acquire all 227 listed weapons, including their upgrades.'],
  ['Yujo', 'yujo', 'Reach 20 hearts and finish each of the seven final events.', 'yujo-completion'],
  ['Inventions', 'training-inventions', 'Develop all 21 inventions.'],
  ['Minigames', 'minigame-completion', 'Meet the completion requirements for all 16 games.'],
];
const guideList = [
  ['Substories', 'substories', 'Finish all 140 Requests, Commissions, and Bounties.'],
  ['Collectibles', 'collectibles', 'Track pickups, turtle rescues, and collection rewards.'],
  ['Locker Key pickups', 'locker-key-pickups', 'Find the keys that open Gion’s storage lockers.'],
  ['Food quizzes', 'food-quizzes', 'Answer the two ingredient quizzes available during request 61.'],
  ['Training and upgrades', 'training-and-upgrades', 'Track lessons, course clears, and upgrades.'],
  ['Tournament clears', 'coliseum-tournaments', 'Win each Coliseum tournament at least once.'],
  ['Sideshow performances', 'sideshow-performances', 'Watch all seven shows at the Theatre in Rakugai.'],
  ['Ultimate Match', 'ultimate-match', 'Clear all 33 postgame stages.'],
];

function renderCompactRows(rows) {
  return rows.map(([title, id, , anchor = id]) => `<li data-compact-category="${id}">
    <a href="#${anchor}">${title}</a><span class="completion-count" data-compact-count></span>
    ${id === 'collectibles' ? `<ul>${renderCompactRows(collectibleChecklists.map(({ id, title }) => [title, id]))}</ul>` : ''}
  </li>`).join('');
}

const completionThemes = [
  ['original', 'Guide Classic'],
  ['classic', 'Kenzan Classic'],
];
const allTrackerThemes = process.argv.includes('--all-tracker-themes');
if (allTrackerThemes) completionThemes.push(
  ['lacquer', 'Kenzan Lacquer', 'substories weapon-completion locker-key-pickups yujo minigame-completion'],
  ['pocket', 'Pocket Quest', 'substories locker-key-pickups heat-action-completion'],
  ['ink', 'Ink & Gold', 'substories weapon-completion yujo'],
  ['redline', 'Redline', 'substories heat-action-completion minigame-completion'],
  ['terminal', 'Night Terminal', 'weapon-completion locker-key-pickups yujo'],
  ['field', 'Gion Field Map', 'substories locker-key-pickups yujo'],
  ['trophy', 'Trophy Cabinet', 'heat-action-completion weapon-completion minigame-completion'],
  ['hanafuda', 'Hanafuda', 'yujo substories minigame-completion'],
  ['blade', 'Blade Gauge', 'weapon-completion heat-action-completion substories'],
  ['celestial', 'Celestial HUD', 'minigame-completion substories locker-key-pickups'],
  ['bounty', 'Bounty Board', 'substories locker-key-pickups weapon-completion'],
);
const defaultCompletionTheme = 'original';
const completionThemeDescriptions = {
  original: 'Warm charcoal, clear rows and apricot progress.',
  classic: 'Silver rails, green menus and the game’s original symbols.',
};

function renderCompletionThemePicker() {
  return `<details id="completion-theme-settings"${allTrackerThemes ? ' data-experimental-themes' : ''} hidden>
    <summary><span>Tracker theme</span><span id="completion-theme-current">${completionThemes[0][1]}</span></summary>
    <fieldset id="completion-theme-picker">
      <legend class="sr-only">Choose a tracker theme</legend>
      <div class="completion-theme-options">
        ${completionThemes.map(([id, name, highlights = '']) => `<button type="button" class="completion-theme-tile" data-completion-theme="${id}" data-theme-highlights="${highlights}" aria-pressed="${id === defaultCompletionTheme}" aria-controls="completion-tracker"${completionThemeDescriptions[id] ? ` aria-describedby="${id}-description"` : ''}>
          <span class="theme-preview-art" aria-hidden="true">
            <span class="theme-preview-title">Completion tracker</span>
            <span class="theme-preview-score"><span>57% complete</span><span>558 / 979</span></span>
            <span class="theme-preview-meter"></span>
            <span class="theme-preview-rows"><span>Food &amp; Drink <i>41 / 71</i></span><span>Storage Lockers <i>32 / 50</i></span></span>
          </span>
          <span class="completion-theme-caption">
            <span class="completion-theme-name">${escape(name)}</span>
            ${completionThemeDescriptions[id] ? `<span class="completion-theme-description" id="${id}-description">${escape(completionThemeDescriptions[id])}</span>` : ''}
            <span class="completion-theme-state" data-theme-selection aria-hidden="true">${id === defaultCompletionTheme ? 'Selected' : 'Use theme'}</span>
          </span>
        </button>`).join('')}
      </div>
    </fieldset>
  </details>`;
}

function renderCompletionTracker() {
  const highlighted = new Set(completionThemes.flatMap(([, , ids = '']) => ids.split(' ')));
  return `<section id="completion-tracker" data-completion-theme="${defaultCompletionTheme}" aria-labelledby="completion-title" hidden>
    <div class="completion-heading">
      <h2 id="completion-title" tabindex="-1">Completion tracker</h2>
      <div id="save-story-badge" hidden>
        <div class="save-story-line" role="status" aria-atomic="true">
          <span id="save-story-last-sync" hidden>Last sync <time></time></span>
          <span class="save-story-separator" aria-hidden="true" hidden>·</span>
          <strong id="save-story-chapter"></strong>
        </div>
        <div class="save-story-actions" hidden>
          <div class="save-story-meta" hidden>
            <span id="save-story-playtime" role="status"><span class="sr-only">Play time: </span><span id="save-story-time"></span></span>
          </div>
          <button id="save-story-use" type="button" aria-label="Use this checkpoint and follow save updates" aria-describedby="save-story-follow-status" hidden>Use &amp; follow</button>
          <span id="save-story-connection" hidden>Not connected</span>
          <button id="save-story-reconnect" type="button" aria-label="Connect save folder" hidden>Connect</button>
        </div>
        <p id="save-story-follow-status" hidden></p>
        <div id="save-player-level" hidden>
          <strong></strong>
          <progress max="1" value="0" aria-label="Experience toward the next level"></progress>
          <span id="save-player-xp"></span>
        </div>
      </div>
    </div>
    <p>Choose which checklists count toward your guide progress. Your checkmarks are kept when you exclude a checklist.</p>
    <div class="completion-overview">
        <div class="completion-overview-art" aria-hidden="true"></div>
        <div class="completion-progress">
          <div class="completion-summary" role="status">
            <strong id="completion-percent">0%</strong>
            <span id="completion-total"></span>
          </div>
          <div class="completion-progress-track">
            <progress id="completion-bar" aria-label="Guide progress" max="1" value="0"></progress>
          </div>
        </div>
        <ul class="completion-highlights" aria-label="Featured checklists" hidden>
          ${[...gameList, ...guideList].filter(([, id]) => highlighted.has(id)).map(([title, id, , anchor = id]) => `<li data-completion-highlight="${id}" hidden>
            <a class="completion-highlight" href="#${anchor}">
              <span class="completion-highlight-name">${title}</span>
              <span class="completion-highlight-count"></span>
              <span class="completion-category-meter" aria-hidden="true"></span>
            </a>
          </li>`).join('')}
        </ul>
    </div>
    <section id="story-pickup-review" class="completion-group" aria-labelledby="story-pickup-review-title" hidden>
      <h3 id="story-pickup-review-title">Confirm item pickups</h3>
      <p>Some pickup locations have no collection record in the save. Confirm the locations you visited, or review your saved answers below.</p>
      <p class="story-pickup-help">Didn’t collect it saves your answer and leaves the pickup unchecked. You can change your answer under Saved not-collected answers below.</p>
      <p data-review-status role="status"></p>
      <p data-review-error role="status" hidden>Could not save this change. Please try again.</p>
      <ul id="story-pickup-review-list">
        ${storyPickupReview.map(({ id, name, scene, sceneLabel, pickupLabel, detail, acquiredKey, href, mapKey }) => `<li data-review-pickup="${escape(id)}" data-review-scene="${escape(scene)}"${acquiredKey ? ` data-review-acquired-key="${escape(acquiredKey)}"` : ''} hidden>
          <div><a href="${escape(href)}"><strong>${escape(name)}</strong></a>
          <span class="story-pickup-window">${pickupLabel ? ` · ${escape(pickupLabel)}` : ''} · ${escape(sceneLabel)}</span>
          <p>${escape(detail)}</p>
          <p data-review-evidence></p></div>
          <div class="save-sync-actions">
            <button type="button" data-review-action="confirm" aria-label="Mark ${escape(name)}${pickupLabel ? `, ${escape(pickupLabel)}` : ''} collected">Yes, mark collected</button>
            <button type="button" data-review-action="not-collected" aria-label="Didn’t collect it: ${escape(name)}${pickupLabel ? `, ${escape(pickupLabel)}` : ''}">Didn’t collect it</button>
            <a class="story-pickup-map-link guide-map-link" href="#quest-map" data-review-map data-map-collectible="${escape(mapKey)}" aria-label="View ${escape(name)}${pickupLabel ? `, ${escape(pickupLabel)}` : ''} on the map">View on map</a>
          </div>
        </li>`).join('')}
      </ul>
      <div class="save-sync-actions"><button type="button" data-review-expand aria-expanded="false" aria-controls="story-pickup-review-list" hidden>Show all</button></div>
      <details class="story-pickup-answers" data-review-answers hidden>
        <summary data-review-answers-summary>Saved not-collected answers</summary>
        <p class="story-pickup-help">Ask me again removes a saved answer. The question returns when a synced or imported save reaches that location. You can also mark the pickup collected on the map or in its checklist.</p>
        <ul class="story-pickup-answer-list">
          ${storyPickupReview.map(({ id, name, sceneLabel, pickupLabel, mapKey }) => `<li data-review-answer="${escape(id)}" hidden>
            <div><strong>${escape(name)}</strong><span class="story-pickup-window">${pickupLabel ? ` · ${escape(pickupLabel)}` : ''} · ${escape(sceneLabel)}</span></div>
            <div class="save-sync-actions">
              <button type="button" data-review-restore="${escape(id)}" aria-label="Ask me again about ${escape(name)}${pickupLabel ? `, ${escape(pickupLabel)}` : ''}">Ask me again</button>
              <a class="story-pickup-map-link guide-map-link" href="#quest-map" data-map-collectible="${escape(mapKey)}" aria-label="View ${escape(name)}${pickupLabel ? `, ${escape(pickupLabel)}` : ''} on the map">View on map</a>
            </div>
          </li>`).join('')}
        </ul>
      </details>
    </section>
    <details id="save-sync" hidden>
      <summary><span class="save-sync-icon" aria-hidden="true">↻</span><span>Sync from a Kenzan save</span></summary>
      <div class="save-sync-body">
        <div id="save-folder-sync">
          <p id="save-folder-privacy">Use your RPCS3 <code>dev_hdd0/home/&lt;user&gt;/savedata</code> folder. The browser grants read access to that folder. This guide checks only <code>USERDATA</code> inside Kenzan’s immediate <code>BLJM60064-LIST-*</code> and <code>BLJM60064-FIXED-</code> slots. Use the original folders and files. Browsers don’t expose filesystem links or Windows junctions to the guide for checking.</p>
          <p id="save-folder-storage">Saves are processed on this device. The browser remembers the folder, sync settings, and checkmarks. Use <strong>Forget folder</strong> to disconnect it. Browser site settings control the underlying read grant. Use the import options below for a one-time read.</p>
          <div id="save-folder-drop" role="region" aria-labelledby="save-folder-drop-title" tabindex="-1" hidden>
            <strong id="save-folder-drop-title">Drop your RPCS3 <code>savedata</code> folder here</strong>
          </div>
          <div class="save-sync-actions">
            <button id="save-folder-choose" type="button">Choose save folder</button>
            <button id="save-folder-reconnect" type="button" hidden>Reconnect folder</button>
            <button id="save-folder-now" type="button" hidden>Sync now</button>
            <button id="save-folder-forget" type="button" hidden>Forget folder</button>
          </div>
          <div id="save-folder-settings" hidden>
            <div class="save-folder-slot-row">
              <label for="save-folder-slot">Gameplay slot</label>
              <select id="save-folder-slot"></select>
            </div>
            <label class="save-auto-label"><input id="save-folder-auto" type="checkbox" autocomplete="off"> Automatically sync when I save</label>
            <p>Auto-sync checks for changes while this tab is visible. Connecting reads the selected or newest gameplay save for chapter, playtime, and Yūjo progress. Checkmarks are applied when you use Sync now or enable auto-sync. Ultimate Match is read from the system save. If the browser asks for access again, use Reconnect folder.</p>
          </div>
          <p id="save-folder-status" role="status"></p>
        </div>
        <details class="save-sync-subgroup">
          <summary>Import an RPCS3 save</summary>
          <p>Select <code>USERDATA</code> inside a <code>BLJM60064-LIST-&lt;slot&gt;</code> folder. For Ultimate Match, select <code>USERDATA</code> inside <code>BLJM60064-FIXED-</code>.</p>
          <div class="save-sync-actions">
            <button id="save-sync-choose" type="button">Choose save file</button>
            <input id="save-sync-file" type="file" hidden aria-label="Kenzan USERDATA file">
          </div>
        </details>
        <details class="save-sync-subgroup" id="save-sync-ps3">
          <summary>Import a PS3 save</summary>
          <p id="save-ps3-help">Choose one Kenzan save folder containing <code>USERDATA</code> and <code>PARAM.PFD</code>, or a ZIP of that folder. Keep both files from the same save together.</p>
          <div class="save-sync-actions">
            <button id="save-ps3-folder-choose" type="button" aria-describedby="save-ps3-help">Choose PS3 save folder</button>
            <input id="save-ps3-folder" type="file" webkitdirectory multiple hidden aria-label="Kenzan PS3 save folder">
            <button id="save-ps3-zip-choose" type="button" aria-describedby="save-ps3-help">Choose ZIP</button>
            <input id="save-ps3-zip" type="file" accept=".zip,application/zip" hidden aria-label="Kenzan PS3 save ZIP">
          </div>
          <p>The guide decrypts and reads the save on this device. Nothing is uploaded. Your save files are never changed. This is a one-time import; it does not connect or monitor the folder.</p>
        </details>
        <div id="save-sync-review" hidden>
          <p id="save-sync-status" role="status"></p>
          <div class="save-sync-actions"><button id="save-sync-apply" type="button" disabled>Apply checkmarks</button></div>
          <ul id="save-sync-preview" hidden></ul>
        </div>
        <details class="save-sync-subgroup" id="save-sync-coverage">
          <summary><span class="save-sync-warning-icon" aria-hidden="true">⚠</span> What save sync doesn’t cover <span id="save-sync-manual-count"></span></summary>
          <p>Mark these story pickups as you go. The save’s inventory history records the item type, which may come from shops or other locations. The separate entries in the Weapons checklist still sync. Wild turtle spawns are repeatable and have no checkmarks.</p>
          <div id="save-sync-manual-list"></div>
        </details>
      </div>
    </details>
    <div class="completion-primary">
      <div class="completion-dragon-art" aria-hidden="true"></div>
      <details id="completion-game" class="completion-group" open>
        <summary>In-game Completion List <span id="game-completion-status" role="status"></span></summary>
        <div class="completion-categories" role="group" aria-label="In-game categories to include">${renderCompletionRows(gameList, true)}</div>
        ${renderCompletionDescription(gameList, 'completion-native-description')}
        <p class="completion-reference"><a href="https://www.khhsubs.com/kenzan/completion/">Completion reference</a></p>
      </details>
      <details id="completion-guide" class="completion-group" open>
        <summary>Kenzan guide checklists</summary>
        <div class="completion-categories" role="group" aria-label="Kenzan guide checklists to include">${renderCompletionRows(guideList)}</div>
        ${renderCompletionDescription(guideList)}
      </details>
    </div>
    <label class="completion-hide"><input type="checkbox" id="completion-hide-excluded" autocomplete="off"> Hide excluded sections from the guide</label>
    <p id="completion-hidden-note" role="status" hidden>That checklist is hidden. Include it again or turn off Hide excluded sections to open it.</p>
  </section>`;
}

function renderPageQuest({ id, name, where, when, requires, steps, type }) {
  const notes = [`**Start** ${type === 'Bounties' ? wantedBoard : where}`];
  if (type === 'Bounties') notes.push(`**Target** ${where}`);
  notes.push(`**Available** ${when}`);
  if (requires) notes.push(`**Requires** ${requires}`);
  return [`#### #${id} ${name}`, notes.join('  \n'), steps.map((step, index) => `${index + 1}. ${step}`).join('\n')].join('\n\n');
}

const { introduction, chapters, supplements } = readSections(JSON.parse(read('content/guide_page_source.json')));
const turtleMasterPhoto = loadLocationPhoto('place-photos', 'gion-turtle-master');
const sideContent = withGuideMapURLs(read('content/side-content.html').replace('<h4 id="turtle-care">',
  (turtleMasterPhoto ? `<div class="collectible-intro">${renderPhotoPreview(turtleMasterPhoto, 'The Turtle Master inside Sake Nakanokura')}<p class="quest-meta">The Turtle Master inside Sake Nakanokura.</p></div>\n    ` : '') + '<h4 id="turtle-care">'));
const sideContentIndex = readSideContentIndex(sideContent);
const abilitySources = new Map([...sideContent.matchAll(/<tr id="(ability-\d+)"><th[^>]*>[^<]+<\/th><td>[^<]*<a href="#((?:training|revelation)-[\w-]+)"/g)]
  .map(([, ability, source]) => [source, ability]));
assert.equal(abilitySources.size, 60, 'Each ability needs one learning objective');
for (const { id, entries } of trainingGroups) {
  for (const { id: entry, revelation } of entries) {
    if (!revelation) continue;
    const trainingAnchor = `training-${id}-${entry}`;
    const revelationAnchor = `revelation-${revelation}`;
    const ability = abilitySources.get(trainingAnchor) ?? abilitySources.get(revelationAnchor);
    assert(ability, `Missing ability for ${trainingAnchor}`);
    abilitySources.set(trainingAnchor, ability);
    abilitySources.set(revelationAnchor, ability);
  }
}
supplements.find(section => section.anchor === 'reference-guides').blocks.push(
  routeReferences,
  `- [KHHSubs’ substory guide](${khhSubstories}) helped cross-check quest steps, and its lettered maps supplied reference positions for starts and step pins. [KHHSubs’ area maps](https://www.khhsubs.com/kenzan/maps/) helped identify landmarks and venues.`,
  `- [Patrick Coffman’s substory guide on Scribd](${scribdWalkthrough}) supplied the full walkthrough text and story requirements.`,
  '- [English translation patch on ModDB](https://www.moddb.com/mods/ry-ga-gotoku-kenzan-english-translation-patch/downloads/ry-ga-gotoku-kenzan-translation-patch) supplies the in-game names used in this guide.',
);
const allQuests = readQuests();
const docUnlocks = JSON.parse(read('content/doc-unlocks.json'));
const docWalkthroughs = JSON.parse(read('content/doc-walkthroughs.json'));
assert.equal(Object.keys(docWalkthroughs).length, allQuests.size);
const assigned = new Set();
const objectiveRows = [...extraWindows];
const questStoryRules = {};
const questClocks = new Map();
for (const [clocks, ids] of clockGroups) {
  for (const id of ids) {
    assert(allQuests.has(id) && !questClocks.has(id), `Invalid or duplicate clock rule for quest ${id}`);
    questClocks.set(id, clocks);
  }
}
for (const chapter of chapters) {
  const { windows, objectives } = chapterWindows(chapter.overview[0]);
  objectiveRows.push(...objectives);
  chapter.groups = types.map(type => ({ type, quests: [] }));
  for (const [id, { window, type }] of windows) {
    assert(!assigned.has(id), `Quest ${id} belongs to more than one chapter`);
    assigned.add(id);
    const quest = allQuests.get(id);
    assert(quest, `Quest ${id} has no walkthrough`);
    const unlock = docUnlocks[id];
    const full = docWalkthroughs[id];
    assert(!unlock || unlock.window === window, `DOCX story window mismatch for quest ${id}`);
    assert(full?.id === id && (full.body.length || supplementRoutes.has(id)), `Missing DOCX walkthrough for quest ${id}`);
    const requirements = completedRequirements[id] ?? [];
    assert(requirements.every(required => required !== id && allQuests.has(required)), `Invalid prerequisite for quest ${id}`);
    const prerequisites = quest.requires ? readPrerequisites(quest.requires, requirements, allQuests) : undefined;
    chapter.groups.find(group => group.type === type).quests.push({ ...quest, type, window, unlock, full, prerequisites, when: availability(quest, window) });
    questStoryRules[id] = {
      missable: Boolean(storyCutoffs[id] || gionQuests.has(id) || missableOutcomes[id]),
      first: storyOrder(window),
      last: lastWindows[id] ? storyOrder(lastWindows[id]) : null,
      gion: gionQuests.has(id) || id === 20 || id === 36,
      clocks: questClocks.get(id) ?? null,
      all: requirements,
      any: id === 8 ? [1, 2, 3, 4, 5, 6, 7] : [],
      continuations: (continuations[id] ?? []).map(([first, last, clocks, note]) => ({
        first: storyOrder(first), last: last ? storyOrder(last) : null, clocks, note,
      })),
    };
  }
  chapter.groups = chapter.groups.filter(group => group.quests.length);
}
assert.equal(assigned.size, allQuests.size);
const checkpoints = objectiveRows.map(([code, clock, label, displayCode = code]) => {
  assert(label && [null, 'day', 'evening', 'night'].includes(clock), `Invalid story checkpoint ${code}`);
  return { id: code === '12-5' ? `${code}-${clock}` : code, code: displayCode, clock, label, order: storyOrder(code) };
}).sort((a, b) => a.order - b.order);
assert.equal(new Set(checkpoints.map(checkpoint => checkpoint.id)).size, checkpoints.length, 'Duplicate story checkpoint');
const atlasObjectives = Object.fromEntries(checkpoints.map(({ id, label }) => [id, label]));
const saveStoryData = JSON.parse(read('data/story/save-story-windows.json'));
const pickupReviewData = JSON.parse(read('data/story/story-pickup-review.json'));
saveStoryData.pickupScenes = pickupReviewData.scenes;
const saveSyncData = JSON.parse(read('data/tracker/save-sync-data.json'));
const questMilestoneRegistry = JSON.parse(read('data/quests/quest-milestones-data.json'));
const saveSyncKeys = supportedKeys(saveSyncData);
for (const rules of Object.values(saveStoryData.selectors)) {
  for (const { window } of rules) assert(Object.hasOwn(atlasObjectives, window), `Unknown saved story window ${window}`);
}
const sharedStoryData = {
  checkpoints: Object.fromEntries(checkpoints.map(({ id, order, clock, code }) => [id, { order, clock, code }])),
  quests: questStoryRules,
  gionCloses: storyOrder('12-4'),
};
const storyData = JSON.stringify({ ...sharedStoryData, training: trainingAvailability(storyOrder) }).replaceAll('<', '\\u003c');
const storyOptions = renderStoryOptions(checkpoints);
const mapQuests = loadMapQuests(chapters, true);
const guidebookPhoto = mapQuests.find(quest => quest.id === 8)?.locations.A?.photo;
assert.equal(mapQuests.length, allQuests.size, 'Atlas needs a pin for each substory');
const revelations = loadRevelations(mapQuests);
const lockerKeys = loadLockerKeys();
const collectibles = collectiblePlaces(mapQuests, revelations, lockerKeys);
const storyWeaponKeys = {
  'pickup-0d3c0012': 'weori1024',
  'pickup-0d3c0013': 'weori4000',
  'pickup-0d3c003d': 'weori3017',
  'pickup-0d3c003e': 'weori1021',
};
// Ask only about one-time item locations without a reliable save mapping.
// Completion history for the same item from another source is not location proof.
const storyPickupReview = collectibles.filter(place => place.type !== 'wild-turtle')
  .flatMap(place => place.entries.map(entry => ({ place, entry })))
  .filter(({ entry }) => entry.progressId && !saveSyncKeys.has('kenzan-atlas:collected:' + entry.progressId))
  .map(({ place, entry }) => {
    const scene = pickupReviewData.pickups[entry.progressId];
    const metadata = pickupReviewData.scenes[scene];
    assert(metadata && Number.isInteger(metadata.chapter) && Number.isInteger(metadata.selector)
      && Number.isInteger(metadata.group) && Number.isInteger(metadata.flag) && metadata.label,
    `Missing verified pickup review scene: ${entry.progressId}`);
    const weapon = storyWeaponKeys[entry.progressId];
    const acquiredKey = weapon && 'kenzan-guide:side-done:weapon-' + weapon;
    if (acquiredKey) assert(saveSyncKeys.has(acquiredKey));
    return { ...entry, id: entry.progressId, scene, sceneLabel: metadata.label, acquiredKey,
      href: `#collectible-${place.id}:${entry.progressId}`, mapKey: `${place.id}:${entry.progressId}` };
  }).sort((a, b) => pickupReviewData.scenes[a.scene].selector - pickupReviewData.scenes[b.scene].selector
    || Object.keys(pickupReviewData.scenes).indexOf(a.scene) - Object.keys(pickupReviewData.scenes).indexOf(b.scene)
    || a.id.localeCompare(b.id));
assert.deepEqual(new Set(storyPickupReview.map(({ id }) => id)), new Set(Object.keys(pickupReviewData.pickups)),
  'Pickup review metadata must cover every unsupported one-time item location');
const reviewDuplicates = new Map();
for (const entry of storyPickupReview) {
  const key = JSON.stringify([entry.scene, entry.name]);
  if (!reviewDuplicates.has(key)) reviewDuplicates.set(key, []);
  reviewDuplicates.get(key).push(entry);
}
for (const entries of reviewDuplicates.values()) if (entries.length > 1) {
  entries.forEach((entry, index) => { entry.pickupLabel = `Pickup ${index + 1} of ${entries.length}`; });
}
const atlas = renderAtlas({ quests: mapQuests, revelations, lockerKeys, collectibles, objectives: atlasObjectives, storyOptions });
const linkGuideMapText = createGuideMapLinker(atlas);
const deferChecklistTables = html => deferChecklistTableBodies(linkGuideMapText(linkGuideItems(html)));
const collectibleChecklists = collectibleLayers.filter(({ id }) => id !== 'wild-turtle' && id !== 'locker-key')
  .map(({ id, label }) => ({ id: `collectibles-${id}`, title: escape(label) }));
const checklistGroups = [
  { id: 'collectibles', title: 'Collectibles', children: collectibleChecklists },
  { id: 'training-and-upgrades', title: 'Training and upgrades', children: standaloneTraining
    .filter(({ id }) => id !== 'inventions').map(({ id, title }) => ({ id: `training-${id}`, title: escape(title) })) },
  ...sideContentIndex.filter(({ checklist }) => checklist),
];
const checklistChildren = new Map(checklistGroups.map(({ id, children }) => [id, children]));
const gameChecklistIndex = gameList.map(([title, id, , anchor = id]) => id === 'yujo' ? {
  id, title: 'Yūjo', children: [
    { id: anchor, title: 'Yūjo Completion List' },
    ...Array.from(yujoByQuest.values(), ({ slug, name }) => ({ id: `yujo-${slug}`, title: escape(name) })),
  ],
} : {
  id: anchor, title, children: checklistChildren.get(anchor),
});
const guideChecklistIndex = guideList.filter(([, id]) => id !== 'substories')
  .map(([title, id]) => ({ id, title, children: checklistChildren.get(id) }));
const supplementIndex = [
  { id: 'items-valuables', title: 'Items &amp; valuables' },
  { id: 'revelations', title: 'Revelations', children: [
    { id: 'revelation-pictures', title: 'Picture Revelations' },
    { id: 'revelation-training', title: 'Training Revelations' },
    ...(revelations.related.length ? [{ id: 'revelation-finale', title: 'Finale dojo follow-up' }] : []),
  ] },
  { id: 'collectibles-wild-turtle', title: 'Wild Turtle Spawns' },
  ...supplements.flatMap(({ anchor, title }) => {
    if (anchor === 'arena-and-completion') return sideContentIndex.filter(({ checklist }) => !checklist);
    if (anchor === 'training-and-upgrades') return [];
    return [{ id: anchor, title: escape(title) }];
  }),
];

const guideMarkup = `
<a class="skip" href="#guide">Skip to guide</a>
<div class="layout" id="guide-layout" data-sidebar-layout>
  ${renderSidebarStart('guide-sidebar-panel', 'Guide index', 'index-toggle')}
  <aside class="sidebar">
    <div class="index-content" id="index-content">
      <h2>Guide index</h2>
      <p id="quest-progress" role="status" data-completion-section="substories"></p>
      <fieldset class="quest-filters">
        <legend class="sr-only">Filter substories</legend>
        <div class="story-picker">
          <label for="story-objective">Current story objective</label>
          <select id="story-objective" autocomplete="off" aria-describedby="story-filter-help story-follow-help">
            <option value="">All story windows</option>
            ${storyOptions}
          </select>
          <p id="story-filter-help" hidden>Pick your pending story objective. Check Requires for any prerequisite quests, items, or stats.</p>
          <p id="story-follow-help" hidden></p>
        </div>
        <label><input id="hide-completed" type="checkbox" autocomplete="off"> Hide completed</label>
        <label data-completion-section="substories"><input id="missable-only" type="checkbox" autocomplete="off"> Unfinished missables only</label>
      </fieldset>
      <nav aria-label="Guide index">
        <div class="sidebar-shortcuts">
          <a href="#quest-map">Interactive map</a>
          <a id="completion-index-link" href="#completion-tracker" hidden>Completion tracker</a>
        </div>
        <div id="checklist-index">
          <div id="in-game-checklist-index" class="checklist-index-section">
            <h3>In-game Completion List</h3>
            <ul>${gameChecklistIndex.map(renderChecklistIndex).join('\n')}</ul>
          </div>
          <div class="checklist-index-section">
            <h3>Kenzan guide checklists</h3>
            <div data-completion-section="substories">
              <h4 class="index-subheading">Substories by chapter</h4>
              ${chapters.map(renderIndex).join('\n')}
            </div>
            <ul id="kenzan-checklist-entries">${guideChecklistIndex.map(renderChecklistIndex).join('\n')}</ul>
          </div>
        </div>
        <div id="supplement-index"><h3>Other side content</h3><ul>${supplementIndex.map(item => item.id === 'collectibles-wild-turtle'
          ? `<li data-completion-section="collectibles">${indexLink(item)}</li>` : renderChecklistIndex(item)).join('')}</ul></div>
      </nav>
    </div>
  </aside>
    </div>
  </div>
  <main id="guide">
    <div class="guide-topbar">
      <form class="guide-search" role="search" data-guide-search data-guide-search-source="assets/guide-search-data.js" aria-label="Search the complete guide">
        <label class="sr-only" for="guide-search-input">Search the guide</label>
        <div class="guide-search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
          <input id="guide-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search quests, items, weapons and more…" aria-controls="guide-search-results">
          <button type="button" class="guide-search-clear" data-guide-search-clear aria-label="Clear search" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="guide-search-results" id="guide-search-results" data-guide-search-results hidden>
          <p role="status" aria-live="polite"></p><ul aria-label="Search results"></ul>
        </div>
      </form>
    </div>
    <header>
      <div class="guide-banner">
        <img src="assets/kenzan-banner.png" width="1920" height="620" alt="" decoding="async" fetchpriority="high">
        <h1><span>${gameTitle}</span> <span class="guide-subtitle">${guideSubtitle}</span></h1>
        <a class="guide-github" href="https://github.com/neophoriac/kenzan-guide" aria-label="View the Kenzan guide on GitHub">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
          </svg>
          GitHub
        </a>
      </div>
      <p>${description}</p>
    </header>
    ${renderCompletionThemePicker()}
    ${renderCompletionTracker()}
    <h2 id="substories" data-completion-section="substories">Substories by chapter</h2>
    <p class="status" id="search-status" aria-live="polite" tabindex="-1" hidden></p>
    <div id="overview"><p class="overview-links"><a href="#quest-map">Interactive map</a><a href="#collectibles" data-completion-section="collectibles">Collectibles</a><a href="#missable-quests-and-rewards">Missable quests and rewards</a></p>${renderMarkdown([...introduction, walkthroughNames], true)}</div>
    ${chapters.map(renderChapter).join('\n')}
    ${deferChecklistTables(renderYujoGuide(allQuests, escape))}
    ${renderRevelations(revelations, escape, atlasObjectives, abilitySources, questReferences)}
    ${deferChecklistTables(renderCollectibles(collectibles, collectibleLayers, escape, atlasObjectives, saveSyncKeys))}
    ${deferChecklistTables(renderLockerKeys(lockerKeys, escape))}
    <!--INVENTORY_REFERENCE-->
    ${supplements.map(({ anchor, title, blocks }) => {
      if (anchor === 'training-and-upgrades') return deferChecklistTables(renderTraining(revelations, escape, atlasObjectives, abilitySources));
      if (anchor === 'arena-and-completion') return deferChecklistTables(withRestaurantItems(withTurtleFoods(withWeaponMaterials(withWeaponTrees(sideContent))))
        .replace('<!-- Iroha Karuta card pairs -->', renderKarutaPairs())
        .replace('<!-- Training minigame checklists -->',
          renderTrainingGroups(trainingMinigames, revelations, escape, atlasObjectives, abilitySources)));
      return `<section class="supplement" id="${anchor}"><h2>${title}</h2>${renderMarkdown(blocks.map(block => block.replace(/^## /, '### ')))}</section>`;
    }).join('\n')}
  </main>
  <details id="completion-compact" hidden>
    <summary aria-controls="completion-compact-list" aria-label="Open completion tracker">
      <span id="completion-compact-title">Completion tracker</span><strong id="completion-compact-percent"></strong>
      <span class="completion-compact-icons" aria-hidden="true"><svg class="completion-compact-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg><svg class="completion-compact-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></span>
      <progress id="completion-compact-bar" max="1" value="0" aria-hidden="true"></progress>
      <span id="completion-compact-total"></span>
    </summary>
    <div class="completion-compact-list" id="completion-compact-list">
      <div class="completion-compact-group">
        <strong>In-game Completion List</strong><ul>${renderCompactRows(gameList)}</ul>
      </div>
      <div class="completion-compact-group">
        <strong>Kenzan guide checklists</strong><ul>${renderCompactRows(guideList)}</ul>
      </div>
    </div>
    <div class="completion-compact-footer">
      <a href="#completion-tracker" id="completion-compact-full">Open full tracker</a>
    </div>
  </details>
</div>
<dialog id="completion-drawer" aria-labelledby="completion-compact-title" aria-describedby="completion-drawer-help"><p class="sr-only" id="completion-drawer-help">Swipe down on the header, tap its close icon, or press Escape to close. Scroll inside the list to see more progress.</p></dialog>
${renderPhotoViewer('guide-photo-viewer', 'guide-photo-title')}
<script type="application/json" id="story-data">${storyData}</script>
<script type="application/json" id="save-sync-data">${JSON.stringify(saveSyncData)}</script>
<script type="application/json" id="weapon-save-data">${JSON.stringify(weaponSaveCatalogue())}</script>
<script type="application/json" id="quest-milestones-data">${JSON.stringify(questMilestoneRegistry).replaceAll('<', '\\u003c')}</script>
<script type="application/json" id="save-story-data">${JSON.stringify(saveStoryData).replaceAll('<', '\\u003c')}</script>`;

const atlasAbilities = Object.fromEntries([...abilitySources].filter(([key]) => key.startsWith('revelation-'))
  .map(([key, ability]) => [key.slice('revelation-'.length), ability]));
const atlasStory = JSON.stringify({ ...sharedStoryData, revelationAbilities: atlasAbilities }).replaceAll('<', '\\u003c');
const guideScript = [atlasGuideHelpers(), ...['src/guide/search-index.js', 'src/guide/search-worker-client.js', 'src/guide/guide-search.js', 'src/guide/scroll-to-top.js', 'src/guide/checklist-tables.js', 'src/guide/guide.js', 'src/guide/guide-tables.js', 'src/quests/quest-walkthroughs.js', 'src/tracker/side-checklists.js',
  'src/quests/quest-milestones.js',
  'src/weapons/weapon-pairs.js', 'src/weapons/weapon-pair-picker.js', 'src/weapons/weapon-tools.js', 'src/weapons/weapon-tree.js', 'src/weapons/weapon-materials.js', 'src/turtles/turtle-foods.js', 'src/inventory/inventory-reference.js', 'src/tracker/completion-drawer.js', 'src/tracker/completion-tracker.js', 'src/turtles/turtle-race-worker-client.js'].map(read)].concat(
    bundleTurtleRaceModules('src/turtles/turtle-race-planner.cjs', 'turtleRacePlanner'), read('src/turtles/turtle-race-planner.js'),
    'guideView.updateQuestMilestones = mountQuestMilestones(viewSignal, viewState);',
    'window.mountKenzanSaveSync(viewSignal, viewState, mountTurtleRacePlanner, (snapshot, connection) => { guideView.updateWeaponSave?.(snapshot); guideView.updateCraftingSave?.(snapshot); guideView.updateTurtleFoodSave?.(snapshot); guideView.updateQuestMilestones?.(snapshot, connection); });',
    'startGuideTables();', 'const checklistLoads = startChecklistLoading();',
    'mountGuideSearch(document.querySelector("[data-guide-search]"), viewSignal, viewState.guideSearch ??= {});', 'mountGuideScrollTop(viewSignal);', 'return guideView;').join('\n');
const saveScript = ['src/tracker/save-story.js', 'src/tracker/save-folder-sync.js', 'src/tracker/save-turtle-bucket.js',
  'src/tracker/save-turtle-races.js', 'src/tracker/save-waterfall.js', 'src/activities/waterfall-scores.js', 'src/tracker/save-training-records.js', 'src/activities/training-records.js', 'src/weapons/save-weapons.js', 'src/tracker/save-crafting.js', 'src/tracker/save-quest-milestones.js', 'src/turtles/turtle-card-tips.js', 'src/tracker/save-sync.js'].map(read).join('\n');
const shellScript = ['src/guide/browser-storage.js', 'src/guide/guide-map-urls.js', 'atlas/sidebar.js', 'src/quests/quest-story.js', 'src/quests/story-follow.js', 'src/guide/view-router.js']
  .map(file => file === 'atlas/sidebar.js' ? atlasSidebar() : read(file)).join('\n');
const guideStyleFiles = ['src/guide/guide.css', 'src/guide/guide-search.css', 'src/guide/scroll-to-top.css', 'atlas/photo-viewer.css', 'atlas/share.css', 'src/tracker/completion-themes.css', 'src/tracker/completion-kenzan-themes.css',
  'src/tracker/completion-guide-theme.css', 'src/tracker/completion-theme-picker.css', 'src/tracker/completion-classic-theme.css', 'src/weapons/weapon-tree.css', 'src/weapons/weapon-materials.css', 'src/turtles/turtle-foods.css', 'src/inventory/inventory-reference.css', 'src/guide/guide-tables.css', 'src/quests/quest-milestones.css'];
if (allTrackerThemes) guideStyleFiles.push('src/tracker/completion-game-themes.css', 'src/tracker/completion-collectible-themes.css');
guideStyleFiles.push('src/tracker/completion-drawer.css');
guideStyleFiles.push('atlas/completion-controls.css');
const guideStyles = [fontStyles({ headingsOnly: true, allTrackerThemes }), ...guideStyleFiles.map(read)].join('\n');
writeTurtleRaceWorker();
writeExecutableAsset('assets/guide-config.js', `const kenzanViewAssets = ${JSON.stringify({
  guide: { script: viewPaths.guide, runtime: 'assets/guide-save-runtime.js' },
  map: { script: viewPaths.map, runtime: 'assets/atlas-runtime.js' },
})};`);
writeExecutableAsset('assets/guide-save-runtime.js', saveScript);
writeExecutableAsset('assets/save-ps3-input.js', read('src/tracker/save-ps3-input.js'));
writeExecutableAsset('assets/save-ps3-crypto.js', read('src/tracker/save-ps3-crypto.js'));
writeExecutableAsset('assets/guide-search-worker.js', read('src/guide/search-index.js') + '\n' + read('src/guide/search-worker.js'));
writeExecutableAsset('assets/atlas-runtime.js', atlasRuntime({ includeSidebar: false }));
writeExecutableAsset('assets/guide-shell.js', shellScript + '\nmountKenzanStorageNotice();\nkenzanViews.start();');
// This reference supplies its own reviewed destinations. Insert after prose
// linkers so exact in-game descriptions never acquire generated inline links.
const completeGuideMarkup = withGuideTargetRoutes(decorateCompletionControls(withGuideMapURLs(linkGuideMapText(linkGuideItems(guideMarkup)))
  .replace('<!--INVENTORY_REFERENCE-->', renderInventoryReference())), getGuideContentSources());
const guideSearchRecords = buildGuideSearchRecords(completeGuideMarkup, getGuideContentSources(), {
  weapons: require('./data/weapons/weapon-upgrades.json').weapons,
  recipes: require('./data/weapons/weapon-upgrades.json').recipes,
  stats: require('./data/weapons/weapon-stats.json').weapons,
  inventory: require('./data/inventory/inventory-reference.json').items,
});
writeExecutableAsset('assets/guide-search-data.js', 'document.currentScript.receiveGuideSearch(' +
  JSON.stringify(guideSearchRecords).replaceAll('<', '\\u003c') + ');');
writeView('guide', completeGuideMarkup, guideStyles, guideScript);
writeView('map', `${atlas}\n<script type="application/json" id="atlas-story-data">${atlasStory}</script>`,
  atlasStyles(), atlasScript(true, { includeRuntime: false }));

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <!-- GUIDE_CONTENT_SECURITY_POLICY -->
  <meta name="referrer" content="no-referrer">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${gameTitle} ${guideSubtitle}</title>
  ${scriptTag('assets/guide-config.js')}
  ${scriptTag('assets/guide-shell.js')}
  <style>${fontStyles()}\n${read('atlas/sidebar.css')}\n${read('src/guide/browser-storage.css')}
  body { margin: 0; } [hidden] { display: none !important; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
  #view-status { margin: 1rem; font: 1rem system-ui; }</style>
</head>
<body>
<aside id="browser-storage-notice" hidden aria-label="Browser storage"><p role="status" aria-live="polite" data-storage-status></p><button type="button" data-storage-retry>Retry saving</button></aside>
<p id="view-status" role="status" hidden></p>
<p id="story-follow-announcement" class="sr-only" role="status" aria-atomic="true"></p>
<noscript><p>This guide requires JavaScript. <a href="Kenzan%20Interactive%20Map.html">Open the standalone map</a>.</p></noscript>
<div id="guide-view" hidden></div>
<section id="quest-map" aria-label="Interactive map" data-integrated hidden></section>
</body>
</html>`;

const destination = path.join(__dirname, 'Kenzan Side Content Guide.html');
const contentPolicy = [
  "default-src 'none'", "connect-src 'self' blob: file:", "base-uri 'none'", "form-action 'none'", "object-src 'none'",
  "worker-src 'self' blob:",
  "img-src 'self' file: data:", 'font-src data:', "style-src 'unsafe-inline'", "script-src 'self' file:",
].join('; ');
fs.writeFileSync(destination, html.replace('<!-- GUIDE_CONTENT_SECURITY_POLICY -->',
  `<meta http-equiv="Content-Security-Policy" content="${contentPolicy}">`));
if (process.argv.includes('--page')) {
  fs.writeFileSync(path.join(__dirname, 'page_chapters.json'), JSON.stringify({
    description,
    routeReferences,
    chapters: chapters.map(chapter => ({
      heading: `## ${chapter.title}`,
      markdown: chapter.groups.map(({ type, quests }) => `### ${type}\n\n${quests.map(renderPageQuest).join('\n\n')}`).join('\n\n'),
    })),
  }, null, 2));
}
console.log(`Built ${destination} with ${allQuests.size} quests across ${chapters.length} chapters`);
