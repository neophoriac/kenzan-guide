function mountKenzanAtlas(viewSignal, viewState) {
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

var AtlasRuntime = (() => {
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

  // index.js
  var index_exports = {};
  __export(index_exports, {
    AtlasSceneNativeRasterMath: () => AtlasSceneNativeRasterMath,
    AtlasSceneRasterMath: () => AtlasSceneRasterMath,
    atlasAppendFacts: () => atlasAppendFacts,
    atlasAppendTooltip: () => atlasAppendTooltip,
    atlasBrowseFold: () => atlasBrowseFold,
    atlasBrowseMatches: () => atlasBrowseMatches,
    atlasCanvasCurve: () => atlasCanvasCurve,
    atlasCanvasDashPolyline: () => atlasCanvasDashPolyline,
    atlasCanvasPinImage: () => atlasCanvasPinImage,
    atlasCanvasPinStyle: () => atlasCanvasPinStyle,
    atlasCanvasRouteArrowImage: () => atlasCanvasRouteArrowImage,
    atlasCanvasWrapLabel: () => atlasCanvasWrapLabel,
    atlasClusterTooltip: () => atlasClusterTooltip,
    atlasCurveSegments: () => atlasCurveSegments,
    atlasLinkFields: () => atlasLinkFields,
    atlasLinkParams: () => atlasLinkParams,
    atlasPinIconUrl: () => atlasPinIconUrl,
    atlasPinPopoverLayout: () => atlasPinPopoverLayout,
    atlasPlaceLink: () => atlasPlaceLink,
    atlasPlacePinDimensions: () => atlasPlacePinDimensions,
    atlasPlacePinMetrics: () => atlasPlacePinMetrics,
    atlasPlacePinSize: () => atlasPlacePinSize,
    atlasPlacePinWidths: () => atlasPlacePinWidths,
    atlasPlaceTooltip: () => atlasPlaceTooltip,
    atlasRouteTooltip: () => atlasRouteTooltip,
    atlasSampleWheelEasing: () => atlasSampleWheelEasing,
    atlasShareURL: () => atlasShareURL,
    atlasTeardrop: () => atlasTeardrop,
    atlasWheelDelta: () => atlasWheelDelta,
    atlasWheelRetargetControl: () => atlasWheelRetargetControl,
    atlasWheelTargetScale: () => atlasWheelTargetScale,
    atlasZoomTransform: () => atlasZoomTransform,
    attachAtlasPinIcon: () => attachAtlasPinIcon,
    clearPyramidRaster: () => clearPyramidRaster,
    createAtlasBrowseIndex: () => createAtlasBrowseIndex,
    createAtlasCanvasRenderer: () => createAtlasCanvasRenderer,
    createAtlasCurveLabels: () => createAtlasCurveLabels,
    createAtlasPyramid: () => createAtlasPyramid,
    createAtlasSceneNativeRaster: () => createAtlasSceneNativeRaster,
    createAtlasSceneObjectBrowser: () => createAtlasSceneObjectBrowser,
    createAtlasSceneRasterLayer: () => createAtlasSceneRasterLayer,
    createAtlasTileByteCache: () => createAtlasTileByteCache,
    createAtlasTileStreamTransport: () => createAtlasTileStreamTransport,
    mountAtlas: () => mountAtlas,
    mountAtlasLinkSharing: () => mountAtlasLinkSharing,
    mountAtlasProject: () => mountAtlasProject,
    mountPhotoViewer: () => mountPhotoViewer,
    paintPyramidTiles: () => paintPyramidTiles,
    preparePyramidGrid: () => preparePyramidGrid,
    pyramidRasterBounds: () => pyramidRasterBounds,
    readAtlasLink: () => readAtlasLink,
    setupAtlasBrowse: () => setupAtlasBrowse,
    setupSidebar: () => setupSidebar,
    visiblePyramidTiles: () => visiblePyramidTiles
  });

  // pin-icons.js
  function atlasPinIconUrl(source) {
    if (typeof source !== "string" || !source.trim()) return void 0;
    const url = source.trim();
    if (/^data:image\/(?:apng|avif|bmp|gif|jpeg|png|svg\+xml|webp|x-icon|vnd\.microsoft\.icon)(?:;|,)/i.test(url)) return url;
    try {
      const { protocol } = new URL(url, "https://atlas.invalid/");
      if (protocol === "http:" || protocol === "https:" || protocol === "file:") return url;
    } catch {
    }
  }
  function attachAtlasPinIcon(target, source, signal, onLoad) {
    const url = atlasPinIconUrl(source);
    if (!url) return;
    const document2 = target.ownerDocument;
    const image = document2.createElement("img");
    image.className = "atlas-marker-art";
    image.alt = "";
    image.draggable = false;
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.hidden = true;
    const fallback = document2.createElement("span");
    fallback.textContent = target.textContent;
    target.replaceChildren(fallback, image);
    image.src = url;
    image.decode().then(() => {
      if (signal.aborted || !image.naturalWidth || !image.naturalHeight) return;
      image.hidden = false;
      fallback.style.visibility = "hidden";
      if (image.isConnected) onLoad?.();
    }, () => {
    });
    return image;
  }

  // browse.js
  function atlasBrowseFold(value) {
    return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, "");
  }
  function atlasBrowseMatches(record, query) {
    let text = atlasBrowseFold(query).trim();
    const questNumber = text.match(/#\s*(\d+)\b/);
    if (questNumber) {
      if (record.kind !== "quest" || Number(record.source.id) !== Number(questNumber[1])) return false;
      text = text.replace(questNumber[0], "");
    }
    const key = text.match(/\b([a-j])\s*-?\s*(\d{1,2})\b/);
    if (key) {
      if (record.place?.type !== "locker-key" || atlasBrowseFold(record.place.id).replace(/^locker:/, "") !== `${key[1]}-${Number(key[2])}`) return false;
      text = text.replace(key[0], "");
    }
    return text.split(/\s+/).filter(Boolean).every((term) => record.search.includes(term));
  }
  function createAtlasBrowseIndex({ quests, places, linkedRoutes, locations, byArea, questTypes, placeTypes, layerIcons, layerLabels = {}, layerColors = {}, config }) {
    const records = [];
    const displayType = (type) => config.typeLabels?.[type] ?? type;
    function add(record, aliases = []) {
      record.areaLabel = byArea.get(record.area)?.label ?? "";
      record.label = displayType(record.type);
      record.search = atlasBrowseFold([record.name, record.label, record.type, record.areaLabel, ...aliases].filter(Boolean).join(" "));
      records.push(record);
    }
    for (const quest of quests) add({
      key: "quest:" + quest.id,
      kind: "quest",
      source: quest,
      name: `#${quest.id} ${quest.name}`,
      area: quest.pin.area,
      type: quest.type,
      layer: questTypes[quest.type]?.layer,
      color: questTypes[quest.type]?.color,
      icon: quest.icon ?? questTypes[quest.type]?.icon
    }, [quest.where, quest.target]);
    for (const route of linkedRoutes) add({
      key: "route:" + route.id + ":" + Boolean(route.retry),
      kind: "route",
      source: route,
      place: route.place,
      name: route.name,
      area: route.place.area,
      type: route.type,
      layer: route.place.type,
      color: placeTypes[route.place.type]?.color,
      icon: route.place.icon ?? placeTypes[route.place.type]?.icon ?? layerIcons[route.place.type]
    }, [route.place.name]);
    for (const [index, place] of places.entries()) {
      if (place.routes?.length) continue;
      const entries = place.entries?.length ? place.entries : [null];
      for (const [entryIndex, entry] of entries.entries()) add(
        {
          key: `place:${index}:${entryIndex}`,
          kind: "place",
          source: place,
          place,
          entry,
          name: entry?.name ?? place.name,
          area: place.area,
          type: place.type,
          layer: place.type,
          label: placeTypes[place.type]?.label,
          color: place.color ?? placeTypes[place.type]?.color,
          icon: place.icon ?? placeTypes[place.type]?.icon ?? layerIcons[place.type]
        },
        [
          place.name,
          place.location,
          place.pickup?.summary,
          place.pickup?.reward,
          ...(entry?.facts ?? place.pickup?.facts ?? []).map((fact) => fact.value)
        ]
      );
    }
    for (const location2 of locations.values()) add({
      key: "location:" + location2.key,
      kind: "location",
      source: location2,
      name: location2.name,
      area: location2.area,
      type: location2.type,
      layer: location2.layer ?? location2.type,
      color: layerColors[location2.layer ?? location2.type] ?? "#5b4932",
      icon: layerIcons[location2.layer ?? location2.type]
    });
    for (const record of records) {
      if (record.kind === "place") record.label = layerLabels[record.type] ?? placeTypes[record.type]?.legend ?? placeTypes[record.type]?.label ?? record.type;
      else if (record.kind === "location") record.label = layerLabels[record.type] ?? (record.type === "area" ? "Area" : record.type === "street" ? "Street" : "District");
      record.search += " " + atlasBrowseFold(record.label);
    }
    return records;
  }
  function setupAtlasBrowse({ shell, signal, state = {}, records, onFilter, onSelect }) {
    const query = (selector) => shell.querySelector(selector);
    const toggle = query(".atlas-search-toggle");
    const field = query("#atlas-search-field");
    const input = query("#atlas-search");
    const clear = query("#atlas-clear-search");
    const list = query("#atlas-browse-list");
    const more = query("#atlas-browse-more");
    const empty = query(".atlas-browse-empty");
    const status = query("#atlas-search-status");
    const panes = { map: query("#atlas-map-panel"), browse: query("#atlas-browse-panel") };
    const tabs = [...shell.querySelectorAll("[data-atlas-pane]")];
    const scroll = { map: 0, browse: 0 };
    let pane = state.pane === "browse" ? "browse" : "map";
    let text = typeof state.query === "string" ? state.query.slice(0, 200) : "";
    let limit = 40, matching = [], currentKey, announceTimer;
    let searchOpen = Boolean(text);
    const recordByKey = new Map(records.map((record) => [record.key, record]));
    function save() {
      Object.assign(state, { pane, query: text });
    }
    function renderSearch() {
      field.hidden = !searchOpen;
      toggle.setAttribute("aria-expanded", String(searchOpen));
      clear.hidden = !text;
      if (input.value !== text) input.value = text;
    }
    function setPane(next, focus = false) {
      scroll[pane] = panes[pane].scrollTop;
      pane = next;
      for (const [name, panel] of Object.entries(panes)) panel.hidden = name !== pane;
      for (const tab of tabs) {
        const active = tab.dataset.atlasPane === pane;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus({ preventScroll: true });
      }
      panes[pane].scrollTop = scroll[pane];
      save();
    }
    function setQuery(value) {
      text = value.slice(0, 200);
      searchOpen = true;
      limit = 40;
      setPane("browse");
      renderSearch();
      onFilter();
      save();
    }
    toggle.addEventListener("click", () => {
      if (searchOpen && !text) {
        searchOpen = false;
        renderSearch();
        return;
      }
      searchOpen = true;
      renderSearch();
      input.focus({ preventScroll: true });
    }, { signal });
    input.addEventListener("input", () => setQuery(input.value), { signal });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (text) setQuery("");
      else {
        searchOpen = false;
        renderSearch();
        toggle.focus({ preventScroll: true });
      }
    }, { signal });
    clear.addEventListener("click", () => {
      setQuery("");
      input.focus({ preventScroll: true });
    }, { signal });
    query("[data-atlas-clear-query]").addEventListener("click", () => {
      setQuery("");
      input.focus({ preventScroll: true });
    }, { signal });
    query("[data-atlas-all-windows]")?.addEventListener("click", () => {
      const picker = query("#atlas-objective");
      picker.value = "";
      picker.dispatchEvent(new Event("change", { bubbles: true }));
    }, { signal });
    query("[data-atlas-clear-filters]").addEventListener("click", () => {
      query("#atlas-type").value = "";
      for (const selector of ["#atlas-unfinished", "#atlas-missable", "#atlas-hide-collected"]) {
        const element = query(selector);
        if (element?.checked) {
          element.checked = false;
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      onFilter();
    }, { signal });
    for (const tab of tabs) {
      tab.addEventListener("click", () => setPane(tab.dataset.atlasPane), { signal });
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        setPane(event.key === "Home" ? "map" : event.key === "End" ? "browse" : pane === "map" ? "browse" : "map", true);
      }, { signal });
    }
    function row(record) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.browseKey = record.key;
      button.className = "atlas-browse-result";
      if (currentKey === record.key) button.setAttribute("aria-current", "true");
      const symbol = document.createElement("span");
      symbol.className = "collectible-symbol atlas-browse-icon";
      symbol.setAttribute("aria-hidden", "true");
      if (record.color) symbol.style.setProperty("--collectible-color", record.color);
      if (record.kind === "quest") {
        symbol.classList.add("atlas-browse-number");
        symbol.textContent = record.source.id;
      } else if (atlasPinIconUrl(record.icon)) {
        symbol.dataset.atlasIcon = atlasPinIconUrl(record.icon);
        attachAtlasPinIcon(symbol, record.icon, signal);
      }
      const copy = document.createElement("span");
      copy.className = "atlas-browse-copy";
      const name = document.createElement("span");
      name.className = "atlas-browse-name";
      name.textContent = record.name;
      const meta = document.createElement("span");
      meta.className = "atlas-browse-meta";
      meta.textContent = `${record.areaLabel} · ${record.label}`;
      copy.append(name, meta);
      button.append(symbol, copy);
      li.append(button);
      return li;
    }
    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-browse-key]");
      if (!button || !list.contains(button)) return;
      const record = recordByKey.get(button.dataset.browseKey);
      if (record) onSelect(record, button);
    }, { signal });
    function renderRows() {
      const active = document.activeElement;
      const activeKey = list.contains(active) && active.dataset.browseKey;
      list.replaceChildren(...matching.slice(0, limit).map(row));
      more.hidden = matching.length <= limit;
      empty.hidden = matching.length !== 0;
      if (activeKey) (list.querySelector(`[data-browse-key="${CSS.escape(activeKey)}"]`) ?? query("#atlas-type")).focus({ preventScroll: true });
    }
    more.addEventListener("click", () => {
      limit += 40;
      renderRows();
    }, { signal });
    renderSearch();
    setPane(pane);
    signal.addEventListener("abort", () => {
      clearTimeout(announceTimer);
      save();
    }, { once: true });
    return {
      get query() {
        return text;
      },
      get pane() {
        return pane;
      },
      matches: (record) => atlasBrowseMatches(record, text),
      resetLimit() {
        limit = 40;
      },
      setPane,
      setQuery,
      update(next, selectedKey) {
        matching = next;
        currentKey = selectedKey;
        renderRows();
        query("[data-atlas-browse-count]").textContent = next.length;
        query("#atlas-count").textContent = `${next.length} match${next.length === 1 ? "" : "es"}`;
        clearTimeout(announceTimer);
        announceTimer = setTimeout(() => {
          if (!signal.aborted) status.textContent = `${next.length} matching map locations`;
        }, 250);
      },
      markCurrent(key) {
        currentKey = key;
        for (const button of list.querySelectorAll("[data-browse-key]")) {
          if (button.dataset.browseKey === key) button.setAttribute("aria-current", "true");
          else button.removeAttribute("aria-current");
        }
      }
    };
  }

  // details.js
  function atlasAppendFacts(container, source, { omit = [] } = {}) {
    if (!source) return;
    const factKey = (fact) => JSON.stringify([fact.label, fact.value, fact.note ?? ""]);
    const sectionKey = (section) => JSON.stringify([section.label ?? "", section.note ?? "", (section.facts ?? []).map(factKey)]);
    const omitted = new Set(omit.flatMap((item) => item?.facts ?? []).map(factKey));
    const omittedSections = new Set(omit.flatMap((item) => item?.factSections ?? []).map(sectionKey));
    const appendGrid = (target, facts, skipFacts = false) => {
      const entries = (facts ?? []).filter((fact) => fact.label && fact.value !== void 0 && fact.value !== "" && (skipFacts || !omitted.has(factKey(fact))));
      if (!entries.length) return false;
      const list = document.createElement("dl");
      list.className = "atlas-facts";
      for (const fact of entries) {
        const row = document.createElement("div");
        const label = document.createElement("dt");
        label.textContent = fact.label;
        const value = document.createElement("dd");
        const text = document.createElement("span");
        text.className = "atlas-fact-value";
        text.textContent = fact.value;
        value.append(text);
        if (fact.note) {
          const note = document.createElement("span");
          note.className = "atlas-fact-note";
          note.textContent = fact.note;
          value.append(note);
        }
        row.append(label, value);
        list.append(row);
      }
      target.append(list);
      return true;
    };
    appendGrid(container, source.facts);
    for (const section of source.factSections ?? []) {
      if (omittedSections.has(sectionKey(section))) continue;
      const group = document.createElement("section");
      group.className = "atlas-fact-section";
      if (!appendGrid(group, section.facts, true)) continue;
      if (section.note) {
        const note = document.createElement("p");
        note.className = "atlas-fact-note";
        note.textContent = section.note;
        group.prepend(note);
      }
      if (section.label) {
        const heading = document.createElement("h4");
        heading.textContent = section.label;
        group.prepend(heading);
      }
      container.append(group);
    }
  }

  // navigation.js
  var atlasLinkFields = { pin: "place", quest: "quest", activity: "route", collectible: "collectible", location: "location", area: "area", street: "street" };
  function atlasLinkParams(link, parameters = new URLSearchParams()) {
    for (const [parameter, field] of Object.entries(atlasLinkFields)) {
      if (link[field] !== void 0) parameters.set(parameter, link[field]);
    }
    if (link.quest !== void 0 || link.route !== void 0) {
      if (Number.isSafeInteger(link.step) && link.step >= 0) parameters.set("step", link.step + 1);
      if (link.interior !== void 0) parameters.set("inside", link.interior ? "1" : "0");
      if (link.retry) parameters.set("retry", "1");
    }
    return parameters;
  }
  function readAtlasLink(parameters) {
    const link = {};
    for (const [parameter, field] of Object.entries(atlasLinkFields)) {
      const value = parameters.get(parameter);
      if (value) link[field] = value;
    }
    if (link.quest !== void 0 || link.route !== void 0) {
      const step = parameters.get("step") ?? "";
      if (/^[1-9]\d*$/.test(step) && Number.isSafeInteger(Number(step))) link.step = Number(step) - 1;
      const inside = parameters.get("inside");
      if (inside === "0" || inside === "1") link.interior = inside === "1";
      if (parameters.get("retry") === "1") link.retry = true;
    }
    return link;
  }
  function atlasShareURL(fragment) {
    const url = new URL(window.location.href);
    if (!["http:", "https:", "file:"].includes(url.protocol)) return void 0;
    url.hash = String(fragment);
    return url.href;
  }
  function atlasPlaceLink(place) {
    return String(place.linkId ?? place.id ?? JSON.stringify([place.area, place.type, place.name, place.x, place.y]));
  }

  // photo-viewer.js
  function mountPhotoViewer(dialog, signal, fallbackFocus) {
    const title = dialog.querySelector("h2");
    const image = dialog.querySelector("img");
    let returnFocus;
    const clearImage = () => {
      image.removeAttribute("src");
      image.style.backgroundImage = "";
    };
    dialog.addEventListener("close", () => {
      clearImage();
      const previous = returnFocus;
      returnFocus = void 0;
      if (!signal?.aborted) (previous?.isConnected ? previous : fallbackFocus)?.focus({ preventScroll: true });
    }, { signal });
    signal?.addEventListener("abort", () => {
      if (dialog.open) dialog.close();
      clearImage();
      returnFocus = void 0;
    }, { once: true });
    return function openPhoto(photo, name, trigger) {
      if (dialog.open || signal?.aborted) return;
      returnFocus = trigger;
      title.textContent = name;
      dialog.style.setProperty("--atlas-photo-ratio", photo.width / photo.height);
      image.alt = `Location screenshot for ${name}`;
      image.width = photo.width;
      image.height = photo.height;
      image.style.backgroundImage = `url(${JSON.stringify(photo.preview)})`;
      image.src = photo.source;
      dialog.showModal();
    };
  }

  // pin-model.js
  var atlasTeardrop = Object.freeze({
    width: 18,
    height: 26,
    headY: 9,
    path: "M9 25.5C8.5 25.5 8.2 25 8 24.5 6 18.8.5 14 .5 9a8.5 8.5 0 1 1 17 0c0 5-5.5 9.8-7.5 15.5-.2.5-.5 1-1 1Z"
  });
  var atlasPlacePinWidths = Object.freeze({ small: 14, medium: 18, large: 24, larger: 32 });
  var atlasPlacePinDimensions = Object.freeze(Object.fromEntries(Object.values(atlasPlacePinWidths).map((width) => {
    const ratio = width / atlasTeardrop.width;
    const height = atlasTeardrop.height * ratio;
    return [width, Object.freeze({
      centered: Object.freeze({ width, height: width, anchorY: width / 2, headY: width / 2, inset: 1 }),
      teardrop: Object.freeze({ width, height, anchorY: height, headY: atlasTeardrop.headY * ratio, inset: 0 })
    })];
  })));
  function atlasPlacePinSize(size) {
    return typeof size === "string" && Object.hasOwn(atlasPlacePinWidths, size) ? size : "medium";
  }
  function atlasPlacePinMetrics(place) {
    const dimensions = atlasPlacePinDimensions[atlasPlacePinWidths[atlasPlacePinSize(place.size)]];
    return place.shape === "teardrop" ? dimensions.teardrop : dimensions.centered;
  }

  // coordinates.js
  function areaPointToWorld(area, point) {
    return { x: area.x + point.x * area.w, y: area.y + point.y * area.h };
  }
  function areaLabelToWorld(area, point) {
    return [Number((area.x + point[0] * area.w).toFixed(2)), Number((area.y + point[1] * area.h).toFixed(2))];
  }
  function worldToViewport(pose, point) {
    return { x: pose.x + point.x * pose.scale, y: pose.y + point.y * pose.scale };
  }

  // pin-popover.js
  function atlasPinPopoverLayout({ pin, width, height, viewportWidth, viewportHeight, obstacles = [], padding = 12, gap = 14 }) {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const x = clamp(pin.x - width / 2, padding, Math.max(padding, viewportWidth - padding - width));
    const centeredY = clamp(pin.y - height / 2, padding, Math.max(padding, viewportHeight - padding - height));
    const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    const fits = (box2) => box2.x >= padding && box2.y >= padding && box2.x + box2.width <= viewportWidth - padding && box2.y + box2.height <= viewportHeight - padding && !obstacles.some((obstacle) => overlaps(box2, obstacle));
    const box = (side2, bx, by, bh = height) => ({ side: side2, x: bx, y: by, width, height: bh });
    function detached() {
      let gaps = [[padding, viewportHeight - padding]];
      for (const obstacle of obstacles.filter((obstacle2) => x < obstacle2.x + obstacle2.width && x + width > obstacle2.x)) {
        const top = obstacle.y - padding, bottom = obstacle.y + obstacle.height + padding;
        gaps = gaps.flatMap(([start2, end2]) => bottom <= start2 || top >= end2 ? [[start2, end2]] : [[start2, Math.min(end2, top)], [Math.max(start2, bottom), end2]].filter(([a, b]) => b > a));
      }
      const [start, end] = gaps.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0] ?? [padding, viewportHeight - padding];
      const boundedHeight = Math.min(height, end - start);
      return {
        ...box("detached", x, clamp(centeredY, start, end - boundedHeight), boundedHeight),
        constrained: boundedHeight < height - 0.5,
        pointer: void 0
      };
    }
    if (pin.x < 0 || pin.x > viewportWidth || pin.y < 0 || pin.y > viewportHeight) {
      return detached();
    }
    const candidates = [
      box("above", x, pin.top - gap - height),
      box("below", x, pin.bottom + gap),
      box("right", pin.right + gap, centeredY),
      box("left", pin.left - gap - width, centeredY)
    ];
    let result = candidates.find(fits);
    if (!result) {
      const crossing = obstacles.filter((obstacle) => x < obstacle.x + obstacle.width && x + width > obstacle.x);
      const top = Math.max(padding, ...crossing.filter((obstacle) => obstacle.y + obstacle.height <= pin.top).map((obstacle) => obstacle.y + obstacle.height + padding));
      const bottom = Math.min(viewportHeight - padding, ...crossing.filter((obstacle) => obstacle.y >= pin.bottom).map((obstacle) => obstacle.y - padding));
      let aboveEnd = pin.top - gap, belowStart = pin.bottom + gap;
      for (const obstacle of crossing) {
        if (obstacle.y < aboveEnd && obstacle.y + obstacle.height >= aboveEnd) aboveEnd = obstacle.y - padding;
        if (obstacle.y <= belowStart && obstacle.y + obstacle.height > belowStart) belowStart = obstacle.y + obstacle.height + padding;
      }
      const above = Math.max(0, aboveEnd - top);
      const below = Math.max(0, bottom - belowStart);
      if (above >= below) result = box("above", x, aboveEnd - Math.min(height, above), Math.min(height, above));
      else result = box("below", x, belowStart, Math.min(height, below));
      if (result.height < 80) return detached();
    }
    const { side } = result, edge = 20;
    let base, tip, tangent;
    if (side === "above" || side === "below") {
      base = {
        x: clamp(pin.x, result.x + edge, result.x + width - edge),
        y: side === "above" ? result.y + result.height - 1 : result.y + 1
      };
      tip = { x: pin.x, y: side === "above" ? pin.top - 2 : pin.bottom + 2 };
      tangent = { x: 8, y: 0 };
    } else if (side === "left" || side === "right") {
      base = {
        x: side === "left" ? result.x + width - 1 : result.x + 1,
        y: clamp(pin.y, result.y + edge, result.y + result.height - edge)
      };
      tip = { x: side === "left" ? pin.left - 2 : pin.right + 2, y: pin.y };
      tangent = { x: 0, y: 8 };
    }
    const visible = !obstacles.some((obstacle) => pin.x >= obstacle.x && pin.x <= obstacle.x + obstacle.width && pin.y >= obstacle.y && pin.y <= obstacle.y + obstacle.height);
    const pointer2 = base && visible ? [tip.x - base.x, tip.y - base.y, tangent.x, tangent.y, base.x, base.y] : void 0;
    return { ...result, constrained: result.height < height - 0.5, pointer: pointer2 };
  }

  // scene-accessibility.js
  function createAtlasSceneObjectBrowser({ viewport, toolbar, signal, getRecords, select, highlight, onSelected }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "atlas-object-browser-button";
    button.textContent = "Objects";
    button.setAttribute("aria-haspopup", "dialog");
    button.title = "Find and select map objects with the keyboard";
    toolbar.append(button);
    const dialog = document.createElement("dialog");
    dialog.className = "atlas-share-dialog atlas-object-browser";
    dialog.setAttribute("aria-label", "Map objects");
    const header = document.createElement("div");
    header.className = "atlas-share-dialog-header";
    const heading = document.createElement("h2");
    heading.textContent = "Map objects";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    header.append(heading, close);
    const field = document.createElement("input");
    field.type = "search";
    field.placeholder = "Find an object";
    field.setAttribute("aria-label", "Find a map object");
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const list = document.createElement("ul");
    list.className = "atlas-object-browser-list";
    const pages = document.createElement("div");
    pages.className = "atlas-object-browser-pages";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.textContent = "Previous";
    const next = document.createElement("button");
    next.type = "button";
    next.textContent = "Next";
    pages.append(previous, next);
    dialog.append(header, field, status, list, pages);
    viewport.append(dialog);
    let records = [], matches = [], page = 0, returnTarget, picked = false;
    const size = 40;
    function render() {
      const words = atlasBrowseFold(field.value).trim().split(/\s+/).filter(Boolean);
      matches = records.filter((record) => words.every((word) => atlasBrowseFold(record.name + " " + (record.label ?? "")).includes(word)));
      page = Math.max(0, Math.min(page, Math.ceil(matches.length / size) - 1));
      const start = page * size;
      const rows = matches.slice(start, start + size).map((record, index) => {
        const row = document.createElement("li");
        row.setAttribute("aria-posinset", String(start + index + 1));
        row.setAttribute("aria-setsize", String(matches.length));
        const control = document.createElement("button");
        control.type = "button";
        control.textContent = record.name;
        if (record.label) {
          const meta = document.createElement("small");
          meta.textContent = record.label;
          control.append(meta);
        }
        control.addEventListener("focus", () => highlight?.(record));
        control.addEventListener("click", () => {
          picked = true;
          dialog.close();
          select(record);
        });
        row.append(control);
        return row;
      });
      list.replaceChildren(...rows);
      previous.disabled = !page;
      next.disabled = start + size >= matches.length;
      status.textContent = matches.length ? `${start + 1}–${Math.min(start + size, matches.length)} of ${matches.length} objects` : "No matching objects";
    }
    function open(choices) {
      records = choices ?? getRecords();
      field.value = "";
      page = 0;
      returnTarget = document.activeElement;
      render();
      dialog.showModal();
      field.focus();
    }
    button.addEventListener("click", () => open(), { signal });
    close.addEventListener("click", () => dialog.close(), { signal });
    field.addEventListener("input", () => {
      page = 0;
      render();
    }, { signal });
    previous.addEventListener("click", () => {
      page--;
      render();
      list.querySelector("button")?.focus();
    }, { signal });
    next.addEventListener("click", () => {
      page++;
      render();
      list.querySelector("button")?.focus();
    }, { signal });
    dialog.addEventListener("close", () => {
      highlight?.();
      if (picked && onSelected) {
        picked = false;
        onSelected();
      } else {
        picked = false;
        (returnTarget?.isConnected ? returnTarget : viewport).focus({ preventScroll: true });
      }
    }, { signal });
    viewport.addEventListener("keydown", (event) => {
      if (event.altKey && event.key.toLowerCase() === "o" && !dialog.open) {
        event.preventDefault();
        open();
      }
    }, { signal });
    signal.addEventListener("abort", () => {
      if (dialog.open) dialog.close();
      dialog.remove();
      button.remove();
    }, { once: true });
    return { open, update() {
      if (dialog.open) {
        records = getRecords();
        render();
      }
    } };
  }

  // scene-curve-labels.js
  async function createAtlasCurveLabels({
    map,
    curves,
    toWorld,
    toLngLat,
    maxScale,
    signal,
    canCommit = () => true,
    onChange = () => {
    }
  }) {
    const makeRecords = (curves2) => curves2.map((feature, index) => ({
      feature,
      index,
      id: feature.properties.atlasId,
      source: "atlas-curve-image-" + index,
      normal: "atlas-curve-image-" + index,
      overlay: "atlas-curve-image-" + index + "-selection",
      color: void 0,
      image: void 0
    }));
    let records = makeRecords(curves);
    const ownedSources = /* @__PURE__ */ new Set();
    const byteLimit = 64 * 1024 * 1024, edgeLimit = 4096;
    let disposed = false, generation = 0, mounted = false, normalBefore, overlayBefore, state, preparation;
    const owner = "atlas-caption-" + (globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2));
    let imageSequence = 0;
    let preparedRatio = 0, pendingRatio, bytes = 0, fallbacks = [];
    const alive = () => !disposed && !signal?.aborted;
    const ratio = () => map.getCanvas().width / (map.getCanvas().clientWidth || 1) || 1;
    const rgb = (hex) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
    const canceled = () => new DOMException("Atlas curve label preparation canceled.", "AbortError");
    const readMaximumScale = () => typeof maxScale === "function" ? maxScale() : maxScale;
    function uninstall(record) {
      for (const id of [record.normal, record.overlay]) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(record.source)) map.removeSource(record.source);
    }
    async function render(record, pixelRatio, remaining, jobSignal) {
      const p = record.feature.properties, points = record.feature.geometry.coordinates.map(toWorld);
      const maximumScale = readMaximumScale();
      if (!(p.fontSize > 0) || p.fontSize * maximumScale > 240 + 1e-8) throw Error("Font-cap cohort uses native text.");
      const scale = Math.max(1, maximumScale * pixelRatio), ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg"), defs = document.createElementNS(ns, "defs");
      const path = document.createElementNS(ns, "path"), text = document.createElementNS(ns, "text");
      const textPath = document.createElementNS(ns, "textPath");
      svg.style.cssText = "position:fixed;left:-100000px;top:-100000px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:visible";
      svg.setAttribute("xmlns", ns);
      path.id = owner + "-" + ++imageSequence;
      const ordered = points.at(-1)[0] < points[0][0] ? [...points].reverse() : points;
      path.setAttribute("d", "M " + ordered.map((point) => point.join(",")).join(" L "));
      defs.append(path);
      svg.append(defs, text);
      text.append(textPath);
      text.setAttribute("style", "font-family:Segoe UI,sans-serif;font-weight:700;font-kerning:none;font-size:" + p.fontSize + "px;letter-spacing:" + (p.letterSpacing * p.fontSize || 0) + "px;paint-order:stroke fill;stroke-linejoin:round;text-anchor:middle;dominant-baseline:central");
      text.setAttribute("fill", p.labelColor);
      text.setAttribute("stroke", p.haloColor);
      text.setAttribute("stroke-width", p.haloWidth * 2);
      text.setAttribute("color-interpolation", "sRGB");
      textPath.setAttribute("href", "#" + path.id);
      textPath.setAttribute("startOffset", "50%");
      textPath.textContent = p.name;
      let url, image;
      try {
        document.body.append(svg);
        const b = text.getBBox(), pad = p.haloWidth + 2 / scale;
        if (![b.x, b.y, b.width, b.height].every(Number.isFinite) || !(b.width > 0 && b.height > 0)) throw Error("No measurable curved text.");
        const left = b.x - pad, top = b.y - pad, width = Math.ceil((b.width + pad * 2) * scale), height = Math.ceil((b.height + pad * 2) * scale);
        if (width > edgeLimit || height > edgeLimit || width * height * 4 > remaining) throw Error("Sharp caption exceeds image-data budget.");
        const coordinates = [[left, top], [left + width / scale, top], [left + width / scale, top + height / scale], [left, top + height / scale]].map(toLngLat);
        if (coordinates.some((point) => point.some((value) => !Number.isFinite(value)) || Math.abs(point[0]) > 90 || Math.abs(point[1]) > 90)) throw Error("Caption exceeds the native identity plane.");
        svg.removeAttribute("style");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewBox", [left, top, width / scale, height / scale].join(" "));
        url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        image = new Image();
        await new Promise((resolve, reject) => {
          const finish = (error) => {
            clearTimeout(timer);
            jobSignal.removeEventListener("abort", abort);
            image.onload = image.onerror = null;
            error ? reject(error) : resolve();
          };
          const timer = setTimeout(() => finish(Error("Curved text decode timed out.")), 5e3);
          const abort = () => {
            image.src = "";
            finish(canceled());
          };
          image.onload = () => finish();
          image.onerror = () => finish(Error("Curved text image could not decode."));
          jobSignal.addEventListener("abort", abort, { once: true });
          if (!alive() || jobSignal.aborted) abort();
          else image.src = url;
        });
        if (!alive() || jobSignal.aborted) throw canceled();
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw Error("Caption canvas unavailable.");
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, width, height);
        canvas.width = canvas.height = 0;
        return {
          image: pixels,
          left,
          top,
          w: width / scale,
          h: height / scale,
          coordinates,
          ratio: pixelRatio,
          color: p.labelColor
        };
      } finally {
        svg.remove();
        if (image) image.src = "";
      }
    }
    function install(record) {
      if (!mounted || !record.image || !alive() || !canCommit()) return;
      if (!map.getSource(record.source)) map.addSource(record.source, { type: "image", coordinates: record.coordinates });
      ownedSources.add(record.source);
      map.getSource(record.source).updateImage({ image: record.image, coordinates: record.coordinates });
      const paint = { "raster-fade-duration": 0, "raster-resampling": "linear" };
      if (!map.getLayer(record.normal)) map.addLayer({
        id: record.normal,
        type: "raster",
        source: record.source,
        paint: { ...paint, "raster-opacity": state?.threshold ?? 1 }
      }, normalBefore && map.getLayer(normalBefore) ? normalBefore : void 0);
      if (!map.getLayer(record.overlay)) map.addLayer({
        id: record.overlay,
        type: "raster",
        source: record.source,
        layout: { visibility: "none" },
        paint
      }, overlayBefore && map.getLayer(overlayBefore) ? overlayBefore : void 0);
      record.normalShown = record.overlayShown = record.opacitySignature = void 0;
    }
    function recolor(record, color) {
      if (record.color === color) return false;
      const halo = rgb(record.feature.properties.haloColor), fill = rgb(color), data = record.image.data;
      for (let i = 0; i < data.length; i += 4) if (data[i + 3]) {
        const coverage = Math.max(0, Math.min(1, (data[i] - halo[0]) / (255 - halo[0])));
        data[i + 1] = Math.round(halo[1] + (fill[1] - halo[1]) * coverage);
        data[i + 2] = Math.round(halo[2] + (fill[2] - halo[2]) * coverage);
      }
      record.color = color;
      return true;
    }
    function sync(next = state) {
      state = next;
      if (!state || !alive()) return;
      for (const record of records) {
        if (!record.image) continue;
        const p = record.feature.properties, selected = state.selected.has(record.id) || state.selectedLocation === record.id;
        const focused = state.highlighted === record.id, forced = selected || focused;
        const normal = !forced && state.labelsVisible && (state.layers === void 0 || !p.atlasLayer || state.layers.has(p.atlasLayer)) && (state.locations === void 0 || state.locations.has(record.id));
        const dirty = recolor(record, selected ? "#ffd27a" : focused ? "#ffffff" : p.labelColor);
        record.shown = forced || normal;
        record.forced = forced;
        if (!canCommit()) continue;
        if (dirty && map.getSource(record.source)) map.getSource(record.source).updateImage({ image: record.image });
        const opacity = state.labelOpacities?.get(record.id) ?? 1;
        const threshold = state.threshold ?? 1;
        const normalOpacity = Array.isArray(threshold) ? [...threshold.slice(0, -1), opacity] : opacity;
        const opacitySignature = JSON.stringify([normalOpacity, opacity]);
        if (record.opacitySignature !== opacitySignature) {
          if (map.getLayer(record.normal)) map.setPaintProperty(record.normal, "raster-opacity", normalOpacity);
          if (map.getLayer(record.overlay)) map.setPaintProperty(record.overlay, "raster-opacity", opacity);
          record.opacitySignature = opacitySignature;
        }
        for (const [key, id, shown] of [["normalShown", record.normal, normal], ["overlayShown", record.overlay, forced]]) {
          if (map.getLayer(id) && record[key] !== shown) {
            map.setLayoutProperty(id, "visibility", shown ? "visible" : "none");
            record[key] = shown;
          }
        }
      }
    }
    async function rebuild(nextRatio = ratio(), force = false) {
      if (!alive() || !force && nextRatio === pendingRatio) return;
      preparation?.abort();
      const version = ++generation;
      pendingRatio = void 0;
      if (!force && nextRatio === preparedRatio) return;
      const controller = new AbortController(), jobSignal = controller.signal;
      const workingRecords = records;
      preparation = controller;
      pendingRatio = nextRatio;
      const abortFromView = () => controller.abort();
      signal?.addEventListener("abort", abortFromView, { once: true });
      const prepared = [], failures = [];
      let total = 0;
      try {
        try {
          if (!workingRecords.length) return;
          await new Promise((resolve, reject) => {
            const finish = (error) => {
              clearTimeout(timer);
              jobSignal.removeEventListener("abort", abort);
              error ? reject(error) : resolve();
            };
            const abort = () => finish(canceled());
            const timer = setTimeout(() => finish(Error("Caption font readiness timed out.")), 5e3);
            jobSignal.addEventListener("abort", abort, { once: true });
            if (!alive() || jobSignal.aborted) abort();
            else document.fonts.ready.then(() => finish(), finish);
          });
        } catch (error) {
          if (error.name === "AbortError") throw error;
          for (const record of workingRecords) failures.push({ index: record.index, reason: String(error.message) });
        }
        if (!failures.length) for (const record of workingRecords) {
          if (!alive() || version !== generation || jobSignal.aborted) throw canceled();
          try {
            const image = await render(record, nextRatio, byteLimit - total, jobSignal);
            total += image.image.data.byteLength;
            prepared.push([record, image]);
          } catch (error) {
            if (error.name === "AbortError") throw error;
            failures.push({ index: record.index, reason: String(error.message) });
          }
        }
        if (!alive() || version !== generation || jobSignal.aborted) return;
        const ready = new Map(prepared);
        for (const record of workingRecords) {
          const image = ready.get(record);
          if (image) {
            Object.assign(record, image);
            record.feature.properties.pathLabelImage = true;
            install(record);
          } else {
            record.feature.properties.pathLabelImage = false;
            record.image = void 0;
            record.shown = false;
            if (mounted && canCommit()) {
              uninstall(record);
            }
          }
        }
        bytes = total;
        fallbacks = failures;
        preparedRatio = nextRatio;
        sync();
        onChange();
      } catch (error) {
        if (signal?.aborted || !alive()) throw error;
        if (error.name !== "AbortError") throw error;
      } finally {
        signal?.removeEventListener("abort", abortFromView);
        if (preparation === controller) {
          preparation = void 0;
          pendingRatio = void 0;
        }
      }
    }
    const fontChange = () => rebuild(ratio(), true).catch(() => {
    });
    const control = {
      mount(before, overlay, next) {
        normalBefore = before;
        overlayBefore = overlay;
        mounted = true;
        state = next;
        for (const record of records) install(record);
        sync();
        return control;
      },
      sync,
      rebuild,
      async update(curves2) {
        preparation?.abort();
        generation++;
        for (const record of records) {
          uninstall(record);
          record.feature.properties.pathLabelImage = false;
        }
        records = makeRecords(curves2);
        bytes = 0;
        preparedRatio = 0;
        pendingRatio = void 0;
        fallbacks = [];
        await rebuild(ratio(), true);
        return control;
      },
      restore() {
        for (const source of ownedSources) uninstall({ source, normal: source, overlay: source + "-selection" });
        for (const record of records) install(record);
        sync();
      },
      get overlayLayers() {
        return records.map((record) => record.overlay);
      },
      query(point, radius, cameraScale) {
        if (!alive()) return [];
        const world = toWorld(map.unproject(point)), hits = [];
        for (const record of [...records].reverse()) {
          if (!record.shown || !record.image || !record.forced && cameraScale < state.minimumScale) continue;
          const { width, height, data } = record.image;
          const u = (world[0] - record.left) / record.w, v = (world[1] - record.top) / record.h;
          const du = radius / cameraScale / record.w, dv = radius / cameraScale / record.h;
          if (u < -du || v < -dv || u > 1 + du || v > 1 + dv) continue;
          let hit = false;
          for (const x of [u - du, u, u + du]) for (const y of [v - dv, v, v + dv]) {
            const ix = Math.floor(x * width), iy = Math.floor(y * height);
            if (ix >= 0 && iy >= 0 && ix < width && iy < height && data[(iy * width + ix) * 4 + 3] > 24) hit = true;
          }
          if (hit) hits.push({ id: record.id, layer: record.forced ? record.overlay : record.normal });
        }
        return hits;
      },
      getStats() {
        return {
          backend: "native-curve-images",
          authoredCurves: records.length,
          imageCurves: records.filter((r) => r.image).length,
          highPrecisionFallbacks: fallbacks.length,
          rgbaBytes: bytes,
          rgbaByteLimit: byteLimit,
          maxImageEdge: edgeLimit,
          pixelRatio: preparedRatio,
          targetPixelsPerWorldUnit: readMaximumScale() * preparedRatio,
          fallbacks: fallbacks.slice(),
          memoryScope: "One CPU RGBA palette per curve; GPU textures, decoder and overlapping DPR generations are additional."
        };
      },
      destroy() {
        if (disposed) return;
        disposed = true;
        generation++;
        preparation?.abort();
        document.fonts.removeEventListener("loadingdone", fontChange);
        for (const source of ownedSources) uninstall({ source, normal: source, overlay: source + "-selection" });
        ownedSources.clear();
        for (const record of records) record.image = void 0;
        bytes = 0;
        preparedRatio = 0;
        fallbacks = [];
        state = void 0;
      }
    };
    try {
      await rebuild();
      if (alive()) document.fonts.addEventListener("loadingdone", fontChange);
      return control;
    } catch (error) {
      control.destroy();
      throw error;
    }
  }

  // curve-math.js
  function atlasCurveSegments(points) {
    return points.slice(1).map((end, i) => {
      const start = points[i];
      const previous = points[i - 1] ?? start;
      const next = points[i + 2] ?? end;
      const control1 = start.map((coordinate, axis) => coordinate + (end[axis] - previous[axis]) / 6);
      const control2 = end.map((coordinate, axis) => coordinate - (next[axis] - start[axis]) / 6);
      return { start, control1, control2, end };
    });
  }
  function atlasCanvasCurve(points, tolerance = 0.02) {
    if (points.length < 3) return points.map((point) => [...point]);
    const result = [[...points[0]]];
    const distance = (p, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(dx, dy) || 1);
    };
    const middle = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    function flatten(a, b, c, d, depth = 0) {
      if (depth >= 10 || Math.max(distance(b, a, d), distance(c, a, d)) <= tolerance) {
        result.push(d);
        return;
      }
      const ab = middle(a, b), bc = middle(b, c), cd = middle(c, d), abc = middle(ab, bc), bcd = middle(bc, cd), mid = middle(abc, bcd);
      flatten(a, ab, abc, mid, depth + 1);
      flatten(mid, bcd, cd, d, depth + 1);
    }
    for (const { start, control1, control2, end } of atlasCurveSegments(points)) {
      flatten(start, control1, control2, end);
    }
    return result;
  }

  // route-dashes.js
  function atlasCanvasDashPolyline(points, dash, gap, vertexLimit = 4096) {
    const lines = [];
    const fallback = (reason) => ({ fallback: reason });
    if (!(dash > 0) || !(gap > 0) || !Number.isFinite(dash + gap)) return fallback("invalid-pattern");
    if (!Number.isFinite(vertexLimit) || vertexLimit < 0) return fallback("vertex-budget");
    let lengthTotal = 0;
    for (let i = 1; i < points.length; i++) {
      lengthTotal += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      if (!Number.isFinite(lengthTotal)) return fallback("non-finite-length");
    }
    if (!lengthTotal) return { lines, vertices: 0 };
    const upperVertices = 2 * Math.ceil(lengthTotal / (dash + gap)) + Math.max(0, points.length - 2);
    if (!(vertexLimit >= upperVertices)) return fallback("vertex-budget");
    let vertices = 0;
    let visible = true, remaining = dash, line = [];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!(length > 0)) continue;
      let distance = 0;
      while (distance < length) {
        const step = Math.min(remaining, length - distance);
        const nextDistance = distance + step;
        if (!(step > 0) || !(nextDistance > distance)) return fallback("precision");
        const at = (value) => value >= length ? [...b] : [a[0] + (b[0] - a[0]) * value / length, a[1] + (b[1] - a[1]) * value / length];
        if (visible) {
          if (!line.length) {
            line.push(at(distance));
            vertices++;
          }
          line.push(at(nextDistance));
          vertices++;
          if (vertices > vertexLimit) return fallback("vertex-budget");
        }
        distance = nextDistance;
        remaining -= step;
        if (remaining < 1e-9) {
          if (visible && line.length > 1) {
            lines.push(line);
            line = [];
          }
          visible = !visible;
          remaining = visible ? dash : gap;
        }
      }
    }
    if (line.length > 1) lines.push(line);
    return { lines, vertices };
  }

  // scene-geometry.js
  function atlasCanvasWrapLabel(name, width, fontSize, measure) {
    const words = String(name).trim().split(/\s+/);
    if (!measure || !(width > 0) || !words.length) return String(name);
    measure.font = `700 ${fontSize}px "Segoe UI", sans-serif`;
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (line && measure.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines.join("\n");
  }

  // map-camera.js
  function cameraFromMap(map, world, worldToLngLat) {
    const size = Math.max(world.width, world.height);
    const origin = map.project(worldToLngLat([0, 0]));
    const right = map.project(worldToLngLat([size, 0]));
    const scale = (right.x - origin.x) / size;
    return { x: origin.x, y: origin.y, scale };
  }

  // tile-byte-cache.js
  function createAtlasTileByteCache({
    maximumBytes = 16 * 1024 * 1024,
    maximumEntries = 1024,
    maximumAgeMs = 31536e6,
    now = () => performance.now()
  } = {}) {
    if (![maximumBytes, maximumEntries, maximumAgeMs].every((value) => Number.isSafeInteger(value) && value > 0) || typeof now !== "function") {
      throw new Error("Invalid Atlas encoded tile cache limits.");
    }
    const entries = /* @__PURE__ */ new Map();
    let bytes = 0, disposed = false;
    const counters = {
      hits: 0,
      misses: 0,
      admissions: 0,
      evictions: 0,
      invalidations: 0,
      bypasses: 0,
      expirations: 0,
      copyFailures: 0,
      replacements: 0,
      peakBytes: 0,
      peakEntries: 0,
      returnedCopyBytes: 0
    };
    function remove(key) {
      const entry = entries.get(key);
      if (!entry) return false;
      bytes -= entry.data.byteLength;
      entries.delete(key);
      return true;
    }
    return {
      get(key) {
        if (disposed) return void 0;
        const entry = entries.get(key);
        if (!entry) {
          counters.misses++;
          return void 0;
        }
        if (now() >= entry.expires) {
          remove(key);
          counters.expirations++;
          counters.misses++;
          return void 0;
        }
        let copy;
        try {
          copy = ArrayBuffer.prototype.slice.call(entry.data, 0);
        } catch {
          remove(key);
          counters.copyFailures++;
          counters.misses++;
          return void 0;
        }
        entries.delete(key);
        entries.set(key, entry);
        counters.hits++;
        counters.returnedCopyBytes += copy.byteLength;
        return copy;
      },
      put(key, data, level) {
        if (disposed) return false;
        if (typeof key !== "string" || !key || key.length > 4096 || !(data instanceof ArrayBuffer) || !Number.isSafeInteger(level) || level < 0) throw new Error("Invalid Atlas encoded tile entry.");
        if (remove(key)) counters.replacements++;
        if (!data.byteLength || data.byteLength > maximumBytes) {
          counters.bypasses++;
          return false;
        }
        while (entries.size >= maximumEntries || bytes + data.byteLength > maximumBytes) {
          remove(entries.keys().next().value);
          counters.evictions++;
        }
        let copy;
        try {
          copy = ArrayBuffer.prototype.slice.call(data, 0);
        } catch {
          counters.copyFailures++;
          counters.bypasses++;
          return false;
        }
        entries.set(key, { data: copy, level, expires: now() + maximumAgeMs });
        bytes += copy.byteLength;
        counters.admissions++;
        counters.peakBytes = Math.max(counters.peakBytes, bytes);
        counters.peakEntries = Math.max(counters.peakEntries, entries.size);
        return true;
      },
      invalidateLevel(level) {
        for (const [key, entry] of entries) if (entry.level === level && remove(key)) counters.invalidations++;
      },
      destroy() {
        disposed = true;
        entries.clear();
        bytes = 0;
      },
      getStats() {
        return {
          kind: "encoded-tile-bytes",
          enabled: true,
          disposed,
          maximumBytes,
          maximumEntries,
          maximumAgeMs,
          bytes,
          entries: entries.size,
          ...counters
        };
      }
    };
  }

  // validation/generated/standalone.js
  /*! Generated from contracts-v1.json by Ajv. Bundled Ajv helpers:
  The MIT License (MIT)
  
  Copyright (c) 2015-2021 Evgeny Poberezkin
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  
  
  */
  var __getOwnPropNames2 = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var require_ucs2length = __commonJS({
    "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      function ucs2length(str) {
        const len = str.length;
        let length = 0;
        let pos = 0;
        let value;
        while (pos < len) {
          length++;
          value = str.charCodeAt(pos++);
          if (value >= 55296 && value <= 56319 && pos < len) {
            value = str.charCodeAt(pos);
            if ((value & 64512) === 56320)
              pos++;
          }
        }
        return length;
      }
      exports.default = ucs2length;
      ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
    }
  });
  var func0 = Object.prototype.hasOwnProperty;
  var schema15 = { "type": "object", "properties": { "label": { "type": "string", "minLength": 1 }, "value": { "type": ["string", "number", "boolean", "null"] }, "note": { "type": "string" } }, "required": ["label", "value"], "additionalProperties": true };
  var func61 = require_ucs2length().default;
  function validate15(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.facts === void 0 || !func0.call(data, "facts")) && (missing0 = "facts")) {
          validate15.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.label !== void 0 && func0.call(data, "label")) {
            const _errs2 = errors;
            if (typeof data.label !== "string") {
              validate15.errors = [{ instancePath: instancePath + "/label", schemaPath: "#/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.note !== void 0 && func0.call(data, "note")) {
              const _errs4 = errors;
              if (typeof data.note !== "string") {
                validate15.errors = [{ instancePath: instancePath + "/note", schemaPath: "#/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.facts !== void 0 && func0.call(data, "facts")) {
                let data2 = data.facts;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (Array.isArray(data2)) {
                    var valid1 = true;
                    const len0 = data2.length;
                    for (let i0 = 0; i0 < len0; i0++) {
                      let data3 = data2[i0];
                      const _errs8 = errors;
                      const _errs9 = errors;
                      if (errors === _errs9) {
                        if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
                          let missing1;
                          if ((data3.label === void 0 || !func0.call(data3, "label")) && (missing1 = "label") || (data3.value === void 0 || !func0.call(data3, "value")) && (missing1 = "value")) {
                            validate15.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/ReferenceFactV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                            return false;
                          } else {
                            if (data3.label !== void 0 && func0.call(data3, "label")) {
                              let data4 = data3.label;
                              const _errs12 = errors;
                              if (errors === _errs12) {
                                if (typeof data4 === "string") {
                                  if (func61(data4) < 1) {
                                    validate15.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                    return false;
                                  }
                                } else {
                                  validate15.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                              }
                              var valid3 = _errs12 === errors;
                            } else {
                              var valid3 = true;
                            }
                            if (valid3) {
                              if (data3.value !== void 0 && func0.call(data3, "value")) {
                                let data5 = data3.value;
                                const _errs14 = errors;
                                if (typeof data5 !== "string" && !(typeof data5 == "number" && isFinite(data5)) && typeof data5 !== "boolean" && data5 !== null) {
                                  validate15.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/value", schemaPath: "#/$defs/ReferenceFactV1/properties/value/type", keyword: "type", params: { type: schema15.properties.value.type }, message: "must be string,number,boolean,null" }];
                                  return false;
                                }
                                var valid3 = _errs14 === errors;
                              } else {
                                var valid3 = true;
                              }
                              if (valid3) {
                                if (data3.note !== void 0 && func0.call(data3, "note")) {
                                  const _errs16 = errors;
                                  if (typeof data3.note !== "string") {
                                    validate15.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/note", schemaPath: "#/$defs/ReferenceFactV1/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                    return false;
                                  }
                                  var valid3 = _errs16 === errors;
                                } else {
                                  var valid3 = true;
                                }
                              }
                            }
                          }
                        } else {
                          validate15.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/ReferenceFactV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                          return false;
                        }
                      }
                      var valid1 = _errs8 === errors;
                      if (!valid1) {
                        break;
                      }
                    }
                  } else {
                    validate15.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      } else {
        validate15.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate15.errors = vErrors;
    return errors === 0;
  }
  var schema20 = { "type": "object", "properties": { "source": { "type": "string", "minLength": 1 }, "originX": { "type": "integer" }, "originY": { "type": "integer" }, "zoom": { "type": ["integer", "null"], "minimum": 0, "maximum": 30 }, "bounds": { "anyOf": [{ "type": "object", "properties": { "minX": { "type": "integer" }, "minY": { "type": "integer" }, "maxX": { "type": "integer" }, "maxY": { "type": "integer" } }, "required": ["minX", "minY", "maxX", "maxY"], "additionalProperties": true }, { "type": "null" }] }, "missing": { "type": "array", "items": { "type": "array", "items": { "type": "integer" }, "minItems": 2, "maxItems": 2 }, "maxItems": 1e4 } }, "required": ["source", "originX", "originY"], "additionalProperties": true };
  var schema21 = { "type": "object", "properties": { "width": { "type": "number", "exclusiveMinimum": 0 }, "height": { "type": "number", "exclusiveMinimum": 0 }, "scaleFactor": { "type": ["number", "null"], "exclusiveMinimum": 0 }, "tiles": { "type": ["array", "null"], "items": { "$ref": "#/$defs/CropV1" } }, "grid": { "anyOf": [{ "$ref": "#/$defs/GridV1" }, { "type": "null" }] } }, "required": ["width", "height"], "additionalProperties": true, "allOf": [{ "if": { "type": "object", "properties": { "grid": { "type": "object" } }, "required": ["grid"] }, "then": { "type": "object", "properties": { "scaleFactor": { "type": "number", "exclusiveMinimum": 0 } } } }] };
  function validate19(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    const _errs2 = errors;
    let valid1 = true;
    const _errs3 = errors;
    if (errors === _errs3) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.grid === void 0 || !func0.call(data, "grid")) && (missing0 = "grid")) {
          const err0 = {};
          if (vErrors === null) {
            vErrors = [err0];
          } else {
            vErrors.push(err0);
          }
          errors++;
        } else {
          if (data.grid !== void 0 && func0.call(data, "grid")) {
            let data0 = data.grid;
            if (!(data0 && typeof data0 == "object" && !Array.isArray(data0))) {
              const err1 = {};
              if (vErrors === null) {
                vErrors = [err1];
              } else {
                vErrors.push(err1);
              }
              errors++;
            }
          }
        }
      } else {
        const err2 = {};
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    var _valid0 = _errs3 === errors;
    errors = _errs2;
    if (vErrors !== null) {
      if (_errs2) {
        vErrors.length = _errs2;
      } else {
        vErrors = null;
      }
    }
    if (_valid0) {
      const _errs7 = errors;
      if (errors === _errs7) {
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.scaleFactor !== void 0 && func0.call(data, "scaleFactor")) {
            let data1 = data.scaleFactor;
            const _errs9 = errors;
            if (errors === _errs9) {
              if (typeof data1 == "number" && isFinite(data1)) {
                if (data1 <= 0 || isNaN(data1)) {
                  validate19.errors = [{ instancePath: instancePath + "/scaleFactor", schemaPath: "#/allOf/0/then/properties/scaleFactor/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                  return false;
                }
              } else {
                validate19.errors = [{ instancePath: instancePath + "/scaleFactor", schemaPath: "#/allOf/0/then/properties/scaleFactor/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
            }
          }
        } else {
          validate19.errors = [{ instancePath, schemaPath: "#/allOf/0/then/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
          return false;
        }
      }
      var _valid0 = _errs7 === errors;
      valid1 = _valid0;
    }
    if (!valid1) {
      const err3 = { instancePath, schemaPath: "#/allOf/0/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
      validate19.errors = vErrors;
      return false;
    }
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing1;
        if ((data.width === void 0 || !func0.call(data, "width")) && (missing1 = "width") || (data.height === void 0 || !func0.call(data, "height")) && (missing1 = "height")) {
          validate19.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
          return false;
        } else {
          if (data.width !== void 0 && func0.call(data, "width")) {
            let data2 = data.width;
            const _errs12 = errors;
            if (errors === _errs12) {
              if (typeof data2 == "number" && isFinite(data2)) {
                if (data2 <= 0 || isNaN(data2)) {
                  validate19.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                  return false;
                }
              } else {
                validate19.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
            }
            var valid4 = _errs12 === errors;
          } else {
            var valid4 = true;
          }
          if (valid4) {
            if (data.height !== void 0 && func0.call(data, "height")) {
              let data3 = data.height;
              const _errs14 = errors;
              if (errors === _errs14) {
                if (typeof data3 == "number" && isFinite(data3)) {
                  if (data3 <= 0 || isNaN(data3)) {
                    validate19.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                    return false;
                  }
                } else {
                  validate19.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
              }
              var valid4 = _errs14 === errors;
            } else {
              var valid4 = true;
            }
            if (valid4) {
              if (data.scaleFactor !== void 0 && func0.call(data, "scaleFactor")) {
                let data4 = data.scaleFactor;
                const _errs16 = errors;
                if (!(typeof data4 == "number" && isFinite(data4)) && data4 !== null) {
                  validate19.errors = [{ instancePath: instancePath + "/scaleFactor", schemaPath: "#/properties/scaleFactor/type", keyword: "type", params: { type: schema21.properties.scaleFactor.type }, message: "must be number,null" }];
                  return false;
                }
                if (errors === _errs16) {
                  if (typeof data4 == "number" && isFinite(data4)) {
                    if (data4 <= 0 || isNaN(data4)) {
                      validate19.errors = [{ instancePath: instancePath + "/scaleFactor", schemaPath: "#/properties/scaleFactor/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                      return false;
                    }
                  }
                }
                var valid4 = _errs16 === errors;
              } else {
                var valid4 = true;
              }
              if (valid4) {
                if (data.tiles !== void 0 && func0.call(data, "tiles")) {
                  let data5 = data.tiles;
                  const _errs18 = errors;
                  if (!Array.isArray(data5) && data5 !== null) {
                    validate19.errors = [{ instancePath: instancePath + "/tiles", schemaPath: "#/properties/tiles/type", keyword: "type", params: { type: schema21.properties.tiles.type }, message: "must be array,null" }];
                    return false;
                  }
                  if (errors === _errs18) {
                    if (Array.isArray(data5)) {
                      var valid5 = true;
                      const len0 = data5.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        let data6 = data5[i0];
                        const _errs20 = errors;
                        const _errs21 = errors;
                        if (errors === _errs21) {
                          if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                            let missing2;
                            if ((data6.x === void 0 || !func0.call(data6, "x")) && (missing2 = "x") || (data6.y === void 0 || !func0.call(data6, "y")) && (missing2 = "y") || (data6.w === void 0 || !func0.call(data6, "w")) && (missing2 = "w") || (data6.h === void 0 || !func0.call(data6, "h")) && (missing2 = "h") || (data6.source === void 0 || !func0.call(data6, "source")) && (missing2 = "source")) {
                              validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0, schemaPath: "#/$defs/CropV1/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                              return false;
                            } else {
                              if (data6.x !== void 0 && func0.call(data6, "x")) {
                                let data7 = data6.x;
                                const _errs24 = errors;
                                if (!(typeof data7 == "number" && isFinite(data7))) {
                                  validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/x", schemaPath: "#/$defs/CropV1/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                  return false;
                                }
                                var valid7 = _errs24 === errors;
                              } else {
                                var valid7 = true;
                              }
                              if (valid7) {
                                if (data6.y !== void 0 && func0.call(data6, "y")) {
                                  let data8 = data6.y;
                                  const _errs26 = errors;
                                  if (!(typeof data8 == "number" && isFinite(data8))) {
                                    validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/y", schemaPath: "#/$defs/CropV1/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                    return false;
                                  }
                                  var valid7 = _errs26 === errors;
                                } else {
                                  var valid7 = true;
                                }
                                if (valid7) {
                                  if (data6.w !== void 0 && func0.call(data6, "w")) {
                                    let data9 = data6.w;
                                    const _errs28 = errors;
                                    if (errors === _errs28) {
                                      if (typeof data9 == "number" && isFinite(data9)) {
                                        if (data9 <= 0 || isNaN(data9)) {
                                          validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/w", schemaPath: "#/$defs/CropV1/properties/w/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                          return false;
                                        }
                                      } else {
                                        validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/w", schemaPath: "#/$defs/CropV1/properties/w/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                        return false;
                                      }
                                    }
                                    var valid7 = _errs28 === errors;
                                  } else {
                                    var valid7 = true;
                                  }
                                  if (valid7) {
                                    if (data6.h !== void 0 && func0.call(data6, "h")) {
                                      let data10 = data6.h;
                                      const _errs30 = errors;
                                      if (errors === _errs30) {
                                        if (typeof data10 == "number" && isFinite(data10)) {
                                          if (data10 <= 0 || isNaN(data10)) {
                                            validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/h", schemaPath: "#/$defs/CropV1/properties/h/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                            return false;
                                          }
                                        } else {
                                          validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/h", schemaPath: "#/$defs/CropV1/properties/h/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                          return false;
                                        }
                                      }
                                      var valid7 = _errs30 === errors;
                                    } else {
                                      var valid7 = true;
                                    }
                                    if (valid7) {
                                      if (data6.source !== void 0 && func0.call(data6, "source")) {
                                        let data11 = data6.source;
                                        const _errs32 = errors;
                                        if (errors === _errs32) {
                                          if (typeof data11 === "string") {
                                            if (func61(data11) < 1) {
                                              validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/source", schemaPath: "#/$defs/CropV1/properties/source/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                              return false;
                                            }
                                          } else {
                                            validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0 + "/source", schemaPath: "#/$defs/CropV1/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                        }
                                        var valid7 = _errs32 === errors;
                                      } else {
                                        var valid7 = true;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          } else {
                            validate19.errors = [{ instancePath: instancePath + "/tiles/" + i0, schemaPath: "#/$defs/CropV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                        }
                        var valid5 = _errs20 === errors;
                        if (!valid5) {
                          break;
                        }
                      }
                    }
                  }
                  var valid4 = _errs18 === errors;
                } else {
                  var valid4 = true;
                }
                if (valid4) {
                  if (data.grid !== void 0 && func0.call(data, "grid")) {
                    let data12 = data.grid;
                    const _errs34 = errors;
                    const _errs35 = errors;
                    let valid8 = false;
                    const _errs36 = errors;
                    const _errs37 = errors;
                    if (errors === _errs37) {
                      if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
                        let missing3;
                        if ((data12.source === void 0 || !func0.call(data12, "source")) && (missing3 = "source") || (data12.originX === void 0 || !func0.call(data12, "originX")) && (missing3 = "originX") || (data12.originY === void 0 || !func0.call(data12, "originY")) && (missing3 = "originY")) {
                          const err4 = { instancePath: instancePath + "/grid", schemaPath: "#/$defs/GridV1/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" };
                          if (vErrors === null) {
                            vErrors = [err4];
                          } else {
                            vErrors.push(err4);
                          }
                          errors++;
                        } else {
                          if (data12.source !== void 0 && func0.call(data12, "source")) {
                            let data13 = data12.source;
                            const _errs40 = errors;
                            if (errors === _errs40) {
                              if (typeof data13 === "string") {
                                if (func61(data13) < 1) {
                                  const err5 = { instancePath: instancePath + "/grid/source", schemaPath: "#/$defs/GridV1/properties/source/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                                  if (vErrors === null) {
                                    vErrors = [err5];
                                  } else {
                                    vErrors.push(err5);
                                  }
                                  errors++;
                                }
                              } else {
                                const err6 = { instancePath: instancePath + "/grid/source", schemaPath: "#/$defs/GridV1/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                if (vErrors === null) {
                                  vErrors = [err6];
                                } else {
                                  vErrors.push(err6);
                                }
                                errors++;
                              }
                            }
                            var valid10 = _errs40 === errors;
                          } else {
                            var valid10 = true;
                          }
                          if (valid10) {
                            if (data12.originX !== void 0 && func0.call(data12, "originX")) {
                              let data14 = data12.originX;
                              const _errs42 = errors;
                              if (!(typeof data14 == "number" && (!(data14 % 1) && !isNaN(data14)) && isFinite(data14))) {
                                const err7 = { instancePath: instancePath + "/grid/originX", schemaPath: "#/$defs/GridV1/properties/originX/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                if (vErrors === null) {
                                  vErrors = [err7];
                                } else {
                                  vErrors.push(err7);
                                }
                                errors++;
                              }
                              var valid10 = _errs42 === errors;
                            } else {
                              var valid10 = true;
                            }
                            if (valid10) {
                              if (data12.originY !== void 0 && func0.call(data12, "originY")) {
                                let data15 = data12.originY;
                                const _errs44 = errors;
                                if (!(typeof data15 == "number" && (!(data15 % 1) && !isNaN(data15)) && isFinite(data15))) {
                                  const err8 = { instancePath: instancePath + "/grid/originY", schemaPath: "#/$defs/GridV1/properties/originY/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                  if (vErrors === null) {
                                    vErrors = [err8];
                                  } else {
                                    vErrors.push(err8);
                                  }
                                  errors++;
                                }
                                var valid10 = _errs44 === errors;
                              } else {
                                var valid10 = true;
                              }
                              if (valid10) {
                                if (data12.zoom !== void 0 && func0.call(data12, "zoom")) {
                                  let data16 = data12.zoom;
                                  const _errs46 = errors;
                                  if (!(typeof data16 == "number" && (!(data16 % 1) && !isNaN(data16)) && isFinite(data16)) && data16 !== null) {
                                    const err9 = { instancePath: instancePath + "/grid/zoom", schemaPath: "#/$defs/GridV1/properties/zoom/type", keyword: "type", params: { type: schema20.properties.zoom.type }, message: "must be integer,null" };
                                    if (vErrors === null) {
                                      vErrors = [err9];
                                    } else {
                                      vErrors.push(err9);
                                    }
                                    errors++;
                                  }
                                  if (errors === _errs46) {
                                    if (typeof data16 == "number" && isFinite(data16)) {
                                      if (data16 > 30 || isNaN(data16)) {
                                        const err10 = { instancePath: instancePath + "/grid/zoom", schemaPath: "#/$defs/GridV1/properties/zoom/maximum", keyword: "maximum", params: { comparison: "<=", limit: 30 }, message: "must be <= 30" };
                                        if (vErrors === null) {
                                          vErrors = [err10];
                                        } else {
                                          vErrors.push(err10);
                                        }
                                        errors++;
                                      } else {
                                        if (data16 < 0 || isNaN(data16)) {
                                          const err11 = { instancePath: instancePath + "/grid/zoom", schemaPath: "#/$defs/GridV1/properties/zoom/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                                          if (vErrors === null) {
                                            vErrors = [err11];
                                          } else {
                                            vErrors.push(err11);
                                          }
                                          errors++;
                                        }
                                      }
                                    }
                                  }
                                  var valid10 = _errs46 === errors;
                                } else {
                                  var valid10 = true;
                                }
                                if (valid10) {
                                  if (data12.bounds !== void 0 && func0.call(data12, "bounds")) {
                                    let data17 = data12.bounds;
                                    const _errs48 = errors;
                                    const _errs49 = errors;
                                    let valid11 = false;
                                    const _errs50 = errors;
                                    if (errors === _errs50) {
                                      if (data17 && typeof data17 == "object" && !Array.isArray(data17)) {
                                        let missing4;
                                        if ((data17.minX === void 0 || !func0.call(data17, "minX")) && (missing4 = "minX") || (data17.minY === void 0 || !func0.call(data17, "minY")) && (missing4 = "minY") || (data17.maxX === void 0 || !func0.call(data17, "maxX")) && (missing4 = "maxX") || (data17.maxY === void 0 || !func0.call(data17, "maxY")) && (missing4 = "maxY")) {
                                          const err12 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/required", keyword: "required", params: { missingProperty: missing4 }, message: "must have required property '" + missing4 + "'" };
                                          if (vErrors === null) {
                                            vErrors = [err12];
                                          } else {
                                            vErrors.push(err12);
                                          }
                                          errors++;
                                        } else {
                                          if (data17.minX !== void 0 && func0.call(data17, "minX")) {
                                            let data18 = data17.minX;
                                            const _errs53 = errors;
                                            if (!(typeof data18 == "number" && (!(data18 % 1) && !isNaN(data18)) && isFinite(data18))) {
                                              const err13 = { instancePath: instancePath + "/grid/bounds/minX", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/minX/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                              if (vErrors === null) {
                                                vErrors = [err13];
                                              } else {
                                                vErrors.push(err13);
                                              }
                                              errors++;
                                            }
                                            var valid12 = _errs53 === errors;
                                          } else {
                                            var valid12 = true;
                                          }
                                          if (valid12) {
                                            if (data17.minY !== void 0 && func0.call(data17, "minY")) {
                                              let data19 = data17.minY;
                                              const _errs55 = errors;
                                              if (!(typeof data19 == "number" && (!(data19 % 1) && !isNaN(data19)) && isFinite(data19))) {
                                                const err14 = { instancePath: instancePath + "/grid/bounds/minY", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/minY/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                                if (vErrors === null) {
                                                  vErrors = [err14];
                                                } else {
                                                  vErrors.push(err14);
                                                }
                                                errors++;
                                              }
                                              var valid12 = _errs55 === errors;
                                            } else {
                                              var valid12 = true;
                                            }
                                            if (valid12) {
                                              if (data17.maxX !== void 0 && func0.call(data17, "maxX")) {
                                                let data20 = data17.maxX;
                                                const _errs57 = errors;
                                                if (!(typeof data20 == "number" && (!(data20 % 1) && !isNaN(data20)) && isFinite(data20))) {
                                                  const err15 = { instancePath: instancePath + "/grid/bounds/maxX", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/maxX/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                                  if (vErrors === null) {
                                                    vErrors = [err15];
                                                  } else {
                                                    vErrors.push(err15);
                                                  }
                                                  errors++;
                                                }
                                                var valid12 = _errs57 === errors;
                                              } else {
                                                var valid12 = true;
                                              }
                                              if (valid12) {
                                                if (data17.maxY !== void 0 && func0.call(data17, "maxY")) {
                                                  let data21 = data17.maxY;
                                                  const _errs59 = errors;
                                                  if (!(typeof data21 == "number" && (!(data21 % 1) && !isNaN(data21)) && isFinite(data21))) {
                                                    const err16 = { instancePath: instancePath + "/grid/bounds/maxY", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/maxY/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                                    if (vErrors === null) {
                                                      vErrors = [err16];
                                                    } else {
                                                      vErrors.push(err16);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid12 = _errs59 === errors;
                                                } else {
                                                  var valid12 = true;
                                                }
                                              }
                                            }
                                          }
                                        }
                                      } else {
                                        const err17 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                                        if (vErrors === null) {
                                          vErrors = [err17];
                                        } else {
                                          vErrors.push(err17);
                                        }
                                        errors++;
                                      }
                                    }
                                    var _valid2 = _errs50 === errors;
                                    valid11 = valid11 || _valid2;
                                    if (!valid11) {
                                      const _errs61 = errors;
                                      if (data17 !== null) {
                                        const err18 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                        if (vErrors === null) {
                                          vErrors = [err18];
                                        } else {
                                          vErrors.push(err18);
                                        }
                                        errors++;
                                      }
                                      var _valid2 = _errs61 === errors;
                                      valid11 = valid11 || _valid2;
                                    }
                                    if (!valid11) {
                                      const err19 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                      if (vErrors === null) {
                                        vErrors = [err19];
                                      } else {
                                        vErrors.push(err19);
                                      }
                                      errors++;
                                    } else {
                                      errors = _errs49;
                                      if (vErrors !== null) {
                                        if (_errs49) {
                                          vErrors.length = _errs49;
                                        } else {
                                          vErrors = null;
                                        }
                                      }
                                    }
                                    var valid10 = _errs48 === errors;
                                  } else {
                                    var valid10 = true;
                                  }
                                  if (valid10) {
                                    if (data12.missing !== void 0 && func0.call(data12, "missing")) {
                                      let data22 = data12.missing;
                                      const _errs63 = errors;
                                      if (errors === _errs63) {
                                        if (Array.isArray(data22)) {
                                          if (data22.length > 1e4) {
                                            const err20 = { instancePath: instancePath + "/grid/missing", schemaPath: "#/$defs/GridV1/properties/missing/maxItems", keyword: "maxItems", params: { limit: 1e4 }, message: "must NOT have more than 10000 items" };
                                            if (vErrors === null) {
                                              vErrors = [err20];
                                            } else {
                                              vErrors.push(err20);
                                            }
                                            errors++;
                                          } else {
                                            var valid13 = true;
                                            const len1 = data22.length;
                                            for (let i1 = 0; i1 < len1; i1++) {
                                              let data23 = data22[i1];
                                              const _errs65 = errors;
                                              if (errors === _errs65) {
                                                if (Array.isArray(data23)) {
                                                  if (data23.length > 2) {
                                                    const err21 = { instancePath: instancePath + "/grid/missing/" + i1, schemaPath: "#/$defs/GridV1/properties/missing/items/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" };
                                                    if (vErrors === null) {
                                                      vErrors = [err21];
                                                    } else {
                                                      vErrors.push(err21);
                                                    }
                                                    errors++;
                                                  } else {
                                                    if (data23.length < 2) {
                                                      const err22 = { instancePath: instancePath + "/grid/missing/" + i1, schemaPath: "#/$defs/GridV1/properties/missing/items/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" };
                                                      if (vErrors === null) {
                                                        vErrors = [err22];
                                                      } else {
                                                        vErrors.push(err22);
                                                      }
                                                      errors++;
                                                    } else {
                                                      var valid14 = true;
                                                      const len2 = data23.length;
                                                      for (let i2 = 0; i2 < len2; i2++) {
                                                        let data24 = data23[i2];
                                                        const _errs67 = errors;
                                                        if (!(typeof data24 == "number" && (!(data24 % 1) && !isNaN(data24)) && isFinite(data24))) {
                                                          const err23 = { instancePath: instancePath + "/grid/missing/" + i1 + "/" + i2, schemaPath: "#/$defs/GridV1/properties/missing/items/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                                          if (vErrors === null) {
                                                            vErrors = [err23];
                                                          } else {
                                                            vErrors.push(err23);
                                                          }
                                                          errors++;
                                                        }
                                                        var valid14 = _errs67 === errors;
                                                        if (!valid14) {
                                                          break;
                                                        }
                                                      }
                                                    }
                                                  }
                                                } else {
                                                  const err24 = { instancePath: instancePath + "/grid/missing/" + i1, schemaPath: "#/$defs/GridV1/properties/missing/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                                  if (vErrors === null) {
                                                    vErrors = [err24];
                                                  } else {
                                                    vErrors.push(err24);
                                                  }
                                                  errors++;
                                                }
                                              }
                                              var valid13 = _errs65 === errors;
                                              if (!valid13) {
                                                break;
                                              }
                                            }
                                          }
                                        } else {
                                          const err25 = { instancePath: instancePath + "/grid/missing", schemaPath: "#/$defs/GridV1/properties/missing/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                          if (vErrors === null) {
                                            vErrors = [err25];
                                          } else {
                                            vErrors.push(err25);
                                          }
                                          errors++;
                                        }
                                      }
                                      var valid10 = _errs63 === errors;
                                    } else {
                                      var valid10 = true;
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      } else {
                        const err26 = { instancePath: instancePath + "/grid", schemaPath: "#/$defs/GridV1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                        if (vErrors === null) {
                          vErrors = [err26];
                        } else {
                          vErrors.push(err26);
                        }
                        errors++;
                      }
                    }
                    var _valid1 = _errs36 === errors;
                    valid8 = valid8 || _valid1;
                    if (!valid8) {
                      const _errs69 = errors;
                      if (data12 !== null) {
                        const err27 = { instancePath: instancePath + "/grid", schemaPath: "#/properties/grid/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                        if (vErrors === null) {
                          vErrors = [err27];
                        } else {
                          vErrors.push(err27);
                        }
                        errors++;
                      }
                      var _valid1 = _errs69 === errors;
                      valid8 = valid8 || _valid1;
                    }
                    if (!valid8) {
                      const err28 = { instancePath: instancePath + "/grid", schemaPath: "#/properties/grid/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                      if (vErrors === null) {
                        vErrors = [err28];
                      } else {
                        vErrors.push(err28);
                      }
                      errors++;
                      validate19.errors = vErrors;
                      return false;
                    } else {
                      errors = _errs35;
                      if (vErrors !== null) {
                        if (_errs35) {
                          vErrors.length = _errs35;
                        } else {
                          vErrors = null;
                        }
                      }
                    }
                    var valid4 = _errs34 === errors;
                  } else {
                    var valid4 = true;
                  }
                }
              }
            }
          }
        }
      } else {
        validate19.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate19.errors = vErrors;
    return errors === 0;
  }
  var schema24 = { "type": "object", "properties": { "tileSize": { "type": ["number", "null"], "exclusiveMinimum": 0 }, "fallback": { "type": ["string", "null"], "minLength": 1 }, "opaque": { "type": ["boolean", "null"] }, "preloadMargin": { "type": ["number", "null"] }, "wholeViewCoverage": { "type": ["number", "null"], "minimum": 0 }, "levels": { "type": "array", "items": { "$ref": "#/$defs/PyramidLevelV1" } } }, "required": ["levels"], "additionalProperties": true };
  function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.levels === void 0 || !func0.call(data, "levels")) && (missing0 = "levels")) {
          validate20.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.tileSize !== void 0 && func0.call(data, "tileSize")) {
            let data0 = data.tileSize;
            const _errs2 = errors;
            if (!(typeof data0 == "number" && isFinite(data0)) && data0 !== null) {
              validate20.errors = [{ instancePath: instancePath + "/tileSize", schemaPath: "#/properties/tileSize/type", keyword: "type", params: { type: schema24.properties.tileSize.type }, message: "must be number,null" }];
              return false;
            }
            if (errors === _errs2) {
              if (typeof data0 == "number" && isFinite(data0)) {
                if (data0 <= 0 || isNaN(data0)) {
                  validate20.errors = [{ instancePath: instancePath + "/tileSize", schemaPath: "#/properties/tileSize/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                  return false;
                }
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.fallback !== void 0 && func0.call(data, "fallback")) {
              let data1 = data.fallback;
              const _errs4 = errors;
              if (typeof data1 !== "string" && data1 !== null) {
                validate20.errors = [{ instancePath: instancePath + "/fallback", schemaPath: "#/properties/fallback/type", keyword: "type", params: { type: schema24.properties.fallback.type }, message: "must be string,null" }];
                return false;
              }
              if (errors === _errs4) {
                if (typeof data1 === "string") {
                  if (func61(data1) < 1) {
                    validate20.errors = [{ instancePath: instancePath + "/fallback", schemaPath: "#/properties/fallback/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.opaque !== void 0 && func0.call(data, "opaque")) {
                let data2 = data.opaque;
                const _errs6 = errors;
                if (typeof data2 !== "boolean" && data2 !== null) {
                  validate20.errors = [{ instancePath: instancePath + "/opaque", schemaPath: "#/properties/opaque/type", keyword: "type", params: { type: schema24.properties.opaque.type }, message: "must be boolean,null" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.preloadMargin !== void 0 && func0.call(data, "preloadMargin")) {
                  let data3 = data.preloadMargin;
                  const _errs8 = errors;
                  if (!(typeof data3 == "number" && isFinite(data3)) && data3 !== null) {
                    validate20.errors = [{ instancePath: instancePath + "/preloadMargin", schemaPath: "#/properties/preloadMargin/type", keyword: "type", params: { type: schema24.properties.preloadMargin.type }, message: "must be number,null" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.wholeViewCoverage !== void 0 && func0.call(data, "wholeViewCoverage")) {
                    let data4 = data.wholeViewCoverage;
                    const _errs10 = errors;
                    if (!(typeof data4 == "number" && isFinite(data4)) && data4 !== null) {
                      validate20.errors = [{ instancePath: instancePath + "/wholeViewCoverage", schemaPath: "#/properties/wholeViewCoverage/type", keyword: "type", params: { type: schema24.properties.wholeViewCoverage.type }, message: "must be number,null" }];
                      return false;
                    }
                    if (errors === _errs10) {
                      if (typeof data4 == "number" && isFinite(data4)) {
                        if (data4 < 0 || isNaN(data4)) {
                          validate20.errors = [{ instancePath: instancePath + "/wholeViewCoverage", schemaPath: "#/properties/wholeViewCoverage/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                          return false;
                        }
                      }
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.levels !== void 0 && func0.call(data, "levels")) {
                      let data5 = data.levels;
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (Array.isArray(data5)) {
                          var valid1 = true;
                          const len0 = data5.length;
                          for (let i0 = 0; i0 < len0; i0++) {
                            const _errs14 = errors;
                            if (!validate19(data5[i0], { instancePath: instancePath + "/levels/" + i0, parentData: data5, parentDataProperty: i0, rootData })) {
                              vErrors = vErrors === null ? validate19.errors : vErrors.concat(validate19.errors);
                              errors = vErrors.length;
                            }
                            var valid1 = _errs14 === errors;
                            if (!valid1) {
                              break;
                            }
                          }
                        } else {
                          validate20.errors = [{ instancePath: instancePath + "/levels", schemaPath: "#/properties/levels/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate20.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate20.errors = vErrors;
    return errors === 0;
  }
  var schema25 = { "type": "object", "properties": { "id": { "type": ["string", "number"] }, "label": { "type": "string" }, "x": { "type": "number" }, "y": { "type": "number" }, "w": { "type": "number", "exclusiveMinimum": 0 }, "h": { "type": "number", "exclusiveMinimum": 0 }, "width": { "type": "number", "exclusiveMinimum": 0 }, "height": { "type": "number", "exclusiveMinimum": 0 }, "sources": { "type": "object", "properties": { "detail": { "type": "string", "minLength": 1 }, "preview": { "type": "string" }, "medium": { "type": "string" } }, "additionalProperties": true }, "pyramid": { "anyOf": [{ "$ref": "#/$defs/PyramidV1" }, { "type": "null" }] } }, "required": ["id", "x", "y", "w", "h", "width", "height"], "additionalProperties": true };
  function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.id === void 0 || !func0.call(data, "id")) && (missing0 = "id") || (data.x === void 0 || !func0.call(data, "x")) && (missing0 = "x") || (data.y === void 0 || !func0.call(data, "y")) && (missing0 = "y") || (data.w === void 0 || !func0.call(data, "w")) && (missing0 = "w") || (data.h === void 0 || !func0.call(data, "h")) && (missing0 = "h") || (data.width === void 0 || !func0.call(data, "width")) && (missing0 = "width") || (data.height === void 0 || !func0.call(data, "height")) && (missing0 = "height")) {
          validate22.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.id !== void 0 && func0.call(data, "id")) {
            let data0 = data.id;
            const _errs2 = errors;
            if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
              validate22.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: schema25.properties.id.type }, message: "must be string,number" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.label !== void 0 && func0.call(data, "label")) {
              const _errs4 = errors;
              if (typeof data.label !== "string") {
                validate22.errors = [{ instancePath: instancePath + "/label", schemaPath: "#/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.x !== void 0 && func0.call(data, "x")) {
                let data2 = data.x;
                const _errs6 = errors;
                if (!(typeof data2 == "number" && isFinite(data2))) {
                  validate22.errors = [{ instancePath: instancePath + "/x", schemaPath: "#/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.y !== void 0 && func0.call(data, "y")) {
                  let data3 = data.y;
                  const _errs8 = errors;
                  if (!(typeof data3 == "number" && isFinite(data3))) {
                    validate22.errors = [{ instancePath: instancePath + "/y", schemaPath: "#/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.w !== void 0 && func0.call(data, "w")) {
                    let data4 = data.w;
                    const _errs10 = errors;
                    if (errors === _errs10) {
                      if (typeof data4 == "number" && isFinite(data4)) {
                        if (data4 <= 0 || isNaN(data4)) {
                          validate22.errors = [{ instancePath: instancePath + "/w", schemaPath: "#/properties/w/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                          return false;
                        }
                      } else {
                        validate22.errors = [{ instancePath: instancePath + "/w", schemaPath: "#/properties/w/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                        return false;
                      }
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.h !== void 0 && func0.call(data, "h")) {
                      let data5 = data.h;
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (typeof data5 == "number" && isFinite(data5)) {
                          if (data5 <= 0 || isNaN(data5)) {
                            validate22.errors = [{ instancePath: instancePath + "/h", schemaPath: "#/properties/h/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                            return false;
                          }
                        } else {
                          validate22.errors = [{ instancePath: instancePath + "/h", schemaPath: "#/properties/h/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                          return false;
                        }
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.width !== void 0 && func0.call(data, "width")) {
                        let data6 = data.width;
                        const _errs14 = errors;
                        if (errors === _errs14) {
                          if (typeof data6 == "number" && isFinite(data6)) {
                            if (data6 <= 0 || isNaN(data6)) {
                              validate22.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                              return false;
                            }
                          } else {
                            validate22.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                            return false;
                          }
                        }
                        var valid0 = _errs14 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.height !== void 0 && func0.call(data, "height")) {
                          let data7 = data.height;
                          const _errs16 = errors;
                          if (errors === _errs16) {
                            if (typeof data7 == "number" && isFinite(data7)) {
                              if (data7 <= 0 || isNaN(data7)) {
                                validate22.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                return false;
                              }
                            } else {
                              validate22.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                              return false;
                            }
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.sources !== void 0 && func0.call(data, "sources")) {
                            let data8 = data.sources;
                            const _errs18 = errors;
                            if (errors === _errs18) {
                              if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
                                if (data8.detail !== void 0 && func0.call(data8, "detail")) {
                                  let data9 = data8.detail;
                                  const _errs21 = errors;
                                  if (errors === _errs21) {
                                    if (typeof data9 === "string") {
                                      if (func61(data9) < 1) {
                                        validate22.errors = [{ instancePath: instancePath + "/sources/detail", schemaPath: "#/properties/sources/properties/detail/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                        return false;
                                      }
                                    } else {
                                      validate22.errors = [{ instancePath: instancePath + "/sources/detail", schemaPath: "#/properties/sources/properties/detail/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                  }
                                  var valid1 = _errs21 === errors;
                                } else {
                                  var valid1 = true;
                                }
                                if (valid1) {
                                  if (data8.preview !== void 0 && func0.call(data8, "preview")) {
                                    const _errs23 = errors;
                                    if (typeof data8.preview !== "string") {
                                      validate22.errors = [{ instancePath: instancePath + "/sources/preview", schemaPath: "#/properties/sources/properties/preview/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                    var valid1 = _errs23 === errors;
                                  } else {
                                    var valid1 = true;
                                  }
                                  if (valid1) {
                                    if (data8.medium !== void 0 && func0.call(data8, "medium")) {
                                      const _errs25 = errors;
                                      if (typeof data8.medium !== "string") {
                                        validate22.errors = [{ instancePath: instancePath + "/sources/medium", schemaPath: "#/properties/sources/properties/medium/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                      var valid1 = _errs25 === errors;
                                    } else {
                                      var valid1 = true;
                                    }
                                  }
                                }
                              } else {
                                validate22.errors = [{ instancePath: instancePath + "/sources", schemaPath: "#/properties/sources/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                return false;
                              }
                            }
                            var valid0 = _errs18 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.pyramid !== void 0 && func0.call(data, "pyramid")) {
                              let data12 = data.pyramid;
                              const _errs27 = errors;
                              const _errs28 = errors;
                              let valid2 = false;
                              const _errs29 = errors;
                              if (!validate20(data12, { instancePath: instancePath + "/pyramid", parentData: data, parentDataProperty: "pyramid", rootData })) {
                                vErrors = vErrors === null ? validate20.errors : vErrors.concat(validate20.errors);
                                errors = vErrors.length;
                              }
                              var _valid0 = _errs29 === errors;
                              valid2 = valid2 || _valid0;
                              if (!valid2) {
                                const _errs30 = errors;
                                if (data12 !== null) {
                                  const err0 = { instancePath: instancePath + "/pyramid", schemaPath: "#/properties/pyramid/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                  if (vErrors === null) {
                                    vErrors = [err0];
                                  } else {
                                    vErrors.push(err0);
                                  }
                                  errors++;
                                }
                                var _valid0 = _errs30 === errors;
                                valid2 = valid2 || _valid0;
                              }
                              if (!valid2) {
                                const err1 = { instancePath: instancePath + "/pyramid", schemaPath: "#/properties/pyramid/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                if (vErrors === null) {
                                  vErrors = [err1];
                                } else {
                                  vErrors.push(err1);
                                }
                                errors++;
                                validate22.errors = vErrors;
                                return false;
                              } else {
                                errors = _errs28;
                                if (vErrors !== null) {
                                  if (_errs28) {
                                    vErrors.length = _errs28;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                              }
                              var valid0 = _errs27 === errors;
                            } else {
                              var valid0 = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate22.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate22.errors = vErrors;
    return errors === 0;
  }
  var schema26 = { "type": "object", "properties": { "id": { "type": ["string", "number"] }, "label": { "type": "string" }, "x": { "type": "number" }, "y": { "type": "number" }, "w": { "type": "number", "exclusiveMinimum": 0 }, "h": { "type": "number", "exclusiveMinimum": 0 }, "width": { "type": "number", "exclusiveMinimum": 0 }, "height": { "type": "number", "exclusiveMinimum": 0 }, "sources": { "type": "object", "properties": { "detail": { "type": "string", "minLength": 1 }, "preview": { "type": "string" }, "medium": { "type": "string" } }, "additionalProperties": true }, "pyramid": { "anyOf": [{ "$ref": "#/$defs/PyramidV1" }, { "type": "null" }] } }, "required": ["id", "x", "y", "w", "h"], "additionalProperties": true };
  function validate24(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.id === void 0 || !func0.call(data, "id")) && (missing0 = "id") || (data.x === void 0 || !func0.call(data, "x")) && (missing0 = "x") || (data.y === void 0 || !func0.call(data, "y")) && (missing0 = "y") || (data.w === void 0 || !func0.call(data, "w")) && (missing0 = "w") || (data.h === void 0 || !func0.call(data, "h")) && (missing0 = "h")) {
          validate24.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.id !== void 0 && func0.call(data, "id")) {
            let data0 = data.id;
            const _errs2 = errors;
            if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
              validate24.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: schema26.properties.id.type }, message: "must be string,number" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.label !== void 0 && func0.call(data, "label")) {
              const _errs4 = errors;
              if (typeof data.label !== "string") {
                validate24.errors = [{ instancePath: instancePath + "/label", schemaPath: "#/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.x !== void 0 && func0.call(data, "x")) {
                let data2 = data.x;
                const _errs6 = errors;
                if (!(typeof data2 == "number" && isFinite(data2))) {
                  validate24.errors = [{ instancePath: instancePath + "/x", schemaPath: "#/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.y !== void 0 && func0.call(data, "y")) {
                  let data3 = data.y;
                  const _errs8 = errors;
                  if (!(typeof data3 == "number" && isFinite(data3))) {
                    validate24.errors = [{ instancePath: instancePath + "/y", schemaPath: "#/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.w !== void 0 && func0.call(data, "w")) {
                    let data4 = data.w;
                    const _errs10 = errors;
                    if (errors === _errs10) {
                      if (typeof data4 == "number" && isFinite(data4)) {
                        if (data4 <= 0 || isNaN(data4)) {
                          validate24.errors = [{ instancePath: instancePath + "/w", schemaPath: "#/properties/w/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                          return false;
                        }
                      } else {
                        validate24.errors = [{ instancePath: instancePath + "/w", schemaPath: "#/properties/w/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                        return false;
                      }
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.h !== void 0 && func0.call(data, "h")) {
                      let data5 = data.h;
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (typeof data5 == "number" && isFinite(data5)) {
                          if (data5 <= 0 || isNaN(data5)) {
                            validate24.errors = [{ instancePath: instancePath + "/h", schemaPath: "#/properties/h/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                            return false;
                          }
                        } else {
                          validate24.errors = [{ instancePath: instancePath + "/h", schemaPath: "#/properties/h/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                          return false;
                        }
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.width !== void 0 && func0.call(data, "width")) {
                        let data6 = data.width;
                        const _errs14 = errors;
                        if (errors === _errs14) {
                          if (typeof data6 == "number" && isFinite(data6)) {
                            if (data6 <= 0 || isNaN(data6)) {
                              validate24.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                              return false;
                            }
                          } else {
                            validate24.errors = [{ instancePath: instancePath + "/width", schemaPath: "#/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                            return false;
                          }
                        }
                        var valid0 = _errs14 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.height !== void 0 && func0.call(data, "height")) {
                          let data7 = data.height;
                          const _errs16 = errors;
                          if (errors === _errs16) {
                            if (typeof data7 == "number" && isFinite(data7)) {
                              if (data7 <= 0 || isNaN(data7)) {
                                validate24.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                return false;
                              }
                            } else {
                              validate24.errors = [{ instancePath: instancePath + "/height", schemaPath: "#/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                              return false;
                            }
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.sources !== void 0 && func0.call(data, "sources")) {
                            let data8 = data.sources;
                            const _errs18 = errors;
                            if (errors === _errs18) {
                              if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
                                if (data8.detail !== void 0 && func0.call(data8, "detail")) {
                                  let data9 = data8.detail;
                                  const _errs21 = errors;
                                  if (errors === _errs21) {
                                    if (typeof data9 === "string") {
                                      if (func61(data9) < 1) {
                                        validate24.errors = [{ instancePath: instancePath + "/sources/detail", schemaPath: "#/properties/sources/properties/detail/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                        return false;
                                      }
                                    } else {
                                      validate24.errors = [{ instancePath: instancePath + "/sources/detail", schemaPath: "#/properties/sources/properties/detail/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                  }
                                  var valid1 = _errs21 === errors;
                                } else {
                                  var valid1 = true;
                                }
                                if (valid1) {
                                  if (data8.preview !== void 0 && func0.call(data8, "preview")) {
                                    const _errs23 = errors;
                                    if (typeof data8.preview !== "string") {
                                      validate24.errors = [{ instancePath: instancePath + "/sources/preview", schemaPath: "#/properties/sources/properties/preview/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                    var valid1 = _errs23 === errors;
                                  } else {
                                    var valid1 = true;
                                  }
                                  if (valid1) {
                                    if (data8.medium !== void 0 && func0.call(data8, "medium")) {
                                      const _errs25 = errors;
                                      if (typeof data8.medium !== "string") {
                                        validate24.errors = [{ instancePath: instancePath + "/sources/medium", schemaPath: "#/properties/sources/properties/medium/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                      var valid1 = _errs25 === errors;
                                    } else {
                                      var valid1 = true;
                                    }
                                  }
                                }
                              } else {
                                validate24.errors = [{ instancePath: instancePath + "/sources", schemaPath: "#/properties/sources/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                return false;
                              }
                            }
                            var valid0 = _errs18 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.pyramid !== void 0 && func0.call(data, "pyramid")) {
                              let data12 = data.pyramid;
                              const _errs27 = errors;
                              const _errs28 = errors;
                              let valid2 = false;
                              const _errs29 = errors;
                              if (!validate20(data12, { instancePath: instancePath + "/pyramid", parentData: data, parentDataProperty: "pyramid", rootData })) {
                                vErrors = vErrors === null ? validate20.errors : vErrors.concat(validate20.errors);
                                errors = vErrors.length;
                              }
                              var _valid0 = _errs29 === errors;
                              valid2 = valid2 || _valid0;
                              if (!valid2) {
                                const _errs30 = errors;
                                if (data12 !== null) {
                                  const err0 = { instancePath: instancePath + "/pyramid", schemaPath: "#/properties/pyramid/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                  if (vErrors === null) {
                                    vErrors = [err0];
                                  } else {
                                    vErrors.push(err0);
                                  }
                                  errors++;
                                }
                                var _valid0 = _errs30 === errors;
                                valid2 = valid2 || _valid0;
                              }
                              if (!valid2) {
                                const err1 = { instancePath: instancePath + "/pyramid", schemaPath: "#/properties/pyramid/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                if (vErrors === null) {
                                  vErrors = [err1];
                                } else {
                                  vErrors.push(err1);
                                }
                                errors++;
                                validate24.errors = vErrors;
                                return false;
                              } else {
                                errors = _errs28;
                                if (vErrors !== null) {
                                  if (_errs28) {
                                    vErrors.length = _errs28;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                              }
                              var valid0 = _errs27 === errors;
                            } else {
                              var valid0 = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate24.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate24.errors = vErrors;
    return errors === 0;
  }
  var schema27 = { "type": "object", "properties": { "area": { "type": ["string", "number"] }, "x": { "type": "number" }, "y": { "type": "number" } }, "required": ["area", "x", "y"], "additionalProperties": true };
  var schema28 = { "type": "object", "properties": { "letter": { "type": ["string", "number"] }, "text": { "type": "string" }, "facts": { "type": "array", "items": { "$ref": "#/$defs/ReferenceFactV1" } }, "factSections": { "type": "array", "items": { "$ref": "#/$defs/FactSectionV1" } } }, "additionalProperties": true };
  function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.letter !== void 0 && func0.call(data, "letter")) {
          let data0 = data.letter;
          const _errs2 = errors;
          if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
            validate27.errors = [{ instancePath: instancePath + "/letter", schemaPath: "#/properties/letter/type", keyword: "type", params: { type: schema28.properties.letter.type }, message: "must be string,number" }];
            return false;
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.text !== void 0 && func0.call(data, "text")) {
            const _errs4 = errors;
            if (typeof data.text !== "string") {
              validate27.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.facts !== void 0 && func0.call(data, "facts")) {
              let data2 = data.facts;
              const _errs6 = errors;
              if (errors === _errs6) {
                if (Array.isArray(data2)) {
                  var valid1 = true;
                  const len0 = data2.length;
                  for (let i0 = 0; i0 < len0; i0++) {
                    let data3 = data2[i0];
                    const _errs8 = errors;
                    const _errs9 = errors;
                    if (errors === _errs9) {
                      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
                        let missing0;
                        if ((data3.label === void 0 || !func0.call(data3, "label")) && (missing0 = "label") || (data3.value === void 0 || !func0.call(data3, "value")) && (missing0 = "value")) {
                          validate27.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/ReferenceFactV1/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
                          return false;
                        } else {
                          if (data3.label !== void 0 && func0.call(data3, "label")) {
                            let data4 = data3.label;
                            const _errs12 = errors;
                            if (errors === _errs12) {
                              if (typeof data4 === "string") {
                                if (func61(data4) < 1) {
                                  validate27.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                  return false;
                                }
                              } else {
                                validate27.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                return false;
                              }
                            }
                            var valid3 = _errs12 === errors;
                          } else {
                            var valid3 = true;
                          }
                          if (valid3) {
                            if (data3.value !== void 0 && func0.call(data3, "value")) {
                              let data5 = data3.value;
                              const _errs14 = errors;
                              if (typeof data5 !== "string" && !(typeof data5 == "number" && isFinite(data5)) && typeof data5 !== "boolean" && data5 !== null) {
                                validate27.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/value", schemaPath: "#/$defs/ReferenceFactV1/properties/value/type", keyword: "type", params: { type: schema15.properties.value.type }, message: "must be string,number,boolean,null" }];
                                return false;
                              }
                              var valid3 = _errs14 === errors;
                            } else {
                              var valid3 = true;
                            }
                            if (valid3) {
                              if (data3.note !== void 0 && func0.call(data3, "note")) {
                                const _errs16 = errors;
                                if (typeof data3.note !== "string") {
                                  validate27.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/note", schemaPath: "#/$defs/ReferenceFactV1/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                                var valid3 = _errs16 === errors;
                              } else {
                                var valid3 = true;
                              }
                            }
                          }
                        }
                      } else {
                        validate27.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/ReferenceFactV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                        return false;
                      }
                    }
                    var valid1 = _errs8 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                } else {
                  validate27.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.factSections !== void 0 && func0.call(data, "factSections")) {
                let data7 = data.factSections;
                const _errs18 = errors;
                if (errors === _errs18) {
                  if (Array.isArray(data7)) {
                    var valid4 = true;
                    const len1 = data7.length;
                    for (let i1 = 0; i1 < len1; i1++) {
                      const _errs20 = errors;
                      if (!validate15(data7[i1], { instancePath: instancePath + "/factSections/" + i1, parentData: data7, parentDataProperty: i1, rootData })) {
                        vErrors = vErrors === null ? validate15.errors : vErrors.concat(validate15.errors);
                        errors = vErrors.length;
                      }
                      var valid4 = _errs20 === errors;
                      if (!valid4) {
                        break;
                      }
                    }
                  } else {
                    validate27.errors = [{ instancePath: instancePath + "/factSections", schemaPath: "#/properties/factSections/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs18 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      } else {
        validate27.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate27.errors = vErrors;
    return errors === 0;
  }
  var schema30 = { "type": "object", "properties": { "id": { "type": ["string", "number"] }, "name": { "type": "string", "minLength": 1 }, "steps": { "type": "array", "items": { "$ref": "#/$defs/StepV1" }, "minItems": 1 }, "locations": { "type": "object", "additionalProperties": { "$ref": "#/$defs/PositionV1" } }, "facts": { "type": "array", "items": { "$ref": "#/$defs/ReferenceFactV1" } }, "factSections": { "type": "array", "items": { "$ref": "#/$defs/FactSectionV1" } } }, "required": ["id", "name", "steps", "locations"], "additionalProperties": true };
  function validate29(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.id === void 0 || !func0.call(data, "id")) && (missing0 = "id") || (data.name === void 0 || !func0.call(data, "name")) && (missing0 = "name") || (data.steps === void 0 || !func0.call(data, "steps")) && (missing0 = "steps") || (data.locations === void 0 || !func0.call(data, "locations")) && (missing0 = "locations")) {
          validate29.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.id !== void 0 && func0.call(data, "id")) {
            let data0 = data.id;
            const _errs2 = errors;
            if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
              validate29.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: schema30.properties.id.type }, message: "must be string,number" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.name !== void 0 && func0.call(data, "name")) {
              let data1 = data.name;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === "string") {
                  if (func61(data1) < 1) {
                    validate29.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                } else {
                  validate29.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.steps !== void 0 && func0.call(data, "steps")) {
                let data2 = data.steps;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (Array.isArray(data2)) {
                    if (data2.length < 1) {
                      validate29.errors = [{ instancePath: instancePath + "/steps", schemaPath: "#/properties/steps/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                      return false;
                    } else {
                      var valid1 = true;
                      const len0 = data2.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        const _errs8 = errors;
                        if (!validate27(data2[i0], { instancePath: instancePath + "/steps/" + i0, parentData: data2, parentDataProperty: i0, rootData })) {
                          vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
                          errors = vErrors.length;
                        }
                        var valid1 = _errs8 === errors;
                        if (!valid1) {
                          break;
                        }
                      }
                    }
                  } else {
                    validate29.errors = [{ instancePath: instancePath + "/steps", schemaPath: "#/properties/steps/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.locations !== void 0 && func0.call(data, "locations")) {
                  let data4 = data.locations;
                  const _errs9 = errors;
                  if (errors === _errs9) {
                    if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                      for (const key0 of Object.keys(data4)) {
                        let data5 = data4[key0];
                        const _errs12 = errors;
                        const _errs13 = errors;
                        if (errors === _errs13) {
                          if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                            let missing1;
                            if ((data5.area === void 0 || !func0.call(data5, "area")) && (missing1 = "area") || (data5.x === void 0 || !func0.call(data5, "x")) && (missing1 = "x") || (data5.y === void 0 || !func0.call(data5, "y")) && (missing1 = "y")) {
                              validate29.errors = [{ instancePath: instancePath + "/locations/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/PositionV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                              return false;
                            } else {
                              if (data5.area !== void 0 && func0.call(data5, "area")) {
                                let data6 = data5.area;
                                const _errs16 = errors;
                                if (typeof data6 !== "string" && !(typeof data6 == "number" && isFinite(data6))) {
                                  validate29.errors = [{ instancePath: instancePath + "/locations/" + key0.replace(/~/g, "~0").replace(/\//g, "~1") + "/area", schemaPath: "#/$defs/PositionV1/properties/area/type", keyword: "type", params: { type: schema27.properties.area.type }, message: "must be string,number" }];
                                  return false;
                                }
                                var valid4 = _errs16 === errors;
                              } else {
                                var valid4 = true;
                              }
                              if (valid4) {
                                if (data5.x !== void 0 && func0.call(data5, "x")) {
                                  let data7 = data5.x;
                                  const _errs18 = errors;
                                  if (!(typeof data7 == "number" && isFinite(data7))) {
                                    validate29.errors = [{ instancePath: instancePath + "/locations/" + key0.replace(/~/g, "~0").replace(/\//g, "~1") + "/x", schemaPath: "#/$defs/PositionV1/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                    return false;
                                  }
                                  var valid4 = _errs18 === errors;
                                } else {
                                  var valid4 = true;
                                }
                                if (valid4) {
                                  if (data5.y !== void 0 && func0.call(data5, "y")) {
                                    let data8 = data5.y;
                                    const _errs20 = errors;
                                    if (!(typeof data8 == "number" && isFinite(data8))) {
                                      validate29.errors = [{ instancePath: instancePath + "/locations/" + key0.replace(/~/g, "~0").replace(/\//g, "~1") + "/y", schemaPath: "#/$defs/PositionV1/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                      return false;
                                    }
                                    var valid4 = _errs20 === errors;
                                  } else {
                                    var valid4 = true;
                                  }
                                }
                              }
                            }
                          } else {
                            validate29.errors = [{ instancePath: instancePath + "/locations/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/PositionV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                        }
                        var valid2 = _errs12 === errors;
                        if (!valid2) {
                          break;
                        }
                      }
                    } else {
                      validate29.errors = [{ instancePath: instancePath + "/locations", schemaPath: "#/properties/locations/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                  var valid0 = _errs9 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.facts !== void 0 && func0.call(data, "facts")) {
                    let data9 = data.facts;
                    const _errs22 = errors;
                    if (errors === _errs22) {
                      if (Array.isArray(data9)) {
                        var valid5 = true;
                        const len1 = data9.length;
                        for (let i1 = 0; i1 < len1; i1++) {
                          let data10 = data9[i1];
                          const _errs24 = errors;
                          const _errs25 = errors;
                          if (errors === _errs25) {
                            if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
                              let missing2;
                              if ((data10.label === void 0 || !func0.call(data10, "label")) && (missing2 = "label") || (data10.value === void 0 || !func0.call(data10, "value")) && (missing2 = "value")) {
                                validate29.errors = [{ instancePath: instancePath + "/facts/" + i1, schemaPath: "#/$defs/ReferenceFactV1/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                                return false;
                              } else {
                                if (data10.label !== void 0 && func0.call(data10, "label")) {
                                  let data11 = data10.label;
                                  const _errs28 = errors;
                                  if (errors === _errs28) {
                                    if (typeof data11 === "string") {
                                      if (func61(data11) < 1) {
                                        validate29.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                        return false;
                                      }
                                    } else {
                                      validate29.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                  }
                                  var valid7 = _errs28 === errors;
                                } else {
                                  var valid7 = true;
                                }
                                if (valid7) {
                                  if (data10.value !== void 0 && func0.call(data10, "value")) {
                                    let data12 = data10.value;
                                    const _errs30 = errors;
                                    if (typeof data12 !== "string" && !(typeof data12 == "number" && isFinite(data12)) && typeof data12 !== "boolean" && data12 !== null) {
                                      validate29.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/value", schemaPath: "#/$defs/ReferenceFactV1/properties/value/type", keyword: "type", params: { type: schema15.properties.value.type }, message: "must be string,number,boolean,null" }];
                                      return false;
                                    }
                                    var valid7 = _errs30 === errors;
                                  } else {
                                    var valid7 = true;
                                  }
                                  if (valid7) {
                                    if (data10.note !== void 0 && func0.call(data10, "note")) {
                                      const _errs32 = errors;
                                      if (typeof data10.note !== "string") {
                                        validate29.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/note", schemaPath: "#/$defs/ReferenceFactV1/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                      var valid7 = _errs32 === errors;
                                    } else {
                                      var valid7 = true;
                                    }
                                  }
                                }
                              }
                            } else {
                              validate29.errors = [{ instancePath: instancePath + "/facts/" + i1, schemaPath: "#/$defs/ReferenceFactV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                              return false;
                            }
                          }
                          var valid5 = _errs24 === errors;
                          if (!valid5) {
                            break;
                          }
                        }
                      } else {
                        validate29.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                        return false;
                      }
                    }
                    var valid0 = _errs22 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.factSections !== void 0 && func0.call(data, "factSections")) {
                      let data14 = data.factSections;
                      const _errs34 = errors;
                      if (errors === _errs34) {
                        if (Array.isArray(data14)) {
                          var valid8 = true;
                          const len2 = data14.length;
                          for (let i2 = 0; i2 < len2; i2++) {
                            const _errs36 = errors;
                            if (!validate15(data14[i2], { instancePath: instancePath + "/factSections/" + i2, parentData: data14, parentDataProperty: i2, rootData })) {
                              vErrors = vErrors === null ? validate15.errors : vErrors.concat(validate15.errors);
                              errors = vErrors.length;
                            }
                            var valid8 = _errs36 === errors;
                            if (!valid8) {
                              break;
                            }
                          }
                        } else {
                          validate29.errors = [{ instancePath: instancePath + "/factSections", schemaPath: "#/properties/factSections/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid0 = _errs34 === errors;
                    } else {
                      var valid0 = true;
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate29.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate29.errors = vErrors;
    return errors === 0;
  }
  var schema33 = { "type": "object", "properties": { "area": { "type": ["string", "number"] }, "x": { "type": "number" }, "y": { "type": "number" }, "id": { "type": ["string", "number"] }, "linkId": { "type": ["string", "number"] }, "name": { "type": "string", "minLength": 1 }, "type": { "type": ["string", "number"] }, "destinations": { "type": "array", "items": { "$ref": "#/$defs/PositionV1" } }, "routes": { "type": "array", "items": { "$ref": "#/$defs/ActivityV1" } }, "photo": { "$ref": "#/$defs/PhotoV1" }, "facts": { "type": "array", "items": { "$ref": "#/$defs/ReferenceFactV1" } }, "factSections": { "type": "array", "items": { "$ref": "#/$defs/FactSectionV1" } } }, "required": ["area", "x", "y", "name", "type"], "additionalProperties": true };
  function validate32(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.area === void 0 || !func0.call(data, "area")) && (missing0 = "area") || (data.x === void 0 || !func0.call(data, "x")) && (missing0 = "x") || (data.y === void 0 || !func0.call(data, "y")) && (missing0 = "y") || (data.name === void 0 || !func0.call(data, "name")) && (missing0 = "name") || (data.type === void 0 || !func0.call(data, "type")) && (missing0 = "type")) {
          validate32.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.area !== void 0 && func0.call(data, "area")) {
            let data0 = data.area;
            const _errs2 = errors;
            if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
              validate32.errors = [{ instancePath: instancePath + "/area", schemaPath: "#/properties/area/type", keyword: "type", params: { type: schema33.properties.area.type }, message: "must be string,number" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.x !== void 0 && func0.call(data, "x")) {
              let data1 = data.x;
              const _errs4 = errors;
              if (!(typeof data1 == "number" && isFinite(data1))) {
                validate32.errors = [{ instancePath: instancePath + "/x", schemaPath: "#/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.y !== void 0 && func0.call(data, "y")) {
                let data2 = data.y;
                const _errs6 = errors;
                if (!(typeof data2 == "number" && isFinite(data2))) {
                  validate32.errors = [{ instancePath: instancePath + "/y", schemaPath: "#/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.id !== void 0 && func0.call(data, "id")) {
                  let data3 = data.id;
                  const _errs8 = errors;
                  if (typeof data3 !== "string" && !(typeof data3 == "number" && isFinite(data3))) {
                    validate32.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: schema33.properties.id.type }, message: "must be string,number" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.linkId !== void 0 && func0.call(data, "linkId")) {
                    let data4 = data.linkId;
                    const _errs10 = errors;
                    if (typeof data4 !== "string" && !(typeof data4 == "number" && isFinite(data4))) {
                      validate32.errors = [{ instancePath: instancePath + "/linkId", schemaPath: "#/properties/linkId/type", keyword: "type", params: { type: schema33.properties.linkId.type }, message: "must be string,number" }];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.name !== void 0 && func0.call(data, "name")) {
                      let data5 = data.name;
                      const _errs12 = errors;
                      if (errors === _errs12) {
                        if (typeof data5 === "string") {
                          if (func61(data5) < 1) {
                            validate32.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                            return false;
                          }
                        } else {
                          validate32.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.type !== void 0 && func0.call(data, "type")) {
                        let data6 = data.type;
                        const _errs14 = errors;
                        if (typeof data6 !== "string" && !(typeof data6 == "number" && isFinite(data6))) {
                          validate32.errors = [{ instancePath: instancePath + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: schema33.properties.type.type }, message: "must be string,number" }];
                          return false;
                        }
                        var valid0 = _errs14 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.destinations !== void 0 && func0.call(data, "destinations")) {
                          let data7 = data.destinations;
                          const _errs16 = errors;
                          if (errors === _errs16) {
                            if (Array.isArray(data7)) {
                              var valid1 = true;
                              const len0 = data7.length;
                              for (let i0 = 0; i0 < len0; i0++) {
                                let data8 = data7[i0];
                                const _errs18 = errors;
                                const _errs19 = errors;
                                if (errors === _errs19) {
                                  if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
                                    let missing1;
                                    if ((data8.area === void 0 || !func0.call(data8, "area")) && (missing1 = "area") || (data8.x === void 0 || !func0.call(data8, "x")) && (missing1 = "x") || (data8.y === void 0 || !func0.call(data8, "y")) && (missing1 = "y")) {
                                      validate32.errors = [{ instancePath: instancePath + "/destinations/" + i0, schemaPath: "#/$defs/PositionV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                                      return false;
                                    } else {
                                      if (data8.area !== void 0 && func0.call(data8, "area")) {
                                        let data9 = data8.area;
                                        const _errs22 = errors;
                                        if (typeof data9 !== "string" && !(typeof data9 == "number" && isFinite(data9))) {
                                          validate32.errors = [{ instancePath: instancePath + "/destinations/" + i0 + "/area", schemaPath: "#/$defs/PositionV1/properties/area/type", keyword: "type", params: { type: schema27.properties.area.type }, message: "must be string,number" }];
                                          return false;
                                        }
                                        var valid3 = _errs22 === errors;
                                      } else {
                                        var valid3 = true;
                                      }
                                      if (valid3) {
                                        if (data8.x !== void 0 && func0.call(data8, "x")) {
                                          let data10 = data8.x;
                                          const _errs24 = errors;
                                          if (!(typeof data10 == "number" && isFinite(data10))) {
                                            validate32.errors = [{ instancePath: instancePath + "/destinations/" + i0 + "/x", schemaPath: "#/$defs/PositionV1/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                            return false;
                                          }
                                          var valid3 = _errs24 === errors;
                                        } else {
                                          var valid3 = true;
                                        }
                                        if (valid3) {
                                          if (data8.y !== void 0 && func0.call(data8, "y")) {
                                            let data11 = data8.y;
                                            const _errs26 = errors;
                                            if (!(typeof data11 == "number" && isFinite(data11))) {
                                              validate32.errors = [{ instancePath: instancePath + "/destinations/" + i0 + "/y", schemaPath: "#/$defs/PositionV1/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                            var valid3 = _errs26 === errors;
                                          } else {
                                            var valid3 = true;
                                          }
                                        }
                                      }
                                    }
                                  } else {
                                    validate32.errors = [{ instancePath: instancePath + "/destinations/" + i0, schemaPath: "#/$defs/PositionV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                    return false;
                                  }
                                }
                                var valid1 = _errs18 === errors;
                                if (!valid1) {
                                  break;
                                }
                              }
                            } else {
                              validate32.errors = [{ instancePath: instancePath + "/destinations", schemaPath: "#/properties/destinations/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                              return false;
                            }
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.routes !== void 0 && func0.call(data, "routes")) {
                            let data12 = data.routes;
                            const _errs28 = errors;
                            if (errors === _errs28) {
                              if (Array.isArray(data12)) {
                                var valid4 = true;
                                const len1 = data12.length;
                                for (let i1 = 0; i1 < len1; i1++) {
                                  const _errs30 = errors;
                                  if (!validate29(data12[i1], { instancePath: instancePath + "/routes/" + i1, parentData: data12, parentDataProperty: i1, rootData })) {
                                    vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
                                    errors = vErrors.length;
                                  }
                                  var valid4 = _errs30 === errors;
                                  if (!valid4) {
                                    break;
                                  }
                                }
                              } else {
                                validate32.errors = [{ instancePath: instancePath + "/routes", schemaPath: "#/properties/routes/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                return false;
                              }
                            }
                            var valid0 = _errs28 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.photo !== void 0 && func0.call(data, "photo")) {
                              let data14 = data.photo;
                              const _errs31 = errors;
                              const _errs32 = errors;
                              if (errors === _errs32) {
                                if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
                                  let missing2;
                                  if ((data14.source === void 0 || !func0.call(data14, "source")) && (missing2 = "source")) {
                                    validate32.errors = [{ instancePath: instancePath + "/photo", schemaPath: "#/$defs/PhotoV1/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                                    return false;
                                  } else {
                                    if (data14.source !== void 0 && func0.call(data14, "source")) {
                                      let data15 = data14.source;
                                      const _errs35 = errors;
                                      if (errors === _errs35) {
                                        if (typeof data15 === "string") {
                                          if (func61(data15) < 1) {
                                            validate32.errors = [{ instancePath: instancePath + "/photo/source", schemaPath: "#/$defs/PhotoV1/properties/source/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                            return false;
                                          }
                                        } else {
                                          validate32.errors = [{ instancePath: instancePath + "/photo/source", schemaPath: "#/$defs/PhotoV1/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                          return false;
                                        }
                                      }
                                      var valid6 = _errs35 === errors;
                                    } else {
                                      var valid6 = true;
                                    }
                                    if (valid6) {
                                      if (data14.preview !== void 0 && func0.call(data14, "preview")) {
                                        const _errs37 = errors;
                                        if (typeof data14.preview !== "string") {
                                          validate32.errors = [{ instancePath: instancePath + "/photo/preview", schemaPath: "#/$defs/PhotoV1/properties/preview/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                          return false;
                                        }
                                        var valid6 = _errs37 === errors;
                                      } else {
                                        var valid6 = true;
                                      }
                                      if (valid6) {
                                        if (data14.width !== void 0 && func0.call(data14, "width")) {
                                          let data17 = data14.width;
                                          const _errs39 = errors;
                                          if (errors === _errs39) {
                                            if (typeof data17 == "number" && isFinite(data17)) {
                                              if (data17 <= 0 || isNaN(data17)) {
                                                validate32.errors = [{ instancePath: instancePath + "/photo/width", schemaPath: "#/$defs/PhotoV1/properties/width/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                                return false;
                                              }
                                            } else {
                                              validate32.errors = [{ instancePath: instancePath + "/photo/width", schemaPath: "#/$defs/PhotoV1/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                          }
                                          var valid6 = _errs39 === errors;
                                        } else {
                                          var valid6 = true;
                                        }
                                        if (valid6) {
                                          if (data14.height !== void 0 && func0.call(data14, "height")) {
                                            let data18 = data14.height;
                                            const _errs41 = errors;
                                            if (errors === _errs41) {
                                              if (typeof data18 == "number" && isFinite(data18)) {
                                                if (data18 <= 0 || isNaN(data18)) {
                                                  validate32.errors = [{ instancePath: instancePath + "/photo/height", schemaPath: "#/$defs/PhotoV1/properties/height/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                                  return false;
                                                }
                                              } else {
                                                validate32.errors = [{ instancePath: instancePath + "/photo/height", schemaPath: "#/$defs/PhotoV1/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                                return false;
                                              }
                                            }
                                            var valid6 = _errs41 === errors;
                                          } else {
                                            var valid6 = true;
                                          }
                                        }
                                      }
                                    }
                                  }
                                } else {
                                  validate32.errors = [{ instancePath: instancePath + "/photo", schemaPath: "#/$defs/PhotoV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                  return false;
                                }
                              }
                              var valid0 = _errs31 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.facts !== void 0 && func0.call(data, "facts")) {
                                let data19 = data.facts;
                                const _errs43 = errors;
                                if (errors === _errs43) {
                                  if (Array.isArray(data19)) {
                                    var valid7 = true;
                                    const len2 = data19.length;
                                    for (let i2 = 0; i2 < len2; i2++) {
                                      let data20 = data19[i2];
                                      const _errs45 = errors;
                                      const _errs46 = errors;
                                      if (errors === _errs46) {
                                        if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
                                          let missing3;
                                          if ((data20.label === void 0 || !func0.call(data20, "label")) && (missing3 = "label") || (data20.value === void 0 || !func0.call(data20, "value")) && (missing3 = "value")) {
                                            validate32.errors = [{ instancePath: instancePath + "/facts/" + i2, schemaPath: "#/$defs/ReferenceFactV1/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" }];
                                            return false;
                                          } else {
                                            if (data20.label !== void 0 && func0.call(data20, "label")) {
                                              let data21 = data20.label;
                                              const _errs49 = errors;
                                              if (errors === _errs49) {
                                                if (typeof data21 === "string") {
                                                  if (func61(data21) < 1) {
                                                    validate32.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                                    return false;
                                                  }
                                                } else {
                                                  validate32.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                  return false;
                                                }
                                              }
                                              var valid9 = _errs49 === errors;
                                            } else {
                                              var valid9 = true;
                                            }
                                            if (valid9) {
                                              if (data20.value !== void 0 && func0.call(data20, "value")) {
                                                let data22 = data20.value;
                                                const _errs51 = errors;
                                                if (typeof data22 !== "string" && !(typeof data22 == "number" && isFinite(data22)) && typeof data22 !== "boolean" && data22 !== null) {
                                                  validate32.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/value", schemaPath: "#/$defs/ReferenceFactV1/properties/value/type", keyword: "type", params: { type: schema15.properties.value.type }, message: "must be string,number,boolean,null" }];
                                                  return false;
                                                }
                                                var valid9 = _errs51 === errors;
                                              } else {
                                                var valid9 = true;
                                              }
                                              if (valid9) {
                                                if (data20.note !== void 0 && func0.call(data20, "note")) {
                                                  const _errs53 = errors;
                                                  if (typeof data20.note !== "string") {
                                                    validate32.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/note", schemaPath: "#/$defs/ReferenceFactV1/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                    return false;
                                                  }
                                                  var valid9 = _errs53 === errors;
                                                } else {
                                                  var valid9 = true;
                                                }
                                              }
                                            }
                                          }
                                        } else {
                                          validate32.errors = [{ instancePath: instancePath + "/facts/" + i2, schemaPath: "#/$defs/ReferenceFactV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                          return false;
                                        }
                                      }
                                      var valid7 = _errs45 === errors;
                                      if (!valid7) {
                                        break;
                                      }
                                    }
                                  } else {
                                    validate32.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                    return false;
                                  }
                                }
                                var valid0 = _errs43 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.factSections !== void 0 && func0.call(data, "factSections")) {
                                  let data24 = data.factSections;
                                  const _errs55 = errors;
                                  if (errors === _errs55) {
                                    if (Array.isArray(data24)) {
                                      var valid10 = true;
                                      const len3 = data24.length;
                                      for (let i3 = 0; i3 < len3; i3++) {
                                        const _errs57 = errors;
                                        if (!validate15(data24[i3], { instancePath: instancePath + "/factSections/" + i3, parentData: data24, parentDataProperty: i3, rootData })) {
                                          vErrors = vErrors === null ? validate15.errors : vErrors.concat(validate15.errors);
                                          errors = vErrors.length;
                                        }
                                        var valid10 = _errs57 === errors;
                                        if (!valid10) {
                                          break;
                                        }
                                      }
                                    } else {
                                      validate32.errors = [{ instancePath: instancePath + "/factSections", schemaPath: "#/properties/factSections/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                      return false;
                                    }
                                  }
                                  var valid0 = _errs55 === errors;
                                } else {
                                  var valid0 = true;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate32.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate32.errors = vErrors;
    return errors === 0;
  }
  var schema37 = { "allOf": [{ "$ref": "#/$defs/ActivityV1" }, { "type": "object", "properties": { "type": { "type": ["string", "number"] }, "pin": { "$ref": "#/$defs/PositionV1" }, "interior": { "$ref": "#/$defs/PositionV1" } }, "required": ["type", "pin"], "additionalProperties": true }] };
  function validate35(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    const _errs0 = errors;
    if (!validate29(data, { instancePath, parentData, parentDataProperty, rootData })) {
      vErrors = vErrors === null ? validate29.errors : vErrors.concat(validate29.errors);
      errors = vErrors.length;
    }
    var valid0 = _errs0 === errors;
    if (valid0) {
      const _errs1 = errors;
      if (errors === _errs1) {
        if (data && typeof data == "object" && !Array.isArray(data)) {
          let missing0;
          if ((data.type === void 0 || !func0.call(data, "type")) && (missing0 = "type") || (data.pin === void 0 || !func0.call(data, "pin")) && (missing0 = "pin")) {
            validate35.errors = [{ instancePath, schemaPath: "#/allOf/1/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
            return false;
          } else {
            if (data.type !== void 0 && func0.call(data, "type")) {
              let data0 = data.type;
              const _errs4 = errors;
              if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
                validate35.errors = [{ instancePath: instancePath + "/type", schemaPath: "#/allOf/1/properties/type/type", keyword: "type", params: { type: schema37.allOf[1].properties.type.type }, message: "must be string,number" }];
                return false;
              }
              var valid1 = _errs4 === errors;
            } else {
              var valid1 = true;
            }
            if (valid1) {
              if (data.pin !== void 0 && func0.call(data, "pin")) {
                let data1 = data.pin;
                const _errs6 = errors;
                const _errs7 = errors;
                if (errors === _errs7) {
                  if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                    let missing1;
                    if ((data1.area === void 0 || !func0.call(data1, "area")) && (missing1 = "area") || (data1.x === void 0 || !func0.call(data1, "x")) && (missing1 = "x") || (data1.y === void 0 || !func0.call(data1, "y")) && (missing1 = "y")) {
                      validate35.errors = [{ instancePath: instancePath + "/pin", schemaPath: "#/$defs/PositionV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                      return false;
                    } else {
                      if (data1.area !== void 0 && func0.call(data1, "area")) {
                        let data2 = data1.area;
                        const _errs10 = errors;
                        if (typeof data2 !== "string" && !(typeof data2 == "number" && isFinite(data2))) {
                          validate35.errors = [{ instancePath: instancePath + "/pin/area", schemaPath: "#/$defs/PositionV1/properties/area/type", keyword: "type", params: { type: schema27.properties.area.type }, message: "must be string,number" }];
                          return false;
                        }
                        var valid3 = _errs10 === errors;
                      } else {
                        var valid3 = true;
                      }
                      if (valid3) {
                        if (data1.x !== void 0 && func0.call(data1, "x")) {
                          let data3 = data1.x;
                          const _errs12 = errors;
                          if (!(typeof data3 == "number" && isFinite(data3))) {
                            validate35.errors = [{ instancePath: instancePath + "/pin/x", schemaPath: "#/$defs/PositionV1/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                            return false;
                          }
                          var valid3 = _errs12 === errors;
                        } else {
                          var valid3 = true;
                        }
                        if (valid3) {
                          if (data1.y !== void 0 && func0.call(data1, "y")) {
                            let data4 = data1.y;
                            const _errs14 = errors;
                            if (!(typeof data4 == "number" && isFinite(data4))) {
                              validate35.errors = [{ instancePath: instancePath + "/pin/y", schemaPath: "#/$defs/PositionV1/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                              return false;
                            }
                            var valid3 = _errs14 === errors;
                          } else {
                            var valid3 = true;
                          }
                        }
                      }
                    }
                  } else {
                    validate35.errors = [{ instancePath: instancePath + "/pin", schemaPath: "#/$defs/PositionV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                    return false;
                  }
                }
                var valid1 = _errs6 === errors;
              } else {
                var valid1 = true;
              }
              if (valid1) {
                if (data.interior !== void 0 && func0.call(data, "interior")) {
                  let data5 = data.interior;
                  const _errs16 = errors;
                  const _errs17 = errors;
                  if (errors === _errs17) {
                    if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                      let missing2;
                      if ((data5.area === void 0 || !func0.call(data5, "area")) && (missing2 = "area") || (data5.x === void 0 || !func0.call(data5, "x")) && (missing2 = "x") || (data5.y === void 0 || !func0.call(data5, "y")) && (missing2 = "y")) {
                        validate35.errors = [{ instancePath: instancePath + "/interior", schemaPath: "#/$defs/PositionV1/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                        return false;
                      } else {
                        if (data5.area !== void 0 && func0.call(data5, "area")) {
                          let data6 = data5.area;
                          const _errs20 = errors;
                          if (typeof data6 !== "string" && !(typeof data6 == "number" && isFinite(data6))) {
                            validate35.errors = [{ instancePath: instancePath + "/interior/area", schemaPath: "#/$defs/PositionV1/properties/area/type", keyword: "type", params: { type: schema27.properties.area.type }, message: "must be string,number" }];
                            return false;
                          }
                          var valid5 = _errs20 === errors;
                        } else {
                          var valid5 = true;
                        }
                        if (valid5) {
                          if (data5.x !== void 0 && func0.call(data5, "x")) {
                            let data7 = data5.x;
                            const _errs22 = errors;
                            if (!(typeof data7 == "number" && isFinite(data7))) {
                              validate35.errors = [{ instancePath: instancePath + "/interior/x", schemaPath: "#/$defs/PositionV1/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                              return false;
                            }
                            var valid5 = _errs22 === errors;
                          } else {
                            var valid5 = true;
                          }
                          if (valid5) {
                            if (data5.y !== void 0 && func0.call(data5, "y")) {
                              let data8 = data5.y;
                              const _errs24 = errors;
                              if (!(typeof data8 == "number" && isFinite(data8))) {
                                validate35.errors = [{ instancePath: instancePath + "/interior/y", schemaPath: "#/$defs/PositionV1/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                return false;
                              }
                              var valid5 = _errs24 === errors;
                            } else {
                              var valid5 = true;
                            }
                          }
                        }
                      }
                    } else {
                      validate35.errors = [{ instancePath: instancePath + "/interior", schemaPath: "#/$defs/PositionV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                  var valid1 = _errs16 === errors;
                } else {
                  var valid1 = true;
                }
              }
            }
          }
        } else {
          validate35.errors = [{ instancePath, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
          return false;
        }
      }
      var valid0 = _errs1 === errors;
    }
    validate35.errors = vErrors;
    return errors === 0;
  }
  var schema40 = { "type": "object", "properties": { "area": { "type": ["string", "number"] }, "x": { "type": "number" }, "y": { "type": "number" }, "id": { "type": ["string", "number", "null"] }, "name": { "type": "string" }, "layer": { "type": ["string", "number", "null"] }, "curve": { "type": "array", "items": { "$ref": "#/$defs/PointV1" }, "minItems": 1 }, "geometry": { "type": "array", "items": { "$ref": "#/$defs/PointV1" }, "minItems": 1 }, "fontSize": { "type": ["number", "null"], "exclusiveMinimum": 0 }, "textLength": { "type": ["number", "null"] }, "angle": { "type": ["number", "null"] }, "widthScale": { "type": ["number", "null"] }, "facts": { "type": "array", "items": { "$ref": "#/$defs/ReferenceFactV1" } }, "factSections": { "type": "array", "items": { "$ref": "#/$defs/FactSectionV1" } } }, "required": ["area", "name"], "additionalProperties": true };
  function validate37(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.area === void 0 || !func0.call(data, "area")) && (missing0 = "area") || (data.name === void 0 || !func0.call(data, "name")) && (missing0 = "name")) {
          validate37.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.area !== void 0 && func0.call(data, "area")) {
            let data0 = data.area;
            const _errs2 = errors;
            if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
              validate37.errors = [{ instancePath: instancePath + "/area", schemaPath: "#/properties/area/type", keyword: "type", params: { type: schema40.properties.area.type }, message: "must be string,number" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.x !== void 0 && func0.call(data, "x")) {
              let data1 = data.x;
              const _errs4 = errors;
              if (!(typeof data1 == "number" && isFinite(data1))) {
                validate37.errors = [{ instancePath: instancePath + "/x", schemaPath: "#/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.y !== void 0 && func0.call(data, "y")) {
                let data2 = data.y;
                const _errs6 = errors;
                if (!(typeof data2 == "number" && isFinite(data2))) {
                  validate37.errors = [{ instancePath: instancePath + "/y", schemaPath: "#/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.id !== void 0 && func0.call(data, "id")) {
                  let data3 = data.id;
                  const _errs8 = errors;
                  if (typeof data3 !== "string" && !(typeof data3 == "number" && isFinite(data3)) && data3 !== null) {
                    validate37.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: schema40.properties.id.type }, message: "must be string,number,null" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.name !== void 0 && func0.call(data, "name")) {
                    const _errs10 = errors;
                    if (typeof data.name !== "string") {
                      validate37.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.layer !== void 0 && func0.call(data, "layer")) {
                      let data5 = data.layer;
                      const _errs12 = errors;
                      if (typeof data5 !== "string" && !(typeof data5 == "number" && isFinite(data5)) && data5 !== null) {
                        validate37.errors = [{ instancePath: instancePath + "/layer", schemaPath: "#/properties/layer/type", keyword: "type", params: { type: schema40.properties.layer.type }, message: "must be string,number,null" }];
                        return false;
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.curve !== void 0 && func0.call(data, "curve")) {
                        let data6 = data.curve;
                        const _errs14 = errors;
                        if (errors === _errs14) {
                          if (Array.isArray(data6)) {
                            if (data6.length < 1) {
                              validate37.errors = [{ instancePath: instancePath + "/curve", schemaPath: "#/properties/curve/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                              return false;
                            } else {
                              var valid1 = true;
                              const len0 = data6.length;
                              for (let i0 = 0; i0 < len0; i0++) {
                                let data7 = data6[i0];
                                const _errs16 = errors;
                                const _errs17 = errors;
                                if (errors === _errs17) {
                                  if (Array.isArray(data7)) {
                                    if (data7.length < 2) {
                                      validate37.errors = [{ instancePath: instancePath + "/curve/" + i0, schemaPath: "#/$defs/PointV1/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                                      return false;
                                    } else {
                                      const len2 = data7.length;
                                      if (len2 > 0) {
                                        let data8 = data7[0];
                                        const _errs19 = errors;
                                        if (!(typeof data8 == "number" && isFinite(data8))) {
                                          validate37.errors = [{ instancePath: instancePath + "/curve/" + i0 + "/0", schemaPath: "#/$defs/PointV1/items/0/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                          return false;
                                        }
                                        var valid3 = _errs19 === errors;
                                      }
                                      if (valid3) {
                                        if (len2 > 1) {
                                          let data9 = data7[1];
                                          const _errs21 = errors;
                                          if (!(typeof data9 == "number" && isFinite(data9))) {
                                            validate37.errors = [{ instancePath: instancePath + "/curve/" + i0 + "/1", schemaPath: "#/$defs/PointV1/items/1/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                            return false;
                                          }
                                          var valid3 = _errs21 === errors;
                                        }
                                      }
                                    }
                                  } else {
                                    validate37.errors = [{ instancePath: instancePath + "/curve/" + i0, schemaPath: "#/$defs/PointV1/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                    return false;
                                  }
                                }
                                var valid1 = _errs16 === errors;
                                if (!valid1) {
                                  break;
                                }
                              }
                            }
                          } else {
                            validate37.errors = [{ instancePath: instancePath + "/curve", schemaPath: "#/properties/curve/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid0 = _errs14 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.geometry !== void 0 && func0.call(data, "geometry")) {
                          let data10 = data.geometry;
                          const _errs23 = errors;
                          if (errors === _errs23) {
                            if (Array.isArray(data10)) {
                              if (data10.length < 1) {
                                validate37.errors = [{ instancePath: instancePath + "/geometry", schemaPath: "#/properties/geometry/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                return false;
                              } else {
                                var valid4 = true;
                                const len3 = data10.length;
                                for (let i1 = 0; i1 < len3; i1++) {
                                  let data11 = data10[i1];
                                  const _errs25 = errors;
                                  const _errs26 = errors;
                                  if (errors === _errs26) {
                                    if (Array.isArray(data11)) {
                                      if (data11.length < 2) {
                                        validate37.errors = [{ instancePath: instancePath + "/geometry/" + i1, schemaPath: "#/$defs/PointV1/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                                        return false;
                                      } else {
                                        const len5 = data11.length;
                                        if (len5 > 0) {
                                          let data12 = data11[0];
                                          const _errs28 = errors;
                                          if (!(typeof data12 == "number" && isFinite(data12))) {
                                            validate37.errors = [{ instancePath: instancePath + "/geometry/" + i1 + "/0", schemaPath: "#/$defs/PointV1/items/0/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                            return false;
                                          }
                                          var valid6 = _errs28 === errors;
                                        }
                                        if (valid6) {
                                          if (len5 > 1) {
                                            let data13 = data11[1];
                                            const _errs30 = errors;
                                            if (!(typeof data13 == "number" && isFinite(data13))) {
                                              validate37.errors = [{ instancePath: instancePath + "/geometry/" + i1 + "/1", schemaPath: "#/$defs/PointV1/items/1/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                            var valid6 = _errs30 === errors;
                                          }
                                        }
                                      }
                                    } else {
                                      validate37.errors = [{ instancePath: instancePath + "/geometry/" + i1, schemaPath: "#/$defs/PointV1/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                      return false;
                                    }
                                  }
                                  var valid4 = _errs25 === errors;
                                  if (!valid4) {
                                    break;
                                  }
                                }
                              }
                            } else {
                              validate37.errors = [{ instancePath: instancePath + "/geometry", schemaPath: "#/properties/geometry/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                              return false;
                            }
                          }
                          var valid0 = _errs23 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.fontSize !== void 0 && func0.call(data, "fontSize")) {
                            let data14 = data.fontSize;
                            const _errs32 = errors;
                            if (!(typeof data14 == "number" && isFinite(data14)) && data14 !== null) {
                              validate37.errors = [{ instancePath: instancePath + "/fontSize", schemaPath: "#/properties/fontSize/type", keyword: "type", params: { type: schema40.properties.fontSize.type }, message: "must be number,null" }];
                              return false;
                            }
                            if (errors === _errs32) {
                              if (typeof data14 == "number" && isFinite(data14)) {
                                if (data14 <= 0 || isNaN(data14)) {
                                  validate37.errors = [{ instancePath: instancePath + "/fontSize", schemaPath: "#/properties/fontSize/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                  return false;
                                }
                              }
                            }
                            var valid0 = _errs32 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.textLength !== void 0 && func0.call(data, "textLength")) {
                              let data15 = data.textLength;
                              const _errs34 = errors;
                              if (!(typeof data15 == "number" && isFinite(data15)) && data15 !== null) {
                                validate37.errors = [{ instancePath: instancePath + "/textLength", schemaPath: "#/properties/textLength/type", keyword: "type", params: { type: schema40.properties.textLength.type }, message: "must be number,null" }];
                                return false;
                              }
                              var valid0 = _errs34 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.angle !== void 0 && func0.call(data, "angle")) {
                                let data16 = data.angle;
                                const _errs36 = errors;
                                if (!(typeof data16 == "number" && isFinite(data16)) && data16 !== null) {
                                  validate37.errors = [{ instancePath: instancePath + "/angle", schemaPath: "#/properties/angle/type", keyword: "type", params: { type: schema40.properties.angle.type }, message: "must be number,null" }];
                                  return false;
                                }
                                var valid0 = _errs36 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.widthScale !== void 0 && func0.call(data, "widthScale")) {
                                  let data17 = data.widthScale;
                                  const _errs38 = errors;
                                  if (!(typeof data17 == "number" && isFinite(data17)) && data17 !== null) {
                                    validate37.errors = [{ instancePath: instancePath + "/widthScale", schemaPath: "#/properties/widthScale/type", keyword: "type", params: { type: schema40.properties.widthScale.type }, message: "must be number,null" }];
                                    return false;
                                  }
                                  var valid0 = _errs38 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.facts !== void 0 && func0.call(data, "facts")) {
                                    let data18 = data.facts;
                                    const _errs40 = errors;
                                    if (errors === _errs40) {
                                      if (Array.isArray(data18)) {
                                        var valid7 = true;
                                        const len6 = data18.length;
                                        for (let i2 = 0; i2 < len6; i2++) {
                                          let data19 = data18[i2];
                                          const _errs42 = errors;
                                          const _errs43 = errors;
                                          if (errors === _errs43) {
                                            if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
                                              let missing1;
                                              if ((data19.label === void 0 || !func0.call(data19, "label")) && (missing1 = "label") || (data19.value === void 0 || !func0.call(data19, "value")) && (missing1 = "value")) {
                                                validate37.errors = [{ instancePath: instancePath + "/facts/" + i2, schemaPath: "#/$defs/ReferenceFactV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                                                return false;
                                              } else {
                                                if (data19.label !== void 0 && func0.call(data19, "label")) {
                                                  let data20 = data19.label;
                                                  const _errs46 = errors;
                                                  if (errors === _errs46) {
                                                    if (typeof data20 === "string") {
                                                      if (func61(data20) < 1) {
                                                        validate37.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                                        return false;
                                                      }
                                                    } else {
                                                      validate37.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                      return false;
                                                    }
                                                  }
                                                  var valid9 = _errs46 === errors;
                                                } else {
                                                  var valid9 = true;
                                                }
                                                if (valid9) {
                                                  if (data19.value !== void 0 && func0.call(data19, "value")) {
                                                    let data21 = data19.value;
                                                    const _errs48 = errors;
                                                    if (typeof data21 !== "string" && !(typeof data21 == "number" && isFinite(data21)) && typeof data21 !== "boolean" && data21 !== null) {
                                                      validate37.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/value", schemaPath: "#/$defs/ReferenceFactV1/properties/value/type", keyword: "type", params: { type: schema15.properties.value.type }, message: "must be string,number,boolean,null" }];
                                                      return false;
                                                    }
                                                    var valid9 = _errs48 === errors;
                                                  } else {
                                                    var valid9 = true;
                                                  }
                                                  if (valid9) {
                                                    if (data19.note !== void 0 && func0.call(data19, "note")) {
                                                      const _errs50 = errors;
                                                      if (typeof data19.note !== "string") {
                                                        validate37.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/note", schemaPath: "#/$defs/ReferenceFactV1/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                        return false;
                                                      }
                                                      var valid9 = _errs50 === errors;
                                                    } else {
                                                      var valid9 = true;
                                                    }
                                                  }
                                                }
                                              }
                                            } else {
                                              validate37.errors = [{ instancePath: instancePath + "/facts/" + i2, schemaPath: "#/$defs/ReferenceFactV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                              return false;
                                            }
                                          }
                                          var valid7 = _errs42 === errors;
                                          if (!valid7) {
                                            break;
                                          }
                                        }
                                      } else {
                                        validate37.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                        return false;
                                      }
                                    }
                                    var valid0 = _errs40 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                  if (valid0) {
                                    if (data.factSections !== void 0 && func0.call(data, "factSections")) {
                                      let data23 = data.factSections;
                                      const _errs52 = errors;
                                      if (errors === _errs52) {
                                        if (Array.isArray(data23)) {
                                          var valid10 = true;
                                          const len7 = data23.length;
                                          for (let i3 = 0; i3 < len7; i3++) {
                                            const _errs54 = errors;
                                            if (!validate15(data23[i3], { instancePath: instancePath + "/factSections/" + i3, parentData: data23, parentDataProperty: i3, rootData })) {
                                              vErrors = vErrors === null ? validate15.errors : vErrors.concat(validate15.errors);
                                              errors = vErrors.length;
                                            }
                                            var valid10 = _errs54 === errors;
                                            if (!valid10) {
                                              break;
                                            }
                                          }
                                        } else {
                                          validate37.errors = [{ instancePath: instancePath + "/factSections", schemaPath: "#/properties/factSections/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                          return false;
                                        }
                                      }
                                      var valid0 = _errs52 === errors;
                                    } else {
                                      var valid0 = true;
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate37.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate37.errors = vErrors;
    return errors === 0;
  }
  var schema44 = { "type": "object", "properties": { "key": { "type": ["string", "number"] }, "id": { "type": ["string", "number"] }, "type": { "type": "string" }, "area": { "type": ["string", "number"] }, "name": { "type": "string" }, "layer": { "type": ["string", "number"] }, "bounds": { "type": "array", "items": { "type": "number" }, "minItems": 4, "maxItems": 4 }, "facts": { "type": "array", "items": { "$ref": "#/$defs/ReferenceFactV1" } }, "factSections": { "type": "array", "items": { "$ref": "#/$defs/FactSectionV1" } } }, "additionalProperties": true };
  function validate39(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.key !== void 0 && func0.call(data, "key")) {
          let data0 = data.key;
          const _errs2 = errors;
          if (typeof data0 !== "string" && !(typeof data0 == "number" && isFinite(data0))) {
            validate39.errors = [{ instancePath: instancePath + "/key", schemaPath: "#/properties/key/type", keyword: "type", params: { type: schema44.properties.key.type }, message: "must be string,number" }];
            return false;
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.id !== void 0 && func0.call(data, "id")) {
            let data1 = data.id;
            const _errs4 = errors;
            if (typeof data1 !== "string" && !(typeof data1 == "number" && isFinite(data1))) {
              validate39.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: schema44.properties.id.type }, message: "must be string,number" }];
              return false;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.type !== void 0 && func0.call(data, "type")) {
              const _errs6 = errors;
              if (typeof data.type !== "string") {
                validate39.errors = [{ instancePath: instancePath + "/type", schemaPath: "#/properties/type/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.area !== void 0 && func0.call(data, "area")) {
                let data3 = data.area;
                const _errs8 = errors;
                if (typeof data3 !== "string" && !(typeof data3 == "number" && isFinite(data3))) {
                  validate39.errors = [{ instancePath: instancePath + "/area", schemaPath: "#/properties/area/type", keyword: "type", params: { type: schema44.properties.area.type }, message: "must be string,number" }];
                  return false;
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.name !== void 0 && func0.call(data, "name")) {
                  const _errs10 = errors;
                  if (typeof data.name !== "string") {
                    validate39.errors = [{ instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                    return false;
                  }
                  var valid0 = _errs10 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.layer !== void 0 && func0.call(data, "layer")) {
                    let data5 = data.layer;
                    const _errs12 = errors;
                    if (typeof data5 !== "string" && !(typeof data5 == "number" && isFinite(data5))) {
                      validate39.errors = [{ instancePath: instancePath + "/layer", schemaPath: "#/properties/layer/type", keyword: "type", params: { type: schema44.properties.layer.type }, message: "must be string,number" }];
                      return false;
                    }
                    var valid0 = _errs12 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.bounds !== void 0 && func0.call(data, "bounds")) {
                      let data6 = data.bounds;
                      const _errs14 = errors;
                      if (errors === _errs14) {
                        if (Array.isArray(data6)) {
                          if (data6.length > 4) {
                            validate39.errors = [{ instancePath: instancePath + "/bounds", schemaPath: "#/properties/bounds/maxItems", keyword: "maxItems", params: { limit: 4 }, message: "must NOT have more than 4 items" }];
                            return false;
                          } else {
                            if (data6.length < 4) {
                              validate39.errors = [{ instancePath: instancePath + "/bounds", schemaPath: "#/properties/bounds/minItems", keyword: "minItems", params: { limit: 4 }, message: "must NOT have fewer than 4 items" }];
                              return false;
                            } else {
                              var valid1 = true;
                              const len0 = data6.length;
                              for (let i0 = 0; i0 < len0; i0++) {
                                let data7 = data6[i0];
                                const _errs16 = errors;
                                if (!(typeof data7 == "number" && isFinite(data7))) {
                                  validate39.errors = [{ instancePath: instancePath + "/bounds/" + i0, schemaPath: "#/properties/bounds/items/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                  return false;
                                }
                                var valid1 = _errs16 === errors;
                                if (!valid1) {
                                  break;
                                }
                              }
                            }
                          }
                        } else {
                          validate39.errors = [{ instancePath: instancePath + "/bounds", schemaPath: "#/properties/bounds/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid0 = _errs14 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.facts !== void 0 && func0.call(data, "facts")) {
                        let data8 = data.facts;
                        const _errs18 = errors;
                        if (errors === _errs18) {
                          if (Array.isArray(data8)) {
                            var valid2 = true;
                            const len1 = data8.length;
                            for (let i1 = 0; i1 < len1; i1++) {
                              let data9 = data8[i1];
                              const _errs20 = errors;
                              const _errs21 = errors;
                              if (errors === _errs21) {
                                if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                                  let missing0;
                                  if ((data9.label === void 0 || !func0.call(data9, "label")) && (missing0 = "label") || (data9.value === void 0 || !func0.call(data9, "value")) && (missing0 = "value")) {
                                    validate39.errors = [{ instancePath: instancePath + "/facts/" + i1, schemaPath: "#/$defs/ReferenceFactV1/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
                                    return false;
                                  } else {
                                    if (data9.label !== void 0 && func0.call(data9, "label")) {
                                      let data10 = data9.label;
                                      const _errs24 = errors;
                                      if (errors === _errs24) {
                                        if (typeof data10 === "string") {
                                          if (func61(data10) < 1) {
                                            validate39.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                            return false;
                                          }
                                        } else {
                                          validate39.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                          return false;
                                        }
                                      }
                                      var valid4 = _errs24 === errors;
                                    } else {
                                      var valid4 = true;
                                    }
                                    if (valid4) {
                                      if (data9.value !== void 0 && func0.call(data9, "value")) {
                                        let data11 = data9.value;
                                        const _errs26 = errors;
                                        if (typeof data11 !== "string" && !(typeof data11 == "number" && isFinite(data11)) && typeof data11 !== "boolean" && data11 !== null) {
                                          validate39.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/value", schemaPath: "#/$defs/ReferenceFactV1/properties/value/type", keyword: "type", params: { type: schema15.properties.value.type }, message: "must be string,number,boolean,null" }];
                                          return false;
                                        }
                                        var valid4 = _errs26 === errors;
                                      } else {
                                        var valid4 = true;
                                      }
                                      if (valid4) {
                                        if (data9.note !== void 0 && func0.call(data9, "note")) {
                                          const _errs28 = errors;
                                          if (typeof data9.note !== "string") {
                                            validate39.errors = [{ instancePath: instancePath + "/facts/" + i1 + "/note", schemaPath: "#/$defs/ReferenceFactV1/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                          var valid4 = _errs28 === errors;
                                        } else {
                                          var valid4 = true;
                                        }
                                      }
                                    }
                                  }
                                } else {
                                  validate39.errors = [{ instancePath: instancePath + "/facts/" + i1, schemaPath: "#/$defs/ReferenceFactV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                  return false;
                                }
                              }
                              var valid2 = _errs20 === errors;
                              if (!valid2) {
                                break;
                              }
                            }
                          } else {
                            validate39.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid0 = _errs18 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.factSections !== void 0 && func0.call(data, "factSections")) {
                          let data13 = data.factSections;
                          const _errs30 = errors;
                          if (errors === _errs30) {
                            if (Array.isArray(data13)) {
                              var valid5 = true;
                              const len2 = data13.length;
                              for (let i2 = 0; i2 < len2; i2++) {
                                const _errs32 = errors;
                                if (!validate15(data13[i2], { instancePath: instancePath + "/factSections/" + i2, parentData: data13, parentDataProperty: i2, rootData })) {
                                  vErrors = vErrors === null ? validate15.errors : vErrors.concat(validate15.errors);
                                  errors = vErrors.length;
                                }
                                var valid5 = _errs32 === errors;
                                if (!valid5) {
                                  break;
                                }
                              }
                            } else {
                              validate39.errors = [{ instancePath: instancePath + "/factSections", schemaPath: "#/properties/factSections/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                              return false;
                            }
                          }
                          var valid0 = _errs30 === errors;
                        } else {
                          var valid0 = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate39.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate39.errors = vErrors;
    return errors === 0;
  }
  var TransientLocationSetV1 = validate45;
  function validate45(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.streets !== void 0 && func0.call(data, "streets")) {
          let data0 = data.streets;
          const _errs2 = errors;
          if (errors === _errs2) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs4 = errors;
                if (!validate37(data0[i0], { instancePath: instancePath + "/streets/" + i0, parentData: data0, parentDataProperty: i0, rootData })) {
                  vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
                  errors = vErrors.length;
                }
                var valid1 = _errs4 === errors;
                if (!valid1) {
                  break;
                }
              }
            } else {
              validate45.errors = [{ instancePath: instancePath + "/streets", schemaPath: "#/properties/streets/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
              return false;
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.districts !== void 0 && func0.call(data, "districts")) {
            let data2 = data.districts;
            const _errs5 = errors;
            if (errors === _errs5) {
              if (Array.isArray(data2)) {
                var valid2 = true;
                const len1 = data2.length;
                for (let i1 = 0; i1 < len1; i1++) {
                  const _errs7 = errors;
                  if (!validate37(data2[i1], { instancePath: instancePath + "/districts/" + i1, parentData: data2, parentDataProperty: i1, rootData })) {
                    vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
                    errors = vErrors.length;
                  }
                  var valid2 = _errs7 === errors;
                  if (!valid2) {
                    break;
                  }
                }
              } else {
                validate45.errors = [{ instancePath: instancePath + "/districts", schemaPath: "#/properties/districts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs5 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.locations !== void 0 && func0.call(data, "locations")) {
              let data4 = data.locations;
              const _errs8 = errors;
              if (errors === _errs8) {
                if (Array.isArray(data4)) {
                  var valid3 = true;
                  const len2 = data4.length;
                  for (let i2 = 0; i2 < len2; i2++) {
                    const _errs10 = errors;
                    if (!validate39(data4[i2], { instancePath: instancePath + "/locations/" + i2, parentData: data4, parentDataProperty: i2, rootData })) {
                      vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
                      errors = vErrors.length;
                    }
                    var valid3 = _errs10 === errors;
                    if (!valid3) {
                      break;
                    }
                  }
                } else {
                  validate45.errors = [{ instancePath: instancePath + "/locations", schemaPath: "#/properties/locations/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs8 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      } else {
        validate45.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate45.errors = vErrors;
    return errors === 0;
  }
  var schema48 = { "type": "object", "properties": { "from": { "type": "array", "items": [{ "type": ["string", "number"] }, { "type": "number" }, { "type": "number" }], "minItems": 3, "additionalItems": true }, "to": { "type": "array", "items": [{ "type": ["string", "number"] }, { "type": "number" }, { "type": "number" }], "minItems": 3, "additionalItems": true }, "via": { "type": "array", "items": { "$ref": "#/$defs/PointV1" } } }, "required": ["from", "to"], "additionalProperties": true };
  function validate49(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.from === void 0 || !func0.call(data, "from")) && (missing0 = "from") || (data.to === void 0 || !func0.call(data, "to")) && (missing0 = "to")) {
          validate49.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.from !== void 0 && func0.call(data, "from")) {
            let data0 = data.from;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                if (data0.length < 3) {
                  validate49.errors = [{ instancePath: instancePath + "/from", schemaPath: "#/properties/from/minItems", keyword: "minItems", params: { limit: 3 }, message: "must NOT have fewer than 3 items" }];
                  return false;
                } else {
                  const len1 = data0.length;
                  if (len1 > 0) {
                    let data1 = data0[0];
                    const _errs4 = errors;
                    if (typeof data1 !== "string" && !(typeof data1 == "number" && isFinite(data1))) {
                      validate49.errors = [{ instancePath: instancePath + "/from/0", schemaPath: "#/properties/from/items/0/type", keyword: "type", params: { type: schema48.properties.from.items[0].type }, message: "must be string,number" }];
                      return false;
                    }
                    var valid1 = _errs4 === errors;
                  }
                  if (valid1) {
                    if (len1 > 1) {
                      let data2 = data0[1];
                      const _errs6 = errors;
                      if (!(typeof data2 == "number" && isFinite(data2))) {
                        validate49.errors = [{ instancePath: instancePath + "/from/1", schemaPath: "#/properties/from/items/1/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                        return false;
                      }
                      var valid1 = _errs6 === errors;
                    }
                    if (valid1) {
                      if (len1 > 2) {
                        let data3 = data0[2];
                        const _errs8 = errors;
                        if (!(typeof data3 == "number" && isFinite(data3))) {
                          validate49.errors = [{ instancePath: instancePath + "/from/2", schemaPath: "#/properties/from/items/2/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                          return false;
                        }
                        var valid1 = _errs8 === errors;
                      }
                    }
                  }
                }
              } else {
                validate49.errors = [{ instancePath: instancePath + "/from", schemaPath: "#/properties/from/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.to !== void 0 && func0.call(data, "to")) {
              let data4 = data.to;
              const _errs10 = errors;
              if (errors === _errs10) {
                if (Array.isArray(data4)) {
                  if (data4.length < 3) {
                    validate49.errors = [{ instancePath: instancePath + "/to", schemaPath: "#/properties/to/minItems", keyword: "minItems", params: { limit: 3 }, message: "must NOT have fewer than 3 items" }];
                    return false;
                  } else {
                    const len3 = data4.length;
                    if (len3 > 0) {
                      let data5 = data4[0];
                      const _errs12 = errors;
                      if (typeof data5 !== "string" && !(typeof data5 == "number" && isFinite(data5))) {
                        validate49.errors = [{ instancePath: instancePath + "/to/0", schemaPath: "#/properties/to/items/0/type", keyword: "type", params: { type: schema48.properties.to.items[0].type }, message: "must be string,number" }];
                        return false;
                      }
                      var valid2 = _errs12 === errors;
                    }
                    if (valid2) {
                      if (len3 > 1) {
                        let data6 = data4[1];
                        const _errs14 = errors;
                        if (!(typeof data6 == "number" && isFinite(data6))) {
                          validate49.errors = [{ instancePath: instancePath + "/to/1", schemaPath: "#/properties/to/items/1/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                          return false;
                        }
                        var valid2 = _errs14 === errors;
                      }
                      if (valid2) {
                        if (len3 > 2) {
                          let data7 = data4[2];
                          const _errs16 = errors;
                          if (!(typeof data7 == "number" && isFinite(data7))) {
                            validate49.errors = [{ instancePath: instancePath + "/to/2", schemaPath: "#/properties/to/items/2/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                            return false;
                          }
                          var valid2 = _errs16 === errors;
                        }
                      }
                    }
                  }
                } else {
                  validate49.errors = [{ instancePath: instancePath + "/to", schemaPath: "#/properties/to/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs10 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.via !== void 0 && func0.call(data, "via")) {
                let data8 = data.via;
                const _errs18 = errors;
                if (errors === _errs18) {
                  if (Array.isArray(data8)) {
                    var valid3 = true;
                    const len4 = data8.length;
                    for (let i0 = 0; i0 < len4; i0++) {
                      let data9 = data8[i0];
                      const _errs20 = errors;
                      const _errs21 = errors;
                      if (errors === _errs21) {
                        if (Array.isArray(data9)) {
                          if (data9.length < 2) {
                            validate49.errors = [{ instancePath: instancePath + "/via/" + i0, schemaPath: "#/$defs/PointV1/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                            return false;
                          } else {
                            const len6 = data9.length;
                            if (len6 > 0) {
                              let data10 = data9[0];
                              const _errs23 = errors;
                              if (!(typeof data10 == "number" && isFinite(data10))) {
                                validate49.errors = [{ instancePath: instancePath + "/via/" + i0 + "/0", schemaPath: "#/$defs/PointV1/items/0/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                return false;
                              }
                              var valid5 = _errs23 === errors;
                            }
                            if (valid5) {
                              if (len6 > 1) {
                                let data11 = data9[1];
                                const _errs25 = errors;
                                if (!(typeof data11 == "number" && isFinite(data11))) {
                                  validate49.errors = [{ instancePath: instancePath + "/via/" + i0 + "/1", schemaPath: "#/$defs/PointV1/items/1/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                  return false;
                                }
                                var valid5 = _errs25 === errors;
                              }
                            }
                          }
                        } else {
                          validate49.errors = [{ instancePath: instancePath + "/via/" + i0, schemaPath: "#/$defs/PointV1/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid3 = _errs20 === errors;
                      if (!valid3) {
                        break;
                      }
                    }
                  } else {
                    validate49.errors = [{ instancePath: instancePath + "/via", schemaPath: "#/properties/via/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs18 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      } else {
        validate49.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate49.errors = vErrors;
    return errors === 0;
  }
  var SceneV1 = validate50;
  var schema50 = { "type": "object", "properties": { "version": { "const": 1 }, "world": { "$ref": "#/$defs/WorldV1" }, "tiles": { "type": ["array", "null"], "items": { "$ref": "#/$defs/SceneAreaV1" } }, "streets": { "type": "array", "items": { "$ref": "#/$defs/LabelV1" } }, "districts": { "type": "array", "items": { "$ref": "#/$defs/LabelV1" } }, "locations": { "type": "array", "items": { "$ref": "#/$defs/LocationMetadataV1" } }, "routes": { "type": ["array", "null"], "items": { "$ref": "#/$defs/RouteV1" } }, "panels": { "type": ["array", "null"], "items": { "$ref": "#/$defs/PanelV1" } }, "overviewImages": { "type": ["array", "null"], "items": { "type": "object", "properties": { "source": { "type": "string", "minLength": 1 }, "width": { "type": "number", "exclusiveMinimum": 0 }, "height": { "type": "number", "exclusiveMinimum": 0 } }, "additionalProperties": true } }, "config": { "type": ["object", "null"], "properties": { "mapLabelScale": { "type": ["number", "null"] }, "mapLabelFontSize": { "type": ["number", "null"], "exclusiveMinimum": 0 }, "maxScale": { "type": ["number", "null"], "exclusiveMinimum": 0 } }, "additionalProperties": true } }, "required": ["world"], "additionalProperties": true };
  function validate50(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.world === void 0 || !func0.call(data, "world")) && (missing0 = "world")) {
          validate50.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.version !== void 0 && func0.call(data, "version")) {
            const _errs2 = errors;
            if (1 !== data.version) {
              validate50.errors = [{ instancePath: instancePath + "/version", schemaPath: "#/properties/version/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.world !== void 0 && func0.call(data, "world")) {
              let data1 = data.world;
              const _errs3 = errors;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                  let missing1;
                  if ((data1.width === void 0 || !func0.call(data1, "width")) && (missing1 = "width") || (data1.height === void 0 || !func0.call(data1, "height")) && (missing1 = "height")) {
                    validate50.errors = [{ instancePath: instancePath + "/world", schemaPath: "#/$defs/WorldV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                    return false;
                  } else {
                    if (data1.width !== void 0 && func0.call(data1, "width")) {
                      let data2 = data1.width;
                      const _errs7 = errors;
                      if (errors === _errs7) {
                        if (typeof data2 == "number" && isFinite(data2)) {
                          if (data2 <= 0 || isNaN(data2)) {
                            validate50.errors = [{ instancePath: instancePath + "/world/width", schemaPath: "#/$defs/WorldV1/properties/width/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                            return false;
                          }
                        } else {
                          validate50.errors = [{ instancePath: instancePath + "/world/width", schemaPath: "#/$defs/WorldV1/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                          return false;
                        }
                      }
                      var valid2 = _errs7 === errors;
                    } else {
                      var valid2 = true;
                    }
                    if (valid2) {
                      if (data1.height !== void 0 && func0.call(data1, "height")) {
                        let data3 = data1.height;
                        const _errs9 = errors;
                        if (errors === _errs9) {
                          if (typeof data3 == "number" && isFinite(data3)) {
                            if (data3 <= 0 || isNaN(data3)) {
                              validate50.errors = [{ instancePath: instancePath + "/world/height", schemaPath: "#/$defs/WorldV1/properties/height/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                              return false;
                            }
                          } else {
                            validate50.errors = [{ instancePath: instancePath + "/world/height", schemaPath: "#/$defs/WorldV1/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                            return false;
                          }
                        }
                        var valid2 = _errs9 === errors;
                      } else {
                        var valid2 = true;
                      }
                    }
                  }
                } else {
                  validate50.errors = [{ instancePath: instancePath + "/world", schemaPath: "#/$defs/WorldV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.tiles !== void 0 && func0.call(data, "tiles")) {
                let data4 = data.tiles;
                const _errs11 = errors;
                if (!Array.isArray(data4) && data4 !== null) {
                  validate50.errors = [{ instancePath: instancePath + "/tiles", schemaPath: "#/properties/tiles/type", keyword: "type", params: { type: schema50.properties.tiles.type }, message: "must be array,null" }];
                  return false;
                }
                if (errors === _errs11) {
                  if (Array.isArray(data4)) {
                    var valid3 = true;
                    const len0 = data4.length;
                    for (let i0 = 0; i0 < len0; i0++) {
                      const _errs13 = errors;
                      if (!validate24(data4[i0], { instancePath: instancePath + "/tiles/" + i0, parentData: data4, parentDataProperty: i0, rootData })) {
                        vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
                        errors = vErrors.length;
                      }
                      var valid3 = _errs13 === errors;
                      if (!valid3) {
                        break;
                      }
                    }
                  }
                }
                var valid0 = _errs11 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.streets !== void 0 && func0.call(data, "streets")) {
                  let data6 = data.streets;
                  const _errs14 = errors;
                  if (errors === _errs14) {
                    if (Array.isArray(data6)) {
                      var valid4 = true;
                      const len1 = data6.length;
                      for (let i1 = 0; i1 < len1; i1++) {
                        const _errs16 = errors;
                        if (!validate37(data6[i1], { instancePath: instancePath + "/streets/" + i1, parentData: data6, parentDataProperty: i1, rootData })) {
                          vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
                          errors = vErrors.length;
                        }
                        var valid4 = _errs16 === errors;
                        if (!valid4) {
                          break;
                        }
                      }
                    } else {
                      validate50.errors = [{ instancePath: instancePath + "/streets", schemaPath: "#/properties/streets/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs14 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.districts !== void 0 && func0.call(data, "districts")) {
                    let data8 = data.districts;
                    const _errs17 = errors;
                    if (errors === _errs17) {
                      if (Array.isArray(data8)) {
                        var valid5 = true;
                        const len2 = data8.length;
                        for (let i2 = 0; i2 < len2; i2++) {
                          const _errs19 = errors;
                          if (!validate37(data8[i2], { instancePath: instancePath + "/districts/" + i2, parentData: data8, parentDataProperty: i2, rootData })) {
                            vErrors = vErrors === null ? validate37.errors : vErrors.concat(validate37.errors);
                            errors = vErrors.length;
                          }
                          var valid5 = _errs19 === errors;
                          if (!valid5) {
                            break;
                          }
                        }
                      } else {
                        validate50.errors = [{ instancePath: instancePath + "/districts", schemaPath: "#/properties/districts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                        return false;
                      }
                    }
                    var valid0 = _errs17 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.locations !== void 0 && func0.call(data, "locations")) {
                      let data10 = data.locations;
                      const _errs20 = errors;
                      if (errors === _errs20) {
                        if (Array.isArray(data10)) {
                          var valid6 = true;
                          const len3 = data10.length;
                          for (let i3 = 0; i3 < len3; i3++) {
                            const _errs22 = errors;
                            if (!validate39(data10[i3], { instancePath: instancePath + "/locations/" + i3, parentData: data10, parentDataProperty: i3, rootData })) {
                              vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
                              errors = vErrors.length;
                            }
                            var valid6 = _errs22 === errors;
                            if (!valid6) {
                              break;
                            }
                          }
                        } else {
                          validate50.errors = [{ instancePath: instancePath + "/locations", schemaPath: "#/properties/locations/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid0 = _errs20 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.routes !== void 0 && func0.call(data, "routes")) {
                        let data12 = data.routes;
                        const _errs23 = errors;
                        if (!Array.isArray(data12) && data12 !== null) {
                          validate50.errors = [{ instancePath: instancePath + "/routes", schemaPath: "#/properties/routes/type", keyword: "type", params: { type: schema50.properties.routes.type }, message: "must be array,null" }];
                          return false;
                        }
                        if (errors === _errs23) {
                          if (Array.isArray(data12)) {
                            var valid7 = true;
                            const len4 = data12.length;
                            for (let i4 = 0; i4 < len4; i4++) {
                              const _errs25 = errors;
                              if (!validate49(data12[i4], { instancePath: instancePath + "/routes/" + i4, parentData: data12, parentDataProperty: i4, rootData })) {
                                vErrors = vErrors === null ? validate49.errors : vErrors.concat(validate49.errors);
                                errors = vErrors.length;
                              }
                              var valid7 = _errs25 === errors;
                              if (!valid7) {
                                break;
                              }
                            }
                          }
                        }
                        var valid0 = _errs23 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.panels !== void 0 && func0.call(data, "panels")) {
                          let data14 = data.panels;
                          const _errs26 = errors;
                          if (!Array.isArray(data14) && data14 !== null) {
                            validate50.errors = [{ instancePath: instancePath + "/panels", schemaPath: "#/properties/panels/type", keyword: "type", params: { type: schema50.properties.panels.type }, message: "must be array,null" }];
                            return false;
                          }
                          if (errors === _errs26) {
                            if (Array.isArray(data14)) {
                              var valid8 = true;
                              const len5 = data14.length;
                              for (let i5 = 0; i5 < len5; i5++) {
                                let data15 = data14[i5];
                                const _errs28 = errors;
                                const _errs29 = errors;
                                if (errors === _errs29) {
                                  if (data15 && typeof data15 == "object" && !Array.isArray(data15)) {
                                    let missing2;
                                    if ((data15.x === void 0 || !func0.call(data15, "x")) && (missing2 = "x") || (data15.y === void 0 || !func0.call(data15, "y")) && (missing2 = "y") || (data15.w === void 0 || !func0.call(data15, "w")) && (missing2 = "w") || (data15.h === void 0 || !func0.call(data15, "h")) && (missing2 = "h")) {
                                      validate50.errors = [{ instancePath: instancePath + "/panels/" + i5, schemaPath: "#/$defs/PanelV1/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                                      return false;
                                    } else {
                                      if (data15.x !== void 0 && func0.call(data15, "x")) {
                                        let data16 = data15.x;
                                        const _errs32 = errors;
                                        if (!(typeof data16 == "number" && isFinite(data16))) {
                                          validate50.errors = [{ instancePath: instancePath + "/panels/" + i5 + "/x", schemaPath: "#/$defs/PanelV1/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                          return false;
                                        }
                                        var valid10 = _errs32 === errors;
                                      } else {
                                        var valid10 = true;
                                      }
                                      if (valid10) {
                                        if (data15.y !== void 0 && func0.call(data15, "y")) {
                                          let data17 = data15.y;
                                          const _errs34 = errors;
                                          if (!(typeof data17 == "number" && isFinite(data17))) {
                                            validate50.errors = [{ instancePath: instancePath + "/panels/" + i5 + "/y", schemaPath: "#/$defs/PanelV1/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                            return false;
                                          }
                                          var valid10 = _errs34 === errors;
                                        } else {
                                          var valid10 = true;
                                        }
                                        if (valid10) {
                                          if (data15.w !== void 0 && func0.call(data15, "w")) {
                                            let data18 = data15.w;
                                            const _errs36 = errors;
                                            if (errors === _errs36) {
                                              if (typeof data18 == "number" && isFinite(data18)) {
                                                if (data18 <= 0 || isNaN(data18)) {
                                                  validate50.errors = [{ instancePath: instancePath + "/panels/" + i5 + "/w", schemaPath: "#/$defs/PanelV1/properties/w/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                                  return false;
                                                }
                                              } else {
                                                validate50.errors = [{ instancePath: instancePath + "/panels/" + i5 + "/w", schemaPath: "#/$defs/PanelV1/properties/w/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                                return false;
                                              }
                                            }
                                            var valid10 = _errs36 === errors;
                                          } else {
                                            var valid10 = true;
                                          }
                                          if (valid10) {
                                            if (data15.h !== void 0 && func0.call(data15, "h")) {
                                              let data19 = data15.h;
                                              const _errs38 = errors;
                                              if (errors === _errs38) {
                                                if (typeof data19 == "number" && isFinite(data19)) {
                                                  if (data19 <= 0 || isNaN(data19)) {
                                                    validate50.errors = [{ instancePath: instancePath + "/panels/" + i5 + "/h", schemaPath: "#/$defs/PanelV1/properties/h/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                                    return false;
                                                  }
                                                } else {
                                                  validate50.errors = [{ instancePath: instancePath + "/panels/" + i5 + "/h", schemaPath: "#/$defs/PanelV1/properties/h/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                                  return false;
                                                }
                                              }
                                              var valid10 = _errs38 === errors;
                                            } else {
                                              var valid10 = true;
                                            }
                                            if (valid10) {
                                              if (data15.label !== void 0 && func0.call(data15, "label")) {
                                                const _errs40 = errors;
                                                if (typeof data15.label !== "string") {
                                                  validate50.errors = [{ instancePath: instancePath + "/panels/" + i5 + "/label", schemaPath: "#/$defs/PanelV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                  return false;
                                                }
                                                var valid10 = _errs40 === errors;
                                              } else {
                                                var valid10 = true;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  } else {
                                    validate50.errors = [{ instancePath: instancePath + "/panels/" + i5, schemaPath: "#/$defs/PanelV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                    return false;
                                  }
                                }
                                var valid8 = _errs28 === errors;
                                if (!valid8) {
                                  break;
                                }
                              }
                            }
                          }
                          var valid0 = _errs26 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.overviewImages !== void 0 && func0.call(data, "overviewImages")) {
                            let data21 = data.overviewImages;
                            const _errs42 = errors;
                            if (!Array.isArray(data21) && data21 !== null) {
                              validate50.errors = [{ instancePath: instancePath + "/overviewImages", schemaPath: "#/properties/overviewImages/type", keyword: "type", params: { type: schema50.properties.overviewImages.type }, message: "must be array,null" }];
                              return false;
                            }
                            if (errors === _errs42) {
                              if (Array.isArray(data21)) {
                                var valid11 = true;
                                const len6 = data21.length;
                                for (let i6 = 0; i6 < len6; i6++) {
                                  let data22 = data21[i6];
                                  const _errs44 = errors;
                                  if (errors === _errs44) {
                                    if (data22 && typeof data22 == "object" && !Array.isArray(data22)) {
                                      if (data22.source !== void 0 && func0.call(data22, "source")) {
                                        let data23 = data22.source;
                                        const _errs47 = errors;
                                        if (errors === _errs47) {
                                          if (typeof data23 === "string") {
                                            if (func61(data23) < 1) {
                                              validate50.errors = [{ instancePath: instancePath + "/overviewImages/" + i6 + "/source", schemaPath: "#/properties/overviewImages/items/properties/source/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                              return false;
                                            }
                                          } else {
                                            validate50.errors = [{ instancePath: instancePath + "/overviewImages/" + i6 + "/source", schemaPath: "#/properties/overviewImages/items/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                        }
                                        var valid12 = _errs47 === errors;
                                      } else {
                                        var valid12 = true;
                                      }
                                      if (valid12) {
                                        if (data22.width !== void 0 && func0.call(data22, "width")) {
                                          let data24 = data22.width;
                                          const _errs49 = errors;
                                          if (errors === _errs49) {
                                            if (typeof data24 == "number" && isFinite(data24)) {
                                              if (data24 <= 0 || isNaN(data24)) {
                                                validate50.errors = [{ instancePath: instancePath + "/overviewImages/" + i6 + "/width", schemaPath: "#/properties/overviewImages/items/properties/width/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                                return false;
                                              }
                                            } else {
                                              validate50.errors = [{ instancePath: instancePath + "/overviewImages/" + i6 + "/width", schemaPath: "#/properties/overviewImages/items/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                          }
                                          var valid12 = _errs49 === errors;
                                        } else {
                                          var valid12 = true;
                                        }
                                        if (valid12) {
                                          if (data22.height !== void 0 && func0.call(data22, "height")) {
                                            let data25 = data22.height;
                                            const _errs51 = errors;
                                            if (errors === _errs51) {
                                              if (typeof data25 == "number" && isFinite(data25)) {
                                                if (data25 <= 0 || isNaN(data25)) {
                                                  validate50.errors = [{ instancePath: instancePath + "/overviewImages/" + i6 + "/height", schemaPath: "#/properties/overviewImages/items/properties/height/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                                  return false;
                                                }
                                              } else {
                                                validate50.errors = [{ instancePath: instancePath + "/overviewImages/" + i6 + "/height", schemaPath: "#/properties/overviewImages/items/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                                return false;
                                              }
                                            }
                                            var valid12 = _errs51 === errors;
                                          } else {
                                            var valid12 = true;
                                          }
                                        }
                                      }
                                    } else {
                                      validate50.errors = [{ instancePath: instancePath + "/overviewImages/" + i6, schemaPath: "#/properties/overviewImages/items/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                      return false;
                                    }
                                  }
                                  var valid11 = _errs44 === errors;
                                  if (!valid11) {
                                    break;
                                  }
                                }
                              }
                            }
                            var valid0 = _errs42 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.config !== void 0 && func0.call(data, "config")) {
                              let data26 = data.config;
                              const _errs53 = errors;
                              if (!(data26 && typeof data26 == "object" && !Array.isArray(data26)) && data26 !== null) {
                                validate50.errors = [{ instancePath: instancePath + "/config", schemaPath: "#/properties/config/type", keyword: "type", params: { type: schema50.properties.config.type }, message: "must be object,null" }];
                                return false;
                              }
                              if (errors === _errs53) {
                                if (data26 && typeof data26 == "object" && !Array.isArray(data26)) {
                                  if (data26.mapLabelScale !== void 0 && func0.call(data26, "mapLabelScale")) {
                                    let data27 = data26.mapLabelScale;
                                    const _errs56 = errors;
                                    if (!(typeof data27 == "number" && isFinite(data27)) && data27 !== null) {
                                      validate50.errors = [{ instancePath: instancePath + "/config/mapLabelScale", schemaPath: "#/properties/config/properties/mapLabelScale/type", keyword: "type", params: { type: schema50.properties.config.properties.mapLabelScale.type }, message: "must be number,null" }];
                                      return false;
                                    }
                                    var valid13 = _errs56 === errors;
                                  } else {
                                    var valid13 = true;
                                  }
                                  if (valid13) {
                                    if (data26.mapLabelFontSize !== void 0 && func0.call(data26, "mapLabelFontSize")) {
                                      let data28 = data26.mapLabelFontSize;
                                      const _errs58 = errors;
                                      if (!(typeof data28 == "number" && isFinite(data28)) && data28 !== null) {
                                        validate50.errors = [{ instancePath: instancePath + "/config/mapLabelFontSize", schemaPath: "#/properties/config/properties/mapLabelFontSize/type", keyword: "type", params: { type: schema50.properties.config.properties.mapLabelFontSize.type }, message: "must be number,null" }];
                                        return false;
                                      }
                                      if (errors === _errs58) {
                                        if (typeof data28 == "number" && isFinite(data28)) {
                                          if (data28 <= 0 || isNaN(data28)) {
                                            validate50.errors = [{ instancePath: instancePath + "/config/mapLabelFontSize", schemaPath: "#/properties/config/properties/mapLabelFontSize/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                            return false;
                                          }
                                        }
                                      }
                                      var valid13 = _errs58 === errors;
                                    } else {
                                      var valid13 = true;
                                    }
                                    if (valid13) {
                                      if (data26.maxScale !== void 0 && func0.call(data26, "maxScale")) {
                                        let data29 = data26.maxScale;
                                        const _errs60 = errors;
                                        if (!(typeof data29 == "number" && isFinite(data29)) && data29 !== null) {
                                          validate50.errors = [{ instancePath: instancePath + "/config/maxScale", schemaPath: "#/properties/config/properties/maxScale/type", keyword: "type", params: { type: schema50.properties.config.properties.maxScale.type }, message: "must be number,null" }];
                                          return false;
                                        }
                                        if (errors === _errs60) {
                                          if (typeof data29 == "number" && isFinite(data29)) {
                                            if (data29 <= 0 || isNaN(data29)) {
                                              validate50.errors = [{ instancePath: instancePath + "/config/maxScale", schemaPath: "#/properties/config/properties/maxScale/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                              return false;
                                            }
                                          }
                                        }
                                        var valid13 = _errs60 === errors;
                                      } else {
                                        var valid13 = true;
                                      }
                                    }
                                  }
                                }
                              }
                              var valid0 = _errs53 === errors;
                            } else {
                              var valid0 = true;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate50.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate50.errors = vErrors;
    return errors === 0;
  }
  var pattern0 = new RegExp("\\S", "u");
  var MapPayloadV1 = validate63;
  function validate63(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.world === void 0 || !func0.call(data, "world")) && (missing0 = "world") || (data.tiles === void 0 || !func0.call(data, "tiles")) && (missing0 = "tiles") || (data.scene === void 0 || !func0.call(data, "scene")) && (missing0 = "scene") || (data.places === void 0 || !func0.call(data, "places")) && (missing0 = "places") || (data.quests === void 0 || !func0.call(data, "quests")) && (missing0 = "quests") || (data.config === void 0 || !func0.call(data, "config")) && (missing0 = "config") || (data.objectives === void 0 || !func0.call(data, "objectives")) && (missing0 = "objectives") || (data.placeTypes === void 0 || !func0.call(data, "placeTypes")) && (missing0 = "placeTypes") || (data.questTypes === void 0 || !func0.call(data, "questTypes")) && (missing0 = "questTypes")) {
          validate63.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.world !== void 0 && func0.call(data, "world")) {
            let data0 = data.world;
            const _errs2 = errors;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
                let missing1;
                if ((data0.width === void 0 || !func0.call(data0, "width")) && (missing1 = "width") || (data0.height === void 0 || !func0.call(data0, "height")) && (missing1 = "height")) {
                  validate63.errors = [{ instancePath: instancePath + "/world", schemaPath: "#/$defs/WorldV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                  return false;
                } else {
                  if (data0.width !== void 0 && func0.call(data0, "width")) {
                    let data1 = data0.width;
                    const _errs6 = errors;
                    if (errors === _errs6) {
                      if (typeof data1 == "number" && isFinite(data1)) {
                        if (data1 <= 0 || isNaN(data1)) {
                          validate63.errors = [{ instancePath: instancePath + "/world/width", schemaPath: "#/$defs/WorldV1/properties/width/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                          return false;
                        }
                      } else {
                        validate63.errors = [{ instancePath: instancePath + "/world/width", schemaPath: "#/$defs/WorldV1/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                        return false;
                      }
                    }
                    var valid2 = _errs6 === errors;
                  } else {
                    var valid2 = true;
                  }
                  if (valid2) {
                    if (data0.height !== void 0 && func0.call(data0, "height")) {
                      let data2 = data0.height;
                      const _errs8 = errors;
                      if (errors === _errs8) {
                        if (typeof data2 == "number" && isFinite(data2)) {
                          if (data2 <= 0 || isNaN(data2)) {
                            validate63.errors = [{ instancePath: instancePath + "/world/height", schemaPath: "#/$defs/WorldV1/properties/height/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                            return false;
                          }
                        } else {
                          validate63.errors = [{ instancePath: instancePath + "/world/height", schemaPath: "#/$defs/WorldV1/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                          return false;
                        }
                      }
                      var valid2 = _errs8 === errors;
                    } else {
                      var valid2 = true;
                    }
                  }
                }
              } else {
                validate63.errors = [{ instancePath: instancePath + "/world", schemaPath: "#/$defs/WorldV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.tiles !== void 0 && func0.call(data, "tiles")) {
              let data3 = data.tiles;
              const _errs10 = errors;
              if (errors === _errs10) {
                if (Array.isArray(data3)) {
                  if (data3.length < 1) {
                    validate63.errors = [{ instancePath: instancePath + "/tiles", schemaPath: "#/properties/tiles/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                    return false;
                  } else {
                    var valid3 = true;
                    const len0 = data3.length;
                    for (let i0 = 0; i0 < len0; i0++) {
                      const _errs12 = errors;
                      if (!validate22(data3[i0], { instancePath: instancePath + "/tiles/" + i0, parentData: data3, parentDataProperty: i0, rootData })) {
                        vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
                        errors = vErrors.length;
                      }
                      var valid3 = _errs12 === errors;
                      if (!valid3) {
                        break;
                      }
                    }
                  }
                } else {
                  validate63.errors = [{ instancePath: instancePath + "/tiles", schemaPath: "#/properties/tiles/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs10 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.scene !== void 0 && func0.call(data, "scene")) {
                let data5 = data.scene;
                const _errs13 = errors;
                const _errs14 = errors;
                if (!validate50(data5, { instancePath: instancePath + "/scene", parentData: data, parentDataProperty: "scene", rootData })) {
                  vErrors = vErrors === null ? validate50.errors : vErrors.concat(validate50.errors);
                  errors = vErrors.length;
                }
                var valid4 = _errs14 === errors;
                if (valid4) {
                  const _errs15 = errors;
                  if (errors === _errs15) {
                    if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                      let missing2;
                      if ((data5.version === void 0 || !func0.call(data5, "version")) && (missing2 = "version") || (data5.tiles === void 0 || !func0.call(data5, "tiles")) && (missing2 = "tiles")) {
                        validate63.errors = [{ instancePath: instancePath + "/scene", schemaPath: "#/properties/scene/allOf/1/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                        return false;
                      } else {
                        if (data5.tiles !== void 0 && func0.call(data5, "tiles")) {
                          if (!Array.isArray(data5.tiles)) {
                            validate63.errors = [{ instancePath: instancePath + "/scene/tiles", schemaPath: "#/properties/scene/allOf/1/properties/tiles/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                      }
                    } else {
                      validate63.errors = [{ instancePath: instancePath + "/scene", schemaPath: "#/properties/scene/allOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                  var valid4 = _errs15 === errors;
                }
                var valid0 = _errs13 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.places !== void 0 && func0.call(data, "places")) {
                  let data7 = data.places;
                  const _errs20 = errors;
                  if (errors === _errs20) {
                    if (Array.isArray(data7)) {
                      var valid6 = true;
                      const len1 = data7.length;
                      for (let i1 = 0; i1 < len1; i1++) {
                        const _errs22 = errors;
                        if (!validate32(data7[i1], { instancePath: instancePath + "/places/" + i1, parentData: data7, parentDataProperty: i1, rootData })) {
                          vErrors = vErrors === null ? validate32.errors : vErrors.concat(validate32.errors);
                          errors = vErrors.length;
                        }
                        var valid6 = _errs22 === errors;
                        if (!valid6) {
                          break;
                        }
                      }
                    } else {
                      validate63.errors = [{ instancePath: instancePath + "/places", schemaPath: "#/properties/places/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs20 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.quests !== void 0 && func0.call(data, "quests")) {
                    let data9 = data.quests;
                    const _errs23 = errors;
                    if (errors === _errs23) {
                      if (Array.isArray(data9)) {
                        var valid7 = true;
                        const len2 = data9.length;
                        for (let i2 = 0; i2 < len2; i2++) {
                          const _errs25 = errors;
                          if (!validate35(data9[i2], { instancePath: instancePath + "/quests/" + i2, parentData: data9, parentDataProperty: i2, rootData })) {
                            vErrors = vErrors === null ? validate35.errors : vErrors.concat(validate35.errors);
                            errors = vErrors.length;
                          }
                          var valid7 = _errs25 === errors;
                          if (!valid7) {
                            break;
                          }
                        }
                      } else {
                        validate63.errors = [{ instancePath: instancePath + "/quests", schemaPath: "#/properties/quests/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                        return false;
                      }
                    }
                    var valid0 = _errs23 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.mapLocations !== void 0 && func0.call(data, "mapLocations")) {
                      let data11 = data.mapLocations;
                      const _errs26 = errors;
                      if (errors === _errs26) {
                        if (Array.isArray(data11)) {
                          var valid8 = true;
                          const len3 = data11.length;
                          for (let i3 = 0; i3 < len3; i3++) {
                            const _errs28 = errors;
                            if (!validate39(data11[i3], { instancePath: instancePath + "/mapLocations/" + i3, parentData: data11, parentDataProperty: i3, rootData })) {
                              vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
                              errors = vErrors.length;
                            }
                            var valid8 = _errs28 === errors;
                            if (!valid8) {
                              break;
                            }
                          }
                        } else {
                          validate63.errors = [{ instancePath: instancePath + "/mapLocations", schemaPath: "#/properties/mapLocations/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid0 = _errs26 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.layerLabels !== void 0 && func0.call(data, "layerLabels")) {
                        let data13 = data.layerLabels;
                        const _errs29 = errors;
                        if (errors === _errs29) {
                          if (data13 && typeof data13 == "object" && !Array.isArray(data13)) {
                          } else {
                            validate63.errors = [{ instancePath: instancePath + "/layerLabels", schemaPath: "#/properties/layerLabels/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                        }
                        var valid0 = _errs29 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.questTypes !== void 0 && func0.call(data, "questTypes")) {
                          let data14 = data.questTypes;
                          const _errs32 = errors;
                          const _errs33 = errors;
                          if (errors === _errs33) {
                            if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
                              for (const key0 of Object.keys(data14)) {
                                let data15 = data14[key0];
                                const _errs36 = errors;
                                if (errors === _errs36) {
                                  if (data15 && typeof data15 == "object" && !Array.isArray(data15)) {
                                  } else {
                                    validate63.errors = [{ instancePath: instancePath + "/questTypes/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/QuestTypesV1/additionalProperties/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                    return false;
                                  }
                                }
                                var valid10 = _errs36 === errors;
                                if (!valid10) {
                                  break;
                                }
                              }
                            } else {
                              validate63.errors = [{ instancePath: instancePath + "/questTypes", schemaPath: "#/$defs/QuestTypesV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                              return false;
                            }
                          }
                          var valid0 = _errs32 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.config !== void 0 && func0.call(data, "config")) {
                            let data16 = data.config;
                            const _errs39 = errors;
                            if (errors === _errs39) {
                              if (data16 && typeof data16 == "object" && !Array.isArray(data16)) {
                                let missing3;
                                if ((data16.storageNamespace === void 0 || !func0.call(data16, "storageNamespace")) && (missing3 = "storageNamespace")) {
                                  validate63.errors = [{ instancePath: instancePath + "/config", schemaPath: "#/properties/config/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" }];
                                  return false;
                                } else {
                                  if (data16.storageNamespace !== void 0 && func0.call(data16, "storageNamespace")) {
                                    let data17 = data16.storageNamespace;
                                    const _errs42 = errors;
                                    if (errors === _errs42) {
                                      if (typeof data17 === "string") {
                                        if (!pattern0.test(data17)) {
                                          validate63.errors = [{ instancePath: instancePath + "/config/storageNamespace", schemaPath: "#/properties/config/properties/storageNamespace/pattern", keyword: "pattern", params: { pattern: "\\S" }, message: 'must match pattern "\\S"' }];
                                          return false;
                                        }
                                      } else {
                                        validate63.errors = [{ instancePath: instancePath + "/config/storageNamespace", schemaPath: "#/properties/config/properties/storageNamespace/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                    }
                                  }
                                }
                              } else {
                                validate63.errors = [{ instancePath: instancePath + "/config", schemaPath: "#/properties/config/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                return false;
                              }
                            }
                            var valid0 = _errs39 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.objectives !== void 0 && func0.call(data, "objectives")) {
                              let data18 = data.objectives;
                              const _errs44 = errors;
                              if (errors === _errs44) {
                                if (data18 && typeof data18 == "object" && !Array.isArray(data18)) {
                                } else {
                                  validate63.errors = [{ instancePath: instancePath + "/objectives", schemaPath: "#/properties/objectives/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                  return false;
                                }
                              }
                              var valid0 = _errs44 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.placeTypes !== void 0 && func0.call(data, "placeTypes")) {
                                let data19 = data.placeTypes;
                                const _errs47 = errors;
                                if (errors === _errs47) {
                                  if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
                                  } else {
                                    validate63.errors = [{ instancePath: instancePath + "/placeTypes", schemaPath: "#/properties/placeTypes/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                    return false;
                                  }
                                }
                                var valid0 = _errs47 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.layerIcons !== void 0 && func0.call(data, "layerIcons")) {
                                  let data20 = data.layerIcons;
                                  const _errs50 = errors;
                                  if (errors === _errs50) {
                                    if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
                                    } else {
                                      validate63.errors = [{ instancePath: instancePath + "/layerIcons", schemaPath: "#/properties/layerIcons/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                      return false;
                                    }
                                  }
                                  var valid0 = _errs50 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.layerColors !== void 0 && func0.call(data, "layerColors")) {
                                    let data21 = data.layerColors;
                                    const _errs53 = errors;
                                    if (errors === _errs53) {
                                      if (data21 && typeof data21 == "object" && !Array.isArray(data21)) {
                                      } else {
                                        validate63.errors = [{ instancePath: instancePath + "/layerColors", schemaPath: "#/properties/layerColors/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                        return false;
                                      }
                                    }
                                    var valid0 = _errs53 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate63.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate63.errors = vErrors;
    return errors === 0;
  }
  var schema62 = { "type": "object", "properties": { "id": { "type": "string" }, "x": { "type": "number" }, "y": { "type": "number" }, "dx": { "type": "number" }, "dy": { "type": "number" }, "kind": { "type": ["string", "null"] }, "size": { "type": ["number", "string", "null"] }, "fontSize": { "type": ["number", "null"], "exclusiveMinimum": 0 }, "minScale": { "type": ["number", "null"] }, "lineWidth": { "type": ["number", "null"], "minimum": 0 }, "selected": { "type": ["boolean", "null"] }, "layer": { "type": ["string", "number", "null"] }, "shape": { "type": ["string", "null"] }, "color": { "type": ["string", "null"] }, "textColor": { "type": ["string", "null"] }, "iconURL": { "type": ["string", "null"] }, "lineColor": { "type": ["string", "null"] }, "text": { "type": ["string", "number", "boolean", "null"] }, "facts": { "type": "array", "items": { "$ref": "#/$defs/ReferenceFactV1" } }, "factSections": { "type": "array", "items": { "$ref": "#/$defs/FactSectionV1" } } }, "required": ["id", "x", "y"], "additionalProperties": true };
  function validate71(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.id === void 0 || !func0.call(data, "id")) && (missing0 = "id") || (data.x === void 0 || !func0.call(data, "x")) && (missing0 = "x") || (data.y === void 0 || !func0.call(data, "y")) && (missing0 = "y")) {
          validate71.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.id !== void 0 && func0.call(data, "id")) {
            const _errs2 = errors;
            if (typeof data.id !== "string") {
              validate71.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.x !== void 0 && func0.call(data, "x")) {
              let data1 = data.x;
              const _errs4 = errors;
              if (!(typeof data1 == "number" && isFinite(data1))) {
                validate71.errors = [{ instancePath: instancePath + "/x", schemaPath: "#/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.y !== void 0 && func0.call(data, "y")) {
                let data2 = data.y;
                const _errs6 = errors;
                if (!(typeof data2 == "number" && isFinite(data2))) {
                  validate71.errors = [{ instancePath: instancePath + "/y", schemaPath: "#/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.dx !== void 0 && func0.call(data, "dx")) {
                  let data3 = data.dx;
                  const _errs8 = errors;
                  if (!(typeof data3 == "number" && isFinite(data3))) {
                    validate71.errors = [{ instancePath: instancePath + "/dx", schemaPath: "#/properties/dx/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                    return false;
                  }
                  var valid0 = _errs8 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.dy !== void 0 && func0.call(data, "dy")) {
                    let data4 = data.dy;
                    const _errs10 = errors;
                    if (!(typeof data4 == "number" && isFinite(data4))) {
                      validate71.errors = [{ instancePath: instancePath + "/dy", schemaPath: "#/properties/dy/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                      return false;
                    }
                    var valid0 = _errs10 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.kind !== void 0 && func0.call(data, "kind")) {
                      let data5 = data.kind;
                      const _errs12 = errors;
                      if (typeof data5 !== "string" && data5 !== null) {
                        validate71.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/type", keyword: "type", params: { type: schema62.properties.kind.type }, message: "must be string,null" }];
                        return false;
                      }
                      var valid0 = _errs12 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.size !== void 0 && func0.call(data, "size")) {
                        let data6 = data.size;
                        const _errs14 = errors;
                        if (!(typeof data6 == "number" && isFinite(data6)) && typeof data6 !== "string" && data6 !== null) {
                          validate71.errors = [{ instancePath: instancePath + "/size", schemaPath: "#/properties/size/type", keyword: "type", params: { type: schema62.properties.size.type }, message: "must be number,string,null" }];
                          return false;
                        }
                        var valid0 = _errs14 === errors;
                      } else {
                        var valid0 = true;
                      }
                      if (valid0) {
                        if (data.fontSize !== void 0 && func0.call(data, "fontSize")) {
                          let data7 = data.fontSize;
                          const _errs16 = errors;
                          if (!(typeof data7 == "number" && isFinite(data7)) && data7 !== null) {
                            validate71.errors = [{ instancePath: instancePath + "/fontSize", schemaPath: "#/properties/fontSize/type", keyword: "type", params: { type: schema62.properties.fontSize.type }, message: "must be number,null" }];
                            return false;
                          }
                          if (errors === _errs16) {
                            if (typeof data7 == "number" && isFinite(data7)) {
                              if (data7 <= 0 || isNaN(data7)) {
                                validate71.errors = [{ instancePath: instancePath + "/fontSize", schemaPath: "#/properties/fontSize/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                return false;
                              }
                            }
                          }
                          var valid0 = _errs16 === errors;
                        } else {
                          var valid0 = true;
                        }
                        if (valid0) {
                          if (data.minScale !== void 0 && func0.call(data, "minScale")) {
                            let data8 = data.minScale;
                            const _errs18 = errors;
                            if (!(typeof data8 == "number" && isFinite(data8)) && data8 !== null) {
                              validate71.errors = [{ instancePath: instancePath + "/minScale", schemaPath: "#/properties/minScale/type", keyword: "type", params: { type: schema62.properties.minScale.type }, message: "must be number,null" }];
                              return false;
                            }
                            var valid0 = _errs18 === errors;
                          } else {
                            var valid0 = true;
                          }
                          if (valid0) {
                            if (data.lineWidth !== void 0 && func0.call(data, "lineWidth")) {
                              let data9 = data.lineWidth;
                              const _errs20 = errors;
                              if (!(typeof data9 == "number" && isFinite(data9)) && data9 !== null) {
                                validate71.errors = [{ instancePath: instancePath + "/lineWidth", schemaPath: "#/properties/lineWidth/type", keyword: "type", params: { type: schema62.properties.lineWidth.type }, message: "must be number,null" }];
                                return false;
                              }
                              if (errors === _errs20) {
                                if (typeof data9 == "number" && isFinite(data9)) {
                                  if (data9 < 0 || isNaN(data9)) {
                                    validate71.errors = [{ instancePath: instancePath + "/lineWidth", schemaPath: "#/properties/lineWidth/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                    return false;
                                  }
                                }
                              }
                              var valid0 = _errs20 === errors;
                            } else {
                              var valid0 = true;
                            }
                            if (valid0) {
                              if (data.selected !== void 0 && func0.call(data, "selected")) {
                                let data10 = data.selected;
                                const _errs22 = errors;
                                if (typeof data10 !== "boolean" && data10 !== null) {
                                  validate71.errors = [{ instancePath: instancePath + "/selected", schemaPath: "#/properties/selected/type", keyword: "type", params: { type: schema62.properties.selected.type }, message: "must be boolean,null" }];
                                  return false;
                                }
                                var valid0 = _errs22 === errors;
                              } else {
                                var valid0 = true;
                              }
                              if (valid0) {
                                if (data.layer !== void 0 && func0.call(data, "layer")) {
                                  let data11 = data.layer;
                                  const _errs24 = errors;
                                  if (typeof data11 !== "string" && !(typeof data11 == "number" && isFinite(data11)) && data11 !== null) {
                                    validate71.errors = [{ instancePath: instancePath + "/layer", schemaPath: "#/properties/layer/type", keyword: "type", params: { type: schema62.properties.layer.type }, message: "must be string,number,null" }];
                                    return false;
                                  }
                                  var valid0 = _errs24 === errors;
                                } else {
                                  var valid0 = true;
                                }
                                if (valid0) {
                                  if (data.shape !== void 0 && func0.call(data, "shape")) {
                                    let data12 = data.shape;
                                    const _errs26 = errors;
                                    if (typeof data12 !== "string" && data12 !== null) {
                                      validate71.errors = [{ instancePath: instancePath + "/shape", schemaPath: "#/properties/shape/type", keyword: "type", params: { type: schema62.properties.shape.type }, message: "must be string,null" }];
                                      return false;
                                    }
                                    var valid0 = _errs26 === errors;
                                  } else {
                                    var valid0 = true;
                                  }
                                  if (valid0) {
                                    if (data.color !== void 0 && func0.call(data, "color")) {
                                      let data13 = data.color;
                                      const _errs28 = errors;
                                      if (typeof data13 !== "string" && data13 !== null) {
                                        validate71.errors = [{ instancePath: instancePath + "/color", schemaPath: "#/properties/color/type", keyword: "type", params: { type: schema62.properties.color.type }, message: "must be string,null" }];
                                        return false;
                                      }
                                      var valid0 = _errs28 === errors;
                                    } else {
                                      var valid0 = true;
                                    }
                                    if (valid0) {
                                      if (data.textColor !== void 0 && func0.call(data, "textColor")) {
                                        let data14 = data.textColor;
                                        const _errs30 = errors;
                                        if (typeof data14 !== "string" && data14 !== null) {
                                          validate71.errors = [{ instancePath: instancePath + "/textColor", schemaPath: "#/properties/textColor/type", keyword: "type", params: { type: schema62.properties.textColor.type }, message: "must be string,null" }];
                                          return false;
                                        }
                                        var valid0 = _errs30 === errors;
                                      } else {
                                        var valid0 = true;
                                      }
                                      if (valid0) {
                                        if (data.iconURL !== void 0 && func0.call(data, "iconURL")) {
                                          let data15 = data.iconURL;
                                          const _errs32 = errors;
                                          if (typeof data15 !== "string" && data15 !== null) {
                                            validate71.errors = [{ instancePath: instancePath + "/iconURL", schemaPath: "#/properties/iconURL/type", keyword: "type", params: { type: schema62.properties.iconURL.type }, message: "must be string,null" }];
                                            return false;
                                          }
                                          var valid0 = _errs32 === errors;
                                        } else {
                                          var valid0 = true;
                                        }
                                        if (valid0) {
                                          if (data.lineColor !== void 0 && func0.call(data, "lineColor")) {
                                            let data16 = data.lineColor;
                                            const _errs34 = errors;
                                            if (typeof data16 !== "string" && data16 !== null) {
                                              validate71.errors = [{ instancePath: instancePath + "/lineColor", schemaPath: "#/properties/lineColor/type", keyword: "type", params: { type: schema62.properties.lineColor.type }, message: "must be string,null" }];
                                              return false;
                                            }
                                            var valid0 = _errs34 === errors;
                                          } else {
                                            var valid0 = true;
                                          }
                                          if (valid0) {
                                            if (data.text !== void 0 && func0.call(data, "text")) {
                                              let data17 = data.text;
                                              const _errs36 = errors;
                                              if (typeof data17 !== "string" && !(typeof data17 == "number" && isFinite(data17)) && typeof data17 !== "boolean" && data17 !== null) {
                                                validate71.errors = [{ instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: schema62.properties.text.type }, message: "must be string,number,boolean,null" }];
                                                return false;
                                              }
                                              var valid0 = _errs36 === errors;
                                            } else {
                                              var valid0 = true;
                                            }
                                            if (valid0) {
                                              if (data.facts !== void 0 && func0.call(data, "facts")) {
                                                let data18 = data.facts;
                                                const _errs38 = errors;
                                                if (errors === _errs38) {
                                                  if (Array.isArray(data18)) {
                                                    var valid1 = true;
                                                    const len0 = data18.length;
                                                    for (let i0 = 0; i0 < len0; i0++) {
                                                      let data19 = data18[i0];
                                                      const _errs40 = errors;
                                                      const _errs41 = errors;
                                                      if (errors === _errs41) {
                                                        if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
                                                          let missing1;
                                                          if ((data19.label === void 0 || !func0.call(data19, "label")) && (missing1 = "label") || (data19.value === void 0 || !func0.call(data19, "value")) && (missing1 = "value")) {
                                                            validate71.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/ReferenceFactV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                                                            return false;
                                                          } else {
                                                            if (data19.label !== void 0 && func0.call(data19, "label")) {
                                                              let data20 = data19.label;
                                                              const _errs44 = errors;
                                                              if (errors === _errs44) {
                                                                if (typeof data20 === "string") {
                                                                  if (func61(data20) < 1) {
                                                                    validate71.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                                                    return false;
                                                                  }
                                                                } else {
                                                                  validate71.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/label", schemaPath: "#/$defs/ReferenceFactV1/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                                  return false;
                                                                }
                                                              }
                                                              var valid3 = _errs44 === errors;
                                                            } else {
                                                              var valid3 = true;
                                                            }
                                                            if (valid3) {
                                                              if (data19.value !== void 0 && func0.call(data19, "value")) {
                                                                let data21 = data19.value;
                                                                const _errs46 = errors;
                                                                if (typeof data21 !== "string" && !(typeof data21 == "number" && isFinite(data21)) && typeof data21 !== "boolean" && data21 !== null) {
                                                                  validate71.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/value", schemaPath: "#/$defs/ReferenceFactV1/properties/value/type", keyword: "type", params: { type: schema15.properties.value.type }, message: "must be string,number,boolean,null" }];
                                                                  return false;
                                                                }
                                                                var valid3 = _errs46 === errors;
                                                              } else {
                                                                var valid3 = true;
                                                              }
                                                              if (valid3) {
                                                                if (data19.note !== void 0 && func0.call(data19, "note")) {
                                                                  const _errs48 = errors;
                                                                  if (typeof data19.note !== "string") {
                                                                    validate71.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/note", schemaPath: "#/$defs/ReferenceFactV1/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                                    return false;
                                                                  }
                                                                  var valid3 = _errs48 === errors;
                                                                } else {
                                                                  var valid3 = true;
                                                                }
                                                              }
                                                            }
                                                          }
                                                        } else {
                                                          validate71.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/ReferenceFactV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                          return false;
                                                        }
                                                      }
                                                      var valid1 = _errs40 === errors;
                                                      if (!valid1) {
                                                        break;
                                                      }
                                                    }
                                                  } else {
                                                    validate71.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                                    return false;
                                                  }
                                                }
                                                var valid0 = _errs38 === errors;
                                              } else {
                                                var valid0 = true;
                                              }
                                              if (valid0) {
                                                if (data.factSections !== void 0 && func0.call(data, "factSections")) {
                                                  let data23 = data.factSections;
                                                  const _errs50 = errors;
                                                  if (errors === _errs50) {
                                                    if (Array.isArray(data23)) {
                                                      var valid4 = true;
                                                      const len1 = data23.length;
                                                      for (let i1 = 0; i1 < len1; i1++) {
                                                        const _errs52 = errors;
                                                        if (!validate15(data23[i1], { instancePath: instancePath + "/factSections/" + i1, parentData: data23, parentDataProperty: i1, rootData })) {
                                                          vErrors = vErrors === null ? validate15.errors : vErrors.concat(validate15.errors);
                                                          errors = vErrors.length;
                                                        }
                                                        var valid4 = _errs52 === errors;
                                                        if (!valid4) {
                                                          break;
                                                        }
                                                      }
                                                    } else {
                                                      validate71.errors = [{ instancePath: instancePath + "/factSections", schemaPath: "#/properties/factSections/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                                      return false;
                                                    }
                                                  }
                                                  var valid0 = _errs50 === errors;
                                                } else {
                                                  var valid0 = true;
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        validate71.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate71.errors = vErrors;
    return errors === 0;
  }
  var MarkerSetV1 = validate73;
  function validate73(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (Array.isArray(data)) {
        var valid0 = true;
        const len0 = data.length;
        for (let i0 = 0; i0 < len0; i0++) {
          const _errs1 = errors;
          if (!validate71(data[i0], { instancePath: instancePath + "/" + i0, parentData: data, parentDataProperty: i0, rootData })) {
            vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs1 === errors;
          if (!valid0) {
            break;
          }
        }
      } else {
        validate73.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
        return false;
      }
    }
    validate73.errors = vErrors;
    return errors === 0;
  }
  var CameraPoseV1 = validate75;
  function validate75(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.x === void 0 || !func0.call(data, "x")) && (missing0 = "x") || (data.y === void 0 || !func0.call(data, "y")) && (missing0 = "y") || (data.scale === void 0 || !func0.call(data, "scale")) && (missing0 = "scale")) {
          validate75.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.x !== void 0 && func0.call(data, "x")) {
            let data0 = data.x;
            const _errs2 = errors;
            if (!(typeof data0 == "number" && isFinite(data0))) {
              validate75.errors = [{ instancePath: instancePath + "/x", schemaPath: "#/properties/x/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.y !== void 0 && func0.call(data, "y")) {
              let data1 = data.y;
              const _errs4 = errors;
              if (!(typeof data1 == "number" && isFinite(data1))) {
                validate75.errors = [{ instancePath: instancePath + "/y", schemaPath: "#/properties/y/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.scale !== void 0 && func0.call(data, "scale")) {
                let data2 = data.scale;
                const _errs6 = errors;
                if (errors === _errs6) {
                  if (typeof data2 == "number" && isFinite(data2)) {
                    if (data2 <= 0 || isNaN(data2)) {
                      validate75.errors = [{ instancePath: instancePath + "/scale", schemaPath: "#/properties/scale/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                      return false;
                    }
                  } else {
                    validate75.errors = [{ instancePath: instancePath + "/scale", schemaPath: "#/properties/scale/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                    return false;
                  }
                }
                var valid0 = _errs6 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      } else {
        validate75.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate75.errors = vErrors;
    return errors === 0;
  }
  var RendererOptionsV1 = validate76;
  function validate76(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.interactive !== void 0 && func0.call(data, "interactive")) {
          const _errs2 = errors;
          if (typeof data.interactive !== "boolean") {
            validate76.errors = [{ instancePath: instancePath + "/interactive", schemaPath: "#/properties/interactive/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
            return false;
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.editing !== void 0 && func0.call(data, "editing")) {
            const _errs4 = errors;
            if (typeof data.editing !== "boolean") {
              validate76.errors = [{ instancePath: instancePath + "/editing", schemaPath: "#/properties/editing/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
              return false;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.constrainToArtwork !== void 0 && func0.call(data, "constrainToArtwork")) {
              const _errs6 = errors;
              if (typeof data.constrainToArtwork !== "boolean") {
                validate76.errors = [{ instancePath: instancePath + "/constrainToArtwork", schemaPath: "#/properties/constrainToArtwork/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                return false;
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.projectionPadding !== void 0 && func0.call(data, "projectionPadding")) {
                let data3 = data.projectionPadding;
                const _errs8 = errors;
                if (errors === _errs8) {
                  if (typeof data3 == "number" && isFinite(data3)) {
                    if (data3 > 64 || isNaN(data3)) {
                      validate76.errors = [{ instancePath: instancePath + "/projectionPadding", schemaPath: "#/properties/projectionPadding/maximum", keyword: "maximum", params: { comparison: "<=", limit: 64 }, message: "must be <= 64" }];
                      return false;
                    } else {
                      if (data3 < 1 || isNaN(data3)) {
                        validate76.errors = [{ instancePath: instancePath + "/projectionPadding", schemaPath: "#/properties/projectionPadding/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                        return false;
                      }
                    }
                  } else {
                    validate76.errors = [{ instancePath: instancePath + "/projectionPadding", schemaPath: "#/properties/projectionPadding/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                    return false;
                  }
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.assetsBase !== void 0 && func0.call(data, "assetsBase")) {
                  let data4 = data.assetsBase;
                  const _errs10 = errors;
                  if (errors === _errs10) {
                    if (typeof data4 === "string") {
                      if (func61(data4) < 1) {
                        validate76.errors = [{ instancePath: instancePath + "/assetsBase", schemaPath: "#/properties/assetsBase/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                        return false;
                      }
                    } else {
                      validate76.errors = [{ instancePath: instancePath + "/assetsBase", schemaPath: "#/properties/assetsBase/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                  var valid0 = _errs10 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      } else {
        validate76.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate76.errors = vErrors;
    return errors === 0;
  }
  var ScaleRangeV1 = validate77;
  function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.minimum === void 0 || !func0.call(data, "minimum")) && (missing0 = "minimum") || (data.maximum === void 0 || !func0.call(data, "maximum")) && (missing0 = "maximum")) {
          validate77.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.minimum !== void 0 && func0.call(data, "minimum")) {
            let data0 = data.minimum;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 == "number" && isFinite(data0)) {
                if (data0 <= 0 || isNaN(data0)) {
                  validate77.errors = [{ instancePath: instancePath + "/minimum", schemaPath: "#/properties/minimum/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                  return false;
                }
              } else {
                validate77.errors = [{ instancePath: instancePath + "/minimum", schemaPath: "#/properties/minimum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.maximum !== void 0 && func0.call(data, "maximum")) {
              let data1 = data.maximum;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 == "number" && isFinite(data1)) {
                  if (data1 <= 0 || isNaN(data1)) {
                    validate77.errors = [{ instancePath: instancePath + "/maximum", schemaPath: "#/properties/maximum/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                    return false;
                  }
                } else {
                  validate77.errors = [{ instancePath: instancePath + "/maximum", schemaPath: "#/properties/maximum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      } else {
        validate77.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate77.errors = vErrors;
    return errors === 0;
  }
  var SelectionStateV1 = validate78;
  function validate78(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (Array.isArray(data)) {
        var valid0 = true;
        const len0 = data.length;
        for (let i0 = 0; i0 < len0; i0++) {
          const _errs1 = errors;
          if (typeof data[i0] !== "string") {
            validate78.errors = [{ instancePath: instancePath + "/" + i0, schemaPath: "#/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
            return false;
          }
          var valid0 = _errs1 === errors;
          if (!valid0) {
            break;
          }
        }
      } else {
        validate78.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
        return false;
      }
    }
    validate78.errors = vErrors;
    return errors === 0;
  }
  var LayerStateV1 = validate79;
  var schema69 = { "type": "object", "properties": { "ids": { "type": ["array", "null"], "items": { "type": ["string", "number"] } }, "options": { "type": "object", "properties": { "locationIds": { "type": ["array", "null"], "items": { "type": ["string", "number"] } }, "labelsVisible": { "type": ["boolean", "null"] }, "areaNames": { "type": ["boolean", "null"] }, "routes": { "type": ["boolean", "null"] }, "selectedLocation": { "anyOf": [{ "type": ["string", "number", "null"] }, { "type": "object", "properties": { "key": { "type": ["string", "number"] } }, "required": ["key"], "additionalProperties": true }] } }, "additionalProperties": true } }, "additionalProperties": true };
  function validate79(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.ids !== void 0 && func0.call(data, "ids")) {
          let data0 = data.ids;
          const _errs2 = errors;
          if (!Array.isArray(data0) && data0 !== null) {
            validate79.errors = [{ instancePath: instancePath + "/ids", schemaPath: "#/properties/ids/type", keyword: "type", params: { type: schema69.properties.ids.type }, message: "must be array,null" }];
            return false;
          }
          if (errors === _errs2) {
            if (Array.isArray(data0)) {
              var valid1 = true;
              const len0 = data0.length;
              for (let i0 = 0; i0 < len0; i0++) {
                let data1 = data0[i0];
                const _errs4 = errors;
                if (typeof data1 !== "string" && !(typeof data1 == "number" && isFinite(data1))) {
                  validate79.errors = [{ instancePath: instancePath + "/ids/" + i0, schemaPath: "#/properties/ids/items/type", keyword: "type", params: { type: schema69.properties.ids.items.type }, message: "must be string,number" }];
                  return false;
                }
                var valid1 = _errs4 === errors;
                if (!valid1) {
                  break;
                }
              }
            }
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.options !== void 0 && func0.call(data, "options")) {
            let data2 = data.options;
            const _errs6 = errors;
            if (errors === _errs6) {
              if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
                if (data2.locationIds !== void 0 && func0.call(data2, "locationIds")) {
                  let data3 = data2.locationIds;
                  const _errs9 = errors;
                  if (!Array.isArray(data3) && data3 !== null) {
                    validate79.errors = [{ instancePath: instancePath + "/options/locationIds", schemaPath: "#/properties/options/properties/locationIds/type", keyword: "type", params: { type: schema69.properties.options.properties.locationIds.type }, message: "must be array,null" }];
                    return false;
                  }
                  if (errors === _errs9) {
                    if (Array.isArray(data3)) {
                      var valid3 = true;
                      const len1 = data3.length;
                      for (let i1 = 0; i1 < len1; i1++) {
                        let data4 = data3[i1];
                        const _errs11 = errors;
                        if (typeof data4 !== "string" && !(typeof data4 == "number" && isFinite(data4))) {
                          validate79.errors = [{ instancePath: instancePath + "/options/locationIds/" + i1, schemaPath: "#/properties/options/properties/locationIds/items/type", keyword: "type", params: { type: schema69.properties.options.properties.locationIds.items.type }, message: "must be string,number" }];
                          return false;
                        }
                        var valid3 = _errs11 === errors;
                        if (!valid3) {
                          break;
                        }
                      }
                    }
                  }
                  var valid2 = _errs9 === errors;
                } else {
                  var valid2 = true;
                }
                if (valid2) {
                  if (data2.labelsVisible !== void 0 && func0.call(data2, "labelsVisible")) {
                    let data5 = data2.labelsVisible;
                    const _errs13 = errors;
                    if (typeof data5 !== "boolean" && data5 !== null) {
                      validate79.errors = [{ instancePath: instancePath + "/options/labelsVisible", schemaPath: "#/properties/options/properties/labelsVisible/type", keyword: "type", params: { type: schema69.properties.options.properties.labelsVisible.type }, message: "must be boolean,null" }];
                      return false;
                    }
                    var valid2 = _errs13 === errors;
                  } else {
                    var valid2 = true;
                  }
                  if (valid2) {
                    if (data2.areaNames !== void 0 && func0.call(data2, "areaNames")) {
                      let data6 = data2.areaNames;
                      const _errs15 = errors;
                      if (typeof data6 !== "boolean" && data6 !== null) {
                        validate79.errors = [{ instancePath: instancePath + "/options/areaNames", schemaPath: "#/properties/options/properties/areaNames/type", keyword: "type", params: { type: schema69.properties.options.properties.areaNames.type }, message: "must be boolean,null" }];
                        return false;
                      }
                      var valid2 = _errs15 === errors;
                    } else {
                      var valid2 = true;
                    }
                    if (valid2) {
                      if (data2.routes !== void 0 && func0.call(data2, "routes")) {
                        let data7 = data2.routes;
                        const _errs17 = errors;
                        if (typeof data7 !== "boolean" && data7 !== null) {
                          validate79.errors = [{ instancePath: instancePath + "/options/routes", schemaPath: "#/properties/options/properties/routes/type", keyword: "type", params: { type: schema69.properties.options.properties.routes.type }, message: "must be boolean,null" }];
                          return false;
                        }
                        var valid2 = _errs17 === errors;
                      } else {
                        var valid2 = true;
                      }
                      if (valid2) {
                        if (data2.selectedLocation !== void 0 && func0.call(data2, "selectedLocation")) {
                          let data8 = data2.selectedLocation;
                          const _errs19 = errors;
                          const _errs20 = errors;
                          let valid4 = false;
                          const _errs21 = errors;
                          if (typeof data8 !== "string" && !(typeof data8 == "number" && isFinite(data8)) && data8 !== null) {
                            const err0 = { instancePath: instancePath + "/options/selectedLocation", schemaPath: "#/properties/options/properties/selectedLocation/anyOf/0/type", keyword: "type", params: { type: schema69.properties.options.properties.selectedLocation.anyOf[0].type }, message: "must be string,number,null" };
                            if (vErrors === null) {
                              vErrors = [err0];
                            } else {
                              vErrors.push(err0);
                            }
                            errors++;
                          }
                          var _valid0 = _errs21 === errors;
                          valid4 = valid4 || _valid0;
                          if (!valid4) {
                            const _errs23 = errors;
                            if (errors === _errs23) {
                              if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
                                let missing0;
                                if ((data8.key === void 0 || !func0.call(data8, "key")) && (missing0 = "key")) {
                                  const err1 = { instancePath: instancePath + "/options/selectedLocation", schemaPath: "#/properties/options/properties/selectedLocation/anyOf/1/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" };
                                  if (vErrors === null) {
                                    vErrors = [err1];
                                  } else {
                                    vErrors.push(err1);
                                  }
                                  errors++;
                                } else {
                                  if (data8.key !== void 0 && func0.call(data8, "key")) {
                                    let data9 = data8.key;
                                    if (typeof data9 !== "string" && !(typeof data9 == "number" && isFinite(data9))) {
                                      const err2 = { instancePath: instancePath + "/options/selectedLocation/key", schemaPath: "#/properties/options/properties/selectedLocation/anyOf/1/properties/key/type", keyword: "type", params: { type: schema69.properties.options.properties.selectedLocation.anyOf[1].properties.key.type }, message: "must be string,number" };
                                      if (vErrors === null) {
                                        vErrors = [err2];
                                      } else {
                                        vErrors.push(err2);
                                      }
                                      errors++;
                                    }
                                  }
                                }
                              } else {
                                const err3 = { instancePath: instancePath + "/options/selectedLocation", schemaPath: "#/properties/options/properties/selectedLocation/anyOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                                if (vErrors === null) {
                                  vErrors = [err3];
                                } else {
                                  vErrors.push(err3);
                                }
                                errors++;
                              }
                            }
                            var _valid0 = _errs23 === errors;
                            valid4 = valid4 || _valid0;
                          }
                          if (!valid4) {
                            const err4 = { instancePath: instancePath + "/options/selectedLocation", schemaPath: "#/properties/options/properties/selectedLocation/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                            if (vErrors === null) {
                              vErrors = [err4];
                            } else {
                              vErrors.push(err4);
                            }
                            errors++;
                            validate79.errors = vErrors;
                            return false;
                          } else {
                            errors = _errs20;
                            if (vErrors !== null) {
                              if (_errs20) {
                                vErrors.length = _errs20;
                              } else {
                                vErrors = null;
                              }
                            }
                          }
                          var valid2 = _errs19 === errors;
                        } else {
                          var valid2 = true;
                        }
                      }
                    }
                  }
                }
              } else {
                validate79.errors = [{ instancePath: instancePath + "/options", schemaPath: "#/properties/options/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs6 === errors;
          } else {
            var valid0 = true;
          }
        }
      } else {
        validate79.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate79.errors = vErrors;
    return errors === 0;
  }
  var LabelOpacityCommandV1 = validate80;
  function validate80(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.id === void 0 || !func0.call(data, "id")) && (missing0 = "id") || (data.opacity === void 0 || !func0.call(data, "opacity")) && (missing0 = "opacity")) {
          validate80.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.id !== void 0 && func0.call(data, "id")) {
            const _errs2 = errors;
            if (typeof data.id !== "string") {
              validate80.errors = [{ instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.opacity !== void 0 && func0.call(data, "opacity")) {
              let data1 = data.opacity;
              const _errs4 = errors;
              if (!(typeof data1 == "number" && isFinite(data1))) {
                validate80.errors = [{ instancePath: instancePath + "/opacity", schemaPath: "#/properties/opacity/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      } else {
        validate80.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate80.errors = vErrors;
    return errors === 0;
  }
  var StreamGreetingV1 = validate82;
  function validate82(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.type === void 0 || !func0.call(data, "type")) && (missing0 = "type") || (data.version === void 0 || !func0.call(data, "version")) && (missing0 = "version") || (data.maxPending === void 0 || !func0.call(data, "maxPending")) && (missing0 = "maxPending") || (data.maxTileBytes === void 0 || !func0.call(data, "maxTileBytes")) && (missing0 = "maxTileBytes")) {
          validate82.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.type !== void 0 && func0.call(data, "type")) {
            const _errs2 = errors;
            if ("ready" !== data.type) {
              validate82.errors = [{ instancePath: instancePath + "/type", schemaPath: "#/properties/type/const", keyword: "const", params: { allowedValue: "ready" }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.version !== void 0 && func0.call(data, "version")) {
              const _errs3 = errors;
              if (1 !== data.version) {
                validate82.errors = [{ instancePath: instancePath + "/version", schemaPath: "#/properties/version/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" }];
                return false;
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.maxPending !== void 0 && func0.call(data, "maxPending")) {
                let data2 = data.maxPending;
                const _errs4 = errors;
                if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                  validate82.errors = [{ instancePath: instancePath + "/maxPending", schemaPath: "#/properties/maxPending/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs4) {
                  if (typeof data2 == "number" && isFinite(data2)) {
                    if (data2 > 16 || isNaN(data2)) {
                      validate82.errors = [{ instancePath: instancePath + "/maxPending", schemaPath: "#/properties/maxPending/maximum", keyword: "maximum", params: { comparison: "<=", limit: 16 }, message: "must be <= 16" }];
                      return false;
                    } else {
                      if (data2 < 1 || isNaN(data2)) {
                        validate82.errors = [{ instancePath: instancePath + "/maxPending", schemaPath: "#/properties/maxPending/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                        return false;
                      }
                    }
                  }
                }
                var valid0 = _errs4 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.maxTileBytes !== void 0 && func0.call(data, "maxTileBytes")) {
                  const _errs6 = errors;
                  if (2097152 !== data.maxTileBytes) {
                    validate82.errors = [{ instancePath: instancePath + "/maxTileBytes", schemaPath: "#/properties/maxTileBytes/const", keyword: "const", params: { allowedValue: 2097152 }, message: "must be equal to constant" }];
                    return false;
                  }
                  var valid0 = _errs6 === errors;
                } else {
                  var valid0 = true;
                }
              }
            }
          }
        }
      } else {
        validate82.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate82.errors = vErrors;
    return errors === 0;
  }
  var pattern8 = new RegExp("^[a-f0-9]{64}$", "u");
  var pattern9 = new RegExp("^[a-z0-9][a-z0-9-]{0,63}$", "u");
  var PreparedLocationSetV1 = validate87;
  function validate87(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.geometry === void 0 || !func0.call(data, "geometry")) && (missing0 = "geometry")) {
          validate87.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.geometry !== void 0 && func0.call(data, "geometry")) {
            let data0 = data.geometry;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                var valid1 = true;
                const len0 = data0.length;
                for (let i0 = 0; i0 < len0; i0++) {
                  let data1 = data0[i0];
                  const _errs4 = errors;
                  const _errs5 = errors;
                  if (errors === _errs5) {
                    if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                      let missing1;
                      if ((data1.type === void 0 || !func0.call(data1, "type")) && (missing1 = "type") || (data1.id === void 0 || !func0.call(data1, "id")) && (missing1 = "id") || (data1.geometry === void 0 || !func0.call(data1, "geometry")) && (missing1 = "geometry") || (data1.properties === void 0 || !func0.call(data1, "properties")) && (missing1 = "properties")) {
                        validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0, schemaPath: "#/$defs/PreparedLocationFeatureV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                        return false;
                      } else {
                        if (data1.type !== void 0 && func0.call(data1, "type")) {
                          const _errs8 = errors;
                          if ("Feature" !== data1.type) {
                            validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/type", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/type/const", keyword: "const", params: { allowedValue: "Feature" }, message: "must be equal to constant" }];
                            return false;
                          }
                          var valid3 = _errs8 === errors;
                        } else {
                          var valid3 = true;
                        }
                        if (valid3) {
                          if (data1.id !== void 0 && func0.call(data1, "id")) {
                            const _errs9 = errors;
                            if (typeof data1.id !== "string") {
                              validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/id", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                              return false;
                            }
                            var valid3 = _errs9 === errors;
                          } else {
                            var valid3 = true;
                          }
                          if (valid3) {
                            if (data1.geometry !== void 0 && func0.call(data1, "geometry")) {
                              let data4 = data1.geometry;
                              const _errs11 = errors;
                              const _errs12 = errors;
                              let valid4 = false;
                              let passing0 = null;
                              const _errs13 = errors;
                              if (errors === _errs13) {
                                if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                                  let missing2;
                                  if ((data4.type === void 0 || !func0.call(data4, "type")) && (missing2 = "type") || (data4.coordinates === void 0 || !func0.call(data4, "coordinates")) && (missing2 = "coordinates")) {
                                    const err0 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/0/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" };
                                    if (vErrors === null) {
                                      vErrors = [err0];
                                    } else {
                                      vErrors.push(err0);
                                    }
                                    errors++;
                                  } else {
                                    if (data4.type !== void 0 && func0.call(data4, "type")) {
                                      const _errs16 = errors;
                                      if ("Point" !== data4.type) {
                                        const err1 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/type", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/0/properties/type/const", keyword: "const", params: { allowedValue: "Point" }, message: "must be equal to constant" };
                                        if (vErrors === null) {
                                          vErrors = [err1];
                                        } else {
                                          vErrors.push(err1);
                                        }
                                        errors++;
                                      }
                                      var valid5 = _errs16 === errors;
                                    } else {
                                      var valid5 = true;
                                    }
                                    if (valid5) {
                                      if (data4.coordinates !== void 0 && func0.call(data4, "coordinates")) {
                                        let data6 = data4.coordinates;
                                        const _errs17 = errors;
                                        if (errors === _errs17) {
                                          if (Array.isArray(data6)) {
                                            if (data6.length > 2) {
                                              const err2 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/0/properties/coordinates/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" };
                                              if (vErrors === null) {
                                                vErrors = [err2];
                                              } else {
                                                vErrors.push(err2);
                                              }
                                              errors++;
                                            } else {
                                              if (data6.length < 2) {
                                                const err3 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/0/properties/coordinates/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" };
                                                if (vErrors === null) {
                                                  vErrors = [err3];
                                                } else {
                                                  vErrors.push(err3);
                                                }
                                                errors++;
                                              } else {
                                                var valid6 = true;
                                                const len1 = data6.length;
                                                for (let i1 = 0; i1 < len1; i1++) {
                                                  let data7 = data6[i1];
                                                  const _errs19 = errors;
                                                  if (!(typeof data7 == "number" && isFinite(data7))) {
                                                    const err4 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i1, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/0/properties/coordinates/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                                                    if (vErrors === null) {
                                                      vErrors = [err4];
                                                    } else {
                                                      vErrors.push(err4);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid6 = _errs19 === errors;
                                                  if (!valid6) {
                                                    break;
                                                  }
                                                }
                                              }
                                            }
                                          } else {
                                            const err5 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/0/properties/coordinates/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                            if (vErrors === null) {
                                              vErrors = [err5];
                                            } else {
                                              vErrors.push(err5);
                                            }
                                            errors++;
                                          }
                                        }
                                        var valid5 = _errs17 === errors;
                                      } else {
                                        var valid5 = true;
                                      }
                                    }
                                  }
                                } else {
                                  const err6 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                                  if (vErrors === null) {
                                    vErrors = [err6];
                                  } else {
                                    vErrors.push(err6);
                                  }
                                  errors++;
                                }
                              }
                              var _valid0 = _errs13 === errors;
                              if (_valid0) {
                                valid4 = true;
                                passing0 = 0;
                              }
                              const _errs21 = errors;
                              if (errors === _errs21) {
                                if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                                  let missing3;
                                  if ((data4.type === void 0 || !func0.call(data4, "type")) && (missing3 = "type") || (data4.coordinates === void 0 || !func0.call(data4, "coordinates")) && (missing3 = "coordinates")) {
                                    const err7 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" };
                                    if (vErrors === null) {
                                      vErrors = [err7];
                                    } else {
                                      vErrors.push(err7);
                                    }
                                    errors++;
                                  } else {
                                    if (data4.type !== void 0 && func0.call(data4, "type")) {
                                      const _errs24 = errors;
                                      if ("LineString" !== data4.type) {
                                        const err8 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/type", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/properties/type/const", keyword: "const", params: { allowedValue: "LineString" }, message: "must be equal to constant" };
                                        if (vErrors === null) {
                                          vErrors = [err8];
                                        } else {
                                          vErrors.push(err8);
                                        }
                                        errors++;
                                      }
                                      var valid7 = _errs24 === errors;
                                    } else {
                                      var valid7 = true;
                                    }
                                    if (valid7) {
                                      if (data4.coordinates !== void 0 && func0.call(data4, "coordinates")) {
                                        let data9 = data4.coordinates;
                                        const _errs25 = errors;
                                        if (errors === _errs25) {
                                          if (Array.isArray(data9)) {
                                            if (data9.length < 2) {
                                              const err9 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/properties/coordinates/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" };
                                              if (vErrors === null) {
                                                vErrors = [err9];
                                              } else {
                                                vErrors.push(err9);
                                              }
                                              errors++;
                                            } else {
                                              var valid8 = true;
                                              const len2 = data9.length;
                                              for (let i2 = 0; i2 < len2; i2++) {
                                                let data10 = data9[i2];
                                                const _errs27 = errors;
                                                if (errors === _errs27) {
                                                  if (Array.isArray(data10)) {
                                                    if (data10.length > 2) {
                                                      const err10 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i2, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/properties/coordinates/items/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" };
                                                      if (vErrors === null) {
                                                        vErrors = [err10];
                                                      } else {
                                                        vErrors.push(err10);
                                                      }
                                                      errors++;
                                                    } else {
                                                      if (data10.length < 2) {
                                                        const err11 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i2, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/properties/coordinates/items/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" };
                                                        if (vErrors === null) {
                                                          vErrors = [err11];
                                                        } else {
                                                          vErrors.push(err11);
                                                        }
                                                        errors++;
                                                      } else {
                                                        var valid9 = true;
                                                        const len3 = data10.length;
                                                        for (let i3 = 0; i3 < len3; i3++) {
                                                          let data11 = data10[i3];
                                                          const _errs29 = errors;
                                                          if (!(typeof data11 == "number" && isFinite(data11))) {
                                                            const err12 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i2 + "/" + i3, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/properties/coordinates/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                                                            if (vErrors === null) {
                                                              vErrors = [err12];
                                                            } else {
                                                              vErrors.push(err12);
                                                            }
                                                            errors++;
                                                          }
                                                          var valid9 = _errs29 === errors;
                                                          if (!valid9) {
                                                            break;
                                                          }
                                                        }
                                                      }
                                                    }
                                                  } else {
                                                    const err13 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i2, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/properties/coordinates/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                                    if (vErrors === null) {
                                                      vErrors = [err13];
                                                    } else {
                                                      vErrors.push(err13);
                                                    }
                                                    errors++;
                                                  }
                                                }
                                                var valid8 = _errs27 === errors;
                                                if (!valid8) {
                                                  break;
                                                }
                                              }
                                            }
                                          } else {
                                            const err14 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/properties/coordinates/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                            if (vErrors === null) {
                                              vErrors = [err14];
                                            } else {
                                              vErrors.push(err14);
                                            }
                                            errors++;
                                          }
                                        }
                                        var valid7 = _errs25 === errors;
                                      } else {
                                        var valid7 = true;
                                      }
                                    }
                                  }
                                } else {
                                  const err15 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                                  if (vErrors === null) {
                                    vErrors = [err15];
                                  } else {
                                    vErrors.push(err15);
                                  }
                                  errors++;
                                }
                              }
                              var _valid0 = _errs21 === errors;
                              if (_valid0 && valid4) {
                                valid4 = false;
                                passing0 = [passing0, 1];
                              } else {
                                if (_valid0) {
                                  valid4 = true;
                                  passing0 = 1;
                                }
                                const _errs31 = errors;
                                if (errors === _errs31) {
                                  if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                                    let missing4;
                                    if ((data4.type === void 0 || !func0.call(data4, "type")) && (missing4 = "type") || (data4.coordinates === void 0 || !func0.call(data4, "coordinates")) && (missing4 = "coordinates")) {
                                      const err16 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/required", keyword: "required", params: { missingProperty: missing4 }, message: "must have required property '" + missing4 + "'" };
                                      if (vErrors === null) {
                                        vErrors = [err16];
                                      } else {
                                        vErrors.push(err16);
                                      }
                                      errors++;
                                    } else {
                                      if (data4.type !== void 0 && func0.call(data4, "type")) {
                                        const _errs34 = errors;
                                        if ("Polygon" !== data4.type) {
                                          const err17 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/type", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/type/const", keyword: "const", params: { allowedValue: "Polygon" }, message: "must be equal to constant" };
                                          if (vErrors === null) {
                                            vErrors = [err17];
                                          } else {
                                            vErrors.push(err17);
                                          }
                                          errors++;
                                        }
                                        var valid10 = _errs34 === errors;
                                      } else {
                                        var valid10 = true;
                                      }
                                      if (valid10) {
                                        if (data4.coordinates !== void 0 && func0.call(data4, "coordinates")) {
                                          let data13 = data4.coordinates;
                                          const _errs35 = errors;
                                          if (errors === _errs35) {
                                            if (Array.isArray(data13)) {
                                              if (data13.length < 1) {
                                                const err18 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
                                                if (vErrors === null) {
                                                  vErrors = [err18];
                                                } else {
                                                  vErrors.push(err18);
                                                }
                                                errors++;
                                              } else {
                                                var valid11 = true;
                                                const len4 = data13.length;
                                                for (let i4 = 0; i4 < len4; i4++) {
                                                  let data14 = data13[i4];
                                                  const _errs37 = errors;
                                                  if (errors === _errs37) {
                                                    if (Array.isArray(data14)) {
                                                      if (data14.length < 3) {
                                                        const err19 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i4, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/items/minItems", keyword: "minItems", params: { limit: 3 }, message: "must NOT have fewer than 3 items" };
                                                        if (vErrors === null) {
                                                          vErrors = [err19];
                                                        } else {
                                                          vErrors.push(err19);
                                                        }
                                                        errors++;
                                                      } else {
                                                        var valid12 = true;
                                                        const len5 = data14.length;
                                                        for (let i5 = 0; i5 < len5; i5++) {
                                                          let data15 = data14[i5];
                                                          const _errs39 = errors;
                                                          if (errors === _errs39) {
                                                            if (Array.isArray(data15)) {
                                                              if (data15.length > 2) {
                                                                const err20 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i4 + "/" + i5, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/items/items/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" };
                                                                if (vErrors === null) {
                                                                  vErrors = [err20];
                                                                } else {
                                                                  vErrors.push(err20);
                                                                }
                                                                errors++;
                                                              } else {
                                                                if (data15.length < 2) {
                                                                  const err21 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i4 + "/" + i5, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/items/items/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" };
                                                                  if (vErrors === null) {
                                                                    vErrors = [err21];
                                                                  } else {
                                                                    vErrors.push(err21);
                                                                  }
                                                                  errors++;
                                                                } else {
                                                                  var valid13 = true;
                                                                  const len6 = data15.length;
                                                                  for (let i6 = 0; i6 < len6; i6++) {
                                                                    let data16 = data15[i6];
                                                                    const _errs41 = errors;
                                                                    if (!(typeof data16 == "number" && isFinite(data16))) {
                                                                      const err22 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i4 + "/" + i5 + "/" + i6, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/items/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                                                                      if (vErrors === null) {
                                                                        vErrors = [err22];
                                                                      } else {
                                                                        vErrors.push(err22);
                                                                      }
                                                                      errors++;
                                                                    }
                                                                    var valid13 = _errs41 === errors;
                                                                    if (!valid13) {
                                                                      break;
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            } else {
                                                              const err23 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i4 + "/" + i5, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/items/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                                              if (vErrors === null) {
                                                                vErrors = [err23];
                                                              } else {
                                                                vErrors.push(err23);
                                                              }
                                                              errors++;
                                                            }
                                                          }
                                                          var valid12 = _errs39 === errors;
                                                          if (!valid12) {
                                                            break;
                                                          }
                                                        }
                                                      }
                                                    } else {
                                                      const err24 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates/" + i4, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/items/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                                      if (vErrors === null) {
                                                        vErrors = [err24];
                                                      } else {
                                                        vErrors.push(err24);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  var valid11 = _errs37 === errors;
                                                  if (!valid11) {
                                                    break;
                                                  }
                                                }
                                              }
                                            } else {
                                              const err25 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry/coordinates", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/properties/coordinates/type", keyword: "type", params: { type: "array" }, message: "must be array" };
                                              if (vErrors === null) {
                                                vErrors = [err25];
                                              } else {
                                                vErrors.push(err25);
                                              }
                                              errors++;
                                            }
                                          }
                                          var valid10 = _errs35 === errors;
                                        } else {
                                          var valid10 = true;
                                        }
                                      }
                                    }
                                  } else {
                                    const err26 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf/2/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                                    if (vErrors === null) {
                                      vErrors = [err26];
                                    } else {
                                      vErrors.push(err26);
                                    }
                                    errors++;
                                  }
                                }
                                var _valid0 = _errs31 === errors;
                                if (_valid0 && valid4) {
                                  valid4 = false;
                                  passing0 = [passing0, 2];
                                } else {
                                  if (_valid0) {
                                    valid4 = true;
                                    passing0 = 2;
                                  }
                                }
                              }
                              if (!valid4) {
                                const err27 = { instancePath: instancePath + "/geometry/" + i0 + "/geometry", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/geometry/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
                                if (vErrors === null) {
                                  vErrors = [err27];
                                } else {
                                  vErrors.push(err27);
                                }
                                errors++;
                                validate87.errors = vErrors;
                                return false;
                              } else {
                                errors = _errs12;
                                if (vErrors !== null) {
                                  if (_errs12) {
                                    vErrors.length = _errs12;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                              }
                              var valid3 = _errs11 === errors;
                            } else {
                              var valid3 = true;
                            }
                            if (valid3) {
                              if (data1.properties !== void 0 && func0.call(data1, "properties")) {
                                let data17 = data1.properties;
                                const _errs43 = errors;
                                if (errors === _errs43) {
                                  if (data17 && typeof data17 == "object" && !Array.isArray(data17)) {
                                    let missing5;
                                    if ((data17.fontSize === void 0 || !func0.call(data17, "fontSize")) && (missing5 = "fontSize") || (data17.haloWidth === void 0 || !func0.call(data17, "haloWidth")) && (missing5 = "haloWidth")) {
                                      validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/required", keyword: "required", params: { missingProperty: missing5 }, message: "must have required property '" + missing5 + "'" }];
                                      return false;
                                    } else {
                                      if (data17.fontSize !== void 0 && func0.call(data17, "fontSize")) {
                                        let data18 = data17.fontSize;
                                        const _errs46 = errors;
                                        if (errors === _errs46) {
                                          if (typeof data18 == "number" && isFinite(data18)) {
                                            if (data18 < 0 || isNaN(data18)) {
                                              validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/fontSize", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/fontSize/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                              return false;
                                            }
                                          } else {
                                            validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/fontSize", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/fontSize/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                            return false;
                                          }
                                        }
                                        var valid14 = _errs46 === errors;
                                      } else {
                                        var valid14 = true;
                                      }
                                      if (valid14) {
                                        if (data17.haloWidth !== void 0 && func0.call(data17, "haloWidth")) {
                                          let data19 = data17.haloWidth;
                                          const _errs48 = errors;
                                          if (errors === _errs48) {
                                            if (typeof data19 == "number" && isFinite(data19)) {
                                              if (data19 < 0 || isNaN(data19)) {
                                                validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/haloWidth", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/haloWidth/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                                return false;
                                              }
                                            } else {
                                              validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/haloWidth", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/haloWidth/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                          }
                                          var valid14 = _errs48 === errors;
                                        } else {
                                          var valid14 = true;
                                        }
                                        if (valid14) {
                                          if (data17.letterSpacing !== void 0 && func0.call(data17, "letterSpacing")) {
                                            let data20 = data17.letterSpacing;
                                            const _errs50 = errors;
                                            if (!(typeof data20 == "number" && isFinite(data20))) {
                                              validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/letterSpacing", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/letterSpacing/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                            var valid14 = _errs50 === errors;
                                          } else {
                                            var valid14 = true;
                                          }
                                          if (valid14) {
                                            if (data17.angle !== void 0 && func0.call(data17, "angle")) {
                                              let data21 = data17.angle;
                                              const _errs52 = errors;
                                              if (!(typeof data21 == "number" && isFinite(data21))) {
                                                validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/angle", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/angle/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                                return false;
                                              }
                                              var valid14 = _errs52 === errors;
                                            } else {
                                              var valid14 = true;
                                            }
                                            if (valid14) {
                                              if (data17.areaLabelOffset !== void 0 && func0.call(data17, "areaLabelOffset")) {
                                                let data22 = data17.areaLabelOffset;
                                                const _errs54 = errors;
                                                if (errors === _errs54) {
                                                  if (Array.isArray(data22)) {
                                                    if (data22.length > 2) {
                                                      validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/areaLabelOffset", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/areaLabelOffset/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" }];
                                                      return false;
                                                    } else {
                                                      if (data22.length < 2) {
                                                        validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/areaLabelOffset", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/areaLabelOffset/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                                                        return false;
                                                      } else {
                                                        var valid15 = true;
                                                        const len7 = data22.length;
                                                        for (let i7 = 0; i7 < len7; i7++) {
                                                          let data23 = data22[i7];
                                                          const _errs56 = errors;
                                                          if (!(typeof data23 == "number" && isFinite(data23))) {
                                                            validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/areaLabelOffset/" + i7, schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/areaLabelOffset/items/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                                            return false;
                                                          }
                                                          var valid15 = _errs56 === errors;
                                                          if (!valid15) {
                                                            break;
                                                          }
                                                        }
                                                      }
                                                    }
                                                  } else {
                                                    validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties/areaLabelOffset", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/properties/areaLabelOffset/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                                    return false;
                                                  }
                                                }
                                                var valid14 = _errs54 === errors;
                                              } else {
                                                var valid14 = true;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  } else {
                                    validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0 + "/properties", schemaPath: "#/$defs/PreparedLocationFeatureV1/properties/properties/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                    return false;
                                  }
                                }
                                var valid3 = _errs43 === errors;
                              } else {
                                var valid3 = true;
                              }
                            }
                          }
                        }
                      }
                    } else {
                      validate87.errors = [{ instancePath: instancePath + "/geometry/" + i0, schemaPath: "#/$defs/PreparedLocationFeatureV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                      return false;
                    }
                  }
                  var valid1 = _errs4 === errors;
                  if (!valid1) {
                    break;
                  }
                }
              } else {
                validate87.errors = [{ instancePath: instancePath + "/geometry", schemaPath: "#/properties/geometry/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
          }
        }
      } else {
        validate87.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate87.errors = vErrors;
    return errors === 0;
  }
  var PreparedMarkerSetV1 = validate89;
  function validate89(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (Array.isArray(data)) {
        var valid0 = true;
        const len0 = data.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data0 = data[i0];
          const _errs1 = errors;
          const _errs2 = errors;
          if (errors === _errs2) {
            if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
              let missing0;
              if ((data0.coordinates === void 0 || !func0.call(data0, "coordinates")) && (missing0 = "coordinates") || (data0.offset === void 0 || !func0.call(data0, "offset")) && (missing0 = "offset") || (data0.threshold === void 0 || !func0.call(data0, "threshold")) && (missing0 = "threshold") || (data0.style === void 0 || !func0.call(data0, "style")) && (missing0 = "style")) {
                validate89.errors = [{ instancePath: instancePath + "/" + i0, schemaPath: "#/$defs/PreparedMarkerV1/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
                return false;
              } else {
                if (data0.coordinates !== void 0 && func0.call(data0, "coordinates")) {
                  let data1 = data0.coordinates;
                  const _errs5 = errors;
                  if (errors === _errs5) {
                    if (Array.isArray(data1)) {
                      if (data1.length > 2) {
                        validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/coordinates", schemaPath: "#/$defs/PreparedMarkerV1/properties/coordinates/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" }];
                        return false;
                      } else {
                        if (data1.length < 2) {
                          validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/coordinates", schemaPath: "#/$defs/PreparedMarkerV1/properties/coordinates/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                          return false;
                        } else {
                          var valid3 = true;
                          const len1 = data1.length;
                          for (let i1 = 0; i1 < len1; i1++) {
                            let data2 = data1[i1];
                            const _errs7 = errors;
                            if (!(typeof data2 == "number" && isFinite(data2))) {
                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/coordinates/" + i1, schemaPath: "#/$defs/PreparedMarkerV1/properties/coordinates/items/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                              return false;
                            }
                            var valid3 = _errs7 === errors;
                            if (!valid3) {
                              break;
                            }
                          }
                        }
                      }
                    } else {
                      validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/coordinates", schemaPath: "#/$defs/PreparedMarkerV1/properties/coordinates/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid2 = _errs5 === errors;
                } else {
                  var valid2 = true;
                }
                if (valid2) {
                  if (data0.offset !== void 0 && func0.call(data0, "offset")) {
                    let data3 = data0.offset;
                    const _errs9 = errors;
                    if (errors === _errs9) {
                      if (Array.isArray(data3)) {
                        if (data3.length > 2) {
                          validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/offset", schemaPath: "#/$defs/PreparedMarkerV1/properties/offset/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" }];
                          return false;
                        } else {
                          if (data3.length < 2) {
                            validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/offset", schemaPath: "#/$defs/PreparedMarkerV1/properties/offset/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                            return false;
                          } else {
                            var valid4 = true;
                            const len2 = data3.length;
                            for (let i2 = 0; i2 < len2; i2++) {
                              let data4 = data3[i2];
                              const _errs11 = errors;
                              if (!(typeof data4 == "number" && isFinite(data4))) {
                                validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/offset/" + i2, schemaPath: "#/$defs/PreparedMarkerV1/properties/offset/items/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                return false;
                              }
                              var valid4 = _errs11 === errors;
                              if (!valid4) {
                                break;
                              }
                            }
                          }
                        }
                      } else {
                        validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/offset", schemaPath: "#/$defs/PreparedMarkerV1/properties/offset/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                        return false;
                      }
                    }
                    var valid2 = _errs9 === errors;
                  } else {
                    var valid2 = true;
                  }
                  if (valid2) {
                    if (data0.threshold !== void 0 && func0.call(data0, "threshold")) {
                      let data5 = data0.threshold;
                      const _errs13 = errors;
                      if (errors === _errs13) {
                        if (typeof data5 == "number" && isFinite(data5)) {
                          if (data5 > 24 || isNaN(data5)) {
                            validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/threshold", schemaPath: "#/$defs/PreparedMarkerV1/properties/threshold/maximum", keyword: "maximum", params: { comparison: "<=", limit: 24 }, message: "must be <= 24" }];
                            return false;
                          } else {
                            if (data5 < -2 || isNaN(data5)) {
                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/threshold", schemaPath: "#/$defs/PreparedMarkerV1/properties/threshold/minimum", keyword: "minimum", params: { comparison: ">=", limit: -2 }, message: "must be >= -2" }];
                              return false;
                            }
                          }
                        } else {
                          validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/threshold", schemaPath: "#/$defs/PreparedMarkerV1/properties/threshold/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                          return false;
                        }
                      }
                      var valid2 = _errs13 === errors;
                    } else {
                      var valid2 = true;
                    }
                    if (valid2) {
                      if (data0.connectorCoordinates !== void 0 && func0.call(data0, "connectorCoordinates")) {
                        let data6 = data0.connectorCoordinates;
                        const _errs15 = errors;
                        if (errors === _errs15) {
                          if (Array.isArray(data6)) {
                            if (data6.length > 2) {
                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/connectorCoordinates", schemaPath: "#/$defs/PreparedMarkerV1/properties/connectorCoordinates/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" }];
                              return false;
                            } else {
                              if (data6.length < 2) {
                                validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/connectorCoordinates", schemaPath: "#/$defs/PreparedMarkerV1/properties/connectorCoordinates/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                                return false;
                              } else {
                                var valid5 = true;
                                const len3 = data6.length;
                                for (let i3 = 0; i3 < len3; i3++) {
                                  let data7 = data6[i3];
                                  const _errs17 = errors;
                                  if (errors === _errs17) {
                                    if (Array.isArray(data7)) {
                                      if (data7.length > 2) {
                                        validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/connectorCoordinates/" + i3, schemaPath: "#/$defs/PreparedMarkerV1/properties/connectorCoordinates/items/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" }];
                                        return false;
                                      } else {
                                        if (data7.length < 2) {
                                          validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/connectorCoordinates/" + i3, schemaPath: "#/$defs/PreparedMarkerV1/properties/connectorCoordinates/items/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                                          return false;
                                        } else {
                                          var valid6 = true;
                                          const len4 = data7.length;
                                          for (let i4 = 0; i4 < len4; i4++) {
                                            let data8 = data7[i4];
                                            const _errs19 = errors;
                                            if (!(typeof data8 == "number" && isFinite(data8))) {
                                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/connectorCoordinates/" + i3 + "/" + i4, schemaPath: "#/$defs/PreparedMarkerV1/properties/connectorCoordinates/items/items/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                            var valid6 = _errs19 === errors;
                                            if (!valid6) {
                                              break;
                                            }
                                          }
                                        }
                                      }
                                    } else {
                                      validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/connectorCoordinates/" + i3, schemaPath: "#/$defs/PreparedMarkerV1/properties/connectorCoordinates/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                      return false;
                                    }
                                  }
                                  var valid5 = _errs17 === errors;
                                  if (!valid5) {
                                    break;
                                  }
                                }
                              }
                            }
                          } else {
                            validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/connectorCoordinates", schemaPath: "#/$defs/PreparedMarkerV1/properties/connectorCoordinates/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid2 = _errs15 === errors;
                      } else {
                        var valid2 = true;
                      }
                      if (valid2) {
                        if (data0.style !== void 0 && func0.call(data0, "style")) {
                          let data9 = data0.style;
                          const _errs21 = errors;
                          if (errors === _errs21) {
                            if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                              let missing1;
                              if ((data9.width === void 0 || !func0.call(data9, "width")) && (missing1 = "width") || (data9.height === void 0 || !func0.call(data9, "height")) && (missing1 = "height") || (data9.padding === void 0 || !func0.call(data9, "padding")) && (missing1 = "padding") || (data9.fontSize === void 0 || !func0.call(data9, "fontSize")) && (missing1 = "fontSize") || (data9.fontWeight === void 0 || !func0.call(data9, "fontWeight")) && (missing1 = "fontWeight") || (data9.shape === void 0 || !func0.call(data9, "shape")) && (missing1 = "shape") || (data9.text === void 0 || !func0.call(data9, "text")) && (missing1 = "text") || (data9.color === void 0 || !func0.call(data9, "color")) && (missing1 = "color") || (data9.textColor === void 0 || !func0.call(data9, "textColor")) && (missing1 = "textColor") || (data9.iconURL === void 0 || !func0.call(data9, "iconURL")) && (missing1 = "iconURL") || (data9.variant === void 0 || !func0.call(data9, "variant")) && (missing1 = "variant")) {
                                validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                                return false;
                              } else {
                                if (data9.width !== void 0 && func0.call(data9, "width")) {
                                  let data10 = data9.width;
                                  const _errs24 = errors;
                                  if (errors === _errs24) {
                                    if (typeof data10 == "number" && isFinite(data10)) {
                                      if (data10 > 128 || isNaN(data10)) {
                                        validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/width", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/width/maximum", keyword: "maximum", params: { comparison: "<=", limit: 128 }, message: "must be <= 128" }];
                                        return false;
                                      } else {
                                        if (data10 < 8 || isNaN(data10)) {
                                          validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/width", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/width/minimum", keyword: "minimum", params: { comparison: ">=", limit: 8 }, message: "must be >= 8" }];
                                          return false;
                                        }
                                      }
                                    } else {
                                      validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/width", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/width/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                      return false;
                                    }
                                  }
                                  var valid7 = _errs24 === errors;
                                } else {
                                  var valid7 = true;
                                }
                                if (valid7) {
                                  if (data9.height !== void 0 && func0.call(data9, "height")) {
                                    let data11 = data9.height;
                                    const _errs26 = errors;
                                    if (errors === _errs26) {
                                      if (typeof data11 == "number" && isFinite(data11)) {
                                        if (data11 > 184.88888888888889 || isNaN(data11)) {
                                          validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/height", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/height/maximum", keyword: "maximum", params: { comparison: "<=", limit: 184.88888888888889 }, message: "must be <= 184.88888888888889" }];
                                          return false;
                                        } else {
                                          if (data11 < 8 || isNaN(data11)) {
                                            validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/height", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/height/minimum", keyword: "minimum", params: { comparison: ">=", limit: 8 }, message: "must be >= 8" }];
                                            return false;
                                          }
                                        }
                                      } else {
                                        validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/height", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/height/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                        return false;
                                      }
                                    }
                                    var valid7 = _errs26 === errors;
                                  } else {
                                    var valid7 = true;
                                  }
                                  if (valid7) {
                                    if (data9.padding !== void 0 && func0.call(data9, "padding")) {
                                      const _errs28 = errors;
                                      if (6 !== data9.padding) {
                                        validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/padding", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/padding/const", keyword: "const", params: { allowedValue: 6 }, message: "must be equal to constant" }];
                                        return false;
                                      }
                                      var valid7 = _errs28 === errors;
                                    } else {
                                      var valid7 = true;
                                    }
                                    if (valid7) {
                                      if (data9.fontSize !== void 0 && func0.call(data9, "fontSize")) {
                                        let data13 = data9.fontSize;
                                        const _errs29 = errors;
                                        if (errors === _errs29) {
                                          if (typeof data13 == "number" && isFinite(data13)) {
                                            if (data13 <= 0 || isNaN(data13)) {
                                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/fontSize", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/fontSize/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                              return false;
                                            }
                                          } else {
                                            validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/fontSize", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/fontSize/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                            return false;
                                          }
                                        }
                                        var valid7 = _errs29 === errors;
                                      } else {
                                        var valid7 = true;
                                      }
                                      if (valid7) {
                                        if (data9.fontWeight !== void 0 && func0.call(data9, "fontWeight")) {
                                          let data14 = data9.fontWeight;
                                          const _errs31 = errors;
                                          if (errors === _errs31) {
                                            if (typeof data14 == "number" && isFinite(data14)) {
                                              if (data14 <= 0 || isNaN(data14)) {
                                                validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/fontWeight", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/fontWeight/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                                                return false;
                                              }
                                            } else {
                                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/fontWeight", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/fontWeight/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                              return false;
                                            }
                                          }
                                          var valid7 = _errs31 === errors;
                                        } else {
                                          var valid7 = true;
                                        }
                                        if (valid7) {
                                          if (data9.shape !== void 0 && func0.call(data9, "shape")) {
                                            const _errs33 = errors;
                                            if (typeof data9.shape !== "string") {
                                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/shape", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/shape/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                              return false;
                                            }
                                            var valid7 = _errs33 === errors;
                                          } else {
                                            var valid7 = true;
                                          }
                                          if (valid7) {
                                            if (data9.text !== void 0 && func0.call(data9, "text")) {
                                              const _errs35 = errors;
                                              if (typeof data9.text !== "string") {
                                                validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/text", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                return false;
                                              }
                                              var valid7 = _errs35 === errors;
                                            } else {
                                              var valid7 = true;
                                            }
                                            if (valid7) {
                                              if (data9.color !== void 0 && func0.call(data9, "color")) {
                                                const _errs37 = errors;
                                                if (typeof data9.color !== "string") {
                                                  validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/color", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/color/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                  return false;
                                                }
                                                var valid7 = _errs37 === errors;
                                              } else {
                                                var valid7 = true;
                                              }
                                              if (valid7) {
                                                if (data9.textColor !== void 0 && func0.call(data9, "textColor")) {
                                                  const _errs39 = errors;
                                                  if (typeof data9.textColor !== "string") {
                                                    validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/textColor", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/textColor/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                    return false;
                                                  }
                                                  var valid7 = _errs39 === errors;
                                                } else {
                                                  var valid7 = true;
                                                }
                                                if (valid7) {
                                                  if (data9.iconURL !== void 0 && func0.call(data9, "iconURL")) {
                                                    const _errs41 = errors;
                                                    if (typeof data9.iconURL !== "string") {
                                                      validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/iconURL", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/iconURL/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                      return false;
                                                    }
                                                    var valid7 = _errs41 === errors;
                                                  } else {
                                                    var valid7 = true;
                                                  }
                                                  if (valid7) {
                                                    if (data9.variant !== void 0 && func0.call(data9, "variant")) {
                                                      const _errs43 = errors;
                                                      if (typeof data9.variant !== "string") {
                                                        validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style/variant", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/properties/variant/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                        return false;
                                                      }
                                                      var valid7 = _errs43 === errors;
                                                    } else {
                                                      var valid7 = true;
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            } else {
                              validate89.errors = [{ instancePath: instancePath + "/" + i0 + "/style", schemaPath: "#/$defs/PreparedMarkerV1/properties/style/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                              return false;
                            }
                          }
                          var valid2 = _errs21 === errors;
                        } else {
                          var valid2 = true;
                        }
                      }
                    }
                  }
                }
              }
            } else {
              validate89.errors = [{ instancePath: instancePath + "/" + i0, schemaPath: "#/$defs/PreparedMarkerV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
              return false;
            }
          }
          var valid0 = _errs1 === errors;
          if (!valid0) {
            break;
          }
        }
      } else {
        validate89.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
        return false;
      }
    }
    validate89.errors = vErrors;
    return errors === 0;
  }
  var CameraCommandOptionsV1 = validate90;
  var schema82 = { "type": "object", "properties": { "animate": { "type": ["boolean", "null"] }, "duration": { "type": ["number", "null"], "minimum": 0 }, "motion": { "type": ["object", "null"], "properties": { "moving": { "type": ["boolean", "null"] }, "zooming": { "type": ["boolean", "null"] } }, "additionalProperties": true } }, "additionalProperties": true };
  function validate90(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.animate !== void 0 && func0.call(data, "animate")) {
          let data0 = data.animate;
          const _errs2 = errors;
          if (typeof data0 !== "boolean" && data0 !== null) {
            validate90.errors = [{ instancePath: instancePath + "/animate", schemaPath: "#/properties/animate/type", keyword: "type", params: { type: schema82.properties.animate.type }, message: "must be boolean,null" }];
            return false;
          }
          var valid0 = _errs2 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.duration !== void 0 && func0.call(data, "duration")) {
            let data1 = data.duration;
            const _errs4 = errors;
            if (!(typeof data1 == "number" && isFinite(data1)) && data1 !== null) {
              validate90.errors = [{ instancePath: instancePath + "/duration", schemaPath: "#/properties/duration/type", keyword: "type", params: { type: schema82.properties.duration.type }, message: "must be number,null" }];
              return false;
            }
            if (errors === _errs4) {
              if (typeof data1 == "number" && isFinite(data1)) {
                if (data1 < 0 || isNaN(data1)) {
                  validate90.errors = [{ instancePath: instancePath + "/duration", schemaPath: "#/properties/duration/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                  return false;
                }
              }
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.motion !== void 0 && func0.call(data, "motion")) {
              let data2 = data.motion;
              const _errs6 = errors;
              if (!(data2 && typeof data2 == "object" && !Array.isArray(data2)) && data2 !== null) {
                validate90.errors = [{ instancePath: instancePath + "/motion", schemaPath: "#/properties/motion/type", keyword: "type", params: { type: schema82.properties.motion.type }, message: "must be object,null" }];
                return false;
              }
              if (errors === _errs6) {
                if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
                  if (data2.moving !== void 0 && func0.call(data2, "moving")) {
                    let data3 = data2.moving;
                    const _errs9 = errors;
                    if (typeof data3 !== "boolean" && data3 !== null) {
                      validate90.errors = [{ instancePath: instancePath + "/motion/moving", schemaPath: "#/properties/motion/properties/moving/type", keyword: "type", params: { type: schema82.properties.motion.properties.moving.type }, message: "must be boolean,null" }];
                      return false;
                    }
                    var valid1 = _errs9 === errors;
                  } else {
                    var valid1 = true;
                  }
                  if (valid1) {
                    if (data2.zooming !== void 0 && func0.call(data2, "zooming")) {
                      let data4 = data2.zooming;
                      const _errs11 = errors;
                      if (typeof data4 !== "boolean" && data4 !== null) {
                        validate90.errors = [{ instancePath: instancePath + "/motion/zooming", schemaPath: "#/properties/motion/properties/zooming/type", keyword: "type", params: { type: schema82.properties.motion.properties.zooming.type }, message: "must be boolean,null" }];
                        return false;
                      }
                      var valid1 = _errs11 === errors;
                    } else {
                      var valid1 = true;
                    }
                  }
                }
              }
              var valid0 = _errs6 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      } else {
        validate90.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate90.errors = vErrors;
    return errors === 0;
  }
  var NativeZoomRangeV1 = validate91;
  function validate91(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.minimum === void 0 || !func0.call(data, "minimum")) && (missing0 = "minimum") || (data.maximum === void 0 || !func0.call(data, "maximum")) && (missing0 = "maximum")) {
          validate91.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.minimum !== void 0 && func0.call(data, "minimum")) {
            let data0 = data.minimum;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 == "number" && isFinite(data0)) {
                if (data0 > 24 || isNaN(data0)) {
                  validate91.errors = [{ instancePath: instancePath + "/minimum", schemaPath: "#/properties/minimum/maximum", keyword: "maximum", params: { comparison: "<=", limit: 24 }, message: "must be <= 24" }];
                  return false;
                } else {
                  if (data0 < -2 || isNaN(data0)) {
                    validate91.errors = [{ instancePath: instancePath + "/minimum", schemaPath: "#/properties/minimum/minimum", keyword: "minimum", params: { comparison: ">=", limit: -2 }, message: "must be >= -2" }];
                    return false;
                  }
                }
              } else {
                validate91.errors = [{ instancePath: instancePath + "/minimum", schemaPath: "#/properties/minimum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.maximum !== void 0 && func0.call(data, "maximum")) {
              let data1 = data.maximum;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 == "number" && isFinite(data1)) {
                  if (data1 > 24 || isNaN(data1)) {
                    validate91.errors = [{ instancePath: instancePath + "/maximum", schemaPath: "#/properties/maximum/maximum", keyword: "maximum", params: { comparison: "<=", limit: 24 }, message: "must be <= 24" }];
                    return false;
                  } else {
                    if (data1 < -2 || isNaN(data1)) {
                      validate91.errors = [{ instancePath: instancePath + "/maximum", schemaPath: "#/properties/maximum/minimum", keyword: "minimum", params: { comparison: ">=", limit: -2 }, message: "must be >= -2" }];
                      return false;
                    }
                  }
                } else {
                  validate91.errors = [{ instancePath: instancePath + "/maximum", schemaPath: "#/properties/maximum/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      } else {
        validate91.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate91.errors = vErrors;
    return errors === 0;
  }
  var NativeCameraV1 = validate92;
  function validate92(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.center === void 0 || !func0.call(data, "center")) && (missing0 = "center") || (data.zoom === void 0 || !func0.call(data, "zoom")) && (missing0 = "zoom") || (data.bearing === void 0 || !func0.call(data, "bearing")) && (missing0 = "bearing") || (data.pitch === void 0 || !func0.call(data, "pitch")) && (missing0 = "pitch") || (data.padding === void 0 || !func0.call(data, "padding")) && (missing0 = "padding")) {
          validate92.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.center !== void 0 && func0.call(data, "center")) {
            let data0 = data.center;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                if (data0.length > 2) {
                  validate92.errors = [{ instancePath: instancePath + "/center", schemaPath: "#/properties/center/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" }];
                  return false;
                } else {
                  if (data0.length < 2) {
                    validate92.errors = [{ instancePath: instancePath + "/center", schemaPath: "#/properties/center/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                    return false;
                  } else {
                    const len0 = data0.length;
                    if (len0 > 0) {
                      let data1 = data0[0];
                      const _errs4 = errors;
                      if (!(typeof data1 == "number" && isFinite(data1))) {
                        validate92.errors = [{ instancePath: instancePath + "/center/0", schemaPath: "#/properties/center/items/0/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                        return false;
                      }
                      var valid1 = _errs4 === errors;
                    }
                    if (valid1) {
                      if (len0 > 1) {
                        let data2 = data0[1];
                        const _errs6 = errors;
                        if (errors === _errs6) {
                          if (typeof data2 == "number" && isFinite(data2)) {
                            if (data2 > 90 || isNaN(data2)) {
                              validate92.errors = [{ instancePath: instancePath + "/center/1", schemaPath: "#/properties/center/items/1/maximum", keyword: "maximum", params: { comparison: "<=", limit: 90 }, message: "must be <= 90" }];
                              return false;
                            } else {
                              if (data2 < -90 || isNaN(data2)) {
                                validate92.errors = [{ instancePath: instancePath + "/center/1", schemaPath: "#/properties/center/items/1/minimum", keyword: "minimum", params: { comparison: ">=", limit: -90 }, message: "must be >= -90" }];
                                return false;
                              }
                            }
                          } else {
                            validate92.errors = [{ instancePath: instancePath + "/center/1", schemaPath: "#/properties/center/items/1/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                            return false;
                          }
                        }
                        var valid1 = _errs6 === errors;
                      }
                    }
                  }
                }
              } else {
                validate92.errors = [{ instancePath: instancePath + "/center", schemaPath: "#/properties/center/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.zoom !== void 0 && func0.call(data, "zoom")) {
              let data3 = data.zoom;
              const _errs8 = errors;
              if (errors === _errs8) {
                if (typeof data3 == "number" && isFinite(data3)) {
                  if (data3 > 24 || isNaN(data3)) {
                    validate92.errors = [{ instancePath: instancePath + "/zoom", schemaPath: "#/properties/zoom/maximum", keyword: "maximum", params: { comparison: "<=", limit: 24 }, message: "must be <= 24" }];
                    return false;
                  } else {
                    if (data3 < -2 || isNaN(data3)) {
                      validate92.errors = [{ instancePath: instancePath + "/zoom", schemaPath: "#/properties/zoom/minimum", keyword: "minimum", params: { comparison: ">=", limit: -2 }, message: "must be >= -2" }];
                      return false;
                    }
                  }
                } else {
                  validate92.errors = [{ instancePath: instancePath + "/zoom", schemaPath: "#/properties/zoom/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                  return false;
                }
              }
              var valid0 = _errs8 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.bearing !== void 0 && func0.call(data, "bearing")) {
                const _errs10 = errors;
                if (0 !== data.bearing) {
                  validate92.errors = [{ instancePath: instancePath + "/bearing", schemaPath: "#/properties/bearing/const", keyword: "const", params: { allowedValue: 0 }, message: "must be equal to constant" }];
                  return false;
                }
                var valid0 = _errs10 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.pitch !== void 0 && func0.call(data, "pitch")) {
                  const _errs11 = errors;
                  if (0 !== data.pitch) {
                    validate92.errors = [{ instancePath: instancePath + "/pitch", schemaPath: "#/properties/pitch/const", keyword: "const", params: { allowedValue: 0 }, message: "must be equal to constant" }];
                    return false;
                  }
                  var valid0 = _errs11 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.padding !== void 0 && func0.call(data, "padding")) {
                    let data6 = data.padding;
                    const _errs12 = errors;
                    if (errors === _errs12) {
                      if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                        let missing1;
                        if ((data6.left === void 0 || !func0.call(data6, "left")) && (missing1 = "left") || (data6.right === void 0 || !func0.call(data6, "right")) && (missing1 = "right") || (data6.top === void 0 || !func0.call(data6, "top")) && (missing1 = "top") || (data6.bottom === void 0 || !func0.call(data6, "bottom")) && (missing1 = "bottom")) {
                          validate92.errors = [{ instancePath: instancePath + "/padding", schemaPath: "#/properties/padding/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                          return false;
                        } else {
                          if (data6.left !== void 0 && func0.call(data6, "left")) {
                            let data7 = data6.left;
                            const _errs15 = errors;
                            if (errors === _errs15) {
                              if (typeof data7 == "number" && isFinite(data7)) {
                                if (data7 < 0 || isNaN(data7)) {
                                  validate92.errors = [{ instancePath: instancePath + "/padding/left", schemaPath: "#/properties/padding/properties/left/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                  return false;
                                }
                              } else {
                                validate92.errors = [{ instancePath: instancePath + "/padding/left", schemaPath: "#/properties/padding/properties/left/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                return false;
                              }
                            }
                            var valid2 = _errs15 === errors;
                          } else {
                            var valid2 = true;
                          }
                          if (valid2) {
                            if (data6.right !== void 0 && func0.call(data6, "right")) {
                              let data8 = data6.right;
                              const _errs17 = errors;
                              if (errors === _errs17) {
                                if (typeof data8 == "number" && isFinite(data8)) {
                                  if (data8 < 0 || isNaN(data8)) {
                                    validate92.errors = [{ instancePath: instancePath + "/padding/right", schemaPath: "#/properties/padding/properties/right/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                    return false;
                                  }
                                } else {
                                  validate92.errors = [{ instancePath: instancePath + "/padding/right", schemaPath: "#/properties/padding/properties/right/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                  return false;
                                }
                              }
                              var valid2 = _errs17 === errors;
                            } else {
                              var valid2 = true;
                            }
                            if (valid2) {
                              if (data6.top !== void 0 && func0.call(data6, "top")) {
                                let data9 = data6.top;
                                const _errs19 = errors;
                                if (errors === _errs19) {
                                  if (typeof data9 == "number" && isFinite(data9)) {
                                    if (data9 < 0 || isNaN(data9)) {
                                      validate92.errors = [{ instancePath: instancePath + "/padding/top", schemaPath: "#/properties/padding/properties/top/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                      return false;
                                    }
                                  } else {
                                    validate92.errors = [{ instancePath: instancePath + "/padding/top", schemaPath: "#/properties/padding/properties/top/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                    return false;
                                  }
                                }
                                var valid2 = _errs19 === errors;
                              } else {
                                var valid2 = true;
                              }
                              if (valid2) {
                                if (data6.bottom !== void 0 && func0.call(data6, "bottom")) {
                                  let data10 = data6.bottom;
                                  const _errs21 = errors;
                                  if (errors === _errs21) {
                                    if (typeof data10 == "number" && isFinite(data10)) {
                                      if (data10 < 0 || isNaN(data10)) {
                                        validate92.errors = [{ instancePath: instancePath + "/padding/bottom", schemaPath: "#/properties/padding/properties/bottom/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                        return false;
                                      }
                                    } else {
                                      validate92.errors = [{ instancePath: instancePath + "/padding/bottom", schemaPath: "#/properties/padding/properties/bottom/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                      return false;
                                    }
                                  }
                                  var valid2 = _errs21 === errors;
                                } else {
                                  var valid2 = true;
                                }
                              }
                            }
                          }
                        }
                      } else {
                        validate92.errors = [{ instancePath: instancePath + "/padding", schemaPath: "#/properties/padding/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                        return false;
                      }
                    }
                    var valid0 = _errs12 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      } else {
        validate92.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate92.errors = vErrors;
    return errors === 0;
  }
  function validate93(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    const _errs1 = errors;
    if (!validate19(data, { instancePath, parentData, parentDataProperty, rootData })) {
      vErrors = vErrors === null ? validate19.errors : vErrors.concat(validate19.errors);
      errors = vErrors.length;
    }
    var valid0 = _errs1 === errors;
    if (valid0) {
      const _errs2 = errors;
      if (errors === _errs2) {
        if (data && typeof data == "object" && !Array.isArray(data)) {
          let missing0;
          if ((data.grid === void 0 || !func0.call(data, "grid")) && (missing0 = "grid") || (data.scaleFactor === void 0 || !func0.call(data, "scaleFactor")) && (missing0 = "scaleFactor")) {
            validate93.errors = [{ instancePath, schemaPath: "#/allOf/1/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
            return false;
          } else {
            if (data.grid !== void 0 && func0.call(data, "grid")) {
              let data0 = data.grid;
              const _errs4 = errors;
              const _errs5 = errors;
              if (errors === _errs5) {
                if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
                  let missing1;
                  if ((data0.source === void 0 || !func0.call(data0, "source")) && (missing1 = "source") || (data0.originX === void 0 || !func0.call(data0, "originX")) && (missing1 = "originX") || (data0.originY === void 0 || !func0.call(data0, "originY")) && (missing1 = "originY")) {
                    validate93.errors = [{ instancePath: instancePath + "/grid", schemaPath: "#/$defs/GridV1/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                    return false;
                  } else {
                    if (data0.source !== void 0 && func0.call(data0, "source")) {
                      let data1 = data0.source;
                      const _errs8 = errors;
                      if (errors === _errs8) {
                        if (typeof data1 === "string") {
                          if (func61(data1) < 1) {
                            validate93.errors = [{ instancePath: instancePath + "/grid/source", schemaPath: "#/$defs/GridV1/properties/source/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                            return false;
                          }
                        } else {
                          validate93.errors = [{ instancePath: instancePath + "/grid/source", schemaPath: "#/$defs/GridV1/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                      }
                      var valid3 = _errs8 === errors;
                    } else {
                      var valid3 = true;
                    }
                    if (valid3) {
                      if (data0.originX !== void 0 && func0.call(data0, "originX")) {
                        let data2 = data0.originX;
                        const _errs10 = errors;
                        if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                          validate93.errors = [{ instancePath: instancePath + "/grid/originX", schemaPath: "#/$defs/GridV1/properties/originX/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                          return false;
                        }
                        var valid3 = _errs10 === errors;
                      } else {
                        var valid3 = true;
                      }
                      if (valid3) {
                        if (data0.originY !== void 0 && func0.call(data0, "originY")) {
                          let data3 = data0.originY;
                          const _errs12 = errors;
                          if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)) && isFinite(data3))) {
                            validate93.errors = [{ instancePath: instancePath + "/grid/originY", schemaPath: "#/$defs/GridV1/properties/originY/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                            return false;
                          }
                          var valid3 = _errs12 === errors;
                        } else {
                          var valid3 = true;
                        }
                        if (valid3) {
                          if (data0.zoom !== void 0 && func0.call(data0, "zoom")) {
                            let data4 = data0.zoom;
                            const _errs14 = errors;
                            if (!(typeof data4 == "number" && (!(data4 % 1) && !isNaN(data4)) && isFinite(data4)) && data4 !== null) {
                              validate93.errors = [{ instancePath: instancePath + "/grid/zoom", schemaPath: "#/$defs/GridV1/properties/zoom/type", keyword: "type", params: { type: schema20.properties.zoom.type }, message: "must be integer,null" }];
                              return false;
                            }
                            if (errors === _errs14) {
                              if (typeof data4 == "number" && isFinite(data4)) {
                                if (data4 > 30 || isNaN(data4)) {
                                  validate93.errors = [{ instancePath: instancePath + "/grid/zoom", schemaPath: "#/$defs/GridV1/properties/zoom/maximum", keyword: "maximum", params: { comparison: "<=", limit: 30 }, message: "must be <= 30" }];
                                  return false;
                                } else {
                                  if (data4 < 0 || isNaN(data4)) {
                                    validate93.errors = [{ instancePath: instancePath + "/grid/zoom", schemaPath: "#/$defs/GridV1/properties/zoom/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                    return false;
                                  }
                                }
                              }
                            }
                            var valid3 = _errs14 === errors;
                          } else {
                            var valid3 = true;
                          }
                          if (valid3) {
                            if (data0.bounds !== void 0 && func0.call(data0, "bounds")) {
                              let data5 = data0.bounds;
                              const _errs16 = errors;
                              const _errs17 = errors;
                              let valid4 = false;
                              const _errs18 = errors;
                              if (errors === _errs18) {
                                if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                                  let missing2;
                                  if ((data5.minX === void 0 || !func0.call(data5, "minX")) && (missing2 = "minX") || (data5.minY === void 0 || !func0.call(data5, "minY")) && (missing2 = "minY") || (data5.maxX === void 0 || !func0.call(data5, "maxX")) && (missing2 = "maxX") || (data5.maxY === void 0 || !func0.call(data5, "maxY")) && (missing2 = "maxY")) {
                                    const err0 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" };
                                    if (vErrors === null) {
                                      vErrors = [err0];
                                    } else {
                                      vErrors.push(err0);
                                    }
                                    errors++;
                                  } else {
                                    if (data5.minX !== void 0 && func0.call(data5, "minX")) {
                                      let data6 = data5.minX;
                                      const _errs21 = errors;
                                      if (!(typeof data6 == "number" && (!(data6 % 1) && !isNaN(data6)) && isFinite(data6))) {
                                        const err1 = { instancePath: instancePath + "/grid/bounds/minX", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/minX/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                        if (vErrors === null) {
                                          vErrors = [err1];
                                        } else {
                                          vErrors.push(err1);
                                        }
                                        errors++;
                                      }
                                      var valid5 = _errs21 === errors;
                                    } else {
                                      var valid5 = true;
                                    }
                                    if (valid5) {
                                      if (data5.minY !== void 0 && func0.call(data5, "minY")) {
                                        let data7 = data5.minY;
                                        const _errs23 = errors;
                                        if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)) && isFinite(data7))) {
                                          const err2 = { instancePath: instancePath + "/grid/bounds/minY", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/minY/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                          if (vErrors === null) {
                                            vErrors = [err2];
                                          } else {
                                            vErrors.push(err2);
                                          }
                                          errors++;
                                        }
                                        var valid5 = _errs23 === errors;
                                      } else {
                                        var valid5 = true;
                                      }
                                      if (valid5) {
                                        if (data5.maxX !== void 0 && func0.call(data5, "maxX")) {
                                          let data8 = data5.maxX;
                                          const _errs25 = errors;
                                          if (!(typeof data8 == "number" && (!(data8 % 1) && !isNaN(data8)) && isFinite(data8))) {
                                            const err3 = { instancePath: instancePath + "/grid/bounds/maxX", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/maxX/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                            if (vErrors === null) {
                                              vErrors = [err3];
                                            } else {
                                              vErrors.push(err3);
                                            }
                                            errors++;
                                          }
                                          var valid5 = _errs25 === errors;
                                        } else {
                                          var valid5 = true;
                                        }
                                        if (valid5) {
                                          if (data5.maxY !== void 0 && func0.call(data5, "maxY")) {
                                            let data9 = data5.maxY;
                                            const _errs27 = errors;
                                            if (!(typeof data9 == "number" && (!(data9 % 1) && !isNaN(data9)) && isFinite(data9))) {
                                              const err4 = { instancePath: instancePath + "/grid/bounds/maxY", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/properties/maxY/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
                                              if (vErrors === null) {
                                                vErrors = [err4];
                                              } else {
                                                vErrors.push(err4);
                                              }
                                              errors++;
                                            }
                                            var valid5 = _errs27 === errors;
                                          } else {
                                            var valid5 = true;
                                          }
                                        }
                                      }
                                    }
                                  }
                                } else {
                                  const err5 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/0/type", keyword: "type", params: { type: "object" }, message: "must be object" };
                                  if (vErrors === null) {
                                    vErrors = [err5];
                                  } else {
                                    vErrors.push(err5);
                                  }
                                  errors++;
                                }
                              }
                              var _valid0 = _errs18 === errors;
                              valid4 = valid4 || _valid0;
                              if (!valid4) {
                                const _errs29 = errors;
                                if (data5 !== null) {
                                  const err6 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                  if (vErrors === null) {
                                    vErrors = [err6];
                                  } else {
                                    vErrors.push(err6);
                                  }
                                  errors++;
                                }
                                var _valid0 = _errs29 === errors;
                                valid4 = valid4 || _valid0;
                              }
                              if (!valid4) {
                                const err7 = { instancePath: instancePath + "/grid/bounds", schemaPath: "#/$defs/GridV1/properties/bounds/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                if (vErrors === null) {
                                  vErrors = [err7];
                                } else {
                                  vErrors.push(err7);
                                }
                                errors++;
                                validate93.errors = vErrors;
                                return false;
                              } else {
                                errors = _errs17;
                                if (vErrors !== null) {
                                  if (_errs17) {
                                    vErrors.length = _errs17;
                                  } else {
                                    vErrors = null;
                                  }
                                }
                              }
                              var valid3 = _errs16 === errors;
                            } else {
                              var valid3 = true;
                            }
                            if (valid3) {
                              if (data0.missing !== void 0 && func0.call(data0, "missing")) {
                                let data10 = data0.missing;
                                const _errs31 = errors;
                                if (errors === _errs31) {
                                  if (Array.isArray(data10)) {
                                    if (data10.length > 1e4) {
                                      validate93.errors = [{ instancePath: instancePath + "/grid/missing", schemaPath: "#/$defs/GridV1/properties/missing/maxItems", keyword: "maxItems", params: { limit: 1e4 }, message: "must NOT have more than 10000 items" }];
                                      return false;
                                    } else {
                                      var valid6 = true;
                                      const len0 = data10.length;
                                      for (let i0 = 0; i0 < len0; i0++) {
                                        let data11 = data10[i0];
                                        const _errs33 = errors;
                                        if (errors === _errs33) {
                                          if (Array.isArray(data11)) {
                                            if (data11.length > 2) {
                                              validate93.errors = [{ instancePath: instancePath + "/grid/missing/" + i0, schemaPath: "#/$defs/GridV1/properties/missing/items/maxItems", keyword: "maxItems", params: { limit: 2 }, message: "must NOT have more than 2 items" }];
                                              return false;
                                            } else {
                                              if (data11.length < 2) {
                                                validate93.errors = [{ instancePath: instancePath + "/grid/missing/" + i0, schemaPath: "#/$defs/GridV1/properties/missing/items/minItems", keyword: "minItems", params: { limit: 2 }, message: "must NOT have fewer than 2 items" }];
                                                return false;
                                              } else {
                                                var valid7 = true;
                                                const len1 = data11.length;
                                                for (let i1 = 0; i1 < len1; i1++) {
                                                  let data12 = data11[i1];
                                                  const _errs35 = errors;
                                                  if (!(typeof data12 == "number" && (!(data12 % 1) && !isNaN(data12)) && isFinite(data12))) {
                                                    validate93.errors = [{ instancePath: instancePath + "/grid/missing/" + i0 + "/" + i1, schemaPath: "#/$defs/GridV1/properties/missing/items/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                                    return false;
                                                  }
                                                  var valid7 = _errs35 === errors;
                                                  if (!valid7) {
                                                    break;
                                                  }
                                                }
                                              }
                                            }
                                          } else {
                                            validate93.errors = [{ instancePath: instancePath + "/grid/missing/" + i0, schemaPath: "#/$defs/GridV1/properties/missing/items/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                            return false;
                                          }
                                        }
                                        var valid6 = _errs33 === errors;
                                        if (!valid6) {
                                          break;
                                        }
                                      }
                                    }
                                  } else {
                                    validate93.errors = [{ instancePath: instancePath + "/grid/missing", schemaPath: "#/$defs/GridV1/properties/missing/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                    return false;
                                  }
                                }
                                var valid3 = _errs31 === errors;
                              } else {
                                var valid3 = true;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                } else {
                  validate93.errors = [{ instancePath: instancePath + "/grid", schemaPath: "#/$defs/GridV1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
              }
              var valid1 = _errs4 === errors;
            } else {
              var valid1 = true;
            }
            if (valid1) {
              if (data.scaleFactor !== void 0 && func0.call(data, "scaleFactor")) {
                let data13 = data.scaleFactor;
                const _errs37 = errors;
                if (errors === _errs37) {
                  if (typeof data13 == "number" && isFinite(data13)) {
                    if (data13 <= 0 || isNaN(data13)) {
                      validate93.errors = [{ instancePath: instancePath + "/scaleFactor", schemaPath: "#/allOf/1/properties/scaleFactor/exclusiveMinimum", keyword: "exclusiveMinimum", params: { comparison: ">", limit: 0 }, message: "must be > 0" }];
                      return false;
                    }
                  } else {
                    validate93.errors = [{ instancePath: instancePath + "/scaleFactor", schemaPath: "#/allOf/1/properties/scaleFactor/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                    return false;
                  }
                }
                var valid1 = _errs37 === errors;
              } else {
                var valid1 = true;
              }
            }
          }
        } else {
          validate93.errors = [{ instancePath, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
          return false;
        }
      }
      var valid0 = _errs2 === errors;
    }
    validate93.errors = vErrors;
    return errors === 0;
  }
  var CustomPyramidV1 = validate95;
  function validate95(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    const _errs0 = errors;
    if (!validate20(data, { instancePath, parentData, parentDataProperty, rootData })) {
      vErrors = vErrors === null ? validate20.errors : vErrors.concat(validate20.errors);
      errors = vErrors.length;
    }
    var valid0 = _errs0 === errors;
    if (valid0) {
      const _errs1 = errors;
      if (errors === _errs1) {
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.levels !== void 0 && func0.call(data, "levels")) {
            let data0 = data.levels;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (Array.isArray(data0)) {
                var valid2 = true;
                const len0 = data0.length;
                for (let i0 = 0; i0 < len0; i0++) {
                  let data1 = data0[i0];
                  const _errs5 = errors;
                  const _errs6 = errors;
                  let valid3 = true;
                  const _errs7 = errors;
                  if (errors === _errs7) {
                    if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                      let missing0;
                      if ((data1.grid === void 0 || !func0.call(data1, "grid")) && (missing0 = "grid")) {
                        const err0 = {};
                        if (vErrors === null) {
                          vErrors = [err0];
                        } else {
                          vErrors.push(err0);
                        }
                        errors++;
                      } else {
                        if (data1.grid !== void 0 && func0.call(data1, "grid")) {
                          let data2 = data1.grid;
                          if (!(data2 && typeof data2 == "object" && !Array.isArray(data2))) {
                            const err1 = {};
                            if (vErrors === null) {
                              vErrors = [err1];
                            } else {
                              vErrors.push(err1);
                            }
                            errors++;
                          }
                        }
                      }
                    } else {
                      const err2 = {};
                      if (vErrors === null) {
                        vErrors = [err2];
                      } else {
                        vErrors.push(err2);
                      }
                      errors++;
                    }
                  }
                  var _valid0 = _errs7 === errors;
                  errors = _errs6;
                  if (vErrors !== null) {
                    if (_errs6) {
                      vErrors.length = _errs6;
                    } else {
                      vErrors = null;
                    }
                  }
                  if (_valid0) {
                    const _errs11 = errors;
                    if (!validate93(data1, { instancePath: instancePath + "/levels/" + i0, parentData: data0, parentDataProperty: i0, rootData })) {
                      vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
                      errors = vErrors.length;
                    }
                    var _valid0 = _errs11 === errors;
                    valid3 = _valid0;
                  }
                  if (!valid3) {
                    const err3 = { instancePath: instancePath + "/levels/" + i0, schemaPath: "#/allOf/1/properties/levels/items/if", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' };
                    if (vErrors === null) {
                      vErrors = [err3];
                    } else {
                      vErrors.push(err3);
                    }
                    errors++;
                    validate95.errors = vErrors;
                    return false;
                  }
                  var valid2 = _errs5 === errors;
                  if (!valid2) {
                    break;
                  }
                }
              } else {
                validate95.errors = [{ instancePath: instancePath + "/levels", schemaPath: "#/allOf/1/properties/levels/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
          }
        } else {
          validate95.errors = [{ instancePath, schemaPath: "#/allOf/1/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
          return false;
        }
      }
      var valid0 = _errs1 === errors;
    }
    validate95.errors = vErrors;
    return errors === 0;
  }
  var GridPreparationInputV1 = validate98;
  function validate98(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.level === void 0 || !func0.call(data, "level")) && (missing0 = "level") || (data.edge === void 0 || !func0.call(data, "edge")) && (missing0 = "edge") || (data.columns === void 0 || !func0.call(data, "columns")) && (missing0 = "columns")) {
          validate98.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.level !== void 0 && func0.call(data, "level")) {
            const _errs2 = errors;
            if (!validate93(data.level, { instancePath: instancePath + "/level", parentData: data, parentDataProperty: "level", rootData })) {
              vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
              errors = vErrors.length;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.edge !== void 0 && func0.call(data, "edge")) {
              let data1 = data.edge;
              const _errs3 = errors;
              if (!(typeof data1 == "number" && (!(data1 % 1) && !isNaN(data1)) && isFinite(data1))) {
                validate98.errors = [{ instancePath: instancePath + "/edge", schemaPath: "#/properties/edge/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                return false;
              }
              if (errors === _errs3) {
                if (typeof data1 == "number" && isFinite(data1)) {
                  if (data1 > 9007199254740991 || isNaN(data1)) {
                    validate98.errors = [{ instancePath: instancePath + "/edge", schemaPath: "#/properties/edge/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                    return false;
                  } else {
                    if (data1 < 1 || isNaN(data1)) {
                      validate98.errors = [{ instancePath: instancePath + "/edge", schemaPath: "#/properties/edge/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                      return false;
                    }
                  }
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.columns !== void 0 && func0.call(data, "columns")) {
                let data2 = data.columns;
                const _errs5 = errors;
                if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)) && isFinite(data2))) {
                  validate98.errors = [{ instancePath: instancePath + "/columns", schemaPath: "#/properties/columns/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                  return false;
                }
                if (errors === _errs5) {
                  if (typeof data2 == "number" && isFinite(data2)) {
                    if (data2 > 9007199254740991 || isNaN(data2)) {
                      validate98.errors = [{ instancePath: instancePath + "/columns", schemaPath: "#/properties/columns/maximum", keyword: "maximum", params: { comparison: "<=", limit: 9007199254740991 }, message: "must be <= 9007199254740991" }];
                      return false;
                    } else {
                      if (data2 < 1 || isNaN(data2)) {
                        validate98.errors = [{ instancePath: instancePath + "/columns", schemaPath: "#/properties/columns/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                        return false;
                      }
                    }
                  }
                }
                var valid0 = _errs5 === errors;
              } else {
                var valid0 = true;
              }
            }
          }
        }
      } else {
        validate98.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate98.errors = vErrors;
    return errors === 0;
  }
  var TileTransportV1 = validate101;
  function validate101(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.kind === void 0 || !func0.call(data, "kind")) && (missing0 = "kind") || (data.url === void 0 || !func0.call(data, "url")) && (missing0 = "url")) {
          validate101.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.kind !== void 0 && func0.call(data, "kind")) {
            const _errs2 = errors;
            if ("websocket-v1" !== data.kind) {
              validate101.errors = [{ instancePath: instancePath + "/kind", schemaPath: "#/properties/kind/const", keyword: "const", params: { allowedValue: "websocket-v1" }, message: "must be equal to constant" }];
              return false;
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.url !== void 0 && func0.call(data, "url")) {
              let data1 = data.url;
              const _errs3 = errors;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (typeof data1 === "string") {
                  if (func61(data1) > 2048) {
                    validate101.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/$defs/TileStreamURLV1/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" }];
                    return false;
                  } else {
                    if (func61(data1) < 1) {
                      validate101.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/$defs/TileStreamURLV1/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                      return false;
                    }
                  }
                } else {
                  validate101.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/$defs/TileStreamURLV1/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                  return false;
                }
              }
              var valid0 = _errs3 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      } else {
        validate101.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate101.errors = vErrors;
    return errors === 0;
  }
  var TileStreamOptionsV1 = validate102;
  function validate102(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null;
    let errors = 0;
    if (errors === 0) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        let missing0;
        if ((data.url === void 0 || !func0.call(data, "url")) && (missing0 = "url")) {
          validate102.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
          return false;
        } else {
          if (data.url !== void 0 && func0.call(data, "url")) {
            let data0 = data.url;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (typeof data0 === "string") {
                if (func61(data0) > 2048) {
                  validate102.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/$defs/TileStreamURLV1/maxLength", keyword: "maxLength", params: { limit: 2048 }, message: "must NOT have more than 2048 characters" }];
                  return false;
                } else {
                  if (func61(data0) < 1) {
                    validate102.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/$defs/TileStreamURLV1/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                }
              } else {
                validate102.errors = [{ instancePath: instancePath + "/url", schemaPath: "#/$defs/TileStreamURLV1/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
          }
        }
      } else {
        validate102.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
        return false;
      }
    }
    validate102.errors = vErrors;
    return errors === 0;
  }

  // validation/errors.js
  var validationLimits = Object.freeze({ issues: 16, path: 512, message: 200, code: 64, contract: 80 });
  var clip = (value, maximum) => String(value ?? "").slice(0, maximum);
  var AtlasValidationError = class extends TypeError {
    constructor(contract, issues, { truncated = false } = {}) {
      super("Atlas data does not satisfy its " + clip(contract, validationLimits.contract) + " contract.");
      this.name = "AtlasValidationError";
      this.code = "ATLAS_VALIDATION";
      this.contract = clip(contract, validationLimits.contract);
      this.version = 1;
      this.issues = Object.freeze(issues.slice(0, validationLimits.issues).map((issue) => Object.freeze({
        code: clip(issue.code, validationLimits.code),
        path: clip(issue.path, validationLimits.path),
        message: clip(issue.message, validationLimits.message)
      })));
      this.truncated = truncated || issues.length > validationLimits.issues;
      this.recovery = "Correct the reported fields and retry; the previous accepted state should remain in use.";
    }
  };
  function issueCollector(contract) {
    const issues = [];
    let truncated = false;
    return {
      get hasIssues() {
        return issues.length > 0;
      },
      get full() {
        const full = issues.length >= validationLimits.issues;
        if (full) truncated = true;
        return full;
      },
      add(code, path, message) {
        if (issues.length >= validationLimits.issues) {
          truncated = true;
          return false;
        }
        issues.push({ code, path, message });
        return true;
      },
      finish() {
        if (issues.length) throw new AtlasValidationError(contract, issues, { truncated });
      }
    };
  }
  var pointer = (value) => String(value).replaceAll("~", "~0").replaceAll("/", "~1");

  // validation/assert-shape.js
  function assertShape(contract, validator, value) {
    if (!validator(value)) {
      const error = validator.errors?.[0];
      throw new AtlasValidationError(contract, [{
        code: "shape-" + (error?.keyword ?? "invalid"),
        path: error?.instancePath ?? "",
        message: error?.message ?? "Invalid contract shape."
      }]);
    }
    return value;
  }

  // validation/transport.js
  function requireURLBudget(url, contract) {
    if (url.length > 2048) throw new AtlasValidationError(contract, [{
      code: "stream-url-length",
      path: "/url",
      message: "Tile delivery URL must not exceed 2048 code units."
    }]);
  }
  function validateTileTransport(value) {
    if (value?.kind !== "websocket-v1") return value;
    assertShape("TileTransportV1", TileTransportV1, value);
    requireURLBudget(value.url, "TileTransportV1");
    return value;
  }
  function validateTileStreamOptions(value) {
    assertShape("TileStreamOptionsV1", TileStreamOptionsV1, value);
    requireURLBudget(value.url, "TileStreamOptionsV1");
    if (value.signal != null && (typeof value.signal.aborted !== "boolean" || typeof value.signal.addEventListener !== "function" || typeof value.signal.removeEventListener !== "function")) {
      throw new AtlasValidationError("TileStreamOptionsV1", [{
        code: "abort-signal",
        path: "/signal",
        message: "Tile stream signal must support abort observation and listener removal."
      }]);
    }
    return value;
  }
  function parseStreamGreeting(text) {
    if (typeof text !== "string" || text.length > 1024) throw new AtlasValidationError("StreamGreetingV1", [{
      code: "stream-greeting-source",
      path: "",
      message: "Tile greeting must be JSON text of at most 1024 code units."
    }]);
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw new AtlasValidationError("StreamGreetingV1", [{
        code: "stream-greeting-json",
        path: "",
        message: "Tile greeting must contain valid JSON."
      }]);
    }
    return assertShape("StreamGreetingV1", StreamGreetingV1, value);
  }

  // tile-stream.js
  function createAtlasTileStreamTransport(options = {}) {
    validateTileStreamOptions(options);
    const { url, signal, WebSocketImpl = globalThis.WebSocket } = options;
    let endpoint, originCheck;
    try {
      endpoint = new URL(url, document.baseURI);
      originCheck = new URL(endpoint);
    } catch {
      throw new AtlasValidationError("TileStreamOptionsV1", [{
        code: "stream-url-syntax",
        path: "/url",
        message: "Tile delivery URL must resolve against the host document."
      }]);
    }
    if (originCheck.protocol === "ws:") originCheck.protocol = "http:";
    if (originCheck.protocol === "wss:") originCheck.protocol = "https:";
    if (!["http:", "https:"].includes(originCheck.protocol) || originCheck.origin !== location.origin || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      throw new Error("Atlas tile delivery must use its own origin.");
    }
    endpoint.protocol = originCheck.protocol === "https:" ? "wss:" : "ws:";
    const maximumBytes = 2 * 1024 * 1024;
    const pending = /* @__PURE__ */ new Map(), queue = [];
    const stats = {
      state: "idle",
      requested: 0,
      sent: 0,
      completed: 0,
      canceled: 0,
      errors: 0,
      receivedBytes: 0,
      peakPending: 0,
      directFallback: false
    };
    let socket, readyTimer, cancellationTimer, lastId = 0, limit = 16, accepted = false, disposed = false;
    const abortError = () => new DOMException("Atlas tile request canceled.", "AbortError");
    const resourceError = (message) => new Error(message || "Atlas tile stream was interrupted.");
    function settle(job, error, data) {
      if (job.settled) return;
      job.settled = true;
      job.signal?.removeEventListener("abort", job.abort);
      if (error) job.reject(error);
      else job.resolve(data);
    }
    function cleanTimers() {
      clearTimeout(readyTimer);
      readyTimer = void 0;
      clearTimeout(cancellationTimer);
      cancellationTimer = void 0;
    }
    function fail(error, allowDirect = false) {
      if (disposed || ["direct", "failed", "closed"].includes(stats.state)) return;
      cleanTimers();
      const fallback = allowDirect && !accepted;
      stats.state = fallback ? "direct" : "failed";
      stats.directFallback = fallback;
      const jobs = [...pending.values(), ...queue.splice(0)];
      pending.clear();
      try {
        socket?.close();
      } catch {
      }
      for (const job of jobs) {
        if (job.settled) continue;
        if (fallback) settle(job, void 0, void 0);
        else {
          stats.errors++;
          settle(job, error);
        }
      }
    }
    function drain() {
      if (disposed || stats.state !== "open") return;
      while (pending.size < limit && queue.length) {
        const job = queue.shift();
        if (job.settled || job.signal?.aborted) {
          settle(job, abortError());
          continue;
        }
        job.id = ++lastId;
        if (lastId > 4294967295) {
          queue.unshift(job);
          fail(resourceError("Atlas tile sequence is exhausted."));
          return;
        }
        pending.set(job.id, job);
        stats.peakPending = Math.max(stats.peakPending, pending.size);
        try {
          socket.send(JSON.stringify({ type: "request", id: job.id, key: job.key }));
          stats.sent++;
        } catch (error) {
          fail(error);
          return;
        }
      }
    }
    function watchTerminalReplies() {
      if (cancellationTimer || disposed) return;
      cancellationTimer = setTimeout(() => {
        cancellationTimer = void 0;
        const now = performance.now();
        const jobs = [...pending.values(), ...queue];
        if (jobs.some((job) => !job.settled && now - job.createdAt >= 3e4)) {
          fail(resourceError("Atlas tile response timed out."));
        } else if (jobs.some((job) => job.canceledAt && now - job.canceledAt >= 5e3)) {
          fail(resourceError("Atlas tile cancellation was not acknowledged."));
        } else if (jobs.length) watchTerminalReplies();
      }, 1e3);
    }
    function connect() {
      if (stats.state !== "idle" || disposed) return;
      stats.state = "connecting";
      if (typeof WebSocketImpl !== "function") {
        fail(resourceError("Tile streaming is unavailable."), true);
        return;
      }
      try {
        socket = new WebSocketImpl(endpoint.href, "atlas-tiles-v1");
      } catch (error) {
        fail(error, true);
        return;
      }
      socket.binaryType = "arraybuffer";
      readyTimer = setTimeout(() => fail(resourceError("Atlas tile stream did not open."), true), 3e3);
      socket.addEventListener("error", () => fail(resourceError("Atlas tile stream could not connect."), !accepted));
      socket.addEventListener("close", () => fail(resourceError("Atlas tile stream closed."), !accepted));
      socket.addEventListener("message", (event) => {
        if (disposed || !["connecting", "open"].includes(stats.state)) return;
        try {
          if (typeof event.data === "string") {
            if (accepted) throw resourceError("Invalid Atlas tile greeting.");
            const greeting = parseStreamGreeting(event.data);
            accepted = true;
            limit = greeting.maxPending;
            stats.state = "open";
            clearTimeout(readyTimer);
            readyTimer = void 0;
            drain();
            return;
          }
          if (!accepted || !(event.data instanceof ArrayBuffer) || event.data.byteLength < 10 || event.data.byteLength > maximumBytes + 10) throw resourceError("Invalid Atlas tile frame.");
          const frame = new DataView(event.data), id = frame.getUint32(0), status = frame.getUint16(4), length = frame.getUint32(6);
          const job = pending.get(id);
          if (!job || status < 100 || status > 599 || length !== event.data.byteLength - 10 || (status === 200 ? !length || length > maximumBytes : length > 512)) {
            throw resourceError("Invalid Atlas tile response.");
          }
          pending.delete(id);
          stats.receivedBytes += length;
          if (!job.settled) {
            if (job.signal?.aborted) settle(job, abortError());
            else if (status === 200) {
              stats.completed++;
              settle(job, void 0, event.data.slice(10));
            } else {
              stats.errors++;
              settle(job, resourceError("Tile HTTP " + status));
            }
          }
          drain();
        } catch (error) {
          fail(error);
        }
      });
    }
    function fetchTile(sourceURL, requestSignal) {
      if (disposed || signal?.aborted || requestSignal?.aborted) return Promise.reject(abortError());
      const source = new URL(sourceURL, document.baseURI);
      const match = /^\/tiles\/(\d{1,2}\/\d{1,6}\/\d{1,6}\.jpg)$/.exec(source.pathname);
      if (source.origin !== location.origin || source.username || source.password || source.search || source.hash) {
        return Promise.reject(resourceError("Invalid Atlas tile URL."));
      }
      if (!match) return Promise.resolve(void 0);
      if (stats.state === "direct") return Promise.resolve(void 0);
      if (stats.state === "failed") return Promise.reject(resourceError());
      if (queue.length >= 64) return Promise.reject(resourceError("Atlas tile queue is full."));
      stats.requested++;
      return new Promise((resolve, reject) => {
        const job = { key: match[1], signal: requestSignal, resolve, reject, settled: false, id: 0, createdAt: performance.now() };
        job.abort = () => {
          if (job.settled) return;
          stats.canceled++;
          settle(job, abortError());
          if (!job.id) {
            const index = queue.indexOf(job);
            if (index >= 0) queue.splice(index, 1);
          } else if (stats.state === "open" && pending.has(job.id)) {
            job.canceledAt = performance.now();
            try {
              socket.send(JSON.stringify({ type: "cancel", id: job.id }));
              watchTerminalReplies();
            } catch (error) {
              fail(error);
            }
          }
        };
        requestSignal?.addEventListener("abort", job.abort, { once: true });
        queue.push(job);
        watchTerminalReplies();
        if (requestSignal?.aborted) job.abort();
        connect();
        drain();
      });
    }
    function destroy() {
      if (disposed) return;
      disposed = true;
      stats.state = "closed";
      cleanTimers();
      signal?.removeEventListener("abort", destroy);
      for (const job of [...pending.values(), ...queue.splice(0)]) settle(job, abortError());
      pending.clear();
      try {
        socket?.close();
      } catch {
      }
    }
    signal?.addEventListener("abort", destroy, { once: true });
    if (signal?.aborted) destroy();
    return { fetch: fetchTile, destroy, getStats: () => ({
      kind: "websocket-v1",
      ...stats,
      accepted,
      pending: pending.size,
      queued: queue.length,
      disposed
    }) };
  }

  // scene-native-raster.js
  var AtlasSceneNativeRasterMath = (() => {
    const maximumResponseBytes = 8 * 1024 * 1024;
    function imageDimensions(data) {
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const tag = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
      const fail = () => {
        throw new Error("Unsupported or malformed native tile image header.");
      };
      if (bytes.length >= 33 && bytes[0] === 137 && tag(1) === "PNG\r" && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) {
        if (view.getUint32(8) !== 13 || tag(12) !== "IHDR") return fail();
        return { format: "png", width: view.getUint32(16), height: view.getUint32(20) };
      }
      if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
        let offset = 2;
        while (offset < bytes.length) {
          if (bytes[offset++] !== 255) return fail();
          while (bytes[offset] === 255) offset++;
          const marker = bytes[offset++];
          if (marker === void 0 || marker === 0 || marker === 217 || marker === 218) return fail();
          if (marker === 1 || marker >= 208 && marker <= 215) continue;
          if (offset + 2 > bytes.length) return fail();
          const length = view.getUint16(offset);
          if (length < 2 || offset + length > bytes.length) return fail();
          if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
            if (length < 8) return fail();
            return { format: "jpeg", width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
          }
          offset += length;
        }
        return fail();
      }
      if (bytes.length >= 20 && tag(0) === "RIFF" && tag(8) === "WEBP") {
        if (view.getUint32(4, true) + 8 !== bytes.length) return fail();
        let canvas, image, offset = 12;
        while (offset + 8 <= bytes.length) {
          const name = tag(offset), length = view.getUint32(offset + 4, true), start = offset + 8;
          const end = start + length, paddedEnd = end + (length & 1);
          if (paddedEnd > bytes.length) return fail();
          if (name === "ANIM" || name === "ANMF") return fail();
          if (name === "VP8X") {
            if (canvas || length !== 10 || bytes[start] & 2) return fail();
            const uint24 = (at) => bytes[at] | bytes[at + 1] << 8 | bytes[at + 2] << 16;
            canvas = { width: uint24(start + 4) + 1, height: uint24(start + 7) + 1 };
          } else if (name === "VP8 ") {
            if (image || length < 10 || bytes[start] & 1 || bytes[start + 3] !== 157 || bytes[start + 4] !== 1 || bytes[start + 5] !== 42) return fail();
            image = { width: view.getUint16(start + 6, true) & 16383, height: view.getUint16(start + 8, true) & 16383 };
          } else if (name === "VP8L") {
            if (image || length < 5 || bytes[start] !== 47) return fail();
            const packed = view.getUint32(start + 1, true);
            if (packed >>> 29) return fail();
            image = { width: (packed & 16383) + 1, height: (packed >>> 14 & 16383) + 1 };
          }
          offset = paddedEnd;
        }
        if (offset !== bytes.length || !image || canvas && (canvas.width !== image.width || canvas.height !== image.height)) return fail();
        return { format: "webp", ...canvas ?? image };
      }
      return fail();
    }
    function validateTileImage(data, edge) {
      if (data.byteLength > maximumResponseBytes) throw new Error("Native tile response exceeds 8 MiB.");
      const dimensions = imageDimensions(data);
      if (dimensions.width !== edge || dimensions.height !== edge) throw new Error(`Native tile dimensions ${dimensions.width}×${dimensions.height} do not match the declared ${edge}×${edge} cell.`);
      return dimensions;
    }
    async function readTileResponse(response, edge, signal) {
      const declared = response.headers.get("content-length");
      if (declared !== null && /^\d+$/.test(declared) && Number(declared) > maximumResponseBytes) {
        await response.body?.cancel().catch(() => {
        });
        throw new Error("Native tile response exceeds 8 MiB.");
      }
      if (!response.body?.getReader) throw new Error("A bounded native tile response stream is unavailable.");
      const reader = response.body.getReader(), chunks = [];
      let size = 0, completed = false;
      try {
        for (; ; ) {
          if (signal?.aborted) throw new DOMException("Atlas tile request canceled.", "AbortError");
          const { value, done } = await reader.read();
          if (done) {
            completed = true;
            break;
          }
          size += value.byteLength;
          if (size > maximumResponseBytes) throw new Error("Native tile response exceeds 8 MiB.");
          chunks.push(value);
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        validateTileImage(bytes, edge);
        return bytes.buffer;
      } finally {
        if (!completed) await reader.cancel().catch(() => {
        });
        reader.releaseLock();
      }
    }
    function inspect(scene, { imageBase = typeof document === "object" ? document.baseURI : "http://atlas.invalid/" } = {}) {
      const no = (reason) => ({ eligible: false, reason });
      const world = scene?.world, areas = scene?.tiles;
      if (!world || !Number.isFinite(world.width) || world.width <= 0 || world.width !== world.height || !Array.isArray(areas) || areas.length !== 1) return no("Artwork is not one full square world.");
      const area = areas[0], source = area.pyramid;
      if (area.x !== 0 || area.y !== 0 || area.w !== world.width || area.h !== world.height) return no("Artwork does not fill the world.");
      if (scene.overviewImages?.length || scene.imageryTrials?.[area.id]) return no("Overview or imagery-trial selection needs the custom artwork pipeline.");
      const edge = source?.tileSize;
      if (source?.opaque !== true || !Number.isSafeInteger(edge) || edge < 1 || edge > 1024 || (edge & edge - 1) !== 0 || !Array.isArray(source.levels) || !source.levels.length || source.levels.length > 23) return no("Artwork is not a supported opaque regular tile pyramid.");
      let base;
      try {
        base = new URL(imageBase);
      } catch {
        return no("Artwork base URL is invalid.");
      }
      const resolve = (value) => {
        if (typeof value !== "string" || !value || value.length > 4096 || /[\s\\<>"']/.test(value)) throw new Error("Invalid artwork URL.");
        const url = new URL(value, base);
        if (!["http:", "https:", "file:"].includes(url.protocol) || url.origin !== base.origin || url.username || url.password) throw new Error("Artwork is not a local same-origin asset.");
        if (!/\.(?:png|jpe?g|webp)$/i.test(url.pathname)) throw new Error("This image format needs the custom artwork pipeline.");
        return url.href;
      };
      const levels = [];
      try {
        for (const [index, raw] of source.levels.entries()) {
          const columns = 2 ** index, size = edge * columns;
          if (raw.width !== size || raw.height !== size) return no("Pyramid levels are not contiguous square powers of two.");
          if (raw.scaleFactor !== void 0 && (!(raw.scaleFactor > 0) || !Number.isFinite(raw.scaleFactor))) return no("Invalid source scale.");
          const level = { index, width: size, height: size, columns };
          if (raw.grid) {
            const grid = raw.grid;
            if (index === 0 || raw.tiles?.length || !Number.isSafeInteger(grid.originX) || !Number.isSafeInteger(grid.originY) || !Number.isSafeInteger(grid.originX + columns - 1) || !Number.isSafeInteger(grid.originY + columns - 1) || grid.missing !== void 0 && (!Array.isArray(grid.missing) || grid.missing.length)) return no("Sparse, mixed or invalid grids need the custom pipeline.");
            const bounds = grid.bounds;
            if (bounds && (bounds.minX !== 0 || bounds.minY !== 0 || bounds.maxX !== columns - 1 || bounds.maxY !== columns - 1)) return no("Partial grid bounds need the custom pipeline.");
            if (typeof grid.source !== "string" || !grid.source.includes("{x}") || !grid.source.includes("{y}") || /[{}]/.test(grid.source.replace(/\{[xyz]\}/g, "")) || grid.source.includes("{z}") && (!Number.isSafeInteger(grid.zoom) || grid.zoom < 0 || grid.zoom > 30)) return no("Invalid tile URL template.");
            resolve(grid.source.replace(/\{[xyz]\}/g, "0"));
            level.grid = { source: grid.source, originX: grid.originX, originY: grid.originY, zoom: grid.zoom };
          } else {
            if (!Array.isArray(raw.tiles) || raw.tiles.length !== columns * columns) return no("Incomplete explicit tile grid.");
            const cells = /* @__PURE__ */ new Map();
            for (const tile of raw.tiles) {
              if (![tile.x, tile.y, tile.w, tile.h].every(Number.isSafeInteger) || tile.w !== edge || tile.h !== edge || tile.x < 0 || tile.y < 0 || tile.x >= size || tile.y >= size || tile.x % edge || tile.y % edge) return no("Partial or irregular cells need the custom pipeline.");
              const key = tile.y / edge * columns + tile.x / edge;
              if (cells.has(key)) return no("Duplicate tile cell.");
              cells.set(key, resolve(tile.source));
            }
            level.cells = cells;
            if (index === 0) level.whole = cells.get(0);
          }
          if (index === 0 && !level.whole) return no("A complete coarse fallback cell is required.");
          levels.push(level);
        }
      } catch (error) {
        return no(error.message);
      }
      return { eligible: true, descriptor: {
        world: { width: world.width, height: world.height },
        areaId: area.id,
        tileSize: edge,
        maxLevel: levels.length - 1,
        levels,
        imageBase: base.href,
        wholeViewCoverage: source.wholeViewCoverage
      } };
    }
    function tileURL(descriptor, index, x, y) {
      const level = descriptor.levels[index];
      if (!level || ![index, x, y].every(Number.isSafeInteger) || x < 0 || y < 0 || x >= level.columns || y >= level.columns) throw new Error("Native tile is outside the authored grid.");
      if (level.cells) return level.cells.get(y * level.columns + x);
      const grid = level.grid;
      return new URL(grid.source.replace(/\{([xyz])\}/g, (_, axis) => axis === "z" ? grid.zoom : axis === "x" ? grid.originX + x : grid.originY + y), descriptor.imageBase).href;
    }
    function selectLevel(descriptor, camera, width, height, ratio = 1) {
      const pixels = descriptor.world.width * camera.scale * ratio;
      const fitsWhole = descriptor.wholeViewCoverage && Math.min(1, width / (descriptor.world.width * camera.scale)) * Math.min(1, height / (descriptor.world.height * camera.scale)) >= descriptor.wholeViewCoverage;
      const levels = fitsWhole ? descriptor.levels.slice(0, 1) : descriptor.levels;
      return (levels.find((level) => level.width * 1.15 >= pixels) ?? levels.at(-1)).index;
    }
    const nativeTileSize = (index) => 64 / 2 ** index;
    function retainedDetailIndices(records, nextIndex, previousIndex) {
      const keep = new Set([nextIndex, previousIndex].filter((index) => Number.isInteger(index) && index > 0));
      const candidates = records.filter((state) => state.index > 0 && state.everReady && !state.failed).sort((a, b) => b.lastUsed - a.lastUsed || b.index - a.index);
      for (const state of candidates) {
        if (keep.size >= 3) break;
        keep.add(state.index);
      }
      return [...keep];
    }
    return { inspect, tileURL, selectLevel, nativeTileSize, imageDimensions, validateTileImage, readTileResponse, maximumResponseBytes, retainedDetailIndices };
  })();
  var atlasNativeRasterProtocols = /* @__PURE__ */ new WeakMap();
  var atlasNativeRasterOwnerSequence = 0;
  function createAtlasSceneNativeRaster(scene, { map, maplibre, signal, imageBase, tileTransport, onStatus = () => {
  } } = {}) {
    const inspected = AtlasSceneNativeRasterMath.inspect(scene, { imageBase });
    if (!inspected.eligible) return void 0;
    if (!map || !maplibre?.addProtocol || !maplibre?.removeProtocol || map.getProjection()?.type !== "identity") throw new Error("Native Atlas artwork requires the pinned MapLibre identity renderer.");
    if (signal?.aborted) throw new DOMException("Atlas artwork was closed.", "AbortError");
    const descriptor = inspected.descriptor;
    const tileStream = tileTransport?.kind === "websocket-v1" ? createAtlasTileStreamTransport({ url: tileTransport.url, signal }) : void 0;
    const encodedCache = tileStream ? createAtlasTileByteCache() : void 0;
    const immutableCacheControl = "public,max-age=31536000,immutable";
    const requestLimit = tileStream ? 16 : 6;
    let registry = atlasNativeRasterProtocols.get(maplibre);
    if (!registry) {
      registry = { name: "atlas-native-raster-v1", owners: /* @__PURE__ */ new Map(), sequence: 0 };
      maplibre.addProtocol(registry.name, async (request, abortController) => {
        const url = new URL(request.url), owner = registry.owners.get(url.hostname);
        if (!owner) throw new DOMException("Atlas image owner was closed.", "AbortError");
        return owner.fetch(url, abortController.signal);
      });
      atlasNativeRasterProtocols.set(maplibre, registry);
    }
    const ownerId = "owner-" + (++atlasNativeRasterOwnerSequence).toString(36);
    const states = /* @__PURE__ */ new Map(), jobs = /* @__PURE__ */ new Map(), waiting = [], failures = [], requestedByLevel = /* @__PURE__ */ new Map();
    const counters = {
      protocolRequests: 0,
      requests: 0,
      completed: 0,
      canceled: 0,
      failures: 0,
      requestBytes: 0,
      peakRequests: 0,
      historyHits: 0,
      historyEvictions: 0,
      levelChanges: 0,
      sourceCreates: 0,
      sourceRemoves: 0,
      contextRestores: 0,
      nativeLayerMoves: 0,
      nativePlacementCalls: 0
    };
    let attached = false, destroyed = false, contextLost = false, beforeId, current, previous, currentRatio = 1, activeRequests = 0, changing = false;
    let levelUseSequence = 0;
    const listeners = [];
    const requestAllowed = (index) => index === 0 || index === current?.index || index < current?.index && states.get(index)?.shown;
    const requestPriority = (index) => index === 0 ? 0 : index === current?.index ? 1 : 2;
    const emit = (value) => {
      if (!destroyed && !signal?.aborted) onStatus({ subsystem: "artwork", ...value });
    };
    const logFailure = (error, extra = {}) => {
      counters.failures++;
      if (failures.length < 24) failures.push({ message: String(error?.message ?? error), ...extra });
      emit({ type: "asset-error", message: String(error?.message ?? error) });
    };
    const markTileFailure = (index, key, failed) => {
      const state = states.get(index);
      if (!state) return;
      if (!failed) state.failedTiles.delete(key);
      else if (state.failedTiles.size < 128) state.failedTiles.add(key);
      else if (!state.failedTiles.has(key)) state.failureOverflow = true;
    };
    const waitSlot = (controller, index) => new Promise((resolve, reject) => {
      const signal2 = controller.signal;
      const abort = () => {
        const index2 = waiting.indexOf(enter);
        if (index2 >= 0) waiting.splice(index2, 1);
        reject(new DOMException("Atlas tile request canceled.", "AbortError"));
      };
      const enter = () => {
        if (signal2.aborted) {
          abort();
          return;
        }
        signal2.removeEventListener("abort", abort);
        activeRequests++;
        counters.peakRequests = Math.max(counters.peakRequests, activeRequests);
        resolve();
      };
      enter.level = index;
      if (signal2.aborted) abort();
      else if (activeRequests < requestLimit) enter();
      else {
        waiting.push(enter);
        signal2.addEventListener("abort", abort, { once: true });
      }
    });
    const releaseSlot = () => {
      activeRequests--;
      waiting.sort((a, b) => requestPriority(a.level) - requestPriority(b.level));
      const next = waiting.shift();
      if (next) next();
    };
    registry.owners.set(ownerId, { async fetch(url, nativeSignal) {
      const match = /^\/(\d+)\/(\d+)\/(\d+)$/.exec(url.pathname);
      if (!match) throw new Error("Invalid native Atlas tile URL.");
      const [index, x, y] = match.slice(1).map(Number), sourceURL = AtlasSceneNativeRasterMath.tileURL(descriptor, index, x, y);
      if (!requestAllowed(index)) {
        counters.canceled++;
        throw new DOMException("Obsolete Atlas detail request.", "AbortError");
      }
      if (destroyed || nativeSignal.aborted) throw new DOMException("Atlas tile request canceled.", "AbortError");
      counters.protocolRequests++;
      const cacheKey = index + ":" + sourceURL;
      const cached = encodedCache?.get(cacheKey);
      if (cached) {
        markTileFailure(index, x + "/" + y, false);
        return { data: cached, cacheControl: immutableCacheControl };
      }
      const controller = new AbortController(), abort = () => controller.abort();
      jobs.set(controller, index);
      nativeSignal.addEventListener("abort", abort, { once: true });
      if (nativeSignal.aborted || destroyed) controller.abort();
      let acquired = false;
      try {
        await waitSlot(controller, index);
        acquired = true;
        if (!requestAllowed(index)) {
          controller.abort();
          throw new DOMException("Obsolete Atlas detail request.", "AbortError");
        }
        counters.requests++;
        requestedByLevel.set(index, (requestedByLevel.get(index) ?? 0) + 1);
        let response, data;
        if (tileStream) data = await tileStream.fetch(sourceURL, controller.signal);
        const streamed = data !== void 0;
        if (data === void 0) {
          response = await fetch(sourceURL, { signal: controller.signal, credentials: "same-origin" });
          if (!response.ok) throw new Error("HTTP " + response.status);
          data = await AtlasSceneNativeRasterMath.readTileResponse(response, descriptor.tileSize, controller.signal);
        } else {
          controller.signal.throwIfAborted();
          AtlasSceneNativeRasterMath.validateTileImage(data, descriptor.tileSize);
          encodedCache.put(cacheKey, data, index);
        }
        markTileFailure(index, x + "/" + y, false);
        counters.completed++;
        counters.requestBytes += data.byteLength;
        return {
          data,
          ...streamed ? { cacheControl: immutableCacheControl } : response?.headers.get("cache-control") ? { cacheControl: response.headers.get("cache-control") } : {},
          ...response?.headers.get("expires") ? { expires: response.headers.get("expires") } : {}
        };
      } catch (error) {
        if (controller.signal.aborted || error?.name === "AbortError") counters.canceled++;
        else {
          markTileFailure(index, x + "/" + y, true);
          logFailure(error, { level: index, url: sourceURL });
        }
        throw error;
      } finally {
        nativeSignal.removeEventListener("abort", abort);
        jobs.delete(controller);
        if (acquired) releaseSlot();
      }
    } });
    const sourceId = (index) => "atlas-native-" + ownerId + "-source-" + index;
    const layerId = (index) => "atlas-native-" + ownerId + "-layer-" + index;
    function ensure(index) {
      let state = states.get(index);
      if (!state) {
        state = {
          index,
          sourceId: sourceId(index),
          layerId: layerId(index),
          everReady: false,
          shown: true,
          readinessFrame: false,
          lastUsed: 0,
          failedTiles: /* @__PURE__ */ new Set(),
          failureOverflow: false,
          nativeError: false
        };
        states.set(index, state);
      }
      if (!map.getSource(state.sourceId)) {
        state.readinessFrame = false;
        state.failedTiles.clear();
        state.failureOverflow = false;
        state.nativeError = false;
        map.addSource(state.sourceId, {
          type: "raster",
          tiles: [`${registry.name}://${ownerId}/{z}/{x}/{y}`],
          tileSize: AtlasSceneNativeRasterMath.nativeTileSize(index),
          minzoom: index,
          maxzoom: index,
          scheme: "xyz"
        });
        counters.sourceCreates++;
      }
      if (!map.getLayer(state.layerId)) map.addLayer({
        id: state.layerId,
        type: "raster",
        source: state.sourceId,
        paint: { "raster-opacity": 1, "raster-resampling": "linear", "raster-fade-duration": 0 }
      }, nativeInsertionAnchor(index));
      return state;
    }
    function remove(state) {
      for (const [controller, index] of jobs) if (index === state.index) controller.abort();
      if (map.getLayer(state.layerId)) map.removeLayer(state.layerId);
      if (map.getSource(state.sourceId)) {
        map.removeSource(state.sourceId);
        counters.sourceRemoves++;
      }
      states.delete(state.index);
    }
    function show(state, visible) {
      if (state && map.getLayer(state.layerId) && state.shown !== visible) {
        if (visible) state.readinessFrame = false;
        state.shown = visible;
        map.setLayoutProperty(state.layerId, "visibility", visible ? "visible" : "none");
        if (!visible) {
          for (const [controller, index] of jobs) if (index === state.index) controller.abort();
        }
      }
    }
    function ready(state) {
      return !!(state && state.shown && state.readinessFrame && !state.failedTiles.size && !state.failureOverflow && !state.nativeError && map.getSource(state.sourceId) && map.isSourceLoaded(state.sourceId));
    }
    function nativeInsertionAnchor(index) {
      return [...states.values()].filter((state) => state.index > index && map.getLayer(state.layerId)).sort((a, b) => a.index - b.index)[0]?.layerId ?? insertionAnchor();
    }
    function placement() {
      counters.nativePlacementCalls++;
      let anchor = insertionAnchor();
      const ordered = [...states.values()].filter((state) => map.getLayer(state.layerId)).sort((a, b) => b.index - a.index);
      for (const state of ordered) {
        const order = map.getLayersOrder(), from = order.indexOf(state.layerId), to = anchor ? order.indexOf(anchor) : order.length;
        if (from >= 0 && from !== to - 1) {
          map.moveLayer(state.layerId, anchor);
          counters.nativeLayerMoves++;
        }
        anchor = state.layerId;
      }
    }
    function insertionAnchor() {
      if (beforeId && map.getLayer(beforeId)) return beforeId;
      return map.getStyle()?.layers.find((layer) => layer.type !== "background" && !["atlas-canvas-background", "atlas-panels-fill", "atlas-panels-outline", "atlas-panel-titles"].includes(layer.id) && ![...states.values()].some((state) => state.layerId === layer.id))?.id;
    }
    function checkReady() {
      if (!attached || destroyed || changing || !current) return;
      if (previous?.index > current.index && ready(states.get(0))) show(previous, false);
      if (ready(current)) {
        const firstReady = !current.everReady;
        current.everReady = true;
        const keepLowerCoverage = previous?.everReady && previous.index <= current.index - 2 && !previous.failedTiles.size && !previous.failureOverflow && !previous.nativeError;
        if (previous?.index !== 0 && !keepLowerCoverage) show(previous, false);
        if (firstReady) emit({ type: "native-detail-ready", level: current.index });
      }
    }
    function synchronize() {
      if (!attached || destroyed || contextLost || changing || !map.getLayer(layerId(0))) return;
      const canvas = map.getCanvas(), width = canvas.clientWidth, height = canvas.clientHeight;
      if (!(width > 0 && height > 0)) return;
      currentRatio = canvas.width / width || 1;
      const camera = cameraFromMap(
        map,
        descriptor.world,
        ([x, y]) => [180 * x / descriptor.world.width - 90, 90 - 180 * y / descriptor.world.height]
      );
      const index = AtlasSceneNativeRasterMath.selectLevel(descriptor, camera, width, height, currentRatio);
      if (current?.index === index) {
        checkReady();
        return;
      }
      changing = true;
      try {
        const old = current, oldPrevious = previous;
        let next = states.get(index);
        const retainedLower = [...states.values()].filter((state) => state.index > 0 && state.index <= index - 2 && state.everReady && !state.failedTiles.size && !state.failureOverflow && !state.nativeError).sort((a, b) => b.index - a.index)[0];
        previous = retainedLower ?? (old?.index !== 0 && old?.everReady && old !== next ? old : oldPrevious !== next ? oldPrevious : void 0);
        const keep = new Set(AtlasSceneNativeRasterMath.retainedDetailIndices([...states.values()].map((state) => ({
          index: state.index,
          everReady: state.everReady,
          lastUsed: state.lastUsed,
          failed: !!(state.failedTiles.size || state.failureOverflow || state.nativeError)
        })), index, previous?.index));
        for (const state of [...states.values()]) if (state.index !== 0 && !keep.has(state.index)) {
          if (state.everReady) counters.historyEvictions++;
          remove(state);
        }
        if (next?.everReady && !next.shown) counters.historyHits++;
        current = next ?? ensure(index);
        ensure(0);
        current.lastUsed = ++levelUseSequence;
        for (const state of states.values()) if (state.index !== 0 && state !== current && state !== previous) show(state, false);
        show(states.get(0), true);
        show(previous, true);
        show(current, true);
        placement();
        if (previous?.index > current.index && ready(states.get(0))) show(previous, false);
        for (const [controller, level] of jobs) if (!requestAllowed(level)) controller.abort();
        counters.levelChanges++;
        emit({ type: "native-detail-loading", level: index });
      } finally {
        changing = false;
      }
      checkReady();
    }
    function restore() {
      if (!attached || destroyed) return;
      if (!map.getStyle()) {
        map.off("style.load", restore);
        map.once("style.load", restore);
        return;
      }
      contextLost = false;
      changing = true;
      try {
        for (const state of states.values()) {
          const shown = state.shown;
          ensure(state.index);
          state.readinessFrame = false;
          state.shown = !shown;
          show(state, shown);
        }
        placement();
        counters.contextRestores++;
      } finally {
        changing = false;
      }
      synchronize();
    }
    function destroy(fromRemove = false) {
      if (destroyed) return;
      destroyed = true;
      encodedCache?.destroy();
      tileStream?.destroy();
      signal?.removeEventListener("abort", aborted);
      for (const [event, listener] of listeners) map.off(event, listener);
      map.off("style.load", restore);
      for (const controller of jobs.keys()) controller.abort();
      if (!fromRemove) for (const state of [...states.values()]) {
        try {
          remove(state);
        } catch (error) {
          logFailure(error, { stage: "destroy" });
        }
      }
      states.clear();
      registry.owners.delete(ownerId);
      if (!registry.owners.size) {
        maplibre.removeProtocol(registry.name);
        atlasNativeRasterProtocols.delete(maplibre);
      }
    }
    const aborted = () => destroy();
    const listen = (event, listener) => {
      map.on(event, listener);
      listeners.push([event, listener]);
    };
    const control = {
      kind: "native-raster",
      get id() {
        return current?.layerId ?? layerId(0);
      },
      attach(before) {
        if (destroyed) throw new Error("Native Atlas artwork was closed.");
        if (attached) return control;
        beforeId = before;
        attached = true;
        try {
          ensure(0);
          listen("move", synchronize);
          listen("resize", synchronize);
          listen("sourcedata", (event) => {
            if ([...states.values()].some((state) => state.sourceId === event.sourceId)) synchronize();
          });
          listen("error", (event) => {
            const state = [...states.values()].find((state2) => state2.sourceId === event.sourceId);
            if (state && event.error?.name !== "AbortError") {
              encodedCache?.invalidateLevel(state.index);
              if (state.shown && requestAllowed(state.index)) state.nativeError = true;
            }
          });
          listen("render", () => {
            for (const state of states.values()) if (state.shown && map.getSource(state.sourceId)?.loaded()) state.readinessFrame = true;
            checkReady();
          });
          listen("webglcontextlost", () => {
            contextLost = true;
          });
          listen("remove", () => destroy(true));
          signal?.addEventListener("abort", aborted, { once: true });
          synchronize();
          return control;
        } catch (error) {
          destroy();
          throw error;
        }
      },
      syncPixelRatio() {
        synchronize();
        return control;
      },
      restore,
      destroy,
      getStats() {
        return {
          backend: "maplibre-native-raster",
          kind: "native-raster",
          destroyed,
          disposed: destroyed,
          contextLost,
          level: current?.index,
          ratio: currentRatio,
          tileSize: descriptor.tileSize,
          maxLevel: descriptor.maxLevel,
          currentSource: current?.sourceId,
          previousSource: previous?.sourceId,
          coarseSource: sourceId(0),
          sources: [...states.values()].map((state) => ({
            index: state.index,
            sourceId: state.sourceId,
            layerId: state.layerId,
            shown: state.shown,
            everReady: state.everReady,
            readinessFrame: state.readinessFrame,
            lastUsed: state.lastUsed,
            failedTiles: state.failedTiles.size,
            failureOverflow: state.failureOverflow,
            nativeError: state.nativeError,
            loaded: !destroyed && !!map.getSource(state.sourceId) && map.isSourceLoaded(state.sourceId)
          })),
          sourceCount: states.size,
          maxSources: 4,
          maxDetailSources: 3,
          protocolOwners: registry.owners.size,
          requestsByLevel: Object.fromEntries(requestedByLevel),
          loading: activeRequests,
          queued: waiting.length,
          ...counters,
          recentFailures: failures.slice(),
          transport: tileStream?.getStats() ?? { kind: "direct-http", requestLimit },
          encodedCache: encodedCache?.getStats() ?? { enabled: false, bytes: 0, entries: 0 },
          nativeCacheLimit: "The host bounds native inactive tiles by count; active tiles and driver bytes are not public residency metrics.",
          maximumResponseBytes: AtlasSceneNativeRasterMath.maximumResponseBytes,
          allocatedWorldBitmap: false,
          sharedContext: true
        };
      }
    };
    return control;
  }

  // pyramid-metrics.js
  function pyramidLevelMetrics(level, tileSize) {
    const edge = tileSize ?? Math.max(level.width, level.height);
    return { edge, columns: Math.ceil(level.width / edge) };
  }
  function pyramidCellIndex(tile, edge, columns) {
    return Math.floor(tile.y / edge) * columns + Math.floor(tile.x / edge);
  }

  // validation/semantic.js
  var finite = Number.isFinite;
  var unique = (items, key, issues, base) => {
    const seen = /* @__PURE__ */ new Set();
    for (let i = 0; i < items.length && !issues.full; i++) {
      const id = key(items[i]);
      if (seen.has(id)) issues.add("duplicate-id", base + "/" + i, "Identity must be unique within this collection.");
      seen.add(id);
    }
  };
  function checkPyramidGrid(level, edge, columns, issues, base = "", { custom = false } = {}) {
    const grid = level.grid, rows = Math.ceil(level.height / edge);
    if (![
      level.width,
      level.height,
      edge,
      columns,
      rows,
      columns * rows,
      grid.originX,
      grid.originY,
      grid.originX + (columns - 1),
      grid.originY + (rows - 1)
    ].every(Number.isSafeInteger) || level.width <= 0 || level.height <= 0 || edge <= 0 || columns <= 0 || rows <= 0 || level.tiles?.length) {
      issues.add("grid-arithmetic", base + "/grid", "Grid dimensions, origins and cell count must be positive or signed safe integers as appropriate.");
    }
    const source = grid.source;
    let validURL = true;
    if (source.length > 4096) {
      issues.add("grid-template", base + "/grid/source", "Grid template must be a supported URL with x/y placeholders and a valid optional zoom.");
    } else {
      try {
        const url = new URL(source.replace(/\{[xyz]\}/g, "0"), "https://atlas.invalid/");
        validURL = ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
      } catch {
        validURL = false;
      }
      if (!source.includes("{x}") || !source.includes("{y}") || /[\s\\<>"']/.test(source) || custom && source.startsWith("//") || /[{}]/.test(source.replace(/\{[xyz]\}/g, "")) || !validURL || source.includes("{z}") && grid.zoom == null) {
        issues.add("grid-template", base + "/grid/source", "Grid template must be a supported URL with x/y placeholders and a valid optional zoom.");
      }
    }
    const bounds = grid.bounds;
    if (bounds && (bounds.minX < 0 || bounds.minY < 0 || bounds.maxX >= columns || bounds.maxY >= rows || bounds.minX > bounds.maxX || bounds.minY > bounds.maxY)) {
      issues.add("grid-bounds", base + "/grid/bounds", "Grid bounds must be ordered and inside the level.");
    }
    for (let j = 0; j < (grid.missing ?? []).length && !issues.full; j++) {
      const [x, y] = grid.missing[j];
      if (x < 0 || y < 0 || x >= columns || y >= rows) issues.add(
        "grid-missing-cell",
        base + "/grid/missing/" + j,
        "Missing cell coordinates must lie inside the grid."
      );
    }
  }
  function checkPyramid(value, issues, base = "", options) {
    for (let i = 0; i < value.levels.length && !issues.full; i++) {
      const level = value.levels[i], p = base + "/levels/" + i;
      const { edge, columns } = pyramidLevelMetrics(level, value.tileSize);
      if (options?.custom && (!finite(edge) || !(edge > 0) || !finite(columns) || !(columns > 0))) {
        issues.add("pyramid-level-arithmetic", p, "Custom level edge and column count must remain finite and positive.");
      }
      for (let j = 0; j < (level.tiles ?? []).length && !issues.full; j++) {
        const cell = level.tiles[j];
        if (cell.x < 0 || cell.y < 0 || cell.x + cell.w > level.width || cell.y + cell.h > level.height || !finite(cell.x + cell.w) || !finite(cell.y + cell.h)) {
          issues.add("tile-bounds", p + "/tiles/" + j, "Explicit image crop must lie within its level.");
        }
        if (options?.custom && !finite(pyramidCellIndex(cell, edge, columns))) {
          issues.add("pyramid-cell-arithmetic", p + "/tiles/" + j, "Custom crop cell index must remain finite.");
        }
      }
      if (!level.grid || issues.full) continue;
      checkPyramidGrid(level, edge, columns, issues, p, options);
    }
  }
  function areaIndex(tiles, world, issues, base, requireArtwork) {
    unique(tiles, (tile) => tile.id, issues, base);
    const index = /* @__PURE__ */ new Map();
    for (let i = 0; i < tiles.length && !issues.full; i++) {
      const tile = tiles[i], p = base + "/" + i;
      if (!tile.id) issues.add("area-id", p + "/id", "Artwork needs a nonempty identity.");
      if (tile.x < 0 || tile.y < 0 || tile.x + tile.w > world.width || tile.y + tile.h > world.height || !finite(tile.x + tile.w) || !finite(tile.y + tile.h)) {
        issues.add("area-bounds", p, "Artwork must remain within the finite world bounds.");
      }
      if (requireArtwork && !(tile.sources?.detail || tile.pyramid?.fallback)) {
        issues.add("artwork-source", p, "Artwork needs a detail source or pyramid fallback.");
      }
      if (tile.pyramid) checkPyramid(tile.pyramid, issues, p + "/pyramid");
      index.set(tile.id, tile);
    }
    return index;
  }
  function position(point, areas, issues, path, normalized = true) {
    if (!areas.has(point.area)) {
      issues.add("unknown-area", path + "/area", "Position must refer to a known artwork area.");
      return;
    }
    if (![point.x, point.y].every(finite) || normalized && (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)) {
      issues.add("coordinate-range", path, "Authored position must use finite normalized area coordinates.");
    }
  }
  function activity(value, areas, issues, path) {
    for (const [letter, point] of Object.entries(value.locations)) {
      if (issues.full) break;
      position(point, areas, issues, path + "/locations/" + pointer(letter));
    }
    for (let i = 0; i < value.steps.length && !issues.full; i++) {
      const letter = value.steps[i].letter;
      if (letter !== void 0 && !Object.hasOwn(value.locations, letter)) {
        issues.add("unresolved-step", path + "/steps/" + i + "/letter", "A mapped step letter must resolve within its own route.");
      }
    }
  }
  function checkLocations(value, issues, { areas, layerIds, authored = false, base = "" } = {}) {
    const fragments = /* @__PURE__ */ new Map();
    for (const type of ["street", "district"]) {
      const entries = value[type + "s"] ?? [];
      for (let i = 0; i < entries.length && !issues.full; i++) {
        const entry = entries[i], p = base + "/" + type + "s/" + i;
        const layer = authored ? entry.layer === void 0 ? type : entry.layer : entry.layer ?? type;
        const key = type + ":" + (entry.id ?? entry.area + ":" + entry.name);
        const prior = fragments.get(key);
        if (prior && (prior.area !== entry.area || prior.layer !== layer)) {
          issues.add("fragment-identity", p, "Fragments of one logical label must use the same area and layer.");
        }
        fragments.set(key, { area: entry.area, layer });
        const explicitLayer = authored ? entry.layer !== void 0 : entry.layer !== void 0 && entry.layer !== null;
        if (layerIds && explicitLayer && !layerIds.has(layer)) issues.add("unknown-layer", p + "/layer", "Label layer must be declared.");
        if (authored && (!entry.name || type === "district" && !(entry.geometry?.length >= 3) || entry.curve && (entry.curve.length < 3 || entry.textLength !== void 0 && !(entry.textLength > 0)) || !entry.curve && ((entry.widthScale ?? 1) > 1 || !((entry.widthScale ?? 1) > 0)))) {
          issues.add("finished-label", p, "Finished labels need a name and a usable authored outline.");
        }
        if (!authored && !(entry.curve?.length >= 2)) {
          if (![entry.x, entry.y].every(finite)) {
            issues.add("point-anchor", p, "A native point label needs finite x and y anchors.");
          } else if (areas) {
            const tile = areas.get(entry.area);
            if (tile && ![tile.x + entry.x * tile.w, tile.y + entry.y * tile.h].every(finite)) {
              issues.add("projection-finite", p, "Point-label anchors must project to finite world coordinates.");
            }
          }
        }
        const pointSets = authored ? [entry.curve ?? entry.geometry ?? [[entry.x, entry.y]]] : [entry.curve, entry.geometry].filter(Boolean);
        if (!pointSets.length) pointSets.push([[entry.x, entry.y]]);
        for (const points of pointSets) for (let j = 0; j < points.length && !issues.full; j++) {
          const [x, y] = points[j];
          if (![x, y].every(finite)) {
            issues.add("coordinate-finite", p, "Location points must be finite.");
            break;
          }
          if (areas) {
            position({ area: entry.area, x, y }, areas, issues, p, authored);
            const tile = areas.get(entry.area);
            if (tile && ![tile.x + x * tile.w, tile.y + y * tile.h].every(finite)) {
              issues.add("projection-finite", p, "Location must project to finite world coordinates.");
            }
          }
        }
        if (!entry.curve && authored) position(entry, areas, issues, p);
      }
    }
    const metadata = value.locations ?? value.mapLocations ?? [];
    unique(metadata, (record) => record.key ?? record.id, issues, base + "/locations");
    for (let i = 0; i < metadata.length && !issues.full; i++) {
      const record = metadata[i];
      if (areas && record.area !== void 0 && !areas.has(record.area)) {
        issues.add("unknown-area", base + "/locations/" + i + "/area", "Location metadata must refer to a known artwork area.");
      }
      if (record.bounds && (record.bounds[0] > record.bounds[2] || record.bounds[1] > record.bounds[3])) {
        issues.add("location-bounds", base + "/locations/" + i + "/bounds", "Location bounds must be ordered.");
      }
    }
  }
  function checkMap(value, issues, { payload = false } = {}) {
    const areas = areaIndex(value.tiles, value.world, issues, "/tiles", !payload);
    const layers = payload ? new Set(Object.keys(value.layerLabels ?? {})) : /* @__PURE__ */ new Set([
      ...(value.layers ?? []).map((item) => Array.isArray(item) ? item[0] : item.id),
      ...(value.collectibleLayers ?? []).map((item) => item.id)
    ]);
    for (let i = 0; i < (value.places ?? []).length && !issues.full; i++) {
      const place = value.places[i], p = "/places/" + i;
      if (!layers.has(place.type)) issues.add("unknown-layer", p + "/type", "Place type must refer to a declared layer.");
      position(place, areas, issues, p);
      for (let j = 0; j < (place.destinations ?? []).length && !issues.full; j++) position(place.destinations[j], areas, issues, p + "/destinations/" + j);
      for (let j = 0; j < (place.routes ?? []).length && !issues.full; j++) activity(place.routes[j], areas, issues, p + "/routes/" + j);
    }
    for (let i = 0; i < (value.quests ?? []).length && !issues.full; i++) {
      const quest = value.quests[i], p = "/quests/" + i;
      if (!layers.has(value.questTypes?.[quest.type]?.layer)) issues.add("unknown-layer", p + "/type", "Quest type must refer to a declared layer.");
      activity(quest, areas, issues, p);
      position(quest.pin, areas, issues, p + "/pin");
      if (quest.interior) position(quest.interior, areas, issues, p + "/interior");
    }
    checkLocations(value, issues, { areas, layerIds: layers, authored: !payload });
    checkRoutes(value, areas, issues);
    return areas;
  }
  function checkRoutes(value, areas, issues) {
    for (let i = 0; i < (value.routes ?? []).length && !issues.full; i++) {
      const route = value.routes[i], p = "/routes/" + i;
      for (const key of ["from", "to"]) position({ area: route[key][0], x: route[key][1], y: route[key][2] }, areas, issues, p + "/" + key);
      for (const point of route.via ?? []) if (point[0] < 0 || point[1] < 0 || point[0] > value.world.width || point[1] > value.world.height) {
        issues.add("route-waypoint", p + "/via", "Route waypoints use world coordinates within the world.");
        if (issues.full) break;
      }
    }
  }
  function checkScene(scene, issues) {
    const areas = areaIndex(scene.tiles ?? [], scene.world, issues, "/tiles", false);
    checkLocations(scene, issues, { areas });
    checkRoutes(scene, areas, issues);
  }
  function checkPayload(value, issues) {
    checkMap(value, issues, { payload: true });
    checkScene(value.scene, issues);
    if (value.world.width !== value.scene.world.width || value.world.height !== value.scene.world.height) {
      issues.add("model-scene-world", "/scene/world", "Model and scene must describe the same world.");
    }
    const sceneAreas = new Map(value.scene.tiles.map((area) => [area.id, area]));
    if (value.mapLocations !== void 0 && value.scene.locations !== void 0) {
      const locations = new Map(value.scene.locations.map((item) => [item.key ?? item.id, item]));
      if (value.mapLocations.length !== value.scene.locations.length) issues.add("model-scene-locations", "/mapLocations", "Model and scene logical locations must agree.");
      for (let i = 0; i < value.mapLocations.length && !issues.full; i++) {
        const item = value.mapLocations[i], match = locations.get(item.key ?? item.id);
        if (!match || ["area", "type", "layer"].some((key) => item[key] !== match[key]) || JSON.stringify(item.bounds) !== JSON.stringify(match.bounds)) {
          issues.add("model-scene-location", "/mapLocations/" + i, "Model and scene location identity and bounds must agree.");
        }
      }
    }
    if (value.tiles.length !== value.scene.tiles.length) issues.add("model-scene-areas", "/scene/tiles", "Model and scene artwork identities must agree.");
    for (let i = 0; i < value.tiles.length && !issues.full; i++) {
      const area = value.tiles[i], match = sceneAreas.get(area.id);
      if (!match || ["x", "y", "w", "h", "width", "height"].some((key) => match[key] !== area[key])) {
        issues.add("model-scene-area", "/tiles/" + i, "Model and scene artwork coordinates and dimensions must agree.");
      }
    }
  }

  // validation/pyramid.js
  function validateCustomPyramid(value) {
    assertShape("CustomPyramidV1", CustomPyramidV1, value);
    const issues = issueCollector("CustomPyramidV1");
    checkPyramid(value, issues, "", { custom: true });
    issues.finish();
    return value;
  }
  function validateGridPreparation(value) {
    assertShape("GridPreparationInputV1", GridPreparationInputV1, value);
    const issues = issueCollector("GridPreparationInputV1");
    checkPyramidGrid(value.level, value.edge, value.columns, issues, "/level", { custom: true });
    issues.finish();
    return value;
  }

  // pyramid-window.js
  function pyramidVisibleWindow(level, bounds, camera, width, height, margin) {
    const left = camera.x + bounds.x * camera.scale;
    const top = camera.y + bounds.y * camera.scale;
    const scaleX = bounds.w * camera.scale / level.width;
    const scaleY = bounds.h * camera.scale / level.height;
    const { edge, columns } = level;
    const grid = level.grid;
    if (grid && (!(scaleX > 0 && scaleY > 0) || ![scaleX, scaleY, width, height, margin].every(Number.isFinite))) return null;
    const firstX = Math.max(0, Math.floor((-left - margin) / (edge * scaleX)));
    const firstY = Math.max(0, Math.floor((-top - margin) / (edge * scaleY)));
    const lastX = Math.min(columns, Math.ceil((width - left + margin) / (edge * scaleX)));
    const lastY = Math.min(Math.ceil(level.height / edge), Math.ceil((height - top + margin) / (edge * scaleY)));
    const fromX = grid ? Math.max(firstX, grid.bounds.minX) : firstX;
    const fromY = grid ? Math.max(firstY, grid.bounds.minY) : firstY;
    const toX = grid ? Math.min(lastX, grid.bounds.maxX + 1) : lastX;
    const toY = grid ? Math.min(lastY, grid.bounds.maxY + 1) : lastY;
    if (grid && Math.max(0, toX - fromX) * Math.max(0, toY - fromY) > 4096) return null;
    return { left, top, scaleX, scaleY, fromX, fromY, toX, toY };
  }

  // pyramid.js
  function preparePyramidGrid(level, edge, columns) {
    validateGridPreparation({ level, edge, columns });
    return createPreparedGrid(level, edge, columns);
  }
  function createPreparedGrid(level, edge, columns) {
    const grid = level.grid;
    const source = grid.source;
    const rows = Math.ceil(level.height / edge);
    const bounds = grid.bounds ?? { minX: 0, minY: 0, maxX: columns - 1, maxY: rows - 1 };
    const missing = /* @__PURE__ */ new Set();
    if (grid.missing !== void 0) {
      for (const point of grid.missing) {
        missing.add(point[1] * columns + point[0]);
      }
    }
    return { source, originX: grid.originX, originY: grid.originY, zoom: grid.zoom, bounds: { ...bounds }, missing };
  }
  function createAtlasPyramid(input) {
    validateCustomPyramid(input);
    const { levels, tileSize, fallback, wholeViewCoverage, preloadMargin = 64, opaque = false } = input;
    const prepared = levels.map((level) => {
      const tiles = level.tiles ?? [];
      const onlyTile = !level.grid && tiles.length === 1 ? tiles[0] : void 0;
      const whole = onlyTile && onlyTile.x === 0 && onlyTile.y === 0 && onlyTile.w === level.width && onlyTile.h === level.height;
      const { edge, columns } = pyramidLevelMetrics(level, tileSize);
      const cells = new Map(tiles.map((tile) => [
        pyramidCellIndex(tile, edge, columns),
        { ...tile }
      ]));
      const grid = level.grid ? createPreparedGrid(level, edge, columns) : void 0;
      return { ...level, tiles, cells, edge, columns, ...grid ? { grid } : {}, whole: whole ? onlyTile.source : void 0 };
    });
    return {
      fallback: prepared[0]?.whole ?? fallback,
      levels: prepared,
      wholeViewCoverage,
      wholeLevels: wholeViewCoverage ? prepared.filter((level) => level.whole) : [],
      preloadMargin,
      opaque,
      requested: /* @__PURE__ */ new Set(),
      painted: /* @__PURE__ */ new Set()
    };
  }
  function visiblePyramidTiles(level, bounds, camera, width, height, margin) {
    const candidateWindow = pyramidVisibleWindow(level, bounds, camera, width, height, margin);
    const { edge, columns, cells } = level;
    const grid = level.grid;
    if (!candidateWindow) {
      cells.clear();
      return [];
    }
    const { left, top, scaleX, scaleY, fromX, fromY, toX, toY } = candidateWindow;
    const visible = [];
    const retained = grid ? /* @__PURE__ */ new Set() : void 0;
    for (let y = fromY; y < toY; y++) {
      for (let x = fromX; x < toX; x++) {
        const key = y * columns + x;
        if (grid?.missing.has(key)) continue;
        let tile = cells.get(key);
        if (!tile && grid) {
          const source = grid.source.replace(/\{([xyz])\}/g, (_, axis) => axis === "x" ? grid.originX + x : axis === "y" ? grid.originY + y : grid.zoom);
          tile = {
            x: x * edge,
            y: y * edge,
            w: Math.min(edge, level.width - x * edge),
            h: Math.min(edge, level.height - y * edge),
            source
          };
          cells.set(key, tile);
        }
        if (!tile) continue;
        retained?.add(key);
        const tileLeft = left + tile.x * scaleX, tileTop = top + tile.y * scaleY;
        const tileWidth = tile.w * scaleX, tileHeight = tile.h * scaleY;
        const onScreen = tileLeft + tileWidth > 0 && tileLeft < width && tileTop + tileHeight > 0 && tileTop < height;
        const distance = (tileLeft + (tileWidth - width) / 2) ** 2 + (tileTop + (tileHeight - height) / 2) ** 2;
        visible.push({ tile, onScreen, distance });
      }
    }
    if (retained) {
      for (const key of cells.keys()) if (!retained.has(key)) cells.delete(key);
    }
    return visible;
  }
  function clearPyramidRaster(area) {
    const { pyramid } = area;
    if (!pyramid.raster) return;
    const { canvas } = pyramid.raster;
    canvas.remove();
    canvas.width = canvas.height = 0;
    pyramid.raster = void 0;
    pyramid.painted.clear();
    pyramid.paintedLevel = void 0;
    pyramid.base = void 0;
    area.element.removeAttribute("data-pyramid-composited");
  }
  function pyramidRasterBounds(level, candidates) {
    let left = level.width, top = level.height, right = 0, bottom = 0;
    for (const { tile } of candidates) {
      left = Math.min(left, tile.x);
      top = Math.min(top, tile.y);
      right = Math.max(right, tile.x + tile.w);
      bottom = Math.max(bottom, tile.y + tile.h);
    }
    const x = Math.max(0, left - 2), y = Math.max(0, top - 2);
    return { x, y, w: Math.min(level.width, right + 2) - x, h: Math.min(level.height, bottom + 2) - y };
  }
  function paintPyramidTiles(area, level, ready, ownerDocument, candidates) {
    const { pyramid, image } = area;
    if (!ready.length) {
      clearPyramidRaster(area);
      return true;
    }
    const base = image.naturalWidth ? image : void 0;
    const { width, height } = level;
    const cropped = pyramid.opaque;
    const { x, y, w, h } = cropped ? pyramidRasterBounds(level, candidates) : { x: 0, y: 0, w: width, h: height };
    const previous = pyramid.raster;
    const sameBounds = previous?.x === x && previous.y === y && previous.canvas.width === w && previous.canvas.height === h;
    const sameLayer = sameBounds && pyramid.paintedLevel === level && pyramid.base === base;
    if (sameLayer && pyramid.painted.size === ready.length && ready.every((tile) => pyramid.painted.has(tile))) return true;
    if (!pyramid.raster) {
      const canvas2 = ownerDocument.createElement("canvas");
      canvas2.className = "atlas-raster-layer atlas-pyramid-raster";
      canvas2.setAttribute("aria-hidden", "true");
      const context2 = canvas2.getContext("2d");
      if (!context2) return false;
      pyramid.raster = { canvas: canvas2, context: context2 };
      area.element.append(canvas2);
    }
    const { canvas, context } = pyramid.raster;
    const next = new Set(ready);
    if (sameLayer) {
      for (const tile of pyramid.painted) {
        if (next.has(tile)) continue;
        const { x: x2, y: y2, w: w2, h: h2 } = tile;
        context.clearRect(x2, y2, w2, h2);
        if (!base) continue;
        context.save();
        context.beginPath();
        context.rect(x2, y2, w2, h2);
        context.clip();
        context.drawImage(base, 0, 0, width, height);
        context.restore();
      }
    } else {
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      pyramid.raster.x = x;
      pyramid.raster.y = y;
      if (cropped) {
        canvas.style.width = 100 * w / width + "%";
        canvas.style.height = 100 * h / height + "%";
        canvas.style.transform = `translate(${100 * x / w}%, ${100 * y / h}%)`;
      }
      context.setTransform(1, 0, 0, 1, -x, -y);
      context.clearRect(x, y, w, h);
      if (base) context.drawImage(base, 0, 0, width, height);
    }
    for (const tile of ready) {
      if (sameLayer && pyramid.painted.has(tile)) continue;
      context.clearRect(tile.x, tile.y, tile.w, tile.h);
      context.drawImage(tile.image, tile.x, tile.y);
    }
    area.element.toggleAttribute("data-pyramid-composited", !cropped);
    pyramid.paintedLevel = level;
    pyramid.base = base;
    pyramid.painted = next;
    return true;
  }

  // raster-math.js
  var intersects = (a, b, margin = 0) => a.x + a.w > b.x - margin && a.x < b.x + b.w + margin && a.y + a.h > b.y - margin && a.y < b.y + b.h + margin;
  function subtractRectangles(rectangle, cutouts) {
    let pieces = [{ ...rectangle }];
    for (const cut of cutouts) {
      const next = [];
      for (const piece of pieces) {
        const left = Math.max(piece.x, cut.x), top = Math.max(piece.y, cut.y);
        const right = Math.min(piece.x + piece.w, cut.x + cut.w);
        const bottom = Math.min(piece.y + piece.h, cut.y + cut.h);
        if (right <= left || bottom <= top) {
          next.push(piece);
          continue;
        }
        if (top > piece.y) next.push({ x: piece.x, y: piece.y, w: piece.w, h: top - piece.y });
        if (bottom < piece.y + piece.h) next.push({ x: piece.x, y: bottom, w: piece.w, h: piece.y + piece.h - bottom });
        if (left > piece.x) next.push({ x: piece.x, y: top, w: left - piece.x, h: bottom - top });
        if (right < piece.x + piece.w) next.push({ x: right, y: top, w: piece.x + piece.w - right, h: bottom - top });
      }
      pieces = next;
      if (!pieces.length) break;
    }
    return pieces;
  }
  function chooseLevel(pyramid, bounds, camera, width, height, ratio = 1) {
    const pixels = Math.max(bounds.w, bounds.h) * camera.scale * ratio;
    const fitsWhole = pyramid.wholeLevels.length && Math.min(1, width / (bounds.w * camera.scale)) * Math.min(1, height / (bounds.h * camera.scale)) >= pyramid.wholeViewCoverage;
    const levels = fitsWhole ? pyramid.wholeLevels : pyramid.levels;
    return levels.find((level) => Math.max(level.width, level.height) * 1.15 >= pixels) ?? levels.at(-1);
  }
  function cacheBudget(width, height, ratio = 1) {
    const step = 16 * 1024 * 1024;
    return Math.min(256 * 1024 * 1024, Math.max(
      64 * 1024 * 1024,
      Math.ceil(width * height * ratio * ratio * 24 / step) * step
    ));
  }
  function samplingBudget(width, height, ratio = 1) {
    return Math.min(128 * 1024 * 1024, Math.max(24 * 1024 * 1024, Math.ceil(width * height * ratio * ratio * 12)));
  }
  function admissionVictims(residents, incoming, bytes, usedBytes, budgetBytes) {
    if (![bytes, usedBytes, budgetBytes].every(Number.isFinite) || bytes < 0 || usedBytes < 0 || budgetBytes < 0 || bytes > budgetBytes) return null;
    const needed = usedBytes + bytes - budgetBytes;
    if (needed <= 0) return [];
    const candidates = [...residents].filter((resource) => resource !== incoming && resource.texture && resource.bytes > 0 && (!resource.wanted || !resource.coverageProtected && resource.rank > incoming.rank)).sort((a, b) => Number(a.wanted) - Number(b.wanted) || b.rank - a.rank || a.lastUsed - b.lastUsed);
    const victims = [];
    let reclaimed = 0;
    for (const resource of candidates) {
      victims.push(resource);
      reclaimed += resource.bytes;
      if (reclaimed >= needed) return victims;
    }
    return null;
  }
  function quadVertices(rectangle, imageRectangle, worldToUnit) {
    const left = rectangle.x, right = left + rectangle.w, top = rectangle.y, bottom = top + rectangle.h;
    const u0 = (left - imageRectangle.x) / imageRectangle.w, u1 = (right - imageRectangle.x) / imageRectangle.w;
    const v0 = (top - imageRectangle.y) / imageRectangle.h, v1 = (bottom - imageRectangle.y) / imageRectangle.h;
    const point = (x, y, u, v) => {
      const unit = worldToUnit([x, y]);
      return [unit[0] ?? unit.x, unit[1] ?? unit.y, u, v];
    };
    return [
      ...point(left, top, u0, v0),
      ...point(right, top, u1, v0),
      ...point(left, bottom, u0, v1),
      ...point(left, bottom, u0, v1),
      ...point(right, top, u1, v0),
      ...point(right, bottom, u1, v1)
    ];
  }

  // scene-raster.js
  var AtlasSceneRasterMath = {
    intersects,
    subtractRectangles,
    chooseLevel,
    cameraFromMap,
    cacheBudget,
    samplingBudget,
    admissionVictims,
    quadVertices
  };
  function createAtlasSceneRasterLayer(scene, options = {}) {
    const { world } = scene;
    if (![world?.width, world?.height].every((value) => Number.isFinite(value) && value > 0))
      throw new Error("Atlas artwork needs finite world bounds.");
    const size = Math.max(world.width, world.height);
    const worldToUnit = options.worldToUnit ?? ((point) => [point[0] / size, point[1] / size]);
    const worldToLngLat = options.worldToLngLat ?? ((point) => [180 * point[0] / size - 90, 90 - 180 * point[1] / size]);
    const signal = options.signal;
    const imageBase = options.imageBase ?? (typeof document === "object" ? document.baseURI : "http://atlas.invalid/");
    const maxDecodes = 6, maxUploads = 2;
    const resources = /* @__PURE__ */ new Map(), queue = /* @__PURE__ */ new Set();
    const imageryParameters = new URLSearchParams(globalThis.location?.search ?? "");
    const areas = (scene.tiles ?? []).map((tile) => {
      const trial = scene.imageryTrials?.[tile.id];
      const requested = trial && imageryParameters.get(trial.parameter);
      const variant = requested && Object.hasOwn(trial.variants, requested) ? trial.variants[requested] : trial?.variants[trial.defaultVariant];
      const pyramid = variant?.levels?.length ? {
        ...variant,
        fallback: trial.variants.whole?.levels[0]?.tiles[0]?.source ?? tile.sources?.detail ?? tile.pyramid?.fallback
      } : tile.pyramid;
      return {
        ...tile,
        bounds: { x: tile.x, y: tile.y, w: tile.w, h: tile.h },
        pyramid: pyramid ? createAtlasPyramid(pyramid) : void 0,
        previous: [],
        descriptors: [],
        level: void 0
      };
    });
    const overviews = (scene.overviewImages ?? []).filter((item) => item.source && item.width > 0).map((item) => ({ ...item, height: item.height ?? Math.round(item.width * world.height / world.width) })).sort((a, b) => a.width - b.width);
    let map, gl, program, buffer, vertexArray, matrixUniform, textureUniform;
    let maximumTextureEdge = 4096;
    let generation = 0, disposed = false, contextLost = false, activeDecodes = 0, textureBytes = 0, decodedBytes = 0;
    const hardBudget = 256 * 1024 * 1024;
    let desiredBudget = 64 * 1024 * 1024, budget = desiredBudget, retryTimer, lastGeometry = "", commands = [], vertexCount = 0;
    let samplingBudget2 = 24 * 1024 * 1024;
    let lastFrame, loadingReported = false;
    const counters = {
      requests: 0,
      decoded: 0,
      uploads: 0,
      evictions: 0,
      canceled: 0,
      failures: 0,
      geometryUpdates: 0,
      draws: 0,
      contextLosses: 0,
      contextRestores: 0,
      downsampled: 0,
      deferrals: 0
    };
    const recentFailures = [];
    const now = () => typeof performance === "object" ? performance.now() : Date.now();
    const announce = (status) => options.onStatus?.({ subsystem: "artwork", ...status });
    const repaint = () => {
      if (!disposed && !contextLost) map?.triggerRepaint();
    };
    const absolute = (source) => new URL(source, imageBase).href;
    function resourceFor(source, dimensions, rank = 2, distance = 0) {
      if (!source) return void 0;
      const url = absolute(source);
      let resource = resources.get(url);
      if (!resource) {
        resource = {
          url,
          state: "idle",
          attempts: 0,
          retryAt: 0,
          lastUsed: now(),
          rank,
          distance,
          width: dimensions?.width,
          height: dimensions?.height,
          bytes: 0,
          wanted: false
        };
        resources.set(url, resource);
      }
      resource.wanted = true;
      resource.lastUsed = now();
      resource.rank = Math.min(resource.rank, rank);
      resource.distance = Math.min(resource.distance, distance);
      if (!resource.width && dimensions?.width) resource.width = dimensions.width;
      if (!resource.height && dimensions?.height) resource.height = dimensions.height;
      if (resource.state === "idle" && resource.retryAt <= now() && !contextLost && !disposed) {
        resource.state = "queued";
        queue.add(resource);
      }
      return resource;
    }
    function closeBitmap(resource) {
      if (resource.bitmap) {
        decodedBytes -= resource.bitmapBytes ?? 0;
        resource.bitmap.close?.();
        resource.bitmap = void 0;
        resource.bitmapBytes = 0;
      }
    }
    function releaseTexture(resource) {
      if (!resource.texture) return;
      if (gl && !contextLost && !gl.isContextLost()) gl.deleteTexture(resource.texture);
      textureBytes -= resource.bytes;
      resource.texture = void 0;
      resource.bytes = 0;
      if (resource.state === "ready") resource.state = "idle";
    }
    function evictFor(bytes, exclude) {
      const limit = admissionBudget(exclude, bytes);
      const candidates = admissionVictims(resources.values(), exclude, bytes, textureBytes, limit);
      if (!candidates) return false;
      for (const resource of candidates) evict(resource);
      budget = Math.max(budget, limit);
      return true;
    }
    function evict(resource) {
      const oldBytes = resource.bytes;
      releaseTexture(resource);
      counters.evictions++;
      if (resource.wanted) defer(resource, oldBytes);
    }
    function defer(resource, bytes) {
      closeBitmap(resource);
      queue.delete(resource);
      if (resource.state !== "deferred") counters.deferrals++;
      resource.state = "deferred";
      resource.decodedByteEstimate = bytes;
      resource.retryAt = 0;
    }
    function protectedBytes() {
      let bytes = 0;
      for (const resource of resources.values()) if (resource.texture && resource.wanted && resource.coverageProtected) bytes += resource.bytes;
      return bytes;
    }
    function admissionBudget(resource, bytes) {
      return resource.safetyFallback ? Math.min(hardBudget, Math.max(desiredBudget, protectedBytes() + bytes)) : desiredBudget;
    }
    function finishPlanAdmission() {
      const protectedTotal = protectedBytes();
      const target = Math.min(hardBudget, Math.max(desiredBudget, protectedTotal));
      const candidates = [...resources.values()].filter((resource) => resource.texture && !(resource.wanted && resource.coverageProtected)).sort((a, b) => Number(a.wanted) - Number(b.wanted) || b.rank - a.rank || b.distance - a.distance || a.lastUsed - b.lastUsed);
      for (const resource of candidates) {
        if (textureBytes <= target) break;
        evict(resource);
      }
      budget = Math.min(hardBudget, Math.max(desiredBudget, textureBytes));
      for (const resource of resources.values()) if (resource.wanted && resource.state === "deferred") {
        const bytes = resource.decodedByteEstimate;
        if (bytes > 0 && admissionVictims(resources.values(), resource, bytes, textureBytes, admissionBudget(resource, bytes)) !== null) {
          resource.state = "queued";
          queue.add(resource);
        }
      }
    }
    async function decode(resource, localGeneration) {
      const controller = new AbortController();
      resource.controller = controller;
      resource.state = "loading";
      activeDecodes++;
      counters.requests++;
      try {
        const response = await fetch(resource.url, { signal: controller.signal });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const blob = await response.blob();
        const decodeOptions = { premultiplyAlpha: "premultiply" };
        const maximumBytes = Math.min(samplingBudget2 * 0.65, 32 * 1024 * 1024);
        const nativePixels = resource.width * resource.height;
        const maximumEdge = maximumTextureEdge;
        if (nativePixels > 0 && (nativePixels * 4 > maximumBytes || Math.max(resource.width, resource.height) > maximumEdge)) {
          const factor = Math.min(1, Math.sqrt(maximumBytes / (nativePixels * 4)), maximumEdge / Math.max(resource.width, resource.height));
          decodeOptions.resizeWidth = Math.max(1, Math.floor(resource.width * factor));
          decodeOptions.resizeHeight = Math.max(1, Math.floor(resource.height * factor));
          decodeOptions.resizeQuality = "high";
          resource.downsampled = true;
        }
        let bitmap = await createImageBitmap(blob, decodeOptions);
        const actualFactor = Math.min(
          1,
          Math.sqrt(maximumBytes / (bitmap.width * bitmap.height * 4)),
          maximumEdge / Math.max(bitmap.width, bitmap.height)
        );
        if (actualFactor < 1) {
          const original = bitmap;
          try {
            bitmap = await createImageBitmap(original, {
              resizeWidth: Math.max(1, Math.floor(original.width * actualFactor)),
              resizeHeight: Math.max(1, Math.floor(original.height * actualFactor)),
              resizeQuality: "high",
              premultiplyAlpha: "premultiply"
            });
          } finally {
            original.close();
          }
          resource.downsampled = true;
        }
        if (bitmap.width > maximumEdge || bitmap.height > maximumEdge || bitmap.width * bitmap.height * 4 > maximumBytes) {
          bitmap.close();
          throw new Error("Decoded artwork exceeds the texture allocation limit.");
        }
        if (disposed || contextLost || localGeneration !== generation || !resource.wanted || controller.signal.aborted) {
          bitmap.close();
          counters.canceled++;
          if (resource.controller === controller) {
            resource.state = "idle";
            if (!disposed && !contextLost && localGeneration === generation && resource.wanted) {
              resource.state = "queued";
              queue.add(resource);
            }
          }
          return;
        }
        closeBitmap(resource);
        resource.bitmap = bitmap;
        resource.state = "decoded";
        resource.attempts = 0;
        resource.retryAt = 0;
        resource.bitmapBytes = bitmap.width * bitmap.height * 4;
        decodedBytes += resource.bitmapBytes;
        resource.decodedByteEstimate = resource.bitmapBytes;
        counters.decoded++;
        if (resource.downsampled) counters.downsampled++;
        repaint();
      } catch (error) {
        if (disposed || localGeneration !== generation || controller.signal.aborted || error?.name === "AbortError") {
          counters.canceled++;
          if (resource.controller === controller) {
            resource.state = "idle";
            if (!disposed && !contextLost && localGeneration === generation && resource.wanted) {
              resource.state = "queued";
              queue.add(resource);
            }
          }
          return;
        }
        resource.state = "idle";
        resource.attempts++;
        resource.retryAt = now() + ([500, 1500][resource.attempts - 1] ?? Infinity);
        counters.failures++;
        recentFailures.push({ url: resource.url, message: String(error?.message ?? error), attempts: resource.attempts });
        if (recentFailures.length > 20) recentFailures.shift();
        announce({ type: "asset-error", url: resource.url, message: String(error?.message ?? error), retrying: resource.attempts < 3 });
        repaint();
      } finally {
        if (resource.controller === controller) resource.controller = void 0;
        activeDecodes--;
        pump();
      }
    }
    function pump() {
      if (disposed || contextLost) return;
      while (queue.size && activeDecodes < maxDecodes && decodedBytes < Math.max(8 * 1024 * 1024, samplingBudget2 * 0.35)) {
        let chosen;
        for (const resource of queue) if (!chosen || resource.rank < chosen.rank || resource.rank === chosen.rank && resource.distance < chosen.distance) chosen = resource;
        queue.delete(chosen);
        if (!chosen.wanted || chosen.state !== "queued") {
          if (chosen.state === "queued") chosen.state = "idle";
          continue;
        }
        void decode(chosen, generation);
      }
    }
    function material(source, rectangle, dimensions, rank, distance) {
      return { resource: resourceFor(source, dimensions, rank, distance), rectangle, imageRectangle: rectangle };
    }
    function worldRectangle(area, level, tile) {
      return {
        x: area.x + tile.x / level.width * area.w,
        y: area.y + tile.y / level.height * area.h,
        w: tile.w / level.width * area.w,
        h: tile.h / level.height * area.h
      };
    }
    function viewportRectangle(camera, width, height, margin = 0) {
      return {
        x: (-camera.x - margin) / camera.scale,
        y: (-camera.y - margin) / camera.scale,
        w: (width + 2 * margin) / camera.scale,
        h: (height + 2 * margin) / camera.scale
      };
    }
    function plan(camera, width, height, ratio) {
      const view = viewportRectangle(camera, width, height, 96);
      desiredBudget = cacheBudget(width, height, ratio);
      samplingBudget2 = samplingBudget(width, height, ratio);
      for (const resource of resources.values()) {
        resource.wanted = false;
        resource.rank = Infinity;
        resource.distance = Infinity;
        resource.coverageProtected = false;
        resource.safetyFallback = false;
      }
      let overview, overviewDensity = 0;
      if (overviews.length) {
        const target = Math.min(width * ratio, world.width * camera.scale * ratio);
        const affordable = overviews.filter((item) => item.width * item.height * 4 <= samplingBudget2 * 0.65);
        const choices = affordable.length ? affordable : overviews.slice(0, 1);
        const desired = choices.find((item) => item.width * 1.25 >= target) ?? choices.at(-1);
        resourceFor(overviews[0].source, overviews[0], 0, 0).safetyFallback = true;
        const desiredResource = resourceFor(desired.source, desired, 1, 0);
        desiredResource.safetyFallback = true;
        if (!desiredResource.attempts || desiredResource.texture) overviewDensity = desired.width / world.width;
        const ready = choices.filter((item) => resources.get(absolute(item.source))?.texture);
        const selected = ready.at(-1);
        if (selected) overview = {
          resource: resources.get(absolute(selected.source)),
          rectangle: { x: 0, y: 0, w: world.width, h: world.height },
          imageRectangle: { x: 0, y: 0, w: world.width, h: world.height },
          pixels: selected.width
        };
        if (overview) overview.resource.coverageProtected = true;
      }
      const areaMaterials = [];
      for (const area of areas) {
        if (!intersects(area.bounds, view)) continue;
        const centerX = camera.x + (area.x + area.w / 2) * camera.scale - width / 2;
        const centerY = camera.y + (area.y + area.h / 2) * camera.scale - height / 2;
        const distance = centerX * centerX + centerY * centerY;
        if (overviewDensity && camera.scale * ratio <= overviewDensity * 1.25) continue;
        const fallbackSource = area.pyramid?.fallback ?? area.sources?.preview ?? area.sources?.medium ?? area.sources?.detail ?? area.source;
        const first = area.pyramid?.levels[0];
        const fallback = material(fallbackSource, area.bounds, first && first.whole === fallbackSource ? first : void 0, 1, distance);
        if (fallback.resource) fallback.resource.safetyFallback = true;
        const materials = [];
        if (fallback.resource?.texture) materials.push(fallback);
        if (area.pyramid) {
          const level = chooseLevel(area.pyramid, area.bounds, camera, width, height, ratio);
          if (!level) {
            areaMaterials.push(materials);
            continue;
          }
          const descriptors = level.whole ? [material(level.whole, area.bounds, level, 2, distance)] : visiblePyramidTiles(level, area.bounds, camera, width, height, area.pyramid.preloadMargin).map(({ tile, onScreen, distance: cellDistance }) => material(
            tile.source,
            worldRectangle(area, level, tile),
            { width: tile.w, height: tile.h },
            onScreen ? 2 : 3,
            cellDistance
          ));
          if (area.level !== level) {
            area.previous = [...new Map([...area.previous, ...area.descriptors].filter((item) => item.resource?.texture).map((item) => [item.resource.url, item])).values()];
            area.level = level;
          }
          area.descriptors = descriptors;
          const viewport = viewportRectangle(camera, width, height);
          const visibleTargets = descriptors.filter((item) => intersects(item.rectangle, viewport));
          const visibleReady = visibleTargets.every((item) => item.resource?.texture);
          if (visibleReady) area.previous = [];
          if (!fallback.resource?.texture && !overview?.resource.texture) {
            for (const item of visibleTargets) if (item.resource?.texture) item.resource.coverageProtected = true;
          }
          if (fallback.resource?.texture && !overview?.resource.texture && intersects(area.bounds, viewport) && (!visibleReady || visibleTargets.every((item) => item.resource === fallback.resource))) fallback.resource.coverageProtected = true;
          area.previous = area.previous.filter((item) => item.resource?.texture && intersects(item.rectangle, view));
          for (const previous of area.previous) {
            if (previous.resource?.texture && intersects(previous.rectangle, view)) {
              previous.resource.wanted = true;
              previous.resource.lastUsed = now();
              previous.resource.rank = Math.min(previous.resource.rank, 2.5);
              if (!fallback.resource?.texture && !overview?.resource.texture) previous.resource.coverageProtected = true;
              if (previous.resource !== fallback.resource) materials.push(previous);
            }
          }
          const ready = descriptors.filter((item) => item.resource?.texture && item.resource !== fallback.resource);
          materials.push(...ready);
        } else {
          const pixels = Math.max(area.w, area.h) * camera.scale * ratio;
          const source = pixels >= 512 ? area.sources?.detail ?? area.source : pixels >= 208 ? area.sources?.medium ?? area.sources?.detail ?? area.source : area.sources?.preview ?? area.sources?.medium ?? area.sources?.detail ?? area.source;
          const detail = material(source, area.bounds, source === area.sources?.detail || source === area.source ? { width: area.width, height: area.height } : void 0, 2, distance);
          if (detail.resource?.texture && !fallback.resource?.texture && !overview?.resource.texture && intersects(area.bounds, viewportRectangle(camera, width, height))) detail.resource.coverageProtected = true;
          if (fallback.resource?.texture && !overview?.resource.texture && (!detail.resource?.texture || detail.resource === fallback.resource) && intersects(area.bounds, viewportRectangle(camera, width, height))) fallback.resource.coverageProtected = true;
          if (detail.resource?.texture && detail.resource !== fallback.resource) materials.push(detail);
        }
        areaMaterials.push(materials);
      }
      for (const resource of resources.values()) {
        if (resource.wanted) continue;
        if (resource.state === "queued") {
          queue.delete(resource);
          resource.state = "idle";
        }
        if (resource.state === "loading") resource.controller?.abort();
        if (resource.state === "decoded") {
          closeBitmap(resource);
          resource.state = "idle";
        }
      }
      if (resources.size > 2048) for (const resource of resources.values()) {
        if (resources.size <= 2048) break;
        if (!resource.wanted && !resource.texture && !resource.bitmap && ["idle", "deferred"].includes(resource.state)) resources.delete(resource.url);
      }
      finishPlanAdmission();
      clearTimeout(retryTimer);
      let earliest = Infinity;
      for (const resource of resources.values()) if (resource.wanted && resource.retryAt > now()) earliest = Math.min(earliest, resource.retryAt);
      if (Number.isFinite(earliest)) retryTimer = setTimeout(repaint, Math.max(1, earliest - now()));
      pump();
      return { overview, areaMaterials };
    }
    function uploadReady() {
      const ready = [...resources.values()].filter((resource) => resource.wanted && resource.state === "decoded" && resource.bitmap).sort((a, b) => a.rank - b.rank || a.distance - b.distance);
      let count = 0, bytesThisFrame = 0;
      for (const resource of ready) {
        const bytes = resource.bitmap.width * resource.bitmap.height * 4;
        if (count >= maxUploads || count && bytesThisFrame + bytes > Math.max(4 * 1024 * 1024, samplingBudget2 * 0.1)) break;
        if (!evictFor(bytes, resource)) {
          defer(resource, bytes);
          continue;
        }
        let texture;
        try {
          texture = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource.bitmap);
          resource.texture = texture;
          resource.bytes = bytes;
          textureBytes += bytes;
          resource.state = "ready";
          resource.lastUsed = now();
          counters.uploads++;
          count++;
          bytesThisFrame += bytes;
        } catch (error) {
          if (texture) gl.deleteTexture(texture);
          resource.state = "idle";
          resource.retryAt = Infinity;
          counters.failures++;
          announce({ type: "upload-error", url: resource.url, message: String(error?.message ?? error) });
        } finally {
          closeBitmap(resource);
        }
      }
      pump();
      if (ready.some((resource) => resource.wanted && resource.state === "decoded" && resource.bitmap)) repaint();
      return count;
    }
    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Atlas artwork shader: " + error);
      }
      return shader;
    }
    function initializeGL() {
      maximumTextureEdge = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
      const vertex = compile(gl.VERTEX_SHADER, `#version 300 es
      in vec2 a_position; in vec2 a_uv; uniform mat4 u_matrix; out vec2 v_uv;
      void main(){v_uv=a_uv;gl_Position=u_matrix*vec4(a_position,0.0,1.0);}`);
      let fragment;
      try {
        fragment = compile(gl.FRAGMENT_SHADER, `#version 300 es
        precision mediump float; uniform sampler2D u_image; in vec2 v_uv; out vec4 fragColor;
        void main(){fragColor=texture(u_image,v_uv);}`);
        program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
      } finally {
        gl.deleteShader(vertex);
        if (fragment) gl.deleteShader(fragment);
      }
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        program = void 0;
        throw new Error("Atlas artwork program: " + error);
      }
      matrixUniform = gl.getUniformLocation(program, "u_matrix");
      textureUniform = gl.getUniformLocation(program, "u_image");
      buffer = gl.createBuffer();
      vertexArray = gl.createVertexArray();
      gl.bindVertexArray(vertexArray);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const position2 = gl.getAttribLocation(program, "a_position"), uv = gl.getAttribLocation(program, "a_uv");
      gl.enableVertexAttribArray(position2);
      gl.vertexAttribPointer(position2, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(uv);
      gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      lastGeometry = "";
      commands = [];
      vertexCount = 0;
    }
    function updateGeometry(framePlan) {
      const next = [];
      const allAreaCoverage = framePlan.areaMaterials.flatMap((materials) => materials.filter((item) => item.resource?.texture).map((item) => item.rectangle));
      if (framePlan.overview?.resource.texture) {
        for (const rectangle of subtractRectangles(framePlan.overview.rectangle, allAreaCoverage))
          next.push({ ...framePlan.overview, rectangle });
      }
      for (const materials of framePlan.areaMaterials) {
        const available = materials.filter((item) => item.resource?.texture);
        for (let i = 0; i < available.length; i++) {
          const material2 = available[i];
          for (const rectangle of subtractRectangles(material2.rectangle, available.slice(i + 1).map((item) => item.rectangle)))
            next.push({ ...material2, rectangle });
        }
      }
      const key = next.map((item) => item.resource.url + ":" + [
        item.rectangle.x,
        item.rectangle.y,
        item.rectangle.w,
        item.rectangle.h,
        item.imageRectangle.x,
        item.imageRectangle.y,
        item.imageRectangle.w,
        item.imageRectangle.h
      ].join(",")).join("|");
      if (key === lastGeometry) {
        commands = next;
        return;
      }
      const vertices = [];
      for (const command of next) vertices.push(...quadVertices(command.rectangle, command.imageRectangle, worldToUnit));
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      commands = next;
      vertexCount = vertices.length / 4;
      lastGeometry = key;
      counters.geometryUpdates++;
    }
    function lose() {
      if (disposed || contextLost) return;
      contextLost = true;
      generation++;
      counters.contextLosses++;
      clearTimeout(retryTimer);
      queue.clear();
      for (const resource of resources.values()) {
        resource.controller?.abort();
        closeBitmap(resource);
        resource.texture = void 0;
        resource.bytes = 0;
        resource.state = "idle";
      }
      textureBytes = 0;
      program = buffer = vertexArray = void 0;
      lastGeometry = "";
      commands = [];
      announce({ type: "context-lost" });
    }
    function restore() {
      if (disposed || !contextLost || !gl || gl.isContextLost()) return;
      contextLost = false;
      generation++;
      counters.contextRestores++;
      initializeGL();
      announce({ type: "context-restored" });
      repaint();
    }
    function cleanup() {
      if (disposed) return;
      disposed = true;
      generation++;
      clearTimeout(retryTimer);
      queue.clear();
      for (const resource of resources.values()) {
        resource.controller?.abort();
        closeBitmap(resource);
        releaseTexture(resource);
      }
      resources.clear();
      if (gl && !contextLost && !gl.isContextLost()) {
        if (program) gl.deleteProgram(program);
        if (buffer) gl.deleteBuffer(buffer);
        if (vertexArray) gl.deleteVertexArray(vertexArray);
      }
      program = buffer = vertexArray = void 0;
      textureBytes = 0;
      commands = [];
      vertexCount = 0;
      map?.off("webglcontextlost", lose);
      map?.off("webglcontextrestored", restore);
      map?.off("remove", cleanup);
      signal?.removeEventListener("abort", cleanup);
      map = void 0;
    }
    const layer = {
      id: "atlas-scene-artwork",
      type: "custom",
      renderingMode: "2d",
      onAdd(owningMap, context) {
        if (disposed) return;
        map = owningMap;
        gl = context;
        contextLost = gl.isContextLost();
        if (!contextLost) initializeGL();
        map.on("webglcontextlost", lose);
        map.on("webglcontextrestored", restore);
        map.on("remove", cleanup);
        signal?.addEventListener("abort", cleanup, { once: true });
        if (signal?.aborted) cleanup();
        else repaint();
      },
      render(context, args) {
        if (disposed || contextLost || !map || context !== gl || gl.isContextLost()) return;
        const canvas = map.getCanvas();
        const width = canvas.clientWidth || canvas.width, height = canvas.clientHeight || canvas.height;
        if (!(width > 0 && height > 0)) return;
        const ratio = canvas.width / width || 1;
        const camera = cameraFromMap(map, world, worldToLngLat);
        if (!(camera.scale > 0) || ![camera.x, camera.y, camera.scale].every(Number.isFinite)) return;
        let framePlan = plan(camera, width, height, ratio);
        if (uploadReady()) framePlan = plan(camera, width, height, ratio);
        updateGeometry(framePlan);
        lastFrame = { camera, width, height, ratio };
        if (!vertexCount) return;
        const matrix = args?.defaultProjectionData?.mainMatrix;
        if (!matrix || matrix.length !== 16) throw new Error("Atlas artwork requires MapLibre projection data.");
        gl.useProgram(program);
        gl.bindVertexArray(vertexArray);
        gl.uniformMatrix4fv(matrixUniform, false, matrix);
        gl.uniform1i(textureUniform, 0);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.STENCIL_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.activeTexture(gl.TEXTURE0);
        for (let i = 0; i < commands.length; i++) {
          const texture = commands[i].resource.texture;
          if (!texture) continue;
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.drawArrays(gl.TRIANGLES, i * 6, 6);
          counters.draws++;
        }
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (!loadingReported) {
          loadingReported = true;
          announce({ type: "first-artwork" });
        }
      },
      onRemove() {
        cleanup();
      },
      destroy: cleanup,
      getStats() {
        const deferred = [...resources.values()].filter((resource) => resource.state === "deferred");
        return {
          ...counters,
          disposed,
          contextLost,
          textureBytes,
          textureBudget: budget,
          desiredBudget,
          effectiveBudget: budget,
          hardBudget,
          samplingBudget: samplingBudget2,
          deferred: deferred.length,
          deferredWanted: deferred.filter((resource) => resource.wanted).length,
          deferredVisible: deferred.filter((resource) => resource.wanted && resource.rank <= 2).length,
          deferredWantedBytes: deferred.filter((resource) => resource.wanted).reduce((sum, resource) => sum + (resource.decodedByteEstimate ?? 0), 0),
          protectedBytes: protectedBytes(),
          deferredBytes: deferred.reduce((sum, resource) => sum + (resource.decodedByteEstimate ?? 0), 0),
          resources: resources.size,
          textures: [...resources.values()].filter((resource) => resource.texture).length,
          queued: queue.size,
          loading: activeDecodes,
          decodedBytes,
          pendingUploads: [...resources.values()].filter((resource) => resource.bitmap).length,
          commands: commands.length,
          vertices: vertexCount,
          lastFrame,
          recentFailures: recentFailures.slice(),
          allocatedWorldBitmap: false,
          sharedContext: true
        };
      }
    };
    return layer;
  }

  // scene-sprites.js
  function atlasCanvasPinStyle(record, variant = "") {
    const quest = record.kind === "quest", step = record.kind === "step";
    const namedWidth = Object.hasOwn(atlasPlacePinWidths, record.size) ? atlasPlacePinWidths[record.size] : void 0;
    let width = Math.max(8, Math.min(128, typeof record.size === "number" ? record.size : namedWidth ?? (step ? 28.8 : quest ? 30.4 : 18)));
    const shape = record.shape ?? (quest || step ? "circle" : "square");
    const height = shape === "teardrop" ? width * atlasTeardrop.height / atlasTeardrop.width : width;
    const text = String(record.text ?? "•").slice(0, 20);
    const fontSize = record.fontSize ?? (quest || step ? 12.48 : 11 * width / 18);
    if ((quest || step) && text.length > 2 && shape === "circle") {
      const measure = atlasCanvasPinStyle.measure ??= document.createElement("canvas").getContext("2d");
      if (measure) {
        measure.font = `700 ${fontSize}px "Segoe UI", sans-serif`;
        width = Math.min(128, Math.max(width, measure.measureText(text).width + 13));
      }
    }
    return {
      width,
      height,
      shape,
      padding: 6,
      text,
      color: step && (record.selected || variant === "selected") ? "#ffe3a5" : record.color ?? "#5b4932",
      textColor: step && (record.selected || variant === "selected") ? "#3b2517" : record.textColor ?? "#fff6e7",
      fontSize,
      fontWeight: quest || step ? 700 : 750,
      iconURL: record.iconURL ?? "",
      variant
    };
  }
  function atlasCanvasPinImage(style, icon) {
    const ratio = 2, padding = style.padding;
    const width = style.width + padding * 2, height = style.height + padding * 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * ratio);
    canvas.height = Math.ceil(height * ratio);
    const pen = canvas.getContext("2d", { willReadFrequently: true });
    if (!pen) throw new Error("Canvas icon generation is unavailable.");
    pen.scale(ratio, ratio);
    const teardrop = style.shape === "teardrop";
    let path;
    if (teardrop) {
      path = new Path2D(atlasTeardrop.path);
      pen.save();
      pen.translate(padding, padding);
      pen.scale(style.width / atlasTeardrop.width, style.width / atlasTeardrop.width);
    } else {
      path = new Path2D();
      if (style.shape === "circle") path.roundRect(padding + 0.5, padding + 0.5, style.width - 1, style.height - 1, style.height / 2);
      else path.roundRect(padding + 0.5, padding + 0.5, style.width - 1, style.height - 1, 4 * style.width / 18);
    }
    pen.fillStyle = style.color;
    pen.shadowColor = "#101511a8";
    pen.shadowBlur = 4;
    pen.shadowOffsetY = 1;
    pen.fill(path);
    pen.shadowColor = "transparent";
    pen.strokeStyle = style.variant === "preview" ? "#70ffe5" : style.variant === "selected" ? "#ffe3a5" : style.variant === "focus" ? "#fff" : "#f4e9cc";
    if (style.variant === "preview") pen.setLineDash([3, 2]);
    pen.lineWidth = style.variant ? 2.4 : 1;
    pen.lineJoin = "round";
    pen.stroke(path);
    if (teardrop) pen.restore();
    const x = padding + style.width / 2;
    const y = padding + (teardrop ? style.width / 2 : style.height / 2);
    if (icon?.naturalWidth && icon.naturalHeight) {
      const size = 14 * style.width / 18;
      const scale = size / Math.max(icon.naturalWidth, icon.naturalHeight);
      try {
        pen.drawImage(icon, x - icon.naturalWidth * scale / 2, y - icon.naturalHeight * scale / 2, icon.naturalWidth * scale, icon.naturalHeight * scale);
      } catch {
      }
    } else {
      pen.fillStyle = style.textColor;
      pen.font = `${style.fontWeight} ${style.fontSize}px "Segoe UI", "Segoe UI Symbol", sans-serif`;
      pen.textAlign = "center";
      pen.textBaseline = "middle";
      pen.fillText(style.text, x, y + 0.4);
    }
    return pen.getImageData(0, 0, canvas.width, canvas.height);
  }
  function atlasCanvasRouteArrowImage() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 24;
    const pen = canvas.getContext("2d", { willReadFrequently: true });
    if (!pen) throw new Error("Canvas route arrow generation is unavailable.");
    pen.scale(2, 2);
    pen.beginPath();
    pen.moveTo(1, 1);
    pen.lineTo(12, 6);
    pen.lineTo(1, 11);
    pen.closePath();
    pen.fillStyle = "#8ccbd5";
    pen.fill();
    return pen.getImageData(0, 0, 24, 24);
  }

  // validation/contracts.js
  function checked(contract, validator, value, semantic) {
    assertShape(contract, validator, value);
    const issues = issueCollector(contract);
    semantic?.(value, issues);
    issues.finish();
    return value;
  }
  var validateMapPayload = (value) => checked("MapPayloadV1", MapPayloadV1, value, checkPayload);
  var validateScene = (value) => checked("SceneV1", SceneV1, value, checkScene);
  var validateCameraPose = (value) => assertShape("CameraPoseV1", CameraPoseV1, value);
  function validateRendererOptions(value) {
    return checked("RendererOptionsV1", RendererOptionsV1, value, (options, issues) => {
      for (const name of ["onCamera", "onPick", "onHover", "onContextStatus"]) {
        if (options[name] !== void 0 && typeof options[name] !== "function") issues.add("callback-type", "/" + name, "Renderer callback must be a function.");
      }
      if (options.signal != null && (typeof options.signal.aborted !== "boolean" || typeof options.signal.addEventListener !== "function" || typeof options.signal.removeEventListener !== "function")) {
        issues.add("abort-signal", "/signal", "Renderer signal must support abort observation and listener removal.");
      }
      if (options.container !== void 0 && typeof options.container?.querySelector !== "function") issues.add("container-type", "/container", "Provided renderer container must be a DOM query root.");
    });
  }
  function validateScaleRange(minimum, maximum) {
    const value = typeof minimum === "object" && minimum !== null ? minimum : { minimum, maximum };
    return checked("ScaleRangeV1", ScaleRangeV1, value, (range, issues) => {
      if (range.minimum > range.maximum) issues.add("scale-order", "/minimum", "Minimum scale must not exceed maximum scale.");
    });
  }
  var validateSelectionState = (value) => assertShape("SelectionStateV1", SelectionStateV1, value);
  var validateLayerState = (value) => assertShape("LayerStateV1", LayerStateV1, value);
  function locationContext(context) {
    const tiles = context.tiles ?? context.scene?.tiles ?? context.areas;
    const areas = tiles instanceof Map ? tiles : Array.isArray(tiles) ? new Map(tiles.map((tile) => [tile.id, tile])) : context.areaIds ? new Map([...context.areaIds].map((id) => [id, { x: 0, y: 0, w: 1, h: 1 }])) : void 0;
    return { areas, layerIds: context.layerIds ? new Set(context.layerIds) : void 0 };
  }
  function validateLocationSet(value, context = {}) {
    return checked("TransientLocationSetV1", TransientLocationSetV1, value, (input, issues) => checkLocations(input, issues, locationContext(context)));
  }
  function prepareLocationSet(value, context = {}) {
    validateLocationSet(value, context);
    const copy = (entry) => ({
      ...entry,
      ...entry.curve && { curve: entry.curve.map((point) => [...point]) },
      ...entry.geometry && { geometry: entry.geometry.map((point) => [...point]) },
      ...entry.bounds && { bounds: [...entry.bounds] }
    });
    return {
      ...value,
      streets: (value.streets ?? []).map(copy),
      districts: (value.districts ?? []).map(copy),
      locations: (value.locations ?? []).map(copy)
    };
  }
  function validateMarkerSet(value) {
    return checked("MarkerSetV1", MarkerSetV1, value, (records, issues) => {
      const ids = /* @__PURE__ */ new Set();
      for (let i = 0; i < records.length && !issues.full; i++) {
        if (ids.has(records[i].id)) issues.add("duplicate-marker-id", "/" + i + "/id", "Normalized marker IDs must be unique in a replacement.");
        ids.add(records[i].id);
      }
    });
  }
  function prepareMarkerSet(records) {
    if (!Array.isArray(records)) throw new AtlasValidationError("MarkerSetV1", [{ code: "marker-array", path: "", message: "Marker replacement must be an array." }]);
    const staged = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let x, y, id, dx, dy, conversionFailed = false;
      try {
        x = Number(record?.x);
        y = Number(record?.y);
        id = record?.id === void 0 ? void 0 : String(record.id);
        if (record?.dx !== void 0) dx = Number(record.dx) || 0;
        if (record?.dy !== void 0) dy = Number(record.dy) || 0;
      } catch {
        conversionFailed = true;
      }
      if (conversionFailed || !Number.isFinite(x) || !Number.isFinite(y) || id === void 0 || dx !== void 0 && !Number.isFinite(dx) || dy !== void 0 && !Number.isFinite(dy)) {
        throw new AtlasValidationError("MarkerSetV1", [{ code: "marker-coordinate", path: "/" + i, message: "Marker needs a defined identity and finite world coordinates." }]);
      }
      staged.push({
        ...record,
        id,
        x,
        y,
        kind: record.kind ?? "place",
        ...dx !== void 0 && { dx },
        ...dy !== void 0 && { dy }
      });
    }
    validateMarkerSet(staged);
    return staged;
  }
  function prepareSelectionState(ids) {
    if (ids === void 0 || ids === null) return [];
    if (!Array.isArray(ids)) throw new AtlasValidationError("SelectionStateV1", [{ code: "selection-array", path: "", message: "Selection IDs must be an array." }]);
    let prepared;
    try {
      prepared = [...new Set(ids.map(String))];
    } catch {
      throw new AtlasValidationError("SelectionStateV1", [{
        code: "selection-id-conversion",
        path: "",
        message: "Selection IDs must support String conversion."
      }]);
    }
    return validateSelectionState(prepared);
  }
  function prepareHighlightState(id) {
    return id === void 0 || id === null ? void 0 : prepareSelectionState([id])[0];
  }
  function prepareLayerState(ids, options = {}) {
    if (!options || typeof options !== "object" || Array.isArray(options)) throw new AtlasValidationError("LayerStateV1", [{
      code: "layer-options",
      path: "/options",
      message: "Layer options must be an object."
    }]);
    let layers;
    if (ids !== void 0 && ids !== null) {
      try {
        layers = [...new Set(ids)];
      } catch {
        throw new AtlasValidationError("LayerStateV1", [{ code: "layer-iterable", path: "/ids", message: "Layer IDs must form a supported iterable collection." }]);
      }
    }
    validateLayerState({ ids: layers });
    const prepared = { labelsVisible: options.labelsVisible, areaNames: options.areaNames, routes: options.routes };
    if (Object.hasOwn(options, "locationIds")) {
      const values = options.locationIds;
      if (values === void 0 || values === null) prepared.locationIds = void 0;
      else {
        if (!Array.isArray(values)) throw new AtlasValidationError("LayerStateV1", [{ code: "location-id-array", path: "/options/locationIds", message: "Location IDs must be an array or a nullish clear." }]);
        try {
          prepared.locationIds = [...new Set(values.map(String))];
        } catch {
          throw new AtlasValidationError("LayerStateV1", [{ code: "location-id-conversion", path: "/options/locationIds", message: "Location IDs must support String conversion." }]);
        }
      }
    }
    if (Object.hasOwn(options, "selectedLocation")) {
      const target = options.selectedLocation;
      const key = target?.key ?? target ?? void 0;
      if (key !== void 0 && typeof key !== "string" && typeof key !== "number") throw new AtlasValidationError("LayerStateV1", [{
        code: "selected-location-key",
        path: "/options/selectedLocation",
        message: "Selected location must be a scalar ID or an object with a scalar key."
      }]);
      prepared.selectedLocation = key;
    }
    return validateLayerState({ ids: layers, options: prepared });
  }
  function prepareLabelOpacity(id, opacity) {
    assertShape("LabelOpacityCommandV1", LabelOpacityCommandV1, { id: "", opacity });
    let prepared;
    try {
      prepared = String(id);
    } catch {
      throw new AtlasValidationError("LabelOpacityCommandV1", [{ code: "opacity-id-conversion", path: "/id", message: "Opacity ID must support String conversion." }]);
    }
    return { id: prepared, opacity: Math.max(0, Math.min(1, opacity)) };
  }

  // validation/prepared-locations.js
  function validatePreparedLocationSet(value) {
    assertShape("PreparedLocationSetV1", PreparedLocationSetV1, value);
    const issues = issueCollector("PreparedLocationSetV1");
    if (!(value.records instanceof Map)) {
      issues.add("prepared-records", "/records", "Prepared location records must form an index.");
    } else {
      let index = 0;
      for (const record of value.records.values()) {
        if (issues.full) break;
        if (!Number.isFinite(record?.x) || !Number.isFinite(record?.y)) {
          issues.add("prepared-record-center", "/records/" + index, "Prepared location centers must remain finite.");
        }
        index++;
      }
    }
    issues.finish();
    return value;
  }

  // validation/prepared-markers.js
  function validatePreparedMarkerSet(value, { baseURL = "https://atlas.invalid/" } = {}) {
    assertShape("PreparedMarkerSetV1", PreparedMarkerSetV1, value);
    const issues = issueCollector("PreparedMarkerSetV1");
    for (let i = 0; i < value.length && !issues.full; i++) {
      if (!value[i].style.iconURL) continue;
      try {
        new URL(value[i].style.iconURL, baseURL);
      } catch {
        issues.add("marker-icon-url", "/" + i + "/style/iconURL", "Marker icon URL must support normal URL resolution.");
      }
    }
    issues.finish();
    return value;
  }

  // validation/native-camera.js
  var validateCameraCommandOptions = (value) => assertShape("CameraCommandOptionsV1", CameraCommandOptionsV1, value);
  var validateNativeCamera = (value) => assertShape("NativeCameraV1", NativeCameraV1, value);
  function validateNativeZoomRange(value) {
    assertShape("NativeZoomRangeV1", NativeZoomRangeV1, value);
    const issues = issueCollector("NativeZoomRangeV1");
    if (value.minimum > value.maximum) issues.add("native-zoom-order", "/minimum", "Native minimum zoom must not exceed maximum zoom.");
    issues.finish();
    return value;
  }

  // identity-projection.js
  function identityExtent(world, padding) {
    return Math.max(world.width, world.height) * padding;
  }
  function createIdentityProjection(world, padding) {
    const { width, height } = world;
    const extent = identityExtent({ width, height }, padding);
    const planeOffset = Object.freeze(padding === 1 ? [0, 0] : [(extent - width) / 2, (extent - height) / 2]);
    const pointXY = (point) => Array.isArray(point) ? point : [point.x, point.y];
    const worldToUnit = (point) => {
      const [x, y] = pointXY(point);
      return [(x + planeOffset[0]) / extent, (y + planeOffset[1]) / extent];
    };
    const worldToLngLat = (point) => {
      const [x, y] = worldToUnit(point);
      return [180 * x - 90, 90 - 180 * y];
    };
    const lngLatToWorld = (point) => {
      const p = Array.isArray(point) ? point : [point.lng, point.lat];
      return [(p[0] + 90) * extent / 180 - planeOffset[0], (90 - p[1]) * extent / 180 - planeOffset[1]];
    };
    const scaleAtZoom = (zoom) => 512 * Math.pow(2, zoom) / extent;
    const zoomAtScale = (scale) => Math.log2(scale * extent / 512);
    return Object.freeze({
      extent,
      planeOffset,
      pointXY,
      worldToUnit,
      worldToLngLat,
      lngLatToWorld,
      scaleAtZoom,
      zoomAtScale
    });
  }

  // scene-maplibre.js
  var atlasMapLibreModules = /* @__PURE__ */ new Map();
  async function createAtlasCanvasRenderer(options) {
    const abortError = () => new DOMException("Atlas renderer was closed.", "AbortError");
    if (options?.signal?.aborted) throw abortError();
    validateRendererOptions(options);
    validateTileTransport(options.tileTransport);
    const {
      container,
      scene,
      signal,
      tileTransport,
      assetsBase = "assets/atlas-lib/",
      interactive = true,
      editing = false,
      projectionPadding = 1,
      constrainToArtwork = true,
      onCamera = () => {
      },
      onPick = () => {
      },
      onHover = () => {
      },
      onContextStatus = () => {
      }
    } = options;
    if (!container) throw new AtlasValidationError("RendererOptionsV1", [{
      code: "container-required",
      path: "/container",
      message: "Renderer creation requires a DOM container."
    }]);
    const sceneExtent = () => {
      validateScene(scene);
      const extent = identityExtent(scene.world, projectionPadding);
      if (!Number.isFinite(extent)) throw new AtlasValidationError("SceneV1", [{
        code: "projection-extent",
        path: "/world",
        message: "World dimensions and projection padding must produce a finite extent."
      }]);
      return extent;
    };
    sceneExtent();
    const base = new URL(assetsBase.endsWith("/") ? assetsBase : assetsBase + "/", document.baseURI);
    if (!["http:", "https:", "file:"].includes(base.protocol) || base.origin !== location.origin) {
      throw new Error("Atlas must load its renderer from its own local assets.");
    }
    const moduleURL = new URL("maplibre-gl.mjs", base).href;
    if (!atlasMapLibreModules.has(moduleURL)) {
      const promise = import(moduleURL).catch((error) => {
        atlasMapLibreModules.delete(moduleURL);
        throw error;
      });
      atlasMapLibreModules.set(moduleURL, promise);
    }
    const status = (state, extra = {}) => {
      if (!signal?.aborted) onContextStatus({ state, ...extra });
    };
    status("loading");
    const lib = await atlasMapLibreModules.get(moduleURL);
    if (signal?.aborted) throw abortError();
    sceneExtent();
    const { width, height } = scene.world;
    const { pointXY, worldToUnit, worldToLngLat, lngLatToWorld, scaleAtZoom, zoomAtScale } = createIdentityProjection({ width, height }, projectionPadding);
    const byArea = new Map((scene.tiles ?? []).map((tile) => [tile.id, tile]));
    const localWorld = (area, point) => {
      const tile = byArea.get(area);
      if (!tile) throw new Error("Unknown Atlas artwork area: " + area);
      if (!Array.isArray(point) || !point.slice(0, 2).every(Number.isFinite) || point.length < 2) throw new TypeError("Invalid Atlas location geometry.");
      const result = areaLabelToWorld(tile, point);
      if (!result.every(Number.isFinite)) throw new TypeError("Invalid Atlas location geometry.");
      return result;
    };
    const projectLocal = (area, point) => worldToLngLat(localWorld(area, point));
    const fontScale = (size, cap) => {
      const output = (zoom) => {
        const value = typeof size === "number" ? size * scaleAtZoom(zoom) : ["*", size, scaleAtZoom(zoom)];
        return cap === void 0 ? value : typeof value === "number" ? Math.min(cap, value) : ["min", cap, value];
      };
      if (cap === void 0) return ["interpolate", ["exponential", 2], ["zoom"], -2, output(-2), 24, output(24)];
      const stops = [];
      for (let zoom = -2; zoom <= 24; zoom++) stops.push(zoom, output(zoom));
      return ["interpolate", ["exponential", 2], ["zoom"], ...stops];
    };
    const collection = (features) => ({ type: "FeatureCollection", features });
    const feature = (id, geometry, properties = {}) => ({
      type: "Feature",
      id,
      geometry,
      properties: { atlasId: String(id), ...properties }
    });
    let destroyed = false;
    let moving = false;
    let zooming = false;
    let dragging = false;
    let frameMotion;
    let contextLost = false;
    let interactionReady = false;
    let initializationError;
    let viewportWidth = container.clientWidth;
    let viewportHeight = container.clientHeight;
    let requestedMinimumScale;
    let requestedMaximumScale;
    let explicitScaleRange = false;
    const fitScale = () => {
      const padding = viewportWidth < 600 ? 18 : 40;
      return Math.max(1e-9, Math.min((viewportWidth - padding * 2) / width, (viewportHeight - padding * 2) / height));
    };
    const minimumZoom = (minimum = requestedMinimumScale, explicit = explicitScaleRange) => Math.max(
      -2,
      zoomAtScale(explicit ? minimum : Math.min(fitScale(), minimum ?? Infinity))
    );
    const maximumZoom = (maximum = requestedMaximumScale) => Math.min(24, zoomAtScale(maximum ?? scene.config?.maxScale ?? 12));
    const planeMinimum = lngLatToWorld([-90, 90]), planeMaximum = lngLatToWorld([90, -90]);
    function nativeCameraOptions(camera, minimum) {
      const zoom = Math.max(minimum, Math.min(maximumZoom(), zoomAtScale(camera.scale)));
      const scale = scaleAtZoom(zoom);
      const rawCenter = [(viewportWidth / 2 - camera.x) / camera.scale, (viewportHeight / 2 - camera.y) / camera.scale];
      const origin = [viewportWidth / 2 - rawCenter[0] * scale, viewportHeight / 2 - rawCenter[1] * scale];
      const centerWorld = rawCenter.map((value, axis) => constrainToArtwork ? Math.max(0, Math.min(axis ? height : width, value)) : Math.max(planeMinimum[axis], Math.min(planeMaximum[axis], value)));
      const anchor = centerWorld.map((value, axis) => {
        const viewport = axis ? viewportHeight : viewportWidth;
        const margin = Math.min(32, viewport / 2);
        return Math.max(margin, Math.min(viewport - margin, origin[axis] + value * scale));
      });
      return validateNativeCamera({
        center: worldToLngLat(centerWorld),
        zoom,
        bearing: 0,
        pitch: 0,
        padding: {
          left: Math.max(0, anchor[0] * 2 - viewportWidth),
          right: Math.max(0, viewportWidth - anchor[0] * 2),
          top: Math.max(0, anchor[1] * 2 - viewportHeight),
          bottom: Math.max(0, viewportHeight - anchor[1] * 2)
        }
      });
    }
    const constrainWorldCenter = (point, scale, anchor = [viewportWidth / 2, viewportHeight / 2]) => {
      const margin = Math.min(32, viewportWidth / 2, viewportHeight / 2);
      return point.map((value, axis) => {
        const viewport = axis ? viewportHeight : viewportWidth, size = axis ? height : width;
        const lower = Math.max(planeMinimum[axis], (anchor[axis] - viewport + margin) / scale);
        const upper = Math.min(planeMaximum[axis], size + (anchor[axis] - margin) / scale);
        return Math.max(lower, Math.min(upper, value));
      });
    };
    let places = [];
    let dynamicMarkers = [];
    let offsetPlaces = [];
    let offsetDynamicMarkers = [];
    let visibleLayers;
    let visibleLocations;
    let layerSelectedLocation;
    let labelsVisible = true;
    let areaNamesVisible = true;
    let routesVisible = true;
    let selections = /* @__PURE__ */ new Set();
    let boxPreview = /* @__PURE__ */ new Set();
    let highlighted;
    let hoveredIdentity;
    let rasterLayer;
    let curveImages;
    let restoreScene;
    let refreshCameraConnectors;
    let lastConnectorScale;
    let versionPlaces = 0;
    let versionDynamic = 0;
    let versionLocations = 0;
    let renderCount = 0;
    let control;
    const logicalRecords = /* @__PURE__ */ new Map();
    const markerRecords = /* @__PURE__ */ new Map();
    const geometryById = /* @__PURE__ */ new Map();
    const labelOpacities = /* @__PURE__ */ new Map();
    const spriteDefinitions = /* @__PURE__ */ new Map();
    const spriteNames = /* @__PURE__ */ new Map();
    const spriteJobs = /* @__PURE__ */ new Map();
    const iconJobs = /* @__PURE__ */ new Map();
    const iconCancels = /* @__PURE__ */ new Set();
    const thresholdLayers = /* @__PURE__ */ new Map();
    let markerLayerOrderSize = -1;
    const placeOffsets = /* @__PURE__ */ new Map(), dynamicOffsets = /* @__PURE__ */ new Map(), selectionOffsets = /* @__PURE__ */ new Map();
    let lastOffsetExpression;
    const pickLayers = /* @__PURE__ */ new Set();
    const listeners = [];
    const sourceSignatures = /* @__PURE__ */ new Map();
    const semanticSourceIds = /* @__PURE__ */ new Set();
    const sourceWriteCounts = /* @__PURE__ */ new Map();
    const sourceSkipCounts = /* @__PURE__ */ new Map();
    const readPixelRatio = () => Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    let observedPixelRatio = readPixelRatio();
    let resolutionQuery;
    const counters = {
      setPlaces: 0,
      setDynamicMarkers: 0,
      setLocations: 0,
      setSelection: 0,
      setLayers: 0,
      setConnectors: 0,
      sourceWrites: 0,
      sourceSkips: 0,
      layerOrderChanges: 0,
      imageErrors: 0
    };
    const nativeArtwork = projectionPadding === 1 && typeof AtlasSceneNativeRasterMath !== "undefined" ? AtlasSceneNativeRasterMath.inspect(scene, { imageBase: document.baseURI }) : { eligible: false };
    const nativeInactiveTileLimit = nativeArtwork.eligible ? Math.max(1, Math.min(640, Math.floor(160 * 1024 * 1024 / (nativeArtwork.descriptor.tileSize ** 2 * 4)))) : void 0;
    const nativeInactiveCacheBudget = nativeArtwork.eligible ? Object.freeze({
      tileEdge: nativeArtwork.descriptor.tileSize,
      maximumTilesPerSource: nativeInactiveTileLimit,
      baseRGBABytesPerSource: nativeInactiveTileLimit * nativeArtwork.descriptor.tileSize ** 2 * 4,
      scope: "Inactive allowance per source manager; active tiles, mipmaps, texture pools and driver storage are additional."
    }) : void 0;
    const map = new lib.Map({
      container,
      style: {
        version: 8,
        projection: { type: "identity" },
        sources: {},
        layers: [{ id: "atlas-canvas-background", type: "background", paint: { "background-color": "#00000000" } }]
      },
      center: worldToLngLat([width / 2, height / 2]),
      zoom: 0,
      minZoom: minimumZoom(),
      maxZoom: Math.max(minimumZoom(), maximumZoom()),
      pitch: 0,
      bearing: 0,
      minPitch: 0,
      maxPitch: 0,
      dragRotate: false,
      touchZoomRotate: true,
      touchPitch: false,
      renderWorldCopies: false,
      attributionControl: false,
      maplibreLogo: false,
      hash: false,
      interactive,
      keyboard: false,
      fadeDuration: 150,
      trackResize: true,
      // Native raster cache size is otherwise derived from source tileSize.
      // Quality-clamped sources can use a small logical tileSize, so keep the
      // inactive cache bounded explicitly. Visible native tiles are separate.
      ...nativeArtwork.eligible ? { maxTileCacheSize: nativeInactiveTileLimit, maxTileCacheZoomLevels: 2 } : {}
    });
    map.scrollZoom.setWheelZoomRate(1 / 150);
    map.touchZoomRotate.disableRotation();
    const watchPixelRatio = () => {
      resolutionQuery?.removeEventListener("change", syncPixelRatio);
      resolutionQuery = window.matchMedia?.(`(resolution: ${observedPixelRatio}dppx)`);
      resolutionQuery?.addEventListener("change", syncPixelRatio);
    };
    function syncPixelRatio() {
      if (destroyed || signal?.aborted) return;
      const next = readPixelRatio();
      if (next === observedPixelRatio) return;
      observedPixelRatio = next;
      map.setPixelRatio(next);
      rasterLayer?.syncPixelRatio?.();
      curveImages?.rebuild().catch(() => {
      });
      watchPixelRatio();
    }
    watchPixelRatio();
    window.addEventListener("resize", syncPixelRatio);
    const listen = (type, handler) => {
      map.on(type, handler);
      listeners.push([type, handler]);
    };
    function getCamera() {
      const scale = scaleAtZoom(map.getZoom());
      const origin = map.project(worldToLngLat([0, 0]));
      return {
        x: origin.x,
        y: origin.y,
        scale,
        moving: moving || Boolean(frameMotion),
        zooming: zooming || Boolean(frameMotion?.zooming),
        dragging
      };
    }
    const notifyCamera = (event) => {
      if (!destroyed && !signal?.aborted) onCamera({
        ...getCamera(),
        userInteraction: Boolean(event?.originalEvent),
        interrupted: Boolean(event?.interrupted),
        eventType: event?.type
      });
    };
    function stopCameraAnimation(originalEvent) {
      const interrupted = Boolean(frameMotion);
      frameMotion = void 0;
      map.stop();
      if (interrupted) notifyCamera({ type: "atlas-motion-cancel", originalEvent, interrupted: true });
      return control;
    }
    const interruptCameraInput = (event) => {
      if (!frameMotion || event.type === "pointerdown" && event.button !== 0 || event.type === "wheel" && !event.deltaX && !event.deltaY) return;
      stopCameraAnimation(event);
    };
    if (interactive) for (const type of ["pointerdown", "wheel", "touchstart"]) container.addEventListener(type, interruptCameraInput, { capture: true, passive: true });
    listen("movestart", (event) => {
      moving = true;
      hoveredIdentity = void 0;
      if (!frameMotion) notifyCamera(event);
    });
    listen("move", notifyCamera);
    listen("moveend", (event) => {
      moving = false;
      zooming = false;
      dragging = false;
      if (!frameMotion) notifyCamera(event);
    });
    listen("zoomstart", (event) => {
      zooming = true;
      hoveredIdentity = void 0;
      if (!frameMotion) notifyCamera(event);
    });
    listen("zoom", () => refreshCameraConnectors?.());
    listen("zoomend", (event) => {
      zooming = false;
      if (!frameMotion) notifyCamera(event);
    });
    listen("dragstart", (event) => {
      dragging = true;
      hoveredIdentity = void 0;
      notifyCamera(event);
    });
    listen("dragend", (event) => {
      dragging = false;
      notifyCamera(event);
    });
    listen("resize", () => {
      syncPixelRatio();
      const previousWidth = viewportWidth, previousHeight = viewportHeight;
      viewportWidth = container.clientWidth;
      viewportHeight = container.clientHeight;
      if (previousWidth > 0 && previousHeight > 0 && (previousWidth !== viewportWidth || previousHeight !== viewportHeight)) {
        const padding = map.getPadding();
        map.setPadding({
          left: padding.left * viewportWidth / previousWidth,
          right: padding.right * viewportWidth / previousWidth,
          top: padding.top * viewportHeight / previousHeight,
          bottom: padding.bottom * viewportHeight / previousHeight
        });
      }
      const min = minimumZoom(), max = Math.max(min, maximumZoom());
      if (map.getMaxZoom() !== max) map.setMaxZoom(max);
      if (map.getMinZoom() !== min) map.setMinZoom(min);
      notifyCamera();
    });
    listen("render", () => {
      renderCount++;
    });
    listen("webglcontextlost", () => {
      contextLost = true;
      status("lost");
    });
    listen("webglcontextrestored", () => {
      const restore = () => {
        if (destroyed || signal?.aborted) return;
        contextLost = false;
        restoreScene?.();
        status("restored");
      };
      if (map.isStyleLoaded()) restore();
      else map.once("style.load", restore);
    });
    const initializationFailure = (event) => {
      if (event.error?.name === "AbortError") return;
      const type = event.source?.type ?? (event.sourceId ? map.getSource(event.sourceId)?.type : void 0);
      if (!semanticSourceIds.has(event.sourceId) && ["raster", "raster-dem", "image", "video", "canvas"].includes(type)) return;
      return event.error ?? new Error("Atlas scene worker could not initialize.");
    };
    listen("error", (event) => {
      if (event.error?.name === "AbortError") return;
      if (!interactionReady) initializationError ??= initializationFailure(event);
      status("error", { error: event.error, message: event.error?.message ?? "Map resource could not load." });
    });
    const abort = () => destroy();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      let addSource = function(id, features = [], options2 = {}) {
        map.addSource(id, {
          type: "geojson",
          data: collection(features),
          promoteId: "atlasId",
          maxzoom: 24,
          tolerance: 0.05,
          buffer: 128,
          ...options2
        });
        semanticSourceIds.add(id);
        sourceSignatures.set(id, JSON.stringify(features));
        sourceWriteCounts.set(id, 0);
        sourceSkipCounts.set(id, 0);
      }, pathTextSize = function(size) {
        const lastReachableStop = Math.ceil(Math.max(minimumZoom(), maximumZoom()));
        if (lastReachableStop >= 17) return fontScale(size, 240);
        const stops = [];
        for (let zoom = -2; zoom <= lastReachableStop; zoom++) {
          stops.push(zoom, ["min", 240, ["*", size, scaleAtZoom(zoom)]]);
        }
        stops.push(17, 1, 18, 1, 24, 1);
        return ["interpolate", ["exponential", 2], ["zoom"], ...stops];
      }, labelFit = function(entry, baseSize) {
        if (!measure) return { fontSize: baseSize, letterSpacing: 0 };
        measure.font = `700 ${baseSize}px "Segoe UI", sans-serif`;
        const glyphs = [...entry.name];
        const nativeWidth = glyphs.reduce((sum, glyph) => sum + measure.measureText(glyph).width, 0);
        const target = entry.textLength ?? measure.measureText(entry.name).width * (entry.widthScale ?? 1);
        if (!(target > 0) || !(nativeWidth > 0)) return { fontSize: baseSize, letterSpacing: 0 };
        const tracking = (target - nativeWidth) / Math.max(1, glyphs.length - 1) / baseSize;
        if (glyphs.length < 2 || tracking < -0.3) return { fontSize: baseSize * Math.min(1, target / nativeWidth), letterSpacing: 0 };
        return { fontSize: baseSize, letterSpacing: tracking };
      }, prepareLocations = function(next) {
        const geometry2 = [], nextRecords = /* @__PURE__ */ new Map(), nextGeometryById = /* @__PURE__ */ new Map();
        const rememberGeometry = (id, record, item) => {
          nextRecords.set(id, record);
          if (!nextGeometryById.has(id)) nextGeometryById.set(id, []);
          nextGeometryById.get(id).push(item);
          geometry2.push(item);
        };
        for (const tile of scene.tiles ?? []) {
          const id = "area:" + tile.id;
          const fontSize = tile.labelWidth ? 18 : 22;
          const name = tile.shortLabel ?? tile.label;
          const record = {
            id,
            key: id,
            kind: "location",
            type: "area",
            area: tile.id,
            name: tile.label,
            x: tile.x + tile.w / 2,
            y: tile.y + tile.h / 2
          };
          rememberGeometry(id, record, feature(id, { type: "Point", coordinates: worldToLngLat([tile.x, tile.y]) }, {
            atlasKind: "area-name",
            atlasLayer: "area",
            name,
            // Legacy headings wrap within their authored world width. Prepare
            // those lines once; native balanced wrapping uses different breaks.
            wrappedName: atlasCanvasWrapLabel(name, tile.labelWidth || tile.w + 16, fontSize, measure),
            areaLabelOffset: [0, -8 / fontSize],
            fontSize,
            labelColor: "#f8efda",
            haloColor: "#171b19",
            haloWidth: 1
          }));
        }
        const locationsByKey = new Map((next.locations ?? []).map((location2) => [location2.key ?? location2.id, location2]));
        for (const [type, entries] of [["street", next.streets ?? []], ["district", next.districts ?? []]]) {
          for (const entry of entries) {
            const id = `${type}:${entry.id ?? `${entry.area}:${entry.name}`}`;
            const layer = entry.layer ?? type;
            const points = entry.curve ?? entry.geometry ?? [[entry.x, entry.y]];
            const worldPoints = points.map((point) => localWorld(entry.area, point));
            const xs = worldPoints.map((p) => p[0]), ys = worldPoints.map((p) => p[1]);
            const record = {
              ...entry,
              ...locationsByKey.get(id),
              id,
              key: id,
              kind: "location",
              type,
              x: (Math.min(...xs) + Math.max(...xs)) / 2,
              y: (Math.min(...ys) + Math.max(...ys)) / 2
            };
            const baseFontSize = entry.fontSize ?? scene.config?.mapLabelFontSize ?? 6.3;
            const fitted = labelFit(entry, baseFontSize);
            const common = {
              atlasLayer: layer,
              name: entry.name,
              ...fitted,
              labelColor: type === "district" ? "#ffe2ed" : "#fff2c9",
              haloColor: type === "district" ? "#4f2b48" : "#242b28",
              haloWidth: fitted.fontSize * 1.1 / 6.3 / 2,
              angle: entry.angle ?? 0
            };
            if (entry.geometry?.length >= 3) {
              const ring = entry.geometry.map((point) => projectLocal(entry.area, point));
              if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) ring.push(ring[0]);
              rememberGeometry(id, record, feature(id, { type: "Polygon", coordinates: [ring] }, { ...common, atlasKind: "district-fill" }));
            }
            if (entry.curve?.length >= 2) {
              const curve = entry.linear ? worldPoints : atlasCanvasCurve(worldPoints, 0.02);
              const line = curve.map(worldToLngLat);
              rememberGeometry(id, record, feature(id, { type: "LineString", coordinates: line }, { ...common, atlasKind: "street-curve" }));
            } else {
              rememberGeometry(id, record, feature(
                id,
                { type: "Point", coordinates: projectLocal(entry.area, [entry.x, entry.y]) },
                { ...common, atlasKind: type + "-name" }
              ));
            }
          }
        }
        const curves2 = geometry2.filter((f) => f.properties.atlasKind === "street-curve");
        for (const [index, item] of curves2.entries()) item.properties.pathInstance = item.properties.atlasId + ":curve:" + index;
        return validatePreparedLocationSet({ geometry: geometry2, curves: curves2, records: nextRecords, byId: nextGeometryById });
      }, adoptLocations = function(prepared) {
        geometry = prepared.geometry;
        logicalRecords.clear();
        geometryById.clear();
        for (const [id, record] of prepared.records) logicalRecords.set(id, record);
        for (const [id, features] of prepared.byId) geometryById.set(id, features);
      }, textGroups = function(id, source, records, kinds, layout, paint, selected, zoom, visibility = "labels", extraFilter) {
        const groups = /* @__PURE__ */ new Map();
        for (const item of records) if (kinds.includes(item.properties.atlasKind)) {
          const p = item.properties, key = p.fontSize + "/" + p.haloWidth;
          if (!groups.has(key)) groups.set(key, { size: p.fontSize, halo: p.haloWidth });
        }
        if (!groups.size) groups.set("empty", { size: 6.3, halo: 0.55 });
        for (const [index, { size, halo }] of [...groups.values()].entries()) {
          const layerId = id + (index ? "-font-" + index : "");
          const filter = ["all", kindFilter(...kinds), ["==", ["get", "fontSize"], size], ["==", ["get", "haloWidth"], halo], ...extraFilter ? [extraFilter] : []];
          addGeometryLayer({
            id: layerId,
            source,
            type: "symbol",
            ...zoom,
            filter: selected ? filter : geometryFilter(filter),
            layout: { ...textLayout, ...layout, "text-size": layout["symbol-placement"] === "line-center" ? pathTextSize(size) : fontScale(size, 240) },
            paint: { ...paint, "text-halo-width": fontScale(halo, 240 * 1.1 / 6.3 / 2) }
          }, true);
          if (selected) selectedLabelLayers.push(layerId);
          else labelLayers.push({ id: layerId, filter, visibility });
        }
      }, geometryLayers = function(source, suffix = "", selected = false) {
        const filter = (f) => selected ? f : geometryFilter(f);
        const zoom = selected || minLabelZoom <= 0 ? {} : { minzoom: minLabelZoom };
        const overlayColor = [
          "case",
          ["boolean", ["get", "overlayPreview"], false],
          "#70ffe5",
          ["boolean", ["get", "overlaySelected"], false],
          editing ? "#ffd886" : "#ffd27a",
          "#ffffff"
        ];
        const opacity = selected || minLabelZoom <= -2 ? 1 : ["step", ["zoom"], 0, minLabelZoom, 1];
        addGeometryLayer({
          id: "atlas-district-fill" + suffix,
          source,
          type: "fill",
          ...zoom,
          filter: filter(kindFilter("district-fill")),
          // Zoom must be the input of a top-level step/interpolate expression.
          // Multiplying a nested zoom step makes MapLibre reject this layer.
          paint: {
            "fill-color": selected ? overlayColor : "#b2527a",
            "fill-opacity": selected ? ["case", ["boolean", ["get", "overlayPreview"], false], 0.28, 0.22] : typeof opacity === "number" ? 0.22 * opacity : ["step", ["zoom"], 0, minLabelZoom, 0.22],
            "fill-outline-color": selected ? overlayColor : editing ? "#e493bc" : "#a45079"
          }
        }, true);
        addGeometryLayer({
          id: "atlas-district-outline" + suffix,
          source,
          type: "line",
          ...zoom,
          filter: filter(kindFilter("district-fill")),
          paint: { "line-color": selected ? overlayColor : editing ? "#e493bc" : "#a45079", "line-opacity": opacity, "line-width": 1.5 }
        }, true);
        addGeometryLayer({
          id: "atlas-street-hit" + suffix,
          source,
          type: "line",
          ...zoom,
          filter: filter(kindFilter("street-curve")),
          paint: {
            "line-color": selected ? overlayColor : editing ? "#7ee0cd" : "#9ce3da",
            "line-opacity": editing ? 1 : selected ? 0.6 : 0,
            "line-width": editing ? selected ? 2.5 : 2 : selected ? 2 : 8
          }
        }, true);
        const textOpacity = typeof opacity === "number" ? labelOpacity : ["step", ["zoom"], 0, minLabelZoom, labelOpacity];
        const paint = selected ? { ...textPaint, "text-color": overlayColor } : { ...textPaint, "text-opacity": textOpacity };
        textGroups(
          "atlas-location-point-labels" + suffix,
          source,
          geometry,
          ["street-name", "district-name"],
          { "text-rotate": ["coalesce", ["get", "angle"], 0] },
          paint,
          selected,
          zoom
        );
        if (selected) textGroups(
          "atlas-area-names" + suffix,
          source,
          geometry,
          ["area-name"],
          {
            "text-field": ["get", "wrappedName"],
            "text-anchor": "bottom-left",
            "text-justify": "left",
            "text-line-height": 1.1,
            "text-offset": ["get", "areaLabelOffset"]
          },
          paint,
          true,
          zoom,
          "areas"
        );
        const pathLayout = { "symbol-placement": "line-center", "text-max-angle": 90, "text-keep-upright": true };
        textGroups(
          "atlas-location-path-labels" + suffix,
          source,
          curves,
          ["street-curve"],
          pathLayout,
          paint,
          selected,
          zoom,
          "labels",
          ["!=", ["get", "pathLabelImage"], true]
        );
      }, ensureThreshold = function(zoom) {
        const key = zoom.toFixed(8);
        if (thresholdLayers.has(key)) return key;
        const ids = [];
        for (const [source, tag] of [["atlas-places", "place"], ["atlas-dynamic-markers", "dynamic"]]) {
          const id = `atlas-${tag}-icons-${thresholdLayers.size}`;
          const filter = combinedFilter(["==", ["get", "threshold"], key]);
          addLayer({
            id,
            type: "symbol",
            source,
            ...zoom > 0 ? { minzoom: zoom } : {},
            filter,
            layout: {
              "icon-image": ["get", "sprite"],
              "icon-anchor": ["get", "anchor"],
              "icon-offset": offsetExpression(),
              "icon-allow-overlap": true,
              "icon-ignore-placement": false,
              "icon-padding": 0,
              "icon-pitch-alignment": "viewport",
              "icon-rotation-alignment": "viewport"
            },
            paint: thresholdPaint(zoom)
          }, true);
          ids.push(id);
        }
        thresholdLayers.set(key, { zoom, ids });
        return key;
      }, markerAppearance = function(record, variant = "") {
        const style = atlasCanvasPinStyle(record, variant);
        const offset = [Number(record.dx) || 0, (Number(record.dy) || 0) + (style.shape === "teardrop" ? style.padding : 0)];
        return { style, offset, coordinates: worldToLngLat([record.x, record.y]), threshold: thresholdFor(record) };
      }, prepareSelectedMarkers = function(index = markerRecords, state = selectionState(), appearances = []) {
        const selected = /* @__PURE__ */ new Map();
        for (const id of selectedMarkerIds(state)) {
          const record = index.get(id);
          if (!record) continue;
          try {
            selected.set(id, markerAppearance(record, markerVariant(id, state)));
          } catch {
            throw new AtlasValidationError("PreparedMarkerSetV1", [{
              code: "marker-preparation",
              path: "/selection",
              message: "Selected marker appearance could not be prepared safely."
            }]);
          }
        }
        validatePreparedMarkerSet([...appearances, ...selected.values()], { baseURL: document.baseURI });
        return selected;
      }, prepareMarkers = function(records, { dynamic = false } = {}) {
        const normalized = prepareMarkerSet(records);
        const prepared = normalized.map((record, index2) => {
          try {
            const appearance = markerAppearance(record);
            const dx = Number(record.dx) || 0, dy = Number(record.dy) || 0;
            if (dx || dy) {
              const scale = scaleAtZoom(-2);
              appearance.connectorCoordinates = [
                appearance.coordinates,
                worldToLngLat([record.x + dx / scale, record.y + dy / scale])
              ];
            }
            return appearance;
          } catch {
            throw new AtlasValidationError("PreparedMarkerSetV1", [{
              code: "marker-preparation",
              path: "/" + index2,
              message: "Marker appearance could not be prepared safely."
            }]);
          }
        });
        const index = new Map([...dynamic ? places : normalized, ...dynamic ? normalized : dynamicMarkers].map((record) => [record.id, record]));
        const selected = prepareSelectedMarkers(index, selectionState(), prepared);
        return { records: normalized, prepared, index, selected };
      }, markerFeature = function(record, variant = "", offsets = selectionOffsets, appearance) {
        appearance ??= markerAppearance(record, variant);
        validatePreparedMarkerSet([appearance], { baseURL: document.baseURI });
        const { style, offset, coordinates, threshold } = appearance;
        const offsetKey = JSON.stringify(offset);
        offsets.set(offsetKey, offset);
        return feature(record.id, { type: "Point", coordinates }, {
          atlasKind: record.kind,
          atlasLayer: record.layer ?? "",
          sprite: imageName(style),
          anchor: style.shape === "teardrop" ? "bottom" : "center",
          offsetKey,
          threshold: ensureThreshold(threshold)
        });
      }, adoptRecordIndex = function(index) {
        markerRecords.clear();
        for (const [id, record] of index) markerRecords.set(id, record);
      }, refreshConnectors = function(scaleOnly = false) {
        const scale = getCamera().scale;
        if (scaleOnly && (!(offsetPlaces.length || offsetDynamicMarkers.length) || scale === lastConnectorScale)) return;
        const features = [];
        for (const record of [...offsetPlaces, ...offsetDynamicMarkers]) {
          const dx = Number(record.dx) || 0, dy = Number(record.dy) || 0;
          if (!dx && !dy) continue;
          features.push(feature("connector:" + record.id, { type: "LineString", coordinates: [
            worldToLngLat([record.x, record.y]),
            worldToLngLat([record.x + dx / scale, record.y + dy / scale])
          ] }, { color: record.lineColor ?? (record.kind === "place" ? "#9ce3da" : "#ffe3a5"), width: record.lineWidth ?? 1 }));
        }
        lastConnectorScale = scale;
        counters.setConnectors++;
        setSource("atlas-marker-connectors", features);
      }, refreshSelection = function(preparedMarkers) {
        const markerFeatures = [];
        const geometryFeatures = [];
        selectionOffsets.clear();
        for (const id of selectedMarkerIds()) {
          const marker = markerRecords.get(id);
          if (marker) markerFeatures.push(markerFeature(marker, markerVariant(id), selectionOffsets, preparedMarkers?.get(id)));
          for (const f of geometryById.get(id) ?? []) geometryFeatures.push({
            ...f,
            properties: { ...f.properties, overlaySelected: selections.has(id) || layerSelectedLocation === id, overlayPreview: boxPreview.has(id) }
          });
        }
        setSource("atlas-marker-selection", markerFeatures);
        setSource("atlas-geometry-selection", geometryFeatures);
        curveImages?.sync(curveState());
        const expression = offsetExpression(), signature = JSON.stringify(expression);
        if (signature !== lastOffsetExpression) {
          lastOffsetExpression = signature;
          for (const { ids } of thresholdLayers.values()) for (const id of ids) {
            map.setLayoutProperty(id, "icon-offset", expression);
          }
          map.setLayoutProperty("atlas-selection-icons", "icon-offset", expression);
        }
        if (markerLayerOrderSize !== thresholdLayers.size) {
          for (const id of [...selectedLabelLayers, ...curveImages?.overlayLayers ?? []]) {
            if (map.getLayer(id)) map.moveLayer(id);
          }
          const ids = [...thresholdLayers.values()].flatMap((value) => value.ids);
          for (const id of ids) map.moveLayer(id);
          map.moveLayer("atlas-selection-icons");
          markerLayerOrderSize = thresholdLayers.size;
          counters.layerOrderChanges++;
        }
      }, applyVisibility = function() {
        for (const [key, { ids }] of thresholdLayers) for (const id of ids) {
          map.setFilter(id, combinedFilter(["==", ["get", "threshold"], key]));
        }
        for (const [id, kinds] of [
          ["atlas-district-fill", ["district-fill"]],
          ["atlas-district-outline", ["district-fill"]],
          ["atlas-street-hit", ["street-curve"]]
        ]) {
          map.setFilter(id, geometryFilter(kindFilter(...kinds)));
          map.setLayoutProperty(id, "visibility", labelsVisible ? "visible" : "none");
        }
        for (const { id, filter, visibility } of labelLayers) {
          map.setFilter(id, geometryFilter(filter));
          map.setLayoutProperty(id, "visibility", (visibility === "areas" ? areaNamesVisible : labelsVisible) ? "visible" : "none");
        }
        map.setLayoutProperty("atlas-panel-titles", "visibility", areaNamesVisible ? "visible" : "none");
        curveImages?.sync(curveState());
        for (const id of [
          "atlas-travel-routes",
          "atlas-travel-story-routes",
          "atlas-travel-routes-fallback",
          "atlas-travel-story-routes-fallback",
          "atlas-travel-route-ends",
          "atlas-travel-route-arrows"
        ]) {
          map.setLayoutProperty(id, "visibility", routesVisible && (visibleLayers === void 0 || visibleLayers.has("routes")) ? "visible" : "none");
        }
      }, applyGeometryState = function() {
        for (const source of ["atlas-geometry", "atlas-geometry-selection"]) {
          map.removeFeatureState({ source });
          for (const [id, labelOpacity2] of labelOpacities) map.setFeatureState({ source, id }, { labelOpacity: labelOpacity2 });
        }
        for (const id of selections) if (geometryById.has(id)) map.setFeatureState({ source: "atlas-geometry", id }, { selected: true });
        if (highlighted && geometryById.has(highlighted)) map.setFeatureState({ source: "atlas-geometry", id: highlighted }, { focus: true });
      }, installLocationGeometry = function() {
        if (destroyed || contextLost) return;
        const signature = geometryStyleSignature();
        if (signature !== installedGeometryStyle) {
          for (const id of geometryStyleLayers) {
            if (map.getLayer(id)) map.removeLayer(id);
            pickLayers.delete(id);
          }
          geometryStyleLayers.clear();
          labelLayers.length = 0;
          selectedLabelLayers.length = 0;
          geometryLayers("atlas-geometry");
          textGroups(
            "atlas-area-names",
            "atlas-geometry",
            geometry,
            ["area-name"],
            {
              "text-field": ["get", "wrappedName"],
              "text-anchor": "bottom-left",
              "text-justify": "left",
              "text-line-height": 1.1,
              "text-offset": ["get", "areaLabelOffset"]
            },
            textPaint,
            false,
            {},
            "areas"
          );
          for (const id of geometryStyleLayers) map.moveLayer(id, "atlas-marker-connector-lines");
          geometryLayers("atlas-geometry-selection", "-selection", true);
          installedGeometryStyle = signature;
        }
        geometryLayersDirty = false;
        markerLayerOrderSize = -1;
        setSource("atlas-geometry", geometry);
        refreshSelection();
        applyGeometryState();
        applyVisibility();
      }, queryPoint = function(point, radius = 3) {
        if (destroyed || signal?.aborted || contextLost || !interactionReady) return [];
        const p = pointXY(point), scale = scaleAtZoom(map.getZoom());
        const seen = /* @__PURE__ */ new Set(), result = [];
        const features = map.queryRenderedFeatures(
          [[p[0] - radius, p[1] - radius], [p[0] + radius, p[1] + radius]],
          { layers: [...pickLayers].filter((id) => map.getLayer(id)) }
        );
        const imageHits = curveImages?.query(p, radius, scale) ?? [];
        if (imageHits.length) {
          const order = new Map(map.getLayersOrder().map((id, index) => [id, index]));
          features.push(...imageHits.map((hit) => ({ properties: { atlasId: hit.id }, layer: { id: hit.layer } })));
          features.sort((a, b) => (order.get(b.layer.id) ?? -1) - (order.get(a.layer.id) ?? -1));
        }
        for (const f of features) {
          const id = String(f.properties?.atlasId ?? f.id);
          if (seen.has(id)) continue;
          const record = markerRecords.get(id) ?? logicalRecords.get(id);
          if (!record) continue;
          const forced = selections.has(id) || highlighted === id || layerSelectedLocation === id;
          if (Number(record.minScale) > scale + 1e-8 && !forced) continue;
          if (record.kind === "location" && record.type !== "area" && scale + 1e-8 < (scene.config?.mapLabelScale ?? 1.7) && !forced) continue;
          seen.add(id);
          result.push(record);
        }
        return result;
      };
      await new Promise((resolve, reject) => {
        const loaded = () => {
          cleanup();
          resolve();
        };
        const failed = (event) => {
          cleanup();
          reject(event.error ?? new Error("MapLibre could not initialize."));
        };
        const aborted = () => {
          cleanup();
          reject(abortError());
        };
        const cleanup = () => {
          map.off("load", loaded);
          map.off("error", failed);
          signal?.removeEventListener("abort", aborted);
        };
        map.once("load", loaded);
        map.once("error", failed);
        signal?.addEventListener("abort", aborted, { once: true });
        if (map.loaded()) loaded();
      });
      if (destroyed || signal?.aborted) throw abortError();
      map.setTransformCameraUpdate((next) => {
        if (!constrainToArtwork) return {};
        const scale = scaleAtZoom(next.zoom), [cx, cy] = lngLatToWorld(next.center);
        const padding = map.getPadding();
        const anchor = [(viewportWidth + padding.left - padding.right) / 2, (viewportHeight + padding.top - padding.bottom) / 2];
        const [x, y] = constrainWorldCenter([cx, cy], scale, anchor);
        if (Math.abs(x - cx) < 1e-9 && Math.abs(y - cy) < 1e-9) return {};
        return { center: new lib.LngLat(...worldToLngLat([x, y])) };
      });
      const addLayer = (spec, pick = false) => {
        map.addLayer(spec);
        if (pick) pickLayers.add(spec.id);
      };
      const setSource = (id, features) => {
        if (destroyed || contextLost) return;
        const source = map.getSource(id);
        if (!source) return;
        const signature = JSON.stringify(features);
        if (sourceSignatures.get(id) === signature) {
          counters.sourceSkips++;
          sourceSkipCounts.set(id, (sourceSkipCounts.get(id) ?? 0) + 1);
          return;
        }
        source.setData(collection(features));
        sourceSignatures.set(id, signature);
        counters.sourceWrites++;
        sourceWriteCounts.set(id, (sourceWriteCounts.get(id) ?? 0) + 1);
      };
      const layerFilter = () => visibleLayers === void 0 ? ["literal", true] : ["any", ["==", ["get", "atlasLayer"], ""], ["in", ["get", "atlasLayer"], ["literal", [...visibleLayers]]]];
      const kindFilter = (...kinds) => ["in", ["get", "atlasKind"], ["literal", kinds]];
      const combinedFilter = (filter, includeLayer = true) => includeLayer ? ["all", filter, layerFilter()] : filter;
      const locationFilter = () => visibleLocations === void 0 ? ["literal", true] : ["in", ["get", "atlasId"], ["literal", [...visibleLocations]]];
      const geometryFilter = (filter) => ["all", combinedFilter(filter), locationFilter()];
      const minLabelZoom = Math.max(-2, zoomAtScale(scene.config?.mapLabelScale ?? 1.7));
      const baseLabelColor = [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        "#ffd27a",
        ["boolean", ["feature-state", "focus"], false],
        "#ffffff",
        ["get", "labelColor"]
      ];
      const labelOpacity = ["coalesce", ["feature-state", "labelOpacity"], 1];
      const textPaint = {
        "text-color": baseLabelColor,
        "text-halo-color": ["get", "haloColor"],
        "text-halo-width": fontScale(["get", "haloWidth"], 240 * 1.1 / 6.3 / 2),
        "text-opacity": labelOpacity
      };
      const textLayout = {
        "text-field": ["get", "name"],
        "text-font": ["Segoe UI Bold", "Arial Unicode MS Bold"],
        "text-size": fontScale(["get", "fontSize"], 240),
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-letter-spacing": ["coalesce", ["get", "letterSpacing"], 0],
        // In this pinned worker zero means a zero-width wrapping target, not
        // "nowrap". A finite, deliberately wide em limit keeps authored names
        // on one line without serializing Infinity into the style.
        "text-padding": 1,
        "text-max-width": 1e3,
        "text-pitch-alignment": "map",
        "text-rotation-alignment": "map"
      };
      const panelFeatures = [];
      for (const [index, panel] of (scene.panels ?? []).entries()) {
        const radius = Math.min(18, panel.w / 2, panel.h / 2), ring = [];
        for (const [cx, cy, start] of [
          [panel.x + panel.w - radius, panel.y + radius, -90],
          [panel.x + panel.w - radius, panel.y + panel.h - radius, 0],
          [panel.x + radius, panel.y + panel.h - radius, 90],
          [panel.x + radius, panel.y + radius, 180]
        ]) {
          for (let step = 0; step <= 6; step++) {
            const angle = (start + step * 15) * Math.PI / 180;
            ring.push(worldToLngLat([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]));
          }
        }
        ring.push(ring[0]);
        panelFeatures.push(feature("panel:" + index, { type: "Polygon", coordinates: [ring] }, { atlasKind: "panel" }));
        panelFeatures.push(feature(
          "panel-title:" + index,
          { type: "Point", coordinates: worldToLngLat([panel.x + 20, panel.y + 14]) },
          { atlasKind: "panel-title", name: panel.label, fontSize: 32, labelColor: "#fcf3dd", haloColor: "#303a33", haloWidth: 0 }
        ));
      }
      addSource("atlas-panels", panelFeatures);
      addLayer({ id: "atlas-panels-fill", type: "fill", source: "atlas-panels", filter: kindFilter("panel"), paint: { "fill-color": "#303a33" } });
      addLayer({
        id: "atlas-panels-outline",
        type: "line",
        source: "atlas-panels",
        filter: kindFilter("panel"),
        paint: { "line-color": "#647268", "line-width": fontScale(2) }
      });
      addLayer({
        id: "atlas-panel-titles",
        type: "symbol",
        source: "atlas-panels",
        filter: kindFilter("panel-title"),
        layout: { ...textLayout, "text-size": fontScale(32, 240), "text-font": ["Georgia Regular"], "text-anchor": "top-left" },
        paint: { ...textPaint, "text-halo-width": 0 }
      });
      if (typeof createAtlasSceneRasterLayer !== "function") throw new Error("Atlas artwork renderer is not included in this build.");
      const mountRaster = () => {
        const before = map.getStyle().layers.find((layer) => ![
          "atlas-canvas-background",
          "atlas-panels-fill",
          "atlas-panels-outline",
          "atlas-panel-titles"
        ].includes(layer.id))?.id;
        const nativeRaster = projectionPadding === 1 && typeof createAtlasSceneNativeRaster === "function" ? createAtlasSceneNativeRaster(scene, {
          map,
          maplibre: lib,
          signal,
          tileTransport,
          imageBase: document.baseURI,
          onStatus: (value) => status("artwork", { artwork: value })
        }) : void 0;
        if (nativeRaster) {
          rasterLayer = nativeRaster;
          rasterLayer.attach(before);
          return;
        }
        rasterLayer = createAtlasSceneRasterLayer(scene, {
          map,
          worldToUnit,
          worldToLngLat,
          signal,
          assetsBase: base.href,
          onStatus: (value) => status("artwork", { artwork: value })
        });
        if (rasterLayer) {
          map.addLayer(rasterLayer, before);
        }
      };
      mountRaster();
      let geometry = [];
      const measure = document.createElement("canvas").getContext("2d");
      const locationPayload = (value) => ({ streets: value.streets ?? [], districts: value.districts ?? [], locations: value.locations ?? [] });
      const locationSignatureFor = (payload, contract = "TransientLocationSetV1") => {
        try {
          return JSON.stringify(payload);
        } catch {
          throw new AtlasValidationError(contract, [{
            code: "location-signature",
            path: "",
            message: "Location metadata must support a JSON replacement signature."
          }]);
        }
      };
      let locationSignature = locationSignatureFor(locationPayload(scene), "SceneV1");
      const initialLocations = prepareLocations(prepareLocationSet(locationPayload(scene), { areas: byArea }));
      adoptLocations(initialLocations);
      let curves = initialLocations.curves;
      let geometryLayersDirty = false;
      const curveState = () => ({
        selected: selections,
        highlighted,
        selectedLocation: layerSelectedLocation,
        labelsVisible,
        layers: visibleLayers,
        locations: visibleLocations,
        labelOpacities,
        minimumScale: scene.config?.mapLabelScale ?? 1.7,
        threshold: minLabelZoom <= -2 ? 1 : ["step", ["zoom"], 0, minLabelZoom, 1]
      });
      curveImages = await createAtlasCurveLabels({
        map,
        curves,
        toWorld: lngLatToWorld,
        toLngLat: worldToLngLat,
        maxScale: () => scaleAtZoom(maximumZoom()),
        signal,
        canCommit: () => !destroyed && !contextLost && !signal?.aborted,
        onChange() {
          if (!contextLost && !destroyed && map.getSource("atlas-geometry")) {
            markerLayerOrderSize = -1;
            setSource("atlas-geometry", geometry);
            applyVisibility();
            refreshSelection();
          }
        }
      });
      addSource("atlas-geometry", geometry);
      addSource("atlas-geometry-selection");
      const labelLayers = [], selectedLabelLayers = [], geometryStyleLayers = /* @__PURE__ */ new Set();
      const addGeometryLayer = (spec, pick = false) => {
        addLayer(spec, pick);
        geometryStyleLayers.add(spec.id);
      };
      geometryLayers("atlas-geometry");
      textGroups(
        "atlas-area-names",
        "atlas-geometry",
        geometry,
        ["area-name"],
        {
          "text-field": ["get", "wrappedName"],
          "text-anchor": "bottom-left",
          "text-justify": "left",
          "text-line-height": 1.1,
          "text-offset": ["get", "areaLabelOffset"]
        },
        textPaint,
        false,
        {},
        "areas"
      );
      const routeFeatures = [];
      const routeGeometry = {
        perRouteVertexLimit: 4096,
        totalVertexLimit: 16384,
        preparedRoutes: 0,
        preparedVertices: 0,
        nativeFallbackRoutes: 0,
        fallbackReasons: {}
      };
      for (const [index, route] of (scene.routes ?? []).entries()) {
        const start = localWorld(route.from[0], route.from.slice(1));
        const end = localWorld(route.to[0], route.to.slice(1));
        const points = [start, ...route.via ?? [], end];
        const prepared = atlasCanvasDashPolyline(
          points,
          route.class === "story-gate" ? 3 : 7,
          route.class === "story-gate" ? 6 : 8,
          Math.min(routeGeometry.perRouteVertexLimit, routeGeometry.totalVertexLimit - routeGeometry.preparedVertices)
        );
        const worldDashed = Boolean(prepared.lines);
        if (worldDashed) {
          routeGeometry.preparedRoutes++;
          routeGeometry.preparedVertices += prepared.vertices;
        } else {
          routeGeometry.nativeFallbackRoutes++;
          const reason = prepared.fallback;
          routeGeometry.fallbackReasons[reason] = (routeGeometry.fallbackReasons[reason] ?? 0) + 1;
        }
        const properties = { atlasKind: "route", atlasLayer: "routes", storyGate: route.class === "story-gate", worldDashed };
        if (worldDashed ? prepared.lines.length : points.length > 1) routeFeatures.push(feature(
          "travel-route:" + index,
          worldDashed ? { type: "MultiLineString", coordinates: prepared.lines.map((line) => line.map(worldToLngLat)) } : { type: "LineString", coordinates: points.map(worldToLngLat) },
          properties
        ));
        for (const [p, point] of [start, end].entries()) routeFeatures.push(feature(`route-end:${index}:${p}`, { type: "Point", coordinates: worldToLngLat(point) }, properties));
        if (route.oneWay) {
          const previous = route.via?.at(-1) ?? start;
          routeFeatures.push(feature("route-arrow:" + index, { type: "Point", coordinates: worldToLngLat(end) }, {
            ...properties,
            atlasKind: "route-arrow",
            angle: Math.atan2(end[1] - previous[1], end[0] - previous[0]) * 180 / Math.PI
          }));
        }
      }
      addSource("atlas-routes", routeFeatures, { tolerance: 0 });
      const routeFilter = (storyGate, worldDashed) => [
        "all",
        ["==", ["geometry-type"], "LineString"],
        ["==", ["get", "storyGate"], storyGate],
        ["==", ["get", "worldDashed"], worldDashed]
      ];
      addLayer({
        id: "atlas-travel-routes",
        source: "atlas-routes",
        type: "line",
        filter: routeFilter(false, true),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#c0ac7e", "line-width": fontScale(3) }
      });
      addLayer({
        id: "atlas-travel-story-routes",
        source: "atlas-routes",
        type: "line",
        filter: routeFilter(true, true),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#8ccbd5", "line-width": fontScale(3) }
      });
      addLayer({
        id: "atlas-travel-routes-fallback",
        source: "atlas-routes",
        type: "line",
        filter: routeFilter(false, false),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#c0ac7e", "line-width": fontScale(3), "line-dasharray": [2.33, 2.67] }
      });
      addLayer({
        id: "atlas-travel-story-routes-fallback",
        source: "atlas-routes",
        type: "line",
        filter: routeFilter(true, false),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#8ccbd5", "line-width": fontScale(3), "line-dasharray": [1, 2] }
      });
      addLayer({
        id: "atlas-travel-route-ends",
        source: "atlas-routes",
        type: "circle",
        filter: ["all", ["==", ["geometry-type"], "Point"], kindFilter("route")],
        paint: {
          "circle-color": ["case", ["get", "storyGate"], "#b4e2eb", "#f2d492"],
          "circle-radius": fontScale(3.5),
          "circle-stroke-width": fontScale(1.2),
          "circle-stroke-color": "#352f26"
        }
      });
      map.addImage("atlas-route-arrow", atlasCanvasRouteArrowImage(), { pixelRatio: 2 });
      addLayer({
        id: "atlas-travel-route-arrows",
        source: "atlas-routes",
        type: "symbol",
        filter: kindFilter("route-arrow"),
        layout: {
          "icon-image": "atlas-route-arrow",
          "icon-size": fontScale(1),
          "icon-rotate": ["get", "angle"],
          "icon-anchor": "right",
          "icon-offset": [-4, 0],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true
        }
      });
      for (const id of [
        "atlas-travel-routes",
        "atlas-travel-story-routes",
        "atlas-travel-routes-fallback",
        "atlas-travel-story-routes-fallback",
        "atlas-travel-route-ends",
        "atlas-travel-route-arrows"
      ]) map.moveLayer(id, "atlas-district-fill");
      addSource("atlas-places");
      addSource("atlas-dynamic-markers");
      addSource("atlas-marker-selection");
      addSource("atlas-marker-connectors");
      addLayer({
        id: "atlas-marker-connector-lines",
        source: "atlas-marker-connectors",
        type: "line",
        paint: { "line-color": ["get", "color"], "line-width": ["get", "width"] }
      });
      const thresholdFor = (record) => Math.max(-2, Number.isFinite(record.minScale) && record.minScale > 0 ? zoomAtScale(record.minScale) : -2);
      const offsetExpression = () => {
        const entries = new Map([...placeOffsets, ...dynamicOffsets, ...selectionOffsets]);
        if (!entries.size) return ["literal", [0, 0]];
        return ["match", ["get", "offsetKey"], ...[...entries].flatMap(([key, value]) => [key, ["literal", value]]), ["literal", [0, 0]]];
      };
      const thresholdPaint = (zoom) => zoom <= -2 ? {} : { "icon-opacity": ["step", ["zoom"], 0, zoom, 1] };
      const imageName = (style) => {
        const key = JSON.stringify(style);
        let name = spriteNames.get(key);
        if (!name) {
          name = "atlas-sprite-" + spriteNames.size;
          spriteNames.set(key, name);
          spriteDefinitions.set(name, style);
        }
        return name;
      };
      const loadIcon = async (source) => {
        if (!source) return void 0;
        const url = new URL(source, document.baseURI);
        if (!["http:", "https:", "data:", "blob:", "file:"].includes(url.protocol)) return void 0;
        if (!iconJobs.has(url.href)) iconJobs.set(url.href, new Promise((resolve) => {
          const image = new Image();
          let done = false;
          const finish = (result) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            signal?.removeEventListener("abort", cancel);
            iconCancels.delete(cancel);
            image.onload = image.onerror = null;
            resolve(result);
          };
          const cancel = () => {
            finish(void 0);
            image.removeAttribute("src");
          };
          const timer = setTimeout(() => {
            counters.imageErrors++;
            cancel();
          }, 15e3);
          iconCancels.add(cancel);
          signal?.addEventListener("abort", cancel, { once: true });
          if (["http:", "https:"].includes(url.protocol) && url.origin !== location.origin) image.crossOrigin = "anonymous";
          image.onload = () => finish(image);
          image.onerror = () => {
            counters.imageErrors++;
            finish(void 0);
          };
          image.src = url.href;
        }));
        return iconJobs.get(url.href);
      };
      const ensureImage = (id) => {
        if (destroyed || contextLost || map.hasImage(id)) return;
        const style = spriteDefinitions.get(id);
        if (!style) return;
        map.addImage(id, atlasCanvasPinImage(style), { pixelRatio: 2 });
        if (style.iconURL && !spriteJobs.has(id)) spriteJobs.set(id, (async () => {
          const icon = await loadIcon(style.iconURL);
          if (!icon || destroyed || contextLost || signal?.aborted || !map.hasImage(id)) return;
          const image = atlasCanvasPinImage(style, icon);
          map.updateImage(id, image);
        })().finally(() => spriteJobs.delete(id)));
      };
      map.setMissingStyleImageResolver(ensureImage);
      const selectionState = (overrides = {}) => ({ selections, boxPreview, highlighted, layerSelectedLocation, ...overrides });
      const selectedMarkerIds = (state = selectionState()) => /* @__PURE__ */ new Set([
        ...state.selections,
        ...state.boxPreview,
        ...state.highlighted ? [state.highlighted] : [],
        ...state.layerSelectedLocation ? [state.layerSelectedLocation] : []
      ]);
      const markerVariant = (id, state = selectionState()) => state.boxPreview.has(id) ? "preview" : state.selections.has(id) ? "selected" : "focus";
      refreshCameraConnectors = () => refreshConnectors(true);
      addLayer({
        id: "atlas-selection-icons",
        type: "symbol",
        source: "atlas-marker-selection",
        layout: {
          "icon-image": ["get", "sprite"],
          "icon-anchor": ["get", "anchor"],
          "icon-offset": offsetExpression(),
          "icon-allow-overlap": true,
          "icon-ignore-placement": false,
          "icon-padding": 0
        }
      }, true);
      geometryLayers("atlas-geometry-selection", "-selection", true);
      if (curveImages) {
        curveImages.mount("atlas-area-names", "atlas-selection-icons", curveState());
      }
      const geometryStyleSignature = () => JSON.stringify([
        [...new Set(geometry.map((item) => [item.properties.atlasKind, item.properties.fontSize, item.properties.haloWidth].join("/")))].sort(),
        maximumZoom()
      ]);
      let installedGeometryStyle = geometryStyleSignature();
      async function setLocations(next = {}) {
        if (destroyed || signal?.aborted) return control;
        if (!next || typeof next !== "object" || Array.isArray(next)) validateLocationSet(next);
        const payload = prepareLocationSet(locationPayload(next), { areas: byArea });
        const signature = locationSignatureFor(payload);
        if (signature === locationSignature) return control;
        const prepared = prepareLocations(payload);
        locationSignature = signature;
        versionLocations++;
        counters.setLocations++;
        adoptLocations(prepared);
        curves = prepared.curves;
        geometryLayersDirty = true;
        hoveredIdentity = void 0;
        const preparation = curveImages.update(curves);
        if (!contextLost) installLocationGeometry();
        try {
          await preparation;
        } catch (error) {
          if (!destroyed && !signal?.aborted) throw error;
        }
        return control;
      }
      restoreScene = () => {
        sourceSignatures.clear();
        if (rasterLayer?.kind === "native-raster") rasterLayer.restore?.();
        else if (!map.getLayer(rasterLayer?.id)) mountRaster();
        map.setMissingStyleImageResolver(ensureImage);
        if (!map.hasImage("atlas-route-arrow")) map.addImage("atlas-route-arrow", atlasCanvasRouteArrowImage(), { pixelRatio: 2 });
        if (geometryLayersDirty) installLocationGeometry();
        applyGeometryState();
        placeOffsets.clear();
        dynamicOffsets.clear();
        lastOffsetExpression = void 0;
        markerLayerOrderSize = -1;
        setSource("atlas-places", places.map((record) => markerFeature(record, "", placeOffsets)));
        setSource("atlas-dynamic-markers", dynamicMarkers.map((record) => markerFeature(record, "", dynamicOffsets)));
        curveImages?.restore();
        setSource("atlas-geometry", geometry);
        refreshConnectors();
        applyVisibility();
        refreshSelection();
        map.triggerRepaint();
      };
      const pointEvent = (event, type) => ({
        records: queryPoint(event.point),
        point: { x: event.point.x, y: event.point.y },
        originalEvent: event.originalEvent,
        type
      });
      listen("click", (event) => {
        if (interactive && interactionReady && !signal?.aborted) onPick(pointEvent(event, "click"));
      });
      listen("contextmenu", (event) => {
        if (!interactive || !interactionReady || signal?.aborted) return;
        const result = pointEvent(event, "contextmenu");
        if (result.records.length) event.originalEvent?.preventDefault();
        onPick(result);
      });
      listen("mousemove", (event) => {
        if (!interactive || !interactionReady || signal?.aborted || dragging || moving || frameMotion) return;
        const value = pointEvent(event, "mousemove");
        const identity = value.records.map((record) => record.id).join("|");
        if (identity !== hoveredIdentity) {
          hoveredIdentity = identity;
          onHover(value);
        }
        map.getCanvas().style.cursor = value.records.length ? "pointer" : "grab";
      });
      const leave = (event) => {
        hoveredIdentity = void 0;
        if (interactionReady && !destroyed && !signal?.aborted) onHover({ records: [], point: void 0, originalEvent: event, type: "mouseleave" });
      };
      if (interactive) map.getCanvas().addEventListener("mouseleave", leave);
      control = {
        map,
        ready: void 0,
        setLocations,
        setScaleRange(minimum, maximum) {
          if (destroyed || signal?.aborted) return control;
          validateScaleRange({ minimum, maximum });
          if (explicitScaleRange && minimum === requestedMinimumScale && maximum === requestedMaximumScale) return control;
          const previousMaximum = maximumZoom();
          const min = minimumZoom(minimum, true), max = Math.max(min, maximumZoom(maximum));
          validateNativeZoomRange({ minimum: min, maximum: max });
          requestedMinimumScale = minimum;
          requestedMaximumScale = maximum;
          explicitScaleRange = true;
          map.setMinZoom(Math.min(map.getMinZoom(), min));
          map.setMaxZoom(max);
          map.setMinZoom(min);
          if (previousMaximum !== maximumZoom()) {
            geometryLayersDirty = true;
            if (!contextLost) installLocationGeometry();
            curveImages.rebuild(void 0, true).catch((error) => {
              if (!destroyed && !signal?.aborted) status("error", { error, message: error.message });
            });
          }
          notifyCamera();
          return control;
        },
        setCamera(camera, options2 = {}) {
          if (destroyed || signal?.aborted) return control;
          validateCameraPose(camera);
          validateCameraCommandOptions(options2);
          const { animate = false, duration = 250, motion } = options2;
          camera = { ...camera };
          const admitMinimum = !explicitScaleRange && camera.scale < scaleAtZoom(map.getMinZoom());
          const minimum = minimumZoom(admitMinimum ? camera.scale : requestedMinimumScale);
          const prepared = nativeCameraOptions(camera, minimum);
          if (motion === void 0 && frameMotion) stopCameraAnimation();
          const previousMotion = frameMotion;
          frameMotion = motion?.moving ? { zooming: Boolean(motion.zooming) } : void 0;
          const motionChanged = Boolean(previousMotion) !== Boolean(frameMotion) || Boolean(previousMotion?.zooming) !== Boolean(frameMotion?.zooming);
          if (admitMinimum) {
            requestedMinimumScale = camera.scale;
            map.setMinZoom(minimum);
          }
          const current = getCamera();
          if (Math.abs(current.x - camera.x) < 1e-5 && Math.abs(current.y - camera.y) < 1e-5 && Math.abs(current.scale - camera.scale) < 1e-9) {
            if (motionChanged) notifyCamera({ type: "atlas-motion-state" });
            return control;
          }
          if (animate) map.easeTo({ ...prepared, duration, essential: false });
          else map.jumpTo(prepared);
          return control;
        },
        getCamera,
        stopCameraAnimation,
        project(point) {
          const p = map.project(worldToLngLat(point));
          return { x: p.x, y: p.y };
        },
        unproject(point) {
          const p = map.unproject(pointXY(point));
          const [x, y] = lngLatToWorld(p);
          return { x, y };
        },
        setPlaces(records) {
          if (destroyed || signal?.aborted) return control;
          const next = prepareMarkers(records);
          hoveredIdentity = void 0;
          places = next.records;
          counters.setPlaces++;
          versionPlaces++;
          offsetPlaces = places.filter((record) => Number(record.dx) || Number(record.dy));
          adoptRecordIndex(next.index);
          if (contextLost) return control;
          placeOffsets.clear();
          setSource("atlas-places", places.map((record, index) => markerFeature(record, "", placeOffsets, next.prepared[index])));
          refreshConnectors();
          refreshSelection(next.selected);
          return control;
        },
        setDynamicMarkers(records) {
          if (destroyed || signal?.aborted) return control;
          const next = prepareMarkers(records, { dynamic: true });
          hoveredIdentity = void 0;
          dynamicMarkers = next.records;
          counters.setDynamicMarkers++;
          versionDynamic++;
          offsetDynamicMarkers = dynamicMarkers.filter((record) => Number(record.dx) || Number(record.dy));
          adoptRecordIndex(next.index);
          if (contextLost) return control;
          dynamicOffsets.clear();
          setSource("atlas-dynamic-markers", dynamicMarkers.map((record, index) => markerFeature(record, "", dynamicOffsets, next.prepared[index])));
          refreshConnectors();
          refreshSelection(next.selected);
          return control;
        },
        setSelection(ids) {
          if (destroyed || signal?.aborted) return control;
          const next = new Set(prepareSelectionState(ids));
          if (next.size === selections.size && [...next].every((id) => selections.has(id))) return control;
          const prepared = prepareSelectedMarkers(markerRecords, selectionState({ selections: next }));
          if (contextLost) {
            selections = next;
            counters.setSelection++;
            return control;
          }
          for (const id of /* @__PURE__ */ new Set([...selections, ...next])) {
            if (geometryById.has(id)) map.setFeatureState({ source: "atlas-geometry", id }, { selected: next.has(id) });
          }
          selections = next;
          counters.setSelection++;
          refreshSelection(prepared);
          return control;
        },
        setBoxPreview(ids) {
          if (destroyed || signal?.aborted) return control;
          const next = new Set(prepareSelectionState(ids));
          if (next.size === boxPreview.size && [...next].every((id) => boxPreview.has(id))) return control;
          const prepared = prepareSelectedMarkers(markerRecords, selectionState({ boxPreview: next }));
          boxPreview = next;
          if (!contextLost) refreshSelection(prepared);
          return control;
        },
        setLabelOpacity(id, value) {
          if (destroyed || signal?.aborted) return control;
          const prepared = prepareLabelOpacity(id, value);
          id = prepared.id;
          const opacity = prepared.opacity;
          if ((labelOpacities.get(id) ?? 1) === opacity) return control;
          if (opacity === 1) labelOpacities.delete(id);
          else labelOpacities.set(id, opacity);
          if (contextLost) return control;
          for (const source of ["atlas-geometry", "atlas-geometry-selection"]) map.setFeatureState({ source, id }, { labelOpacity: opacity });
          curveImages.sync(curveState());
          return control;
        },
        setLayers(ids, options2 = {}) {
          if (destroyed || signal?.aborted) return control;
          const command = prepareLayerState(ids, options2);
          const layers = command.ids === void 0 ? void 0 : new Set(command.ids);
          const locations = Object.hasOwn(command.options, "locationIds") ? command.options.locationIds === void 0 ? void 0 : new Set(command.options.locationIds) : visibleLocations;
          const selectedLocation = Object.hasOwn(command.options, "selectedLocation") ? command.options.selectedLocation : layerSelectedLocation;
          const prepared = prepareSelectedMarkers(markerRecords, selectionState({ layerSelectedLocation: selectedLocation }));
          visibleLayers = layers;
          visibleLocations = locations;
          layerSelectedLocation = selectedLocation;
          labelsVisible = command.options.labelsVisible ?? labelsVisible;
          areaNamesVisible = command.options.areaNames ?? areaNamesVisible;
          routesVisible = command.options.routes ?? routesVisible;
          counters.setLayers++;
          if (contextLost) return control;
          applyVisibility();
          refreshSelection(prepared);
          return control;
        },
        highlight(id) {
          if (destroyed || signal?.aborted) return control;
          const next = prepareHighlightState(id);
          const prepared = prepareSelectedMarkers(markerRecords, selectionState({ highlighted: next }));
          const previous = highlighted;
          highlighted = next;
          if (contextLost) return control;
          for (const target of [previous, highlighted]) if (target && geometryById.has(target)) {
            map.setFeatureState({ source: "atlas-geometry", id: target }, { focus: target === highlighted });
          }
          refreshSelection(prepared);
          return control;
        },
        queryPoint,
        resize() {
          if (!destroyed) {
            syncPixelRatio();
            map.resize();
          }
          return control;
        },
        destroy,
        getStats() {
          return {
            backend: "maplibre",
            version: lib.getVersion(),
            contextLost,
            destroyed,
            interactionReady,
            interactive,
            editing,
            projectionPadding,
            constrainToArtwork,
            canvasCount: container.querySelectorAll("canvas").length,
            places: places.length,
            dynamicMarkers: dynamicMarkers.length,
            sceneGeometryFeatures: geometry.length,
            sprites: spriteDefinitions.size,
            renderCount,
            placesVersion: versionPlaces,
            dynamicVersion: versionDynamic,
            locationsVersion: versionLocations,
            counters: { ...counters },
            sourceWrites: Object.fromEntries(sourceWriteCounts),
            sourceSkips: Object.fromEntries(sourceSkipCounts),
            routeGeometry: { ...routeGeometry, fallbackReasons: { ...routeGeometry.fallbackReasons } },
            loaded: !destroyed && map.loaded(),
            minScale: scaleAtZoom(map.getMinZoom()),
            fitScale: fitScale(),
            maxScale: scaleAtZoom(maximumZoom()),
            labelFit: "Native SDF tracking; extreme short labels scale uniformly rather than SVG horizontal glyph deformation. Extreme screen text is capped at 240px.",
            nativeInactiveTileLimit,
            nativeInactiveCacheBudget,
            pathLabels: {
              ...curveImages?.getStats() ?? { authoredCurves: 0, imageCurves: 0 },
              nativeSymbolLayerCount: labelLayers.length + selectedLabelLayers.filter((id) => map.getLayer(id)?.type === "symbol").length,
              nativeImageLayerCount: (curveImages?.getStats().imageCurves ?? 0) * 2
            },
            artwork: rasterLayer?.getStats?.()
          };
        }
      };
      control.ready = Promise.resolve(control);
      applyVisibility();
      await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          map.off("render", rendered);
          map.off("error", failed);
          signal?.removeEventListener("abort", aborted);
          error ? reject(error) : resolve();
        };
        const rendered = () => {
          if (destroyed || signal?.aborted) return finish(abortError());
          if (contextLost) return;
          for (const id of semanticSourceIds) {
            if (!map.getSource(id) || !map.isSourceLoaded(id)) return;
          }
          finish();
        };
        const failed = (event) => {
          const error = initializationFailure(event);
          if (error) finish(error);
        };
        const aborted = () => finish(abortError());
        const timer = setTimeout(() => finish(new Error("Atlas scene worker did not finish initializing.")), 2e4);
        map.on("render", rendered);
        map.on("error", failed);
        signal?.addEventListener("abort", aborted, { once: true });
        if (destroyed || signal?.aborted) finish(abortError());
        else if (initializationError) finish(initializationError);
        else map.triggerRepaint();
      });
      if (destroyed || signal?.aborted) throw abortError();
      notifyCamera();
      status("ready");
      interactionReady = true;
      return control;
    } catch (error) {
      destroy();
      throw error;
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      interactionReady = false;
      frameMotion = void 0;
      curveImages?.destroy();
      for (const type of ["pointerdown", "wheel", "touchstart"]) container.removeEventListener(type, interruptCameraInput, true);
      signal?.removeEventListener("abort", abort);
      window.removeEventListener("resize", syncPixelRatio);
      resolutionQuery?.removeEventListener("change", syncPixelRatio);
      resolutionQuery = void 0;
      for (const cancel of [...iconCancels]) cancel();
      for (const [type, handler] of listeners) map.off(type, handler);
      if (rasterLayer?.kind === "native-raster") rasterLayer.destroy();
      map.remove();
      spriteJobs.clear();
      iconJobs.clear();
      markerRecords.clear();
      logicalRecords.clear();
      geometryById.clear();
      sourceSignatures.clear();
      places = [];
      dynamicMarkers = [];
      offsetPlaces = [];
      offsetDynamicMarkers = [];
    }
  }

  // share.js
  function mountAtlasLinkSharing({ signal, dialog, getAddress, getName, onStatus }) {
    const input = dialog.querySelector("[data-atlas-share-url]");
    const context = dialog.querySelector("[data-atlas-share-context]");
    const localNote = dialog.querySelector("[data-atlas-share-local]");
    const busy = /* @__PURE__ */ new Map();
    let version = 0;
    let feedbackTimer;
    let trigger;
    let restoreFocus = true;
    function reset() {
      version++;
      clearTimeout(feedbackTimer);
      onStatus("");
      for (const button of busy.keys()) {
        button.removeAttribute("aria-disabled");
        button.removeAttribute("aria-busy");
      }
      busy.clear();
      if (dialog.open) {
        restoreFocus = false;
        dialog.close();
      }
    }
    async function copy(button) {
      const address = getAddress();
      if (!address || signal.aborted || busy.has(button)) return;
      reset();
      const request = version;
      trigger = button;
      restoreFocus = true;
      busy.set(button, request);
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-busy", "true");
      const current = () => !signal.aborted && request === version && getAddress() === address;
      const local = new URL(address, location.href).protocol === "file:";
      try {
        await navigator.clipboard.writeText(address);
        if (!current()) return;
        onStatus(local ? "Local link copied" : "Link copied");
        feedbackTimer = setTimeout(() => {
          if (current()) onStatus("");
        }, 2500);
      } catch {
        if (!current()) return;
        context.textContent = getName();
        input.value = address;
        input.setAttribute("aria-label", `Link to ${getName()}`);
        localNote.hidden = !local;
        dialog.showModal();
        input.focus({ preventScroll: true });
        input.select();
      } finally {
        if (busy.get(button) === request) {
          button.removeAttribute("aria-disabled");
          button.removeAttribute("aria-busy");
          busy.delete(button);
        }
      }
    }
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dialog.close();
    }, { signal });
    dialog.addEventListener("close", () => {
      if (!restoreFocus || signal.aborted || !trigger?.isConnected || trigger.disabled) return;
      if (trigger.getClientRects().length && !trigger.closest("[hidden], [inert]") && getComputedStyle(trigger).visibility !== "hidden") trigger.focus({ preventScroll: true });
    }, { signal });
    signal.addEventListener("abort", reset, { once: true });
    return { copy, reset };
  }

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

  // tooltips.js
  function atlasRouteTooltip(route, { name = route.name, meta = "", stepIndex = 0, start = false, photo } = {}) {
    const step = route.steps?.[stepIndex];
    const letter = step?.letter === "board" ? "Board" : step?.letter ? `Pin ${step.letter}` : "";
    const requirements = route.prerequisites?.parts?.map((part) => part.text ?? "").join("") || route.requires;
    return {
      name,
      meta,
      photo,
      phase: step ? [start ? "Start here" : letter, start ? letter : `Step ${stepIndex + 1} of ${route.steps.length}`].filter(Boolean).join(" · ") : "",
      text: step?.text ?? route.preview?.text ?? route.detail ?? route.where,
      facts: step?.facts,
      factSections: step?.factSections,
      ...requirements && { notes: [{ label: "Requires", text: requirements }] }
    };
  }
  function atlasClusterTooltip(group, { areaLabel = "" } = {}) {
    const entries = group.entries ?? [];
    const first = entries[0]?.point;
    const shared = first && entries.every(({ point }) => point?.area === first.area && point.x === first.x && point.y === first.y);
    return {
      name: shared ? `${entries.length} ${entries.length === 1 ? "quest" : "quests"} at this spot` : `${entries.length} nearby quest ${entries.length === 1 ? "start" : "starts"}`,
      meta: areaLabel,
      items: entries.slice(0, 3).map(({ quest }) => `#${quest.id} ${quest.name}`),
      remaining: entries.length - Math.min(3, entries.length),
      footer: "Click the pin or press Enter to choose a quest."
    };
  }
  function atlasPlaceTooltip(place, { name = place.name, meta = "", entries = place.entries ?? [], routes = place.routes ?? [], destinationNames = [] } = {}) {
    const model = { name, meta, photo: place.photo ?? place.pickup?.photo };
    if (place.pickup) {
      const pickup = place.pickup;
      model.text = pickup.preview?.text ?? pickup.description ?? (pickup.steps ?? []).join(" ");
      model.facts = pickup.facts;
      model.factSections = pickup.factSections;
      model.notes = [pickup.note, !(pickup.facts ?? []).some((fact) => `${fact.label} · ${fact.value}` === pickup.reward) && pickup.reward].filter(Boolean).map((text) => ({ text }));
      return model;
    }
    if (place.entries?.length > 1) {
      model.text = place.preview?.text ?? place.detail;
      model.items = entries.slice(0, 3).map((entry) => entry.name);
      model.remaining = Math.max(0, entries.length - model.items.length);
      if (entries.length !== place.entries.length) model.meta = [meta, `${entries.length} of ${place.entries.length} items shown`].filter(Boolean).join(" · ");
      model.footer = "Open details to view every item and its conditions.";
      return model;
    }
    if (place.routes?.length) {
      if (routes.length === 1) {
        const route = routes[0];
        const index = route.steps?.findIndex((step) => {
          const point = route.locations?.[step.letter];
          return point?.area === place.area && point.x === place.x && point.y === place.y;
        }) ?? -1;
        if (index >= 0) return atlasRouteTooltip(route, {
          name: route.name,
          meta,
          stepIndex: index,
          photo: model.photo ?? route.locations[route.steps[index].letter]?.photo
        });
      }
      model.items = routes.slice(0, 3).map((route) => route.name);
      model.remaining = Math.max(0, routes.length - model.items.length);
      model.text = routes.length ? `${routes.length} ${routes.length === 1 ? "activity" : "activities"} at this location.` : "No activities match the current filters.";
      model.footer = "Click the pin or press Enter to view activities.";
      return model;
    }
    const source = entries[0] ?? place;
    model.text = source.preview?.text ?? source.detail ?? place.detail;
    model.facts = [...source.facts ?? [], ...source === place ? [] : place.facts ?? []];
    model.factSections = [...source.factSections ?? [], ...source === place ? [] : place.factSections ?? []];
    if (source.approximate && !place.approximate) model.meta = [meta, "Approximate location"].filter(Boolean).join(" · ");
    const catalogues = [...new Set((place.catalogues ?? []).flatMap((catalogue) => (catalogue.sections ?? []).map((section) => section.label)).filter(Boolean))];
    if (catalogues.length) model.facts.push({ label: "Catalogue", value: catalogues.join(" · ") });
    if (destinationNames.length) model.facts.push({ label: "Connects to", value: [...new Set(destinationNames)].join(" · ") });
    return model;
  }
  function atlasAppendTooltip(container, model) {
    const element = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== void 0) node.textContent = text;
      return node;
    };
    const header = element("div", "atlas-tooltip-header");
    const title = element("h3", "atlas-tooltip-name", model.name);
    title.setAttribute("aria-hidden", "true");
    header.append(title);
    if (model.meta) header.append(element("p", "atlas-tooltip-meta", model.meta));
    container.append(header);
    if (model.phase) container.append(element("p", "atlas-tooltip-phase", model.phase));
    if (model.text) container.append(element("p", "atlas-tooltip-action", model.text));
    if (model.items?.length) {
      const list = element("ul", "atlas-tooltip-items");
      for (const text of model.items) list.append(element("li", "", text));
      container.append(list);
    }
    if (model.remaining) container.append(element("p", "atlas-tooltip-remaining", `And ${model.remaining} more`));
    const support = element("div", "atlas-tooltip-support");
    for (const note of model.notes ?? []) {
      const group = element("div", "atlas-tooltip-note");
      if (note.label) group.append(element("p", "atlas-tooltip-note-label", note.label));
      group.append(element("p", "", note.text));
      support.append(group);
    }
    atlasAppendFacts(support, model);
    if (support.children.length) container.append(support);
    container.append(element("p", "atlas-tooltip-footer", model.footer ?? "Click the pin or press Enter for full details."));
  }

  // viewport-math.js
  function atlasZoomTransform(from, scale, anchor, target = anchor) {
    const factor = scale / from.scale;
    return {
      x: target.x - (anchor.x - from.x) * factor,
      y: target.y - (anchor.y - from.y) * factor,
      scale
    };
  }
  function atlasWheelDelta(event, viewportHeight) {
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportHeight : 1);
    return Number.isFinite(delta) ? delta : 0;
  }
  function atlasWheelTargetScale(targetScale, delta, min, max) {
    const gain = 2 / (1 + Math.exp(-Math.abs(delta) * 6e-3));
    return Math.max(min, Math.min(max, targetScale * (delta < 0 ? gain : 1 / gain)));
  }
  function atlasSampleWheelEasing(control, time) {
    let min = 0, max = 1, t = time;
    let dx = 0;
    for (let i = 0; i < 20; i++) {
      const u2 = 1 - t;
      const error = 3 * u2 * u2 * t * control.x + 0.75 * u2 * t * t + t ** 3 - time;
      dx = 3 * (u2 * u2 * control.x + 2 * u2 * t * (0.25 - control.x) + 0.75 * t * t);
      if (Math.abs(error) < 1e-7) break;
      if (error > 0) max = t;
      else min = t;
      const next = t - error / dx;
      if (i < 19) t = next > min && next < max ? next : (min + max) / 2;
    }
    const u = 1 - t;
    const value = 3 * u * u * t * control.y + 3 * u * t * t + t ** 3;
    const dy = 3 * (u * u * control.y + 2 * u * t * (1 - control.y));
    return { value, slope: dy / dx };
  }
  function atlasWheelRetargetControl(logChange, previousVelocity, duration = 200) {
    const slope = Math.max(0, previousVelocity * duration / logChange);
    const x = slope > 3 ? 0.75 / slope : 0.25;
    return { x, y: x * slope };
  }

  // validation/payload.js
  function parseMapPayload(text) {
    if (typeof text !== "string") throw new AtlasValidationError("MapPayloadV1", [{
      code: "payload-source",
      path: "",
      message: "Atlas markup must include its data JSON."
    }]);
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw new AtlasValidationError("MapPayloadV1", [{
        code: "payload-json",
        path: "",
        message: "Atlas data must contain valid JSON."
      }]);
    }
    return validateMapPayload(value);
  }

  // engine.js
  function mountAtlas(root, { signal, ...options } = {}) {
    if (signal?.aborted) throw new DOMException("Atlas view was closed.", "AbortError");
    if (!root?.querySelector) throw new TypeError("Atlas needs a host element containing renderAtlas() markup.");
    const lifetime = new AbortController();
    const destroy = () => lifetime.abort();
    signal?.addEventListener("abort", destroy, { once: true, signal: lifetime.signal });
    try {
      const view = mountAtlasView(root, { ...options, signal: lifetime.signal });
      lifetime.signal.throwIfAborted();
      return { ...view, destroy };
    } catch (error) {
      destroy();
      throw error;
    }
  }
  function mountAtlasView(root, { signal: viewSignal, state: viewState = {}, adapter = {}, autoOpen = true, linkURL, tileTransport } = {}) {
    const onView = (target, type2, listener, options = {}) => target.addEventListener(type2, listener, { ...options, signal: viewSignal });
    const mapShell = root.querySelector(".atlas-shell");
    const query = (selector) => mapShell.querySelector(selector);
    const { world, tiles, quests, objectives, places, placeTypes, questTypes, layerIcons = {}, layerLabels = {}, layerColors = {}, mapLocations = [], scene, config } = parseMapPayload(root.querySelector("#atlas-data")?.textContent);
    const displayTypeName = (value) => config.typeLabels?.[value] ?? value;
    const byArea = new Map(tiles.map((tile) => [tile.id, tile]));
    const placeIndexByObject = new Map(places.map((place, index) => [place, index]));
    const locations = new Map(mapLocations.map((location2) => [location2.key, location2]));
    for (const { id, label } of tiles) {
      const key = "area:" + id;
      locations.set(key, { key, type: "area", area: id, name: label });
    }
    const mapPositions = /* @__PURE__ */ new WeakMap();
    const { story, onCollectibleProgress, onRouteProgress, resolveLink } = adapter;
    const mapStorage = adapter.storage ?? {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key)
    };
    const linkedRouteType = config.linkedRouteType;
    const linkedRouteLabel = config.linkedRouteLabel ?? "Activity";
    const linkedRoutes = places.flatMap((place) => (place.routes ?? []).map((entry) => ({ ...entry, place, type: linkedRouteType })));
    const completedRoutes = /* @__PURE__ */ new Set();
    const viewport = query("#atlas-map");
    const atlasSidebar = setupSidebar(mapShell, true, void 0, viewSignal, viewState.sidebar ??= {});
    const storageKey = (name) => config.storageNamespace + ":" + name;
    const guideHref = (anchor, prerequisite = false) => config.guideHref === void 0 ? void 0 : config.guideHref + (prerequisite && config.guideHref ? "?prerequisite" : "") + "#" + anchor;
    const routeProgressKey = (id) => adapter.routeProgressKey?.(id) ?? storageKey("route-done:" + id);
    for (const symbol of mapShell.querySelectorAll("[data-atlas-icon]")) {
      attachAtlasPinIcon(symbol, symbol.dataset.atlasIcon, viewSignal);
    }
    const questPinColors = Object.fromEntries(Object.values(questTypes).map(({ layer, color }) => [layer, color]));
    questPinColors.cluster = "#454a36";
    const mapTooltip = query("#atlas-collectible-tooltip");
    const tooltipContent = mapTooltip.querySelector(".atlas-tooltip-content");
    const tooltipDetails = /* @__PURE__ */ new WeakMap();
    const photoThumbnail = query("#atlas-photo-thumbnail");
    const photoViewer = query("#atlas-photo-viewer");
    const openPhoto = photoViewer && mountPhotoViewer(photoViewer, viewSignal, viewport);
    const layerOptions = [...mapShell.querySelectorAll("[data-layer]")];
    const layerById = new Map(layerOptions.map((input) => [input.dataset.layer, input]));
    const collectibleTypes = new Set([...mapShell.querySelectorAll(".atlas-collectibles [data-layer]")].map((input) => input.dataset.layer));
    const hideCollected = query(story ? "#atlas-unfinished" : "#atlas-hide-collected");
    const collected = /* @__PURE__ */ new Set();
    const collectibleProgressKey = storageKey("collected:");
    const hideCollectedKey = storageKey("hide-collected");
    const focusSelection = query("#atlas-focus-selection");
    const showAll = query("#atlas-show-all");
    const hideAll = query("#atlas-hide-all");
    const layerKey = storageKey("visible-layers");
    const focusKey = storageKey("focus-on-selection");
    const selectionKey = storageKey("selection");
    const chapter = query("#atlas-chapter");
    const firstWindow = query("#atlas-window");
    const type = query("#atlas-type");
    const browseMode = config.sidebarMode === "browse";
    const browseRecords = browseMode ? createAtlasBrowseIndex({ quests, places, linkedRoutes, locations, byArea, questTypes, placeTypes, layerIcons, layerLabels, layerColors, config }) : [];
    let browse;
    const area = query("#atlas-area");
    const objective = query("#atlas-window-objective");
    const linkedRouteFilterNote = query("#atlas-route-filter-note");
    const count = query("#atlas-count");
    const results = query("#atlas-results");
    const resultRows = /* @__PURE__ */ new Map();
    const resultCollator = new Intl.Collator(void 0, { numeric: true });
    const resultGroups = [...results.querySelectorAll("[data-result-type]")];
    const collectibleResults = query("#atlas-collectible-results");
    const collectibleResultGroups = [...collectibleResults.querySelectorAll("[data-collectible-result-type]")];
    const detail = query("#atlas-detail");
    const sidebarCollectible = document.createElement("div");
    const guideNote = document.createElement("p");
    const selectionPanel = query("#atlas-selection");
    const selectionPhoto = query("[data-atlas-selection-photo]");
    const popoverPointer = query("[data-atlas-popover-pointer]");
    let popoverNaturalSize;
    let clickPopover = false;
    let guidedSelection = false;
    let popoverDisclosures = /* @__PURE__ */ new Map();
    let selectionReturnFocus;
    const selectionName = query("#atlas-selection-name");
    const selectionDetails = query("#atlas-selection-collectible");
    const selectionBody = query("#atlas-selection-body");
    const selectionMeta = query("#atlas-selection-meta");
    const selectionFooter = query(".atlas-selection-footer");
    const selectionLinks = query("#atlas-selection-links");
    const stepFacts = query("#atlas-step-facts");
    const disclosureStates = viewState.detailDisclosures ??= /* @__PURE__ */ new Map();
    const shareButton = query("[data-atlas-share]");
    const shareStatus = query("[data-atlas-share-status]");
    const shareDialog = query("[data-atlas-share-dialog]");
    let shareTarget;
    let shareAddress;
    const shareActions = mountAtlasLinkSharing({
      signal: viewSignal,
      dialog: shareDialog,
      getAddress: () => shareTarget && linkURL?.(shareTarget),
      getName: () => selectionName.textContent,
      onStatus: (text) => {
        shareStatus.textContent = text;
      }
    });
    const stepProgress = query("#atlas-step-progress");
    const stepText = query("#atlas-step-text");
    const previousStep = query("#atlas-previous-step");
    const nextStep = query("#atlas-next-step");
    const currentStep = stepText.parentElement;
    const stepControls = previousStep.parentElement;
    const selectionDone = query("#atlas-selection-done");
    const clearMapSelection = query("#atlas-clear-selection");
    const showSteps = query("#atlas-show-steps");
    const mapTools = showSteps.parentElement;
    const plus = query("#atlas-plus");
    const minus = query("#atlas-minus");
    const fit = query("#atlas-fit");
    const coarse = matchMedia("(pointer: coarse)");
    const compact = matchMedia("(max-width: 48rem)");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const camera = { x: 0, y: 0, scale: 1 };
    const maxScale = config.maxScale ?? 12;
    const pinPositions = /* @__PURE__ */ new WeakMap();
    const mapPanels = [mapTools, selectionPanel];
    let viewportWidth = 0;
    let viewportHeight = 0;
    let panelBounds;
    let frame;
    viewSignal.addEventListener("abort", () => {
      if (frame !== void 0) cancelAnimationFrame(frame);
      frame = void 0;
    }, { once: true });
    let cameraMotion;
    let canvasRenderer;
    let rendererPending = true;
    let canvasPlacesDirty = true;
    let canvasPlaceSignature;
    let canvasCameraTarget;
    let canvasObjectBrowser;
    let canvasObjects;
    const canvasActions = /* @__PURE__ */ new Map();
    let matches = [];
    let matchingRoutes = [];
    let selectedRoute;
    let selectedPlace;
    let selectedLocation;
    let selectedCollectibleEntry;
    let focusPlaceSelection = false;
    let selectedCluster;
    let showLinkedRouteSteps = false;
    let linkedRouteStep = 0;
    let selected;
    let guideState;
    let mapGuideState;
    let spotlight;
    let expanded;
    let previousSize;
    let overview = true;
    let fittedSteps;
    let mapTooltipPin;
    function clamp(value, min, max) {
      return Math.max(min, Math.min(value, max));
    }
    function moveElement(element, x, y, transform = "") {
      element.style.transform = `translate(${x}px, ${y}px)${transform}`;
    }
    function updateViewportSize(width, height) {
      viewportWidth = Math.round(width);
      viewportHeight = Math.round(height);
      panelBounds = void 0;
      popoverNaturalSize = void 0;
      canvasRenderer?.resize();
    }
    function getPanelBounds() {
      panelBounds ??= new Map(mapPanels.filter((panel) => !panel.hidden && panel.dataset.presentation !== "popover").map((panel) => [panel, {
        x: panel.offsetLeft,
        y: panel.offsetTop,
        w: panel.offsetWidth,
        h: panel.offsetHeight
      }]));
      return panelBounds;
    }
    function placeInfo(place) {
      return [
        place.location || byArea.get(place.area).label,
        place.groupLabel ?? placeTypes[place.type]?.label,
        place.approximate && "Approximate pin"
      ].filter(Boolean).join(" · ");
    }
    function appendSummaryText(container, text, className) {
      if (!text) return;
      const paragraph = document.createElement("p");
      if (className) paragraph.className = className;
      paragraph.textContent = text;
      container.append(paragraph);
    }
    function detailDisclosure(container, label, key, open = false) {
      const states = clickPopover ? popoverDisclosures : disclosureStates;
      const group = document.createElement("details");
      group.className = "atlas-detail-disclosure";
      group.open = states.get(key) ?? (!clickPopover && open);
      const summary = document.createElement("summary");
      summary.textContent = label;
      const body = document.createElement("div");
      body.className = "atlas-disclosure-body";
      group.append(summary, body);
      onView(group, "toggle", () => states.set(key, group.open));
      container.append(group);
      return body;
    }
    function selectedGuideLink(anchor, label = "Read in the guide") {
      const href = anchor && guideHref(anchor);
      if (!href || [...selectionLinks.querySelectorAll("a")].some((link2) => link2.getAttribute("href") === href)) return;
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      selectionLinks.append(link);
    }
    function appendSelectedRouteReference(container, route, step, point) {
      const requirements = route.prerequisites;
      if (requirements?.parts?.length) {
        const section = document.createElement("section");
        section.className = "atlas-reference-block";
        const heading = document.createElement("h3");
        heading.textContent = "Requirements";
        const note = prerequisiteSummary(requirements.parts, true);
        if (note.firstChild?.nodeType === Node.TEXT_NODE) note.firstChild.remove();
        section.append(heading, note);
        if (requirements.links?.length) {
          const listBody = detailDisclosure(section, `Browse ${requirements.links.length} required quests`, `requirements:${route.id}`);
          const list2 = document.createElement("ul");
          for (const part of requirements.links) {
            const item = document.createElement("li");
            item.append(prerequisiteLink(part));
            list2.append(item);
          }
          listBody.append(list2);
        }
        container.append(section);
      }
      if (selected) {
        const note = document.createElement("p");
        note.dataset.atlasGuideNote = "";
        container.append(note);
        updateGuideNote(route.id);
      }
      if (point?.photo) appendPhotoPreview(container, point.photo, `${route.name} · ${step?.letter === "board" ? "Board" : `Pin ${step?.letter}`}`);
      atlasAppendFacts(container, route, { omit: [step] });
      const reference = detailDisclosure(container, "Timing and quest details", `reference:${selected ? "quest" : "route"}:${route.id}`);
      appendSummaryText(reference, route.where);
      appendSummaryText(reference, route.target && `Target · ${route.target}`);
      appendSummaryText(reference, route.unlock && `Story unlock · ${route.unlock}`);
      appendSummaryText(reference, [route.window && `First window ${route.window}`, route.time, route.picture && `Picture ${route.picture}`].filter(Boolean).join(" · "));
      const routeBody = detailDisclosure(container, `All ${route.steps.length} steps`, `steps:${selected ? "quest" : "route"}:${route.id}`);
      const list = document.createElement("ol");
      list.className = "atlas-step-list";
      route.steps.forEach((item, index) => {
        const row = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "atlas-route-step-choice";
        button.textContent = `${item.letter ? `${item.letter === "board" ? "Board" : `Pin ${item.letter}`} · ` : ""}${item.text}`;
        button.setAttribute("aria-current", String(index === (selected?.step ?? linkedRouteStep)));
        onView(button, "click", () => {
          activateStep(index, true);
          stepText.focus({ preventScroll: true });
        });
        row.append(button);
        list.append(row);
      });
      routeBody.append(list);
      selectedGuideLink(selected ? "quest-" + route.id : route.guideAnchor);
    }
    function appendRouteSummary(container, route, point, interactive = false) {
      const location2 = point?.location || point && byArea.get(point.area).label;
      appendSummaryText(container, [displayTypeName(route.type), route.window && `First window ${route.window}`, location2].filter(Boolean).join(" · "), "quest-meta");
      appendSummaryText(container, route.where);
      appendSummaryText(container, route.target && `Target · ${route.target}`);
      appendSummaryText(container, route.unlock && `Story unlock · ${route.unlock}`);
      if (route.prerequisites) container.append(prerequisiteSummary(route.prerequisites.parts, interactive));
      appendSummaryText(container, [route.time, route.picture && `Picture ${route.picture}`].filter(Boolean).join(" · "));
    }
    function collectibleProgressIds(place) {
      if (place.repeatable) return [];
      if (place.pickup) return [place.pickup.progressId];
      return (place.entries ?? []).map((entry) => entry.progressId).filter(Boolean);
    }
    function isCollected(place) {
      const ids = collectibleProgressIds(place);
      return ids.length > 0 && ids.every((id) => collected.has(id));
    }
    function visibleCollectibleEntries(place) {
      const entries = place.entries ?? [];
      if (browseMode || !hideCollected.checked) return entries;
      const remaining = entries.filter((entry) => !collected.has(entry.progressId));
      return remaining.length ? remaining : entries;
    }
    function appendPhotoPreview(container, photo, name) {
      const button = photoThumbnail.content.firstElementChild.cloneNode(true);
      button.setAttribute("aria-label", `Enlarge location photo for ${name}`);
      const image = button.querySelector("img");
      image.src = photo.preview;
      image.width = photo.width;
      image.height = photo.height;
      onView(button, "click", () => {
        hideMapTooltip();
        openPhoto(photo, name, button);
      });
      container.append(button);
    }
    function appendCollectibleDetails(container, place, interactive) {
      const inSelection = container === selectionDetails;
      const host = container;
      const paragraph = (text, className) => {
        const element = document.createElement("p");
        if (className) element.className = className;
        element.textContent = text;
        container.append(element);
      };
      const checkbox = (id, name) => {
        if (!interactive || !id) return;
        const label = document.createElement("label");
        label.className = "atlas-collected-check";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.autocomplete = "off";
        input.dataset.collectibleCollected = id;
        input.checked = collected.has(id);
        input.setAttribute("aria-label", `Collected ${name}`);
        label.append(input, " Collected");
        if (inSelection && (place.pickup || place.entries?.length === 1)) selectionLinks.append(label);
        else container.append(label);
      };
      const guideLink = (anchor, label, footer = false) => {
        const href = anchor && guideHref(anchor);
        if (!interactive || !href) return;
        if (inSelection && footer) {
          selectedGuideLink(anchor, label);
          return;
        }
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        const line = document.createElement("p");
        line.append(link);
        container.append(line);
      };
      if (place.pickup) {
        const { progressId, summary: info, description, steps: directions, reward, note, link, photo } = place.pickup;
        checkbox(progressId, place.name);
        if (info) paragraph(info, "quest-meta");
        if (description) paragraph(description, "atlas-finding-direction");
        if (directions?.length) {
          const steps = document.createElement("ol");
          steps.className = "atlas-step-list";
          for (const step of directions) {
            const item = document.createElement("li");
            item.textContent = step;
            steps.append(item);
          }
          container.append(steps);
        }
        atlasAppendFacts(container, place.pickup);
        if (interactive && photo) appendPhotoPreview(container, photo, place.name);
        if (reward) paragraph(reward);
        if (note) paragraph(note);
        if (link) guideLink(link.anchor, link.label, true);
        return;
      }
      let entries = visibleCollectibleEntries(place);
      if (interactive && selectedPlace === place && selectedCollectibleEntry) {
        entries = [selectedCollectibleEntry, ...entries.filter((entry) => entry !== selectedCollectibleEntry)];
      }
      for (const entry of entries) {
        container = host;
        if (inSelection && place.entries.length > 1) {
          container = detailDisclosure(host, entry.name, `collectible:${entry.progressId ?? entry.id ?? entry.name}`, entry === selectedCollectibleEntry || !selectedCollectibleEntry && entry === entries[0]);
          if (!clickPopover && entry === selectedCollectibleEntry) container.parentElement.open = true;
        } else if (place.entries.length > 1 && !(container === selectionDetails && entry === selectedCollectibleEntry)) {
          const heading = document.createElement("h3");
          heading.textContent = entry.name;
          container.append(heading);
        }
        checkbox(place.repeatable ? void 0 : entry.progressId, entry.name);
        const info = [entry.window && `Story window ${entry.window}`, entry.approximate && "Approximate location"].filter(Boolean).join(" · ");
        if (info) paragraph(info, "quest-meta");
        paragraph(entry.detail, inSelection && place.entries.length === 1 ? "atlas-finding-direction" : void 0);
        atlasAppendFacts(container, entry);
        for (const link of entry.links ?? []) guideLink(link.anchor, link.label);
        if ((place.entries.length === 1 || entry === selectedCollectibleEntry) && entry.guideLink) {
          guideLink(entry.guideLink.anchor, entry.guideLink.label, true);
        }
      }
    }
    function hideMapTooltip() {
      if (!mapTooltipPin) return;
      mapTooltipPin.removeAttribute("aria-describedby");
      mapTooltipPin = void 0;
      mapTooltip.hidden = true;
    }
    function showMapTooltip(pin) {
      if (pin === mapTooltipPin || cameraMotion) return;
      const preview = tooltipDetails.get(pin)?.();
      if (!preview) return;
      const { name } = preview;
      hideMapTooltip();
      mapTooltipPin = pin;
      tooltipContent.textContent = name;
      mapTooltip.setAttribute("role", "tooltip");
      tooltipContent.style.maxHeight = "";
      mapTooltip.hidden = false;
      const { x: pinX, y: pinY } = pinPositions.get(pin);
      const pinHeight = pin.offsetHeight;
      const fromTop = pin.dataset.pinShape === "teardrop" ? pinHeight : pinHeight / 2;
      const padding = 8;
      const gap = 8;
      const above = pinY - fromTop - gap;
      const below = pinY + pinHeight - fromTop + gap;
      const naturalHeight = mapTooltip.offsetHeight;
      const width = mapTooltip.offsetWidth;
      const aboveFits = above - naturalHeight >= padding;
      const belowFits = below + naturalHeight <= viewportHeight - padding;
      const placeAbove = aboveFits || !belowFits && above >= viewportHeight - below;
      let height = naturalHeight;
      if (!aboveFits && !belowFits) {
        const available = placeAbove ? above - padding : viewportHeight - below - padding;
        const maxHeight = Math.max(40, available - 2);
        tooltipContent.style.maxHeight = `${maxHeight}px`;
        height = Math.min(naturalHeight, maxHeight + 2);
      }
      const left = clamp(pinX - width / 2, padding, viewportWidth - width - padding);
      const top = clamp(placeAbove ? above - height : below, padding, viewportHeight - height - padding);
      moveElement(mapTooltip, left, top);
      mapTooltip.style.setProperty("--tooltip-arrow-x", `${clamp(pinX - left, 9, width - 9)}px`);
      mapTooltip.classList.toggle("above-pin", placeAbove);
      tooltipContent.scrollTop = 0;
      pin.setAttribute("aria-describedby", mapTooltip.id);
    }
    function visible(id) {
      return layerById.get(id)?.checked ?? false;
    }
    function questLayer(quest) {
      return questTypes[quest.type].layer;
    }
    function isCollectible(place) {
      return collectibleTypes.has(place.type);
    }
    function canOffsetPin(place) {
      return Boolean(place.routes) || isCollectible(place);
    }
    function updateLayers(save = true) {
      expanded = void 0;
      showAll.disabled = layerOptions.every((input) => input.checked);
      hideAll.disabled = layerOptions.every((input) => !input.checked);
      if (save) {
        try {
          mapStorage.setItem(layerKey, JSON.stringify({
            layers: [...layerById.keys()],
            hidden: layerOptions.filter((input) => !input.checked).map((input) => input.dataset.layer)
          }));
        } catch {
        }
      }
      requestDraw();
    }
    function fitScale(width = world.width, height = world.height) {
      const padding = viewportWidth < 600 ? 18 : 40;
      return Math.max(1e-9, Math.min(
        (viewportWidth - padding * 2) / width,
        (viewportHeight - padding * 2) / height
      ));
    }
    function constrainCamera(view) {
      view.x = clamp(view.x, 32 - world.width * view.scale, viewportWidth - 32);
      view.y = clamp(view.y, 32 - world.height * view.scale, viewportHeight - 32);
      return view;
    }
    function moveCamera(destination, animate, { fly = false, stepZoomRatio } = {}) {
      constrainCamera(destination);
      if (!canvasRenderer) {
        cameraMotion = void 0;
        Object.assign(camera, destination);
        requestDraw();
        return;
      }
      if (animate && !reducedMotion.matches) {
        const target = cameraMotion?.destination ?? camera;
        if (target.x === destination.x && target.y === destination.y && target.scale === destination.scale || canvasRenderer && Math.abs(target.x - destination.x) < 1e-5 && Math.abs(target.y - destination.y) < 1e-5 && Math.abs(target.scale - destination.scale) < 1e-9) {
          requestDraw();
          return;
        }
        canvasRenderer?.stopCameraAnimation();
        const start = { ...camera };
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const dx = (centerX - destination.x) / destination.scale - (centerX - start.x) / start.scale;
        const dy = (centerY - destination.y) / destination.scale - (centerY - start.y) / start.scale;
        const widerScale = Math.min(start.scale, destination.scale);
        const travel = Math.max(Math.abs(dx) / viewportWidth, Math.abs(dy) / viewportHeight) * widerScale;
        const zoomChange = Math.abs(Math.log2(destination.scale / start.scale));
        const baseDuration = 520 + Math.min(880, 220 * Math.log2(1 + travel) + 145 * zoomChange);
        const zoomRatio = stepZoomRatio ?? (fly ? 1 / (1 + 1.3 * Math.max(0, travel - 0.55)) : 1);
        const widestScale = Math.min(widerScale, Math.max(fitScale(), widerScale * zoomRatio));
        let duration = baseDuration;
        if (fly) duration += 160 + 105 * Math.max(0, Math.log2(destination.scale / start.scale));
        let flight;
        if (widestScale < widerScale) {
          const levelsOut = Math.log2(start.scale / widestScale);
          const levelsIn = Math.log2(destination.scale / widestScale);
          duration = baseDuration + 440 + 165 * Math.max(levelsOut, levelsIn);
          const turn = 0.33 + 0.14 * levelsOut / (levelsOut + levelsIn);
          flight = { scale: widestScale, turn };
        }
        cameraMotion = { start, destination, duration, flight, time: performance.now() };
        if (canvasRenderer) {
          canvasCameraTarget = { ...destination };
          canvasRenderer.setCamera(camera, { motion: {
            moving: true,
            zooming: Boolean(flight || start.scale !== destination.scale)
          } });
        }
      } else {
        cameraMotion = void 0;
        canvasCameraTarget = void 0;
        if (canvasRenderer) canvasRenderer.setCamera(destination);
        else Object.assign(camera, destination);
      }
      requestDraw();
    }
    function centerAt(x, y, scale, targetY = viewportHeight / 2, animate = true, stepZoomRatio, targetX = viewportWidth / 2, minimumScale = fitScale()) {
      fittedSteps = void 0;
      expanded = void 0;
      const next = clamp(scale, Math.min(fitScale(), minimumScale), maxScale);
      moveCamera({ x: targetX - x * next, y: targetY - y * next, scale: next }, animate, { fly: true, stepZoomRatio });
    }
    function fitAll(animate = true) {
      overview = true;
      area.value = "";
      centerAt(world.width / 2, world.height / 2, fitScale(), viewportHeight / 2, animate);
    }
    function zoomAt(scale, anchor, { target = anchor, animate = false, from = camera } = {}) {
      if (cameraMotion && !animate) {
        cameraMotion = void 0;
        requestDraw();
      }
      const next = clamp(scale, Math.min(fitScale(), from.scale), maxScale);
      if (next === from.scale && target.x === anchor.x && target.y === anchor.y) return;
      fittedSteps = void 0;
      expanded = void 0;
      overview = false;
      moveCamera(atlasZoomTransform(from, next, anchor, target), animate);
    }
    function zoomBy(factor) {
      const anchor = { x: viewportWidth / 2, y: viewportHeight / 2 };
      const target = canvasCameraTarget ?? cameraMotion?.destination ?? camera;
      zoomAt(target.scale * factor, anchor, { animate: true, from: target });
    }
    function worldPoint(point) {
      let position2 = mapPositions.get(point);
      if (!position2) {
        const tile = byArea.get(point.area);
        position2 = areaPointToWorld(tile, point);
        mapPositions.set(point, position2);
      }
      return position2;
    }
    function routeZoomRatio(previous, next) {
      if (!previous) return 1;
      const from = worldPoint(previous);
      const to = worldPoint(next);
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const fraction = clamp((distance - 40) / (0.35 * Math.hypot(world.width, world.height)), 0, 1);
      return 1 - 0.68 * fraction * (2 - fraction);
    }
    function screenPoint(point) {
      const position2 = worldPoint(point);
      return worldToViewport(camera, position2);
    }
    function availableMapFrame() {
      const inset = 18;
      const panels = [...getPanelBounds().values()].filter((panel) => panel.w && panel.h);
      const edges = (size, start, extent) => [.../* @__PURE__ */ new Set([
        inset,
        size - inset,
        ...panels.flatMap((panel) => [panel[start] - 12, panel[start] + panel[extent] + 12])
      ])].filter((value) => value >= inset && value <= size - inset).sort((a, b) => a - b);
      const xs = edges(viewportWidth, "x", "w");
      const ys = edges(viewportHeight, "y", "h");
      let best;
      for (let l = 0; l < xs.length - 1; l++) for (let r = l + 1; r < xs.length; r++) {
        for (let t = 0; t < ys.length - 1; t++) for (let b = t + 1; b < ys.length; b++) {
          const frame2 = { x: xs[l], y: ys[t], w: xs[r] - xs[l], h: ys[b] - ys[t] };
          if (frame2.w < 40 || frame2.h < 40 || panels.some((panel) => frame2.x < panel.x + panel.w + 8 && frame2.x + frame2.w > panel.x - 8 && frame2.y < panel.y + panel.h + 8 && frame2.y + frame2.h > panel.y - 8)) continue;
          if (!best || frame2.w * frame2.h > best.w * best.h) best = frame2;
        }
      }
      return best ?? { x: inset, y: inset, w: Math.max(40, viewportWidth - 2 * inset), h: Math.max(40, viewportHeight - 2 * inset) };
    }
    function revealSelectedPoint() {
      if (selectionPanel.hidden || clickPopover || !viewportWidth || !viewportHeight) return;
      const point = selected ? selected.quest.locations[selected.quest.steps[selected.step]?.letter] : selectedRoute ? selectedRoute.locations[selectedRoute.steps[linkedRouteStep]?.letter] ?? selectedPlace : selectedPlace;
      if (!point) return;
      const position2 = worldPoint(point);
      const target = cameraMotion?.destination ?? camera;
      const x = target.x + position2.x * target.scale, y = target.y + position2.y * target.scale;
      const frame2 = availableMapFrame();
      if (x >= frame2.x + 16 && x <= frame2.x + frame2.w - 16 && y >= frame2.y + 16 && y <= frame2.y + frame2.h - 16) return;
      moveCamera({
        ...target,
        x: target.x + frame2.x + frame2.w / 2 - x,
        y: target.y + frame2.y + frame2.h / 2 - y
      }, true);
    }
    function focusTile(tile, point, stepZoomRatio, { w, h } = tile) {
      const position2 = point ? worldPoint(point) : { x: tile.x + tile.w / 2, y: tile.y + tile.h / 2 };
      const frame2 = availableMapFrame();
      const scale = Math.min(frame2.w * 0.85 / w, frame2.h * 0.85 / h);
      overview = false;
      area.value = tile.id;
      centerAt(
        position2.x,
        position2.y,
        scale,
        frame2.y + frame2.h / 2,
        true,
        stepZoomRatio,
        frame2.x + frame2.w / 2,
        scale
      );
    }
    function letterLabel(letter) {
      return letter === "board" ? "Board" : letter;
    }
    function saveSelection() {
      try {
        const route = selected?.quest ?? selectedRoute;
        if (route) mapStorage.setItem(selectionKey, JSON.stringify({
          id: route.id,
          step: selected?.step ?? linkedRouteStep,
          ...selectedRoute && { kind: "route" },
          ...selectedRoute?.retry && { retry: true }
        }));
        else mapStorage.removeItem(selectionKey);
      } catch {
      }
    }
    function restoreSelection(explicitId, restoring = false, explicitStep, interior) {
      let saved;
      try {
        saved = JSON.parse(mapStorage.getItem(selectionKey));
      } catch {
      }
      if (explicitId === void 0 && (saved?.kind === "route" || typeof saved?.id === "string" && !quests.some((quest2) => quest2.id === saved.id))) {
        const linkedRoute = matchingRoutes.find((entry) => entry.id === saved.id);
        if (linkedRoute) openLinkedRoute(linkedRoute, Boolean(saved.retry) === Boolean(linkedRoute.retry) ? saved.step : 0);
        return;
      }
      const explicitQuest = explicitId === void 0 ? void 0 : quests.find((quest2) => String(quest2.id) === String(explicitId));
      const quest = explicitQuest ?? matches.find((quest2) => quest2.id === saved?.id);
      if (!quest) return;
      if (explicitQuest && (!matches.includes(quest) || !visible(questLayer(quest)))) spotlight = quest;
      const step = explicitStep !== void 0 ? quest.steps[Number(explicitStep)] ? Number(explicitStep) : 0 : saved?.id === quest.id && Number.isInteger(saved.step) && saved.step >= 0 && saved.step < quest.steps.length ? saved.step : 0;
      const point = interior && quest.interior || quest.pin;
      const lastMapped = quest.steps.slice(0, step + 1).findLast((entry) => quest.locations[entry.letter]);
      const viewPoint = interior !== void 0 ? point : quest.locations[lastMapped?.letter] ?? point;
      showQuest(quest, point, {
        recenter: !restoring,
        step,
        viewPoint,
        fitRoute: restoring ? viewState.fitSteps : explicitStep === void 0 && interior === void 0 && (Boolean(explicitQuest) || step === 0),
        scrollToDetail: Boolean(explicitQuest) && !restoring
      });
    }
    function setSelectedDone(event) {
      if (selectedRoute) {
        setRouteDone(selectedRoute.id, event.currentTarget.checked);
        return;
      }
      const checked2 = event.currentTarget.checked;
      const { id } = selected.quest;
      try {
        story.setDone(id, checked2);
      } catch {
      }
      if (checked2) guideState.completed.add(id);
      else guideState.completed.delete(id);
      readMapStoryFilters(guideState.completed, true);
    }
    function selectionLink() {
      if (selected) return { quest: selected.quest.id, step: selected.step, interior: selected.interior };
      if (selectedRoute) return { route: selectedRoute.id, step: linkedRouteStep, retry: selectedRoute.retry };
      if (selectedCollectibleEntry) return { collectible: collectibleEntryKey(selectedPlace, selectedCollectibleEntry) };
      if (selectedPlace) {
        const id = atlasPlaceLink(selectedPlace);
        if (places.find((place) => atlasPlaceLink(place) === id) === selectedPlace) return { place: id };
      }
      if (selectedLocation) return { location: selectedLocation.key };
    }
    function selectionHasSteps() {
      const hasSteps = (value) => Array.isArray(value?.steps) && value.steps.length > 0;
      return Boolean(selected || selectedCluster || guidedSelection || hasSteps(selectedRoute) || hasSteps(selectedPlace) || hasSteps(selectedPlace?.pickup) || selectedPlace?.entries?.some(hasSteps) || selectedPlace?.routes?.some(hasSteps));
    }
    function positionClickPopover() {
      if (!clickPopover || selectionPanel.hidden || !viewportWidth || !viewportHeight) return;
      let anchor;
      let metrics;
      if (selectedPlace) {
        const point = worldPoint(selectedPlace);
        anchor = canvasRenderer ? canvasRenderer.project(point) : { x: camera.x + point.x * camera.scale, y: camera.y + point.y * camera.scale };
        metrics = atlasPlacePinMetrics(selectedPlace);
      } else if (selectedLocation) {
        const tile = byArea.get(selectedLocation.area);
        const [left, top2, right, bottom] = selectedLocation.bounds ?? [0, 0, 1, 1];
        const point = { x: tile.x + (left + right) / 2 * tile.w, y: tile.y + (top2 + bottom) / 2 * tile.h };
        anchor = canvasRenderer ? canvasRenderer.project(point) : { x: camera.x + point.x * camera.scale, y: camera.y + point.y * camera.scale };
      }
      anchor ??= { x: viewportWidth / 2, y: viewportHeight / 2 };
      const scroll = selectionPanel.scrollTop;
      const rootFont = getComputedStyle(document.documentElement).fontSize;
      const scrollCard = getComputedStyle(selectionPanel).getPropertyValue("--atlas-popover-scroll-mode").trim() === "card";
      if (!popoverNaturalSize || popoverNaturalSize.rootFont !== rootFont) {
        selectionPanel.style.removeProperty("--atlas-popover-room");
        selectionPanel.style.removeProperty("--atlas-popover-photo-room");
        selectionPanel.toggleAttribute("data-popover-scroll-card", scrollCard);
        popoverNaturalSize = { width: selectionPanel.offsetWidth, height: selectionPanel.offsetHeight, rootFont };
      }
      const top = anchor.y - (metrics?.anchorY ?? 0);
      const pin = {
        x: anchor.x,
        y: top + (metrics?.headY ?? 0),
        left: anchor.x - (metrics?.width ?? 0) / 2,
        right: anchor.x + (metrics?.width ?? 0) / 2,
        top,
        bottom: top + (metrics?.height ?? 0)
      };
      const obstacles = mapTools.hidden ? [] : [{
        x: mapTools.offsetLeft - 4,
        y: mapTools.offsetTop - 4,
        width: mapTools.offsetWidth + 8,
        height: mapTools.offsetHeight + 8
      }];
      const inputs = { pin, ...popoverNaturalSize, viewportWidth, viewportHeight, obstacles };
      const natural = atlasPinPopoverLayout(inputs);
      if (natural.constrained) {
        selectionPanel.style.setProperty("--atlas-popover-room", `${natural.height}px`);
        selectionPanel.style.setProperty("--atlas-popover-photo-room", `${Math.max(44, natural.height / 3)}px`);
      } else {
        selectionPanel.style.removeProperty("--atlas-popover-room");
        selectionPanel.style.removeProperty("--atlas-popover-photo-room");
      }
      selectionPanel.toggleAttribute("data-popover-scroll-card", scrollCard || natural.constrained);
      const placed = atlasPinPopoverLayout({ ...inputs, width: selectionPanel.offsetWidth, height: selectionPanel.offsetHeight });
      selectionPanel.dataset.placement = placed.side;
      moveElement(selectionPanel, placed.x, placed.y);
      if (popoverPointer) {
        popoverPointer.toggleAttribute("hidden", !placed.pointer);
        if (placed.pointer) popoverPointer.style.transform = `matrix(${placed.pointer.join(",")})`;
      }
      if (scroll) selectionPanel.scrollTop = scroll;
    }
    function setSelectionPresentation() {
      popoverNaturalSize = void 0;
      if (popoverPointer) popoverPointer.setAttribute("hidden", "");
      mapShell.dispatchEvent(new CustomEvent("atlas-selection-change", {
        bubbles: true,
        detail: { guided: guidedSelection, link: selectionLink() }
      }));
      clickPopover = !selectionPanel.hidden && !selectionHasSteps();
      selectionPanel.dataset.presentation = clickPopover ? "popover" : "left";
      selectionPanel.setAttribute("role", clickPopover ? "dialog" : "region");
      clearMapSelection.setAttribute("aria-label", clickPopover ? "Close pin details" : "Clear selection");
      clearMapSelection.title = clickPopover ? "Close pin details" : "Clear selection";
      if (!clickPopover) {
        selectionPanel.style.removeProperty("transform");
        selectionPanel.style.removeProperty("--atlas-popover-room");
        selectionPanel.style.removeProperty("--atlas-popover-photo-room");
        selectionPanel.removeAttribute("data-popover-scroll-card");
      }
      if (selectionPhoto) {
        selectionPhoto.replaceChildren();
        selectionPhoto.hidden = true;
      }
    }
    function finishSelectionPresentation() {
      if (!clickPopover) return;
      const photo = selectionDetails.querySelector(":scope > .atlas-pickup-thumb");
      if (photo && selectionPhoto) {
        selectionPhoto.append(photo);
        selectionPhoto.hidden = false;
      }
      positionClickPopover();
    }
    function renderSelectionPanel() {
      panelBounds = void 0;
      const route = selected?.quest ?? selectedRoute;
      selectionPanel.hidden = !route && !selectedPlace && !selectedCluster && !selectedLocation;
      setSelectionPresentation();
      currentStep.hidden = !route;
      stepControls.hidden = !route;
      query("#atlas-step-browse-note").hidden = !route;
      selectionDetails.hidden = selectionPanel.hidden;
      if (shareButton && linkURL) {
        const link = selectionLink();
        const address = link && linkURL(link);
        if (address !== shareAddress) shareActions.reset();
        shareTarget = link;
        shareAddress = address;
        shareButton.hidden = !address;
      }
      selectionDetails.replaceChildren();
      selectionLinks.replaceChildren();
      stepFacts.replaceChildren();
      selectionDone.parentElement.hidden = true;
      const index = selected?.step ?? linkedRouteStep;
      const step = route?.steps[index];
      const name = selected ? `#${route.id} ${route.name}` : route?.name ?? selectedCollectibleEntry?.name ?? selectedPlace?.name ?? selectedLocation?.name ?? (selectedCluster && clusterName(selectedCluster));
      const label = step?.letter === "board" ? "Board" : step?.letter ? `Pin ${step.letter}` : "";
      const point = route?.locations[step?.letter];
      selectionMeta.textContent = route ? [displayTypeName(route.type) ?? (selectedRoute && linkedRouteLabel), point && byArea.get(point.area)?.label, route.window && `First window ${route.window}`].filter(Boolean).join(" · ") : selectedPlace ? placeInfo(selectedPlace) : selectedLocation ? [config.locationTypeLabels?.[selectedLocation.type] ?? (selectedLocation.type === "street" ? "Street" : selectedLocation.type === "district" ? "District" : ""), byArea.get(selectedLocation.area)?.label].filter(Boolean).join(" · ") : "";
      selectionMeta.hidden = !selectionMeta.textContent;
      if (route) {
        atlasAppendFacts(stepFacts, step);
        appendSelectedRouteReference(selectionDetails, route, step, point);
      } else if (selectedPlace) {
        appendPlaceSummary(selectionDetails, selectedPlace, true);
      } else if (selectedCluster) {
        selectionDetails.append(clusterList(selectedCluster, true));
      } else if (selectedLocation?.type === "area") {
        selectionDetails.hidden = true;
      } else if (selectedLocation) {
        const type2 = config.locationTypeLabels?.[selectedLocation.type] ?? (selectedLocation.type === "street" ? "Street" : "District");
        atlasAppendFacts(selectionDetails, selectedLocation);
      }
      showSteps.hidden = !route;
      showSteps.textContent = selectedRoute ? linkedRouteLabel + " steps" : "Quest steps";
      if (name && selectionName.textContent !== name) selectionName.textContent = name;
      if (shareButton) shareButton.setAttribute("aria-label", name ? `Copy link to ${name}` : "Copy link to selection");
      selectionFooter.hidden = !selectionLinks.childNodes.length && !route;
      selectionBody.hidden = !route && !selectionDetails.textContent.trim() && !selectionDetails.querySelector("img,button,input,details");
      if (!route) {
        selectionBody.scrollTop = 0;
        finishSelectionPresentation();
        return;
      }
      selectionDone.parentElement.hidden = !selectedRoute && !story;
      query("[data-atlas-done-label]").textContent = selectedRoute ? "Activity done" : "Quest done";
      selectionDone.setAttribute("aria-label", `Mark ${name} done`);
      selectionFooter.hidden = !selectionLinks.childNodes.length && selectionDone.parentElement.hidden;
      selectionDone.checked = selectedRoute ? completedRoutes.has(route.id) : Boolean(guideState?.completed.has(route.id));
      stepProgress.textContent = `Step ${index + 1} of ${route.steps.length}${label ? ` · ${label}` : ""}`;
      stepText.textContent = step.text;
      previousStep.disabled = index === 0;
      nextStep.disabled = index === route.steps.length - 1;
      selectionBody.scrollTop = 0;
    }
    function activateStep(index, recenter) {
      const route = selected?.quest ?? selectedRoute;
      const step = route?.steps[index];
      if (!step) return;
      const previousPoint = route.locations[route.steps[selected?.step ?? linkedRouteStep]?.letter];
      const point = route.locations[step.letter];
      if (selected) {
        selected.step = index;
        if (recenter && point) selected.interior = void 0;
      } else linkedRouteStep = index;
      saveSelection();
      renderSelectionPanel();
      for (const [rowIndex, row] of [...detail.querySelectorAll(".atlas-step-list > li")].entries()) {
        const current = rowIndex === index;
        row.setAttribute("aria-current", current ? "step" : "false");
        row.querySelector("button")?.setAttribute("aria-pressed", String(current));
      }
      if (recenter && point) {
        focusTile(byArea.get(point.area), point, routeZoomRatio(previousPoint, point));
        viewport.scrollIntoView({ block: "nearest" });
      } else {
        if (!recenter && !compact.matches && !atlasSidebar.collapsed) {
          detail.querySelector(`[data-step-index="${index}"]`)?.scrollIntoView({ block: "nearest", container: "nearest" });
        }
        requestDraw();
      }
    }
    function fitQuestSteps(locations2) {
      const points = Object.values(locations2).map(worldPoint);
      const xs = points.map(({ x }) => x);
      const ys = points.map(({ y }) => y);
      const left = Math.min(...xs), right = Math.max(...xs);
      const top = Math.min(...ys), bottom = Math.max(...ys);
      const frame2 = availableMapFrame();
      const verticalSpan = Math.max(70, bottom - top);
      const inset = Math.min(coarse.matches ? 36 : 28, frame2.w / 6, frame2.h / 6);
      const scale = Math.min(
        (frame2.w - 2 * inset) / Math.max(70, right - left),
        (frame2.h - 2 * inset) / verticalSpan,
        4
      );
      overview = false;
      area.value = "";
      centerAt(
        (left + right) / 2,
        (top + bottom) / 2,
        scale,
        frame2.y + frame2.h / 2,
        true,
        void 0,
        frame2.x + frame2.w / 2,
        scale
      );
      fittedSteps = locations2;
    }
    function appendRouteSteps(route, current, selectStep, label) {
      const heading = document.createElement("h3");
      heading.textContent = label;
      const list = document.createElement("ol");
      list.className = "atlas-step-list";
      const shownPhotos = /* @__PURE__ */ new Set();
      for (const [index, step] of route.steps.entries()) {
        const row = document.createElement("li");
        row.setAttribute("aria-current", index === current ? "step" : "false");
        const point = route.locations[step.letter];
        if (point) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.stepIndex = index;
          button.setAttribute("aria-pressed", String(index === current));
          const badge = document.createElement("span");
          badge.className = "atlas-step-badge";
          badge.textContent = letterLabel(step.letter);
          const copy = document.createElement("span");
          const location2 = document.createElement("small");
          const precision = { approximate: " · Approximate", building: " · Building", entrance: " · Entrance" }[point.precision] ?? "";
          location2.textContent = byArea.get(point.area).label + precision;
          copy.append(step.text, location2);
          button.append(badge, copy);
          onView(button, "click", () => selectStep(index));
          row.append(button);
          if (point.photo && !shownPhotos.has(step.letter)) {
            appendPhotoPreview(row, point.photo, `${route.name} · Pin ${letterLabel(step.letter)}`);
            shownPhotos.add(step.letter);
          }
        } else {
          row.textContent = step.text;
        }
        list.append(row);
      }
      if (label) detail.append(heading);
      detail.append(list);
    }
    function prerequisiteLink({ id, text }) {
      const link = document.createElement("a");
      link.href = guideHref("quest-" + id, true);
      link.dataset.prerequisite = "";
      link.textContent = text;
      return link;
    }
    function prerequisiteSummary(parts, interactive) {
      const note = document.createElement("p");
      note.className = "atlas-prerequisites";
      note.append("Requires · ", ...parts.map((part) => interactive && part.id && guideHref("quest-" + part.id) ? prerequisiteLink(part) : part.text));
      return note;
    }
    function appendPrerequisites({ parts, links }) {
      detail.append(prerequisiteSummary(parts, true));
      if (links.length && config.guideHref !== void 0) {
        const group = document.createElement("details");
        group.className = "quest-prerequisite-links";
        const summary = document.createElement("summary");
        summary.textContent = `Browse ${links.length} required quests`;
        const list = document.createElement("ul");
        for (const link of links) {
          const item = document.createElement("li");
          item.append(prerequisiteLink(link));
          list.append(item);
        }
        group.append(summary, list);
        detail.append(group);
      }
    }
    function updateGuideNote(questId) {
      const note = guideState?.notes[questId];
      const text = note?.text ?? "";
      if (guideNote.textContent !== text) guideNote.textContent = text;
      guideNote.hidden = !text;
      guideNote.classList.toggle("quest-prerequisite-warning", Boolean(note?.prerequisiteWarning));
      const floating = selectionDetails.querySelector("[data-atlas-guide-note]");
      if (floating) {
        floating.textContent = text;
        floating.hidden = !text;
        floating.classList.toggle("quest-prerequisite-warning", Boolean(note?.prerequisiteWarning));
      }
    }
    function showQuest(quest, point, {
      recenter = false,
      step = 0,
      viewPoint = quest.locations[quest.steps[step].letter] ?? point,
      fitRoute = true,
      scrollToDetail = true
    } = {}) {
      selectedRoute = void 0;
      selectedPlace = void 0;
      setSelectedLocation();
      selectedCollectibleEntry = void 0;
      focusPlaceSelection = false;
      selectedCluster = void 0;
      fittedSteps = void 0;
      showLinkedRouteSteps = false;
      expanded = void 0;
      if (spotlight !== quest) spotlight = void 0;
      const interior = quest.interior && (viewPoint === quest.interior ? true : viewPoint === quest.pin ? false : void 0);
      selected = { quest, point, step, interior };
      saveSelection();
      renderSelectionPanel();
      detail.hidden = false;
      const title = document.createElement("h2");
      title.textContent = `#${quest.id} ${quest.name}`;
      const start = document.createElement("p");
      start.textContent = quest.where;
      const meta = document.createElement("p");
      meta.className = "quest-meta";
      meta.textContent = [quest.window && `First window ${quest.window}`, byArea.get(viewPoint.area).label].filter(Boolean).join(" · ");
      const actions = document.createElement("div");
      actions.className = "detail-actions";
      const href = guideHref("quest-" + quest.id);
      if (href) {
        const walkthrough = document.createElement("a");
        walkthrough.href = href;
        walkthrough.textContent = "Open walkthrough";
        actions.append(walkthrough);
      }
      if (story) {
        const label = document.createElement("label");
        label.className = "atlas-done";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectionDone.checked;
        onView(checkbox, "change", setSelectedDone);
        label.append(checkbox, "Done");
        actions.append(label);
      }
      if (quest.interior) {
        const inside = viewPoint.area === quest.interior.area;
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent = inside ? "Show building" : "Show inside";
        onView(toggle, "click", () => {
          const destination = inside ? quest.pin : quest.interior;
          showQuest(quest, destination, { recenter: true, step: selected.step, viewPoint: destination, fitRoute: false, scrollToDetail: false });
          detail.querySelector("button").focus({ preventScroll: true });
        });
        actions.append(toggle);
      }
      const hasMultiplePins = Object.keys(quest.locations).length > 1;
      if (hasMultiplePins) {
        const fitSteps = document.createElement("button");
        fitSteps.type = "button";
        fitSteps.textContent = "Fit step pins";
        onView(fitSteps, "click", () => {
          fitQuestSteps(quest.locations);
          viewport.scrollIntoView({ block: "nearest" });
        });
        actions.append(fitSteps);
      }
      const clear = document.createElement("button");
      clear.type = "button";
      clear.textContent = "Clear selection";
      onView(clear, "click", clearQuestSelection);
      actions.append(clear);
      detail.replaceChildren(title, start, meta);
      for (const text of [
        quest.target && `Target · ${quest.target}`,
        quest.unlock && `Story unlock · ${quest.unlock}`,
        spotlight === quest && "Opened from the guide. This quest is outside your current map filters."
      ]) {
        if (!text) continue;
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        detail.append(paragraph);
      }
      updateGuideNote(quest.id);
      detail.append(guideNote);
      if (quest.prerequisites) appendPrerequisites(quest.prerequisites);
      detail.append(actions);
      appendRouteSteps(quest, selected.step, (index) => activateStep(index, true), "Quest steps");
      markCurrentResult();
      if (scrollToDetail) {
        requestAnimationFrame(() => {
          if (!viewSignal.aborted && selected?.quest === quest) selectionPanel.scrollIntoView({
            block: "nearest",
            inline: "nearest",
            behavior: reducedMotion.matches ? "instant" : "smooth"
          });
        });
      }
      if (fitRoute && hasMultiplePins) fitQuestSteps(quest.locations);
      else if (recenter || viewPoint !== point) focusTile(byArea.get(viewPoint.area), viewPoint);
      else requestDraw();
    }
    function openQuestResult(quest, point) {
      showQuest(quest, point, { recenter: true });
    }
    function resetQuestSelection(forgetSelection = true) {
      const forget = forgetSelection && (selected || selectedRoute);
      selected = void 0;
      selectedRoute = void 0;
      selectedPlace = void 0;
      selectedCollectibleEntry = void 0;
      setSelectedLocation();
      focusPlaceSelection = false;
      selectedCluster = void 0;
      fittedSteps = void 0;
      showLinkedRouteSteps = false;
      guidedSelection = false;
      selectionPanel.scrollTop = 0;
      const projectSteps = selectionBody.querySelector("[data-atlas-project-route]");
      if (projectSteps) projectSteps.hidden = true;
      popoverDisclosures = /* @__PURE__ */ new Map();
      if (forget) saveSelection();
      spotlight = void 0;
      expanded = void 0;
      results.querySelector("[aria-current]")?.removeAttribute("aria-current");
    }
    function clearQuestSelection(event = {}) {
      const canRestore = selectionReturnFocus?.isConnected && selectionReturnFocus !== document.body && selectionReturnFocus.getClientRects().length && !selectionReturnFocus.closest("[hidden], [inert]");
      const returnFocus = clickPopover ? canRestore ? selectionReturnFocus : viewport : event.currentTarget === clearMapSelection ? viewport : results.querySelector("[aria-current]") ?? viewport;
      resetQuestSelection();
      hideMapTooltip();
      renderSelectionPanel();
      detail.hidden = true;
      returnFocus.focus({ preventScroll: true });
      requestDraw();
    }
    function setSelectedLocation(location2) {
      selectedLocation = location2;
    }
    function showLocation(location2, recenter = true) {
      if (!selectionPanel.contains(document.activeElement)) selectionReturnFocus = document.activeElement;
      resetQuestSelection();
      setSelectedLocation(location2);
      renderSelectionPanel();
      detail.hidden = true;
      if (!recenter) return;
      const tile = byArea.get(location2.area);
      if (location2.bounds) {
        const [left, top, right, bottom] = location2.bounds;
        focusTile(tile, { area: tile.id, x: (left + right) / 2, y: (top + bottom) / 2 }, void 0, {
          w: tile.w * Math.max(0.25, (right - left) * 1.2),
          h: tile.h * Math.max(0.25, (bottom - top) * 1.2)
        });
      } else focusTile(tile);
    }
    function catalogueSection(section, interactive = true) {
      const list = document.createElement(interactive ? "details" : "div");
      list.className = "atlas-catalogue";
      if (interactive) {
        const states = popoverDisclosures;
        const key = section;
        list.open = !clickPopover || (states.get(key) ?? false);
        if (clickPopover) onView(list, "toggle", () => states.set(key, list.open));
      }
      const heading = document.createElement(interactive ? "summary" : "h3");
      heading.textContent = section.label;
      list.append(heading);
      if (section.note) {
        const note = document.createElement("p");
        note.className = "quest-meta";
        note.textContent = section.note;
        list.append(note);
      }
      const table = document.createElement("table");
      table.setAttribute("aria-label", section.label);
      const headings = table.createTHead().insertRow();
      for (const label of ["Item", `${section.priceLabel ?? "Price"} (${section.currency})`]) {
        const column = document.createElement("th");
        column.scope = "col";
        column.textContent = label;
        headings.append(column);
      }
      const body = table.createTBody();
      for (const { name, price, note } of section.items) {
        const row = body.insertRow();
        const item = row.insertCell();
        item.textContent = name;
        if (note) {
          const condition = document.createElement("small");
          condition.textContent = note;
          item.append(condition);
        }
        const amount = row.insertCell();
        amount.textContent = price === null ? "—" : price.toLocaleString("en");
      }
      const scroller = document.createElement("div");
      scroller.className = "atlas-catalogue-table";
      scroller.append(table);
      list.append(scroller);
      return list;
    }
    function appendVenueDetails(container, place, interactive, { facts = true, photo = true } = {}) {
      if (place.detail) {
        appendSummaryText(container, place.detail);
        if (interactive && place.reference) {
          const reference = document.createElement("a");
          reference.href = place.reference;
          reference.target = "_blank";
          reference.rel = "noopener noreferrer";
          reference.textContent = place.referenceLabel ?? "Reference";
          container.lastElementChild.append(" ", reference);
        }
      }
      if (facts) atlasAppendFacts(container, place);
      if (photo && interactive && place.photo) appendPhotoPreview(container, place.photo, place.name);
      for (const { anchor, label, summary } of place.guideLinks ?? []) {
        const href = interactive && guideHref(anchor);
        if (href) {
          if (container === selectionDetails) {
            selectedGuideLink(anchor, label);
            continue;
          }
          const paragraph = document.createElement("p");
          const link = document.createElement("a");
          link.href = href;
          link.textContent = label;
          paragraph.append(link);
          container.append(paragraph);
        } else appendSummaryText(container, summary, "quest-meta");
      }
      if (place.destinations?.length) {
        if (interactive) {
          const actions = document.createElement("div");
          actions.className = "detail-actions";
          for (const destination of place.destinations) {
            const tile = byArea.get(destination.area);
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = `View ${tile.label}`;
            onView(button, "click", () => {
              resetQuestSelection();
              hideMapTooltip();
              renderSelectionPanel();
              detail.hidden = true;
              focusTile(tile);
              viewport.scrollIntoView({ block: "nearest" });
              viewport.focus({ preventScroll: true });
            });
            actions.append(button);
          }
          container.append(actions);
        } else {
          const destinations = place.destinations.map(({ area: area2 }) => byArea.get(area2).label);
          appendSummaryText(container, `Connects to ${[...new Set(destinations)].join(", ")}`);
        }
      }
      for (const { sections, note } of place.catalogues ?? []) {
        appendSummaryText(container, note, "quest-meta");
        container.append(...sections.map((section) => catalogueSection(section, interactive)));
      }
    }
    function appendPlaceSummary(container, place, interactive) {
      if (container !== selectionDetails) appendSummaryText(container, placeInfo(place), "quest-meta");
      if (!interactive) {
        appendSummaryText(container, place.pickup?.description ?? place.pickup?.steps?.[0] ?? place.entries?.[0]?.detail ?? place.detail);
        return;
      }
      if (isCollectible(place)) {
        if (clickPopover) appendVenueDetails(container, place, interactive, { facts: false, photo: false });
        appendCollectibleDetails(container, place, interactive);
        atlasAppendFacts(container, place);
        if (place.photo && !place.pickup?.photo) appendPhotoPreview(container, place.photo, place.name);
        return;
      }
      appendVenueDetails(container, place, interactive);
      if (!place.routes) return;
      const entries = matchingRoutes.filter((entry) => entry.place === place);
      if (container === selectionDetails) {
        const group = document.createElement("div");
        group.className = "atlas-route-choices";
        for (const entry of entries) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = `View ${entry.name} steps`;
          onView(button, "click", () => openLinkedRoute(entry, 0));
          group.append(button);
        }
        container.append(group);
        return;
      }
      for (const entry of entries) {
        if (place.name !== entry.name || entries.length > 1) {
          const heading = document.createElement("h3");
          heading.textContent = entry.name;
          container.append(heading);
        }
        appendRouteSummary(container, entry);
      }
    }
    function appendLinkedRouteSteps(entries) {
      for (const entry of entries) {
        const { id, name, window: window2, time, picture } = entry;
        if (entries.length > 1) {
          const heading = document.createElement("h3");
          heading.textContent = name;
          detail.append(heading);
        }
        const meta = document.createElement("p");
        meta.className = "quest-meta";
        meta.textContent = [window2 && `First window ${window2}`, time, picture && `Picture ${picture}`].filter(Boolean).join(" · ");
        detail.append(meta);
        appendRouteSteps(
          entry,
          entry === selectedRoute ? linkedRouteStep : -1,
          (index) => entry === selectedRoute ? activateStep(index, true) : openLinkedRoute(entry, index),
          "Quick steps"
        );
        const link = document.createElement("a");
        link.className = "atlas-linked-route-guide";
        const href = entry.guideAnchor && guideHref(entry.guideAnchor);
        if (href) link.href = href;
        link.textContent = "Read in the guide";
        const actions = document.createElement("div");
        actions.className = "detail-actions";
        const label = document.createElement("label");
        label.className = "atlas-done";
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = completedRoutes.has(id);
        check.dataset.routeDone = id;
        check.setAttribute("aria-label", `Mark ${name} done`);
        label.append(check, "Done");
        if (href) actions.append(link);
        actions.append(label);
        if (Object.keys(entry.locations).length > 1) {
          const fitSteps = document.createElement("button");
          fitSteps.type = "button";
          fitSteps.textContent = "Fit step pins";
          onView(fitSteps, "click", () => {
            if (entry !== selectedRoute) showPlace(entry.place, entry);
            fitQuestSteps(entry.locations);
            viewport.scrollIntoView({ block: "nearest" });
          });
          actions.append(fitSteps);
        }
        detail.append(actions);
      }
    }
    function showPlace(place, linkedRoute, step = 0, {
      select = canOffsetPin(place) || focusPlaceSelection && selectedPlace === place,
      collectibleEntry,
      guided = false
    } = {}) {
      if (!selectionPanel.contains(document.activeElement)) selectionReturnFocus = document.activeElement;
      resetQuestSelection();
      guidedSelection = guided;
      selectedPlace = place;
      selectedCollectibleEntry = collectibleEntry;
      focusPlaceSelection = select;
      selectedRoute = linkedRoute;
      linkedRouteStep = step;
      if (linkedRoute) saveSelection();
      markCurrentResult();
      if (!selectionHasSteps()) {
        detail.hidden = true;
        detail.replaceChildren();
        renderSelectionPanel();
        if (compact.matches) viewport.scrollIntoView({ block: "nearest" });
        requestDraw();
        return;
      }
      const title = document.createElement("h2");
      title.textContent = linkedRoute?.name ?? place.name;
      const meta = document.createElement("p");
      meta.className = "quest-meta";
      meta.textContent = placeInfo(place);
      detail.hidden = false;
      detail.replaceChildren(title, meta);
      appendVenueDetails(detail, place, true);
      if (isCollectible(place)) {
        sidebarCollectible.replaceChildren();
        appendCollectibleDetails(sidebarCollectible, place, true);
        detail.append(sidebarCollectible);
      }
      renderSelectionPanel();
      if (place.routes) {
        const entries = linkedRoute ? [linkedRoute] : matchingRoutes.filter((entry) => entry.place === place);
        appendLinkedRouteSteps(entries);
        const actions = document.createElement("div");
        actions.className = "detail-actions";
        const clear = document.createElement("button");
        clear.type = "button";
        clear.textContent = "Clear selection";
        onView(clear, "click", clearQuestSelection);
        actions.append(clear);
        detail.append(actions);
        showSteps.textContent = linkedRouteLabel + " steps";
        showSteps.hidden = !entries.length;
        if (linkedRoute && !matchingRoutes.includes(linkedRoute)) {
          const note = document.createElement("p");
          note.className = "quest-meta";
          note.textContent = `Opened from the guide. This ${linkedRouteLabel} is outside your current map filters.`;
          meta.after(note);
        }
      }
      if (compact.matches) viewport.scrollIntoView({ block: "nearest" });
      else if (!browseMode && !atlasSidebar.collapsed && (placeTypes[place.type]?.scrollToDetail || canOffsetPin(place) || place.destinations?.length || place.catalogues?.length)) {
        detail.scrollIntoView({ block: "start" });
      }
      requestDraw();
    }
    function openLinkedRoute(linkedRoute, step = 0, showLinkedSteps = false) {
      const { place } = linkedRoute;
      const index = linkedRoute.steps[step] ? step : 0;
      showPlace(place, linkedRoute, index);
      showLinkedRouteSteps = showLinkedSteps;
      const lastMapped = linkedRoute.steps.slice(0, index + 1).findLast(({ letter }) => linkedRoute.locations[letter]);
      const point = linkedRoute.locations[lastMapped?.letter] ?? place;
      focusTile(byArea.get(point.area), point);
      if (compact.matches) viewport.scrollIntoView({ block: "start" });
    }
    function linkedRouteButton(linkedRoute) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.linkedRoute = linkedRoute.id;
      button.textContent = linkedRoute.name;
      const meta = document.createElement("small");
      meta.className = "quest-meta";
      meta.textContent = [linkedRouteLabel, linkedRoute.window, completedRoutes.has(linkedRoute.id) && "Done"].filter(Boolean).join(" · ");
      button.append(meta);
      onView(button, "click", () => openLinkedRoute(linkedRoute));
      const row = document.createElement("li");
      row.append(button);
      return row;
    }
    function questButton(quest, action) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.quest = quest.id;
      const number = document.createElement("span");
      number.className = "quest-number";
      number.textContent = `#${quest.id}`;
      button.append(number, ` ${quest.name}`);
      if (guideState?.completed.has(quest.id)) {
        const done = document.createElement("span");
        done.className = "quest-meta";
        done.textContent = " · Done";
        button.append(done);
      }
      onView(button, "click", action);
      const row = document.createElement("li");
      row.append(button);
      return row;
    }
    function clusterName(group) {
      return `${group.entries.length} starts in ${byArea.get(group.area).label}`;
    }
    function clusterList(group, interactive) {
      const list = document.createElement("ul");
      list.className = "atlas-cluster-list";
      for (const { quest, point } of group.entries) {
        if (interactive) {
          list.append(questButton(quest, () => openQuestResult(quest, point)));
        } else {
          const item = document.createElement("li");
          item.textContent = `#${quest.id} ${quest.name}`;
          list.append(item);
        }
      }
      return list;
    }
    function showCluster(group) {
      resetQuestSelection();
      selectedCluster = group;
      renderSelectionPanel();
      const title = document.createElement("h2");
      title.textContent = clusterName(group);
      const list = clusterList(group, true);
      detail.hidden = false;
      detail.replaceChildren(title, list);
      const { x, y } = group.entries[0].point;
      const sharedStart = group.entries.every(({ point }) => point.x === x && point.y === y);
      if (group.entries.length > 8 && camera.scale < maxScale && !sharedStart) {
        const anchor = { x: group.x, y: group.y };
        zoomAt(camera.scale * 1.7, anchor, { animate: true });
        list.querySelector("button").focus({ preventScroll: true });
        return;
      }
      expanded = group;
      requestDraw();
    }
    function pinGroups(focusedQuest) {
      const distance = coarse.matches ? 34 : 29;
      const distanceSquared = distance * distance;
      const groups = [];
      const byArea2 = /* @__PURE__ */ new Map();
      const candidates = spotlight && !matches.includes(spotlight) ? [...matches, spotlight] : matches;
      for (const quest of focusedQuest ? [focusedQuest] : candidates) {
        if (quest !== spotlight && !visible(questLayer(quest))) continue;
        for (const point of [quest.pin, quest.interior].filter(Boolean)) {
          if (quest === selected?.quest && visible("steps") && Object.values(quest.locations).some((location2) => location2.area === point.area)) continue;
          if (expanded?.entries.some((entry) => entry.point === point)) continue;
          const { x, y } = screenPoint(point);
          const anchor = worldPoint(point);
          let areaGroups = byArea2.get(point.area);
          if (!areaGroups) byArea2.set(point.area, areaGroups = []);
          const group = areaGroups.find((item) => ((item.worldX - anchor.x) ** 2 + (item.worldY - anchor.y) ** 2) * camera.scale ** 2 < distanceSquared);
          if (group) group.entries.push({ quest, point });
          else {
            const group2 = { x, y, area: point.area, entries: [{ quest, point }] };
            group2.worldX = anchor.x;
            group2.worldY = anchor.y;
            groups.push(group2);
            areaGroups.push(group2);
          }
        }
      }
      return groups;
    }
    function placeCandidates(focused, focusedPlace) {
      const candidates = [];
      for (const [index, place] of places.entries()) {
        if (focused && place !== focusedPlace) continue;
        if (!browseMode && hideCollected.checked && place !== selectedPlace && isCollectible(place) && isCollected(place)) continue;
        if (place === selectedPlace && selectedRoute && (visible("steps") || showLinkedRouteSteps) && Object.values(selectedRoute.locations).some((point) => point.area === place.area && point.x === place.x && point.y === place.y)) continue;
        if (!visible(place.type) && selectedPlace !== place) continue;
        if (place.routes && selectedPlace !== place && !(place.overviewOnly ? typeMatches({ type: linkedRouteType }) && !chapter.value && !firstWindow.value && !guideState?.objective && !(browseMode ? mapGuideState : guideState)?.missableOnly : matchingRoutes.some((entry) => entry.place === place))) continue;
        const { x, y } = screenPoint(place);
        candidates.push({ index, place, x, y });
      }
      return candidates;
    }
    function markerKey(areaId, entries) {
      return `${areaId}:${entries.map((entry) => entry.quest.id).join(",")}`;
    }
    function advanceCamera(now) {
      if (!cameraMotion) return;
      const { start, destination, duration, flight, time } = cameraMotion;
      const elapsed = now - time;
      if (elapsed >= duration || reducedMotion.matches) {
        Object.assign(camera, destination);
        cameraMotion = void 0;
        return;
      }
      const progress = clamp(elapsed / duration, 0, 1);
      const center = progress * progress * (3 - 2 * progress);
      if (flight) {
        const zoomingOut = progress < flight.turn;
        const zoom = zoomingOut ? 1 - progress / flight.turn : (progress - flight.turn) / (1 - flight.turn);
        const easedZoom = zoom ** 3 * (10 + zoom * (6 * zoom - 15));
        const endpointScale = zoomingOut ? start.scale : destination.scale;
        camera.scale = flight.scale * (endpointScale / flight.scale) ** easedZoom;
      } else {
        camera.scale = start.scale * (destination.scale / start.scale) ** center;
      }
      const from = (1 - center) * camera.scale / start.scale;
      const to = center * camera.scale / destination.scale;
      camera.x = viewportWidth / 2 + (start.x - viewportWidth / 2) * from + (destination.x - viewportWidth / 2) * to;
      camera.y = viewportHeight / 2 + (start.y - viewportHeight / 2) * from + (destination.y - viewportHeight / 2) * to;
    }
    let canvasDynamicSignature;
    let canvasSelectionSignature;
    let canvasLayerSignature;
    let canvasTooltipAnchor;
    let canvasPlaceIds = /* @__PURE__ */ new Set();
    function activateCanvasPlace(place) {
      if (place.routes?.length) {
        const entries = matchingRoutes.filter((entry2) => entry2.place === place);
        const entry = selectedRoute?.place === place ? selectedRoute : entries.length === 1 ? entries[0] : void 0;
        if (entry) {
          const index = entry.steps.findIndex(({ letter }) => {
            const point = entry.locations[letter];
            return point?.area === place.area && point.x === place.x && point.y === place.y;
          });
          showPlace(place, entry, Math.max(0, index));
        } else showPlace(place);
      } else showPlace(place);
    }
    function activateCanvasRecord(record) {
      if (record.browserRecord) {
        selectCanvasBrowserRecord(record.browserRecord);
        return;
      }
      if (record.kind === "place") {
        const place = places[Number(record.id.slice(6))];
        if (place) activateCanvasPlace(place);
      } else if (record.kind === "location") {
        const target = locations.get(record.key ?? record.id);
        if (target) showLocation(target, false);
      } else canvasActions.get(record.id)?.activate();
      requestDraw();
    }
    function selectCanvasBrowserRecord(record) {
      if (record.kind === "quest") openQuestResult(record.source, record.source.pin);
      else if (record.kind === "route") openLinkedRoute(record.source);
      else if (record.kind === "location") showLocation(record.source);
      else if (isCollectible(record.place)) openCollectible(record.place, record.entry);
      else {
        showPlace(record.place, void 0, 0, { select: true });
        focusTile(byArea.get(record.place.area), record.place);
      }
      requestDraw();
    }
    function canvasBrowserRecords() {
      canvasObjects ??= browseMode ? browseRecords : createAtlasBrowseIndex({
        quests,
        places,
        linkedRoutes,
        locations,
        byArea,
        questTypes,
        placeTypes,
        layerIcons,
        layerLabels,
        layerColors,
        config
      });
      return canvasObjects.filter((record) => {
        if (record.kind === "quest") return matches.includes(record.source) || spotlight === record.source;
        if (record.kind === "route") return matchingRoutes.some((entry) => entry.id === record.source.id);
        if (record.kind === "location") return selectedLocation === record.source || visible(record.layer);
        return canvasPlaceIds.has("place:" + placeIndexByObject.get(record.place));
      }).map((record) => ({
        id: record.kind === "place" ? "place:" + placeIndexByObject.get(record.place) : record.kind === "location" ? record.source.key : record.key,
        kind: record.kind,
        name: record.name,
        label: record.label,
        browserRecord: record
      }));
    }
    function previewCanvasRecord(record) {
      if (record.kind !== "place") {
        const preview = canvasActions.get(record.id)?.preview?.();
        return preview && record.kind === "step" ? { ...preview, name: `${preview.name} · ${record.text === "Board" ? "Board" : `Pin ${record.text}`}` } : preview;
      }
      const place = places[Number(record.id.slice(6))];
      return place && atlasPlaceTooltip(place, {
        name: place.name,
        meta: placeInfo(place),
        entries: visibleCollectibleEntries(place),
        routes: matchingRoutes.filter((entry) => entry.place === place),
        destinationNames: (place.destinations ?? []).map((destination) => byArea.get(destination.area)?.label).filter(Boolean)
      });
    }
    function hoverCanvasRecord(event) {
      if (!event.records.length || event.type === "mouseleave") {
        hideMapTooltip();
        return;
      }
      const record = event.records[0];
      const preview = previewCanvasRecord(record);
      if (!preview) {
        hideMapTooltip();
        return;
      }
      hideMapTooltip();
      if (!canvasTooltipAnchor) {
        canvasTooltipAnchor = document.createElement("span");
        canvasTooltipAnchor.setAttribute("aria-hidden", "true");
        canvasTooltipAnchor.style.cssText = "position:absolute;opacity:0;pointer-events:none;left:0;top:0";
        viewport.append(canvasTooltipAnchor);
      }
      const position2 = canvasRenderer.project(record);
      const place = record.kind === "place" ? places[Number(record.id.slice(6))] : void 0;
      const metrics = place ? atlasPlacePinMetrics(place) : { width: 30, height: 30 };
      canvasTooltipAnchor.style.width = metrics.width + "px";
      canvasTooltipAnchor.style.height = metrics.height + "px";
      canvasTooltipAnchor.dataset.pinShape = place?.shape ?? "circle";
      pinPositions.set(canvasTooltipAnchor, { x: position2.x + (record.dx ?? 0), y: position2.y + (record.dy ?? 0) });
      tooltipDetails.set(canvasTooltipAnchor, () => preview);
      showMapTooltip(canvasTooltipAnchor);
    }
    function canvasMarkerRecords() {
      const records = [];
      canvasActions.clear();
      const focus = focusSelection.checked;
      const focusedQuest = focus ? selected?.quest : void 0;
      const focusedPlace = focus && focusPlaceSelection ? selectedPlace : void 0;
      const groups = focusedPlace ? [] : pinGroups(focusedQuest);
      const pixelOffset = (value) => Math.round(value * 1e6) / 1e6;
      function questRecord(group, offset = { x: 0, y: 0 }) {
        const { quest, point } = group.entries[0];
        const multiple = group.entries.length > 1;
        const id = "quest:" + markerKey(group.area, group.entries) + ":" + group.entries.map((entry) => entry.point === entry.quest.interior ? "i" : "o").join("");
        const markerType = multiple ? "cluster" : questLayer(quest);
        const record = {
          id,
          kind: "quest",
          ...worldPoint(point),
          dx: pixelOffset(offset.x),
          dy: pixelOffset(offset.y),
          name: multiple ? clusterName(group) : "#" + quest.id + " " + quest.name,
          text: multiple ? "×" + group.entries.length : String(quest.id),
          caption: false,
          shape: "circle",
          size: multiple ? 26.4 : config.keepQuestNumbers ? 30.4 : 26.4,
          color: questPinColors[markerType],
          iconURL: !multiple && !config.keepQuestNumbers ? atlasPinIconUrl(point.icon ?? quest.icon ?? questTypes[quest.type]?.icon ?? layerIcons[markerType]) : void 0,
          layer: markerType === "cluster" ? questLayer(quest) : markerType,
          selected: group.entries.some((entry) => entry.quest === selected?.quest && entry.point === selected.point)
        };
        canvasActions.set(id, {
          activate: () => multiple ? showCluster(group) : showQuest(quest, point),
          preview: () => multiple ? atlasClusterTooltip(group, { areaLabel: byArea.get(group.area)?.label }) : atlasRouteTooltip(quest, {
            name: "#" + quest.id + " " + quest.name,
            meta: [displayTypeName(quest.type), point.location || byArea.get(point.area)?.label].filter(Boolean).join(" · "),
            start: true,
            photo: point.photo ?? quest.locations?.[quest.steps?.[0]?.letter]?.photo
          })
        });
        records.push(record);
      }
      for (const group of groups) questRecord(group);
      if (expanded && !focusedPlace) {
        const entries = expanded.entries, spacing = coarse.matches ? 44 : 36;
        const radius = Math.max(spacing, spacing / (2 * Math.sin(Math.PI / entries.length)));
        const columns = Math.max(1, Math.min(Math.ceil(Math.sqrt(entries.length)), Math.floor((viewportWidth - 40) / spacing)));
        const rows = Math.ceil(entries.length / columns);
        const offsets = entries.map((_, index) => entries.length > 8 ? { x: (index % columns - (columns - 1) / 2) * spacing, y: (Math.floor(index / columns) - (rows - 1) / 2) * spacing } : { x: radius * Math.cos(-Math.PI / 2 + index * 2 * Math.PI / entries.length), y: radius * Math.sin(-Math.PI / 2 + index * 2 * Math.PI / entries.length) });
        const first = screenPoint(entries[0].point);
        const left = 24 - Math.min(...offsets.map((p) => p.x)), right = viewportWidth - 24 - Math.max(...offsets.map((p) => p.x));
        const top = 60 - Math.min(...offsets.map((p) => p.y)), bottom = viewportHeight - 48 - Math.max(...offsets.map((p) => p.y));
        const center = {
          x: left <= right ? clamp(first.x, left, right) : viewportWidth / 2,
          y: top <= bottom ? clamp(first.y, top, bottom) : viewportHeight / 2
        };
        entries.forEach((entry, index) => {
          const anchor = screenPoint(entry.point);
          questRecord({ area: expanded.area, entries: [entry] }, { x: center.x + offsets[index].x - anchor.x, y: center.y + offsets[index].y - anchor.y });
        });
      }
      const route = selected?.quest ?? selectedRoute;
      if (route && (visible("steps") || showLinkedRouteSteps)) {
        const current = selected?.step ?? linkedRouteStep;
        const occupied = [], gap = coarse.matches ? 40 : 32;
        for (const [letter, point] of Object.entries(route.locations)) {
          const anchor = screenPoint(point), halfWidth = letter === "board" ? 26 : gap / 2;
          const offsets = [[0, 0], [0, -gap], [gap, 0], [0, gap], [-gap, 0], [gap, -gap], [-gap, gap]];
          const position2 = offsets.map(([x, y]) => ({ x: anchor.x + x, y: anchor.y + y })).find(({ x, y }) => x >= halfWidth && x <= viewportWidth - halfWidth && y >= gap / 2 && y <= viewportHeight - gap / 2 && !occupied.some((other) => Math.abs(other.x - x) < other.halfWidth + halfWidth && Math.abs(other.y - y) < gap)) ?? anchor;
          occupied.push({ ...position2, halfWidth });
          const active = route.steps[current]?.letter === letter;
          const index = active ? current : route.steps.findIndex((step) => step.letter === letter);
          if (index < 0) continue;
          const id = "step:" + letter;
          records.push({
            id,
            kind: "step",
            ...worldPoint(point),
            dx: pixelOffset(position2.x - anchor.x),
            dy: pixelOffset(position2.y - anchor.y),
            name: letterLabel(letter) + " · " + route.steps[index].text,
            text: letterLabel(letter),
            caption: false,
            layer: "steps",
            shape: "circle",
            size: coarse.matches ? 32 : 28.8,
            color: active ? "#ffe3a5" : "#8c352c",
            textColor: active ? "#3b2517" : "#fff",
            selected: active,
            iconURL: config.keepStepLetters ? void 0 : atlasPinIconUrl(point.icon ?? layerIcons.steps)
          });
          canvasActions.set(id, { activate: () => activateStep(index, false), preview: () => atlasRouteTooltip(route, {
            name: selected?.quest === route ? "#" + route.id + " " + route.name : route.name,
            meta: [displayTypeName(route.type), byArea.get(point.area)?.label].filter(Boolean).join(" · "),
            stepIndex: index,
            photo: point.photo
          }) });
        }
      }
      return records;
    }
    function renderCanvasScene() {
      const focusedQuest = focusSelection.checked ? selected?.quest : void 0;
      const focusedPlace = focusSelection.checked && focusPlaceSelection ? selectedPlace : void 0;
      if (canvasPlacesDirty) {
        const candidates = placeCandidates(Boolean(focusedQuest || focusedPlace), focusedPlace);
        const signature2 = candidates.map((item) => item.index).join(",");
        if (signature2 !== canvasPlaceSignature) {
          canvasPlaceSignature = signature2;
          canvasPlaceIds = new Set(candidates.map((item) => "place:" + item.index));
          canvasRenderer.setPlaces(candidates.map(({ index, place }) => {
            const tile = byArea.get(place.area);
            return {
              id: "place:" + index,
              kind: "place",
              ...worldPoint(place),
              layer: place.type,
              name: place.name,
              caption: place.caption ?? place.name,
              text: place.symbol ?? placeTypes[place.type]?.symbol ?? "•",
              shape: place.shape ?? "square",
              size: place.size ?? "medium",
              color: place.color ?? placeTypes[place.type]?.color ?? "#5b4932",
              textColor: place.textColor ?? "#fff6e7",
              iconURL: atlasPinIconUrl(place.icon ?? placeTypes[place.type]?.icon ?? layerIcons[place.type]),
              minScale: canOffsetPin(place) ? 0 : (placeTypes[place.type]?.minExtent ?? 185) / Math.max(tile.w, tile.h)
            };
          }));
        }
        canvasPlacesDirty = false;
        canvasObjectBrowser?.update();
      }
      const dynamic = canvasMarkerRecords();
      const signature = JSON.stringify(dynamic);
      if (signature !== canvasDynamicSignature) {
        canvasDynamicSignature = signature;
        canvasRenderer.setDynamicMarkers(dynamic);
      }
      const selection = [
        ...dynamic.filter((record) => record.selected).map((record) => record.id),
        ...selectedPlace ? ["place:" + placeIndexByObject.get(selectedPlace)] : [],
        ...selectedLocation ? [selectedLocation.key] : []
      ];
      const selectedSignature = selection.join("|");
      if (selectedSignature !== canvasSelectionSignature) {
        canvasSelectionSignature = selectedSignature;
        canvasRenderer.setSelection(selection);
      }
      const enabled = layerOptions.filter((input) => input.checked).map((input) => input.dataset.layer);
      if (showLinkedRouteSteps && !enabled.includes("steps")) enabled.push("steps");
      const locationIds = void 0;
      const layerSignature = enabled.join("|") + ":" + (locationIds?.join("|") ?? "*");
      if (layerSignature !== canvasLayerSignature) {
        canvasLayerSignature = layerSignature;
        canvasRenderer.setLayers(enabled, {
          areaNames: visible("area"),
          routes: visible("routes"),
          locationIds,
          selectedLocation: selectedLocation?.key
        });
      }
      plus.disabled = camera.scale >= maxScale;
      minus.disabled = camera.scale <= fitScale();
    }
    function startCanvasRenderer() {
      const surface = document.createElement("div");
      surface.className = "atlas-scene";
      viewport.prepend(surface);
      const status = document.createElement("div");
      status.className = "atlas-canvas-status";
      const message = document.createElement("p");
      message.setAttribute("role", "status");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "Retry map";
      retry.hidden = true;
      status.append(message, retry);
      viewport.after(status);
      let attempt;
      function showStatus(text) {
        message.textContent = text;
        status.hidden = false;
      }
      function start() {
        if (viewSignal.aborted || canvasRenderer || attempt) return;
        const retryHadFocus = document.activeElement === retry;
        retry.hidden = true;
        delete viewport.dataset.rendererFailure;
        if (location.protocol === "file:") {
          rendererPending = false;
          viewport.dataset.renderer = "error";
          showStatus("Open this downloaded map through a local web server, then reload its HTTP address.");
          return;
        }
        rendererPending = true;
        viewport.dataset.renderer = "loading";
        showStatus("Loading map…");
        const currentAttempt = new AbortController();
        attempt = currentAttempt;
        createAtlasCanvasRenderer({
          container: surface,
          scene,
          signal: currentAttempt.signal,
          tileTransport,
          assetsBase: config.rendererAssets ?? "assets/atlas-lib/",
          onCamera(next) {
            if (!canvasRenderer || viewSignal.aborted) return;
            Object.assign(camera, { x: next.x, y: next.y, scale: next.scale });
            viewport.toggleAttribute("data-dragging", next.dragging);
            viewport.toggleAttribute("data-zooming", next.zooming);
            if (!next.moving) canvasCameraTarget = void 0;
            if (next.moving) hideMapTooltip();
            if (next.dragging || next.userInteraction) {
              cameraMotion = void 0;
              overview = false;
              fittedSteps = void 0;
              expanded = void 0;
              canvasCameraTarget = void 0;
            }
            if (next.interrupted) {
              cameraMotion = void 0;
              canvasCameraTarget = void 0;
            }
            requestPan();
          },
          onPick(event) {
            if (!event.records.length || viewSignal.aborted) return;
            hideMapTooltip();
            if (event.type === "contextmenu") canvasObjectBrowser.open(event.records);
            else activateCanvasRecord(event.records[0]);
          },
          onHover: hoverCanvasRecord,
          onContextStatus(event) {
            if (event.state === "artwork") return;
            if (["ready", "restored"].includes(event.state)) {
              status.hidden = true;
              return;
            }
            if (["loading", "lost", "contextlost", "restoring"].includes(event.state)) {
              showStatus(event.state === "loading" ? "Loading map…" : "Restoring map…");
            }
          }
        }).then((renderer) => {
          if (viewSignal.aborted) {
            renderer.destroy();
            return;
          }
          canvasRenderer = renderer;
          rendererPending = false;
          status.hidden = true;
          viewport.dataset.renderer = "maplibre";
          viewport.atlasRenderer = renderer;
          renderer.setCamera(camera, { animate: false });
          canvasObjectBrowser = createAtlasSceneObjectBrowser({
            viewport,
            toolbar: mapTools,
            signal: currentAttempt.signal,
            getRecords: canvasBrowserRecords,
            select: activateCanvasRecord,
            onSelected() {
              const target = selectionPanel.hidden ? viewport : selectionPanel;
              if (target === selectionPanel) target.tabIndex = -1;
              target.focus({ preventScroll: true });
            },
            highlight: (record) => renderer.highlight(record?.id)
          });
          if (retryHadFocus) viewport.focus({ preventScroll: true });
          requestDraw();
        }).catch((error) => {
          currentAttempt.abort();
          canvasRenderer?.destroy();
          canvasRenderer = void 0;
          canvasObjectBrowser = void 0;
          delete viewport.atlasRenderer;
          if (viewSignal.aborted) return;
          attempt = void 0;
          rendererPending = false;
          viewport.dataset.renderer = "error";
          viewport.dataset.rendererFailure = String(error.message).slice(0, 200);
          showStatus("The map could not start. Check that WebGL is enabled and the map’s files are available, then retry.");
          retry.hidden = false;
          if (retryHadFocus) retry.focus({ preventScroll: true });
        });
      }
      onView(retry, "click", start);
      viewSignal.addEventListener("abort", () => {
        attempt?.abort();
        canvasRenderer?.destroy();
        delete viewport.atlasRenderer;
        surface.remove();
        status.remove();
        canvasTooltipAnchor?.remove();
      }, { once: true });
      start();
    }
    function draw(now) {
      frame = void 0;
      if (viewSignal.aborted || !viewportWidth || !viewportHeight || !canvasRenderer) return;
      if (cameraMotion) {
        advanceCamera(now);
        constrainCamera(camera);
        canvasRenderer.setCamera(camera, { motion: {
          moving: Boolean(cameraMotion),
          zooming: Boolean(cameraMotion && (cameraMotion.flight || cameraMotion.start.scale !== cameraMotion.destination.scale))
        } });
        if (cameraMotion) requestPan();
      }
      renderCanvasScene();
      positionClickPopover();
    }
    function requestPan() {
      if (!viewSignal.aborted && !root.hidden && frame === void 0) frame = requestAnimationFrame(draw);
    }
    function requestDraw() {
      canvasPlacesDirty = true;
      requestPan();
    }
    function typeMatches(entry) {
      return browseMode || !type.value || type.value === entry.type;
    }
    function chapterMatches(entry) {
      return browseMode || !chapter.value || chapter.value === entry.chapter;
    }
    function windowMatches(entry) {
      return browseMode || !firstWindow.value || firstWindow.value === entry.window;
    }
    const windowOrder = new Map(Object.keys(objectives).map((code, index) => [code, index]));
    function setWindows() {
      if (browseMode) {
        chapter.value = "";
        firstWindow.value = "";
        return;
      }
      const previous = firstWindow.value;
      const codes = [...new Set([...quests, ...linkedRoutes].filter((entry) => entry.window && chapterMatches(entry) && typeMatches(entry)).map((entry) => entry.window))].sort((a, b) => windowOrder.get(a) - windowOrder.get(b));
      firstWindow.replaceChildren(
        new Option("All first windows", ""),
        ...codes.map((code) => new Option(objectives[code] ? `${code} · ${objectives[code]}` : code, code))
      );
      if (codes.includes(previous)) firstWindow.value = previous;
    }
    function collectibleEntryKey(place, entry) {
      return `${place.id}:${entry.progressId}`;
    }
    function openCollectible(place, entry, { guided = false } = {}) {
      showPlace(place, void 0, 0, { select: true, collectibleEntry: place.entries?.length > 1 ? entry : void 0, guided });
      focusTile(byArea.get(place.area), place);
      if (compact.matches) viewport.scrollIntoView({ block: "start" });
    }
    function collectibleResultButton(place, entry) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.collectibleResult = place.id;
      button.dataset.collectibleEntry = collectibleEntryKey(place, entry);
      button.textContent = entry.name;
      const meta = document.createElement("small");
      meta.className = "quest-meta";
      meta.textContent = [
        place.location || byArea.get(place.area).label,
        entry.window,
        place.pickup?.listMeta,
        collected.has(entry.progressId) && "Collected"
      ].filter(Boolean).join(" · ");
      button.append(meta);
      onView(button, "click", () => openCollectible(place, entry));
      const row = document.createElement("li");
      row.append(button);
      return row;
    }
    function renderCollectibleResults() {
      if (browseMode) {
        renderBrowseResults();
        return;
      }
      if (root.hidden) return;
      const active = document.activeElement;
      const activeGroup = active.closest("[data-collectible-result-type]");
      let total = 0;
      for (const group of collectibleResultGroups) {
        const entries = places.filter((place) => place.type === group.dataset.collectibleResultType && !(hideCollected.checked && isCollected(place))).flatMap((place) => {
          const items = place.pickup ? [{ name: place.name, progressId: place.pickup.progressId }] : visibleCollectibleEntries(place);
          return items.map((entry) => ({ place, entry }));
        });
        entries.sort((a, b) => resultCollator.compare(a.entry.name, b.entry.name) || byArea.get(a.place.area).label.localeCompare(byArea.get(b.place.area).label));
        setResultRows(group, entries, ({ place, entry }) => collectibleResultButton(place, entry));
        total += entries.length;
      }
      collectibleResults.querySelector("summary .atlas-result-count").textContent = `(${total})`;
      collectibleResults.querySelector(".atlas-collectible-empty").hidden = total !== 0;
      markCurrentResult({ expand: false });
      if (active.dataset.collectibleEntry) {
        const fallback = activeGroup.hidden ? collectibleResults : activeGroup;
        const button = collectibleResults.querySelector(`[data-collectible-entry="${CSS.escape(active.dataset.collectibleEntry)}"]`);
        (button ?? fallback.querySelector("summary")).focus({ preventScroll: true });
      }
    }
    function fillResultRows(group) {
      const pending = resultRows.get(group);
      if (!pending) return;
      group.querySelector("ul").replaceChildren(...pending.entries.map(pending.render));
      resultRows.delete(group);
    }
    function setResultRows(group, entries, render) {
      group.hidden = !entries.length;
      group.querySelector(".atlas-result-count").textContent = `(${entries.length})`;
      resultRows.set(group, { entries, render });
      if (group.open) fillResultRows(group);
      else group.querySelector("ul").replaceChildren();
    }
    function markCurrentResult({ expand = true } = {}) {
      if (browseMode) {
        browse?.markCurrent(currentBrowseKey());
        return;
      }
      results.querySelector("[aria-current]")?.removeAttribute("aria-current");
      const selector = selected ? `[data-quest="${CSS.escape(String(selected.quest.id))}"]` : selectedRoute ? `[data-linked-route="${CSS.escape(selectedRoute.id)}"]` : selectedPlace && isCollectible(selectedPlace) ? `[data-collectible-result="${CSS.escape(selectedPlace.id)}"]` : "";
      if (!selector) return;
      const entrySelector = selectedCollectibleEntry && `[data-collectible-entry="${CSS.escape(collectibleEntryKey(selectedPlace, selectedCollectibleEntry))}"]`;
      const group = selected || selectedRoute ? resultGroups.find((group2) => group2.dataset.resultType === (selected?.quest.type ?? linkedRouteType)) : collectibleResultGroups.find((group2) => group2.dataset.collectibleResultType === selectedPlace?.type);
      if (expand && group) fillResultRows(group);
      const button = results.querySelector(entrySelector || selector);
      if (!button) return;
      button.setAttribute("aria-current", "true");
      if (expand) {
        button.closest("details").open = true;
        if (collectibleResults.contains(button)) collectibleResults.open = true;
      }
    }
    function renderResults() {
      if (browseMode) {
        renderBrowseResults();
        return;
      }
      if (root.hidden) return;
      for (const group of resultGroups) {
        const groupType = group.dataset.resultType;
        if (groupType === linkedRouteType) {
          setResultRows(group, [...matchingRoutes].sort((a, b) => windowOrder.get(a.window) - windowOrder.get(b.window)), linkedRouteButton);
        } else {
          setResultRows(
            group,
            matches.filter((quest) => quest.type === groupType),
            (quest) => questButton(quest, () => openQuestResult(quest, quest.pin))
          );
        }
      }
      markCurrentResult({ expand: false });
    }
    function currentBrowseKey() {
      return browseRecords.find((record) => selected ? record.kind === "quest" && record.source === selected.quest : selectedRoute ? record.kind === "route" && record.source === selectedRoute : selectedPlace ? record.kind === "place" && record.place === selectedPlace && (!selectedCollectibleEntry || record.entry === selectedCollectibleEntry) : selectedLocation ? record.kind === "location" && record.source === selectedLocation : false)?.key;
    }
    function renderBrowseResults() {
      if (!browse || root.hidden) return;
      const questSet = new Set(matches), routeSet = new Set(matchingRoutes);
      const next = browseRecords.filter((record) => {
        if (!browse.matches(record) || type.value && type.value !== record.type) return false;
        if (record.kind === "quest") return questSet.has(record.source) && (!guideState || guideState.eligible.has(record.source.id));
        if (record.kind === "route") return routeSet.has(record.source) && (adapter.routeAvailable?.(record.source, guideState, completedRoutes) ?? !record.source.retry);
        if (guideState?.missableOnly) return false;
        if (record.kind === "place" && hideCollected.checked && !record.place.repeatable) {
          const progressId = record.entry?.progressId ?? record.place.pickup?.progressId;
          if (progressId && collected.has(progressId)) return false;
        }
        return true;
      });
      browse.update(next, currentBrowseKey());
    }
    for (const group of [...resultGroups, ...collectibleResultGroups]) {
      onView(group, "toggle", () => {
        if (!group.open || root.hidden) return;
        fillResultRows(group);
        markCurrentResult({ expand: false });
      });
    }
    function filterQuests({ keepSelection = false, forgetSelection = true } = {}) {
      const mapFilters = browseMode ? mapGuideState : guideState;
      matches = quests.filter((quest) => (!mapFilters || mapFilters.eligible.has(quest.id)) && chapterMatches(quest) && windowMatches(quest) && typeMatches(quest));
      matchingRoutes = linkedRoutes.filter((entry) => chapterMatches(entry) && windowMatches(entry) && typeMatches(entry) && (adapter.routeAvailable?.(entry, mapFilters, completedRoutes) ?? !entry.retry));
      objective.hidden = !objectives[firstWindow.value];
      if (!objective.hidden) objective.textContent = `Window objective · ${objectives[firstWindow.value]}`;
      linkedRouteFilterNote.hidden = !guideState?.objective || !matchingRoutes.length;
      const counts = [];
      if (Object.keys(questTypes).length && type.value !== linkedRouteType) counts.push(`${matches.length} ${matches.length === 1 ? "quest" : "quests"}`);
      if (linkedRouteType && (!type.value || type.value === linkedRouteType)) counts.push(`${matchingRoutes.length} ${matchingRoutes.length === 1 ? linkedRouteLabel : linkedRouteType}`);
      count.textContent = counts.join(" · ");
      if (keepSelection && selected && matches.includes(selected.quest)) {
        selectionDone.checked = Boolean(guideState?.completed.has(selected.quest.id));
        const check = detail.querySelector(".atlas-done input");
        if (check) check.checked = selectionDone.checked;
        updateGuideNote(selected.quest.id);
      } else if (keepSelection && selectedRoute && matchingRoutes.includes(selectedRoute)) {
        selectionDone.checked = completedRoutes.has(selectedRoute.id);
        const check = detail.querySelector("[data-route-done]");
        if (check) check.checked = completedRoutes.has(selectedRoute.id);
      } else if (!keepSelection || !selectedLocation) {
        const focusInSelection = selectionPanel.contains(document.activeElement) || detail.contains(document.activeElement);
        resetQuestSelection(forgetSelection);
        renderSelectionPanel();
        detail.hidden = true;
        if (focusInSelection) viewport.focus({ preventScroll: true });
      }
      renderResults();
      requestDraw();
    }
    function loadRouteProgress() {
      try {
        for (const { id } of linkedRoutes) {
          if (mapStorage.getItem(routeProgressKey(id)) === "1" || adapter.routeDone?.(id)) completedRoutes.add(id);
          else completedRoutes.delete(id);
        }
      } catch {
      }
    }
    function loadCollectibleProgress() {
      try {
        const ids = places.filter(isCollectible).flatMap(collectibleProgressIds);
        const saved = ids.filter((id) => mapStorage.getItem(collectibleProgressKey + id) === "1");
        collected.clear();
        for (const id of saved) collected.add(id);
        if (!story) hideCollected.checked = mapStorage.getItem(hideCollectedKey) === "1";
      } catch {
      }
    }
    function updateCollectibleProgress(refreshEntries = hideCollected.checked) {
      const active = document.activeElement;
      if (selectedPlace && isCollectible(selectedPlace) && refreshEntries) {
        if (!browseMode && hideCollected.checked && isCollected(selectedPlace)) {
          resetQuestSelection();
          renderSelectionPanel();
          detail.hidden = true;
          if (selectionPanel.contains(active) || detail.contains(active)) viewport.focus({ preventScroll: true });
        } else {
          if (!browseMode && hideCollected.checked && collected.has(selectedCollectibleEntry?.progressId)) selectedCollectibleEntry = void 0;
          const container = selectionPanel.contains(active) ? clickPopover && getComputedStyle(selectionPanel).overflowY === "auto" ? selectionPanel : selectionBody : sidebarCollectible.contains(active) ? sidebarCollectible : void 0;
          const activeId = active?.dataset?.collectibleCollected;
          const before = container?.scrollTop;
          renderSelectionPanel();
          sidebarCollectible.replaceChildren();
          appendCollectibleDetails(sidebarCollectible, selectedPlace, true);
          if (container) {
            ([...selectionPanel.querySelectorAll("[data-collectible-collected]"), ...container.querySelectorAll("[data-collectible-collected]")].find((check) => check.dataset.collectibleCollected === activeId) ?? container.querySelector("input") ?? clearMapSelection).focus({ preventScroll: true });
            container.scrollTop = before;
          }
        }
      }
      for (const check of mapShell.querySelectorAll("[data-collectible-collected]")) {
        check.checked = collected.has(check.dataset.collectibleCollected);
      }
      onCollectibleProgress?.();
      renderCollectibleResults();
      requestDraw();
    }
    onView(document, "keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || photoViewer?.open || shareDialog?.open || mapShell.querySelector("dialog[open]") || event.target.closest?.("dialog[open]")) return;
      if (clickPopover && !selectionPanel.hidden) {
        clearQuestSelection({ currentTarget: clearMapSelection });
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (mapTooltip.hidden) return;
      hideMapTooltip();
      event.preventDefault();
      event.stopPropagation();
    }, { signal: viewSignal });
    onView(document, "pointerdown", (event) => {
      if (!clickPopover || selectionPanel.hidden || selectionPanel.contains(event.target) || photoViewer?.open || shareDialog?.open || mapShell.querySelector("dialog[open]") || event.target.closest?.("dialog[open]")) return;
      if (browseMode && mapShell.contains(event.target) && event.target.closest("#atlas-browse-panel, #atlas-search-field, .atlas-search-toggle, [data-atlas-pane]")) return;
      resetQuestSelection();
      renderSelectionPanel();
      detail.hidden = true;
      hideMapTooltip();
      requestDraw();
    }, { capture: true, signal: viewSignal });
    onView(viewport, "keydown", (event) => {
      if (event.key === "Escape" && expanded) {
        expanded = void 0;
        requestDraw();
        event.preventDefault();
        return;
      }
      if (!canvasRenderer || !(event.target === viewport || event.target.closest(".atlas-scene"))) return;
      const offsets = { ArrowLeft: [55, 0], ArrowRight: [-55, 0], ArrowUp: [0, 55], ArrowDown: [0, -55] };
      if (offsets[event.key]) {
        const [x, y] = offsets[event.key];
        moveCamera({ ...camera, x: camera.x + x, y: camera.y + y }, false);
      } else if (event.key === "+" || event.key === "=") zoomBy(1.35);
      else if (event.key === "-") zoomBy(1 / 1.35);
      else if (event.key === "Home") fitAll();
      else return;
      event.preventDefault();
    });
    onView(plus, "click", () => zoomBy(1.35));
    onView(minus, "click", () => zoomBy(1 / 1.35));
    onView(fit, "click", () => fitAll());
    onView(showSteps, "click", () => {
      atlasSidebar.open();
      requestAnimationFrame(() => {
        if (!viewSignal.aborted) detail.scrollIntoView({ block: "start" });
      });
    });
    onView(clearMapSelection, "click", clearQuestSelection);
    shareButton?.addEventListener("click", () => shareActions.copy(shareButton), { signal: viewSignal });
    selectionDone?.addEventListener("change", setSelectedDone, { signal: viewSignal });
    for (const [button, offset, opposite] of [[previousStep, -1, nextStep], [nextStep, 1, previousStep]]) {
      onView(button, "click", () => {
        if (!selected && !selectedRoute) return;
        activateStep((selected?.step ?? linkedRouteStep) + offset, true);
        if (button.disabled) opposite.focus({ preventScroll: true });
      });
    }
    onView(focusSelection, "change", () => {
      try {
        mapStorage.setItem(focusKey, focusSelection.checked ? "on" : "off");
      } catch {
      }
      requestDraw();
    });
    for (const input of layerOptions) onView(input, "change", () => updateLayers());
    for (const [button, checked2] of [[showAll, true], [hideAll, false]]) {
      onView(button, "click", () => {
        for (const input of layerOptions) input.checked = checked2;
        updateLayers();
        (checked2 ? hideAll : showAll).focus();
      });
    }
    onView(chapter, "change", () => {
      setWindows();
      filterQuests();
    });
    onView(firstWindow, "change", () => filterQuests());
    onView(type, "change", () => {
      browse?.resetLimit();
      if (browseMode) {
        renderBrowseResults();
        return;
      }
      setWindows();
      filterQuests();
      const group = resultGroups.find((group2) => group2.dataset.resultType === type.value);
      if (group) group.open = true;
    });
    onView(area, "change", () => {
      if (selectedLocation) {
        setSelectedLocation();
        renderSelectionPanel();
      }
      if (area.value) focusTile(byArea.get(area.value));
      else fitAll();
    });
    function setRouteDone(id, checked2) {
      if (checked2) completedRoutes.add(id);
      else completedRoutes.delete(id);
      try {
        if (checked2) mapStorage.setItem(routeProgressKey(id), "1");
        else mapStorage.removeItem(routeProgressKey(id));
        onRouteProgress?.(id, checked2);
      } catch {
      }
      for (const check of mapShell.querySelectorAll(`[data-route-done="${CSS.escape(id)}"]`)) check.checked = checked2;
      filterQuests({ keepSelection: true });
    }
    onView(mapShell, "change", (event) => {
      const id = event.target.dataset.routeDone;
      if (id) setRouteDone(id, event.target.checked);
      const collectibleId = event.target.dataset.collectibleCollected;
      if (!collectibleId) return;
      if (event.target.checked) collected.add(collectibleId);
      else collected.delete(collectibleId);
      try {
        if (event.target.checked) mapStorage.setItem(collectibleProgressKey + collectibleId, "1");
        else mapStorage.removeItem(collectibleProgressKey + collectibleId);
      } catch {
      }
      updateCollectibleProgress();
    });
    if (!story) onView(hideCollected, "change", () => {
      try {
        mapStorage.setItem(hideCollectedKey, hideCollected.checked ? "1" : "0");
      } catch {
      }
      if (browseMode) renderBrowseResults();
      else updateCollectibleProgress(true);
    });
    onView(window, "storage", (event) => {
      if (story && (event.key === null || story.observes(event.key))) {
        if (event.key === null || story.isObjectiveKey(event.key)) loadMapStoryObjective();
        readMapStoryFilters(void 0, true);
      }
      if (event.key === null || event.key.startsWith(storageKey("route-done:")) || adapter.observesRouteProgress?.(event.key)) {
        loadRouteProgress();
        filterQuests({ keepSelection: true });
      }
      if (event.key === null || event.key === hideCollectedKey || event.key.startsWith(collectibleProgressKey)) {
        const wasHiding = hideCollected.checked;
        loadCollectibleProgress();
        if (browseMode && event.key === hideCollectedKey) renderBrowseResults();
        else updateCollectibleProgress(wasHiding || hideCollected.checked);
      }
    }, { signal: viewSignal });
    function loadMapStoryObjective() {
      try {
        query("#atlas-objective").value = story.getObjective();
      } catch {
        query("#atlas-objective").value = viewState.filters.objective ?? "";
      }
    }
    function readMapStoryFilters(completed, keepSelection = false, listOnly = false) {
      if (!completed) {
        completed = /* @__PURE__ */ new Set();
        try {
          for (const { id } of quests) if (story.isDone(id)) completed.add(id);
        } catch {
          completed = guideState?.completed ?? completed;
        }
      }
      const picker = query("#atlas-objective");
      const context = query("#atlas-story-context");
      guideState = story.filter(
        quests.map((quest) => quest.id),
        completed,
        picker.value,
        hideCollected.checked,
        query("#atlas-missable").checked
      );
      mapGuideState = browseMode ? story.filter(quests.map((quest) => quest.id), completed, picker.value, false, false) : guideState;
      Object.assign(viewState.filters, {
        objective: picker.value,
        hideCompleted: guideState.hideCompleted,
        missableOnly: guideState.missableOnly
      });
      context.hidden = !guideState.objective;
      context.textContent = guideState.objective ? picker.selectedOptions[0].textContent : "";
      if (!root.hidden) {
        if (listOnly) renderBrowseResults();
        else filterQuests({ keepSelection });
      }
    }
    if (browseMode) {
      viewState.browse ??= {};
      browse = setupAtlasBrowse({
        shell: mapShell,
        signal: viewSignal,
        state: viewState.browse,
        records: browseRecords,
        onFilter: renderBrowseResults,
        onSelect(record) {
          if (record.kind === "quest") openQuestResult(record.source, record.source.pin);
          else if (record.kind === "route") openLinkedRoute(record.source);
          else if (record.kind === "location") showLocation(record.source);
          else if (isCollectible(record.place)) openCollectible(record.place, record.entry);
          else {
            showPlace(record.place, void 0, 0, { select: true });
            focusTile(byArea.get(record.place.area), record.place);
          }
          if (atlasSidebar.closeOnMobile()) clearMapSelection.focus({ preventScroll: true });
        }
      });
      const sidebarElement = query(".atlas-browse-sidebar");
      onView(sidebarElement, "pointerdown", () => {
        sidebarElement.dataset.inputMode = "pointer";
      }, { capture: true, passive: true, signal: viewSignal });
      onView(sidebarElement, "keydown", () => {
        sidebarElement.dataset.inputMode = "keyboard";
      }, { capture: true, signal: viewSignal });
    }
    chapter.value = browseMode ? "" : viewState.chapter ?? "";
    type.value = viewState.type ?? "";
    setWindows();
    firstWindow.value = browseMode ? "" : viewState.firstWindow ?? "";
    if (story) {
      const storyPicker = query("#atlas-objective");
      const missableOnly = query("#atlas-missable");
      viewState.filters ??= {};
      loadMapStoryObjective();
      hideCollected.checked = viewState.filters.hideCompleted ?? false;
      missableOnly.checked = viewState.filters.missableOnly ?? false;
      for (const input of [storyPicker, hideCollected, missableOnly]) onView(input, "change", () => {
        if (input === storyPicker) {
          try {
            story.setObjective(input.value);
          } catch {
          }
        }
        readMapStoryFilters(guideState.completed, false, browseMode && input !== storyPicker);
        if (input === hideCollected && !browseMode) updateCollectibleProgress(true);
      });
      readMapStoryFilters();
    }
    function openAtlas(link = {}) {
      if (viewSignal.aborted) return false;
      updateViewportSize(viewport.clientWidth, viewport.clientHeight);
      const {
        quest: questId,
        route: routeId,
        place: placeLink,
        collectible,
        step,
        area: areaLink,
        street,
        location: locationLink,
        interior,
        retry
      } = resolveLink?.(link) ?? link;
      const hasTarget = questId !== void 0 || routeId || placeLink || collectible || areaLink || street || locationLink;
      if (!previousSize) {
        const initial = !hasTarget && !viewState.camera && byArea.get(config.initialArea);
        if (initial) {
          overview = false;
          area.value = initial.id;
          centerAt(
            initial.x + initial.w / 2,
            initial.y + initial.h / 2,
            fitScale(initial.w, initial.h),
            viewportHeight / 2,
            false
          );
        } else fitAll(false);
      }
      previousSize = { width: viewportWidth, height: viewportHeight };
      const linkedRoute = step === void 0 && !retry && matchingRoutes.find((entry2) => entry2.id === routeId) || linkedRoutes.find((entry2) => entry2.id === routeId && Boolean(entry2.retry) === Boolean(retry));
      let place = placeLink === void 0 ? void 0 : places.find((item) => atlasPlaceLink(item) === String(placeLink)) ?? places.find((item) => item.id === placeLink || `${item.area}:${item.name}` === placeLink);
      let entry;
      if (collectible) {
        const match = places.find((item) => isCollectible(item) && (item.id === collectible || item.entries?.some((candidate) => collectibleEntryKey(item, candidate) === collectible) || item.pickup && collectibleEntryKey(item, item.pickup) === collectible));
        place = match;
        entry = place?.entries?.find((candidate) => collectibleEntryKey(place, candidate) === collectible);
      }
      const location2 = locationLink ? locations.get(locationLink) ?? locations.get(config.locationAliases?.[locationLink]) : areaLink ? locations.get("area:" + areaLink) ?? locations.get("district:" + areaLink) : street ? locations.get("street:" + street) : void 0;
      const restoring = !hasTarget && viewState.camera;
      if (place) openCollectible(place, entry, { guided: Boolean(link.guidedRoute) });
      else if (linkedRoute) openLinkedRoute(linkedRoute, step === void 0 ? 0 : Number(step), step !== void 0);
      else if (location2) showLocation(location2);
      else if (restoring && locations.has(viewState.location)) showLocation(locations.get(viewState.location), false);
      else if (restoring && places[viewState.place]) {
        const previousPlace = places[viewState.place];
        const previousEntry = previousPlace.entries?.find((item) => item.progressId === viewState.entry);
        showPlace(previousPlace, void 0, 0, { select: viewState.focusPlace, collectibleEntry: previousEntry });
      } else restoreSelection(questId ?? (restoring ? viewState.spotlight : void 0), Boolean(restoring), step, interior);
      if (restoring) {
        const { x, y, scale } = viewState.camera;
        area.value = viewState.area;
        if (viewState.overview) fitAll(false);
        else if (!fittedSteps) {
          overview = false;
          centerAt(x, y, scale, viewportHeight / 2, false);
        }
      }
    }
    viewSignal.throwIfAborted();
    const viewportObserver = new ResizeObserver(([{ contentRect }]) => {
      const size = { width: Math.round(contentRect.width), height: Math.round(contentRect.height) };
      if (!size.width || !size.height || size.width === viewportWidth && size.height === viewportHeight) return;
      const wasMoving = Boolean(cameraMotion);
      if (canvasRenderer && wasMoving) canvasRenderer.stopCameraAnimation();
      updateViewportSize(size.width, size.height);
      if (overview || !previousSize) fitAll(wasMoving);
      else if (fittedSteps) fitQuestSteps(fittedSteps);
      else if (canvasRenderer) {
        const current = canvasRenderer.getCamera();
        Object.assign(camera, { x: current.x, y: current.y, scale: current.scale });
        requestPan();
      } else centerAt(
        (previousSize.width / 2 - camera.x) / camera.scale,
        (previousSize.height / 2 - camera.y) / camera.scale,
        camera.scale,
        viewportHeight / 2,
        false
      );
      previousSize = size;
    });
    viewSignal.addEventListener("abort", () => viewportObserver.disconnect(), { once: true });
    viewportObserver.observe(viewport);
    const panelObserver = new ResizeObserver(() => {
      panelBounds = void 0;
      if (clickPopover) {
        if (!selectionPanel.style.getPropertyValue("--atlas-popover-room")) popoverNaturalSize = void 0;
        positionClickPopover();
        return;
      }
      if (fittedSteps) fitQuestSteps(fittedSteps);
      else {
        revealSelectedPoint();
        requestDraw();
      }
    });
    viewSignal.addEventListener("abort", () => panelObserver.disconnect(), { once: true });
    for (const panel of mapPanels) panelObserver.observe(panel, { box: "border-box" });
    onView(compact, "change", () => {
      panelBounds = void 0;
      requestDraw();
    }, { signal: viewSignal });
    onView(document.fonts, "loadingdone", () => {
      popoverNaturalSize = void 0;
      requestDraw();
    }, { signal: viewSignal });
    viewSignal.addEventListener("abort", () => {
      const { x, y, scale } = cameraMotion?.destination ?? camera;
      Object.assign(viewState, {
        camera: { x: (viewportWidth / 2 - x) / scale, y: (viewportHeight / 2 - y) / scale, scale },
        overview,
        chapter: chapter.value,
        firstWindow: firstWindow.value,
        type: type.value,
        area: area.value,
        fitSteps: Boolean(fittedSteps),
        place: selectedPlace && !selectedRoute ? placeIndexByObject.get(selectedPlace) : void 0,
        location: selectedLocation?.key,
        entry: selectedCollectibleEntry?.progressId,
        focusPlace: focusPlaceSelection,
        spotlight: spotlight?.id
      });
    }, { once: true });
    loadRouteProgress();
    loadCollectibleProgress();
    updateCollectibleProgress(false);
    setWindows();
    filterQuests();
    try {
      focusSelection.checked = mapStorage.getItem(focusKey) !== "off";
      const savedLayers = JSON.parse(mapStorage.getItem(layerKey));
      const hidden = Array.isArray(savedLayers) ? [...savedLayers, ...config.legacyLayerIds ?? []] : savedLayers?.hidden;
      if (Array.isArray(hidden)) {
        const knownLayers = Array.isArray(savedLayers.layers) ? new Set(savedLayers.layers) : null;
        for (const [id, input] of layerById) {
          const known = knownLayers ? knownLayers.has(id) : !collectibleTypes.has(id) || config.legacyLayerIds?.includes(id);
          if (known) input.checked = !hidden.includes(id);
        }
      }
    } catch {
    }
    updateLayers(false);
    if (autoOpen) {
      openAtlas();
    }
    query(".atlas-skip").addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      viewport.focus({ preventScroll: true });
      viewport.scrollIntoView({ block: "nearest" });
    }, { signal: viewSignal });
    viewSignal.throwIfAborted();
    startCanvasRenderer();
    return {
      open: openAtlas,
      getRendererStats() {
        return canvasRenderer?.getStats() ?? { backend: "maplibre", state: viewport.dataset.renderer ?? "loading", pending: rendererPending, error: viewport.dataset.rendererFailure };
      },
      focusSelection() {
        if (viewSignal.aborted) return;
        const target = selectionPanel.hidden ? viewport : selectionName;
        if (target === selectionName) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    };
  }

  // project.js
  function mountAtlasProject(project, { signal, state = {}, adapters = {}, urlNavigation = false, tileTransport } = {}) {
    const picker = project.querySelector("[data-atlas-project-picker]");
    const tabs = [...picker.querySelectorAll("[data-atlas-open-map]")];
    const landing = project.querySelector("[data-atlas-project-landing]");
    const heading = landing.querySelector(".atlas-project-title");
    const titleArt = heading.querySelector("[data-atlas-title-image]");
    const view = project.querySelector("[data-atlas-project-view]");
    const routeSource = project.querySelector("[data-atlas-project-routes]");
    const projectRoutes = new Map((routeSource ? JSON.parse(routeSource.textContent) : []).map((route) => [route.id, route]));
    const routePanel = project.querySelector("[data-atlas-project-route]");
    const routeName = routePanel?.querySelector("[data-atlas-route-name]");
    const routeProgress = routePanel?.querySelector("[data-atlas-route-progress]");
    const routeInstructions = routePanel?.querySelector("[data-atlas-route-instructions]");
    const stepButtons = [...routePanel?.querySelectorAll("[data-atlas-project-step]") ?? []];
    const templates = new Map([...project.querySelectorAll("template[data-atlas-map]")].map((template) => [template.dataset.atlasMap, template]));
    const fallback = project.dataset.defaultMap;
    const states = state.maps ??= /* @__PURE__ */ new Map();
    const lifetime = new AbortController();
    const listenerOptions = { signal: lifetime.signal };
    let active;
    let guided;
    function unmountMap() {
      if (!active) return;
      active.controller.abort();
      active = void 0;
      picker.hidden = true;
      project.append(picker);
      if (routePanel && view.contains(routePanel)) {
        routePanel.hidden = true;
        project.append(routePanel);
      }
      view.replaceChildren();
    }
    function clearProjectRoute() {
      guided = void 0;
      delete state.projectRoute;
      if (routePanel) routePanel.hidden = true;
    }
    function showLanding(focus = false) {
      clearProjectRoute();
      unmountMap();
      delete state.map;
      landing.hidden = false;
      if (titleArt && !titleArt.hasAttribute("src")) titleArt.src = titleArt.dataset.atlasTitleImage;
      for (const image of landing.querySelectorAll("[data-atlas-preview]:not([src])")) image.src = image.dataset.atlasPreview;
      if (focus) heading.focus();
    }
    function showTitleImage() {
      if (!titleArt.naturalWidth) return;
      heading.querySelector("span").hidden = true;
      titleArt.hidden = false;
      heading.setAttribute("data-atlas-title-loaded", "");
    }
    function show({ map = active?.id ?? state.map ?? fallback, ...link } = {}) {
      const template = templates.get(map);
      if (!template || lifetime.signal.aborted) return false;
      if (active?.id !== map) {
        const keepFocus = picker.contains(document.activeElement);
        unmountMap();
        const content = template.content.cloneNode(true);
        content.querySelector("[data-atlas-sidebar-top]").prepend(picker);
        const currentTab = tabs.find((tab) => tab.dataset.atlasOpenMap === map);
        for (const tab of tabs) tab.removeAttribute("aria-current");
        currentTab.setAttribute("aria-current", "page");
        picker.hidden = false;
        landing.hidden = true;
        view.replaceChildren(content);
        if (keepFocus) currentTab.focus({ preventScroll: true });
        if (!states.has(map)) states.set(map, {});
        const controller = new AbortController();
        const atlas = mountAtlas(view, {
          signal: controller.signal,
          tileTransport,
          state: states.get(map),
          adapter: Object.hasOwn(adapters, map) ? adapters[map] : {},
          autoOpen: false,
          linkURL: urlNavigation ? (link2) => {
            const target = guided?.route.steps[guided.step];
            const parameters = target?.map === map && target.place === link2.place ? new URLSearchParams({ map, route: guided.route.id, step: guided.step + 1 }) : atlasLinkParams(link2, new URLSearchParams({ map }));
            return atlasShareURL(parameters);
          } : void 0
        });
        active = { id: map, controller, atlas };
        state.map = map;
        atlas.open(link);
      } else if (Object.keys(link).length) {
        active.atlas.open(link);
      }
      return true;
    }
    function showFromURL() {
      const parameters = new URLSearchParams(location.hash.slice(1));
      const route = projectRoutes.get(parameters.get("route"));
      if (route) {
        const value = parameters.get("step") ?? "";
        const index = /^[1-9]\d*$/.test(value) ? Number(value) - 1 : 0;
        showProjectRoute(route.id, route.steps[index] ? index : 0);
        return;
      }
      clearProjectRoute();
      const map = parameters.get("map");
      if (!templates.has(map)) {
        showLanding(view.contains(document.activeElement));
        return;
      }
      show({ map, ...readAtlasLink(parameters) });
    }
    function updateHash(parameters = "") {
      if (!urlNavigation) return;
      const url = new URL(location.href);
      url.hash = String(parameters);
      if (location.hash !== url.hash) history.pushState(history.state, "", url);
    }
    function showProjectRoute(id, step = 0) {
      const route = projectRoutes.get(id);
      const target = Number.isInteger(step) && route?.steps[step];
      if (!target) return false;
      const focused = stepButtons.find((button) => button === document.activeElement);
      if (!show({ map: target.map, place: target.place, guidedRoute: true })) return false;
      guided = { route, step };
      state.projectRoute = { id, step };
      const selection = view.querySelector("#atlas-selection");
      const body = selection.querySelector("#atlas-selection-body");
      const reference = selection.querySelector("#atlas-selection-collectible");
      if (routePanel.parentNode !== body) body.insertBefore(routePanel, reference);
      body.hidden = false;
      routePanel.hidden = false;
      routeName.textContent = route.label;
      routeProgress.textContent = `Step ${step + 1} of ${route.steps.length} · ${target.mapLabel} · ${target.label}`;
      routeInstructions.textContent = target.text;
      const facts = routePanel.querySelector("[data-atlas-route-facts]");
      facts.replaceChildren();
      atlasAppendFacts(facts, target);
      body.scrollTop = 0;
      for (const button of stepButtons) {
        const adjacent = route.steps[step + Number(button.dataset.atlasProjectStep)];
        button.disabled = !adjacent;
        if (adjacent) button.setAttribute("aria-label", `${button.textContent}: ${adjacent.mapLabel} · ${adjacent.label}`);
        else button.removeAttribute("aria-label");
      }
      if (matchMedia("(max-width: 48rem)").matches) selection.scrollIntoView({ block: "nearest" });
      if (focused) {
        const target2 = focused.disabled ? stepButtons.find((button) => !button.disabled) : focused;
        target2?.focus({ preventScroll: true });
      }
      return true;
    }
    function open(link = {}) {
      if (link.projectRoute !== void 0) {
        if (!showProjectRoute(link.projectRoute, link.step)) return false;
        updateHash(new URLSearchParams({ map: active.id, route: guided.route.id, step: String(guided.step + 1) }));
        return true;
      }
      if (!show(link)) return false;
      clearProjectRoute();
      updateHash(atlasLinkParams(link, new URLSearchParams({ map: active.id })));
      return true;
    }
    function destroy() {
      if (lifetime.signal.aborted) return;
      lifetime.abort();
      unmountMap();
      landing.hidden = true;
    }
    if (signal?.aborted) {
      destroy();
    } else {
      signal?.addEventListener("abort", destroy, { ...listenerOptions, once: true });
      if (titleArt) {
        titleArt.addEventListener("load", showTitleImage, { ...listenerOptions, once: true });
        if (titleArt.complete) showTitleImage();
      }
      project.addEventListener("atlas-selection-change", (event) => {
        if (event.detail.guided) return;
        const wasGuided = Boolean(guided);
        clearProjectRoute();
        if (wasGuided && active) updateHash(atlasLinkParams(event.detail.link ?? {}, new URLSearchParams({ map: active.id })));
      }, listenerOptions);
      project.addEventListener("click", (event) => {
        const stepButton = event.target.closest("button[data-atlas-project-step]");
        if (stepButton && guided && !stepButton.disabled) {
          open({ projectRoute: guided.route.id, step: guided.step + Number(stepButton.dataset.atlasProjectStep) });
          return;
        }
        const link = event.target.closest("a[data-atlas-open-map], a[data-atlas-show-landing]");
        if (!link || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        if (link.hasAttribute("data-atlas-show-landing")) {
          showLanding(true);
          updateHash();
          return;
        }
        const focusMap = landing.contains(link) || matchMedia("(max-width: 48rem)").matches;
        if (open({ map: link.dataset.atlasOpenMap }) && focusMap) {
          const viewport = view.querySelector("#atlas-map");
          viewport.closest(".atlas-stage").scrollIntoView({ block: "start" });
          viewport.focus({ preventScroll: true });
        }
      }, listenerOptions);
      if (urlNavigation) {
        window.addEventListener("hashchange", showFromURL, listenerOptions);
        showFromURL();
      } else if (!showProjectRoute(state.projectRoute?.id, state.projectRoute?.step)) {
        clearProjectRoute();
        if (templates.has(state.map)) show({ map: state.map });
        else showLanding();
      }
    }
    return { open, destroy };
  }
  return __toCommonJS(index_exports);
})();
var { mountAtlas, mountAtlasProject, createAtlasCanvasRenderer, atlasPlacePinMetrics, atlasLinkParams, readAtlasLink, atlasShareURL, atlasPlaceLink, atlasZoomTransform, atlasWheelDelta, atlasWheelTargetScale, atlasSampleWheelEasing, atlasWheelRetargetControl, mountPhotoViewer, mountAtlasLinkSharing } = AtlasRuntime;

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

return mountKenzanMap(viewSignal, viewState);
}
