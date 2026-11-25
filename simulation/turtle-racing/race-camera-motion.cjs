'use strict';

const { yawSinCos } = require('./race-actor-geometry.cjs');

const f32 = Math.fround;
const unitScale = f32(1 / 65535);
const nearZeroLengthSquared = 2 ** -32;
const worldUp = [0, 1, 0];

function add(a, b) {
  return a.map((value, axis) => f32(value + b[axis]));
}

function subtract(a, b) {
  return a.map((value, axis) => f32(value - b[axis]));
}

function dot(a, b) {
  return f32(f32(f32(a[0] * b[0]) + f32(a[1] * b[1])) + f32(a[2] * b[2]));
}

function cross(a, b) {
  return [0, 1, 2].map(axis => {
    const j = (axis + 1) % 3;
    const k = (axis + 2) % 3;
    return f32(f32(a[j] * b[k]) - a[k] * b[j]);
  });
}

function normalize(vector) {
  const squared = dot(vector, vector);
  // EBOOT +0x56010C refines the VMX estimate with one Newton step.
  // This starts from the non-accurate-estimate RPCS3 PPU mode.
  const estimate = f32(1 / f32(Math.sqrt(squared)));
  const factor = f32(estimate * f32(1.5 - f32(squared * estimate) * f32(estimate * .5)));
  return vector.map(value => f32(value * factor));
}

function isVector(value) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
}

function validateRandomWords(words, length) {
  return Array.isArray(words) && words.length === length &&
    words.every(word => Number.isInteger(word) && word >= 0 && word <= 0xffff);
}

function timingRetention(gain, scale) {
  let retention = 1 - gain;
  for (let remaining = scale; remaining > 1; remaining /= 2) {
    retention = Math.sqrt(retention);
  }
  return retention;
}

function viewFromCameraPose({ eye, target, up = worldUp }) {
  if (![eye, target, up].every(isVector)) throw new TypeError('Camera pose needs three finite vectors');
  let back = subtract(eye, target);
  const normal = cross(up, back);
  // +0x4C02BC substitutes a canonical pose for near-coincident or parallel inputs.
  if (dot(back, back) < nearZeroLengthSquared || dot(normal, normal) < nearZeroLengthSquared) {
    eye = [0, 0, 0];
    back = [0, 0, -1];
    up = worldUp;
  }
  const cameraZ = normalize(back);
  const cameraX = normalize(cross(normalize(up), cameraZ));
  const cameraY = normalize(cross(cameraZ, cameraX));
  return [
    ...[0, 1, 2].map(i => [cameraX[i], cameraY[i], cameraZ[i], 0]),
    [-dot(eye, cameraX), -dot(eye, cameraY), -dot(eye, cameraZ), 1],
  ];
}

// PRX +0x17588 initializes the lateral tracking shot. Its origin,
// side, and X increment use consecutive low-16 results already
// drawn by the native cue. This helper does not advance shared RNG.
function startCountdownCamera(variant, randomWords, focus) {
  if (![0, 1].includes(variant) || !validateRandomWords(randomWords, 3) || !isVector(focus)) {
    throw new TypeError('Countdown camera needs its variant, three random words and current focus point');
  }
  const [origin, side, speed] = randomWords;
  const initialX = f32(f32(origin * unitScale) * f32(variant ? .3 : -.3));
  const reverse = f32(side * unitScale) <= .5;
  const eyeZ = f32(reverse ? .47 : -.35);
  const targetZ = f32(reverse ? -.17 : .09);
  const increment = f32(f32(speed * unitScale) * f32(variant ? -.0005 : .0005) +
    f32(variant ? -.001 : .001));
  return advanceCountdownCamera({
    eye: [initialX, 0, 0], target: [initialX, 0, 0],
    eyeOffset: [increment, f32(.091), eyeZ],
    targetOffset: [increment, f32(.05), targetZ],
  }, focus, 1);
}

