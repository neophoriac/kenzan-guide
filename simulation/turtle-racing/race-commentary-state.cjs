'use strict';

const { scheduleCue, selectPlaceCue } = require('./race-ambience.cjs');
const { finishCommentaryStandings, selectFinishCommentary } = require('./race-commentary-finish.cjs');
const { lateCameraFollowup, selectLateStandings } = require('./race-commentary-standings-late.cjs');

const ready = 0x75;
const opening = 0x13;
const f32 = Math.fround;
// Initial camera setup in the +0x18E24 dispatch table. A single native
// store can publish three advances for a vector with three random axes.
const cameraJitterDraws = new Map([
  [5, 0], [6, 6], [7, 3], [8, 0], [10, 3], [12, 0], [13, 1], [14, 3], [15, 0], [16, 0],
]);

function createCommentaryState(start) {
  const { phase, previousPhase, pause, cueId, variant, duration, remaining, soundMask } = start;
  if (![phase, previousPhase, pause, cueId, variant, duration, remaining, soundMask].every(Number.isInteger) ||
      pause < 0 || duration < 0 || remaining < 0 || remaining > duration || soundMask < 0 || soundMask >= 31) {
    throw new RangeError('Incomplete native commentator starting state');
  }
  const completedOpening = phase === ready && previousPhase === opening && pause > 0 &&
    Number.isInteger(start.pauseLength) && start.pauseLength >= pause &&
    Array.isArray(start.rankHistory) && start.rankHistory.length === 5 &&
    Array.isArray(start.gapHistory) && start.gapHistory.length === 4;
  if (!completedOpening && (phase !== ready || previousPhase !== ready || pause !== 0)) {
    throw new RangeError('Commentary replay needs the opening director state');
  }
  return {
    phase, previousPhase, pause, cueId, variant, duration, remaining, soundMask, pauseLength: pause,
    sleepMask: 0, mishapMask: 0, eventCount: 0, previousEventPhase: ready, quietTicks: 0,
    cheerCooldowns: [0, 0, 0, 0, 0], mishapCooldowns: [0, 0, 0, 0, 0],
    lastPlaceMask: 0, lastLeader: -1, focusSlot: -1, sceneWait: 0, sceneType: 0,
    previousLeader: -1, previousScene: ready, announcedFinishCount: 0,
    gapHistory: [0, 0, 0, 0], rankHistory: [],
    ...(completedOpening && {
      pauseLength: start.pauseLength, previousScene: start.previousScene,
      sceneType: start.sceneType, gapHistory: [...start.gapHistory], rankHistory: [...start.rankHistory],
    }),
  };
}

function applyAcceptedCue(state, rng, cue, onReaction) {
  if (!cue.accepted) return null;
  state.cueId = cue.cueId;
  state.variant = cue.variant;
  state.duration = cue.timer;
  state.remaining = cue.timer;
  const jitter = cameraJitterDraws.get(cue.cueId);
  if (jitter === undefined) return `Unmodeled commentary camera handler for cue ${cue.cueId}`;
  cue.cameraRandomWords = Array.from({ length: jitter }, () => rng.next16());
  onReaction?.('race');
  return null;
}

function playReaction(state, rng) {
  let sound = rng.next15() % 5;
  while (state.soundMask & (1 << sound)) sound = (sound + 1) % 5;
  state.soundMask |= 1 << sound;
  if (state.soundMask === 31) state.soundMask = 0;
  return sound;
}

function directCueForProgress(progress, cueId, rng) {
  if (progress > f32(.98)) return cueId !== 16 ? [16, 6] : null;
  if (progress > f32(.825)) return cueId !== 15 ? [15, 3] : null;
  if (progress > f32(.775)) return cueId !== 10 && rng.unit16() > f32(.9) ? [10, 1] : null;
  if (progress > f32(.6) && cueId === 14) return [null, 3];
  return null;
}

