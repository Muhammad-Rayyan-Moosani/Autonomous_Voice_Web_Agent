
import { sendAudioWithContext } from "./sender.js";
import { playAudioFromBase64 } from "./receiver.js";

let mediaRecorder;
let chunks = [];
let stream = null;

// Get mic permission first
document.getElementById("permission").onclick = async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Mic permission granted");
    } catch (err) {
        console.error("Mic permission denied:", err);
    }
};

// upon click start recording
document.getElementById("start").onclick = () => {

    if (!stream) {
        console.log("Please allow mic first");
        return;
    }

    chunks = [];

    mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm"
    });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    mediaRecorder.start();
    console.log("Recording started");
};

// upon click stop it and send it to the backend
document.getElementById("stop").onclick = () => {

    if (!mediaRecorder || mediaRecorder.state !== "recording") {
        console.log("Not recording");
        return;
    }

    mediaRecorder.onstop = async () => {

        const blob = new Blob(chunks, { type: "audio/webm" });

        console.log("Recording stopped, size:", blob.size);

        try {
            const result = await sendAudioWithContext(blob);
            console.log("Backend result:", result);
            playAudioFromBase64(result.audioData);

        } catch (err) {
            console.error("Send failed:", err);
        }
    };

    mediaRecorder.stop();
};