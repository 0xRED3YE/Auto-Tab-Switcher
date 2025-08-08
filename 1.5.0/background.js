const tabIndices = {};

function rotateTabs() {
  chrome.storage.sync.get(['enabled', 'time'], ({ enabled, time }) => {
    if (!enabled) return;

    chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
      windows.forEach((win) => {
        if (win.state === 'minimized') return;

        const tabs = win.tabs.filter(tab => !tab.pinned);
        if (tabs.length <= 1) return;

        // Initialize or update index
        if (!(win.id in tabIndices)) {
          tabIndices[win.id] = 0;
        } else {
          tabIndices[win.id] = (tabIndices[win.id] + 1) % tabs.length;
        }

        const currentIndex = tabIndices[win.id];
        const refreshIndex = (currentIndex + 1) % tabs.length;

        // Only switch if it's not already active
        if (!tabs[currentIndex].active) {
          chrome.tabs.update(tabs[currentIndex].id, { highlighted: true });
        }

        // Refresh the next tab
        chrome.tabs.reload(tabs[refreshIndex].id);
      });
    });
  });
}

function scheduleRotation(intervalInSeconds) {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create('tabRotation', { periodInMinutes: intervalInSeconds / 60 });
  });
}

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

function updateStatus() {
  chrome.storage.sync.get(['enabled', 'time'], ({ enabled, time }) => {
    updateIcon(enabled);

    if (enabled) {
      const seconds = time || 10;
      scheduleRotation(seconds);
    } else {
      chrome.alarms.clearAll();
    }
  });
}

// Alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tabRotation') {
    rotateTabs();
  }
});

// Handle state changes and extension lifecycle
chrome.runtime.onStartup.addListener(updateStatus);
chrome.runtime.onInstalled.addListener(updateStatus);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled || changes.time) {
    updateStatus();
  }
});