function raceInterruption(state, racers, progress, trackLength, rng) {
  const sorted = [...racers].sort((a, b) => b.distance - a.distance || a.slot - b.slot);
  const gaps = sorted.slice(0, -1).map((racer, rank) => f32(racer.distance - sorted[rank + 1].distance));
  const at = racer => f32(racer.distance / trackLength);
  let phase = ready;
  let pause = 0;
  let slot;
  let count = 0;
  let cueId;
  let durationUnits = 3;

  // PRX +0x28F40 handles a new sleeper before checking cheers or stumbles.
  for (const racer of racers) {
    const bit = 1 << racer.slot;
    if ((state.sleepMask & bit) || !racer.sleepActive) continue;
    if (at(racer) >= .5) {
      phase = count ? 3 : 2;
      pause = progress <= f32(.9) ? 45 : 30;
    } else {
      phase = count ? 1 : 0;
      pause = 60;
    }
    count++;
    slot = racer.slot;
    state.sleepMask |= bit;
    playReaction(state, rng);
  }
  if (count > 0) {
    if (progress < f32(.6)) {
      cueId = count === 1 ? (state.cueId === 12 ? 5 : 12) : (state.cueId === 8 ? 5 : 8);
    }
    return { phase, pause, cueId, durationUnits, slot, keepFocusX: cueId === 12 };
  }
  if (state.eventCount >= 2 || progress >= f32(.95)) return null;

  const near = (racer, ratio) => at(racer) <= f32(.975) && f32(at(racer) / progress) >= f32(ratio);
  const cheering = racers.filter(racer => racer.cheering && near(racer, .75));
  const recent = cheering.filter(racer => state.cheerCooldowns[racer.slot] > 0).length;
  for (const racer of cheering) {
    const rank = sorted.indexOf(racer);
    slot = racer.slot;
    if (state.cheerCooldowns[slot] > 0 && ++count !== recent) continue;
    if (count < 2 && recent < 1) {
      if ((rank === 0 && gaps[0] < 15) || (rank === 1 && gaps[0] < 30) ||
          (rank === 2 && f32(gaps[0] + gaps[1]) < 45)) phase = 4;
      else if (rank > 2 && at(racer) < .5) phase = 8;
    } else {
      phase = progress > f32(.6) ? 7 : progress > f32(.3) ? 6 : 5;
    }
    pause = progress > f32(.85) ? 30 : progress < .5 ? 60 : 45;
    state.cheerCooldowns[slot] = 160;
    count++;
  }
  if (pause > 0) {
    if (progress < f32(.6)) cueId = state.cueId === 8 ? 5 : 8;
    return { phase, pause, cueId, durationUnits, slot };
  }
  count = 0;
  for (const racer of racers) {
    const bit = 1 << racer.slot;
    if ((state.mishapMask & bit) || state.mishapCooldowns[racer.slot] > 0 ||
        !near(racer, .85) || !racer.stumbling) continue;
    const rank = sorted.indexOf(racer);
    slot = racer.slot;
    if (rank === 0 && gaps[0] < 60) phase = 11;
    else if (rank === 1 && gaps[1] < 60) phase = 12;
    else phase = [10, 11, 12, 13].includes(state.previousEventPhase) ? 10 : 13;
    pause = progress > f32(.85) ? 30 : at(racer) >= .5 ? 45 : 60;
    state.mishapMask |= bit;
    state.mishapCooldowns[slot] = 160;
    count++;
  }
  if (!count) return null;
  if (progress < f32(.6)) {
    cueId = count === 1 ? (state.cueId === 13 ? 5 : 13) : (state.cueId === 8 ? 5 : 8);
    if (cueId === 13) durationUnits = 10;
  }
  return { phase, pause, cueId, durationUnits, slot, keepFocusX: cueId === 13 };
}

// Third word of the native +0x27914 voice table for phases 0x14–0x39.
const raceSceneTypes = [
  1, 8, 0, 1, 1, 6, 7, 8, 0, 1, 1, 1, 3, 4, 7, 9, 8, 0, 1, 6, 6, 6, 6, 8, 8,
  0, 1, 1, 1, 3, 4, 4, 4, 6, 7, 9, 9, 8,
];

