import React, { useState, useEffect } from 'react';
import './QueueStatus.css';

function QueueStatus() {
  // State variables to hold data that will come from the backend
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [antiStarvationAlerts, setAntiStarvationAlerts] = useState([]);
  const [queueData, setQueueData] = useState([]);

  // useEffect is where you'll fetch data from your backend
  useEffect(() => {
    // Example: Fetching logic will go here
    // fetch('/api/queue-status')
    //   .then(res => res.json())
    //   .then(data => {
    //     setCurrentlyServing(data.currentlyServing);
    //     setAntiStarvationAlerts(data.antiStarvationAlerts);
    //     setQueueData(data.queueData);
    //   });

    // For now, you can leave this empty.
  }, []); // The empty array [] means this effect runs once when the component mounts

  const getPriorityClass = (priority) => {
    if (!priority) return '';
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  return (
    <div className="queue-status-page-container">
      <div className="currently-serving-card">
        <h3 className="card-title">Currently Serving</h3>
        {currentlyServing ? (
          <>
            <p className="current-queue-number">Queue {currentlyServing.queueNumber} - {currentlyServing.name} (Score: {currentlyServing.score})</p>
            <p className="current-service">Service: {currentlyServing.service}</p>
            <p className="current-category">Category: {currentlyServing.category}</p>
          </>
        ) : (
          <p>Loading...</p>
        )}
        <button className="serve-next-button">Serve Next Customer</button>
      </div>

      <div className="anti-starvation-alerts-card">
        <h3 className="anti-starv-title">ANTI-STARVATION ALERTS</h3>
        <div className="alerts-list">
            {antiStarvationAlerts.map((alert, index) => (
            <p key={index} className="alert-item">
                <span className="alert-icon">⏰</span> {alert.name} ({alert.category}) - {alert.waitTime} Minute Wait <span className="aging-bonus">(+{alert.bonus} Aging Bonus)</span>
            </p>
            ))}
        </div>
      </div>
      
      <div className="queue-table-container">
        <table>
          <thead>
            <tr>
              <th>Queue</th>
              <th>Name</th>
              <th>Category</th>
              <th>Service</th>
              <th>Priority</th>
              <th>Wait Time</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {queueData.map((customer, index) => (
              <tr key={index}>
                <td>{customer.queue}</td>
                <td>{customer.name}</td>
                <td>{customer.category}</td>
                <td>{customer.service}</td>
                <td>
                  <span className={`priority-tag ${getPriorityClass(customer.priority)}`}>
                    {customer.priority} ({customer.priorityScore})
                  </span>
                </td>
                <td>{customer.waitTime}</td>
                <td>{customer.urgency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QueueStatus;