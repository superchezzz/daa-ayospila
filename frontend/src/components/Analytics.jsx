import React, { useState, useEffect } from 'react';
import './Analytics.css';

const AnalyticsCard = ({ title, value }) => (
  <div className="analytics-card">
    <div className="card-value">{value}</div>
    <div className="card-title">{title}</div>
  </div>
);

function Analytics() {
  const [ltoServiceAnalytics, setLtoServiceAnalytics] = useState([
    { title: 'Total Customers Served Today', value: '...' },
    { title: 'Average Wait Time (Minutes)', value: '...' },
    { title: 'Priority Customers Served', value: '...' },
    { title: 'Current Queue Length', value: '...' },
  ]);

  const [fairnessMetrics, setFairnessMetrics] = useState([
    { title: 'PWD Avg Wait Time (Min)', value: '...' },
    { title: 'Senior Citizen Avg Wait Time (Min)', value: '...' },
    { title: 'Pregnant Avg Wait Time (Min)', value: '...' },
    { title: 'Emergency Response Time (Min)', value: '...' },
  ]);

  useEffect(() => {
    // Fetch analytics data from the backend here
    // fetch('/api/analytics')
    //   .then(res => res.json())
    //   .then(data => {
    //      setLtoServiceAnalytics(data.ltoServiceAnalytics);
    //      setFairnessMetrics(data.fairnessMetrics);
    //   });
  }, []);

  return (
    <div className="analytics-container">
        <div className="analytics-section">
            <h2 className="section-title">LTO Service Analytics</h2>
            <div className="cards-grid">
                {ltoServiceAnalytics.map(metric => <AnalyticsCard key={metric.title} {...metric} />)}
            </div>
        </div>
        <div className="analytics-section">
            <h2 className="section-title">Fairness Metrics</h2>
            <div className="cards-grid">
                 {fairnessMetrics.map(metric => <AnalyticsCard key={metric.title} {...metric} />)}
            </div>
        </div>
    </div>
  );
}

export default Analytics;