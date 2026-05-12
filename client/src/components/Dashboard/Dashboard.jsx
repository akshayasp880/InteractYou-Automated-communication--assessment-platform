import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  TrendingUp, LogOut, CheckCircle, Clock, MessageSquare,
  Video, Mic, Brain, BarChart3, Shield, Code, User, Database,
  Mail, Phone, MapPin, Send
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // 🔴 LOGOUT CHANGE — state for confirmation popup
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, success, error
  const navigate = useNavigate();

  // Reset body style to block to override global centering from style.css
  useEffect(() => {
    document.body.style.display = 'block';
    return () => {
      document.body.style.display = '';
    };
  }, []);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // 🔴 LOGOUT CHANGE — show confirmation instead of logging out immediately
const handleLogout = () => {
  setShowLogoutConfirm(true);
  setShowUserMenu(false);
};

// 🔴 LOGOUT CHANGE — confirm logout
const confirmLogout = () => {
  logout();
  setShowLogoutConfirm(false);
};

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    try {
      const response = await axios.post('https://formspree.io/f/mlgwdrvw', contactForm);
      if (response.status === 200) {
        setSubmitStatus('success');
        setContactForm({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
      // Reset error message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }
  };

  const switchToAssessment = () => {
    if (!user) {
      // User not logged in, show modal
      setShowLoginModal(true);
      return;
    }
    // Navigate to the assessment page
    navigate('/assessment');
  };

  // Removed the loading return to allow rendering empty state or partial UI if needed, 
  // but since we initialize user to null and now support null user rendering, we don't need to block render.
  // Original code: if (!user) { return null; }
  // We can just proceed.

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Dashboard View */}
      <div id="dashboard-view">
        {/* Header */}
        <header className="border-b-2 border-gray-200 bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-[95%] mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/assets/interactyou_logo.png"
                alt="InteractYou Logo"
                className="w-10 h-10 rounded-lg object-contain bg-[#6495ed]"
              />
              <h1 className="text-2xl font-bold text-gray-900">InteractYou</h1>
            </div>
            <div className="relative">
              {!user ? (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#6495ed] hover:bg-[#4169e1] text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  Log in or sign up here
                </button>
              ) : (
                <>
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
                    <button
                      onClick={() => navigate('/progress')}
                      className="w-full text-left block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      See Progress
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <a
                      href="#"
                      onClick={handleLogout}
                      className="block px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50"></div>
          <div className="max-w-[95%] mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                InteractYou
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                Combining Body Language Analysis, Speech Metrics, and Topic Relevance Detection
              </p>
              <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
                A multimodal AI-powered solution providing real-time, objective feedback on communication skills
                through advanced computer vision and natural language processing
              </p>
            </div>

            {/* Central CTA Button */}
            <div className="flex justify-center mb-16">
              <button
                onClick={switchToAssessment}
                className="group relative px-20 py-7 text-white text-3xl font-bold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-xl hover:scale-105"
                style={{ backgroundColor: '#6495ed' }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#4169e1')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#6495ed')}
              >
                Let's Start
                <div
                  className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"
                  style={{ backgroundColor: '#6495ed' }}
                ></div>
              </button>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <div className="flex items-start gap-3 bg-white p-4 rounded-lg border-2 border-gray-200 hover:shadow-md transition-all">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#6495ed' }} />
                <p className="text-sm font-medium text-gray-700">Objective, data-driven feedback without human bias</p>
              </div>
              <div className="flex items-start gap-3 bg-white p-4 rounded-lg border-2 border-gray-200 hover:shadow-md transition-all">
                <Clock className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#6495ed' }} />
                <p className="text-sm font-medium text-gray-700">Instant real-time assessment during practice sessions</p>
              </div>
              <div className="flex items-start gap-3 bg-white p-4 rounded-lg border-2 border-gray-200 hover:shadow-md transition-all">
                <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#6495ed' }} />
                <p className="text-sm font-medium text-gray-700">Track progress and improvement over multiple sessions</p>
              </div>
              <div className="flex items-start gap-3 bg-white p-4 rounded-lg border-2 border-gray-200 hover:shadow-md transition-all">
                <MessageSquare className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#6495ed' }} />
                <p className="text-sm font-medium text-gray-700">AI-generated actionable insights for skill development</p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-16 px-6 bg-gradient-to-b from-white to-blue-50">
          <div className="max-w-[95%] mx-auto">
            <h3 className="text-4xl font-bold text-center mb-4 text-gray-900">Platform Features</h3>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Powered by React, Flask, OpenCV, MediaPipe, and Gemini API
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#6495ed20' }}>
                  <Video className="w-8 h-8" style={{ color: '#6495ed' }} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Real-time Posture Detection</h4>
                <p className="text-gray-600 leading-relaxed">
                  OpenCV & MediaPipe track 33 skeletal landmarks to analyze body language, detecting slouching and engagement levels instantly.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#6495ed20' }}>
                  <Mic className="w-8 h-8" style={{ color: '#6495ed' }} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Speech-to-Text Analysis</h4>
                <p className="text-gray-600 leading-relaxed">
                  Advanced speech recognition converts audio to text, measuring WPM, fluidity, and clarity for comprehensive vocal assessment.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#6495ed20' }}>
                  <Brain className="w-8 h-8" style={{ color: '#6495ed' }} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">AI-Powered Topic Relevance</h4>
                <p className="text-gray-600 leading-relaxed">
                  Gemini API evaluates semantic clarity and content alignment, providing intelligent feedback on communication effectiveness.
                </p>
              </div>
              {/* Feature 4 */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#6495ed20' }}>
                  <BarChart3 className="w-8 h-8" style={{ color: '#6495ed' }} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Comprehensive Reports</h4>
                <p className="text-gray-600 leading-relaxed">
                  Detailed performance metrics combining visual, vocal, and content analysis with actionable coaching insights.
                </p>
              </div>
              {/* Feature 5 */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#6495ed20' }}>
                  <Shield className="w-8 h-8" style={{ color: '#6495ed' }} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Secure Authentication</h4>
                <p className="text-gray-600 leading-relaxed">
                  Google OAuth 2.0 integration ensures data privacy and secure access to your performance history.
                </p>
              </div>
              {/* Feature 6 */}
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#6495ed20' }}>
                  <TrendingUp className="w-8 h-8" style={{ color: '#6495ed' }} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900">Progress Tracking</h4>
                <p className="text-gray-600 leading-relaxed">
                  MongoDB stores session history enabling longitudinal analysis to track improvement over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Project Team */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-4xl font-black text-center mb-4 text-[#1A1F36]">Project Team</h3>
            <p className="text-center text-gray-500 mb-16 font-medium">Computer Science and Engineering Students Batch 2026</p>

            <div className="flex flex-col gap-8 max-w-6xl mx-auto">
              {/* Top Row - 3 Members */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* Member 1 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#6495ed] shadow-md flex-shrink-0">
                    <Code className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#1A1F36]">Aditya Deshmukh</h4>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Frontend Development (React)</p>
                  </div>
                </div>

                {/* Member 2 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#6495ed] shadow-md flex-shrink-0">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#1A1F36]">Akshay Pawar</h4>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Body Language Analysis Module</p>
                  </div>
                </div>

                {/* Member 3 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#6495ed] shadow-md flex-shrink-0">
                    <Mic className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#1A1F36]">Anushka Mishra</h4>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Speech Metrics Processing</p>
                  </div>
                </div>
              </div>

              {/* Bottom Row - 2 Members Centered */}
              <div className="grid md:grid-cols-2 gap-8 md:w-2/3 mx-auto w-full">
                {/* Member 4 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#6495ed] shadow-md flex-shrink-0">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#1A1F36]">Darshan Jaiswal</h4>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Machine Learning & AI Integration</p>
                  </div>
                </div>

                {/* Member 5 */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-row items-center gap-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#6495ed] shadow-md flex-shrink-0">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#1A1F36]">Akshay Wadatkar</h4>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Backend & Database Architecture</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}

        {/* About Us Section */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-[95%] mx-auto">
            <h3 className="text-4xl font-bold text-center mb-8 text-gray-900">About Us</h3>
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <p className="text-xl text-gray-600 leading-relaxed">
                InteractYou is an innovative AI-powered communication assessment platform designed to help individuals master public speaking and interpersonal skills. Born from a shared passion for technology and personal development, our project aims to democratize access to high-quality communication coaching.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our team of dedicated Computer Science students has leveraged cutting-edge technologies in Computer Vision, Natural Language Processing, and Machine Learning to create a tool that provides objective, real-time feedback. We believe that effective communication is a learnable skill, and with the right tools, anyone can become a confident speaker.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-[95%] mx-auto">
            <h3 className="text-4xl font-bold text-center mb-16 text-gray-900">Contact Us</h3>
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8 flex flex-col justify-center">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-blue-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

                  <h4 className="text-3xl font-bold mb-6 text-gray-900 relative z-10">Get in Touch</h4>
                  <p className="text-gray-600 mb-10 relative z-10 text-lg">
                    Have questions about InteractYou? We'd love to hear from you. Fill out the form or reach out to us directly.
                  </p>

                  <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-6 group/item">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#6495ed] group-hover/item:scale-110 transition-transform shadow-sm">
                        <Mail className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-400 text-sm uppercase tracking-wider mb-1">Email</p>
                        <p className="text-lg font-medium text-gray-900">support@interactyou.com</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 group/item">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#6495ed] group-hover/item:scale-110 transition-transform shadow-sm">
                        <Phone className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-400 text-sm uppercase tracking-wider mb-1">Phone</p>
                        <p className="text-lg font-medium text-gray-900">+91 123 456 7890</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 group/item">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#6495ed] group-hover/item:scale-110 transition-transform shadow-sm">
                        <MapPin className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-400 text-sm uppercase tracking-wider mb-1">Location</p>
                        <p className="text-lg font-medium text-gray-900">Computer Science Deptment , JDIET, Yavatmal</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white p-10 rounded-3xl shadow-xl border border-blue-100">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  {submitStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <p>Message sent successfully! We'll get back to you soon.</p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                      <LogOut className="w-5 h-5 flex-shrink-0 rotate-180" /> {/* Using LogOut as error icon fallback */}
                      <p>Something went wrong. Please try again later.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 font-bold mb-2 ml-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={contactForm.name}
                      onChange={handleContactChange}
                      required
                      className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#6495ed] focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium"
                      placeholder="Your Name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2 ml-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleContactChange}
                        required
                        className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#6495ed] focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2 ml-1">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={contactForm.phone}
                        onChange={handleContactChange}
                        className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#6495ed] focus:ring-4 focus:ring-blue-100/50 outline-none transition-all font-medium"
                        placeholder="+91 123 456 7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2 ml-1">Message</label>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactChange}
                      required
                      rows="4"
                      className="w-full px-5 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-[#6495ed] focus:ring-4 focus:ring-blue-100/50 outline-none transition-all resize-none font-medium"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitStatus === 'submitting'}
                    className={`w-full py-4 text-white text-lg font-bold rounded-xl shadow-lg transition-all transform flex items-center justify-center gap-3 group ${submitStatus === 'submitting'
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-[#6495ed] hover:shadow-xl hover:-translate-y-1'
                      }`}
                  >
                    {submitStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                    {!submitStatus === 'submitting' && (
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t-2 border-gray-200 bg-white">
          <div className="max-w-[95%] mx-auto px-6 py-8">
            <div className="text-center">
              <p className="text-gray-500 text-sm">
                © 2026 InteractYou
              </p>
            </div>
          </div>
        </footer>
        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setShowLoginModal(false)}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-[#6495ed]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h3>
                <p className="text-gray-600 mb-8">
                  Please log in or sign up to start your assessment session and track your progress.
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 py-3 px-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: '#6495ed' }}
                  >
                    Log In
                  </button>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button onClick={() => navigate('/signup')} className="text-[#6495ed] font-semibold hover:underline">
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔴 LOGOUT CHANGE — Logout Confirmation Modal */}

{showLogoutConfirm && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">

    {/* Background */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={() => setShowLogoutConfirm(false)}
    ></div>

    {/* Modal Box */}
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">

      {/* Icon */}
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <LogOut className="w-8 h-8 text-red-500" />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Confirm Logout
      </h3>

      {/* Message */}
      <p className="text-gray-600 mb-8">
        Are you sure you want to log out?
      </p>

      {/* Buttons */}
      <div className="flex gap-4">

        {/* Cancel */}
        <button
          onClick={() => setShowLogoutConfirm(false)}
          className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
        >
          Cancel
        </button>

        {/* Confirm */}
        <button
          onClick={confirmLogout}
          className="flex-1 py-3 px-4 rounded-xl text-white font-semibold shadow-lg"
          style={{ backgroundColor: '#ef4444' }}
        >
          Logout
        </button>

      </div>

    </div>

  </div>
)}
      </div>
    </div>
  );
};

export default Dashboard;