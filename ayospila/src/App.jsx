import React from 'react';
import { Routes, Route } from 'react-router-dom';
import QueueStatus from './pages/QueueStatus.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<QueueStatus />} />
    </Routes>   
  );
}

export default App;