function standingsCommentary(state, progress, racers, rng) {
  const rank = [...racers].sort((a, b) => b.distance - a.distance || a.slot - b.slot);
  const gaps = rank.slice(0, -1).map((racer, index) => f32(racer.distance - rank[index + 1].distance));
  const leader = rank[0].slot;
  const last = rank[4].slot;
  const lastBit = 1 << last;
  const lastAlreadyNamed = (state.lastPlaceMask | state.sleepMask | state.mishapMask) & lastBit;
  let phase;
  let pause = 60;
  let cueId = null;
  let placeSlot = 1;
  if (state.previousPhase === opening && progress < f32(.2)) {
    phase = gaps[0] > 10 || state.sleepMask || state.mishapMask ? 0x14 : 0x15;
    state.lastLeader = phase === 0x14 ? leader : -1;
    pause = 75;
    cueId = undefined;
  } else if (progress < f32(.3) && state.previousPhase <= 0x16) {
    if (!lastAlreadyNamed && gaps[3] > 15) {
      phase = 0x1a;
      cueId = state.cueId === 7 ? 8 : 7;
      state.lastPlaceMask |= lastBit;
      state.focusSlot = last;
    } else if (gaps[0] > 15) {
      phase = state.lastLeader === -1 ? 0x17 : 0x18;
      state.lastLeader = leader;
      state.focusSlot = -1;
    } else {
      phase = gaps[1] > 15 ? 0x19 : 0x1b;
      state.lastLeader = phase === 0x19 ? leader : -1;
      state.focusSlot = -1;
    }
  } else if (progress < f32(.5) && state.previousPhase < 0x26) {
    if (state.sceneWait === 0) {
      state.sceneWait = 15;
      return null;
    }
    if (--state.sceneWait > 0) return null;
    const spread = gaps.reduce((total, gap) => f32(total + gap), 0);
    if (progress >= f32(.4) || state.previousPhase > 0x1c) {
      if (gaps[0] > 15 && gaps[0] > f32(state.gapHistory[0] + 15) && state.lastLeader === -1 &&
          rank[0].surface !== 'Normal') {
        phase = 0x26;
        state.lastLeader = leader;
      } else if (spread < 45 && state.sceneType !== 7) {
        phase = 0x2c;
        state.lastLeader = -1;
      } else if (f32(gaps[0] + gaps[1]) < 15) {
        phase = 0x2b;
        state.lastLeader = -1;
      } else {
        phase = gaps[0] >= 15 ? 0x2a : gaps[1] < 15 ? 0x29 :
          rank[0].slot === state.rankHistory[0] && rank[1].slot === state.rankHistory[1] ? 0x28 : 0x27;
        state.lastLeader = leader;
      }
      pause = 75;
      cueId = rng.unit16() > .5 ? 10 : undefined;
    } else if (!lastAlreadyNamed && gaps[3] > 15 && state.sceneType !== 7 && gaps[0] < 30) {
      phase = 0x22;
      cueId = state.cueId === 5 ? 8 : 5;
      state.lastPlaceMask |= lastBit;
      state.lastLeader = -1;
      state.focusSlot = last;
    } else if (gaps[0] <= 15) {
      const previousSpread = state.gapHistory.reduce((total, gap) => f32(total + gap), 0);
      if (gaps[1] <= 15 || rank[1].slot === state.rankHistory[0] || f32(state.gapHistory[0] - gaps[0]) <= 15) {
        phase = spread > 45 && spread > previousSpread ? 0x23 : 0x24;
      } else phase = 0x21;
      state.lastLeader = phase === 0x24 ? -1 : leader;
      state.focusSlot = -1;
    } else {
      phase = state.lastLeader === -1 ? 0x1d : state.lastLeader !== leader ? 0x20 : gaps[0] >= 30 ? 0x1f : 0x1e;
      state.lastLeader = leader;
      state.focusSlot = -1;
    }
  } else if (progress < f32(.6) && state.previousPhase <= 0x2d) {
    if (state.sceneWait === 0) {
      state.sceneWait = 15;
      return null;
    }
    if (--state.sceneWait > 0) return null;
    if (!rank.every(racer => Number.isFinite(racer.pace))) {
      return { complete: false, reason: 'Missing racer pace for standings commentary' };
    }
    const lastNamed = (state.lastPlaceMask | state.sleepMask) & lastBit;
    if (!lastNamed && gaps[3] > 15 && state.sceneType === 8 && state.focusSlot !== last) {
      phase = 0x36;
      placeSlot = -1;
      state.lastLeader = -1;
      state.focusSlot = last;
      state.lastPlaceMask |= lastBit;
    } else {
      const gaining = (rankIndex, priorIndex) =>
        rank[rankIndex].slot !== state.rankHistory[rankIndex] &&
        rank[rankIndex].slot !== state.rankHistory[priorIndex] && rank[rankIndex].pace > rank[priorIndex].pace;
      if (state.lastLeader !== -1 && state.lastLeader !== leader) {
        phase = 0x31;
      } else if (gaps[0] > 15 && state.sceneType !== 1) {
        phase = state.lastLeader === -1 ? 0x2e : gaps[0] >= 30 ? 0x30 : 0x2f;
      } else if (gaps[0] <= 15 && gaps[0] < state.gapHistory[0] && gaps[1] > 15 && gaining(1, 0)) {
        phase = 0x32;
      } else if (gaps[0] <= 45 && gaps[1] <= 15 && gaps[1] < state.gapHistory[1] && gaps[2] > 15 && gaining(2, 1)) {
        phase = 0x33;
      } else if (gaps[0] <= 45 && gaps[1] <= 45 && gaps[2] <= 15 && gaps[2] < state.gapHistory[2] &&
                 gaps[3] > 15 && gaining(3, 2)) {
        phase = 0x34;
      } else if (f32(gaps[0] + gaps[1]) < 15 && state.sceneType !== 8) {
        phase = 0x39;
      } else {
        const spread = gaps.reduce((total, gap) => f32(total + gap), 0);
        const previousSpread = state.gapHistory.reduce((total, gap) => f32(total + gap), 0);
        phase = spread <= previousSpread ? 0x38 : gaps[1] > 30 && state.sceneType === 6 ? 0x35 : 0x37;
      }
      state.lastLeader = phase === 0x39 ? -1 : leader;
      state.focusSlot = -1;
    }
    pause = 45;
  } else {
    const scene = selectLateStandings(state, progress, rank, gaps);
    return scene && { ...scene, gaps, rank: rank.map(racer => racer.slot) };
  }
  return { phase, pause, cueId, placeSlot, gaps, rank: rank.map(racer => racer.slot) };
}

