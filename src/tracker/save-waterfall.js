(() => {
  const courses = ['red-spirit', 'white-spirit', 'black-spirit', 'blue-spirit', 'yellow-spirit'];
  // Fixed reference targets from wtfl_setting.bin, not values stored in a save.
  const waterfallNirvanaTargets = Object.freeze(Object.fromEntries(courses.map((course, index) =>
    [course, [12000, 13000, 17000, 22000, 18000][index]])));

  function readWaterfallRecords(data) {
    // The gameplay-save reader validates the full USERDATA header first. This
    // bounded helper also accepts a DataView into an offset ArrayBuffer slice.
    try {
      if (Object.prototype.toString.call(data) !== '[object DataView]' || data.byteLength < 0x9334) return undefined;
    } catch {
      return undefined; // A detached/unavailable buffer is not an empty record.
    }
    // Native result writer 0x23ac in the isolated Waterfall module reads five
    // three-bit best ranks, followed by five big-endian uint16 best scores.
    // Only successful finishes reach that writer; each record only increases.
    // Rank and score offsets below are relative to the gameplay USERDATA buffer.
    const packed = data.getUint16(0x9328, false);
    return Object.fromEntries(courses.map((course, index) => {
      const rank = (packed >>> (3 * index)) & 7;
      const score = data.getUint16(0x932a + 2 * index, false);
      const status = rank === 0 && score === 0 ? 'none'
        : rank >= 1 && rank <= 4 && score > 0 ? 'recorded' : 'unavailable';
      return [course, status === 'unavailable' ? { score: null, rank: null, status }
        : { score, rank, status }];
    }));
  }

  if (typeof module === 'object' && module.exports) module.exports = { readWaterfallRecords, waterfallNirvanaTargets };
  else {
    window.readKenzanWaterfallRecords = readWaterfallRecords;
    window.kenzanWaterfallNirvanaTargets = waterfallNirvanaTargets;
  }
})();
