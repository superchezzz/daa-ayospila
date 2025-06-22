import React, { useState } from 'react';
import QueueStatus from './components/QueueStatus.jsx';
import AddRegistrant from './components/AddRegistrant.jsx';
import Analytics from './components/Analytics.jsx';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('queueStatus');

  const renderPage = () => {
    switch (activePage) {
      case 'addRegistrant':
        return <AddRegistrant />;
      case 'analytics':
        return <Analytics />;
      case 'queueStatus':
      default:
        return <QueueStatus />;
    }
  };

  return (
    <div className="app-container">
      <div className="ayospila-header">
        <h1><span className="ayos-text">Ayos</span><span className="pila-text">Pila:</span> A Quicksort-Enabled Queue Management System</h1>
        <p>Enhancing Public Service Efficiency Through Smart Queuing at LTO Offices</p>
      </div>

      <div className="queue-options-container">
        <button className={`option-button ${activePage === 'queueStatus' ? 'active' : ''}`} onClick={() => setActivePage('queueStatus')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.1583 18.3333C17.1583 15.1083 13.95 12.5 10 12.5C6.05001 12.5 2.84167 15.1083 2.84167 18.3333" stroke={activePage === 'queueStatus' ? 'white' : '#2B3467'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 10.0001C12.3012 10.0001 14.1667 8.1346 14.1667 5.83341C14.1667 3.53223 12.3012 1.66675 10 1.66675C7.69882 1.66675 5.83334 3.53223 5.83334 5.83341C5.83334 8.1346 7.69882 10.0001 10 10.0001Z" stroke={activePage === 'queueStatus' ? 'white' : '#2B3467'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Queue Status
        </button>
        <button className={`option-button ${activePage === 'addRegistrant' ? 'active' : ''}`} onClick={() => setActivePage('addRegistrant')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.25 10H18.75" stroke={activePage === 'addRegistrant' ? 'white' : '#2B3467'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 18.75L10 1.25" stroke={activePage === 'addRegistrant' ? 'white' : '#2B3467'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add Registrant
        </button>
        <button className={`option-button ${activePage === 'analytics' ? 'active' : ''}`} onClick={() => setActivePage('analytics')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 18.3333H17.5" stroke={activePage === 'analytics' ? 'white' : '#2B3467'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.66665 6.9834H3.33333C2.875 6.9834 2.5 7.3584 2.5 7.81673V15.0001C2.5 15.4584 2.875 15.8334 3.33333 15.8334H4.66665C5.12498 15.8334 5.49998 15.4584 5.49998 15.0001V7.81673C5.49998 7.3584 5.12498 6.9834 4.66665 6.9834Z" stroke={activePage === 'analytics' ? 'white' : '#2B3467'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.6666 4.3252H9.33333C8.875 4.3252 8.5 4.7002 8.5 5.15853V15.0002C8.5 15.4585 8.875 15.8335 9.33333 15.8335H10.6666C11.125 15.8335 11.5 15.4585 11.5 15.0002V5.15853C11.5 4.7002 11.125 4.3252 10.6666 4.3252Z" stroke={activePage === 'analytics' ? 'white' : '#2B3467'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.6666 1.66675H15.3333C14.875 1.66675 14.5 2.04175 14.5 2.50008V15.0001C14.5 15.4584 14.875 15.8334 15.3333 15.8334H16.6666C17.125 15.8334 17.5 15.4584 17.5 15.0001V2.50008C17.5 2.04175 17.125 1.66675 16.6666 1.66675Z" stroke={activePage === 'analytics' ? 'white' : '#2B3467'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Analytics
        </button>
      </div>

      <div className="page-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;