function stepCommentaryState(state, rng, race, onReaction) {
  const { leaderDistance, trackLength, finishCount, raceState, fps, racers, nativeTick = true, minimumTicks = 30 } = race;
  // The compensated patch gates the director at PRX +0x12DA8. The
  // speech clock counts host ticks and the patch scales its acceptance gate.
  if (state.remaining > 0) state.remaining--;
  if (!nativeTick) return { complete: true };
  if (state.pause > 0 && --state.pause === 0 && state.phase !== ready) {
    state.previousPhase = state.phase;
    state.phase = ready;
  }
  for (const counters of [state.cheerCooldowns, state.mishapCooldowns]) {
    for (let slot = 0; slot < counters.length; slot++) if (counters[slot] > 0) counters[slot]--;
  }
  if (state.previousPhase === 0x73 || state.announcedFinishCount === 4) return { complete: true };
  const standings = racers && finishCommentaryStandings(racers, trackLength);
  const progress = standings?.progress ?? Math.min(1, Math.max(0, f32(leaderDistance / trackLength)));
  const cueContext = () => ({
    previousCueId: state.cueId, previousVariant: state.variant, elapsedTicks: state.duration - state.remaining,
    raceState, fps, minimumTicks,
  });
  let cue;
  let sound;
  let cameraAction;
  let voiceRoll;
  const requestCue = (cueId, durationUnits = 3, slot = 1, focusBySlot = false, keepFocusX = false) => {
    const context = cueContext();
    cue = cueId === null ? selectPlaceCue(rng, { ...context, slot }) :
      scheduleCue(rng, cueId, { ...context, durationUnits });
    if (cue.accepted) Object.assign(cue, { focusSlot: slot, focusBySlot, keepFocusX });
    return applyAcceptedCue(state, rng, cue, cueId === null ? onReaction : undefined);
  };
  const publish = scene => {
    state.previousScene = state.previousPhase;
    state.previousPhase = scene.phase;
    state.sceneType = scene.sceneType ?? raceSceneTypes[scene.phase - 0x14] ?? 0;
    if (standings) {
      state.gapHistory = standings.gaps;
      state.rankHistory = standings.rank;
    }
    state.pause = state.pauseLength = scene.pause;
    voiceRoll = rng.next15(); // +0x27914 -> EBOOT +0x2ADE08.
    if (scene.announcesFinisher && ++state.announcedFinishCount !== 4) state.previousPhase = 0x64;
  };
  const closeFrame = selected => {
    let scene = selected;
    if (scene?.cameraFollowup) {
      publish(scene);
      cameraAction = lateCameraFollowup(rng);
      scene = undefined;
    }
    if (!finishCount && progress < f32(.75) && ++state.quietTicks > 120) {
      if (!racers?.every(racer => Number.isFinite(racer.pace))) {
        return { complete: false, reason: 'Missing racer pace for progress commentary' };
      }
      if (state.phase === ready) state.phase = state.previousPhase;
      const pace = racers.reduce((total, racer) => f32(total + racer.pace), 0);
      const phase = progress >= f32(.3) ? 0x11 : f32(pace * f32(.2)) >= .5 ? 0x10 : 0xf;
      scene = { phase, pause: 60 };
    }
    if (scene && scene.phase !== ready) {
      if (scene.phase > opening) {
        state.eventCount = 0;
        if (state.cueId === 12 || state.cueId === 13) {
          const reason = requestCue(null);
          if (reason) return { complete: false, cue, reason };
        }
      }
      publish(scene);
      state.quietTicks = 0;
    }
    return { complete: true, cue, sound, cameraAction, voiceRoll };
  };

  const canInterrupt = finishCount <= state.announcedFinishCount + 1 &&
    (state.previousScene < 0x5e || state.previousScene > 0x63) &&
    progress > f32(.05) && (state.pause === 0 || state.pauseLength - state.pause > 45);
  if (canInterrupt) {
    if (!racers) return { complete: false, reason: 'Missing commentary racer events' };
    const event = raceInterruption(state, racers, progress, trackLength, rng);
    if (event) {
      if (state.phase === ready) state.phase = state.previousPhase;
      state.pause = state.pauseLength = event.pause;
      state.eventCount++;
      state.previousEventPhase = event.phase;
      const reason = event.cueId !== undefined &&
        requestCue(event.cueId, event.durationUnits, event.slot, true, event.keepFocusX);
      if (reason) return { complete: false, cue, reason };
      return closeFrame({ ...event, sceneType: 10 });
    }
  }
  const cues = finishCount ? null : directCueForProgress(progress, state.cueId, rng);
  if (cues) {
    const [cueId, durationUnits] = cues;
    const reason = requestCue(cueId, durationUnits, cueId === 14 ? 2 : 1);
    if (reason) return { complete: false, cue, reason };
  }
  if (state.phase === ready && state.pause === 0) {
    if (state.previousPhase !== ready) {
      if (!racers) return { complete: false, reason: 'Missing commentary racer positions' };
      const finish = finishCount ? selectFinishCommentary(state, { finishCount, ...standings }) : undefined;
      const scene = finish === undefined ? standingsCommentary(state, progress, racers, rng) : finish;
      if (scene === null) return closeFrame();
      if (scene.complete === false) return scene;
      const duration = scene.cueDurationUnits ?? scene.durationUnits ?? (scene.cueId === 10 ? 1 : 3);
      const reason = scene.cueId !== undefined ?
        requestCue(scene.cueId, duration, scene.cueId === 14 ? 2 : scene.placeSlot, scene.cueFocusBySlot) :
        scene.cueSlot !== undefined ? requestCue(null, duration, scene.cueSlot, scene.cueMode === 1) : undefined;
      if (reason) return { complete: false, cue, reason };
      if (scene.reactionSound) sound = playReaction(state, rng);
      return closeFrame(scene);
    }
    // PRX +0x29A0C opening call uses place slot 1 and reaction sound group 6.
    const reason = requestCue(null);
    if (reason) return { complete: false, reason };
    sound = playReaction(state, rng);
    return closeFrame({ phase: opening, pause: 75 });
  }
  return closeFrame();
}

module.exports = { applyAcceptedCue, createCommentaryState, stepCommentaryState };
