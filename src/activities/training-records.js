(() => {
  // Saved ranks are independent of the player's entries on the ten-place
  // boards. NPC defaults and a missing personal entry never become a record.
  function formatTrainingTime(ticks) {
    // Match the native display's separate truncated components. Rounding the
    // whole duration would turn a 29-tick fraction into the wrong hundredths.
    const minutes = Math.floor(ticks / 1800);
    const seconds = Math.floor(ticks / 30) % 60;
    const hundredths = Math.floor((ticks % 30) * 100 / 30);
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function trainingRecordText(record, kind) {
    if (!record) return { value: 'Sync a gameplay save', note: '' };
    const rank = record.status === 'recorded' && record.rankName ? record.rankName
      : record.status === 'unavailable' ? 'Rank unavailable' : 'No rank recorded';
    if (kind === 'scarecrow') {
      if (record.timeStatus === 'recorded' && Number.isSafeInteger(record.bestTimeTicks) && record.bestTimeTicks > 0) {
        return { value: formatTrainingTime(record.bestTimeTicks),
          note: `Best rank: ${rank} · Board place ${record.leaderboardPlace} of 10` };
      }
      return { value: record.timeStatus === 'not-on-board' ? 'No personal time on this board' : 'Time unavailable',
        note: `Best rank: ${rank}` };
    }
    if (record.scoreStatus === 'recorded' && Number.isInteger(record.score) && record.score > 0) {
      return { value: `${record.score.toLocaleString()} points`,
        note: `Best rank: ${rank} · Board place ${record.leaderboardPlace} of 10` };
    }
    return { value: record.scoreStatus === 'unavailable' ? 'Score unavailable' : 'No personal score on this board', note: rank };
  }

  function mountTrainingRecords(root = document) {
    // Capture cells before the existing checklist owner detaches closed tables.
    const cells = [...root.querySelectorAll('[data-training-record]')];
    const helps = [...root.querySelectorAll('[data-training-record-help]')];
    return snapshot => {
      const records = snapshot?.trainingRecords;
      for (const help of helps) help.hidden = Boolean(records);
      for (const cell of cells) {
        const kind = cell.dataset.trainingRecordKind;
        const text = trainingRecordText(records?.[kind]?.[cell.dataset.trainingRecord], kind);
        const value = cell.ownerDocument.createElement('strong');
        value.className = 'waterfall-score-value';
        value.textContent = text.value;
        const note = cell.ownerDocument.createElement('span');
        note.className = 'waterfall-score-note';
        note.textContent = text.note;
        cell.replaceChildren(value, ...(text.note ? [note] : []));
      }
    };
  }
  if (typeof module === 'object' && module.exports) module.exports = { trainingRecordText, mountTrainingRecords, formatTrainingTime };
  else window.mountKenzanTrainingRecords = mountTrainingRecords;
})();
