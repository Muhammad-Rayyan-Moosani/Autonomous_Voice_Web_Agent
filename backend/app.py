# app.py
# Main Flask application
# Initializes server, CORS, and routes
# Handles POST requests from extension
# Connects to AI planner and services

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/test", methods=['POST'])
def test():
    data = request.json
    transcript = data.get("transcript ", "")
    page_context = data.get("page_context", {})

    response = {
        "intent":"demo",
        "response":f'Received transcript: {transcript}',
        "page_context": page_context
    }
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)

