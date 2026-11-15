
const questProgressPrefix = 'kenzan-guide:done:';
const storyWindowKey = 'kenzan-guide:story-window';

function questStoryAvailability(story, id, checkpoint) {
  if (!checkpoint) return '';
  const { order, clock } = checkpoint;
  const rule = story.quests[id];
  if (!clock || order < rule.first) return null;
  const phase = rule.continuations.find(item => order >= item.first
    && (item.last === null || order <= item.last) && item.clocks.includes(clock));
  if (phase) return phase.note;
  if ((rule.last !== null && order > rule.last) || (rule.gion && order >= story.gionCloses)
    || (rule.clocks && !rule.clocks.includes(clock))) return null;
  return '';
}

function questPrerequisiteWarning(story, id, completed) {
  const { all, any } = story.quests[id];
  return all.some(required => !completed.has(required)) || (any.length > 0 && !any.some(required => completed.has(required)));
}

function questMapFilter(story, ids, completed, objective, hideCompleted, missableOnly) {
  const checkpoint = story.checkpoints[objective];
  const eligible = new Set();
  const notes = {};
  const unfinishedOnly = Boolean(checkpoint) || hideCompleted || missableOnly;
  for (const id of ids) {
    const done = completed.has(id);
    const timing = questStoryAvailability(story, id, checkpoint);
    if ((!unfinishedOnly || !done) && (!missableOnly || story.quests[id].missable) && timing !== null) eligible.add(id);
    const prerequisiteWarning = !done && questPrerequisiteWarning(story, id, completed);
    const text = [timing, prerequisiteWarning && 'Prerequisite completion is unconfirmed. See Requires.'].filter(Boolean).join(' ');
    if (text) notes[id] = { text, prerequisiteWarning };
  }
  return { eligible, completed, notes, objective, checkpoint, hideCompleted, missableOnly, locked: Boolean(checkpoint && !checkpoint.clock) };
}

(() => {
  function readStory(data, windows) {
    // Chapter comes from the native scenario row. The guide's finer windows
    // are derived separately from verified selectors and story-event flags.
    const selector = data.getUint32(0x46ac);
    const resumeMode = data.getUint32(0x46a4);
    const common = data.getUint32(0x1b0);
    const chapter = windows.chapterRanges.find(([first, last]) => selector >= first && selector <= last)?.[2];
    const playSeconds = Math.floor(data.getUint32(0x80) / 60);
    const pickupScenes = Object.entries(windows.weaponPickupScenes ?? {});
    const flag = (group, state) =>
      Boolean(data.getUint32(0x190 + group * 32 + (state >>> 5) * 4) & (1 << (state & 31)));
    if (common & (1 << 13)) return { mode: 'adventure', playSeconds };
    if ((common & (1 << 3)) && (selector === 0x2ee || selector === 0x2ef)) {
      return { mode: 'clear', playSeconds, weaponPickupWindows: pickupScenes.map(([code]) => code) };
    }
    if (chapter === undefined) {
      return { mode: 'unknown', playSeconds };
    }
    const meets = ({ group, set = [], clear = [] }) =>
      set.every(state => flag(group, state)) && clear.every(state => !flag(group, state));
    const rules = resumeMode === 0x12c ? (windows.selectors[selector] ?? []) : [];
    const matches = rules.filter(rule =>
      meets(rule) && (rule.also ?? []).every(meets));
    // Leave ambiguous, unverified and story-only positions to the player.
    const window = chapter <= 4 ? '4-7' : matches.length === 1 ? matches[0].window : undefined;
    const weaponPickupWindows = pickupScenes
      .filter(([code, scene]) => {
        const pickupChapter = Number(code.split('-')[0]);
        return chapter > pickupChapter || (chapter === pickupChapter &&
          (selector >= scene.selector || flag(scene.group, scene.flag)));
      }).map(([code]) => code);
    return { mode: 'story', chapter, window, playSeconds, weaponPickupWindows };
  }

  if (typeof module === 'object' && module.exports) module.exports = { readStory };
  else window.readKenzanSaveStory = readStory;
})();

