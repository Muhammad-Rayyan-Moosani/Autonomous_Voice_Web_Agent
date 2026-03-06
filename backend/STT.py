# speech_to_text.py
# Converts audio from the extension into text
# Prepares input for the planner
from pydub import AudioSegment
import io
import os
import requests

SMALLEST_API_KEY = os.getenv("SMALLEST_API_KEY")

def transcribe_audio(audio_bytes):
    response = requests.post(
        "https://waves-api.smallest.ai/api/v1/pulse/get_text",
        params={"model": "pulse", "language": "en"},
        headers={
            "Authorization": f"Bearer {SMALLEST_API_KEY}",
            "Content-Type": "audio/wav",
        },
        data=audio_bytes,
        timeout=120
    )

    # Check if request was successful
    if response.status_code != 200:
        print(f"STT API Error - Status: {response.status_code}")
        print(f"Response: {response.text}")
        raise Exception(f"STT API returned status {response.status_code}: {response.text}")

    # Parse JSON response
    try:
        result = response.json()
        print(f"STT API Response: {result}")
    except Exception as e:
        print(f"Failed to parse JSON: {response.text}")
        raise Exception(f"Invalid JSON from STT API: {e}")

    # Extract transcription
    if "transcription" in result:
        return result["transcription"]
    elif "text" in result:
        return result["text"]
    else:
        print(f"Unexpected response format: {result}")
        raise KeyError(f"No 'transcription' or 'text' key in response: {list(result.keys())}")


def stt(audio_file):
    # Read the webm bytes

    audio_bytes = audio_file.read()

    # Convert webm to wav
    webm_audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format="webm")
    wav_io = io.BytesIO()
    webm_audio.export(wav_io, format="wav")
    wav_bytes = wav_io.getvalue()

    # Send wav_bytes to SmallestAI STT
    transcript = transcribe_audio(wav_bytes)


    return transcript

