// client/src/components/Assessment/ReportView.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReportView = ({ reportEnabled }) => {
  const [reportContent, setReportContent] = useState('Report will appear here after you stop the session.');
  const [recommendationsContent, setRecommendationsContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reportEnabled) {
      fetchReport();
    }
  }, [reportEnabled]);

  const fetchReport = async () => {
    setIsLoading(true);
    console.log('Fetching AI report...');

    setReportContent(`
      <div style="text-align: center; padding: 40px;">
        <div style="border: 5px solid #e5e7eb; border-top: 5px solid #10b981; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
        <p style="color: #6b7280;">Analyzing your performance...</p>
      </div>
    `);
    setRecommendationsContent(`
      <div style="text-align: center; padding: 20px;">
        <p style="color: #6b7280;">Loading recommendations...</p>
      </div>
    `);

    try {
      // Fetch AI report
      const res = await axios.get(`${API_BASE_URL}/api/analysis/ai-report`);
      console.log('AI Report Response:', res.data);
      const aiReport = res.data;

      if (aiReport.error) {
        console.warn('AI Report returned error:', aiReport.message);
        throw new Error(aiReport.message || 'AI Analysis failed');
      }

      if (!aiReport || !aiReport.executive_summary) {
        console.warn('AI Report missing executive summary, falling back.');
        throw new Error('Invalid AI Report format');
      }

      setReportContent(renderAIReport(aiReport));
      setRecommendationsContent(renderAIRecommendations(aiReport));

    } catch (error) {
      console.error('Error fetching AI report:', error);

      // Fallback to regular report
      try {
        console.log('Fetching basic report fallback...');
        const res = await axios.get(`${API_BASE_URL}/api/analysis/report`);
        console.log('Basic Report Response:', res.data);
        const report = res.data;

        if (!report) throw new Error('No basic report data');

        setReportContent(renderBasicReport(report));
        setRecommendationsContent(renderRecommendations(report.recommendations || []));
      } catch (fallbackError) {
        console.error('Fallback report also failed:', fallbackError);
        setReportContent(`
          <div style="text-align: center; padding: 30px;">
            <h3 style="color: #ef4444;">❌ No Report Available</h3>
            <p style="color: #6b7280; margin-top: 10px;">Unable to retrieve analysis. Please try again or check your connection.</p>
          </div>
        `);
        setRecommendationsContent('<p style="color: #6b7280; text-align:center;">Recommendations unavailable</p>');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderAIReport = (aiReport) => {
    if (!aiReport.executive_summary) {
      return '<p style="color: #6b7280;">Report data not available.</p>';
    }

    const exec = aiReport.executive_summary;
    // Sanitize score to prevent "3/10/10" if backend sends "3/10"
    const rawScore = String(exec.overall_score || '0');
    const score = rawScore.split('/')[0].trim();

    return `
      <!-- Overall Score -->
      <div style="text-align: center; background: linear-gradient(135deg, #10b981 0%, #10b981 100%); color: white; padding: 25px; border-radius: 14px; margin-bottom: 16px;">
        <div style="width: 120px; height: 120px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 6px solid rgba(255,255,255,0.3);">
          <div style="font-size: 2.2em; font-weight: 900; background: linear-gradient(135deg, #10b981, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${score}/10</div>
        </div>
        <p style="font-size: 1.2em; font-style: italic; font-weight: 600; line-height: 1.4;">"${exec.one_sentence_verdict}"</p>
        <p style="margin-top: 15px; font-size: 0.8rem; opacity: 0.9; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 10px;">
          * This overall score is an average derived from Content Quality, Body Language, Eye Contact, and Vocal Delivery analysis.
        </p>
      </div>

      ${aiReport.detailed_analysis ? renderDetailedAnalysis(aiReport.detailed_analysis) : ''}

      <!-- Strengths -->
      <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #10b981;">
        <h4 style="color: #10b981; margin-bottom: 10px; font-size: 1em; font-weight: 700;">💪 Your Key Strengths</h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${exec.key_strengths.map(s => `
            <li style="padding: 8px 10px; margin: 6px 0; background: white; border-radius: 6px; border-left: 3px solid #10b981; font-size: 0.88rem; line-height: 1.5;">✅ ${s}</li>
          `).join('')}
        </ul>
      </div>

      <!-- Weaknesses -->
      <div style="background: #fef2f2; border-radius: 12px; padding: 16px; border-left: 4px solid #ef4444;">
        <h4 style="color: #ef4444; margin-bottom: 10px; font-size: 1em; font-weight: 700;">⚠️ Critical Areas to Improve</h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${exec.critical_weaknesses.map(w => `
            <li style="padding: 8px 10px; margin: 6px 0; background: white; border-radius: 6px; border-left: 3px solid #ef4444; font-size: 0.88rem; line-height: 1.5;">❌ ${w}</li>
          `).join('')}
        </ul>
      </div>
    `;
  };

  const renderDetailedAnalysis = (analysis) => {
    const categoryIcons = {
      'body_language': '🤸',
      'eye_contact': '👁️',
      'vocal_delivery': '🗣️',
      'content_quality': '📝'
    };

    // Prioritize Content Quality first
    const orderedKeys = ['content_quality', 'body_language', 'eye_contact', 'vocal_delivery'];

    let html = '<div style="margin-top: 16px;">';

    orderedKeys.forEach((key) => {
      const section = analysis[key];
      if (!section) return;

      const icon = categoryIcons[key] || '📌';
      const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      html += `
        <details open style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 16px; border-left: 5px solid #10b981; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <summary style="cursor: pointer; font-weight: 700; color: #111827; font-size: 1.15rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="display: flex; align-items: center; gap: 8px;">${icon} <span style="font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em;">${title}</span></span>
            <span style="color: #059669; background: #d1fae5; padding: 2px 10px; border-radius: 12px; font-size: 0.9em;">
              ${String(section.score).split('/')[0]}/10
            </span>
          </summary>
          <div style="margin-top: 16px; padding-left: 4px;">
            
            ${key === 'content_quality' && (section.key_missing_points || section.tone_upgrade_suggestions) ? `
              <div style="background: #eff6ff; border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid #bfdbfe;">
                 <p style="font-size: 0.95rem; font-weight: 700; color: #1e40af; margin-bottom: 8px;">💡 Content Enhancements:</p>
                 ${section.key_missing_points ? `
                   <p style="font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 4px;">Points you could add:</p>
                   <ul style="list-style-type: square; padding-left: 20px; margin-bottom: 10px;">
                     ${section.key_missing_points.map(p => `<li style="font-size: 0.9rem; color: #4b5563; margin-bottom: 4px;">${p}</li>`).join('')}
                   </ul>
                 ` : ''}
                 ${section.tone_upgrade_suggestions ? `
                   <p style="font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 4px;">Tone suggestions:</p>
                   <ul style="list-style-type: square; padding-left: 20px; margin-bottom: 0;">
                     ${section.tone_upgrade_suggestions.map(t => `<li style="font-size: 0.9rem; color: #4b5563; margin-bottom: 4px;">${t}</li>`).join('')}
                   </ul>
                 ` : ''}
              </div>
            ` : ''}

            <div style="margin-bottom: 16px;">
              <p style="font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.02em;">Issues found:</p>
              <ul style="list-style-type: disc; padding-left: 24px;">
                 ${section.what_went_wrong && section.what_went_wrong.length > 0
          ? section.what_went_wrong.map(issue => `<li style="font-size: 1rem; color: #4b5563; margin-bottom: 6px; line-height: 1.6;">${issue}</li>`).join('')
          : '<li style="font-size: 1rem; color: #9ca3af; font-style: italic;">No specific issues detected.</li>'}
              </ul>
            </div>

            <div style="margin-bottom: 16px;">
              <p style="font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.02em;">Why it matters:</p>
              <p style="font-size: 1rem; color: #4b5563; line-height: 1.6; padding-left: 4px;">
                ${section.why_it_matters}
              </p>
            </div>

            <div>
              <p style="font-size: 1rem; font-weight: 700; color: #059669; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.02em;">How to improve:</p>
              <ul style="list-style-type: none; padding-left: 0;">
                 ${section.how_to_fix && section.how_to_fix.length > 0
          ? section.how_to_fix.map(fix => `
                        <li style="font-size: 1rem; color: #059669; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5;">
                          <span style="font-size: 1.2em;">✅</span> <span>${fix}</span>
                        </li>`).join('')
          : '<li style="font-size: 1rem; color: #9ca3af;">No fixes suggested.</li>'}
              </ul>
            </div>
            
          </div>
        </details > `;
    });

    html += '</div>';
    return html;
  };

  const renderAIRecommendations = (aiReport) => {
    if (!aiReport.action_plan) {
      return '<p style="color: #6b7280;">No recommendations available.</p>';
    }

    const plan = aiReport.action_plan;

    return `
      <div style="background: #fef3c7; border-radius: 12px; padding: 14px; margin-bottom: 12px; border-left: 4px solid #ef4444;">
        <h4 style="color: #ef4444; margin-bottom: 10px; font-size: 0.95em; font-weight: 700;">🎯 Do This TODAY</h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${plan.immediate_fixes.map(fix => `
            <li style="padding: 8px 10px; margin: 6px 0; background: white; border-radius: 6px; font-size: 0.85rem; line-height: 1.4;"><strong style="color: #ef4444;">NOW:</strong> ${fix}</li>
          `).join('')}
        </ul>
      </div>

      <div style="background: #fff7ed; border-radius: 12px; padding: 14px; margin-bottom: 12px; border-left: 4px solid #f59e0b;">
        <h4 style="color: #f59e0b; margin-bottom: 10px; font-size: 0.95em; font-weight: 700;">📅 This Week's Goals</h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${plan.week_1_goals.map(goal => `
            <li style="padding: 8px 10px; margin: 6px 0; background: white; border-radius: 6px; font-size: 0.85rem; line-height: 1.4;">${goal}</li>
          `).join('')}
        </ul>
      </div>

      <div style="background: #f0f9ff; border-radius: 12px; padding: 14px; border-left: 4px solid #10b981;">
        <h4 style="color: #10b981; margin-bottom: 10px; font-size: 0.95em; font-weight: 700;">🚀 Long-Term Development</h4>
    <ul style="list-style: none; padding: 0; margin: 0;">
      ${plan.long_term_development.map(dev => `
            <li style="padding: 8px 10px; margin: 6px 0; background: white; border-radius: 6px; font-size: 0.85rem; line-height: 1.4;">${dev}</li>
          `).join('')}
    </ul>
  </div>

      ${aiReport.motivation ? `
        <div style="background: linear-gradient(135deg, #10b981, #10b981); color: white; padding: 16px; border-radius: 12px; margin-top: 16px;">
          <h4 style="color: white; margin-bottom: 10px; font-size: 0.95em;">🌟 What You Did Well</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${aiReport.motivation.what_you_did_well.map(w => `
              <li style="padding: 6px 10px; margin: 5px 0; background: rgba(255,255,255,0.15); border-radius: 6px; font-size: 0.85rem;">✨ ${w}</li>
            `).join('')}
          </ul>
          <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 0.88rem;">
            <p style="font-weight: 600; margin-bottom: 6px;">🎯 Next Milestone:</p>
            <p>${aiReport.motivation.realistic_next_milestone}</p>
          </div>
          <p style="font-size: 1em; font-style: italic; text-align: center; margin-top: 15px; font-weight: 600; line-height: 1.4;">
            ${aiReport.motivation.encouraging_note}
          </p>
        </div>
      ` : ''
      }
`;
  };

  const renderBasicReport = (report) => {
    if (!report || !report.posture) {
      return 'Report data not available.';
    }

    const posture = report.posture;
    const eye = report.eye_contact;
    const gest = report.gestures;
    const speech = report.speech;
    const nlp = report.nlp_analysis;

    return `
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px;">
        <span class="badge ${posture.good_posture_percentage >= 70 ? 'positive' : 'warning'}">
          Posture: ${posture.good_posture_percentage}% good
        </span>
        <span class="badge ${eye.eye_contact_percentage >= 60 ? 'positive' : 'warning'}">
          Eye Contact: ${eye.eye_contact_percentage}%
        </span>
        <span class="badge">Gestures: ${gest.hand_gesture_rate}%</span>
        <span class="badge">WPM: ${speech.words_per_minute}</span>
      </div>
      <div style="margin-bottom:4px;">
        <strong>Topic:</strong> ${report.topic || 'Unknown'} ${report.is_custom ? '(custom)' : ''}
      </div>
      <div style="margin-bottom:4px;">
        <strong>Duration:</strong> ${report.duration}s &nbsp;
        <strong>Total words:</strong> ${speech.total_words} &nbsp;
        <strong>Filler:</strong> ${speech.filler_words} (${speech.filler_word_percentage}%)
      </div>
`;
  };

  const renderRecommendations = (recs) => {
    if (!recs || recs.length === 0) {
      return 'Recommendations will appear here after analysis.';
    }

    return recs.map(rec => {
      const priorityClass = rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'medium' : rec.priority === 'low' ? 'low' : 'success';

      return `
        <div style="margin-bottom:6px;">
          <div class="tag ${priorityClass}">${rec.category} — ${rec.priority.toUpperCase()}</div>
          <div style="margin-top:2px; font-weight:600;">${rec.issue}</div>
          <div style="margin-top:1px; color:#4b5563;">${rec.suggestion}</div>
        </div>
      `;
    }).join('');
  };

  return (
    <div className="report-section">
      <div className="report-block" id="reportBlock">
        <h4>📊 Performance Analysis Report</h4>
        <div id="reportContent" dangerouslySetInnerHTML={{ __html: reportContent }}></div>
      </div>

      <div className="report-block">
        <h4>💡 Personalized Recommendations</h4>
        <div id="recommendationsContainer" dangerouslySetInnerHTML={{ __html: recommendationsContent }}></div>
      </div>
    </div>
  );
};

export default ReportView;