# Autonomous Voice Web Agent - Extension Walkthrough

The Chrome Extension frontend has been fully implemented. Follow these steps to load and test it.

## 1. Load the Extension in Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the **`extension/dist`** folder (inside your project directory).
    > Note: If you don't see `dist`, ensure `npm run build` ran successfully in the `extension` folder.

## 2. Test the Interface

1.  Calculated **Voice Agent** icon should appear in your toolbar. Pin it for easy access.
2.  Click the icon to open the popup.
3.  **Context Check**: The popup should show "Active on: [Page Title]" at the top.
4.  **Recording**:
    - Click "🎤 Speak".
    - You should see "Recording...".
    - Click "⏹ Stop".
    - The status should change to "Processing...".

## 3. Connect to Backend

The extension is configured to send requests to `http://localhost:5000/agent`.

1.  Ensure your Flask backend is running:
    ```bash
    cd backend
    source venv/bin/activate
    python app.py
    ```
2.  If the backend is not running, the extension will show an error: "Failed to process request. Is backend running?".

## What's Implemented

-   **Manifest V3**: Secure and up-to-date configuration.
-   **Content Script**: functionality to read page titles/summaries and highlight elements (`HIGHLIGHT` action).
-   **Audio Handling**: Browser-native `MediaRecorder` for capturing speech and `Audio` API for playback.
-   **API Client**: Sends audio and page context to your local Flask backend.
-   **Popup UI**: React-based interface with visual feedback for recording and processing states.
