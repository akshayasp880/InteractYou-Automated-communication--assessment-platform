const MetricsPanel = ({ metrics }) => {
  const { posture, engagement, speech } = metrics;

  return (
    <div className="metrics-strip">
      <div className="metric-pill">
        <span className="metric-label">
          <span className="metric-dot posture"></span>
          Posture
        </span>
        <span className="metric-value" id="metricPosture">
          {posture || 'Analyzing…'}
        </span>
      </div>
      <div className="metric-pill">
        <span className="metric-label">
          <span className="metric-dot engagement"></span>
          Engagement
        </span>
        <span className="metric-value" id="metricEngagement">
          {engagement || 'Analyzing…'}
        </span>
      </div>
      <div className="metric-pill">
        <span className="metric-label">
          <span className="metric-dot speech"></span>
          Speech
        </span>
        <span className="metric-value" id="metricSpeech">
          {speech || 'Waiting…'}
        </span>
      </div>
    </div>
  );
};

export default MetricsPanel;