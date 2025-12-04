import { X, RefreshCw, AlertCircle } from 'lucide-react';
import MetricsChart from './MetricsChart';
import { SkeletonChart } from '../common/Skeleton';
import { useProcessMetrics } from '../../hooks/useMetrics';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import useLocaleStore from '../../stores/localeStore';

export default function MetricsModal({ process, onClose }) {
  const { t } = useLocaleStore();
  const { data: metrics, isLoading, error } = useProcessMetrics(process.pm_id);

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
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time CPU & Memory metrics (last 2 minutes)
            </p>
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
                      <strong>Data points:</strong> {metrics.length} (collected every 2 seconds)
                      <br />
                      <strong>Time range:</strong> ~{Math.floor(metrics.length * 2 / 60)} minutes
                      <br />
                      <strong>Auto-refresh:</strong> Every 5 seconds
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
