import { sendAudioWithContext } from "./sender.js";
import { playAudioFromBase64 } from "./receiver.js";

const { useState } = React;

// Store these outside the component to preserve the exact logic from popup.js
let mediaRecorder;
let chunks = [];
let stream = null;

function VoiceAgentApp() {
  const [status, setStatus] = useState('idle'); // idle, recording, processing
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);

  // Get mic permission first - exact logic from popup.js
  const requestPermission = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setError(null);
      console.log("Mic permission granted");
    } catch (err) {
      setError("Microphone permission denied");
      console.error("Mic permission denied:", err);
    }
  };

  // Start recording - exact logic from popup.js
  const startRecording = () => {
    if (!stream) {
      console.log("Please allow mic first");
      setError("Please allow microphone access first");
      return;
    }

    chunks = [];
    setError(null);

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm"
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.start();
    setStatus('recording');
    console.log("Recording started");
  };

  // Stop recording - exact logic from popup.js
  const stopRecording = () => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      console.log("Not recording");
      return;
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      console.log("Recording stopped, size:", blob.size);

      setStatus('processing');

      try {
        const result = await sendAudioWithContext(blob);
        console.log("Backend result:", result);
        playAudioFromBase64(result.audioData);
        setStatus('idle');
      } catch (err) {
        console.error("Send failed:", err);
        setError("Failed to process audio");
        setStatus('idle');
      }
    };

    mediaRecorder.stop();
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="pulse-animation">
          <div className="pulse-ring"></div>
          <div className="pulse-ring"></div>
          <div className="mic-icon">
            {status === 'recording' ? '🎙️' : status === 'processing' ? '⚙️' : '🎤'}
          </div>
        </div>

        <h1 className="title">Voice Agent</h1>
        <p className="subtitle">Your AI-powered voice assistant</p>

        <div className={`status-badge ${status}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {status === 'idle' && 'Ready'}
            {status === 'recording' && 'Recording'}
            {status === 'processing' && 'Processing'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      <div className="controls">
        {!hasPermission ? (
          <button
            className="btn btn-permission"
            onClick={requestPermission}
          >
            <div className="btn-content">
              <span className="btn-icon">🔓</span>
              <span className="btn-text">Enable Microphone</span>
            </div>
          </button>
        ) : (
          <>
            {status !== 'recording' ? (
              <button
                className="btn btn-start"
                onClick={startRecording}
                disabled={status === 'processing'}
              >
                <div className="btn-content">
                  <span className="btn-icon">▶️</span>
                  <span className="btn-text">Start Recording</span>
                </div>
              </button>
            ) : (
              <button
                className="btn btn-stop"
                onClick={stopRecording}
              >
                <div className="btn-content">
                  <span className="btn-icon">⏹️</span>
                  <span className="btn-text">Stop Recording</span>
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {hasPermission && (
        <div className="info-section">
          <div className="waveform">
            <span className={`wave ${status === 'recording' ? 'active' : ''}`}></span>
            <span className={`wave ${status === 'recording' ? 'active' : ''}`}></span>
            <span className={`wave ${status === 'recording' ? 'active' : ''}`}></span>
            <span className={`wave ${status === 'recording' ? 'active' : ''}`}></span>
            <span className={`wave ${status === 'recording' ? 'active' : ''}`}></span>
          </div>

          <p className="footer-text">
            {status === 'idle' && 'Click to start recording your voice'}
            {status === 'recording' && 'Listening to your voice...'}
            {status === 'processing' && 'Analyzing your request...'}
          </p>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<VoiceAgentApp />);