'use strict';

const { events, rivals } = require('../../data/turtles/turtle-native-data.json');

const surfaces = ['Normal', 'Water', 'Sand', 'Mud'];
const eventsById = new Map(events.map(event => [event.id, event]));
const formScores = [
  [50, 70, 90, 70, 50, 30, 20, 30, 50],
  [60, 60, 65, 70, 65, 60, 40, 40, 60],
  [50, 30, 50, 70, 50, 60, 80, 40, 30],
  [80, 70, 80, 70, 70, 50, 40, 30, 40],
];
const personalities = ['Timid', 'Normal', 'Clumsy', 'Unpredictable', 'Awful'];
const statNames = ['stamina', 'legPower', 'sand', 'water', 'mud', 'fullness'];
const f32 = Math.fround;

function createRaceRng(seed = 1) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('Race RNG seed must be an unsigned 32-bit integer');
  }
  let state = seed;
  let draws = 0;
  function next() {
    state = (Math.imul(85, state) + 127) >>> 0;
    draws += 1;
    return state;
  }
  return {
    next,
    next15: () => next() & 0x7fff,
    next16: () => next() & 0xffff,
    unit16: () => f32((next() & 0xffff) * f32(1 / 65535)),
    get seed() { return state; },
    get draws() { return draws; },
  };
}

function getEvent(eventId) {
  const event = eventsById.get(String(eventId).replace(/^turtle-race-/i, '').toUpperCase());
  if (!event) throw new RangeError(`Unknown turtle race event "${eventId}"`);
  return event;
}

function rollRaceBoard(seedOrRng = 1) {
  const rng = typeof seedOrRng === 'number' ? createRaceRng(seedOrRng) : seedOrRng;
  const startDraws = rng.draws;
  // 0x2AB7E4 rolls the whole board in file order. The low two bits rotate
  // across Random cells because the RNG advances by -1 modulo four.
  const layouts = Object.fromEntries(events.map(event => [
    event.id,
    event.sections.map(surface => surface === 'Random' ? surfaces[rng.next15() % 4] : surface),
  ]));
  return { layouts, seed: rng.seed, draws: rng.draws - startDraws };
}

function byte(value, name) {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`${name} must be a byte in the range 0 to 255`);
  }
  return value;
}

function normalizeTurtle(turtle, slot) {
  if (!turtle || typeof turtle !== 'object') throw new TypeError('Each starting slot needs a turtle');
  const name = turtle.name ?? `Turtle ${slot + 1}`;
  const personalityId = turtle.personalityId ??
    (typeof turtle.personality === 'number' ? turtle.personality : personalities.indexOf(turtle.personality));
  if (!Number.isInteger(personalityId) || personalities[personalityId] === undefined) {
    throw new RangeError(`${name} needs a known personality`);
  }
  const formScore = turtle.formScore ?? formScores[turtle.formCycle]?.[turtle.formPhase];
  if (!Number.isFinite(formScore) || formScore < 0 || formScore > 100) {
    throw new RangeError(`${name} needs a Form score or valid Form indices`);
  }
  const stats = Object.fromEntries(statNames.map(statName => {
    const stat = turtle.stats?.[statName] ?? turtle[statName] ?? turtle.terrainStats?.[statName];
    const value = byte(typeof stat === 'object' && stat !== null ? stat.value : stat, `${name}'s ${statName}`);
    const max = byte(stat?.max ?? value, `${name}'s ${statName} cap`);
    return [statName, { value, max }];
  }));
  return {
    id: turtle.id ?? turtle.slot ?? slot,
    name,
    personalityId,
    formScore,
    formCycle: turtle.formCycle,
    formPhase: turtle.formPhase,
    affinity: byte(turtle.affinity, `${name}'s affinity`),
    rankId: turtle.rankId,
    speciesId: turtle.speciesId,
    runtime: turtle.runtime,
    stats,
  };
}

function formMultiplier(score) {
  // 0x2A9328 divides by 50 first and performs the final multiply-add.
  return f32(f32(f32(score / 50) - 1) * .25 + 1);
}

function rating(turtle) {
  const { stamina, fullness, legPower, sand, water, mud } = turtle.stats;
  const sum = stamina.max + fullness.max + legPower.value + legPower.max +
    sand.value + sand.max + water.value + water.max + mud.value + mud.max;
  return Math.trunc(f32(f32(sum / 2550) * 100));
}

function condition(turtle) {
  // 0x2A95F4, the form/trust/fullness condition used only by rival filters.
  const form = formMultiplier(turtle.formScore);
  const trust = turtle.affinity;
  const fullness = turtle.stats.fullness.value;
  const effectiveFullness = turtle.personalityId === 2 ? 255 - fullness : fullness;
  if (trust >= 193 && effectiveFullness < 64 && form >= f32(1.05)) {
    return form >= f32(1.15) ? 1 : 3;
  }
  if (trust < 64 && effectiveFullness >= 193 && form < 1) {
    return form < f32(.95) ? 2 : 4;
  }
  if (trust >= 129 && effectiveFullness < 128) return 5;
  if (trust < 128 && effectiveFullness >= 129) return 6;
  return 0;
}

