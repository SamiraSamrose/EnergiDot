// frontend/src/pages/Trading.tsx
// STEP I.02.a - Energy trading interface

import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { usePolkadot } from '../context/PolkadotContext';
import CreateOrderModal from '../components/trading/CreateOrderModal';
import OrderBook from '../components/trading/OrderBook';

const Trading: React.FC = () => {
const { apiClient } = useApi();
const { isConnected, selectedAccount } = usePolkadot();
const [showCreateModal, setShowCreateModal] = useState(false);
const [activeOrders, setActiveOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState({
gridZone: 'all',
energySource: 'all'
});
useEffect(() => {
fetchActiveOrders();
const interval = setInterval(fetchActiveOrders, 10000);
return () => clearInterval(interval);
}, [filter]);
const fetchActiveOrders = async () => {
try {
const params: any = {};
if (filter.gridZone !== 'all') params.gridZone = filter.gridZone;
if (filter.energySource !== 'all') params.energySource = filter.energySource;
const response = await apiClient.get('/api/v1/trades/active', { params });
  if (response.data.success) {
    setActiveOrders(response.data.data);
  }
} catch (error) {
  console.error('Error fetching active orders:', error);
} finally {
  setLoading(false);
}
};
const handleBuyOrder = async (orderId: string) => {
if (!isConnected) {
alert('Please connect your wallet first');
return;
}
try {
  const response = await apiClient.post('/api/v1/trades/buy', { orderId });
  if (response.data.success) {
    alert('Order purchased successfully!');
    fetchActiveOrders();
  }
} catch (error: any) {
  alert('Error purchasing order: ' + (error.response?.data?.error || error.message));
}
};
return (
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
<div className="flex justify-between items-center mb-8">
<div>
<h1 className="text-3xl font-bold text-gray-900">Energy Trading</h1>
<p className="mt-2 text-gray-600">
Buy and sell renewable energy on the decentralized marketplace
</p>
</div>
{isConnected && (
      <button
        onClick={() => setShowCreateModal(true)}
        className="btn-primary"
      >
        Create Sell Order
      </button>
    )}
  </div>

  {!isConnected && (
    <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-800">
        Connect your wallet to create sell orders and purchase energy.
      </p>
    </div>
  )}

  <div className="card mb-8">
    <h2 className="text-lg font-semibold mb-4">Filter Orders</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grid Zone
        </label>
        <select
          value={filter.gridZone}
          onChange={(e) => setFilter({ ...filter, gridZone: e.target.value })}
          className="input-field"
        >
          <option value="all">All Zones</option>
          <option value="NorthAmerica">North America</option>
          <option value="Europe">Europe</option>
          <option value="Asia">Asia</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Energy Source
        </label>
        <select
          value={filter.energySource}
          onChange={(e) => setFilter({ ...filter, energySource: e.target.value })}
          className="input-field"
        >
          <option value="all">All Sources</option>
          <option value="Solar">Solar</option>
          <option value="Wind">Wind</option>
          <option value="Hydro">Hydro</option>
          <option value="Geothermal">Geothermal</option>
          <option value="Battery">Battery</option>
        </select>
      </div>
    </div>
  </div>

  <div className="card">
    <h2 className="text-lg font-semibold mb-4">Active Orders</h2>
    {loading ? (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    ) : (
      <OrderBook orders={activeOrders} onBuy={handleBuyOrder} />
    )}
  </div>

  {showCreateModal && (
    <CreateOrderModal
      onClose={() => setShowCreateModal(false)}
      onSuccess={() => {
        setShowCreateModal(false);
        fetchActiveOrders();
      }}
    />
  )}
</div>
);
};
export default Trading;