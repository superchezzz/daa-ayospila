import React, { useState, useEffect } from 'react';
import './QueueStatus.css';

function QueueStatus() {
  const API_BASE_URL = 'http://192.168.68.100:5001';
  
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [antiStarvationAlerts, setAntiStarvationAlerts] = useState([]);
  const [queueData, setQueueData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueueData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/queue`);
      const data = await response.json();
      if (response.ok) {
        setCurrentlyServing(data.currentlyServing);
        setAntiStarvationAlerts(data.antiStarvationAlerts);
        setQueueData(data.queue);
      } else {
        throw new Error(data.error || 'Failed to fetch queue data');
      }
    } catch (error) {
      console.error("Queue Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleServeNext = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/queue/serve-next`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchQueueData(); // Immediately refresh data after serving
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to serve next customer');
      }
    } catch (error) {
      console.error("Serve Next Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // useEffect is where you'll fetch data from your backend
  useEffect(() => {
    fetchQueueData(); // Fetch data once immediately on load
    const intervalId = setInterval(fetchQueueData, 5000); // Then, fetch again every 5 seconds
    
    // This is a cleanup function that stops the timer when you leave the page
    return () => clearInterval(intervalId); 
  }, []); // The empty array [] means this setup runs only once

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
        {isLoading ? (
          <p>Loading...</p>
        ) : currentlyServing ? (
          <>
            <p className="current-queue-number">Queue {currentlyServing.queueNumber} - {currentlyServing.fullName} (Score: {currentlyServing.score})</p>
            <p className="current-service">Service: {currentlyServing.service}</p>
            <p className="current-category">Category: {currentlyServing.category}</p>
          </>
        ) : (
          <p>No one is currently being served.</p>
        )}
        <button className="serve-next-button" onClick={handleServeNext}>Serve Next Customer</button>
      </div>

      <div className="anti-starvation-alerts-card">
        <h3 className="anti-starv-title">ANTI-STARVATION ALERTS</h3>
        <div className="alerts-list">
            {antiStarvationAlerts.length > 0 ? antiStarvationAlerts.map((alert, index) => (
            <p key={index} className="alert-item">
                <span className="alert-icon">⏰</span> {alert.message}
            </p>
            )) : (
              <p>No alerts at this time.</p>
            )}
        </div>
      </div>
      
      <div className="queue-table-container">
        <table>
          <thead>
            <tr>
              <th>Queue #</th> 
              <th>Name</th>
              <th>Category</th>
              <th>Service</th>
              <th>Priority</th>
              <th>Wait Time</th>
              <th>Urgency</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7">Loading queue...</td></tr>
            ) : queueData.length > 0 ? (
                queueData.map((customer) => (
                <tr key={customer.id}> {/* Use unique ID for key */}
                    <td>{customer.queueNumber}</td> {/* Use queueNumber */}
                    <td>{customer.name}</td>
                    <td>{customer.category}</td>
                    <td>{customer.service}</td>
                    <td>
                      {/* Access the nested priority object */}
                      <span className={`priority-tag ${getPriorityClass(customer.priority.level)}`}>
                        {customer.priority.level} ({customer.priority.score})
                      </span>
                    </td>
                    <td>{customer.waitTime} min</td> {/* Add "min" for clarity */}
                    <td>{customer.urgency}</td>
                </tr>
                ))
            ) : (
              <tr><td colSpan="7">The queue is currently empty.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QueueStatus;