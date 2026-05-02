// ==UserScript==
// @name         Planets.nu – VoidSkin Galactic Background
// @namespace    bagelman/nu/voidskin
// @version      0.0.1
// @description  Customize the Planets.nu starmap canvas background with default, color, URL image, or browser-local image.
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
// @grant        none
// ==/UserScript==

function wrapper() {
  "use strict";

  const VERSION = "0.2";
  const STORAGE_KEY = "planetsnu_voidskin_settings";

  const DEFAULT_SETTINGS = {
    type: "default",
    color: "#000000",
    image: "",
    url: "",
    mode: "stretch"
  };

  const log = (...args) => {
    try {
      console.log("[VoidSkin]", ...args);
    } catch (_) {}
  };

  function loadSettings() {
    try {
      return Object.assign(
        {},
        DEFAULT_SETTINGS,
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
      );
    } catch (_) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Object.assign({}, DEFAULT_SETTINGS, settings || {}))
      );
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

    return (
      container.querySelector(":scope > canvas") ||
      container.querySelector("canvas")
    );
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

    if (!settings.type || settings.type === "default") {
      return;
    }

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
      #nu-bg-settings {
        clear: both;
        padding: 4px 0 10px 0;
        margin-bottom: 22px;
      }

      #nu-bg-settings h5 {
        margin: 0 0 12px 0;
      }

      #nu-bg-settings .nu-bg-section {
        clear: both;
        margin-bottom: 24px;
      }

      #nu-bg-settings .nu-bg-row {
        clear: both;
        margin: 0 0 14px 0;
        min-height: 30px;
      }

      #nu-bg-settings label.nu-bg-label {
        display: block;
        margin-bottom: 5px;
        text-transform: uppercase;
        font-size: 12px;
        color: #fff;
      }

      #nu-bg-settings select,
      #nu-bg-settings input[type="text"] {
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
      </div>

      <hr class="nu-bg-divider-after">
    `;

    const sphere = form.querySelector("#SphereSettings");
    if (sphere) {
      form.insertBefore(wrapper, sphere);
    } else {
      const colorSettings = form.querySelector("#ColorSettings");
      if (colorSettings && colorSettings.nextSibling) {
        form.insertBefore(wrapper, colorSettings.nextSibling);
      } else {
        form.appendChild(wrapper);
      }
    }

    const typeEl = document.getElementById("nu-bg-type");
    const colorEl = document.getElementById("nu-bg-color");
    const urlEl = document.getElementById("nu-bg-url");
    const fileEl = document.getElementById("nu-bg-file");
    const fileBtn = document.getElementById("nu-bg-file-button");
    const modeEl = document.getElementById("nu-bg-mode");

    typeEl.value = settings.type || "default";
    colorEl.value = settings.color || "#000000";
    urlEl.value = settings.url || "";
    modeEl.value = settings.mode || "stretch";

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
      applyBackground();
      return next;
    }

    refreshVisibility();

    typeEl.addEventListener("change", () => {
      updateSettings({ type: typeEl.value });
      refreshVisibility();
    });

    colorEl.addEventListener("input", () => {
      typeEl.value = "color";
      updateSettings({
        type: "color",
        color: colorEl.value
      });
      refreshVisibility();
    });

    urlEl.addEventListener("change", () => {
      const url = urlEl.value.trim();

      updateSettings({
        type: "image",
        url: url,
        image: url
      });

      typeEl.value = "image";
      refreshVisibility();
    });

    modeEl.addEventListener("change", () => {
      updateSettings({ mode: modeEl.value });
    });

    fileBtn.addEventListener("click", () => {
      fileEl.click();
    });

    fileEl.addEventListener("change", e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = evt => {
        const dataUrl = evt.target && evt.target.result ? String(evt.target.result) : "";
        if (!dataUrl) return;

        typeEl.value = "image";
        urlEl.value = "";

        updateSettings({
          type: "image",
          image: dataUrl,
          url: ""
        });

        refreshVisibility();
      };

      reader.readAsDataURL(file);
    });
  }

  function installVoidSkinObserver() {
    if (installVoidSkinObserver.installed) return;
    installVoidSkinObserver.installed = true;

    const observer = new MutationObserver(() => {
      injectSettingsUI();
      applyBackground();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
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
          processload: function () {
            applyBackground();
          },
          loaddashboard: function () {
            injectSettingsUI();
            applyBackground();
          },
          loadmap: function () {
            applyBackground();
          },
          showmap: function () {
            applyBackground();
          },
          loadsettings: function () {
            injectSettingsUI();
            applyBackground();
          }
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

    const start = Date.now();
    const poll = setInterval(() => {
      registerWithPlanetsNuClient();
      injectSettingsUI();
      applyBackground();

      if (Date.now() - start > 30000) {
        clearInterval(poll);
      }
    }, 1000);
  }

  initVoidSkin();
}

const script = document.createElement("script");
script.type = "application/javascript";
script.textContent = "(" + wrapper + ")();";
document.body.appendChild(script);
document.body.removeChild(script);