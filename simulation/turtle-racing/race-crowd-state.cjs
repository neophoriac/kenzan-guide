'use strict';

const { isCrowdClip, selectCrowdClip, startCrowdAnimation } = require('./race-ambience.cjs');
const { advanceAnimationClock } = require('./race-motion-clock.cjs');

const crowdSlots = 20;
const finishClip = 0x12f7;
const f32 = Math.fround;

// CAPR IDs and GMT frame counts from bin/motion/m09kamerace.par. The
// selectable clip records in bin/motion/property.bin use default type 1
// with no queued animation properties. F_stand_kamae01 has an explicit
// transition property and is only supported as an existing clock.
const loopingClips = [
  [868, 205], [870, 188], [893, 145], [894, 160], [895, 145],
  [981, 60], [982, 35], [983, 50], [989, 270], [1015, 120], [1016, 125], [1017, 140],
  [1228, 57], [1229, 57], [1230, 43], [1231, 43], [1232, 166], [1233, 45],
  [2343, 83], [2344, 124], [2351, 50], [2353, 68], [2354, 60], [2355, 60],
  [4855, 120], [4867, 120],
];
const oneShotClips = [
  [1103, 110], [1104, 140], [2069, 70], [2070, 115], [2082, 100], [2083, 105],
  [2090, 95], [2129, 90], [2130, 114], [2135, 120], [2136, 96], [2144, 96],
];
const nativeClips = [
  ...loopingClips.map(([nativeId, frames]) => ({ nativeId, frames, fps: 30, loop: true })),
  ...oneShotClips.map(([nativeId, frames]) => ({ nativeId, frames, fps: 30, loop: false })),
];
const nativeClipsById = new Map(nativeClips.map(clip => [clip.nativeId, clip]));

function supportsClipTransition(clip) {
  const native = nativeClipsById.get(clip?.nativeId);
  return native && native.nativeId !== 0x37d &&
    clip.frames === native.frames && clip.fps === native.fps && clip.loop === native.loop;
}

function createCrowdState(samples) {
  const actors = Array(crowdSlots).fill(null);
  for (const sample of samples) {
    const { slot, currentClip, nextClip, pending, animationStartWord, selector, speed } = sample;
    if (!Number.isInteger(slot) || slot < 0 || slot >= crowdSlots || actors[slot]) {
      throw new RangeError('Each crowd actor must occupy a unique slot from 0 to 19');
    }
    if (![currentClip, nextClip, pending, animationStartWord, selector].every(Number.isInteger) ||
        pending < 0 || !Number.isFinite(speed)) {
      throw new TypeError('Crowd actor needs its native clip, update and speed state');
    }
    const { override, featured, favoursLeader, pastHalf } = sample;
    if (![override, featured, favoursLeader, pastHalf].every(value => typeof value === 'boolean' || Number.isInteger(value))) {
      throw new TypeError('Crowd actor needs its native flags');
    }
    actors[slot] = {
      ...sample,
      override: Boolean(override),
      featured: Boolean(featured),
      favoursLeader: Boolean(favoursLeader),
      pastHalf: Boolean(pastHalf),
      selector: Boolean(selector),
    };
  }
  return actors;
}

// +0x5394 and +0x5524 respond to commentary by choosing a new clip for
// every participating actor. The next crowd update applies the queued clip.
function queueCrowdReaction(actors, rng, stage, raceState) {
  if (stage !== 'race' && stage !== 'finish') throw new RangeError('Unknown crowd reaction');
  const events = [];
  let previousClip = 0;
  for (const actor of actors) {
    if (!actor || actor.override) continue;
    if (actor.featured && raceState === 18) {
      actor.nextClip = finishClip;
    } else {
      const select = () => selectCrowdClip(rng, { ...actor, stage, refresh: false }).clip;
      actor.nextClip = select();
      actor.selector = true;
      if (actor.nextClip === previousClip) actor.nextClip = select();
    }
    actor.animationStartWord = 1;
    previousClip = actor.nextClip;
    events.push({ slot: actor.slot, clip: previousClip });
  }
  return events;
}

function updateCrowdFlags(actors, { state, leaderSlot, leaderDistance, trackLength }) {
  const crossedHalf = f32(leaderDistance) > f32(trackLength * .5);
  for (const actor of actors) {
    if (!actor || actor.override) continue;
    actor.pastHalf ||= crossedHalf;
    if (actor.featured) actor.favoursLeader = state !== 18 && leaderSlot !== 0;
  }
}

