// Content script - gets page context
console.log('[VoiceAgent] Content script loaded');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_CONTEXT") {
        const context = {
            title: document.title,
            url: window.location.href,
            summary: document.body.innerText.slice(0, 5000)
        };
        console.log("📄 Content.js - Sending page context:", context);
        sendResponse(context);
        return true; // Keep message channel open
    }
    return false;
});