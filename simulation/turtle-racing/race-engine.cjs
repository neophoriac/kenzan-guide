'use strict';

const {
  createRaceRng, formMultiplier, generateRivalLineup, getEvent, normalizeTurtle, rollRaceBoard, surfaces,
} = require('./race-data.cjs');
const { applyAmbience } = require('./race-ambience.cjs');
const { createAutonomousPresentation } = require('./race-autonomous-presentation.cjs');
const { stepRacePresentation } = require('./race-presentation.cjs');

const f32 = Math.fround;
const sectionLength = 100;
const runningOutDistance = 35;
const unit16Scale = f32(1 / 65535);
const terrain = {
  Sand: { stat: 'sand', fullness: -.05, paceNoise: .5 },
  Water: { stat: 'water', fullness: -.075, paceNoise: .75 },
  Mud: { stat: 'mud', fullness: -.1, paceNoise: 1 },
};
const mishapTarget = [0, .75, .5, undefined, .75];

function integer(value, minimum, name) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new RangeError(`${name} must be an integer of at least ${minimum}`);
  }
  return value;
}

function lerp(current, target, rate) {
  return f32(f32(target - current) * rate + current);
}

function makeRacer(turtle, slot, options) {
  const normalized = normalizeTurtle(turtle, slot);
  const { runtime = {}, stats } = normalized;
  const stamina = slot === 0 && options.staminaMode === 'full' ? stats.stamina.max : stats.stamina.value;
  const appliedEntry = slot === 0 && options.applyEntryEffects;
  return {
    ...normalized,
    slot,
    stamina,
    affinity: Math.max(0, normalized.affinity - (appliedEntry && stamina <= 15 ? 8 : 0)),
    fullness: Math.max(0, stats.fullness.value - (appliedEntry ? 32 : 0)),
    form: formMultiplier(normalized.formScore),
    distance: runtime.distance ?? 0,
    velocity: runtime.velocity ?? 0,
    sectionIndex: runtime.sectionIndex ?? Math.floor(f32((runtime.distance ?? 0) / sectionLength)),
    condition: runtime.condition ?? normalized.personalityId,
    cheerActive: runtime.cheerActive ?? false,
    cheerTarget: runtime.cheerTarget ?? 1,
    cheerMultiplier: runtime.cheerMultiplier ?? 1,
    cheerDelay: runtime.cheerDelay ?? 0,
    cheerWindow: runtime.cheerWindow ?? 0,
    mishapTicks: runtime.mishapTicks ?? 0,
    mishapMultiplier: runtime.mishapMultiplier ?? 1,
    sleepUsed: runtime.sleepUsed ?? false,
    clumsyAnimation: runtime.clumsyAnimation ?? false,
    drift: runtime.drift ?? 0,
    laneFlag: runtime.laneFlag ?? 0,
    place: null,
    finishTick: null,
    staminaAtFinish: null,
    splits: [],
  };
}

function acceptCheer(racer, { rng, timerRate, scale }) {
  // +0x42C schedules the cheering period and derives its target from trust.
  const mode = racer.condition;
  const base = mode === 0 ? f32(1.4) : mode === 1 ? f32(1.5)
    : mode === 3 ? f32(rng.unit16() * f32(.2) + f32(1.4)) : f32(1.6);
  const trustFactor = f32(f32(racer.affinity / 255) * f32(.4) + f32(.8));
  racer.cheerTarget = f32(base * trustFactor);
  racer.cheerActive = true;
  const durationSeconds = [3, 2, 1, 2, 1][mode];
  racer.cheerDelay = durationSeconds === undefined ? 0 : timerRate * durationSeconds + rng.next15() % timerRate;
  racer.cheerWindow = Math.floor(31 * scale) + 1;
  // This path runs after selecting the boost from the turtle's existing affinity.
  if (racer.personalityId === 0) racer.affinity = Math.max(0, racer.affinity - 1);
  if (racer.personalityId === 2) racer.affinity = Math.min(255, racer.affinity + 1);
  // +0x13020 and +0x1384C use one shared draw for the rival and player
  // cheer sounds respectively, before forward movement begins.
  rng.next15();
}

