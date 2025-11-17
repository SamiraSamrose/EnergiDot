### Path: `frontend/src/components/charts/GridPerformanceChart.tsx`

// frontend/src/components/charts/GridPerformanceChart.tsx
// Grid performance metrics visualization

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useApi } from '../../context/ApiContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  gridZone: string;
}

const GridPerformanceChart: React.FC<Props> = ({ gridZone }) => {
  const { apiClient } = useApi();
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [gridZone]);

  const fetchPerformanceData = async () => {
    try {
      const response = await apiClient.get('/api/v1/analytics/grid-performance', {
        params: { gridZone, hours: 24 }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Group by data type
        const groupedData: { [key: string]: any[] } = {};
        data.forEach((item: any) => {
          if (!groupedData[item.data_type]) {
            groupedData[item.data_type] = [];
          }
          groupedData[item.data_type].push(item);
        });

        const labels = Object.keys(groupedData);
        const avgValues = labels.map(type => {
          const items = groupedData[type];
          const sum = items.reduce((acc, item) => acc + parseFloat(item.avg_value), 0);
          return sum / items.length;
        });

        setChartData({
          labels,
          datasets: [
            {
              label: 'Average Value',
              data: avgValues,
              backgroundColor: 'rgba(14, 165, 233, 0.8)',
              borderColor: 'rgb(14, 165, 233)',
              borderWidth: 1,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching grid performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
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

  return <Bar data={chartData} options={options} />;
};

export default GridPerformanceChart;
