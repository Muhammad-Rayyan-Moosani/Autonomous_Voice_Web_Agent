// audio.js – runs in POPUP context only (not in service worker).
// Recording uses navigator.mediaDevices.getUserMedia and MediaRecorder here.

const LOG = (msg, ...args) => console.log('[VoiceAgent]', msg, ...args);

let mediaRecorder = null;
let audioChunks = [];

/**
 * Starts recording. Must be called directly from a user gesture (e.g. mic button click).
 * Do not run on page load or before user click.
 * @returns {Promise<true>}
 */
export function startRecording() {
    LOG('getUserMedia called (from user gesture)');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const err = new Error('MIC_NOT_SUPPORTED');
        LOG('getUserMedia not supported');
        throw err;
    }

    // Use simple constraint to avoid constraint failures; call must be in user gesture.
    const promise = navigator.mediaDevices.getUserMedia({ audio: true });

    return promise
        .then((stream) => {
            if (!stream || typeof stream.getTracks !== 'function') {
                LOG('Invalid stream received');
                throw new Error('Invalid stream');
            }
            LOG('Stream received, tracks:', stream.getTracks().length);

            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            if (typeof mediaRecorder.start !== 'function') {
                stream.getTracks().forEach((t) => t.stop());
                throw new Error('MediaRecorder.start not available');
            }

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.start(100);
            LOG('MediaRecorder started');
            return true;
        })
        .catch((error) => {
            LOG('getUserMedia error:', error?.name, error?.message, error);
            if (error && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
                const e = new Error('MIC_DENIED');
                e.original = error;
                throw e;
            }
            if (error && error.name === 'NotFoundError') {
                const e = new Error('MIC_NOT_FOUND');
                e.original = error;
                throw e;
            }
            throw error;
        });
}

/**
 * Stops recording and returns the audio Blob.
 * @returns {Promise<Blob>}
 */
export function stopRecording() {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
            LOG('stopRecording: no MediaRecorder');
            return reject(new Error('No recording in progress'));
        }
        if (mediaRecorder.state === 'inactive') {
            LOG('stopRecording: already inactive');
            return reject(new Error('No recording in progress'));
        }

        const stream = mediaRecorder.stream;
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];
            mediaRecorder = null;
            LOG('Recording stopped, blob size:', audioBlob.size);
            if (stream && typeof stream.getTracks === 'function') {
                stream.getTracks().forEach((t) => t.stop());
            }
            resolve(audioBlob);
        };

        mediaRecorder.stop();
    });
}

/**
 * Plays audio from URL or Blob.
 */
export async function playAudio(audioSource) {
    const url = audioSource instanceof Blob ? URL.createObjectURL(audioSource) : audioSource;
    const audio = new Audio(url);
    try {
        await audio.play();
        LOG('Audio playback started');
        return new Promise((resolve) => {
            audio.onended = () => {
                if (audioSource instanceof Blob) URL.revokeObjectURL(url);
                resolve();
            };
        });
    } catch (err) {
        LOG('Audio play error:', err);
        throw err;
    }
}
