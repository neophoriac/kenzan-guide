const assert = require('node:assert/strict');
const { guideArtworkLabel } = require('../map/guide-artwork-names.cjs');

const extraStops = {
  // Actor positions projected onto the atlas from the installed WDR maps.
  firstMeeting: { area: 'st_gion', x: .177252, y: .303487 },
  udon: { area: 'st_udon', x: .352503, y: .431966 },
  sideshow: { area: 'st_rakugaicho', x: .170726, y: .556301 },
  clockSeller: { area: 'st_shichiya', x: .501857, y: .285693 },
  dragonDonor: { area: 'st_kawa_jnt', x: .512632, y: .501126 },
  snakeLetter: { area: 'st_gion', x: .419476, y: .890892 },
  asuraLetter: { area: 'st_kaido_rakunai', x: .382057, y: .667879 },
  zankiStudents: { area: 'st_rakugaicho', x: .494074, y: .820450 },
  duel: { area: 'st_sanjusangen_jnt', x: .356410, y: .422106 },
};

function routeSteps(entry, shichigoro, training, quests) {
  const { id, picture, pin, steps: [first, second, third] } = entry;
  const questPoint = (quest, letter = 'A') => {
    const point = quests.get(quest)?.locations[letter];
    assert(point, `Missing substory ${quest} pin ${letter} for ${id}`);
    return point;
  };
  const mapped = (point, text) => ({ point, text });
  const action = text => ({ text });
  const findTraining = id => training.find(course => course.id === id).pin;
  switch (id) {
    case 'oblivious-cat':
      return [mapped(extraStops.firstMeeting, 'After Itō tells you about Kōetsu, meet Shichigoro in the back alley near Tsuruya.'),
        mapped(shichigoro, 'Follow Shichigoro to Gion Inari Shrine for the painting, Paintbrush and Inkwell.'),
        mapped(pin, second), action(third)];
    case 'monkey-drop':
      return [mapped(shichigoro, 'After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro.'),
        mapped(extraStops.udon, 'Eat four times at Shirohebi Udon in Rakugai for Ticket (Leaping Monkey).'),
        mapped(extraStops.sideshow, 'Speak to the attendant outside Rakugai’s Sideshow Tent. The first showing is free with the ticket.'),
        mapped(pin, 'Choose “An Extraordinary Trick! The Amazing Jumping Monkey!” Repeat showings cost 50 mon.'), action(third)];
    case 'karakuri-spin':
      return [mapped(extraStops.clockSeller, first), mapped(pin, second), action(third)];
    case 'dragon-catch':
      return [mapped(extraStops.dragonDonor, first), mapped(pin, second), action(third)];
    case 'true-dual-sword-dance':
      return [mapped(questPoint(18), first), mapped(pin, second), action(third)];
    case 'orochi-bladestorm':
      return [mapped(questPoint(53), first), mapped(pin, second), action(third)];
    case 'enmei':
      return [mapped(questPoint(75), first), mapped(pin, second), action(third)];
    case 'fly-swatter':
      return [mapped(questPoint(85), 'In substory #85, Gion’s Famous Doctor 2, agree to look for Ken-san.'),
        mapped(questPoint(85, 'B'), 'Ask the worker at Sushi Ginya about Ken.'),
        mapped(questPoint(85, 'C'), 'Find Ken by Gion Main Gate and defeat Wakamatsu’s group to get the diagram.'),
        mapped(pin, second), action(third)];
    case 'dry-leaf-smash':
      return [mapped(pin, first), action(second), mapped(findTraining('flowing-stream'), third)];
    case 'unshackling-slash':
      return [mapped(extraStops.snakeLetter, first), mapped(pin, second)];
    case 'swallow-drop':
      return [mapped(extraStops.asuraLetter, 'Clear En no Ozuma’s other five courses. After receiving the route to Ganryu Island from Koetsu, collect En no Ozuma’s final letter on the road through Kawaramachi.'),
        mapped(pin, `Go to En no Ozuma on Riverside Path. ${second}`)];
    case 'swordless-justice':
      return [mapped(findTraining('swordless-catch'), first),
        mapped(extraStops.zankiStudents, 'Talk to the students outside Zanki Dojo in southeast Rakugai.'),
        mapped(extraStops.duel, 'Follow their lead to Sanjusangendo grounds and watch the duel.'), mapped(pin, third)];
    default:
      return picture ? [mapped(shichigoro, first), mapped(pin, second), action(third)] : [mapped(pin, first), action(second)];
  }
}

