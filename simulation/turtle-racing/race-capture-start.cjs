'use strict';

const { readTurtles } = require('../../src/tracker/save-turtle-bucket.js');

const surfaceNames = ['Start', 'Normal', 'Water', 'Sand', 'Mud', 'Finish'];
const slotOffset = 0x8bb4;

function readSceneTiming(scene) {
  const { modelFrameRate: fps, compensationRatio, timerRate, stepSeconds } = scene.guestRaceClock ?? {};
  if (![30, 60, 120].includes(fps) || stepSeconds !== Math.fround(1 / fps)) {
    throw new RangeError('The scene checkpoint needs a measured 30, 60 or 120 FPS guest timestep');
  }
  const scale = fps / 30;
  // Before native-rate captures recorded the effective constants, the
  // unused patch timing words were zero. The patched rates need both words.
  const hasClock = compensationRatio === scale && timerRate === fps;
  const oldNativeClock = fps === 30 && compensationRatio === 0 && timerRate === 0;
  if (!hasClock && !oldNativeClock) throw new RangeError('Scene compensation ratio or timer rate disagrees with its timestep');
  return { fps, scale };
}

function readRacer(frame, slot) {
  const raw = frame.racers[slot];
  const record = Buffer.from(raw.record, 'hex');
  const save = new Uint8Array(slotOffset + 5 * record.length);
  save.set(record, slotOffset);
  // Rival race records do not need an ownership bit inside the game.
  save[slotOffset + 0x39] |= 1;
  const turtle = readTurtles(new DataView(save.buffer))[0];
  const activeStumble = raw.mishapTicks > 0 && [2, 4].includes(raw.condition);
  const segment = frame.segmentIndices?.[slot];
  return {
    ...turtle,
    slot,
    name: raw.name || turtle.name,
    runtime: {
      distance: frame.distance[slot],
      sectionIndex: segment >= 0 && segment < frame.course.length && Number.isInteger(segment) ? segment : undefined,
      condition: raw.condition,
      cheerActive: Boolean(raw.cheerActive),
      cheerDelay: frame.cooldowns[slot],
      cheerWindow: raw.cheerWindow,
      cheerTarget: raw.cheerTarget,
      cheerMultiplier: raw.cheerMultiplier,
      mishapTicks: raw.mishapTicks,
      mishapMultiplier: raw.mishapMultiplier,
      sleepUsed: Boolean(raw.sleepUsed),
      clumsyAnimation: frame.schemaVersion >= 2 ? Boolean(raw.clumsyAnimation) : activeStumble,
      drift: frame.drift?.[slot] ?? 0,
      laneFlag: frame.flags[slot] & 0x20,
    },
  };
}

function readInitialPresentation(frame, input) {
  if (input && (input.checkpointFrame !== frame.frame || !input.presentation)) {
    throw new RangeError('The presentation checkpoint must match the replay start frame');
  }
  const checkpoint = input?.presentation;
  return {
    effectManagerActive: frame.effectManagerPresent,
    commentary: checkpoint?.commentary,
    crowd: checkpoint?.crowd ?? frame.crowdSample ?? undefined,
    animationTiming: checkpoint?.animationTiming ?? frame.animationTiming,
    modelNoise: checkpoint?.modelNoise,
    racers: frame.racers.map((racer, slot) => ({
      clip: racer.activeClip,
      phase: racer.animationSample?.animationFrame,
      pendingClip: racer.pendingClip,
      queuedClip: racer.queuedClip,
      ended: racer.animationSample?.idleClipEnding,
      dwell: racer.idleDwell,
      speed: racer.playbackSpeed,
      scale: frame.racerScales?.[slot],
      footfallLatch: frame.footstepLatch?.[slot],
      smoothedDistance: frame.smoothedDistance?.[slot],
      forwardDelta: frame.forwardDeltas?.[slot],
    })),
  };
}

module.exports = { readInitialPresentation, readRacer, readSceneTiming, surfaceNames };
