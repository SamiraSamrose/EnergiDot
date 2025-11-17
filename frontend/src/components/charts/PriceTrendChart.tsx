### Path: `frontend/src/components/charts/PriceTrendChart.tsx`

// frontend/src/components/charts/PriceTrendChart.tsx
// Chart component for price trends over time

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useApi } from '../../context/ApiContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PriceTrendChart: React.FC = () => {
  const { apiClient } = useApi();
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceData();
  }, []);

  const fetchPriceData = async () => {
    try {
      const response = await apiClient.get('/api/v1/analytics/price-trends?days=7');
      if (response.data.success) {
        const data = response.data.data;
        
        setChartData({
          labels: data.map((item: any) => new Date(item.day).toLocaleDateString()),
          datasets: [
            {
              label: 'Average Price (ENRG/kWh)',
              data: data.map((item: any) => parseFloat(item.avg_price)),
              borderColor: 'rgb(14, 165, 233)',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Volume (kWh)',
              data: data.map((item: any) => parseFloat(item.total_volume)),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              yAxisID: 'y1',
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching price trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return <Line data={chartData} options={options} />;
};

export default PriceTrendChart;
