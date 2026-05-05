// basically receives audio from TTS in the backend and plays it 

export function playAudioFromBase64(audioBase64) {
    try {
        if (!audioBase64) {
            console.error("No audio received");
            return;
        }

        // base64 to binary
        const byteCharacters = atob(audioBase64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        // create the audio blob
        const audioBlob = new Blob([byteArray], { type: "audio/wav" });

        const audioUrl = URL.createObjectURL(audioBlob);

        // plays audio
        const audio = new Audio(audioUrl);
        audio.play();

        console.log("Audio playing...");

        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            console.log("Audio finished");
        };

    } catch (err) {
        console.error("Failed to play audio:", err);
    }
}