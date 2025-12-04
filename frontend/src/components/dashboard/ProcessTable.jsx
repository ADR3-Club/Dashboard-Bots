import { RefreshCw, AlertCircle } from 'lucide-react';
import { useProcesses } from '../../hooks/useProcesses';
import ProcessRow from './ProcessRow';
import useLocaleStore from '../../stores/localeStore';

export default function ProcessTable({ onViewLogs }) {
  const { data: processes, isLoading, error, refetch } = useProcesses();
  const { t } = useLocaleStore();

  if (isLoading) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            {t('dashboard.loading')}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8">
        <div className="flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{t('dashboard.error')}: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <div className="card p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          {t('dashboard.noProcesses')}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('dashboard.processes')} ({processes.length})
        </h2>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
          title={t('dashboard.refresh')}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.id')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.uptime')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.cpu')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.memory')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.restarts')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <ProcessRow
                key={process.pm_id}
                process={process}
                onViewLogs={onViewLogs}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
