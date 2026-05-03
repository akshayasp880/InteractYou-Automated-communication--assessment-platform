# nlp_module.py
import json
import re
import time
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline

# ---------- HuggingFace model ----------
print("Loading HuggingFace model for custom topics...")
try:
    classifier = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        device=0
    )
    print("HuggingFace model loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load HuggingFace model: {e}")
    classifier = None


def load_uncensored_words():
    try:
        with open('uncensored_words.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        default_words = {
            "profanity": [
                "damn", "hell", "crap", "stupid", "dumb", "idiot", "moron",
                "suck", "sucks", "bullshit", "shit", "fuck", "ass", "bitch"
            ],
            "unprofessional": [
                "whatever", "anyways", "gonna", "wanna", "gotta", "kinda",
                "sorta", "yeah", "nope", "yep", "dunno", "lemme"
            ],
            "discriminatory": [
                "guys"
            ]
        }
        with open('uncensored_words.json', 'w') as f:
            json.dump(default_words, f, indent=4)
        return default_words

UNCENSORED_WORDS = load_uncensored_words()


def check_uncensored_words(text, timestamp):
    uncensored_found = []
    text_lower = text.lower()
    for category, words in UNCENSORED_WORDS.items():
        for word in words:
            pattern = r'\b' + re.escape(word.lower()) + r'\b'
            if re.search(pattern, text_lower):
                uncensored_found.append({
                    'word': word,
                    'category': category,
                    'timestamp': timestamp,
                    'context': text[:50] + '...'
                })
    return uncensored_found


class TopicAnalyzer:
    """Handles topic relevance via TF-IDF or HuggingFace."""

    def __init__(self, topic_reference_text=None, is_custom=False):
        self.is_custom = is_custom
        self.topic_reference_text = topic_reference_text
        self.vectorizer = None
        if not is_custom:
            self.vectorizer = TfidfVectorizer(stop_words='english')

    def relevance_tfidf(self, text):
        if not self.topic_reference_text or not text.strip() or self.vectorizer is None:
            return 0.0
        try:
            docs = [self.topic_reference_text, text.lower()]
            tfidf_matrix = self.vectorizer.fit_transform(docs)
            similarity = cosine_similarity(
                tfidf_matrix[0:1], tfidf_matrix[1:2]
            )[0][0]
            return round(similarity * 100, 2)
        except Exception as e:
            print(f"TF-IDF error: {e}")
            return 0.0

    def relevance_huggingface(self, text):
        if not classifier or not text.strip() or not self.topic_reference_text:
            return 0.0
        try:
            result = classifier(
                text,
                candidate_labels=[self.topic_reference_text, "unrelated topic"]
            )
            idx = result['labels'].index(self.topic_reference_text)
            score = result['scores'][idx] * 100
            return round(score, 2)
        except Exception as e:
            print(f"HuggingFace error: {e}")
            return 0.0

    def calculate_topic_relevance(self, text):
        if self.is_custom:
            return self.relevance_huggingface(text)
        return self.relevance_tfidf(text)


def format_time(seconds):
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins}:{secs:02d}"


