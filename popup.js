const darkModeToggle = document.getElementById('darkMode');
const speakSelectionToggle = document.getElementById('speakSelection');
const showPanelToggle = document.getElementById('showPanel');
const panelOpacitySlider = document.getElementById('panelOpacity');

// Saves options to chrome.storage
const saveOptions = () => {
  const darkMode = darkModeToggle.checked;
  const speakSelection = speakSelectionToggle.checked;
  const showPanel = showPanelToggle.checked;
  const panelOpacity = panelOpacitySlider.value;

  if(darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  chrome.storage.sync.set(
    { darkMode: darkMode, speakSelection: speakSelection, showPanel: showPanel, panelOpacity: panelOpacity }
  );
};

// Restores checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get({ darkMode: false, speakSelection: false, showPanel: true, panelOpacity: 1 }, (items) => {
    darkModeToggle.checked = items.darkMode;
    speakSelectionToggle.checked = items.speakSelection;
    showPanelToggle.checked = items.showPanel;
    panelOpacitySlider.value = items.panelOpacity;
    
    if (items.darkMode) {
      document.body.classList.add('dark-mode');
    }
  });
};

document.addEventListener('DOMContentLoaded', restoreOptions);
darkModeToggle.addEventListener('change', saveOptions);
speakSelectionToggle.addEventListener('change', saveOptions);
showPanelToggle.addEventListener('change', saveOptions);
panelOpacitySlider.addEventListener('input', saveOptions); 