function automaticCheer(racer, order, countCheering, race) {
  const { rng, track, finishDistance } = race;
  // The native rolls happen in sequence, including when the first attempt fails.
  const chance = p => rng.unit16() < f32(p);
  const place = order.indexOf(racer);
  const leader = order[0];
  const nearLeader = place > 0 || leader.distance - order[1].distance < 30;
  const surface = track[Math.min(track.length - 1, racer.sectionIndex)];
  const rule = terrain[surface];
  if (place > 0 && rule) {
    const skill = racer.stats[rule.stat].value;
    if (skill < 85 && chance(.01)) return true;
    if (skill >= 85 && skill < 170 && chance(.005)) return true;
  }
  if (racer.stamina > 160) {
    if (countCheering > 0 && chance(.075)) return true;
    if (chance(.0075)) return true;
  } else if (racer.stamina > 128) {
    if (countCheering > 0 && chance(.05)) return true;
    if (chance(.005)) return true;
  } else if (racer.stamina > 64 && place > 0 && chance([0, .0025, .005, .0075, .01][place])) {
    return true;
  }
  return f32(racer.distance / finishDistance) > f32(.8) && nearLeader;
}

function stepCheering(racers, requests, race) {
  const order = [...racers].sort((a, b) => b.distance - a.distance || a.slot - b.slot);
  const countCheering = racers.filter(racer => racer.cheerActive && racer.cheerWindow === 0).length;
  for (const racer of racers) {
    if (racer.stamina === 0) racer.cheerDelay = 1;
    if (racer.cheerDelay > 0) {
      racer.cheerDelay -= 1;
      if (racer.cheerDelay === 0) racer.cheerActive = false;
      continue;
    }
    if (racer.place !== null) continue;
    // The compensation patch gates the AI's decision rolls to the original cadence.
    if (requests?.has(racer.slot) || (racer.slot > 0 && race.opponentCheering && race.nativeTick &&
        automaticCheer(racer, order, countCheering, race))) {
      acceptCheer(racer, race);
    }
  }
}

function drainStamina(racer, threshold, amount, race) {
  // This low-15-bit roll still consumes a draw on intermediate updates
  // under the FPS patch. The patch only gates the stamina deduction.
  const roll = race.rng.next15() % 90;
  if (race.nativeTick && roll <= threshold) {
    racer.stamina = Math.max(0, racer.stamina - amount);
  }
}

function rollMishap(racer, race, passFactor) {
  const kind = racer.condition;
  const fullness = f32(racer.fullness / 255);
  const trust = f32(racer.affinity / 255);
  const trustFactor = f32(trust * f32(-.6) + f32(1.3));
  const formFactor = f32(f32(f32(1.2) - racer.form) * 4 + f32(.4));
  let probability = f32(f32(formFactor * passFactor * (kind === 4 ? 2 : 1)) * trustFactor);
  if (kind === 0) {
    const distance = racer.distance;
    const canSleep = distance < 25 || (distance > race.finishDistance - 50 && distance < race.finishDistance - 25);
    if (racer.sleepUsed || !canSleep) return false;
    probability = f32(f32(probability * f32(fullness * f32(.3) + 1)) * f32(.005));
  } else if (kind === 1) {
    probability = f32(f32(probability * f32(fullness * f32(.3) + 1)) * f32(.002));
  } else if (kind === 2 || kind === 4) {
    probability = f32(f32(probability * f32(fullness * f32(-.3) + f32(1.3))) * f32(.001));
  } else {
    return false;
  }
  if (race.rng.unit16() >= probability) return false;
  const frames = race.timerRate * 3 + race.rng.next15() % race.timerRate;
  racer.sleepUsed ||= kind === 0;
  racer.clumsyAnimation = kind === 2 || kind === 4;
  racer.mishapTicks = frames * (racer.clumsyAnimation ? 2 : 1);
  return true;
}

