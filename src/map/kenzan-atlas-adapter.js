// Kenzan's side guide shares story and progress with its map.
function mountKenzanMap(signal, state) {
  const integrated = document.querySelector('#quest-map[data-integrated]');
  const root = integrated ?? document.body;
  const storySource = root.querySelector('#atlas-story-data');
  const storyData = storySource && JSON.parse(storySource.textContent);
  const abilities = storyData?.revelationAbilities ?? {};
  if (integrated) {
    const parameters = new URLSearchParams(location.search);
    Object.assign(state.filters ??= {}, { hideCompleted: parameters.get('hide-completed') === '1',
      missableOnly: parameters.get('missables') === '1' });
  }
  const revelationPrefix = 'kenzan-guide:revelation-done:';
  const abilityPrefix = 'kenzan-guide:side-done:';
  const progressStorage = window.kenzanStorage ?? {
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: key => localStorage.removeItem(key),
  };

  function writeProgress(key, checked) {
    if (checked) progressStorage.setItem(key, '1');
    else progressStorage.removeItem(key);
  }

  const story = storyData && {
    getObjective() {
      const saved = progressStorage.getItem(storyWindowKey);
      return Object.hasOwn(storyData.checkpoints, saved) ? saved : '';
    },
    setObjective(value) {
      window.kenzanStoryFollow?.pause();
      progressStorage.setItem(storyWindowKey, value);
    },
    isDone: id => progressStorage.getItem(questProgressPrefix + id) === '1',
    setDone: (id, checked) => writeProgress(questProgressPrefix + id, checked),
    observes: key => key === storyWindowKey || key.startsWith(questProgressPrefix),
    isObjectiveKey: key => key === storyWindowKey,
    filter: (...filters) => questMapFilter(storyData, ...filters),
  };

  const adapter = {
    storage: progressStorage,
    story,
    routeProgressKey: id => revelationPrefix + id,
    routeDone: id => abilities[id] && progressStorage.getItem(abilityPrefix + abilities[id]) === '1',
    observesRouteProgress: key => key.startsWith(revelationPrefix) || key.startsWith(abilityPrefix + 'ability-'),
    onRouteProgress(id, checked) {
      if (abilities[id]) writeProgress(abilityPrefix + abilities[id], checked);
    },
    onCollectibleProgress() {
      document.dispatchEvent(new Event('kenzan:collectible-progress'));
    },
    routeAvailable(entry, guideState, completed) {
      if (guideState?.missableOnly && !entry.missable) return false;
      const checkpoint = guideState?.checkpoint;
      if ((guideState?.hideCompleted || guideState?.missableOnly) && completed.has(entry.id)) return false;
      if (!checkpoint) return !entry.retry;
      const { order, clock, code } = checkpoint;
      const [chapter, window] = entry.window.split('-').map(Number);
      if (order < chapter * 100 + window || (entry.cutoff && order >= 1204)) return false;
      if (entry.id === 'dry-leaf-smash') return entry.retry ? order >= 901 && Boolean(clock) : code === '8-8' || code === '8-9';
      if (!clock) return entry.id === 'illusory-wolf' && code === '9-8';
      return /^(Any time|Before|Start before)/i.test(entry.time) || entry.time.toLowerCase().includes(clock);
    },
    resolveLink({ share, mapQuest, mapRevelation, mapLockerKey, mapPlace, mapCollectible, mapStep, mapArea, mapStreet, ...link }) {
      if (share !== undefined) return readAtlasLink(new URLSearchParams(share));
      return {
        ...link,
        quest: mapQuest ? Number(mapQuest) : link.quest,
        route: mapRevelation ?? link.route,
        place: mapPlace ?? (mapLockerKey ? 'locker:' + mapLockerKey : mapRevelation === 'shichigoro' ? mapRevelation : link.place),
        collectible: mapCollectible ?? link.collectible,
        step: mapStep ?? link.step,
        area: mapArea ?? link.area,
        street: mapStreet ?? link.street,
      };
    },
  };
  const atlas = mountAtlas(root, {
    signal, state, adapter, autoOpen: false,
    linkURL: link => atlasShareURL((integrated ? 'quest-map?' : '') + atlasLinkParams(link)),
  });
  if (integrated) {
    const fields = [['#atlas-unfinished', 'hide-completed'], ['#atlas-missable', 'missables']];
    for (const [selector, parameter] of fields) root.querySelector(selector).addEventListener('change', event => {
      const url = new URL(location.href);
      if (event.target.checked) url.searchParams.set(parameter, '1');
      else url.searchParams.delete(parameter);
      history.replaceState(history.state, '', url);
    }, { signal });
    window.addEventListener('popstate', () => {
      const parameters = new URLSearchParams(location.search);
      for (const [selector, parameter] of fields) {
        const input = root.querySelector(selector);
        const checked = parameters.get(parameter) === '1';
        if (input.checked === checked) continue;
        input.checked = checked;
        input.dispatchEvent(new Event('change'));
      }
    }, { signal });
  }
  if (!integrated) {
    const openFromURL = () => atlas.open(readAtlasLink(new URLSearchParams(location.hash.slice(1))));
    window.addEventListener('hashchange', openFromURL, { signal });
    openFromURL();
  }
  return atlas;
}
