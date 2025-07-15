// Saves options to chrome.storage
const saveOptions = () => {
  const apiKey = document.getElementById('apiKey').value;
  const ttsEngine = document.getElementById('ttsEngine').value;

  chrome.storage.sync.set(
    { apiKey: apiKey, ttsEngine: ttsEngine },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

// Restores input box state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  // We still need to get darkMode to style the page, but we don't control the setting here.
  chrome.storage.sync.get({ apiKey: '', darkMode: false, ttsEngine: 'system' }, (items) => {
    document.getElementById('apiKey').value = items.apiKey;
    document.getElementById('ttsEngine').value = items.ttsEngine;
    if (items.darkMode) {
      document.body.classList.add('dark-mode');
    }
  });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions); 