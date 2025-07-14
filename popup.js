const darkModeToggle = document.getElementById('darkMode');
const speakSelectionToggle = document.getElementById('speakSelection');

// Saves options to chrome.storage
const saveOptions = () => {
  const darkMode = darkModeToggle.checked;
  const speakSelection = speakSelectionToggle.checked;

  if(darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  chrome.storage.sync.set(
    { darkMode: darkMode, speakSelection: speakSelection }
  );
};

// Restores checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get({ darkMode: false, speakSelection: false }, (items) => {
    darkModeToggle.checked = items.darkMode;
    speakSelectionToggle.checked = items.speakSelection;
    
    if (items.darkMode) {
      document.body.classList.add('dark-mode');
    }
  });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
darkModeToggle.addEventListener('change', saveOptions);
speakSelectionToggle.addEventListener('change', saveOptions); 