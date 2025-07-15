let abortController = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getExplanation') {
    if (abortController) {
      // If there's a previous request, abort it
      abortController.abort();
    }
    // Create a new AbortController for the new request
    abortController = new AbortController();
    const signal = abortController.signal;

    chrome.storage.sync.get('apiKey', ({ apiKey }) => {
      if (!apiKey) {
        sendResponse({ error: 'API key not found. Please set it in the options page.' });
        return;
      }

      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'user',
              content: `我不是很理解该段，请用中文更加通俗易懂地来详细解释: ${request.selection}。
并且请基于上下文来解释
言简意赅，100字以内。

请按照以下顺序和格式，用Markdown直接输出，不要包含在代码块中：

**中文直译：** \n
(显示${request.selection}的中文翻译结果，如果所选区域仅是一个单词的话，带上它在这里的词性，例如“在这里作动词”)；
**解释：** \n
对${request.selection}的原意进行解释，不考虑上下文；
**在该上下文中，** \n
${request.selection}是指...

以下是上下文：${request.context}`
            }
          ],
          max_tokens: 250
        }),
        signal: signal // Pass the signal to the fetch request
      })
      .then(response => response.json())
      .then(data => {
        if (data.choices && data.choices.length > 0) {
          sendResponse({ explanation: data.choices[0].message.content.trim() });
        } else {
          sendResponse({ error: 'Failed to get explanation.', details: data.error ? data.error.message : data });
        }
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          // console.log('Fetch request aborted.');
          // Don't send a response because the request was cancelled.
        } else {
          sendResponse({ error: 'Failed to get explanation.', details: error });
        }
      });
    });
    
    return true; // Indicates that the response is sent asynchronously
  } else if (request.type === 'speakText') {
    chrome.storage.sync.get({ ttsEngine: 'system', apiKey: '' }, (items) => {
      if (items.ttsEngine === 'openai') {
        speakWithOpenAI(request.selection, items.apiKey);
      } else {
        chrome.tts.stop(); // Stop any previous speech
        chrome.tts.speak(request.selection, { 'rate': 1.0 });
      }
    });
    return false; // No response needed
  } else if (request.type === 'stopTTS') {
    chrome.tts.stop();
    if (abortAudioController) {
      abortAudioController.abort();
    }
    // Also stop any offscreen audio and clear storage
    chrome.storage.session.remove('tts_audio_data');
    chrome.runtime.sendMessage({ type: 'stopAudio', target: 'offscreen' }, (response) => {
        if (chrome.runtime.lastError) {
            // This error is expected if no offscreen document is active. It's safe to ignore.
        }
    });
    return false;
  } else if (request.type === 'audioPlaybackComplete') {
    // console.log("Background script: audio playback complete, closing offscreen doc.");
    closeOffscreenDocument();
  } else if (request.type === 'offscreen_ready') {
    (async () => {
      if (audioBlobToPlay) {
        // console.log("Background script: Offscreen is ready, converting blob and sending audio to play.");
        const audioDataUrl = await blobToBase64(audioBlobToPlay);
        chrome.runtime.sendMessage({
          type: 'playAudio',
          target: 'offscreen',
          data: { url: audioDataUrl },
        }, (response) => {
          if (chrome.runtime.lastError) {
            // console.error('Error sending audio to offscreen document:', chrome.runtime.lastError.message);
          } else {
            // console.log("Offscreen document acknowledged 'playAudio' message.");
          }
        });
        audioBlobToPlay = null;
      }
    })();
  }
});

let abortAudioController = null;
let creating; // A global promise to avoid race conditions
let closing; // A global promise to avoid race conditions
let audioBlobToPlay = null;

async function setupOffscreenDocument(path) {
  // Check if we have an existing offscreen document.
  const offscreenUrl = chrome.runtime.getURL(path);
  // console.log("Checking for existing offscreen document at:", offscreenUrl);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    if (audioBlobToPlay) {
      // The document exists, so it's ready to receive a message.
      // console.log("Background script: Offscreen exists, converting blob and sending audio to play.");
      const audioDataUrl = await blobToBase64(audioBlobToPlay);
      chrome.runtime.sendMessage({
        type: 'playAudio',
        target: 'offscreen',
        data: { url: audioDataUrl },
      }, (response) => {
         if (chrome.runtime.lastError) {
          // console.error('Error sending audio to existing offscreen document:', chrome.runtime.lastError.message);
        } else {
          // console.log("Existing offscreen document acknowledged 'playAudio' message.");
        }
      });
      audioBlobToPlay = null;
    }
    return;
  }

  // create offscreen document
  if (creating) {
    // console.log("Offscreen document creation is already in progress. Waiting...");
    await creating;
  } else {
    // console.log("Creating new offscreen document...");
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Playback of TTS audio from OpenAI',
    });
    await creating;
    creating = null; // Reset the promise
    // console.log("Offscreen document created successfully.");
  }
}

async function closeOffscreenDocument() {
  if (closing) {
    await closing;
    return;
  }
  const p = new Promise(async (resolve) => {
    // console.log("Attempting to close offscreen document.");
    const offscreenUrl = chrome.runtime.getURL('offscreen.html');
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
      // console.log("Found active offscreen document. Closing now.");
      await chrome.offscreen.closeDocument();
    } else {
      // console.log("No active offscreen document found to close.");
    }
    resolve();
  });
  
  closing = p;
  await closing;
  closing = null;
}

// A helper function to convert a blob to a base64 data URL
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      resolve(reader.result);
    };
    reader.onerror = function (error) {
      reject('Error converting blob to base64: ' + error);
    };
    reader.readAsDataURL(blob);
  });
}


async function playAudioOffscreen(blob) {
  audioBlobToPlay = blob;
  await setupOffscreenDocument('offscreen.html');
}

function speakWithOpenAI(text, apiKey) {
  if (abortAudioController) {
    abortAudioController.abort();
  }
  abortAudioController = new AbortController();
  const signal = abortAudioController.signal;

  chrome.tts.stop(); // stop system tts if it is running

  // console.log("Attempting to get TTS from OpenAI with model: gpt-4o-mini-tts");

  fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      input: text,
      voice: 'ash',
      speed: 1.75
    }),
    signal: signal
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errorBody => {
        // console.error('OpenAI API Error response:', errorBody);
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      });
    }
    // console.log("TTS audio stream received from OpenAI.");
    return response.blob();
  })
  .then(blob => {
    playAudioOffscreen(blob);
  })
  .catch(error => {
    if (error.name === 'AbortError') {
      // console.log('OpenAI TTS request aborted.');
    } else {
      // console.error('Error with OpenAI TTS request:', error);
    }
  });
} 