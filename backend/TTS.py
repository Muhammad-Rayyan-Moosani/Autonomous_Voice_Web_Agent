# TTS.py
# Converts AI text responses into audio
# Returns audio bytes for the extension to play

import os
from smallestai.waves import WavesClient
from io import BytesIO

SMALLEST_API_KEY = os.getenv("SMALLEST_API_KEY")

def tts(text, voice="alloy", sample_rate=24000, speed=1.0):
    """
    Convert text to speech using SmallestAI WavesClient.
    Returns: BytesIO object containing the WAV audio
    """
    client = WavesClient(api_key=SMALLEST_API_KEY)

    # Create a BytesIO object to hold audio in memory
    audio_buffer = BytesIO()

    # Synthesize text into audio
    client.synthesize(
        text=text,
        voice=voice,
        sample_rate=sample_rate,
        speed=speed,
        save_as=audio_buffer  # save into memory instead of file
    )

    # Reset buffer pointer to start
    audio_buffer.seek(0)
    return audio_buffer