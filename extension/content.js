// content.js
// Runs inside every webpage (the "hands" of the agent)

console.log("Autonomous Voice Web Agent: Content script loaded.");

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_CONTEXT") {
        const context = getPageContext();
        sendResponse(context);
    } else if (request.action === "HIGHLIGHT") {
        if (request.selectors && Array.isArray(request.selectors)) {
            highlightElements(request.selectors);
            sendResponse({ status: "success", count: request.selectors.length });
        } else {
            sendResponse({ status: "error", message: "Invalid selectors" });
        }
    } else if (request.action === "CLEAR_HIGHLIGHTS") {
        clearHighlights();
        sendResponse({ status: "success" });
    }
    // Return true if you want to respond asynchronously, though here we differ synchronous or instant responses
});

/**
 * Extracts relevant details from the current page to send to the AI
 */
function getPageContext() {
    return {
        title: document.title,
        url: window.location.href,
        // A simple heuristic to get visible text or main content could go here.
        // For now, we'll just grab the body text, truncated to avoid huge payloads.
        // In a real app, you'd want a more sophisticated readability extraction.
        summary: document.body.innerText.substring(0, 5000).replace(/\s+/g, " ").trim()
    };
}

// Keep track of highlighted elements to clear them later
let highlightedElements = [];

/**
 * Highlights elements on the page based on CSS selectors
 * @param {string[]} selectors - Array of CSS selectors to highlight
 */
function highlightElements(selectors) {
    // First clear existing highlights to avoid clutter
    clearHighlights();

    selectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Save original style to restore later if needed (simple version just adds a class or style)
                // For simplicity, we'll just manipulate the style directly and rely on reload/clear to fix.
                // A better approach is to add a specific class.

                el.dataset.originalBorder = el.style.border;
                el.dataset.originalBoxShadow = el.style.boxShadow;

                el.style.border = "2px solid red";
                el.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.5)";
                el.scrollIntoView({ behavior: "smooth", block: "center" });

                highlightedElements.push(el);
            });
        } catch (e) {
            console.warn(`Autonomous Voice Web Agent: Invalid selector "${selector}"`, e);
        }
    });
}

/**
 * Clears all applied highlights
 */
function clearHighlights() {
    highlightedElements.forEach(el => {
        // Restore original styles
        el.style.border = el.dataset.originalBorder || "";
        el.style.boxShadow = el.dataset.originalBoxShadow || "";

        // Clean up dataset attributes
        delete el.dataset.originalBorder;
        delete el.dataset.originalBoxShadow;
    });
    highlightedElements = [];
}