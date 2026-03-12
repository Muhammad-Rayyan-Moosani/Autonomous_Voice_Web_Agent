// background.js – service worker; coordinates popup and offscreen document for mic
let popupPort = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log("Autonomous Voice Web Agent installed.");
});

chrome.runtime.onConnect.addListener((port) => {
    popupPort = port;
    port.onDisconnect.addListener(() => { popupPort = null; });

    port.onMessage.addListener((msg) => {
        if (msg.action === "START_RECORDING") {
            ensureOffscreenAndStart();
        } else if (msg.action === "STOP_RECORDING") {
            chrome.runtime.sendMessage({ target: "offscreen", action: "stop" }).catch(() => {});
        }
    });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "AUDIO_READY") {
        if (popupPort) popupPort.postMessage({ type: "AUDIO_READY", audio: msg.audio });
        sendResponse({ ok: true });
    }
    return false;
});

async function ensureOffscreenAndStart() {
    const existing = await chrome.offscreen.hasDocument();
    if (!existing) {
        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: [chrome.offscreen.Reason.USER_MEDIA],
            justification: "Record microphone for voice agent",
        });
    }
    const reply = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ target: "offscreen", action: "start" }, (r) => {
            resolve(r);
        });
    });
    if (popupPort) {
        if (reply && reply.ok) {
            popupPort.postMessage({ type: "RECORDING_STARTED" });
        } else {
            popupPort.postMessage({ type: "RECORDING_ERROR", error: (reply && reply.error) || "MIC_DENIED" });
        }
    }
}
