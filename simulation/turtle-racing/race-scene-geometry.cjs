'use strict';

const { actorWorldSphere, controllerRootPoint, crowdRefreshesNearCamera, crowdYawToward,
  modelControllerMatrix, sampleMotionRoot, yawSinCos } = require('./race-actor-geometry.cjs');
const { advanceAnimationClock } = require('./race-motion-clock.cjs');
const { modelCameraSphere, cameraBand } = require('./race-model-scheduler.cjs');
const { readSceneTiming } = require('./race-capture-start.cjs');

// property.bin CAPR clips with root-retention mode 1.
const retainingRootIds = [893, 1015, 1017, 2069, 2070, 2082, 2083, 2090, 2129, 2130, 2135, 2136, 2144];

function createModelGeometryForecast({ scene, curves, onCrowdPose }) {
  if (!curves) throw new RangeError('The Crystal Cup scene model needs the extracted root curves');
  const retainingRoot = new Set(retainingRootIds.map(id => curves[id]));
  const { fps } = readSceneTiming(scene);
  const clock = { clockFactor: 1, modelFactor: 1, frameStep: fps };
  const thresholds = [-1.1, -8, -16, -20, -40, 0].map(Math.fround);
  const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]];
  const actors = [...scene.sceneCheckpoint.actors].sort((hi, lo) =>
    hi.kind === lo.kind ? hi.slot - lo.slot : hi.kind === 'crowd' ? -1 : 1);
  const crowdOverride = new Set(scene.crowdSample.filter(actor => actor.override).map(actor => actor.pointer));
  const fade = new Map(actors.map(actor => [actor.pointer, actor.culling.fade]));
  const f32 = Math.fround;
  const timing = scene.animationTiming;

  const crowdPoses = new Map(scene.crowdSample.filter(actor => !actor.override).map(sample => {
    const actor = actors.find(candidate => candidate.pointer === sample.pointer);
    const clip = curves[sample.animationSample.modelClip];
    const ctrl = sample.animationSample.controller;
    return [actor.pointer, { clip, raw: sampleMotionRoot(clip, ctrl.frame), base: [...actor.basePosition],
      yaw: actor.yaw, speed: sample.speed, frame: ctrl.frame, flags: ctrl.flags,
      featured: Boolean(sample.featured),
      rootBlendTicks: 0,
      multiplier: ctrl.multiplier, queuedMotions: ctrl.queuedMotions,
      blendActive: ctrl.blendFallback !== 0,
      secondaryActive: ctrl.secondaryClip >= 0 || ctrl.secondaryStart !== 0 || ctrl.secondaryEnd !== 0,
    }];
  }));

  function forecastCrowd(actor, physics, event, anchorReset) {
    const state = crowdPoses.get(actor.pointer);
    if (!state) return { position: actor.position, yaw: actor.yaw };
    const previousClip = state.clip;
    const before = onCrowdPose && {
      ...state, base: state.base.slice(), raw: state.raw.slice(), clip: state.clip.name,
    };
    let reset = false;
    if (event?.started) {
      const leader = physics.racers.find(racer => racer.place === 1) ??
        physics.racers.reduce((a, b) => a.distance < b.distance ? b : a);
      const target = leader.base;
      const anchor = actor.crowdAnchor;
      state.yaw = crowdYawToward(anchor, target, event.angleJitter ?? 0);
      state.speed = f32(f32(event.speedRoll * f32(1 / 65535) - .5) * .5 + 1);
      state.frame = event.phaseRoll % (3 * Math.trunc(state.clip.frames / 4));
      state.flags = 0;
      state.clip = curves[event.clip];
      state.rootBlendTicks = 0;
      reset = true;
    } else if (event) {
      state.frame = 0;
      state.flags = 0;
      state.clip = curves[event.clip];
      state.rootBlendTicks = 5;
      reset = true;
    }
    const step = advanceAnimationClock(state, state.clip, timing);
    if (!step.complete) throw Error('Standing position clock incomplete for crowd slot ' + actor.slot);
    Object.assign(state, step);
    const raw = sampleMotionRoot(state.clip, state.frame);
    if (state.rootBlendTicks > 0) {
      // Automatic clip changes fade in horizontal motion over five updates.
      // The controller stores its weight as a byte, with 255/256 at the end.
      const weight = (6 - state.rootBlendTicks) * 51 / 256;
      raw[0] = f32(raw[0] * weight);
      raw[2] = f32(raw[2] * weight);
      state.rootBlendTicks--;
    }
    const { sin, cos } = yawSinCos(state.yaw);
    // Explicit starts into looping clips can subtract the previous
    // controller root (+830) even after the race task resets the anchor.
    // A wrapped frame uses absolute translation (+48EEFC).
    const carry = !reset || (event?.started && state.clip.loop && retainingRoot.has(previousClip) &&
      (step.flags & 0x4000) === 0);
    // A featured actor's forced refresh of its standing loop starts X/Z
    // movement from the anchor. The one-shot cheers apply their sampled root.
    const refreshFeatured = state.featured && event?.started && state.clip.loop && previousClip === state.clip;
    const dx = refreshFeatured ? 0 : f32(raw[0] - (carry ? state.raw[0] : 0));
    const dz = refreshFeatured ? 0 : f32(raw[2] - (carry ? state.raw[2] : 0));
    const base = reset || anchorReset ? actor.crowdAnchor : state.base;
    state.base = [f32(base[0] + f32(f32(dx * cos) + f32(dz * sin))), base[1],
      f32(base[2] + f32(f32(dz * cos) - f32(dx * sin)))];
    state.raw = raw;
    const adjustment = [0, 4, 8, 12].map(index => actor.adjustmentMatrix.slice(index, index + 4));
    const matrix = modelControllerMatrix({ position: state.base, yaw: state.yaw, adjustment });
    const position = controllerRootPoint({ matrix, root: [0, raw[1], 0] });
    onCrowdPose?.({
      frame: physics.frame, slot: actor.slot, before, after: { ...state, clip: state.clip.name }, event, position,
    });
    return { position, yaw: state.yaw };
  }

  function forecast(camera, physics) {
    const viewTransform = [0, 4, 8, 12].map(index => camera.matrix.slice(index, index + 4));
    const projected = actors.map(actor => {
      const crowd = actor.kind === 'crowd';
      const event = crowd && physics.crowdEvents?.findLast(event => event.slot === actor.slot && event.type === 'start');
      const anchorReset = crowd && physics.crowdAnchorResets?.includes(actor.slot);
      // PRX +5394 and +5524 reset queued crowd actors to their anchors
      // even if +2D90 then keeps their current clip after a loop.
      const positionBeforeUpdate = anchorReset || event?.started ? actor.crowdAnchor :
        crowdPoses.get(actor.pointer)?.base ?? actor.basePosition;
      const classificationEnabled = !crowd || !crowdOverride.has(actor.pointer) &&
        !crowdRefreshesNearCamera(positionBeforeUpdate, camera.crowdEye ?? camera.state.eye);
      const modeledPose = crowd ? forecastCrowd(actor, physics, event, anchorReset) : null;
      const world = crowd ? actorWorldSphere({
        radius: actor.localSphere[3], localCenter: actor.localSphere.slice(0, 3),
        ...modeledPose,
      }) : physics.racers[actor.slot].world;
      const { primary } = modelCameraSphere({ localCenter: world.center, radius: world.radius,
        ownerTransform: identity, viewTransform });
      const band = classificationEnabled ? cameraBand({
        depth: primary.center[2], thresholds, margin: Math.fround(.1), fade: fade.get(actor.pointer),
        fadeStep: .25, keepBandZero: false, lodEnabled: false,
      }) : { band: 0, fade: 0 };
      fade.set(actor.pointer, band.fade);
      return { actor: actor.pointer, modelOwner: actor.modelOwner, forcePose: actor.culling.forcePose,
        classificationEnabled, cameraAvailable: true, band: band.band, primary, alternate: null, world };
    });
    return { frame: camera.frame, actors: projected, frustum: camera.frustum, occlusion: { enabled: false }, clock };
  }
  return forecast;
}

module.exports = { createModelGeometryForecast };
