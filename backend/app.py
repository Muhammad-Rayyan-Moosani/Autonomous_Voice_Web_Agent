# app.py
# Main Flask application
# Initializes server, CORS, and routes
# Handles POST requests from extension
# Connects to AI planner and services

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import json
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Import services
from services.speech_to_text import transcribe_audio
from services.text_to_speech import generate_speech
from agent.planner import plan_action

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'temp_audio'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/agent', methods=['POST'])
def handle_agent_request():
    try:
        # 1. Get input data
        audio_file = request.files.get('audio')
        page_context = request.form.get('pageContext')
        
        transcript = None
        if audio_file:
            # Save audio temporarily for transcription
            file_id = str(uuid.uuid4())
            temp_path = os.path.join(UPLOAD_FOLDER, f"input_{file_id}.webm")
            audio_file.save(temp_path)
            
            # STT
            transcript = transcribe_audio(temp_path)
            # Cleanup temp input file if needed, or keep for debugging
        
        # If no audio but transcript field exists (for text input support later)
        if not transcript:
            transcript = request.form.get('transcript')

        if not transcript:
            return jsonify({"error": "No transcript or audio provided"}), 400

        # 2. AI Planner (Process transcript + context)
        result = plan_action(transcript, page_context)
        
        # 3. TTS (Optional)
        if result.get('response'):
            audio_url = generate_speech(result['response'])
            if audio_url:
                result['audioUrl'] = audio_url
        
        return jsonify(result)

    except Exception as e:
        print(f"Error handling request: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
