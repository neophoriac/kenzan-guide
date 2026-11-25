'use strict';

const { modelNoiseDelta } = require('./race-model-noise.cjs');

const f32 = Math.fround;

// 9E548–9E60C groups the matrix terms as (x+y)+(z+translation).
function transformPoint([x, y, z], [columnX, columnY, columnZ, translation]) {
  return columnX.slice(0, 3).map((value, lane) => f32(
    f32(f32(value * x) + f32(columnY[lane] * y)) + f32(f32(columnZ[lane] * z) + translation[lane]),
  ));
}

function modelCameraSphere({ localCenter, radius, ownerTransform, viewTransform, alternateCamera }) {
  const world = transformPoint(localCenter, ownerTransform);
  const primary = { center: transformPoint(world, viewTransform), radius };
  if (!alternateCamera) return { primary, alternate: null };
  // 9E828–9E8C4 offsets the world sphere horizontally before applying the view.
  const scale = f32(f32(alternateCamera.scale + alternateCamera.scale) * radius);
  const [x, , z] = alternateCamera.direction;
  const shifted = [f32(world[0] + f32(x * scale)), world[1], f32(world[2] + f32(z * scale))];
  return { primary, alternate: { center: transformPoint(shifted, viewTransform), radius } };
}

function cameraBand({ depth, thresholds, margin, fade, fadeStep, keepBandZero, lodEnabled }) {
  // 9E36C clears the prior band before 9AC68. Distance and fade arithmetic
  // below follow the common actor path used by the race audience.
  const insideNearBand = f32(thresholds[0] - margin) <= depth && depth <= margin;
  const matchingIndex = insideNearBand ? 0 : thresholds.findIndex(threshold => threshold < depth);
  let band = matchingIndex === -1 ? thresholds.length - 1 : matchingIndex;
  if (!keepBandZero && band === 0) band = 1;
  if (!lodEnabled && band >= 2) band = 1;
  if (band === 0 || band === 5) {
    fade = Math.max(0, f32(fade - fadeStep));
    if (fade > 0) band = band === 0 ? 1 : 4;
  } else {
    fade = Math.min(1, f32(fade + fadeStep));
  }
  return { band, fade };
}

function sphereInFrustum({ center: [x, y, z], radius }, frustum) {
  // 57DEC. VMX CR6's LT condition means all four comparison lanes are true.
  const low = f32(z - radius);
  const high = f32(z + radius);
  if (frustum.near.every(limit => low > limit) || frustum.far.every(limit => limit > high)) return false;
  const [planeX, planeY, planeZ] = frustum.side;
  return planeX.every((normal, lane) => radius >= f32(planeZ[lane] * z + f32(planeY[lane] * y + f32(normal * x))));
}

function spherePassesOcclusion({ center: [x, y, z], radius }, occlusion) {
  if (!occlusion.enabled) return true;
  // 5CEF0: fixed-point depth, then the set of camera-space quadrants touched
  // by the sphere. The packet list is in native traversal order.
  const depth = Math.max(-0x80000000, Math.min(0x7fffffff, Math.trunc(f32(z - radius) * 1024)));
  const left = f32(x - radius) < 0;
  const below = f32(y - radius) < 0;
  const right = f32(x + radius) > 0;
  const above = f32(y + radius) > 0;
  const mask = (left && below ? 1 : 0) | (right && below ? 2 : 0) |
    (left && above ? 4 : 0) | (right && above ? 8 : 0);

  for (const { depthLimit, quadrants, front: [a,b,c,d], sides } of occlusion.packets) {
    if (depthLimit < depth) break;
    if ((quadrants & mask) !== mask) continue;
    const frontDistance = f32(f32(f32(x * a) + f32(y * b)) + f32(f32(z * c) + d));
    if (!(frontDistance < -radius)) continue;
    const [planeX, planeY, planeZ, planeOffset] = sides;
    if (planeX.every((normal, lane) => f32(normal * x + f32(planeY[lane] * y +
      f32(planeZ[lane] * z + planeOffset[lane]))) > radius)) return false;
  }
  return true;
}

function visibilityBits(actor, frustum, occlusion) {
  const primaryBand = actor.band >= 1 && actor.band <= 4;
  if (!actor.cameraAvailable) return primaryBand ? 3 : 0;
  let visible = 0;
  if (primaryBand) {
    if (!actor.primary || !frustum || !occlusion) return undefined;
    if (sphereInFrustum(actor.primary, frustum)) {
      visible = spherePassesOcclusion(actor.primary, occlusion) ? 3 : 1;
    }
  }
  if (visible === 3 || actor.band > 3) return visible;
  if (actor.alternate === undefined) return undefined;
  // null means the actor+19A/+190 and alternate-camera gates excluded this test.
  if (actor.alternate && (!frustum || !occlusion)) return undefined;
  if (actor.alternate && sphereInFrustum(actor.alternate, frustum)) {
    visible |= spherePassesOcclusion(actor.alternate, occlusion) ? 6 : 4;
  }
  return visible;
}

function planModelNoiseFrame({ actors, frustum, occlusion, clock }) {
  // EBOOT 9DF34 checks each render candidate, issuing slot +E4 for either
  // visibility group or a forced pose request. The common slot
  // (+9D1DC) supplies actor+D8 to +A5AB8, witnessed in the Crystal Cup.
  if (!Array.isArray(actors)) return { complete: false, missing: ['ordered actor candidates'] };
  const callbacks = [];
  const missing = [];
  for (const [index, actor] of actors.entries()) {
    if (actor.modelOwner === 0) continue;
    if (!Number.isInteger(actor.modelOwner) || actor.modelOwner < 0 || actor.modelOwner > 0xffffffff - 0x1CC ||
      typeof actor.forcePose !== 'boolean') {
      missing.push(`actor ${index} model owner or forced pose flag`);
      continue;
    }
    if (!actor.forcePose) {
      if (actor.classificationEnabled === false) continue;
      const visible = actor.classificationEnabled === true && Number.isInteger(actor.band) && actor.band >= 0 && actor.band <= 5 &&
        typeof actor.cameraAvailable === 'boolean' ? visibilityBits(actor, frustum, occlusion) : undefined;
      if (visible === undefined) {
        missing.push(`actor ${index} visibility inputs`);
        continue;
      }
      if ((visible & 3) !== 3 && (visible & 6) !== 6) continue;
    }
    const delta = clock ? modelNoiseDelta(clock.clockFactor, clock.modelFactor, clock.frameStep) : NaN;
    if (!Number.isFinite(delta)) {
      missing.push('animation clock');
      continue;
    }
    callbacks.push({ timer: actor.modelOwner + 0x1A4, delta }, { timer: actor.modelOwner + 0x1CC, delta });
  }
  if (missing.length) return { complete: false, missing: [...new Set(missing)] };
  return { complete: true, callbacks };
}

module.exports = { cameraBand, modelCameraSphere, planModelNoiseFrame, sphereInFrustum, spherePassesOcclusion };
