function mountTurtleRacePlanner(section, viewSignal) {
  const { bestCandidates, courseLayouts, eligibility, events, trials } = turtleRacePlanner;
  const panel = section.querySelector('#turtle-race-planner');
  const find = name => panel.querySelector('[data-planner-' + name + ']');
  const raceControl = find('race');
  const timingControl = find('timing');
  const layouts = find('layouts');
  const compareAll = find('all');
  const compareAllControl = compareAll.querySelector('input');
  const selection = find('selection');
  const status = find('status');
  const retry = find('retry');
  const resultView = find('results');
  const body = find('body');
  const basis = find('basis');
  const feedback = find('feedback');
  const loading = find('loading');
  const progress = find('progress');
  const count = find('count');
  const sync = find('sync');
  const details = find('details');
  const breakdowns = find('breakdowns');
  const exclusions = find('exclusions');
  const options = { signal: viewSignal };
  const names = new Intl.ListFormat('en');
  const percent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 });
  const batchSize = 2;
  const comparisons = new Map();
  const ranks = ['Hiramaku', 'Komusubi', 'Sekiwake', 'Ozeki', 'Yokozuna', 'Musabetsu'];
  const byId = new Map(events.map(event => [event.id, event]));
  let snapshot;
  let snapshotKey;
  let event = byId.get('H02');
  let course = courseLayouts(event);
  let selectedLayout = null;
  let trackControls = [];
  let computed;
  let run;

  for (const [index, rank] of ranks.entries()) {
    const group = document.createElement('optgroup');
    group.label = rank;
    group.append(...events.filter(row => row.id.startsWith('HKSOYM'[index]))
      .map(row => new Option(row.guideName, row.id)));
    raceControl.append(group);
  }
  raceControl.value = event.id;

  function visibleLayouts() {
    return selectedLayout === null ? course.layouts.map((_, index) => index) : [selectedLayout];
  }

  function renderCourse() {
    compareAllControl.checked = selectedLayout === null;
    for (const [index, control] of trackControls.entries()) {
      control.checked = index === selectedLayout;
    }
    const visible = visibleLayouts();
    const message = !course.randomSections.length ? 'Fixed track'
      : selectedLayout === null ? 'All ' + course.layouts.length + ' layouts selected'
        : course.layouts[selectedLayout].join(' → ');
    if (selection.textContent !== message) selection.textContent = message;
    renderResults(visible);
  }

  function renderBoard() {
    const random = Boolean(course.randomSections.length);
    find('hint').textContent = random ? 'Choose the row with the same tiles in the same order as the board in game.'
      : 'This race has a fixed track. The terrain order is always the same.';
    selectedLayout = null;
    trackControls = [];
    compareAll.hidden = !random;
    layouts.replaceChildren(...course.layouts.map((layout, index) => {
      const item = document.createElement('li');
      const track = document.createElement('span');
      track.className = 'turtle-planner-track';
      let container = item;
      if (random) {
        const label = document.createElement('label');
        label.className = 'turtle-planner-option';
        const control = document.createElement('input');
        control.type = 'radio';
        control.name = compareAllControl.name;
        control.setAttribute('aria-label', layout.join(', then '));
        control.addEventListener('change', () => {
          selectedLayout = index;
          renderCourse();
          schedule();
        }, options);
        trackControls.push(control);
        item.append(label);
        label.append(control);
        container = label;
      }
      for (const terrain of layout) {
        const section = document.createElement('span');
        const swatch = document.createElement('span');
        section.className = 'turtle-planner-terrain';
        section.dataset.terrain = terrain.toLowerCase();
        swatch.className = 'turtle-planner-swatch';
        swatch.setAttribute('aria-hidden', 'true');
        section.append(swatch, terrain);
        track.append(section);
      }
      container.append(track);
      return item;
    }));
    renderCourse();
  }

  function renderResults(visible) {
    if (!computed?.candidates.length) return;
    const { candidates } = computed;
    const jobs = visible.flatMap(index => computed.jobs[index]);
    const completed = jobs.reduce((sum, job) => sum + (job.done ? job.end - job.start : 0), 0);
    const total = jobs.reduce((sum, job) => sum + job.end - job.start, 0);
    if (completed < total) {
      feedback.dataset.state = 'running';
      const message = `Comparing ${candidates.length} ${candidates.length === 1 ? 'turtle' : 'turtles'} at ${computed.fps} FPS…`;
      if (status.textContent !== message) status.textContent = message;
    } else {
      feedback.dataset.state = 'ready';
      const suggested = ['saved', 'full'].some(mode => bestCandidates(candidates, visible, mode).length);
      const unavailable = candidates.some(({ samples }) => visible.some(index =>
        samples[index].saved.finished !== trials || samples[index].full.finished !== trials));
      status.textContent = suggested ? 'Comparison ready. Suggested choices are marked below.'
        : unavailable ? 'Comparison finished. Some estimates are unavailable.'
          : 'No turtle won in these trials.';
    }
    loading.hidden = completed === total;
    progress.max = total;
    progress.value = completed;
    count.textContent = `${completed} / ${total} trials`;
    resultView.setAttribute('aria-busy', String(completed < total));
    basis.textContent = visible.length > 1 ? `Lowest win rate across ${visible.length} layouts` : 'Win rate on this track';
    renderRows(body, visible, true);
    details.hidden = visible.length < 2;
    if (details.open && !details.hidden) renderBreakdowns(visible);
    resultView.hidden = false;
  }

  function renderRows(target, visible, summary) {
    const picks = Object.fromEntries(['saved', 'full'].map(mode =>
      [mode, new Set(bestCandidates(computed.candidates, visible, mode))]));
    target.replaceChildren(...computed.candidates.map(({ turtle, samples }) => {
      const row = document.createElement('tr');
      row.dataset.plannerTurtle = turtle.name;
      if (!summary) row.dataset.plannerLayout = visible[0];
      const identity = document.createElement('th');
      identity.scope = 'row';
      identity.className = 'turtle-planner-turtle';
      identity.dataset.turtleSpeciesId = turtle.speciesId;
      const portrait = document.createElement('span');
      portrait.className = 'turtle-portrait';
      portrait.setAttribute('aria-hidden', 'true');
      const name = document.createElement('strong');
      name.textContent = turtle.name;
      const location = document.createElement('small');
      location.textContent = turtle.inBucket ? 'In bucket · pick up to race' : 'Carried · ready to enter';
      const label = document.createElement('span');
      label.append(name, location);
      const identityContent = document.createElement('span');
      identityContent.className = 'turtle-planner-identity';
      identityContent.append(portrait, label);
      identity.append(identityContent);
      row.append(identity);
      for (const mode of ['saved', 'full']) {
        const selected = visible.map(index => samples[index][mode]);
        const cell = renderSample(selected, mode, turtle, picks[mode].has(turtle), summary);
        row.append(cell);
      }
      return row;
    }));
  }

  function renderSample(samples, mode, turtle, suggested, summary) {
    const cell = document.createElement('td');
    cell.dataset.mode = mode;
    cell.dataset.label = mode === 'saved' ? 'Saved stamina' : 'Full stamina';
    const attempted = samples.reduce((sum, sample) => sum + sample.attempted, 0);
    const total = samples.length * trials;
    const complete = samples.every(sample => sample.finished === trials);
    const outcome = document.createElement('strong');
    outcome.className = 'turtle-planner-outcome';
    const note = document.createElement('small');
    if (attempted < total) {
      cell.dataset.state = 'running';
      outcome.textContent = feedback.dataset.state === 'error' ? 'Paused' : 'Comparing';
      note.textContent = `${attempted} / ${total} trials`;
    } else if (complete) {
      const wins = Math.min(...samples.map(sample => sample.wins));
      cell.dataset.state = 'ready';
      cell.dataset.wins = wins;
      outcome.textContent = percent.format(wins / trials);
      note.textContent = `${wins}/${trials} wins`;
    } else if (samples.every(sample => sample.noStart === trials)) {
      cell.dataset.state = 'unavailable';
      outcome.textContent = 'Couldn’t start';
      note.textContent = 'No valid starting field';
    } else {
      cell.dataset.state = 'unavailable';
      outcome.textContent = 'Estimate unavailable';
      note.textContent = `${samples.reduce((sum, sample) => sum + sample.finished, 0)} / ${total} races completed`;
    }
    const stamina = document.createElement('small');
    const value = mode === 'full' ? turtle.stamina.max : turtle.stamina.value;
    stamina.textContent = mode === 'full' && value === turtle.stamina.value
      ? `Already full · ${value}/${turtle.stamina.max}` : `Stamina ${value}/${turtle.stamina.max}`;
    if (suggested && summary) {
      cell.dataset.suggested = 'true';
      const pick = document.createElement('span');
      pick.className = 'turtle-planner-pick';
      pick.textContent = 'Suggested';
      cell.append(pick);
    }
    cell.append(outcome, note, stamina);
    return cell;
  }

  function renderBreakdowns(visible) {
    breakdowns.replaceChildren(...visible.map(index => {
      const section = document.createElement('section');
      const heading = document.createElement('h6');
      heading.textContent = course.layouts[index].join(' · ');
      const table = document.createElement('table');
      table.className = 'turtle-planner-comparison turtle-planner-breakdown';
      const header = document.createElement('thead');
      const headerRow = document.createElement('tr');
      for (const text of ['Turtle', 'Saved stamina', 'Full stamina']) {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.textContent = text;
        headerRow.append(cell);
      }
      header.append(headerRow);
      const rows = document.createElement('tbody');
      renderRows(rows, [index], false);
      table.append(header, rows);
      section.append(heading, table);
      return section;
    }));
  }

  function stop() {
    if (!run) return;
    run.controller.abort();
    for (const cancel of run.deadlines.values()) cancel();
    for (const worker of run.workers) worker.terminate();
    run = undefined;
  }

  function watchBatch(current, worker) {
    current.deadlines.get(worker)?.();
    current.deadlines.set(worker, turtleRaceDeadline(() => {
      fail(current, new Error('The race simulation stopped responding'));
    }, 60000));
  }

  function queuedJobs() {
    const running = new Set(run?.busy.values());
    return visibleLayouts().flatMap(index => computed.jobs[index]).filter(job => !job.done && !running.has(job));
  }

  function fail(current, error) {
    if (current !== run) return;
    stop();
    console.error(error);
    resultView.setAttribute('aria-busy', 'false');
    feedback.dataset.state = 'error';
    loading.hidden = true;
    for (const outcome of resultView.querySelectorAll('[data-state="running"] .turtle-planner-outcome')) {
      outcome.textContent = 'Paused';
    }
    status.textContent = 'The comparison stopped responding or could not start. Retry to continue from the completed trials.';
    retry.hidden = false;
  }

  function receive(current, worker, output) {
    if (current !== run) return;
    const job = current.busy.get(worker);
    current.deadlines.get(worker)?.();
    current.deadlines.delete(worker);
    const { wins, finished, noStart, unavailable, error } = output ?? {};
    if (!job || error || ![wins, finished, noStart, unavailable].every(value => Number.isInteger(value) && value >= 0) ||
        wins > finished || finished + noStart + unavailable !== job.end - job.start) {
      fail(current, error ?? new Error('Incomplete race worker response'));
      return;
    }
    job.sample.attempted += job.end - job.start;
    job.sample.finished += finished;
    job.sample.noStart += noStart;
    job.sample.wins += wins;
    job.done = true;
    current.busy.delete(worker);
    renderResults(visibleLayouts());
    schedule();
  }

  function schedule() {
    if (!computed || !panel.open || !section.open || viewSignal.aborted) return;
    const jobs = queuedJobs();
    retry.hidden = true;
    if (!jobs.length) {
      if (!run?.busy.size) stop();
      return;
    }
    if (!run) {
      const current = run = { workers: new Set(), busy: new Map(), deadlines: new Map(), controller: new AbortController() };
      const count = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1, jobs.length));
      for (let index = 0; index < count; index++) {
        createTurtleRaceWorker(panel.dataset.plannerWorker, { signal: current.controller.signal }).then(worker => {
          if (current !== run) {
            worker.terminate();
            return;
          }
          current.workers.add(worker);
          worker.onmessage = ({ data }) => receive(current, worker, data);
          worker.onerror = error => fail(current, error);
          worker.onmessageerror = error => fail(current, error);
          schedule();
        }).catch(error => fail(current, error));
      }
      return;
    }
    for (const worker of run.workers) {
      if (run.busy.has(worker)) continue;
      const job = jobs.shift();
      if (!job) break;
      run.busy.set(worker, job);
      watchBatch(run, worker);
      try {
        worker.postMessage({
          eventId: computed.eventId, fps: computed.fps, sections: course.layouts[job.layout],
          player: job.turtle, staminaMode: job.mode, start: job.start, end: job.end,
        });
      } catch (error) {
        fail(run, error);
        return;
      }
    }
  }

  function compare() {
    stop();
    computed = undefined;
    resultView.hidden = true;
    exclusions.hidden = true;
    retry.hidden = true;
    loading.hidden = true;
    sync.hidden = true;
    feedback.dataset.state = 'empty';
    resultView.setAttribute('aria-busy', 'false');
    status.textContent = '';
    if (!panel.open || !section.open) return;
    if (!snapshot?.turtleRaceResults) {
      status.textContent = 'Sync or import a gameplay save to compare your turtles.';
      sync.hidden = false;
      return;
    }
    const turtles = snapshot.turtles ?? [];
    if (!turtles.length) {
      status.textContent = 'There are no turtles in this save.';
      return;
    }

    const fps = Number(timingControl.value);
    const key = event.id + ':' + fps;
    if (!comparisons.has(key)) {
      const results = new Set(snapshot.turtleRaceResults.map(row => row.id));
      const rejected = [];
      const candidates = turtles.flatMap(turtle => {
        const reason = eligibility(turtle, event, results);
        if (reason) {
          rejected.push(turtle.name + ' (' + reason.toLowerCase() + ')');
          return [];
        }
        const samples = course.layouts.map(() => {
          const saved = { wins: 0, finished: 0, noStart: 0, attempted: 0 };
          const full = turtle.stamina.value === turtle.stamina.max ? saved : { ...saved };
          return { saved, full };
        });
        return [{ turtle, samples }];
      });
      const jobs = course.layouts.map((_, layout) => {
        const queue = [];
        for (const mode of ['saved', 'full']) {
          for (const { turtle, samples } of candidates) {
            const { saved, full } = samples[layout];
            if (mode === 'full' && saved === full) continue;
            for (let start = 0; start < trials; start += batchSize) {
              queue.push({ turtle, layout, mode, sample: samples[layout][mode], start, end: Math.min(trials, start + batchSize) });
            }
          }
        }
        return queue;
      });
      comparisons.set(key, { eventId: event.id, fps, candidates, rejected, jobs });
    }
    computed = comparisons.get(key);
    const { candidates, rejected } = computed;
    exclusions.hidden = !rejected.length;
    exclusions.textContent = rejected.length ? 'Skipped ' + names.format(rejected) + '.' : '';
    if (!candidates.length) {
      status.textContent = 'No turtles in this save qualify for this race.';
      return;
    }
    renderCourse();
    schedule();
  }

  raceControl.addEventListener('change', () => {
    event = byId.get(raceControl.value);
    course = courseLayouts(event);
    computed = undefined;
    renderBoard();
    compare();
  }, options);
  compareAllControl.addEventListener('change', () => {
    selectedLayout = null;
    renderCourse();
    schedule();
  }, options);
  timingControl.addEventListener('change', compare, options);
  retry.addEventListener('click', compare, options);
  details.addEventListener('toggle', () => {
    if (details.open && computed?.candidates.length) renderBreakdowns(visibleLayouts());
  }, options);
  panel.addEventListener('toggle', compare, options);
  section.addEventListener('toggle', compare, options);
  viewSignal.addEventListener('abort', stop, { once: true });
  renderBoard();
  compare();

  return latest => {
    const key = latest?.turtleRaceResults ? JSON.stringify([
      latest.turtles ?? [], latest.turtleRaceResults.map(({ id }) => id).sort(),
    ]) : null;
    if (key === snapshotKey) return;
    snapshotKey = key;
    snapshot = latest;
    comparisons.clear();
    computed = undefined;
    renderCourse();
    compare();
  };
}
