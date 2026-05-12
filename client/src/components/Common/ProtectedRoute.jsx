import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in
  const userStr = sessionStorage.getItem('user');

  if (!userStr) {
    // Not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;