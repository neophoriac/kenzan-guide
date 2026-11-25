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

  function includeSlot(name, slot, includeSystem) {
    return name === systemSlot ? includeSystem : !slot || name === slot;
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
      if (!includeSlot(name, slot, includeSystem)) continue;
      files.push({ slot: name, file: await openSave(folder, name, live) });
    }
    return { names, files };
  }

  function isDroppedSaveFolder(folder) {
    return folder?.isDirectory && folder.name === 'savedata' && folder.fullPath === '/savedata'
      && typeof folder.createReader === 'function';
  }

  async function* droppedEntries(folder, live) {
    // Each legacy reader has one traversal. Start from the retained root on every scan.
    const reader = folder.createReader();
    while (live()) {
      const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      if (!batch.length) return;
      for (const entry of batch) {
        if (!live()) return;
        yield entry;
      }
    }
  }

  async function readDroppedSave(slot, live) {
    try {
      for await (const entry of droppedEntries(slot, live)) {
        if (!entry.isFile || entry.name !== 'USERDATA' || entry.fullPath !== slot.fullPath + '/USERDATA') continue;
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        return live() && file.name === 'USERDATA' ? file : null;
      }
    } catch (error) {
      // A slot may briefly disappear when RPCS3 replaces it.
      if (!['InvalidStateError', 'NotFoundError', 'NotReadableError', 'TypeMismatchError'].includes(error.name)) throw error;
    }
    return null;
  }

  async function scanDroppedFolder(folder, live, { slot, includeSystem = true } = {}) {
    const names = [];
    const files = [];
    if (!isDroppedSaveFolder(folder) || !live()) return { names, files };
    for await (const entry of droppedEntries(folder, live)) {
      const { name } = entry;
      if (!entry.isDirectory || !isSaveSlot(name) || entry.fullPath !== folder.fullPath + '/' + name) continue;
      names.push(name);
      if (includeSlot(name, slot, includeSystem)) files.push({ slot: name, file: await readDroppedSave(entry, live) });
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
    const pickerAvailable = typeof window.showDirectoryPicker === 'function';
    const dropAvailable = !pickerAvailable && typeof window.DataTransferItem?.prototype.webkitGetAsEntry === 'function';
    if (unsupportedLocation || (!pickerAvailable && !dropAvailable)) return { unsupportedLocation };
    const scanFolder = pickerAvailable ? scanSaveFolder : scanDroppedFolder;

    let config;
    let revision = 0;
    let autoRevision = 0;
    let busy = false;
    let requested = false;
    let timer;
    let picking = false;
    let persistent = pickerAvailable;
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
    const dropPreferenceKey = 'kenzan-guide:dropped-save-folder:' + storageKey;
    // A preference can survive a reload. The dropped entry stays in this tab's memory.
    let dropPreference = null;
    if (dropAvailable) {
      try {
        dropPreference = localStorage.getItem(dropPreferenceKey);
      } catch {
        // Dropping and reconnecting still work for this tab.
      }
    }
    let connectionEvents;
    try {
      if (pickerAvailable) connectionEvents = new BroadcastChannel('kenzan-save-folder:' + storageKey);
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
      showFolderConnection(reconnect ? 'disconnected' : config ? 'configured' : 'unconnected');
      updateView();
    }

    function rememberDrop(preference) {
      dropPreference = preference;
      try {
        localStorage.setItem(dropPreferenceKey, preference);
      } catch {
        // Retry is still available with the in-memory preference.
      }
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

    function disconnect(reconnect = false) {
      revision++;
      config = undefined;
      stop();
      requested = false;
      slots = [];
      slotNames = [];
      seen.clear();
      latestTime = -1;
      controls(false, reconnect);
      clearStory();
    }

    connectionEvents?.addEventListener('message', ({ data }) => {
      if (data?.type !== 'forget' || !config || data.connection !== config.connection) return;
      disconnect();
      message('The save folder was disconnected in another tab.');
    });

    let storageQueue = Promise.resolve();
    function persist(connectionToForget, replace = false) {
      if (!pickerAvailable) return;
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
        const permission = pickerAvailable ? await active.handle.queryPermission(readAccess) : 'granted';
        if (!live()) return;
        if (permission !== 'granted') {
          stop();
          controls(false, true);
          clearStory();
          message('Saved folder: ' + active.handle.name + '. Reconnect to give this browser read access again.');
          return;
        }
        const { names, files } = await scanFolder(active.handle, live, { slot: active.slot, includeSystem: mode !== 'inspect' });
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
        if (dropAvailable && ['InvalidStateError', 'NotAllowedError', 'SecurityError', 'NotFoundError'].includes(error.name)) {
          disconnect(true);
          message('Folder access was lost. Drop the RPCS3 savedata folder again.');
        } else if (['NotAllowedError', 'SecurityError', 'NotFoundError'].includes(error.name)) {
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
        if (revision !== start) return;
        if (!saved) {
          controls(false);
          return;
        }
        if (!isSaveFolder(saved.handle)) {
          controls(false, true);
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
        if (revision === start && !config) controls(false);
      }
    }

    async function connectFolder(getFolder) {
      if (picking) return;
      picking = true;
      updateView();
      const pickerRevision = ++revision;
      const live = () => revision === pickerRevision;
      stop();
      requested = false;
      let changed = false;
      try {
        const handle = await getFolder();
        if (!live()) return;
        if (!(pickerAvailable ? isSaveFolder(handle) : isDroppedSaveFolder(handle))) {
          message(pickerAvailable ? 'Choose the RPCS3 folder named savedata.' : 'Drop one RPCS3 folder named savedata.');
          return;
        }
        const { files } = await scanFolder(handle, live);
        let recognized = false;
        for (const { slot, file } of files) {
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
        if (dropAvailable) rememberDrop('connected');
        changed = true;
        await persist(undefined, true);
      } catch (error) {
        if (error.name === 'AbortError' || !live()) return;
        message(pickerAvailable
          ? 'The folder picker couldn’t connect. Try desktop Chrome or Edge, or import a save file below.'
          : 'Could not read the dropped folder. Drop it again or import a save file below.');
      } finally {
        picking = false;
        updateView();
        schedule();
        if (changed && live()) await scan('inspect');
      }
    }

    function chooseFolder() {
      return connectFolder(() => window.showDirectoryPicker({
        ...readAccess, id: 'kenzan-rpcs3-saves', ...(config && { startIn: config.handle }),
      }));
    }

    function dropFolder(entry) {
      if (!isDroppedSaveFolder(entry)) {
        message('Drop one RPCS3 folder named savedata.');
        return;
      }
      return connectFolder(() => entry);
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
      if (dropAvailable) rememberDrop('dismissed');
      disconnect();
      if (dropAvailable) {
        message('Folder disconnected. Existing checkmarks were kept.');
        return;
      }
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
    if (pickerAvailable) void restore();
    else {
      const reconnect = dropPreference === 'connected';
      controls(false, reconnect);
      if (reconnect) message('Drop the RPCS3 savedata folder again to reconnect.');
    }
    return { chooseFolder: pickerAvailable ? chooseFolder : undefined, dropFolder: dropAvailable ? dropFolder : undefined,
      reconnectFolder, forgetFolder, setAuto, setSlot, syncNow: () => scan('now'),
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
    const dropZone = node('drop');
    choose.hidden = !service.chooseFolder;
    if (service.dropFolder) {
      dropZone.hidden = false;
      node('storage').textContent = 'Saves are processed on this device. Drop the folder again after reloading this page. Your checkmarks are kept.';
      forget.textContent = 'Disconnect folder';
      dropZone.addEventListener('dragover', event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        dropZone.setAttribute('data-dragging', '');
      }, { signal });
      dropZone.addEventListener('dragleave', () => dropZone.removeAttribute('data-dragging'), { signal });
      dropZone.addEventListener('drop', event => {
        event.preventDefault();
        dropZone.removeAttribute('data-dragging');
        const items = event.dataTransfer.items;
        const entry = items.length === 1 && items[0].kind === 'file' ? items[0].webkitGetAsEntry() : null;
        // Keep the entry itself. Firefox restricts access to DataTransferItem to the drop event.
        void service.dropFolder(entry);
      }, { signal });
    }
    let slotsKey;
    let folderState;
    const unsubscribe = service.subscribe(state => {
      folderState = state;
      reconnect.hidden = !service.chooseFolder || !state.needsReconnect || !state.hasFolder;
      reconnect.disabled = state.reconnecting;
      reconnectStory.disabled = state.reconnecting || state.picking;
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
    });
    signal.addEventListener('abort', unsubscribe, { once: true });
    function focusFolderControl() {
      root.closest('details').open = true;
      const target = !reconnect.hidden && !reconnect.disabled ? reconnect
        : !choose.hidden && !choose.disabled ? choose
          : !dropZone.hidden ? dropZone : !reconnectStory.hidden && !reconnectStory.disabled ? reconnectStory
            : document.querySelector('#completion-title');
      target?.focus({ preventScroll: true });
    }
    const actions = [[choose, service.chooseFolder], [forget, service.forgetFolder], [now, service.syncNow]];
    for (const [button, action] of actions) {
      if (action) button.addEventListener('click', async () => {
        const restoreFocus = document.activeElement === button;
        try { await action(); }
        finally {
          // Only an explicit action restores focus. Background permission updates
          // must not interrupt someone who is reading or using another control.
          const active = document.activeElement;
          if (!signal.aborted && restoreFocus && (active === document.body ||
            (active === button && (button.hidden || button.disabled)))) focusFolderControl();
        }
      }, { signal });
    }
    for (const button of [reconnect, reconnectStory]) button.addEventListener('click', async () => {
      if (service.dropFolder) {
        root.closest('details').open = true;
        dropZone.scrollIntoView({ block: 'nearest' });
        dropZone.focus({ preventScroll: true });
        return;
      }
      const restoreFocus = document.activeElement === button;
      if (folderState.hasFolder) await service.reconnectFolder();
      else {
        root.closest('details').open = true;
        await service.chooseFolder();
      }
      if (!signal.aborted && restoreFocus && document.activeElement === document.body) {
        if (button.hidden || button.disabled) focusFolderControl();
        else button.focus({ preventScroll: true });
      }
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
