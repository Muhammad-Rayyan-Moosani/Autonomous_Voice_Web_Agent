//Sender sends the audio + stringified DOM elements to the backend
export async function sendAudioWithContext(blob) {

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const pageContext = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_CONTEXT"
    });

    console.log("Sender.js - Received page context:", pageContext);
    console.log("Sender.js - Context JSON:", JSON.stringify(pageContext));

    const formData = new FormData();
    formData.append("audio", blob, "input.webm");
    formData.append("pageContext", JSON.stringify(pageContext));

    try {
        const response = await fetch("http://127.0.0.1:5002/agent", {
            method: "POST",
            body: formData
        });

        return await response.json();

    } catch (err) {
        console.error("Send failed:", err);
        throw err;
    }
}