function updateStaminaAndMishaps(racer, threshold, race) {
  racer.cheerMultiplier = lerp(racer.cheerMultiplier, racer.cheerActive ? racer.cheerTarget : 1, race.smoothing);
  if (racer.cheerActive) {
    const maxMishap = Math.floor(14 * race.scale) + 1;
    racer.mishapTicks = Math.min(racer.mishapTicks, maxMishap);
    drainStamina(racer, threshold * 3, 2, race);
  }
  if (racer.cheerWindow > 0) racer.cheerWindow -= 1;

  if (racer.mishapTicks > 0) {
    racer.mishapTicks -= 1;
    if (racer.mishapTicks === 0) {
      racer.condition = racer.personalityId;
      racer.clumsyAnimation = false;
    }
    // On expiration the native callback restores the personality first.
    // Unpredictable has no active-mishap interpolation branch that update.
    const target = mishapTarget[racer.condition];
    if (target !== undefined) racer.mishapMultiplier = lerp(racer.mishapMultiplier, target, race.smoothing);
  } else {
    racer.mishapMultiplier = lerp(racer.mishapMultiplier, 1, race.smoothing);
    // The FPS patch enters the same early return as an active cheer.
    if (racer.cheerActive || !race.nativeTick) return;
    if (racer.personalityId === 3) racer.condition = race.rng.next15() % 3;
    if (!rollMishap(racer, race, 1)) {
      // The fallback persists even if its second roll misses. The game
      // restores the saved personality only when the mishap timer ends.
      racer.condition = race.rng.next15() % 3;
      rollMishap(racer, race, .5);
    }
  }
  if (racer.stamina > 0) drainStamina(racer, threshold, 1, race);
}

function moveRacer(racer, race) {
  const { track, rng } = race;
  racer.sectionIndex = Math.min(Math.trunc(f32(racer.distance / sectionLength)), track.length - 1);
  const rule = terrain[track[racer.sectionIndex]];
  const skill = rule ? racer.stats[rule.stat].value : 0;
  const threshold = 9 - 3 * Math.min(2, Math.trunc(skill / 85));
  const power = f32(racer.stats.legPower.value * f32(.002) + .5);
  const fullness = f32(f32(racer.fullness / 255) * f32(rule?.fullness ?? -.025) + 1);
  const skillFactor = rule ? f32(f32(skill / 255) * .5 + .5) : 1;
  // Non-normal surfaces draw the pace variation before updating stamina.
  const paceNoise = rule ? f32(f32(rng.next16() * unit16Scale - .75) * rule.paceNoise + 1) : 1;
  updateStaminaAndMishaps(racer, threshold, race);

  // +0xF40 / +0x1080 / +0x12BC / +0x14F8, keeping the single-precision
  // arithmetic and updating the cumulative forward distance in slot order.
  let pace = f32(fullness * power);
  pace = f32(pace * skillFactor);
  pace = f32(pace * paceNoise);
  pace = f32(pace * racer.cheerMultiplier);
  pace = f32(pace * racer.mishapMultiplier);
  pace = f32(pace * racer.form);
  const stamina = f32(f32(racer.stamina / 255) * .25 + .75);
  const previous = racer.distance;
  racer.distance = f32(f32(pace / race.scale) * stamina + previous);

  // +0x8F3C / +0x9198 consume the shared stream when a stumble
  // reaches a lateral limit. The displacement itself is visual.
  if (racer.clumsyAnimation) {
    const flip = racer.laneFlag ? racer.drift > f32(.9) : racer.drift < f32(-.9);
    if (flip && rng.unit16() < f32(.03) && race.nativeTick) racer.laneFlag ^= 32;
    racer.drift = lerp(racer.drift, racer.laneFlag ? 1 : -1, race.driftSmoothing);
  } else {
    racer.drift = lerp(racer.drift, 0, race.driftSmoothing);
  }
  return f32(racer.distance - previous);
}

