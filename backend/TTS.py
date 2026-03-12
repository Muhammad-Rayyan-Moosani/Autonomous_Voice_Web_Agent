# TTS.py

import os
import asyncio
from smallestai.waves import AsyncWavesClient
from datetime import datetime


async def tts_async(text):
    """
    Async function to convert text to speech using SmallestAI Waves API.

    Args:
        text: The text to convert to speech

    Returns:
        bytes: WAV audio data

    Raises:
        ValueError: If API key is missing or text is empty
        Exception: If API request fails
    """
    SMALLEST_API_KEY = os.getenv("SMALLEST_API_KEY")

    if not SMALLEST_API_KEY:
        raise ValueError("SMALLEST_API_KEY environment variable not set")

    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    print(f'Sending TTS request at {datetime.now()}')
    print(f'Text length: {len(text)} chars')

    try:
        client = AsyncWavesClient(api_key=SMALLEST_API_KEY)
        async with client as tts_client:
            audio_bytes = await tts_client.synthesize(text)
            print(f'TTS response received: {len(audio_bytes)} bytes')
            return audio_bytes

    except Exception as e:
        print(f'TTS request failed: {e}')
        raise


def tts(text):
    """
    Synchronous wrapper for async TTS function.

    Args:
        text: The text to convert to speech

    Returns:
        bytes: WAV audio data
    """
    return asyncio.run(tts_async(text))