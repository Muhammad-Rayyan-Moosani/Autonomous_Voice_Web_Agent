# speech_to_text.py
# Converts audio from the extension into text
# Prepares input for the planner
import os
import requests



def transcribe_audio(audio_bytes):
    SMALLEST_API_KEY = os.getenv("SMALLEST_API_KEY")
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

    # For now, send webm directly to SmallestAI STT
    # The API might accept webm format directly
    # If not, we'll need to use a different audio conversion library
    try:
        transcript = transcribe_audio(audio_bytes)
    except Exception as e:
        print(f"Warning: Direct webm transcription failed: {e}")
        # If the API doesn't accept webm, we'll need alternative solution
        raise Exception("Audio conversion needed but pydub not available. Consider using ffmpeg or another library.")

    return transcript