function advanceCountdownCamera(state, focus, scale) {
  if (!isVector(focus) || ![1, 2, 4].includes(scale) ||
      ![state.eye, state.target, state.eyeOffset, state.targetOffset].every(isVector)) {
    throw new TypeError('Countdown camera needs its native pose, focus point and timing scale');
  }
  // Patched +0x1790C/+0x17950 scale the X increments at 60/120 Hz.
  // The other components are reapplied to the new focus instead of accumulated.
  const [x, y, z] = state.eyeOffset;
  const [tx, ty, tz] = state.targetOffset;
  return {
    ...state, fov: 0x11c7,
    eye: add([state.eye[0], focus[1], focus[2]], [f32(x / scale), y, z]),
    target: add([state.target[0], focus[1], focus[2]], [f32(tx / scale), ty, tz]),
  };
}

// PRX +0x163D0 initializes the side-tracking shot with two world focus
// points and six low-16 RNG results already consumed by the cue.
function startSideTrackingCamera(variant, leaderSlot, randomWords, eyeFocus, targetFocus) {
  if (![0, 1].includes(variant) || ![0, 1, 2, 3, 4].includes(leaderSlot) ||
      !validateRandomWords(randomWords, 6) || ![eyeFocus, targetFocus].every(isVector)) {
    throw new TypeError('Side tracking camera needs its variant, leader, six random words and both focus points');
  }
  const onRight = variant === 0 ? leaderSlot !== 4 : leaderSlot === 0;
  const lateral = word => f32(f32(word * unitScale - .5) * f32(.0001));
  const [eyeX, eyeY, eyeZ, targetX, targetY, targetZ] = randomWords;
  return {
    fov: 0x1c71,
    eye: add(eyeFocus, [f32(onRight ? .63 : -.63), f32(.31), f32(-.35)]),
    target: targetFocus.slice(),
    eyeOffset: [lateral(eyeX), lateral(eyeY), f32(f32(eyeZ * unitScale) * f32(-.001))],
    targetOffset: [lateral(targetX), lateral(targetY), f32(f32(targetZ * unitScale) * f32(-.0025) - f32(.0025))],
  };
}

function advanceSideTrackingCamera(state, targetFocus, scale) {
  if (!isVector(targetFocus) || ![1, 2, 4].includes(scale) ||
      ![state.eye, state.target, state.eyeOffset, state.targetOffset].every(isVector)) {
    throw new TypeError('Side tracking camera needs its native pose, focus point and timing scale');
  }
  // The FPS patch scales drift at +0x164E0/+0x16504 and roots the
  // retention at +0x1651C. The target's Z drift also accounts for the
  // blend applied immediately after the offset is added.
  const eye = add(state.eye, state.eyeOffset.map(value => f32(value / scale)));
  const gain = f32(.05);
  const retention = timingRetention(gain, scale);
  const blend = scale === 1 ? gain : f32(1 - retention);
  const zFactor = scale === 1 ? 1 : (1 - gain) * (1 - retention) / (retention * gain);
  const [x, y, z] = state.targetOffset;
  const target = add(state.target, [f32(x / scale), f32(y / scale), f32(z * zFactor)]);
  target[2] = f32(f32(targetFocus[2] - target[2]) * blend + target[2]);
  return { ...state, eye, target };
}

function orbitEye(state, timingTick, scale) {
  // PRX +0x17F98 uses the timing manager's gated +0x10 counter.
  // The high-frame-rate patch divides its signed angular step by 2 or 4.
  const increment = state.variant === 0 ? 32 : -32;
  const { sin, cos } = yawSinCos(Math.imul(timingTick, increment / scale));
  return add(state.target, [
    f32(f32(sin * .75) * state.eyeOffset[0]),
    state.eyeOffset[1],
    f32(f32(cos * .75) * state.eyeOffset[2]),
  ]);
}

