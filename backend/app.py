# app.py

from flask import Flask, request, jsonify
import json
from flask_cors import CORS
import os
from dotenv import load_dotenv
from STT import stt
from TTS import tts
import base64
from anthropic import Anthropic
from io import BytesIO

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
    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=900,
        messages=[
            {"role": "user", "content": prompt_text}
        ]
    )

    if response.content and len(response.content) > 0:
        return response.content[0].text
    else:
        raise Exception("No content in Claude response")


@app.route("/agent", methods=["POST"])
def agent():
    try:
        audio_file = request.files.get("audio")
        Page_Context = request.form.get("pageContext")

        if not audio_file:
            return jsonify({"error": "No audio file provided"}), 400

        if not Page_Context:
            print("Warning: No page context provided")
            Page_Context = "{}"

        print("Page Context:", Page_Context)
        print('--------------------------------------------------')
        print("Audio filename:", audio_file.filename)
        print("Content-Type:", audio_file.content_type)

        # ✅ Read audio safely ONCE
        audio_bytes = audio_file.read()
        print("Audio size:", len(audio_bytes), "bytes")

        # ❌ Reject invalid audio early
        if not audio_bytes or len(audio_bytes) < 1000:
            return jsonify({
                "error": f"Invalid audio received (too small: {len(audio_bytes)} bytes)"
            }), 400

        # ✅ Pass controlled stream to STT
        try:
            transcript = stt(BytesIO(audio_bytes))
            print(f"Transcript: {transcript}")
        except Exception as e:
            print(f"STT Error: {e}")
            return jsonify({"error": f"Speech-to-text failed: {str(e)}"}), 500

        # Load prompt
        try:
            with open("PROMPT.txt", 'r', encoding="utf-8") as f:
                prompt = f.read()
        except FileNotFoundError:
            return jsonify({"error": "Prompt template not found"}), 500

        # Parse context
        try:
            page_data = json.loads(Page_Context)
            title = page_data.get("title", "Unknown Page")
            url = page_data.get("url", "")
            summary = page_data.get("summary", "No summary available")
        except:
            title, url, summary = "Unknown Page", "", "No summary available"

        # Build prompt
        prompt_text = prompt.replace('<user transcript>', transcript)
        prompt_text = prompt_text.replace('<Page title>', title)
        prompt_text = prompt_text.replace('<Page URL>', url)
        prompt_text = prompt_text.replace('<summary>', summary)

        # AI response
        try:
            ai_response = get_agent_response(prompt_text)
        except Exception as e:
            return jsonify({"error": f"AI agent failed: {str(e)}"}), 500

        # TTS (truncate safely)
        try:
            max_len = 200
            tts_text = ai_response

            if len(ai_response) > max_len:
                truncated = ai_response[:max_len]
                cutoff = max(
                    truncated.rfind('.'),
                    truncated.rfind('?'),
                    truncated.rfind('!')
                )
                tts_text = ai_response[:cutoff+1] if cutoff > 0 else truncated + "..."

            audio_bytes = tts(tts_text)
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

        except Exception as e:
            return jsonify({"error": f"TTS failed: {str(e)}"}), 500

        return jsonify({
            "transcript": transcript,
            "response": ai_response,
            "audioData": audio_base64,
            "actions": []
        })

    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5002)