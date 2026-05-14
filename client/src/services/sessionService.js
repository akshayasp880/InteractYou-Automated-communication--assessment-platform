import api from './api';

const sessionService = {
  /**
   * Start a new assessment session
   * @param {string} topic - Topic ID or custom topic text
   * @param {boolean} isCustom - Whether it's a custom topic
   * @returns {Promise} Response with session_id
   */
  startSession: async (topic, isCustom = false) => {
    try {
      const response = await api.post('/api/session/start', {
        topic,
        is_custom: isCustom
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Stop the current assessment session
   * @returns {Promise} Response with session summary
   */
  stopSession: async () => {
    try {
      const response = await api.post('/api/session/stop');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current session status
   * @returns {Promise} Response with session status
   */
  getSessionStatus: async () => {
    try {
      const response = await api.get('/api/session/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all session history
   * @returns {Promise} Response with sessions array
   */
  getHistory: async () => {
    try {
      const response = await api.get('/api/session/history');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get specific session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise} Response with session data
   */
  getSessionById: async (sessionId) => {
    try {
      const response = await api.get(`/api/session/history/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Clear all session history
   * @returns {Promise} Response with success message
   */
  clearHistory: async () => {
    try {
      const response = await api.delete('/api/session/history/clear');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get live metrics during active session
   * @returns {Promise} Response with current metrics
   */
  getLiveMetrics: async () => {
    try {
      const response = await api.get('/api/session/metrics');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get detailed performance report
   * @returns {Promise} Response with report data
   */
  getReport: async () => {
    try {
      const response = await api.get('/api/analysis/report');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get AI-powered coaching report
   * @returns {Promise} Response with AI analysis
   */
  getAIReport: async () => {
    try {
      const response = await api.get('/api/analysis/ai-report');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get quick AI coaching tips
   * @returns {Promise} Response with tips array
   */
  getQuickTips: async () => {
    try {
      const response = await api.get('/api/analysis/quick-tips');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get quick session summary
   * @returns {Promise} Response with summary and grade
   */
  getSummary: async () => {
    try {
      const response = await api.get('/api/analysis/summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all available topics
   * @returns {Promise} Response with topics object
   */
  getTopics: async () => {
    try {
      const response = await api.get('/api/analysis/topics');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get specific main topic details
   * @param {string} mainTopic - Main topic ID
   * @returns {Promise} Response with topic details
   */
  getTopicDetails: async (mainTopic) => {
    try {
      const response = await api.get(`/api/analysis/topics/${mainTopic}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get specific subtopic details
   * @param {string} mainTopic - Main topic ID
   * @param {string} subtopicId - Subtopic ID
   * @returns {Promise} Response with subtopic details
   */
  getSubtopicDetails: async (mainTopic, subtopicId) => {
    try {
      const response = await api.get(`/api/analysis/topics/${mainTopic}/${subtopicId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get video feed URL
   * @returns {string} Video feed URL
   */
  getVideoFeedUrl: () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${API_BASE_URL}/video_feed`;
  }
};

export default sessionService;