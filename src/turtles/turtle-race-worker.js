const { runSceneTrial } = turtleRaceScenes;

self.addEventListener('message', event => {
  const { start, end, eventId, player, sections, fps, staminaMode } = event.data ?? {};
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start) {
    self.postMessage({ error: 'invalid-trial-range' });
    return;
  }
  try {
    const counts = { wins: 0, finished: 0, noStart: 0, unavailable: 0 };
    for (let index = start; index < end; index++) {
      const trial = runSceneTrial({ eventId, player, sections, fps, staminaMode, index });
      if (trial.status === 'finished') {
        counts.finished++;
        if (trial.results[0]?.slot === 0) counts.wins++;
      } else if (trial.status === 'no-start') {
        counts.noStart++;
      } else {
        counts.unavailable++;
      }
    }
    self.postMessage(counts);
  } catch (error) {
    console.error(error);
    self.postMessage({ error: 'trial-failed' });
  }
});

self.postMessage({ workerReady: true });
