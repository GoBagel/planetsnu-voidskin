// ==UserScript==
// @name         Planets.nu – Galactic Background
// @namespace    bagelman/nu/background
// @version      0.1
// @description  Customize map canvas background (color or image, tiled/stretch)
// @match        https://planets.nu/*
// @match        https://play.planets.nu/*
// @grant        none
// ==/UserScript==

(function () {
  const STORAGE_KEY = "nu_bg_settings";

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveSettings(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function applyBackground() {
    const settings = loadSettings();
    const container = document.getElementById("PlanetsMapContainer");
    if (!container) return;

    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    if (settings.type === "color") {
      canvas.style.background = settings.color || "#000000";
      canvas.style.backgroundSize = "auto";
      canvas.style.backgroundRepeat = "no-repeat";
    } else if (settings.type === "image") {
      if (!settings.image) return;

      canvas.style.backgroundImage = `url(${settings.image})`;

      if (settings.mode === "tile") {
        canvas.style.backgroundRepeat = "repeat";
        canvas.style.backgroundSize = "auto";
      } else if (settings.mode === "stretch") {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundSize = "cover";
      } else {
        canvas.style.backgroundRepeat = "no-repeat";
        canvas.style.backgroundSize = "contain";
      }
    }
  }

  function injectSettingsUI() {
    const form = document.getElementById("SystemSettings");
    if (!form || document.getElementById("nu-bg-settings")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "nu-bg-settings";
    wrapper.innerHTML = `
      <hr>
      <h5>Galactic Background</h5>

      <label>
        Mode:
        <select id="nu-bg-type">
          <option value="color">Solid Color</option>
          <option value="image">Image</option>
        </select>
      </label>
      <br><br>

      <div id="nu-bg-color-wrap">
        <label>Color:</label>
        <input type="color" id="nu-bg-color" value="#000000">
      </div>

      <div id="nu-bg-image-wrap" style="display:none;">
        <label>Image URL:</label>
        <input type="text" id="nu-bg-url" placeholder="https://...">
        <br><br>

        <label>Upload Local Image:</label>
        <input type="file" id="nu-bg-file">
        <br><br>

        <label>Display Mode:</label>
        <select id="nu-bg-mode">
          <option value="stretch">Stretch</option>
          <option value="tile">Tile</option>
          <option value="contain">Contain</option>
        </select>
      </div>
    `;

    form.insertBefore(wrapper, form.querySelector("#SphereSettings"));

    const settings = loadSettings();

    const typeEl = document.getElementById("nu-bg-type");
    const colorEl = document.getElementById("nu-bg-color");
    const urlEl = document.getElementById("nu-bg-url");
    const fileEl = document.getElementById("nu-bg-file");
    const modeEl = document.getElementById("nu-bg-mode");

    typeEl.value = settings.type || "color";
    colorEl.value = settings.color || "#000000";
    urlEl.value = settings.url || "";
    modeEl.value = settings.mode || "stretch";

    function refreshVisibility() {
      document.getElementById("nu-bg-color-wrap").style.display =
        typeEl.value === "color" ? "block" : "none";

      document.getElementById("nu-bg-image-wrap").style.display =
        typeEl.value === "image" ? "block" : "none";
    }

    refreshVisibility();

    typeEl.onchange = () => {
      settings.type = typeEl.value;
      saveSettings(settings);
      refreshVisibility();
      applyBackground();
    };

    colorEl.oninput = () => {
      settings.color = colorEl.value;
      settings.type = "color";
      saveSettings(settings);
      applyBackground();
    };

    urlEl.onchange = () => {
      settings.image = urlEl.value;
      settings.type = "image";
      saveSettings(settings);
      applyBackground();
    };

    modeEl.onchange = () => {
      settings.mode = modeEl.value;
      saveSettings(settings);
      applyBackground();
    };

    fileEl.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (evt) {
        settings.image = evt.target.result;
        settings.type = "image";
        saveSettings(settings);
        applyBackground();
      };
      reader.readAsDataURL(file);
    };
  }

  function init() {
    const interval = setInterval(() => {
      if (document.getElementById("SystemSettings")) {
        injectSettingsUI();
      }
      applyBackground();
    }, 1000);

    setTimeout(() => clearInterval(interval), 20000);
  }

  init();
})();