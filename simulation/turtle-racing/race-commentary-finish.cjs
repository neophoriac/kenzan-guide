'use strict';

const f32 = Math.fround;
const ready = 0x75;
const rankBonus = [0, 16, 8, 4, 2];
const finishSceneTypes = [1, 1, 1, 1, 1, 1, 0, 4, 8, 4, 8, 0, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6];

// PRX +0x12EE8 sorts adjusted positions, then takes gaps between the raw
// positions in that order. At +0x28B84, finished racers remain eligible for
// progress until they run five units beyond the line.
function finishCommentaryStandings(racers, trackLength) {
  const key = racer => f32(racer.distance + (rankBonus[racer.place] ?? 0) * 100);
  const sorted = [...racers].sort((a, b) => key(b) - key(a) || a.slot - b.slot);
  const rank = sorted.map(racer => racer.slot);
  const gaps = sorted.slice(0, -1).map((racer, index) => f32(racer.distance - sorted[index + 1].distance));
  const activeLeader = sorted.find(racer => racer.distance < f32(trackLength + 5)) ?? sorted.at(-1);
  const progress = Math.min(1, Math.max(0, f32(activeLeader.distance / trackLength)));
  return { rank, gaps, progress };
}

function winnerScene(state, { finishCount, rank, gaps }) {
  const gap = gaps[0];
  const oldGap = state.gapHistory[0];
  const leader = rank[0];
  if (gap < 5 && oldGap < 5) {
    if (finishCount < 2) return null;
    return { phase: leader === state.lastLeader ? 0x71 : 0x72, announcesFinisher: true };
  }
  if (gap >= 30 || Math.abs(f32(gap - oldGap)) >= 15) {
    const phase = gap <= 45 ? 0x63 : leader === state.previousLeader ? 0x5e : 0x5f;
    return { phase, announcesFinisher: false };
  }
  const phase = leader !== state.previousLeader ? 0x62 : leader === state.rankHistory[0] ? 0x60 : 0x61;
  return { phase, announcesFinisher: false };
}

function nextFinisherPhase(state, { rank, gaps }, announced) {
  if (announced === 3) return 0x73;
  if (rank[announced + 1] !== state.rankHistory[announced + 1]) return 0x70;
  if (gaps[announced + 1] < 15) return 0x6f;
  const gap = gaps[announced];
  const unchanged = rank[announced] === state.rankHistory[announced];
  if (gap >= 30 || Math.abs(f32(gap - state.gapHistory[announced])) >= 15) {
    return gap <= 45 ? 0x6e : unchanged ? 0x6a : 0x6b;
  }
  return unchanged ? 0x6c : 0x6d;
}

// PRX +0x28B84 saved director branches from the first finish through its
// final announcement. Call after solving any pending interruption and the
// elapsed pause. undefined means control belongs to an earlier scene family;
// null means the native finish branch deliberately emits no new scene.
function selectFinishCommentary(state, race) {
  const { previousPhase, cueId, announcedFinishCount: announced = 0 } = state;
  const { finishCount, rank, gaps } = race;
  const progress = f32(race.progress);
  if (previousPhase === 0x73 || announced === 4 || state.pause > 0 || state.phase !== ready) return null;
  if (!finishCount || previousPhase <= 0x3a) return undefined;

  const endCue = cueId !== 0x10 ? { cueId: 0x10, cueDurationUnits: 6, cueArgument: 1 } : {};
  if (previousPhase < 0x5e) {
    const scene = winnerScene(state, race);
    return scene && { ...scene, ...endCue, pause: 60, reactionSound: true, sceneType: finishSceneTypes[scene.phase - 0x5e] };
  }
  if (finishCount === announced + 1) {
    if (previousPhase >= 0x65 || progress > f32(.98)) return null;
    const gap = gaps[finishCount];
    const ahead = progress <= f32(.95);
    const phase = ahead ? (gap <= 45 ? 0x68 : 0x67) : (gap <= 30 ? 0x66 : 0x65);
    const placeCue = progress < f32(.95) && cueId === 0x10 ?
      { cueSlot: rank[announced + 1], cueDurationUnits: 3, cueMode: 1 } : {};
    return { phase, pause: 45, announcesFinisher: false, sceneType: finishSceneTypes[phase - 0x5e], ...placeCue };
  }
  if (previousPhase >= 0x6a) return null;
  const phase = nextFinisherPhase(state, race, announced);
  return { phase, pause: 60, announcesFinisher: true, sceneType: finishSceneTypes[phase - 0x5e],
    reactionSound: phase === 0x6f || phase === 0x70,
    ...(progress > f32(.98) ? endCue : {}) };
}

module.exports = { finishCommentaryStandings, selectFinishCommentary };
