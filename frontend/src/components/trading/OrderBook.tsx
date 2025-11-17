//### Path: `frontend/src/components/trading/OrderBook.tsx`

// frontend/src/components/trading/OrderBook.tsx
// Order book display component

import React from 'react';

interface Order {
  order_id: string;
  seller_account_id: string;
  energy_amount: number;
  price_per_kwh: number;
  total_price: number;
  grid_zone: string;
  energy_source: string;
  created_at: string;
}

interface Props {
  orders: Order[];
  onBuy: (orderId: string) => void;
}

const OrderBook: React.FC<Props> = ({ orders, onBuy }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getEnergySourceColor = (source: string) => {
    const colors: { [key: string]: string } = {
      Solar: 'bg-yellow-100 text-yellow-800',
      Wind: 'bg-blue-100 text-blue-800',
      Hydro: 'bg-cyan-100 text-cyan-800',
      Battery: 'bg-purple-100 text-purple-800',
      Geothermal: 'bg-green-100 text-green-800',
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No active orders available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Energy Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price/kWh
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Seller
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Zone
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.order_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEnergySourceColor(order.energy_source)}`}>
                  {order.energy_source}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {order.energy_amount} kWh
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {parseFloat(order.price_per_kwh.toString()).toFixed(4)} ENRG
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-700">
                {parseFloat(order.total_price.toString()).toFixed(4)} ENRG
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                {formatAddress(order.seller_account_id)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {order.grid_zone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  onClick={() => onBuy(order.order_id)}
                  className="btn-primary text-sm"
                >
                  Buy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderBook;
