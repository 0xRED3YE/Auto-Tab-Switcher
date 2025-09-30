const tabIndices = {};

/**
 * Rotate through tabs in every non-minimised window.
 * Optionally refresh the tab after the one we activate, depending on
 * the user's “refresh” setting.
 */
async function rotateTabs() {
  const { enabled, time, refresh } = await chrome.storage.sync.get(
    ['enabled', 'time', 'refresh']
  );
  if (!enabled) return;

  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });

  for (const win of windows) {
    if (win.state === 'minimized') continue;

    const tabs = win.tabs.filter(tab => !tab.pinned);
    if (tabs.length <= 1) continue;

    if (!(win.id in tabIndices)) {
      tabIndices[win.id] = 0;
    } else {
      tabIndices[win.id] = (tabIndices[win.id] + 1) % tabs.length;
    }

    const currentIndex = tabIndices[win.id];
    const refreshIndex = (currentIndex + 1) % tabs.length;

    if (!tabs[currentIndex].active) {
      await chrome.tabs.update(tabs[currentIndex].id, { highlighted: true });
    }

    if (refresh) {
      try {
        await chrome.tabs.reload(tabs[refreshIndex].id);
      } catch (e) {
        console.warn('Could not refresh tab', e);
      }
    }
  }
}


/**
 * Creates / resets an alarm that fires every <intervalInSeconds>.
 */
function scheduleRotation(intervalInSeconds) {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('tabRotation', { periodInMinutes: intervalInSeconds / 60 });
  });
}

/**
 * Swap the toolbar icon between “on” and “off”.
 */
function updateIcon(enabled) {
  const prefix = enabled ? 'icon-on' : 'icon-off';

  chrome.action.setIcon({
    path: {
      16: `${prefix}-16.png`,
      48: `${prefix}-48.png`,
      128: `${prefix}-128.png`
    }
  });
}

/**
 * Reads stored settings, updates icon, and (re)schedules alarms.
 */
function updateStatus() {
  chrome.storage.sync.get(['enabled', 'time', 'refresh'], ({ enabled, time, refresh }) => {
    updateIcon(enabled);

    if (enabled) {
      const seconds = time || 10;
      scheduleRotation(seconds);
    } else {
      chrome.alarms.clearAll();
    }
  });
}

/* ──────────────── Event listeners ──────────────── */

// Fired every alarm tick
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tabRotation') {
    rotateTabs();
  }
});

// Handle extension lifecycle events
chrome.runtime.onStartup.addListener(updateStatus);
chrome.runtime.onInstalled.addListener(updateStatus);

// React to any change in user settings
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled || changes.time || changes.refresh) {
    updateStatus();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "reloadConfig") {
    updateStatus();
  }
});


