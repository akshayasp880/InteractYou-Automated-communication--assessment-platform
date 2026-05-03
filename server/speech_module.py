# speech_module.py
import time
import speech_recognition as sr

FILLER_WORDS = [
    'um', 'uh', 'like', 'you know', 'actually', 'basically',
    'literally', 'sort of', 'kind of'
]


def speech_recognition_thread(current_analyzer_getter, is_recording_flag_getter):
    """
    Runs in a background thread.
    - current_analyzer_getter(): returns current SessionAnalyzer or None.
    - is_recording_flag_getter(): returns True/False (live flag).
    """
    recognizer = sr.Recognizer()

    try:
        microphone = sr.Microphone(device_index=1)
    except Exception as e:
        print(f"❌ Microphone init failed: {e}")
        return

    last_speech_time = time.time()
    segment_start_time = time.time()
    segment_word_count = 0

    with microphone as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)

        while is_recording_flag_getter():
            analyzer = current_analyzer_getter()
            if analyzer is None:
                time.sleep(0.2)
                continue

            try:
                audio = recognizer.listen(source, timeout=2, phrase_time_limit=10)
                text = recognizer.recognize_google(audio)
                current_time = time.time()
                pause_duration = current_time - last_speech_time
                timestamp = current_time - analyzer.start_time

                if pause_duration > 2:
                    analyzer.speech_data['pauses'].append(pause_duration)
                    if segment_word_count > 0:
                        segment_duration = current_time - segment_start_time
                        analyzer.track_speaking_pace(
                            segment_word_count, timestamp, segment_duration
                        )
                    segment_start_time = current_time
                    segment_word_count = 0

                last_speech_time = current_time

                content_analysis = analyzer.analyze_speech_content(text, timestamp)
                analyzer.speech_data['transcripts'].append({
                    'text': text,
                    'timestamp': timestamp,
                    'topic_relevance': content_analysis['topic_relevance'],
                    'uncensored_detected':
                        content_analysis['uncensored_count'] > 0
                })

                words = text.lower().split()
                analyzer.speech_data['total_words'] += len(words)
                segment_word_count += len(words)

                for filler in FILLER_WORDS:
                    analyzer.speech_data['filler_words'] += sum(
                        1 for word in words if filler in word
                    )

            except sr.WaitTimeoutError:
                continue
            except sr.UnknownValueError:
                continue
            except Exception as e:
                print(f"Speech recognition error: {e}")
                continue
