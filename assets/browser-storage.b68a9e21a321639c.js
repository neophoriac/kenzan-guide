// One tab-wide view of browser progress, including changes that could not be saved.
// This never replaces the browser's Storage prototype or writes gameplay save files.
(() => {
  const remembered = new Map();
  const pending = new Map();
  const listeners = new Set();
  let unavailable = false;
  let scheduled = false;
  let lastControl;

  function snapshot() { return { pending: pending.size, unavailable }; }
  function changed() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      const state = snapshot();
      for (const listener of listeners) listener(state);
      document.dispatchEvent(new CustomEvent('kenzan:storage-state', { detail: state }));
    });
  }
  function getItem(key) {
    key = String(key);
    if (pending.has(key)) return pending.get(key);
    try {
      const value = localStorage.getItem(key);
      remembered.set(key, value);
      return value;
    } catch {
      if (!unavailable) { unavailable = true; changed(); }
      return remembered.get(key) ?? null;
    }
  }
  function write(key, value) {
    key = String(key);
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !active.closest('#browser-storage-notice')) lastControl = active;
    remembered.set(key, value);
    pending.set(key, value);
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      pending.delete(key);
      unavailable = false;
    } catch {
      unavailable = true;
    }
    changed();
    return !pending.has(key);
  }
  function retry() {
    for (const [key, value] of [...pending]) write(key, value);
    if (!pending.size) {
      try { localStorage.getItem('kenzan-guide:storage-health'); unavailable = false; }
      catch { unavailable = true; }
    }
    changed();
    return snapshot();
  }
  window.kenzanStorage = {
    getItem,
    setItem: (key, value) => write(key, String(value)),
    removeItem: key => write(key, null),
    retry,
    get pendingCount() { return pending.size; },
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
  };
  window.addEventListener('beforeunload', event => {
    if (!pending.size) return;
    event.preventDefault();
    event.returnValue = '';
  });

  window.mountKenzanStorageNotice = (host = document) => {
    const root = host.id === 'browser-storage-notice' ? host : host.querySelector('#browser-storage-notice');
    if (!root) return () => {};
    const page = document.documentElement;
    page.dataset.kenzanStorageNotice = '';
    const status = root.querySelector('[data-storage-status]');
    const retryButton = root.querySelector('[data-storage-retry]');
    function revealFocus() {
      if (root.hidden) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || active === document.body || root.contains(active) || active.closest('dialog[open]')) return;
      const visible = active.closest('label') ?? active;
      const box = visible.getBoundingClientRect();
      const banner = root.getBoundingClientRect();
      if (box.width && box.height && box.bottom > banner.top && box.top < banner.bottom + 4) {
        window.scrollBy({ top: box.top - banner.bottom - 4, behavior: 'instant' });
      }
    }
    function measure() {
      const height = root.hidden ? 0 : Math.ceil(root.getBoundingClientRect().height);
      page.style.setProperty('--storage-notice-height', `${height}px`);
      revealFocus();
    }
    const size = new ResizeObserver(measure);
    size.observe(root);
    function focusAfterRecovery() {
      if (!root.contains(document.activeElement)) return;
      const usable = element => element?.isConnected && element.getClientRects().length
        && getComputedStyle(element).visibility !== 'hidden' && !element.matches(':disabled') && !element.closest('[hidden], [inert]');
      const target = usable(lastControl) ? lastControl : document.querySelector('#atlas-map') ?? document.querySelector('#completion-title');
      if (usable(target)) target.focus({ preventScroll: true });
    }
    const unsubscribe = window.kenzanStorage.subscribe(({ pending: count, unavailable: blocked }) => {
      const visible = count > 0 || blocked;
      if (!visible) focusAfterRecovery();
      root.hidden = !visible;
      const text = count
        ? `${count} ${count === 1 ? 'change is' : 'changes are'} not saved. Your changes are kept only in this tab. Retry saving before you reload or close it.`
        : 'Browser storage is unavailable. Checkmarks and settings may not survive a reload. Retry before leaving this page.';
      if (visible && status.textContent !== text) status.textContent = text;
      measure();
    });
    const onRetry = () => {
      const state = retry();
      if (!state.pending && !state.unavailable) window.dispatchEvent(new StorageEvent('storage', { key: null }));
    };
    retryButton.addEventListener('click', onRetry);
    document.addEventListener('focusin', revealFocus);
    return () => {
      unsubscribe();
      size.disconnect();
      retryButton.removeEventListener('click', onRetry);
      document.removeEventListener('focusin', revealFocus);
      page.style.removeProperty('--storage-notice-height');
      delete page.dataset.kenzanStorageNotice;
    };
  };
})();