def generate_specific_recommendations(summary, filler_percentage, wpm):
    """Same logic as before, but isolated in this module."""
    recommendations = []

    posture = summary['posture']
    eye_contact = summary['eye_contact']
    gestures = summary['gestures']
    nlp = summary['nlp_analysis']
    speech = summary['speech']

    topic_relevance = nlp['average_topic_relevance']
    if topic_relevance < 40:
        off_topic_times = [
            format_time(seg['timestamp'])
            for seg in speech['off_topic_segments'][:3]
        ]
        recommendations.append({
            'category': 'Content Relevance',
            'issue': (
                f'Very low topic relevance ({topic_relevance}%). '
                f'You went off-topic {nlp["off_topic_count"]} times.'
            ),
            'suggestion': (
                f'Major drift detected at: {", ".join(off_topic_times)}. '
                'Review your content and stay focused on the selected topic. '
                'Use topic-specific terminology consistently.'
            ),
            'priority': 'high',
            'specific_data': f'Analysis method: {nlp["analysis_method"]}'
        })
    elif topic_relevance < 60:
        recommendations.append({
            'category': 'Content Relevance',
            'issue': f'Moderate topic relevance ({topic_relevance}%)',
            'suggestion': (
                f'You stayed somewhat on topic but had '
                f'{nlp["off_topic_count"]} deviations. '
                'Use more specific keywords related to your topic.'
            ),
            'priority': 'medium',
            'specific_data': f'Analysis method: {nlp["analysis_method"]}'
        })

    if nlp['uncensored_word_count'] > 0:
        uncensored_details = []
        for item in nlp['uncensored_words'][:5]:
            uncensored_details.append(
                f'"{item["word"]}" at {format_time(item["timestamp"])} '
                f'({item["category"]})'
            )
        recommendations.append({
            'category': 'Professionalism',
            'issue': (
                f'Used {nlp["uncensored_word_count"]} unprofessional word(s)'
            ),
            'suggestion': (
                f'Detected: {"; ".join(uncensored_details)}. '
                'Replace casual language with formal alternatives.'
            ),
            'priority': 'high',
            'specific_data': 'Maintain professional tone throughout'
        })

    if posture.get('good_posture_percentage', 0) < 70:
        recommendations.append({
            'category': 'Posture',
            'issue': (
                'Posture was poor for a large part of the session '
                f'({100 - posture.get("good_posture_percentage", 0):.0f}% ).'
            ),
            'suggestion': (
                'Sit upright, shoulders back, head centered. '
                'Practice in front of a camera or mirror.'
            ),
            'priority': 'high',
            'specific_data': ''
        })

    if eye_contact.get('eye_contact_percentage', 0) < 60:
        recommendations.append({
            'category': 'Eye Contact',
            'issue': (
                'Low eye contact '
                f'({eye_contact.get("eye_contact_percentage", 0):.0f}%)'
            ),
            'suggestion': (
                'Look directly at the camera lens, not the screen. '
                'Imagine speaking to a person behind the camera.'
            ),
            'priority': 'high',
            'specific_data':
                'Position camera at eye level for natural eye contact'
        })

    if gestures.get('hand_gesture_rate', 0) < 30:
        recommendations.append({
            'category': 'Body Language',
            'issue': (
                'Limited hand gestures '
                f'({gestures.get("hand_gesture_rate", 0):.0f}% visibility)'
            ),
            'suggestion': (
                'Use natural hand movements to emphasize key points. '
                'Keep hands visible and animated.'
            ),
            'priority': 'low',
            'specific_data':
                'Hands visible: ' + str(gestures.get('total_gestures', 0)) +
                ' frames'
        })
    elif gestures.get('hand_gesture_rate', 0) > 80:
        recommendations.append({
            'category': 'Body Language',
            'issue': (
                'Excessive hand movements '
                f'({gestures.get("hand_gesture_rate", 0):.0f}%)'
            ),
            'suggestion': (
                'Reduce hand gestures. Too much movement is distracting. '
                'Use purposeful, controlled gestures.'
            ),
            'priority': 'medium',
            'specific_data':
                'Moderate your gestures to 50-70% visibility'
        })

    filler_words = speech.get('filler_words', 0)
    if filler_percentage > 5:
        recommendations.append({
            'category': 'Speech Clarity',
            'issue': (
                'High filler word usage ('
                f'{filler_words} words = {filler_percentage}%)'
            ),
            'suggestion': (
                f'You used filler words {filler_words} times. '
                'Practice pausing instead of saying "um", "uh", "like". '
                'Silence is better than fillers.'
            ),
            'priority': 'high',
            'specific_data':
                f'Total words: {speech.get("total_words", 0)}'
        })

    if wpm < 120 and wpm > 0:
        recommendations.append({
            'category': 'Speech Pace',
            'issue': f'Overall pace too slow ({wpm} WPM)',
            'suggestion': (
                'Increase pace to 130–150 WPM while keeping clarity. '
                'Practice speaking a bit faster with clear articulation.'
            ),
            'priority': 'medium',
            'specific_data': 'Target: 130–150 WPM for optimal clarity'
        })
    elif wpm > 160:
        recommendations.append({
            'category': 'Speech Pace',
            'issue': f'Speaking too fast ({wpm} WPM)',
            'suggestion': (
                'Slow down to around 130–150 WPM. '
                'Add small pauses between key points.'
            ),
            'priority': 'high',
            'specific_data': 'Fast speech reduces clarity and comprehension'
        })

    if not recommendations:
        recommendations.append({
            'category': 'Overall Performance',
            'issue': 'Excellent communication skills demonstrated!',
            'suggestion': (
                'You maintained good posture, clear speech, '
                'professional language, and stayed on topic.'
            ),
            'priority': 'success',
            'specific_data': (
                f'Session duration: {summary.get("duration", 0):.0f}s'
            )
        })

    priority_order = {'high': 0, 'medium': 1, 'low': 2, 'success': 3}
    recommendations.sort(
        key=lambda x: priority_order.get(x['priority'], 99)
    )
    return recommendations
