//### Path: `frontend/src/components/charts/EnergyMixChart.tsx`

// frontend/src/components/charts/EnergyMixChart.tsx
// Chart component for energy source distribution

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EnergyMixData {
  energy_source: string;
  total_energy: string;
  percentage?: string;
}

interface Props {
  data: EnergyMixData[];
}

const EnergyMixChart: React.FC<Props> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.energy_source),
    datasets: [
      {
        label: 'Energy (kWh)',
        data: data.map(item => parseFloat(item.total_energy)),
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',  // Solar - Orange
          'rgba(59, 130, 246, 0.8)',   // Wind - Blue
          'rgba(6, 182, 212, 0.8)',    // Hydro - Cyan
          'rgba(139, 92, 246, 0.8)',   // Battery - Purple
          'rgba(34, 197, 94, 0.8)',    // Geothermal - Green
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toLocaleString()} kWh`;
          }
        }
      }
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return <Pie data={chartData} options={options} />;
};

export default EnergyMixChart;
