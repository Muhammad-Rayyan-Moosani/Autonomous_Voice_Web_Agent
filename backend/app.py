# app.py
# Main Flask application
# Initializes server, CORS, and routes
# Handles POST requests from extension
# Connects to AI planner and services

from flask import Flask, request, jsonify
import json
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from STT import stt
from TTS import tts
from flask import send_file
import asyncio
from my_agent import MyAgent
import base64
from anthropic import Anthropic


load_dotenv()

client = Anthropic(
    api_key=os.getenv("CLAUDE_API_KEY")
)

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": "*"
    }
})

def get_agent_response(prompt_text):
    """
    Get response from Claude AI
    Returns the text content from Claude's response
    """
    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=900,
        messages=[
            {"role": "user", "content": prompt_text}
        ]
    )

    # Extract text from Claude's response
    # Claude returns response.content as a list of content blocks
    if response.content and len(response.content) > 0:
        return response.content[0].text
    else:
        raise Exception("No content in Claude response")

@app.route("/agent", methods=["POST"])
def agent():
    try:
        # Get audio file and page context
        audio_file = request.files.get("audio")
        Page_Context = request.form.get("pageContext")

        # Validate inputs
        if not audio_file:
            return jsonify({"error": "No audio file provided"}), 400

        if not Page_Context:
            print("Warning: No page context provided")
            Page_Context = "{}"  # Default to empty JSON

        print("Page Context:", Page_Context)
        print('--------------------------------------------------')
        print("Audio file:", audio_file)

        # Step 1: Convert speech to text
        try:
            transcript = stt(audio_file)
            print(f"Transcript: {transcript}")
        except Exception as e:
            print(f"STT Error: {e}")
            return jsonify({"error": f"Speech-to-text failed: {str(e)}"}), 500

        # Step 2: Load prompt template
        try:
            with open("PROMPT.txt", 'r', encoding="utf-8") as f:
                prompt = f.read()
        except FileNotFoundError:
            print("Error: PROMPT.txt not found")
            return jsonify({"error": "Prompt template not found"}), 500

        # Step 3: Parse page context JSON
        try:
            page_data = json.loads(Page_Context)
            title = page_data.get("title", "Unknown Page")
            url = page_data.get("url", "")
            summary = page_data.get("summary", "No summary available")
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            title = "Unknown Page"
            url = ""
            summary = "No summary available"

        # Step 4: Build the final prompt
        prompt_text = prompt.replace('<user transcript>', transcript)
        prompt_text = prompt_text.replace('<Page title>', title)
        prompt_text = prompt_text.replace('<Page URL>', url)
        prompt_text = prompt_text.replace('<summary>', summary)

        print(f"Final prompt length: {len(prompt_text)} chars")

        # Step 5: Get AI response
        try:
            ai_response = get_agent_response(prompt_text)
            print(f"AI Response length: {len(ai_response)} chars")
            print(f"AI Response: {ai_response[:200]}...")
        except Exception as e:
            print(f"Agent Error: {e}")
            return jsonify({"error": f"AI agent failed: {str(e)}"}), 500

        # Step 6: Convert AI response to speech
        try:
            # SmallestAI has a very low text limit (~200-250 chars)
            max_tts_length = 200
            tts_text = ai_response

            if len(ai_response) > max_tts_length:
                # Truncate at sentence boundary
                truncated = ai_response[:max_tts_length]
                last_period = truncated.rfind('.')
                last_question = truncated.rfind('?')
                last_exclaim = truncated.rfind('!')

                cutoff = max(last_period, last_question, last_exclaim)
                if cutoff > 0:
                    tts_text = ai_response[:cutoff + 1]
                else:
                    tts_text = truncated + "..."

                print(f"⚠️  TTS text truncated from {len(ai_response)} to {len(tts_text)} chars")

            print(f"Sending to TTS: {len(tts_text)} chars - '{tts_text[:100]}...'")

            audio_bytes = tts(tts_text)
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"Audio generated, base64 length: {len(audio_base64)}")
        except Exception as e:
            print(f"TTS Error: {e}")
            return jsonify({"error": f"Text-to-speech failed: {str(e)}"}), 500

        # Step 7: Return JSON response
        return jsonify({
            "transcript": transcript,
            "response": ai_response,
            "audioUrl": None,
            "audioData": audio_base64,
            "actions": []
        })

    except Exception as e:
        print(f"Unexpected error in /agent: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5001)