(() => {
  const slotPattern = /^BLJM60064-LIST-(\d+)$/;
  const systemSlot = 'BLJM60064-FIXED-';
  const readAccess = { mode: 'read' };
  const existingOnly = { create: false };
  const interval = 5000;
  const publicGuidePath = '/kenzan-guide/';
  const publicGuideOrigin = 'https://neophoriac.github.io';

  function isSaveFolder(folder) {
    return folder?.kind === 'directory' && folder.name === 'savedata' && typeof folder.resolve === 'function';
  }

  function matchesPath(path, ...expected) {
    return path?.length === expected.length && expected.every((part, index) => path[index] === part);
  }

  function isSaveSlot(name) {
    return name === systemSlot || slotPattern.test(name);
  }

  async function listSaveSlots(folder, live) {
    const slots = [];
    if (!isSaveFolder(folder) || !live()) return slots;
    for await (const [name, entry] of folder.entries()) {
      if (!live()) break;
      if (entry.kind === 'directory' && isSaveSlot(name)) slots.push(name);
    }
    return slots;
  }

  async function openSave(folder, slot, live) {
    if (!isSaveFolder(folder) || !isSaveSlot(slot) || !live()) return null;
    try {
      // Accept exactly one slot directory and its USERDATA child from the chosen root.
      const entry = await folder.getDirectoryHandle(slot, existingOnly);
      if (!live() || entry.kind !== 'directory' || entry.name !== slot) return null;
      if (!matchesPath(await folder.resolve(entry), slot) || !live()) return null;
      const handle = await entry.getFileHandle('USERDATA', existingOnly);
      if (!live() || handle.kind !== 'file' || handle.name !== 'USERDATA') return null;
      if (!matchesPath(await folder.resolve(handle), slot, 'USERDATA') || !live()) return null;
      const file = await handle.getFile();
      return live() && file.name === 'USERDATA' ? file : null;
    } catch (error) {
      // RPCS3 can replace the slot directory while saving. Get new handles on the next scan.
      if (!['NotFoundError', 'NotReadableError', 'TypeMismatchError'].includes(error.name)) throw error;
      return null;
    }
  }

  async function scanSaveFolder(folder, live = () => true, { slot, includeSystem = true } = {}) {
    const names = await listSaveSlots(folder, live);
    const files = [];
    for (const name of names) {
      if (!live()) break;
      if (name === systemSlot ? !includeSystem : slot && name !== slot) continue;
      files.push({ slot: name, file: await openSave(folder, name, live) });
    }
    return { names, files };
  }

  function selectSaves(files, slot) {
    const gameplay = files.filter(({ slot }) => slotPattern.test(slot));
    const choices = slot ? gameplay.filter(entry => entry.slot === slot)
      : [...gameplay].sort((a, b) => (b.file?.lastModified ?? -1) - (a.file?.lastModified ?? -1)
        || a.slot.localeCompare(b.slot, 'en', { numeric: true }));
    const system = files.find(({ slot }) => slot === systemSlot);
    return { gameplay, current: choices[0], system };
  }

  function storedFolder(key, change, connectionToForget, replace = false) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open('kenzan-guide-save-folder', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('folders');
      open.onerror = () => reject(open.error);
      open.onblocked = () => reject(new Error('Folder storage is busy.'));
      open.onsuccess = () => {
        const db = open.result;
        try {
          const transaction = db.transaction('folders', change === undefined ? 'readonly' : 'readwrite');
          const store = transaction.objectStore('folders');
          const request = replace ? store.put(change, key) : store.get(key);
          if (change !== undefined && !replace) request.onsuccess = () => {
            if (!request.result) return;
            const savedConnection = request.result?.connection ?? null;
            if (change === null && savedConnection === connectionToForget) store.delete(key);
            if (change && savedConnection === change.connection) store.put(change, key);
          };
          transaction.oncomplete = () => { db.close(); resolve(request.result); };
          transaction.onabort = () => { db.close(); reject(transaction.error); };
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }

  function initSaveFolderSync({ parse, hasSaveHeader, add, showStory, showFolderConnection, recordSync }) {
    const localGuide = location.protocol === 'file:' && !location.hostname;
    const publicGuide = location.origin === publicGuideOrigin
      && [publicGuidePath, publicGuidePath + 'index.html'].includes(location.pathname);
    const unsupportedLocation = !window.isSecureContext || window.top !== window.self || (!localGuide && !publicGuide);
    if (unsupportedLocation || typeof window.showDirectoryPicker !== 'function') return { unsupportedLocation };

    let config;
    let revision = 0;
    let autoRevision = 0;
    let busy = false;
    let requested = false;
    let timer;
    let picking = false;
    let persistent = true;
    let lastStatus = '';
    let slots = [];
    let slotNames = [];
    let connected = false;
    let needsReconnect = false;
    let reconnecting = false;
    let render;
    let latestTime = -1;
    let storySlot;
    const seen = new Map();
    const storageKey = publicGuide ? publicGuidePath : location.pathname;
    let connectionEvents;
    try {
      connectionEvents = new BroadcastChannel('kenzan-save-folder:' + storageKey);
    } catch {
      // A browser can disable cross-tab coordination for local pages.
    }

    function clearStory() {
      storySlot = undefined;
      showStory();
    }

    function message(value) {
      if (value === lastStatus) return;
      lastStatus = value;
      updateView();
    }

    function updateView() {
      if (render) render({ connected, needsReconnect, reconnecting, busy, picking, status: lastStatus,
        hasFolder: Boolean(config), auto: Boolean(config?.auto), slot: config?.slot ?? '', slotNames });
    }

    function controls(online, reconnect = false) {
      connected = online;
      needsReconnect = reconnect;
      showFolderConnection(reconnect);
      updateView();
    }

    function setSlotOptions(gameplay) {
      const names = [...gameplay];
      if (config.slot && !names.includes(config.slot)) names.push(config.slot);
      slotNames = names.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      updateView();
    }

    function stop() {
      clearInterval(timer);
      timer = undefined;
    }

    function schedule() {
      stop();
      if (config?.auto && !document.hidden && !picking) timer = setInterval(() => scan('auto'), interval);
    }

    function disconnect() {
      revision++;
      config = undefined;
      stop();
      requested = false;
      slots = [];
      slotNames = [];
      seen.clear();
      latestTime = -1;
      clearStory();
      controls(false);
    }

    connectionEvents?.addEventListener('message', ({ data }) => {
      if (data?.type !== 'forget' || !config || data.connection !== config.connection) return;
      disconnect();
      message('The save folder was disconnected in another tab.');
    });

    let storageQueue = Promise.resolve();
    function persist(connectionToForget, replace = false) {
      const value = config ?? null;
      const save = () => storedFolder(storageKey, value, connectionToForget, replace)
        .then(() => { persistent = true; }, () => { persistent = false; });
      storageQueue = storageQueue.then(save);
      return storageQueue;
    }

    async function scan(mode) {
      if (!config || picking || (mode === 'auto' && (!config.auto || document.hidden))) return;
      if (busy) {
        if (mode !== 'auto' || !requested) requested = mode;
        return;
      }
      const active = config;
      const scanRevision = revision;
      const autoScanRevision = autoRevision;
      const live = () => revision === scanRevision
        && (mode !== 'auto' || (autoRevision === autoScanRevision && !document.hidden));
      busy = true;
      updateView();
      try {
        const permission = await active.handle.queryPermission(readAccess);
        if (!live()) return;
        if (permission !== 'granted') {
          stop();
          controls(false, true);
          clearStory();
          message('Saved folder: ' + active.handle.name + '. Reconnect to give this browser read access again.');
          return;
        }
        const { names, files } = await scanSaveFolder(active.handle, live, { slot: active.slot, includeSystem: mode !== 'inspect' });
        if (!live()) return;
        controls(true);
        const { current, system } = selectSaves(files, active.slot);
        slots = names.filter(name => slotPattern.test(name));
        setSlotOptions(slots);
        const prefix = persistent ? 'Folder: ' + active.handle.name + '. ' : 'Folder access is available for this tab only. ';
        const nextStep = active.auto ? 'Auto-sync is on.' : 'Auto-sync is off. Use Sync now to import from this folder.';
        const source = current ? ' Gameplay slot ' + slotPattern.exec(current.slot)[1] + '.' : '';
        const pending = [];
        let retry = false;
        for (const entry of (mode === 'inspect' ? [current] : [current, system]).filter(Boolean)) {
          const { slot, file } = entry;
          // When the current slot is briefly missing during a save, don't import an older slot.
          if (mode === 'auto' && !active.slot && slot !== systemSlot && file?.lastModified < latestTime) {
            retry = true;
            continue;
          }
          if (!file || (mode === 'auto' && Date.now() - file.lastModified < 1000)) {
            retry = true;
            continue;
          }
          const stamp = file.lastModified + ':' + file.size;
          if (mode === 'auto' && seen.get(slot) === stamp && (slot === systemSlot || slot === storySlot)) continue;
          try {
            const expected = slot === systemSlot ? 'system' : 'gameplay';
            if (!live()) return;
            if (!await hasSaveHeader(file, expected)) {
              retry = true;
              continue;
            }
            if (!live()) return;
            const buffer = await file.arrayBuffer();
            if (!live()) return;
            pending.push({ slot, stamp, parsed: parse(buffer) });
          } catch {
            retry = true;
          }
        }
        if (!live()) return;
        const gameplayResult = pending.find(({ slot }) => slot === current?.slot);
        if (gameplayResult) {
          storySlot = gameplayResult.slot;
          showStory('Slot ' + slotPattern.exec(storySlot)[1], gameplayResult.parsed);
        } else if (current?.slot !== storySlot || mode !== 'auto') {
          clearStory();
        }
        if (mode === 'inspect') {
          message(prefix + nextStep + source + (retry ? ' The story position could not be read yet.'
            : current ? '' : ' No Kenzan gameplay save was found.'));
          return;
        }
        if (pending.length) {
          const count = add(pending.flatMap(({ parsed }) => parsed.progress));
          recordSync();
          for (const { slot, stamp } of pending) {
            seen.set(slot, stamp);
            if (!active.slot && slot === current?.slot) latestTime = current.file.lastModified;
          }
          message(prefix + (count ? 'Added ' + count + ' checkmark' + (count === 1 ? '' : 's') + '. ' : 'No new checkmarks. ')
            + nextStep + source + (retry ? ' A save is not ready yet.' : ''));
        } else if (retry) {
          message(prefix + 'A save is unreadable or still being written. ' + (active.auto ? 'The guide will try again.' : 'Try Sync now after RPCS3 finishes saving.'));
        } else if (!current) {
          message(prefix + (active.slot ? 'The selected gameplay slot was not found. ' : 'No Kenzan gameplay save was found. ') + nextStep);
        } else if (mode !== 'auto') {
          message(prefix + nextStep + source);
        }
      } catch (error) {
        if (!live()) return;
        if (['NotAllowedError', 'SecurityError', 'NotFoundError'].includes(error.name)) {
          stop();
          controls(false, true);
          clearStory();
          message(error.name === 'NotFoundError'
            ? 'The saved folder is unavailable. Check the drive, then reconnect or choose the folder again.'
            : 'Folder access is unavailable. Reconnect the saved folder, or import a file manually.');
        } else {
          message('Could not sync from the folder. Try Sync now, reconnect it, or import a save manually.');
        }
      } finally {
        busy = false;
        updateView();
        const next = requested;
        requested = false;
        if (next && (next !== 'auto' || config?.auto)) void scan(next);
      }
    }

    async function restore() {
      const start = revision;
      try {
        const saved = await storedFolder(storageKey);
        if (revision !== start || !saved) return;
        if (!isSaveFolder(saved.handle)) {
          message('The remembered folder isn’t an RPCS3 savedata folder. Choose your savedata folder to reconnect.');
          return;
        }
        config = { handle: saved.handle, auto: saved.auto === true,
          slot: typeof saved.slot === 'string' && slotPattern.test(saved.slot) ? saved.slot : '',
          connection: typeof saved.connection === 'string' ? saved.connection : null };
        controls(false);
        schedule();
        await scan(config.auto ? 'auto' : 'inspect');
      } catch {
        persistent = false;
      }
    }

    async function chooseFolder() {
      if (picking) return;
      picking = true;
      updateView();
      const pickerRevision = ++revision;
      const live = () => revision === pickerRevision;
      stop();
      requested = false;
      let changed = false;
      try {
        const handle = await window.showDirectoryPicker({ ...readAccess, id: 'kenzan-rpcs3-saves', ...(config && { startIn: config.handle }) });
        if (!live()) return;
        if (!isSaveFolder(handle)) {
          message('Choose the RPCS3 folder named savedata.');
          return;
        }
        const names = await listSaveSlots(handle, live);
        let recognized = false;
        for (const slot of names) {
          if (!live()) return;
          const file = await openSave(handle, slot, live);
          if (!live()) return;
          if (file && await hasSaveHeader(file, slot === systemSlot ? 'system' : 'gameplay')) {
            recognized = true;
            break;
          }
        }
        if (!live()) return;
        if (!recognized) {
          message('No readable Kenzan USERDATA was found in this savedata folder.');
          return;
        }
        clearStory();
        seen.clear();
        latestTime = -1;
        slots = [];
        slotNames = [];
        config = { handle, auto: false, slot: '', connection: crypto.randomUUID() };
        changed = true;
        await persist(undefined, true);
      } catch (error) {
        if (error.name === 'AbortError' || !live()) return;
        message('The folder picker couldn’t connect. Try desktop Chrome or Edge, or import a save file below.');
      } finally {
        picking = false;
        updateView();
        schedule();
        if (changed && live()) await scan('inspect');
      }
    }

    async function reconnectFolder() {
      if (!config || reconnecting) return;
      const active = config;
      const reconnectRevision = revision;
      reconnecting = true;
      updateView();
      try {
        const permission = await active.handle.requestPermission(readAccess);
        if (revision !== reconnectRevision) return;
        if (permission !== 'granted') {
          message('Read access wasn’t granted. You can reconnect again or import a save file.');
          return;
        }
        if (active !== config) return;
        schedule();
        await scan(config.auto ? 'auto' : 'inspect');
      } catch {
        if (revision !== reconnectRevision) return;
        message('Could not reconnect this folder. Choose it again or import a save file below.');
      } finally {
        reconnecting = false;
        updateView();
      }
    }

    async function forgetFolder() {
      const connection = config?.connection;
      disconnect();
      const forgetRevision = revision;
      connectionEvents?.postMessage({ type: 'forget', connection });
      await persist(connection);
      connectionEvents?.postMessage({ type: 'forget', connection });
      if (revision !== forgetRevision) return;
      message(persistent ? 'Folder forgotten. Existing checkmarks were kept.' : 'Folder disconnected. Browser storage could not be cleared. Revoke access in site settings.');
    }

    async function setAuto(auto) {
      if (!config) return;
      revision++;
      const active = config = { ...config, auto };
      seen.clear();
      schedule();
      await persist();
      if (active === config) await scan(active.auto ? 'auto' : 'inspect');
    }

    async function setSlot(slot) {
      if (!config) return;
      revision++;
      const active = config = { ...config, slot };
      clearStory();
      setSlotOptions(slots);
      seen.clear();
      latestTime = -1;
      await persist();
      if (active === config) await scan(active.auto ? 'auto' : 'inspect');
    }

    const refresh = () => { if (config?.auto && !document.hidden) void scan('auto'); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) autoRevision++;
      schedule();
      refresh();
    });
    window.addEventListener('pagehide', () => {
      autoRevision++;
      stop();
    });
    window.addEventListener('pageshow', () => {
      schedule();
      refresh();
    });
    void restore();
    return { chooseFolder, reconnectFolder, forgetFolder, setAuto, setSlot, syncNow: () => scan('now'),
      subscribe(listener) {
        render = listener;
        updateView();
        return () => { if (render === listener) render = undefined; };
      },
    };
  }

  function mountSaveFolderView(service, reconnectStory, signal) {
    // The scan scheduler and permission state live in the service, outside this view.
    const root = document.querySelector('#save-folder-sync');
    const node = id => root.querySelector('#save-folder-' + id);
    const choose = node('choose');
    const status = node('status');
    if (!service.subscribe) {
      choose.hidden = true;
      if (service.unsupportedLocation) {
        node('privacy').hidden = true;
        node('storage').hidden = true;
        status.textContent = 'Open the official guide on GitHub Pages or open the downloaded guide directly to use folder sync. You can still import a single save below.';
      } else {
        status.textContent = 'Folder sync isn’t available in this browser. Open this guide in desktop Chrome or Edge, or import a save manually below.';
      }
      return;
    }
    const reconnect = node('reconnect');
    const now = node('now');
    const forget = node('forget');
    const settings = node('settings');
    const slotPicker = node('slot');
    const autoPicker = node('auto');
    let slotsKey;
    let reconnectFocus;
    const unsubscribe = service.subscribe(state => {
      const previous = reconnect.disabled;
      reconnect.hidden = !state.needsReconnect;
      reconnect.disabled = reconnectStory.disabled = state.reconnecting;
      now.hidden = settings.hidden = !state.connected;
      now.disabled = state.busy;
      forget.hidden = !state.hasFolder;
      choose.textContent = state.hasFolder ? 'Change save folder' : 'Choose save folder';
      choose.disabled = state.picking;
      autoPicker.checked = state.auto;
      if (status.textContent !== state.status) status.textContent = state.status;
      const key = state.slotNames.join();
      if (slotsKey !== key) {
        slotsKey = key;
        slotPicker.replaceChildren(new Option('Most recently saved', ''), ...state.slotNames.map(name =>
          new Option('Slot ' + slotPattern.exec(name)[1], name)));
      }
      slotPicker.value = state.slot;
      if (previous && !state.reconnecting && reconnectFocus && document.activeElement === document.body) {
        (reconnectFocus.hidden ? document.querySelector('#completion-title') : reconnectFocus).focus({ preventScroll: true });
      }
      if (!state.reconnecting) reconnectFocus = undefined;
    });
    signal.addEventListener('abort', unsubscribe, { once: true });
    const actions = [[choose, service.chooseFolder], [forget, service.forgetFolder], [now, service.syncNow]];
    for (const [button, action] of actions) button.addEventListener('click', action, { signal });
    for (const button of [reconnect, reconnectStory]) button.addEventListener('click', () => {
      reconnectFocus = document.activeElement === button ? button : undefined;
      void service.reconnectFolder();
    }, { signal });
    autoPicker.addEventListener('change', () => service.setAuto(autoPicker.checked), { signal });
    slotPicker.addEventListener('change', () => service.setSlot(slotPicker.value), { signal });
  }

  if (typeof module === 'object' && module.exports) module.exports = { scanSaveFolder, selectSaves };
  else {
    window.initSaveFolderSync = initSaveFolderSync;
    window.mountKenzanSaveFolderView = mountSaveFolderView;
  }
})();

