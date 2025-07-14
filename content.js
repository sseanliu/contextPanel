let explainerDiv;
let latestRequestId = 0;

function hideExplainer() {
  if (explainerDiv) {
    explainerDiv.remove();
    explainerDiv = null;
    chrome.runtime.sendMessage({ type: 'stopTTS' });
  }
}

document.addEventListener('mouseup', (event) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    // To avoid triggering on clicks inside the explainer
    if (explainerDiv && explainerDiv.contains(event.target)) {
      return;
    }

    // Remove existing explainer if it exists
    hideExplainer();

    latestRequestId++;
    const currentRequestId = latestRequestId;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const context = getContext(range);

    // console.log("Context for explanation:", context);

    chrome.storage.sync.get({ darkMode: false, speakSelection: false }, (items) => {
      const isYouTube = window.location.hostname.includes('youtube.com');
      if (items.speakSelection && !isYouTube) {
        chrome.runtime.sendMessage({ type: 'speakText', selection: selectedText });
      }
      showExplainer(rect, selectedText, context, currentRequestId, items.darkMode);
    });
  }
});

function getContext(range) {
    let element = range.commonAncestorContainer;
    if (element.nodeType === 3) { // Text node
        element = element.parentElement;
    }

    if (!element) {
        return document.body.innerText || document.body.textContent;
    }
    
    // Try to find a semantic container for the article content
    const articleContainer = element.closest('article, main, section');
    if (articleContainer) {
        return articleContainer.innerText || articleContainer.textContent;
    }

    // If no semantic container, use the parent element's parent, but not the body
    const parentContainer = element.parentElement;
    if (parentContainer && parentContainer !== document.body) {
        return parentContainer.innerText || parentContainer.textContent;
    }

    // Fallback to the element itself if it's a direct child of the body
    return element.innerText || element.textContent;
}

function adjustPanelPosition(panel) {
  if (!panel) return;

  const panelRect = panel.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 15;

  let left = panelRect.left;
  let top = panelRect.top;

  // Adjust horizontal position
  if (left + panelRect.width > viewportWidth - margin) {
    left = viewportWidth - panelRect.width - margin;
  }
  if (left < margin) {
    left = margin;
  }

  // Adjust vertical position
  if (top + panelRect.height > viewportHeight - margin) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const selectionRect = selection.getRangeAt(0).getBoundingClientRect();
      const topAbove = selectionRect.top - panelRect.height - 10;
      if (topAbove > 0) { // Check if it fits above
        top = topAbove;
      }
    }
  }
  
  panel.style.left = `${left + window.scrollX}px`;
  panel.style.top = `${top + window.scrollY}px`;
}


function showExplainer(rect, selectedText, context, currentRequestId, isDarkMode) {
  explainerDiv = document.createElement('div');
  explainerDiv.id = 'explainer-container';
  if (isDarkMode) {
    explainerDiv.classList.add('dark-mode');
  }
  
  explainerDiv.innerHTML = `
    <div class="explainer-content">
      Loading...
    </div>
  `;

  document.body.appendChild(explainerDiv);

  // Position the div
  explainerDiv.style.top = `${window.scrollY + rect.bottom + 5}px`;
  explainerDiv.style.left = `${window.scrollX + rect.left}px`;
  
  adjustPanelPosition(explainerDiv);

  // Get explanation from background script
  chrome.runtime.sendMessage({
    type: 'getExplanation',
    selection: selectedText,
    context: context,
  }, (response) => {
    if (currentRequestId !== latestRequestId) {
      return; // This is a stale request, so ignore it.
    }

    if (response) {
      if (response.explanation) {
        // Check if the explainer was closed while we were waiting
        if(explainerDiv) {
          explainerDiv.querySelector('.explainer-content').innerHTML = marked.parse(response.explanation);
          adjustPanelPosition(explainerDiv);
        }
      } else if (response.error) {
        if(explainerDiv) {
          explainerDiv.querySelector('.explainer-content').innerText = `${response.error}\n${response.details ? JSON.stringify(response.details) : ''}`;
        }
      }
    } else {
      if(explainerDiv) {
        explainerDiv.querySelector('.explainer-content').innerText = 'Sorry, could not get an explanation. Empty response.';
      }
    }
  });
}

// Remove explainer on escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        hideExplainer();
    }
});

// Remove explainer on click outside
document.addEventListener('click', (event) => {
    if (explainerDiv && !explainerDiv.contains(event.target) && window.getSelection().toString().trim().length === 0) {
        hideExplainer();
    }
}); 