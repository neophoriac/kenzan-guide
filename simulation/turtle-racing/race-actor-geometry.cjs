'use strict';

const f32 = Math.fround;
const angleUnit = (2 * Math.PI) / 65536;
const centimeters = f32(0.01);
const laneWidth = f32(0.15);
const laneOrigin = f32(-0.3);
const shortTravelOffset = f32(0.05);
const scaleOffset = f32(-0.1);
const angleBits = new DataView(new ArrayBuffer(4));

function fusedSingle(left, right, addend) {
  // The product is exact in binary64. Correct any conversion that rounded
  // through a binary32 halfway point when adding the third operand.
  const product = left * right;
  const sum = product + addend;
  const rounded = f32(sum);
  if (sum === rounded) return rounded;
  const carry = sum - product;
  const error = (product - (sum - carry)) + (addend - carry);
  if (!error || (error > 0) === (rounded > sum)) return rounded;
  const opposite = f32(2 * sum - rounded);
  return Math.abs(rounded - sum) === Math.abs(opposite - sum) ? opposite : rounded;
}

function yawSinCos(yaw) {
  // EBOOT 55B14C reads a quarter-turn table of adjacent binary32 sine/cosine
  // pairs. The original 16,384 pairs match rounding these functions to f32.
  const angle = yaw & 0xffff;
  const quarter = (angle & 0x3fff) * angleUnit;
  const sine = f32(Math.sin(quarter));
  const cosine = f32(Math.cos(quarter));
  const swing = (angle & 0x4000) !== 0;
  const sin = angle & 0x8000 ? -(swing ? cosine : sine) : (swing ? cosine : sine);
  const cos = (angle + 0x4000) & 0x8000 ? -(swing ? sine : cosine) : (swing ? sine : cosine);
  return { sin, cos };
}

function crowdYawToward(position, target, jitter = 0) {
  // Kamerace 37C54 quantizes the ratio using the mantissa of 1 + ratio.
  // Its quarter-octant table is atan(single(index / 16384)) in turn units.
  const x = f32(f32(target[0]) - f32(position[0]));
  const z = f32(f32(target[2]) - f32(position[2]));
  if (x === 0) return (z >= 0 ? 0 : 0x8000) + jitter;
  if (z === 0) return (x > 0 ? 0x4000 : -0x4000) + jitter;
  const absX = Math.abs(x);
  const absZ = Math.abs(z);
  const difference = f32(absZ - absX);
  const octantTolerance = 1 / 16384;
  let firstQuadrant;
  if (Math.abs(difference) <= octantTolerance) {
    firstQuadrant = 0x2000;
  } else {
    const ratio = f32(Math.min(absX, absZ) / Math.max(absX, absZ));
    angleBits.setFloat32(0, f32(1 + ratio));
    const index = (angleBits.getUint32(0) >>> 9) & 0x3fff;
    const tableAngle = Math.trunc(f32(f32(Math.atan(index / 16384)) / angleUnit));
    firstQuadrant = difference > 0 ? tableAngle : 0x4000 - tableAngle;
  }
  return (x > 0 ? 1 : -1) * (z > 0 ? firstQuadrant : 0x8000 - firstQuadrant) + jitter;
}

function actorWorldSphere({ localCenter, radius, position, yaw }) {
  // EBOOT 9E538–9E5E8: actor state stores the position and yaw separately
  // from the local sphere. Rotation is about world Y with no radius scaling.
  const [x, y, z] = localCenter.map(f32);
  const [tx, ty, tz] = position.map(f32);
  const { sin, cos } = yawSinCos(yaw);
  return {
    center: [
      f32(f32(cos * x) + f32(f32(sin * z) + tx)),
      f32(y + ty),
      f32(f32(-sin * x) + f32(f32(cos * z) + tz)),
    ],
    radius: f32(radius),
  };
}

