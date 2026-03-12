# How to build and load the extension

## One-time setup

1. Install dependencies (from the `extension` folder):
   ```bash
   npm install
   ```

## Every time you change code

1. From the **extension** folder, run:
   ```bash
   npm run build
   ```
   This will:
   - Build the popup (React) into `dist/index.html` and `dist/assets/`
   - Copy `manifest.json`, `background.js`, `content.js`, `offscreen.html`, `offscreen.js`, and `mic-permission.html` into `dist/`

2. In Chrome: open **Extensions** → **Manage Extensions** → find **Autonomous Voice Web Agent** → click **Reload** (or load it the first time, see below).

## First-time load in Chrome

1. Run `npm run build` from the `extension` folder.
2. In Chrome go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the **`dist`** folder (the one *inside* your project: `extension/dist`), then **Select Folder**.
6. The extension should appear. Click its icon to open the popup.

## Important

- **Always load the extension from the `dist` folder**, not from the `extension` folder. The popup and all assets are built into `dist`.
- After any code change, run `npm run build` again, then click **Reload** on the extension in `chrome://extensions`. You must reload the extension for changes to take effect.

**Debugging the popup:** Right‑click the extension popup (the small window) → **Inspect**. In the DevTools **Console** you should see `[VoiceAgent]` logs when the popup loads and when you press the mic (e.g. "Mic button clicked (start)", "getUserMedia called", "Stream received", "MediaRecorder started"). If you see an error there, that is the cause of the mic failing.
- You do **not** need to run `cp` manually; `npm run build` copies everything into `dist`.

## If the mic is blocked in the popup

1. In the popup, click **"Request mic in new tab"** (when you see the mic-blocked error).
2. A new tab opens. Click **"Allow microphone"** in that tab.
3. When the browser asks for permission, choose **Allow**.
4. Close that tab, then open the extension popup again and tap the mic. It should work.
