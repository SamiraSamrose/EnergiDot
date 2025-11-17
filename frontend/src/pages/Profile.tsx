//### Path: `frontend/src/pages/Profile.tsx`

// frontend/src/pages/Profile.tsx
// User profile and statistics page

import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { usePolkadot } from '../context/PolkadotContext';

interface UserStats {
  total_sales: number;
  total_purchases: number;
  total_energy_sold: number;
  total_energy_bought: number;
  total_revenue: number;
  total_spent: number;
}

const Profile: React.FC = () => {
  const { apiClient } = useApi();
  const { isConnected, selectedAccount } = usePolkadot();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && selectedAccount) {
      fetchUserStats();
    }
  }, [isConnected, selectedAccount]);

  const fetchUserStats = async () => {
    try {
      const response = await apiClient.get('/api/v1/users/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Please connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">
          Your energy trading statistics and achievements
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Address</span>
                <span className="font-mono text-sm">{selectedAccount?.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name</span>
                <span className="font-medium">{selectedAccount?.meta.name || 'Unnamed'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-primary-700 mt-2">
                {stats?.total_sales || 0}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-primary-700 mt-2">
                {stats?.total_purchases || 0}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-600">Net Energy</p>
              <p className="text-2xl font-bold text-primary-700 mt-2">
                {((stats?.total_energy_sold || 0) - (stats?.total_energy_bought || 0)).toFixed(2)} kWh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Energy Sold</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Energy Sold</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {parseFloat(stats?.total_energy_sold?.toString() || '0').toLocaleString()} kWh
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {parseFloat(stats?.total_revenue?.toString() || '0').toFixed(4)} ENRG
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Energy Purchased</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Energy Bought</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {parseFloat(stats?.total_energy_bought?.toString() || '0').toLocaleString()} kWh
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {parseFloat(stats?.total_spent?.toString() || '0').toFixed(4)} ENRG
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