function controllerRootPoint({ matrix, root }) {
  // EBOOT 482470 reads the world matrix via the controller's +0x64 call
  // and multiplies it by the selected local joint translation. For joint 0,
  // 48C2A8 stores this point as the position used by actorWorldSphere.
  const [x, y, z] = root.map(f32);
  const [columnX, columnY, columnZ, translation] = matrix;
  return [0, 1, 2].map(axis => {
    const translatedX = fusedSingle(f32(columnX[axis]), x, f32(translation[axis]));
    const translatedY = fusedSingle(f32(columnY[axis]), y, translatedX);
    return fusedSingle(f32(columnZ[axis]), z, translatedY);
  });
}

function modelControllerMatrix({ position, yaw, pendingYaw = 0, adjustment, anchorBlend }) {
  // Common controller virtual +0x60 at EBOOT 48CB08. The translation is
  // the current controller+0x80 point. Adjustment stores the four columns
  // that the race wrapper sends to +48966C.
  let anchor = position.slice(0, 3).map(f32);
  let angle = (yaw + pendingYaw) | 0;
  if (anchorBlend?.weight > 0) {
    const weight = f32(anchorBlend.weight);
    const originalWeight = f32(1 - weight);
    anchor = anchor.map((coordinate, axis) => f32(
      f32(coordinate * originalWeight) + f32(f32(anchorBlend.position[axis]) * weight),
    ));
    const shortYaw = (angle << 16) >> 16;
    const difference = ((anchorBlend.yaw - shortYaw) << 16) >> 16;
    angle = ((shortYaw + Math.trunc(f32(difference * weight))) << 16) >> 16;
  }
  const { sin, cos } = yawSinCos(angle);
  const matrix = [[cos, 0, -sin, 0], [0, 1, 0, 0], [sin, 0, cos, 0], [...anchor, 1]];
  return adjustment.map(([x, y, z], column) => [
    ...controllerRootPoint({
      matrix: column === 3 ? matrix : [matrix[0], matrix[1], matrix[2], [0, 0, 0, 0]],
      root: [x, y, z],
    }),
    column === 3 ? 1 : 0,
  ]);
}

function crowdRefreshesNearCamera(position, eye) {
  // Kamerace 2F58–2F98 compares the actor's pre-update world position
  // against the race camera's current eye in the horizontal plane.
  const dx = f32(f32(position[0]) - f32(eye[0]));
  const dz = f32(f32(position[2]) - f32(eye[2]));
  return Math.sqrt(f32(f32(dx * dx) + f32(dz * dz))) < 1;
}

function racerLandAdjustment(scale) {
  // Kamerace 7964–7A90 scales the three axes of the identity matrix.
  const size = f32(scale);
  return [[size, 0, 0, 0], [0, size, 0, 0], [0, 0, size, 0], [0, 0, 0, 1]];
}

function waterSectionFraction(smoothedDistance, sectionIndex) {
  const progress = f32(smoothedDistance * centimeters);
  return Math.min(1, Math.max(0, f32(progress - sectionIndex)));
}

function racerCameraHeight(smoothedDistance, sectionIndex, scale, track) {
  if (track[sectionIndex] !== 'Water') return 0;
  const fraction = waterSectionFraction(smoothedDistance, sectionIndex);
  let height = f32(scale * f32(-.02));
  // Kamerace 76A8–76C0 lowers the model anchor on entering water.
  if (fraction < f32(.15)) {
    height = f32(height * f32(Math.max(0, f32(fraction - f32(.05))) / f32(.10)));
  } else if (fraction > f32(.95)) {
    height = f32(height * f32(f32(1 - fraction) / f32(.05)));
  }
  return height;
}

