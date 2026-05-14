import api from './api';

const authService = {
  /**
   * Login with email/name and password
   * @param {string} name - User's name or email
   * @param {string} password - User's password
   * @returns {Promise} Response with user data
   */
  login: async (name, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        name,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Register new user
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} Response with success message
   */
  signup: async (name, email, password) => {
    try {
      const response = await api.post('/api/auth/signup', {
        name,
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user
   * @returns {Promise} Response with success message
   */
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout');
      sessionStorage.removeItem('user');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user info (placeholder for JWT auth)
   * @returns {Promise} Response with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get Google OAuth login URL
   * @returns {string} Google OAuth URL
   */
  getGoogleLoginUrl: () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${API_BASE_URL}/api/auth/google/login`;
  },

  /**
   * Get Google OAuth signup URL
   * @returns {string} Google OAuth URL
   */
  getGoogleSignupUrl: () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${API_BASE_URL}/api/auth/google/signup`;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated: () => {
    const user = sessionStorage.getItem('user');
    return !!user;
  },

  /**
   * Get stored user data
   * @returns {object|null} User data or null
   */
  getStoredUser: () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Store user data in localStorage
   * @param {object} user - User data object
   */
  storeUser: (user) => {
    sessionStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Clear stored user data
   */
  clearUser: () => {
    sessionStorage.removeItem('user');
  }
};

export default authService;