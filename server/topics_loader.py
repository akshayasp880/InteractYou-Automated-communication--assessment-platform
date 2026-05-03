# topics_loader.py
import json
import os

def load_topics():
    try:
        # Construct absolute path to topics.json
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, 'topics.json')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: topics.json not found at {file_path}!")
        return {}
    except Exception as e:
        print(f"Error loading topics: {e}")
        return {}

PRACTICE_TOPICS = load_topics()
