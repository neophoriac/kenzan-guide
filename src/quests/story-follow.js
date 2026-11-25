// Persist only the user's preference and the existing public checkpoint filter.
// A fresh save read owns automatic adoption; remounting a view never replays a save.
(() => {
  const preferenceKey = 'kenzan-guide:follow-save-story';
  const objectiveKey = 'kenzan-guide:story-window';

  function createStoryFollower(storage, notifyObjective = () => {}) {
    const listeners = new Set();
    let checkpoints = new Map();
    let latest;
    function state() {
      const preference = storage.getItem(preferenceKey);
      const selection = storage.getItem(objectiveKey) || '';
      return { enabled: preference === '1', visible: preference !== null,
        selection, code: checkpoints.get(selection)?.code ?? selection,
        waiting: latest?.waiting || (latest?.window === selection ? '' : 'save') };
    }
    function message() {
      const { enabled, code, waiting } = state();
      return !enabled ? 'Automatic updates off. Use & follow resumes them.'
        : waiting === 'disconnected' ? `Following is on. Reconnect your save folder${code ? `; keeping ${code}` : ''}.`
          : waiting === 'checkpoint' ? `Following is on. Waiting for a recognised checkpoint${code ? `; keeping ${code}` : ''}.`
            : waiting === 'save' ? `Following is on. Waiting for a save read${code ? `; keeping ${code}` : ''}.`
              : `Automatically following your saved checkpoint${code ? `: ${code}` : ''}. Updates after each save read.`;
    }
    function refresh() { for (const listener of listeners) listener(state()); }
    function adopt(window) {
      if (storage.getItem(objectiveKey) === window) return;
      storage.setItem(objectiveKey, window);
      notifyObjective();
    }
    return {
      configure(known) { checkpoints = new Map(Object.entries(known)); },
      state,
      message,
      refresh,
      enable(window, source = 'manual') {
        if (!checkpoints.has(window)) return false;
        storage.setItem(preferenceKey, '1');
        latest = { window, source, waiting: '' };
        adopt(window);
        refresh();
        return true;
      },
      pause() {
        if (!state().enabled) return;
        storage.setItem(preferenceKey, '0');
        refresh();
      },
      observe(story, source) {
        const window = story?.mode === 'story' && checkpoints.has(story.window) ? story.window : undefined;
        latest = { source, window, waiting: window ? '' : 'checkpoint' };
        if (window && state().enabled) adopt(window);
        refresh();
      },
      unavailable(source, reason) {
        if (latest?.source !== source) return;
        latest = { source, waiting: reason ?? (latest.waiting === 'disconnected' ? 'disconnected' : 'save') };
        refresh();
      },
      subscribe(listener) {
        listeners.add(listener);
        listener(state());
        return () => listeners.delete(listener);
      },
    };
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { createStoryFollower, preferenceKey, objectiveKey };
    return;
  }
  window.kenzanStoryFollow = createStoryFollower(window.kenzanStorage,
    () => window.dispatchEvent(new StorageEvent('storage', { key: objectiveKey })));
  // This single announcer lives outside the collapsible panels and both route hosts.
  const announcement = document.querySelector('#story-follow-announcement');
  if (announcement) window.kenzanStoryFollow.subscribe(state => {
    const text = state.visible ? window.kenzanStoryFollow.message() : '';
    if (announcement.textContent !== text) announcement.textContent = text;
  });
  window.addEventListener('storage', event => {
    if (event.key === null || event.key === preferenceKey || event.key === objectiveKey) window.kenzanStoryFollow.refresh();
  });
})();
