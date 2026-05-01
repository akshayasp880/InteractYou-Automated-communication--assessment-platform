# server/app.py - Unified Flask Backend

from flask import Flask, Response, jsonify, request, redirect, session
from flask_cors import CORS
from dotenv import load_dotenv
import os
import cv2
import numpy as np
import threading
import time
from datetime import datetime
from pymongo import MongoClient
import requests
# Import your existing modules
from ultralytics import YOLO
from posture_engagement import compute_posture_and_engagement
from speech_module import speech_recognition_thread
from session_analyzer import SessionAnalyzer
from nlp_module import generate_specific_recommendations
from topics_loader import PRACTICE_TOPICS
from gemini_analysis import generate_ai_coaching_report, get_quick_ai_tips

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24))

# CORS Configuration
CORS(app, 
     origins=[os.getenv('FRONTEND_URL', 'http://localhost:5173')],
     supports_credentials=True)

# ==================== GOOGLE OAUTH CONFIG ====================
GOOGLE_CLIENT_ID = os.getenv('Client_ID')
GOOGLE_CLIENT_SECRET = os.getenv('secret_key')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')

# ==================== MONGODB CONFIG ====================
try:
    mongo_client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/'))
    db = mongo_client[os.getenv('MONGO_DB', 'Final_Year_Project')]
    users_collection = db[os.getenv('MONGO_COLLECTION', 'login')]
    history_collection = db['data']
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ Error connecting to MongoDB: {e}")

# ==================== MODELS & GLOBALS ====================
yolo_model = YOLO("yolov8n-pose.pt")
sessions_history = []
current_analyzer = None
is_recording = False


def get_current_analyzer():
    return current_analyzer


def get_is_recording():
    return is_recording


