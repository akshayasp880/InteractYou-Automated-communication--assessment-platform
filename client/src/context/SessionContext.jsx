import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [selectedMainTopic, setSelectedMainTopic] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0); // 0 = open-ended
  const [metrics, setMetrics] = useState({
    posture: 'Analyzing…',
    engagement: 'Analyzing…',
    speech: 'Waiting…'
  });
  const [history, setHistory] = useState([]);

  const startSession = async (topic, isCustom, mainTopic = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/session/start`, {
        topic: topic,
        is_custom: isCustom
      });

      if (response.data.status === 'success') {
        setSessionActive(true);
        setSessionId(response.data.session_id);
        setSelectedTopic(topic);
        setIsCustomTopic(isCustom);
        setSelectedMainTopic(mainTopic);
        setSessionStartTime(Date.now());

        console.log('✅ Session started:', response.data.session_id);
        return { success: true, sessionId: response.data.session_id };
      }
    } catch (error) {
      console.error('❌ Error starting session:', error);
      return { success: false, error: error.message };
    }
  };

  const stopSession = async () => {
    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};

      const response = await axios.post(`${API_BASE_URL}/api/session/stop`, {
        email: user.email
      });

      if (response.data.status === 'success') {
        setSessionActive(false);
        const summary = response.data.summary;

        console.log('✅ Session stopped:', summary.session_id);

        // Add to history
        setHistory(prev => [...prev, summary]);

        return { success: true, summary };
      }
    } catch (error) {
      console.error('❌ Error stopping session:', error);
      return { success: false, error: error.message };
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/session/history`);
      setHistory(response.data.sessions || []);
      return response.data.sessions;
    } catch (error) {
      console.error('❌ Error fetching history:', error);
      return [];
    }
  };

  const updateMetrics = (newMetrics) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
  };

  // sessionDuration is stored as seconds for timer logic consistency
  // Caller should pass seconds (e.g., 3 minutes -> 180)
  const setDuration = (seconds) => {
    setSessionDuration(seconds === 0 ? 0 : seconds);
  };

  const value = {
    sessionActive,
    sessionId,
    selectedTopic,
    isCustomTopic,
    selectedMainTopic,
    sessionStartTime,
    sessionDuration,
    metrics,
    history,
    startSession,
    stopSession,
    fetchHistory,
    updateMetrics,
    setDuration,
    setSelectedTopic,
    setIsCustomTopic,
    setSelectedMainTopic
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;