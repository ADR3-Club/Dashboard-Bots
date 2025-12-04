import { Filter, X } from 'lucide-react';
import { useState, memo } from 'react';
import useLocaleStore from '../../stores/localeStore';
import { useProcesses } from '../../hooks/useProcesses';

function HistoryFilters({ onFilterChange, filters }) {
  const { t } = useLocaleStore();
  const { data: processes } = useProcesses();
  const [showFilters, setShowFilters] = useState(false);

  const handleProcessChange = (e) => {
    onFilterChange({ ...filters, process: e.target.value || null });
  };

  const handleRangeChange = (days) => {
    onFilterChange({ ...filters, days });
  };

  const handleTypeChange = (e) => {
    onFilterChange({ ...filters, type: e.target.value || null });
  };

  const handleClearFilters = () => {
    onFilterChange({ process: null, days: 7, type: null });
  };

  const hasFilters = filters.process || filters.type;

  const actionTypes = [
    { value: '', label: t('history.filter.typeAll') },
    { value: 'restart', label: t('history.event.restart') },
    { value: 'crash', label: t('history.event.crash') },
    { value: 'manual_stop', label: t('history.event.stop') },
    { value: 'manual_start', label: t('history.event.start') },
    { value: 'manual_delete', label: t('history.event.delete') },
  ];

  const timeRanges = [
    { days: 1, label: t('history.range.24h') },
    { days: 7, label: t('history.range.7d') },
    { days: 30, label: t('history.range.30d') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn flex items-center gap-2 ${
            hasFilters
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
              : 'btn-secondary'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{t('history.filter.title')}</span>
          {hasFilters && <span className="badge badge-online ml-1">!</span>}
        </button>

        {/* Time range buttons */}
        <div className="flex gap-2 flex-1">
          {timeRanges.map((range) => (
            <button
              key={range.days}
              onClick={() => handleRangeChange(range.days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.days === range.days
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Process filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('history.filter.process')}
              </label>
              <select
                value={filters.process || ''}
                onChange={handleProcessChange}
                className="input"
              >
                <option value="">{t('history.filter.processAll')}</option>
                {processes?.map((process) => (
                  <option key={process.pm_id} value={process.name}>
                    {process.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('history.filter.type')}
              </label>
              <select
                value={filters.type || ''}
                onChange={handleTypeChange}
                className="input"
              >
                {actionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear button */}
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                disabled={!hasFilters}
                className="btn btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('history.filter.clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(HistoryFilters);