// PRX +0x17EF0 uses the race's most recent raw distance increment for
// the current leader to initialize the camera's target lead.
function startOrbitCamera(variant, leaderDelta, focus, timingTick, scale) {
  if (![0, 1].includes(variant) || !Number.isFinite(leaderDelta)) {
    throw new TypeError('Orbit camera needs a native cue variant and leader delta');
  }
  if (!isVector(focus) || !Number.isInteger(timingTick) || ![1, 2, 4].includes(scale)) {
    throw new TypeError('Orbit camera needs a focus, timing tick and timing scale');
  }
  const targetOffset = [0, 0, -f32(leaderDelta * f32(.15))];
  const state = {
    fov: 0x2aaa,
    variant,
    target: add(focus, targetOffset),
    eyeOffset: [f32(.6), f32(.5), f32(.6)],
    targetOffset,
  };
  // The initializer adds the target offset before falling through with
  // that already-offset focus. Initialization retains the stock blend.
  return blendOrbitTarget(state, state.target, timingTick, scale, f32(.05));
}

function blendOrbitTarget(state, focus, timingTick, scale, blend) {
  const difference = subtract(add(focus, state.targetOffset), state.target);
  const target = add(state.target, difference.map(value => f32(value * blend)));
  const next = { ...state, target };
  return { ...next, eye: orbitEye(next, timingTick, scale) };
}

function advanceOrbitCamera(state, focus, timingTick, scale) {
  if (!isVector(focus) || !Number.isInteger(timingTick) || ![1, 2, 4].includes(scale) ||
      ![state.target, state.eyeOffset, state.targetOffset].every(isVector)) {
    throw new TypeError('Orbit camera needs a native pose, focus, timing tick and timing scale');
  }
  const gain = f32(.05);
  const blend = scale === 1 ? gain : f32(1 - timingRetention(gain, scale));
  return blendOrbitTarget(state, focus, timingTick, scale, blend);
}

function lateralFocus(focus) {
  return [focus[0], focus[1], f32(focus[2] - f32(.15))];
}

// PRX +0x168F8 starts the camera beside its target, then follows the focus
// with independently smoothed eye and target positions.
function startLateralCamera(variant, leaderSlot, focus) {
  if (![0, 1].includes(variant) || ![0, 1, 2, 3, 4].includes(leaderSlot) || !isVector(focus)) {
    throw new TypeError('Lateral camera needs a native cue variant, leader and focus');
  }
  const onRight = variant === 0 ? leaderSlot !== 4 : leaderSlot === 0;
  const origin = lateralFocus(focus);
  const eyeOffset = [onRight ? .75 : -.75, f32(.42), 0];
  const targetOffset = [0, f32(-.02), 0];
  return { fov: 0x1c71, eyeOffset, targetOffset, eye: add(origin, eyeOffset), target: add(origin, targetOffset) };
}

function advanceLateralCamera(state, focus, scale) {
  if (!isVector(focus) || ![1, 2, 4].includes(scale) ||
      ![state.eye, state.target, state.eyeOffset, state.targetOffset].every(isVector)) {
    throw new TypeError('Lateral camera needs its native pose, focus point and timing scale');
  }
  const origin = lateralFocus(focus);
  const gain = f32(.05);
  const blend = scale === 1 ? gain : f32(1 - timingRetention(gain, scale));
  const follow = (point, offset) => add(point, subtract(add(origin, offset), point).map(value => f32(value * blend)));
  return { ...state, eye: follow(state.eye, state.eyeOffset), target: follow(state.target, state.targetOffset) };
}

// PRX +0x16D64 initializes a rear pan. A focus of -1 is resolved by
// the scene selector to the last-ranked turtle before this call.
function startRearPanCamera(randomWords, focus) {
  if (!validateRandomWords(randomWords, 3) || !isVector(focus)) {
    throw new TypeError('Rear pan needs three native random words and a focus point');
  }
  const [vertical, eyeZ, targetZ] = randomWords;
  const unit = word => f32(word * unitScale);
  return {
    fov: 0x1c71,
    eye: add(focus, [0, f32(.65), f32(.85)]),
    target: focus.slice(),
    eyeOffset: [0, f32(unit(vertical) * f32(-.00125) - f32(.00125)), f32(unit(eyeZ) * f32(-.001))],
    targetOffset: [0, 0, f32(unit(targetZ) * f32(-.0025) - f32(.0025))],
    thresholdRemaining: 0,
  };
}

