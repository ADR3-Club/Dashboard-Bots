import { useState } from 'react';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import MetricsChart from './MetricsChart';
import { SkeletonChart } from '../common/Skeleton';
import { useProcessMetrics } from '../../hooks/useMetrics';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import useLocaleStore from '../../stores/localeStore';

// Format time span from metrics array
function formatDataSpan(metrics) {
  if (!metrics || metrics.length < 2) return null;
  const firstTs = metrics[0].timestamp;
  const lastTs = metrics[metrics.length - 1].timestamp;
  const spanMs = lastTs - firstTs;
  const spanSec = Math.floor(spanMs / 1000);
  const spanMin = Math.floor(spanSec / 60);
  const spanHour = Math.floor(spanMin / 60);

  if (spanHour > 0) {
    const remainingMin = spanMin % 60;
    return remainingMin > 0 ? `${spanHour}h ${remainingMin}min` : `${spanHour}h`;
  }
  if (spanMin > 0) {
    return `${spanMin}min`;
  }
  return `${spanSec}s`;
}

// Time range options in minutes
const RANGE_OPTIONS = [
  { value: 10, label: '10 min' },
  { value: 60, label: '1h' },
  { value: 360, label: '6h' },
  { value: 1440, label: '24h' },
];

export default function MetricsModal({ process, onClose }) {
  const { t } = useLocaleStore();
  const [range, setRange] = useState(60); // Default to 1 hour
  const { data: metrics, isLoading, error } = useProcessMetrics(process.pm_id, range);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'escape': onClose,
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {process.name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('metrics.timeRange')}:</span>
              <div className="flex gap-1">
                {RANGE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setRange(value)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      range === value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && <SkeletonChart />}

          {error && (
            <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>Failed to load metrics</span>
            </div>
          )}

          {!isLoading && !error && metrics && (
            <>
              {metrics.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  No metrics data available yet. Metrics will appear shortly.
                </div>
              ) : (
                <>
                  <MetricsChart metrics={metrics} processName={process.name} />

                  {/* Info */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>{t('metrics.dataPoints')}:</strong> {metrics.length} •{' '}
                      <strong>{t('metrics.autoRefresh')}:</strong> {range <= 60 ? '5s' : '30s'}
                      {formatDataSpan(metrics) && (
                        <> • <strong>{t('metrics.dataSpan')}:</strong> {formatDataSpan(metrics)}</>
                      )}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn btn-secondary">
            {t('logs.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
