# app.py
# Main Flask application
# Initializes server, CORS, and routes
# Handles POST requests from extension
# Connects to AI planner and services

from flask import Flask, jasonify, request
from flask_cors import CORS
from  dotenv import load_dotenv
import os
load_dotenv()


app = Flask(__name__)
CORS(app)

