/*
 * Auto Tab Switcher: background service worker (Manifest V3)
 *
 * How timing works:
 *   chrome.alarms can't fire more often than every 30 seconds, so the actual
 *   switching uses setTimeout. A 30-second "watchdog" alarm keeps the service
 *   worker alive and restarts the timer if Chrome ever shuts the worker down.
 *   The time of the next switch is kept in storage.session, so a restart
 *   continues the schedule instead of starting over.
 *
 * How rotation works:
 *   Every tick, each normal (non-minimised) window moves from its currently
 *   active tab to the next unpinned tab. Because it's based on the active
 *   tab rather than a remembered counter, it never gets stuck and it follows
 *   along if you switch tabs yourself.
 */

const DEFAULTS = {
  enabled: false,
  time: 10,              // seconds between switches
  refresh: true,         // reload the upcoming tab so it's fresh when shown
  pauseWhenActive: true, // don't switch while someone is using the computer
  darkMode: false
};

const WATCHDOG = "watchdog";
const IDLE_SECONDS = 15; // minimum Chrome allows for chrome.idle
const MIN_TIME = 1;
const MAX_TIME = 3600;

let timer = null;

// Run state-changing steps one at a time, so overlapping events (startup,
// watchdog, settings change) can never create two timers.
let queue = Promise.resolve();
function serial(fn) {
  queue = queue.then(fn).catch((e) => console.warn("Auto Tab Switcher:", e));
  return queue;
}

const getSettings = () => chrome.storage.sync.get(DEFAULTS);

function clampTime(t) {
  const n = Math.round(Number(t));
  if (!Number.isFinite(n)) return DEFAULTS.time;
  return Math.min(MAX_TIME, Math.max(MIN_TIME, n));
}

/* ───────────── Rotation ───────────── */

async function rotateWindow(win, refresh) {
  const tabs = (win.tabs || []).filter((t) => !t.pinned);
  if (tabs.length <= 1) return;

  const current = tabs.findIndex((t) => t.active); // -1 if a pinned tab is active
  const next = tabs[(current + 1) % tabs.length];
  await chrome.tabs.update(next.id, { active: true });

  if (refresh) {
    // Reload the tab after the one now showing, so it has fresh data by the
    // time it's displayed and the user never watches a page loading.
    const upcoming = tabs[(current + 2) % tabs.length];
    if (upcoming.id !== next.id) {
      try {
        await chrome.tabs.reload(upcoming.id);
      } catch (e) {
        console.warn("Auto Tab Switcher: could not refresh tab", e);
      }
    }
  }
}

async function isUserActive() {
  try {
    return (await chrome.idle.queryState(IDLE_SECONDS)) === "active";
  } catch {
    return false;
  }
}

async function tick() {
  timer = null;
  const s = await getSettings();
  if (!s.enabled) return;

  const paused = s.pauseWhenActive && (await isUserActive());
  setPausedBadge(paused);

  if (!paused) {
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
    for (const win of windows) {
      if (win.state === "minimized") continue;
      try {
        await rotateWindow(win, s.refresh);
      } catch (e) {
        console.warn("Auto Tab Switcher: could not switch tab", e);
      }
    }
  }

  await scheduleNext(clampTime(s.time) * 1000);
}

/* ───────────── Scheduling ───────────── */

async function scheduleNext(delayMs) {
  clearTimeout(timer);
  timer = setTimeout(() => serial(tick), delayMs);
  await chrome.storage.session.set({ nextAt: Date.now() + delayMs });
}

// Start the loop if it isn't running (e.g. after the worker was restarted).
async function ensureRunning() {
  const s = await getSettings();
  if (!s.enabled) return stop();
  if (timer) return;

  if (!(await chrome.alarms.get(WATCHDOG))) {
    chrome.alarms.create(WATCHDOG, { periodInMinutes: 0.5 });
  }

  const { nextAt } = await chrome.storage.session.get("nextAt");
  const intervalMs = clampTime(s.time) * 1000;
  const remaining = nextAt ? nextAt - Date.now() : intervalMs;
  await scheduleNext(Math.min(intervalMs, Math.max(0, remaining)));
}

async function stop() {
  clearTimeout(timer);
  timer = null;
  await chrome.alarms.clear(WATCHDOG);
  await chrome.storage.session.remove("nextAt");
  setPausedBadge(false);
}

/* ───────────── Toolbar icon ───────────── */

function updateIcon(enabled) {
  const p = enabled ? "icons/icon-on" : "icons/icon-off";
  chrome.action.setIcon({ path: { 16: `${p}-16.png`, 48: `${p}-48.png`, 128: `${p}-128.png` } });
  chrome.action.setTitle({ title: `Auto Tab Switcher (${enabled ? "running" : "off"})` });
}

function setPausedBadge(paused) {
  chrome.action.setBadgeText({ text: paused ? "II" : "" });
  if (paused) {
    chrome.action.setBadgeBackgroundColor({ color: "#8e8e93" });
    chrome.action.setTitle({ title: "Auto Tab Switcher (paused while you're using the computer)" });
  }
}

async function refreshState() {
  const s = await getSettings();
  updateIcon(s.enabled);
  await ensureRunning();
}

/* ───────────── Events ───────────── */

chrome.runtime.onInstalled.addListener(() => serial(refreshState));
chrome.runtime.onStartup.addListener(() => serial(refreshState));

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === WATCHDOG) serial(ensureRunning);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") serial(() => onSettingsChanged(changes));
});

async function onSettingsChanged(changes) {
  if (changes.enabled) {
    updateIcon(!!changes.enabled.newValue);
    if (changes.enabled.newValue) {
      const s = await getSettings();
      await chrome.alarms.create(WATCHDOG, { periodInMinutes: 0.5 });
      await scheduleNext(clampTime(s.time) * 1000);
    } else {
      await stop();
    }
  } else if (changes.time) {
    const s = await getSettings();
    if (s.enabled) await scheduleNext(clampTime(s.time) * 1000);
  } else if (changes.pauseWhenActive && !changes.pauseWhenActive.newValue) {
    setPausedBadge(false);
  }
}

// Keyboard shortcut (default Alt+Shift+R, editable at chrome://extensions/shortcuts)
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-rotation") return;
  const { enabled } = await getSettings();
  chrome.storage.sync.set({ enabled: !enabled });
});

// Every time the worker wakes up, make sure the loop is running.
serial(refreshState);
