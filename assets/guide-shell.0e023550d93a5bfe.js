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

// These URLs work before JavaScript runs, including copied and new-tab links.
function kenzanMapHref(data) {
  const parameters = new URLSearchParams();
  const fields = { mapQuest: 'quest', mapRevelation: 'activity', mapPlace: 'pin',
    mapCollectible: 'collectible', mapArea: 'area', mapStreet: 'street' };
  for (const [field, parameter] of Object.entries(fields)) {
    if (data[field] !== undefined && data[field] !== '') parameters.set(parameter, data[field]);
  }
  if (data.mapLockerKey) parameters.set('pin', 'locker:' + data.mapLockerKey);
  if (data.mapRevelation === 'shichigoro') parameters.set('pin', 'shichigoro');
  if (/^\d+$/.test(String(data.mapStep)) && (parameters.has('quest') || parameters.has('activity'))) {
    parameters.set('step', Number(data.mapStep) + 1);
  }
  return '#quest-map' + (parameters.size ? '?' + parameters : '');
}

if (typeof module !== 'undefined' && module.exports) {
  const entities = { amp: '&', apos: "'", quot: '"', lt: '<', gt: '>' };
  const decode = text => text.replace(/&(#x[\da-f]+|#\d+|amp|apos|quot|lt|gt);/gi, (entity, key) => {
    if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? entity;
    const number = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
  });
  function withGuideMapURLs(html) {
    return html.replace(/<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, tag => {
      if (!/\bhref\s*=(["'])#quest-map\1/i.test(tag)) return tag;
      const data = {};
      for (const [, name, , value] of tag.matchAll(/\bdata-map-([\w-]+)\s*=(["'])(.*?)\2/gi)) {
        data['map-' + name.toLowerCase()] = decode(value);
      }
      const normalized = Object.fromEntries(Object.entries(data).map(([key, value]) =>
        [key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
      const href = kenzanMapHref(normalized).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
      return tag.replace(/\bhref\s*=(["'])#quest-map\1/i, `href="${href}"`);
    });
  }
  module.exports = { kenzanMapHref, withGuideMapURLs };
}

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

mountKenzanStorageNotice();
kenzanViews.start();
