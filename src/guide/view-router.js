const kenzanViews = (() => {
  const hosts = { guide: document.querySelector('#guide-view'), map: document.querySelector('#quest-map') };
  const status = document.querySelector('#view-status');
  const files = kenzanViewAssets;
  const loads = new Map();
  const definitions = new Map();
  const filters = {};
  const states = { guide: { filters, sidebar: {} }, map: { filters, sidebar: {} } };
  let current;
  let sequence = 0;
  let mapLink;
  let explicitGuideLink = false;
  const runtimeLoads = new Map();
  let navigationFrame;

  const mapSharePrefix = '#quest-map?';
  const viewForHash = hash => hash === '#quest-map' || hash.startsWith(mapSharePrefix) ? 'map' : 'guide';

  function register(view, html, css, initialize) {
    definitions.set(view, { html, css, initialize });
  }

  function loadScript(source) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.onload = () => { script.remove(); resolve(); };
      script.onerror = () => { script.remove(); reject(new Error('Could not load ' + source)); };
      document.head.append(script);
    });
  }

  function load(view) {
    if (loads.has(view)) return loads.get(view);
    const { script, runtime, runtimes = runtime ? [runtime] : [] } = files[view];
    const dependencies = runtimes.map(source => {
      if (!runtimeLoads.has(source)) {
        runtimeLoads.set(source, loadScript(source).catch(error => {
          runtimeLoads.delete(source);
          throw error;
        }));
      }
      return runtimeLoads.get(source);
    });
    const loading = Promise.allSettled([loadScript(script), ...dependencies]).then(results => {
      const failure = results.find(result => result.status === 'rejected');
      if (failure || !definitions.has(view)) {
        definitions.delete(view);
        throw failure?.reason ?? new Error('Could not initialize ' + script);
      }
    }).finally(() => loads.delete(view));
    loads.set(view, loading);
    return loading;
  }

  function unmount() {
    if (!current) return;
    const { view, lifetime, style } = current;
    lifetime.abort();
    hosts[view].hidden = true;
    hosts[view].replaceChildren();
    style.remove();
    current = undefined;
  }

  function mount(view) {
    const { html, css, initialize } = definitions.get(view);
    definitions.delete(view);
    const host = hosts[view];
    const style = document.createElement('style');
    style.dataset.viewStyle = view;
    style.textContent = css;
    document.head.append(style);
    host.innerHTML = html;
    const lifetime = new AbortController();
    current = { view, lifetime, style };
    // Lay out the guide after its initial filters and restored controls are in place.
    if (view === 'map') host.hidden = false;
    current.ui = initialize(lifetime.signal, states[view]);
    host.hidden = false;
  }

  async function open(initial = false) {
    const route = ++sequence;
    const address = location.href;
    const hash = location.hash;
    const view = viewForHash(hash);
    const guideDestination = explicitGuideLink;
    explicitGuideLink = false;
    const link = mapLink ?? (hash.startsWith(mapSharePrefix) ? { share: hash.slice(mapSharePrefix.length) } : undefined);
    mapLink = undefined;
    if (current?.view !== view && (loads.has(view) || !definitions.has(view))) {
      const loadingStatus = setTimeout(() => {
        if (route !== sequence || current) return;
        status.textContent = view === 'map' ? 'Loading interactive map…' : 'Loading side content guide…';
        status.hidden = false;
      }, 150);
      try {
        await load(view);
      } catch (error) {
        if (route !== sequence) return;
        status.textContent = error.message + '. Check the assets folder and reload the page.';
        status.hidden = false;
        return;
      } finally {
        clearTimeout(loadingStatus);
      }
    }
    if (route !== sequence || address !== location.href) {
      if (view !== viewForHash(location.hash)) definitions.delete(view);
      return;
    }
    status.hidden = true;
    const changed = current?.view !== view;
    if (changed) {
      if (current?.view === 'guide') current.ui.rememberScroll();
      unmount();
      mount(view);
    }
    if (view === 'map') {
      if (changed) window.scrollTo(0, 0);
      if (changed || link) current.ui.open(link);
      if (changed && !initial) current.ui.focusSelection?.();
    } else {
      // An explicit reference link is a destination even if its hash matches
      // the guide's old reading position. History/back navigation may restore.
      const returning = !guideDestination && (!hash || hash === '#guide' || hash === states.guide.hash);
      current.ui.open({ reveal: !initial || Boolean(hash && hash !== '#guide'), restoreScroll: changed && returning ? states.guide.scroll : undefined,
        focus: changed && !initial });
      states.guide.hash = hash;
    }
  }

  function start() {
    document.addEventListener('click', event => {
      const anchor = event.target.closest('a[href]');
      if (!anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const destination = new URL(anchor.href, location.href);
      if (destination.origin !== location.origin || destination.pathname !== location.pathname) return;
      if (viewForHash(destination.hash) !== 'map') { explicitGuideLink = true; return; }
      if (current?.view === 'guide') current.ui.rememberScroll();
      // Retain old data links; current links already carry a complete URL.
      mapLink = destination.hash === '#quest-map' ? { ...anchor.dataset } : undefined;
      if (destination.href === location.href) { event.preventDefault(); open(); }
    });
    history.scrollRestoration = 'manual';
    // One traversal can emit popstate and hashchange. Coalesce the pair, but do
    // not deduplicate against an old URL: in-panel history writes also exist.
    const navigate = () => {
      if (navigationFrame) cancelAnimationFrame(navigationFrame);
      navigationFrame = requestAnimationFrame(() => { navigationFrame = undefined; open(); });
    };
    window.addEventListener('hashchange', navigate);
    window.addEventListener('popstate', navigate);
    window.addEventListener('kenzan:route-change', navigate);
    open(true);
  }

  return { register, start };
})();
