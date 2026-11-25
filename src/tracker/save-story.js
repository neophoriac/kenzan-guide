(() => {
  function readStory(data, windows) {
    // Chapter comes from the native scenario row. The guide's finer windows
    // are derived separately from verified selectors and story-event flags.
    const currentSelector = data.getUint32(0x46ac);
    const resumeMode = data.getUint32(0x46a4);
    const common = data.getUint32(0x1b0);
    const chapterFor = selector => windows.chapterRanges.find(([first, last]) => selector >= first && selector <= last)?.[2];
    let selector = currentSelector;
    // A native type-4 substory temporarily replaces the current scenario. The
    // game preserves its main-story parent at +0x44 in the saved resume header.
    // Only use that parent for verified substory selectors in ordinary saves;
    // an arbitrary unknown selector must remain unknown rather than guess.
    const sideScenario = (windows.substorySelectorRanges ?? []).some(([first, last]) =>
      currentSelector >= first && currentSelector <= last);
    if (sideScenario && resumeMode === 0x12c) {
      const parent = data.byteLength >= 0x46d8 ? data.getUint32(0x46d4) : undefined;
      selector = chapterFor(parent) === undefined ? undefined : parent;
    }
    const chapter = chapterFor(selector);
    const playSeconds = Math.floor(data.getUint32(0x80) / 60);
    const weaponScenes = Object.entries(windows.weaponPickupScenes ?? {});
    const pickupScenes = Object.entries(windows.pickupScenes ?? windows.weaponPickupScenes ?? {});
    const flag = (group, state) =>
      Boolean(data.getUint32(0x190 + group * 32 + (state >>> 5) * 4) & (1 << (state & 31)));
    if (common & (1 << 13)) return { mode: 'adventure', playSeconds };
    if ((common & (1 << 3)) && (currentSelector === 0x2ee || currentSelector === 0x2ef)) {
      return { mode: 'clear', playSeconds, pickupReviewScenes: pickupScenes.map(([id]) => id),
        weaponPickupWindows: weaponScenes.map(([code]) => code) };
    }
    if (chapter === undefined) {
      return { mode: 'unknown', playSeconds };
    }
    const meets = ({ group, set = [], clear = [] }) =>
      set.every(state => flag(group, state)) && clear.every(state => !flag(group, state));
    const rules = resumeMode === 0x12c ? (windows.selectors[selector] ?? []) : [];
    const matches = rules.filter(rule =>
      meets(rule) && (rule.also ?? []).every(meets));
    // Leave ambiguous, unverified and story-only positions to the player.
    const window = chapter <= 4 ? '4-7' : matches.length === 1 ? matches[0].window : undefined;
    const reached = scenes => scenes
      .filter(([code, scene]) => {
        const pickupChapter = scene.chapter ?? Number(code.split('-')[0]);
        return chapter > pickupChapter || (chapter === pickupChapter &&
          (selector >= scene.selector || flag(scene.group, scene.flag)));
      }).map(([code]) => code);
    return { mode: 'story', chapter, window, playSeconds,
      pickupReviewScenes: reached(pickupScenes), weaponPickupWindows: reached(weaponScenes) };
  }

  if (typeof module === 'object' && module.exports) module.exports = { readStory };
  else window.readKenzanSaveStory = readStory;
})();
