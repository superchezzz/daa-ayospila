import React from 'react';
import './QueueStatus.css';

function QueueStatus() {
  const currentlyServing = {
    queueNumber: '#001',
    name: 'Chezter Reblando',
    score: 18,
    service: "Driver's License Renewal",
    category: 'Regular',
  };

  const antiStarvationAlerts = [
  ];

  const queueData = [];
  const getPriorityClass = (priority) => {
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
    <div className="queue-status-container">
      <div className="ayospila-header">
        <h1><span class="ayos-text">Ayos</span><span class="pila-text">Pila:</span> A Quicksort-Enabled Queue Management System</h1>
        <p>Enhancing Public Service Efficiency Through Smart Queuing at LTO Offices</p>
      </div>

      <div className="queue-options-container">
        <button className="option-button active">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.1583 18.3333C17.1583 15.1083 13.95 12.5 10 12.5C6.05001 12.5 2.84167 15.1083 2.84167 18.3333" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 10.0001C12.3012 10.0001 14.1667 8.1346 14.1667 5.83341C14.1667 3.53223 12.3012 1.66675 10 1.66675C7.69882 1.66675 5.83334 3.53223 5.83334 5.83341C5.83334 8.1346 7.69882 10.0001 10 10.0001Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Queue Status
        </button>
        <button className="option-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.25 10H18.75" stroke="#2B3467" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 18.75L10 1.25" stroke="#2B3467" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
            Add Registrant
        </button>
        
        <button className="option-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 18.3333H17.5" stroke="#2B3467" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4.66665 6.9834H3.33333C2.875 6.9834 2.5 7.3584 2.5 7.81673V15.0001C2.5 15.4584 2.875 15.8334 3.33333 15.8334H4.66665C5.12498 15.8334 5.49998 15.4584 5.49998 15.0001V7.81673C5.49998 7.3584 5.12498 6.9834 4.66665 6.9834Z" stroke="#2B3467" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10.6666 4.3252H9.33333C8.875 4.3252 8.5 4.7002 8.5 5.15853V15.0002C8.5 15.4585 8.875 15.8335 9.33333 15.8335H10.6666C11.125 15.8335 11.5 15.4585 11.5 15.0002V5.15853C11.5 4.7002 11.125 4.3252 10.6666 4.3252Z" stroke="#2B3467" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16.6666 1.66675H15.3333C14.875 1.66675 14.5 2.04175 14.5 2.50008V15.0001C14.5 15.4584 14.875 15.8334 15.3333 15.8334H16.6666C17.125 15.8334 17.5 15.4584 17.5 15.0001V2.50008C17.5 2.04175 17.125 1.66675 16.6666 1.66675Z" stroke="#2B3467" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>

          Analytics
        </button> 
      </div>

      <div className="currently-serving-card">
        <h3 className="card-title">Currently Serving</h3>
        <p className="current-queue-number">Queue {currentlyServing.queueNumber} - {currentlyServing.name} (Score: {currentlyServing.score})</p>
        <p className="current-service">Service: {currentlyServing.service}</p>
        <p className="current-category">Category: {currentlyServing.category}</p>
        <button className="serve-next-button">Serve Next Customer</button>
      </div>

      <div className="anti-starvation-alerts-card card">
        <h3 className="card-title">ANTI-STARVATION ALERTS</h3>
        {antiStarvationAlerts.map((alert, index) => (
          <p key={index} className="alert-item">
            ⏰ {alert.name} ({alert.category}) - {alert.waitTime} Minute Wait (+{alert.bonus} Aging Bonus)
          </p>
        ))}
      </div>
      
      <div className="queue-table-container card">
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
                  <span className={getPriorityClass(customer.priority)}>
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