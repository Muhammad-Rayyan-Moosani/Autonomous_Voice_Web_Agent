# Frontend / Extension → Backend Endpoints (Voice-only)

Base URL: **`http://localhost:5000`**

The extension UI is **voice-only**: one mic button and a transcript area. The frontend calls one backend route to **send** audio and gets back the **transcript and optional TTS audio** in the same response (or your backend can expose a second endpoint for fetching audio).

---

## 1. Sending audio: frontend → backend

**Endpoint:** `POST /agent`

**Used by:** Extension popup when the user stops recording (mic button).

**Purpose:** Send the user’s **recorded audio** and **page context** to the backend.

**Request:**

- **Method:** `POST`
- **Headers:** Browser sets `Content-Type: multipart/form-data` with boundary.
- **Body (FormData):**
  - `audio` — file (e.g. `input.webm`, type `audio/webm`)
  - `pageContext` — JSON string: `{ "title", "url", "summary" }`

**Extension:** `api.sendAudioToBackend(audioBlob, pageContext)` → `POST http://localhost:5000/agent`

---

## 2. Receiving transcript + audio: backend → frontend

**Option A (recommended): same response**  
The **response** of `POST /agent` returns JSON that includes the transcript and optional audio:

**Response (example):**

- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "transcript": "User's speech-to-text result",
    "response": "AI reply text (or same as transcript)",
    "audioUrl": "http://localhost:5000/audio/abc123",
    "audioData": null,
    "actions": [{ "type": "highlight", "selectors": ["..."] }]
  }
  ```

- **`transcript`** — Shown in the popup “Transcription” area (STT result and/or AI text).
- **`response`** — Also shown in the transcript area if different from `transcript`.
- **`audioUrl`** — Frontend plays this URL (e.g. TTS file served by backend).
- **`audioData`** — Optional base64 audio string; frontend can decode and play if you don’t use `audioUrl`.
- **`actions`** — Optional (e.g. highlight elements on the page).

**Option B: separate “get audio” endpoint**  
If you prefer two endpoints:

1. **Send audio:** `POST /agent` as above; response includes at least `transcript` and optionally an `audioId` or `audioUrl`.
2. **Get audio:** e.g. `GET /audio/:id` or `GET /audio?url=...` returning the TTS audio file. Frontend would call this with the ID/URL from step 1 and then play the result.

The current frontend expects **Option A** (transcript + `audioUrl` or `audioData` in the `POST /agent` response). If you implement Option B, you can add a small change in the popup to fetch and play from the second endpoint.

---

## Summary

| Direction              | Endpoint    | Method | Purpose                                      |
|------------------------|------------|--------|----------------------------------------------|
| Frontend → Backend     | `/agent`   | POST   | Send audio + page context (FormData)         |
| Backend → Frontend     | (response)| —      | Same response: transcript, audioUrl/audioData|

**Extension usage:**  
- **Sending audio:** `extension/src/api.js` → `sendAudioToBackend(audioBlob, pageContext)` → `POST /agent`.  
- **Receiving:** Popup reads `transcript` / `response` from the JSON and shows them in the “Transcription” area; it plays `audioUrl` or decodes `audioData` for playback.

Ensure the backend is running and the extension has `host_permissions` for `http://localhost:5000/*` (set in `manifest.json`).
