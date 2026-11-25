'use strict';

const f32 = Math.fround;

function loopCorrection(frame, length) {
  if (frame < 0) return length;
  if (f32(frame - length) >= 0) return -length;
  return 0;
}

// EBOOT +0x5923F0 advances a GMT clip controller, and +0x4955D4 copies
// its flags to the model. Queued motions and blend channels use separate
// controller records and need their own state before predicting model flags.
function advanceAnimationClock(state, clip, timing) {
  const { frame, flags, speed, multiplier, queuedMotions, blendActive, secondaryActive } = state ?? {};
  const { frames, fps, loop } = clip ?? {};
  const { taskSpeed, stepSeconds } = timing ?? {};
  const missing = [];
  if (queuedMotions !== 0) missing.push('queuedMotions');
  if (blendActive !== false) missing.push('blendActive');
  if (secondaryActive !== false) missing.push('secondaryActive');
  if (![frame, speed, multiplier].every(Number.isFinite) || !Number.isInteger(flags) || flags < 0 || flags > 0xffff) {
    missing.push('controller');
  }
  if (!Number.isInteger(frames) || frames <= 0 || !Number.isFinite(fps) || fps <= 0 || typeof loop !== 'boolean') {
    missing.push('clip');
  }
  if (!Number.isFinite(taskSpeed) || !Number.isFinite(stepSeconds) || stepSeconds < 0) missing.push('timing');
  if (missing.length) return { complete: false, missing };

  const length = f32(frames);
  const seconds = f32(f32(f32(speed) * f32(taskSpeed)) * f32(stepSeconds));
  const step = f32(f32(f32(fps) * seconds) * f32(multiplier));
  const candidate = f32(f32(frame) + step);
  let nextFlags = flags & 0x0fff;
  let nextFrame;
  if (loop) {
    const correction = loopCorrection(candidate, length);
    nextFrame = f32(candidate + correction);
    if (correction) nextFlags |= 0x4000;
    else if (loopCorrection(f32(nextFrame + step), length)) nextFlags |= 0x1000;
  } else {
    nextFrame = candidate < 0 ? 0 : Math.min(length, candidate);
    if (nextFrame === length) nextFlags |= 0x8000;
    if (f32(nextFrame + step) >= length) nextFlags |= 0x2000;
  }
  return { complete: true, frame: nextFrame, flags: nextFlags };
}

module.exports = { advanceAnimationClock };
