# server/session_routes.py - Session Management Blueprint

from flask import Blueprint, request, jsonify
import threading
import time

# Import your existing modules
from session_analyzer import SessionAnalyzer
from speech_module import speech_recognition_thread

session_bp = Blueprint('session', __name__)

# Global session state
sessions_history = []
current_analyzer = None
is_recording = False


def get_current_analyzer():
    """Getter for current analyzer (used by speech thread)"""
    return current_analyzer


def get_is_recording():
    """Getter for recording flag (used by speech thread)"""
    return is_recording


@session_bp.route('/start', methods=['POST'])
def start_session():
    """
    Start a new assessment session
    
    Request Body:
    {
        "topic": "introduce_yourself",
        "is_custom": false
    }
    
    Response:
    {
        "status": "success",
        "session_id": "20260122_143045"
    }
    """
    global is_recording, current_analyzer

    try:
        data = request.get_json()
        selected_topic = data.get('topic', None)
        is_custom = data.get('is_custom', False)

        if not selected_topic:
            return jsonify({
                'status': 'error',
                'message': 'Topic is required'
            }), 400

        # Create new session analyzer
        current_analyzer = SessionAnalyzer(
            selected_topic=selected_topic,
            is_custom=is_custom
        )

        # Start recording
        is_recording = True

        # Start speech recognition in background thread
        speech_thread = threading.Thread(
            target=speech_recognition_thread,
            args=(get_current_analyzer, get_is_recording),
            daemon=True
        )
        speech_thread.start()

        print(f"✅ Session started: {current_analyzer.session_id}")
        print(f"📋 Topic: {selected_topic} (custom: {is_custom})")

        return jsonify({
            'status': 'success',
            'session_id': current_analyzer.session_id,
            'topic': selected_topic,
            'is_custom': is_custom
        }), 200

    except Exception as e:
        print(f" Error starting session: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@session_bp.route('/stop', methods=['POST'])
def stop_session():
    """
    Stop the current assessment session
    
    Response:
    {
        "status": "success",
        "summary": {
            "session_id": "20260122_143045",
            "duration": 180.5,
            "posture": {...},
            "speech": {...},
            ...
        }
    }
    """
    global is_recording, current_analyzer, sessions_history

    try:
        # Stop recording
        is_recording = False

        if not current_analyzer:
            return jsonify({
                'status': 'error',
                'message': 'No active session to stop'
            }), 400

        # Calculate final speaking time
        current_analyzer.speech_data['speaking_time'] = \
            time.time() - current_analyzer.start_time

        # Generate session summary
        summary = current_analyzer.get_summary()
        
        # Add to history
        sessions_history.append(summary)

        print(f"✅ Session stopped: {summary['session_id']}")
        print(f"⏱️  Duration: {summary['duration']:.1f}s")
        print(f"📊 Posture: {summary['posture']['good_posture_percentage']:.1f}%")
        print(f"👁️  Eye Contact: {summary['eye_contact']['eye_contact_percentage']:.1f}%")

        return jsonify({
            'status': 'success',
            'summary': summary
        }), 200

    except Exception as e:
        print(f"❌ Error stopping session: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@session_bp.route('/status', methods=['GET'])
def get_session_status():
    """
    Get current session status
    
    Response:
    {
        "is_recording": true,
        "session_id": "20260122_143045",
        "elapsed_time": 45.2
    }
    """
    global is_recording, current_analyzer

    if current_analyzer and is_recording:
        elapsed = time.time() - current_analyzer.start_time
        return jsonify({
            'is_recording': True,
            'session_id': current_analyzer.session_id,
            'elapsed_time': round(elapsed, 2)
        }), 200
    else:
        return jsonify({
            'is_recording': False,
            'session_id': None,
            'elapsed_time': 0
        }), 200


@session_bp.route('/history', methods=['GET'])
def get_history():
    """
    Get all session history
    
    Response:
    {
        "sessions": [
            {
                "session_id": "20260122_143045",
                "duration": 180.5,
                "topic": "introduce_yourself",
                "posture": {...},
                ...
            },
            ...
        ]
    }
    """
    return jsonify({
        'sessions': sessions_history,
        'total_sessions': len(sessions_history)
    }), 200


@session_bp.route('/history/<session_id>', methods=['GET'])
def get_session_by_id(session_id):
    """
    Get specific session by ID
    
    Response:
    {
        "session": {
            "session_id": "20260122_143045",
            ...
        }
    }
    """
    # Find session in history
    session = next(
        (s for s in sessions_history if s['session_id'] == session_id),
        None
    )
    
    if session:
        return jsonify({
            'session': session
        }), 200
    else:
        return jsonify({
            'status': 'error',
            'message': 'Session not found'
        }), 404


@session_bp.route('/history/clear', methods=['DELETE'])
def clear_history():
    """
    Clear all session history
    
    Response:
    {
        "status": "success",
        "message": "History cleared",
        "sessions_deleted": 5
    }
    """
    global sessions_history
    
    count = len(sessions_history)
    sessions_history = []
    
    return jsonify({
        'status': 'success',
        'message': 'History cleared',
        'sessions_deleted': count
    }), 200


@session_bp.route('/metrics', methods=['GET'])
def get_live_metrics():
    """
    Get real-time metrics during active session
    
    Response:
    {
        "posture": {
            "good_posture_percentage": 75.5,
            "total_frames": 1250
        },
        "eye_contact": {
            "eye_contact_percentage": 68.2
        },
        "gestures": {
            "hand_gesture_rate": 45.0,
            "total_gestures": 23
        },
        "speech": {
            "total_words": 156,
            "filler_words": 8
        }
    }
    """
    global current_analyzer, is_recording

    if not is_recording or not current_analyzer:
        return jsonify({
            'status': 'error',
            'message': 'No active session'
        }), 400

    try:
        # Get partial summary for live metrics
        total_posture = current_analyzer.good_posture_count + current_analyzer.bad_posture_count
        posture_pct = (
            round((current_analyzer.good_posture_count / total_posture) * 100, 2)
            if total_posture > 0 else 0.0
        )

        eye_contact_pct = (
            round(sum(current_analyzer.eye_contact_scores) / len(current_analyzer.eye_contact_scores) * 100, 2)
            if current_analyzer.eye_contact_scores else 0.0
        )

        # Calculate gesture quality
        gesture_quality = 0.0
        if current_analyzer.gesture_timing_intervals:
            good_intervals = sum(
                1 if 0.3 <= interval <= 2.0 else 
                0.6 if 2.0 < interval <= 5.0 else 
                0.3 if 5.0 < interval <= 10.0 else 0
                for interval in current_analyzer.gesture_timing_intervals
            )
            gesture_quality = round(
                (good_intervals / len(current_analyzer.gesture_timing_intervals)) * 100, 2
            )

        return jsonify({
            'posture': {
                'good_posture_percentage': posture_pct,
                'total_frames': total_posture
            },
            'eye_contact': {
                'eye_contact_percentage': eye_contact_pct,
                'total_measurements': len(current_analyzer.eye_contact_scores)
            },
            'gestures': {
                'hand_gesture_rate': gesture_quality,
                'total_gestures': current_analyzer.hand_gesture_count
            },
            'speech': {
                'total_words': current_analyzer.speech_data['total_words'],
                'filler_words': current_analyzer.speech_data['filler_words']
            }
        }), 200

    except Exception as e:
        print(f"❌ Error getting live metrics: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500