import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      // Format error message (e.g., user_not_found -> User not found)
      setErrorMessage(error.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()));
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);

      if (response.data.status === 'success') {
        // Store user info
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'An error occurred. Please try again.';
      setErrorMessage(message);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google/login`;
  };

  return (
    <div className="container">
      <div className="login-wrapper">
        <div className="illustration-section">
          <img src="/assets/illustration.png" alt="Login Illustration" />
          <Link to="/signup" className="create-account-link">Create an account</Link>
        </div>

        <div className="form-section">
          <h1>Log in</h1>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <i className="fas fa-user"></i>
              <input
                type="text"
                name="name"
                placeholder="Your Email"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <i className="fas fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <i
                className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} password-toggle-icon`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            <div className="options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>

            {errorMessage && (
              <div id="error-message" className="error-msg" style={{ display: 'block' }}>
                {errorMessage}
              </div>
            )}

            <button type="submit" className="login-btn">Log in</button>

            <div className="social-login">
              <span>Or login with</span>
              <div className="social-icons">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="social-icon google"
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  <img src="/assets/google_logo.png" alt="Google" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;