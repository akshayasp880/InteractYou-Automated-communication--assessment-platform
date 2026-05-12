import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from sessionStorage
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }

    // Initialize Lucide icons if available
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const handleSeeProgress = () => {
    // Navigate to progress/history page (can be implemented later)
    alert('Progress tracking feature coming soon!');
  };

  if (!user) {
    return null; // Don't show header if no user
  }

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="border-b-2 border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src="/assets/interactyou_logo.png"
            alt="InteractYou Logo"
            className="w-10 h-10 rounded-lg object-contain bg-[#6495ed]"
          />
          <h1 className="text-2xl font-bold text-gray-900">InteractYou</h1>
        </div>
        <div className="relative">
          <button onClick={toggleUserMenu} className="flex items-center gap-3 focus:outline-none">
            <span className="text-gray-700 font-medium hover:text-blue-600 transition-colors">
              Welcome, {user.name}
            </span>
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full shadow-md transition-transform hover:scale-105 object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: '#6495ed' }}
              >
                <span>{userInitial}</span>
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          <div
            className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden transition-all duration-200 ${showUserMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'
              }`}
          >
            <a
              href="#"
              onClick={handleSeeProgress}
              className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <i data-lucide="trending-up" className="w-4 h-4"></i>
              See Progress
            </a>
            <div className="border-t border-gray-100"></div>
            <a
              href="#"
              onClick={handleLogout}
              className="block px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <i data-lucide="log-out" className="w-4 h-4"></i>
              Logout
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;