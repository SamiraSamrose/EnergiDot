### Path: `frontend/src/components/dashboard/RecentTrades.tsx`

// frontend/src/components/dashboard/RecentTrades.tsx
// Recent trades display component

import React from 'react';

interface Trade {
  order_id: string;
  seller_account_id: string;
  buyer_account_id: string;
  energy_amount: number;
  price_per_kwh: number;
  energy_source: string;
  status: string;
  created_at: string;
}

interface Props {
  trades: Trade[];
}

const RecentTrades: React.FC<Props> = ({ trades }) => {
  const formatAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getEnergySourceColor = (source: string) => {
    const colors: { [key: string]: string } = {
      Solar: 'text-yellow-700 bg-yellow-100',
      Wind: 'text-blue-700 bg-blue-100',
      Hydro: 'text-cyan-700 bg-cyan-100',
      Battery: 'text-purple-700 bg-purple-100',
      Geothermal: 'text-green-700 bg-green-100',
    };
    return colors[source] || 'text-gray-700 bg-gray-100';
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent trades
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => (
        <div
          key={trade.order_id}
          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEnergySourceColor(trade.energy_source)}`}>
              {trade.energy_source}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(trade.created_at).toLocaleString()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600">Energy</p>
              <p className="font-medium">{trade.energy_amount} kWh</p>
            </div>
            <div>
              <p className="text-gray-600">Price</p>
              <p className="font-medium">{parseFloat(trade.price_per_kwh.toString()).toFixed(4)} ENRG/kWh</p>
            </div>
          </div>
          
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            <span>From: {formatAddress(trade.seller_account_id)}</span>
<span>→</span>
<span>To: {formatAddress(trade.buyer_account_id || 'Pending')}</span>
</div>
</div>
))}
</div>
);
};
export default RecentTrades;

