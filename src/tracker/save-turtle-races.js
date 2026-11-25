(() => {
  const readTurtleName = typeof module === 'object' && module.exports
    ? require('./save-turtle-bucket.js').readTurtleName : window.readKenzanTurtleName;
  const raceRecords = [
    ['h', 0x8ce0, 10], ['k', 0x8da8, 10], ['s', 0x8e70, 10],
    ['o', 0x8f38, 10], ['y', 0x9000, 10], ['m', 0x90c8, 13],
  ].flatMap(([rank, start, count]) => Array.from({ length: count }, (_, index) => ({
    id: 'turtle-race-' + rank + String(index).padStart(2, '0'),
    offset: start + 20 * index,
  })));

  function readTurtleRaceResults(data) {
    // The completion menu treats a nonempty winner name as a first-place finish.
    return raceRecords.filter(({ offset }) => !data || data.getUint8(offset)).map(({ id, offset }) => ({
      id,
      winner: data ? readTurtleName(data, offset) || null : null,
    }));
  }

  function streakProgress(count, label) {
    return count >= 10 ? `Eligible · ${count} ${label} in a row` : `${count} / 10 ${label} in a row`;
  }

  function seniorProgress(lifespan) {
    if (lifespan?.eternal) return 'Doesn’t age';
    if (!lifespan) return 'Lifespan unavailable';
    const { initial, remaining } = lifespan;
    if (!remaining) return 'No lifespan left';
    // Compare the stored values so display rounding never makes a turtle eligible.
    return remaining * 10 <= initial ? 'Eligible' : 'Above the 10% limit';
  }

  function kenzanTurtleRaceView(section = document.querySelector('#minigame-turtle-racing')) {
    const doc = section.ownerDocument;
    const prompt = section.querySelector('[data-turtle-race-sync]');
    const planner = section.querySelector('[data-turtle-race-entry]');
    const qualifiers = [...section.querySelectorAll('[data-turtle-genbu-qualifier]')];
    const genbuStatus = section.querySelector('[data-turtle-genbu-status]');
    const empty = section.querySelector('[data-turtle-race-empty]');
    const candidates = section.querySelector('[data-turtle-race-candidates]');
    const entries = section.querySelector('[data-turtle-race-entries]');
    const seniors = section.querySelector('[data-turtle-senior]');
    const seniorEntries = section.querySelector('[data-turtle-senior-entries]');
    const winners = [...section.querySelectorAll('tr[id^="turtle-race-"] > th[scope="row"]')].map(header => {
      const label = doc.createElement('span');
      label.className = 'turtle-race-winner';
      label.dataset.turtleLastWinner = header.parentElement.id;
      label.hidden = true;
      header.append(label);
      return label;
    });
    const listNames = new Intl.ListFormat('en');
    let displayed;

    return snapshot => {
      if (displayed === snapshot) return;
      displayed = snapshot;
      const results = new Map(snapshot?.turtleRaceResults?.map(({ id, winner }) => [id, winner]));
      for (const label of winners) {
        const winner = results.get(label.dataset.turtleLastWinner);
        label.hidden = !winner;
        label.textContent = winner ? 'Last won by ' + winner : '';
      }
      const turtles = snapshot?.turtles ?? [];
      const hasSave = Boolean(snapshot?.turtleRaceResults);
      prompt.hidden = hasSave;
      planner.hidden = !hasSave;
      empty.hidden = Boolean(turtles.length);
      candidates.hidden = !turtles.length;
      seniors.open = false;

      const allQualifiersWon = qualifiers.every(qualifier => results.has(qualifier.dataset.turtleGenbuQualifier));
      for (const qualifier of qualifiers) {
        const won = results.has(qualifier.dataset.turtleGenbuQualifier);
        qualifier.textContent = won ? 'Won' : 'Still to win';
      }
      const sekiwake = turtles.filter(turtle => turtle.rankId === 2).map(turtle => turtle.name);
      genbuStatus.textContent = sekiwake.length
        ? (allQualifiersWon ? 'Eligible Sekiwake: ' : 'Sekiwake in this save: ') + listNames.format(sekiwake)
        : 'No Sekiwake turtle in this save.';

      entries.replaceChildren(...turtles.map(turtle => {
        const row = doc.createElement('tr');
        const name = doc.createElement('th');
        name.scope = 'row';
        name.textContent = turtle.name;
        row.append(name);
        const adamantine = turtle.adamantineEligible ? 'Eligible'
          : `${turtle.yokozunaRaceWins.length} / 10 Yokozuna wins`;
        for (const progress of [adamantine, streakProgress(turtle.winStreak, 'wins'), streakProgress(turtle.lossStreak, 'losses')]) {
          const cell = doc.createElement('td');
          cell.textContent = progress;
          row.append(cell);
        }
        return row;
      }));
      seniorEntries.replaceChildren(...turtles.map(turtle => {
        const item = doc.createElement('li');
        const name = doc.createElement('strong');
        name.textContent = turtle.name;
        item.append(name, ' · ' + seniorProgress(turtle.lifespan));
        return item;
      }));
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { readTurtleRaceResults };
  else {
    window.readKenzanTurtleRaceResults = readTurtleRaceResults;
    window.kenzanTurtleRaceView = kenzanTurtleRaceView;
  }
})();
