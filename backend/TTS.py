# TTS.py

import os
from smallestai.waves import WavesClient
from io import BytesIO

SMALLEST_API_KEY = os.getenv("SMALLEST_API_KEY")

client = WavesClient(api_key=SMALLEST_API_KEY)

def tts(text, voice_id="alloy", sample_rate=24000, speed=1.0):
    """
    Convert text to speech using SmallestAI.
    Returns: BytesIO containing WAV audio
    """

    audio_bytes = client.synthesize(
        text=text,
        voice_id=voice_id,
        sample_rate=sample_rate,
        speed=speed,
        output_format="wav"
    )

    audio_buffer = BytesIO(audio_bytes)
    audio_buffer.seek(0)

    return audio_buffer