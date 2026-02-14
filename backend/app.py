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

