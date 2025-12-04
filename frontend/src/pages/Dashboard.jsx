import { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import ProcessTable from '../components/dashboard/ProcessTable';
import StatsCards from '../components/dashboard/StatsCards';
import SearchAndFilter from '../components/dashboard/SearchAndFilter';
import BulkActionBar from '../components/dashboard/BulkActionBar';
import LogViewer from '../components/logs/LogViewer';
import { useProcesses, useRestartProcess, useStopProcess } from '../hooks/useProcesses';
import useLocaleStore from '../stores/localeStore';
import useToast from '../hooks/useToast';

export default function Dashboard() {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);
  const { data: processes, isLoading } = useProcesses();
  const { t } = useLocaleStore();
  const toast = useToast();
  const restartMutation = useRestartProcess();
  const stopMutation = useStopProcess();

  // Filter, search, and sort processes
  const filteredProcesses = useMemo(() => {
    if (!processes) return [];

    let result = processes.filter((process) => {
      // Search by name
      const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status
      const status = process.pm2_env.status;
      const matchesFilter =
        statusFilter === 'all' ||
        status === statusFilter;

      return matchesSearch && matchesFilter;
    });

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal, bVal;

        switch (sortConfig.key) {
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'cpu':
            aVal = a.monit?.cpu || 0;
            bVal = b.monit?.cpu || 0;
            break;
          case 'memory':
            aVal = a.monit?.memory || 0;
            bVal = b.monit?.memory || 0;
            break;
          case 'uptime':
            aVal = a.pm2_env?.pm_uptime || 0;
            bVal = b.pm2_env?.pm_uptime || 0;
            break;
          case 'restarts':
            aVal = a.pm2_env?.restart_time || 0;
            bVal = b.pm2_env?.restart_time || 0;
            break;
          case 'id':
            aVal = a.pm_id;
            bVal = b.pm_id;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [processes, searchTerm, statusFilter, sortConfig]);

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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedIds.length === filteredProcesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProcesses.map((p) => p.pm_id));
    }
  };

  const handleBulkRestart = async () => {
    try {
      await Promise.all(selectedIds.map((id) => restartMutation.mutateAsync(id)));
      toast.success(`${selectedIds.length} ${t('bulk.processes')} ${t('bulk.restart').toLowerCase()}ed`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(t('dashboard.error'));
    }
  };

  const handleBulkStop = async () => {
    try {
      await Promise.all(selectedIds.map((id) => stopMutation.mutateAsync(id)));
      toast.success(`${selectedIds.length} ${t('bulk.processes')} ${t('bulk.stop').toLowerCase()}ped`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(t('dashboard.error'));
    }
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
        <ProcessTable
          processes={filteredProcesses}
          isLoading={isLoading}
          onViewLogs={handleViewLogs}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onBulkRestart={handleBulkRestart}
        onBulkStop={handleBulkStop}
      />

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
