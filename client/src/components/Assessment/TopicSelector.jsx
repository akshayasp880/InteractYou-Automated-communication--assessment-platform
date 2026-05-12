import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TopicSelector = ({ onTopicSelect, selectedTopicId, isCustomTopic }) => {
  const [topicsData, setTopicsData] = useState({});
  const [viewingSubtopicsOf, setViewingSubtopicsOf] = useState(null);
  const [topicTitleText, setTopicTitleText] = useState('Select Your Practice Topic');
  const [topicPanelSubtitle, setTopicPanelSubtitle] = useState('Choose from categories below or enter custom.');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  const topicEmoji = {
    "Interview Prep": "💼",
    "Student": "🎓",
    "Ai": "🤖",
    "Finance": "💰",
    "Agriculture": "🌾",
    "Women": "👩‍💼"
  };

  useEffect(() => {
    // Fetch topics from backend
    console.log(`Fetching topics from: ${API_BASE_URL}/api/topics`);
    axios.get(`${API_BASE_URL}/api/topics`)
      .then(response => {
        console.log('Topics API response:', response.data);
        if (!response.data || Object.keys(response.data).length === 0) {
          console.warn('Received empty topics data from API.');
        }
        setTopicsData(response.data || {});
      })
      .catch(error => {
        console.error('Error fetching topics:', error);
        // Optional: Set fallback data for demo if API fails
        // setTopicsData(FALLBACK_TOPICS); 
      });
  }, []);

  console.log('Rendering TopicSelector with topics:', topicsData);

  const prettifyMainName = (name) => {
    if (name.includes(' ')) return name;
    const withSpaces = name
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    return withSpaces
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const prettifySubtopicName = (name) => {
    if (name.includes(' ')) return name;
    const withSpaces = name
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    return withSpaces
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const showSubtopics = (mainId, topicInfo) => {
    setViewingSubtopicsOf(mainId);
    setTopicPanelSubtitle('Choose a specific topic under ' + prettifyMainName(topicInfo.display_name || mainId) + '.');
    setSelectedCard(null);
  };

  const handleBackToMain = () => {
    setViewingSubtopicsOf(null);
    setTopicTitleText('Select Your Practice Topic');
    setTopicPanelSubtitle('Choose from categories below or enter custom.');
    setSelectedCard(null);
  };

  const handleSubtopicClick = (mainId, subId, subData) => {
    setSelectedCard(`${mainId}_${subId}`);
    const label = prettifySubtopicName(subData.display_name || subId);
    setTopicTitleText(label);
    onTopicSelect(subId, false, mainId);
    setCustomTopicInput('');
  };

  const handleCustomTopicChange = (e) => {
    const val = e.target.value;
    setCustomTopicInput(val);
    if (val.length > 0) {
      const label = 'Custom: ' + val;
      setTopicTitleText(label);
      onTopicSelect(val, true, null);
      setSelectedCard(null);
    } else {
      setTopicTitleText('Select Your Practice Topic');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            {topicTitleText}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {topicPanelSubtitle}
          </p>
        </div>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors ${!viewingSubtopicsOf ? 'hidden' : ''}`}
          onClick={handleBackToMain}
        >
          <span>←</span> Back
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {!viewingSubtopicsOf ? (
          // Main topics grid
          Object.entries(topicsData || {}).map(([mainId, topicInfo]) => {
            const rawLabel = topicInfo.display_name || mainId;
            const label = prettifyMainName(rawLabel);
            return (
              <button
                key={mainId}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all h-32 group"
                type="button"
                onClick={() => showSubtopics(mainId, topicInfo)}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{topicEmoji[label] || '📌'}</div>
                <div className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 text-center leading-tight">{label}</div>
              </button>
            );
          })
        ) : (
          // Subtopics grid
          Object.entries(topicsData[viewingSubtopicsOf]?.subtopics || {}).map(([subId, subData]) => {
            const rawName = subData.display_name || subId;
            const isSelected = selectedCard === `${viewingSubtopicsOf}_${subId}`;
            return (
              <button
                key={subId}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border shadow-sm transition-all h-28 ${isSelected
                  ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-white border-gray-100 hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5'
                  }`}
                type="button"
                onClick={() => handleSubtopicClick(viewingSubtopicsOf, subId, subData)}
              >
                <div className={`text-sm font-medium text-center leading-tight ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {prettifySubtopicName(rawName)}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-auto bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <label htmlFor="customTopicInput" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>✏️</span> OR ENTER CUSTOM TOPIC
        </label>
        <input
          type="text"
          id="customTopicInput"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder-gray-400"
          placeholder="E.g., Climate Change, Financial Planning..."
          value={customTopicInput}
          onChange={handleCustomTopicChange}
        />
      </div>
    </div>
  );
};

export default TopicSelector;