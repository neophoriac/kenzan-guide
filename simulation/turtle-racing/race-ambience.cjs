'use strict';

const f32 = Math.fround;
const placeCues = [8, 5, 6];
const pleasedClips = [0x857, 0x851, 0x852, 0x860];
const crowdClips = {
  start: [0x852, 0x3f8, 0x858, 0x3f9, 0x860, 0x3dd],
  race: [0x858, 0x3d6, 0x3d7, 0x3dd, 0x3d5, 0x857, 0x932, 0x933, 0x851, 0x4cc, 0x4cd, 0x4ce, 0x4cf],
  finish: [0x3d6, 0x3d7, 0x932, 0x933, 0x4d1],
  pleasedFinish: [...pleasedClips, 0x4d0],
  pleasedFeatured: [0x852, 0x860],
};

function integer(value, name) {
  if (!Number.isInteger(value)) throw new TypeError(`${name} must be an integer`);
  return value;
}

function boolean(value, name) {
  if (typeof value !== 'boolean') throw new TypeError(`${name} must be a boolean`);
  return value;
}

function scheduleCue(rng, cueId, callback) {
  const {
    previousCueId, previousVariant, elapsedTicks, raceState, durationUnits, fps, minimumTicks = 30,
  } = callback;
  integer(cueId, 'cueId');
  integer(previousCueId, 'previousCueId');
  integer(elapsedTicks, 'elapsedTicks');
  integer(raceState, 'raceState');
  if (!Number.isInteger(minimumTicks) || minimumTicks < 1) {
    throw new RangeError('Commentary needs a positive acceptance threshold');
  }
  // +0x18E24 can reject a cue before consuming RNG. Same-cue speech
  // alternates variants at +0x190DC without the draw at +0x18FE8.
  if (elapsedTicks < minimumTicks && cueId !== 17 && raceState !== 8) {
    return { cueId, accepted: false };
  }
  if (!Number.isInteger(durationUnits) || durationUnits < 0 || !Number.isInteger(fps) || fps < 1) {
    throw new RangeError('An accepted commentary cue needs nonnegative duration units and a positive FPS');
  }
  if (cueId === previousCueId && ![0, 1].includes(previousVariant)) {
    throw new RangeError('A repeated commentary cue needs its previous variant (0 or 1)');
  }
  const duration = f32(durationUnits * .5);
  const randomDuration = f32(f32(duration * rng.unit16()) * fps);
  const timer = Math.max(minimumTicks, Math.trunc(duration) * fps + Math.trunc(randomDuration));
  const variant = cueId === previousCueId ? previousVariant ^ 1 : rng.next15() & 1;
  return { cueId, accepted: true, variant, timer };
}

function selectPlaceCue(rng, callback) {
  const slot = integer(callback.slot, 'slot');
  if (slot < -1 || slot > 4) throw new RangeError('Place commentary slot must be -1 through 4');
  // +0x192FC selects code 7 without a draw for slot -1. For other slots
  // the selected cue rotates once if it would repeat the current cue ID.
  let cueId = 7;
  if (slot >= 0) {
    const index = rng.next15() % placeCues.length;
    cueId = placeCues[index] === callback.previousCueId
      ? placeCues[(index + 1) % placeCues.length] : placeCues[index];
  }
  return scheduleCue(rng, cueId, { ...callback, durationUnits: 3 });
}

function commentaryRoll(rng, site) {
  switch (site) {
    case '294b8':
      return { passed: rng.unit16() > .5 };
    case '29578':
      // This branch can then call +0x18E24. Record the separate cue
      // callback to account for its gate and individual draws.
      return { passed: rng.unit16() > f32(.9) };
    case '2a70c': {
      const passed = rng.unit16() < f32(.1);
      return { passed, cameraAction: passed ? (rng.next15() & 1) + 1 : null };
    }
    default:
      throw new RangeError(`Unknown native commentary roll "${site}"`);
  }
}

function isCrowdClip(clip) {
  // +0x2B570 filters clip IDs using the five set bits in the native mask.
  return clip >= 0x851 && clip <= 0x860 && Boolean(0x80c3 & (1 << (clip - 0x851)));
}

function selectCrowdClip(rng, callback) {
  const { stage, featured, favoursLeader, pastHalf, refresh } = callback;
  if (!['start', 'race', 'finish'].includes(stage)) throw new RangeError('Unknown crowd selector stage');
  boolean(featured, 'featured');
  boolean(refresh, 'refresh');
  const pleased = stage !== 'start' && boolean(favoursLeader, 'favoursLeader') && boolean(pastHalf, 'pastHalf');
  // +0x2BADC / +0x2B848 / +0x2B5A8 always consume one draw. The
  // refresh retry walks the chosen clip table cyclically without drawing.
  const roll = rng.next15();
  if (featured) {
    return { clip: pleased ? crowdClips.pleasedFeatured[roll & 1] : 0x3f8 };
  }
  const clips = pleased
    ? stage === 'finish' ? crowdClips.pleasedFinish : pleasedClips
    : crowdClips[stage];
  let index = roll % clips.length;
  if (refresh && (stage !== 'finish' || pleased)) {
    while (!isCrowdClip(clips[index])) index = (index + 1) % clips.length;
  }
  return { clip: clips[index] };
}

function startCrowdAnimation(rng, callback) {
  if (!boolean(callback.pending, 'pending')) return { started: false };
  boolean(callback.featured, 'featured');
  // +0x2BFD0 consumes +0x2C0CC then +0x2C138 when the actor's animation
  // start word (+0x4D0) is set.
  // Only ordinary actors take the angle jitter draw at +0x2C20C.
  const phaseRoll = rng.next15();
  const speedRoll = rng.next16();
  const angleJitter = callback.featured ? null : ((rng.next15() >>> 2) - 0x1000);
  return { started: true, phaseRoll, speedRoll, angleJitter };
}

function applyAmbience(rng, phase, callbacks = []) {
  if (phase !== 'commentary' && phase !== 'crowd') throw new RangeError('Unknown native ambience phase');
  if (!Array.isArray(callbacks)) throw new TypeError('Ambience callbacks must be an ordered array');
  const startDraws = rng.draws;
  // Commentary occurs after +0x8C6C and before +0x07468. Crowd comes
  // after +0x07468. A commentary cue can itself select crowd clips via
  // +0x05394. Inside +0x02D90, each actor's selector precedes its update.
  const outputs = callbacks.map(callback => {
    const { kind } = callback;
    if (kind === 'crowd-selector') return selectCrowdClip(rng, callback);
    if (kind === 'crowd-animation' && phase === 'crowd') return startCrowdAnimation(rng, callback);
    if (phase === 'commentary') {
      if (kind === 'cue') return scheduleCue(rng, callback.cueId, callback);
      if (kind === 'place-cue') return selectPlaceCue(rng, callback);
      if (kind === 'commentary-roll') return commentaryRoll(rng, callback.site);
    }
    throw new RangeError(`Native callback "${kind}" does not run in ${phase}`);
  });
  return { outputs, draws: rng.draws - startDraws, seed: rng.seed };
}

module.exports = { applyAmbience, scheduleCue, selectPlaceCue, isCrowdClip, selectCrowdClip, startCrowdAnimation };
