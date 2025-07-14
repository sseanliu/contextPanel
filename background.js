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
(显示${request.selection}的中文翻译结果，如果是一个单词的话，带上它在这里的词性，例如“在这里作动词”)；
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
          console.log('Fetch request aborted.');
          // Don't send a response because the request was cancelled.
        } else {
          sendResponse({ error: 'Failed to get explanation.', details: error });
        }
      });
    });
    
    return true; // Indicates that the response is sent asynchronously
  } else if (request.type === 'speakText') {
    chrome.tts.stop(); // Stop any previous speech
    chrome.tts.speak(request.selection, { 'rate': 1.0 });
    return false; // No response needed
  } else if (request.type === 'stopTTS') {
    chrome.tts.stop();
    return false;
  }
}); 