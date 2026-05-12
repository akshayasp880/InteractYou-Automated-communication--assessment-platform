import { useEffect, useState, useRef } from 'react';
import { Maximize } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VideoFeed = ({ isRecording, timerDisplay }) => {
  const [liveStatusText, setLiveStatusText] = useState('Idle');
  const [liveDotColor, setLiveDotColor] = useState('#9ca3af');
  const containerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      setLiveStatusText('Recording');
      setLiveDotColor('#22c55e');
    } else {
      setLiveStatusText('Idle');
      setLiveDotColor('#9ca3af');
    }
  }, [isRecording]);

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🎥</span>
            Live Analysis Feed
          </h2>
          <p className="text-sm text-gray-500">
            Real-time posture, engagement, and speech signals.
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border ${isRecording
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
          <span
            className={`w-2 h-2 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
          ></span>
          <span>{liveStatusText}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border-4 border-indigo-500/10 bg-black shadow-inner group"
      >
        <img
          id="videoFeed"
          className="w-full h-full object-contain"
          src={`${API_BASE_URL}/video_feed`}
          alt="Live Video Feed"
        />

        {/* Timer overlay */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-medium flex items-center gap-2 backdrop-blur-sm z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span>{timerDisplay}</span>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullScreen}
          className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default VideoFeed;