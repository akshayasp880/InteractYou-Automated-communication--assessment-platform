# gemini_analysis.py

import os
# gemini_analysis.py

import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv('API_key')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('models/gemini-flash-latest')
    print("✅ Gemini AI configured successfully")
else:
    model = None
    print("⚠️  Gemini API key not found in .env file")


def generate_ai_coaching_report(session_summary):

    if not model:
        return {
            'error': 'Gemini API not configured',
            'message': 'Please add API_key to .env file'
        }

    # Build comprehensive prompt
    prompt = _build_analysis_prompt(session_summary)

    try:
        # Generate AI analysis
        response = model.generate_content(prompt)

        # Parse and structure the response
        analysis = _parse_ai_response(response.text, session_summary)

        return analysis

    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return {
            'error': str(e),
            'message': 'Failed to generate AI analysis'
        }


def _build_analysis_prompt(summary):
    """Build detailed prompt for Gemini AI."""

    # Extract key metrics
    posture_pct = summary['posture'].get('good_posture_percentage', 0)
    eye_contact_pct = summary['eye_contact'].get('eye_contact_percentage', 0)
    gesture_rate = summary['gestures'].get('hand_gesture_rate', 0)
    topic_relevance = summary['nlp_analysis'].get('average_topic_relevance', 0)

    # Timestamped issues
    head_tilts = summary['posture'].get('head_tilt_events', [])
    shoulder_issues = summary['posture'].get('shoulder_misalignment_events', [])
    engagement_issues = summary['engagement'].get('engagement_issues', [])

    # Speech metrics
    speech = summary['speech']
    filler_count = speech.get('filler_words', 0)
    total_words = speech.get('total_words', 0)
    off_topic_segments = speech.get('off_topic_segments', [])
    uncensored_words = speech.get('uncensored_words_used', [])

    # Calculate additional metrics
    duration_mins = round(summary.get('duration', 0) / 60, 1)
    filler_pct = round((filler_count / total_words * 100), 1) if total_words > 0 else 0

    prompt = f"""You are an expert presentation coach analyzing a {duration_mins}-minute practice session. 
Your task is to provide detailed, actionable feedback in a structured JSON format.

## SESSION METRICS:
- Topic: {summary.get('topic', 'Not specified')}
- Duration: {duration_mins} minutes
- Total words spoken: {total_words}

### POSTURE & BODY LANGUAGE:
- Good posture: {posture_pct}%
- Eye contact: {eye_contact_pct}%
- Gesture effectiveness: {gesture_rate}%

### TIMESTAMPED POSTURE ISSUES:
{chr(10).join(['- ' + evt for evt in head_tilts[:5]]) if head_tilts else '- None detected'}

{chr(10).join(['- ' + evt for evt in shoulder_issues[:5]]) if shoulder_issues else ''}

### ENGAGEMENT ISSUES:
{chr(10).join(['- ' + evt for evt in engagement_issues[:5]]) if engagement_issues else '- Maintained good camera engagement'}

### SPEECH QUALITY:
- Filler words: {filler_count} times ({filler_pct}%)
- Topic relevance: {topic_relevance}%
- Unprofessional language: {len(uncensored_words)} instances
{chr(10).join(['  - "' + w['word'] + '" at ' + _format_timestamp(w['timestamp']) for w in uncensored_words[:3]]) if uncensored_words else ''}

### OFF-TOPIC MOMENTS:
{chr(10).join(['- ' + _format_timestamp(seg['timestamp']) + ': "' + seg['text'][:80] + '..."' for seg in off_topic_segments[:3]]) if off_topic_segments else '- Stayed on topic throughout'}

## YOUR TASK:
Generate a detailed coaching report in the following JSON structure:

{{
  "executive_summary": {{
    "overall_score": "A score from 1-10",
    "key_strengths": ["strength 1", "strength 2", "strength 3"],
    "critical_weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "one_sentence_verdict": "A single powerful sentence summarizing the performance"
  }},

    "detailed_analysis": {{
    "body_language": {{
      "score": "1-10",
      "what_went_wrong": ["specific issue 1 with timestamp (e.g., 'Slouched at 0:45')", "issue 2", ...],
      "why_it_matters": "Comprehensive explanation of how this affects authority and engagement. Do not return 'undefined'.",
      "how_to_fix": ["Detailed actionable step 1", "step 2", "step 3"],
      "practice_exercises": ["exercise 1", "exercise 2"]
    }},

    "eye_contact": {{
      "score": "1-10",
      "what_went_wrong": ["specific patterns observed (e.g., 'Looked away frequently')"],
      "why_it_matters": "Explain the psychological impact of eye contact on trust. Do not return 'undefined'.",
      "how_to_fix": ["technique 1 (e.g., 'Sticky note method')", "technique 2"],
      "practice_exercises": ["exercise"]
    }},

    "vocal_delivery": {{
      "score": "1-10",
      "filler_word_analysis": "Detailed analysis of usage (e.g., 'Used um 5 times in first minute')",
      "what_went_wrong": ["specific speech issues (pace, tone, fillers)"],
      "why_it_matters": "Explain how vocal quality affects clarity and listener retention. Do not return 'undefined'.",
      "how_to_fix": ["technique 1", "technique 2"],
      "practice_exercises": ["exercise"]
    }},

    "content_quality": {{
      "score": "Number 1-10 (e.g., 7)",
      "relevance_analysis": "Detailed analysis of topic adherence",
      "what_went_wrong": ["content issues"],
      "why_it_matters": "Explain importance. Do not return 'undefined'.",
      "how_to_fix": ["improvement 1", "improvement 2"],
      "key_missing_points": ["Specific point 1 you should have added", "Point 2"],
      "tone_upgrade_suggestions": ["Suggestion 1 (e.g., 'Use more enthusiasm here')", "Suggestion 2"],
      "practice_exercises": ["exercise"]
    }}
  }},

  "timeline_breakdown": {{
    "critical_moments": [
      {{
        "time": "MM:SS format",
        "issue": "What happened",
        "severity": "high/medium/low",
        "fix": "What should have been done instead"
      }}
    ]
  }},

  "action_plan": {{
    "immediate_fixes": ["Fix 1 (detailed)", "Fix 2", "Fix 3"],
    "week_1_goals": ["Goal 1", "Goal 2", "Goal 3"],
    "long_term_development": ["Skill 1", "Skill 2"]
  }},

  "motivation": {{
    "what_you_did_well": ["Positive reinforcement 1", "2", "3"],
    "realistic_next_milestone": "Specific, achievable goal for next session",
    "encouraging_note": "Motivational closing message"
  }}
}}

**IMPORTANT RULES**: 
1. **BE DESCRIPTIVE**: Avoid one-word answers. Explain "Why it matters" in 2-3 sentences.
2. **NO 'UNDEFINED'**: If data is missing (e.g., 0 duration), explain that the metric couldn't be measured due to lack of input, rather than saying 'undefined'.
3. **SPECIFICITY**: Reference specific timestamps and examples from the data.
4. **JSON ONLY**: Return ONLY valid JSON, no markdown formatting.
5. **SCORES**: Return valid integers ONLY. **CRITICAL**: To keep feedback encouraging, ALL scores must be between **4 and 10**. Never result a score below 4, even for poor performance.
"""

    return prompt


def _format_timestamp(seconds):
    """Convert seconds to MM:SS format."""
    if isinstance(seconds, str):
        return seconds
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


def _parse_ai_response(response_text, summary):
    """Parse and validate AI response."""

    try:
        # Remove markdown code blocks if present
        cleaned = response_text.strip()
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        if cleaned.startswith('```'):
            cleaned = cleaned[3:]
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]

        cleaned = cleaned.strip()

        # Parse JSON
        analysis = json.loads(cleaned)

        # Add metadata
        analysis['metadata'] = {
            'session_id': summary.get('session_id'),
            'duration': summary.get('duration'),
            'topic': summary.get('topic'),
            'generated_by': 'Gemini AI',
            'timestamp': _format_timestamp(summary.get('duration', 0))
        }

        return analysis

    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parsing error: {e}")
        # Return raw text as fallback
        return {
            'error': 'JSON parsing failed',
            'raw_analysis': response_text,
            'message': 'AI generated response but it could not be parsed as JSON'
        }


def get_quick_ai_tips(session_summary):
    """
    Generate quick coaching tips (faster, less detailed).
    """

    if not model:
        return ["AI coaching not available - configure Gemini API key"]

    prompt = f"""As a presentation coach, give 3 specific, actionable tips to improve this presentation:

Posture: {session_summary['posture'].get('good_posture_percentage', 0)}%
Eye Contact: {session_summary['eye_contact'].get('eye_contact_percentage', 0)}%
Filler Words: {session_summary['speech'].get('filler_words', 0)}
Topic Relevance: {session_summary['nlp_analysis'].get('average_topic_relevance', 0)}%

Return ONLY 3 tips as a JSON array:
["Tip 1", "Tip 2", "Tip 3"]
"""

    try:
        response = model.generate_content(prompt)
        tips = json.loads(response.text.strip())
        return tips
    except:
        return [
            "Practice maintaining eye contact with the camera lens",
            "Reduce filler words by pausing instead",
            "Improve posture by sitting upright with shoulders back"
        ]
