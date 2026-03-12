

// main.jsx – popup entry (runs in popup document, NOT in service worker)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (typeof window !== 'undefined') {
  console.log('[VoiceAgent] Popup bundle loaded, root element:', !!document.getElementById('root'))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
