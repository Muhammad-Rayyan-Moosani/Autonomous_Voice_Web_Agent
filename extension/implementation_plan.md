# Implementation Plan - Autonomous Voice Web Agent (Frontend)

This plan covers the complete implementation of the Chrome Extension frontend, turning the scaffolded placeholders into a functional voice-activated agent interface.

## User Review Required

> [!IMPORTANT]
> **Backend Communication**: The frontend will allow communicating with `http://localhost:5000`. Ensure the backend is running locally when testing the extension.

> [!NOTE]
> **Permissions**: The extension requests `activeTab`, `scripting`, `storage`, `tabs`, and `all_urls` permissions in `manifest.json`.

## Proposed Changes

### Extension Root (`/extension`)

#### [MODIFY] [manifest.json](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/manifest.json)
- Define Manifest V3 configuration.
- Set `background.service_worker` to `background.js`.
- Set `content_scripts` to run `content.js` on all URLs.
- Define `action` pointing to `index.html`.
- Add permissions: `activeTab`, `scripting`, `storage`, `tabs`.
- Add host permissions: `<all_urls>` (for content script injection) and `http://localhost:5000/*` (for backend API).

#### [MODIFY] [content.js](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/content.js)
- Implement `GET_CONTEXT` message listener:
  - Returns document title, URL, and visible text summary.
- Implement `HIGHLIGHT` message listener:
  - Takes a list of CSS selectors.
  - Applies a visual highlight style (e.g., yellow background, red border) to matching elements.
  - Adds a function to clear highlights.

#### [MODIFY] [background.js](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/background.js)
- Initialize service worker.
- Add listeners for extension installation/updates.
- (Optional) Handle side-panel or persistent state if logic requires it, but primarily acts as an event coordinator.

### Extension Source (`/extension/src`)

#### [MODIFY] [audio.js](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/src/audio.js)
- `startRecording()`: Request microphone access, initialize `MediaRecorder`, collect audio chunks.
- `stopRecording()`: Stop recorder, resolve with `Blob` (audio/webm).
- `playAudio(url)`: Create `Audio` object and play the provided URL/Blob.

#### [MODIFY] [api.js](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/src/api.js)
- `sendAgentRequest(transcript, pageContext, audioBlob)`:
  - Check if `transcript` or `audioBlob` is provided.
  - Construct `FormData`.
  - `POST` to `http://localhost:5000/agent`.
  - Handle JSON response.

#### [MODIFY] [Popup.jsx](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/src/Popup.jsx)
- **State Management**: Manage recording state, processing status, response text, and errors.
- **UI Layout**:
  - **Header**: Extension Title.
  - **Context Indicator**: Shows which page is currently active.
  - **Mic Button**: Large interaction point. Toggles recording.
  - **Transcript Area**: Shows what the user said (if STT returns it or intermediate).
  - **Response Area**: Displays text response from Agent.
- **Logic**:
  - On mount: Query active tab, send `GET_CONTEXT` to `content.js`, store context.
  - On Record: Call `audio.startRecording()`.
  - On Stop: Call `audio.stopRecording()`, combine with context, call `api.sendAgentRequest()`.
  - On Response: Display text, play audio (if any), send `HIGHLIGHT` command to `content.js` with actions.

#### [MODIFY] [App.jsx](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/src/App.jsx)
- Clean up boilerplate.
- Render `Popup` component.

#### [MODIFY] [index.css](file:///Users/mohammadsamin/Desktop/Projects/Autonomous_Voice_Web_Agent/extension/src/index.css)
- Add base styles for the popup (reset, font, background).

## Verification Plan

### Automated Tests
- Run `npm run lint` in `extension/` to verify code quality.

### Manual Verification
1. **Build Extension**: Run `npm run build` in `extension/`.
2. **Load in Chrome**:
   - Go to `chrome://extensions`.
   - Enable Developer Mode.
   - Load Unpacked `extension/dist`.
3. **Test Context Extraction**:
   - Open a webpage (e.g., example.com).
   - Open Popup. Verify it displays "Active on: Example Domain".
4. **Test Recording UI**:
   - Click Mic button. Verify UI changes to "Recording...".
   - Stop recording. Verify UI changes to "Processing...".
5. **Test Backend Connection**:
   - (Since backend not touched, request will likely fail or require local backend).
   - Check Console logs for API request attempt.