function advanceRearPanCamera(state, scale) {
  if (![1, 2, 4].includes(scale) ||
      ![state.eye, state.target, state.eyeOffset, state.targetOffset].every(isVector)) {
    throw new TypeError('Rear pan needs its native pose and timing scale');
  }
  // The patch holds the vertical threshold decision across a native tick.
  const thresholdRemaining = state.thresholdRemaining ?? 0;
  const belowThreshold = thresholdRemaining > 0 ? state.belowThreshold : state.eye[1] < f32(.4);
  const gain = f32(.05);
  const retention = timingRetention(gain, scale);
  const blend = scale === 1 ? gain : f32(1 - retention);
  const eyeOffset = state.eyeOffset.slice();
  if (belowThreshold) eyeOffset[1] = f32(f32(-eyeOffset[1]) * blend + eyeOffset[1]);
  const verticalFactor = scale === 1 ? 1 : belowThreshold
    ? (1 - gain) * (1 - retention) / (retention * gain) : 1 / scale;
  return {
    ...state, eyeOffset, belowThreshold,
    thresholdRemaining: thresholdRemaining > 0 ? thresholdRemaining - 1 : scale - 1,
    eye: add(state.eye, [f32(eyeOffset[0] / scale), f32(eyeOffset[1] * verticalFactor), f32(eyeOffset[2] / scale)]),
    target: add(state.target, state.targetOffset.map(value => f32(value / scale))),
  };
}

// PRX +0x157B4 follows the turtle shown in the sleep commentary shot.
function startSleepCamera(variant, focus) {
  if (![0, 1].includes(variant) || !isVector(focus)) {
    throw new TypeError('Sleep camera needs a native cue variant and focus');
  }
  const eyeOffset = [f32(variant ? .075 : -.075), f32(.10), f32(.31)];
  const target = add(focus, [0, f32(.04), 0]);
  return { fov: 0x1555, eyeOffset, target, eye: add(target, eyeOffset) };
}

function advanceSleepCamera(state, focus, scale) {
  if (!isVector(focus) || !isVector(state.target) || ![1, 2, 4].includes(scale)) {
    throw new TypeError('Sleep camera needs its native target, focus and timing scale');
  }
  const desired = add(focus, [0, f32(.04), 0]);
  const gain = f32(.10);
  const blend = scale === 1 ? gain : f32(1 - timingRetention(gain, scale));
  const target = add(state.target, subtract(desired, state.target).map(value => f32(value * blend)));
  return { ...state, target, eye: add(target, state.eyeOffset) };
}

// PRX +0x17B08 initializes a closer orbit around one ranked turtle.
// The FPS patch scales the initial angle, then advances it one unit per update.
function startCloseOrbitCamera(variant, nearRank, leaderDelta, randomWord, focus, scale) {
  if (![0, 1].includes(variant) || !Number.isInteger(nearRank) || nearRank < 0 || nearRank > 5 ||
      !Number.isFinite(leaderDelta) || !validateRandomWords([randomWord], 1) ||
      !isVector(focus) || ![1, 2, 4].includes(scale)) {
    throw new TypeError('Close orbit camera needs its variant, target rank, leader delta, random word and focus');
  }
  const targetOffset = [0, 0, -f32(leaderDelta * f32(.15))];
  const baseAngle = nearRank <= 1 ? 0 : nearRank === 2 ? 0x200 : 0x400;
  const angle = (baseAngle + ((randomWord >>> 7) & 0xff) - 128) * scale;
  const target = add(focus, [0, 0, targetOffset[2]]);
  target[2] = f32(target[2] - f32(.05));
  return closeOrbitTarget({
    variant, scale, angle, target, targetOffset, eyeOffset: [.5, .25, .5], fov: 0x238e,
  }, focus, true);
}

