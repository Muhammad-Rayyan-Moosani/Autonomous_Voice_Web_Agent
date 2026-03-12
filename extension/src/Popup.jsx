// Popup.jsx – runs in extension POPUP only. Recording happens here (not in service worker).
import { useState, useEffect } from 'react';
import './styles.css';
import { startRecording, stopRecording, playAudio } from './audio';
import { sendAudioToBackend } from './api';

const LOG = (msg, ...args) => console.log('[VoiceAgent]', msg, ...args);

function Popup() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('Loading…');
    const [pageContext, setPageContext] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [responseText, setResponseText] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        LOG('Popup script loaded');
    }, []);

    useEffect(() => {
        async function fetchContext() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_CONTEXT' });
                    if (response) {
                        setPageContext(response);
                        setStatus('Tap to speak');
                    } else {
                        setStatus('Refresh page');
                    }
                }
            } catch (err) {
                console.error('[VoiceAgent] Could not get page context:', err);
                setStatus('No access to page');
            }
        }
        fetchContext();
    }, []);

    const handleToggleRecord = () => {
        if (isRecording) {
            LOG('Mic button clicked (stop)');
            setIsRecording(false);
            setStatus('Processing…');
            setIsProcessing(true);
            setError(null);
            setTranscript('');
            setResponseText('');
            stopRecording()
                .then((audioBlob) => {
                    LOG('Sending audio to backend, size:', audioBlob?.size);
                    return sendAudioToBackend(audioBlob, pageContext);
                })
                .then(async (response) => {
                    if (response.transcript != null) setTranscript(response.transcript);
                    if (response.response != null) setResponseText(response.response);
                    if (response.audioUrl) await playAudio(response.audioUrl);
                    else if (response.audioData) await playAudio(base64ToBlob(response.audioData));
                    if (response.actions && Array.isArray(response.actions)) {
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        if (tab?.id) {
                            const highlightAction = response.actions.find((a) => a.type === 'highlight');
                            if (highlightAction?.selectors) {
                                chrome.tabs.sendMessage(tab.id, { action: 'HIGHLIGHT', selectors: highlightAction.selectors });
                            }
                        }
                    }
                    setStatus('Done');
                })
                .catch((err) => {
                    console.error('[VoiceAgent] Backend error:', err);
                    setError('Backend not reachable?');
                    setStatus('Error');
                })
                .finally(() => setIsProcessing(false));
            chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
                if (tab?.id) chrome.tabs.sendMessage(tab.id, { action: 'CLEAR_HIGHLIGHTS' });
            });
            return;
        }

        // START RECORDING: nothing before startRecording() so getUserMedia runs in same user gesture.
        LOG('Mic button clicked (start) – calling startRecording() now');
        startRecording()
            .then(() => {
                LOG('startRecording() resolved – setting UI to listening');
                setError(null);
                setStatus('Listening…');
                setIsRecording(true);
                setTranscript('');
                setResponseText('');
            })
            .catch((err) => {
                console.error('[VoiceAgent] Mic error:', err?.name, err?.message, err);
                setStatus('Tap to speak');
                const isDenied = err?.message === 'MIC_DENIED' || err?.name === 'NotAllowedError';
                if (isDenied) {
                    setError('Mic was blocked or dismissed. Click "Request mic in new tab" below, allow there, then try the mic here again.');
                } else if (err?.message === 'MIC_NOT_FOUND') {
                    setError('No microphone found.');
                } else if (err?.message === 'MIC_NOT_SUPPORTED') {
                    setError('Microphone not supported in this browser.');
                } else {
                    setError('Microphone error: ' + (err?.message || err?.name || 'Unknown'));
                }
            });
    };

    const pageTitle = pageContext?.title ? (pageContext.title.length > 28 ? pageContext.title.slice(0, 28) + '…' : pageContext.title) : '—';

    return (
        <div className="popup-extension">
            <header className="popup-header">
                <span className="popup-logo" aria-hidden>◆</span>
                <h1 className="popup-title">Autonomous Voice Agent</h1>
            </header>

            <div className="popup-page">
                <span className="popup-page-label">Page</span>
                <span className="popup-page-title" title={pageContext?.url}>{pageTitle}</span>
            </div>

            <div className="popup-mic-wrap">
                <button
                    className={`popup-mic ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                    onClick={handleToggleRecord}
                    disabled={!pageContext || isProcessing}
                    title={isRecording ? 'Stop recording' : 'Speak'}
                    type="button"
                >
                    {isRecording ? '⏹' : '🎤'}
                </button>
                <span className="popup-mic-hint">{isRecording ? 'Listening…' : 'Tap to speak'}</span>
                <span className="popup-mic-allow">Recording in popup (uses allowed mic)</span>
            </div>

            <div className="popup-status">
                <span className="popup-status-text">{status}</span>
                {error && (
                    <span className="popup-error-wrap">
                        <span className="popup-error">{error}</span>
                        <button
                            type="button"
                            className="popup-settings-btn popup-settings-btn-primary"
                            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') })}
                        >
                            Request mic in new tab
                        </button>
                        <button
                            type="button"
                            className="popup-settings-btn"
                            onClick={() => chrome.tabs.create({ url: 'chrome://settings/content/microphone' })}
                        >
                            Open mic settings
                        </button>
                    </span>
                )}
            </div>

            <div className="popup-transcript">
                <div className="popup-transcript-label">Transcript &amp; Response</div>
                <div className="popup-transcript-body">
                    {!transcript && !responseText && 'Your speech and the response will appear here.'}
                    {transcript && (
                        <p className="popup-transcript-line"><strong>Transcript:</strong> {transcript}</p>
                    )}
                    {responseText && (
                        <p className="popup-transcript-line"><strong>Response:</strong> {responseText}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function base64ToBlob(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: 'audio/wav' });
}

export default Popup;
