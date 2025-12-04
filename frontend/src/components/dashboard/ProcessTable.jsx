import { RefreshCw, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { memo } from 'react';
import ProcessRow from './ProcessRow';
import ProcessCard from './ProcessCard';
import { SkeletonProcessRow } from '../common/Skeleton';
import useLocaleStore from '../../stores/localeStore';

// Memoized sort icon component
const SortIcon = memo(({ column, sortConfig }) => {
  if (sortConfig?.key !== column) {
    return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />;
  }
  return sortConfig.direction === 'asc'
    ? <ArrowUp className="w-4 h-4" />
    : <ArrowDown className="w-4 h-4" />;
});

SortIcon.displayName = 'SortIcon';

// Memoized sortable header component
const SortableHeader = memo(({ column, children, sortConfig, onSort }) => (
  <th
    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
    onClick={() => onSort(column)}
  >
    <div className="flex items-center gap-2">
      {children}
      <SortIcon column={column} sortConfig={sortConfig} />
    </div>
  </th>
));

SortableHeader.displayName = 'SortableHeader';

function ProcessTable({ processes: filteredProcesses, isLoading: isLoadingProp, error, onRefetch, onViewLogs, sortConfig, onSort, selectedIds = [], onToggleSelect, onToggleAll }) {
  const { t } = useLocaleStore();

  const processes = filteredProcesses;
  const isLoading = isLoadingProp;

  const showCheckbox = onToggleSelect !== undefined;
  const allSelected = processes.length > 0 && processes.every(p => selectedIds.includes(p.pm_id));

  if (isLoading) {
    return (
      <>
        {/* Desktop Skeleton Table */}
        <div className="hidden md:block card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3"><div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                  <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                  <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                  <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                  <th className="px-4 py-3"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                  <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                  <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                  <th className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonProcessRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Skeleton Cards */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </>
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
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dashboard.processes')} ({processes.length})
          </h2>
          <button
            onClick={() => onRefetch()}
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
                {showCheckbox && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAll}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                    />
                  </th>
                )}
                <SortableHeader column="id" sortConfig={sortConfig} onSort={onSort}>{t('table.id')}</SortableHeader>
                <SortableHeader column="name" sortConfig={sortConfig} onSort={onSort}>{t('table.name')}</SortableHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('table.status')}
                </th>
                <SortableHeader column="uptime" sortConfig={sortConfig} onSort={onSort}>{t('table.uptime')}</SortableHeader>
                <SortableHeader column="cpu" sortConfig={sortConfig} onSort={onSort}>{t('table.cpu')}</SortableHeader>
                <SortableHeader column="memory" sortConfig={sortConfig} onSort={onSort}>{t('table.memory')}</SortableHeader>
                <SortableHeader column="restarts" sortConfig={sortConfig} onSort={onSort}>{t('table.restarts')}</SortableHeader>
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
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dashboard.processes')} ({processes.length})
          </h2>
          <button
            onClick={() => onRefetch()}
            className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
            title={t('dashboard.refresh')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        {processes.map((process) => (
          <ProcessCard
            key={process.pm_id}
            process={process}
            onViewLogs={onViewLogs}
          />
        ))}
      </div>
    </>
  );
}

export default memo(ProcessTable);
