# server/analysis_routes.py - Analysis & Reports Blueprint

from flask import Blueprint, request, jsonify
import numpy as np

# Import your existing modules
from nlp_module import generate_specific_recommendations
from gemini_analysis import generate_ai_coaching_report, get_quick_ai_tips
from topics_loader import PRACTICE_TOPICS

analysis_bp = Blueprint('analysis', __name__)

# Reference to current analyzer (set from app.py)
current_analyzer = None

def init_analysis(analyzer_getter):
    """Initialize analysis routes with current analyzer getter"""
    global get_analyzer
    get_analyzer = analyzer_getter


@analysis_bp.route('/report', methods=['GET'])
def get_report():
    """
    Get detailed performance report with metrics and recommendations
    
    Response:
    {
        "session_id": "20260122_143045",
        "duration": 180.5,
        "topic": "introduce_yourself",
        "is_custom": false,
        "posture": {
            "good_posture_percentage": 75.5,
            "total_frames_analyzed": 5432,
            "head_tilt_events": ["01:23: Head tilted left"],
            ...
        },
        "eye_contact": {
            "eye_contact_percentage": 68.2,
            "total_measurements": 1250
        },
        "gestures": {
            "hand_gesture_rate": 45.0,
            "total_gestures": 23,
            "average_interval": 4.5
        },
        "speech": {
            "total_words": 456,
            "filler_words": 23,
            "filler_word_percentage": 5.04,
            "words_per_minute": 152,
            "speaking_time": 180.5,
            "average_pause_duration": 1.2,
            "transcripts": [...],
            "speaking_pace_segments": [...]
        },
        "nlp_analysis": {
            "topic_relevance": 78.5,
            "uncensored_words": [...],
            "uncensored_word_count": 2,
            "off_topic_segments": [...],
            "off_topic_count": 1,
            "analysis_method": "TF-IDF"
        },
        "recommendations": [
            {
                "category": "Speech Clarity",
                "issue": "High filler word usage (23 words = 5.04%)",
                "suggestion": "Practice pausing instead of saying 'um', 'uh', 'like'...",
                "priority": "high",
                "specific_data": "Total words: 456"
            },
            ...
        ]
    }
    """
    try:
        analyzer = get_analyzer()
        
        if not analyzer:
            return jsonify({
                'status': 'error',
                'message': 'No session data available. Please complete a session first.'
            }), 400

        # Get session summary
        summary = analyzer.get_summary()

        # Calculate speech metrics
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

        # Build comprehensive report
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

        print(f"✅ Generated report for session: {report['session_id']}")
        return jsonify(report), 200

    except Exception as e:
        print(f"❌ Error generating report: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@analysis_bp.route('/ai-report', methods=['GET'])
def get_ai_report():
    """
    Generate detailed AI-powered coaching report using Gemini API
    
    Response:
    {
        "executive_summary": {
            "overall_score": "7",
            "key_strengths": [...],
            "critical_weaknesses": [...],
            "one_sentence_verdict": "..."
        },
        "detailed_analysis": {
            "body_language": {
                "score": "8",
                "what_went_wrong": [...],
                "why_it_matters": "...",
                "how_to_fix": [...],
                "practice_exercises": [...]
            },
            "eye_contact": {...},
            "vocal_delivery": {...},
            "content_quality": {...}
        },
        "timeline_breakdown": {
            "critical_moments": [
                {
                    "time": "01:23",
                    "issue": "Head tilted significantly to left",
                    "severity": "medium",
                    "fix": "Keep head centered and aligned with spine"
                },
                ...
            ]
        },
        "action_plan": {
            "immediate_fixes": [...],
            "week_1_goals": [...],
            "long_term_development": [...]
        },
        "motivation": {
            "what_you_did_well": [...],
            "realistic_next_milestone": "...",
            "encouraging_note": "..."
        },
        "metadata": {
            "session_id": "20260122_143045",
            "duration": 180.5,
            "topic": "introduce_yourself",
            "generated_by": "Gemini AI",
            "timestamp": "03:00"
        }
    }
    """
    try:
        analyzer = get_analyzer()
        
        if not analyzer:
            return jsonify({
                'status': 'error',
                'message': 'No session data available. Please complete a session first.'
            }), 400

        summary = analyzer.get_summary()

        print("🤖 Generating AI coaching report with Gemini...")
        ai_report = generate_ai_coaching_report(summary)

        if ai_report.get('error'):
            print(f"⚠️  AI report generation failed: {ai_report.get('message')}")
            return jsonify({
                'status': 'error',
                'error': ai_report.get('error'),
                'message': ai_report.get('message'),
                'raw_analysis': ai_report.get('raw_analysis')
            }), 500

        print(f"✅ AI report generated successfully")
        return jsonify(ai_report), 200

    except Exception as e:
        print(f"❌ Error generating AI report: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@analysis_bp.route('/quick-tips', methods=['GET'])
def get_quick_tips():
    """
    Get quick AI coaching tips (faster, less detailed than full AI report)
    
    Response:
    {
        "tips": [
            "Practice maintaining eye contact with the camera lens",
            "Reduce filler words by pausing instead",
            "Improve posture by sitting upright with shoulders back"
        ]
    }
    """
    try:
        analyzer = get_analyzer()
        
        if not analyzer:
            return jsonify({
                'status': 'error',
                'message': 'No session data available'
            }), 400

        summary = analyzer.get_summary()

        print("💡 Generating quick AI tips...")
        tips = get_quick_ai_tips(summary)

        return jsonify({
            'tips': tips
        }), 200

    except Exception as e:
        print(f"❌ Error generating quick tips: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@analysis_bp.route('/topics', methods=['GET'])
def get_topics():
    """
    Get available practice topics
    
    Response:
    {
        "interview_prep": {
            "title": "Interview Preparation",
            "icon": "💼",
            "display_name": "Interview Prep",
            "subtopics": {
                "introduce_yourself": {
                    "title": "Introduce Yourself",
                    "display_name": "Introduce Yourself",
                    "points": [...],
                    "keywords": [...]
                },
                ...
            }
        },
        ...
    }
    """
    return jsonify(PRACTICE_TOPICS), 200


@analysis_bp.route('/topics/<main_topic>', methods=['GET'])
def get_topic_details(main_topic):
    """
    Get details for specific main topic
    
    Response:
    {
        "title": "Interview Preparation",
        "icon": "💼",
        "display_name": "Interview Prep",
        "subtopics": {...}
    }
    """
    topic = PRACTICE_TOPICS.get(main_topic)
    
    if topic:
        return jsonify(topic), 200
    else:
        return jsonify({
            'status': 'error',
            'message': 'Topic not found'
        }), 404


@analysis_bp.route('/topics/<main_topic>/<subtopic_id>', methods=['GET'])
def get_subtopic_details(main_topic, subtopic_id):
    """
    Get details for specific subtopic
    
    Response:
    {
        "title": "Introduce Yourself",
        "display_name": "Introduce Yourself",
        "points": [
            "Start with your name and current role/status",
            "Mention your educational background briefly",
            ...
        ],
        "keywords": [
            "name", "background", "education", ...
        ]
    }
    """
    topic = PRACTICE_TOPICS.get(main_topic)
    
    if not topic:
        return jsonify({
            'status': 'error',
            'message': 'Main topic not found'
        }), 404
    
    subtopic = topic.get('subtopics', {}).get(subtopic_id)
    
    if subtopic:
        return jsonify(subtopic), 200
    else:
        return jsonify({
            'status': 'error',
            'message': 'Subtopic not found'
        }), 404


@analysis_bp.route('/summary', methods=['GET'])
def get_summary():
    """
    Get quick summary of current/last session
    
    Response:
    {
        "session_id": "20260122_143045",
        "duration": 180.5,
        "topic": "introduce_yourself",
        "scores": {
            "posture": 75.5,
            "eye_contact": 68.2,
            "gestures": 45.0,
            "topic_relevance": 78.5
        },
        "overall_grade": "B+"
    }
    """
    try:
        analyzer = get_analyzer()
        
        if not analyzer:
            return jsonify({
                'status': 'error',
                'message': 'No session data available'
            }), 400

        summary = analyzer.get_summary()

        # Calculate overall grade
        scores = [
            summary['posture']['good_posture_percentage'],
            summary['eye_contact']['eye_contact_percentage'],
            summary['gestures']['hand_gesture_rate'],
            summary['nlp_analysis']['average_topic_relevance']
        ]
        avg_score = sum(scores) / len(scores)

        if avg_score >= 90:
            grade = "A+"
        elif avg_score >= 85:
            grade = "A"
        elif avg_score >= 80:
            grade = "B+"
        elif avg_score >= 75:
            grade = "B"
        elif avg_score >= 70:
            grade = "C+"
        elif avg_score >= 65:
            grade = "C"
        else:
            grade = "D"

        return jsonify({
            'session_id': summary['session_id'],
            'duration': summary['duration'],
            'topic': summary.get('topic', 'Unknown'),
            'scores': {
                'posture': summary['posture']['good_posture_percentage'],
                'eye_contact': summary['eye_contact']['eye_contact_percentage'],
                'gestures': summary['gestures']['hand_gesture_rate'],
                'topic_relevance': summary['nlp_analysis']['average_topic_relevance']
            },
            'overall_grade': grade
        }), 200

    except Exception as e:
        print(f"❌ Error generating summary: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500