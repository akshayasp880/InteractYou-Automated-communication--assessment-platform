import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Pages
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import Assessment from './components/Assessment/Assessment';
import Terms from './components/Common/Terms';
import Progress from './components/Dashboard/Progress';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SessionProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/terms" element={<Terms />} />

            {/* Protected Routes */}
            {/* Dashboard is now public/hybrid, moving out of protected routes logic conceptually, 
                though we keep other protected routes as is */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />

            {/* Google OAuth Callback */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </AuthProvider>
    </Router>
  );
}

// Handle Google OAuth callback
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Debug logging
    console.log("AuthCallback mounted", window.location.search);

    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const errorParam = urlParams.get('error');

    if (userParam) {
      try {
        console.log("Found user param, parsing...");
        const user = JSON.parse(decodeURIComponent(userParam));

        console.log("Setting user to sessionStorage", user);
        sessionStorage.setItem('user', JSON.stringify(user));

        // Use a hard redirect to ensure clean state and context re-initialization
        console.log("Redirecting to dashboard...");
        window.location.href = '/dashboard';
      } catch (e) {
        console.error('Error parsing user data:', e);
        // navigate('/?error=invalid_user_data');
        window.location.href = '/?error=invalid_user_data';
      }
    } else if (errorParam) {
      console.log("Found error param:", errorParam);
      // navigate(`/?error=${errorParam}`);
      window.location.href = `/?error=${errorParam}`;
    } else {
      console.log("No params found, redirecting to login");
      // navigate('/');
      window.location.href = '/';
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #6495ed',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <p style={{ color: '#6b7280' }}>Completing authentication...</p>
      </div>
    </div>
  );
}

export default App;