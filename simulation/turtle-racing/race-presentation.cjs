'use strict';

const f32 = Math.fround;
const footstepSounds = {
  Normal: [0xcb0000, 5],
  Mud: [0xcb0005, 4],
  Sand: [0xcb0009, 5],
  Water: [0xcb000e, 5],
};

// PRX +0x7468 runs in slot order after the race's movement callback. Its
// displacement and animation queries are inputs from the native model, at this checkpoint.
function stepRacePresentation(race, racers, frameInputs) {
  const missing = [];
  const plan = [];
  const { track } = race;
  if (!Array.isArray(frameInputs?.racers) || frameInputs.racers.length !== racers.length) {
    return { complete: false, draws: 0, missing: ['racers'] };
  }

  for (let slot = 0; slot < racers.length; slot += 1) {
    const input = frameInputs.racers[slot];
    if (input === null) continue; // No native racer in this slot.
    const prefix = 'racers[' + slot + '].';
    if (!input) {
      missing.push(prefix.slice(0, -1));
      continue;
    }
    const forwardDelta = f32(input.forwardDelta);
    if (!Number.isFinite(input.forwardDelta) || !Number.isFinite(forwardDelta)) {
      missing.push(prefix + 'forwardDelta');
      continue;
    }

    if (forwardDelta > f32(.1)) {
      const { smoothedDistance, footfallLatch, animationFrame, animationLength } = input;
      const latch = footfallLatch === 0xffffffff ? -1 : footfallLatch;
      const savedMissing = missing.length;
      if (latch !== -1 && latch !== 0 && latch !== 1) missing.push(prefix + 'footfallLatch');
      if (!Number.isFinite(animationFrame)) missing.push(prefix + 'animationFrame');
      if (!(Number.isFinite(animationLength) && animationLength > 0)) missing.push(prefix + 'animationLength');
      if (missing.length !== savedMissing) continue;

      // The initial -1 latch tests the half-cycle before the wrap, then a
      // successful footfall starts alternating the two triggers (+0x7D68–+0x7E14).
      const frame = f32(animationFrame);
      const length = f32(animationLength);
      const halfFrame = f32(length * .5);
      const atHalfCycle = latch !== 0 && frame > f32(halfFrame - 2) && frame < f32(halfFrame + 2);
      const atWrap = latch !== 1 && (frame < 2 || frame > f32(length - 2));
      if (!atHalfCycle && !atWrap) continue;

      if (!Number.isFinite(smoothedDistance)) {
        missing.push(prefix + 'smoothedDistance');
        continue;
      }
      const section = Math.min(track.length - 1, Math.max(0, Math.trunc(f32(f32(smoothedDistance) / 100))));
      const surface = track[section];
      // +0x8530 checks the previous section when the current terrain has no
      // effect of its own. The transition effect is keyed to Water (code 2).
      const leavingWater = ['Start', 'Normal', 'Finish'].includes(surface) && track[section - 1] === 'Water';
      if (leavingWater && typeof frameInputs.effectManagerActive !== 'boolean') {
        missing.push('effectManagerActive');
        continue;
      }
      plan.push({ slot, type: 'footfall', surface, leavingWater, footfallLatch: atHalfCycle ? 0 : 1 });
      continue;
    }

    // A stationary racer goes from the 0x3e running clip to 0x3f first.
    // It can leave 0x3f directly, or pick a new idle after an unqueued clip ends.
    if (forwardDelta > f32(.05)) continue;
    if (typeof input.sleepActive !== 'boolean') {
      missing.push(prefix + 'sleepActive');
      continue;
    }
    if (input.sleepActive) continue;
    if (!Number.isInteger(input.animationId)) {
      missing.push(prefix + 'animationId');
      continue;
    }
    if (input.animationId === 0x3e) continue;
    if (input.animationId === 0x3f) {
      plan.push({ slot, type: 'idle' });
      continue;
    }
    if (!Number.isInteger(input.queuedAnimationId)) {
      missing.push(prefix + 'queuedAnimationId');
      continue;
    }
    if (input.queuedAnimationId !== 0) continue;
    if (typeof input.idleClipEnding !== 'boolean') {
      missing.push(prefix + 'idleClipEnding');
      continue;
    }
    if (input.idleClipEnding) plan.push({ slot, type: 'idle' });
  }

  // Any unresolved earlier slot can change the RNG used for later slots.
  // Leave the stream intact when the whole frame cannot be recovered.
  if (missing.length) return { complete: false, draws: 0, missing };
  const rng = race.rng;
  const startDraws = rng.draws;
  const events = [];
  for (const event of plan) {
    if (event.type === 'idle') {
      const variant = rng.next15() % 5; // +0x8220
      const clip = variant === 0 ? 0x37 : variant === 1 ? 0x3a : 0x34;
      const queuedClip = variant === 0 ? 0x36 : variant === 1 ? 0x39 : 0;
      const rate = race.timerRate;
      const dwell = Math.trunc(f32(f32(rng.next16() * f32(1 / 65535)) * (rate * 7) + rate * 3)); // +0x86F8
      events.push({ slot: event.slot, type: event.type, clip, queuedClip, dwell });
      continue;
    }

    const effects = [];
    const orientationRolls = [];
    if (event.surface === 'Mud') {
      effects.push(0x419ce9 + rng.next15() % 2, 0x419ce6); // +0x8064
    } else if (event.surface === 'Sand') {
      effects.push(0x419ce7 + rng.next15() % 2); // +0x7E98
    } else if (event.leavingWater) {
      effects.push(0x419ce2 + rng.next15() % 4); // +0x7E98
      if (frameInputs.effectManagerActive) orientationRolls.push(rng.next15(), rng.next15()); // +0x72BC, +0x71F4
    }

    const [base, count] = footstepSounds[event.surface] ?? footstepSounds.Normal;
    const sound = base + rng.next15() % count; // +0x7F18 (Mud uses +0x87D8)
    events.push({ ...event, effects, orientationRolls, sound });
  }
  return { complete: true, draws: rng.draws - startDraws, events };
}

module.exports = { stepRacePresentation };

