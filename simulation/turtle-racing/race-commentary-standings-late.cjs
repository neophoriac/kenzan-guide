'use strict';

const f32 = Math.fround;
const sceneTypes = [
  1, 3, 4, 4, 5, 6, 8, 9, 0, 1, 1, 2, 1, 1, 1, 5, 3, 6, 8, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 8, 8,
];

function chooseApproachScene(state, rank, gaps) {
  const [leader, second] = rank;
  const [firstGap, secondGap, thirdGap, fourthGap] = gaps;
  const previousGap = state.gapHistory[0];
  const withLeader = phase => ({ phase, lastLeader: leader.slot });
  if (leader.slot !== state.rankHistory[0] && firstGap > 15) return withLeader(0x3c);

  if (firstGap < 30 && firstGap < previousGap && f32(firstGap + secondGap) > 15 && second.pace > leader.pace) {
    if (state.sceneType === 4) return { phase: 0x41, lastLeader: -1 };
    if (state.sceneType === 1 || Math.abs(f32(firstGap - previousGap)) >= 15) {
      return withLeader(state.rankHistory.slice(0, 2).includes(second.slot) ? 0x3d : 0x3e);
    }
    if (firstGap <= 15) return withLeader(0x40);
    return withLeader(state.sceneType === 3 ? 0x3b : 0x3c);
  }

  if (state.sceneType === 3) {
    if (firstGap >= 15) return withLeader(0x3f);
  } else {
    if (firstGap > 30 && state.lastLeader === leader.slot) return withLeader(0x3b);
    const topThreeGap = f32(firstGap + secondGap);
    const topFourGap = f32(topThreeGap + thirdGap);
    if ((firstGap > 30 || secondGap <= 15) &&
        (topThreeGap > 30 || thirdGap <= 15) &&
        (topFourGap > 30 || fourthGap <= 15)) {
      return f32(topFourGap + fourthGap) >= 45 ? { phase: 0x42, lastLeader: -1 } : withLeader(0x41);
    }
  }
  return withLeader(f32(second.pace * 1.5) < leader.pace ? 0x3b : 0x40);
}

function chooseLeadScene(state, rank, gaps) {
  const [leader, second] = rank;
  const [firstGap, secondGap] = gaps;
  const previousGap = state.gapHistory[0];
  if ((state.lastLeader !== -1 && leader.slot !== state.lastLeader && state.sceneType === 1) ||
      (firstGap > 15 && state.sceneType === 5 && leader.slot !== state.rankHistory[1])) return 0x4b;
  if (firstGap <= 15 && secondGap > firstGap) return 0x4c;
  if (f32(firstGap + secondGap) < 30) return 0x4d;
  if (firstGap > 15 && previousGap < 15) return leader.pace <= second.pace ? 0x45 : 0x44;
  if (firstGap <= 30) return 0x46;
  if (state.sceneType === 5) return 0x4a;
  if (state.sceneType === 4) return 0x49;
  if (leader.slot !== state.lastLeader || previousGap <= 30) return 0x47;
  return f32(second.pace * .5) <= leader.pace || firstGap >= 60 ? 0x48 : 0x46;
}

function chooseNearFinishScene(state, progress, rank, gaps) {
  const [leader, second] = rank;
  const [firstGap, secondGap] = gaps;
  const steadyLead = second.pace <= leader.pace;
  if (!steadyLead && state.sceneType !== 3 && state.sceneType !== 4 && state.rankHistory[0] !== second.slot) {
    return { phase: 0x57, pause: 30 };
  }
  if (progress > f32(.92)) {
    let phase = 0x53;
    if (firstGap <= 7.5) {
      if (state.sceneType === 4 && secondGap <= 7.5) phase = 0x5c;
      else phase = state.sceneType === 1 ? 0x59 : 0x51;
    }
    return { phase, pause: 15 };
  }

  let phase = 0x4f;
  if (firstGap <= 7.5) {
    if (state.sceneType === 4 && secondGap <= 7.5) phase = 0x5b;
    if (state.sceneType === 1) phase = state.lastLeader === leader.slot ? 0x58 : 0x52;
  } else if (state.previousPhase !== 0x50) {
    phase = 0x50;
  } else if (firstGap > 30 && !steadyLead) {
    phase = 0x56;
  }
  return { phase, pause: leader.pace > .75 && second.pace > .75 ? 15 : 30 };
}

// PRX +0x28B84 pre-finish dispatch. The caller applies cue, voice and
// follow-up RNG in order. Current rank/pace are derived from the same update.
function selectLateStandings(state, progress, rank, gaps) {
  const leader = rank[0].slot;
  if (state.previousPhase <= 0x3a) {
    if (!rank.slice(0, 2).every(racer => Number.isFinite(racer.pace))) {
      return { complete: false, reason: 'Missing racer pace for late standings commentary' };
    }
    const { phase, lastLeader } = chooseApproachScene(state, rank, gaps);
    state.lastLeader = lastLeader;
    return { phase, pause: 45, soundGroup: 3, cameraActions: [0, 1, 2], sceneType: sceneTypes[phase - 0x3b] };
  }
  if (state.previousPhase < 0x44) {
    state.previousLeader = state.lastLeader;
    if (progress < f32(.7)) return null;
    if (!rank.slice(0, 2).every(racer => Number.isFinite(racer.pace))) {
      return { complete: false, reason: 'Missing racer pace for late standings commentary' };
    }
    const phase = chooseLeadScene(state, rank, gaps);
    state.lastLeader = phase === 0x4d ? -1 : leader;
    return { phase, pause: 45, cueId: 14, durationUnits: 3, soundGroup: 4, sceneType: sceneTypes[phase - 0x3b] };
  }

  if (progress < f32(.85)) state.previousLeader = state.lastLeader;
  if (progress > f32(.98)) return null;
  if (state.sceneWait === 0) {
    state.sceneWait = 5;
    return null;
  }
  if (--state.sceneWait > 0) return null;
  if (!rank.slice(0, 2).every(racer => Number.isFinite(racer.pace))) {
    return { complete: false, reason: 'Missing racer pace for late standings commentary' };
  }
  const { phase, pause } = chooseNearFinishScene(state, progress, rank, gaps);
  if (progress < f32(.95)) state.lastLeader = leader;
  return { phase, pause, sceneType: sceneTypes[phase - 0x3b], cameraFollowup: true };
}

// The roll at +0x2A718 occurs after voice selection. A roll in the first
// tenth adds the +0x2A784 draw and chooses a camera action (1 or 2).
function lateCameraFollowup(rng) {
  return rng.unit16() < f32(.1) ? (rng.next15() & 1) + 1 : null;
}

module.exports = { lateCameraFollowup, selectLateStandings };
