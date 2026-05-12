import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import VideoFeed from './VideoFeed';
import TopicSelector from './TopicSelector';

import ReportView from './ReportView';

const Assessment = () => {
  const navigate = useNavigate();
  const {
    sessionActive,
    selectedTopic,
    isCustomTopic,
    sessionDuration,
    metrics,
    startSession,
    stopSession,
    setDuration,
    setSelectedTopic,
    setIsCustomTopic,
    setSelectedMainTopic
  } = useSession();

  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const [reportEnabled, setReportEnabled] = useState(false);
  const [selectedDurationMin, setSelectedDurationMin] = useState(0);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [showTopicAlert, setShowTopicAlert] = useState(false);

  // Reset body style to block to override global centering from style.css
  useEffect(() => {
    document.body.style.display = 'block';
    return () => {
      document.body.style.display = '';
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (sessionActive) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = sessionDuration > 0
          ? Math.max(0, sessionDuration - elapsed)
          : elapsed;

        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        setTimerDisplay(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);

        // Auto-stop if duration reached
        if (sessionDuration > 0 && remaining <= 0) {
          handleStopSession();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, sessionDuration]);

  const handleStartSession = async () => {
    if (!selectedTopic) {
      setShowTopicAlert(true);
      return;
    }

    setDuration(selectedDurationMin * 60);
    await startSession(selectedTopic.trim(), isCustomTopic);
    setReportEnabled(false);
  };

  const handleStopSession = async () => {
    await stopSession();
    setReportEnabled(true);
  };

  const handleTopicSelect = (topicId, isCustom, mainTopic) => {
    setSelectedTopic(topicId);
    setIsCustomTopic(isCustom);
    setSelectedMainTopic(mainTopic);
  };

  const durationOptions = [
    { label: 'Open-ended', minutes: 0 },
    { label: '3 Minutes', minutes: 3 },
    { label: '5 Minutes', minutes: 5 },
    { label: '10 Minutes', minutes: 10 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12 font-poppins">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/assets/interactyou_logo.png"
              alt="InteractYou Logo"
              className="w-10 h-10 rounded-lg object-contain bg-[#6495ed]"
            />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">InteractYou <span className="text-gray-400 font-medium">Assessment</span></h1>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <span className="text-lg">🏠</span>
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Video (Takes 1/2 space) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 transition-all hover:shadow-xl">
          <VideoFeed
            isRecording={sessionActive}
            timerDisplay={timerDisplay}
          />
        </div>

        {/* Right Panel - Topic Selector */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all hover:shadow-xl h-full">
          <TopicSelector
            onTopicSelect={handleTopicSelect}
            selectedTopic={selectedTopic}
            disabled={sessionActive}
          />
        </div>
      </div>

      {/* Controls Strip */}
      <div className="w-full px-6 mb-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-4 w-full">
            {/* Duration Selector */}
            <div className="relative z-20">
              <button
                className={`flex items-center justify-between min-w-[160px] px-5 py-3 bg-white border-2 rounded-xl text-sm font-medium transition-all ${durationDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'}`}
                onClick={() => !sessionActive && setDurationDropdownOpen(!durationDropdownOpen)}
                disabled={sessionActive}
              >
                <span className={sessionActive ? 'text-gray-400' : 'text-gray-700'}>
                  {durationOptions.find(d => d.minutes === selectedDurationMin)?.label || 'Open-ended'}
                </span>
                <span className="ml-2 text-gray-400">▼</span>
              </button>

              {durationDropdownOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1">
                  {durationOptions.map((option) => (
                    <button
                      key={option.minutes}
                      className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center justify-between ${selectedDurationMin === option.minutes ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-gray-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDurationMin(option.minutes);
                        setDurationDropdownOpen(false);
                      }}
                    >
                      {option.label}
                      {selectedDurationMin === option.minutes && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Start/Stop Buttons */}
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                className="px-8 py-3 rounded-xl font-bold text-white transition-all transform flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <span>▶️</span> Start Session
              </button>
            ) : (
              <button
                onClick={handleStopSession}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all transform flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 animate-pulse"
              >
                <span>⏹️</span> Stop Session
              </button>
            )}

            {/* View Report Button */}
            <button
              disabled={!reportEnabled}
              onClick={() => {
                const reportBlock = document.getElementById('reportBlock');
                if (reportBlock) {
                  reportBlock.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 border-2 ${!reportEnabled
                ? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md'
                }`}
            >
              <span>📊</span> View Report
            </button>
          </div>

          <div className="text-center">
            {sessionActive ? (
              <p className="text-green-600 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Session is active. Speak clearly and maintain eye contact.
              </p>
            ) : reportEnabled ? (
              <p className="text-indigo-600 font-medium flex items-center gap-2">
                <span className="text-xl">🎉</span>
                Session complete! Scroll down or click 'View Report' to see your analysis.
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Select a topic above, choose duration, then click <strong>Start Session</strong> to begin.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Report Section */}
      <div className="w-full px-6">
        <ReportView reportEnabled={reportEnabled} />
      </div>

      <footer className="w-full px-6 mt-12 pt-8 border-t border-gray-200">
        <div className="flex justify-center items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} InteractYou</p>
        </div>
      </footer>

      {/* Topic Alert Modal */}
      {showTopicAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowTopicAlert(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Topic Required</h3>
            <p className="text-gray-600 mb-6">
              Please select a topic from the panel to start your practice session.
            </p>
            <button
              onClick={() => setShowTopicAlert(false)}
              className="w-full py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-[#6495ed]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessment;