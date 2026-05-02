# server/auth_routes.py - Authentication Blueprint

from flask import Blueprint, request, jsonify, redirect
from datetime import datetime
import requests
import json
import os

auth_bp = Blueprint('auth', __name__)

# Get MongoDB collection (passed from app.py)
users_collection = None

def init_auth(collection):
    """Initialize auth routes with MongoDB collection"""
    global users_collection
    users_collection = collection

# Google OAuth Config
GOOGLE_CLIENT_ID = os.getenv('Client_ID')
GOOGLE_CLIENT_SECRET = os.getenv('secret_key')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    User registration endpoint
    
    Request Body:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "securepassword123"
    }
    
    Response:
    {
        "status": "success",
        "message": "User registered successfully"
    }
    """
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        # Validation
        if not name or not email or not password:
            return jsonify({
                "status": "error", 
                "message": "Missing required fields"
            }), 400
        
        if len(password) < 6:
            return jsonify({
                "status": "error",
                "message": "Password must be at least 6 characters"
            }), 400
            
        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return jsonify({
                "status": "error", 
                "message": "User already exists"
            }), 409

        # Create user document
        user_data = {
            "name": name,
            "email": email,
            "password": password,  # TODO: Hash with bcrypt in production!
            "auth_type": "email",
            "created_at": datetime.now(),
            "sessions": []
        }
        
        users_collection.insert_one(user_data)
        
        return jsonify({
            "status": "success", 
            "message": "User registered successfully"
        }), 201

    except Exception as e:
        print(f"❌ Signup error: {e}")
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint
    
    Request Body:
    {
        "name": "John Doe" OR "email": "john@example.com",
        "password": "securepassword123"
    }
    
    Response:
    {
        "status": "success",
        "message": "Login successful",
        "user": {
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
    """
    try:
        data = request.json
        name_or_email = data.get('name') or data.get('email')
        password = data.get('password')

        # Validation
        if not name_or_email or not password:
            return jsonify({
                "status": "error", 
                "message": "Missing credentials"
            }), 400

        # Find user by name or email
        user = users_collection.find_one({
            "$or": [
                {"name": name_or_email}, 
                {"email": name_or_email}
            ]
        })

        if user and user.get('password') == password:
            return jsonify({
                "status": "success", 
                "message": "Login successful",
                "user": {
                    "name": user['name'],
                    "email": user['email'],
                    "picture": user.get('profile_picture')
                }
            }), 200
        else:
            return jsonify({
                "status": "error", 
                "message": "Invalid credentials"
            }), 401

    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500


@auth_bp.route('/google/login')
def google_login():
    """
    Initiate Google OAuth for login
    Redirects to Google's OAuth consent screen
    """
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=email profile&"
        f"prompt=select_account&"
        f"state=login"
    )
    return redirect(google_auth_url)


@auth_bp.route('/google/signup')
def google_signup():
    """
    Initiate Google OAuth for signup
    Redirects to Google's OAuth consent screen
    """
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=email profile&"
        f"prompt=select_account&"
        f"state=signup"
    )
    return redirect(google_auth_url)


@auth_bp.route('/google/callback')
def google_callback():
    """
    Handle Google OAuth callback
    Exchanges authorization code for user info
    Redirects back to React frontend with user data
    """
    code = request.args.get('code')
    
    if not code:
        return redirect(f"{FRONTEND_URL}/?error=no_authorization_code")
    
    # Exchange authorization code for access token
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    try:
        token_response = requests.post(token_url, data=token_data)
        tokens = token_response.json()
        
        if 'access_token' not in tokens:
            return redirect(f"{FRONTEND_URL}/?error=google_auth_failed")
        
        # Get user info from Google
        userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f"Bearer {tokens['access_token']}"}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        user_info = userinfo_response.json()
        
        google_email = user_info.get('email')
        google_name = user_info.get('name')
        google_picture = user_info.get('picture')
        
        if not google_email:
             return redirect(f"{FRONTEND_URL}/?error=email_not_provided")

        # Check if user already exists
        user = users_collection.find_one({"email": google_email})
        
        if not user:
             # Create new user (Auto-signup)
            user_data = {
                "name": google_name,
                "email": google_email,
                "password": None,
                "auth_type": "google",
                "profile_picture": google_picture,
                "created_at": datetime.now(),
                "sessions": []
            }
            users_collection.insert_one(user_data)
            user = user_data # Update local var
            
        # Redirect to frontend with user data
        user_json = json.dumps({
            "name": user["name"], 
            "email": user["email"],
            "picture": user.get("profile_picture")
        })
        return redirect(f"{FRONTEND_URL}/auth/callback?user={user_json}")
    
    except Exception as e:
        print(f"❌ Google OAuth error: {e}")
        return redirect(f"{FRONTEND_URL}/?error=oauth_process_failed")


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout endpoint (for future JWT token invalidation)
    
    Response:
    {
        "status": "success",
        "message": "Logged out successfully"
    }
    """
    # TODO: Invalidate JWT token if using JWT
    return jsonify({
        "status": "success",
        "message": "Logged out successfully"
    }), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Get current user info (for future JWT authentication)
    
    Headers:
    Authorization: Bearer <jwt_token>
    
    Response:
    {
        "user": {
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
    """
    # TODO: Extract user from JWT token
    # For now, return mock data
    return jsonify({
        "status": "error",
        "message": "Not implemented - use client-side user state for now"
    }), 501