function racerTerrainAdjustment(smoothedDistance, sectionIndex, scale, track) {
  if (track[sectionIndex] !== 'Water') return racerLandAdjustment(scale);
  const fraction = waterSectionFraction(smoothedDistance, sectionIndex);
  const ramp = f32(.025);
  let pitch = 0;
  // +07690–07818 pitches the shell down into the water and up onto land.
  if (fraction < f32(.15)) {
    const entry = Math.max(0, f32(fraction - f32(.05)));
    const rise = Math.min(entry, f32(f32(.10) - entry));
    pitch = Math.trunc(f32(f32(Math.min(ramp, rise) / ramp) * 2048));
  } else if (fraction > f32(.95)) {
    const rise = Math.min(f32(fraction - f32(.95)), f32(1 - fraction), ramp);
    pitch = Math.trunc(f32(f32(rise / ramp) * -1024));
  }
  const { sin, cos } = yawSinCos(pitch);
  const y = f32(scale * cos);
  const z = f32(scale * sin);
  return [[scale, 0, 0, 0], [0, y, z, 0], [0, -z, y, 0], [0, 0, 0, 1]];
}

function sampleRootKeys(keys, phase) {
  let lo = 0;
  let hi = keys.length;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >>> 1;
    if (keys[mid][0] <= phase) lo = mid;
    else hi = mid;
  }
  const from = keys[lo];
  const to = keys[hi];
  if (!to || phase <= from[0]) return from.slice(1);
  // The native GMT position blend scales fractional progress by 255/256.
  // This matches unblended crowd roots captured at EBOOT +0x48C2A8.
  const blend = f32(f32(f32(phase - from[0]) / (to[0] - from[0])) * (255 / 256));
  return from.slice(1).map((value, axis) => fusedSingle(f32(to[axis + 1] - value), blend, value));
}

function sampleMotionRoot(clip, phase) {
  const channels = clip?.translation;
  if (!channels?.length || !Number.isFinite(phase) || phase < 0 ||
      channels.some(channel => !channel.keys?.length)) {
    throw new RangeError('Root motion needs the native position keys and animation phase');
  }
  if (channels[0].axis === 'xyz') return sampleRootKeys(channels[0].keys, phase);
  const root = [0, 0, 0];
  for (const channel of channels) {
    const axis = 'xyz'.indexOf(channel.axis);
    if (axis < 0 || channel.axis.length !== 1) throw new RangeError('Unknown native root-motion channel');
    root[axis] = sampleRootKeys(channel.keys, phase)[0];
  }
  return root;
}

function racerRequestedPose({ slot, smoothedDistance, drift, lateralOffset = drift, scale, raceState = 16 }) {
  // Kamerace 7A98–7B10 sets yaw, then 7B88–7C08 submits the point to the
  // actor controller. The result-screen path can substitute another point.
  if (raceState !== 16 || !Number.isInteger(slot) || slot < 0 || slot > 4 ||
      ![smoothedDistance, drift, lateralOffset, scale].every(Number.isFinite)) {
    throw new RangeError('The moving-race pose needs a slot and finite smoothed distance, drift, and scale');
  }
  const distance = f32(smoothedDistance);
  const trackOffset = f32(distance * centimeters);
  const lane = fusedSingle(slot, laneWidth, laneOrigin);
  const spareTravel = f32(1 - Math.min(1, distance));
  const startingOffset = fusedSingle(spareTravel, shortTravelOffset, shortTravelOffset);
  const scaleAdjustment = f32(1 - f32(scale));
  const longitudinal = f32(fusedSingle(scaleAdjustment, scaleOffset, startingOffset) - trackOffset);
  return {
    position: [f32(f32(lateralOffset * centimeters) + lane), 0, longitudinal],
    yaw: Math.trunc(fusedSingle(drift, 4096, 32768)),
  };
}

module.exports = {
  actorWorldSphere, controllerRootPoint, crowdRefreshesNearCamera, crowdYawToward, modelControllerMatrix,
  racerCameraHeight, racerLandAdjustment, racerRequestedPose, racerTerrainAdjustment,
  sampleCrowdRoot: sampleMotionRoot, sampleMotionRoot, yawSinCos,
};
