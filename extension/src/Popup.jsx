import { useState, useEffect, useRef } from 'react';
import './styles.css'; // We'll create/update this next
import { startRecording, stopRecording, playAudio } from './audio';
import { sendAgentRequest } from './api';

function Popup() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState("Idle");
    const [pageContext, setPageContext] = useState(null);
    const [responseText, setResponseText] = useState("");
    const [error, setError] = useState(null);

    // On mount, get the active tab's context
    useEffect(() => {
        async function fetchContext() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    // Send message to content script
                    const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_CONTEXT" });
                    if (response) {
                        setPageContext(response);
                        setStatus("Ready");
                    } else {
                        setStatus("Context not found (refresh page?)");
                    }
                }
            } catch (err) {
                console.error("Could not get page context:", err);
                setStatus("Error connecting to page");
            }
        }
        fetchContext();
    }, []);

    const handleToggleRecord = async () => {
        if (isRecording) {
            // STOP Recording
            setIsRecording(false);
            setStatus("Processing...");
            setIsProcessing(true);
            setError(null);

            try {
                const audioBlob = await stopRecording();

                // Send to backend
                const response = await sendAgentRequest(audioBlob, pageContext);

                // Handle Response
                if (response.response) {
                    setResponseText(response.response);
                }

                // Play Audio Response
                if (response.audioUrl) {
                    await playAudio(response.audioUrl);
                } else if (response.audioData) {
                    // If backend returns base64 or similar, handle it here. 
                    // For now assuming URL or none.
                }

                // Handle Actions (Highlighting)
                if (response.actions && Array.isArray(response.actions)) {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab?.id) {
                        const highlightAction = response.actions.find(a => a.type === 'highlight');
                        if (highlightAction && highlightAction.selectors) {
                            chrome.tabs.sendMessage(tab.id, {
                                action: "HIGHLIGHT",
                                selectors: highlightAction.selectors
                            });
                        }
                    }
                }

                setStatus("Finished");
            } catch (err) {
                console.error(err);
                setError("Failed to process request. Is backend running?");
                setStatus("Error");
            } finally {
                setIsProcessing(false);
            }

        } else {
            // START Recording
            try {
                await startRecording();
                setIsRecording(true);
                setStatus("Recording...");
                setResponseText(""); // Clear previous
                // Clear previous highlights
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "CLEAR_HIGHLIGHTS" });
                }
            } catch (err) {
                console.error("Failed to start recording:", err);
                setError("Could not access microphone.");
            }
        }
    };

    return (
        <div className="popup-container">
            <header>
                <h1>Voice Agent</h1>
            </header>

            <div className="context-info">
                {pageContext ? (
                    <p title={pageContext.url}>Active on: <strong>{pageContext.title.substring(0, 30)}...</strong></p>
                ) : (
                    <p className="loading">Loading page context...</p>
                )}
            </div>

            <div className="main-action">
                <button
                    className={`mic-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                    onClick={handleToggleRecord}
                    disabled={!pageContext || isProcessing}
                >
                    {isRecording ? "⏹ Stop" : "🎤 Speak"}
                </button>
            </div>

            <div className="status-area">
                <p>{status}</p>
                {error && <p className="error">{error}</p>}
            </div>

            {responseText && (
                <div className="response-area">
                    <h3>AI Response:</h3>
                    <p>{responseText}</p>
                </div>
            )}
        </div>
    );
}

export default Popup;