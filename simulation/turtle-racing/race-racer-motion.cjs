'use strict';

const f32 = Math.fround;

// CAPR clip IDs and frame lengths from the turtle GMT animations in
// bin/motion/m09kamerace.par. The clips all run at 30 source frames per second.
const clips = new Map([
  [0x31, { frames: 80, loop: false }],  // Eat end
  [0x32, { frames: 100, loop: true }],
  [0x33, { frames: 100, loop: false }],
  [0x34, { frames: 90, loop: true }],   // Idle
  [0x35, { frames: 50, loop: false }],
  [0x36, { frames: 80, loop: true }],
  [0x37, { frames: 50, loop: false }],
  [0x38, { frames: 50, loop: false }],
  [0x39, { frames: 80, loop: true }],
  [0x3a, { frames: 50, loop: false }],
  [0x3b, { frames: 70, loop: false }],  // Sleep end
  [0x3c, { frames: 10, loop: true }],
  [0x3d, { frames: 80, loop: false }],
  [0x3e, { frames: 20, loop: true }],   // Run
  [0x3f, { frames: 40, loop: true }],   // Walk
]);

// EBOOT 0x2AA9C4 uses the entry stats. PRX +0xA74C retains this scale
// for playback and presentation independently of subsequent stamina loss.
function racerScale(initialStamina, legPower) {
  return f32(.75 + .25 * Math.min(1, f32((initialStamina + legPower) / 500)));
}

// PRX +0x90BC uses 0.25 smoothing. The frame-rate patch adjusts the fraction
// over each update. +0x8ED4 also slows the visual model beyond the finish.
function projectStep(oldSmoothed, rawPosition, hasFinished, finishDistance, fps) {
  const correction = f32(rawPosition - oldSmoothed);
  const slowdown = hasFinished ? Math.max(0, f32(1 + f32(f32(rawPosition - finishDistance) / -35))) : 1;
  const base = f32(slowdown * .25);
  const alpha = f32(1 - Math.pow(1 - base, 30 / fps));
  const smoothedDistance = f32(correction * alpha + oldSmoothed);
  return { smoothedDistance, forwardDelta: f32(smoothedDistance - oldSmoothed) };
}

function projectLateralOffset(previous, clumsyAnimation, laneFlag, scale, fps) {
  // Kamerace +8F14/+9298 updates the rendered X offset independently of the yaw.
  const direction = laneFlag & 0x20 ? -1 : 1;
  const target = clumsyAnimation ? f32(f32(1 - scale) * 10 + 1) * direction : 0;
  const base = f32(clumsyAnimation ? .005 : .01);
  const gain = f32(1 - Math.pow(1 - base, 30 / fps));
  return f32(f32(target - previous) * gain + previous);
}

function playbackSpeed(delta, scale, reference) {
  const nativeReference = f32(reference);
  const adjustment = f32(f32(1 - scale) + 1);
  return f32(adjustment + f32(f32(delta - nativeReference) / nativeReference));
}

function initializeRacerMotion({ clip, phase, pendingClip = clip, queuedClip = 0, ended, dwell = 0,
  speed = 1, footfallLatch, scale }) {
  if (!clips.has(clip) || !clips.has(pendingClip) || (queuedClip !== 0 && !clips.has(queuedClip)) ||
      !Number.isFinite(phase) || !Number.isFinite(scale) || !Number.isFinite(speed) ||
      !Number.isInteger(dwell) || dwell < 0 || typeof ended !== 'boolean' ||
      ![-1, 0, 1, 0xffffffff].includes(footfallLatch)) {
    throw new RangeError('Initial racer motion state is incomplete');
  }
  return { clip, phase: f32(phase), pendingClip, queuedClip, ended, dwell, speed, footfallLatch, scale };
}

function presentationInput(state, { smoothedDistance, forwardDelta }, sleepActive) {
  return {
    smoothedDistance, forwardDelta, sleepActive,
    animationFrame: state.phase, animationLength: clips.get(state.clip).frames,
    footfallLatch: state.footfallLatch, animationId: state.clip,
    queuedAnimationId: state.queuedClip, idleClipEnding: state.ended,
  };
}

function advanceRacerMotion(state, forwardDelta, sleepActive, event, fps) {
  if (event?.type === 'footfall') state.footfallLatch = event.footfallLatch;
  if (sleepActive && ![0x3b, 0x3c, 0x3d].includes(state.clip)) {
    state.pendingClip = 0x3d;
    state.queuedClip = 0x3c;
  } else if (!sleepActive && forwardDelta > f32(.6)) {
    state.pendingClip = 0x3e;
    state.queuedClip = 0;
    state.dwell = 0;
    state.speed = playbackSpeed(forwardDelta, state.scale, .6);
  } else if (!sleepActive && ((state.clip === 0x3e && forwardDelta < f32(.4)) ||
    (state.clip !== 0x3e && forwardDelta > f32(.1)))) {
    state.pendingClip = 0x3f;
    state.queuedClip = 0;
    state.dwell = 0;
    state.speed = playbackSpeed(forwardDelta, state.scale, .2);
  }
  if (event?.type === 'idle') {
    state.pendingClip = event.clip;
    state.queuedClip = event.queuedClip;
    state.speed = 1;
    state.dwell = event.dwell;
  }

  // CKame +0x1734 services transitions before advancing the model clip.
  if (state.dwell > 0) state.dwell--;
  if (state.pendingClip !== state.clip) {
    state.clip = state.pendingClip;
    state.phase = 0;
  } else if (state.queuedClip && state.ended) {
    const next = state.queuedClip;
    state.clip = next;
    state.pendingClip = next;
    state.phase = 0;
    switch (next) {
      case 0x36: state.queuedClip = state.dwell ? 0x36 : 0x35; break;
      case 0x39: state.queuedClip = state.dwell ? 0x39 : 0x38; break;
      case 0x35: case 0x38: state.queuedClip = 0x34; break;
      default: state.queuedClip = 0;
    }
  }
  const clip = clips.get(state.clip);
  // The model clock rounds elapsed seconds before converting to asset frames.
  const step = f32(f32(state.speed * f32(1 / fps)) * 30);
  const rawPhase = f32(state.phase + step);
  state.ended = rawPhase >= clip.frames;
  if (clip.loop) {
    state.ended ||= rawPhase < 0;
    state.phase = state.ended ? f32(rawPhase + (rawPhase < 0 ? clip.frames : -clip.frames)) : rawPhase;
  } else {
    state.phase = Math.max(0, Math.min(rawPhase, clip.frames));
  }
  return state;
}

module.exports = { racerScale, projectStep, projectLateralOffset, initializeRacerMotion, presentationInput, advanceRacerMotion };
