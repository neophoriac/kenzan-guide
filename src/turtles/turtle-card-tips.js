(() => {
  const numbers = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
  const n = value => numbers.format(value);
  const multipliers = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
  const multiplier = value => multipliers.format(value);
  const known = value => typeof value === 'number' && Number.isFinite(value);
  const byte = value => Number.isInteger(value) && value >= 0 && value <= 255;
  const energyFactor = value => .75 + .25 * value / 255;
  const percent = value => `${n(value * 100)}%`;
  const paragraphs = (...parts) => parts.filter(Boolean).join('\n\n');
  const statNames = { stamina: 'Stamina', legPower: 'Leg Power', fullness: 'Fullness', water: 'Water', sand: 'Sand', mud: 'Mud' };
  const personalityNotes = {
    Timid: 'Can doze near the start or finish. Accepted cheering costs up to one trust point.',
    Normal: 'Its main mishap is slowing down. Form, trust and Fullness also affect mishaps.',
    Clumsy: 'Can hit the wall during a mishap. Accepted cheering can add one trust point, up to full trust.',
    Unpredictable: 'Can behave like a Timid, Normal or Clumsy turtle during races.',
    Awful: 'Especially prone to Clumsy-style mishaps. Form, trust and Fullness still matter.',
  };
  const patternNotes = {
    'Early Bloomer': 'Food growth is strongest early in life.',
    Normal: 'Food growth peaks around the middle of its life.',
    'Late Bloomer': 'Food growth peaks later in life.',
    Unpredictable: 'Food growth rises and falls with age rather than following a steady curve.',
  };
  const outlookNotes = {
    'May slow': 'Growth from food may slow as it ages.',
    'Likely steady': 'Growth from food is expected to stay roughly steady as it ages.',
    'May improve': 'Growth from food may improve as it ages.',
  };

  function statTip(turtle, key) {
    const label = statNames[key], stat = turtle[key];
    const generic = key === 'stamina' ? 'Energy for running and cheering.'
      : key === 'legPower' ? 'Sets base running speed; the value is not a speed percentage.'
      : 'Determines how much room it has for food.';
    if (!byte(stat?.value) || !byte(stat?.max)) return paragraphs(`${label} values are unavailable.`, generic);
    const { value, max } = stat;
    let detail;
    if (value > max) detail = `${n(value-max)} above its saved trained limit.`;
    else if (key === 'fullness') detail = value === max ? 'Full: it cannot eat until Fullness drops.'
      : `Room for ${n(max-value)} more Fullness ${max-value === 1 ? 'point' : 'points'}.`;
    else detail = value === max ? 'At its trained maximum.'
      : `${n(max-value)} ${max-value === 1 ? 'point' : 'points'} below its trained maximum.`;
    let racing;
    if (key === 'stamina') {
      racing = `Starting pace factor: ${multiplier(energyFactor(value))}× before other factors. It falls as stamina drains. `
        + (value < max ? `Refilling to ${n(max)} improves this starting factor by ${percent(energyFactor(max) / energyFactor(value) - 1)}.`
          : 'Already full for this turtle; refilling cannot improve its starting stamina.');
    } else if (key === 'legPower') {
      racing = `Running pace factor: ${multiplier(.5 + .002 * value)}× on every track, before Form, stamina, terrain and mishaps. Higher Leg Power helps; this is not a speed percentage or a win forecast.`;
    } else {
      const atEntry = Math.max(0, value - 32) / 255;
      racing = `After the usual 32-point reduction on race entry, pace penalties are:\n`
        + `Normal ground ${percent(atEntry * .025)} · Sand ${percent(atEntry * .05)}\n`
        + `Water ${percent(atEntry * .075)} · Mud ${percent(atEntry * .1)}`;
      racing = paragraphs(racing, turtle.personality === 'Clumsy' || turtle.personality === 'Awful'
        ? 'Being fuller can reduce wall-hit mishaps, so emptier is not always better.'
        : turtle.personality === 'Timid' || turtle.personality === 'Normal'
          ? 'Being fuller also increases the Fullness part of its main mishap check.'
          : 'Fullness also affects mishaps differently for each personality.');
    }
    const lowStamina = key === 'stamina' && value <= 15
      ? 'Entering at 15 stamina or less costs up to eight trust points.' : '';
    const emptyStamina = key === 'stamina' && value === 0
      ? 'It can still move, but cannot start cheering at zero stamina.' : '';
    return paragraphs(`${label} ${n(value)} / ${n(max)}. ${detail}`, racing, [lowStamina, emptyStamina].filter(Boolean).join(' '));
  }

  function terrainTip(turtle, key) {
    const stat = turtle.terrainStats?.[key], label = statNames[key];
    const generic = `Higher ${label} ability helps it keep speed on ${key} sections.`;
    if (!byte(stat?.value) || !byte(stat?.max)) return paragraphs(`${label} values are unavailable.`, generic);
    const { value, max } = stat;
    const grade = value < 85 ? 'Low' : value < 170 ? 'Medium' : 'High';
    const threshold = value < 85 ? 85 : value < 170 ? 170 : null;
    const next = threshold === null ? 'Highest displayed grade.'
      : `${n(threshold-value)} ${threshold-value === 1 ? 'point' : 'points'} to ${grade === 'Low' ? 'Medium' : 'High'} (${threshold})${max < threshold ? '; its trained limit must rise first' : ''}.`;
    return paragraphs(`${label}: ${grade} · ${n(value)} / ${n(max)} trained limit.`,
      `On ${key} only: ${multiplier(.5 + .5 * value / 255)}× running pace, ${percent(value / 255)} more than zero ${label} ability with other factors unchanged. This is not a win chance.`, next);
  }

  function growthTip(turtle, key) {
    const stat = ['water', 'sand', 'mud'].includes(key) ? turtle.terrainStats?.[key] : turtle[key];
    const ceiling = turtle.growth?.ceilings?.[key], label = statNames[key];
    if (!byte(stat?.max) || !byte(ceiling)) return paragraphs(`${label} growth room is unavailable.`, 'Compares its trained limit with its own ceiling.');
    const room = ceiling-stat.max;
    if (room < 0) return paragraphs(`${label} limit ${n(stat.max)}: ${n(-room)} above its ceiling of ${n(ceiling)}.`, 'Feeding for this stat can lower the trained limit toward that ceiling.');
    if (room === 0) return paragraphs(`${label} limit ${n(stat.max)}: ceiling reached.`, `Food cannot raise the limit further${byte(stat.value) && stat.value < stat.max ? ', but the current stat can still refill' : ''}.`);
    return paragraphs(`${label} limit ${n(stat.max)}: ${n(room)} ${room === 1 ? 'point' : 'points'} below its ceiling of ${n(ceiling)}.`, 'Room to raise the trained limit, not a promised gain from one meal.');
  }

  function turtleCardTips(turtle) {
    const trust = byte(turtle.affinity) ? turtle.affinity : null;
    const rank = turtle.rank ?? 'Unknown rank';
    const wins = Array.isArray(turtle.rankRaceWins) ? turtle.rankRaceWins.length : null;
    const rankTip = turtle.rankId >= 0 && turtle.rankId < 4 && wins !== null
      ? paragraphs(`${rank}: ${Math.min(wins,3)} of 3 promotion stars.`, 'Stars count distinct events won at this rank. Repeat wins do not count.')
      : turtle.rankId === 4 ? paragraphs('Yokozuna: highest normal rank, with no three-star promotion.', wins === null ? 'Event-win history is unavailable.' : `${wins} different Yokozuna ${wins === 1 ? 'event' : 'events'} won.`)
        : turtle.rankId === 5 ? paragraphs('Musabetsu: open-rank category, with no further three-star promotion.', wins === null ? 'Event-win history is unavailable.' : `${wins} different ${wins === 1 ? 'event' : 'events'} won here.`)
          : 'Rank could not be read. Rank is the race class; ordinary promotion stars count distinct event wins.';
    const score = turtle.formScore;
    const form = !known(score) ? paragraphs('Current Form score unavailable.', 'Better Form helps speed and reduces mishaps.')
      : paragraphs(`Form ${n(score)}: ${score < 40 ? 'Terrible (below 40)' : score < 50 ? 'Bad (40-49)' : score < 60 ? 'Okay (50-59)' : score < 80 ? 'Good (60-79)' : 'Excellent (80 and above)'}.`,
        `Running pace factor: ${multiplier(.75 + score / 200)}×. Form 50 is the 1× baseline. Higher Form also reduces mishaps. This is a pace factor, not win odds.`,
        'Feeding cycles Form and can improve or worsen it.');
    const growth = turtle.growth ?? {};
    const factor = known(growth.factor) ? growth.factor : null;
    const factorDifference = factor === null ? '' : factor === 1 ? 'the same as the 1× base'
      : `${n(Math.abs(factor-1)*100)}% ${factor > 1 ? 'above' : 'below'} the 1× base`;
    const life = turtle.lifespan;
    const lifespan = life?.eternal ? paragraphs('This turtle does not age.', 'Feeding and racing do not consume a normal lifespan.')
      : known(life?.remaining) && known(life?.initial) && life.initial > 0 && life.remaining >= 0 && life.remaining <= life.initial
        ? paragraphs(`${n(life.remaining)} of ${n(life.initial)} life units left (${n(life.remaining/life.initial*100)}%).`,
          life.remaining === 0 ? 'Its recorded lifespan has run out.' : '', 'Feeding uses one unit; entering a race uses two. Life units are not real-time minutes.')
        : paragraphs('Remaining lifespan unavailable.', 'For ordinary turtles, feeding uses one life unit; entering a race uses two.');
    const streaks = known(turtle.winStreak) && known(turtle.lossStreak)
      ? turtle.winStreak === 0 && turtle.lossStreak === 0 ? 'No current win or loss streak. A win ends a loss streak; a loss ends a win streak.'
        : turtle.winStreak > 0 && turtle.lossStreak === 0 ? `Currently on a ${turtle.winStreak}-win streak: consecutive first-place finishes. Losing ends this streak.`
          : turtle.lossStreak > 0 && turtle.winStreak === 0 ? `Currently on a ${turtle.lossStreak}-loss streak: consecutive races without a win. Winning ends this streak.`
            : `${turtle.winStreak} consecutive wins and ${turtle.lossStreak} consecutive losses recorded. A win ends a loss streak; a loss ends a win streak.`
      : 'Current streaks are unavailable. They count consecutive wins or losses.';
    return {
      trust: trust === null ? paragraphs('Trust unavailable.', 'More trust helps reduce racing mishaps.')
        : paragraphs(`Trust ${trust} / 255. ${trust === 255 ? 'Full trust.' : `${255-trust} ${255-trust === 1 ? 'point' : 'points'} from full trust.`} The hearts show trust.`,
          trust === 0 ? 'No trust-based reduction in mishaps yet.' : `The trust part of a mishap check is ${percent(1 - (1.3 - .6 * trust / 255) / 1.3)} lower than at zero trust, with other inputs unchanged.`,
          'This is not the overall mishap probability: Form, Fullness and personality still matter.',
          byte(turtle.stamina?.value) && turtle.stamina.value <= 15 ? 'Entering at 15 stamina or less costs up to eight trust points before racing.' : ''),
      feedBonus: typeof turtle.recentRaceFeedBonus !== 'boolean' ? 'The post-race feeding bonus status is unavailable.'
        : paragraphs(`Post-race bonus ${turtle.recentRaceFeedBonus ? 'active' : 'inactive'} when you saved.`,
          turtle.recentRaceFeedBonus ? trust === null ? 'A qualifying feed can add up to 16 trust.' : trust === 255 ? 'Trust is full, so it cannot add trust now.' : `A qualifying feed can add up to ${Math.min(16,255-trust)} trust at this trust value.` : 'No extra trust from this bonus is recorded.',
          'Total stat/growth changes must be nonnegative. Initial meal Fullness is left out.'),
      rank: rankTip, form,
      personality: turtle.personality && personalityNotes[turtle.personality]
        ? paragraphs(`${turtle.personality}.`, personalityNotes[turtle.personality])
        : 'Personality could not be read. It affects racing mishaps and responses to cheering.',
      stamina: statTip(turtle, 'stamina'), legPower: statTip(turtle, 'legPower'), fullness: statTip(turtle, 'fullness'),
      water: terrainTip(turtle, 'water'), sand: terrainTip(turtle, 'sand'), mud: terrainTip(turtle, 'mud'),
      rating: !byte(turtle.savedRating) || turtle.savedRating > 100 ? 'The Turtle Master’s saved rating is unavailable.'
        : turtle.savedRating === 0 ? paragraphs('Unevaluated: no Turtle Master appraisal recorded.', 'This does not mean its rating is zero.')
          : paragraphs(`Last Turtle Master appraisal: ${turtle.savedRating} / 100.`, 'This saved appraisal does not update continuously or account for this race’s terrain, current Form or opponents. It is not a win chance.'),
      record: known(turtle.wins) && known(turtle.races) ? paragraphs(`${n(turtle.wins)} first-place ${turtle.wins === 1 ? 'finish' : 'finishes'} in ${n(turtle.races)} race ${turtle.races === 1 ? 'entry' : 'entries'}.`, 'Saved race record, not a forecast of its next result.') : paragraphs('Race record unavailable.', 'Counts wins and total races entered.'),
      streaks,
      growthPattern: growth.pattern && patternNotes[growth.pattern] ? paragraphs(`${growth.pattern}.`, life?.eternal ? 'This turtle does not age or progress through the pattern’s age stages.' : patternNotes[growth.pattern], factor === null ? '' : `Current age multiplier: ${multiplier(factor)}×.`) : paragraphs('Growth pattern unavailable.', 'Describes when food growth is most effective during its life.'),
      growthFactor: factor === null ? 'The food growth factor is unavailable; no multiplier can be inferred.'
        : paragraphs(`Current age multiplier: ${multiplier(factor)}×, ${factorDifference}.`, 'Scales positive and negative stat/growth changes before trust, rounding and limits. Initial meal Fullness is not scaled.'),
      growthOutlook: growth.outlook && outlookNotes[growth.outlook] ? paragraphs(`${growth.outlook}.`, life?.eternal ? 'Native growth hint. Eternal turtles do not age, so it does not predict future improvement.' : `${outlookNotes[growth.outlook]} A calculated food-growth hint, not a race prediction.`) : paragraphs('Growth outlook unavailable.', 'Hints at how food growth may change with age.'),
      growth: Object.fromEntries(Object.keys(statNames).map(key => [key, growthTip(turtle,key)])),
      lifespan,
    };
  }
  if (typeof module === 'object' && module.exports) module.exports = { turtleCardTips };
  else window.kenzanTurtleCardTips = turtleCardTips;
})();
