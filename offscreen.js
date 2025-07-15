let audio;

// Announce readiness to the background script
chrome.runtime.sendMessage({ type: 'offscreen_ready' });

// Listener for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return;
  }
  switch (message.type) {
    case 'playAudio':
      playAudio(message.data.url);
      sendResponse(true); // Acknowledge the message
      break;
    case 'stopAudio':
      stopAudio();
      sendResponse(true); // Acknowledge the message
      break;
  }
  return true; // Keep message channel open for async response
});

function playAudio(url) {
  if (audio) {
    stopAudio(); // Stop any currently playing audio
  }
  audio = new Audio(url);
  audio.play().catch(e => { /* console.error("Offscreen: audio.play() failed:", e) */ });

  audio.onended = () => {
    stopAudio(); // Clean up
    // Inform background to close the offscreen document
    chrome.runtime.sendMessage({ type: 'audioPlaybackComplete' });
  };
   audio.onerror = (e) => {
        // console.error("Error playing audio in offscreen:", e);
        stopAudio();
        chrome.runtime.sendMessage({ type: 'audioPlaybackComplete' }); // still close the doc
    }
}

function stopAudio() {
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.src = ''; // Detach the source
    audio = null;
  }
} 