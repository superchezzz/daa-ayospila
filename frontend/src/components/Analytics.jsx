import React, { useState, useEffect } from 'react';
import './Analytics.css';

const API_BASE_URL = 'http://192.168.68.100:5001';

const AnalyticsCard = ({ title, value }) => (
  <div className="analytics-card">
    <div className="card-value">{value}</div>
    <div className="card-title">{title}</div>
  </div>
);

function Analytics() {
  const [ltoServiceAnalytics, setLtoServiceAnalytics] = useState({
    totalCustomersToday: '...',
    averageWaitTime: '...',
    priorityCustomersServed: '...',
    currentQueueLength: '...',
  });

  const [fairnessMetrics, setFairnessMetrics] = useState({
    pwdAverageWaitTime: 'N/A',
    seniorCitizenAverageWaitTime: 'N/A',
    pregnantAverageWaitTime: 'N/A',
    emergencyResponseTime: 'N/A',
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/analytics`);
        const data = await response.json();

        if (response.ok) {
          setLtoServiceAnalytics(data.ltoServiceAnalytics);
          setFairnessMetrics(data.fairnessMetrics);

        } else {
          throw new Error(data.error || 'Failed to fetch analytics');
        }
      } catch (error) {
        console.error("Analytics Fetch Error:", error);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="analytics-container">
        <div className="analytics-section">
            <h2 className="section-title">LTO Service Analytics</h2>
            <div className="cards-grid">
                <AnalyticsCard title="Total Customers Today" value={ltoServiceAnalytics.totalCustomersToday} />
                <AnalyticsCard title="Average Wait Time (Minutes)" value={ltoServiceAnalytics.averageWaitTime} />
                <AnalyticsCard title="Priority Customers Served" value={ltoServiceAnalytics.priorityCustomersServed} />
                <AnalyticsCard title="Current Queue Length" value={ltoServiceAnalytics.currentQueueLength} />
            </div>
        </div>
        <div className="analytics-section">
            <h2 className="section-title">Fairness Metrics</h2>
            <div className="cards-grid">
                 <AnalyticsCard title="PWD Avg Wait Time (Min)" value={fairnessMetrics.pwdAverageWaitTime} />
                 <AnalyticsCard title="Senior Citizen Avg Wait Time (Min)" value={fairnessMetrics.seniorCitizenAverageWaitTime} />
                 <AnalyticsCard title="Pregnant Avg Wait Time (Min)" value={fairnessMetrics.pregnantAverageWaitTime} />
                 <AnalyticsCard title="Emergency Response Time (Min)" value={fairnessMetrics.emergencyResponseTime} />
            </div>
        </div>
    </div>
  );
}

export default Analytics;