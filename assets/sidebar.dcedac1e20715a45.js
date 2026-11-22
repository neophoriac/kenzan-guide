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

  // sidebar.js
  function setupSidebar(layout, mobileOpen, centeredContent, signal, state = {}) {
    const dock = layout.querySelector(".sidebar-dock");
    const panel = dock.querySelector(".sidebar-panel");
    const toggle = dock.querySelector(".sidebar-toggle");
    const handle = dock.querySelector(".sidebar-resize");
    const label = toggle.querySelector(".sidebar-toggle-label").textContent.toLowerCase();
    const compact = matchMedia("(max-width: 48rem)");
    let desktopOpen = state.desktopOpen ?? true;
    mobileOpen = state.mobileOpen ?? mobileOpen;
    if (state.width) layout.style.setProperty("--sidebar-width", state.width);
    let drag;
    const isOpen = () => compact.matches ? mobileOpen : desktopOpen;
    const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
    const maxWidth = () => Math.min(36 * rem(), innerWidth * (layout.dataset.sidebarDesign === "browse" ? 0.45 : 0.55));
    const minWidth = () => 14 * rem();
    function render() {
      const open = isOpen();
      if (!open && (panel.contains(document.activeElement) || handle === document.activeElement)) {
        toggle.focus({ preventScroll: true });
      }
      layout.toggleAttribute("data-sidebar-collapsed", !open);
      panel.inert = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.title = `${open ? "Hide" : "Show"} ${label}`;
      toggle.setAttribute("aria-label", toggle.title);
    }
    function setOpen(open) {
      if (compact.matches) mobileOpen = open;
      else desktopOpen = open;
      render();
    }
    function resize(width) {
      const clamped = Math.max(minWidth(), Math.min(width, maxWidth()));
      layout.style.setProperty("--sidebar-width", `${clamped}px`);
    }
    function widthAtPointer(clientX) {
      const edge = drag.width + Math.max(0, drag.centeredSpace - drag.width) / 2;
      const target = edge + clientX - drag.x;
      return drag.centeredSpace > 0 && target < drag.centeredSpace ? 2 * target - drag.centeredSpace : target;
    }
    toggle.addEventListener("click", () => setOpen(!isOpen()), { signal });
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !event.isPrimary || drag) return;
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
    }, { signal });
    handle.addEventListener("pointermove", (event) => {
      if (event.pointerId === drag?.id) resize(widthAtPointer(event.clientX));
    }, { signal });
    function endDrag(event) {
      if (event.pointerId !== drag?.id) return;
      const width = widthAtPointer(event.clientX);
      if (event.type !== "pointerup" || width <= 5 * rem()) {
        layout.style.setProperty("--sidebar-width", drag.previous);
        if (event.type === "pointerup") setOpen(false);
      } else if (event.clientX !== drag.x) resize(width);
      drag = void 0;
      layout.removeAttribute("data-sidebar-resizing");
    }
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(event, endDrag, { signal });
    handle.addEventListener("keydown", (event) => {
      const width = dock.offsetWidth;
      if (event.key === "Home" || event.key === "ArrowLeft" && width <= Math.ceil(minWidth())) setOpen(false);
      else if (event.key === "End") resize(maxWidth());
      else if (event.key === "ArrowLeft") resize(width - 24);
      else if (event.key === "ArrowRight") resize(width + 24);
      else return;
      event.preventDefault();
    }, { signal });
    const observer = new ResizeObserver(() => {
      if (compact.matches || !desktopOpen) return;
      handle.setAttribute("aria-valuenow", String(dock.offsetWidth));
      handle.setAttribute("aria-valuemax", String(Math.round(maxWidth())));
      handle.setAttribute("aria-valuetext", `${dock.offsetWidth} pixels`);
    });
    signal?.addEventListener("abort", () => {
      observer.disconnect();
      if (drag && handle.hasPointerCapture(drag.id)) handle.releasePointerCapture(drag.id);
      drag = void 0;
      layout.removeAttribute("data-sidebar-resizing");
      Object.assign(state, { desktopOpen, mobileOpen, width: layout.style.getPropertyValue("--sidebar-width") });
    }, { once: true });
    observer.observe(dock);
    compact.addEventListener("change", render, { signal });
    render();
    return {
      get collapsed() {
        return !isOpen();
      },
      open() {
        setOpen(true);
      },
      closeOnMobile() {
        if (!compact.matches || !mobileOpen) return false;
        setOpen(false);
        return true;
      }
    };
  }
  return __toCommonJS(sidebar_exports);
})();
var { setupSidebar } = AtlasSidebar;
