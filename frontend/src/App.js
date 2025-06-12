import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import TracityDashboard from './components/TracityDashboard';
import DataExplorer from './components/DataExplorer';
import TracityNavbar from './components/TracityNavbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [stats, setStats] = useState({
    total_visualizations: 7000,
    total_users: 12000,
    total_datasets: 5,
    total_insights: 2500
  });

  useEffect(() => {
    // Fetch platform stats
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900 text-slate-100">
          <TracityNavbar />
          <Routes>
            <Route path="/" element={<TracityDashboard stats={stats} />} />
            <Route path="/explorer" element={<DataExplorer />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