// +0x02D90 samples animation flags before +0x2C290 advances the model.
// The animation provider supplies that native model state, applies a requested
// clip and advances it. This loop owns the crowd task's decisions and RNG.
function stepCrowdState(actors, rng, race, animation) {
  const { state, leaderSlot, leaderDistance, trackLength } = race;
  if (![animation?.ending, animation?.start, animation?.advance].every(callback => typeof callback === 'function')) {
    throw new TypeError('Crowd scheduling requires the native animation state provider');
  }
  if (!Number.isInteger(state) || !Number.isInteger(leaderSlot) || leaderSlot < 0 || leaderSlot > 4 ||
      !Number.isFinite(leaderDistance) || !Number.isFinite(trackLength) || trackLength <= 0) {
    throw new TypeError('Crowd scheduling requires the state and leader of a player race');
  }
  const distance = f32(leaderDistance);
  const stage = distance > f32(trackLength - 75) ? 'finish' : distance <= 0 ? 'start' : 'race';
  updateCrowdFlags(actors, race);
  const events = [];
  const before = rng.draws;
  for (const actor of actors) {
    if (!actor) continue;
    if (!actor.override) {
      const ending = actor.featured && state === 18;
      if (animation.ending(actor) && actor.pending === 0) {
        let clip = actor.currentClip;
        if (ending) {
          clip = finishClip;
        } else if (isCrowdClip(clip)) {
          clip = selectCrowdClip(rng, { ...actor, stage, refresh: true }).clip;
          events.push({ type: 'select', slot: actor.slot, clip });
        }
        if (clip !== 0) {
          actor.nextClip = clip;
          actor.pending = 1;
          actor.animationStartWord = 0;
        }
      }
    }

    if (actor.pending > 0) actor.pending -= 1;
    if (actor.animationStartWord !== 0 || actor.currentClip !== actor.nextClip) {
      actor.currentClip = actor.nextClip;
      const startup = startCrowdAnimation(rng, { pending: actor.animationStartWord !== 0, featured: actor.featured });
      if (startup.started) {
        actor.animationStartWord = 0;
        actor.speed = f32(f32(startup.speedRoll * f32(1 / 65535) - .5) * .5 + 1);
      }
      const applyModelClip = !isCrowdClip(actor.currentClip) || actor.selector;
      if (applyModelClip) actor.selector = false;
      const model = animation.start(actor, { clip: actor.currentClip, applyModelClip, ...startup });
      events.push({ type: 'start', slot: actor.slot, clip: actor.currentClip, ...startup });
      if (model?.complete === false) {
        return { complete: false, missing: model.missing, events, draws: rng.draws - before, seed: rng.seed };
      }
    }
    animation.advance(actor);
  }
  return { complete: true, events, draws: rng.draws - before, seed: rng.seed };
}

function createCrowdAnimation(samples, timing, clips = nativeClips) {
  const byId = clips === nativeClips ? nativeClipsById : new Map(clips.map(clip => [clip.nativeId, clip]));
  const clocks = new Map();
  const missing = [];
  for (const sample of samples) {
    if (sample.override) continue;
    const animation = sample.animationSample;
    const controller = animation?.controller;
    const clip = byId.get(animation?.modelClip);
    const prefix = 'crowd[' + sample.slot + '].';
    if (!controller || animation.phaseGetter !== 0xa89b0c || controller.clipIndex < 0 ||
        animation.animationLength !== clip?.frames || animation.animationFrame !== controller.frame ||
        sample.modelFlags !== controller.flags) {
      missing.push(prefix + 'model');
      continue;
    }
    if (controller.requestedClip !== 0) missing.push(prefix + 'requestedClip');
    const current = {
      frame: controller.frame,
      flags: controller.flags,
      multiplier: controller.multiplier,
      queuedMotions: controller.queuedMotions,
      blendActive: controller.blendFallback !== 0,
      secondaryActive: controller.secondaryClip >= 0 || controller.secondaryStart !== 0 || controller.secondaryEnd !== 0,
    };
    const check = advanceAnimationClock({ ...current, speed: sample.speed }, clip, timing);
    if (!check.complete) missing.push(...check.missing.map(field => prefix + field));
    clocks.set(sample.slot, { clip, current });
  }
  if (missing.length) return { complete: false, missing };

  return {
    complete: true,
    animation: {
      ending(actor) {
        return Boolean(clocks.get(actor.slot).current.flags & 0xc000);
      },
      start(actor, { clip: clipId, started, phaseRoll }) {
        const clock = clocks.get(actor.slot);
        const clip = byId.get(clipId);
        if (!supportsClipTransition(clip) || !supportsClipTransition(clock?.clip)) {
          return { complete: false, missing: ['crowd[' + actor.slot + '].clipTransition'] };
        }
        // +0x2C0DC uses the length of the still-playing model clip. The
        // type-1 application in +0x4947B0 resets the primary controller
        // flags and sets that offset before the new clip advances.
        clock.current.frame = started ? phaseRoll % (3 * Math.trunc(clock.clip.frames / 4)) : 0;
        clock.current.flags = 0;
        clock.clip = clip;
      },
      advance(actor) {
        const clock = clocks.get(actor.slot);
        if (!clock) return;
        const next = advanceAnimationClock({ ...clock.current, speed: actor.speed }, clock.clip, timing);
        clock.current.frame = next.frame;
        clock.current.flags = next.flags;
      },
    },
  };
}

module.exports = { createCrowdState, queueCrowdReaction, updateCrowdFlags, stepCrowdState, createCrowdAnimation };
