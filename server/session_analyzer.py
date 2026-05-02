# session_analyzer.py

import time
import numpy as np
from datetime import datetime

from nlp_module import TopicAnalyzer, check_uncensored_words
from topics_loader import PRACTICE_TOPICS


class SessionAnalyzer:
    def __init__(self, selected_topic=None, is_custom=False):
        self.good_posture_count = 0
        self.bad_posture_count = 0

        self.eye_contact_scores = []
        self.eye_contact_events = []

        self.hand_gesture_count = 0
        self.hand_visible_frames = 0
        self.last_gesture_timestamp = None
        self.gesture_timing_intervals = []

        self.posture_events = []
        self.engagement_events = []

        self.speech_data = {
            'transcripts': [],
            'filler_words': 0,
            'total_words': 0,
            'speaking_time': 0.0,
            'pauses': [],
            'volume_levels': [],
            'uncensored_words_used': [],
            'topic_relevance_scores': [],
            'off_topic_segments': [],
            'speaking_pace_segments': [],
        }

        self.selected_topic = selected_topic
        self.is_custom_topic = is_custom

        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.start_time = time.time()

        if not is_custom:
            self.topic_keywords = self._get_topic_keywords()
            topic_ref = ' '.join(self.topic_keywords) if self.topic_keywords else None
            self.topic_analyzer = TopicAnalyzer(
                topic_reference_text=topic_ref,
                is_custom=False,
            )
        else:
            self.topic_keywords = None
            self.topic_analyzer = TopicAnalyzer(
                topic_reference_text=selected_topic,
                is_custom=True,
            )

    def _get_topic_keywords(self):
        if self.is_custom_topic:
            return None

        for main_topic, main_data in PRACTICE_TOPICS.items():
            if 'subtopics' in main_data:
                for subtopic_id, subtopic_data in main_data['subtopics'].items():
                    if subtopic_id == self.selected_topic:
                        return subtopic_data.get('keywords', [])
        return []

    def register_posture_label(self, posture_label):
        if posture_label.startswith("Good"):
            self.good_posture_count += 1
        else:
            self.bad_posture_count += 1

    def register_eye_contact(self, is_eye_contact, timestamp=None):
        self.eye_contact_scores.append(1 if is_eye_contact else 0)

        if timestamp and is_eye_contact:
            self.eye_contact_events.append({
                'timestamp': timestamp,
                'status': 'good_eye_contact',
            })

    def register_posture_event(self, event):
        self.posture_events.append(event)

    def register_engagement_event(self, event):
        self.engagement_events.append(event)

    def register_gesture(self, visible=True):
        """Register gesture event and track timing intervals."""
        if visible:
            self.hand_gesture_count += 1
            self.hand_visible_frames += 1
            print(f"💾 SessionAnalyzer: Gesture #{self.hand_gesture_count} registered")

            current_time = time.time()
            if self.last_gesture_timestamp is None:
                self.last_gesture_timestamp = current_time
            else:
                interval = current_time - self.last_gesture_timestamp
                self.gesture_timing_intervals.append(interval)
                print(f"   ⏱️  Interval: {interval:.1f}s")
                self.last_gesture_timestamp = current_time

    def analyze_speech_content(self, text, timestamp):
        uncensored = check_uncensored_words(text, timestamp)
        if uncensored:
            self.speech_data['uncensored_words_used'].extend(uncensored)

        relevance = self.topic_analyzer.calculate_topic_relevance(text)
        self.speech_data['topic_relevance_scores'].append(relevance)

        if relevance < 20 and len(text.split()) > 5:
            self.speech_data['off_topic_segments'].append({
                'text': text,
                'timestamp': timestamp,
                'relevance': relevance,
            })

        return {
            'uncensored_count': len(uncensored),
            'topic_relevance': relevance,
        }

    def track_speaking_pace(self, word_count, timestamp, duration):
        if duration > 0:
            wpm = (word_count / duration) * 60.0
            self.speech_data['speaking_pace_segments'].append({
                'timestamp': timestamp,
                'wpm': round(wpm, 1),
                'duration': round(duration, 1),
            })

    def _consolidate_events(self, events, window_seconds=3):
        if not events:
            return []

        consolidated = []
        current_event = None

        for event in sorted(events, key=lambda x: x['timestamp']):
            if current_event is None:
                current_event = {
                    'start': event['timestamp'],
                    'end': event['timestamp'],
                    'type': event['type'],
                    'description': event['description'],
                }
            elif (
                    event['type'] == current_event['type']
                    and self._time_diff(current_event['end'], event['timestamp'])
                    <= window_seconds
            ):
                current_event['end'] = event['timestamp']
            else:
                consolidated.append(current_event)
                current_event = {
                    'start': event['timestamp'],
                    'end': event['timestamp'],
                    'type': event['type'],
                    'description': event['description'],
                }

        if current_event:
            consolidated.append(current_event)

        formatted = []
        for evt in consolidated:
            if evt['start'] == evt['end']:
                formatted.append(f"{evt['start']}: {evt['description']}")
            else:
                formatted.append(f"{evt['start']} - {evt['end']}: {evt['description']}")
        return formatted

    def _time_diff(self, time1, time2):
        def to_seconds(time_str):
            m, s = time_str.split(':')
            return int(m) * 60 + int(s)

        return abs(to_seconds(time2) - to_seconds(time1))

    def get_summary(self):
        total_posture_frames = self.good_posture_count + self.bad_posture_count

        if total_posture_frames == 0:
            good_posture_percentage = 0.0
        else:
            good_posture_percentage = round(
                (self.good_posture_count / total_posture_frames) * 100.0, 2
            )

        session_duration = time.time() - self.start_time

        if self.speech_data['topic_relevance_scores']:
            avg_topic_relevance = round(
                float(np.mean(self.speech_data['topic_relevance_scores'])), 2
            )
        else:
            avg_topic_relevance = 0.0

        if self.eye_contact_scores:
            eye_contact_percentage = round(
                float(np.mean(self.eye_contact_scores) * 100.0), 2
            )
        else:
            eye_contact_percentage = 0.0

        # FIXED: Gesture quality scoring for continuous movement detection
        gesture_quality_percentage = 0.0
        avg_gesture_interval = 0.0

        if session_duration > 0:
            # New Frequency-Based Scoring (Gestures Per Minute)
            gpm = (self.hand_gesture_count / session_duration) * 60.0
            
            # Map GPM to a percentage score
            # Target: 10-30 gestures/min = 100%
            if gpm >= 10:
                gesture_quality_percentage = min(100.0, 100.0)
            elif gpm > 0:
                # Scale linearly from 0 to 100 for 0-10 GPM
                gesture_quality_percentage = round((gpm / 10.0) * 100.0, 2)
            else:
                gesture_quality_percentage = 0.0

            avg_gesture_interval = round(np.mean(self.gesture_timing_intervals), 1) if self.gesture_timing_intervals else 0.0
        else:
            gesture_quality_percentage = 0.0

        head_tilt_events = [
            e for e in self.posture_events if e.get('type') == 'head_tilt'
        ]
        shoulder_events = [
            e for e in self.posture_events if e.get('type') == 'shoulder_misalignment'
        ]
        other_posture_events = [
            e for e in self.posture_events
            if e.get('type') not in ['head_tilt', 'shoulder_misalignment']
        ]

        # Resolve topic display name
        display_topic = self.selected_topic
        if not self.is_custom_topic:
             for main_topic, main_data in PRACTICE_TOPICS.items():
                if 'subtopics' in main_data:
                    subtopics = main_data['subtopics']
                    if self.selected_topic in subtopics:
                        display_topic = subtopics[self.selected_topic].get('title', self.selected_topic)
                        break

        summary = {
            'session_id': self.session_id,
            'duration': round(session_duration, 2),
            'topic': display_topic,
            'topic_id': self.selected_topic,  # Keep original ID if needed
            'is_custom': self.is_custom_topic,

            'posture': {
                'good_posture_percentage': good_posture_percentage,
                'total_frames_analyzed': total_posture_frames,
                'head_tilt_events': self._consolidate_events(head_tilt_events),
                'shoulder_misalignment_events': self._consolidate_events(
                    shoulder_events
                ),
                'other_posture_issues': self._consolidate_events(
                    other_posture_events
                ),
            },

            'eye_contact': {
                'eye_contact_percentage': eye_contact_percentage,
                'total_measurements': len(self.eye_contact_scores),
            },

            'gestures': {
                'hand_gesture_rate': gesture_quality_percentage,
                'total_gestures': self.hand_gesture_count,
                'average_interval': avg_gesture_interval,
            },

            'engagement': {
                'engagement_issues': self._consolidate_events(self.engagement_events),
            },

            'speech': self.speech_data,

            'nlp_analysis': {
                'average_topic_relevance': avg_topic_relevance,
                'uncensored_word_count': len(
                    self.speech_data['uncensored_words_used']
                ),
                'off_topic_count': len(self.speech_data['off_topic_segments']),
                'analysis_method': (
                    'HuggingFace BART' if self.is_custom_topic else 'TF-IDF'
                ),
            },
        }

        return summary