(() => {
  const fileSize = 0x13750;
  const systemSize = 0x33c;
  const header = [0x4c013750, fileSize, 0x80, 0x190, 0x4690, 0x47f0, 0x4814, 0x70d8,
    0x70f8, 0x7138, 0x7258, 0x72d8, 0x73d8, 0x7be8, 0x8aa4, 0x8ba8, 0x9840];
  // Native record order, with the guide quest ID and the scenario's final-letter flag.
  const yujoRecords = [
    ['suzukaze', 2, 37], ['momochika', 3, 33], ['kinuyo', 1, 34], ['hinagiku', 4, 33],
    ['hanamaru', 5, 29], ['shirayuki', 6, 35], ['asagiri', 7, 36],
  ];

  function saveType(data, size) {
    if (size === systemSize && data.byteLength >= 4 && data.getUint32(0) === 0x0800033c) return 'system';
    if (size === fileSize && data.byteLength >= header.length * 4
      && header.every((word, index) => data.getUint32(index * 4) === word)) return 'gameplay';
    return undefined;
  }

  async function hasSaveHeader(file, expectedType) {
    if (file.size !== fileSize && file.size !== systemSize) return false;
    if (expectedType && file.size !== (expectedType === 'system' ? systemSize : fileSize)) return false;
    const prefix = await file.slice(0, file.size === systemSize ? 4 : header.length * 4).arrayBuffer();
    const type = saveType(new DataView(prefix), file.size);
    return Boolean(type && (!expectedType || type === expectedType));
  }

  function readSaveDetails(buffer, groups, storyWindows) {
    const data = new DataView(buffer);
    const type = saveType(data, data.byteLength);
    if (type === 'system') return { progress: readSystem(data) };
    if (type !== 'gameplay') {
      throw new Error('This file is not a supported Kenzan save. Choose USERDATA from your RPCS3 save slot.');
    }
    const readStory = typeof module === 'object' && module.exports ? require('./save-story.js').readStory : window.readKenzanSaveStory;
    const progress = readGameplay(data, groups);
    return { progress, yujo: readYujo(data, progress), story: storyWindows ? readStory(data, storyWindows) : undefined };
  }

  function readSave(buffer, groups) {
    return readSaveDetails(buffer, groups).progress;
  }

  function scenarioFlag(data, group, state) {
    return Boolean(data.getUint32(0x190 + group * 32 + (state >>> 5) * 4) & (1 << (state & 31)));
  }

  function yujoFlags(data, index) {
    return data.getUint32(0x927c + 24 * index);
  }

  function readYujo(data, progress) {
    const completed = new Set(progress.find(group => group.label === 'Substories')?.keys);
    return Object.fromEntries(yujoRecords.flatMap(([slug, quest, letterFlag], index) => {
      // The room UI reads quarter-hearts from the first two bytes of the native record.
      const offset = 0x9268 + index * 24;
      const hearts = data.getUint8(offset);
      const limit = data.getUint8(offset + 1);
      if (![40, 60, 80].includes(limit) || hearts > limit) return [];
      const flags = yujoFlags(data, index);
      const group = 0x76 + index;
      const flag = state => scenarioFlag(data, group, state);
      // Asagiri's scenario omits the date encounter with another Yūjo.
      const dateShift = slug === 'asagiri' ? 1 : 0;
      const questComplete = completed.has('kenzan-guide:done:' + quest);
      const letter = flag(letterFlag);
      return [[slug, {
        hearts: hearts / 4,
        limit: limit / 4,
        visitTier: flags & 8 ? 3 : flags & 4 ? 2 : flags & 2 ? 1 : 0,
        gamesStarted: Math.min(data.getUint8(offset + 2), 11),
        laterGameWon: Boolean(flags & 0x100),
        dateLetter: flag(16 - dateShift) || flag(17 - dateShift),
        steps: {
          visit: flag(1),
          'first-game': Boolean(flags & 0x80) || limit >= 60,
          'date-talk': Boolean(flags & 0x2000),
          date: limit === 80,
          'later-talk': Boolean(flags & 0x4000),
          'final-talk': Boolean(flags & 0x8000),
          'quest-unlocked': flag(23 - dateShift) || questComplete,
          'quest-complete': questComplete,
          letter,
        },
      }]];
    }));
  }

  function readSystem(data) {
    const keys = [];
    let index = 0;
    for (const [group, count] of [['melee', 10], ['duel', 5], ['challenge', 10], ['rebirth', 4], ['ultimate', 4]]) {
      for (let course = 1; course <= count; course++, index++) {
        const rank = data?.getUint8(0x39 + index * 8);
        // Ultimate Match's all-S check uses rank 4 for every course.
        if (!data || rank === 4) keys.push('kenzan-guide:side-done:ultimate-' + group + '-' + course);
      }
    }
    return [{ label: 'Ultimate Match S ranks', keys }];
  }

  function readGameplay(data, groups) {
    // The game stores 256 flags per group as eight big-endian words.
    const bit = (offset, state) => !data || Boolean(data.getUint32(offset + (state >>> 5) * 4) & (1 << (state & 31)));
    const byteBit = (offset, state) => !data || Boolean(data.getUint8(offset + (state >>> 3)) & (1 << (state & 7)));
    const flag = (group, state) => !data || scenarioFlag(data, group, state);
    const progress = groups.map(({ label, offset, byteBits, checks }) => ({ label, keys: [...new Set(checks
      .filter(([, group, state, excluding]) => !data || (offset === undefined
        ? flag(group, state) && (excluding === undefined || !flag(group, excluding))
        : (byteBits ? byteBit : bit)(offset, state)))
      .map(([key]) => key))] }));
    progress.push(...readMinigameRecords(data));
    // Native Yujo Completion List order; its final event flag is independent of the substory display.
    progress.push({ label: 'Yujo final events', keys: yujoRecords
      .filter((_, index) => !data || yujoFlags(data, index) & 0x20000)
      .map(([slug]) => 'kenzan-guide:side-done:yujo-final-' + slug) });
    const fighters = [];
    for (let fighter = 0; fighter < 50; fighter++) {
      // The Completion menu sums the twelve tournament win counters for each fighter.
      let wins = 0;
      if (data) for (let bracket = 0; bracket < 12; bracket++) wins += data.getInt16(0x7d14 + 24 * fighter + 2 * bracket);
      if (!data || wins & 0xffff) fighters.push('kenzan-guide:coliseum-done:fighter-' + (fighter + 1));
    }
    progress.push({ label: 'Coliseum fighters defeated', keys: fighters });
    const tournaments = [];
    for (let index = 0; index < 12; index++) {
      // Third-round victory increments this counter; entering a tournament uses a different field.
      if (!data || data.getUint16(0x7c30 + 2 * index)) {
        tournaments.push('kenzan-guide:coliseum-done:tournament-' + String.fromCharCode(65 + index));
      }
    }
    progress.push({ label: 'Coliseum tournaments won', keys: tournaments });
    const adventure = flag(1, 13);
    const collected = [];
    const opened = [];
    for (let index = 0; index < 50; index++) {
      // The English patch letters the locker columns in reverse native order.
      const code = String.fromCharCode(74 - Math.floor(index / 5)) + '-' + (index % 5 + 1);
      if (flag(0xc0, index + 1)) {
        const suffix = index === 0 ? (adventure ? '-tour' : '-story') : '';
        collected.push('kenzan-atlas:collected:locker-key:' + code + suffix);
      }
      // The coin locker menu uses a separate MSB-first bitset for opened lockers.
      if (!data || data.getUint8(0x8b24 + (index >>> 3)) & (0x80 >>> (index & 7))) {
        opened.push('kenzan-guide:side-done:locker-opened-' + code);
      }
    }
    return [...progress, { label: 'Locker keys collected', keys: collected }, { label: 'Lockers opened', keys: opened }];
  }

  function readMinigameRecords(data) {
    // These are the saved scores and packed course ranks read by Kenzan's Completion menu.
    const scoreGoals = [
      ['minigame-mahjong-50000', 0x9260, 50000],
      ['minigame-koi-koi-3', 0x9364, 20],
      ['minigame-koi-koi-6', 0x9368, 25],
      ['minigame-koi-koi-9', 0x936c, 35],
      ['minigame-koi-koi-12', 0x9370, 40],
      ['minigame-cho-han-200000', 0x9358, 200000, true],
      ['minigame-cee-lo-200000', 0x9354, 200000, true],
      ['minigame-kabuki-1000', 0x710c, 10000000, true],
    ];
    const scores = scoreGoals.filter(([, offset, threshold, signed]) =>
      !data || (signed ? data.getInt32(offset) : data.getUint32(offset)) >= threshold)
      .map(([key]) => 'kenzan-guide:side-done:' + key);
    const jiraiyaCourses = ['first-chamber', 'earth-chamber', 'water-chamber', 'fire-chamber', 'wind-chamber', 'heavenly-chamber', 'ultimate-chamber'];
    const jiraiya = data?.getUint32(0x9744);
    const courses = [
      ['yabusame', ['beginner', 'intermediate', 'advanced', 'expert'], data?.getUint16(0x8baa), 0, [5, 6, 7]],
      ['waterfall', ['red-spirit', 'white-spirit', 'black-spirit', 'blue-spirit', 'yellow-spirit'], data?.getUint16(0x9328), 0, [4]],
      ['melon', ['foundational', 'applied', 'advanced', 'boar-scroll', 'snake-scroll', 'asura-scroll'], data?.getUint32(0x9334), 0, [5, 6]],
      ['jiraiya', jiraiyaCourses, jiraiya, 8, [4]],
    ];
    const mastery = courses.flatMap(([group, entries, packed, shift, ranks]) =>
      entries.flatMap((entry, index) => !data || ranks.includes((packed >>> (shift + 3 * index)) & 7)
        ? ['kenzan-guide:side-done:mastery-' + group + '-' + entry] : []));
    const jiraiyaClears = jiraiyaCourses.flatMap((entry, index) => !data || jiraiya & (1 << index)
      ? ['kenzan-guide:training-done:jiraiya-' + entry] : []);
    // Native race results are 20-byte records; Completion checks the saved win byte.
    const races = [];
    for (const [prefix, base, count] of [
      ['h', 0x8ce0, 10], ['k', 0x8da8, 10], ['s', 0x8e70, 10], ['o', 0x8f38, 10], ['y', 0x9000, 10], ['m', 0x90c8, 13],
    ]) {
      for (let index = 0; index < count; index++) {
        if (!data || data.getUint8(base + 20 * index)) races.push('kenzan-guide:side-done:turtle-race-' + prefix + String(index).padStart(2, '0'));
      }
    }
    return [
      { label: 'Minigame score goals', keys: scores }, { label: 'Training mastery ranks', keys: mastery },
      { label: 'Jiraiya first clears', keys: jiraiyaClears }, { label: 'Turtle Racing wins', keys: races },
    ];
  }

  function supportedKeys(groups) {
    return new Set([
      ...readGameplay(null, groups).flatMap(({ keys }) => keys),
      ...readSystem(null).flatMap(({ keys }) => keys),
      'kenzan-atlas:collected:locker-key:J-1-story',
    ]);
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { readSave, readSaveDetails, supportedKeys, hasSaveHeader };
    return;
  }

  const collectiblePrefix = 'kenzan-atlas:collected:';
  const lastSyncKey = 'kenzan-guide:last-save-sync';
  const syncTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
  let service;

  function pendingKeys(progress) {
    return [...new Set(progress.flatMap(({ keys }) => keys))].filter(key => localStorage.getItem(key) !== '1');
  }

  function addCheckmarks(progress) {
    let added = 0;
    try {
      for (const key of pendingKeys(progress)) {
        localStorage.setItem(key, '1');
        added++;
      }
      return added;
    } finally {
      if (added) window.dispatchEvent(new StorageEvent('storage', { key: null }));
    }
  }

  function createSaveSync(groups, storyWindows) {
    // Only the subscription references the guide. Unmounting it leaves auto-sync running.
    const stories = new Map();
    let lastSync = readLastSync();
    let folderDisconnected = false;
    let render;

    function updateView() {
      if (render) render({ latest: [...stories.values()].at(-1), lastSync, folderDisconnected });
    }

    function recordSync() {
      lastSync = new Date();
      try {
        localStorage.setItem(lastSyncKey, lastSync.toISOString());
      } catch {
        // Keep the timestamp in memory if it can't be saved.
      }
      updateView();
    }

    function showStory(key, source, snapshot) {
      stories.delete(key);
      if (snapshot?.story) {
        const acquired = new Set(snapshot.progress.find(group => group.label === 'Weapons acquired')?.keys);
        stories.set(key, { story: snapshot.story, yujo: snapshot.yujo, source, acquired });
      }
      updateView();
    }

    const parse = buffer => readSaveDetails(buffer, groups, storyWindows);
    const folder = window.initSaveFolderSync({ parse, hasSaveHeader, add: addCheckmarks,
      showStory: (source, snapshot) => showStory('folder', source, snapshot),
      showFolderConnection(disconnected) {
        if (folderDisconnected === disconnected) return;
        folderDisconnected = disconnected;
        updateView();
      },
      recordSync,
    });
    window.addEventListener('storage', ({ key }) => {
      if (key !== lastSyncKey) return;
      lastSync = readLastSync();
      updateView();
    });
    return { folder, parse, showStory, recordSync,
      subscribe(listener) {
        render = listener;
        updateView();
        return () => { if (render === listener) render = undefined; };
      },
    };
  }

  function yujoProgressView() {
    const empty = document.querySelector('[data-yujo-progress-empty]');
    const profiles = [...document.querySelectorAll('[data-yujo-progress]')].map(panel => ({
      panel,
      hearts: panel.querySelector('[data-yujo-hearts]'),
      icons: [...panel.querySelectorAll('[data-yujo-heart]')],
      details: panel.querySelector('[data-yujo-record]'),
      steps: [...panel.querySelectorAll('[data-yujo-step]')],
    }));
    let displayed;
    return snapshot => {
      if (displayed === snapshot) return;
      displayed = snapshot;
      const records = snapshot?.yujo;
      empty.hidden = Boolean(records && Object.keys(records).length);
      for (const { panel, hearts, icons, details, steps } of profiles) {
        const record = records?.[panel.dataset.yujoProgress];
        panel.hidden = !record;
        if (!record) continue;
        hearts.textContent = `${record.hearts} / ${record.limit} hearts`;
        for (const [index, icon] of icons.entries()) {
          const fill = Math.min(Math.max(record.hearts - index, 0), 1);
          icon.style.setProperty('--heart-fill', fill * 100 + '%');
          icon.toggleAttribute('data-locked', index >= record.limit);
        }
        const games = record.gamesStarted === 11 ? '11+' : String(record.gamesStarted);
        details.textContent = [
          snapshot.source,
          [null, 'First visit', 'Second visit', 'Third visit or later'][record.visitTier],
          `${games} parlor ${games === '1' ? 'game' : 'games'} started`,
          record.dateLetter && !record.steps.date && 'Date invitation received',
          record.laterGameWon && 'Later parlor game won',
        ].filter(Boolean).join(' · ');
        const next = steps.find(step => !record.steps[step.dataset.yujoStep]);
        for (const step of steps) {
          const done = record.steps[step.dataset.yujoStep];
          step.dataset.status = done ? 'done' : step === next ? 'next' : 'pending';
          if (step === next) step.setAttribute('aria-current', 'step');
          else step.removeAttribute('aria-current');
          step.querySelector('[data-yujo-step-state]').textContent = done ? 'Done' : step === next ? 'Next' : 'Pending';
        }
      }
    };
  }

  function mountSaveSync(signal, viewState) {
    const section = document.querySelector('#save-sync');
    const groups = JSON.parse(document.querySelector('#save-sync-data').textContent);
    const storyWindows = JSON.parse(document.querySelector('#save-story-data').textContent);
    service ??= createSaveSync(groups, storyWindows);
    const { parse, showStory, recordSync } = service;
    const checkpoints = JSON.parse(document.querySelector('#story-data').textContent).checkpoints;
    const objective = document.querySelector('#story-objective');
    const storyBadge = document.querySelector('#save-story-badge');
    const storyChapter = storyBadge.querySelector('#save-story-chapter');
    const storyMeta = storyBadge.querySelector('.save-story-meta');
    const storySeparator = storyBadge.querySelector('.save-story-separator');
    const storyTime = storyBadge.querySelector('#save-story-time');
    const storyLastSync = storyBadge.querySelector('#save-story-last-sync');
    const lastSyncTime = storyLastSync.querySelector('time');
    const useStory = storyBadge.querySelector('#save-story-use');
    const reconnectStory = storyBadge.querySelector('#save-story-reconnect');
    const weaponReview = document.querySelector('#story-weapon-review');
    const weaponReviewError = weaponReview.querySelector('[data-review-error]');
    const weaponRows = [...weaponReview.querySelectorAll('[data-review-pickup]')];
    const session = viewState.saveSync ??= { reviewed: [], dismissedWeaponReviews: new Set(), status: '' };
    const { dismissedWeaponReviews } = session;
    const picker = section.querySelector('#save-sync-file');
    const choose = section.querySelector('#save-sync-choose');
    const apply = section.querySelector('#save-sync-apply');
    const status = section.querySelector('#save-sync-status');
    const preview = section.querySelector('#save-sync-preview');
    const updateYujo = yujoProgressView();
    let reviewed = session.reviewed;
    let readId = 0;
    let latestStory;
    let savedWindow;
    const options = { signal };

    function setStatus(message, keep = true) {
      session.status = keep ? message : '';
      status.textContent = message;
    }

    function refreshStoryAction() {
      useStory.hidden = !savedWindow;
      useStory.disabled = Boolean(savedWindow && objective.value === savedWindow);
      useStory.title = useStory.disabled ? 'Story window already selected' : 'Use this story window';
    }

    objective.addEventListener('change', refreshStoryAction, options);
    useStory.addEventListener('click', () => {
      if (!savedWindow) return;
      objective.value = savedWindow;
      objective.dispatchEvent(new Event('change'));
    }, options);

    function updateStoryBadge({ latest: sourceStory, lastSync, folderDisconnected }) {
      const latest = folderDisconnected ? undefined : sourceStory;
      const option = latest?.story.window && [...objective.options].find(({ value }) => value === latest.story.window);
      savedWindow = option?.value;
      refreshStoryAction();
      const showChapter = folderDisconnected || Boolean(latest);
      storyBadge.hidden = !showChapter && !lastSync;
      storyChapter.hidden = !showChapter;
      storyMeta.hidden = !latest;
      storySeparator.hidden = !showChapter || !lastSync;
      storyLastSync.hidden = !lastSync;
      if (lastSync && lastSyncTime.dateTime !== lastSync.toISOString()) {
        lastSyncTime.dateTime = lastSync.toISOString();
        lastSyncTime.textContent = syncTimeFormat.format(lastSync);
      }
      reconnectStory.hidden = !folderDisconnected;
      if (folderDisconnected) {
        if (storyChapter.textContent !== 'Disconnected') storyChapter.textContent = 'Disconnected';
        storyChapter.removeAttribute('title');
      }
      if (!latest) return;
      const { story, source } = latest;
      const { mode, chapter, window, playSeconds } = story;
      const code = chapter >= 5 ? checkpoints[window]?.code : undefined;
      const label = mode === 'adventure' ? 'Kyoto Adventure'
        : mode === 'clear' ? 'Clear data'
        : mode === 'unknown' ? 'Unknown chapter'
        : chapter === 0 ? 'Prologue' : 'Chapter ' + (code ?? chapter);
      const time = [Math.floor(playSeconds / 3600), Math.floor(playSeconds / 60) % 60, playSeconds % 60]
        .map((part, i) => i ? String(part).padStart(2, '0') : part).join(':');
      if (storyChapter.textContent !== label) storyChapter.textContent = label;
      if (storyTime.textContent !== time) storyTime.textContent = time;
      storyChapter.title = [source, option?.textContent.trim()].filter(Boolean).join(' · ');
    }

    function refreshWeaponReviews() {
      const latest = latestStory;
      const windows = latest?.story.weaponPickupWindows ?? [];
      for (const row of weaponRows) {
        const { reviewPickup, reviewWindow, reviewWeapon } = row.dataset;
        row.hidden = !windows.includes(reviewWindow) || dismissedWeaponReviews.has(reviewPickup) ||
          isCollected(reviewPickup);
        if (row.hidden) continue;
        row.querySelector('[data-review-evidence]').textContent = latest.acquired.has(reviewWeapon)
          ? 'The save records this weapon as acquired. Where you got it is uncertain.'
          : 'This save has no acquisition record for this weapon.';
      }
      weaponReview.hidden = weaponRows.every(row => row.hidden);
    }

    function isCollected(id) {
      try {
        return localStorage.getItem(collectiblePrefix + id) === '1';
      } catch {
        return false;
      }
    }

    weaponReview.addEventListener('click', event => {
      const button = event.target.closest('[data-review-action]');
      const row = button?.closest('[data-review-pickup]');
      if (!row || row.hidden) return;
      weaponReviewError.hidden = true;
      const id = row.dataset.reviewPickup;
      if (button.dataset.reviewAction === 'confirm') {
        try {
          addCheckmarks([{ keys: [collectiblePrefix + id] }]);
        } catch {
          weaponReviewError.hidden = false;
          return;
        }
      } else dismissedWeaponReviews.add(id);
      refreshWeaponReviews();
      const next = weaponRows.find(item => !item.hidden);
      (next?.querySelector('[data-review-action="confirm"]') ??
        document.querySelector('#completion-title')).focus({ preventScroll: true });
    }, options);

    window.addEventListener('storage', ({ key }) => {
      if (key === null || key.startsWith(collectiblePrefix)) refreshWeaponReviews();
    }, options);
    document.addEventListener('change', event => {
      if (event.target.dataset.collectibleCollected) refreshWeaponReviews();
    }, options);

    function renderPreview() {
      const pending = new Set(pendingKeys(reviewed));
      const shown = new Set();
      const rows = [];
      for (const { label, keys } of reviewed) {
        const unique = keys.filter(key => !shown.has(key));
        if (!unique.length) continue;
        for (const key of unique) shown.add(key);
        const item = document.createElement('li');
        item.textContent = `${label}: ${unique.length} done in the save · ${unique.filter(key => pending.has(key)).length} new`;
        rows.push(item);
      }
      preview.replaceChildren(...rows);
      preview.hidden = !rows.length;
      apply.disabled = !pending.size;
      setStatus(pending.size ? `${pending.size} new checkmarks ready to apply.`
        : shown.size ? 'All recognized progress in this save is already checked.' : 'No supported goals are marked complete in this save.', false);
    }

    choose.addEventListener('click', () => picker.click(), options);
    picker.addEventListener('change', async () => {
      const [file] = picker.files;
      picker.value = '';
      if (!file) return;
      const currentRead = ++readId;
      session.reviewed = reviewed = [];
      preview.hidden = true;
      apply.disabled = true;
      setStatus('Reading save…', false);
      try {
        if (!await hasSaveHeader(file)) {
          throw new Error('Choose a Kenzan USERDATA file from a gameplay slot or the system save.');
        }
        if (signal.aborted || currentRead !== readId) return;
        const buffer = await file.arrayBuffer();
        if (signal.aborted || currentRead !== readId) return;
        const parsed = parse(buffer);
        session.reviewed = reviewed = parsed.progress;
        if (parsed.story) showStory('manual', 'Imported save', parsed);
        renderPreview();
      } catch (error) {
        if (signal.aborted || currentRead !== readId) return;
        setStatus(error.name === 'SecurityError' ? 'Browser storage is unavailable. Open the guide in a browser that allows it to save progress.' : error.message);
      }
    }, options);

    apply.addEventListener('click', () => {
      apply.disabled = true;
      try {
        const added = addCheckmarks(reviewed);
        recordSync();
        renderPreview();
        if (added) setStatus(`Added ${added} checkmarks. Existing progress was kept.`);
      } catch {
        setStatus('Could not finish applying checkmarks. You can retry without losing existing progress.');
        apply.disabled = false;
      }
    }, options);

    function listUnsupported() {
      const supported = supportedKeys(groups);
      const sources = [
        ['sideDone', 'data-side-done', 'kenzan-guide:side-done:'],
        ['trainingDone', 'data-training-done', 'kenzan-guide:training-done:'],
        ['coliseumDone', 'data-coliseum-done', 'kenzan-guide:coliseum-done:'],
        ['collectibleCollected', 'data-collectible-collected', 'kenzan-atlas:collected:'],
      ];
      const selector = sources.map(([, attribute]) => `#guide input[${attribute}]`).join(',');
      const manual = new Map();
      const counted = new Set();
      for (const check of document.querySelectorAll(selector)) {
        const [type, , prefix] = sources.find(([type]) => check.dataset[type] !== undefined);
        const key = prefix + check.dataset[type];
        if (supported.has(key) || counted.has(key)) continue;
        counted.add(key);
        const area = check.closest('#locker-keys') ?? check.closest('details[id], section[id]');
        if (!area) continue;
        const row = check.closest('tr');
        const title = area.querySelector(':scope > summary, :scope > h2, :scope > h3')?.textContent.trim().replace(/\s*\(\d+\)$/, '') || 'Other goals';
        const label = row?.querySelector('th')?.textContent.trim() || check.getAttribute('aria-label') || key;
        const location = type === 'collectibleCollected' && row?.dataset.checklistLocation;
        const qualifier = check.closest('[data-minigame-mastery]') ? ' — mastery rank'
          : check.closest('[data-minigame-first-clear]') ? ' — first clear' : '';
        if (row && !row.id) row.id = 'manual-' + type + '-' + check.dataset[type];
        if (!manual.has(area.id)) manual.set(area.id, { title, entries: [] });
        manual.get(area.id).entries.push({ target: row?.id || area.id, label: label + qualifier + (location ? ' — ' + location : '') });
      }
      section.querySelector('#save-sync-manual-count').textContent = `(${counted.size})`;
      const container = section.querySelector('#save-sync-manual-list');
      for (const { title, entries } of manual.values()) {
        const group = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = `${title} (${entries.length})`;
        const list = document.createElement('ul');
        for (const { target, label } of entries) {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = '#' + target;
          link.textContent = label;
          item.append(link);
          list.append(item);
        }
        group.append(summary, list);
        container.append(group);
      }
    }

    const unsubscribe = service.subscribe(state => {
      latestStory = state.latest;
      updateStoryBadge(state);
      // A manual import remains usable if the remembered folder needs reconnecting.
      updateYujo(state.latest);
      refreshWeaponReviews();
    });
    signal.addEventListener('abort', unsubscribe, { once: true });
    window.mountKenzanSaveFolderView(service.folder, reconnectStory, signal);
    const previousStatus = session.status;
    if (reviewed.length) {
      try { renderPreview(); } catch { /* Keep the preview available for retry. */ }
    }
    if (previousStatus) setStatus(previousStatus);
    listUnsupported();
    section.hidden = false;
  }

  function readLastSync() {
    try {
      const time = new Date(localStorage.getItem(lastSyncKey) ?? '');
      if (Number.isFinite(time.getTime())) return time;
    } catch {
      // The timestamp can still be shown in this tab when storage is unavailable.
    }
    return null;
  }

  window.mountKenzanSaveSync = mountSaveSync;
})();

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
  let atlasRuntime;

  const viewForHash = hash => hash === '#quest-map' ? 'map' : 'guide';

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
    const { script, runtime } = files[view];
    if (runtime && !atlasRuntime) {
      atlasRuntime = loadScript(runtime).catch(error => {
        atlasRuntime = undefined;
        throw error;
      });
    }
    const loading = Promise.allSettled([loadScript(script), runtime ? atlasRuntime : undefined]).then(results => {
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
    const hash = location.hash;
    const view = viewForHash(hash);
    const link = mapLink;
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
    if (route !== sequence || hash !== location.hash) {
      if (view !== viewForHash(location.hash)) definitions.delete(view);
      return;
    }
    status.hidden = true;
    const changed = current?.view !== view;
    if (changed) {
      if (current?.view === 'guide' && !link) current.ui.rememberScroll();
      unmount();
      mount(view);
    }
    if (view === 'map') {
      if (changed) window.scrollTo(0, 0);
      if (changed || link) current.ui.open(link);
    } else {
      const returning = !hash || hash === '#guide' || hash === states.guide.hash;
      current.ui.open({ reveal: !initial, restoreScroll: changed && returning ? states.guide.scroll : undefined });
      states.guide.hash = hash;
    }
  }

  function start() {
    document.addEventListener('click', event => {
      const anchor = event.target.closest('a[href="#quest-map"]');
      if (!anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (current?.view === 'guide') current.ui.rememberScroll();
      mapLink = { ...anchor.dataset };
      if (location.hash === '#quest-map') open();
    });
    history.scrollRestoration = 'manual';
    window.addEventListener('hashchange', () => open());
    open(true);
  }

  return { register, start };
})();

kenzanViews.start();