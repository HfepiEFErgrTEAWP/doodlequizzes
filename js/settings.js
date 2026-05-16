/**
 * Settings — theme, volume, leaderboard visibility
 */
const Settings = (function () {
  "use strict";

  const KEY = "doodle_quizzes_settings";

  const defaults = {
    volume: 70,
    theme: "light",
    customColor: "#8e44ad",
    showOnLeaderboard: true,
  };

  let settings = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      /* */
    }
    return { ...defaults };
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(settings));
    apply();
  }

  function get() {
    return { ...settings };
  }

  function set(partial) {
    settings = { ...settings, ...partial };
    save();
  }

  function apply() {
    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    if (settings.theme === "custom") {
      root.style.setProperty("--paper", lighten(settings.customColor, 0.92));
      root.style.setProperty("--paper-dark", lighten(settings.customColor, 0.85));
      root.style.setProperty("--ink", darken(settings.customColor, 0.75));
    } else {
      root.style.removeProperty("--paper");
      root.style.removeProperty("--paper-dark");
      root.style.removeProperty("--ink");
    }
    if (typeof Sounds !== "undefined") {
      Sounds.setVolume((settings.volume || 0) / 100);
    }
  }

  function lighten(hex, amt) {
    const { r, g, b } = parseHex(hex);
    return `rgb(${Math.round(r + (255 - r) * amt)},${Math.round(g + (255 - g) * amt)},${Math.round(b + (255 - b) * amt)})`;
  }

  function darken(hex, amt) {
    const { r, g, b } = parseHex(hex);
    return `rgb(${Math.round(r * (1 - amt))},${Math.round(g * (1 - amt))},${Math.round(b * (1 - amt))})`;
  }

  function parseHex(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function isVisibleOnLeaderboard(userData) {
    if (userData.showOnLeaderboard === false) return false;
    return settings.showOnLeaderboard !== false;
  }

  apply();
  return { get, set, apply, isVisibleOnLeaderboard, defaults };
})();
