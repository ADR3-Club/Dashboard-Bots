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
  Filler,
} from 'chart.js';
import { format } from 'date-fns';
import { memo } from 'react';
import useLocaleStore from '../../stores/localeStore';
import { formatMemory } from '../../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function MetricsChart({ metrics }) {
  const { locale } = useLocaleStore();

  if (!metrics || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No metrics data available
      </div>
    );
  }

  // Prepare data for Chart.js
  const labels = metrics.map((point) =>
    format(new Date(point.timestamp), 'HH:mm:ss')
  );

  const cpuData = metrics.map((point) => point.cpu || 0);
  const memoryData = metrics.map((point) => (point.memory || 0) / (1024 * 1024)); // Convert to MB

  const data = {
    labels,
    datasets: [
      {
        label: 'CPU (%)',
        data: cpuData,
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Memory (MB)',
        data: memoryData,
        borderColor: 'rgb(16, 185, 129)', // green-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 0) {
                // CPU
                label += context.parsed.y.toFixed(1) + '%';
              } else {
                // Memory
                label += context.parsed.y.toFixed(0) + ' MB';
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 10,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'CPU (%)',
        },
        min: 0,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + '%';
          },
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Memory (MB)',
        },
        min: 0,
        ticks: {
          callback: function (value) {
            return value.toFixed(0) + ' MB';
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="h-64 md:h-80">
      <Line data={data} options={options} />
    </div>
  );
}

export default memo(MetricsChart);
