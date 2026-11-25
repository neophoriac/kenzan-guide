'use strict';

// These opening snapshots retain only model, camera, speech and clock data.
// Each trial generates a new roster instead of using captured race records.
// They sample representative shared-arena starts. Reusing those starts on
// another course or with another roster is a simulation assumption, and the
// active race seed is sampled independently of each opening's original RNG.
const openings = require('./race-planner-openings.json');
const rootCurves = require('./race-planner-root-curves.json');
const { generateRivalLineup, surfaces } = require('./race-data.cjs');
const { simulateRace } = require('./race-engine.cjs');
const { createModelGeometryForecast } = require('./race-scene-geometry.cjs');
const { createSceneCamera } = require('./race-scene-camera.cjs');
const { racerScale } = require('./race-racer-motion.cjs');
const {
  actorWorldSphere, controllerRootPoint, modelControllerMatrix, racerCameraHeight,
  racerRequestedPose, racerTerrainAdjustment, sampleMotionRoot,
} = require('./race-actor-geometry.cjs');

const f32 = Math.fround;

function trialSeed(index, salt) {
  // Separate streams for field construction and active-race sampling. The
  // same index intentionally pairs trials across terrain and stamina choices.
  let value = (index + 1) ^ salt;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return (value ^ (value >>> 15)) >>> 0;
}

function createSceneInputs(opening, lineup, track, staminaMode) {
  const { fps } = opening;
  const stepSeconds = f32(1 / fps);
  const animationTiming = { taskSpeed: 1, stepSeconds };
  const racerScales = lineup.map(({ stats }, slot) => {
    const { stamina, legPower } = stats;
    const startingStamina = slot === 0 && staminaMode === 'full' ? stamina.max : stamina.value;
    return racerScale(startingStamina, legPower.value);
  });
  const presentation = {
    effectManagerActive: true, // Present in each measured arena startup.
    racers: opening.racerMotion.map((sample, slot) => ({
      ...sample, scale: racerScales[slot], smoothedDistance: 0, forwardDelta: 0, lateralOffset: 0,
    })),
    crowd: opening.crowd,
    animationTiming,
    commentary: opening.commentary,
    modelNoise: opening.modelNoise,
  };
  const scene = {
    animationTiming,
    guestRaceClock: { modelFrameRate: fps, compensationRatio: fps / 30, timerRate: fps, stepSeconds },
    crowdSample: opening.crowd,
    sceneCheckpoint: { actors: opening.actors },
  };
  const initialActors = racerScales.map((scale, slot) => ({
    slot, distance: 0, base: racerRequestedPose({ slot, smoothedDistance: 0, drift: 0, scale }).position,
  }));
  const { startingPose } = opening.camera;
  const firstFocusZ = initialActors[0].base[2];
  const camera = createSceneCamera({
    ...opening.camera,
    startingPose: {
      ...startingPose,
      eye: [startingPose.eye[0], startingPose.eye[1], f32(firstFocusZ + startingPose.eyeOffset[2])],
      target: [startingPose.target[0], startingPose.target[1], f32(firstFocusZ + startingPose.targetOffset[2])],
    },
  }, initialActors, track.length);
  const geometry = createModelGeometryForecast({ scene, curves: rootCurves });
  const racerActors = opening.actors.filter(actor => actor.kind === 'racer');
  return {
    presentation,
    generateModelNoiseGeometry({ frame, racers, motion, presentation: update }) {
      const missing = [...(update.missing ?? []), ...(update.crowd?.missing ?? [])];
      if (update.commentary?.complete === false) missing.push(update.commentary.reason);
      if (missing.length) return { missing };
      try {
        const actors = racers.map(({ drift, sectionIndex, distance, place }, slot) => {
          const { smoothedDistance, animation, lateralOffset } = motion[slot];
          const scale = racerScales[slot];
          const { position: base, yaw } = racerRequestedPose({ slot, smoothedDistance, drift, lateralOffset, scale });
          base[1] = racerCameraHeight(smoothedDistance, sectionIndex, scale, track);
          const adjustment = racerTerrainAdjustment(smoothedDistance, sectionIndex, scale, track);
          const matrix = modelControllerMatrix({ position: base, yaw, adjustment });
          const rootY = sampleMotionRoot(rootCurves[animation.clip], animation.phase)[1];
          const position = controllerRootPoint({ matrix, root: [0, rootY, 0] });
          const [x, y, z, radius] = racerActors[slot].localSphere;
          const world = actorWorldSphere({ localCenter: [x, y, z], radius, position, yaw });
          return { slot, distance, place, sectionIndex, base, world };
        });
        const view = camera(frame, racers, actors, update.commentary);
        return geometry(view, { frame, racers: actors, crowdEvents: update.crowd?.events,
          crowdAnchorResets: update.crowd?.anchorResets });
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return { missing: [error.message] };
      }
    },
  };
}

function runSceneTrial({ eventId, player, sections, fps, staminaMode, index }) {
  if (!Number.isInteger(index) || index < 0 || index >= 0xffffffff) {
    throw new RangeError('A race trial needs a nonnegative 32-bit index');
  }
  if (!Array.isArray(sections) || !sections.length || sections.length > 5 ||
      sections.some(section => !surfaces.includes(section))) {
    throw new RangeError('A race trial needs one to five resolved track sections');
  }
  if (!['saved', 'full'].includes(staminaMode)) throw new RangeError('Choose saved or full stamina');
  const candidates = openings.filter(opening => opening.fps === fps);
  if (!candidates.length) throw new RangeError('Choose 30, 60, or 120 FPS');
  const opening = candidates[index % candidates.length];
  const seed = trialSeed(index, 0x8b26d17f);
  const raceSeed = trialSeed(index, 0x5a4f3c81);
  const field = generateRivalLineup({ eventId, player, seed });
  const sceneEstimate = {
    arena: 'shared-kenzan-turtle-racing',
    opening: opening.source,
    startingState: 'representative-opening',
    layoutScope: 'synthetic-shared-arena',
    raceSeed: 'independently-sampled',
    setupDraws: field.draws,
  };
  if (field.status !== 'ready') {
    return { status: 'no-start', reason: field.reason, sections: [...sections], results: [], trace: [],
      seed: field.seed, diagnostics: { sceneEstimate } };
  }
  const track = ['Start', ...sections, 'Finish'];
  const { presentation, generateModelNoiseGeometry } = createSceneInputs(opening, field.lineup, track, staminaMode);
  const result = simulateRace({
    eventId, sections, lineup: field.lineup, fps, staminaMode, raceSeed,
    applyEntryEffects: true, frameCounterOffset: opening.cutoff, waterRippleOrigin: 'every-update',
    nativePresentationStart: presentation, generateModelNoiseGeometry,
  });
  result.diagnostics.sceneEstimate = sceneEstimate;
  if (result.status === 'finished' && result.diagnostics.presentation.unmodeled.length) result.status = 'incomplete';
  return result;
}

module.exports = { runSceneTrial };
