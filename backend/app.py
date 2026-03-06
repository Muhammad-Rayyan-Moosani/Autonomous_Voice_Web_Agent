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
from smallestai.atoms import agents
from smallestai.atoms.agent import Agent, AgentSession
import base64


load_dotenv()

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": "*"
    }
})

async def get_agent_response(prompt_text):
    # Start a temporary session
    session = AgentSession()
    agent = MyAgent()
    session.add_node(agent)
    await session.start()

    # Add user message
    agent.context.add_message({"role": "user", "content": prompt_text})

    # Collect streamed output
    result_text = ""
    async for chunk in agent.generate_response():
        result_text += chunk

    await session.wait_until_complete()
    return result_text

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
            ai_response = asyncio.run(get_agent_response(prompt_text))
            print(f"AI Response: {ai_response[:100]}...")
        except Exception as e:
            print(f"Agent Error: {e}")
            return jsonify({"error": f"AI agent failed: {str(e)}"}), 500

        # Step 6: Convert AI response to speech
        try:
            audio_bytes = tts(ai_response)
            audio_bytes.seek(0)  # Reset buffer to start
            audio_base64 = base64.b64encode(audio_bytes.read()).decode('utf-8')
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