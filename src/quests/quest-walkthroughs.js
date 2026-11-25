const updateWalkthrough = (() => {
  const panels = new WeakMap();
  async function update(panel) {
    if (!panel.matches?.('details[data-lazy-details]')) return;
    if (!panels.has(panel)) panels.set(panel, { loading: null, mounted: false, expanded: new Set() });
    const state = panels.get(panel);
    const summary = panel.firstElementChild;
    if (!panel.open) {
      state.loading = null;
      if (state.mounted) {
        state.expanded.clear();
        for (const [index, child] of panel.querySelectorAll('details').entries()) {
          if (child.open) state.expanded.add(index);
        }
        state.mounted = false;
      }
      while (summary.nextSibling) summary.nextSibling.remove();
      return;
    }
    if (summary.nextElementSibling || state.loading) return state.loading;
    const loading = loadGuideContent(panel.dataset.lazyDetails).then(content => {
      if (viewSignal.aborted || state.loading !== loading || !panel.open) return;
      summary.insertAdjacentHTML('afterend', content);
      state.mounted = true;
      for (const [index, child] of panel.querySelectorAll('details').entries()) {
        if (state.expanded.has(index)) child.open = true;
      }
    }, () => {
      if (viewSignal.aborted || state.loading !== loading || !panel.open) return;
      const message = document.createElement('p');
      message.className = 'quest-full-content';
      message.setAttribute('role', 'status');
      message.textContent = 'This section could not load. Check the assets folder, then close and reopen it.';
      panel.append(message);
    }).finally(() => {
      if (state.loading === loading) state.loading = null;
    });
    state.loading = loading;
    return loading;
  }
  document.addEventListener('toggle', ({ target }) => update(target), { capture: true, signal: viewSignal });
  return update;
})();

const walkthroughPhoto = document.getElementById('guide-photo-viewer');
if (walkthroughPhoto) {
  const openPhoto = mountPhotoViewer(walkthroughPhoto, viewSignal);
  guideLayout.addEventListener('click', event => {
    const button = event.target.closest('button[data-photo-source]');
    if (!button) return;
    const image = button.querySelector('img');
    openPhoto({
      source: button.dataset.photoSource, preview: image.src,
      width: Number(image.getAttribute('width')), height: Number(image.getAttribute('height')),
    }, button.dataset.photoName, button);
  }, { signal: viewSignal });
}
