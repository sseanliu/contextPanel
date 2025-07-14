# Contextual Word Explainer

A Chrome extension that provides contextual explanations for selected text using OpenAI's GPT models. It helps you understand complex terms and concepts without leaving the page you're reading.

## Features

- **Contextual Explanations:** Select any word or phrase on a webpage to get a detailed, AI-powered explanation in a clean, floating panel.
- **Text-to-Speech (TTS):** Hear the selected text spoken aloud, with the option to toggle this feature on or off.
- **Dark Mode:** A comfortable viewing experience that can be toggled on or off from the extension popup.
- **Configurable Settings:**
    - Enable/disable Dark Mode.
    - Enable/disable Text-to-Speech.
    - Set your own OpenAI API key.
- **Smart Context Gathering:** The extension intelligently grabs the surrounding text (like the whole article or section) to provide the AI with better context for more accurate explanations.
- **YouTube Blacklist:** Text-to-speech is automatically disabled on youtube.com to avoid interfering with video playback.

## Installation

To install this extension from the source code, follow these steps:

1.  **Download the code:**
    - Clone this repository: `git clone <repository-url>`
    - Or, download the repository as a ZIP file and unzip it.

2.  **Load the extension in Chrome:**
    - Open Google Chrome and navigate to `chrome://extensions`.
    - Enable **Developer mode** using the toggle switch in the top-right corner.
    - Click the **Load unpacked** button that appears.
    - Select the directory where you cloned or unzipped the code.

The extension should now be installed and visible in your Chrome extensions list.

## How to Use

1.  **Set Your API Key:**
    - After installation, click the extension icon in your Chrome toolbar.
    - Click the **API Key Settings** link in the popup.
    - This will open the settings page. Enter your OpenAI API key and click **Save**. This is a one-time setup.

2.  **Get Explanations:**
    - Navigate to any webpage and select a word or phrase you want to understand better.
    - The explainer panel will automatically appear with the explanation.

3.  **Toggle Features:**
    - Click the extension icon in the toolbar at any time to open the popup.
    - From the popup, you can instantly toggle **Dark Mode** and **Speak Selection (TTS)**. Your preferences are saved automatically.

4.  **Close the Panel:**
    - To dismiss the explainer panel, simply click anywhere outside of it or press the `Escape` key.
    - If TTS is active, closing the panel will also stop the audio. 