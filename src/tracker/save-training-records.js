(() => {
  const scarecrowCourses = Object.freeze([
    'single-formation', 'twin-formation', 'oni-formation', 'shinobi-formation',
    'single-strength-formation', 'twin-strength-formation', 'great-strength-formation',
    'enduring-strength-formation', 'enlightenment-formation', 'two-heavens-formation',
    'ultimate-formation', 'purgatory-formation',
  ]);
  const jiraiyaCourses = Object.freeze([
    'first-chamber', 'earth-chamber', 'water-chamber', 'fire-chamber',
    'wind-chamber', 'heavenly-chamber', 'ultimate-chamber',
  ]);
  const trainingRankNames = Object.freeze([null, 'Novice Ninja', 'Average Ninja', 'Elite Ninja', 'Master Ninja']);

  function readTrainingRecords(data) {
    // The caller admits the full USERDATA header. This helper also works with
    // DataViews into offset buffers; invalid/detached input is not an empty save.
    try {
      if (Object.prototype.toString.call(data) !== '[object DataView]' || data.byteLength < 0x981a) return undefined;
      const flag = state => Boolean(data.getUint32(0x190 + 0x154 * 32 + (state >>> 5) * 4, false)
        & (1 << (state & 31)));
      const scarecrow = Object.fromEntries(scarecrowCourses.map((course, index) => {
        // Completion consumer 0x2ecb60 returns the highest of four rank flags.
        // Its first table entry is Master Ninja, then Elite/Average/Novice.
        let rank = 0;
        for (let position = 0; position < 4; position++) {
          if (flag(37 + 4 * index + position)) { rank = 4 - position; break; }
        }
        const entries = Array.from({ length: 10 }, (_, place) => {
          const at = 0x9384 + 80 * index + 8 * place;
          return { ticks: data.getUint32(at, false), nameId: data.getUint32(at + 4, false), place: place + 1 };
        });
        const valid = entries.every(entry => entry.nameId <= 41);
        // Result writer 0x13fa24 inserts (elapsed 30 Hz ticks, name 0), then
        // sorts ten entries. NPC records use names 1..41. Multiple player
        // entries can remain; the shortest listed one is the personal best.
        const personal = valid ? entries.filter(entry => entry.nameId === 0 && entry.ticks > 0) : [];
        const best = personal.reduce((winner, entry) => !winner || entry.ticks < winner.ticks ? entry : winner, undefined);
        return [course, {
          rank, rankName: trainingRankNames[rank], cleared: flag(19 + index),
          status: rank ? 'recorded' : 'none',
          // The native menu formats this saved counter with a divisor of 30.
          // This mirrors its displayed time; it is not measured wall time or
          // a claim about how an FPS patch advances the gameplay clock.
          bestTimeTicks: best?.ticks ?? null, bestTime: best ? best.ticks / 30 : null,
          leaderboardPlace: best?.place ?? null,
          timeStatus: valid ? best ? 'recorded' : 'not-on-board' : 'unavailable',
        }];
      }));
      const packed = data.getUint32(0x9744, false);
      const jiraiya = Object.fromEntries(jiraiyaCourses.map((course, index) => {
        const rank = (packed >>> (8 + 3 * index)) & 7;
        const cleared = Boolean(packed & (1 << index));
        const entries = Array.from({ length: 10 }, (_, place) => {
          const at = 10 * index + place;
          const identity = data.getUint8(0x97d4 + at);
          // Native k_yabusame reader: two score bits share the name byte.
          const score = data.getUint16(0x9748 + 2 * at, false) | ((identity & 0xc0) << 10);
          return { nameId: identity & 0x3f, score, place: place + 1 };
        });
        const valid = rank <= 4 && entries.every(entry => entry.nameId <= 10);
        // Name 0 is the player. The ten NPC defaults are not personal scores.
        // This board retains only ten entries, so absence does not prove that
        // the player never played or never earned a score on this course.
        const personal = valid ? entries.filter(entry => entry.nameId === 0 && entry.score > 0) : [];
        const best = personal.reduce((winner, entry) => !winner || entry.score > winner.score ? entry : winner, undefined);
        return [course, {
          rank: valid ? rank : null, rankName: valid ? trainingRankNames[rank] : null,
          cleared, status: valid ? rank ? 'recorded' : 'none' : 'unavailable',
          score: best?.score ?? null, leaderboardPlace: best?.place ?? null,
          scoreStatus: valid ? best ? 'recorded' : 'not-on-board' : 'unavailable',
        }];
      }));
      return { scarecrow, jiraiya };
    } catch {
      return undefined;
    }
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { readTrainingRecords, trainingRankNames, scarecrowCourses, jiraiyaCourses };
  } else {
    window.readKenzanTrainingRecords = readTrainingRecords;
  }
})();
