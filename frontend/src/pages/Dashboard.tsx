// frontend/src/pages/Dashboard.tsx
// STEP I.02.a - Real-time energy trading dashboard

import React, { useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import { usePolkadot } from '../context/PolkadotContext';
import EnergyMixChart from '../components/charts/EnergyMixChart';
import PriceTrendChart from '../components/charts/PriceTrendChart';
import RecentTrades from '../components/dashboard/RecentTrades';
import GridStatus from '../components/dashboard/GridStatus';

interface DashboardData {
  summary: {
    total_energy_traded: string;
    total_trades: string;
    unique_sellers: string;
    unique_buyers: string;
  };
  byEnergySource: Array<{
    energy_source: string;
    total_energy: string;
    trade_count: string;
  }>;
  recentTrades: Array<any>;
}

const Dashboard: React.FC = () => {
  const { apiClient } = useApi();
  const { isConnected } = usePolkadot();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/api/v1/analytics/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Energy Grid Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Real-time monitoring of decentralized energy trading on Polkadot
        </p>
      </div>

      {!isConnected && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Connect your wallet to access full trading features and view your personal statistics.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <p className="text-sm text-gray-600">Total Energy Traded</p>
          <p className="text-2xl font-bold text-primary-700 mt-2">
            {parseFloat(dashboardData?.summary.total_energy_traded || '0').toLocaleString()} kWh
          </p>
        </div>

        <div className="stat-card">
          <p className="text-sm text-gray-600">Total Trades</p>
          <p className="text-2xl font-bold text-primary-700 mt-2">
            {dashboardData?.summary.total_trades || '0'}
          </p>
        </div>

        <div className="stat-card">
          <p className="text-sm text-gray-600">Active Sellers</p>
          <p className="text-2xl font-bold text-primary-700 mt-2">
            {dashboardData?.summary.unique_sellers || '0'}
          </p>
        </div>

        <div className="stat-card">
          <p className="text-sm text-gray-600">Active Buyers</p>
          <p className="text-2xl font-bold text-primary-700 mt-2">
            {dashboardData?.summary.unique_buyers || '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Energy Mix</h2>
          <EnergyMixChart data={dashboardData?.byEnergySource || []} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Price Trends</h2>
          <PriceTrendChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
          <RecentTrades trades={dashboardData?.recentTrades || []} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Grid Status</h2>
          <GridStatus />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;