import { Search, Filter, X } from 'lucide-react';
import { useState, memo } from 'react';
import useLocaleStore from '../../stores/localeStore';

function SearchAndFilter({ onSearchChange, onFilterChange, statusFilter }) {
  const { t } = useLocaleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  const handleFilterChange = (status) => {
    onFilterChange(status);
  };

  const filterOptions = [
    { value: 'all', label: t('filter.all') },
    { value: 'online', label: t('status.online') },
    { value: 'stopped', label: t('status.stopped') },
    { value: 'errored', label: t('status.errored') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('search.placeholder')}
            className="input pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn flex items-center gap-2 ${
            statusFilter !== 'all'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
              : 'btn-secondary'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{t('filter.title')}</span>
          {statusFilter !== 'all' && (
            <span className="badge badge-online ml-1">1</span>
          )}
        </button>
      </div>

      {/* Filter options */}
      {showFilters && (
        <div className="card p-4 animate-slide-down">
          <div className="flex flex-col sm:flex-row gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              {t('filter.status')}:
            </span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SearchAndFilter);