function closeOrbitTarget(state, focus, initializing) {
  const { scale, targetOffset, eyeOffset, variant } = state;
  const { sin, cos } = yawSinCos(state.angle * 32 / scale);
  const desired = add(focus, targetOffset);
  desired[2] = f32(desired[2] - f32(.05));
  const gain = f32(.05);
  const blend = initializing || scale === 1 ? gain : f32(1 - timingRetention(gain, scale));
  const difference = subtract(desired, state.target);
  const target = add(state.target, difference.map(value => f32(value * blend)));
  const eye = add(target, [
    f32(f32(cos * .75) * eyeOffset[0]),
    eyeOffset[1],
    f32(f32(sin * .75) * eyeOffset[2]),
  ]);
  return { ...state, eye, target, angle: state.angle + (initializing ? scale : 1) * (variant ? 1 : -1) };
}

function advanceCloseOrbitCamera(state, focus) {
  if (!isVector(focus) || ![1, 2, 4].includes(state.scale) ||
      !Number.isSafeInteger(state.angle) || ![state.target, state.eyeOffset, state.targetOffset].every(isVector)) {
    throw new TypeError('Close orbit camera needs its native pose, angle and focus');
  }
  return closeOrbitTarget(state, focus, false);
}

// PRX +0x15E18 places the eye once relative to the focus. Three native
// random words select the end of the track and the pan on each axis.
function startFixedEyeCamera(variant, randomWords, focus) {
  if (![0, 1].includes(variant) || !validateRandomWords(randomWords, 3) || !isVector(focus)) {
    throw new TypeError('Fixed eye camera needs a cue variant, three random words and a focus');
  }
  const [side, x, z] = randomWords;
  const inFront = f32(side * unitScale) > .5;
  const eyeZ = f32(focus[2] + f32(inFront ? .87 : -.87));
  const jitter = word => f32(f32(word * unitScale - .5) * f32(.001));
  return {
    fov: 0x1c71,
    eye: [0, f32(.1), eyeZ],
    target: [f32(variant === 0 ? .43 : -.43), f32(.31), f32(eyeZ + f32(inFront ? -.8 : .8))],
    eyeOffset: [0, 0, 0],
    targetOffset: [jitter(x), 0, jitter(z)],
  };
}

function advanceFixedEyeCamera(state, scale) {
  if (![1, 2, 4].includes(scale) || ![state.target, state.targetOffset].every(isVector)) {
    throw new TypeError('Fixed eye camera needs its native pose and timing scale');
  }
  return { ...state, target: add(state.target, state.targetOffset.map(value => f32(value / scale))) };
}

// PRX +0x184B4 places the camera beyond the course and pans it while
// following the selected turtle. The three words are from the cue's RNG.
function startFinishApproachCamera(variant, sections, randomWords, focus) {
  if (![0, 1].includes(variant) || !validSectionCount(sections) ||
      !validateRandomWords(randomWords, 3) || !isVector(focus)) {
    throw new TypeError('Finish approach camera needs a cue variant, course length, three random words and focus');
  }
  const lateral = word => f32(f32(word * unitScale - .5) * f32(.0001));
  const [x, y, z] = randomWords;
  const eyeOffset = [lateral(x), lateral(y), f32(f32(z * unitScale) * f32(-.001) - f32(.001))];
  const origin = [f32(variant ? -.34 : .34), f32(.3), f32(-sections - f32(.6))];
  return { fov: 0x1c71, eye: add(origin, eyeOffset), target: focus.slice(), eyeOffset, targetOffset: [0, 0, 0] };
}

