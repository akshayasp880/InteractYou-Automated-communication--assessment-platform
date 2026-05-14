# 🎙️ InteractYou – Automated Communication Assessment Platform

InteractYou is an AI-powered communication assessment platform designed to evaluate communication, confidence, engagement, posture, and speaking effectiveness in real time.

The platform combines Computer Vision, Natural Language Processing, Speech Analysis, and Generative AI to provide intelligent coaching and performance feedback during communication assessments, mock interviews, presentations, and public speaking sessions.

---

# 🚀 Features

## 🎥 Real-Time Video & Behavioral Analysis

* Live webcam-based monitoring
* Face and eye detection using OpenCV Haarcascade models
* Body posture analysis
* Engagement tracking
* Gesture and movement monitoring
* Eye contact evaluation

## 🧠 AI-Powered Communication Assessment

* NLP-based topic relevance analysis
* AI-generated coaching reports using Google Gemini AI
* Speech quality evaluation
* Filler word detection
* Professional language analysis
* Detection of uncensored/unprofessional words

## 🎤 Speech & Interaction Analysis

* Real-time speech recognition
* Communication fluency tracking
* Off-topic detection
* Speaking engagement metrics
* Presentation effectiveness scoring

## 📊 Dashboard & Progress Tracking

* Session history tracking
* Performance analytics
* Progress monitoring dashboard
* Personalized feedback and recommendations

## 🔐 Authentication System

* Google OAuth login support
* Secure session handling
* User account management

---

# 🛠️ Tech Stack

## Frontend

* React.js
* React Router
* JavaScript
* HTML5
* CSS3
* Vite

## Backend

* Python
* Flask
* Flask-CORS

## AI / Machine Learning

* Google Gemini AI
* HuggingFace Transformers
* YOLOv8 Pose Detection
* Scikit-learn
* TF-IDF Similarity

## Computer Vision

* OpenCV
* MediaPipe
* Haarcascade Face Detection
* Haarcascade Eye Detection

## Database

* MongoDB

## Additional Libraries

* PyAudio
* NumPy
* Pandas
* Matplotlib
* ReportLab

---

# 📂 Project Structure

```bash
InteractYou-Automated-communication--assessment-platform-main/
│
├── client/                         # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── App.jsx
│       └── main.jsx
│
├── server/                         # Flask backend
│   ├── data/                       # Haarcascade XML models
│   ├── app.py                      # Main backend server
│   ├── auth_routes.py
│   ├── analysis_routes.py
│   ├── gemini_analysis.py
│   ├── nlp_module.py
│   └── other AI modules
│
├── requirements.txt
├── uncensored_words.json
└── .gitignore
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/InteractYou-Automated-communication--assessment-platform.git
cd InteractYou-Automated-communication--assessment-platform
```

---

# 🖥️ Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# ⚡ Backend Setup

## Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

## Run Backend Server

```bash
cd server
python app.py
```

Backend runs on:

```bash
http://localhost:5000
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `server` folder.

```env
FLASK_SECRET_KEY=your_secret_key

Client_ID=your_google_client_id
secret_key=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

MONGO_URI=your_mongodb_connection_string
MONGO_DB=Final_Year_Project
MONGO_COLLECTION=login

API_key=your_gemini_api_key

FRONTEND_URL=http://localhost:5173
```

---

# 🧠 AI Functionalities

The platform intelligently evaluates users using multiple AI modules:

| Module                | Purpose                              |
| --------------------- | ------------------------------------ |
| YOLOv8 Pose Detection | Body posture and gesture tracking    |
| OpenCV                | Face & eye detection                 |
| Speech Recognition    | Real-time speech analysis            |
| TF-IDF + NLP          | Topic relevance checking             |
| HuggingFace Models    | Zero-shot classification             |
| Gemini AI             | Coaching reports and recommendations |

---

# 📸 Key Functionalities

* Real-time webcam analysis
* AI communication scoring
* Speech fluency monitoring
* Engagement detection
* Professional language evaluation
* Topic relevance analysis
* Personalized AI feedback
* Communication coaching recommendations
* Session analytics and progress reports

---

# 📊 Workflow

```text
User Starts Assessment
        ↓
Webcam + Audio Capture
        ↓
AI Analysis Engine
        ↓
Speech + NLP + CV Processing
        ↓
Performance Evaluation
        ↓
Gemini AI Coaching Report
        ↓
Dashboard & Recommendations
```

---

# 🔮 Future Enhancements

* Emotion recognition
* Resume-based interview generation
* Multi-language communication analysis
* Voice emotion analysis
* Video recording & replay
* AI interviewer integration
* Advanced analytics dashboard
* Cloud deployment

---

# 🎯 Use Cases

* Mock interviews
* Communication training
* Placement preparation
* Public speaking practice
* Presentation assessment
* HR communication screening
* Personality development training

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

# 📜 License

This project is developed for educational and research purposes.

---

# 👨‍💻 Developer

Developed by Aditya

If you found this project useful, consider giving it a ⭐ on GitHub.
