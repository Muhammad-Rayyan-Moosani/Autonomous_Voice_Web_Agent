// audio.js
// Handles microphone recording and playback

let mediaRecorder = null;
let audioChunks = [];

/**
 * Starts recording audio from the user's microphone.
 * Returns a promise that resolves when recording starts.
 */
export async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.start();
        console.log("Recording started...");
        return true;
    } catch (error) {
        console.error("Error accessing microphone:", error);
        throw error;
    }
}

/**
 * Stops recording and returns the audio Blob.
 * @returns {Promise<Blob>} The recorded audio as a Blob (audio/webm usually).
 */
export function stopRecording() {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
            return reject(new Error("No recording in progress"));
        }

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];
            mediaRecorder = null; // Reset
            console.log("Recording stopped. Blob size:", audioBlob.size);
            resolve(audioBlob);
        };

        mediaRecorder.stop();
        // Also stop all tracks to release the mic
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
}

/**
 * Plays audio from a URL or Blob.
 * @param {string|Blob} audioSource - The URL string or Blob object to play.
 */
export async function playAudio(audioSource) {
    let url;
    if (audioSource instanceof Blob) {
        url = URL.createObjectURL(audioSource);
    } else {
        url = audioSource;
    }

    const audio = new Audio(url);
    try {
        await audio.play();
        console.log("Audio playback started.");

        // Optional: wait for it to finish?
        return new Promise((resolve) => {
            audio.onended = () => {
                resolve();
                if (audioSource instanceof Blob) {
                    URL.revokeObjectURL(url);
                }
            };
        });
    } catch (err) {
        console.error("Error playing audio:", err);
        throw err;
    }
}