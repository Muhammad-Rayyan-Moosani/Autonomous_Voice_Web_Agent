// offscreen.js – runs in offscreen document for stable microphone access
let mediaRecorder = null;
let audioChunks = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target !== 'offscreen') return;

  if (msg.action === 'start') {
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          blob.arrayBuffer().then((ab) => {
            chrome.runtime.sendMessage({ type: 'AUDIO_READY', audio: ab });
          });
          mediaRecorder = null;
        };
        mediaRecorder.start(100);
        sendResponse({ ok: true });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.name || 'MIC_DENIED' });
      });
    return true;
  }

  if (msg.action === 'stop' && mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    sendResponse({ ok: true });
  } else {
    sendResponse({ ok: false });
  }
  return true;
});
