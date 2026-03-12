// api.js – backend communication (extension only).
// Single function: send audio + pageContext to POST /agent.

const AGENT_URL = "http://localhost:5001/agent";

/**
 * Sends recorded audio and page context to the backend.
 * Backend returns JSON: transcript, response, audioUrl (optional), actions (optional).
 *
 * @param {Blob} audioBlob - Recorded audio (e.g. audio/webm).
 * @param {Object} pageContext - { title, url, summary } from content script.
 * @returns {Promise<Object>} Parsed JSON response.
 */
export async function sendAudioToBackend(audioBlob, pageContext) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "input.webm");
    formData.append("pageContext", JSON.stringify(pageContext || {}));

    const response = await fetch(AGENT_URL, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
