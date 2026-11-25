const turtleRaceWorkerSources = new Map();

// Suspended background tabs should not turn a healthy worker into a timeout.
function turtleRaceDeadline(callback, milliseconds) {
  let timer;
  function arm() {
    clearTimeout(timer);
    if (!document.hidden) timer = setTimeout(callback, milliseconds);
  }
  document.addEventListener('visibilitychange', arm);
  arm();
  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', arm);
  };
}

function loadTurtleRaceWorkerSource(url) {
  if (turtleRaceWorkerSources.has(url.href)) return turtleRaceWorkerSources.get(url.href);
  const loaded = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const cancelDeadline = turtleRaceDeadline(() => finish(new Error('Loading the race simulator timed out')), 30000);
    function finish(error, source) {
      cancelDeadline();
      script.onload = script.onerror = null;
      script.remove();
      if (error) reject(error);
      else resolve(source);
    }
    script.src = url.href;
    script.onload = () => {
      const source = script.turtleRaceWorkerSource;
      if (typeof source === 'string') finish(null, source);
      else finish(new Error('Missing race worker source'));
    };
    script.onerror = () => finish(new Error('Could not load the race worker source'));
    document.head.append(script);
  }).catch(error => {
    turtleRaceWorkerSources.delete(url.href);
    throw error;
  });
  turtleRaceWorkerSources.set(url.href, loaded);
  return loaded;
}

async function createTurtleRaceWorker(source, { signal } = {}) {
  if (!source) throw new Error('Missing race worker URL');
  const url = new URL(source, document.baseURI);
  if (location.protocol === 'file:' ? url.protocol !== 'file:' : url.origin !== location.origin) {
    throw new Error('The race worker must be on the same origin as the guide');
  }
  return new Promise((resolve, reject) => {
    let worker;
    let blobUrl;
    let settled = false;
    const cancelDeadline = turtleRaceDeadline(() => finish(new Error('Starting the race simulator timed out')), 30000);
    function finish(error) {
      if (settled) return;
      settled = true;
      cancelDeadline();
      signal?.removeEventListener('abort', onAbort);
      worker?.removeEventListener('message', onReady);
      worker?.removeEventListener('error', onError);
      worker?.removeEventListener('messageerror', onMessageError);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (error) {
        worker?.terminate();
        reject(error);
      } else resolve(worker);
    }
    function onAbort() {
      finish(new DOMException('Race comparison cancelled', 'AbortError'));
    }
    function onReady(event) {
      finish(event.data?.workerReady ? null : new Error('The race simulation worker did not start'));
    }
    function onError(event) {
      finish(new Error(event.message || 'Could not start the race simulation worker'));
    }
    function onMessageError() {
      finish(new Error('Could not read the race simulation worker response'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) {
      onAbort();
      return;
    }
    (async () => {
      if (location.protocol === 'file:') {
        const workerSource = await loadTurtleRaceWorkerSource(url);
        if (settled) return;
        blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      }
      if (settled) return;
      worker = new Worker(blobUrl ?? url.href);
      worker.addEventListener('message', onReady);
      worker.addEventListener('error', onError);
      worker.addEventListener('messageerror', onMessageError);
    })().catch(finish);
  });
}