function letteredRoute(steps) {
  const locations = {};
  return {
    locations,
    steps: steps.map(({ point, text }) => {
      assert(text, 'Missing Revelation step text');
      if (!point) return { text };
      const letter = String.fromCharCode(65 + Object.keys(locations).length);
      const { area, x, y, precision } = point;
      locations[letter] = { area, x, y, precision };
      return { letter, text };
    }),
  };
}

function loadRevelations(mapQuests) {
  const locations = require('../../maps/data/atlas-revelations.json');
  const pictures = require('../../data/activities/revelations.json').map(entry => ({ ...entry, pin: locations[entry.nativeIndex] }));
  const courses = require('../../data/activities/revelation-training.json');
  const training = courses.filter(entry => !entry.related);
  const related = courses.filter(entry => entry.related);
  assert.equal(new Set(pictures.map(entry => entry.nativeIndex)).size, 18, 'Expected all 18 picture Revelations');
  assert.equal(training.length, 10, 'Expected all 10 training Revelations');
  const entries = [...pictures, ...training, ...related];
  assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length, 'Duplicate Revelation ID');
  for (const { id, name, window, steps, pin } of entries) {
    assert(/^[a-z\d-]+$/.test(id) && name && /^\d+-\d+$/.test(window) && steps.length && pin, `Incomplete Revelation ${id}`);
  }
  const quests = new Map(mapQuests.map(quest => [quest.id, quest]));
  for (const entry of entries) Object.assign(entry, letteredRoute(routeSteps(entry, locations.shichigoro, training, quests)));
  return { pictures, training, related, shichigoro: locations.shichigoro };
}

function revelationPlaces({ pictures, training, related, shichigoro }) {
  const places = new Map();
  const courses = [...pictures, ...training, ...related];
  const boar = training.find(entry => entry.id === 'dry-leaf-smash');
  const riverside = training.find(entry => entry.id === 'flowing-stream');
  courses.push({ ...boar, pin: riverside.pin, time: riverside.time, retry: true,
    ...letteredRoute([{ point: riverside.pin, text: boar.steps.at(-1).text }]) });
  for (const { id, name, window, time, picture, steps, locations, pin, retry } of courses) {
    const key = picture ? `${pin.area}/${pin.x}/${pin.y}` : `${pin.area}/${pin.location}`;
    if (!places.has(key)) {
      const { area, x, y, location } = pin;
      places.set(key, { area, x, y, location, type: 'revelation', name: location || name, revelations: [] });
    }
    const place = places.get(key);
    const cutoff = ['st_gion', 'st_hatsumeika'].includes(pin.area);
    const missable = cutoff || ['enmei', 'fly-swatter', 'swallow-drop', 'swordless-justice'].includes(id);
    place.revelations.push({ id, name, window, time, picture, steps, locations, cutoff, missable, retry });
    place.approximate ||= Boolean(pin.approximate);
  }
  for (const place of places.values()) {
    if (place.revelations.length === 1) place.name = place.revelations[0].name;
  }
  if (shichigoro) {
    const { area, x, y, location } = shichigoro;
    places.set('shichigoro', { area, x, y, location, type: 'revelation', id: 'shichigoro', name: 'Shichigoro',
      detail: 'Meet Shichigoro at Gion Inari Shrine in Chapter 5. Watch for his later letters as the story progresses, then return here to collect the pictures.',
      revelations: [] });
  }
  return [...places.values()];
}

