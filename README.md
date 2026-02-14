# Voice Autonomous Web Agent

An **AI-powered browser agent** that combines a Chrome Extension with a Flask backend to process voice commands in the context of the current webpage—capturing speech, extracting DOM context, calling an AI planner, and optionally highlighting elements or playing text-to-speech responses.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Development](#development)
- [Loading the Extension](#loading-the-extension)
- [API Contract (Planned)](#api-contract-planned)
- [Future Implementation Notes](#future-implementation-notes)
- [License](#license)

---

## Overview

This project is a **Chrome Extension + Flask backend** that:

| Step | Component | Description |
|------|-----------|-------------|
| 1 | Extension | Captures user voice input (microphone) |
| 2 | Content script | Extracts webpage DOM context (title, URL, structure) |
| 3 | Extension → Backend | Sends transcript + page context to Flask |
| 4 | Flask | Forwards data to an AI planner |
| 5 | AI planner | Returns structured intent + response (JSON) |
| 6 | Extension | Optionally highlights elements on the page |
| 7 | Backend | Returns text-to-speech audio |
| 8 | Extension | Plays the response to the user |

The extension and backend are currently **scaffolded with placeholders** so that Flask runs, React builds, and the extension loads in Chrome. Full logic (STT, LLM, TTS, highlighting) is left for later implementation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐ │
│  │   Popup     │◄──►│  background  │◄──►│    content.js       │ │
│  │ (React UI)  │    │  (service    │    │ (page context,      │ │
│  │ mic, response│   │   worker)    │    │  highlight/click)   │ │
│  └──────┬──────┘    └──────┬───────┘    └─────────────────────┘ │
│         │                  │                                      │
└─────────┼──────────────────┼──────────────────────────────────────┘
          │                  │
          │   HTTP (fetch)    │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Flask Backend                                │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐ │
│  │   app.py    │───►│   planner    │───►│  services/          │ │
│  │ POST /agent │    │ (intent +    │    │  llm, stt, tts      │ │
│  │ CORS        │    │  response)   │    │                     │ │
│  └─────────────┘    └──────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

- **Popup**: React UI (title, microphone button, response area). Talks to `background.js` via `chrome.runtime` messaging.
- **Background**: Service worker that coordinates popup ↔ content script and can proxy requests to the Flask backend.
- **Content script**: Injected into every tab; extracts page context and performs DOM actions (highlight, click).
- **Flask**: Single entry point `POST /agent`; receives `{ transcript, pageContext }`, returns structured JSON (and later TTS audio).

---

## Project Structure

### Extension (`/extension`)

| Path | Purpose |
|------|--------|
| `manifest.json` | Manifest V3; permissions: `activeTab`, `scripting`, `storage`, `tabs`, `<all_urls>`; background service worker; content script; popup = `index.html`. |
| `background.js` | Message coordinator between popup, content script, and (optionally) Flask. Placeholder listener only. |
| `content.js` | Runs in webpage context. Placeholder: `getPageContext()`, `highlightElements()`, `clearHighlights()`, and message listener. |
| `index.html` | Root HTML for React popup; mounts `#root` and loads `src/main.jsx`. |
| `package.json` | React 19, Vite; scripts: `dev`, `build`, `lint`, `preview`. |
| `vite.config.js` | Vite + React plugin; build output for extension. |
| `src/main.jsx` | React entry point; mounts popup UI. |
| `src/Popup.jsx` | Main UI: title, microphone button, response area. No logic yet. |
| `src/api.js` | Placeholder for communication with Flask backend (e.g. `POST /agent`). |
| `src/audio.js` | Placeholder for mic recording and TTS playback. |
| `src/messaging.js` | Placeholder for `chrome.runtime.sendMessage` / `onMessage` helpers. |
| `src/styles.css` | Popup styling. |
| `dist/` | Vite build output (load this folder in Chrome as unpacked extension). |

### Backend (`/backend`)

| Path | Purpose |
|------|--------|
| `app.py` | Flask app; CORS enabled; placeholder `POST /agent` route returning dummy JSON. |
| `requirements.txt` | Dependencies (e.g. `flask`, `flask-cors`, `requests`, `python-dotenv`). |
| `agent/planner.py` | Placeholder `plan(transcript, page_context)` returning `{}`. Main decision logic will live here. |
| `agent/prompts.py` | Placeholder for system prompts. |
| `services/llm.py` | Placeholder for AI/LLM API calls. |
| `services/speech_to_text.py` | Placeholder for STT (audio → text). |
| `services/text_to_speech.py` | Placeholder for TTS (text → audio). |

---

## Data Flow

1. **User speaks** → Popup captures audio (future: `audio.js`).
2. **Popup** → Asks background for page context → **Background** → Sends message to **content script** → Content returns `getPageContext()` (title, URL, etc.).
3. **Popup** (or background) → `POST /agent` with `{ transcript, pageContext }` (transcript from STT when implemented).
4. **Flask** → Calls `plan(transcript, page_context)` → Returns JSON `{ intent?, response?, actions?, audioUrl? }`.
5. **Extension** → If `actions` contain selectors, content script highlights elements; if `response` or TTS URL present, popup shows text and/or plays audio.

*(Steps 1–5 are partially or fully placeholder; the above describes the intended flow.)*

---

## Tech Stack

- **Extension:** React 19, Vite 8, Chrome Extension APIs (Manifest V3, `chrome.runtime`, `chrome.tabs`, `chrome.scripting`).
- **Backend:** Python 3, Flask, Flask-CORS, `requests`, `python-dotenv`.
- **Planned:** LLM API for planner, STT service, TTS service (no external APIs implemented yet).

---

## Prerequisites

- **Node.js** (v18+ recommended) and **npm**
- **Python** 3.10+
- **Chrome** (or Chromium) for loading the unpacked extension

---

## Setup

### 1. Extension

```bash
cd extension
npm install
npm run build
```

The built extension lives in `extension/dist/` (or the path configured in `vite.config.js` for extension build).

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Ensure `requirements.txt` includes at least: `flask`, `flask-cors`, `requests`, `python-dotenv`.

---

## Development

### Run Flask

```bash
cd backend
source venv/bin/activate
flask run
# or: python app.py
```

By default Flask runs at `http://127.0.0.1:5000`. The extension will call this origin for `POST /agent`; keep CORS enabled in `app.py`.

### Build / watch the extension

```bash
cd extension
npm run build
# or, if you use a watch mode for extension build:
# npm run dev
```

After changing code, run `npm run build` and click “Reload” for the extension in `chrome://extensions`.

---

## Loading the Extension

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the **`extension/dist`** folder (or the folder that contains the built `manifest.json`).
5. Pin the extension and open its popup to use the UI.

If the popup is blank, ensure the build completed and that `index.html` points to the correct script path (e.g. `/src/main.jsx` for dev or the built JS for production).

---

## API Contract (Planned)

### `POST /agent`

**Request body:**

```json
{
  "transcript": "string",
  "pageContext": {
    "title": "string",
    "url": "string"
  }
}
```

**Response (placeholder / planned):**

```json
{
  "intent": "string",
  "response": "string",
  "actions": [{ "type": "highlight", "selectors": ["string"] }],
  "audioUrl": "string (optional)"
}
```

The extension will use `response` for display, `actions` for content script (e.g. highlight), and `audioUrl` or inline audio for TTS playback when implemented.

---

## Future Implementation Notes

- **STT:** In `backend/services/speech_to_text.py`, accept audio (e.g. base64 or multipart), call a speech-to-text API, return transcript. Extension sends recorded audio in `POST /agent` or a dedicated `/stt` endpoint.
- **LLM:** In `backend/services/llm.py`, call your chosen LLM API with system prompt from `agent/prompts.py` and user message = transcript + page context; parse response into intent and actions in `agent/planner.py`.
- **TTS:** In `backend/services/text_to_speech.py`, convert planner response text to audio; return URL or stream. Extension fetches and plays in `audio.js`.
- **Content script:** Implement real DOM extraction (main text, links, buttons) in `getPageContext()` and persist selectors in planner output so `highlightElements(selectors)` can highlight or interact.
- **Security:** Use environment variables (e.g. `.env` with `python-dotenv`) for API keys; never commit secrets. Restrict CORS to your extension origin in production.

---

## License

MIT (or specify your license).
