//### Path: `frontend/src/components/dashboard/GridStatus.tsx`

// frontend/src/components/dashboard/GridStatus.tsx
// Real-time grid status display

import React, { useEffect, useState } from 'react';
import { useApi } from '../../context/ApiContext';

interface GridMetric {
  data_type: string;
  value: number;
  unit: string;
  data_source: string;
  timestamp: string;
}

const GridStatus: React.FC = () => {
  const { apiClient } = useApi();
  const [metrics, setMetrics] = useState<GridMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGridStatus();
    const interval = setInterval(fetchGridStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchGridStatus = async () => {
    try {
      const response = await apiClient.get('/api/v1/grid/status');
      if (response.data.success) {
        setMetrics(response.data.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching grid status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      solar_production: '☀️',
      wind_production: '💨',
      grid_load: '⚡',
      temperature: '🌡️',
      cloud_cover: '☁️',
    };
    return icons[type] || '📊';
  };

  const formatMetricName = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No grid data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getMetricIcon(metric.data_type)}</span>
              <span className="font-medium text-gray-900">
                {formatMetricName(metric.data_type)}
              </span>
            </div>
            <span className="text-xs text-gray-500">{metric.data_source}</span>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-primary-700">
              {metric.value.toFixed(2)}
            </span>
            <span className="text-sm text-gray-600">{metric.unit}</span>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Updated: {new Date(metric.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ))}
      
      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-xs text-green-800">
          ✓ Grid operating normally. All systems online.
        </p>
      </div>
    </div>
  );
};

export default GridStatus;
