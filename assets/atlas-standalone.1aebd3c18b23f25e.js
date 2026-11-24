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

mountKenzanStorageNotice();
var AtlasSidebar = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // entries/sidebar.js
  var sidebar_exports = {};
  __export(sidebar_exports, {
    setupSidebar: () => setupSidebar
  });

  // gesture-math.js
  function verticalGestureVelocity(samples, now) {
    const recent = samples.filter((sample) => now - sample.time <= 100);
    if (recent.length < 2) return 0;
    const last = recent.at(-1);
    let first = last, direction = 0;
    for (let index = recent.length - 2; index >= 0; index--) {
      const sample = recent[index], movement = first.y - sample.y;
      if (Math.abs(movement) > 0.5) {
        if (direction && Math.sign(movement) !== direction) break;
        direction = Math.sign(movement);
      }
      first = sample;
    }
    const elapsed = last.time - first.time;
    return elapsed >= 8 ? Math.max(-3, Math.min(3, (last.y - first.y) / elapsed)) : 0;
  }
  function verticalReleaseTarget(offset, extent, velocity) {
    if (Math.abs(velocity) >= 0.45) return velocity > 0 ? "closed" : "open";
    return offset > extent / 2 ? "closed" : "open";
  }

  // sidebar-swipe.js
  var SidebarSwipe = class {
    #layout;
    #dock;
    #panel;
    #signal;
    #canSwipe;
    #isOpen;
    #onOpen;
    #onDismiss;
    #controller = new AbortController();
    #drag;
    #settling;
    #timer;
    #offset = 0;
    #generation = 0;
    #disposed = false;
    #suppressClickUntil = 0;
    #reduced = matchMedia("(prefers-reduced-motion: reduce)");
    constructor({ layout, dock, panel, signal, canSwipe, isOpen, onOpen, onDismiss }) {
      signal?.throwIfAborted();
      this.#layout = layout;
      this.#dock = dock;
      this.#panel = panel;
      this.#signal = signal;
      this.#canSwipe = canSwipe;
      this.#isOpen = isOpen;
      this.#onOpen = onOpen;
      this.#onDismiss = onDismiss;
      const options = { signal: this.#controller.signal };
      try {
        signal?.addEventListener("abort", this.destroy, { once: true, ...options });
        dock.addEventListener("pointerdown", this.#down, options);
        dock.addEventListener("pointermove", this.#move, options);
        for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) dock.addEventListener(type, this.#up, options);
        dock.addEventListener("click", this.#click, { capture: true, ...options });
        panel.addEventListener("transitionend", this.#transitionEnd, options);
        this.#reduced.addEventListener("change", this.#motionChange, options);
      } catch (error) {
        this.destroy();
        throw error;
      }
    }
    #active() {
      return !this.#disposed && !this.#signal?.aborted;
    }
    #eligible(target) {
      return target.closest(".atlas-top-title,.sidebar-toggle,.atlas-browse-brand") && (target.closest(".sidebar-toggle") || !target.closest('a,button,input,select,textarea,summary,label,[contenteditable="true"]'));
    }
    #readOffset() {
      const parts = getComputedStyle(this.#panel).translate.split(/\s+/);
      const y = parts.length > 1 ? parseFloat(parts[1]) : 0;
      return Number.isFinite(y) ? Math.max(0, -y) : 0;
    }
    #write(offset) {
      this.#offset = offset;
      this.#panel.style.translate = `0 ${-offset}px`;
    }
    #sample(y, time) {
      const samples = this.#drag.samples, last = samples.at(-1);
      if (time < last.time || y === last.y && time === last.time) return;
      samples.push({ y, time });
      if (samples.length > 20) samples.shift();
    }
    #dropCapture() {
      const drag = this.#drag;
      this.#drag = void 0;
      if (drag && this.#dock.hasPointerCapture(drag.id)) this.#dock.releasePointerCapture(drag.id);
      return drag;
    }
    #clearSettlement() {
      clearTimeout(this.#timer);
      this.#timer = void 0;
      this.#settling = void 0;
      this.#layout.removeAttribute("data-sidebar-swipe-settling");
    }
    #down = (event) => {
      if (!this.#active()) return;
      this.#suppressClickUntil = 0;
      if (this.#drag && this.#drag.id !== event.pointerId) {
        this.#finish(true);
        return;
      }
      if (!this.#canSwipe() || this.#drag || event.button !== 0 || event.isPrimary === false || !["touch", "pen"].includes(event.pointerType) || !this.#eligible(event.target)) return;
      const wasOpen = this.#isOpen();
      if (!wasOpen && this.#settling?.target !== "closed") return;
      const offset = this.#readOffset(), generation = ++this.#generation;
      this.#layout.setAttribute("data-sidebar-swiping", "");
      this.#write(offset);
      this.#clearSettlement();
      try {
        if (!wasOpen) this.#onOpen();
      } catch (error) {
        this.cancel();
        throw error;
      }
      if (!this.#active() || generation !== this.#generation || !this.#canSwipe()) return;
      this.#drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        offset,
        wasOpen,
        extent: this.#panel.offsetHeight,
        moved: false,
        vertical: false,
        samples: [{ y: event.clientY, time: event.timeStamp }]
      };
    };
    #move = (event) => {
      if (!this.#active() || this.#drag?.id !== event.pointerId) return;
      if (!this.#canSwipe()) {
        this.cancel();
        return;
      }
      const drag = this.#drag, dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.vertical && Math.max(Math.abs(dx), Math.abs(dy)) >= 8) {
        if (Math.abs(dy) < Math.abs(dx) * 1.25) {
          this.#finish(true);
          return;
        }
        drag.vertical = true;
      }
      if (Math.abs(dy) > 4) {
        drag.moved = true;
        if (event.type !== "pointerup" && !this.#dock.hasPointerCapture(drag.id)) this.#dock.setPointerCapture(drag.id);
      }
      if (Math.abs(dy) >= Math.abs(dx)) {
        this.#sample(event.clientY, event.timeStamp);
        this.#write(Math.max(0, Math.min(drag.extent, drag.offset - dy)));
      }
    };
    #up = (event) => {
      if (!this.#active() || this.#drag?.id !== event.pointerId) return;
      if (event.type === "lostpointercapture" && event.target !== this.#dock) return;
      if (event.type === "pointerup") {
        this.#move(event);
        if (this.#drag?.id !== event.pointerId) return;
      }
      this.#finish(event.type !== "pointerup", event.timeStamp);
    };
    #finish(cancelled, time) {
      const current = this.#drag;
      if (!current) return;
      const velocity = cancelled ? 0 : -verticalGestureVelocity(current.samples, time);
      this.#dropCapture();
      if (current.moved || !cancelled && !current.wasOpen) this.#suppressClickUntil = performance.now() + 500;
      if (!current.moved && !cancelled) {
        this.cancel();
        return;
      }
      const target = cancelled ? current.wasOpen ? "open" : "closed" : verticalReleaseTarget(this.#offset, current.extent, velocity);
      this.#settle(target);
    }
    #settle(target) {
      if (!this.#active()) return;
      const generation = ++this.#generation;
      this.#clearSettlement();
      this.#settling = { target, generation };
      this.#layout.setAttribute("data-sidebar-swipe-settling", "");
      this.#layout.removeAttribute("data-sidebar-swiping");
      try {
        if (target === "closed") this.#onDismiss();
        else if (!this.#isOpen()) this.#onOpen();
      } catch (error) {
        this.cancel();
        throw error;
      }
      if (!this.#active() || generation !== this.#generation) return;
      this.#write(target === "closed" ? this.#panel.offsetHeight : 0);
      if (this.#reduced.matches) {
        this.#complete();
        return;
      }
      const style = getComputedStyle(this.#panel);
      const properties = style.transitionProperty.split(",").map((value) => value.trim());
      const durations = style.transitionDuration.split(",").map((value) => parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1e3));
      const index = properties.findLastIndex((value) => value === "translate" || value === "all");
      const duration = index < 0 ? 0 : durations[index % durations.length];
      if (!duration) this.#complete();
      else this.#timer = setTimeout(() => {
        if (this.#settling?.generation === generation) this.#complete();
      }, duration + 50);
    }
    #complete() {
      if (!this.#active()) return;
      this.#resetPose();
    }
    #resetPose() {
      this.#layout.setAttribute("data-sidebar-swipe-reset", "");
      this.#clearSettlement();
      this.#layout.removeAttribute("data-sidebar-swiping");
      this.#panel.style.removeProperty("translate");
      this.#offset = 0;
      getComputedStyle(this.#panel).getPropertyValue("clip-path");
      this.#layout.removeAttribute("data-sidebar-swipe-reset");
    }
    #transitionEnd = (event) => {
      if (event.target === this.#panel && event.propertyName === "translate" && this.#settling) this.#complete();
    };
    #motionChange = () => {
      if (this.#reduced.matches && this.#settling) this.#complete();
    };
    #click = (event) => {
      if (event.detail && performance.now() < this.#suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    /** A canonical state/mode or viewport handoff cancels transient input first. */
    cancel() {
      if (this.#disposed) return;
      ++this.#generation;
      this.#dropCapture();
      this.#resetPose();
    }
    destroy = () => {
      if (this.#disposed) return;
      this.cancel();
      this.#disposed = true;
      this.#controller.abort();
      this.#layout = this.#dock = this.#panel = this.#signal = void 0;
      this.#canSwipe = this.#isOpen = this.#onOpen = this.#onDismiss = void 0;
    };
  };

  // sidebar.js
  function setupSidebar(layout, mobileOpen, centeredContent, signal, state = {}) {
    signal?.throwIfAborted();
    const lifetime = new AbortController();
    const options = { signal: lifetime.signal };
    let disposed = false;
    const dock = layout.querySelector(".sidebar-dock");
    const panel = dock.querySelector(".sidebar-panel");
    const toggle = dock.querySelector(".sidebar-toggle");
    const handle = dock.querySelector(".sidebar-resize");
    const label = toggle.querySelector(".sidebar-toggle-label").textContent.toLowerCase();
    const compact = matchMedia("(max-width: 48rem)");
    let desktopOpen = state.desktopOpen ?? true;
    mobileOpen = state.mobileOpen ?? mobileOpen;
    let drag;
    let swipe;
    const atlas = layout.classList.contains("atlas-shell");
    const visibleViewport = window.visualViewport;
    let readyFrame;
    let observer;
    const active = () => !disposed && !signal?.aborted;
    const isOpen = () => compact.matches ? mobileOpen : desktopOpen;
    const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
    const maxWidth = () => Math.min(36 * rem(), innerWidth * (layout.dataset.sidebarDesign === "browse" ? 0.45 : 0.55));
    const minWidth = () => 14 * rem();
    function render() {
      if (!active()) return;
      const open = isOpen();
      if (!open && (panel.contains(document.activeElement) || handle === document.activeElement)) {
        toggle.focus({ preventScroll: true });
      }
      if (!active() || open !== isOpen()) return;
      layout.toggleAttribute("data-sidebar-collapsed", !open);
      panel.inert = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.title = `${open ? "Hide" : "Show"} ${label}`;
      toggle.setAttribute("aria-label", toggle.title);
      if (atlas) layout.dispatchEvent(new Event("atlas-sidebar-change"));
    }
    function setOpen(open, fromSwipe = false, animate = false) {
      if (!active()) return;
      if (atlas) layout.toggleAttribute("data-sidebar-motion-instant", !animate);
      if (!fromSwipe) swipe?.cancel();
      cancelResize();
      if (compact.matches) mobileOpen = open;
      else desktopOpen = open;
      render();
    }
    function resize(width) {
      if (!active()) return;
      const clamped = Math.max(minWidth(), Math.min(width, maxWidth()));
      layout.style.setProperty("--sidebar-width", `${clamped}px`);
    }
    function widthAtPointer(clientX) {
      const edge = drag.width + Math.max(0, drag.centeredSpace - drag.width) / 2;
      const target = edge + clientX - drag.x;
      return drag.centeredSpace > 0 && target < drag.centeredSpace ? 2 * target - drag.centeredSpace : target;
    }
    function cancelResize(restore = true) {
      const current = drag;
      drag = void 0;
      if (current && restore) {
        if (current.previous) layout.style.setProperty("--sidebar-width", current.previous);
        else layout.style.removeProperty("--sidebar-width");
      }
      layout.removeAttribute("data-sidebar-resizing");
      if (current && handle.hasPointerCapture(current.id)) handle.releasePointerCapture(current.id);
    }
    function dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      if (readyFrame !== void 0) cancelAnimationFrame(readyFrame);
      layout.removeAttribute("data-sidebar-ready");
      layout.removeAttribute("data-sidebar-motion-instant");
      swipe?.destroy();
      layout.removeAttribute("data-sidebar-keyboard");
      layout.style.removeProperty("--sidebar-visible-height");
      cancelResize();
      lifetime.abort();
      Object.assign(state, { desktopOpen, mobileOpen, width: layout.style.getPropertyValue("--sidebar-width") });
    }
    function initialize() {
      signal?.throwIfAborted();
      if (state.width) layout.style.setProperty("--sidebar-width", state.width);
      toggle.addEventListener("click", (event) => {
        setOpen(!isOpen(), false, event.detail !== 0);
      }, options);
      function updateVisibleRoom() {
        if (!active()) return;
        if (!atlas || !compact.matches) {
          layout.style.removeProperty("--sidebar-visible-height");
          return;
        }
        const top = dock.getBoundingClientRect().top;
        const visibleTop = visibleViewport?.offsetTop ?? 0;
        const visibleHeight = visibleViewport?.height ?? innerHeight;
        const room = Math.max(112, Math.min(layout.clientHeight, visibleTop + visibleHeight - top - 8));
        layout.style.setProperty("--sidebar-visible-height", `${room}px`);
        layout.toggleAttribute("data-sidebar-keyboard", mobileOpen && layout.ownerDocument.activeElement?.id === "atlas-search" && visibleHeight < innerHeight - 80);
      }
      if (atlas) {
        swipe = new SidebarSwipe({
          layout,
          dock,
          panel,
          signal: lifetime.signal,
          canSwipe: () => active() && compact.matches && !layout.hasAttribute("data-mobile-menu"),
          isOpen: () => mobileOpen,
          onOpen: () => setOpen(true, true),
          onDismiss: () => setOpen(false, true)
        });
        layout.ownerDocument.addEventListener("pointerdown", (event) => {
          if (compact.matches && mobileOpen && !dock.contains(event.target) && !event.target.closest(".atlas-mobile-actions")) setOpen(false);
        }, { capture: true, ...options });
        window.addEventListener("resize", () => {
          swipe?.cancel();
          cancelResize();
          updateVisibleRoom();
        }, options);
        visibleViewport?.addEventListener("resize", updateVisibleRoom, options);
        visibleViewport?.addEventListener("scroll", updateVisibleRoom, options);
        layout.addEventListener("focusin", updateVisibleRoom, options);
        layout.addEventListener("focusout", updateVisibleRoom, options);
        updateVisibleRoom();
        readyFrame = requestAnimationFrame(() => {
          readyFrame = void 0;
          if (active()) layout.setAttribute("data-sidebar-ready", "");
        });
      }
      handle.addEventListener("pointerdown", (event) => {
        if (!active() || compact.matches || event.button !== 0 || event.isPrimary === false || drag) return;
        const centeredSpace = centeredContent ? layout.clientWidth - parseFloat(getComputedStyle(centeredContent).maxWidth) : 0;
        drag = {
          id: event.pointerId,
          x: event.clientX,
          width: dock.offsetWidth,
          previous: layout.style.getPropertyValue("--sidebar-width"),
          centeredSpace
        };
        handle.setPointerCapture(event.pointerId);
        layout.setAttribute("data-sidebar-resizing", "");
      }, options);
      handle.addEventListener("pointermove", (event) => {
        if (event.pointerId === drag?.id) resize(widthAtPointer(event.clientX));
      }, options);
      function endDrag(event) {
        if (event.pointerId !== drag?.id) return;
        const width = widthAtPointer(event.clientX);
        if (event.type !== "pointerup" || width <= 5 * rem()) {
          cancelResize();
          if (event.type === "pointerup") setOpen(false);
        } else if (event.clientX !== drag.x) resize(width);
        cancelResize(false);
      }
      for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(event, endDrag, options);
      handle.addEventListener("keydown", (event) => {
        const width = dock.offsetWidth;
        if (event.key === "Home" || event.key === "ArrowLeft" && width <= Math.ceil(minWidth())) setOpen(false);
        else if (event.key === "End") resize(maxWidth());
        else if (event.key === "ArrowLeft") resize(width - 24);
        else if (event.key === "ArrowRight") resize(width + 24);
        else return;
        event.preventDefault();
      }, options);
      observer = new ResizeObserver(() => {
        if (!active() || compact.matches || !desktopOpen) return;
        handle.setAttribute("aria-valuenow", String(dock.offsetWidth));
        handle.setAttribute("aria-valuemax", String(Math.round(maxWidth())));
        handle.setAttribute("aria-valuetext", `${dock.offsetWidth} pixels`);
      });
      observer.observe(dock);
      compact.addEventListener("change", () => {
        if (atlas) layout.setAttribute("data-sidebar-motion-instant", "");
        swipe?.cancel();
        cancelResize();
        updateVisibleRoom();
        render();
      }, options);
      render();
    }
    signal?.addEventListener("abort", dispose, { once: true, ...options });
    try {
      initialize();
    } catch (error) {
      dispose();
      throw error;
    }
    return {
      get collapsed() {
        return !isOpen();
      },
      open() {
        setOpen(true);
      },
      closeOnMobile() {
        if (!active() || !compact.matches) return false;
        swipe?.cancel();
        if (!mobileOpen) return false;
        setOpen(false);
        return true;
      }
    };
  }
  return __toCommonJS(sidebar_exports);
})();
var { setupSidebar } = AtlasSidebar;

const viewSignal = new AbortController().signal;
const viewState = {};
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
  const unfinishedOnly = hideCompleted || missableOnly;
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

mountKenzanMap(viewSignal, viewState);
