// dmode — dark mode toggle for Crockpot
// Persists choice in localStorage under "crockpot-theme" ("dark" | "light").
// A tiny inline script in <head> already applies the saved/preferred theme
// before first paint; this file just wires up the toggle button.

(function () {
  var STORAGE_KEY = "crockpot-theme";
  var root = document.documentElement;
  var btn = document.getElementById("btnDark");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    if (btn) {
      var isDark = theme === "dark";
      btn.classList.toggle("on", isDark);
      btn.setAttribute("aria-pressed", String(isDark));
      btn.textContent = isDark ? "Light mode" : "Dark mode";
    }
  }

  function setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) — theme just
      // won't persist across reloads, the toggle still works this session.
    }
  }

  function toggleTheme() {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  }

  // Sync the button's label/state with whatever the pre-paint script set.
  applyTheme(currentTheme());

  if (btn) {
    btn.addEventListener("click", toggleTheme);
  }

  // Follow the OS setting live, but only for users who haven't picked
  // a theme of their own on this device.
  if (window.matchMedia) {
    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function (e) {
      var saved = null;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch (err) {}
      if (!saved) applyTheme(e.matches ? "dark" : "light");
    };
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else if (mql.addListener) mql.addListener(onChange);
  }
})();
