function createGuideSearchClient(records, signal, source = 'assets/guide-search-worker.js') {
  return new Promise((resolve, reject) => {
    let worker;
    let timer;
    let ready = false;
    let failed = false;
    let sequence = 0;
    let pending;
    const error = () => new Error('Search worker could not run.');
    const stop = () => { clearTimeout(timer); worker?.terminate(); worker = undefined; };
    const cancel = () => {
      failed = true;
      stop();
      pending?.reject(signal.reason);
      pending = undefined;
      reject(signal.reason);
    };
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) { cancel(); return; }

    function fail() {
      if (failed) return;
      failed = true;
      stop();
      pending?.reject(error());
      pending = undefined;
      if (!ready && records && !signal.aborted) {
        // File-origin/restricted-worker readers retain search, without moving
        // any guide state into the index. Normal HTTP use stays off-thread.
        const fallback = createGuideSearchIndex(records);
        records = undefined;
        resolve({ size: fallback.size, query: (value, limit, offset) => signal.aborted ? Promise.reject(signal.reason)
          : Promise.resolve(fallback.query(value, limit, offset)) });
      } else reject(error());
    }

    function query(value, limit, offset) {
      if (signal.aborted || failed) return Promise.reject(signal.reason ?? error());
      if (pending) pending.reject(new DOMException('Search superseded', 'AbortError'));
      return new Promise((resolve, reject) => {
        pending = { request: ++sequence, resolve, reject };
        worker.postMessage({ type: 'query', request: pending.request, value, limit, offset });
      });
    }
    try {
      worker = new Worker(source);
      worker.addEventListener('message', ({ data }) => {
        if (signal.aborted || failed) return;
        if (data.type === 'ready') {
          clearTimeout(timer);
          ready = true;
          records = undefined;
          resolve({ query, size: data.size });
        } else if (data.type === 'result' && data.request === pending?.request) {
          const current = pending;
          pending = undefined;
          current.resolve(data.result);
        } else if (data.type === 'failure') fail();
      });
      worker.addEventListener('error', fail);
      timer = setTimeout(fail, 5000);
      worker.postMessage({ type: 'initialize', records });
    } catch { fail(); }
  });
}
