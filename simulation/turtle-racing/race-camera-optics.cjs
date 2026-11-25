'use strict';

const f32 = Math.fround;
const radiansPerTurnUnit = 2 * Math.PI / 65536;

function normal(tangent) {
  const lengthSquared = f32(1 + f32(tangent * tangent));
  const inverseLength = f32(1 / Math.sqrt(lengthSquared));
  return [inverseLength, f32(tangent * inverseLength)];
}

function cameraFrustum({ fov, aspect, near, far }) {
  if (!Number.isInteger(fov) || fov < 2 || fov >= 32768 ||
      ![aspect, near, far].every(Number.isFinite) || aspect <= 0 || near <= 0 || far <= near) {
    throw new RangeError('A race camera needs a fixed-turn FOV and a valid aspect and depth range');
  }
  // EBOOT +0x583A8 halves the fixed-turn FOV before the tangent lookup.
  // The VMX routine normalizes the plane using a reciprocal-square-root estimate
  // and a refinement, so the last bit may differ across arithmetic backends.
  const tangent = f32(Math.tan((fov >> 1) * radiansPerTurnUnit));
  const [horizontal, horizontalDepth] = normal(f32(tangent * f32(aspect)));
  const [vertical, verticalDepth] = normal(tangent);
  return {
    near: Array(4).fill(f32(-near)),
    far: Array(4).fill(f32(-far)),
    side: [
      [horizontal, -horizontal, 0, 0],
      [0, 0, -vertical, vertical],
      [horizontalDepth, horizontalDepth, verticalDepth, verticalDepth],
    ],
  };
}

module.exports = { cameraFrustum };
