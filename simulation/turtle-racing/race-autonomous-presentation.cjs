'use strict';

const { createCommentaryState, stepCommentaryState } = require('./race-commentary-state.cjs');
const { createCrowdAnimation, createCrowdState, queueCrowdReaction, stepCrowdState, updateCrowdFlags } = require('./race-crowd-state.cjs');
const { applyModelNoise, createModelNoise } = require('./race-model-noise.cjs');
const { planModelNoiseFrame } = require('./race-model-scheduler.cjs');
const { advanceRacerMotion, initializeRacerMotion, presentationInput, projectLateralOffset, projectStep, racerScale } = require('./race-racer-motion.cjs');
const { stepRacePresentation } = require('./race-presentation.cjs');

function createAutonomousPresentation(start, racers, modelNoiseGeometry, generateModelNoiseGeometry) {
  if (start.racers?.length !== racers.length || typeof start.effectManagerActive !== 'boolean') {
    throw new TypeError('Autonomous presentation needs the initial racer animation and effect state');
  }
  const motion = start.racers.map((sample, slot) => {
    if (![sample.smoothedDistance, sample.forwardDelta].every(Number.isFinite)) {
      throw new RangeError('Initial racer projection state is incomplete');
    }
    const racer = racers[slot];
    return {
      smoothedDistance: sample.smoothedDistance,
      forwardDelta: sample.forwardDelta,
      lateralOffset: sample.lateralOffset ?? 0,
      animation: initializeRacerMotion({
        ...sample,
        scale: sample.scale ?? racerScale(racer.stamina, racer.stats.legPower.value),
      }),
    };
  });
  const commentary = start.commentary ? createCommentaryState(start.commentary) : null;
  const crowd = start.crowd ? createCrowdState(start.crowd) : null;
  const crowdClock = crowd && start.animationTiming ? createCrowdAnimation(start.crowd, start.animationTiming) : null;
  const missing = new Set();
  const firstUnsupported = {};
  const timerStart = start.modelNoise;
  const usesModelGeometry = modelNoiseGeometry || generateModelNoiseGeometry;
  if (usesModelGeometry && !Array.isArray(timerStart?.timers)) {
    throw new TypeError('Geometry replay needs initial model timer state');
  }
  const timers = usesModelGeometry ? createModelNoise(timerStart.timers) : null;
  if (!commentary) missing.add('Initial commentary state');
  if (!crowdClock) missing.add('Crowd animation controller');
  else if (!crowdClock.complete) crowdClock.missing.forEach(reason => missing.add(reason));
  if (!timers) missing.add('Camera-dependent model-noise callback scheduling');
  let commentaryStopped = false;
  let crowdStopped = !crowdClock?.complete;

  return {
    missing,
    firstUnsupported,
    afterRipple(race, tick) {
      if (!timers || firstUnsupported.modelNoise !== undefined) return undefined;
      const frame = generateModelNoiseGeometry
        ? generateModelNoiseGeometry({
          frame: race.frameCounter, fps: race.fps, scale: race.scale, track: race.track,
          racers, motion, presentation: race.presentation,
        })
        : modelNoiseGeometry.get(race.frameCounter);
      const plan = frame?.actors?.length ? planModelNoiseFrame(frame) : undefined;
      if (!plan?.complete) {
        firstUnsupported.modelNoise = tick;
        for (const reason of plan?.missing ?? frame?.missing ?? ['Missing camera and actor geometry']) missing.add(reason);
        return { complete: false };
      }
      if (plan.callbacks.some(callback => !timers.has(callback.timer))) {
        firstUnsupported.modelNoise = tick;
        missing.add('Missing initial state for an admitted model timer');
        return { complete: false };
      }
      const update = applyModelNoise(race.rng, timers, plan.callbacks, timerStart.arithmetic);
      return generateModelNoiseGeometry ? {
        complete: true, draws: update.draws, rerolled: update.rerolled,
        timers: plan.callbacks.map(callback => callback.timer),
      } : { complete: true, draws: update.draws };
    },
    step(race, racers, previousDistances, finishCount, tick) {
      const leader = racers.find(racer => racer.place === 1) ??
        racers.reduce((best, racer) => racer.distance > best.distance ? racer : best);
      const progress = {
        state: 16, raceState: 16, fps: race.fps, finishCount, leaderSlot: leader.slot,
        nativeTick: race.nativeTick, minimumTicks: 30 * race.scale,
        leaderDistance: leader.distance, trackLength: race.finishDistance,
      };
      let speech;
      const anchorResets = [];
      if (commentary && !commentaryStopped) {
        if (race.nativeTick) {
          progress.racers = racers.map(racer => {
            const sleepActive = racer.condition === 0 && racer.mishapTicks > 0;
            return {
              slot: racer.slot, distance: racer.distance, place: racer.place, sleepActive,
              surface: race.track[racer.sectionIndex],
              pace: racer.velocity,
              cheering: racer.cheerActive && racer.cheerWindow === 0,
              stumbling: racer.clumsyAnimation || (!sleepActive && racer.mishapTicks > 0),
            };
          });
        }
        speech = stepCommentaryState(commentary, race.rng, progress, stage => {
          if (crowd) {
            const queued = queueCrowdReaction(crowd, race.rng, stage, progress.state);
            if (generateModelNoiseGeometry) anchorResets.push(...queued.map(actor => actor.slot));
          }
        });
        if (!speech.complete) {
          commentaryStopped = true;
          firstUnsupported.commentary = tick;
          missing.add(speech.reason);
        }
      }
      const inputs = motion.map((state, slot) => {
        const racer = racers[slot];
        if (previousDistances[slot] <= race.finishDistance + 35) {
          Object.assign(state, projectStep(state.smoothedDistance, racer.distance, previousDistances[slot] >= race.finishDistance,
            race.finishDistance, race.scale * 30));
          state.lateralOffset = projectLateralOffset(state.lateralOffset, racer.clumsyAnimation, racer.laneFlag,
            state.animation.scale, race.scale * 30);
        }
        const sleepActive = racer.condition === 0 && racer.mishapTicks > 0;
        return presentationInput(state.animation, state, sleepActive);
      });
      const update = stepRacePresentation(race, racers, { racers: inputs, effectManagerActive: start.effectManagerActive });
      if (!update.complete) update.missing.forEach(reason => missing.add(reason));
      const events = new Map((update.events ?? []).map(event => [event.slot, event]));
      motion.forEach(({ animation }, slot) => {
        advanceRacerMotion(animation, inputs[slot].forwardDelta, inputs[slot].sleepActive, events.get(slot), race.fps);
      });
      const crowdUpdate = crowdStopped ? undefined : stepCrowdState(crowd, race.rng, progress, crowdClock.animation);
      if (crowdUpdate && anchorResets.length) crowdUpdate.anchorResets = anchorResets;
      if (crowdStopped && crowd) updateCrowdFlags(crowd, progress);
      if (crowdUpdate?.complete === false) {
        crowdStopped = true;
        firstUnsupported.crowd = tick;
        crowdUpdate.missing.forEach(reason => missing.add(reason));
      }
      return { ...update, commentary: speech, crowd: crowdUpdate };
    },
  };
}

module.exports = { createAutonomousPresentation };
