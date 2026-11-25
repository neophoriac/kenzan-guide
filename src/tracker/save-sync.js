(() => {
  const fileSize = 0x13750;
  const systemSize = 0x33c;
  const header = [0x4c013750, fileSize, 0x80, 0x190, 0x4690, 0x47f0, 0x4814, 0x70d8,
    0x70f8, 0x7138, 0x7258, 0x72d8, 0x73d8, 0x7be8, 0x8aa4, 0x8ba8, 0x9840];
  // Cumulative experience required for levels 1–50, from the game's level table.
  const levelThresholds = [
    0, 1000, 2500, 4000, 5500, 7000, 8500, 10000, 11500, 13000,
    15000, 17000, 19000, 21300, 23800, 26800, 30300, 34300, 39300, 45300,
    52300, 61300, 71300, 83300, 98300, 115300, 134300, 155300, 178300, 203300,
    229300, 256300, 284300, 313300, 343300, 373300, 403300, 433300, 463300, 493300,
    523300, 553300, 583300, 613300, 643300, 673300, 703300, 738300, 778300, 826300,
  ];
  // Native record order, with the guide quest ID and the scenario's final-letter flag.
  const yujoRecords = [
    ['suzukaze', 2, 37], ['momochika', 3, 33], ['kinuyo', 1, 34], ['hinagiku', 4, 33],
    ['hanamaru', 5, 29], ['shirayuki', 6, 35], ['asagiri', 7, 36],
  ];
  // MINIGAMECOMMON in scenario_state.bin, in native bit order.
  const minigameIds = ['turtle-racing', 'shogi', 'mahjong', 'koi-koi', 'cho-han', 'cee-lo',
    'tokkuri', 'konpira', 'karuta', 'tosenkyo', 'yabusame', 'melon', 'waterfall', 'scarecrow', 'jiraiya', 'kabuki'];
  const minigameScoreGoals = [
    ['mahjong-50000', 0x9260, 50000],
    ['koi-koi-3', 0x9364, 20], ['koi-koi-6', 0x9368, 25], ['koi-koi-9', 0x936c, 35], ['koi-koi-12', 0x9370, 40],
    ['cho-han-200000', 0x9358, 200000, true], ['cee-lo-200000', 0x9354, 200000, true],
    ['kabuki-1000', 0x710c, 10000000, true],
  ];
  const readMinigameScore = (data, offset, signed) => signed ? data.getInt32(offset) : data.getUint32(offset);
  const yabusameCourses = ['beginner', 'intermediate', 'advanced', 'expert'];
  const readTurtleRaceResults = typeof module === 'object' && module.exports
    ? require('./save-turtle-races.js').readTurtleRaceResults : window.readKenzanTurtleRaceResults;
  const readWaterfallRecords = typeof module === 'object' && module.exports
    ? require('./save-waterfall.js').readWaterfallRecords : window.readKenzanWaterfallRecords;
  const readTrainingRecords = typeof module === 'object' && module.exports
    ? require('./save-training-records.js').readTrainingRecords : window.readKenzanTrainingRecords;
  // Chapter and the three chapter flags tested by each native rescue actor, in KAME flag order.
  const turtleRescueWindows = [
    { chapter: 1, opens: 32, closes: 36, completes: 59 },
    { chapter: 2, opens: 2, closes: 5, completes: 14 },
    { chapter: 3, opens: 6, closes: 8, completes: 23 },
    { chapter: 7, opens: 12, closes: 13, completes: 56 },
  ];

  function saveType(data, size) {
    if (size === systemSize && data.byteLength >= 4 && data.getUint32(0) === 0x0800033c) return 'system';
    if (size === fileSize && data.byteLength >= header.length * 4
      && header.every((word, index) => data.getUint32(index * 4) === word)) return 'gameplay';
    return undefined;
  }

  async function hasSaveHeader(file, expectedType) {
    if (file.size !== fileSize && file.size !== systemSize) return false;
    if (expectedType && file.size !== (expectedType === 'system' ? systemSize : fileSize)) return false;
    const prefix = await file.slice(0, file.size === systemSize ? 4 : header.length * 4).arrayBuffer();
    const type = saveType(new DataView(prefix), file.size);
    return Boolean(type && (!expectedType || type === expectedType));
  }

  function readSaveDetails(buffer, groups, storyWindows, weaponCatalogue, questMilestoneRegistry) {
    const data = new DataView(buffer);
    const type = saveType(data, data.byteLength);
    if (type === 'system') return { progress: readSystem(data) };
    if (type !== 'gameplay') {
      throw new Error('This file is not a supported Kenzan save. Choose USERDATA from your RPCS3 save slot.');
    }
    const readStory = typeof module === 'object' && module.exports ? require('./save-story.js').readStory : window.readKenzanSaveStory;
    const readTurtles = typeof module === 'object' && module.exports
      ? require('./save-turtle-bucket.js').readTurtles : window.readKenzanTurtles;
    const readWeapons = typeof module === 'object' && module.exports
      ? require('../weapons/save-weapons.js').readWeapons : window.readKenzanWeapons;
    const readCrafting = typeof module === 'object' && module.exports
      ? require('./save-crafting.js').readCrafting : window.kenzanCrafting?.readCrafting;
    const readQuestMilestones = typeof module === 'object' && module.exports
      ? require('./save-quest-milestones.js').readQuestMilestones : window.kenzanQuestMilestones?.readQuestMilestones;
    const story = storyWindows ? readStory(data, storyWindows) : undefined;
    const turtleProgress = readTurtleProgress(data, story);
    const turtleRaceResults = readTurtleRaceResults(data);
    const progress = readGameplay(data, groups, turtleRaceResults, turtleProgress.eternalLetterClaimed);
    const substories = new Set(progress.find(group => group.label === 'Substories')?.keys);
    return {
      yabusame: readYabusameScores(data),
      waterfall: readWaterfallRecords(data),
      trainingRecords: readTrainingRecords(data),
      progress, yujo: readYujo(data, substories), guidebook: readGuidebook(data, substories),
      story,
      minigames: readMinigameSummary(data, progress),
      playerLevel: readPlayerLevel(data),
      turtles: readTurtles(data),
      turtleProgress,
      turtleRaceResults,
      ...(questMilestoneRegistry ? { questMilestones: readQuestMilestones?.(data, questMilestoneRegistry, { existingProgress: progress }) } : {}),
      ...(weaponCatalogue ? { weapons: readWeapons?.(data, weaponCatalogue), crafting: readCrafting?.(data, weaponCatalogue) } : {}),
    };
  }

  function readSave(buffer, groups) {
    return readSaveDetails(buffer, groups).progress;
  }

  function readPlayerLevel(data) {
    const level = data.getUint8(0x480c);
    const totalXp = data.getUint32(0x4800);
    const threshold = levelThresholds[level - 1];
    if (threshold === undefined || totalXp > 999999) return undefined;
    const nextThreshold = levelThresholds[level];
    if (nextThreshold === undefined) return { level, totalXp };
    const needed = nextThreshold - threshold;
    const earned = Math.min(needed, Math.max(0, totalXp - threshold));
    return { level, totalXp, next: { earned, needed } };
  }

  function scenarioFlag(data, group, state) {
    return Boolean(data.getUint32(0x190 + group * 32 + (state >>> 5) * 4) & (1 << (state & 31)));
  }

  function yujoFlags(data, index) {
    return data.getUint32(0x927c + 24 * index);
  }

  function readYujo(data, completed) {
    return Object.fromEntries(yujoRecords.flatMap(([slug, quest, letterFlag], index) => {
      // The room UI reads quarter-hearts from the first two bytes of the native record.
      const offset = 0x9268 + index * 24;
      const hearts = data.getUint8(offset);
      const limit = data.getUint8(offset + 1);
      if (![40, 60, 80].includes(limit) || hearts > limit) return [];
      const flags = yujoFlags(data, index);
      const group = 0x76 + index;
      const flag = state => scenarioFlag(data, group, state);
      // Asagiri's scenario omits the date encounter with another Yūjo.
      const dateShift = slug === 'asagiri' ? 1 : 0;
      const questComplete = completed.has('kenzan-guide:done:' + quest);
      const letter = flag(letterFlag);
      return [[slug, {
        hearts: hearts / 4,
        limit: limit / 4,
        visitTier: flags & 8 ? 3 : flags & 4 ? 2 : flags & 2 ? 1 : 0,
        gamesStarted: Math.min(data.getUint8(offset + 2), 11),
        laterGameWon: Boolean(flags & 0x100),
        dateLetter: flag(16 - dateShift) || flag(17 - dateShift),
        steps: {
          visit: flag(1),
          'first-game': Boolean(flags & 0x80) || limit >= 60,
          'date-talk': Boolean(flags & 0x2000),
          date: limit === 80,
          'later-talk': Boolean(flags & 0x4000),
          'final-talk': Boolean(flags & 0x8000),
          'quest-unlocked': flag(23 - dateShift) || questComplete,
          'quest-complete': questComplete,
          letter,
        },
      }]];
    }));
  }

  function readGuidebook(data, completed) {
    const state = index => scenarioFlag(data, 0x44, index);
    const waiting = state(8);
    const canCollect = waiting && state(16);
    const reports = Object.fromEntries(yujoRecords.map(([slug, quest, letterFlag], index) => {
      const paid = state(9 + index);
      const submitted = state(1 + index);
      const letter = scenarioFlag(data, 0x76 + index, letterFlag);
      const finishedQuest = completed.has('kenzan-guide:done:' + quest);
      const stage = paid ? 'done' : submitted ? (canCollect ? 'payment' : waiting ? 'waiting' : 'submitted')
        : letter ? (waiting ? 'queued' : 'ready') : finishedQuest ? 'letter' : 'quest';
      // SUB044 records the number of correct answers in seven saved scenario counters.
      const score = data.getUint16(0x44fe + 2 * index);
      return [slug, { stage, correct: (paid || (submitted && waiting)) && score <= 4 ? score : undefined }];
    }));
    return { reports, complete: state(33) };
  }

  function readSystem(data) {
    const keys = [];
    let index = 0;
    for (const [group, count] of [['melee', 10], ['duel', 5], ['challenge', 10], ['rebirth', 4], ['ultimate', 4]]) {
      for (let course = 1; course <= count; course++, index++) {
        const rank = data?.getUint8(0x39 + index * 8);
        // Ultimate Match's all-S check uses rank 4 for every course.
        if (!data || rank === 4) keys.push('kenzan-guide:side-done:ultimate-' + group + '-' + course);
      }
    }
    return [{ label: 'Ultimate Match S ranks', keys }];
  }

  function readMailFlags(data, mailId) {
    const count = Math.min(256, data.getUint32(0x7bd8));
    for (let index = 0; index < count; index++) {
      const offset = 0x73d8 + index * 8;
      if (data.getUint32(offset + 4) === mailId) return data.getUint32(offset);
    }
    return null;
  }

  function readTurtleProgress(data, story) {
    const flag = state => scenarioFlag(data, 0x145, state);
    const mailFlags = readMailFlags(data, 97);
    const currentChapter = story?.chapter;
    const storyEnded = story?.mode === 'clear' || story?.mode === 'adventure';
    const rescues = turtleRescueWindows.map(({ chapter, opens, closes, completes }, index) => {
      const chapterFlag = state => scenarioFlag(data, chapter + 7, state);
      const passed = storyEnded || currentChapter > chapter || chapterFlag(closes) || chapterFlag(completes);
      const upcoming = currentChapter < chapter || (currentChapter === chapter && !(chapterFlag(0) && chapterFlag(opens)));
      const rescueWindow = passed ? 'missed' : upcoming ? 'upcoming' : 'open';
      return { chapter, rescued: flag(index), collected: flag(8 + index), rescueWindow };
    });
    return {
      bucketUnlocked: flag(13),
      deathPending: flag(16),
      recordedDeaths: data.getUint16(0x4520),
      woodenTags: data.getUint32(0x70fc),
      eternalLetterReceived: mailFlags !== null,
      eternalLetterClaimed: Boolean(mailFlags & 0x10000000),
      rescues,
    };
  }

  function readGameplay(data, groups, turtleRaceResults = readTurtleRaceResults(), eternalTurtleClaimedByMail = false) {
    // The game stores 256 flags per group as eight big-endian words.
    const bit = (offset, state) => !data || Boolean(data.getUint32(offset + (state >>> 5) * 4) & (1 << (state & 31)));
    const byteBit = (offset, state) => !data || Boolean(data.getUint8(offset + (state >>> 3)) & (1 << (state & 7)));
    const flag = (group, state) => !data || scenarioFlag(data, group, state);
    // The yūjo completion letter and outdoor Eternal Turtle pickup have independent claim flags.
    const progress = groups.map(({ label, offset, byteBits, checks }) => ({ label, keys: [...new Set(checks
      .filter(([key, group, state, excluding]) => !data ||
        (key === 'kenzan-atlas:collected:eternal-turtle' && eternalTurtleClaimedByMail) || (offset === undefined
        ? flag(group, state) && (excluding === undefined || !flag(group, excluding))
        : (byteBits ? byteBit : bit)(offset, state)))
      .map(([key]) => key))] }));
    progress.push(...readMinigameRecords(data, turtleRaceResults));
    // Native Yujo Completion List order; its final event flag is independent of the substory display.
    progress.push({ label: 'Yujo final events', keys: yujoRecords
      .filter((_, index) => !data || yujoFlags(data, index) & 0x20000)
      .map(([slug]) => 'kenzan-guide:side-done:yujo-final-' + slug) });
    const fighters = [];
    for (let fighter = 0; fighter < 50; fighter++) {
      // The Completion menu sums the twelve tournament win counters for each fighter.
      let wins = 0;
      if (data) for (let bracket = 0; bracket < 12; bracket++) wins += data.getInt16(0x7d14 + 24 * fighter + 2 * bracket);
      if (!data || wins & 0xffff) fighters.push('kenzan-guide:coliseum-done:fighter-' + (fighter + 1));
    }
    progress.push({ label: 'Coliseum fighters defeated', keys: fighters });
    const tournaments = [];
    for (let index = 0; index < 12; index++) {
      // Third-round victory increments this counter; entering a tournament uses a different field.
      if (!data || data.getUint16(0x7c30 + 2 * index)) {
        tournaments.push('kenzan-guide:coliseum-done:tournament-' + String.fromCharCode(65 + index));
      }
    }
    progress.push({ label: 'Coliseum tournaments won', keys: tournaments });
    const adventure = flag(1, 13);
    const collected = [];
    const opened = [];
    for (let index = 0; index < 50; index++) {
      // The English patch letters the locker columns in reverse native order.
      const code = String.fromCharCode(74 - Math.floor(index / 5)) + '-' + (index % 5 + 1);
      if (flag(0xc0, index + 1)) {
        const suffix = index === 0 ? (adventure ? '-tour' : '-story') : '';
        collected.push('kenzan-atlas:collected:locker-key:' + code + suffix);
      }
      // The coin locker menu uses a separate MSB-first bitset for opened lockers.
      if (!data || data.getUint8(0x8b24 + (index >>> 3)) & (0x80 >>> (index & 7))) {
        opened.push('kenzan-guide:side-done:locker-opened-' + code);
      }
    }
    return [...progress, { label: 'Locker keys collected', keys: collected }, { label: 'Lockers opened', keys: opened }];
  }

  function readMinigameRecords(data, turtleRaceResults) {
    // These are the saved scores and packed course ranks read by Kenzan's Completion menu.
    const scores = minigameScoreGoals.filter(([, offset, threshold, signed]) =>
      !data || readMinigameScore(data, offset, signed) >= threshold)
      .map(([key]) => 'kenzan-guide:side-done:minigame-' + key);
    const jiraiyaCourses = ['first-chamber', 'earth-chamber', 'water-chamber', 'fire-chamber', 'wind-chamber', 'heavenly-chamber', 'ultimate-chamber'];
    const jiraiya = data?.getUint32(0x9744);
    const courses = [
      ['yabusame', yabusameCourses, data?.getUint16(0x8baa), 0, [5, 6, 7]],
      ['waterfall', ['red-spirit', 'white-spirit', 'black-spirit', 'blue-spirit', 'yellow-spirit'], data?.getUint16(0x9328), 0, [4]],
      ['melon', ['foundational', 'applied', 'advanced', 'boar-scroll', 'snake-scroll', 'asura-scroll'], data?.getUint32(0x9334), 0, [5, 6]],
      ['jiraiya', jiraiyaCourses, jiraiya, 8, [4]],
    ];
    const mastery = courses.flatMap(([group, entries, packed, shift, ranks]) =>
      entries.flatMap((entry, index) => !data || ranks.includes((packed >>> (shift + 3 * index)) & 7)
        ? ['kenzan-guide:side-done:mastery-' + group + '-' + entry] : []));
    const jiraiyaClears = jiraiyaCourses.flatMap((entry, index) => !data || jiraiya & (1 << index)
      ? ['kenzan-guide:training-done:jiraiya-' + entry] : []);
    const races = turtleRaceResults.map(({ id }) => 'kenzan-guide:side-done:' + id);
    return [
      { label: 'Minigame score goals', keys: scores }, { label: 'Training mastery ranks', keys: mastery },
      { label: 'Jiraiya first clears', keys: jiraiyaClears }, { label: 'Turtle Racing wins', keys: races },
    ];
  }

  function readMinigameSummary(data, progress) {
    const keys = label => (progress.find(group => group.label === label)?.keys ?? [])
      .map(key => key.replace(/^kenzan-guide:side-done:/, ''));
    const count = (entries, prefix) => entries.filter(key => key.startsWith(prefix)).length;
    const shogi = keys('Shogi');
    const mastery = [...keys('Training mastery ranks'), ...keys('Training mastery')];
    const victories = keys('Parlor game wins');
    return {
      attempted: Object.fromEntries(minigameIds.map((id, index) => [id, scenarioFlag(data, 0x153, index)])),
      scores: Object.fromEntries(minigameScoreGoals.map(([id, offset, , signed]) => [id, readMinigameScore(data, offset, signed)])),
      turtleRacesWon: keys('Turtle Racing wins').length,
      shogiChallengesWon: count(shogi, 'shogi-challenge-'),
      shogiKing: shogi.includes('shogi-rank-21'),
      victories,
      mastered: Object.fromEntries(['yabusame', 'melon', 'waterfall', 'scarecrow', 'jiraiya']
        .map(id => [id, count(mastery, 'mastery-' + id + '-')])),
    };
  }

  function readYabusameScores(data) {
    // Four big-endian best scores follow the packed ranks in the Yabusame record.
    return Object.fromEntries(yabusameCourses.map((course, index) => [course, data.getUint16(0x8bac + 2 * index)]));
  }

  function supportedKeys(groups) {
    return new Set([
      ...readGameplay(null, groups).flatMap(({ keys }) => keys),
      ...readSystem(null).flatMap(({ keys }) => keys),
      'kenzan-atlas:collected:locker-key:J-1-story',
    ]);
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { readSave, readSaveDetails, supportedKeys, hasSaveHeader };
    return;
  }

  const collectiblePrefix = 'kenzan-atlas:collected:';
  const pickupAnswerPrefix = 'kenzan-guide:pickup-answer:';
  const lastSyncKey = 'kenzan-guide:last-save-sync';
  const syncTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
  const xpFormat = new Intl.NumberFormat();
  let service;

  function pendingKeys(progress) {
    return [...new Set(progress.flatMap(({ keys }) => keys))].filter(key => window.kenzanStorage.getItem(key) !== '1');
  }

  function addCheckmarks(progress) {
    let added = 0;
    try {
      for (const key of pendingKeys(progress)) {
        window.kenzanStorage.setItem(key, '1');
        added++;
      }
      return added;
    } finally {
      if (added) window.dispatchEvent(new StorageEvent('storage', { key: null }));
    }
  }

  function createSaveSync(groups, storyWindows, weaponCatalogue, questMilestoneRegistry) {
    // Only the subscription references the guide. Unmounting it leaves auto-sync running.
    const stories = new Map();
    let lastSync = readLastSync();
    let folderConnection;
    // Personal weapon data stays in this tab. Disconnecting the watched folder
    // keeps its last dated snapshot available until another gameplay save is read.
    let weaponLatest;
    let render;

    function updateView() {
      if (render) render({ latest: [...stories.values()].at(-1), weaponLatest, lastSync, folderConnection });
    }

    function recordSync() {
      lastSync = new Date();
      try {
        window.kenzanStorage.setItem(lastSyncKey, lastSync.toISOString());
      } catch {
        // Keep the timestamp in memory if it can't be saved.
      }
      updateView();
    }

    function showStory(key, source, snapshot) {
      stories.delete(key);
      const observedAt = snapshot?.story || snapshot?.weapons || snapshot?.crafting || snapshot?.questMilestones ? new Date().toISOString() : undefined;
      if (snapshot?.weapons || snapshot?.crafting || snapshot?.questMilestones) weaponLatest = {
        weapons: snapshot.weapons, crafting: snapshot.crafting, questMilestones: snapshot.questMilestones, source, observedAt,
      };
      if (snapshot?.story) {
        const acquired = new Set(snapshot.progress.find(group => group.label === 'Weapons acquired')?.keys);
        stories.set(key, {
          story: snapshot.story, yujo: snapshot.yujo, guidebook: snapshot.guidebook, source, kind: key, observedAt, acquired,
          yabusame: snapshot.yabusame,
          waterfall: snapshot.waterfall,
          trainingRecords: snapshot.trainingRecords,
          minigames: snapshot.minigames,
          playerLevel: snapshot.playerLevel,
          turtles: snapshot.turtles,
          turtleProgress: snapshot.turtleProgress,
          turtleRaceResults: snapshot.turtleRaceResults,
          weapons: snapshot.weapons,
          crafting: snapshot.crafting,
          questMilestones: snapshot.questMilestones,
        });
        window.kenzanStoryFollow.observe(snapshot.story, key);
      } else if (!snapshot) {
        window.kenzanStoryFollow.unavailable(key);
      }
      updateView();
    }

    const parse = buffer => readSaveDetails(buffer, groups, storyWindows, weaponCatalogue, questMilestoneRegistry);
    const folder = window.initSaveFolderSync({ parse, hasSaveHeader, add: addCheckmarks,
      showStory: (source, snapshot) => showStory('folder', source, snapshot),
      showFolderConnection(connection) {
        if (folderConnection === connection) return;
        folderConnection = connection;
        if (connection === 'disconnected' || connection === 'unconnected') {
          window.kenzanStoryFollow.unavailable('folder', connection === 'disconnected' ? 'disconnected' : 'save');
        }
        updateView();
      },
      recordSync,
    });
    window.addEventListener('storage', ({ key }) => {
      if (key !== lastSyncKey) return;
      lastSync = readLastSync();
      updateView();
    });
    return { folder, parse, showStory, recordSync,
      subscribe(listener) {
        render = listener;
        updateView();
        return () => { if (render === listener) render = undefined; };
      },
    };
  }

  function yujoProgressView() {
    const empty = document.querySelector('[data-yujo-progress-empty]');
    const profiles = [...document.querySelectorAll('[data-yujo-progress]')].map(panel => ({
      panel,
      savedProgress: panel.querySelector('.yujo-saved-progress'),
      hearts: panel.querySelector('[data-yujo-hearts]'),
      icons: [...panel.querySelectorAll('[data-yujo-heart]')],
      details: panel.querySelector('[data-yujo-record]'),
      steps: [...panel.querySelectorAll('[data-yujo-step]')],
    }));
    let displayed;
    return snapshot => {
      if (displayed === snapshot) return;
      displayed = snapshot;
      const records = snapshot?.yujo;
      empty.hidden = Boolean(records && Object.keys(records).length);
      for (const { panel, savedProgress, hearts, icons, details, steps } of profiles) {
        const record = records?.[panel.dataset.yujoProgress];
        savedProgress.hidden = !record;
        if (!record) continue;
        hearts.textContent = `${record.hearts} / ${record.limit} hearts`;
        for (const [index, icon] of icons.entries()) {
          const fill = Math.min(Math.max(record.hearts - index, 0), 1);
          icon.style.setProperty('--heart-fill', fill * 100 + '%');
          icon.toggleAttribute('data-locked', index >= record.limit);
        }
        const games = record.gamesStarted === 11 ? '11+' : String(record.gamesStarted);
        details.textContent = [
          snapshot.source,
          [null, 'First visit', 'Second visit', 'Third visit or later'][record.visitTier],
          `${games} parlor ${games === '1' ? 'game' : 'games'} started`,
          record.dateLetter && !record.steps.date && 'Date invitation received',
          record.laterGameWon && 'Later parlor game won',
        ].filter(Boolean).join(' · ');
        const next = steps.find(step => !record.steps[step.dataset.yujoStep]);
        for (const step of steps) {
          const done = record.steps[step.dataset.yujoStep];
          step.dataset.status = done ? 'done' : step === next ? 'next' : 'pending';
          if (step === next) step.setAttribute('aria-current', 'step');
          else step.removeAttribute('aria-current');
          step.querySelector('[data-yujo-step-state]').textContent = done ? 'Done' : step === next ? 'Next' : 'Pending';
        }
      }
    };
  }

  function minigameProgressView() {
    const prompt = document.querySelector('[data-minigame-save-prompt]');
    const source = document.querySelector('[data-minigame-save-source]');
    const attempts = [...document.querySelectorAll('[data-minigame-attempt]')];
    const results = [...document.querySelectorAll('[data-minigame-result]')];
    const wins = [...document.querySelectorAll('[data-minigame-victory]')];
    let displayed;
    return snapshot => {
      const record = snapshot?.minigames;
      if (displayed === record) return;
      displayed = record;
      prompt.hidden = Boolean(record);
      source.hidden = !record;
      source.textContent = record ? 'Gameplay save · ' + snapshot.source : '';
      for (const cell of attempts) {
        cell.textContent = record ? record.attempted[cell.dataset.minigameAttempt] ? 'Attempted' : 'Not attempted' : '—';
      }
      const victories = new Set(record?.victories);
      for (const cell of wins) {
        cell.textContent = record ? victories.has(cell.dataset.minigameVictory) ? 'Victory' : 'No victory' : '—';
      }
      const entries = {};
      if (record) {
        const { scores, attempted, mastered } = record;
        const points = value => value.toLocaleString('en') + ' points';
        const earnings = scores['kabuki-1000'];
        const mon = Math.abs(earnings) % 10000;
        const payout = `${earnings < 0 ? '−' : ''}${Math.floor(Math.abs(earnings) / 10000).toLocaleString('en')} ryō`
          + (mon ? ` ${mon.toLocaleString('en')} mon` : '');
        Object.assign(entries, {
          'turtle-racing': `${record.turtleRacesWon} of 63 races won`,
          shogi: `${record.shogiChallengesWon} of 11 challenges won · ${record.shogiKing ? 'Shogi King' : 'Seio victory pending'}`,
          mahjong: attempted.mahjong ? points(scores['mahjong-50000']) : '—',
          'koi-koi': attempted['koi-koi'] ? [3, 6, 9, 12].map(rounds =>
            `${rounds} rounds · ${points(scores['koi-koi-' + rounds])}`).join(' / ') : '—',
          'cho-han': attempted['cho-han'] ? points(scores['cho-han-200000']) : '—',
          'cee-lo': attempted['cee-lo'] ? points(scores['cee-lo-200000']) : '—',
          kabuki: attempted.kabuki ? payout : '—',
        });
        for (const [game, total] of [['yabusame', 4], ['melon', 6], ['waterfall', 5], ['scarecrow', 12], ['jiraiya', 7]]) {
          entries[game] = `${mastered[game]} of ${total} mastery targets met`;
        }
        for (const game of ['tokkuri', 'konpira', 'karuta', 'tosenkyo']) {
          entries[game] = `${record.victories.filter(key => key.startsWith('minigame-' + game + '-')).length} of 4 opponents beaten`;
        }
      }
      for (const cell of results) cell.textContent = entries[cell.dataset.minigameResult] ?? '—';
    };
  }

  function mountTurtleStatTips(section, signal) {
    const tooltip = section.querySelector('[data-turtle-stat-callout]');
    document.body.append(tooltip);
    const options = { signal };
    let anchor;
    let pinned = false;
    let dismissTimer;
    const trigger = target => target.closest?.('[data-turtle-stat-tip]');
    const contains = (element, target) => target instanceof Node && element?.contains(target);
    const inside = target => contains(anchor, target) || contains(tooltip, target);

    function hide() {
      clearTimeout(dismissTimer);
      tooltip.hidden = true;
      anchor = undefined;
      pinned = false;
    }

    function position() {
      if (!anchor) return;
      const bounds = anchor.getBoundingClientRect();
      const visualViewport = window.visualViewport;
      const viewportLeft = visualViewport?.offsetLeft ?? 0;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportWidth = visualViewport?.width ?? document.documentElement.clientWidth;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      if (!bounds.width || !bounds.height || bounds.right <= viewportLeft || bounds.left >= viewportLeft + viewportWidth
        || bounds.bottom <= viewportTop || bounds.top >= viewportTop + viewportHeight) {
        hide();
        return;
      }
      tooltip.style.maxHeight = Math.max(0, Math.min(560, viewportHeight - 16)) + 'px';
      tooltip.style.maxWidth = Math.max(0, viewportWidth - 16) + 'px';
      const width = tooltip.offsetWidth;
      let height = tooltip.offsetHeight;
      const left = bounds.left + (bounds.width - width) / 2;
      const aboveRoom = Math.max(0, bounds.top - viewportTop - 14);
      const belowRoom = Math.max(0, viewportTop + viewportHeight - bounds.bottom - 14);
      const placeAbove = height <= aboveRoom || (height > belowRoom && aboveRoom >= belowRoom);
      // Keep the stat button reachable even in a short landscape viewport.
      // The callout scrolls within the larger free side instead of covering it.
      const room = placeAbove ? aboveRoom : belowRoom;
      if (height > room) {
        tooltip.style.maxHeight = room + 'px';
        height = tooltip.offsetHeight;
      }
      const top = placeAbove ? bounds.top - height - 6 : bounds.bottom + 6;
      tooltip.style.left = Math.max(viewportLeft + 8, Math.min(left, viewportLeft + viewportWidth - width - 8)) + 'px';
      tooltip.style.top = Math.max(viewportTop + 8, Math.min(top, viewportTop + viewportHeight - height - 8)) + 'px';
    }

    function show(button, pin = false) {
      clearTimeout(dismissTimer);
      pinned = pin || (anchor === button && pinned);
      anchor = button;
      const parts = button.dataset.turtleStatTip.split('\n\n').map(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
      });
      tooltip.replaceChildren(...parts);
      tooltip.scrollTop = 0;
      tooltip.hidden = false;
      position();
    }

    section.addEventListener('pointerover', event => {
      if (event.pointerType === 'touch') return;
      const button = trigger(event.target);
      if (button && !contains(button, event.relatedTarget)) show(button);
      else if (inside(event.target)) clearTimeout(dismissTimer);
    }, options);
    function scheduleDismiss(event) {
      if (anchor && !pinned && inside(event.target) && !inside(event.relatedTarget) && !anchor.matches(':focus-visible')) {
        clearTimeout(dismissTimer);
        dismissTimer = setTimeout(hide, 220);
      }
    }
    section.addEventListener('pointerout', scheduleDismiss, options);
    tooltip.addEventListener('pointerenter', () => clearTimeout(dismissTimer), options);
    tooltip.addEventListener('pointerleave', scheduleDismiss, options);
    section.addEventListener('focusin', event => {
      const button = trigger(event.target);
      if (button?.matches(':focus-visible')) show(button);
    }, options);
    section.addEventListener('focusout', event => {
      if (event.target === anchor) hide();
    }, options);
    section.addEventListener('click', event => {
      const button = trigger(event.target);
      if (!button) return;
      if (button === anchor && pinned) hide();
      else show(button, true);
    }, options);
    document.addEventListener('pointerdown', event => {
      if (anchor && !inside(event.target)) hide();
    }, options);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && anchor) hide();
    }, options);
    window.addEventListener('scroll', position, { capture: true, signal });
    window.addEventListener('resize', position, options);
    window.visualViewport?.addEventListener('resize', position, options);
    window.visualViewport?.addEventListener('scroll', position, options);
    signal.addEventListener('abort', () => {
      hide();
      tooltip.remove();
    }, { once: true });
    return hide;
  }

  function turtleRosterView(signal) {
    const section = document.querySelector('#my-turtles');
    const prompt = section.querySelector('[data-turtle-sync]');
    const status = section.querySelector('[data-turtle-status]');
    const roster = section.querySelector('[data-turtle-roster]');
    const template = section.querySelector('#turtle-card-template');
    const hideStatTip = mountTurtleStatTips(section, signal);
    // Race tables remove their rows while closed. Capture titles before they detach.
    const raceTitles = new Map([...document.querySelectorAll('#minigame-turtle-racing tr[id^="turtle-race-"] > th[scope="row"]')]
      .map(header => [header.parentElement.id, header.textContent.trim()]));
    const raceRanks = ['h', 'k', 's', 'o', 'y', 'm'];
    const terrainGrades = ['Low', 'Medium', 'High'];
    const lifePercent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
    let displayed;

    return snapshot => {
      if (displayed === snapshot) return;
      displayed = snapshot;
      hideStatTip();
      const turtles = snapshot?.turtles;
      prompt.hidden = Boolean(snapshot);
      roster.hidden = !turtles?.length;
      status.hidden = !snapshot || !roster.hidden;
      status.textContent = status.hidden ? '' : turtles ? 'You have no turtles in this save.'
        : 'The guide couldn’t read your turtles from this save.';
      roster.replaceChildren(...(turtles ?? []).map(turtle => {
        const card = template.content.firstElementChild.cloneNode(true);
        card.dataset.turtleSlot = turtle.slot;
        if (turtle.species) card.dataset.turtleSpeciesId = turtle.speciesId;
        const hearts = card.querySelector('[data-turtle-affinity]');
        const tips = window.kenzanTurtleCardTips(turtle);
        const setTip = (button, message) => { button.dataset.turtleStatTip = message; };
        const valueTip = (field, message) => setTip(card.querySelector(`[data-turtle-${field}]`)
          .closest('dd').previousElementSibling.querySelector('button'), message);
        setTip(hearts, tips.trust);
        setTip(card.querySelector('[data-turtle-feed-bonus]'), tips.feedBonus);
        for (const field of ['rank', 'form', 'personality', 'rating', 'record']) valueTip(field, tips[field]);
        for (const [field, key] of [['growth-pattern', 'growthPattern'], ['growth-rate', 'growthFactor'], ['growth-outlook', 'growthOutlook']]) valueTip(field, tips[key]);
        setTip(card.querySelector('[data-turtle-streaks]').previousElementSibling, tips.streaks);
        setTip(card.querySelector('[data-turtle-lifespan]').previousElementSibling, tips.lifespan);
        for (const row of card.querySelectorAll('[data-turtle-stat]')) setTip(row.querySelector('button'), tips[row.dataset.turtleStat]);
        for (const value of card.querySelectorAll('[data-turtle-growth-points]')) setTip(value.closest('dd').previousElementSibling.querySelector('button'), tips.growth[value.dataset.turtleGrowthPoints]);
        for (const button of card.querySelectorAll('[data-turtle-terrain-tip]')) {
          setTip(button, tips[button.dataset.turtleTerrainTip]);
        }
        card.querySelector('[data-turtle-feed-bonus]').hidden = !turtle.recentRaceFeedBonus;
        card.querySelector('[data-turtle-affinity-warning]').hidden = turtle.affinity !== 0;
        for (const [index, button] of [...card.querySelectorAll('[data-turtle-stat-tip]')].entries()) {
          const description = document.createElement('span');
          description.id = `turtle-stat-tip-${turtle.slot}-${index}`;
          description.hidden = true;
          description.textContent = button.dataset.turtleStatTip;
          button.setAttribute('aria-describedby', description.id);
          button.after(description);
        }
        const text = (field, value) => { card.querySelector('[data-turtle-' + field + ']').textContent = value ?? '—'; };
        text('name', turtle.name);
        text('species', turtle.species);
        text('location', turtle.inBucket ? 'In bucket' : 'Carried');
        text('form', turtle.form);
        text('personality', turtle.personality);
        text('rank', turtle.rank);
        text('rating', turtle.savedRating ? `${turtle.savedRating} / 100` : 'Unevaluated');
        text('calculated-rating', `${turtle.calculatedRating} / 100`);
        const { growth, lifespan } = turtle;
        text('growth-pattern', growth.pattern);
        text('growth-rate', growth.factor === undefined ? null : `${growth.factor}×`);
        text('growth-outlook', growth.outlook);
        for (const value of card.querySelectorAll('[data-turtle-growth-points]')) {
          value.textContent = '+' + growth.points[value.dataset.turtleGrowthPoints];
        }
        for (const value of card.querySelectorAll('[data-turtle-growth-ceiling]')) {
          value.textContent = growth.ceilings[value.dataset.turtleGrowthCeiling];
        }
        let lifeStage;
        let lifeUnits;
        if (lifespan?.eternal) {
          text('lifespan', 'Doesn’t age');
        } else if (lifespan) {
          const { remaining, initial } = lifespan;
          text('lifespan', `${lifePercent.format(remaining / initial)} remaining`);
          lifeUnits = `${remaining} / ${initial} life units`;
          if (remaining > 0) {
            lifeStage = remaining * 4 < initial ? 'Nearing the end of its life'
              : remaining * 4 > initial * 3 ? 'Young and lively' : 'Still full of energy';
          }
        } else {
          text('lifespan', null);
        }
        text('life-units', lifeUnits);
        card.querySelector('[data-turtle-life-units]').hidden = !lifeUnits;
        text('life-stage', lifeStage);
        card.querySelector('[data-turtle-life-stage]').hidden = !lifeStage;
        card.querySelector('[data-turtle-life-warning]').hidden = lifespan?.remaining !== 0;
        text('record', `${turtle.wins} wins / ${turtle.races} races`);
        text('streaks', `${turtle.winStreak}W · ${turtle.lossStreak}L`);
        const stars = card.querySelector('[data-turtle-rank-stars]');
        stars.hidden = turtle.rankStars === null;
        if (!stars.hidden) {
          stars.textContent = '★'.repeat(turtle.rankStars) + '☆'.repeat(3 - turtle.rankStars);
          stars.setAttribute('aria-label', `${turtle.rankStars} of 3 rank stars`);
        }
        const wins = turtle.rankRaceWins.map(index => {
          const id = 'turtle-race-' + raceRanks[turtle.rankId] + String(index).padStart(2, '0');
          return raceTitles.get(id);
        }).filter(Boolean);
        if (wins.length) {
          card.querySelector('[data-turtle-rank-races]').hidden = false;
          text('rank-win-count', `${wins.length} event ${wins.length === 1 ? 'win' : 'wins'}`);
          card.querySelector('[data-turtle-rank-win-list]').append(...wins.map(title => {
            const item = document.createElement('li');
            item.textContent = title;
            return item;
          }));
        }
        // The game rounds the remaining affinity up to one of four heart glyphs.
        const remainder = turtle.affinity % 51;
        const amount = Math.floor(turtle.affinity / 51) + (remainder ? (Math.floor(remainder / 13) + 1) / 4 : 0);
        hearts.setAttribute('aria-label', `Affinity ${amount} of 5 hearts`);
        [...hearts.children].forEach((icon, index) => {
          const fill = Math.min(1, Math.max(0, amount - index));
          icon.style.setProperty('--heart-fill', `${fill * 100}%`);
        });
        for (const row of card.querySelectorAll('[data-turtle-stat]')) {
          const { value, max } = turtle[row.dataset.turtleStat];
          const meter = row.querySelector('meter');
          meter.hidden = max === 0;
          meter.max = max || 1;
          meter.value = value;
          meter.style.inlineSize = `${max / 255 * 100}%`;
          row.querySelector('[data-turtle-stat-value]').textContent = `${value} / ${max}`;
        }
        for (const cell of card.querySelectorAll('[data-turtle-terrain]')) {
          cell.textContent = terrainGrades[turtle.terrain[cell.dataset.turtleTerrain]] ?? '—';
        }
        return card;
      }));
    };
  }

  function guidebookProgressView() {
    const empty = document.querySelector('[data-guidebook-no-save]');
    const panel = document.querySelector('[data-guidebook-saved]');
    const count = panel.querySelector('[data-guidebook-count]');
    const source = panel.querySelector('[data-guidebook-source]');
    const bar = panel.querySelector('progress');
    const milestones = [...panel.querySelectorAll('[data-guidebook-yujo]')];
    const labels = {
      quest: 'Finish her request', letter: 'Collect her final letter', ready: 'Ready to report', queued: 'Ready after payment',
      submitted: 'Interview recorded', waiting: 'Leave and return', payment: 'Collect payment', done: 'Payment collected',
    };
    let displayed;
    return snapshot => {
      if (displayed === snapshot) return;
      displayed = snapshot;
      const record = snapshot?.guidebook;
      empty.hidden = Boolean(record);
      panel.hidden = !record;
      if (!record) return;
      const paid = Object.values(record.reports).filter(({ stage }) => stage === 'done').length;
      bar.value = paid;
      bar.setAttribute('aria-valuetext', `${paid} of ${bar.max} reports paid`);
      const finish = record.complete ? ' · Substory complete' : paid === bar.max ? ' · Speak to the author to finish' : '';
      count.textContent = `${paid} of ${bar.max} reports paid${finish}`;
      source.textContent = '· ' + snapshot.source;
      for (const item of milestones) {
        const { stage, correct } = record.reports[item.dataset.guidebookYujo];
        item.dataset.status = stage === 'done' ? 'done' : ['ready', 'payment', 'waiting'].includes(stage) ? 'ready' : 'pending';
        item.querySelector('[data-guidebook-stage]').textContent = labels[stage];
        const score = item.querySelector('[data-guidebook-score]');
        score.hidden = correct === undefined;
        if (correct !== undefined) {
          const reward = correct === 4 ? '10,000' : correct >= 2 ? '5,000' : '500';
          score.textContent = `${correct}/4 correct · ${reward} mon`;
        }
      }
    };
  }

  function turtleProgressView(section) {
    const bucket = section.querySelector('[data-turtle-bucket-status]');
    const tags = section.querySelector('[data-turtle-tag-balance]');
    const replacements = section.querySelector('[data-turtle-replacements]');
    const deaths = replacements.querySelector('[data-turtle-death-count]');
    const deathLabel = replacements.querySelector('[data-turtle-death-label]');
    const pending = replacements.querySelector('[data-turtle-death-pending]');
    const rewardMail = section.querySelector('[data-turtle-reward-mail]');
    const milestones = [...replacements.querySelectorAll('[data-turtle-replacement]')];
    const numbers = new Intl.NumberFormat();
    let displayed;
    return snapshot => {
      const progress = snapshot?.turtleProgress;
      if (progress === displayed) return;
      displayed = progress;
      for (const element of [bucket, tags, replacements, rewardMail]) element.hidden = !progress;
      if (!progress) return;
      const { bucketUnlocked, deathPending, recordedDeaths, woodenTags, eternalLetterReceived, eternalLetterClaimed, rescues } = progress;
      bucket.textContent = bucketUnlocked ? 'Bucket unlocked' : 'Bucket needed';
      bucket.dataset.ready = String(bucketUnlocked);
      tags.textContent = `${numbers.format(woodenTags)} wooden tags`;
      deaths.textContent = numbers.format(recordedDeaths);
      deathLabel.textContent = recordedDeaths === 1 ? 'recorded death' : 'recorded deaths';
      pending.hidden = !deathPending;
      rewardMail.textContent = eternalLetterReceived
        ? eternalLetterClaimed ? 'Yujo Complete letter received' : 'Yujo Complete letter received · Check your mail'
        : 'Yujo Complete letter pending';
      rewardMail.dataset.ready = String(eternalLetterReceived);
      const hasSpace = snapshot.turtles.length < 5;
      milestones.forEach((milestone, index) => {
        const { chapter, rescued, collected, rescueWindow } = rescues[index];
        const remaining = Math.max(0, index + 1 - recordedDeaths);
        const ready = rescued && bucketUnlocked && remaining === 0 && hasSpace;
        milestone.dataset.stage = collected ? 'collected' : ready ? 'available' : !rescued && rescueWindow === 'missed' ? 'missed' : 'waiting';
        milestone.querySelector('[data-turtle-replacement-status]').textContent = collected ? 'Collected'
          : !rescued ? ({ missed: 'Missed it', upcoming: `Upcoming · Chapter ${chapter}`, open: 'Rescue needed' })[rescueWindow]
          : !bucketUnlocked ? 'Bucket needed'
          : remaining === 1 && deathPending ? 'Record the pending death'
          : remaining ? `${remaining} more ${remaining === 1 ? 'death' : 'deaths'}`
          : !hasSpace ? 'Free a turtle slot' : 'Ready at Tatsuya';
      });
    };
  }

  function mountSaveSync(signal, viewState, mountTurtleRacePlanner, updateWeaponSave) {
    const section = document.querySelector('#save-sync');
    const groups = JSON.parse(document.querySelector('#save-sync-data').textContent);
    const storyWindows = JSON.parse(document.querySelector('#save-story-data').textContent);
    const weaponData = document.querySelector('#weapon-save-data');
    const weaponCatalogue = weaponData ? JSON.parse(weaponData.textContent) : undefined;
    const questMilestoneData = document.querySelector('#quest-milestones-data');
    const questMilestoneRegistry = questMilestoneData ? JSON.parse(questMilestoneData.textContent) : undefined;
    const follower = window.kenzanStoryFollow;
    follower.configure(JSON.parse(document.querySelector('#story-data').textContent).checkpoints);
    service ??= createSaveSync(groups, storyWindows, weaponCatalogue, questMilestoneRegistry);
    const { parse, showStory, recordSync } = service;
    const checkpoints = JSON.parse(document.querySelector('#story-data').textContent).checkpoints;
    const objective = document.querySelector('#story-objective');
    const storyBadge = document.querySelector('#save-story-badge');
    const storyChapter = storyBadge.querySelector('#save-story-chapter');
    const storyActions = storyBadge.querySelector('.save-story-actions');
    const storyMeta = storyBadge.querySelector('.save-story-meta');
    const storyConnection = storyBadge.querySelector('#save-story-connection');
    const storySeparator = storyBadge.querySelector('.save-story-separator');
    const storyTime = storyBadge.querySelector('#save-story-time');
    const storyLastSync = storyBadge.querySelector('#save-story-last-sync');
    const lastSyncTime = storyLastSync.querySelector('time');
    const levelInfo = storyBadge.querySelector('#save-player-level');
    const levelNumber = levelInfo.querySelector('strong');
    const xpBar = levelInfo.querySelector('progress');
    const xpStatus = levelInfo.querySelector('#save-player-xp');
    const useStory = storyBadge.querySelector('#save-story-use');
    const followStatus = storyBadge.querySelector('#save-story-follow-status');
    const filterFollowStatus = document.querySelector('#story-follow-help');
    const reconnectStory = storyBadge.querySelector('#save-story-reconnect');
    const pickupReview = document.querySelector('#story-pickup-review');
    const pickupReviewError = pickupReview.querySelector('[data-review-error]');
    const pickupRows = [...pickupReview.querySelectorAll('[data-review-pickup]')];
    const pickupRowsById = new Map(pickupRows.map(row => [row.dataset.reviewPickup, row]));
    const pickupAnswers = pickupReview.querySelector('[data-review-answers]');
    const pickupAnswersSummary = pickupAnswers.querySelector('[data-review-answers-summary]');
    const pickupAnswerRows = new Map([...pickupAnswers.querySelectorAll('[data-review-answer]')]
      .map(row => [row.dataset.reviewAnswer, row]));
    const pickupReviewStatus = pickupReview.querySelector('[data-review-status]');
    const expandPickupReview = pickupReview.querySelector('[data-review-expand]');
    const session = viewState.saveSync ??= { reviewed: [], status: '' };
    const picker = section.querySelector('#save-sync-file');
    const choose = section.querySelector('#save-sync-choose');
    const apply = section.querySelector('#save-sync-apply');
    const review = section.querySelector('#save-sync-review');
    const ps3Folder = section.querySelector('#save-ps3-folder');
    const ps3Zip = section.querySelector('#save-ps3-zip');
    const status = section.querySelector('#save-sync-status');
    const preview = section.querySelector('#save-sync-preview');
    // Keep references when closed checklist tables detach their bodies.
    const yabusameScoreHelp = document.querySelector('[data-yabusame-score-help]');
    const yabusameScores = [...document.querySelectorAll('[data-yabusame-score]')];
    const updateWaterfall = window.mountKenzanWaterfallScores();
    const updateTrainingRecords = window.mountKenzanTrainingRecords();
    const updateYujo = yujoProgressView();
    const updateGuidebook = guidebookProgressView();
    const updateMinigames = minigameProgressView();
    const updateTurtles = turtleRosterView(signal);
    const turtleSection = document.querySelector('#minigame-turtle-racing');
    const updateTurtleProgress = turtleProgressView(turtleSection);
    const updateTurtleRaces = window.kenzanTurtleRaceView(turtleSection);
    const updateTurtleRacePlanner = mountTurtleRacePlanner(turtleSection, signal);
    let reviewed = session.reviewed;
    let readId = 0;
    let manualRead;
    signal.addEventListener('abort', () => manualRead?.abort(), { once: true });
    let latestStory;
    let savedWindow;
    const options = { signal };

    function setStatus(message, keep = true) {
      session.status = keep ? message : '';
      status.textContent = message;
      review.hidden = !message && !reviewed.length;
    }

    function refreshStoryAction() {
      const { enabled } = follower.state();
      useStory.hidden = !savedWindow && !enabled;
      useStory.disabled = false;
      const label = enabled ? 'Stop following' : 'Use & follow';
      if (useStory.textContent !== label) useStory.textContent = label;
      useStory.setAttribute('aria-label', enabled ? 'Stop automatically updating the story filter' : 'Use this checkpoint and follow save updates');
      useStory.title = enabled ? 'Keep this filter and stop automatic updates' : 'Use this checkpoint and follow each save read';
      if (enabled) {
        storyBadge.hidden = false;
        storyActions.hidden = false;
      }
    }

    function refreshStoryFollowing() {
      const { visible } = follower.state();
      const message = follower.message();
      for (const element of [followStatus, filterFollowStatus]) {
        if (element.hidden === visible) element.hidden = !visible;
        if (element.textContent !== message) element.textContent = message;
      }
      refreshStoryAction();
    }

    objective.addEventListener('change', refreshStoryAction, options);
    useStory.addEventListener('click', () => {
      if (follower.state().enabled) follower.pause();
      else if (savedWindow) follower.enable(savedWindow, latestStory?.kind ?? 'manual');
      if (useStory.hidden) document.querySelector('#completion-title').focus({ preventScroll: true });
    }, options);

    function updateLevel(playerLevel) {
      levelInfo.hidden = !playerLevel;
      if (!playerLevel) return;
      const { level, totalXp, next } = playerLevel;
      const levelLabel = 'Level ' + level;
      const xpLabel = next ? `${xpFormat.format(next.earned)} / ${xpFormat.format(next.needed)} XP` : 'Max level';
      const barLabel = next ? 'Experience toward level ' + (level + 1) : 'Maximum level reached';
      if (levelNumber.textContent !== levelLabel) levelNumber.textContent = levelLabel;
      if (xpStatus.textContent !== xpLabel) xpStatus.textContent = xpLabel;
      xpBar.max = next?.needed ?? 1;
      xpBar.value = next?.earned ?? 1;
      xpBar.setAttribute('aria-label', barLabel);
      levelInfo.title = `${xpFormat.format(totalXp)} total XP`;
    }

    function updateStoryBadge({ latest: sourceStory, lastSync, folderConnection }) {
      const disconnected = folderConnection === 'disconnected';
      const notConnected = folderConnection === 'unconnected';
      const latest = disconnected && sourceStory?.kind !== 'manual' ? undefined : sourceStory;
      updateLevel(latest?.playerLevel);
      const option = latest?.story.window && [...objective.options].find(({ value }) => value === latest.story.window);
      savedWindow = option?.value;
      refreshStoryAction();
      const showFolderAction = disconnected || notConnected;
      const showChapter = Boolean(latest) || showFolderAction;
      storyBadge.hidden = !showChapter && !lastSync && !follower.state().enabled;
      storyChapter.hidden = !showChapter;
      storyActions.hidden = !latest && !showFolderAction && !follower.state().enabled;
      storyMeta.hidden = !latest;
      storyConnection.hidden = !latest || !notConnected;
      storySeparator.hidden = !showChapter || !lastSync;
      storyLastSync.hidden = !lastSync;
      if (lastSync && lastSyncTime.dateTime !== lastSync.toISOString()) {
        lastSyncTime.dateTime = lastSync.toISOString();
        lastSyncTime.textContent = syncTimeFormat.format(lastSync);
      }
      reconnectStory.hidden = !showFolderAction;
      const reconnectLabel = disconnected ? 'Reconnect' : 'Connect';
      if (reconnectStory.textContent !== reconnectLabel) {
        reconnectStory.textContent = reconnectLabel;
        reconnectStory.setAttribute('aria-label', reconnectLabel + ' save folder');
      }
      if (!latest) {
        const label = disconnected ? 'Disconnected' : notConnected ? 'Not connected' : '';
        if (storyChapter.textContent !== label) storyChapter.textContent = label;
        storyChapter.removeAttribute('title');
        return;
      }
      const { story, source } = latest;
      const { mode, chapter, window, playSeconds } = story;
      const code = chapter >= 5 ? checkpoints[window]?.code : undefined;
      const label = mode === 'adventure' ? 'Kyoto Adventure'
        : mode === 'clear' ? 'Clear data'
        : mode === 'unknown' ? 'Unknown chapter'
        : chapter === 0 ? 'Prologue' : 'Chapter ' + (code ?? chapter);
      const time = [Math.floor(playSeconds / 3600), Math.floor(playSeconds / 60) % 60, playSeconds % 60]
        .map((part, i) => i ? String(part).padStart(2, '0') : part).join(':');
      if (storyChapter.textContent !== label) storyChapter.textContent = label;
      if (storyTime.textContent !== time) storyTime.textContent = time;
      storyChapter.title = [source, option?.textContent.trim()].filter(Boolean).join(' · ');
    }

    function refreshPickupReviews() {
      const latest = latestStory;
      const scenes = latest?.story.pickupReviewScenes ?? [];
      const pending = [];
      let answeredCount = 0;
      for (const row of pickupRows) {
        const { reviewPickup, reviewScene, reviewAcquiredKey } = row.dataset;
        const collected = isCollected(reviewPickup);
        const notCollected = hasNotCollectedAnswer(reviewPickup);
        if (collected && notCollected) {
          // A later map/checklist confirmation supersedes the earlier answer.
          // Failure to tidy the optional answer never undoes a collected checkmark.
          try { window.kenzanStorage.removeItem(pickupAnswerPrefix + reviewPickup); } catch { /* Positive progress still wins. */ }
        }
        const answerRow = pickupAnswerRows.get(reviewPickup);
        answerRow.hidden = collected || !notCollected;
        if (!answerRow.hidden) answeredCount++;
        row.hidden = !scenes.includes(reviewScene) || collected || notCollected;
        if (row.hidden) continue;
        pending.push(row);
        const evidence = row.querySelector('[data-review-evidence]');
        const text = reviewAcquiredKey ? latest.acquired.has(reviewAcquiredKey)
          ? 'The save records this item as acquired, but not where you got it.'
          : 'This save has no acquisition record for this item.'
          : 'The save has no location-specific collection record for this pickup.';
        if (evidence.textContent !== text) evidence.textContent = text;
      }
      const shown = session.showAllPickupReviews ? pending.length : Math.min(5, pending.length);
      pending.forEach((row, index) => { row.hidden = index >= shown; });
      pickupAnswers.hidden = !answeredCount;
      pickupAnswersSummary.textContent = `Saved not-collected answers (${answeredCount})`;
      pickupReview.hidden = !pending.length && !answeredCount;
      const text = (pending.length ? `${pending.length} ${pending.length === 1 ? 'pickup' : 'pickups'} to confirm.`
        : 'No pickups waiting for confirmation.') +
        (shown < pending.length ? ` Showing the first ${shown}, oldest story segment first.` : '');
      if (pickupReviewStatus.textContent !== text) pickupReviewStatus.textContent = text;
      expandPickupReview.hidden = pending.length <= 5;
      expandPickupReview.textContent = session.showAllPickupReviews ? 'Show fewer' : `Show all ${pending.length}`;
      expandPickupReview.setAttribute('aria-expanded', String(Boolean(session.showAllPickupReviews)));
    }

    function isCollected(id) {
      try {
        return window.kenzanStorage.getItem(collectiblePrefix + id) === '1';
      } catch {
        return false;
      }
    }

    function hasNotCollectedAnswer(id) {
      try { return window.kenzanStorage.getItem(pickupAnswerPrefix + id) === 'not-collected'; }
      catch { return false; }
    }

    function notifyPickupAnswer(id) {
      window.dispatchEvent(new StorageEvent('storage', { key: pickupAnswerPrefix + id }));
    }

    function focusPickupReview(previousIndex = 0) {
      const visible = pickupRows.filter(item => !item.hidden);
      const next = visible[Math.min(previousIndex, visible.length - 1)];
      (next?.querySelector('[data-review-action="confirm"]') ??
        (!pickupAnswers.hidden ? pickupAnswersSummary : document.querySelector('#completion-title')))
        .focus({ preventScroll: true });
    }

    pickupReview.addEventListener('click', event => {
      const restore = event.target.closest('[data-review-restore]');
      if (restore) {
        const id = restore.dataset.reviewRestore;
        const row = pickupRowsById.get(id);
        if (!row || restore.closest('[data-review-answer]')?.hidden) return;
        pickupReviewError.hidden = true;
        try { window.kenzanStorage.removeItem(pickupAnswerPrefix + id); }
        catch { pickupReviewError.hidden = false; return; }
        const eligible = latestStory?.story.pickupReviewScenes?.includes(row.dataset.reviewScene);
        if (eligible && !isCollected(id)) session.showAllPickupReviews = true;
        notifyPickupAnswer(id);
        refreshPickupReviews();
        if (!row.hidden) row.querySelector('[data-review-action="confirm"]').focus({ preventScroll: true });
        else focusPickupReview();
        return;
      }
      if (event.target.closest('[data-review-expand]')) {
        session.showAllPickupReviews = !session.showAllPickupReviews;
        refreshPickupReviews();
        if (expandPickupReview.hidden) pickupReview.querySelector('[data-review-action="confirm"]')?.focus({ preventScroll: true });
        return;
      }
      const button = event.target.closest('[data-review-action]');
      const row = button?.closest('[data-review-pickup]');
      if (!row || row.hidden) return;
      pickupReviewError.hidden = true;
      const previousIndex = pickupRows.filter(item => !item.hidden).indexOf(row);
      const id = row.dataset.reviewPickup;
      if (button.dataset.reviewAction === 'confirm') {
        try {
          addCheckmarks([{ keys: [collectiblePrefix + id] }]);
        } catch {
          pickupReviewError.hidden = false;
          return;
        }
        try { window.kenzanStorage.removeItem(pickupAnswerPrefix + id); } catch { /* A collected checkmark takes precedence. */ }
      } else if (button.dataset.reviewAction === 'not-collected') {
        if (!isCollected(id)) {
          try { window.kenzanStorage.setItem(pickupAnswerPrefix + id, 'not-collected'); }
          catch { pickupReviewError.hidden = false; return; }
          notifyPickupAnswer(id);
        }
      } else return;
      refreshPickupReviews();
      focusPickupReview(previousIndex);
    }, options);

    window.addEventListener('storage', ({ key }) => {
      if (key === null || key?.startsWith(collectiblePrefix) || key?.startsWith(pickupAnswerPrefix)) refreshPickupReviews();
    }, options);
    document.addEventListener('change', event => {
      if (event.target.dataset.collectibleCollected) refreshPickupReviews();
    }, options);

    function renderPreview() {
      const pending = new Set(pendingKeys(reviewed));
      const shown = new Set();
      const rows = [];
      for (const { label, keys } of reviewed) {
        const unique = keys.filter(key => !shown.has(key));
        if (!unique.length) continue;
        for (const key of unique) shown.add(key);
        const item = document.createElement('li');
        item.textContent = `${label}: ${unique.length} done in the save · ${unique.filter(key => pending.has(key)).length} new`;
        rows.push(item);
      }
      preview.replaceChildren(...rows);
      preview.hidden = !rows.length;
      apply.disabled = !pending.size;
      setStatus(pending.size ? `${pending.size} new checkmarks ready to apply.`
        : shown.size ? 'All recognized progress in this save is already checked.' : 'No supported goals are marked complete in this save.', false);
    }

    // One transaction owner for both import paths: starting another selection
    // cancels the old decode; stale work cannot publish a snapshot or preview.
    async function importManually(load, message) {
      const currentRead = ++readId;
      manualRead?.abort();
      manualRead = new AbortController();
      const readSignal = manualRead.signal;
      const live = () => !signal.aborted && !readSignal.aborted && currentRead === readId;
      session.reviewed = reviewed = [];
      preview.hidden = true;
      apply.disabled = true;
      review.setAttribute('aria-busy', 'true');
      setStatus(message, false);
      try {
        const buffer = await load(readSignal, message => { if (live()) setStatus(message, false); });
        if (!live()) return;
        const parsed = parse(buffer);
        session.reviewed = reviewed = parsed.progress;
        if (parsed.story || parsed.weapons || parsed.crafting) showStory('manual', 'Imported save', parsed);
        renderPreview();
      } catch (error) {
        if (!live()) return;
        setStatus(error.name === 'SecurityError' ? 'Browser storage is unavailable. Open the guide in a browser that allows it to save progress.' : error.message);
      } finally {
        if (live()) review.removeAttribute('aria-busy');
      }
    }

    choose.addEventListener('click', () => picker.click(), options);
    picker.addEventListener('change', () => {
      const [file] = picker.files;
      picker.value = '';
      if (!file) return;
      importManually(async readSignal => {
        if (!await hasSaveHeader(file)) {
          throw new Error('This file could not be read as an RPCS3 save. Choose its USERDATA file. For a save copied from a PS3, use Import a PS3 save instead.');
        }
        readSignal.throwIfAborted();
        return file.arrayBuffer();
      }, 'Reading save…');
    }, options);

    async function loadPS3(files, readSignal, announce) {
      let input, decoder;
      try {
        [input, decoder] = await Promise.all([
          import(new URL('assets/save-ps3-input.js', document.baseURI)),
          import(new URL('assets/save-ps3-crypto.js', document.baseURI)),
        ]);
      } catch {
        throw new Error('The PS3 importer could not load. Reload the guide, or open it over HTTPS or on localhost, then try again.');
      }
      readSignal.throwIfAborted();
      const pair = await input.readPS3SaveFiles(files, { signal: readSignal });
      readSignal.throwIfAborted();
      let plain = pair.userdata;
      if (!await hasSaveHeader(new File([plain], 'USERDATA'))) {
        readSignal.throwIfAborted();
        announce('Decrypting PS3 save…');
        plain = await decoder.decryptPS3Save(pair, { signal: readSignal });
        readSignal.throwIfAborted();
        if (!await hasSaveHeader(new File([plain], 'USERDATA'))) {
          throw new Error('The decrypted file is not a supported Kenzan save. Choose USERDATA and PARAM.PFD from the same Kenzan save folder.');
        }
      }
      readSignal.throwIfAborted();
      return plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength);
    }
    section.querySelector('#save-ps3-folder-choose').addEventListener('click', () => ps3Folder.click(), options);
    section.querySelector('#save-ps3-zip-choose').addEventListener('click', () => ps3Zip.click(), options);
    for (const input of [ps3Folder, ps3Zip]) input.addEventListener('change', () => {
      const files = [...input.files];
      input.value = '';
      if (files.length) importManually((readSignal, announce) => loadPS3(files, readSignal, announce), 'Reading PS3 save…');
    }, options);

    apply.addEventListener('click', () => {
      apply.disabled = true;
      try {
        const added = addCheckmarks(reviewed);
        recordSync();
        renderPreview();
        if (added) setStatus(window.kenzanStorage.pendingCount
          ? `Added ${added} checkmarks in this tab. Use Retry saving before closing or reloading this page.`
          : `Added ${added} checkmarks. Existing progress was kept.`);
      } catch {
        setStatus('Could not finish applying checkmarks. You can retry without losing existing progress.');
        apply.disabled = false;
      }
    }, options);

    function listUnsupported() {
      const supported = supportedKeys(groups);
      const sources = [
        ['sideDone', 'data-side-done', 'kenzan-guide:side-done:'],
        ['trainingDone', 'data-training-done', 'kenzan-guide:training-done:'],
        ['coliseumDone', 'data-coliseum-done', 'kenzan-guide:coliseum-done:'],
        ['collectibleCollected', 'data-collectible-collected', 'kenzan-atlas:collected:'],
      ];
      const selector = sources.map(([, attribute]) => `#guide input[${attribute}]`).join(',');
      const manual = new Map();
      const counted = new Set();
      for (const check of document.querySelectorAll(selector)) {
        const [type, , prefix] = sources.find(([type]) => check.dataset[type] !== undefined);
        const key = prefix + check.dataset[type];
        if (supported.has(key) || counted.has(key)) continue;
        counted.add(key);
        const area = check.closest('#locker-keys') ?? check.closest('details[id], section[id]');
        if (!area) continue;
        const row = check.closest('tr');
        const title = area.querySelector(':scope > summary, :scope > h2, :scope > h3')?.textContent.trim().replace(/\s*\(\d+\)$/, '') || 'Other goals';
        const label = row?.querySelector('th')?.textContent.trim() || check.getAttribute('aria-label') || key;
        const location = type === 'collectibleCollected' && row?.dataset.checklistLocation;
        const qualifier = check.closest('[data-minigame-mastery]') ? ' — mastery rank'
          : check.closest('[data-minigame-first-clear]') ? ' — first clear' : '';
        if (row && !row.id) row.id = 'manual-' + type + '-' + check.dataset[type];
        if (!manual.has(area.id)) manual.set(area.id, { title, entries: [] });
        manual.get(area.id).entries.push({ target: row?.id || area.id, label: label + qualifier + (location ? ' — ' + location : '') });
      }
      section.querySelector('#save-sync-manual-count').textContent = `(${counted.size})`;
      const container = section.querySelector('#save-sync-manual-list');
      for (const { title, entries } of manual.values()) {
        const group = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = `${title} (${entries.length})`;
        const list = document.createElement('ul');
        for (const { target, label } of entries) {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = '#' + target;
          link.textContent = label;
          item.append(link);
          list.append(item);
        }
        group.append(summary, list);
        container.append(group);
      }
    }

    const unsubscribe = service.subscribe(state => {
      latestStory = state.latest;
      updateWeaponSave?.(state.weaponLatest, state.folderConnection);
      updateStoryBadge(state);
      const scores = state.latest?.yabusame;
      yabusameScoreHelp.hidden = Boolean(scores);
      for (const cell of yabusameScores) {
        const score = scores?.[cell.dataset.yabusameScore];
        cell.textContent = score ? score.toLocaleString() : '—';
      }
      updateWaterfall(state.latest);
      updateTrainingRecords(state.latest);
      // A manual import remains usable if the remembered folder needs reconnecting.
      updateYujo(state.latest);
      updateGuidebook(state.latest);
      updateMinigames(state.latest);
      updateTurtles(state.latest);
      updateTurtleProgress(state.latest);
      updateTurtleRaces(state.latest);
      updateTurtleRacePlanner(state.latest);
      refreshPickupReviews();
    });
    signal.addEventListener('abort', unsubscribe, { once: true });
    const unfollow = follower.subscribe(refreshStoryFollowing);
    signal.addEventListener('abort', unfollow, { once: true });
    window.mountKenzanSaveFolderView(service.folder, reconnectStory, signal);
    const previousStatus = session.status;
    if (reviewed.length) {
      try { renderPreview(); } catch { /* Keep the preview available for retry. */ }
    }
    if (previousStatus) setStatus(previousStatus);
    listUnsupported();
    section.hidden = false;
  }

  function readLastSync() {
    try {
      const time = new Date(window.kenzanStorage.getItem(lastSyncKey) ?? '');
      if (Number.isFinite(time.getTime())) return time;
    } catch {
      // The timestamp can still be shown in this tab when storage is unavailable.
    }
    return null;
  }

  window.mountKenzanSaveSync = mountSaveSync;
})();
