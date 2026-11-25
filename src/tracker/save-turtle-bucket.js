(() => {
  const turtleSlotsOffset = 0x8bb4;
  const slotCount = 5;
  const recordSize = 0x3c;
  // Native rating uses maximum Stamina and Fullness and both values for Leg Power, Sand, Water, and Mud.
  const ratingFields = [0x01, 0x05, 0x06, 0x08, 0x09, 0x0b, 0x0c, 0x0e, 0x0f, 0x12];
  const growthCapFields = { stamina: 0x01, legPower: 0x06, fullness: 0x12, water: 0x0c, sand: 0x09, mud: 0x0f };
  // Native growth tables are indexed by the stored growth type and age, from youngest to oldest.
  const growthOutlooks = ['May slow', 'Likely steady', 'May improve'];
  const growthPatterns = [
    { name: 'Early Bloomer', factors: [1.5, 1.6, 1.4, 1.2, 1.1, .9, .8, .6, .4, .2], outlooks: [1, 1, 0, 0, 0, 0, 0, 0, 0, 1] },
    { name: 'Normal', factors: [.7, 1, 1.2, 1.4, 1.5, 1.4, 1.1, .95, .8, .6], outlooks: [2, 2, 2, 1, 1, 0, 1, 1, 0, 1] },
    { name: 'Late Bloomer', factors: [.8, .9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.4, 1], outlooks: [2, 2, 2, 2, 2, 2, 2, 1, 0, 1] },
    { name: 'Unpredictable', factors: [1.5, .8, 1.1, 1.3, .7, 1.1, 1.2, .9, .7, .4], outlooks: [0, 2, 2, 0, 2, 1, 0, 0, 0, 1] },
  ];
  const speciesNames = ['Chinese Pond Turtle', 'Japanese Pond Turtle', 'Miyamoto Turtle',
    'Temple Turtle', 'Farm Turtle', 'Riverbed Turtle', 'Eternal Turtle'];
  const rankNames = ['Hiramaku', 'Komusubi', 'Sekiwake', 'Ozeki', 'Yokozuna', 'Musabetsu'];
  const personalities = ['Timid', 'Normal', 'Clumsy', 'Unpredictable', 'Awful'];
  // The native bucket screen derives form from two indices in the turtle record.
  const formScores = [
    [50, 70, 90, 70, 50, 30, 20, 30, 50],
    [60, 60, 65, 70, 65, 60, 40, 40, 60],
    [50, 30, 50, 70, 50, 60, 80, 40, 30],
    [80, 70, 80, 70, 70, 50, 40, 30, 40],
  ];
  const nameDecoder = new TextDecoder('shift_jis');

  function readTurtleName(data, offset, fallback = '') {
    if (offset + 20 > data.byteLength) return fallback;
    const bytes = new Uint8Array(data.buffer, data.byteOffset + offset, 20);
    const terminator = bytes.indexOf(0);
    const name = bytes.subarray(0, terminator === -1 ? bytes.length : terminator);
    // Generated names use the Shift-JIS character 名 and a species control byte.
    if (name[0] === 0x96 && name[1] === 0xbc) {
      const speciesToken = bytes[2];
      const defaultName = fallback || speciesNames[speciesToken <= 6 ? speciesToken : 0];
      const tail = nameDecoder.decode(name.subarray(speciesToken <= 6 ? 3 : 2));
      if (tail === '') return defaultName;
      if (/^ [1-5]$/.test(tail)) return defaultName + tail;
    }
    return nameDecoder.decode(name).replace(/[\u0001-\u001f\u007f]/gu, '').trim() || fallback;
  }

  function turtleForm(score) {
    if (score === undefined) return null;
    if (score < 40) return 'Terrible';
    if (score < 50) return 'Bad';
    if (score < 60) return 'Okay';
    return score < 80 ? 'Good' : 'Excellent';
  }

  function readRaceWins(mask, raceCount) {
    const wins = [];
    for (let index = 0; index < raceCount; index++) {
      if (mask & (1 << index)) wins.push(index);
    }
    return wins;
  }

  function readGrowth(byte, life) {
    const fields = Object.entries(growthCapFields);
    const ceilings = Object.fromEntries(fields.map(([stat, field]) => [stat, byte(field + 1)]));
    const points = Object.fromEntries(fields.map(([stat, field]) =>
      [stat, Math.max(0, ceilings[stat] - byte(field))]));
    const pattern = growthPatterns[byte(0x2d)];
    if (!pattern || !life) return { ceilings, points, pattern: pattern?.name };
    // Match the game's single-precision age calculation before indexing its growth tables.
    const adjustedLife = Math.fround(life.initial * Math.fround(.05) + life.remaining);
    const band = Math.trunc(Math.fround(Math.fround(adjustedLife / life.initial) * 10));
    const age = 9 - Math.min(9, band);
    return { ceilings, points, pattern: pattern.name, factor: pattern.factors[age], outlook: growthOutlooks[pattern.outlooks[age]] };
  }

  function readTurtles(data) {
    const roster = [];
    if (data.byteLength < turtleSlotsOffset + slotCount * recordSize) return roster;
    for (let slot = 1; slot <= slotCount; slot++) {
      const offset = turtleSlotsOffset + (slot - 1) * recordSize;
      const byte = field => data.getUint8(offset + field);
      const word = field => data.getUint16(offset + field);
      // Bit 0 marks ownership. Bit 1 distinguishes the bucket from the inventory.
      const flags = word(0x38);
      if (!(flags & 1)) continue;
      const stat = field => ({ value: byte(field), max: byte(field + 1) });
      const terrainGrade = field => Math.min(2, Math.floor(byte(field) / 85));
      const speciesId = byte(0x2b);
      const species = speciesNames[speciesId] ?? null;
      const rankId = byte(0x2c);
      // Yokozuna wins survive demotion and are stored separately from current-rank wins.
      const yokozunaRaceWins = readRaceWins(flags >>> 6, 10);
      const rankRaceWins = rankId === 4 ? yokozunaRaceWins
        : readRaceWins(word(0x3a), rankId < 4 ? 10 : rankId === 5 ? 13 : 0);
      const formScore = formScores[byte(3)]?.[byte(4)];
      const initialLife = word(0x34);
      const remainingLife = word(0x36);
      const life = initialLife > 0 && remainingLife <= initialLife ? { initial: initialLife, remaining: remainingLife } : null;
      const ratingTotal = ratingFields.reduce((sum, field) => sum + byte(field), 0);
      roster.push({
        slot,
        inBucket: Boolean(flags & 2),
        name: readTurtleName(data, offset + 0x16, species ?? `Turtle ${slot}`),
        species,
        speciesId,
        rank: rankNames[rankId] ?? null,
        rankId,
        rankStars: rankId === 4 || rankNames[rankId] === undefined ? null : Math.min(rankRaceWins.length, 3),
        rankRaceWins,
        yokozunaRaceWins,
        adamantineEligible: Boolean(flags & 0x20),
        personality: personalities[byte(0x15)] ?? null,
        form: turtleForm(formScore),
        formScore,
        affinity: byte(0x14),
        recentRaceFeedBonus: Boolean(flags & 8),
        stamina: stat(0),
        legPower: stat(5),
        fullness: stat(0x11),
        terrain: { water: terrainGrade(0xb), sand: terrainGrade(8), mud: terrainGrade(0xe) },
        terrainStats: { water: stat(0xb), sand: stat(8), mud: stat(0xe) },
        calculatedRating: Math.floor(ratingTotal * 100 / (ratingFields.length * 255)),
        savedRating: byte(0x2a),
        growth: readGrowth(byte, life),
        lifespan: speciesId === 6 ? { eternal: true } : life,
        wins: word(0x32),
        races: word(0x30),
        winStreak: byte(0x2e),
        lossStreak: byte(0x2f),
      });
    }
    return roster;
  }

  if (typeof module === 'object' && module.exports) module.exports = { readTurtles, readTurtleName };
  else {
    window.readKenzanTurtles = readTurtles;
    window.readKenzanTurtleName = readTurtleName;
  }
})();
