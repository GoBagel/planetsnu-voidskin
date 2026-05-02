// ==UserScript==
// @name         Planets.nu – VoidSkin Galactic Background
// @namespace    bagelman/nu/voidskin
// @version      0.0.3
// @description  Customize the Planets.nu starmap background with static, parallax star, and comet layers.
// @author       GoBagel + ChatGPT
// @match        https://planets.nu/*
// @match        https://play.planets.nu/*
// @match        http://planets.nu/*
// @match        http://play.planets.nu/*
// @include      http://planets.nu/*
// @include      http://play.planets.nu/*
// @include      http://test.planets.nu/*
// @include      https://mobile.planets.nu/*
// @include      https://planets.nu/*
// @updateURL    https://raw.githubusercontent.com/GoBagel/planetsnu-voidskin/main/planetsnu-voidskin.user.js
// @downloadURL  https://raw.githubusercontent.com/GoBagel/planetsnu-voidskin/main/planetsnu-voidskin.user.js
// @homepageURL  https://github.com/GoBagel/planetsnu-voidskin
// @supportURL   https://github.com/GoBagel/planetsnu-voidskin/issues
// @grant        none
// ==/UserScript==

function wrapper() {
  "use strict";

  const VERSION = "0.0.3";
  const STORAGE_KEY = "planetsnu_voidskin_settings";

  const DEFAULT_SETTINGS = {
    type: "default",
    color: "#000000",
    image: "",
    url: "",
    mode: "stretch",

    starsEnabled: true,
    starLayers: 3,

    cometsEnabled: false,
    cometBehindLayers: 1,
    cometMapLayer: true,
    cometFrontLayers: 1
  };

  const LAYER_IDS = {
    behind: "voidskin-overlay-behind",
    map: "voidskin-overlay-map",
    front: "voidskin-overlay-front"
  };

  let animationStarted = false;
  let particlesReady = false;
  let starParticles = [];
  let cometParticles = { behind: [], map: [], front: [] };

  const lastView = { x: 0, y: 0, zoom: 1, valid: false };

  const log = (...args) => {
    try { console.log("[VoidSkin]", ...args); } catch (_) {}
  };

  function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function loadSettings() {
    try {
      return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (_) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(settings) {
    try {
      const next = Object.assign({}, DEFAULT_SETTINGS, settings || {});
      next.starLayers = clampNumber(next.starLayers, 1, 7, 3);
      next.cometBehindLayers = clampNumber(next.cometBehindLayers, 0, 3, 1);
      next.cometFrontLayers = clampNumber(next.cometFrontLayers, 0, 3, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      log("Unable to save settings", e);
    }
  }

  function getMapContainer() {
    return document.getElementById("PlanetsMapContainer");
  }

  function getMapCanvas() {
    const container = getMapContainer();
    if (!container) return null;
    return container.querySelector(":scope > canvas:not(.voidskin-overlay)") || container.querySelector("canvas:not(.voidskin-overlay)");
  }

  function resetCanvasBackground(canvas) {
    if (!canvas) return;
    canvas.style.backgroundColor = "";
    canvas.style.backgroundImage = "";
    canvas.style.backgroundRepeat = "";
    canvas.style.backgroundSize = "";
    canvas.style.backgroundPosition = "";
    canvas.style.backgroundAttachment = "";
    canvas.style.backgroundOrigin = "";
    canvas.style.backgroundClip = "";
  }

  function applyBackground() {
    const settings = loadSettings();
    const canvas = getMapCanvas();
    if (!canvas) return;

    resetCanvasBackground(canvas);

    if (!settings.type || settings.type === "default") return;

    canvas.style.backgroundPosition = "center center";

    if (settings.type === "color") {
      canvas.style.backgroundColor = settings.color || "#000000";
      return;
    }

    if (settings.type === "image" && settings.image) {
      canvas.style.backgroundImage = `url("${settings.image}")`;

      switch (settings.mode || "stretch") {
        case "tile":
          canvas.style.backgroundRepeat = "repeat";
          canvas.style.backgroundSize = "auto";
          break;
        case "contain":
          canvas.style.backgroundRepeat = "no-repeat";
          canvas.style.backgroundSize = "contain";
          break;
        case "cover":
          canvas.style.backgroundRepeat = "no-repeat";
          canvas.style.backgroundSize = "cover";
          break;
        case "stretch":
        default:
          canvas.style.backgroundRepeat = "no-repeat";
          canvas.style.backgroundSize = "100% 100%";
          break;
      }
    }
  }

  function ensureVoidSkinCSS() {
    if (document.getElementById("nu-voidskin-css")) return;

    const style = document.createElement("style");
    style.id = "nu-voidskin-css";
    style.textContent = `
      #PlanetsMapContainer {
        position: relative !important;
        overflow: hidden !important;
      }

      #PlanetsMapContainer > canvas:not(.voidskin-overlay) {
        position: relative;
        z-index: 10;
      }

      .voidskin-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      /*
       Important: the static VoidSkin background is applied to the Planets.nu map canvas.
       A canvas layer below that map canvas is hidden by the selected solid color/image.
       So the "behind" effect layer sits just above the map canvas visually, but uses
       slower/lower-alpha particles to read as distant background.
      */
      #voidskin-overlay-behind { z-index: 11; }
      #voidskin-overlay-map { z-index: 15; }
      #voidskin-overlay-front { z-index: 25; }

      #MessageInbox,
      #MessageInbox form,
      #SystemSettings {
        box-sizing: border-box !important;
      }

      #MessageInbox {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        max-height: calc(100vh - 105px) !important;
        padding-bottom: 80px !important;
      }

      #SystemSettings {
        padding-bottom: 140px !important;
      }

      #nu-bg-settings {
        clear: both;
        padding: 4px 0 10px 0;
        margin-bottom: 22px;
      }

      #nu-bg-settings h5 { margin: 0 0 12px 0; }
      #nu-bg-settings .nu-bg-section { clear: both; margin-bottom: 24px; }
      #nu-bg-settings .nu-bg-row { clear: both; margin: 0 0 14px 0; min-height: 30px; }

      #nu-bg-settings label.nu-bg-label {
        display: block;
        margin-bottom: 5px;
        text-transform: uppercase;
        font-size: 12px;
        color: #fff;
      }

      #nu-bg-settings select,
      #nu-bg-settings input[type="text"],
      #nu-bg-settings input[type="number"] {
        background: #111;
        color: #ddd;
        border: 1px solid #333;
        border-radius: 0;
        padding: 6px 28px 6px 10px;
        min-width: 170px;
        height: 32px;
        appearance: auto;
        -webkit-appearance: menulist;
        -moz-appearance: menulist;
      }

      #nu-bg-settings input[type="number"] {
        width: 70px;
        min-width: 70px;
        padding-right: 6px;
      }

      #nu-bg-settings .nu-bg-url {
        width: calc(100% - 30px);
        max-width: 920px;
      }

      #nu-bg-settings .nu-bg-color-wrap-inner {
        display: inline-flex;
        align-items: center;
        background: #111;
        border: 1px solid #333;
        height: 32px;
        padding: 0 7px 0 3px;
      }

      #nu-bg-settings .nu-bg-color {
        width: 72px;
        height: 26px;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
      }

      #nu-bg-settings .nu-bg-fake-arrow {
        display: inline-block;
        margin-left: 7px;
        color: #ddd;
        font-size: 11px;
        line-height: 1;
        pointer-events: none;
      }

      #nu-bg-settings .nu-bg-button {
        display: inline-block;
        width: auto;
        min-width: 210px;
        text-align: center;
        margin: 0;
        padding: 6px 10px;
        cursor: pointer;
        box-sizing: border-box;
      }

      #nu-bg-settings .nu-bg-note {
        margin-top: 7px;
        color: #aaa;
        font-size: 11px;
        max-width: 720px;
        line-height: 1.35;
      }

      #nu-bg-settings .nu-bg-inline-note {
        display: inline-block;
        margin-left: 8px;
        color: #999;
        font-size: 11px;
      }

      #nu-bg-settings details.nu-bg-details {
        margin-top: 14px;
        padding-top: 10px;
        border-top: 1px solid #333;
      }

      #nu-bg-settings details.nu-bg-details > summary {
        cursor: pointer;
        color: #ccc;
        font-size: 13px;
        text-transform: uppercase;
        margin-bottom: 10px;
        user-select: none;
      }

      #nu-bg-settings .nu-bg-checkbox {
        display: block;
        margin-bottom: 12px;
        color: #ddd;
      }

      #nu-bg-settings .nu-bg-divider-before {
        clear: both;
        margin-top: 18px;
        margin-bottom: 16px;
      }

      #nu-bg-settings .nu-bg-divider-after {
        clear: both;
        margin-top: 22px;
        margin-bottom: 18px;
      }
    `;

    document.head.appendChild(style);
  }

  function injectSettingsUI() {
    const form = document.getElementById("SystemSettings");
    if (!form || document.getElementById("nu-bg-settings")) return;

    ensureVoidSkinCSS();
    const settings = loadSettings();

    const wrapper = document.createElement("div");
    wrapper.id = "nu-bg-settings";
    wrapper.innerHTML = `
      <hr class="nu-bg-divider-before">

      <div class="nu-bg-section">
        <h5>Galactic Background</h5>

        <div class="nu-bg-row">
          <label class="nu-bg-label" for="nu-bg-type">Mode</label>
          <select id="nu-bg-type" class="nu-bg-select">
            <option value="default">Default Background</option>
            <option value="color">Solid Color</option>
            <option value="image">Image</option>
          </select>
        </div>

        <div id="nu-bg-color-wrap" class="nu-bg-row">
          <label class="nu-bg-label" for="nu-bg-color">Color</label>
          <span class="nu-bg-color-wrap-inner">
            <input type="color" id="nu-bg-color" value="#000000" class="nu-bg-color">
            <span class="nu-bg-fake-arrow">▼</span>
          </span>
        </div>

        <div id="nu-bg-image-wrap">
          <div class="nu-bg-row">
            <label class="nu-bg-label" for="nu-bg-url">Image URL</label>
            <input type="text" id="nu-bg-url" placeholder="https://..." class="nu-bg-url">
          </div>

          <div class="nu-bg-row">
            <label class="nu-bg-label">Local Image</label>
            <input type="file" id="nu-bg-file" accept="image/*" style="display:none;">
            <button type="button" id="nu-bg-file-button" class="BasicFlatButton nu-bg-button">
              Save Local Image to Browser
            </button>
            <div class="nu-bg-note">
              Stores the selected image in this browser only. It is not uploaded to Planets.nu.
            </div>
          </div>

          <div class="nu-bg-row">
            <label class="nu-bg-label" for="nu-bg-mode">Display Mode</label>
            <select id="nu-bg-mode" class="nu-bg-select">
              <option value="stretch">Stretch</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="tile">Tile</option>
            </select>
          </div>
        </div>

        <details class="nu-bg-details" open>
          <summary>Animated Stars</summary>

          <label class="checkbox nu-bg-checkbox">
            Parallax Star Layers
            <input id="nu-bg-stars-enabled" type="checkbox">
            <span></span>
          </label>

          <div class="nu-bg-row">
            <label class="nu-bg-label" for="nu-bg-star-layers">Star Layers</label>
            <input type="number" id="nu-bg-star-layers" min="1" max="7" step="1">
            <span class="nu-bg-inline-note">Default 3, max 7. Layers follow the map viewport.</span>
          </div>
        </details>

        <details class="nu-bg-details">
          <summary>Comet Layers</summary>

          <label class="checkbox nu-bg-checkbox">
            Parallax Comets
            <input id="nu-bg-comets-enabled" type="checkbox">
            <span></span>
          </label>

          <div class="nu-bg-row">
            <label class="nu-bg-label" for="nu-bg-comets-behind">Comet Layers Behind Map</label>
            <input type="number" id="nu-bg-comets-behind" min="0" max="3" step="1">
            <span class="nu-bg-inline-note">Default 1, max 3.</span>
          </div>

          <label class="checkbox nu-bg-checkbox">
            Comet Layer at Planet / Ship Level
            <input id="nu-bg-comets-map" type="checkbox">
            <span></span>
          </label>

          <div class="nu-bg-row">
            <label class="nu-bg-label" for="nu-bg-comets-front">Comet Layers In Front of Map</label>
            <input type="number" id="nu-bg-comets-front" min="0" max="3" step="1">
            <span class="nu-bg-inline-note">Default 1, max 3.</span>
          </div>
        </details>
      </div>

      <hr class="nu-bg-divider-after">
    `;

    const sphere = form.querySelector("#SphereSettings");
    if (sphere) {
      form.insertBefore(wrapper, sphere);
    } else {
      const colorSettings = form.querySelector("#ColorSettings");
      if (colorSettings && colorSettings.nextSibling) form.insertBefore(wrapper, colorSettings.nextSibling);
      else form.appendChild(wrapper);
    }

    const typeEl = document.getElementById("nu-bg-type");
    const colorEl = document.getElementById("nu-bg-color");
    const urlEl = document.getElementById("nu-bg-url");
    const fileEl = document.getElementById("nu-bg-file");
    const fileBtn = document.getElementById("nu-bg-file-button");
    const modeEl = document.getElementById("nu-bg-mode");

    const starsEnabledEl = document.getElementById("nu-bg-stars-enabled");
    const starLayersEl = document.getElementById("nu-bg-star-layers");

    const cometsEnabledEl = document.getElementById("nu-bg-comets-enabled");
    const cometsBehindEl = document.getElementById("nu-bg-comets-behind");
    const cometsMapEl = document.getElementById("nu-bg-comets-map");
    const cometsFrontEl = document.getElementById("nu-bg-comets-front");

    typeEl.value = settings.type || "default";
    colorEl.value = settings.color || "#000000";
    urlEl.value = settings.url || "";
    modeEl.value = settings.mode || "stretch";

    starsEnabledEl.checked = !!settings.starsEnabled;
    starLayersEl.value = clampNumber(settings.starLayers, 1, 7, 3);

    cometsEnabledEl.checked = !!settings.cometsEnabled;
    cometsBehindEl.value = clampNumber(settings.cometBehindLayers, 0, 3, 1);
    cometsMapEl.checked = !!settings.cometMapLayer;
    cometsFrontEl.value = clampNumber(settings.cometFrontLayers, 0, 3, 1);

    function refreshVisibility() {
      const type = typeEl.value;
      const colorWrap = document.getElementById("nu-bg-color-wrap");
      const imageWrap = document.getElementById("nu-bg-image-wrap");
      if (colorWrap) colorWrap.style.display = type === "color" ? "block" : "none";
      if (imageWrap) imageWrap.style.display = type === "image" ? "block" : "none";
    }

    function updateSettings(patch) {
      const current = loadSettings();
      const next = Object.assign({}, current, patch || {});
      saveSettings(next);
      particlesReady = false;
      applyBackground();
      ensureOverlays();
      return next;
    }

    refreshVisibility();

    typeEl.addEventListener("change", () => {
      updateSettings({ type: typeEl.value });
      refreshVisibility();
    });

    colorEl.addEventListener("input", () => {
      typeEl.value = "color";
      updateSettings({ type: "color", color: colorEl.value });
      refreshVisibility();
    });

    urlEl.addEventListener("change", () => {
      const url = urlEl.value.trim();
      updateSettings({ type: "image", url: url, image: url });
      typeEl.value = "image";
      refreshVisibility();
    });

    modeEl.addEventListener("change", () => updateSettings({ mode: modeEl.value }));
    fileBtn.addEventListener("click", () => fileEl.click());

    fileEl.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = evt => {
        const dataUrl = evt.target && evt.target.result ? String(evt.target.result) : "";
        if (!dataUrl) return;

        typeEl.value = "image";
        urlEl.value = "";
        updateSettings({ type: "image", image: dataUrl, url: "" });
        refreshVisibility();
      };
      reader.readAsDataURL(file);
    });

    starsEnabledEl.addEventListener("change", () => updateSettings({ starsEnabled: starsEnabledEl.checked }));

    starLayersEl.addEventListener("change", () => {
      starLayersEl.value = clampNumber(starLayersEl.value, 1, 7, 3);
      updateSettings({ starLayers: Number(starLayersEl.value) });
    });

    cometsEnabledEl.addEventListener("change", () => updateSettings({ cometsEnabled: cometsEnabledEl.checked }));

    cometsBehindEl.addEventListener("change", () => {
      cometsBehindEl.value = clampNumber(cometsBehindEl.value, 0, 3, 1);
      updateSettings({ cometBehindLayers: Number(cometsBehindEl.value) });
    });

    cometsMapEl.addEventListener("change", () => updateSettings({ cometMapLayer: cometsMapEl.checked }));

    cometsFrontEl.addEventListener("change", () => {
      cometsFrontEl.value = clampNumber(cometsFrontEl.value, 0, 3, 1);
      updateSettings({ cometFrontLayers: Number(cometsFrontEl.value) });
    });
  }

  function ensureOverlayCanvas(id) {
    const container = getMapContainer();
    if (!container) return null;

    let canvas = document.getElementById(id);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = id;
      canvas.className = "voidskin-overlay";
      canvas.setAttribute("aria-hidden", "true");
      container.appendChild(canvas);
    }

    resizeOverlay(canvas);
    return canvas;
  }

  function ensureOverlays() {
    ensureVoidSkinCSS();
    const settings = loadSettings();
    const container = getMapContainer();
    if (!container) return;

    const behind = ensureOverlayCanvas(LAYER_IDS.behind);
    const map = ensureOverlayCanvas(LAYER_IDS.map);
    const front = ensureOverlayCanvas(LAYER_IDS.front);

    if (behind) {
      behind.style.display = settings.starsEnabled || (settings.cometsEnabled && settings.cometBehindLayers > 0) ? "block" : "none";
    }
    if (map) {
      map.style.display = settings.cometsEnabled && settings.cometMapLayer ? "block" : "none";
    }
    if (front) {
      front.style.display = settings.cometsEnabled && settings.cometFrontLayers > 0 ? "block" : "none";
    }

    startAnimationLoop();
  }

  function resizeOverlay(canvas) {
    const container = getMapContainer();
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.dataset.voidskinDpr = String(dpr);
      particlesReady = false;
    }

    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
  }

  function getMapViewOffset() {
    const map = typeof vgap !== "undefined" && vgap ? vgap.map : null;
    const container = getMapContainer();
    const rect = container ? container.getBoundingClientRect() : { width: 0, height: 0 };

    if (!map) return lastView.valid ? lastView : { x: 0, y: 0, zoom: 1 };

    // Best case: use the map's own screen->world conversion. This tracks viewport movement,
    // not mouse position, because we sample fixed screen points: top-left and center of the map container.
    try {
      if (typeof map.mapX === "function" && typeof map.mapY === "function") {
        const leftScreen = 0;
        const topScreen = 0;
        const centerScreenX = rect.width ? rect.width / 2 : 0;
        const centerScreenY = rect.height ? rect.height / 2 : 0;

        const leftWorld = Number(map.mapX(leftScreen));
        const topWorld = Number(map.mapY(topScreen));
        const centerWorldX = Number(map.mapX(centerScreenX));
        const centerWorldY = Number(map.mapY(centerScreenY));

        if (Number.isFinite(leftWorld) && Number.isFinite(topWorld)) {
          let zoom = 1;
          const worldSpanX = Number(map.mapX(centerScreenX + 100)) - Number(map.mapX(centerScreenX));
          if (Number.isFinite(worldSpanX) && worldSpanX !== 0) zoom = Math.abs(100 / worldSpanX);

          const view = {
            x: Number.isFinite(centerWorldX) ? centerWorldX : leftWorld,
            y: Number.isFinite(centerWorldY) ? centerWorldY : topWorld,
            zoom,
            valid: true
          };
          Object.assign(lastView, view);
          return view;
        }
      }
    } catch (_) {}

    // Fallbacks: use map center/location fields, but intentionally avoid mouse-style fields.
    const candidatesX = [map.centerX, map.centerx, map.mcx, map.mapcenterx, map.mapCenterX, map.left, map.mapleft];
    const candidatesY = [map.centerY, map.centery, map.mcy, map.mapcentery, map.mapCenterY, map.top, map.maptop];

    let x = null;
    let y = null;

    for (const v of candidatesX) {
      if (Number.isFinite(Number(v))) { x = Number(v); break; }
    }
    for (const v of candidatesY) {
      if (Number.isFinite(Number(v))) { y = Number(v); break; }
    }

    if (x !== null && y !== null) {
      let zoom = 1;
      for (const v of [map.zoom, map.scale, map.zoomlevel, map.zoomLevel]) {
        if (Number.isFinite(Number(v)) && Number(v) > 0) { zoom = Number(v); break; }
      }
      const view = { x, y, zoom, valid: true };
      Object.assign(lastView, view);
      return view;
    }

    return lastView.valid ? lastView : { x: 0, y: 0, zoom: 1 };
  }

  function seededRandom(seed) {
    let t = seed + 0x6D2B79F5;
    return function () {
      t += 0x6D2B79F5;
      let r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rebuildParticles() {
    const settings = loadSettings();
    const behind = document.getElementById(LAYER_IDS.behind);
    const w = behind ? behind.width : 1600;
    const h = behind ? behind.height : 900;

    starParticles = [];
    cometParticles = { behind: [], map: [], front: [] };

    const rnd = seededRandom(74213);
    const starLayerCount = clampNumber(settings.starLayers, 1, 7, 3);

    for (let layer = 0; layer < starLayerCount; layer++) {
      const count = Math.floor(55 + layer * 22);
      const depth = 0.08 + layer * 0.055;

      for (let i = 0; i < count; i++) {
        starParticles.push({
          layer,
          depth,
          x: rnd() * w,
          y: rnd() * h,
          r: 0.6 + rnd() * (1.2 + layer * 0.16),
          alpha: 0.25 + rnd() * 0.65,
          twinkle: rnd() * Math.PI * 2,
          twinkleSpeed: 0.00035 + rnd() * 0.001
        });
      }
    }

    function makeComets(where, layerCount, baseSeedOffset) {
      const localRnd = seededRandom(91499 + baseSeedOffset);

      for (let layer = 0; layer < layerCount; layer++) {
        const count = 2 + layer;

        // Depth/parallax convention:
        // - behind layers move less than map objects
        // - map layer moves roughly with map objects
        // - front layers move more than map objects, so they feel closer to the viewer
        const depth = where === "behind"
          ? 0.10 + layer * 0.07
          : where === "map"
            ? 1.00
            : 1.35 + layer * 0.7;

        for (let i = 0; i < count; i++) {
          // Pick varied travel directions, but avoid almost-perfect vertical/horizontal paths.
          // This prevents every comet from looking like the same bottom-left -> top-right streak.
          const angleChoices = [
            -Math.PI * 0.18,  // down-right / up-left axis
            Math.PI * 0.18,
            -Math.PI * 0.38,
            Math.PI * 0.38,
            -Math.PI * 0.68,
            Math.PI * 0.68,
            -Math.PI * 0.82,
            Math.PI * 0.82
          ];
          const baseAngle = angleChoices[Math.floor(localRnd() * angleChoices.length)];
          const angle = baseAngle + (localRnd() - 0.5) * 0.28;

          // Speed also follows depth: farther = slower, closer = faster
          const baseSpeed = 0.01 + localRnd() * 0.02;
          const depthSpeedMultiplier = depth; // key change for stronger parallax feel

          cometParticles[where].push({
            layer,
            depth,
            x: localRnd() * w,
            y: localRnd() * h,
            speed: baseSpeed * depthSpeedMultiplier + layer * 0.01,
            // Tail length follows depth too: distant comets have shorter tails,
            // foreground comets have longer, more dramatic tails.
            length: (35 + localRnd() * 65 + layer * 12) * Math.max(0.45, depth),
            size: where === "front" ? 1.6 + localRnd() * 1.6 : 1 + localRnd() * 1.2,
            angle,
            alpha: where === "front" ? 0.42 + localRnd() * 0.28 : 0.25 + localRnd() * 0.28
          });
        }
      }
    }

    makeComets("behind", clampNumber(settings.cometBehindLayers, 0, 3, 1), 1);
    makeComets("map", settings.cometMapLayer ? 1 : 0, 2);
    makeComets("front", clampNumber(settings.cometFrontLayers, 0, 3, 1), 3);

    particlesReady = true;
  }

  function clearCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return ctx;
  }

  function wrapPosition(value, max) {
    if (!max) return value;
    value %= max;
    if (value < 0) value += max;
    return value;
  }

  function drawStars(ctx, canvas, time, view) {
    const settings = loadSettings();
    if (!settings.starsEnabled) return;

    const w = canvas.width;
    const h = canvas.height;

    for (const s of starParticles) {
      const x = wrapPosition(s.x - view.x * s.depth, w);
      const y = wrapPosition(s.y + view.y * s.depth, h);

      const twinkle = 0.65 + Math.sin(time * s.twinkleSpeed + s.twinkle) * 0.35;
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function drawComets(ctx, canvas, time, view, where) {
    const settings = loadSettings();
    if (!settings.cometsEnabled) return;

    const w = canvas.width;
    const h = canvas.height;
    const comets = cometParticles[where] || [];

    for (const c of comets) {
      const drift = time * c.speed;
      const dx = Math.cos(c.angle);
      const dy = Math.sin(c.angle);

      const x = wrapPosition(c.x + drift * dx - view.x * c.depth, w + c.length * 2) - c.length;
      const y = wrapPosition(c.y + drift * dy + view.y * c.depth, h + c.length * 2) - c.length;

      ctx.globalAlpha = c.alpha;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - dx * c.length, y - dy * c.length);
      ctx.lineWidth = c.size;
      ctx.strokeStyle = "#dfefff";
      ctx.stroke();

      ctx.globalAlpha = Math.min(1, c.alpha + 0.2);
      ctx.beginPath();
      ctx.arc(x, y, c.size * 1.7, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function renderVoidSkinFrame(time) {
    ensureOverlays();

    const behind = document.getElementById(LAYER_IDS.behind);
    const map = document.getElementById(LAYER_IDS.map);
    const front = document.getElementById(LAYER_IDS.front);

    [behind, map, front].forEach(resizeOverlay);
    if (!particlesReady) rebuildParticles();

    const view = getMapViewOffset();

    const behindCtx = clearCanvas(behind);
    if (behindCtx && behind.style.display !== "none") {
      drawStars(behindCtx, behind, time, view);
      drawComets(behindCtx, behind, time, view, "behind");
    }

    const mapCtx = clearCanvas(map);
    if (mapCtx && map.style.display !== "none") drawComets(mapCtx, map, time, view, "map");

    const frontCtx = clearCanvas(front);
    if (frontCtx && front.style.display !== "none") drawComets(frontCtx, front, time, view, "front");

    window.requestAnimationFrame(renderVoidSkinFrame);
  }

  function startAnimationLoop() {
    if (animationStarted) return;
    animationStarted = true;
    window.requestAnimationFrame(renderVoidSkinFrame);
  }

  function installVoidSkinObserver() {
    if (installVoidSkinObserver.installed) return;
    installVoidSkinObserver.installed = true;

    const observer = new MutationObserver(() => {
      injectSettingsUI();
      applyBackground();
      ensureOverlays();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function registerWithPlanetsNuClient() {
    try {
      if (
        typeof vgap !== "undefined" &&
        vgap &&
        typeof vgap.registerPlugin === "function" &&
        !(vgap.plugins && vgap.plugins.VoidSkinGalacticBackground)
      ) {
        const plugin = {
          processload: function () { applyBackground(); ensureOverlays(); },
          loaddashboard: function () { injectSettingsUI(); applyBackground(); ensureOverlays(); },
          loadmap: function () { applyBackground(); ensureOverlays(); },
          showmap: function () { applyBackground(); ensureOverlays(); },
          loadsettings: function () { injectSettingsUI(); applyBackground(); ensureOverlays(); }
        };

        vgap.registerPlugin(plugin, "VoidSkinGalacticBackground");
        log("Registered Planets.nu plugin hook");
      }
    } catch (e) {
      log("Planets.nu plugin registration skipped/failed", e);
    }
  }

  function initVoidSkin() {
    log("VoidSkin Galactic Background v" + VERSION);

    ensureVoidSkinCSS();
    installVoidSkinObserver();
    injectSettingsUI();
    applyBackground();
    ensureOverlays();

    const start = Date.now();
    const poll = setInterval(() => {
      registerWithPlanetsNuClient();
      injectSettingsUI();
      applyBackground();
      ensureOverlays();
      if (Date.now() - start > 30000) clearInterval(poll);
    }, 1000);
  }

  initVoidSkin();
}

const script = document.createElement("script");
script.type = "application/javascript";
script.textContent = "(" + wrapper + ")();";
document.body.appendChild(script);
document.body.removeChild(script);
