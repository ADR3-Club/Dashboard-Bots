import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import ProcessTable from '../components/dashboard/ProcessTable';
import StatsCards from '../components/dashboard/StatsCards';
import SearchAndFilter from '../components/dashboard/SearchAndFilter';
import LogViewer from '../components/logs/LogViewer';
import { useProcesses } from '../hooks/useProcesses';
import useLocaleStore from '../stores/localeStore';

export default function Dashboard() {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: processes, isLoading } = useProcesses();
  const { t } = useLocaleStore();

  // Filter and search processes
  const filteredProcesses = useMemo(() => {
    if (!processes) return [];

    return processes.filter((process) => {
      // Search by name
      const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status
      const status = process.pm2_env.status;
      const matchesFilter =
        statusFilter === 'all' ||
        status === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [processes, searchTerm, statusFilter]);

  const handleViewLogs = (process) => {
    setSelectedProcess(process);
  };

  const handleCloseLogs = () => {
    setSelectedProcess(null);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Statistics Cards */}
        {!isLoading && processes && <StatsCards processes={filteredProcesses} />}

        {/* Search and Filter */}
        {!isLoading && processes && (
          <SearchAndFilter
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            statusFilter={statusFilter}
          />
        )}

        {/* Process table */}
        <ProcessTable processes={filteredProcesses} isLoading={isLoading} onViewLogs={handleViewLogs} />
      </div>

      {/* Log viewer modal */}
      {selectedProcess && (
        <LogViewer
          process={selectedProcess}
          onClose={handleCloseLogs}
        />
      )}
    </Layout>
  );
}
