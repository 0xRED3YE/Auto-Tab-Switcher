const DEFAULTS = { enabled: false, time: 10, refresh: true, pauseWhenActive: true, darkMode: false };

const $ = (id) => document.getElementById(id);

function clampTime(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(3600, n);
}

function showEnabled(enabled) {
  $("status").textContent = enabled ? "Running" : "Off";
  $("status").className = `status ${enabled ? "enabled" : "disabled"}`;
  $("enable").textContent = enabled ? "Stop" : "Start";
}

function showTheme(dark) {
  $("body").classList.toggle("dark", dark);
  $("themeToggle").textContent = dark ? "🌙" : "☀️";
}

// Load saved settings
chrome.storage.sync.get(DEFAULTS, (s) => {
  $("seconds").value = clampTime(s.time);
  $("refresh").checked = s.refresh;
  $("pauseWhenActive").checked = s.pauseWhenActive;
  showEnabled(s.enabled);
  showTheme(s.darkMode);
});

// Show the real shortcut if the user changed it
chrome.commands.getAll((cmds) => {
  const c = cmds.find((x) => x.name === "toggle-rotation");
  $("shortcut").textContent = (c && c.shortcut) || "not set";
});

// Keep the popup in sync if the shortcut toggles it while open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabled) showEnabled(!!changes.enabled.newValue);
});

// Interval: save once the user finishes typing (Enter or leaving the box)
$("seconds").addEventListener("change", () => {
  const time = clampTime($("seconds").value);
  $("seconds").value = time;
  chrome.storage.sync.set({ time });
});

$("refresh").addEventListener("change", (e) => chrome.storage.sync.set({ refresh: e.target.checked }));
$("pauseWhenActive").addEventListener("change", (e) => chrome.storage.sync.set({ pauseWhenActive: e.target.checked }));

$("enable").addEventListener("click", () => {
  chrome.storage.sync.get(DEFAULTS, ({ enabled }) => {
    // Save the interval too, in case it was typed but not yet committed
    const time = clampTime($("seconds").value);
    chrome.storage.sync.set({ enabled: !enabled, time });
    showEnabled(!enabled);
  });
});

$("themeToggle").addEventListener("click", () => {
  const dark = !$("body").classList.contains("dark");
  showTheme(dark);
  chrome.storage.sync.set({ darkMode: dark });
});