function advanceFinishApproachCamera(state, focus, scale) {
  if (!isVector(focus) || ![1, 2, 4].includes(scale) ||
      ![state.eye, state.target, state.eyeOffset].every(isVector)) {
    throw new TypeError('Finish approach camera needs its native pose, focus point and timing scale');
  }
  const gain = f32(.05);
  const blend = scale === 1 ? gain : f32(1 - timingRetention(gain, scale));
  const target = add(state.target, subtract(focus, state.target).map(value => f32(value * blend)));
  const eye = add(state.eye, state.eyeOffset.map(value => f32(value / scale)));
  return { ...state, eye, target };
}

function validSectionCount(sections) {
  return Number.isInteger(sections) && sections >= 3 && sections <= 7;
}

function finishLineTarget(focus, previousTarget, sections) {
  const depth = -focus[2];
  const nearLine = f32(sections - .25);
  if (depth <= nearLine) return focus.slice();
  // +0x18CC8 slows the pan within a quarter unit of the finish.
  const factor = Math.min(1, f32(f32(depth - nearLine) / f32(.3)));
  const z = previousTarget[2];
  const blended = f32(f32(1 - factor) * f32(depth + z) - z);
  return [focus[0], focus[1], -Math.min(sections, blended)];
}

// PRX +0x188AC fixes the eye at the finish and follows the selected turtle.
function startFinishLineCamera(variant, leaderSlot, sections, focus, previousTarget) {
  if (![0, 1].includes(variant) || ![0, 1, 2, 3, 4].includes(leaderSlot) ||
      !validSectionCount(sections) || !isVector(focus) || !isVector(previousTarget)) {
    throw new TypeError('Finish line camera needs a native cue variant, leader, course length and focus');
  }
  const onRight = variant === 0 ? leaderSlot !== 4 : leaderSlot === 0;
  return {
    fov: 0x1c71, sections, eye: [f32(onRight ? .69 : -.69), f32(.42), -sections],
    target: finishLineTarget(focus, previousTarget, sections),
  };
}

function advanceFinishLineCamera(state, focus, scale) {
  if (!isVector(focus) || !isVector(state.target) || !validSectionCount(state.sections) ||
      ![1, 2, 4].includes(scale)) {
    throw new TypeError('Finish line camera needs its native pose, focus point and timing scale');
  }
  const desired = finishLineTarget(focus, state.target, state.sections);
  const gain = f32(.1);
  const blend = scale === 1 ? gain : f32(1 - timingRetention(gain, scale));
  return { ...state, target: add(state.target, subtract(desired, state.target).map(value => f32(value * blend))) };
}

// PRX +0x16B94 aims down the track from behind the finish line.
function startEndCamera(sections, focus) {
  if (!validSectionCount(sections) || !isVector(focus)) {
    throw new TypeError('End camera needs the course length and focus');
  }
  return { fov: 0x1c71, eye: [0, .25, f32(-sections - f32(1.1))], target: add(focus, [0, .25, 0]) };
}

function advanceEndCamera(state, focus, scale) {
  if (!isVector(focus) || !isVector(state.target) || ![1, 2, 4].includes(scale)) {
    throw new TypeError('End camera needs its native pose, focus point and timing scale');
  }
  const desired = add(focus, [0, .25, 0]);
  const gain = f32(.05);
  const blend = scale === 1 ? gain : f32(1 - timingRetention(gain, scale));
  return { ...state, target: add(state.target, subtract(desired, state.target).map(value => f32(value * blend))) };
}

module.exports = {
  advanceEndCamera, advanceFinishLineCamera, startEndCamera, startFinishLineCamera,
  advanceFinishApproachCamera, advanceFixedEyeCamera, startFinishApproachCamera, startFixedEyeCamera,
  advanceCloseOrbitCamera, advanceCountdownCamera, advanceLateralCamera, advanceOrbitCamera, advanceSideTrackingCamera,
  advanceSleepCamera, startSleepCamera, advanceRearPanCamera, startRearPanCamera,
  startCloseOrbitCamera, startCountdownCamera, startLateralCamera, startOrbitCamera, startSideTrackingCamera,
  viewFromCameraPose,
};
