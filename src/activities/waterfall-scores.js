(() => {
  const targets = typeof module === 'object' && module.exports
    ? require('../tracker/save-waterfall.js').waterfallNirvanaTargets : window.kenzanWaterfallNirvanaTargets;

  function waterfallScoreText(record, target) {
    if (!record) return { score: 'Sync a gameplay save', rank: '', goal: '' };
    if (record.status === 'none') return { score: 'No successful result recorded', rank: '', goal: '' };
    if (record.status !== 'recorded' || !Number.isInteger(record.score) || record.score <= 0
      || !Number.isInteger(record.rank) || record.rank < 1 || record.rank > 4) {
      return { score: 'Record unavailable', rank: '', goal: '' };
    }
    const remaining = target - record.score;
    return {
      score: `${record.score.toLocaleString()} ${record.score === 1 ? 'point' : 'points'}`,
      rank: record.rank === 4 ? 'Nirvana · highest rank' : `Best rank: ${record.rank} of 4`,
      goal: record.rank === 4 ? '' : remaining > 0 ? `${remaining.toLocaleString()} ${remaining === 1 ? 'point' : 'points'} to Nirvana` : 'Nirvana score reached',
    };
  }

  function mountWaterfallScores(root = document) {
    // Capture the live cells before the checklist loader detaches closed bodies.
    const cells = [...root.querySelectorAll('[data-waterfall-score]')];
    const help = root.querySelector('[data-waterfall-score-help]');
    const source = root.querySelector('[data-waterfall-source]');
    return snapshot => {
      const records = snapshot?.waterfall;
      if (help) help.hidden = Boolean(records);
      if (source) {
        source.hidden = !records;
        const observed = new Date(snapshot?.observedAt);
        source.textContent = records ? `Saved records · ${snapshot.source || 'Gameplay save'}${Number.isFinite(observed.getTime()) ? ` · Read ${observed.toLocaleString()}` : ''}` : '';
      }
      for (const cell of cells) {
        const copy = waterfallScoreText(records?.[cell.dataset.waterfallScore], targets[cell.dataset.waterfallScore]);
        const document = cell.ownerDocument;
        const score = document.createElement(copy.rank ? 'strong' : 'span');
        score.className = 'waterfall-score-value';
        score.textContent = copy.score;
        const parts = [score];
        for (const value of [copy.rank, copy.goal].filter(Boolean)) {
          const detail = document.createElement('span');
          detail.className = 'waterfall-score-note';
          detail.textContent = value;
          parts.push(detail);
        }
        cell.replaceChildren(...parts);
      }
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { waterfallScoreText, mountWaterfallScores };
  else window.mountKenzanWaterfallScores = mountWaterfallScores;
})();
