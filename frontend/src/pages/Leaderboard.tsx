//### Path: `frontend/src/pages/Leaderboard.tsx`

// frontend/src/pages/Leaderboard.tsx
// STEP I.02.c - Gamified leaderboard for top renewable contributors

import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';

interface LeaderboardEntry {
  account_id: string;
  username: string;
  total_energy_kwh: number;
  total_trades: number;
  reputation_tier: string;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const { apiClient } = useApi();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await apiClient.get('/api/v1/staking/leaderboard?limit=100');
      if (response.data.success) {
        setLeaderboard(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: { [key: string]: string } = {
      Bronze: 'text-orange-700 bg-orange-100',
      Silver: 'text-gray-700 bg-gray-200',
      Gold: 'text-yellow-700 bg-yellow-100',
      Platinum: 'text-blue-700 bg-blue-100',
      Diamond: 'text-purple-700 bg-purple-100'
    };
    return colors[tier] || 'text-gray-700 bg-gray-100';
  };

  const getTierBadge = (tier: string) => {
    const badges: { [key: string]: string } = {
      Bronze: '🥉',
      Silver: '🥈',
      Gold: '🥇',
      Platinum: '💎',
      Diamond: '👑'
    };
    return badges[tier] || '🏅';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Top Contributors</h1>
        <p className="mt-2 text-gray-600">
          Leaderboard of the most impactful renewable energy contributors
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {leaderboard.slice(0, 3).map((entry, index) => (
          <div
            key={entry.account_id}
            className={`card ${
              index === 0
                ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100'
                : index === 1
                ? 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-50 to-gray-100'
                : 'ring-2 ring-orange-400 bg-gradient-to-br from-orange-50 to-orange-100'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {entry.username || formatAddress(entry.account_id)}
              </h3>
              <p className="text-2xl font-bold text-primary-700 mb-2">
                {entry.total_energy_kwh.toLocaleString()} kWh
              </p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">{getTierBadge(entry.reputation_tier)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierColor(entry.reputation_tier)}`}>
                  {entry.reputation_tier}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Full Leaderboard</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contributor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Energy Contributed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Trades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
Tier
</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{leaderboard.map((entry) => (
<tr key={entry.account_id} className="hover:bg-gray-50">
<td className="px-6 py-4 whitespace-nowrap">
<div className="flex items-center">
<span className="text-lg font-semibold text-gray-900">
#{entry.rank}
</span>
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm font-medium text-gray-900">
{entry.username || formatAddress(entry.account_id)}
</div>
<div className="text-xs text-gray-500">
{formatAddress(entry.account_id)}
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm font-semibold text-primary-700">
{entry.total_energy_kwh.toLocaleString()} kWh
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm text-gray-900">
{entry.total_trades}
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap">
<span className={inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTierColor(entry.reputation_tier)}}>
<span className="mr-1">{getTierBadge(entry.reputation_tier)}</span>
{entry.reputation_tier}
</span>
</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</div>
<div className="mt-8 card">
    <h2 className="text-lg font-semibold mb-4">Reputation Tiers</h2>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="text-center p-4 bg-orange-50 rounded-lg">
        <div className="text-3xl mb-2">🥉</div>
        <div className="font-semibold text-gray-900">Bronze</div>
        <div className="text-xs text-gray-600 mt-1">0 - 1,000 kWh</div>
      </div>
      <div className="text-center p-4 bg-gray-100 rounded-lg">
        <div className="text-3xl mb-2">🥈</div>
        <div className="font-semibold text-gray-900">Silver</div>
        <div className="text-xs text-gray-600 mt-1">1,000 - 5,000 kWh</div>
      </div>
      <div className="text-center p-4 bg-yellow-50 rounded-lg">
        <div className="text-3xl mb-2">🥇</div>
        <div className="font-semibold text-gray-900">Gold</div>
        <div className="text-xs text-gray-600 mt-1">5,000 - 20,000 kWh</div>
      </div>
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-3xl mb-2">💎</div>
        <div className="font-semibold text-gray-900">Platinum</div>
        <div className="text-xs text-gray-600 mt-1">20,000+ kWh</div>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-3xl mb-2">👑</div>
        <div className="font-semibold text-gray-900">Diamond</div>
        <div className="text-xs text-gray-600 mt-1">Top 1% Contributors</div>
      </div>
    </div>
  </div>
</div>
);
};
export default Leaderboard;

