import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, Clock, Award, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Progress = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const navigate = useNavigate();

    // Helper to format topic names (e.g. "agri_business" -> "Agri Business")
    const formatTopic = (topic) => {
        if (!topic) return 'Custom Topic';
        return topic
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    useEffect(() => {
        // Reset body style to block to override global centering from style.css
        document.body.style.display = 'block';
        fetchHistory();
        return () => {
            document.body.style.display = '';
        };
    }, []);

    const fetchHistory = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (!user) {
                navigate('/');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/session/history`, {
                params: { email: user.email }
            });
            setHistory(response.data.sessions || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching history:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Helper: compute WPM from a session's speech data with fallback
    const getSessionWPM = (session) => {
        if (!session?.speech) return 0;
        // If words_per_minute was already computed and stored, use it
        if (session.speech.words_per_minute && session.speech.words_per_minute > 0) {
            return Math.round(session.speech.words_per_minute);
        }
        // Fallback: compute from total_words and speaking_time or session duration
        const totalWords = session.speech.total_words || 0;
        const speakingTime = session.speech.speaking_time || session.duration || 0;
        if (totalWords > 0 && speakingTime > 0) {
            return Math.round((totalWords / speakingTime) * 60);
        }
        return 0;
    };

    // Process data for charts: sort Old -> New
    const chronologicalHistory = [...history].reverse();

    const chartData = chronologicalHistory.slice(Math.max(chronologicalHistory.length - 10, 0)).map((session) => {
        let finalScore = 0;
        if (session.overall_score) {
            if (typeof session.overall_score === 'string') {
                finalScore = parseFloat(session.overall_score.split('/')[0]);
            } else {
                finalScore = session.overall_score;
            }
        } else {
            finalScore = Math.round((
                (session.posture?.good_posture_percentage || 0) +
                (session.eye_contact?.eye_contact_percentage || 0) +
                (session.gestures?.hand_gesture_rate || 0)
            ) / 30);
            finalScore = (finalScore > 10) ? finalScore / 10 : finalScore;
        }

        const dateStr = session.created_at || (session.session_id.split('_')[0].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));

        return {
            date: format(new Date(dateStr), 'MMM dd'),
            score: finalScore || 0,
            posture: session.posture?.good_posture_percentage || 0,
            eyeContact: session.eye_contact?.eye_contact_percentage || 0,
            gestures: session.gestures?.hand_gesture_rate || 0,
            wpm: getSessionWPM(session)
        };
    }).filter(item => item.posture > 0 || item.eyeContact > 0 || item.gestures > 0);

    // Stats Logic
    const latestSession = history[0];
    const totalSessions = history.length;

    let totalScoreSum = 0;
    history.forEach(session => {
        let s = 0;
        if (session.overall_score) {
            if (typeof session.overall_score === 'string') {
                s = parseFloat(session.overall_score.split('/')[0]);
            } else {
                s = session.overall_score;
            }
        } else {
            const p = session.posture?.good_posture_percentage || 0;
            const e = session.eye_contact?.eye_contact_percentage || 0;
            const g = session.gestures?.hand_gesture_rate || 0;
            s = Math.round(((p + e + g) / 3) / 10);
        }
        totalScoreSum += s;
    });
    const avgScore = totalSessions > 0 ? Math.round(totalScoreSum / totalSessions) : 0;

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-poppins text-gray-800 pb-12">

            {/* Header - Fixed Flexbox */}
            <header className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-[#1A1F36] flex items-center gap-3">
                        <TrendingUp className="w-7 h-7 text-indigo-600" />
                        Performance Analytics
                    </h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl shadow-sm transition-all text-sm font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 space-y-8">

                {/* 1. Top Stats Row */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                        <div>
                            <p className="text-gray-400 text-sm font-semibold tracking-wide">Total Sessions</p>
                            <h3 className="text-3xl font-black text-[#1A1F36] mt-1">{totalSessions}</h3>
                        </div>
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Clock className="w-7 h-7" />
                        </div>
                    </div>

                    <div className="flex-1 bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                        <div>
                            <p className="text-gray-400 text-sm font-semibold tracking-wide">Average Score</p>
                            <h3 className="text-3xl font-black text-[#1A1F36] mt-1">{avgScore}/10</h3>
                        </div>
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <Award className="w-7 h-7" />
                        </div>
                    </div>

                    <div className="flex-1 bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                        <div>
                            <p className="text-gray-400 text-sm font-semibold tracking-wide">Latest Focus</p>
                            <h3 className="text-xl font-black text-[#1A1F36] mt-1 truncate max-w-[180px]" title={latestSession ? formatTopic(latestSession.topic) : 'No sessions'}>
                                {latestSession ? formatTopic(latestSession.topic) : 'No sessions'}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                            <MessageSquare className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* 2. Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-[#1A1F36] mb-8">Progress Over Time</h2>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={15} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line type="monotone" dataKey="posture" name="Posture %" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="eyeContact" name="Eye Contact %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="gestures" name="Gestures %" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-[#1A1F36] mb-8">Latest Skill Profile</h2>
                        <div className="h-96 w-full flex justify-center items-center">
                            {latestSession ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                        { subject: 'Posture', A: latestSession.posture?.good_posture_percentage || 0 },
                                        { subject: 'Eye Cont.', A: latestSession.eye_contact?.eye_contact_percentage || 0 },
                                        { subject: 'Gestures', A: latestSession.gestures?.hand_gesture_rate || 0 },
                                        { subject: 'Pace', A: Math.min(Math.max((getSessionWPM(latestSession) / 150) * 100, 0), 100) },
                                        { subject: 'Clarity', A: 85 },
                                    ]}>
                                        <PolarGrid stroke="#E5E7EB" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
                                        <Radar name="Current" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-gray-400 italic">No session data</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Session History Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-[#1A1F36]">Session History</h2>
                        <span className="text-[11px] font-bold px-3 py-1 bg-gray-100 text-gray-500 rounded-full uppercase tracking-wider">
                            Last {history.length} Sessions
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    <th className="px-8 py-4">Date</th>
                                    <th className="px-8 py-4">Topic</th>
                                    <th className="px-8 py-4">Duration</th>
                                    <th className="px-8 py-4 text-center">Overall Score</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map((session, idx) => {
                                    let dScore = 0;
                                    if (session.overall_score) {
                                        dScore = typeof session.overall_score === 'string' ? parseFloat(session.overall_score.split('/')[0]) : session.overall_score;
                                    } else {
                                        const p = session.posture?.good_posture_percentage || 0;
                                        const e = session.eye_contact?.eye_contact_percentage || 0;
                                        const g = session.gestures?.hand_gesture_rate || 0;
                                        dScore = Math.round(((p + e + g) / 3) / 10);
                                    }
                                    dScore = Math.min(Math.max(dScore || 0, 0), 10);

                                    const dateDisplay = session.created_at
                                        ? format(new Date(session.created_at), 'MMM dd, yyyy')
                                        : 'Jan 22, 2026';

                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5 text-sm font-medium text-gray-500">{dateDisplay}</td>
                                            <td className="px-8 py-5 text-sm font-bold text-[#1A1F36]">{formatTopic(session.topic)}</td>
                                            <td className="px-8 py-5 text-sm text-gray-400 font-mono">
                                                {Math.floor(session.duration / 60)}m {Math.round(session.duration % 60)}s
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-black ${dScore >= 8 ? 'bg-green-50 text-green-600' : dScore >= 5 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                                                    {dScore} / 10
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button onClick={() => setSelectedSession(session)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">View Details</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Detail Modal - Full Logic Retained */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all" onClick={() => setSelectedSession(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#F9FAFB] px-8 py-6 flex justify-between items-center border-b border-gray-100">
                            <div>
                                <h3 className="text-2xl font-black text-[#1A1F36]">{formatTopic(selectedSession.topic)}</h3>
                                <p className="text-sm font-semibold text-gray-400 mt-1">Full Performance Report</p>
                            </div>
                            <button onClick={() => setSelectedSession(null)} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500">✕</button>
                        </div>
                        <div className="p-8 grid grid-cols-2 gap-6">
                            <div className="col-span-2 bg-indigo-50 rounded-2xl p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Overall Score</p>
                                    <div className="text-4xl font-black text-indigo-900 mt-1">
                                        {selectedSession.overall_score
                                            ? (typeof selectedSession.overall_score === 'string' ? selectedSession.overall_score.split('/')[0] : selectedSession.overall_score)
                                            : Math.round(((selectedSession.posture?.good_posture_percentage || 0) + (selectedSession.eye_contact?.eye_contact_percentage || 0) + (selectedSession.gestures?.hand_gesture_rate || 0)) / 30)
                                        } / 10
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Total Time</p>
                                    <p className="text-2xl font-black text-indigo-900 mt-1">{Math.floor(selectedSession.duration / 60)}m {Math.round(selectedSession.duration % 60)}s</p>
                                </div>
                            </div>
                            {/* Detailed Metrics */}
                            <MetricBox label="Posture" value={selectedSession.posture?.good_posture_percentage} color="bg-green-500" />
                            <MetricBox label="Eye Contact" value={selectedSession.eye_contact?.eye_contact_percentage} color="bg-blue-500" />
                            <MetricBox label="Gestures" value={selectedSession.gestures?.hand_gesture_rate} color="bg-orange-500" />
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Speaking Pace</p>
                                <p className="text-2xl font-black text-[#1A1F36]">{getSessionWPM(selectedSession)} <span className="text-xs font-normal text-gray-400">WPM</span></p>
                                <p className="text-[10px] text-indigo-500 font-bold mt-2">Target: 120-150 WPM</p>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-gray-50 flex justify-end">
                            <button onClick={() => setSelectedSession(null)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">Close Report</button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="max-w-[1600px] mx-auto px-6 mt-12 pt-8 border-t border-gray-200">
                <div className="flex justify-center items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} InteractYou</p>
                </div>
            </footer>
        </div>
    );
};

// Internal Helper for Modal Metrics
const MetricBox = ({ label, value, color }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-[#1A1F36]">{value || 0}%</p>
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${value || 0}%` }}></div>
        </div>
    </div>
);

export default Progress;