// Load settings when popup opens
chrome.storage.sync.get(["enabled", "time", "refresh", "darkMode"], ({ enabled = false, time = 5, refresh = true, darkMode = false }) => {
  document.getElementById("seconds").value = time;
  document.getElementById("refresh").checked = refresh;
  updateStatus(enabled);
  updateEnableButton(enabled);
  setTheme(darkMode);
});

function updateStatus(enabled) {
  const status = document.getElementById("status");
  status.textContent = enabled ? "Enabled" : "Disabled";
  status.className = `status ${enabled ? "enabled" : "disabled"}`;
}

function updateEnableButton(enabled) {
  const button = document.getElementById("enable");
  button.textContent = enabled ? "Disable" : "Enable";
}

function setTheme(dark) {
  const body = document.getElementById("body");
  body.classList.toggle("dark", dark);
}

// Auto-save when interval is changed
document.getElementById("seconds").addEventListener("input", () => {
  const time = parseInt(document.getElementById("seconds").value, 10) || 5;
  chrome.storage.sync.set({ time }, () => {
    chrome.runtime.sendMessage({ type: "reloadConfig" });
  });
});

// Auto-save when refresh toggle is changed
document.getElementById("refresh").addEventListener("change", (e) => {
  const refresh = e.target.checked;
  chrome.storage.sync.set({ refresh }, () => {
    chrome.runtime.sendMessage({ type: "reloadConfig" });
  });
});

// Toggle enabled/disabled
document.getElementById("enable").addEventListener("click", () => {
  chrome.storage.sync.get(["enabled", "time", "refresh"], ({ enabled = false, time = 5, refresh = true }) => {
    const newEnabled = !enabled;
    chrome.storage.sync.set({ enabled: newEnabled }, () => {
      chrome.runtime.sendMessage({ type: "reloadConfig" });
      updateStatus(newEnabled);
      updateEnableButton(newEnabled);
    });
  });
});

// Toggle dark mode from sun/moon emoji
document.getElementById("themeToggle").addEventListener("click", () => {
  const body = document.getElementById("body");
  const toggle = document.getElementById("themeToggle");
  const isDark = body.classList.toggle("dark");
  toggle.textContent = isDark ? "🌒" : "☀️";
  chrome.storage.sync.set({ darkMode: isDark });
});
