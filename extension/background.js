// background.js
// Service worker for the extension

console.log("Autonomous Voice Web Agent: Background service worker started.");

chrome.runtime.onInstalled.addListener(() => {
    console.log("Autonomous Voice Web Agent installed.");
});

// Example: Listen for messages from content script or popup if complex coordination is needed.
// Currently, popup talks directly to content script for context, which is fine for simple V3 extensions.
// However, if we need to proxy requests to the backend to avoid CORS in content scripts (though host_permissions help),
// or manage long-running tasks, we'd do it here.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "PING") {
        sendResponse({ status: "PONG" });
    }
    // If we need to proxy API requests:
    // if (request.action === "PROXY_API_REQUEST") { ... }
});
