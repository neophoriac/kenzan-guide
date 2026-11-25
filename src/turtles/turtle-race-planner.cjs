'use strict';

const { events } = require('../../data/turtles/turtle-native-data.json');
const { rollRaceBoard, surfaces } = require('../../simulation/turtle-racing/race-data.cjs');

const boards = surfaces.map((_, seed) => rollRaceBoard(seed).layouts);
const trials = 32;
const qualifiers = ['turtle-race-s04', 'turtle-race-s05', 'turtle-race-s06'];

function courseLayouts(event) {
  const randomSections = event.sections.flatMap((surface, index) => surface === 'Random' ? [index] : []);
  return { randomSections, layouts: (randomSections.length ? boards : boards.slice(0, 1)).map(board => board[event.id]) };
}

function eligibility(turtle, event, results) {
  const rank = 'HKSOY'.indexOf(event.id[0]);
  if (rank >= 0 && turtle.rankId !== rank) return 'Different race rank';
  switch (event.playerRule) {
    case 'OTHER3_WIN':
      if (!qualifiers.every(id => results.has(id))) return 'Needs all three Genbu qualifiers';
      break;
    case 'YOKOZUNA_COMP':
      if (!turtle.adamantineEligible) return 'Needs all ten Yokozuna wins';
      break;
    case 'LIFE_OLD': {
      const life = turtle.lifespan;
      if (!life?.remaining || life.remaining * 10 > life.initial) return 'Doesn’t meet the lifespan limit';
      break;
    }
    case '10WIN':
      if (turtle.winStreak < 10) return 'Needs ten wins in a row';
      break;
    case '10LOSE':
      if (turtle.lossStreak < 10) return 'Needs ten losses in a row';
      break;
  }
  if (turtle.formScore == null || !turtle.personality) return 'Race stats unavailable';
  return null;
}

function bestCandidates(candidates, layouts, staminaMode) {
  if (candidates.some(candidate => layouts.some(index => candidate.samples[index][staminaMode].finished !== trials))) {
    return [];
  }
  const scored = candidates.flatMap(candidate => {
    const samples = layouts.map(i => candidate.samples[i][staminaMode]);
    if (samples.some(sample => sample.finished !== trials)) return [];
    const total = samples.reduce((sum, sample) => sum + sample.wins, 0);
    return total ? [{ candidate, total, minimum: Math.min(...samples.map(sample => sample.wins)) }] : [];
  });
  scored.sort((left, right) => right.minimum - left.minimum || right.total - left.total);
  const best = scored[0];
  return best ? scored.filter(score => score.minimum === best.minimum && score.total === best.total)
    .map(score => score.candidate.turtle) : [];
}

module.exports = { bestCandidates, courseLayouts, eligibility, events, surfaces, trials };