# ==================== VIDEO FEED GENERATOR ====================
def generate_frames():
    """Generates MJPEG frames for the /video_feed route."""
    global current_analyzer, is_recording

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("❌ Cannot open camera")
        while True:
            black = np.zeros((480, 640, 3), dtype=np.uint8)
            ret, buffer = cv2.imencode('.jpg', black)
            if not ret:
                break
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        return

    while True:
        success, frame = camera.read()
        if not success:
            print("⚠️ Camera read failed")
            break

        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]

        try:
            if is_recording and current_analyzer:
                elapsed_time = time.time() - current_analyzer.start_time

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                results = yolo_model(frame, conf=0.25, verbose=False)

                if results[0].keypoints is not None and len(results[0].keypoints) > 0:
                    kpts = results[0].keypoints.xy[0].cpu().numpy()
                    
                    # Ensure at least one facial keypoint (0-4) is visible
                    face_visible = any(kpts[i][0] > 0 or kpts[i][1] > 0 for i in range(min(5, kpts.shape[0])))

                    if kpts.shape[0] > 12 and face_visible:
                        (
                            posture_label,
                            engagement_label,
                            posture_reasons,
                            engagement_reasons,
                            events,
                            eye_contact_good,
                            hands_visible,
                            is_gesturing,
                        ) = compute_posture_and_engagement(
                            kpts, w, h, gray, frame_rgb, elapsed_time
                        )

                        current_analyzer.register_posture_label(posture_label)

                        timestamp_str = time.strftime('%M:%S', time.gmtime(elapsed_time))
                        current_analyzer.register_eye_contact(
                            eye_contact_good, timestamp_str
                        )

                        current_analyzer.register_gesture(visible=is_gesturing)
                        if is_gesturing:
                            print(f"📊 Gesture registered at {timestamp_str}")

                            if event['type'] in [
                                'head_tilt',
                                'shoulder_misalignment',
                                'hand_gesture',
                                'eyes_closed',
                                'mouth_open',
                            ]:
                                current_analyzer.register_posture_event(event)

                        for event in events:
                             # Re-check engagement events separately since we broke the loop logic slightly
                             if event['type'] in [
                                'engagement_sideways',
                                'engagement_partial',
                            ]:
                                current_analyzer.register_engagement_event(event)
                                current_analyzer.register_engagement_event(event)

                        # Dynamic Color Selection
                        if "Good Posture" in posture_label and "Mostly" not in posture_label:
                            color_posture = (0, 255, 0)  # Green
                        elif "Mostly Good" in posture_label:
                            color_posture = (0, 255, 255)  # Yellow
                        else:
                            color_posture = (0, 0, 255)  # Red

                        # Draw Main Label with Outline
                        # Outline
                        cv2.putText(
                            frame,
                            posture_label,
                            (15, 40),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.8,  # Reduced by 20%
                            (0, 0, 0),
                            4,
                            cv2.LINE_AA,
                        )
                        # Text
                        cv2.putText(
                            frame,
                            posture_label,
                            (15, 40),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.8,  # Reduced by 20%
                            color_posture,
                            2,
                            cv2.LINE_AA,
                        )

                        # Draw Specific Reasons Below
                        # Feedback points: White text, Black outline, Smaller size
                        if posture_reasons and "Overall body posture" not in posture_reasons[0]:
                            y_offset = 65  # Adjusted start position
                            for reason in posture_reasons:
                                text = f"- {reason}"
                                # Outline
                                cv2.putText(
                                    frame,
                                    text,
                                    (15, y_offset),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.5,  # Reduced by 20%
                                    (0, 0, 0),  # Black outline
                                    3,
                                    cv2.LINE_AA,
                                )
                                # Text (White)
                                cv2.putText(
                                    frame,
                                    text,
                                    (15, y_offset),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.5,  # Reduced by 20%
                                    (255, 255, 255),  # White text
                                    1,
                                    cv2.LINE_AA,
                                )
                                y_offset += 20  # Tighter spacing
                    else:
                        # Outline
                        cv2.putText(frame, "No one is on the screen", (15, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4, cv2.LINE_AA)
                        # Text
                        cv2.putText(frame, "No one is on the screen", (15, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)
                else:
                    # Outline
                    cv2.putText(frame, "No one is on the screen", (15, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4, cv2.LINE_AA)
                    # Text
                    cv2.putText(frame, "No one is on the screen", (15, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)

        except Exception as e:
            print(f"Video processing error: {e}")

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            print("⚠️ Frame encode failed")
            continue

        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    camera.release()


# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration endpoint"""
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not name or not email or not password:
            return jsonify({"status": "error", "message": "Missing fields"}), 400
            
        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return jsonify({"status": "error", "message": "User already exists"}), 409

        user_data = {
            "name": name,
            "email": email,
            "password": password,  # TODO: Hash password in production!
            "auth_type": "email",
            "created_at": datetime.now()
        }
        
        users_collection.insert_one(user_data)
        
        return jsonify({"status": "success", "message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.json
        name_or_email = data.get('name')
        password = data.get('password')

        if not name_or_email or not password:
            return jsonify({"status": "error", "message": "Missing credentials"}), 400

        # Find user by name or email
        user = users_collection.find_one({
            "$or": [{"name": name_or_email}, {"email": name_or_email}]
        })

        if user and user['password'] == password:
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
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/auth/google/login')
def google_login():
    """Initiate Google OAuth for login"""
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


@app.route('/api/auth/google/signup')
def google_signup():
    """Initiate Google OAuth for signup"""
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


@app.route('/api/auth/google/callback')
def google_callback():
    """Handle Google OAuth callback"""
    import urllib.parse
    import json
    
    code = request.args.get('code')
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    if not code:
        print("❌ No code received from Google")
        return redirect(f"{frontend_url}/?error=no_authorization_code")
    
    # Exchange code for tokens
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    try:
        print("🔄 Exchanging code for token...")
        token_response = requests.post(token_url, data=token_data)
        tokens = token_response.json()
        
        if 'access_token' not in tokens:
            print(f"❌ Token exchange failed: {tokens}")
            return redirect(f"{frontend_url}/?error=google_auth_failed")
        
        # Get user info from Google
        userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f"Bearer {tokens['access_token']}"}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        user_info = userinfo_response.json()
        
        google_email = user_info.get('email')
        google_name = user_info.get('name')
        google_picture = user_info.get('picture')
        
        if not google_email:
             print("❌ No email found in Google user info")
             return redirect(f"{frontend_url}/?error=email_not_provided")

        # Check if user already exists
        user = users_collection.find_one({"email": google_email})
        
        if not user:
            print(f"🆕 Creating new user for {google_email}")
            # Create new user (Auto-signup)
            user_data = {
                "name": google_name,
                "email": google_email,
                "password": None,
                "auth_type": "google",
                "profile_picture": google_picture,
                "created_at": datetime.now()
            }
            users_collection.insert_one(user_data)
            user = user_data # Update local var
        else:
            print(f"✅ Found existing user for {google_email}")
            # Update profile picture to ensure it's current
            users_collection.update_one(
                {"email": google_email},
                {"$set": {"profile_picture": google_picture}}
            )
            user['profile_picture'] = google_picture
        
        # Redirect to frontend with user data
        user_dict = {
            "name": user["name"], 
            "email": user["email"],
            "picture": user.get("profile_picture")
        }
        user_json = json.dumps(user_dict)
        encoded_user = urllib.parse.quote(user_json)
        
        redirect_url = f"{frontend_url}/auth/callback?user={encoded_user}"
        print(f"➡️ Redirecting to: {redirect_url}")
        return redirect(redirect_url)
        
    except Exception as e:
        print(f"❌ Google OAuth error: {e}", flush=True)
        return redirect(f"{frontend_url}/?error=oauth_process_failed")


# ==================== SESSION ROUTES ====================

@app.route('/api/session/start', methods=['POST'])
def start_session():
    """Start a new assessment session"""
    global is_recording, current_analyzer

    data = request.get_json()
    selected_topic = data.get('topic', None)
    is_custom = data.get('is_custom', False)

    current_analyzer = SessionAnalyzer(
        selected_topic=selected_topic,
        is_custom=is_custom
    )

    is_recording = True

    # Start speech recognition thread
    t = threading.Thread(
        target=speech_recognition_thread,
        args=(get_current_analyzer, get_is_recording),
        daemon=True
    )
    t.start()

    return jsonify({
        'status': 'success',
        'session_id': current_analyzer.session_id
    })


@app.route('/api/session/stop', methods=['POST'])
def stop_session():
    """Stop the current assessment session"""
    global is_recording, current_analyzer

    is_recording = False

    if current_analyzer:
        current_analyzer.speech_data['speaking_time'] = \
            time.time() - current_analyzer.start_time

        summary = current_analyzer.get_summary()

        # ---- Compute WPM & filler % and inject into summary ----
        speaking_time = summary['speech'].get('speaking_time', 0)
        total_words = summary['speech'].get('total_words', 0)
        filler_words = summary['speech'].get('filler_words', 0)

        if speaking_time > 0 and total_words > 0:
            words_per_minute = round((total_words / speaking_time) * 60, 1)
        else:
            words_per_minute = 0

        if total_words > 0:
            filler_word_percentage = round((filler_words / total_words) * 100, 2)
        else:
            filler_word_percentage = 0.0

        summary['speech']['words_per_minute'] = words_per_minute
        summary['speech']['filler_word_percentage'] = filler_word_percentage
        # ----------------------------------------------------------
        
        # Get user email from request to associate session
        try:
            data = request.get_json()
            if data and 'email' in data:
                summary['email'] = data['email']
                summary['created_at'] = datetime.now()
                
                # Save to MongoDB
                history_collection.insert_one(summary.copy())
                print(f"✅ Session saved for {data['email']}")
                print(f"📊 WPM: {words_per_minute}, Words: {total_words}, Duration: {speaking_time:.1f}s")
        except Exception as e:
            print(f"⚠️ Error saving session to DB: {e}")

        # Drop MongoDB _id for JSON serialization
        if '_id' in summary:
            del summary['_id']
        if 'created_at' in summary: 
            del summary['created_at']

        return jsonify({'status': 'success', 'summary': summary})

    return jsonify({'status': 'error', 'message': 'No active session'})


@app.route('/api/session/history', methods=['GET'])
def get_history():
    """Get session history from MongoDB"""
    email = request.args.get('email')
    
    if not email:
        return jsonify({'sessions': []})
        
    try:
        # Fetch sessions for this user, sorted by date (newest first)
        results = list(history_collection.find({'email': email}).sort('_id', -1))
        
        # specific serialization for ObjectID
        for session in results:
            if '_id' in session:
                del session['_id']
            if 'created_at' in session:
                # Convert datetime to ISO string for JSON serialization
                session['created_at'] = session['created_at'].isoformat()
            
            # Backfill words_per_minute for older sessions that lack it
            if 'speech' in session:
                speech = session['speech']
                if 'words_per_minute' not in speech or speech['words_per_minute'] == 0:
                    total_words = speech.get('total_words', 0)
                    speaking_time = speech.get('speaking_time', 0) or session.get('duration', 0)
                    if total_words > 0 and speaking_time > 0:
                        speech['words_per_minute'] = round((total_words / speaking_time) * 60, 1)
                    else:
                        speech['words_per_minute'] = 0
                if 'filler_word_percentage' not in speech:
                    total_words = speech.get('total_words', 0)
                    filler_words = speech.get('filler_words', 0)
                    if total_words > 0:
                        speech['filler_word_percentage'] = round((filler_words / total_words) * 100, 2)
                    else:
                        speech['filler_word_percentage'] = 0.0
                
        return jsonify({'sessions': results})
    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({'sessions': [], 'error': str(e)})


# ==================== ANALYSIS/REPORT ROUTES ====================

@app.route('/api/analysis/report', methods=['GET'])
def get_report():
    """Get detailed performance report"""
    if not current_analyzer:
        return jsonify({'error': 'No session data available'})

    summary = current_analyzer.get_summary()

    speaking_time = summary['speech']['speaking_time']
    total_words = summary['speech']['total_words']
    filler_words = summary['speech']['filler_words']

    if speaking_time > 0:
        words_per_minute = round((total_words / speaking_time) * 60, 2)
    else:
        words_per_minute = 0.0

    if total_words > 0:
        filler_percentage = round((filler_words / total_words) * 100, 2)
    else:
        filler_percentage = 0.0

    avg_pause = round(
        np.mean(summary['speech']['pauses']), 2
    ) if summary['speech']['pauses'] else 0.0

    report = {
        'session_id': summary['session_id'],
        'duration': summary['duration'],
        'topic': summary.get('topic', 'Unknown'),
        'is_custom': summary.get('is_custom', False),

        'posture': summary['posture'],
        'eye_contact': summary['eye_contact'],
        'gestures': summary['gestures'],
        'engagement': summary.get('engagement', {}),

        'speech': {
            'total_words': total_words,
            'filler_words': filler_words,
            'filler_word_percentage': filler_percentage,
            'words_per_minute': words_per_minute,
            'speaking_time': round(speaking_time, 2),
            'average_pause_duration': avg_pause,
            'transcripts': summary['speech']['transcripts'],
            'speaking_pace_segments': summary['speech']['speaking_pace_segments'],
        },
        'nlp_analysis': {
            'topic_relevance': summary['nlp_analysis']['average_topic_relevance'],
            'uncensored_words': summary['speech']['uncensored_words_used'],
            'uncensored_word_count': summary['nlp_analysis']['uncensored_word_count'],
            'off_topic_segments': summary['speech']['off_topic_segments'],
            'off_topic_count': summary['nlp_analysis']['off_topic_count'],
            'analysis_method': summary['nlp_analysis']['analysis_method'],
        },

        'recommendations': generate_specific_recommendations(
            summary, filler_percentage, words_per_minute
        ),
    }

    return jsonify(report)


@app.route('/api/analysis/ai-report', methods=['GET'])
def get_ai_report():
    """Generate AI-powered coaching report using Gemini"""
    if not current_analyzer:
        return jsonify({'error': 'No session data available'})

    summary = current_analyzer.get_summary()
    speaking_time = summary['speech'].get('speaking_time', 0)

    # Check if session is too short (<= 10 seconds)
    if speaking_time <= 10:
        print(f"⚠️ Session too short ({speaking_time}s). Returning low score.")
        
        ai_report = {
            "executive_summary": {
                "overall_score": "1/10",
                "key_strengths": ["N/A"],
                "critical_weaknesses": ["Session duration is too short for analysis."],
                "one_sentence_verdict": "Low Timing: The session was too short (less than 10 seconds) to provide a meaningful analysis."
            },
            "detailed_analysis": {
                "body_language": {
                    "score": "1/10",
                    "what_went_wrong": ["Session too short to analyze body language."],
                    "why_it_matters": "Body language requires continuous observation to be evaluated accurately.",
                    "how_to_fix": ["Speak for a longer duration to allow for proper analysis."],
                    "practice_exercises": ["Try a 1-minute practice session."]
                },
                "eye_contact": {
                    "score": "1/10",
                    "what_went_wrong": ["Session too short to analyze eye contact patterns."],
                    "why_it_matters": "Consistent eye contact builds trust and engagement.",
                    "how_to_fix": ["Maintain gaze with the camera for longer periods."],
                    "practice_exercises": ["Practice maintaining eye contact."]
                },
                "vocal_delivery": {
                    "score": "1/10",
                    "filler_word_analysis": "Insufficient audio data.",
                    "what_went_wrong": ["Session too short to analyze vocal delivery."],
                    "why_it_matters": "Vocal variety and clarity take time to demonstrate.",
                    "how_to_fix": ["Speak for at least 30-60 seconds."],
                    "practice_exercises": ["Read a short paragraph aloud."]
                },
                "content_quality": {
                    "score": "1/10",
                    "relevance_analysis": "Insufficient content.",
                    "what_went_wrong": ["Session too short to analyze content structure."],
                    "why_it_matters": "Content coherence requires a minimum amount of speech.",
                    "how_to_fix": ["Elaborate on your points."],
                    "key_missing_points": ["Content depth"],
                    "tone_upgrade_suggestions": ["Speak more to set a tone."],
                    "practice_exercises": ["Outline your speech before starting."]
                }
            },
            "timeline_breakdown": {
                "critical_moments": []
            },
            "action_plan": {
                "immediate_fixes": ["Try to speak for at least 30-60 seconds to get detailed feedback."],
                "week_1_goals": ["Complete a full 1-minute session", "Practice greeting and introduction"],
                "long_term_development": ["Building stamina for longer speeches", "Developing structured content"]
            },
            "motivation": {
                "what_you_did_well": ["You started a session!"],
                "realistic_next_milestone": "Complete a session longer than 30 seconds.",
                "encouraging_note": "Every expert was once a beginner. Try again with a longer session!"
            }
        }
        
        overall_score = 1.0

        # Update the session in DB identified by session_id
        try:
            if current_analyzer.session_id:
                history_collection.update_one(
                    {'session_id': current_analyzer.session_id},
                    {'$set': {'overall_score': overall_score}}
                )
                print(f"✅ Updated short session {current_analyzer.session_id} with score {overall_score}")
        except Exception as e:
            print(f"⚠️ Failed to update session score: {e}")

        return jsonify(ai_report)

    print("🤖 Generating AI coaching report with Gemini...")
    ai_report = generate_ai_coaching_report(summary)

    # --- SAVE SCORE TO MONGODB ---
    try:
        # Helper to safely parse score
        def get_score(section):
            try:
                val = str(ai_report.get(section, {}).get('score', 0))
                return float(val.split('/')[0])
            except:
                return 0.0

        s1 = get_score('content_quality')
        s2 = get_score('body_language')
        s3 = get_score('eye_contact')
        s4 = get_score('vocal_delivery')

        # Calculate average (rounded to 1 decimal)
        overall_score = round((s1 + s2 + s3 + s4) / 4, 1)

        # Update the session in DB identified by session_id
        if current_analyzer.session_id:
            history_collection.update_one(
                {'session_id': current_analyzer.session_id},
                {'$set': {'overall_score': overall_score}}
            )
            print(f"✅ Updated session {current_analyzer.session_id} with score {overall_score}")

    except Exception as e:
        print(f"⚠️ Failed to update session score: {e}")

    return jsonify(ai_report)


@app.route('/api/analysis/quick-tips', methods=['GET'])
def get_quick_tips():
    """Get quick AI coaching tips"""
    if not current_analyzer:
        return jsonify({'error': 'No session data available'})

    summary = current_analyzer.get_summary()

    print("💡 Generating quick AI tips...")
    tips = get_quick_ai_tips(summary)

    return jsonify({'tips': tips})


# ==================== TOPICS ROUTE ====================

@app.route('/api/topics', methods=['GET'])
def get_topics():
    """Get available practice topics"""
    return jsonify(PRACTICE_TOPICS)


# ==================== VIDEO FEED ROUTE ====================

@app.route('/video_feed')
def video_feed():
    """MJPEG video stream endpoint"""
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'mongodb': 'connected' if mongo_client else 'disconnected',
        'camera': 'available',
        'timestamp': datetime.now().isoformat()
    })


# ==================== RUN SERVER ====================

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting Unified Flask Backend Server")
    print("=" * 50)
    print(f"📍 API Base URL: http://localhost:5000")
    print(f"🎥 Video Feed: http://localhost:5000/video_feed")
    print(f"🔐 Auth Endpoints: /api/auth/*")
    print(f"📊 Session Endpoints: /api/session/*")
    print(f"📈 Analysis Endpoints: /api/analysis/*")
    print("=" * 50)
    
    app.run(debug=True, threaded=True, port=5000)