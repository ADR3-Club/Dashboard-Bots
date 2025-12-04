import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import HistoryStats from '../components/history/HistoryStats';
import HistoryFilters from '../components/history/HistoryFilters';
import HistoryTimeline from '../components/history/HistoryTimeline';
import useLocaleStore from '../stores/localeStore';

export default function History() {
  const { t } = useLocaleStore();
  const [filters, setFilters] = useState({
    process: null,
    days: 7,
    type: null,
  });

  // Convert days to range for stats API
  const statsRange = useMemo(() => {
    if (filters.days === 1) return '24h';
    if (filters.days === 7) return '7d';
    if (filters.days === 30) return '30d';
    return '7d';
  }, [filters.days]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('history.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('history.subtitle')}
          </p>
        </div>

        {/* Statistics Cards */}
        <HistoryStats range={statsRange} />

        {/* Filters */}
        <HistoryFilters
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* Timeline */}
        <HistoryTimeline filters={filters} />
      </div>
    </Layout>
  );
}
