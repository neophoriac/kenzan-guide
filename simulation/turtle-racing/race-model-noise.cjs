'use strict';

// EBOOT +0xA5AB8 updates the timers at each model owner's +0x1A4 and +0x1CC.
// The caller supplies the actual callback sequence and delta. Each timer then
// evolves locally, consuming RNG only when native +0xCA93C crosses its end.
const f32 = Math.fround;
const unit16 = f32(1 / 65535); // Native constant 0x37800080.

function fusedSingle(left, right, addend) {
  // Binary64 holds a product of two binary32 values exactly. Correct the
  // final conversion if the binary64 sum landed exactly on a binary32 tie.
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

function readModelNoiseTimer(bytes, offset = 0) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    enabled: view.getUint32(offset + 0x00) !== 0,
    base: view.getUint32(offset + 0x04),
    startSpan: view.getUint32(offset + 0x08),
    minLength: view.getUint32(offset + 0x0C),
    lengthSpan: view.getUint32(offset + 0x10),
    elapsed: view.getFloat32(offset + 0x14),
    start: view.getFloat32(offset + 0x18),
    end: view.getFloat32(offset + 0x1C),
    amplitude: view.getFloat32(offset + 0x20),
    minAmplitude: view.getFloat32(offset + 0x24),
  };
}

function timerParameters({ base, startSpan, minLength, lengthSpan, minAmplitude }) {
  if ([base, startSpan, minLength, lengthSpan].some(value =>
    !Number.isInteger(value) || value < 0 || value > 0xffffffff) || !Number.isFinite(f32(minAmplitude))) {
    throw new TypeError('Model-animation timers need four unsigned parameters and a finite minimum amplitude');
  }
  return { base, startSpan, minLength, lengthSpan, minAmplitude: f32(minAmplitude) };
}

function createModelNoise(timers = []) {
  const state = new Map();
  for (const { id, ...timer } of timers) {
    if (id === undefined || state.has(id)) throw new RangeError('Model-animation timers require unique IDs');
    if (typeof timer.enabled !== 'boolean' || !Number.isFinite(f32(timer.elapsed)) || !Number.isFinite(f32(timer.end))) {
      throw new TypeError(`Model-animation timer ${id} needs enabled, elapsed, and end fields`);
    }
    state.set(id, { ...timer, ...timerParameters(timer), elapsed: f32(timer.elapsed), end: f32(timer.end) });
  }
  return state;
}

function modelNoiseDelta(clockFactor, modelFactor, frameStep) {
  // +0x2BFC4C with r4=0, followed by +0xA5AF4 and +0xA5B20.
  return f32(f32(f32(f32(clockFactor) * f32(modelFactor)) * 30) / f32(frameStep));
}

function rollSpan(low16, span, addend, arithmetic) {
  // The observed RPCS3 LLVM build rounds the normalized draw before applying
  // the span. The PPU instruction order rounds the scaled span first.
  if (arithmetic === 'rpcs3-llvm') return fusedSingle(f32(low16 * unit16), f32(span), addend);
  return fusedSingle(f32(f32(span) * unit16), low16, addend);
}

function rerollTimer(rng, timer, arithmetic) {
  // +0xCA6DC keeps the first two draws in registers and publishes the third
  // at +0xCA854, so the ring observes all three advances as one write.
  const startRoll = rng.next16();
  const lengthRoll = rng.next16();
  const amplitudeRoll = rng.next16();
  const { base, startSpan, minLength, lengthSpan, minAmplitude } = timer;
  timer.start = rollSpan(startRoll, startSpan, f32(base), arithmetic);
  const end = rollSpan(lengthRoll, lengthSpan, f32(timer.start + f32(minLength)), arithmetic);
  timer.end = end > timer.start ? end : f32(timer.start + 1);
  timer.amplitude = fusedSingle(f32(1 - f32(minAmplitude)), f32(amplitudeRoll * unit16), f32(minAmplitude));
}

function applyModelNoise(rng, timers, callbacks = [], arithmetic = 'ppu') {
  if (arithmetic !== 'ppu' && arithmetic !== 'rpcs3-llvm') {
    throw new RangeError('Unknown model-animation arithmetic mode');
  }
  const startDraws = rng.draws;
  const rerolled = [];
  for (const callback of callbacks) {
    const { timer: id, kind = 'update' } = callback;
    const timer = timers.get(id);
    if (!timer) throw new RangeError(`Unknown model-animation timer ${id}`);
    if (kind === 'enabled') {
      if (typeof callback.enabled !== 'boolean') throw new TypeError('Model-animation enable state must be boolean');
      timer.enabled = callback.enabled;
      continue;
    }
    if (kind === 'update') {
      if (!Number.isFinite(callback.delta)) throw new TypeError('Model-animation updates need the native time delta');
      timer.elapsed = timer.enabled ? f32(timer.elapsed + f32(callback.delta)) : 0;
      if (!timer.enabled || timer.elapsed <= timer.end) continue;
    } else if (kind === 'configure') {
      Object.assign(timer, timerParameters(callback));
    } else if (kind !== 'reset') {
      throw new RangeError(`Unknown model-animation callback ${kind}`);
    }
    if (kind !== 'configure') timer.elapsed = 0; // +0xCA910 before reconfiguration.
    rerollTimer(rng, timer, arithmetic);
    rerolled.push(id);
  }
  return { draws: rng.draws - startDraws, rerolled, seed: rng.seed };
}

module.exports = { applyModelNoise, createModelNoise, modelNoiseDelta, readModelNoiseTimer };
