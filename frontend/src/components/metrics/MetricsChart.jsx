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
import { memo, useState } from 'react';
import { Download } from 'lucide-react';
import useLocaleStore from '../../stores/localeStore';

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

function MetricsChart({ metrics, processName = 'process' }) {
  const { t } = useLocaleStore();
  const [filter, setFilter] = useState('all'); // 'all' | 'cpu' | 'memory'

  // Export metrics to CSV
  const exportToCSV = () => {
    if (!metrics || metrics.length === 0) return;

    const headers = ['Timestamp', 'Date/Time', 'CPU (%)', 'Memory (MB)'];
    const rows = metrics.map((point) => [
      point.timestamp,
      format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      (point.cpu || 0).toFixed(2),
      ((point.memory || 0) / (1024 * 1024)).toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metrics-${processName}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!metrics || metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        {t('metrics.noData')}
      </div>
    );
  }

  // Prepare data for Chart.js
  const labels = metrics.map((point) =>
    format(new Date(point.timestamp), 'HH:mm:ss')
  );

  const cpuData = metrics.map((point) => point.cpu || 0);
  const memoryData = metrics.map((point) => (point.memory || 0) / (1024 * 1024)); // Convert to MB

  // Calculate dynamic max values with 20% margin, rounded nicely
  const maxCpuValue = Math.max(...cpuData);
  const maxMemoryValue = Math.max(...memoryData);
  const maxCpu = Math.max(Math.ceil(maxCpuValue * 1.2 / 5) * 5, 5); // Arrondi à 5%, minimum 5%
  const maxMemory = Math.max(Math.ceil(maxMemoryValue * 1.2 / 10) * 10, 10); // Arrondi à 10MB, minimum 10MB

  // Build datasets based on filter
  const datasets = [];

  if (filter === 'all' || filter === 'cpu') {
    datasets.push({
      label: 'CPU (%)',
      data: cpuData,
      borderColor: 'rgb(59, 130, 246)', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      yAxisID: 'y',
    });
  }

  if (filter === 'all' || filter === 'memory') {
    datasets.push({
      label: 'Memory (MB)',
      data: memoryData,
      borderColor: 'rgb(16, 185, 129)', // green-500
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      yAxisID: filter === 'memory' ? 'y' : 'y1', // Use left axis when memory-only
    });
  }

  const data = { labels, datasets };

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
              if (context.dataset.label === 'CPU (%)') {
                label += context.parsed.y.toFixed(1) + '%';
              } else {
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
          text: t('metrics.time'),
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
          text: filter === 'memory' ? t('metrics.memory') : t('metrics.cpu'),
        },
        min: 0,
        max: filter === 'memory' ? maxMemory : maxCpu,
        ticks: {
          callback: function (value) {
            return filter === 'memory' ? value.toFixed(0) + ' MB' : value + '%';
          },
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      ...(filter === 'all' && {
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: t('metrics.memory'),
          },
          min: 0,
          max: maxMemory,
          ticks: {
            callback: function (value) {
              return value.toFixed(0) + ' MB';
            },
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      }),
    },
  };

  const filterButtons = [
    { key: 'all', label: t('metrics.filter.all') },
    { key: 'cpu', label: t('metrics.filter.cpu') },
    { key: 'memory', label: t('metrics.filter.memory') },
  ];

  return (
    <div>
      {/* Filter buttons and export */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={t('metrics.export')}
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
      </div>

      {/* Chart */}
      <div className="h-64 md:h-80">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default memo(MetricsChart);
