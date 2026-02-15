// api.js
// Handles communication with the Flask backend

const BACKEND_URL = "http://localhost:5000/agent";

/**
 * Sends the user's audio and page context to the backend.
 * @param {Blob} audioBlob - The recorded audio.
 * @param {Object} pageContext - Metadata about the current page.
 * @returns {Promise<Object>} The JSON response from the backend.
 */
export async function sendAgentRequest(audioBlob, pageContext) {
    const formData = new FormData();

    if (audioBlob) {
        formData.append("audio", audioBlob, "input.webm");
    }

    // Send context as a JSON string field, or individual fields
    formData.append("pageContext", JSON.stringify(pageContext));

    // If we had a text-only input mode, we'd append 'transcript' here too
    // formData.append("transcript", textInput);

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData,
            // Note: Fetch automatically sets Content-Type to multipart/form-data with boundary
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
}