🎙️ Autonomous Voice Web Agent

Talk to a webpage like you'd talk to a person — no clicking, no typing.

A Chrome extension that listens to your voice, understands what you want, and controls the page for you: scrolling, clicking, filling forms, navigating.


Status: 🟢 Frontend working · 🟡 Backend in progress
The extension captures voice, reads the page, and sends both to a Flask backend — that backend's AI pipeline (speech-to-text → LLM → action) is the part currently being built out. See What's Built below.




💡 Why

Browsing the web assumes two free hands and full attention on a screen. That breaks down constantly — for people with motor impairments, for anyone whose hands are busy, or just anyone who'd rather say "scroll down" than reach for a mouse. This project removes that assumption: control a browser the same way you'd ask a person sitting next to you.

🧠 How it works

🎤 You speak
   │
   ▼
Chrome Extension (popup)
   ├─ records audio (MediaRecorder)
   └─ reads the current page (title, URL, visible text)
   │
   ▼  POST /agent  (audio + page context)
Flask Backend
   ├─ speech-to-text
   ├─ LLM reasoning → structured JSON action plan
   └─ text-to-speech (spoken response)
   │
   ▼
Extension executes the action on the page
   (click, scroll, fill, highlight, navigate)

✅ What's Built vs 🚧 What's Next

Built and working:


Chrome Extension (Manifest V3) with a React popup UI
Live microphone recording and playback (audio.js)
Page-context extraction — title, URL, visible text (content.js)
Element highlighting via CSS selectors, for showing the agent "sees" the right thing
Full request pipeline from popup → backend (api.js) — sends audio + page context as multipart/form-data


In progress:


The /agent backend endpoint that actually ties it together (currently only a /test echo endpoint exists)
Speech-to-text integration
LLM prompt → structured action-plan generation
Text-to-speech for spoken responses


The hardest part of a voice interface isn't any single step — it's making the whole loop feel instant. The frontend was built first and validated end-to-end (recording, context capture, message passing) so the backend can be dropped in without guessing whether the plumbing works.

🛠️ Tech Stack

LayerTechExtensionChrome Manifest V3, React 19, ViteBackendFlask, Flask-CORSAudioBrowser MediaRecorder APIPlannedLLM for intent parsing, STT/TTS services

🚀 Running it locally

1. Backend

bashcd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

Runs on http://localhost:5000.

2. Extension

bashcd extension
npm install
npm run build

Then in Chrome:


Go to chrome://extensions
Enable Developer mode (top right)
Click Load unpacked → select the extension/dist folder
Pin the extension, click the icon, and hit 🎤 Speak


📁 Project Structure

Autonomous_Voice_Web_Agent/
├── backend/
│   ├── app.py              # Flask server & routes
│   ├── AI-Service.py       # LLM wrapper (planned)
│   ├── prompt_builder.py   # Prompt construction (planned)
│   ├── speech_to_text.py   # STT (planned)
│   ├── text_to_speech.py   # TTS (planned)
│   └── requirements.txt
└── extension/
    ├── src/
    │   ├── Popup.jsx        # Main UI — recording states, status
    │   ├── audio.js         # Mic recording & playback
    │   ├── api.js            # Backend communication
    │   └── messaging.js      # Chrome message passing (planned)
    ├── background.js         # Service worker
    ├── content.js             # Runs on every page — context + highlighting
    └── manifest.json

🗺️ Roadmap


 Wire up /agent endpoint end-to-end
 Integrate speech-to-text
 LLM prompt design for reliable action-plan JSON
 Text-to-speech responses
 Streaming audio instead of record-then-send, to cut latency
 Handle ambiguous commands with clarifying questions
