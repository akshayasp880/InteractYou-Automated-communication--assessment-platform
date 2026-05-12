import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Signup = () => {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    repeatPassword: ''
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  // Validation Patterns
  const nameRegex = /^[A-Za-z ]+$/;

  // lowercase email format
  const emailRegex = /^[a-z]+@[a-z]+\.[a-z]{2,}$/;

  // Minimum 8 characters, 1 number, 1 special character
  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    setErrorMessage('');

    // Trim values
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const repeatPassword = formData.repeatPassword;

    // Name Validation
    if (!nameRegex.test(name)) {

      setErrorMessage(
        'Name must contain only uppercase and lowercase letters.'
      );

      return;
    }

    // Email Validation
    if (!emailRegex.test(email)) {

      setErrorMessage(
        'Email must contain only lowercase letters and valid @domain.'
      );

      return;
    }

    // Password Validation
    if (!passwordRegex.test(password)) {

      setErrorMessage(
        'Password must be at least 8 characters long with one number and one special character.'
      );

      return;
    }

    // Password Match Check
    if (password !== repeatPassword) {

      setErrorMessage('Passwords do not match!');
      return;

    }

    // Terms Check
    if (!agreeTerms) {

      setErrorMessage(
        'You must agree to the Terms of Service'
      );

      return;

    }

    try {

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/signup`,
        {
          name: name,
          email: email,
          password: password
        }
      );

      if (response.data.status === 'success') {

        alert('Signup successful! Redirecting to login.');
        navigate('/');

      }

    } catch (error) {

      const message =
        error.response?.data?.message ||
        'An error occurred during signup.';

      setErrorMessage(message);

    }

  };

  const handleGoogleSignup = () => {

    window.location.href =
      `${API_BASE_URL}/api/auth/google/signup`;

  };

  return (

    <div className="container reverse-layout">

      <div className="login-wrapper">

        <div className="form-section">

          <h1>Sign up</h1>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <i className="fas fa-user"></i>

              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                title="Only uppercase and lowercase letters allowed"
                required
              />

            </div>

            <div className="input-group">

              <i className="fas fa-envelope"></i>

              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                title="Use lowercase email like example@gmail.com"
                required
              />

            </div>

            <div className="input-group">

              <i className="fas fa-lock"></i>

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                title="Minimum 8 characters, at least one number and one special character"
                required
              />

            </div>

            <div className="input-group">

              <i className="fas fa-lock"></i>

              <input
                type="password"
                name="repeatPassword"
                placeholder="Repeat your password"
                value={formData.repeatPassword}
                onChange={handleChange}
                required
              />

            </div>

            <div className="options">

              <label className="checkbox-container">

                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) =>
                    setAgreeTerms(e.target.checked)
                  }
                  required
                />

                <span className="checkmark"></span>

                I agree all statements in{' '}

                <Link
                  to="/terms"
                  style={{
                    textDecoration: 'underline',
                    color: '#333'
                  }}
                >

                  Terms of service

                </Link>

              </label>

            </div>

            {errorMessage && (

              <div
                className="error-msg"
                style={{ display: 'block' }}
              >

                {errorMessage}

              </div>

            )}

            <button
              type="submit"
              className="login-btn"
            >

              Register

            </button>

            <button
              type="button"
              onClick={handleGoogleSignup}
              className="google-btn"
              style={{
                textDecoration: 'none'
              }}
            >

              <img
                src="/assets/google_logo.png"
                alt="Google Logo"
              />

              Sign up with Google

            </button>

          </form>

          <div className="toggle-link">

            <Link
              to="/"
              className="create-account-link"
              style={{
                border: 'none'
              }}
            >

              I am already member

            </Link>

          </div>

        </div>

        <div className="illustration-section">

          <img
            src="/assets/signup_illustration_transparent_v2.png"
            alt="Signup Illustration"
          />

        </div>

      </div>

    </div>

  );

};

export default Signup;