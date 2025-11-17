### Path: `frontend/src/pages/Staking.tsx`

// frontend/src/pages/Staking.tsx
// STEP I.02.b - "Earn by Contributing Energy" staking interface

import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { usePolkadot } from '../context/PolkadotContext';

interface StakeInfo {
  staked_amount: string;
  reward_accumulated: string;
  last_claim_block: number;
  energy_contributed_kwh: number;
  data_contributions: number;
  is_active: boolean;
}

const Staking: React.FC = () => {
  const { apiClient } = useApi();
  const { isConnected, selectedAccount } = usePolkadot();
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && selectedAccount) {
      fetchStakeInfo();
    }
  }, [isConnected, selectedAccount]);

  const fetchStakeInfo = async () => {
    try {
      const response = await apiClient.get('/api/v1/staking/info');
      if (response.data.success) {
        setStakeInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stake info:', error);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/staking/stake', {
        amount: stakeAmount
      });

      if (response.data.success) {
        alert('Tokens staked successfully!');
        setStakeAmount('');
        fetchStakeInfo();
      }
    } catch (error: any) {
      alert('Error staking tokens: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/staking/claim');
      if (response.data.success) {
        alert('Rewards claimed successfully!');
        fetchStakeInfo();
      }
    } catch (error: any) {
      alert('Error claiming rewards: ' + (error.response?.data?.error || error.message));
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
            Please connect your wallet to access staking features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stake ENRG Tokens</h1>
        <p className="mt-2 text-gray-600">
          Earn rewards by staking tokens and contributing to the energy grid
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Stake Tokens</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Stake
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum stake: 100 ENRG
                </p>
              </div>

              <button
                onClick={handleStake}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Stake Tokens'}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Staking Rewards</h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
                <p className="text-sm text-gray-600">Available Rewards</p>
                <p className="text-3xl font-bold text-primary-700 mt-2">
                  {parseFloat(stakeInfo?.reward_accumulated || '0').toFixed(4)} ENRG
                </p>
              </div>

              <button
                onClick={handleClaimRewards}
                disabled={loading || !stakeInfo?.reward_accumulated || parseFloat(stakeInfo.reward_accumulated) === 0}
                className="btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Claim Rewards'}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">How Staking Works</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stake ENRG Tokens</p>
                  <p>Lock your tokens to participate in the DePIN network</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Earn Rewards</p>
                  <p>Receive block rewards based on your stake duration</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Boost Earnings</p>
                  <p>Increase rewards by contributing verified energy data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Your Stake</h2>
            {stakeInfo ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Staked Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {parseFloat(stakeInfo.staked_amount || '0').toFixed(2)} ENRG
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Energy Contributed</span>
                      <span className="font-medium">{stakeInfo.energy_contributed_kwh} kWh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Data Contributions</span>
                      <span className="font-medium">{stakeInfo.data_contributions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium ${stakeInfo.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                        {stakeInfo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No active stake found</p>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Staking Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">APY</span>
                <span className="font-medium text-green-600">12.5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Staked</span>
                <span className="font-medium">10.5M ENRG</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Stakers</span>
                <span className="font-medium">1,234</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staking;