function snapshot(tick, racers, race) {
  return {
    tick,
    seconds: tick / race.fps,
    frameCounter: race.frameCounter,
    nativeTick: race.nativeTick,
    seed: race.rng.seed,
    draws: race.rng.draws,
    presentation: race.presentation,
    ...(race.modelNoise && { modelNoise: race.modelNoise }),
    racers: racers.map(({ id, slot, name, distance, velocity, sectionIndex, stamina, fullness, affinity, place, finishTick,
      condition, cheerActive, cheerDelay, cheerWindow, cheerTarget, cheerMultiplier, mishapTicks, mishapMultiplier,
      sleepUsed, clumsyAnimation, drift, laneFlag }) => ({
      id, slot, name, distance, velocity, sectionIndex, stamina, fullness, affinity, place, finishTick,
      surface: race.track[Math.min(race.track.length - 1, sectionIndex)],
      condition, cheerActive, cheerDelay, cheerWindow, cheerTarget, cheerMultiplier, mishapTicks, mishapMultiplier,
      sleepUsed, clumsyAnimation, drift, laneFlag,
    })),
  };
}

function simulateRace(options = {}) {
  const {
    eventId, player, lineup, sections, seed = 1, raceSeed, fps = 30, fpsPatch = true, staminaMode = 'saved',
    cheerTicks = [], traceEvery = 0, onFrame, maxTicks = fps * 240, titleRaceFix = false, maxRivalAttempts,
    opponentCheering = true, frameSeeds, presentationFrames, nativePresentationStart, modelNoiseGeometry,
    generateModelNoiseGeometry,
    waterRippleOrigin = 'unobserved',
    frameCounterOffset = 0, applyEntryEffects = !lineup,
  } = options;
  if (![30, 60, 120].includes(fps)) throw new RangeError('Choose 30, 60, or 120 FPS');
  if (!['saved', 'full'].includes(staminaMode)) throw new RangeError('Choose saved or full stamina');
  if (!['unobserved', 'every-update', 'native-update'].includes(waterRippleOrigin)) {
    throw new RangeError('Unknown water ripple origin cadence');
  }
  if (nativePresentationStart && (frameSeeds || presentationFrames)) {
    throw new TypeError('Autonomous presentation accepts starting state only');
  }
  if (modelNoiseGeometry !== undefined && (!nativePresentationStart || !(modelNoiseGeometry instanceof Map))) {
    throw new TypeError('Model timer geometry replay needs the starting presentation state and a frame map');
  }
  if (generateModelNoiseGeometry !== undefined &&
      (!nativePresentationStart || modelNoiseGeometry || typeof generateModelNoiseGeometry !== 'function')) {
    throw new TypeError('Generated geometry needs the starting presentation state and its own scene generator');
  }
  integer(traceEvery, 0, 'traceEvery');
  integer(maxTicks, 1, 'maxTicks');
  integer(frameCounterOffset, 0, 'frameCounterOffset');
  const event = eventId === undefined ? null : getEvent(eventId);
  const setupRng = createRaceRng(seed);
  if (!sections && !event) throw new TypeError('Supply track sections or an event ID');
  if (!lineup && (!player || !event)) throw new TypeError('Supply a fixed lineup or a player and event ID');
  const layout = sections ? [...sections] : rollRaceBoard(setupRng).layouts[event.id];
  if (!layout.length || layout.length > 5 || layout.some(section => !surfaces.includes(section))) {
    throw new RangeError('Supply one to five resolved track sections (Normal, Water, Sand, or Mud)');
  }
  const diagnostics = {
    model: 'native-race-movement',
    frameRateMode: fps === 30 ? 'original-30' : fpsPatch ? 'compensated' : 'uncompensated',
    setup: lineup ? 'fixed lineup' : 'generated rivals',
    rngStart: raceSeed === undefined ? 'setup stream' : 'captured race seed',
    waterRippleOrigin,
    setupDraws: setupRng.draws,
    limits: [
      'Menus, countdown, betting, and unobserved presentation can advance the same RNG.',
      nativePresentationStart ? 'Generated presentation leaves unresolved native callbacks out.' :
        'Presentation replay requires inputs from the native callback checkpoint.',
    ],
  };
  const generated = lineup ? null : generateRivalLineup({ eventId, player, rng: setupRng, titleRaceFix, maxRivalAttempts });
  diagnostics.setupDraws = setupRng.draws;
  if (generated) diagnostics.rivalAttempts = generated.attempts;
  if (generated?.status === 'no-start') {
    return { status: 'no-start', reason: generated.reason, sections: layout, results: [], trace: [], seed: setupRng.seed, diagnostics };
  }
  const starters = lineup ?? generated.lineup;
  if (!Array.isArray(starters) || starters.length !== 5) throw new RangeError('A race needs exactly five turtles');
  const racers = starters.map((turtle, slot) => makeRacer(turtle, slot, { applyEntryEffects, staminaMode }));
  const autonomous = nativePresentationStart
    ? createAutonomousPresentation(nativePresentationStart, racers, modelNoiseGeometry, generateModelNoiseGeometry) : null;
  const inputByTick = new Map();
  for (const press of cheerTicks) {
    const tick = integer(typeof press === 'number' ? press : press.tick, 1, 'Cheer tick');
    const slot = typeof press === 'number' ? 0 : integer(press.slot, 0, 'Cheer slot');
    if (slot >= 5) throw new RangeError('Cheer slots range from zero to four');
    if (!inputByTick.has(tick)) inputByTick.set(tick, new Set());
    inputByTick.get(tick).add(slot);
  }

  const track = ['Start', ...layout, 'Finish'];
  const scale = fpsPatch ? fps / 30 : 1;
  const race = {
    fps, track, scale, opponentCheering,
    timerRate: fps,
    nativeTick: false,
    frameCounter: frameCounterOffset,
    finishDistance: track.length * sectionLength,
    smoothing: f32(1 - Math.pow(1 - f32(.1), 1 / scale)),
    driftSmoothing: f32(1 - Math.pow(1 - f32(.05), 1 / scale)),
    rng: raceSeed === undefined ? setupRng : createRaceRng(raceSeed),
  };
  const trace = [];
  const results = [];
  const presentation = {
    suppliedFrames: 0,
    generatedFrames: 0,
    resolvedAnimationFrames: 0,
    commentaryFrames: 0,
    crowdFrames: 0,
    sharedDraws: 0,
    ...((modelNoiseGeometry || generateModelNoiseGeometry) && { modelNoiseFrames: 0, modelNoiseDraws: 0 }),
  };
  const emit = (tick, force) => {
    if ((!traceEvery || (!force && tick % traceEvery !== 0)) && !onFrame) return;
    const frame = snapshot(tick, racers, race);
    if (traceEvery && (force || tick % traceEvery === 0)) trace.push(frame);
    onFrame?.(frame);
  };
  const resolvePlace = (racer, tick) => {
    racer.place = results.length + 1;
    racer.finishTick = tick;
    racer.staminaAtFinish = racer.stamina;
    // The crossing callback clears active cheering but preserves the boost timers.
    if (tick !== null) racer.cheerActive = false;
    results.push(racer);
  };
  emit(0, true);
  let tick = 0;
  let geometryIncomplete = false;
  while (results.length < 4 && tick < maxTicks) {
    tick += 1;
    race.frameCounter = frameCounterOffset + tick;
    race.nativeTick = race.frameCounter % scale === 0;
    const observedSeed = frameSeeds instanceof Map ? frameSeeds.get(tick) : frameSeeds?.[tick];
    if (observedSeed !== undefined) race.rng = createRaceRng(observedSeed);
    stepCheering(racers, inputByTick.get(tick), race);
    const previousDistances = autonomous && racers.map(racer => racer.distance);
    for (const racer of racers) {
      if (racer.distance > race.finishDistance + runningOutDistance) continue;
      const previous = racer.distance;
      racer.velocity = moveRacer(racer, race);
      const boundary = Math.floor(previous / sectionLength) + 1;
      if (boundary <= track.length && racer.distance >= boundary * sectionLength) {
        racer.splits.push({ section: boundary, tick, seconds: tick / fps, stamina: racer.stamina });
      }
      if (racer.place === null && racer.distance >= race.finishDistance) resolvePlace(racer, tick);
    }
    // Once four have crossed, the game assigns the remaining slot fifth.
    if (results.length === 4) resolvePlace(racers.find(racer => racer.place === null), null);
    const animation = presentationFrames instanceof Map ? presentationFrames.get(tick) : presentationFrames?.[tick];
    race.presentation = undefined;
    if (autonomous) {
      const drawsBefore = race.rng.draws;
      race.presentation = autonomous.step(race, racers, previousDistances, results.length, tick);
      presentation.generatedFrames += 1;
      if (race.presentation.complete) presentation.resolvedAnimationFrames += 1;
      if (race.presentation.commentary?.complete) presentation.commentaryFrames += 1;
      if (race.presentation.crowd?.complete) presentation.crowdFrames += 1;
      presentation.sharedDraws += race.rng.draws - drawsBefore;
    } else if (animation !== undefined) {
      const drawsBefore = race.rng.draws;
      // State 16 runs commentary, racer presentation, then crowd animation.
      const commentary = animation?.commentary === undefined ? undefined :
        applyAmbience(race.rng, 'commentary', animation.commentary);
      const update = stepRacePresentation(race, racers, animation);
      const crowd = animation?.crowd === undefined ? undefined : applyAmbience(race.rng, 'crowd', animation.crowd);
      race.presentation = { ...update, commentary, crowd };
      presentation.suppliedFrames += 1;
      if (update.complete) presentation.resolvedAnimationFrames += 1;
      if (commentary) presentation.commentaryFrames += 1;
      if (crowd) presentation.crowdFrames += 1;
      presentation.sharedDraws += race.rng.draws - drawsBefore;
    }
    // The arena stage task scatters the water ripple grid's X/Z origin.
    // On the measured profile the pair runs after the race module every update.
    if (waterRippleOrigin === 'every-update' || (waterRippleOrigin === 'native-update' && race.nativeTick)) {
      race.rng.next16();
      race.rng.next16();
    }
    const modelNoise = autonomous?.afterRipple(race, tick);
    if (generateModelNoiseGeometry) {
      race.modelNoise = modelNoise;
      geometryIncomplete = modelNoise?.complete !== true;
    }
    if (modelNoise?.complete) {
      presentation.modelNoiseFrames += 1;
      presentation.modelNoiseDraws += modelNoise.draws;
    }
    if (geometryIncomplete) {
      emit(tick, true);
      break;
    }
    emit(tick, results.length >= 4 || tick === maxTicks);
  }
  diagnostics.presentation = {
    ...presentation,
    unobservedFrames: tick - presentation.suppliedFrames - presentation.generatedFrames,
    ...(autonomous && { unmodeled: [...autonomous.missing], firstUnsupported: autonomous.firstUnsupported }),
  };
  return {
    status: geometryIncomplete ? 'incomplete' : results.length === 5 ? 'finished' : 'timeout',
    sections: layout,
    finishDistance: race.finishDistance,
    tick,
    seed: race.rng.seed,
    results: results.map(racer => ({
      id: racer.id,
      slot: racer.slot,
      name: racer.name,
      place: racer.place,
      finishTick: racer.finishTick,
      finishSeconds: racer.finishTick === null ? null : racer.finishTick / fps,
      stamina: racer.staminaAtFinish,
      splits: racer.splits,
    })),
    trace,
    diagnostics,
  };
}

module.exports = { createRaceRng, generateRivalLineup, rollRaceBoard, simulateRace };
