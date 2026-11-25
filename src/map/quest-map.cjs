const { root: projectRoot } = require("../paths.cjs");
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const folder = path.join(projectRoot, 'maps');
const stepPhotoFolder = 'assets/quest-step-photos';
const insideStarts = new Set([56, 60, 62, 69, 97, 111, 112, 113, 115]);
// The poster interaction on pac_ST_RAKUGAICHO.bin record 01830290.
const wantedBoard = { area: 'st_rakugaicho', x: .128414, y: .166076, precision: 'game', note: 'Wanted board where the bounty starts.' };

function readMapData(filename, fallback) {
  const source = path.join(folder, filename);
  return fs.existsSync(source) ? JSON.parse(fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '')) : fallback;
}

function loadQuestStepPhoto(id, letter) {
  const base = `${stepPhotoFolder}/${id}-${letter}`;
  const source = base + '.webp';
  if (!fs.existsSync(path.join(projectRoot, source))) return undefined;
  const preview = base + '-thumb.webp';
  assert(fs.existsSync(path.join(projectRoot, preview)), `Missing preview for quest ${id} pin ${letter}`);
  return { source, preview, width: 640, height: 360 };
}

function loadMapQuests(chapters, includeBounties = false) {
  const areas = readMapData('data/areas.json', []);
  const reference = readMapData('reference/pins.json', {});
  const game = readMapData('data/native/pins.json', {});
  const byArea = new Map(areas.map(area => [area.id, area]));
  const stepPlans = {
    ...readMapData('data/atlas-steps-requests.json', {}),
    ...readMapData('data/atlas-steps-commissions-bounties.json', {}),
  };
  const referenceSteps = readMapData('reference/step-pins.json', {});
  const gameSteps = readMapData('data/native/step-pins.json', {});
  function withSteps(quest) {
    const { id, type, pin, interior } = quest;
    const steps = stepPlans[id];
    assert(steps?.length && steps.every(({ letter, text }) => text?.trim() && (!letter || /^(?:[A-Z]|board)$/.test(letter))),
      `Missing or invalid atlas steps for quest ${id}`);
    const locations = {};
    for (const letter of new Set(steps.map(step => step.letter).filter(Boolean))) {
      const start = letter === 'A' && type !== 'Bounties' ? interior ?? pin : undefined;
      const point = letter === 'board' ? pin : gameSteps[id]?.[letter]
        ?? (interior && letter === 'A' ? interior : referenceSteps[id]?.[letter]) ?? start;
      assert(point, `Missing map location ${letter} for quest ${id}`);
      const { area, x, y, precision } = point;
      assert(byArea.has(area) && [x, y].every(value => Number.isFinite(value) && value >= 0 && value <= 1),
        `Invalid map location ${letter} for quest ${id}`);
      locations[letter] = { area, x, y, precision, photo: loadQuestStepPhoto(id, letter) };
    }
    assert(Object.keys(locations).length, `Missing all atlas step pins for quest ${id}`);
    const start = quest.mapStartLetter ? locations[quest.mapStartLetter] : undefined;
    assert(!quest.mapStartLetter || start, `Missing actionable start pin for quest ${id}`);
    return { ...quest, ...(start ? { pin: { ...start, note: 'First actionable step in this quest’s route.' } } : {}), steps, locations };
  }
  return chapters.flatMap(chapter => chapter.groups.flatMap(({ type, quests }) => type === 'Bounties' && !includeBounties ? [] : quests))
    .sort((a, b) => Number(a.window.split('-')[0]) - Number(b.window.split('-')[0])
      || Number(a.window.split('-')[1]) - Number(b.window.split('-')[1]) || a.id - b.id)
    .map(({ id, name, type, window, where, requires, prerequisites, unlock, mapStartLetter }) => {
      const storyUnlock = unlock && [unlock.trigger, unlock.note].filter(Boolean).join(' ');
      if (type === 'Bounties') {
        return withSteps({ id, name, type, window, chapter: window.split('-')[0], where: 'Read the wanted poster at the northwest Rakugai police box.',
          target: where, requires, prerequisites, unlock: storyUnlock, pin: wantedBoard });
      }
      let guidePin;
      if (reference[id]) {
        const { area, x, y, precision, note } = reference[id];
        guidePin = { area, x, y, precision, note };
      }
      const gamePin = game[id];
      let pin = guidePin ?? gamePin;
      let interior;
      if (guidePin && gamePin && gamePin.area === guidePin.area) {
        const { width, height } = byArea.get(pin.area);
        const distance = Math.hypot((guidePin.x - gamePin.x) * width, (guidePin.y - gamePin.y) * height);
        if (distance <= 18) pin = { ...gamePin, note: `Game location checked against the walkthrough. ${gamePin.note}` };
      } else if (insideStarts.has(id) && guidePin && gamePin) {
        pin = { ...guidePin, note: `Building marked in the walkthrough. ${guidePin.note}` };
        interior = { ...gamePin, note: `Game interaction point. ${gamePin.note}` };
      } else if (pin && pin === gamePin) {
        pin = { ...gamePin, note: `Game location. ${gamePin.note}` };
      }
      for (const point of [pin, interior].filter(Boolean)) {
        assert(byArea.has(point.area), `No map for quest ${id} area ${point.area}`);
        assert([point.x, point.y].every(value => Number.isFinite(value) && value >= 0 && value <= 1), `Invalid pin for quest ${id}`);
      }
      return withSteps({ id, name, type, window, where, chapter: window.split('-')[0], pin, interior, requires, prerequisites, unlock: storyUnlock, mapStartLetter });
    });
}

module.exports = { loadMapQuests, loadQuestStepPhoto };
