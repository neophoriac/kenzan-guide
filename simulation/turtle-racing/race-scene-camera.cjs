'use strict';

const motion = require('./race-camera-motion.cjs');
const { cameraFrustum } = require('./race-camera-optics.cjs');
const { finishCommentaryStandings } = require('./race-commentary-finish.cjs');

const f32 = Math.fround;

function selectFocus(selector, actors, rank) {
  const { focusSlot, focusBySlot, keepFocusX } = selector;
  if (selector.cueId === 7 && focusSlot === -1) return actors[rank[4]].base.slice();
  if (focusBySlot && !actors[focusSlot]) throw new RangeError('Missing camera focus actor');
  if (!focusBySlot && (focusSlot < 1 || focusSlot > rank.length)) {
    throw new RangeError('Camera focus needs a ranked group');
  }
  const selected = focusBySlot ? [focusSlot] : rank.slice(0, focusSlot);
  const point = [0, 0, 0];
  for (const slot of selected) {
    for (let axis = 0; axis < point.length; axis++) {
      point[axis] = f32(point[axis] + actors[slot].base[axis]);
    }
  }
  if (selected.length > 1) {
    const weight = f32(1 / selected.length);
    for (let axis = 0; axis < point.length; axis++) point[axis] = f32(point[axis] * weight);
  }
  if (!keepFocusX) point[0] = 0;
  return point;
}

function advanceShot(cue, state, focus, phase, scale) {
  switch (cue) {
    case 4: return motion.advanceCountdownCamera(state, focus, scale);
    case 5: return motion.advanceLateralCamera(state, focus, scale);
    case 6: return motion.advanceSideTrackingCamera(state, focus, scale);
    case 7: return motion.advanceRearPanCamera(state, scale);
    case 8: return motion.advanceOrbitCamera(state, focus, phase, scale);
    case 10: return motion.advanceFixedEyeCamera(state, scale);
    case 12: return motion.advanceSleepCamera(state, focus, scale);
    case 13: return motion.advanceCloseOrbitCamera(state, focus);
    case 14: return motion.advanceFinishApproachCamera(state, focus, scale);
    case 15: return motion.advanceFinishLineCamera(state, focus, scale);
    case 16: return motion.advanceEndCamera(state, focus, scale);
    default: throw new RangeError(`Unmodeled camera shot ${cue}`);
  }
}

function startShot(cue, previousState, focus, leaderFocus, leader, phase, scale, sections) {
  const { variant, cameraRandomWords } = cue;
  switch (cue.cueId) {
    case 5: return motion.startLateralCamera(variant, leader.slot, focus);
    case 6: return motion.startSideTrackingCamera(variant, leader.slot, cameraRandomWords, focus, leaderFocus);
    case 7: return motion.startRearPanCamera(cameraRandomWords, focus);
    case 8: return motion.startOrbitCamera(variant, leader.velocity, focus, phase, scale);
    case 10: return motion.startFixedEyeCamera(variant, cameraRandomWords, leaderFocus);
    case 12: return motion.startSleepCamera(variant, focus);
    case 13: return motion.startCloseOrbitCamera(variant, cue.focusSlot, leader.velocity, cameraRandomWords[0], focus, scale);
    case 14: return motion.startFinishApproachCamera(variant, sections, cameraRandomWords, focus);
    case 15: return motion.startFinishLineCamera(variant, leader.slot, sections, focus, previousState.target);
    case 16: return motion.startEndCamera(sections, focus);
    default: throw new RangeError(`Unmodeled camera shot ${cue.cueId}`);
  }
}

function createSceneCamera(start, actors, sections) {
  const { cutoff, nativeClockPhase, startingPose, scale, aspect, near, far } = start;
  let state = startingPose;
  let selector = start.startingSelector ?? { cueId: 4, focusSlot: 1 };
  let previousActors = actors;
  let previousRank = finishCommentaryStandings(actors, sections * 100).rank;
  return function updateCamera(frame, racers, nextActors, commentary) {
    const phase = nativeClockPhase + frame - cutoff;
    const followSelector = selector.cueId === 6 ? { ...selector, focusSlot: selector.focusBySlot ? selector.focusSlot : 1 } : selector;
    const focus = selectFocus(followSelector, previousActors, previousRank);
    state = advanceShot(selector.cueId, state, focus, phase, scale);
    const published = state;
    const frustum = cameraFrustum({ fov: published.fov, aspect, near, far });
    const matrix = motion.viewFromCameraPose(published).flat();
    const { rank } = finishCommentaryStandings(racers, sections * 100);
    // The +2A70C follow-up plays a sound through +01FB4, without moving the camera.
    const cue = commentary?.cue;
    if (cue?.accepted) {
      const selected = selectFocus(cue, previousActors, rank);
      const leaderFocus = selectFocus(cue.focusBySlot ? cue : { ...cue, focusSlot: 1 }, previousActors, rank);
      state = startShot(cue, state, selected, leaderFocus, racers[rank[0]], phase, scale, sections);
      selector = cue;
    }
    previousActors = nextActors;
    previousRank = rank;
    return { frame, state: published, matrix, frustum, crowdEye: state.eye, active: state, focus, selector };
  };
}

module.exports = { createSceneCamera };
