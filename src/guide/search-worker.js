// The worker owns the index and query CPU work. It has no DOM or save access.
let guideSearchIndex;
self.addEventListener('message', ({ data }) => {
  try {
    if (data.type === 'initialize') {
      guideSearchIndex = createGuideSearchIndex(data.records);
      self.postMessage({ type: 'ready', size: guideSearchIndex.size });
    } else if (data.type === 'query' && guideSearchIndex) {
      self.postMessage({ type: 'result', request: data.request,
        result: guideSearchIndex.query(data.value, data.limit, data.offset) });
    }
  } catch {
    self.postMessage({ type: 'failure', request: data.request });
  }
});
