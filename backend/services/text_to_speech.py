import os
from openai import OpenAI
from dotenv import load_dotenv
import uuid

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_speech(text):
    """
    Generates speech audio from text using OpenAI TTS.
    Returns the URL/path to the generated audio file.
    """
    if not os.getenv("OPENAI_API_KEY"):
        print("Warning: OPENAI_API_KEY not found. Skipping TTS.")
        return None

    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        
        filename = f"speech_{uuid.uuid4()}.mp3"
        filepath = os.path.join("temp_audio", filename)
        response.stream_to_file(filepath)
        
        # In a real app, this would be a public URL. 
        # For local dev, we serve it from a static folder.
        return f"http://localhost:5000/audio/{filename}"
    except Exception as e:
        print(f"TTS Error: {e}")
        return None