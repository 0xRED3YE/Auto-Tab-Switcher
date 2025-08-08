const toggleBtn = document.getElementById('toggleEnable');
const statusDiv = document.getElementById('status');
const timeInput = document.getElementById('time');
const saveBtn = document.getElementById('save');

function updateStatusDisplay(isEnabled) {
  if (isEnabled) {
    statusDiv.textContent = 'Enabled';
    statusDiv.className = 'enabled';
    toggleBtn.textContent = 'Disable';
  } else {
    statusDiv.textContent = 'Disabled';
    statusDiv.className = 'disabled';
    toggleBtn.textContent = 'Enable';
  }
}

// Load saved settings
chrome.storage.sync.get(['enabled', 'time'], function(data) {
  updateStatusDisplay(data.enabled ?? false);
  timeInput.value = data.time || 10;
});

// Toggle enable state
toggleBtn.addEventListener('click', function() {
  chrome.storage.sync.get('enabled', function(data) {
    const newState = !data.enabled;
    chrome.storage.sync.set({ enabled: newState }, function() {
      updateStatusDisplay(newState);
    });
  });
});

// Save time setting
saveBtn.addEventListener('click', function() {
  const time = parseInt(timeInput.value, 10);
  if (!isNaN(time) && time > 0) {
    chrome.storage.sync.set({ time: time });
  }
});
