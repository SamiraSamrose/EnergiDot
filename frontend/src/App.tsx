// frontend/src/App.tsx
// STEP I - Main application component with routing

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PolkadotProvider } from './context/PolkadotContext';
import { ApiProvider } from './context/ApiContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Staking from './pages/Staking';
import Devices from './pages/Devices';
import Leaderboard from './pages/Leaderboard';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

const App: React.FC = () => {
  return (
    <PolkadotProvider>
      <ApiProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ApiProvider>
    </PolkadotProvider>
  );
};

export default App;