function renderRevelations({ pictures, training, related, shichigoro }, escape, objectives, abilitySources, questReferences) {
  assert.equal(typeof questReferences, 'function', 'Revelation prose needs the shared plain-text quest renderer');
  const mapLink = (id, label = 'Show on map') => `<a href="#quest-map" data-map-revelation="${escape(id)}">${label}</a>`;
  // Identify references before HTML escaping. A regex over escaped HTML can
  // mistake the apostrophe entity &#39; for quest #39 and break readable prose.
  const renderStep = step => questReferences(step)
    .replace(/\b(Learn|After learning) (Oblivious Cat|Two Bones|Devastating Duo)\b/g, (_, action, name) =>
      `${action} <a href="#revelation-${name.toLowerCase().replaceAll(' ', '-')}">${name}</a>`);
  const renderEntry = ({ id, name, window, time, picture, steps, pin }) => `<article class="revelation-entry" id="revelation-${escape(id)}" aria-labelledby="revelation-title-${escape(id)}">
    <div class="quest-heading"><h4 id="revelation-title-${escape(id)}">${escape(name)}</h4>
    <a class="quest-check" href="#${abilitySources.get(`revelation-${id}`)}" data-revelation-ability="${escape(id)}">Mark in Abilities</a></div>
    <dl><dt>Location</dt><dd>${escape(guideArtworkLabel(pin.area, pin.location))}</dd>
    <dt>First window (pending objective)</dt><dd>${escape(window)} · ${escape(objectives[window])}</dd>
    <dt>Available</dt><dd>${escape(time)} · ${mapLink(id)}</dd>
    ${picture ? `<dt>Requires</dt><dd>${escape(picture)}</dd>` : ''}</dl>
    ${pin.approximate ? '<p class="revelation-meta">The pin marks the approximate observation spot.</p>' : ''}
    <h5>Quick steps</h5>
    <ol>${steps.map(({ letter, text }, index) => `<li>${letter ? `<a class="revelation-step-letter" href="#quest-map" data-map-revelation="${escape(id)}" data-map-step="${index}" aria-label="Show pin ${letter} on map">${letter}</a> ` : ''}${renderStep(text)}</li>`).join('')}</ol>
  </article>`;
  return `<section class="supplement" id="revelations" aria-labelledby="revelations-title">
    <h2 id="revelations-title">Revelations</h2>
    <p>The <strong>First window</strong> is the earliest point when a Revelation can become available. Its story objective is still pending. Check the time of day and prerequisites before heading to the pin.</p>
    <p>Revelations teach Heat Actions. After Itō tells you about Kōetsu in Chapter 5, meet Shichigoro in the back alley near Tsuruya, then follow him to Gion Inari Shrine. Watch for his later letters and return to the shrine for his pictures. The <a href="#collectibles-collection-reward">Collection Rewards checklist</a> shows where to get every picture.${shichigoro ? ` ${mapLink('shichigoro', 'Find Shichigoro at the shrine')}.` : ''}</p>
    <p>Finish Revelations that require Gion before telling Itō you’re ready to leave at 12-3. Check <a href="#missable-quests-and-rewards">Missable quests and rewards</a> for one-time picture rewards.</p>
    <p>Get the required picture, then go to the observation spot at the listed time of day and interact with the prompt. Follow the timed inputs shown in your game, then select the insight below. The sequences use PlayStation button names. If you miss an input or choose the wrong insight, leave the area and return to retry.</p>
    <nav aria-label="Revelations index"><a href="#revelation-pictures">18 picture Revelations</a> · <a href="#revelation-training">10 training Revelations</a></nav>
    <h3 id="revelation-pictures">Picture Revelations</h3>
    ${pictures.map(renderEntry).join('\n')}
    <h3 id="revelation-training">Training Revelations</h3>
    <p>Learn these through <a href="#training-komaki">Komaki’s exams</a> and <a href="#training-melon">melon training</a>. Mark each move in <a href="#ability-completion">Abilities</a>. Each map pin covers the lessons offered at that location.</p>
    <p>Training prerequisites cross-checked with <a href="https://www.khhsubs.com/kenzan/training/">KHHSubs’ training guide</a>.</p>
    ${training.map(renderEntry).join('\n')}
    ${related.length ? `<h3 id="revelation-finale">Finale dojo follow-up</h3>${related.map(renderEntry).join('\n')}` : ''}
  </section>`;
}

module.exports = { loadRevelations, revelationPlaces, renderRevelations };