function meetsRivalRule(rival, rule) {
  if (rule === 'NONE') return true;
  if (rule === 'M_LIFE') return rival.lifespan.remaining * 10 <= rival.lifespan.initial;
  if (rule === 'M_LOSE') return rating(rival) <= 60 && ![1, 3, 5].includes(condition(rival));
  if (rule === 'S_WIN' || rule === 'M_WIN') {
    return rating(rival) >= (rule === 'S_WIN' ? 40 : 80) && ![2, 4, 6].includes(condition(rival));
  }
  const statName = rule.endsWith('_ENERGY') ? 'stamina' : rule.slice(2).toLowerCase();
  if (rule.startsWith('O_')) return rival.stats[statName].value >= 102;
  return rival.stats[statName].value >= 153 && rival.stats.legPower.value >= 204;
}

function rollRival(template, rankId, rng) {
  function rollStat(name) {
    const { base, amplitude } = template.stats[name];
    return { value: Math.min(255, base + (amplitude ? rng.next15() % amplitude : 0)), max: Math.min(255, base + amplitude) };
  }
  const stamina = rollStat('stamina');
  const formCycle = rng.next15() % 4;
  const formPhase = rng.next15() % 9;
  const stats = {
    stamina,
    legPower: rollStat('legPower'),
    sand: rollStat('sand'),
    water: rollStat('water'),
    mud: rollStat('mud'),
    fullness: rollStat('fullness'),
  };
  const affinity = 63 + rng.next15() % 128;
  const growthPattern = rng.next15() % 4;
  return {
    id: template.id,
    name: template.name,
    speciesId: template.speciesId,
    rankId,
    personalityId: template.personalityId,
    formCycle,
    formPhase,
    formScore: formScores[formCycle][formPhase],
    affinity,
    growthPattern,
    lifespan: { initial: 300, remaining: template.nativeTags.includes('老') ? 10 : 300 },
    stats,
  };
}

function generateRivalLineup({ eventId, player, seed = 1, rng = createRaceRng(seed), titleRaceFix = false,
  maxRivalAttempts = 0x8000 } = {}) {
  const event = getEvent(eventId);
  const entrant = normalizeTurtle(player, 0);
  const entrantRating = rating(entrant);
  const raceClass = event.id[0];
  const rankId = 'HKSOYM'.indexOf(raceClass);
  // 0x2ADC4C subtracts the first index from the last, without adding one.
  const pool = rivals.filter(template => raceClass === 'M'
    ? 'OY'.includes(template.rankPool) : template.rankPool === raceClass).slice(0, -1);
  const startDraws = rng.draws;
  const used = new Set();
  const lineup = [entrant];
  let attempts = 0;
  const result = (status, reason) => ({
    status, reason, lineup, attempts, seed: rng.seed, draws: rng.draws - startDraws, entrantRating,
  });
  if (!titleRaceFix && event.rivalRule === 'M_WIN' && entrantRating <= 59) {
    return result('no-start', 'The original title race cannot fill four rival slots for an entrant rated 59 or lower.');
  }
  if (!Number.isInteger(maxRivalAttempts) || maxRivalAttempts < 1) {
    throw new RangeError('maxRivalAttempts must be a positive integer');
  }

  // The race module consumes one draw on every slot's initialization.
  entrant.runtime = { ...entrant.runtime, laneFlag: rng.unit16() < .5 ? 32 : 0 };
  const tagAllowed = template => !(entrantRating < 80 && template.nativeTags.includes('最')) &&
    !(entrantRating < 60 && template.nativeTags.includes('強'));
  while (lineup.length < 5) {
    const rivalRank = raceClass === 'M' ? 3 + (rng.next() & 1) : rankId;
    let index;
    do {
      index = rng.next15() % pool.length;
    } while (used.has(index));
    for (let trial = 0; trial < maxRivalAttempts; trial += 1) {
      const template = pool[index];
      const candidate = rollRival(template, rivalRank, rng);
      attempts += 1;
      const force = titleRaceFix && trial + 1 >= 0x7f00;
      const allowTagged = titleRaceFix && trial + 1 >= 0x4000;
      if (force || ((allowTagged || tagAllowed(template)) && meetsRivalRule(candidate, event.rivalRule))) {
        used.add(index);
        candidate.runtime = { laneFlag: rng.unit16() < .5 ? 32 : 0 };
        lineup.push(candidate);
        break;
      }
      if (trial + 1 === maxRivalAttempts) {
        return result('no-start', 'The rival selection limit was reached before the field filled.');
      }
      do {
        index = (index + 1) % pool.length;
      } while (used.has(index));
    }
  }
  return result('ready');
}

module.exports = { createRaceRng, formMultiplier, generateRivalLineup, getEvent, normalizeTurtle, rating, rollRaceBoard, surfaces };
